import React, { useEffect, useRef, useState } from "react";
import { EmitterSubscription, Platform, View } from "react-native";
import { onError, usePermission } from "@/common/utils/lib";
import { StyleSheet } from "react-native";

import {
    EventType,
    VideoAspect,
    ZoomVideoSdkProvider,
    ZoomVideoSdkUser,
    ZoomView,
    useZoom,
} from "@zoom/react-native-videosdk";
import { router, useLocalSearchParams } from "expo-router";
import { VideoAnimatedScreen } from "@/components/VideoScreen";
import { CText, ListItem } from "@/common/components/AntdText";
import { Button } from "@ant-design/react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/common/utils/config";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VideoInfoBar from "@/components/VideoInfoBar";
import { useRealtime } from "@/providers/realtime";
import { ApiError, getVideoTokenApiTeleconsultV2VideoPost } from "@/services/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/common/utils/modal";
import RNCallKeep from 'react-native-callkeep';
import { CONSTANTS as CK_CONSTANTS } from 'react-native-callkeep';

type CallkeepCall = {
    callUUID: string,
    hasConnected: boolean,
    hasEnded: boolean,
    onHold: boolean,
    outgoing: boolean
}

export default function ZoomProviderScreen() {
    const [ startZoom, setStartZoom ] = useState(false);

    // This effect is when the app is in the background, the incoming call answered, before Zoom starts
    useEffect(() => {
        // Android does not support CallKit, so we can start Zoom immediately
        if (Platform.OS === 'android') {
            setStartZoom(true)
            return;
        }

        // If there is an incoming call, we need to wait for it to be answered before starting Zoom
        const timerId = setInterval(() => {
            const checkCalls = async () => {
                const calls: CallkeepCall[] = await RNCallKeep.getCalls() || []
                const isIncomingCallAccepted = calls.some((call) => call.outgoing === false && call.hasConnected === true)

                // ringing notification accepted, end call and start Zoom
                if (isIncomingCallAccepted) {
                    RNCallKeep.endCall(calls[0].callUUID)
                }

                // No active calls, start Zoom
                if (calls.length == 0 || isIncomingCallAccepted) {
                    setStartZoom(true)
                    clearInterval(timerId)
                }
            }
            checkCalls()
        }, 1000);
        return () => clearInterval(timerId);
    }, []); 

    // This works when app is in background waiting for notification but in foreground unable to end as it leads to race condition
    if (!startZoom) {
        return <View style={styles.container}>
            <CText style={{ textAlign: 'center' }}>Accept the call to start the teleconsultation</CText>
        </View>
    }

    return <ZoomVideoSdkProvider config={{ domain: "zoom.us", enableLog: true, enableCallKit: false }}>
        <ZoomScreen />
    </ZoomVideoSdkProvider>
}

