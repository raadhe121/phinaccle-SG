import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useAppSelector } from '../store/store';
import CurrentQueue from '../components/queue-helper/CurrentQueue';
import UpcomingQueue from '../components/queue-helper/UpcomingQueue';
import { DOMAIN } from '@/Config';
import KeyboardView from '../common/components/KeyboardView';
import { CText, TitleText } from '../common/components/AntdText';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { readTeleconsultsApiDoctorTeleconsultTeleconsultsGet, TeleconsultResponse } from '@/services/client';
import { colors } from '@/common/utils/config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

export interface ITeleconsult {
    id: string,
    patient_type: string,
    queue_number: string;
    status: string;
    additional_status: string,
    queue_start_time: string;
    user: any;
    doctor_id?: string,
}

export default function QueueScreen() {
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const uid = useAppSelector(state => state.auth.userId);
    const qry = useQuery({
        queryKey: ['teleconsults'],
        queryFn: readTeleconsultsApiDoctorTeleconsultTeleconsultsGet,
        // staleTime: Infinity
    })

    const connTimeRef = useRef<number>(Date.now());
    const [ connected, setConnected ] = useState<boolean>(true);
    const [ disconnected, setDisconnected ] = useState(0);
    const wsRef = useRef<WebSocket>();

    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['teleconsults'] })
            queryClient.invalidateQueries({ queryKey: ['teleconsults', 'ongoing'] })
        }, [])
    );

    const connect = () => {
        connTimeRef.current = Date.now();
        const ws = new WebSocket(`${DOMAIN?.replace('https', 'wss')}/teleconsult/ws?id=${uid}`)
        ws.onopen = () => {
            console.log('WS: connected');
            setConnected(true);
            if (disconnected) queryClient.invalidateQueries({ queryKey: ['teleconsults'] });
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log('WS: message', data);
            queryClient.setQueryData(['teleconsults'], (oldData: TeleconsultResponse[]) => {
                if (data.type == 'FILTER') {
                    return oldData.filter(entity => entity.id != data.output)
                } else if (data.type == 'INSERT') {
                    return [...oldData.filter(entity => entity.id != data.output.id), data.output]
                } else if (data.type == 'UPDATE') {
                    return oldData.map(entity => entity.id === data.output.id ? data.output : entity)
                } else {
                    console.log(`Unknown type: ${data.type}`)
                }
            })
        }

        ws.onclose = (e) => {
            console.log('WS: closed. ', e.reason);
            setConnected(false);
            setDisconnected((cnt) => cnt + 1);
        }
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

    return (
        <KeyboardView
            edges={[]} 
            showLogo={true}
            title={<TitleText size={25}>Upcoming</TitleText>}
            wrapScroll={false}
            >
            { !connected && <View style={{ position: 'absolute', top: insets.top, alignSelf: 'center', zIndex: 150, backgroundColor: colors.danger, borderRadius: 10 }}>
                    <CText style={{ margin: 8, textAlign: 'center', color: 'white' }}>Realtime disconnected</CText>
                </View>}
            <View style={{ flex: 1 }}>
                <CurrentQueue />
                <UpcomingQueue query={qry} />
            </View>
        </KeyboardView>
    );
};
