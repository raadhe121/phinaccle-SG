import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react"
import KeyboardView from '@/common/components/KeyboardView';
import { StripeProvider } from "@stripe/stripe-react-native";
import WebView from "react-native-webview";
import { Linking } from "react-native";
import { apiUrl } from "@/Config";
import { Height } from "@/common/components/AntdText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { stripePublishableKey } from "@/Config";

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

    // SSE to listen for successful payment to go into consult page
    useEffect(() => {
        // WebSocket Issues: https://stackoverflow.com/a/77060459/6944050
        console.log("Connecting websocket")
        const websocket = new WebSocket(`${apiUrl!.replace('https', 'wss')}/api/teleconsult/payment/ws?payment_id=${checkout.id}`)
        websocket.onopen = () => {
            console.log('connected websocket')
        }

        websocket.onmessage = (event) => {
            // const data = JSON.parse(event.data)
            // console.log("Websocket Data", data);
            // const queryKey = [...data.entity, data.id].filter(Boolean)
            // queryClient.invalidateQueries({ queryKey })

            console.log("Event Receiveed")
            try {
                const data = JSON.parse(event.data as string);
                console.log("Message event:", data);
                if (data.status === 'payment_success' && data.id) {
                    router.dismissTo('/')
                    router.navigate({ pathname: '/teleconsult/consultation', params: { id: data.id }})

                } else if (data.status === 'payment_failed') {
                // TODO: Handle status when PayNow is expired
                } else if (data.status === 'payment_expired') {
                // } else if (data.status === 'payment_canceled') {
                } else {
                    console.log("Unknown message event:", event.data)
                }
            } catch (err) {
                console.error("Error parsing message:", err);
            }
        }

        return () => {
            websocket.close()
        }
    }, [])

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
                onOpenWindow={({ nativeEvent: { targetUrl } }) => Linking.openURL(targetUrl) }
                onNavigationStateChange={(state) => {
                    if (state.url.includes('teleconsult/payment/cancel')) {
                        router.back();
                    } else if (state.url.includes('teleconsult/payment/success')) {
                        router.dismissTo('/')
                        router.navigate('/teleconsult/consultation');
                    }
                }} 
                />
        </KeyboardView>
    </StripeProvider>   
}
