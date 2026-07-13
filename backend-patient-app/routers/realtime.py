import asyncio
from datetime import date
from enum import Enum
import json
import logging
from typing import Callable, Optional
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from config import REDIS_HOST, REDIS_PORT
from models.model_enums import VisitType
from routers.admin.teleconsult import TeleconsultAdminResp
from broadcaster import Broadcast

from routers.admin.walkin import WalkinAdminResp
from utils.sg_datetime import sg

BROADCASTER_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}'
BROADCASTER_CHANNEL = 'realtime'

logging.warning(f"REDIS_INIT: Initializing broadcaster with host={REDIS_HOST} port={REDIS_PORT}")

class WSEvent(Enum):
    PATIENT_ACTIVITY_UPDATE = "patient_activity_update" # Require id
    PATIENT_ACTIVITY_UPDATE_ALL = "patient_activity_update_all" # Update all patients for walkin queue number update
    DOCTOR_TELECONSULT_UPDATE_ALL = "doctor_teleconsult_update_all" # Update all doctors for teleconsult queue number update
    ADMIN_TELECONSULT_UPDATE_ALL = "admin_teleconsult_update_all" # Update all admins for teleconsult queue number update
    ADMIN_WALKIN_UPDATE_ALL = "admin_walkin_update_all" # Update all admins for walkin queue number update

class WSMessage(BaseModel):
    id: Optional[str] = None
    event: WSEvent
    data: dict = {}

