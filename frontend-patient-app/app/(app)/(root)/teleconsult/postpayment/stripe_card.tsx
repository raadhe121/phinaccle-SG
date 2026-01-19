import { BoldText, CText, H1Text, HeaderTitleTag, ListItemView, Section } from "@/common/components/AntdText";
import KeyboardView from '@/common/components/KeyboardView';
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react"
import { PaymentBreakdown } from "../payment";
import { stripeMerchantName, stripePublishableKey } from "@/Config";

export default function StripeCardScreen() {
    const { id, total, balance, breakdown, payment_provider_params } = useLocalSearchParams();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const breakdownDict = breakdown ? JSON.parse(breakdown.toString()) : undefined;
    const paymentProviderParams = payment_provider_params ? JSON.parse(payment_provider_params.toString()) : undefined;

    useEffect(() => {
        const generatePaymentLink = async () => {
            const initResp = await initPaymentSheet({
                merchantDisplayName: stripeMerchantName,
                customerId: paymentProviderParams.customer,
                customerEphemeralKeySecret: paymentProviderParams.ephemeral_key,
                paymentIntentClientSecret: paymentProviderParams?.payment_intent?.client_secret,
                allowsDelayedPaymentMethods: false,
                // TODO: Review the following Stripe details that needs to be updated
                // defaultBillingDetails: {
                //     name: "Jane Doe",
                // },
                returnURL: "pinnaclesgplus://stripe-callback",
                style: 'alwaysLight',
            });
            if (initResp.error) {
                console.error(initResp.error);
            }

            // Show Payment Sheet
            const presentResp = await presentPaymentSheet();
            // Error
            if (presentResp.error) {
                if (presentResp.error.code === 'Canceled') {
                    router.back();
                    return;
                }
                console.error(presentResp.error)
            // Success
            } else {
                router.dismissTo('/');
                router.navigate({ pathname: '/teleconsult/consultation', params: { id }})
            }
        }
        generatePaymentLink();
    }, []);

    return (
        <StripeProvider
            publishableKey={stripePublishableKey}
            // urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
            // merchantIdentifier="merchant.com.{{YOUR_APP_NAME}}" // required for Apple Pay
            >
            <KeyboardView
                navBack={() => router.back()}
                title={<HeaderTitleTag tag='Book Telemedicine' title='Consultation Fees Payable' />}
                >
                {breakdownDict && <Section title={<H1Text>Price To Pay</H1Text>} top={6}>
                        { breakdownDict.length > 0 && <PaymentBreakdown breakdown={breakdownDict} /> }
                        <ListItemView extra={<CText size={16}>{`\$${parseFloat(total as string).toFixed(2)}`}</CText>}>
                            <BoldText size={16}>Total To Pay</BoldText>
                        </ListItemView>
                        <ListItemView extra={<CText size={16}>{`\$${parseFloat(balance as string).toFixed(2)}`}</CText>}>
                            <BoldText size={16}>Balance</BoldText>
                        </ListItemView>
                    </Section>}
            </KeyboardView>
        </StripeProvider>
    )
}