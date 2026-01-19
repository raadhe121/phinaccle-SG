import { Stack } from "expo-router"
import { DocumentProvider } from '@/providers/documents'

export default function DocumentLayout() {
    return <DocumentProvider>
        <Stack>
            <Stack.Screen name="index" options={{ title: 'My Records', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="list" options={{ title: 'My Records', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="viewer" options={{ title: 'Viewer', headerBackTitle: 'Back' }} />
            <Stack.Screen name="health_report/index" options={{ title: 'Health Report Disclaimer', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="health_report/report" options={{ title: 'Health Report Report', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="health_report/details" options={{ title: 'Health Report Details', headerBackTitle: 'Home', headerShown: false }} />
            <Stack.Screen name="health_report/list" options={{ title: 'Health Reports', headerBackTitle: 'Home', headerShown: false }} />
        </Stack>
    </DocumentProvider>
}
