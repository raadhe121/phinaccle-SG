import { modal } from "@/common/utils/modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import auth from '@react-native-firebase/auth';
import { ActivityDetail, getActivityApiActivityGet } from "@/services/client";
import NetInfo from "@react-native-community/netinfo";
import { apiUrl } from "@/Config";

// Handle 2 core functions
// 1. SSE (Server Sent Events) for real-time updates

type RealtimeContextProps = {
    activity?: ActivityDetail | null;
    connected: boolean;
}

export const RealtimeContext = React.createContext<RealtimeContextProps>({
    connected: true,
    // refreshActivities: () => null,
});

// This hook can be used to access the user info.
export function useRealtime() {
    const value = React.useContext(RealtimeContext);
    if (process.env.NODE_ENV !== 'production' && !value) {
        throw new Error('useSession must be wrapped in a <SessionProvider />');
    }

    return value;
}

const useNetworkState = () => {
    // Handle Network State
    const [ isOnline, setIsOnline ] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(state.isConnected ?? true);
        });

        return () => unsubscribe();
      }, []);

    return { isOnline };
}

const useReactQuerySubscription = () => {
    const queryClient = useQueryClient()
    const wsRef = useRef<WebSocket>();
    const connTimeRef = useRef<number>(Date.now());
    const [ connected, setConnected ] = useState(true);
    const [ disconnected, setDisconnected ] = useState(0);

    const connect = () => {
        // Do not connect when user is logged out
        if (!auth().currentUser?.uid) {
            console.log("User is logged out.")
            return;
        }

        connTimeRef.current = Date.now();
        const ws = new WebSocket(`${apiUrl?.replace('https', 'wss')}/api/activity/ws?id=${auth().currentUser?.uid}`)
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WS: connected')
            setConnected(true);
            queryClient.invalidateQueries({ queryKey: ['activity'] })
            queryClient.invalidateQueries({ queryKey: ['walkin'] })
        }

        ws.onmessage = (event) => {
            console.log('WS: message received', event.data);
            queryClient.invalidateQueries({ queryKey: ['activity'] })   
            queryClient.invalidateQueries({ queryKey: ['walkin'] })         
        }

        ws.onclose = function(e) {
            console.log("WS: closed. ", e.reason);
            setConnected(false);
            setDisconnected((cnt) => cnt + 1);
        };
        
        ws.onerror = (err) => {
            console.error('WS: error. ', err);
            ws.close();
        };
    }

    // This connects, and disconnects when unmounted
    useEffect(() => {
        connect();
        return () => {
            console.log("Disconnecting from Use Effect")
            wsRef.current?.close();
        }
    }, [queryClient])
    
    // This only called the reconnect if the component is still mounted
    useEffect(() => {
        if (disconnected) {
            const waitTime = (Date.now() - connTimeRef.current) > 3000 ? 0 : 3000;
            console.log(`Socket is closed. Reconnect will be attempted in ${waitTime / 1000} seconds.`);
            setTimeout(connect, waitTime);
        }
    }, [disconnected])

    return { connected };
}

export function RealtimeProvider(props: React.PropsWithChildren) {
    const queryClient = useQueryClient();
    const { isOnline } = useNetworkState();
    const { connected } = useReactQuerySubscription();
    const qry = useQuery({
        queryKey: ['activity'],
        queryFn: getActivityApiActivityGet
    })
    const teleconsultZoomStarted = useRef<string>();
    const [camPerm, camReqPerm] = useCameraPermissions();
    const [micPerm, micReqPerm] = useMicrophonePermissions();

    useEffect(() => {
        if (!qry.data?.activity) return;
        const activity = qry.data.activity;
        queryClient.invalidateQueries({ queryKey: [activity.type] })
        if (activity.type === 'teleconsult' && activity.tag === 'Consult Start' && activity.id !== teleconsultZoomStarted.current) {
            teleconsultZoomStarted.current = activity.id;

            const startZoom = async () => {
                const camResult = await camReqPerm()
                const micResult = await micReqPerm()
                if (camResult.granted && micResult.granted) {
                    router.push({ pathname: '/teleconsult/zoom', params: { id: activity.id }})
                } else {
                    modal.error({
                        title: "Unable to access microphone and camera",
                        content: 'Allow Pinnacle App to access your camera and microphone from device menu under "Settings"',
                        labels: ["Open Settings", ""],
                        onCancel: async () => await Linking.openSettings()
                    })
                }
            }
            startZoom();
        }
    }, [qry]);

    return (
        <RealtimeContext.Provider
            value={{
                activity: qry.data?.activity,
                connected: connected && isOnline,
            }}>
            {props.children}
        </RealtimeContext.Provider>
    );
}