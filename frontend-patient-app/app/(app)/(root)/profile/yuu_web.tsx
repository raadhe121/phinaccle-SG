import { router, useLocalSearchParams } from "expo-router";
import * as Linking from 'expo-linking';
import WebView from "react-native-webview";

function processUrl(urlString: string): string {
  const url = new URL(urlString);
  const params = new URLSearchParams(url.search);
  const encodedParams = new URLSearchParams();
  params.forEach((value, key) => {
    const encodedValue = encodeURIComponent(value);
    encodedParams.set(key, encodedValue);
  });
  url.search = encodedParams.toString();
  return url.toString();
}

export default function YuuWebScreen() {
  const { url } = useLocalSearchParams();

  return (
    <WebView
      source={{ uri: processUrl(url as string) }}
      onOpenWindow={({ nativeEvent: { targetUrl } }) => Linking.openURL(targetUrl)}
      onNavigationStateChange={(browserState) => {
        if (browserState.url.includes('code=')) {
          router.dismissTo({ pathname: '/profile/yuu', params: { url: browserState.url } })
        }
      }}
    />
  );
}