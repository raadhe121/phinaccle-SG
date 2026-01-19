import { TextStyle, View } from "react-native";
import { Image } from 'expo-image'
import { ActionButton, BoldText, Height, Label, ScrollbarPadding, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { router } from "expo-router";
import { forwardRef, ReactNode, useEffect, useRef, useState } from "react";
import { TextInput, TouchableHighlight } from "react-native";
import { useCreditCardForm } from "@/hooks/useCreditCardForm";
import { use2C2PHook } from '@/hooks/use2C2PPayment';
import { toast } from "@/common/utils/modal";
import { getPaymentMethodImg } from "@/common/components/AntdMiniIcon";

type CardFieldProps = {
    label: string;
    placeholder: string;
    value: string;
    onChange?: (v: string) => void;
    error?: string | boolean;
    testID?: string;
    textStyle?: TextStyle;
    suffix?: ReactNode;
    autoFocus?: boolean;
    disabled?: boolean;
}

export const CardField = forwardRef<TextInput, CardFieldProps>((props, ref) => {
    let _textStyle = {
        ...props.textStyle,
        padding: 12,
        paddingTop: 4,
        paddingBottom: props.error ? 4 : 12,
    }
    
    return <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'column', flexGrow: 1 }}>
            <Label label={props.label} error={props.error} wrap={false}>
                <TextInput
                    ref={ref}
                    keyboardType="numeric"
                    placeholderTextColor={colors.light}
                    autoCorrect={false}
                    placeholder={props.placeholder}
                    value={props.value}
                    onChangeText={props.onChange}
                    testID={props.testID}
                    style={_textStyle}
                    autoFocus={props.autoFocus}
                    editable={!props.disabled}
                    />
            </Label>
        </View>
        <View style={{ paddingRight: 12}}>
            {props.suffix}
        </View>
    </View>
})

const getErrorMsg = (field: string, status: string) => {
    const errorMapping: { [key: string]: { [key: string]: string } } = {
        'empty': {
            'number': 'Card number is required',
            'expiry': 'Expiry date is required',
            'cvc': 'CVC is required',
        },
        'unsupported': {
            'number': 'Only visa and mastercard are supported',
        },
        'incomplete': {
            'number': 'Invalid card number',
            'expiry': 'Expiry date is incomplete',
            'cvc': 'CVC is incomplete',
        },
        'invalid': {
            'number': 'Invalid card number',
            'expiry': 'Invalid expiry date',
            'cvc': 'Invalid CVC',
        }
    }
    return errorMapping?.[status]?.[field];
}

export default function Card2c2p() {
    const [ showErrors, setShowErrors ] = useState(false);
    const numberInput = useRef<TextInput>(null);
    const expiryInput = useRef<TextInput>(null);
    const cvcInput = useRef<TextInput>(null);
    
    const { values, status, onChangeValue } = useCreditCardForm({
        supportedCardTypes: ['visa', 'mastercard'],
        cardMaxLength: 16,
    });
    const { tokenizeCard } = use2C2PHook();

    // Focus on the next field when the current field is valid
    useEffect(() => {
        if (numberInput.current?.isFocused() && status.number === 'valid') expiryInput.current?.focus();
        if (expiryInput.current?.isFocused() && status.expiry === 'valid') cvcInput.current?.focus();
        // if (cvcInput.current?.isFocused() && status.cvc === 'valid') cvcInput.current?.blur();
    }, [values]);

    const onPress = async () => {
        if (!showErrors) setShowErrors(true);
        if (!valid) return;
        const close = toast.loading();
        await tokenizeCard(values)
        close();
    }
    const valid = Object.values(status).every(v => v === 'valid');
    const action = (
        <ActionButton
            onPress={onPress}
            title="Add Card"
            disabled={showErrors && !valid}
            />
    )

    return <KeyboardView
        action={action}
        navBack={() => router.back()}
        title='Card Details'
        >
            <Section title={<Height h={24} />}>
                <CardField
                    ref={numberInput}
                    textStyle={{ flexGrow: 1 }}
                    label="Card Number"
                    placeholder="1234 5678 1234 5678"
                    value={values.number}
                    onChange={(v) => onChangeValue('number', v)}
                    error={showErrors && getErrorMsg('number', status.number)}
                    testID="CC_NUMBER"
                    suffix={['visa', 'mastercard'].includes(values.type ?? '') && getPaymentMethodImg(values.type ?? '')}
                    autoFocus={true}
                    />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, flexDirection: 'column' }}>
                        <CardField
                            ref={expiryInput}
                            label="Expiration"
                            placeholder='MM/YY'
                            value={values.expiry}
                            onChange={(v) => onChangeValue('expiry', v)}
                            error={showErrors && getErrorMsg('expiry', status.expiry)}
                            testID="CC_EXPIRY"
                            />
                    </View>

                    <View style={{ flex: 1, flexDirection: 'column' }}>
                        <CardField
                            ref={cvcInput}
                            label="CVC"
                            placeholder='CVC'
                            value={values.cvc}
                            onChange={(v) => onChangeValue('cvc', v)}
                            error={showErrors && getErrorMsg('cvc', status.cvc)}
                            testID="CC_CVC"
                            suffix={<Image source={require('@/assets/images/payments/cvv.png')} style={{ width: 30, height: 22, resizeMode: 'contain'}} />}
                            />
                    </View>
                </View>
            </Section>
            <ScrollbarPadding />
        </KeyboardView>
    
}