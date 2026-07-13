import json
import socket
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from config import CRON_API_KEY
from models import get_db, active_db_conn
from models.pinnacle import Content
from utils.fastapi import SuccessResp

router = APIRouter()

# Gate the standing diagnostic endpoint behind an existing operational secret.
# HTTPBearer() returns 403 when the Authorization header is missing/malformed;
# the explicit check returns 403 on a wrong token value.
auth_scheme = HTTPBearer()
def validate_debug_token(token: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    if token.credentials != CRON_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid token")

@router.get('/health', response_model=SuccessResp)
def health_check(db = Depends(get_db)):
    print("Health Check")
    record = db.query(Content).first()
    return SuccessResp(success=True)

@router.get('/db_conn')
def db_conns():
    return active_db_conn

@router.get('/realtime_debug')
def realtime_debug(publish: bool = False, _auth = Depends(validate_debug_token)):
    '''
    Observability for the realtime pub/sub pipeline.

    - ws_connections: live WS connections held by THIS instance (load-balanced, so
      hitting it repeatedly samples different instances).
    - listener_task: state of the supervised Redis subscriber task on this instance.
    - pubsub_numsub / pubsub_channels: SERVER-WIDE view from the shared Redis, so it
      reports subscribers across ALL instances regardless of which one served this
      request. NUMSUB 'realtime' == 0 means the broadcaster subscribers are not
      actually registered on Redis (subscribe path broken); >0 means they are and the
      bug is in message routing.
    - ?publish=1 publishes one safe, valid WSMessage and returns the receiver count
      (decisive: 0 == no live subscribers on this Redis).
    No PII is returned (connection counts only, not account ids).
    '''
    from config import redis_client
    from routers.realtime import ws_manager, BROADCASTER_CHANNEL

    info = {
        "instance": socket.gethostname(),
        "ws_connections": {
            "activity": len(ws_manager.activity_connections),
            "admin": len(ws_manager.admin_connections),
            "doctor": len(ws_manager.doctor_connections),
        },
    }
    task = getattr(ws_manager, "_listener_task", None)
    info["listener_task"] = None if task is None else ("done" if task.done() else "running")

    try:
        info["pubsub_numsub"] = redis_client.pubsub_numsub(BROADCASTER_CHANNEL)
        info["pubsub_channels"] = redis_client.pubsub_channels()
        info["connected_clients"] = redis_client.info("clients").get("connected_clients")
    except Exception as e:
        info["pubsub_error"] = repr(e)

    if publish:
        try:
            msg = json.dumps({"id": "debug-endpoint", "event": "patient_activity_update", "data": {}})
            info["test_publish_receivers"] = redis_client.publish(BROADCASTER_CHANNEL, msg)
        except Exception as e:
            info["test_publish_error"] = repr(e)

    return info
