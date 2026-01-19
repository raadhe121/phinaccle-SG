import { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import NetInfo from "@react-native-community/netinfo";
import { SGiMedICType } from './services/client';

type AuthContextProps = {
    initializing: boolean;
    user: FirebaseAuthTypes.User | null;
    loginParams?: LoginParams;
    setLoginParams: (params: LoginParams) => void;
    signOut: () => void;
    isConnected: boolean;
}

export const AuthContext = React.createContext<AuthContextProps>({
    initializing: true,
    user: null,
    loginParams: {},
    setLoginParams: (_) => null,
    signOut: () => null,
    isConnected: true,
});

type LoginParams = {
    idType?: SGiMedICType;
    idNumber?: string;
    mobileCode?: string;
    mobileNumber?: string;
    sessionId?: string;
    otpExpiresAt?: Dayjs;
};

// This hook can be used to access the user info.
export function useSession() {
    const value = React.useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production' && !value) {
        throw new Error('useSession must be wrapped in a <SessionProvider />');
    }

    return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
    // Used during the flow of login / sign up
    const [loginParams, setLoginParams] = React.useState<LoginParams>({});
    // Used when the app first starts and loading user from firebase
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    // Handle Network State
    const [isConnected, setConnected] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setConnected(state.isConnected ?? true);
        });

        return () => unsubscribe();
      }, []);

    // Handle user state changes
    function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
        // console.log("User Updated", user)
        setUser(user);
        if (initializing) setInitializing(false);
    }

    useEffect(() => {
        const subscriber1 = auth().onAuthStateChanged(onAuthStateChanged);
        const subscriber2 = auth().onUserChanged(onAuthStateChanged);
         // unsubscribe on unmount
        return () => {
            subscriber1();
            subscriber2();
        }
    }, []);

    const signOut = async () => {
        await auth().signOut();
        // TODO: Clear push token from server
    }

    return (
        <AuthContext.Provider
            value={{
                initializing,
                user,
                signOut,
                loginParams,
                setLoginParams,
                isConnected,
            }}>
            {props.children}
        </AuthContext.Provider>
    );
}