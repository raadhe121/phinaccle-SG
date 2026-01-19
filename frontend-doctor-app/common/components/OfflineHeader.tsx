import { useNetworkState } from "../providers/NetworkState";
import { View } from "react-native";
import { CText } from "./AntdText";
import { colors } from "@/common/utils/config";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OfflineHeader() {
    const insets = useSafeAreaInsets();
    const { isConnected } = useNetworkState();
    
    if (isConnected) {
        return <></>;
    }

    return <View style={{ position: 'absolute', top: insets.top, alignSelf: 'center', zIndex: 150, backgroundColor: colors.danger, borderRadius: 10 }}>
        <CText style={{ margin: 8, textAlign: 'center', color: 'white' }}>You are offline</CText>
    </View>
}