class ConnectionManager:
    broadcaster = Broadcast(BROADCASTER_URL)
    logging.warning(f"REDIS_INIT: Broadcast client object created for host={REDIS_HOST} port={REDIS_PORT}")

    def __init__(self):
        self.activity_connections: dict[str, WebSocket] = {}
        self.doctor_connections: dict[WebSocket, dict] = {}
        self.admin_connections: dict[WebSocket, dict] = {}
        # Strong reference to the supervised subscriber task. asyncio only keeps a
        # weak reference to tasks, so without this the listener could be garbage
        # collected mid-execution.
        self._listener_task: Optional[asyncio.Task] = None
        # Serializes broadcaster reconnects so the publish path and the subscriber
        # supervisor don't tear the connection down on top of each other.
        self._reconnect_lock = asyncio.Lock()

    async def listen(self):
        # Start the subscriber as a long-lived, self-healing background task.
        if self._listener_task and not self._listener_task.done():
            return
        self._listener_task = asyncio.create_task(self._supervise_subscription())

    async def stop_listening(self):
        if self._listener_task and not self._listener_task.done():
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass
        self._listener_task = None

    async def _supervise_subscription(self):
        '''
        Keep a Redis subscription alive forever. The subscribe loop ends whenever
        the Redis connection drops (idle disconnect, restart, network blip); on its
        own it would never come back, silently killing all realtime delivery. This
        supervisor re-establishes the connection and re-subscribes with backoff.
        '''
        import time
        backoff = 1
        MAX_BACKOFF = 30
        while True:
            started = time.time()
            try:
                await self.listen_to_channel(room_id=BROADCASTER_CHANNEL)
            except asyncio.CancelledError:
                logging.warning("REDIS_SUBSCRIBER: supervisor cancelled; stopping.")
                raise
            except Exception as e:
                logging.error(f"REDIS_SUBSCRIBER: listen loop crashed: {e}")
            else:
                logging.error("REDIS_SUBSCRIBER: listen loop returned (connection dropped).")

            # Reset backoff if the subscription stayed healthy for a while.
            if time.time() - started > 60:
                backoff = 1

            await self._reconnect_broadcaster()
            logging.warning(f"REDIS_SUBSCRIBER: re-subscribing in {backoff}s")
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, MAX_BACKOFF)

    async def _reconnect_broadcaster(self):
        '''
        Re-establish the shared broadcaster connection so a Redis restart / internal
        IP change is picked up. broadcaster caches its connection on connect() and
        does not re-resolve on its own.

        MUST only be called from _supervise_subscription(), i.e. AFTER
        listen_to_channel() has returned and the `async with broadcaster.subscribe(...)`
        block has exited (which issues UNSUBSCRIBE and drops the subscriber queue).
        disconnect() here cancels the backend pubsub listener and the Broadcast queue
        pump, so calling it while a subscriber is live inside subscribe() would
        permanently kill realtime delivery without re-subscribing. Do NOT call from
        the publish path.
        '''
        async with self._reconnect_lock:
            try:
                await self.broadcaster.disconnect()
            except Exception as e:
                logging.warning(f"REDIS_RECONNECT: disconnect failed (ignored): {e}")
            try:
                await self.broadcaster.connect()
                logging.warning("REDIS_RECONNECT: broadcaster reconnected.")
            except Exception as e:
                logging.error(f"REDIS_RECONNECT: connect failed: {e}")

    async def send_patient_update(self, id: str):
        ws = self.activity_connections.get(id)
        if ws is None:
            logging.warning(f"WS_PATIENT_UPDATE_SKIPPED: No active WS connection for account_id={id}. Update was not delivered (patient app likely not connected/foregrounded).")
            return

        try:
            await ws.send_text("update")
            logging.info(f"WS_PATIENT_UPDATE_SENT: account_id={id}")
        except (WebSocketDisconnect, RuntimeError) as e:
            logging.warning(f"WS_PATIENT_UPDATE_FAILED: account_id={id} error={e}. Disconnecting stale connection.")
            self.disconnect_patient_activity(id, ws)

    async def send_doctor_update(self, ws: WebSocket, data: dict):
        try:
            await ws.send_json(data)
        except (WebSocketDisconnect, RuntimeError):
            self.disconnect_doctor(ws)

    async def send_update(self, ws: WebSocket, data: dict, disconnect_func: Callable):
        try:
            await ws.send_json(data)
        except (WebSocketDisconnect, RuntimeError):
            disconnect_func(ws)

    async def push_to_channel(self, message: WSMessage):
        import time
        start = time.time()
        max_attempts = 3
        PUBLISH_TIMEOUT = 5  # seconds; never let a stale connection hang the publish
        last_error = None
        for attempt in range(1, max_attempts + 1):
            try:
                await asyncio.wait_for(
                    self.broadcaster.publish(channel=BROADCASTER_CHANNEL, message=message.model_dump_json()),
                    timeout=PUBLISH_TIMEOUT,
                )
                logging.info(f"REDIS_PUBLISH_OK: event={message.event} id={message.id} attempt={attempt} took={time.time()-start:.2f}s")
                return
            except Exception as e:
                last_error = e
                logging.error(f"REDIS_PUBLISH_ATTEMPT_FAILED: event={message.event} id={message.id} attempt={attempt}/{max_attempts} took={time.time()-start:.2f}s error={e}")
                if attempt < max_attempts:
                    # Deliberately do NOT reconnect the broadcaster here. publish and
                    # subscribe share a single Broadcast()/RedisBackend instance, and
                    # broadcaster.disconnect() tears down the pubsub connection, cancels
                    # the backend _pubsub_listener and the Broadcast._listener task, and
                    # loses redis-py's channel-subscription state. The live subscriber is
                    # parked inside `async with broadcaster.subscribe(...)` blocked on an
                    # asyncio.Queue.get(); a reconnect from the publish path silently and
                    # permanently kills it (the subscribe context never re-issues
                    # SUBSCRIBE, so no events ever arrive again, and listen_to_channel
                    # never returns so the supervisor while-loop never re-enters).
                    # Connection lifecycle is owned solely by _supervise_subscription().
                    # Here we just back off and retry; the publish connection (_conn) is
                    # the command connection and redis-py reconnects it on the next call.
                    await asyncio.sleep(0.3)
        logging.error(f"REDIS_PUBLISH_FAILED: event={message.event} id={message.id} gave up after {max_attempts} attempts took={time.time()-start:.2f}s error={last_error}")
        raise last_error

    async def listen_to_channel(self, room_id: str):
        try:
            async with self.broadcaster.subscribe(channel=room_id) as subscriber:
                logging.warning(f"REDIS_SUBSCRIBER: Subscribed to channel '{room_id}'.")
                async for event in subscriber: # type: ignore
                    msg = WSMessage.model_validate_json(event.message)
                    logging.info(f"Received WS event: event={msg.event} id={msg.id}")
                    # Handle Patient Activity Update
                    if msg.id and msg.event == WSEvent.PATIENT_ACTIVITY_UPDATE:
                        await self.send_patient_update(msg.id)
                    elif msg.event == WSEvent.PATIENT_ACTIVITY_UPDATE_ALL:
                        for id in list(self.activity_connections.keys()):
                            await self.send_patient_update(id)
                    elif msg.event == WSEvent.DOCTOR_TELECONSULT_UPDATE_ALL:
                        for ws in list(self.doctor_connections.keys()):
                            await self.send_doctor_update(ws, msg.data)
                    elif msg.event == WSEvent.ADMIN_TELECONSULT_UPDATE_ALL:
                        resp = TeleconsultAdminResp.model_validate(msg.data)
                        for ws, metadata in list(self.admin_connections.items()):
                            if metadata["type"] != VisitType.TELECONSULT:
                                continue
                            data = {} if sg(resp.checkin_time).date() != metadata["date"] else json.loads(resp.model_dump_json())
                            await self.send_update(ws, data, self.disconnect_admin)
                    elif msg.event == WSEvent.ADMIN_WALKIN_UPDATE_ALL:
                        resp = WalkinAdminResp.model_validate(msg.data)
                        for ws, metadata in list(self.admin_connections.items()):
                            if metadata["type"] != VisitType.WALKIN:
                                continue
                            data = {} if sg(resp.created_at).date() != metadata["date"] else json.loads(resp.model_dump_json())
                            await self.send_update(ws, data, self.disconnect_admin)
                    else:
                        logging.error(f"Unknown event: {event.message}")
            logging.error(f"REDIS_SUBSCRIBER: Subscription loop on channel '{room_id}' exited unexpectedly (connection likely dropped).")
        except Exception as e:
            logging.error(f"REDIS_SUBSCRIBER: Subscription to channel '{room_id}' failed/disconnected: {e}")

    async def connect_patient_activity(self, id: str, ws: WebSocket):
        await ws.accept()
        self.activity_connections[id] = ws

    def disconnect_patient_activity(self, id: str, ws: Optional[WebSocket] = None):
        # Only evict if the stored socket is the one being torn down. Patient
        # connections are keyed by account id, so a quick reconnect overwrites
        # activity_connections[id] with the new socket; without this guard the old
        # socket's delayed teardown would delete the new (live) entry and silently
        # make the patient unreachable for all future updates.
        current = self.activity_connections.get(id)
        if current is None:
            logging.warning(f"WS Patient Connection not found. User ID: {id}")
            return
        if ws is not None and current is not ws:
            logging.info(f"WS_PATIENT_DISCONNECT_SKIPPED: stale socket for account_id={id}; keeping newer connection.")
            return
        del self.activity_connections[id]

    async def connect_doctor(self, ws: WebSocket, id: str):
        await ws.accept()
        self.doctor_connections[ws] = { "id": id }

    def disconnect_doctor(self, ws: WebSocket):
        try:
            del self.doctor_connections[ws]
        except Exception:
            logging.warning("WS Doctor Connection not found.")

    async def connect_admin(self, ws: WebSocket, id: str, date: date, type: VisitType):
        await ws.accept()
        self.admin_connections[ws] = {
            "id": id,
            "date": date,
            "type": type
        }

    def disconnect_admin(self, ws: WebSocket):
        try:
            del self.admin_connections[ws]
        except Exception:
            logging.warning("WS Admin Connection not found.")

ws_manager = ConnectionManager()
