import { modal } from "@/common/utils/modal";
import { Linking, PermissionsAndroid, Platform } from "react-native";
import messaging from '@react-native-firebase/messaging';
import { useEffect } from "react";
import { updateApnTokenApiUserUpdateApnTokenPost, updateFcmTokenApiUserUpdateFcmTokenPost } from "@/services/client";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import VoipPushNotification from 'react-native-voip-push-notification';

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
  
            // Get APN / FCM Token for Ringing Notifications for Teleconsult
            if (Platform.OS === 'ios') {
                // Register for VoIP push notifications
                VoipPushNotification.registerVoipToken()
                // Event listener for VoIP push token registration
                VoipPushNotification.addEventListener('register', token => {
                    updateApnTokenApiUserUpdateApnTokenPost({ requestBody: { token }});
                });

                VoipPushNotification.addEventListener("notification", (notification: any) => {
                    VoipPushNotification.onVoipNotificationCompleted(notification.uuid);
                });
                
            } else if (Platform.OS === 'android') {
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

                // Backend FCM permissions
                if (!await messaging().hasPermission()) {
                    const resp = await messaging().requestPermission();
                }

                // Update FCM token to backend server
                const deviceToken = await messaging().getToken();
                updateFcmTokenApiUserUpdateFcmTokenPost({ requestBody: { token: deviceToken }});
            }
        }
        setupCallNotifications();
    }, []);
}