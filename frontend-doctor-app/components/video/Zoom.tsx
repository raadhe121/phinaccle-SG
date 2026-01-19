import { useEffect, useRef, useState } from "react";
import { EmitterSubscription, StyleSheet, View } from "react-native";
import { usePermission } from "./lib";
import {
    EventType,
    VideoAspect,
    ZoomVideoSdkUser,
    ZoomView,
    useZoom,
} from "@zoom/react-native-videosdk";
import { Button } from "@ant-design/react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VideoScreen from "./VideoScreen";
import { toast } from "../../common/utils/modal";
import { BoldText, ListItem } from "../../common/components/AntdText";
import { colors } from "../../common/utils/config";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/AppNavigator";
import dayjs from 'dayjs';
import { useMutation } from "@tanstack/react-query";
import { getElapsedTimeApiDoctorTeleconsultElapsedTimeIdGet } from "@/services/client";

type Props = NativeStackScreenProps<RootStackParamList, 'ZoomScreen'>;
export default function ZoomScreen({ route, navigation }: Props) {
    usePermission();
    const { zoomConfig } = route.params;
    const zoom = useZoom();
    const insets = useSafeAreaInsets();
    const listeners = useRef<EmitterSubscription[]>([]);
    const [users, setUsersInSession] = useState<ZoomVideoSdkUser[]>([]);
    const [isInSession, setIsInSession] = useState(false);
    const [ timer, setTimer ] = useState<number>(0);

    // Add this mutation for fetching elapsed time
    const getElapsedTimeMutation = useMutation({
        mutationFn: getElapsedTimeApiDoctorTeleconsultElapsedTimeIdGet, // This will be the generated function name
        onSuccess: (data) => {
            if (data.elapsed_time) {
                setTimer(data.elapsed_time); // Reset timer to server-provided time
            }
        },
        onError: (error) => {
            toast.fail("Failed to fetch elapsed time from server")
        }
    });

    useEffect(() => {
        if (!isInSession) return;

        const timerId = setInterval(() => {
            setTimer((prev: number) => prev + 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [isInSession]);


    useEffect(() => {
        const close = toast.loading();

        const join = async () => {
            const sessionJoin = zoom.addListener(EventType.onSessionJoin, async () => {
                const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
                const remoteUsers = await zoom.session.getRemoteUsers();
                setUsersInSession([mySelf, ...remoteUsers]);
                setIsInSession(true);
                close();
            });
            listeners.current.push(sessionJoin);

            const userJoin = zoom.addListener(EventType.onUserJoin, async (event) => {
                const { remoteUsers } = event;
                const mySelf = await zoom.session.getMySelf();
                const remote = remoteUsers.map((user: any) => new ZoomVideoSdkUser(user));
                setUsersInSession([mySelf, ...remote]);

                // If this is the first time a patient joins (remote.length > 0)
                if (remote.length > 0) {
                    getElapsedTimeMutation.mutate({ id: zoomConfig.sessionName });
                }
            });
            listeners.current.push(userJoin);

            const userLeave = zoom.addListener(EventType.onUserLeave, async (event) => {
                const { remoteUsers } = event;
                // const mySelf = await zoom.session.getMySelf();

                const usersLeft = remoteUsers.map((user: any) => user.userId);
                console.log("Left Users: ", event);
                // Doesn't work for Android as the event returns an empty array
                setUsersInSession((users) => users.filter((user) => !usersLeft.includes(user.userId)));
            });
            listeners.current.push(userLeave);

            // const userVideo = zoom.addListener(EventType.onUserVideoStatusChanged, async (event) => {
            //   console.log("Video Changed")
            //   const { changedUsers } = event;
            //   const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
            //   changedUsers.find((user: any) => user.userId === mySelf.userId) &&
            //     mySelf.videoStatus.isOn().then((on) => setIsVideoMuted(!on));
            // });
            // listeners.current.push(userVideo);

            // const userAudio = zoom.addListener(EventType.onUserAudioStatusChanged, async (event) => {
            //   const { changedUsers } = event;
            //   const mySelf = new ZoomVideoSdkUser(await zoom.session.getMySelf());
            //   changedUsers.find((user: any) => user.userId === mySelf.userId) &&
            //     mySelf.audioStatus.isMuted().then((muted) => setIsAudioMuted(muted));
            // });
            // listeners.current.push(userAudio);

            const sessionLeave = zoom.addListener(EventType.onSessionLeave, () => {
                setIsInSession(false);
                setUsersInSession([]);
                sessionLeave.remove();
            });

            try {
                await zoom.joinSession(zoomConfig as any);
            } catch (e) {
                close();
                console.error(e);
            }
        };
        join();

    }, []);


    const leaveSession = () => {
        console.log("Leaving Zoom")
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
            <View style={{ height: 12 }} />
            <ListItem styles={{ Item: { backgroundColor: '#0000008C' } }} divider={false} >
                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly'}}>
                    <BoldText style={{ color: 'white'}}>{dayjs().startOf('day').second(timer).format('mm:ss')}</BoldText>
                </View>
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
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="call" size={24} color="white" />
                    </Button>
                </View>
            </ListItem>
        </>
    );

    return (
        <VideoScreen
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