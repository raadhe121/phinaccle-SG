import { Redirect, Stack, router } from 'expo-router';
import { useSession } from '../../../ctx';
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/common/utils/notifications';
import { RealtimeProvider } from '@/providers/realtime';
import { updateExpoPushTokenApiUserUpdateExpoPushTokenPost } from '@/services/client';
import { useCallNotificationRegistration } from '@/hooks/useCallNotificationRegistration';
import * as Device from 'expo-device';
import { ActivityIndicator } from 'react-native';
import { colors } from '@/common/utils/config';
import { getItem, localStorageNotificationsOptInKey } from '@/common/utils/async_storage';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        priority: Notifications.AndroidNotificationPriority.MAX,
    }),
});

// Another Thread: https://github.com/expo/router/issues/428
// Fix: https://github.com/expo/router/issues/723#issuecomment-2652009076
export const unstable_settings = {
    initialRouteName: "(tabs)",
};

export default function AppLayout() {
    const { user, initializing } = useSession();
    const responseListener = useRef<Notifications.Subscription>();

    // Registers this device for "doctor is calling" alerts (iOS VoIP/CallKit,
    // Android FCM) for the whole authenticated session - not just while the
    // patient happens to be on the teleconsult booking screen. See the hook
    // for why that distinction matters.
    useCallNotificationRegistration(!!user);

    useEffect(() => {
        if (!user) return;

        const updateDeviceToken = async () => {
            // Checkbox on signin/register defaults to opted-in; only skip
            // registration when the user has explicitly unchecked it.
            const optedIn = await getItem(localStorageNotificationsOptInKey);
            if (optedIn === false) return;

            const token = await registerForPushNotificationsAsync();
            if (!token) return;
            updateExpoPushTokenApiUserUpdateExpoPushTokenPost({ requestBody: {
                token: token,
                device: Device.modelName,
            }});
        }
        updateDeviceToken();

        // When App is clicked from Notification Bar
        responseListener.current =
            Notifications.addNotificationResponseReceivedListener((response) => {
                const trigger = response.notification.request.trigger as Notifications.PushNotificationTrigger;
                const data = trigger.payload?.data as { pathname?: string, params?: { [key: string]: any }, url?: string };
                if (data?.pathname) {
                    router.navigate({ pathname: data.pathname as any, params: data.params })
                } else if (data?.url) {
                    Linking.openURL(data.url);
                }
            });

        return () => {
            responseListener.current &&
                Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, [user]);

    // You can keep the splash screen open, or render a loading screen like we do here.
    if (initializing) {
        return <ActivityIndicator size="large" color={colors.primary} />;
    }

    // Only require authentication within the (app) group's layout as users
    // need to be able to access the (auth) group and sign in again.
    if (!user) {
        return <Redirect href="/signin" />;
    }

    // This layout can be deferred because it's not the root layout.
    return <RealtimeProvider>
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="teleconsult/index" options={{ title: 'Virtual Consultation', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="teleconsult/payment" options={{ title: 'Pre-payment', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="teleconsult/branches" options={{ title: 'Branches', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="teleconsult/consultation" options={{ title: 'Consultation', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="teleconsult/select" options={{ title: 'Add Dependant', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="teleconsult/zoom" options={{ title: 'Teleconsult Room', headerBackTitle: 'Back', headerShown: false }} />

            <Stack.Screen name="teleconsult/prepayment/stripe_card" options={{ title: 'Credit / Debit Card', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="teleconsult/prepayment/stripe_paynow" options={{ title: 'PayNow', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="teleconsult/postpayment/stripe_card" options={{ title: 'Credit / Debit Card', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="teleconsult/postpayment/stripe_paynow" options={{ title: 'PayNow', headerBackTitle: 'Back', headerShown: false }} />

            <Stack.Screen name="walkin/index" options={{ title: 'Queue Request', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="walkin/select" options={{ title: 'Queue Request Dependants', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="walkin/consultation" options={{ title: 'Queue Request Details', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="walkin/branches" options={{ title: 'Branches', headerBackTitle: 'Back', headerShown: false }} />

            <Stack.Screen name="family/index" options={{ title: 'My Family', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="family/create" options={{ title: 'Add Family Member', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="family/register" options={{ title: 'Add Family Member', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="family/select" options={{ title: 'Select Family Member', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="family/details" options={{ title: 'Family Member Details', headerBackTitle: 'Home', headerShown: false }} />

            {/* Refer to "/app/(app)/(root)/documents/_layout.tsx" for routes */}
            <Stack.Screen name="documents" options={{ title: 'My Records', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="appointment" options={{ title: 'Book Appointment', headerBackTitle: 'Home', headerShown: false }} />

            <Stack.Screen name="profile/details" options={{ title: 'Profile', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="profile/mobile" options={{ title: 'Mobile Number', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="profile/otp" options={{ title: 'Verify OTP', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="profile/address" options={{ title: 'Address', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="profile/payment_methods" options={{ title: 'Payment Methods', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="profile/yuu" options={{ title: 'yuu Rewards Club', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="profile/yuu_web" options={{ title: 'yuu Rewards Club', headerBackTitle: 'Back', headerShown: true }} />

            <Stack.Screen name="support/about_us" options={{ title: 'About Us', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="support/locations" options={{ title: 'Clinic Locations', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="support/contact" options={{ title: 'Contact Us / Feedback', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="support/faq" options={{ title: 'FAQ', headerBackTitle: 'Back', headerShown: false }} />
            <Stack.Screen name="support/privacy" options={{ title: 'Privacy Policy', headerBackTitle: 'Back', headerShown: false }} />

            <Stack.Screen name="browser" options={{ title: 'PinnacleSG+', headerBackTitle: 'Back' }}  />
            <Stack.Screen name="pdf_viewer" options={{ title: 'PDF Viewer', headerBackTitle: 'Back' }}  />

            <Stack.Screen name="payments/2c2p/add_card" options={{ title: 'Add Card', headerBackTitle: 'Back', headerShown: false }}  />
            <Stack.Screen name="payments/2c2p/webview" options={{ title: 'Webview', headerBackTitle: 'Back', headerShown: false }}  />
            <Stack.Screen name="payments/2c2p/payment_cvc" options={{ title: 'Payment', headerBackTitle: 'Back', headerShown: false }}  />
            <Stack.Screen name="payments/stripe/paynow" options={{ title: 'Payment', headerBackTitle: 'Back', headerShown: false }}  />
        </Stack>
    </RealtimeProvider>;
}
