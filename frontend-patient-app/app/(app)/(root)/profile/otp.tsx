import { View, StyleSheet, Keyboard } from 'react-native'
import React, { useEffect, useState } from 'react'
import { OtpInput, OtpInputRef } from "react-native-otp-entry";
import { Button, Toast } from '@ant-design/react-native';
import { useSession } from '@/ctx';
import KeyboardView from '@/common/components/KeyboardView';
import { router, useLocalSearchParams } from 'expo-router';
import dayjs, { Dayjs } from 'dayjs';
import { modal } from '@/common/utils/modal';
import { resendOtpApi, verifyOtpApi } from '@/apis/user';
import { colors } from '@/common/utils/config';
import { H1Text, H3Text, Height, MText, Section } from '@/common/components/AntdText';

const styles = StyleSheet.create({
    baseText: {
        fontFamily: 'Cochin',
    },
    bottomContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: 'white',
    }
});

export default function MobileOtpScreen() {
    const { user } = useSession();
    const { sessionId, otpExpiresAt, mobileCode, mobileNumber } = useLocalSearchParams();
    const [ otpExpiresAtState, setOtpExpiresAtState ] = useState<Dayjs>(dayjs(otpExpiresAt?.toString()));
    const mobile = `${mobileCode} ${mobileNumber}`;

    const otpRef = React.useRef<OtpInputRef>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const [expiredModalDisplayed, setExpiredModalDisplayed] = useState(false);
    const seconds = Math.max(0, Math.round((otpExpiresAtState.diff() ?? 0) / 1000));
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
            { sessionId: sessionId!.toString() },
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
            setOtpExpiresAtState(dayjs(resp.otp_expires_at));
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
            sessionId: sessionId!.toString(),
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

        if (resp) {
            router.back()
        }
        resetState();
    }

    const otpDisabled = seconds === 0 && !isVerifying;

    return (
        <KeyboardView navBack={() => router.back()} title='Enter OTP'>
            <Section title={<Height h={12} />}>
                <View style={{ margin: 12 }}>
                    <MText style={{ marginBottom: 12 }}>Enter the 6-digit code that is sent to you via SMS on {mobile} (expires in {seconds}s)</MText>
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
                        <H3Text>Did not receive code?</H3Text>
                        <Button type="ghost" onPress={resendOtp} style={{ height: 40 }}>
                            Resend Again
                        </Button>
                    </View>
                </View>
            </Section>
        </KeyboardView>
    )
}
