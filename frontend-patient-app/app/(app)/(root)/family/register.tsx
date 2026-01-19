import { FormDatePicker, FormPicker, HeaderTitleTag, Height, Label, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { Button, Input } from "@ant-design/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { $SGiMedGender, $SGiMedLanguage, $SGiMedNationality, $SGiMedNokRelation, PhoneCountryCode, registerFamilyApiFamilyRegisterPost, SGiMedGender, SGiMedLanguage, SGiMedNationality, SGiMedNokRelation, VerifyFamilyReq } from "@/services/client";
import { idLabel } from "@/apis/auth";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { onError } from "@/common/utils/lib";
import { useForm } from "@tanstack/react-form";
import { phoneCountryCodes } from "@/apis/user";

export default function FamilyRegisterScreen() {
    const { id_type, nric, date_of_birth, relation }: VerifyFamilyReq = useLocalSearchParams();
    const [showErrors, setShowErrors] = useState(false);

    // TanStack Mutation
    const updateMutation = useMutation({
        mutationFn: registerFamilyApiFamilyRegisterPost,
        onSuccess: (resp, req) => {
            // Drop two screens
            router.back();
            router.back();
        },
        onError
    })

    // TanStack Form - All shall be snake case matching mutation
    const form = useForm({
        // Types defined here
        defaultValues: {
            id_type,
            nric,
            date_of_birth,
            relation,
            name: '',
            gender: '' as SGiMedGender,
            nationality: '' as SGiMedNationality,
            language: '' as SGiMedLanguage,
            secondary_mobile_code: '' as PhoneCountryCode,
            secondary_mobile_number: '',
        },
        onSubmit: async ({ value }) => {
            updateMutation.mutate({ requestBody: value });
        },
        validators: {
            // Add validators to the form the same way you would add them to a field
            onChange({ value }) {
                return {
                    fields: {
                        relation: !value.relation ? 'Relation is required' : undefined,
                        name: !value.name ? 'Name is required' : undefined,
                        gender: !value.gender ? 'Gender is required' : undefined,
                        nationality: !value.nationality ? 'Nationality is required' : undefined,
                        language: !value.language ? 'Language is required' : undefined,
                        secondary_mobile_code: !value.secondary_mobile_code ? 'Country code is required' : undefined,
                        secondary_mobile_number: !value.secondary_mobile_number ? 'Mobile is required' : undefined,
                    },
                }
            },
        },
    });

    const action = (
        <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
                <Button
                    type="primary"
                    loading={updateMutation.isPending}
                    disabled={updateMutation.isPending || (showErrors && !canSubmit)}
                    onPress={() => {
                        setShowErrors(true);
                        form.handleSubmit()
                    }}
                    >
                    Save
                </Button>
            )}
        />
    )

    return <KeyboardView
        navBack={router.back}
        action={action}
        title={<HeaderTitleTag tag='My Family' title='Add Family Member' />}
        >
        <Section title={<Height h={24} />} bottom={12}>
            <Label label='ID Type' wrap={false}>
                <FormPicker value={[id_type]} disabled />
            </Label>
            <Label label={idLabel[id_type] ?? 'ID No.'}>
                <Input value={nric} disabled style={{ color: colors.light}} />
            </Label>
            <Label label='Date of Birth' wrap={false}>
                <FormDatePicker disabled value={date_of_birth} />
            </Label>

            <Label label='Relation' wrap={false}>
                <FormPicker value={[relation]} disabled />
            </Label>

            <form.Field
                name="name"
                children={(field) => (
                    <Label label='Full Name' error={showErrors && field.state.meta.errors?.join(', ')}>
                        <Input
                            allowClear
                            value={field.state.value}
                            onChangeText={field.handleChange}
                            placeholder="Enter here"
                        />
                    </Label>
                )}
                />

            <form.Field
                name="gender"
                children={(field) => (
                    <Label label='Gender' wrap={false} error={showErrors && field.state.meta.errors?.join(', ')}>
                        <FormPicker
                            data={$SGiMedGender.enum.slice(0, 2).map(n => ({ label: n, value: n }))}
                            value={field.state.value ? [field.state.value] : undefined}
                            onChange={(val) => field.handleChange(val[0] as SGiMedGender)}
                            placeholder="Select gender"
                        />
                    </Label>
                )}
                />

            <form.Field
                name="nationality"
                children={(field) => (
                    <Label label='Nationality' wrap={false} error={showErrors && field.state.meta.errors?.join(', ')}>
                        <FormPicker
                            data={$SGiMedNationality.enum.map(n => ({ label: n, value: n }))}
                            value={field.state.value ? [field.state.value] : undefined}
                            onChange={(val) => field.handleChange(val[0] as SGiMedNationality)}
                            placeholder="Select nationality"
                        />
                    </Label>
                )}
                />

            <form.Field
                name="language"
                children={(field) => (
                    <Label label='Language spoken' wrap={false} error={showErrors && field.state.meta.errors?.join(', ')}>
                        <FormPicker
                            data={$SGiMedLanguage.enum.map(n => ({ label: n, value: n }))}
                            value={field.state.value ? [field.state.value] : undefined}
                            onChange={(val) => field.handleChange(val[0] as SGiMedLanguage)}
                            placeholder="Select language"
                            />
                    </Label>
                )}
                />

            <form.Field
                name="secondary_mobile_code"
                children={(field) => (
                    <Label label="Country Code" wrap={false} error={showErrors && field.state.meta.errors?.join(', ')}>
                        <FormPicker
                            data={phoneCountryCodes}
                            value={field.state.value ? [field.state.value] : undefined}
                            onChange={(val) => field.handleChange(val[0] as PhoneCountryCode)}
                            placeholder="Select country code"
                            />
                    </Label>
                )}
                />

            <form.Field
                name="secondary_mobile_number"
                children={(field) => (
                    <Label label='Mobile Number' error={showErrors && field.state.meta.errors?.join(', ')}>
                        <Input
                            allowClear
                            type="number"
                            value={field.state.value}
                            onChangeText={field.handleChange}
                            placeholder="Enter here"
                        />
                    </Label>
                )}
                />
        </Section>
    </KeyboardView>
}