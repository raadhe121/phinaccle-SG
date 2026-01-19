import "../global.css"
import { ThemeProvider } from '@react-navigation/native';
import { theme } from '@/common/utils/config';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import 'react-native-reanimated';

import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { useReactQueryDevTools } from '@dev-plugins/react-query';

// import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/ctx';
import { Provider } from '@ant-design/react-native';
import enUS from '@ant-design/react-native/lib/locale-provider/en_US';
import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

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
import { Text, TextInput } from 'react-native' 
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient()

export default function RootLayout() {
    useReactQueryDevTools(queryClient);

    // const colorScheme = useColorScheme();
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
        'antdmini-icon': require('@/common/assets/fonts/antdmini-icon.ttf'),
        antoutline: require('@ant-design/icons-react-native/fonts/antoutline.ttf'),
    });

    // Override Text scaling
    (Text as any).defaultProps = (Text as any).defaultProps || {};
    (Text as any).defaultProps.allowFontScaling = false; 
    (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
    (TextInput as any).defaultProps.allowFontScaling = false; 

    useEffect(() => {
        if (!loaded) return;
        // Appearance.setColorScheme('light')
        if (Platform.OS == 'ios') return;
        StatusBar.setBarStyle('light-content')
        StatusBar.setTranslucent(true)
        StatusBar.setBackgroundColor('transparent')
    }, [loaded]);

    // This is required to ensure the icons load correctly
    if (!loaded) {
        return <></>;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}> 
                    {/* <ThemeProvider value={colorScheme === 'light' ? DarkTheme : DefaultTheme}> */}
                    <ThemeProvider value={theme}>
                        <Provider locale={enUS}>
                            <SessionProvider>
                                <Slot />
                            </SessionProvider>
                        </Provider>
                    </ThemeProvider>
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
