import React, { useState } from 'react'
import { Dimensions, Image, Platform, ScrollView, TextInput, TouchableHighlight, useWindowDimensions, View } from 'react-native'
import { supabase } from '../lib/supabase'
import KeyboardView from '../common/components/KeyboardView'
import { Input } from '@ant-design/react-native'

const logo = require('../common/assets/signin-logo.png')
import Svg, { Path, SvgProps } from 'react-native-svg';
import { GRButton, Height, Label, Section, TitleText } from '../common/components/AntdText'
import { colors } from '../common/utils/config'
import { modal } from '../common/utils/modal'
import AntdMiniIcon, { bgImages } from '../common/components/AntdMiniIcon'

export function ArcComponent(props: SvgProps) {
    const width = Dimensions.get('window').width
    const height = width * 58 / 393
    return (
        <Svg width={width} height={height} preserveAspectRatio="xMinYMin slice" viewBox="0 0 393 58" {...props}>
            <Path d="M0 58V58C119.898 -18.2712 273.102 -18.2712 393 58V58H232H145.5H0Z" fill={colors.action} />
        </Svg>
    );
}

export default function LoginScreen() {
    const { width } = useWindowDimensions();
    const [isLoading, setIsLoading] = useState(false)

    const [email, setEmail] = useState<string>()
    const [emailError, setEmailError] = useState<string>()
    const [password, setPassword] = useState<string>('12345')
    const [passwordError, setPasswordError] = useState<string>()
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    async function signInWithEmail() {
        if (!email || !password) return;

        setIsLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })
        if (error) {
            modal.warn({
                title: "Login Failed",
                content: error.message,
                labels: ["Try Again"],
                onCancel: () => { },
            })
        }
        setIsLoading(false)
    }

    const validateEmail = (val: string) => {
        setEmail(val)
        let emailError = undefined;
        if (val.length > 0 && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/.test(val)) {
            emailError = 'Please enter a valid email';
        }
        setEmailError(emailError);
    }

    const validatePassword = (val: string) => {
        if (!val) setPasswordError('Please enter a password');
        setPassword(val)
    }

    const action = <GRButton type='primary' title="Login" onPress={signInWithEmail} loading={isLoading} disabled={!email || !password} />

    return (
        <KeyboardView action={action} hasKeyboard={false} wrapScroll={false}>
            <ScrollView
                stickyHeaderIndices={[0]}
                stickyHeaderHiddenOnScroll={true}
                overScrollMode='never' // Android
                bounces={false} // iOS
                contentContainerStyle={{flexGrow: 1, justifyContent: 'space-between'}}
                keyboardShouldPersistTaps='handled'
                >
                <View>
                    <Image
                        source={bgImages.LoginHeader.uri}
                        resizeMode="cover"
                        style={{ width: '100%', height: width * bgImages.LoginHeader.height / bgImages.LoginHeader.width, zIndex: 10 }}
                    />
                </View>
                <View style={{ alignSelf: 'center' }}>
                    <Image
                        source={bgImages.HeaderLogo.uri}
                        resizeMode="contain"
                        style={{ width: 320, height: 320 * bgImages.HeaderLogo.height / bgImages.HeaderLogo.width }}
                    />
                </View>
                <View>
                    <View style={{ bottom: -32, zIndex: 10, alignItems: 'center' }}>
                        <View style={{ flexDirection: 'column', borderWidth: 1, borderColor: colors.brands2, borderRadius: 6, margin: 8, backgroundColor: 'white' }}>
                            <TitleText style={{ color: colors.brands2, margin: 8 }}>Doctor's App</TitleText>
                        </View>
                    </View>
                    <View style={{ marginBottom: -1 }}>
                        <ArcComponent />
                    </View>
                    <View style={{ backgroundColor: colors.action, marginBottom: -1 }}>
                        <Section title="Login">
                            <Label label="Email" error={emailError}>
                                <Input
                                    allowClear
                                    value={email}
                                    status={emailError != null ? "error" : undefined}
                                    onChangeText={(val) => validateEmail(val)}
                                    placeholder="Enter here" />
                            </Label>
                            <Label label="Password" error={passwordError}>
                                <Input
                                    type="password"
                                    secureTextEntry={!isPasswordVisible}
                                    // value={"12345"}
                                    status={passwordError != null ? "error" : undefined}
                                    onChangeText={(val) => validatePassword(val)}
                                    placeholder="Enter here"
                                    suffix={
                                        Platform.OS !== 'ios' && <TouchableHighlight underlayColor={colors.underlay} onPress={() => setIsPasswordVisible((val) => !val)}>
                                            <AntdMiniIcon name={isPasswordVisible ? 'EyeInvisibleOutline' : 'EyeOutline'} size={24} />
                                        </TouchableHighlight>
                                    }
                                />
                            </Label>
                        </Section>
                        <Height h={12} />
                    </View>
                </View>
            </ScrollView>
        </KeyboardView>
    )
}
