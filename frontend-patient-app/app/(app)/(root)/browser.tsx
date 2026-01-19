import { useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import WebView from "react-native-webview";

export default function Browser() {
  const { url } = useLocalSearchParams();
  console.log("URL", url)
  return (
    <WebView
      source={{ uri: url as string }}
      onOpenWindow={({ nativeEvent: { targetUrl } }) =>
        Linking.openURL(targetUrl)
      }
    />
  );
}
