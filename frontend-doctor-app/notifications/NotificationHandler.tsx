import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { isExponentPushToken, registerForPushNotificationsAsync, sendPushNotification } from './Notification_actions';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { setPushToken } from '../store/notificationSlice';
import { DOMAIN } from '@/Config';

interface ExpoTokenResponse {
    success: boolean;
}

interface ExpoTokenRegister {
    push_token: string;
}

interface ExpoTokenRemove {
    push_token: string
}

const registerExpoToken = async (expoToken: string, accessToken: string) => {
    try {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        };

        const param: ExpoTokenRegister = {
            push_token: expoToken,
        }
        console.log("Checking domain")
        console.log(DOMAIN)
        const response = await axios.post<ExpoTokenResponse>(`${DOMAIN}/token`,
            param,
            { headers }
        );
        if (response.data.success) {
            console.log('Expo token registered successfully');
        } else {
            console.log('Failed to register expo token');
        }
    } catch (error) {
        console.error('Error registering expo token:', error);
        console.log(error)
    }
};

export const removeExpoToken = async (accessToken: any, pushToken: string) => {
    try {
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        };

        const response = await axios.delete<ExpoTokenResponse>(`${DOMAIN}/token?token=${pushToken}`,
            { headers }
        );
        if (response.data.success) {
            console.log('Expo token remove successfully');
        } else {
            console.log('Failed to remove expo token');
        }
    } catch (error) {
        console.error('Error removing expo token:', error);
        console.log(error)
    }
};

const NotificationHandler = ({ children }: { children: React.ReactNode }) => {
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(
        undefined
    );
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const { userId, accessToken } = useAppSelector(state => state.auth)
    const { pushToken: expoPushToken } = useAppSelector(state => state.notification)
    const dispatch = useAppDispatch()

    useEffect(() => {
        registerForPushNotificationsAsync()
            .then(token => dispatch(setPushToken(token ?? '')))
            .catch((error: any) => console.log(`${error}`));

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const trigger = response.notification.request.trigger as Notifications.PushNotificationTrigger;
            const body = trigger.payload?.body as { pathname?: string, params?: { [key: string]: any } };
            if (body?.pathname) {
                // Currently no navigation required for doctor app
                // navigation.navigate(body.pathname, body.params)
            }
        });

        return () => {
            notificationListener.current &&
                Notifications.removeNotificationSubscription(notificationListener.current);
            responseListener.current &&
                Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    useEffect(() => {
        console.log("Resgitering expo token")
        console.log(expoPushToken);
        console.log(isExponentPushToken(expoPushToken))
        if (expoPushToken && accessToken) {
            registerExpoToken(expoPushToken, accessToken);
        }

    }, [expoPushToken, accessToken])

    return children;
};

export default NotificationHandler;
