import { FormDatePicker, FormPicker, HeaderTitleTag, Height, Label, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { $SGiMedICType, $SGiMedNokRelation, SGiMedICType, SGiMedNokRelation, verifyFamilyApiFamilyVerifyPost } from "@/services/client";
import { Button, Input } from "@ant-design/react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from '@tanstack/react-form'
import { idLabel, idValidators } from "@/apis/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { onError } from "@/common/utils/lib";

export default function FamilyCreateScreen() {
    const [showErrors, setShowErrors] = useState(false);

    // TanStack Mutation
    const queryClient = useQueryClient();
    const updateMutation = useMutation({
        mutationFn: verifyFamilyApiFamilyVerifyPost,
        onSuccess: (resp, req) => {
            if (resp.is_new_user) {
                router.navigate({ pathname: '/family/register', params: req.requestBody });
            } else {
                queryClient.invalidateQueries({ queryKey: ['family'] });
                router.back();
            }
        },
        onError
    })
    // TanStack Form
    const form = useForm({
        defaultValues: {
            id_type: '' as SGiMedICType,
            nric: '',
            date_of_birth: '',
            relation: '' as SGiMedNokRelation,
        },
        onSubmit: async ({ value }) => {
            updateMutation.mutate({
                requestBody: {
                    id_type: value.id_type,
                    nric: value.nric,
                    date_of_birth: value.date_of_birth,
                    relation: value.relation,
                }
            });

        },
        validators: {
            // Add validators to the form the same way you would add them to a field
            onChange({ value }) {
                const validateNric = (idType: SGiMedICType | null, nric: string) => {
                    if (!nric) return (idType ? idLabel[idType] : 'ID number') + ' is required';
                    if (idType && nric.length > 0 && !idValidators[idType].test(nric)) return 'Please enter a valid ' + (idLabel[idType]);
                }

                return {
                    fields: {
                        id_type: !value.id_type ? 'ID type is required' : undefined,
                        nric: validateNric(value.id_type, value.nric),
                        date_of_birth: !value.date_of_birth ? 'Date of birth is required' : undefined,
                        relation: !value.relation ? 'Relation is required' : undefined,
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
            <form.Field
                name="id_type"
                children={(field) => (
                    <Label label='ID Type' wrap={false} error={showErrors && field.state.meta.errors?.join(', ')}>
                        <FormPicker
                            data={$SGiMedICType.enum.map((v) => ({ label: v, value: v }))}
                            value={field.state.value ? [field.state.value] : undefined}
                            onChange={(val) => field.handleChange(val[0] as SGiMedICType)}
                            placeholder="Select ID Type"
                            />
                    </Label>
                )}
                />
            
            <form.Field
                name="nric"
                children={(field) => (
                    <Label label={idLabel[field.form.getFieldValue('id_type') as SGiMedICType] ?? 'ID No.'} error={showErrors && field.state.meta.errors?.join(', ')}>
                        <Input
                            maxLength={20}
                            value={field.state.value}
                            placeholder="Enter here"
                            onChangeText={(val) => field.handleChange(val)}
                        />
                    </Label>
                )}
                />
            
            <form.Field
                name="date_of_birth"
                children={(field) => (
                    <Label label='Date of Birth' wrap={false} error={showErrors && field.state.meta.errors?.join(', ')}>
                        <FormDatePicker
                            value={field.state.value}
                            onChange={(val) => field.handleChange(val)}
                            placeholder="Select date of birth" />
                    </Label>
                )}
                />                

            <form.Field
                name="relation"
                children={(field) => (
                    <Label label='Relation' wrap={false} error={showErrors && field.state.meta.errors?.join(', ')}>
                        <FormPicker
                            data={$SGiMedNokRelation.enum.map(n => ({ label: n, value: n }))}
                            value={field.state.value ? [field.state.value] : undefined}
                            onChange={(val) => field.handleChange(val[0] as SGiMedNokRelation)}
                            placeholder="Select Relationship" />
                    </Label>
                )}
                />

        </Section>
    </KeyboardView>
}