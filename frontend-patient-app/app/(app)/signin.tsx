import React, { useState } from 'react'
import { Redirect, router } from 'expo-router';
import { View, useWindowDimensions, ScrollView, ImageBackground } from 'react-native'
import { Image } from 'expo-image'
import { Button, Input } from '@ant-design/react-native'
import { colors } from '@/common/utils/config';
import { useSession } from '@/ctx';
import KeyboardView from '@/common/components/KeyboardView';
import { CText, FormPicker, Height, Label, Section } from '@/common/components/AntdText';
import { idLabel, idTypes, idValidators, loginApi } from '@/apis/auth';
import { modal } from '@/common/utils/modal';
import dayjs from 'dayjs';
import Svg, { Path, SvgProps } from 'react-native-svg';
import { bgImages } from '@/common/components/AntdMiniIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SGiMedICType } from '@/services/client';

export function ArcComponent(props: SvgProps) {
    return (
        <View style={{ width: '100%', aspectRatio: 393 / 58 }}>
            <Svg width="100%" height="100%" viewBox="0 0 393 58" {...props}>
                <Path d="M0 58V58C119.898 -18.2712 273.102 -18.2712 393 58V58H232H145.5H0Z" fill={colors.action}/>
            </Svg>
        </View>
    );
}

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { user } = useSession();
    const { setLoginParams } = useSession();

    const [ isLoading, setIsLoading ] = useState(false);

    const [ idType, setIdType ] = useState<SGiMedICType>(idTypes[0]);
    const [ idNumber, setIdNumber ] = useState<string>('');
    const [ idNumberError, setIdNumberError ] = useState<string>();
    const [ mobileCode, setMobileCode ] = useState<string>('+65');
    const [ mobileNumber, setMobileNumber ] = useState<string>();
    const [ mobileNumberError, setMobileNumberError ] = useState<string>();

    const validateIdNumber = (idType: SGiMedICType, val: string) => {
        // val = val.substring(0, 9).toUpperCase();
        const upperVal = val.toUpperCase();
        setIdNumber(upperVal)
        let idNumberError = undefined;

        // Ignore empty values
        if (upperVal.length > 0 && !idValidators[idType].test(upperVal)) {
            idNumberError = 'Please enter a valid ' + (idLabel[idType] ?? 'ID No.');
        }

        // Check if NRIC is for children
        if (['PINK IC', 'BLUE IC'].includes(idType) && upperVal.length >= 3 && upperVal.startsWith("T")) {
            const currYear = dayjs().year();
            const yearPart = parseInt(upperVal.substring(1, 3), 10);
            const age = currYear - (2000 + yearPart); // Assuming NRIC year part is in the 2000s

            if (age < 12) {
                idNumberError = 'You must be at least 12 years old';
            }
        }

        setIdNumberError(idNumberError);
    }

    const validateMobileNumber = (val: string) => {
        val = val.substring(0, 8);
        setMobileNumber(val)
        let mobileNumberError = undefined;
        // Ignore empty values
        if (val.length > 0 && !/^[89]\d{7}$/.test(val)) {
            mobileNumberError = 'Please enter a valid phone number';
        }
        setMobileNumberError(mobileNumberError);
    }


    const onButtonPress = async () => {
        if (!idNumber || !mobileNumber || idNumberError || mobileNumberError) return;
        // router.navigate('/register');
        setIsLoading(true);
        const resp = await loginApi(
            { idType, idNumber, mobileCode, mobileNumber },
            (status, msg) => {
                console.log(msg);
                if (msg.code == 'invalid_login') {
                    modal.warn({
                        title: msg.title, 
                        content: msg.message, 
                        labels: ["Try Again", ""],
                        onCancel: () => console.log('Cancel'),
                    })
                } else {
                    // console.error(status, msg)
                    modal.error({
                        title: msg.title ?? 'Unknown Error', 
                        content: msg.message ?? 'Please contact an administrator', 
                        labels: ["Try Again", ""],
                        onCancel: () => console.log('Cancel'),
                    })
                }
            }
        );

        if (resp) {
            setLoginParams({
                idType,
                idNumber,
                mobileCode: mobileCode,
                mobileNumber,
                sessionId: resp.session_id, 
                otpExpiresAt: dayjs(resp.otp_expires_at)
            });
            router.navigate('/otp');
            setMobileNumber('');
        }
        setIsLoading(false);
    }

    const disableSubmit = idNumberError != null || mobileNumberError != null || !idNumber || !mobileNumber;

    if (user) {
        return <Redirect href="/" />;
    }

    const action = <Button
        onPress={onButtonPress}
        disabled={disableSubmit || isLoading}
        loading={isLoading}
        type="primary">
        Continue
    </Button>

    return (
        <ImageBackground style={{ flex: 1 }} source={bgImages.SplashScreen.uri} resizeMode='cover'>
            <KeyboardView action={action} hasKeyboard={false} wrapScroll={false} safeAreaBgColor='transparent'>
                <ScrollView
                    // stickyHeaderIndices={[0]}
                    // stickyHeaderHiddenOnScroll={true}
                    overScrollMode='never' // Android
                    bounces={false} // iOS
                    contentContainerStyle={{flexGrow: 1, justifyContent: 'space-between'}}
                    keyboardShouldPersistTaps='handled'
                    >
                        {/* <View>
                            <Image
                                source={bgImages.LoginHeader.uri}
                                resizeMode="cover"
                                style={{ width: '100%', height: width * bgImages.LoginHeader.height / bgImages.LoginHeader.width, zIndex: 10 }}
                                />
                        </View> */}
                        <Height h={insets.top} />
                        
                        <View style={{ marginBottom: -1 }}>
                            <ArcComponent />
                            <View style={{ backgroundColor: colors.action }}> 
                                <View style={{ width: '100%', backgroundColor: colors.action, alignItems: 'center' }}>
                                    <Image
                                        source={bgImages.HeaderLogo.uri}
                                        resizeMode="contain"
                                        style={{ margin: 12, width: width * 0.65, height: (width * 0.65) * bgImages.HeaderLogo.height / bgImages.HeaderLogo.width }}
                                    />
                                </View>
                                <Section title="Login / Sign Up">
                                    <Label label="ID Type" wrap={false}>
                                        <FormPicker
                                            data={idTypes.map((v) => ({ label: v, value: v }))}
                                            value={[idType]}
                                            onChange={(val) => {
                                                setIdType(val[0] as SGiMedICType)
                                                validateIdNumber(val[0] as SGiMedICType, idNumber)
                                            }}
                                            placeholder="Select ID Type" />
                                    </Label>
                                    <Label label={idLabel[idType] ?? 'ID No.'} error={idNumberError}>
                                        <Input
                                            allowClear
                                            // maxLength={9}
                                            value={idNumber}
                                            status={idNumberError != null ? "error" : undefined}
                                            onChangeText={(val) => validateIdNumber(idType, val)}
                                            placeholder="Enter here" />
                                    </Label>
                                    {/* <Label label="Country Code" wrap={false}>
                                        <FormPicker
                                            data={['+65'].map((v) => ({ label: v, value: v }))}
                                            disabled
                                            value={[mobileCode]}
                                            onChange={(val) => setMobileCode(val[0].toString())}
                                            placeholder="Select country code" />
                                    </Label> */}
                                    <Label label="Mobile Number" error={mobileNumberError}>
                                        <Input
                                            prefix={<CountryCode mobileCode={mobileCode}/>}
                                            type="number"
                                            maxLength={8}
                                            value={mobileNumber}
                                            status={mobileNumberError != null ? "error" : undefined}
                                            onChangeText={(val) => validateMobileNumber(val)}
                                            placeholder="Enter here" />
                                    </Label>
                                </Section>
                                <View style={{ height: 12 }} />
                            </View>
                        </View>
                </ScrollView>
            </KeyboardView>
        </ImageBackground>
    )
}

export const CountryCode = ({ mobileCode }: { mobileCode: string }) => {
    return <View style={{borderColor: colors.light, borderWidth: 1, borderRadius: 4}}>
        <CText size={13} style={{ margin: 4 }}>{mobileCode}</CText>
    </View>
}