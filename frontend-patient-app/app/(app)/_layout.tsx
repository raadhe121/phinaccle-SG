import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { modal } from '@/common/utils/modal';
import { checkUpdateApi } from '@/apis/mobile_app';
import AppLink from 'react-native-app-link';
import { appStoreLink } from '@/Config';
import SplashImage from '@/components/splash_image';

const SPLASH_DURATION = 2000;

export default function AppLayout() {
    const [ displaySplash, setDisplaySplash ] = useState(true);

    useEffect(() => {
        const openAppStore = async () => {
            try {
                await AppLink.openInStore(appStoreLink);
            } catch (error) {
                console.error(error);
            }
        }

        const openWarning = async (resp: { update: boolean, force: boolean }) => {
            if (resp.update) {
                modal.warn({
                    title: 'Update Available',
                    content: 'A new version of the app is available. Please update to the latest version.',
                    labels: ["Cancel", "Update App"],
                    onCancel: resp.force ? undefined : () => {},
                    onOk: () => {
                        openAppStore();
                        openWarning(resp);
                    },
                })
            }
        }

        const checkUpdate = async () => {
            const resp = await checkUpdateApi();
            if (resp) {
                openWarning(resp);
            }
        };
        checkUpdate();
    }, [])

    // Set the duration of the splash screen
    useEffect(() => {
        setTimeout(() => setDisplaySplash(false), SPLASH_DURATION);
    }, []);

    if (displaySplash) {
        return <SplashImage />;
    }

    return (
        <Stack>
            {/* Disables the header for all the (root) paths */}
            <Stack.Screen name="(root)" options={{ headerShown: false }} />
            <Stack.Screen name="signin" options={{ headerShown: false }} />
            <Stack.Screen name="otp" options={{ title: 'Mobile OTP', headerBackTitle: 'Sign In', headerShown: false }} />
            <Stack.Screen name="register" options={{ title: 'Basic Details', headerBackTitle: 'Sign In', headerShown: false }} />
            <Stack.Screen name="verify_dob" options={{ title: 'Verify DOB', headerBackTitle: 'Sign In', headerShown: false }} />
        </Stack>
    );
}