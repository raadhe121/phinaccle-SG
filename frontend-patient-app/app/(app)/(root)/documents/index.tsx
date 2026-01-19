import { BoldText, CCheckbox, CMarkdown, CText, H1Text, Height, Label, ListItemView, NavHeader3, Section, TitleText } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { ApiError, validateCodeApiDocumentValidateCodePost } from "@/services/client";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, TouchableHighlight } from "react-native";
import { Button, Input } from "@ant-design/react-native";
import { onError } from "@/common/utils/lib";
import { getItem, localStorageDocumentCodeKey, setItem } from "@/common/utils/async_storage";
import { useForm } from "@tanstack/react-form";
import { useDocument } from "@/providers/documents";

export default function DocumentPasswordScreen() {
    const { route } = useLocalSearchParams();
    const [ showErrors, setShowErrors ] = useState(false);
    const [ rememberCode, setRememberCode ] = useState(false);
    const { code, setCode, loading } = useDocument();
    // If code is loaded within the provider, redirect to the main page
    useEffect(() => {
        if (code) router.replace(route as any);
    }, [code]);

    // TanStack Form
    const form = useForm({
        defaultValues: {
            code: '',
        },
        onSubmit: async ({ value }) => {
            validateMutation.mutate({
                requestBody: { code: value.code }
            });
        },
        validators: {
            // Add validators to the form the same way you would add them to a field
            onChange({ value }) {
                const validateCode = (code: string) => {
                    if (!code) return 'Code is required';
                    if (code.length != 10) return 'Code is invalid';
                }

                return {
                    fields: {
                        code: validateCode(value.code),
                    },
                }
            },
        },
    });

    const validateMutation = useMutation({
        mutationFn: validateCodeApiDocumentValidateCodePost,
        onSuccess: async (data, vars) => {
            const _code = vars.requestBody.code;
            // Save the code to local storage
            if (rememberCode && _code != await getItem(localStorageDocumentCodeKey)) {
                setItem(localStorageDocumentCodeKey, { code: _code })
            }
            setCode(_code);
            router.replace(route as any);
        },
        onError: (error: ApiError) => {
            // setLoading(false);
            onError(error);
        }
    });

   // If code is being validated thus loading, render an empty screen
    if (loading) {
        return <View></View>
    }

    const action = (
        <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
                <Button
                    type="primary"
                    loading={validateMutation.isPending}
                    disabled={validateMutation.isPending || (showErrors && !canSubmit)}
                    onPress={() => {
                        setShowErrors(true);
                        form.handleSubmit()
                    }}
                    >
                    Continue
                </Button>
            )}
        />
    )

    return <KeyboardView
        action={action} 
        navBack={router.back}
        header={<NavHeader3 navBack={router.back} />}
        >
        <Section title={<TitleText>Enter access code to view documents</TitleText>}>

            <form.Field
                name="code"
                children={(field) => (
                    <Label label='Access Code' error={showErrors && field.state.meta.errors?.join(', ')}>
                        <Input
                            maxLength={20}
                            value={field.state.value}
                            placeholder="123A311094"
                            onChangeText={(val) => field.handleChange(val.trim().toUpperCase())}
                        />
                    </Label>
                )}
                />
            
            {/* Not part form as locally tracked and not submitted to server */}
            <TouchableHighlight underlayColor={colors.underlay} onPress={() => setRememberCode(!rememberCode)}>
                <ListItemView thumb={<CCheckbox checked={rememberCode} />}>
                    <BoldText style={{ marginLeft: 8 }}>Trust this device</BoldText>
                    <CText style={{ marginLeft: 8 }}>So that you do not have to enter access code again</CText>
                </ListItemView>
            </TouchableHighlight>
        </Section>

        <Section title={<Height h={12} />}>
            <CMarkdown style={{ margin: 12 }}>{
`**What's my access code?**
[]()
Enter the last 4 digits of your NRIC and your date of birth (DDMMYY).
[]()
Example access code:
**123F020419**
[]()
123F = last 4 digits of NRIC
020419 is date of birth in DDMMYY format`
            }</CMarkdown>  
        </Section>
        <Height h={12} />
    </KeyboardView>
}
