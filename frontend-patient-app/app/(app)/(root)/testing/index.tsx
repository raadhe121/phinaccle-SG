import { CText, GRButton } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { modal } from "@/common/utils/modal";
import { mockTeleconsultTokenApiTestingMockTeleconsultTokenGet } from "@/services/client";
import { useCameraPermissions } from "expo-camera";
import { useMicrophonePermissions } from "expo-camera";
import { router } from "expo-router";
import { Linking, View } from "react-native";
import Constants from "expo-constants";

export default function TestingScreen() {
    const [ camPerm, camReqPerm ] = useCameraPermissions();
    const [ micPerm, micReqPerm ] = useMicrophonePermissions();

    const appVersion = Constants.expoConfig?.version || "Unknown";
    const runtimeVersion = Constants.expoConfig?.runtimeVersion || "Unknown";

    return <KeyboardView edges={[]} showLogo={true}>
        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
            <CText size={14} style={{ opacity: 0.6 }}>
                App Version: {appVersion} ({runtimeVersion as string})
            </CText>
        </View>
        <View style={{ margin: 16, marginBottom: 0 }}> 
            <GRButton
                type='primary'
                title='Test Video'
                icon="VideoOutlineAlt"
                onPress={async () => {
                    const camResult = await camReqPerm()
                    const micResult = await micReqPerm()
                    if (camResult.granted && micResult.granted) {
                        router.push({ pathname: '/teleconsult/zoom', params: { id: "test" }})
                    } else {
                        modal.error({
                            title: "Unable to access microphone and camera",
                            content: 'Allow Pinnacle App to access your camera and microphone from device menu under "Settings"',
                            labels: ["Open Settings", ""],
                            onCancel: async () => await Linking.openSettings()
                        })
                    }
                }} />
            <GRButton
                type='primary'
                title='Test Payment'
                icon="VideoOutlineAlt"
                onPress={async () => {
                    const params = await mockTeleconsultTokenApiTestingMockTeleconsultTokenGet();
                    router.push({ pathname: '/payments/2c2p/payment_cvc', params: { payment_provider_params: JSON.stringify(params) } })
                }} />
            
            <GRButton
                type='primary'
                title='Picker Testing'
                icon="VideoOutlineAlt"
                onPress={async () => {
                    router.navigate('/testing/picker')
                }} />
        </View>
    </KeyboardView>
}