export const ZoomScreen = () => {
    usePermission();

    const { activity } = useRealtime();
    const { id } = useLocalSearchParams();
    const zoom = useZoom();
    const insets = useSafeAreaInsets();
    const listeners = useRef<EmitterSubscription[]>([]);
    const [users, setUsersInSession] = useState<ZoomVideoSdkUser[]>([]);
    const [isInSession, setIsInSession] = useState(false);

    const toastRef = useRef<() => void>();
    const joinVideoMutation = useMutation({
        mutationFn: getVideoTokenApiTeleconsultV2VideoPost,
        onMutate: () => {
            toastRef.current = toast.loading();
        },
        onSuccess: async (zoomConfig) => {
            const close = () => { 
                if (toastRef.current) toastRef.current();
            }

            const sessionJoin = zoom.addListener(EventType.onSessionJoin, async () => {
                const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
                const remoteUsers = await zoom.session.getRemoteUsers();
                setUsersInSession([mySelf, ...remoteUsers]);
                setIsInSession(true);
                close();

                // Incoming calls leave the OS audio route (CallKit on iOS, ringtone
                // stream on Android) in a state that isn't loudspeaker, so the callee
                // can't hear anything until the call is re-joined. Force it explicitly.
                try {
                    await zoom.audioHelper.setSpeaker(true);
                } catch (e) {
                    console.warn('Failed to force speaker audio route', e);
                }
            });
            listeners.current.push(sessionJoin);

            const userJoin = zoom.addListener(EventType.onUserJoin, async (event) => {
                const { remoteUsers } = event;
                const mySelf = await zoom.session.getMySelf();
                const remote = remoteUsers.map((user) => new ZoomVideoSdkUser(user));
                setUsersInSession([mySelf, ...remote]);
            });
            listeners.current.push(userJoin);

            const userLeave = zoom.addListener(EventType.onUserLeave, async (event) => {
                const { remoteUsers } = event;
                // const mySelf = await zoom.session.getMySelf();

                const usersLeft = remoteUsers.map((user) => user.userId);
                // console.log("Left Users: ", event);
                // Doesn't work for Android as the event returns an empty array
                setUsersInSession((users) => users.filter((user) => !usersLeft.includes(user.userId)));
            });
            listeners.current.push(userLeave);

            // const userVideo = zoom.addListener(EventType.onUserVideoStatusChanged, async (event) => {
            //     console.log("Video Changed")
            //     const { changedUsers } = event;
            //     const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
            //     changedUsers.find((user) => user.userId === mySelf.userId) &&
            //         mySelf.videoStatus.isOn().then((on) => setIsVideoMuted(!on));
            // });
            // listeners.current.push(userVideo);

            // const userAudio = zoom.addListener(EventType.onUserAudioStatusChanged, async (event) => {
            //     const { changedUsers } = event;
            //     const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
            //     changedUsers.find((user) => user.userId === mySelf.userId) &&
            //         mySelf.audioStatus.isMuted().then((muted) => setIsAudioMuted(muted));
            // });
            // listeners.current.push(userAudio);

            const sessionLeave = zoom.addListener(EventType.onSessionLeave, () => {
                setIsInSession(false);
                setUsersInSession([]);
                sessionLeave.remove();
            });

            try {
                // On iOS, we just tore down the CallKit call (see ZoomProviderScreen)
                // that owned the AVAudioSession. Zoom joins with enableCallKit: false,
                // so it sets up its own session independently - reset it first so it
                // doesn't inherit a half-deactivated CallKit audio session.
                if (Platform.OS === 'ios') {
                    await zoom.audioHelper.resetAudioSession();
                }
                await zoom.joinSession(zoomConfig);
            } catch (e) {
                close();
                console.error(e);
            }
        },
        onError: (error: ApiError) => {
            // Close the loading toast
            if (toastRef.current) toastRef.current();
            onError(error);
        }
    })

    // When the doctor sets the session to consult end, it will automatically leave the session
    useEffect(() => {
        if (activity?.tag === 'Consult End') {
            router.back();
        }
    }, [activity])

    useEffect(() => {
        joinVideoMutation.mutate({
            requestBody: { id: id!.toString()}
        })
    }, []);


    // This effect is when the app is in the foreground, the incoming call should not be answered, before Zoom starts
    useEffect(() => {
        if (Platform.OS !== 'ios') return;
        // When app is open or Zoom is loaded, to report the incoming call as answered
        RNCallKeep.addEventListener('didDisplayIncomingCall', ({ error, callUUID, handle, localizedCallerName, hasVideo, fromPushKit, payload }) => {
            RNCallKeep.reportEndCallWithUUID(callUUID, CK_CONSTANTS.END_CALL_REASONS.ANSWERED_ELSEWHERE);
        });

        return () => RNCallKeep.removeEventListener('didDisplayIncomingCall');
    }, []);

    const leaveSession = () => {
        zoom.leaveSession(false);
        setIsInSession(false);
        listeners.current.forEach((listener) => listener.remove());
        listeners.current = [];
    };

    useEffect(() => {
        return () => leaveSession();
    }, [])

    if (!isInSession) {
        return <View style={styles.container}></View>
    }
    const fullScreen = users.length > 1
        ? <ZoomView
            style={styles.container}
            userId={users.length > 1 ? users[1].userId : users[0].userId} // If doctor not in yet, the fullscreen will be the user
            fullScreen
            videoAspect={VideoAspect.PanAndScan}
        />
        : null;
    const miniScreen = <ZoomView
        style={{ ...styles.container, borderRadius: 12 }}
        userId={users[0].userId}
        videoAspect={VideoAspect.PanAndScan}
    />

    const controls = (
        <>
            <VideoInfoBar elapsedTime={joinVideoMutation.data?.elapsed_time || 0} warningConfig={joinVideoMutation.data?.warning_config} clinicInfo={joinVideoMutation.data?.clinic_info} />
            <ListItem styles={{ Item: { backgroundColor: '#0000008C' } }} divider={false} >
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', margin: 12, marginBottom: 12 + insets.bottom }}>
                    <Button
                        type="primary"
                        style={{ backgroundColor: colors.primary, borderWidth: 0, borderRadius: 30, height: 60, width: 60 }}
                        onPress={() => zoom.videoHelper.switchCamera()}
                    >
                        <Ionicons name="camera-reverse-outline" size={24} color="white" />
                    </Button>
                    <Button
                        type="primary"
                        activeStyle={{ backgroundColor: 'pink' }}
                        style={{ backgroundColor: 'red', borderWidth: 0, borderRadius: 30, height: 60, width: 60 }}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="call" size={24} color="white" />
                    </Button>
                </View>
            </ListItem>
        </>
    );

    return (
        <VideoAnimatedScreen
            fullScreen={fullScreen}
            miniScreen={miniScreen}
            controls={controls}
        />
    )
};

export const styles = StyleSheet.create({
    safe: {
        width: '100%',
        alignSelf: 'center',
        margin: 16,
        flex: 1,
        justifyContent: 'center',
    },
    container: {
        width: '100%',
        alignSelf: 'center',
        height: '100%',
        flex: 1,
        justifyContent: 'center',
    },
    spacer: {
        height: 16,
        width: 8,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 4,
        elevation: 3,
    },
    buttonHolder: {
        flexDirection: "row",
        justifyContent: "center",
        margin: 8
    },
    text: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: 'bold',
        letterSpacing: 0.25,
        color: 'white',
    },
});
