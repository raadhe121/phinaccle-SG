import React, { useEffect, useState } from 'react';
import NetInfo from "@react-native-community/netinfo";

type NetworkStateContextProps = {
    isConnected: boolean;
}

export const NetworkContext = React.createContext<NetworkStateContextProps>({
    isConnected: true,
});

// This hook can be used to access the user info.
export function useNetworkState() {
    const value = React.useContext(NetworkContext);
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useNetworkState must be wrapped in a <NetworkStateProvider />');
        }
    }

    return value;
}

export function NetworkStateProvider(props: React.PropsWithChildren) {
    // Handle Network State
    const [isConnected, setConnected] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setConnected(state.isConnected ?? true);
        });

        return () => unsubscribe();
      }, []);

    return (
        <NetworkContext.Provider
            value={{
                isConnected,
            }}>
            {props.children}
        </NetworkContext.Provider>
    );
}