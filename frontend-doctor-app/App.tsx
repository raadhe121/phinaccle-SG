import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import AppNavigator from './navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import store from './store/store';
import AuthHandler from './auth/AuthHandler';
import { NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ZoomVideoSdkProvider } from '@zoom/react-native-videosdk';
import * as Notifications from 'expo-notifications';
import { NetworkStateProvider } from './common/providers/NetworkState';
import { useFonts } from 'expo-font';
import {
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
    Inter_400Regular,
} from '@expo-google-fonts/inter';
import { DefaultTheme } from './common/utils/config';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReactQueryDevTools } from '@dev-plugins/react-query';
import { Appearance, StatusBar } from 'react-native';
import { ApiError } from './services/client';
import { supabase } from './lib/supabase';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
    // Global logout when any of the requests to API server becomes unauthorised
    queryCache: new QueryCache({
        onError: async (error) => {
            const msg = error as ApiError;
            if (msg.status === 401) {
                supabase.auth.signOut();
            }
        },
    })
})

export default function App() {
    useReactQueryDevTools(queryClient);

    const [loaded] = useFonts({
        // SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        Manrope_200ExtraLight,
        Manrope_300Light,
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
        Manrope_800ExtraBold,
        Inter_400Regular,
        'antdmini-icon': require('./common/assets/fonts/antdmini-icon.ttf'),
        antoutline: require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
        antfill: require('@ant-design/icons-react-native/fonts/antfill.ttf'),
    });

    // useEffect(() => {
    //     if (!loaded) return;
    //     Appearance.setColorScheme('light')
    // }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <>
            <StatusBar backgroundColor="transparent" translucent={true} />
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <ZoomVideoSdkProvider config={{ domain: "zoom.us", enableLog: true }}>
                        <ThemeProvider value={DefaultTheme}>
                            <ReduxProvider store={store}>
                                <NetworkStateProvider>
                                    <NavigationContainer>
                                        <AppNavigator />
                                        <AuthHandler />
                                    </NavigationContainer>
                                </NetworkStateProvider>
                            </ReduxProvider>
                        </ThemeProvider>
                    </ZoomVideoSdkProvider>
                </QueryClientProvider>
            </SafeAreaProvider>
        </>
    );
};
