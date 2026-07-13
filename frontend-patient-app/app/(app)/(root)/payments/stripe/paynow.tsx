import { router, useLocalSearchParams } from "expo-router";
import KeyboardView from '@/common/components/KeyboardView';
import { StripeProvider } from "@stripe/stripe-react-native";
import WebView from "react-native-webview";
import { Linking } from "react-native";
import { Height } from "@/common/components/AntdText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { stripePublishableKey } from "@/Config";
import { useMutation } from "@tanstack/react-query";
import { onError } from "@/common/utils/lib";
import { checkStripePaynowSuccessApiStripeV1PaynowSuccessPost } from "@/services/client";

type CheckoutProps = {
  id: string;
  url: string;
}

export default function StripePaynowScreen() {
  const { payment_provider_params } = useLocalSearchParams();
  const checkout: CheckoutProps = JSON.parse(payment_provider_params.toString());

  return <CheckoutView checkout={checkout} />
}

const CheckoutView = ({ checkout }: { checkout: CheckoutProps }) => {
  const insets = useSafeAreaInsets();

  const successMutation = useMutation({
    mutationFn: checkStripePaynowSuccessApiStripeV1PaynowSuccessPost,
    onSuccess: (data) => {
      router.dismissTo('/');
      router.navigate({ pathname: data.redirect_url, params: data.redirect_params as any })
    },
    onError: onError
  })
  
  const injectedJavaScriptBeforeContentLoaded = `
    document.addEventListener('click', function(event) {
        if (event.target.tagName === 'A' && event.target.classList.contains("DownloadQRCodeButton")) {
            console.log('Link clicked:', event.target.href, event.target.classList);
            window.open(event.target.href, '_blank');
        }
    });
    `

  return <StripeProvider
    publishableKey={stripePublishableKey}
    // urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
    // merchantIdentifier="merchant.com.{{YOUR_APP_NAME}}" // required for Apple Pay
  >
    <KeyboardView wrapScroll={false}>
      <Height h={insets.top} />
      <WebView
        // webviewDebuggingEnabled={true}
        source={{ uri: checkout.url }}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false} // This will inject it into all iframes
        // Intercept any new window requests that target _blank
        onOpenWindow={({ nativeEvent: { targetUrl } }) => Linking.openURL(targetUrl)}
        onNavigationStateChange={(state) => {
          if (state.url.includes('payment/cancel')) {
            router.back();
          } else if (state.url.includes('payment/success')) {
            successMutation.mutate({ paymentId: checkout.id })
          }
        }}
      />
    </KeyboardView>
  </StripeProvider>
}
