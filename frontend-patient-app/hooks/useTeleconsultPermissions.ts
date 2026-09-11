import { modal } from "@/common/utils/modal";
import { Linking, PermissionsAndroid, Platform } from "react-native";
import { useEffect } from "react";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";

// Note: APN/VoIP (iOS) and FCM (Android) call-notification token registration
// used to live here, but that meant the backend only ever learned this
// device's token when the patient happened to be on this screen. The doctor's
// call can come much later, in a different app session, so registration now
// happens once per authenticated session instead - see useCallNotificationRegistration.
export const useTeleconsultPermissions = () => {
    const [ camPerm, camReqPerm ] = useCameraPermissions();
    const [ micPerm, micReqPerm ] = useMicrophonePermissions();

    useEffect(() => {
        const setupCallNotifications = async () => {
            // Camera and Microphone permissions for Teleconsult
            const camResult = await camReqPerm()
            const micResult = await micReqPerm()
            if (!camResult.granted || !micResult.granted) {
                modal.error({
                    title: "Unable to access microphone and camera",
                    content: 'Allow Pinnacle App to access your camera and microphone from device menu under "Settings"',
                    labels: ["Open Settings", ""],
                    onCancel: async () => await Linking.openSettings()
                })
            }
  
            // Runtime permission prompts for Teleconsult (token registration is
            // handled separately at the session level - see useCallNotificationRegistration)
            if (Platform.OS === 'android') {
                // Check for Phone & Notifications permissions
                const notifGranted = await PermissionsAndroid.requestMultiple([
                    // PermissionsAndroid.PERMISSIONS.FOREGROUND_SERVICE_PHONE_CALL,
                    // PermissionsAndroid.PERMISSIONS.MANAGE_OWN_CALLS,
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
                ]);
                const rejected = Object.values(notifGranted).filter((v) => v !== 'granted')
                if (rejected.length > 0) {
                    modal.error({
                        title: "Receive Teleconsult Notifications",
                        content: 'Require Phone & Notifications permission to receive Teleconsult status and call notifications',
                        labels: ["Open Settings", "Close"],
                        onOk: async () => {},
                        onCancel: async () => await Linking.openSettings()
                    })
                }
            }
        }
        setupCallNotifications();
    }, []);
}