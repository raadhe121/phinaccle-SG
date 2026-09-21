import { Linking, TouchableHighlight, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router } from 'expo-router';
import { Button, Input, PickerValue, Toast } from '@ant-design/react-native';
import { useSession } from '@/ctx';
import KeyboardView from '@/common/components/KeyboardView';
import { CText, FormDatePicker, FormPicker, HeaderTitleTag, Height, Label, ReactQueryChild, Section } from '@/common/components/AntdText';
import { idLabel, idTypes, idValidators } from '@/apis/auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { $SGiMedGender, $SGiMedLanguage, $SGiMedNationality, ApiError, fetchProfileApiUserProfileGet, SGiMedICType, SGiMedLanguage, updateProfileApiUserProfilePost } from '@/services/client';
import { colors } from '@/common/utils/config';
import AntdMiniIcon from '@/common/components/AntdMiniIcon';

type RegisterFields = {
    ic_type?: string;
    nric?: string;
    name?: string;
    dob?: string;
    nationality?: string;
    language?: string;
    gender?: string;
}

export const UpdateProfileBanner = () => (
    <View style={{ margin: 12, backgroundColor: colors.alert, borderRadius: 4 }}>
        <View style={{ margin: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CText size={15} style={{ color: colors.warning, flexShrink: 1 }}>
                To update your data, please call
            </CText>
            <View style={{ borderWidth: 1, borderColor: colors.warning, borderRadius: 4, overflow: 'hidden' }}>
                <TouchableHighlight underlayColor={colors.underlay} onPress={() => Linking.openURL('tel:62351852')}>
                    <View style={{ margin: 12, marginTop: 4, marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                        <AntdMiniIcon name="PhoneOutline" size={13} color={colors.warning} />
                        <CText size={13} style={{ color: colors.warning }}>6235 1852</CText>
                    </View>
                </TouchableHighlight>
            </View>
        </View>
    </View>
)

export default function RegisterScreen() {
    const { user } = useSession();
    const [idType, setIdType] = useState<SGiMedICType>(idTypes[0]);
    const [nric, setNric] = useState<string>();
    const [name, setName] = useState<string>();
    const [dob, setDob] = useState<string>();
    const [nationality, setNationality] = useState<PickerValue[]>();
    const [language, setLanguage] = useState<PickerValue[]>();
    const [gender, setGender] = useState<PickerValue[]>();
    const [errors, setErrors] = useState<RegisterFields>({});
    const [submitPressedOnce, setSubmitPressedOnce] = useState(false); // This is to only show errors after the first submit

    const qry = useQuery({
        queryKey: ['profile'],
        queryFn: fetchProfileApiUserProfileGet
    })
    const updateMutation = useMutation({
        mutationFn: updateProfileApiUserProfilePost,
        onSuccess: () => {
            user?.updateProfile({ displayName: name });
            router.back()
        },
        onError: (error: ApiError) => {
            Toast.fail({
                content: (error.body as { detail?: string })?.detail ?? error.message,
                duration: 1,
                stackable: true,
            })
        }
    })


    useEffect(() => {
        if (!qry.data) return;

        setIdType(qry.data.ic_type);
        setNric(qry.data.nric);
        setName(qry.data.name);
        setDob(qry.data.date_of_birth);
        setNationality([qry.data.nationality]);
        setLanguage([qry.data.language]);
        setGender([qry.data.gender]);
    }, [qry.data])

    const validateId = (idType: SGiMedICType, nric: string) => {
        let idErrors: RegisterFields = {};
        if (!nric) idErrors.nric = idLabel[idType] + ' is required';
        else if (nric.length > 0 && !idValidators[idType].test(nric)) idErrors.nric = 'Please enter a valid ' + (idLabel[idType] ?? 'ID No.');
        console.log(idErrors, idType, nric)
        setErrors({ ...errors, nric: idErrors.nric });
    }


    const validateRecords = () => {
        let errors: RegisterFields = {};

        // if (!nric) errors.nric = 'NRIC is required';
        // else if (nric.length > 0 && !idValidators[idType].test(nric)) errors.nric = 'Please enter a valid ' + (idLabel[idType] ?? 'ID No.');

        // if (!name) errors.name = 'Name is required';
        // if (name && name.length < 3) errors.name = 'Name must be more than 3 characters';
        // if (!dob) errors.dob = 'Date of birth is required';
        // if (!nationality) errors.nationality = 'Nationality is required';
        if (!language) errors.language = 'Language is required';
        // if (!gender) errors.gender = 'Gender is required';

        setErrors(errors);
        console.log(errors);
        return Object.keys(errors).length === 0;
    }

    useEffect(() => {
        if (submitPressedOnce) {
            validateRecords();
        }
    }, [name, dob, nationality, language, gender])

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

        updateMutation.mutate({
            requestBody: {
                // ic_type: idType,
                // nric: nric!,
                // name: name!,
                // date_of_birth: dayjs(value.date_of_birth).format('YYYY-MM-DD'),
                // nationality: nationality?.[0].toString()! as SGiMedNationality,
                // marketing_opt_out: notificationsOptIn,
                language: language?.[0].toString()! as SGiMedLanguage,
                // gender: gender?.[0].toString()! as SGiMedGender
            }
        }
        );
    }

    const action = <Button type="primary" loading={updateMutation.isPending} disabled={updateMutation.isPending} onPress={onSubmit}>Continue</Button>

    return <KeyboardView
        action={action}
        navBack={() => router.back()}
        title={<HeaderTitleTag tag='My Profile' title='Personal Information' />}
    >
        <ReactQueryChild query={qry}>
            <Section title={<UpdateProfileBanner />}>
                <Label label='ID Type' wrap={false}>
                    <FormPicker
                        disabled
                        data={idTypes.map((v) => ({ label: v, value: v }))}
                        value={[idType]}
                        onChange={(val) => {
                            setIdType(val[0] as SGiMedICType);
                            validateId(val[0] as SGiMedICType, nric ?? '');
                        }}
                        placeholder="Select ID Type" />
                </Label>
                <Label label={idLabel[idType] ?? 'ID No.'} error={errors?.nric}>
                    <Input
                        disabled
                        style={{ color: colors.light }}
                        allowClear
                        value={nric}
                        onChangeText={(val) => {
                            setNric(val.toUpperCase());
                            validateId(idType, val.toUpperCase());
                        }}
                        placeholder="Enter here"
                    />
                </Label>
                <Label label='Full Name' error={errors?.name}>
                    <Input
                        disabled
                        style={{ color: colors.light }}
                        allowClear
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter here"
                    />
                </Label>
                <Label label='Date of Birth' wrap={false} error={errors?.dob}>
                    <FormDatePicker
                        disabled
                        value={dob}
                        onChange={setDob}
                        placeholder="Select date of birth" />
                </Label>
                <Label label='Nationality' wrap={false} error={errors?.nationality}>
                    <FormPicker
                        disabled
                        data={$SGiMedNationality.enum.map(n => ({ label: n, value: n }))}
                        value={nationality}
                        onChange={setNationality}
                        placeholder="Select nationality"
                    />
                </Label>
                <Label label='Gender' wrap={false} error={errors?.gender}>
                    <FormPicker
                        disabled
                        data={$SGiMedGender.enum.map(n => ({ label: n, value: n }))}
                        value={gender}
                        onChange={setGender}
                        placeholder="Select gender"
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
            <Height h={12} />
        </ReactQueryChild>
    </KeyboardView>
}
