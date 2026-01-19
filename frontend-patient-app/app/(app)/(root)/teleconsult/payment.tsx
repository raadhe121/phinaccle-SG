import { BoldText, ButtonIcon, CCheckbox, CText, ErrorText, HeaderTitleTag, Height, Label, ListItem, ListItemView, Row, Section, TitleText, ToggleButton } from '@/common/components/AntdText';
import KeyboardView from '@/common/components/KeyboardView';
import { Button } from '@ant-design/react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, TouchableHighlight, View } from 'react-native';
import { Image } from 'expo-image'
import { PaymentRow } from '../profile/payment_methods';
import { colors } from '@/common/utils/config';
import { deliveryIcon, drugIcon, myfamilyIcon, paymentIcon } from '@/common/components/AntdMiniIcon';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, joinQueueApiTeleconsultV2QueueJoinPost } from '@/services/client';
import { BranchPicker } from '../teleconsult/branches';
import { toast } from '@/common/utils/modal';
import React from 'react';
import { FormProps, TeleconsultProvider, useTeleconsultProvider } from './teleconsult_provider';
import { DrugAllergiesForm } from './payments/allergies';
import { RatesForm } from './payments/rates';
import { FamilyPicker } from '../family/select';
import { onError } from '@/common/utils/lib';
import { useTeleconsultPermissions } from '@/hooks/useTeleconsultPermissions';

export const PaymentBreakdown = ({ breakdown }: { breakdown: { title: string, amount: number }[] }) => {
    return <>
        { breakdown.map(({ title, amount }: { title: string, amount: number }) => (
            <ListItem divider={false} key={title} extra={<CText size={16}>{`$${amount.toFixed(2)}`}</CText>}>
                <CText size={16} numberOfLines={1}>{title}</CText>
            </ListItem>
        )) }
    </>
}

// Wrap provider
export default function PaymentScreenWithProvider() {
    return <TeleconsultProvider>
        <PaymentScreen />
    </TeleconsultProvider>
}

// 1. Provide initial values to the form (formSubmitted, userAllergy, patientAllergies)
// 2. Form validates and generate its own components
// 3. On change, pass the value to provider, and validation state

