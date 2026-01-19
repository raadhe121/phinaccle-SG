// Delete this for (app)/index to be the first route to be 
import { FormDatePicker, Label, Section } from '@/common/components/AntdText';
import KeyboardView from '@/common/components/KeyboardView';
import { Button } from '@ant-design/react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { modal } from '@/common/utils/modal';
import { useSession } from '@/ctx';
import { loginUser, verifyDobApi } from '@/apis/auth';
import { router } from 'expo-router';

export default function Page() {
    const { loginParams } = useSession();
    const [ dob, setDob ] = useState<string>();
    const [ isLoading, setIsLoading ] = useState(false);

    const verifyDob = async () => {
        if (!dob) return;

        setIsLoading(true);
        const resp = await verifyDobApi(
            { 
                sessionId: loginParams?.sessionId!,
                dateOfBirth: dob
            },
            (status, msg) => {
                modal.error({
                    title: msg.title ?? 'Unknown Error', 
                    content: msg.message ?? 'Please contact an administrator', 
                    labels: ["Try Again"],
                    onCancel: () => setDob(undefined),
                })
            }
        )
        if (resp) {
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
        }

        setIsLoading(false);
    }

    const action = <Button
            onPress={verifyDob}
            type="primary"
            disabled={!dob || isLoading}
            loading={isLoading}
            >
            Continue
        </Button>

    return <KeyboardView action={action} navBack={() => router.back()} title='Verify Date of Birth'>
        <Section title={<View style={{ height: 12 }} />}>
            <Label label="Date of Birth" wrap={false}>
                <FormDatePicker
                    value={dob}
                    onChange={(val) => setDob(val)}
                    placeholder="Select date of birth" />
            </Label>
        </Section>
    </KeyboardView>
}