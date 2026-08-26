import { View, Keyboard } from 'react-native'
import React, { useEffect, useState } from 'react'
import { OtpInput, OtpInputRef } from "react-native-otp-entry";
import { colors } from '@/common/utils/config';
import { Button, Toast } from '@ant-design/react-native';
import { modal } from '@/common/utils/modal';
import { useSession } from '@/ctx';
import KeyboardView from '@/common/components/KeyboardView';
import { router } from 'expo-router';
import { loginUser, resendOtpApi, verifyOtpApi } from '@/apis/auth';
import dayjs from 'dayjs';
import { BoldText, CText, Section } from '@/common/components/AntdText';

export default function MobileOtpScreen() {
    const { loginParams, setLoginParams } = useSession();
    const mobile = `${loginParams?.mobileCode} ${loginParams?.mobileNumber}`;

    const otpRef = React.useRef<OtpInputRef>(null);
    // const [seconds, setSeconds] = useState(5);
    const [otpSentTime, setOtpSentTime] = useState(new Date().getTime() / 1000);
    const [isVerifying, setIsVerifying] = useState(false);

    const [expiredModalDisplayed, setExpiredModalDisplayed] = useState(false);
    const seconds = Math.max(0, Math.round((loginParams?.otpExpiresAt?.diff() ?? 0) / 1000));
    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(Date.now())
        }, 1000);
        return () => clearInterval(timerId); // cleanup function to clear the interval when the component unmounts
    }, []);

    useEffect(() => {
        if (seconds === 0 && !expiredModalDisplayed && !isVerifying) {
            setExpiredModalDisplayed(true)
            modal.error({
                title: 'OTP Expired',
                content: 'Your OTP has expired. Please request a new code',
                labels: ['Cancel', 'Resend OTP'],
                onCancel: () => { },
                onOk: resendOtp,
            })
        }
    }, [time])


    const resendOtp = async () => {
        const resp = await resendOtpApi(
            { sessionId: loginParams?.sessionId! },
            (status, msg) => {
                if (msg.code === 'otp_resend_limit') {
                    modal.warn({
                        title: msg.title,
                        content: msg.message,
                        labels: ['Ok'],
                        onCancel: () => { },
                    })
                } else {
                    // console.error(status, msg)
                    modal.error({
                        title: msg.title ?? 'Unknown Error', 
                        content: msg.message ?? 'Please contact an administrator', 
                        labels: ["Try Again"],
                        onCancel: () => console.log('Cancel'),
                    })
                }
            }
        );

        if (resp) {
            Toast.success({
                content: 'OTP resent successfully',
                duration: 1,
                stackable: true,
            })
            setLoginParams({
                ...loginParams,
                otpExpiresAt: dayjs(resp.otp_expires_at),
            })
        }

        setExpiredModalDisplayed(false);
        setTimeout(() => {
            otpRef.current?.clear();
            otpRef.current?.focus();
        }, 500);

    }

    const verifyOtp = async (text: string) => {
        if (text.length !== 6) {
            return
        }

        setIsVerifying(true);
        Keyboard.dismiss();

        const key = Toast.loading({
            content: 'Loading...',
            duration: 10,
            // onClose: () => console.log('Load complete !!!'),
        })

        const resetState = () => {
            Toast.remove(key);
            setIsVerifying(false);
            otpRef.current?.clear();
            otpRef.current?.focus();
        }

        const resp = await verifyOtpApi({
            sessionId: loginParams?.sessionId!,
            otp: text,
        }, (code, msg) => {
            if (!['invalid_otp'].includes(msg?.code)) {
                console.error(code, msg)
            }
            modal.error({
                title: msg.title ?? 'Unknown Error',
                content: msg.message ?? 'Please contact an administrator',
                labels: ['Ok'],
                onCancel: resetState,
            })
        });

        if (!resp)
            return;

        if (resp.state === 'register') {
            router.replace('/register')
        } else if (resp.state === 'verify_dob') {
            router.replace('/verify_dob')
        } else if (resp.state === 'logged_in') {
            try {
                await loginUser(resp.token);
                while (router.canGoBack()) { // Pop from stack until one element is left
                    router.back();
                }
                // Open the profile/details page to update profile information
                router.replace('/'); // Replace the last remaining stack element
                setTimeout(() => router.navigate('/profile/details'), 100);
            } catch (error) {
                console.error(error)
                modal.error({
                    title: 'Failed to Login',
                    content: 'An error occurred. Please try again later.',
                    labels: ['Ok'],
                    onCancel: () => { },
                })
            }
        } else {
            console.error("OTP State: ", resp)
            modal.error({
                title: 'Unknown State',
                content: 'An unknown state was returned. Please contact an administrator.',
                labels: ['Ok'],
                onCancel: () => { },
            })
        }

        resetState();
    }

    const otpDisabled = seconds === 0 && !isVerifying;

    return (
        <KeyboardView navBack={() => router.back()} title='Enter OTP'>
            <Section title={<View style={{ height: 12 }}></View>}>
                <View style={{ margin: 12 }}>
                    <CText size={16} style={{ marginBottom: 12 }}>Enter the 6-digit code that is sent to you via Whatsapp on {mobile} (expires in {seconds}s)</CText>
                    <OtpInput
                        disabled={otpDisabled}
                        theme={{
                            pinCodeContainerStyle: {
                                backgroundColor: otpDisabled ? colors.brands4 : 'transparent'
                            },
                        }}
                        focusColor="grey"
                        numberOfDigits={6}
                        onTextChange={(_token) => verifyOtp(_token)}
                        ref={otpRef}
                    />

                    <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <BoldText>Did not receive code?</BoldText>
                        <Button type="ghost" onPress={resendOtp} style={{ height: 40 }}>
                            Resend Again
                        </Button>
                    </View>
                </View>
            </Section>
        </KeyboardView>
    )
}
