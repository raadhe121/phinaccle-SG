import { Stack } from "expo-router"
import { AppointmentProvider } from "@/hooks/useAppointment"

export default function AppointmentLayout() {
  return (
    <AppointmentProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Book Appointment', headerBackTitle: 'Home', headerShown: false }} />
        <Stack.Screen name="selection/service/index" options={{ title: 'Select Service', headerBackTitle: 'Home', headerShown: false }} />
        <Stack.Screen name="selection/service/detail" options={{ title: 'Service Selection', headerBackTitle: 'Service', headerShown: false }} />
        <Stack.Screen name="selection/patients" options={{ title: 'Select Patients', headerBackTitle: 'Home', headerShown: false }} />
        <Stack.Screen name="selection/location/index" options={{ title: 'Select Location', headerBackTitle: 'Home', headerShown: false }} />
        <Stack.Screen name="selection/datetime" options={{ title: 'Select Date & Time', headerBackTitle: 'Home', headerShown: false }} />
        <Stack.Screen name="survey/index" options={{ title: 'Survey', headerBackTitle: 'Home', headerShown: false }} />
        <Stack.Screen name="consultation" options={{ title: 'Consultation', headerBackTitle: 'Home', headerShown: false }} />
        <Stack.Screen name="payment" options={{ title: 'Payment', headerBackTitle: 'Home', headerShown: false }} />
        <Stack.Screen name="reschedule" options={{ title: 'Reschedule', headerBackTitle: 'Home', headerShown: false }} />
      </Stack>
    </AppointmentProvider>
  )
}
