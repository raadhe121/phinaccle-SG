import { ActionButton, Height, ScrollbarPadding, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { toast } from "@/common/utils/modal";
import { View } from "@ant-design/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { TextInput } from "react-native";
import { Image } from 'expo-image'
import { use2C2PHook } from "@/hooks/use2C2PPayment";
// import { CardField } from "@/components/2c2p/card_field";
import { getPaymentMethodImg } from "@/common/components/AntdMiniIcon";
import { CardField } from "./add_card";

export default function CardCvv2C2P() {
    const { payment_provider_params }: { payment_provider_params: string } = useLocalSearchParams();
    const { card_brand, card_last4, amount, customer_token, payment_token }: { card_brand: string, card_last4: string, amount: string, customer_token: string, payment_token: string } = JSON.parse(payment_provider_params)
    const cvcInput = useRef<TextInput>(null);
    const [ showErrors, setShowErrors ] = useState(false);
    const [ cvc, setCvc ] = useState('');
    const { makePayment } = use2C2PHook();

    const errors = {
        'cvc': cvc.length !== 3 && 'CVC/CVV is invalid'
    }
    const hasErrors = Object.values(errors).some(Boolean);

    const onPress = async () => {
        setShowErrors(true);
        if (hasErrors) return;

        const close = toast.loading();
        await makePayment({ cvc, paymentToken: payment_token, customerToken: customer_token });
        close();
    }
    
    const action = (
        <ActionButton
            onPress={onPress}
            title={`Pay ${amount}`}
            disabled={showErrors && hasErrors}
            />
    )

    return <KeyboardView
        action={action}
        navBack={() => router.back()}
        title='Payment'
        >
        <Section title={<Height h={24} />}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <CardField
                        label="Card Number"
                        placeholder={card_last4}
                        value={card_last4}
                        disabled
                        suffix={getPaymentMethodImg(card_brand ?? '')}
                        />
                </View>

                <View style={{ flex: 1, flexDirection: 'column' }}>
                    <CardField
                        error={showErrors && errors.cvc}
                        ref={cvcInput}
                        label="CVC"
                        placeholder='CVC/CVV'
                        value={cvc}
                        onChange={(v) => setCvc(v)}
                        suffix={<Image source={require('@/assets/images/payments/cvv.png')} style={{ width: 30, height: 22, resizeMode: 'contain'}} />}
                        autoFocus={true}
                        />
                </View>
            </View>
        </Section>
        <ScrollbarPadding />
    </KeyboardView>
    
}