import { useEffect } from "react";
import { Linking, PermissionsAndroid, Platform } from "react-native";
import { EventType, ZoomVideoSdkUserType } from "@zoom/react-native-videosdk";
import { ZoomVideoSdkContext } from "@zoom/react-native-videosdk/lib/typescript/Context";
import { EmitterSubscription } from "react-native";
// import { styles } from "./styles";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import { ApiError } from "@/services/client";
import { modal, toast } from "./modal";
import { antd, colors } from "./config";
import Markdown from "react-native-markdown-display";
dayjs.extend(utc)

export const formatDateTime = (dateStr: string) => dayjs(dateStr.length === 26 ? `${dateStr}Z` : dateStr).local().format('D MMM YYYY, hh:mma');

// Used across all React Query Mutation functions
export const onError = (error: ApiError) => {
    // Axios timeouts (see OpenAPI.interceptors.request in common/utils/config.ts) never reach
    // the server, so they surface as a raw AxiosError with no `.body`, not an ApiError.
    if ((error as unknown as { code?: string })?.code === 'ECONNABORTED') {
        toast.fail('Request timed out. Please check your connection and try again.');
        return;
    }
    if (error.body?.hasOwnProperty('message') && error.body?.hasOwnProperty('title')) {
        const msg: { title: string, message: string } = error.body as any;
        const mkStyles = { 
            body: { ...antd.defaultText, fontSize: 14, textAlign: 'center', color: colors.text },
            strong: antd.boldText,
        }
        modal.warn({
            title: msg.title,
            // Disable validation check for textAlign error message
            content: <Markdown style={mkStyles as any}>{msg.message}</Markdown>,
            labels: ["Ok"],
            onCancel: () => {},
        })

    } else {
        const errorMsg = (error.body as { detail?: string })?.detail ?? error.message;
        // Fallback if JSON cannot decode properly
        toast.fail(JSON.stringify(errorMsg))
    }
}

export async function requestCameraAndAudioPermission() {
    try {
        const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
            granted["android.permission.RECORD_AUDIO"] === PermissionsAndroid.RESULTS.GRANTED &&
            granted["android.permission.CAMERA"] === PermissionsAndroid.RESULTS.GRANTED
        ) {
            console.log("You can use the cameras & mic");
        } else {
            console.log("Permission denied");
        }
    } catch (err) {
        console.warn(err);
    }
}

export const usePermission = () => {
    useEffect(() => {
        if (Platform.OS === "android") {
            requestCameraAndAudioPermission();
        }
    }, []);
};

// export default function Button(props: { onPress: () => void; title: string; color?: ColorValue }) {
//   const { onPress, title, color = "#0e71eb" } = props;
//   return (
//     <TouchableOpacity style={{ ...styles.button, backgroundColor: color }} onPress={onPress}>
//       <Text style={styles.text}>{title}</Text>
//     </TouchableOpacity>
//   );
// }

declare module "@zoom/react-native-videosdk" {
    export function useZoom(): Omit<ZoomVideoSdkContext, "addListener"> & CustomEvents;
    export function getRemoteUsers(): Promise<ZoomVideoSdkUserType[]>;
    export interface CustomEvents {
        addListener(
            event: EventType.onSessionJoin,
            handler: (event: { mySelf: userFromEvent }) => void
        ): EmitterSubscription;
        addListener(
            event: EventType.onUserJoin,
            handler: (event: { joinedUsers: userFromEvent[]; remoteUsers: userFromEvent[] }) => void
        ): EmitterSubscription;
        addListener(
            event: EventType.onUserLeave,
            handler: (event: { leftUsers: userFromEvent[]; remoteUsers: userFromEvent[] }) => void
        ): EmitterSubscription;
        addListener(
            event: EventType.onUserAudioStatusChanged,
            handler: (event: { changedUsers: userFromEvent[] }) => void
        ): EmitterSubscription;
        addListener(
            event: EventType.onUserVideoStatusChanged,
            handler: (event: { changedUsers: userFromEvent[] }) => void
        ): EmitterSubscription;
        addListener(event: EventType, handler: (data?: any) => void): EmitterSubscription;
    }
}

type userFromEvent = ZoomVideoSdkUserType; // this type isn't correct i think, missing methods
// type userFromEvent = {
//   customUserId: string;
//   isHost: boolean;
//   isManager: boolean;
//   userId: string;
//   userName: string;
// };

export const titleCase = (txt: string) => txt.charAt(0).toUpperCase() + txt.slice(1);

export const openMaps = (address: string) => {
    const url = Platform.select({
        ios: `maps:0,0?q=${address}`,
        android: `geo:0,0?q=${address}`,
    })

    Linking.openURL(url!);
}