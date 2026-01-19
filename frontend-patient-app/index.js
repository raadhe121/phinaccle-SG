// @ts-check
import 'expo-router/entry';
import messaging from '@react-native-firebase/messaging';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import { Platform } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

// iOS Setup for Rining Notifications
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
    
    const incomingCallAnswer = ({ callUUID }) => {
        console.log("Incoming call answered");
        RNCallKeep.backToForeground();
        RNCallKeep.removeEventListener("answerCall");
        RNCallKeep.removeEventListener("endCall");
    };

    const endIncomingCall = ({ callUUID }) => {
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
} else if (Platform.OS === 'android') {
    const displayCall = (callId) => {
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
            }
        );
        // RNNotificationCall.hideNotification();
        
        RNNotificationCall.addEventListener('answer', (data) => {
            RNNotificationCall.backToApp();
            console.log("Answer Call", data)

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
            if (msg.data?.voip_id != null) {
                displayCall(msg.data.voip_id);
            }
        });

        // For Testing Purposes
        // messaging().onMessage((msg) => {
        //     console.log(`Foreground Message: ${JSON.stringify(msg.data)}`)
        //     displayCall(msg.data?.voip_id);
        // })
    }

    configureFcmBackgroundHandler();
}