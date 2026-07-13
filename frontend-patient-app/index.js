import 'expo-router/entry';
import messaging from '@react-native-firebase/messaging';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import { Platform, Linking } from 'react-native';
import RNCallKeep from 'react-native-callkeep';
import AsyncStorage from '@react-native-async-storage/async-storage';

// iOS Setup for Rining Notifications
/** @type {{[key: string]: any}} */
const incomingCallPayloads = {};
/** @type {any} */
let lastIncomingPayload = null;
const ASYNC_LAST_PAYLOAD_KEY = '@pinnacle:lastIncomingPayload';

/** Persist payload to AsyncStorage for reliable lookup when answer is pressed */
/** @param {any} payload */
const persistLastPayload = async (payload) => {
    try {
        lastIncomingPayload = payload;
        await AsyncStorage.setItem(ASYNC_LAST_PAYLOAD_KEY, JSON.stringify(payload || ''));
    } catch (e) {
        console.warn('Failed to persist incoming payload', e);
    }
};

const readLastPersistedPayload = async () => {
    try {
        if (lastIncomingPayload) return lastIncomingPayload;
        const raw = await AsyncStorage.getItem(ASYNC_LAST_PAYLOAD_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.warn('Failed to read persisted incoming payload', e);
        return null;
    }
};

if (Platform.OS === 'ios') {
    const options = {
        ios: {
            appName: "PinnacleSG+",
            includesCallsInRecents: false,
            supportsVideo: true
        },
        // Required to prevent Typescript Errors
        android: {
            alertTitle: "Permissions required",
            alertDescription: "This application needs to access your phone accounts",
            cancelButton: "Cancel",
            okButton: "ok",
            additionalPermissions: []
        },
    };
    RNCallKeep.setup(options);
    
    // Keep a map of incoming call payloads so we can navigate to the correct screen

    /** @param {any} evt */
    const incomingCallAnswer = async (evt) => {
        const callUUID = evt && (evt.callUUID || evt.callId || evt.id);
        console.log("Incoming call answered", callUUID);
        RNCallKeep.backToForeground();

        // Try to find payload for this call and deep-link to Zoom screen
        try {
            const key = String(callUUID);
            let payload = incomingCallPayloads[key] || lastIncomingPayload;
            if (!payload) payload = await readLastPersistedPayload();
            if (payload) {
                const teleId = payload.id || payload.teleconsult_id || payload.teleconsultId || payload.request_id || payload.requestId || payload.voip_id;
                if (teleId) {
                    const url = `pinnaclesgplus://teleconsult/zoom?id=${encodeURIComponent(teleId)}`;
                    Linking.openURL(url).catch((e) => console.warn('Failed to open Zoom deeplink', e));
                } else {
                    // No teleId present — open Zoom route without id as a last resort
                    const url = `pinnaclesgplus://teleconsult/zoom`;
                    Linking.openURL(url).catch((e) => console.warn('Failed to open Zoom deeplink', e));
                }
                // cleanup
                try { delete incomingCallPayloads[key]; } catch (e) {}
            }
        } catch (e) {
            console.warn('Error handling incoming call answer payload', e);
        }

        RNCallKeep.removeEventListener("answerCall");
        RNCallKeep.removeEventListener("endCall");
    };

    /** @param {any} evt */
    const endIncomingCall = (evt) => {
        const callUUID = evt && (evt.callUUID || evt.callId || evt.id);
        console.log("Incoming call ended");
        RNCallKeep.endCall(callUUID);
        RNCallKeep.removeEventListener("answerCall");
        RNCallKeep.removeEventListener("endCall");
    };
    
    // Add event listeners for CallKit events
    RNCallKeep.addEventListener("answerCall", incomingCallAnswer);
    RNCallKeep.addEventListener("endCall", endIncomingCall);
    RNCallKeep.addEventListener('didChangeAudioRoute', ({ output }) => {  });


// Android Setup for Ringing Notifications
} 
else if (Platform.OS === 'android') {
    /** @param {string} callId @param {any} payload */
    const displayCall = (callId, payload) => {
        const logoUrl = 'https://yaadelemrtuxfyxayxpu.supabase.co/storage/v1/object/public/uploads/icon.png';
        RNNotificationCall.displayNotification(
            callId,
            logoUrl,
            30000,
            {
                channelId: 'sg.com.pinnaclefamilyclinic.pinnaclesgplus.incomingcall',
                channelName: 'Teleconsult Video Call',
                notificationIcon: 'ic_launcher', // mipmap
                notificationTitle: 'Virtual Consultation',
                notificationBody: 'Your session has started',
                answerText: 'Answer',
                declineText: 'Decline',
                notificationColor: 'colorAccent',
                isVideo: true,
                // notificationSound: null, // raw
                // mainComponent: 'MyReactNativeApp', // AppRegistry.registerComponent('MyReactNativeApp', () => CustomIncomingCall);
                // payload: { name: 'Test', body: 'test' }
                payload: payload
            }
        );
        // RNNotificationCall.hideNotification();
        
        RNNotificationCall.addEventListener('answer', async (data) => {
            RNNotificationCall.backToApp();
            console.log("Answer Call", data)

            try {
                const tryPayload = data && data.payload ? (typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload) : (payload || lastIncomingPayload);
                let finalPayload = tryPayload;
                if (!finalPayload) finalPayload = await readLastPersistedPayload();
                const teleId = finalPayload?.id || finalPayload?.teleconsult_id || finalPayload?.teleconsultId || finalPayload?.request_id || finalPayload?.requestId || finalPayload?.voip_id;
                if (teleId) {
                    const url = `pinnaclesgplus://teleconsult/zoom?id=${encodeURIComponent(teleId)}`;
                    Linking.openURL(url).catch((e) => console.warn('Failed to open Zoom deeplink', e));
                } else {
                    // No teleId present — open Zoom route without id as a last resort
                    const url = `pinnaclesgplus://teleconsult/zoom`;
                    Linking.openURL(url).catch((e) => console.warn('Failed to open Zoom deeplink', e));
                }
            } catch (e) {
                console.warn('Failed to parse incoming notification payload', e);
            }

            RNNotificationCall.removeEventListener('answer');
            RNNotificationCall.removeEventListener('endCall');
        });
        RNNotificationCall.addEventListener('endCall', (data) => {
            // TODO: Sometimes on Android, even when the call is declined, the app still comes to the foreground
            // const { callUUID, endAction, payload } = data;
            // console.log("End Call", data)
            // import  BackHandler } from 'react-native';
            // BackHandler.exitApp();

            RNNotificationCall.removeEventListener('answer');
            RNNotificationCall.removeEventListener('endCall');
        });

    }

    const configureFcmBackgroundHandler = () => {
        messaging().setBackgroundMessageHandler(async (msg) => {
            if (msg.data && msg.data.voip_id != null) {
                // store payload in map keyed by voip id so iOS CallKit handlers can lookup later
                try {
                    const callId = String(msg.data.voip_id);
                    incomingCallPayloads[callId] = msg.data;
                    await persistLastPayload(msg.data);
                } catch (e) {
                    console.warn('Failed to stash incoming payload', e);
                }
                displayCall(String(msg.data.voip_id), msg.data);
            }
        });

        // Also handle foreground messages so when the app is open and user taps Answer it can navigate
        messaging().onMessage(async (msg) => {
            try {
                if (msg?.data && msg.data.voip_id != null) {
                    const callId = String(msg.data.voip_id);
                    incomingCallPayloads[callId] = msg.data;
                    await persistLastPayload(msg.data);
                    // If app is foreground, show the in-app incoming-call UI as well
                    displayCall(callId, msg.data);
                }
            } catch (e) {
                console.warn('Foreground message handling failed', e);
            }
        });

        // For Testing Purposes
        // messaging().onMessage((msg) => {
        //     console.log(Foreground Message: ${JSON.stringify(msg.data)})
        //     displayCall(msg.data?.voip_id);
        // })
    }

    configureFcmBackgroundHandler();
}