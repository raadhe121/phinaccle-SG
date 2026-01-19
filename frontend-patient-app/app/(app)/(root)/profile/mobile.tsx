import { fetchMobileApi, phoneCountryCodes, updateMobileApi } from "@/apis/user";
import { defaultOnError, toast } from "@/common/utils/modal";
import { FormPicker, HeaderTitleTag, Height, Label, Section, TitleText } from "@/common/components/AntdText";
import KeyboardView from '@/common/components/KeyboardView';
import { Button, Input, PickerValue, Toast } from "@ant-design/react-native";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ApiError, PhoneCountryCode, updateMobileApiUserMobilePost } from "@/services/client";
import { useMutation } from "@tanstack/react-query";

export default function MobileScreen() {
    const currMobileNumber = useRef<{ mobile_code: string, mobile_number: string }>();
    const [ mobileCode, setMobileCode ] = useState<PickerValue[]>(['+65']);
    const [ mobileNumber, setMobileNumber ] = useState<string>();
    const [ mobileNumberError, setMobileNumberError ] = useState<string>();

    const [ secondaryMobileCode, setSecondaryMobileCode ] = useState<PickerValue[]>();
    const [ secondaryMobileNumber, setSecondaryMobileNumber ] = useState<string>();

    const [ email, setEmail ] = useState<string>();
    const [ emailError, setEmailError ] = useState<string>();

    useEffect(() => {
        const fetchMobile = async () => {
            const close = toast.loading();
            const resp = await fetchMobileApi(defaultOnError);
            if (resp) {
                currMobileNumber.current = resp;  
                setMobileCode([resp.mobile_code]);
                setMobileNumber(resp.mobile_number);
                setSecondaryMobileCode(resp.secondary_mobile_code ? [resp.secondary_mobile_code] : undefined);
                setSecondaryMobileNumber(resp.secondary_mobile_number);
                setEmail(resp.email);
            }
            close();
        }
        fetchMobile();
    }, [])

    const updateMutation = useMutation({
        mutationFn: updateMobileApiUserMobilePost,
        onSuccess: (data, vars) => {
            if (data.session_id) {
                const body = vars.requestBody;
                const params = {
                    sessionId: data.session_id,
                    otpExpiresAt: data.otp_expires_at,
                    mobileCode: body.mobile_code,
                    mobileNumber: body.mobile_number,
                }
                router.replace({ pathname: '/profile/otp', params });
            } else {
                router.back();
            }
            
        },
        onError: (error: ApiError) => {
            Toast.fail({
                content: (error.body as { detail?: string })?.detail ?? error.message,
                duration: 1,
                stackable: true,
            })
        }
    })

    const updateMobile = async () => {
        updateMutation.mutate({
            requestBody: {
                mobile_code: mobileCode[0].toString() as PhoneCountryCode,
                mobile_number: mobileNumber!,
                secondary_mobile_code: secondaryMobileCode ? secondaryMobileCode[0].toString() as PhoneCountryCode : undefined,
                secondary_mobile_number: secondaryMobileCode ? secondaryMobileNumber : undefined,
                email: email,
            }
        })
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

    const validateEmail = (val: string) => {
        console.log("Clearing")
        setEmail(val)
        let emailError = undefined;
        // Ignore empty values
        const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (val.length > 0 && !emailRegex.test(val)) {
            emailError = 'Please enter a valid email address';
        }
        setEmailError(emailError);
    }


    const action = <Button
            onPress={updateMobile}
            type="primary"
            disabled={mobileNumberError != null || !mobileNumber || !mobileCode || emailError != null || updateMutation.isPending}
            loading={updateMutation.isPending}
            >
            Update
        </Button>

    return <KeyboardView
        action={action}
        navBack={() => router.back()}
        title={<HeaderTitleTag tag='My Profile' title='Contact Details' />}
        >
        <Section title={<TitleText style={{ marginTop: 24 }}>Primary Mobile</TitleText>}>
            <Label label="Country Code" wrap={false}>
                <FormPicker
                    data={['+65'].map((v) => ({label: v, value: v}))}
                    value={mobileCode}
                    onChange={setMobileCode}
                    placeholder="Select country code"
                    disabled
                    />
            </Label>
            <Label label="Mobile Number" error={mobileNumberError}>
                <Input
                    allowClear
                    type="number"
                    status={emailError != null ? "error" : undefined}
                    maxLength={8}
                    value={mobileNumber}
                    onChangeText={validateMobileNumber}
                    placeholder="Enter here"
                    />
            </Label>
        </Section>

        {/* Secondary Mobile */}
        <Section title={<TitleText style={{ marginTop: 12 }}>Secondary Mobile</TitleText>}>
            <Label label="Country Code" wrap={false}>
                <FormPicker
                    data={phoneCountryCodes}
                    value={secondaryMobileCode}
                    onChange={setSecondaryMobileCode}
                    placeholder="Select country code"
                    />
            </Label>
            <Label label="Mobile Number">
                <Input
                    allowClear
                    type="number"
                    value={secondaryMobileNumber}
                    onChangeText={setSecondaryMobileNumber}
                    placeholder="Enter here"
                    />
            </Label>
        </Section>

        {/* Email */}
        <Section title={<TitleText style={{ marginTop: 12 }}>Email</TitleText>}>
            <Label label="Email Address" error={emailError}>
                <Input
                    allowClear
                    status={emailError != null ? "error" : undefined}
                    value={email}
                    onChangeText={validateEmail}
                    placeholder="Enter here"
                    />
            </Label>
        </Section>
        <Height h={12} />
    </KeyboardView>
}