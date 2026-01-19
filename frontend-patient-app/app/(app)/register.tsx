import React, { useEffect, useState } from 'react'
import { router } from 'expo-router';
import { Button, Input, PickerValue, Toast } from '@ant-design/react-native';
import { modal } from '@/common/utils/modal';
import { useSession } from '@/ctx';
import KeyboardView from '@/common/components/KeyboardView';
import { CMarkdown, FormDatePicker, FormPicker, H1Text, Height, Label, ListItemView, Section } from '@/common/components/AntdText';
import { loginUser, registerUserApi } from '@/apis/auth';
import dayjs from 'dayjs';
import { dateFormat } from '@/components/date_picker';
import { $SGiMedGender, $SGiMedLanguage, $SGiMedNationality } from '@/services/client/schemas.gen';

type RegisterFields = {
    name?: string;
    dob?: string;
    nationality?: string;
    language?: string;
    gender?: string;
}

const familyDependantWarning = `
**For family dependents :**
[]()
Do not fill up your dependents (eg. children, elderly parents) details here. If you want to get Telemedicine and/or walk-in queue number for your family dependents  please add them in **My Family** at the home screen. 
`.trim();

export default function RegisterScreen() {
    const { loginParams } = useSession();
    const [ name, setName ] = useState<string>();
    const [ dob, setDob ] = useState<string>();
    const [ nationality, setNationality ] = useState<PickerValue[]>();
    const [ language, setLanguage ] = useState<PickerValue[]>();
    const [ gender, setGender ] = useState<PickerValue[]>();
    const [ errors, setErrors ] = useState<RegisterFields>({});
    const [ submitPressedOnce, setSubmitPressedOnce ] = useState(false); // This is to only show errors after the first submit
    const [ isLoading, setIsLoading ] = useState(false);

    const validateRecords = () => {
        let errors: RegisterFields = {};
        if (!name) errors.name = 'Name is required';
        if (name && name.length < 3) errors.name = 'Name must be more than 3 characters';
        if (!dob) errors.dob = 'Date of birth is required';
        if (dob && dayjs().diff(dayjs(dob, dateFormat), 'year') < 12) errors.dob = 'You must be at least 12 years old';
        if (!nationality) errors.nationality = 'Nationality is required';
        if (!language) errors.language = 'Language is required';
        if (!gender) errors.gender = 'Gender is required';

        setErrors(errors);
        console.log(errors);
        return Object.keys(errors).length === 0;
    }

    useEffect(() => {
        if (submitPressedOnce) {
            validateRecords();
        }
    }, [name, dob, nationality, language, gender ])

    const onSubmit = async () => {
        setSubmitPressedOnce(true);        
        if (!validateRecords()) {
            Toast.fail({
                content: 'Please fix the errors above',
                duration: 1,
                stackable: true,
            })
            return;
        }

        setIsLoading(true);
        const resp = await registerUserApi(
            {
                sessionId: loginParams?.sessionId!,
                name: name!,
                dateOfBirth: dayjs(dob).format('YYYY-MM-DD'),
                nationality: nationality?.[0].toString()!,
                language: language?.[0].toString()!,
                gender: gender?.[0].toString()!
            },
            (status, msg) => {
                modal.error({
                    title: msg.title ?? 'Unknown Error', 
                    content: msg.message ?? 'Please contact an administrator', 
                    labels: ["Try Again"],
                    onCancel: () => console.log('Cancel'),
                })
            }
        )

        if (resp) {
            await loginUser(resp.token);
            while (router.canGoBack()) { // Pop from stack until one element is left
                router.back();
            }
            router.replace('/'); // Replace the last remaining stack element
        }
        setIsLoading(false);
    }

    const isDisabled = isLoading || (submitPressedOnce && Object.keys(errors).length > 0);
    const action = <Button type="primary" loading={isLoading} disabled={isDisabled} onPress={onSubmit}>Continue</Button>;

    return <KeyboardView action={action} navBack={() => router.back()} title='Personal Information'>
        <Section title={<Height h={24} />} bottom={8}>
            {/* <Label label='ID Type' wrap={false}>
                <FormPicker
                    disabled
                    data={idTypes.map((v) => ({ label: v, value: v }))}
                    value={[loginParams?.idType!]}
                    // onChange={(val) => setIdType(val[0] as IDType)}
                    placeholder="Select ID Type" />
            </Label>
            <Label label={idLabel[loginParams?.idType!] ?? 'ID No.'}>
                <Input
                    maxLength={9}
                    value={loginParams?.idNumber}
                    placeholder="Enter here"
                    disabled
                    style={{ color: colors.light}}
                />
            </Label> */}
            <Label label='Full Name' error={errors?.name}>
                <Input
                    allowClear
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter here"
                />
            </Label>
            <Label label='Date of Birth' wrap={false} error={errors?.dob}>
                <FormDatePicker
                    value={dob}
                    onChange={setDob}
                    placeholder="Select date of birth" />
            </Label>
            <Label label='Gender' wrap={false} error={errors?.gender}>
                <FormPicker
                    data={$SGiMedGender.enum.slice(0, 2).map(n => ({ label: n, value: n }))}
                    value={gender}
                    onChange={setGender}
                    placeholder="Select gender"
                />
            </Label>
            <Label label='Nationality' wrap={false} error={errors?.nationality}>
                <FormPicker
                    data={$SGiMedNationality.enum.map(n => ({ label: n, value: n }))}
                    value={nationality}
                    onChange={setNationality}
                    placeholder="Select nationality"
                />
            </Label>
            <Label label='Language spoken' wrap={false} error={errors?.language}>
                <FormPicker
                    data={$SGiMedLanguage.enum.map(n => ({ label: n, value: n }))}
                    value={language}
                    onChange={setLanguage}
                    placeholder="Select language"
                />
            </Label>
        </Section>

        <Section title={<Height h={12} />} bottom={24}>
            <ListItemView>
                <CMarkdown>{familyDependantWarning}</CMarkdown>
            </ListItemView>
        </Section>
    </KeyboardView>

}
