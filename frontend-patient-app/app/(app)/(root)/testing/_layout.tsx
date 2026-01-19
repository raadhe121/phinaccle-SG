import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableHighlight } from "react-native";
import { testingApiTestingEnabledGet } from "@/services/client";
import { useQuery } from "@tanstack/react-query";

export const useTestingHook = () => {
    const [ testingEnabled, setTestingEnabled ] = useState(false);
    const qry = useQuery({
        queryKey: ['testing'],
        queryFn: testingApiTestingEnabledGet
    });

    // Check if user can see this screen
    useEffect(() => {
        if (qry.data?.success) setTestingEnabled(qry.data.success);
    }, [qry.data]);

    return { testingEnabled };
}

export const TestingLaunchButton = ({ children }: { children: React.ReactNode }) => {
    const { testingEnabled } = useTestingHook();
    if (!testingEnabled) {
        return children;
    }

    return <TouchableHighlight onPress={() => router.navigate('/testing')}>
        {children}
    </TouchableHighlight>
}

export default function TestingLayout() {
    const { testingEnabled } = useTestingHook();
    if (!testingEnabled) {
        return <></>;
    }
    
    return (
        <Stack>
            {/* Disables the header for all the (root) paths */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    );
}