function PaymentScreen() {
    const { patientIdsStr, branchId, branchName } = useLocalSearchParams();
    const queryClient = useQueryClient();
    const { includeUser, patients, hasFamily, rates, validCorpCode, branch, formVals, formErrors, paymentMethod, setFamily, setBranch, setPaymentMethod, setFormVals, setFormErrors, setFormSubmitted } = useTeleconsultProvider();
    const [ formSubmit, setFormSubmit ] = useState<boolean>(false); // When first time submitted
    const [ submitting, setSubmitting ] = useState<boolean>(false);
    useTeleconsultPermissions();
    
    // Convert any localsearchparams back into state
    useEffect(() => {
        if (branchId) setBranch({ id: branchId, name: branchName });
        if (patientIdsStr !== undefined) {
            const patientIds = (patientIdsStr as string).split(',');
            setFamily({ include_user: patientIds.includes(''), ids: patientIds.filter((p) => p != '') })
        }
    }, [branchId, patientIdsStr])

    
    // When initialising and returning from the payment screen
    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['rates'] })
        }, [])
    );
    
    const validateForm = (forceValidate: boolean = false) => {
        if (!formSubmit && !forceValidate) return;

        const errors: { [key in keyof FormProps]: string } = {};
        if (!rates?.is_pcp && !formVals.collectionMethod) errors.collectionMethod = 'Please select a collection method';
        if (!rates?.address) errors.address = 'Please add an address';
        if (!rates?.is_pcp && rates?.require_branch_picker_methods?.includes(formVals.collectionMethod ?? '') && !branch?.id) errors.branchId = 'Please select a clinic';
        if (formErrors.allergies) errors.allergies = 'Error';
        if (!formVals.tncChecked) errors.tncChecked = 'Please acknowledge the terms and conditions';

        setFormErrors(errors);
        return Object.keys(errors).length > 0;
    }

    useEffect(() => { validateForm() }, [formVals, rates, branch]);    

    const navtoPayment = async () => {
        setFormSubmit(true);
        setFormSubmitted(true);
        const errors = validateForm(true);
        if (errors) {
            toast.fail('Please fill in the required fields');
            return;
        }

        setSubmitting(true);
        try {
            const resp = await joinQueueApiTeleconsultV2QueueJoinPost({ 
                requestBody: {
                    family_ids: patients?.map((p) => p.id),
                    include_user: includeUser ?? true,
                    code: validCorpCode,
                    branch_id: branch?.id,
                    user_allergy: formVals.userAllergy,
                    allergies: formVals?.allergies,
                    collection_method: formVals.collectionMethod,
                }
            })

            if (!resp.prepayment_required) {
                router.dismissTo('/');
                router.navigate('/teleconsult/consultation');
                return;
            }

            if (!resp.redirect_pathname) {
                toast.fail('Failed to redirect to payment page');
                return;
            }
            const params = {
                payment_provider_params: JSON.stringify(resp.payment_provider_params),
                rates: JSON.stringify(rates), 
            }
            router.navigate({ pathname: resp.redirect_pathname, params })
        } catch (e) {
            onError(e as ApiError);
        }

        setSubmitting(false);
    }

    const managePayments = () => router.navigate('/profile/payment_methods');
    const manageAddress = () => router.navigate('/profile/address');
    const setFormVal = (key: keyof FormProps, val: any) => setFormVals((prev: FormProps) => ({ ...prev, [key]: val }));

    const action = <Button
        onPress={navtoPayment}
        type="primary"
        loading={submitting}
        disabled={submitting || (formSubmit && Object.keys(formErrors).length > 0)}
        >
        Join Telemedicine Queue
    </Button>

    return (
        <KeyboardView
            action={action}
            navBack={() => router.back()}
            title={<HeaderTitleTag tag='Book Telemedicine' title='Consultation Fees Payable' />}
            wrapScroll={false}
            >
            <ScrollView style={{ marginTop: -100, paddingTop: 100 }}>
                { 
                    !rates?.is_pcp && hasFamily && <Section title={
                        <Row style={{ marginLeft: 12, marginTop: 12 }}>
                            <Image source={myfamilyIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
                            <TitleText style={{ marginLeft: 8 }}>Consult For</TitleText>
                        </Row>
                        }>
                        <FamilyPicker includeUser={includeUser} patients={patients} returnPath='/teleconsult/payment' />
                    </Section>
                }
                <RatesForm />
                {
                    rates && paymentMethod && (
                        <Section title={
                            <Row style={{ marginLeft: 12, marginTop: 12 }}>
                                <Image source={paymentIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
                                <TitleText style={{ marginLeft: 8 }}>Payment Method</TitleText>
                            </Row>
                            }>
                            <PaymentRow
                                payment={rates.payment_method} 
                                extra={<ButtonIcon icon='EditSOutline' onPress={managePayments}>Change</ButtonIcon> }
                                />
                        </Section>
                    )
                }
                <View style={{height: 12}}></View>
                {/* Delivery Section */}
                
                <Section title={
                    <Row style={{ marginLeft: 12, marginTop: 12 }}>
                        <Image source={ formVals.collectionMethod == 'pickup' ? drugIcon : deliveryIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
                        <TitleText style={{ marginLeft: 8 }}>{ formVals.collectionMethod == 'pickup' ? 'Pick-up medicine from (if any)' : 'Deliver medicines to (if any)' }</TitleText>
                    </Row>
                    }>
                    {
                        // Collection Method
                        !rates?.is_pcp && <ListItemView>
                            <View style={{ flexDirection: 'row'}}>
                                <ToggleButton selected={formVals.collectionMethod === 'delivery'} onPress={() => setFormVal('collectionMethod', 'delivery')}>Delivery</ToggleButton>
                                <ToggleButton selected={formVals.collectionMethod === 'pickup'} style={{ marginLeft: 20 }} onPress={() => setFormVal('collectionMethod', 'pickup')}>Pick-up</ToggleButton>
                            </View>
                            <ErrorText style={{ marginTop: 6 }} error={formErrors.collectionMethod} />
                            {
                                rates?.collection_method_messages?.[formVals.collectionMethod ?? '']
                                    ? (
                                        <BoldText size={13} style={{ marginTop: 6 }}>
                                            {rates.collection_method_messages?.[formVals.collectionMethod ?? '']}
                                        </BoldText>
                                    ) 
                                    : <></>
                            }
                        </ListItemView>
                    }
                    {
                        // Address
                        rates && (rates?.is_pcp || formVals.collectionMethod) && <ListItemView extra={<ButtonIcon icon='EditSOutline' onPress={manageAddress}>{ rates.address ? 'Change' : 'Add Address' }</ButtonIcon>}>
                            <CText size={16} style={{ color: rates.address ? null : colors.light }}>{rates.address ? rates.address : 'None at the moment'}</CText>
                            <ErrorText error={formErrors.address } style={{ marginTop: 6 }} />
                        </ListItemView>
                    }
                    {
                        rates && formVals.collectionMethod && rates.require_branch_picker_methods?.includes(formVals.collectionMethod) && !rates.is_pcp && (
                            <Label 
                                label={
                                    formVals.collectionMethod == 'delivery'
                                        ? 'Clinic to deliver from'
                                        : 'Locations for pick up'
                                }
                                wrap={false}
                                error={formErrors.branchId}
                            >
                                <BranchPicker branch={branch?.name} mode={formVals.collectionMethod} />
                            </Label>
                        )
                    }
                    {/* Display contextual collection method messages when available */}
                    
                </Section>

                {rates && <DrugAllergiesForm />}

                <Height h={12} />
                <Section title='Acknowledgement'>
                    <View style={{ margin: 12 }}>
                        <BoldText size={13}>Please note :{'\n'}</BoldText>
                        <CText size={13} style={{ lineHeight: 20 }}>{rates?.tnc}</CText>
                    </View>
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
                { Platform.OS == 'android' && <Height h={100} /> }
            </ScrollView>
        </KeyboardView>
    )
}
