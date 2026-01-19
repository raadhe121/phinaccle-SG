import React, { useEffect } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../store/store';
import { RootStackParamList } from '../navigation/AppNavigator';
import LoginScreen from '../screens/LoginScreen';
import * as SplashScreen from 'expo-splash-screen';
import NotificationHandler from '@/notifications/NotificationHandler';

const AuthCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const accessToken = useAppSelector(state => state.auth.accessToken);

    if (accessToken === undefined) {
        return <></>
    } else {
        SplashScreen.hideAsync();
    }

    if (!accessToken) {
        return <LoginScreen />
    }

    return <NotificationHandler>
        {children}
    </NotificationHandler>;
};

export default AuthCheck;
