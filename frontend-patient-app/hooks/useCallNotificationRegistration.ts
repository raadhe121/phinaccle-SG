import { useEffect } from "react";
import { Platform } from "react-native";
import messaging from '@react-native-firebase/messaging';
import VoipPushNotification from 'react-native-voip-push-notification';
import { updateApnTokenApiUserUpdateApnTokenPost, updateFcmTokenApiUserUpdateFcmTokenPost } from "@/services/client";

const MAX_TOKEN_UPLOAD_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * POST a call-notification token to the backend, retrying a couple of times on
 * transient failures (network blip, momentarily-expired auth, etc.) instead of
 * silently dropping it - a token that never reaches the backend means the
 * patient's phone never rings when the doctor calls.
 */
const uploadTokenWithRetry = async (upload: () => Promise<unknown>, label: string) => {
    for (let attempt = 1; attempt <= MAX_TOKEN_UPLOAD_ATTEMPTS; attempt++) {
        try {
            await upload();
            return;
        } catch (e) {
            console.warn(`Failed to upload ${label} (attempt ${attempt}/${MAX_TOKEN_UPLOAD_ATTEMPTS})`, e);
            if (attempt < MAX_TOKEN_UPLOAD_ATTEMPTS) {
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
            }
        }
    }
};

/**
 * Registers this device to receive "doctor is calling" alerts (iOS VoIP/CallKit
 * push, Android FCM) and keeps the backend's copy of the token current.
 *
 * This has to run once per authenticated app session - not only when the
 * patient happens to be on the teleconsult booking screen - because:
 *
 *  - The doctor's call is placed whenever the patient reaches the front of the
 *    queue, which is very often a different app session than the one used to
 *    book. A token only ever sent from the booking screen can go stale by then.
 *  - iOS can (re)issue a VoIP token at any time (fresh install, OS update,
 *    restore, etc.), so it needs a listener that's alive for the whole session,
 *    not just a few minutes during checkout.
 *  - `react-native-voip-push-notification` caches any token/push that arrives
 *    before a JS listener is attached, and only replays it via a separate
 *    `didLoadWithEvents` event fired once the first listener subscribes. If
 *    nothing listens for that event, the very first token issued after a fresh
 *    app launch (which happens before login/navigation, i.e. before any
 *    listener exists) is silently lost for the lifetime of that app process -
 *    this is why a call could fail once and then "just work" after the patient
 *    force-quits and reopens the app (a fresh process re-registers).
 */
export const useCallNotificationRegistration = (enabled: boolean) => {
    useEffect(() => {
        if (!enabled) return;

        if (Platform.OS === 'ios') {
            const sendApnToken = (token: string) => {
                if (!token) return;
                uploadTokenWithRetry(
                    () => updateApnTokenApiUserUpdateApnTokenPost({ requestBody: { token } }),
                    'APN/VoIP token'
                );
            };

            VoipPushNotification.addEventListener('register', sendApnToken);

            VoipPushNotification.addEventListener('notification', (notification: any) => {
                VoipPushNotification.onVoipNotificationCompleted(notification.uuid);
            });

            // Replays any 'register' / 'notification' events that fired before the
            // listeners above were attached - see note above.
            VoipPushNotification.addEventListener('didLoadWithEvents', (events: any[]) => {
                if (!Array.isArray(events)) return;
                events.forEach(({ name, data }: { name: string, data: any }) => {
                    if (name === 'RNVoipPushRemoteNotificationsRegisteredEvent') {
                        sendApnToken(data);
                    } else if (name === 'RNVoipPushRemoteNotificationReceivedEvent' && data?.uuid) {
                        VoipPushNotification.onVoipNotificationCompleted(data.uuid);
                    }
                });
            });

            VoipPushNotification.registerVoipToken();

            return () => {
                VoipPushNotification.removeEventListener('register');
                VoipPushNotification.removeEventListener('notification');
                VoipPushNotification.removeEventListener('didLoadWithEvents');
            };
        }

        if (Platform.OS === 'android') {
            const sendFcmToken = (token: string) => {
                if (!token) return;
                uploadTokenWithRetry(
                    () => updateFcmTokenApiUserUpdateFcmTokenPost({ requestBody: { token } }),
                    'FCM token'
                );
            };

            messaging().getToken().then(sendFcmToken);
            const unsubscribeTokenRefresh = messaging().onTokenRefresh(sendFcmToken);

            return () => unsubscribeTokenRefresh();
        }
    }, [enabled]);
};
