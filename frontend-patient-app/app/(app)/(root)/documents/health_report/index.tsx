import React, { useState } from 'react';
import { TouchableHighlight, ScrollView } from 'react-native';
import { BoldText, CMarkdown, Section, ListItemView, CCheckbox, ErrorText, NavHeader3, TitleText, Height } from '@/common/components/AntdText';
import { GRButton } from '@/common/components/AntdText';
import KeyboardView from '@/common/components/KeyboardView';
import { colors } from '@/common/utils/config';
import { router, useLocalSearchParams } from 'expo-router';
import { acceptDisclaimerApiHealthReportReportDisclaimerAcceptPost } from '@/services/client';
import { useMutation } from '@tanstack/react-query';
import { getDocumentAccessCode } from '@/providers/documents';
import { onError } from '@/common/utils/lib';
import { toast } from '@/common/utils/modal';

const disclaimerText = `
**Health Report**
The health report is generated based on common test profiles and their key components.  Please note that this summary is not exhaustive and should not be interpreted in isolation. It may not include all blood tests in the full laboratory report. For a comprehensive assessment, please refer to the detailed laboratory report and seek medical advice for professional interpretation.
`.trim();

const disclaimerText2 = `
**Disclaimer of warranties**
The product and content are provided on an "as is" basis. Pinnacle Family Clinic expressly disclaim all warranties of any kind with respect to the product or content, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, title and non-infringement. Pinnacle Family Clinic makes no warranty that the product and/or any content therein will meet your requirements, or will be uninterrupted, timely, secure, current, accurate, complete or error-free or the results may be obtained by use of the product or any content therein will be accurate or reliable. You understand and acknowledge that your sole and exclusive remedy with respect to any defect in or dissatisfaction with the product is to cease its use.
[]()
The content on the product is presented as an educational service intended for licensed healthcare professionals. While the content in the product is about specific medical and healthcare issues, the content is not a substitute for, or replacement of personalized medical advice and is not intended to be used as the sole bases for making individualized medical or health related decisions. The contents provided by the product are solely based on published clinical studies and clinical guidelines, and do not represent a Pinnacle Family Clinic endorsement or evaluation of these studies. The content on the product is not intended to present the only, or necessarily the best, methods, or procedures for the medical situations addressed. Any reference to a specific therapy or commercial product or service in this product does not constitute a guarantee or endorsement by Pinnacle Family Clinic of the quality or value of such a therapy or product or service or any claims made by the manufacturer or provider of such therapy or commercial product or service.
`.trim();

export default function DisclaimerScreen() {
    const { id } = useLocalSearchParams();
    const { code } = getDocumentAccessCode();
    const [formVals, setFormVals] = useState({ tncChecked: false });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Mutation for accepting disclaimer
    const acceptDisclaimerMutation = useMutation({
        mutationFn: () => acceptDisclaimerApiHealthReportReportDisclaimerAcceptPost({
            requestBody: { id: id as string, code }
        }),
        onSuccess: () => {
            // Navigate to health report screen after accepting
            router.back();
            router.navigate({
                pathname: '/documents/health_report/report',
                params: { id }
            });
        },
        onError
    });

    const setFormVal = (key: string, value: any) => {
        setFormVals(prev => ({ ...prev, [key]: value }));
        // Clear error when value is set
        if (formErrors[key]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        
        if (!formVals.tncChecked) {
            toast.fail('Please acknowledge the disclaimer at the bottom of the page');
            errors.tncChecked = 'Please acknowledge the disclaimer';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleViewReport = () => {
        if (validateForm()) {
            acceptDisclaimerMutation.mutate();
        }
    };

    const action = (
        <GRButton
            onPress={handleViewReport}
            type="primary"
            loading={acceptDisclaimerMutation.isPending}
            disabled={acceptDisclaimerMutation.isPending || Object.keys(formErrors).length > 0}
            title="View Report"
        />
    );

    return (
        <KeyboardView
            action={action}
            header={<NavHeader3 navBack={router.back} />}
            wrapScroll={false}
            >
            <ScrollView>
                <Section title={<TitleText>Disclaimer Acknowledgement</TitleText>}>
                    <CMarkdown style={{ margin: 12 }}>
                        {disclaimerText}
                    </CMarkdown>
                    <CMarkdown style={{ margin: 12 }}>
                        {disclaimerText2}
                    </CMarkdown>
                    <TouchableHighlight underlayColor={colors.underlay} onPress={() => setFormVal('tncChecked', !formVals.tncChecked)}>
                        <>
                            <ListItemView thumb={<CCheckbox checked={formVals.tncChecked ?? false} />}>
                                <BoldText style={{ marginLeft: 8 }}>I acknowledge the above</BoldText>
                            </ListItemView>
                            {formErrors.tncChecked && <ErrorText error={formErrors.tncChecked} style={{ marginLeft: 12, marginBottom: 12 }} />}
                        </>
                    </TouchableHighlight>
                </Section>
                <Height h={12} />
            </ScrollView>
        </KeyboardView>
    );
}
