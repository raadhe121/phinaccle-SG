import React, { useCallback, useEffect, useRef, useState } from "react";
import { BoldText, ButtonIcon, CText, HeaderTitleTag, Height, ListItem, ListItemView, MText, ReactQueryChild, Row, Section, TitleText, WarningButton } from "@/common/components/AntdText";
import { Button } from "@ant-design/react-native";
import { Linking, View } from "react-native";
import { Image } from 'expo-image'
import { PaymentRow } from "../profile/payment_methods";
import { antd, colors } from "@/common/utils/config";
import { PaymentBreakdown } from "./payment";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { modal, toast } from "@/common/utils/modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import KeyboardView from '@/common/components/KeyboardView';
import AntdMiniIcon, { deliveryIcon, documentsIcon, drugIcon, getPaymentMethodImg, paymentIcon, paymentsIcon } from "@/common/components/AntdMiniIcon";
import { formatDateTime, onError } from "@/common/utils/lib";
import { ActivityRow } from "../walkin/consultation";
import { useRealtime } from "@/providers/realtime";
import { cancelTeleconsultApiTeleconsultV2CancelPost, createPostpaymentV2ApiTeleconsultV2PostpaymentV2CreatePost, getDefaultPaymentMethodApiPaymentMethodsDefaultGet, getDetailsApiTeleconsultV2DetailsGet, GetDetailsApiTeleconsultV2DetailsGetResponse, PaymentMethod, rejoinTeleconsultApiTeleconsultV2RejoinPost } from "@/services/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getItem, localStoragePaymentMethodKey } from "@/common/utils/async_storage";

type TeleconsultResp = GetDetailsApiTeleconsultV2DetailsGetResponse;

export default function ConsultationScreen() {
    const insets = useSafeAreaInsets();
    // Used for realtime updates
    const { id } = useLocalSearchParams();
    const { activity } = useRealtime();
    const queryClient = useQueryClient();
    const qry = useQuery({
        queryKey: ['teleconsult', id],
        queryFn: () => getDetailsApiTeleconsultV2DetailsGet({ id: id as string })
    })

    const idCache = useRef<string>(); // This is used when teleconsult becomes null when CHECKED_OUT state

    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['teleconsult', id] })
        }, [])
    )

    // This is to update the teleconsult data if the id is not present
    useEffect(() => {
        // Ignore if id does not match because it means it is not the ongoing record
        if (id && id !== activity?.id) return;

        // Loading from Stripe Card Payment
        if (!activity && !idCache.current) {
            return;

        // Went into Checked Out State (activity becomes null)
        } else if (!activity && idCache.current) {
            router.back();
            router.navigate({ pathname: '/teleconsult/consultation', params: { id: idCache.current } });
            return;
        }
        idCache.current = activity?.id.toString();
    }, [activity])

    return (
        <KeyboardView
            edges={[]}
            navBack={() => router.back()}
            title={<HeaderTitleTag tag='Activities' title='Telemedicine' />}
            >
            <ReactQueryChild query={qry}>
                { qry.data && (
                    <>
                        <TeleconsultSection teleconsult={qry.data} />
                        <PaymentsSection teleconsult={qry.data} />
                        { qry.data.prescriptions && qry.data.prescriptions.length > 0 && <PrescriptionSection prescriptions={qry.data.prescriptions} /> }
                        {/* <PrescriptionSection prescriptions={[{ item_name: 'Item 1', instructions: 'Instructions', precautions: 'precautions' }]} /> */}
                        <DeliverySection teleconsult={qry.data} allowChange={qry.data.allow_address_change } />
                        { qry.data.allergies && qry.data.allergies.length > 0 && <AllergiesSection allergies={qry.data.allergies} /> }
                        { qry.data.documents && qry.data.documents.length > 0 && <DocumentsSection documents={qry.data.documents} /> }
                        {/* <DocumentsSection documents={[{ title: 'MC', icon: 'document', url: '...', filename: '...' }]} /> */}
                    </>
                )}
            </ReactQueryChild>
            <Height h={insets.bottom + 12} />
        </KeyboardView>
    )
}

const TeleconsultSection = ({ teleconsult }: { teleconsult: TeleconsultResp }) => {
    const [ isLoading, setIsLoading ] = useState<string>();
    const [ camPerm, camReqPerm ] = useCameraPermissions();
    const [ micPerm, micReqPerm ] = useMicrophonePermissions();

    const cancelMutation = useMutation({
        mutationFn: cancelTeleconsultApiTeleconsultV2CancelPost,
        onSuccess: () => {
            router.dismissTo('/');
        },
        onError
    })

    const rejoinMutation = useMutation({
        mutationFn: rejoinTeleconsultApiTeleconsultV2RejoinPost,
        onSuccess: () => {},
        onError
    })

    const cancelSession = () => {
        setIsLoading('cancel')
        modal.warn({
            title: "Cancel Consultation",
            content: "Are you sure you want to cancel this virtual consultation request?",
            labels: ["No", "Yes, Cancel"],
            onCancel: () => setIsLoading(undefined),
            onOk: async () => {
                const close = toast.loading();
                cancelMutation.mutate({ requestBody: { id: teleconsult.id }})
                close();
                setIsLoading(undefined)
            }
        })
    }

    const resumeSession = () => {
        const startZoom = async () => {
            setIsLoading('resume')
            const camResult = await camReqPerm()
            const micResult = await micReqPerm()
            if (camResult.granted && micResult.granted) {
                router.push({ pathname: '/teleconsult/zoom', params: { id: teleconsult.id }})
            } else {
                modal.error({
                    title: "Unable to access microphone and camera",
                    content: 'Allow Pinnacle App to access your camera and microphone from device menu under "Settings"',
                    labels: ["Open Settings", ""],
                    onCancel: async () => await Linking.openSettings()
                })
            }
            setIsLoading(undefined)
        }
        startZoom();
    }

    const rejoinSession = async () => {
        setIsLoading('rejoin');
        await rejoinMutation.mutate({ requestBody: { id: teleconsult.id }});
        // Resetting in 3 secs as SSE has some latency before showing up as checked in
        setTimeout(() => setIsLoading(undefined), 3000);
    }

    const statusActions = {
        'Prepayment': null,
        'Consult End': null,
        'Outstanding': null,
        'Preparing Medication': null,
        'Dispense Medication': null,
        'Checked Out': null,
        "Checked In": teleconsult.allow_add_dependants 
            ? (
                <Row>
                    <View style={{ flex: 1, flexGrow: 1}}>
                        <WarningButton onPress={cancelSession}>Cancel</WarningButton>
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 1, flexGrow: 1}}>
                        <Button onPress={() => router.navigate('./select')} type="ghost">
                            <MText style={{color: colors.primary}}>Add Dependant</MText>
                        </Button>
                    </View>
                </Row>
            )
            : <WarningButton onPress={cancelSession}>Cancel</WarningButton>,
        "Consult Start": <Button onPress={resumeSession} type="ghost" loading={isLoading === 'resume'} disabled={isLoading === 'resume'}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <AntdMiniIcon name='VideoOutlineAlt' size={24} color={colors.primary} />
                    <MText style={{marginLeft: 4, color: colors.primary}}>Resume Session</MText>
                </View>
            </Button>,
        "Missed": <Row>
                <View style={{ flexGrow: 1}}>
                    <WarningButton onPress={cancelSession}>Cancel</WarningButton>
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flexGrow: 1}}>
                    <Button onPress={rejoinSession} type="ghost" loading={isLoading === 'rejoin'} disabled={isLoading === 'rejoin'}>
                        <MText style={{color: colors.primary}}>Rejoin Queue</MText>
                    </Button>
                </View>
            </Row>,
        "Cancelled": <Button onPress={rejoinSession} type="ghost" loading={isLoading === 'rejoin'} disabled={isLoading === 'rejoin'}>
                <MText style={{color: colors.primary}}>Join Queue Again</MText>
            </Button>,
    }?.[teleconsult.status]

    return <>
        <Section title={<Height h={24} />}>
            <ActivityRow
                type='teleconsult'
                title='Telemedicine Consultation'
                content={teleconsult.queue_status}
                subtitle={teleconsult.time_subtitle}
                tag={teleconsult.status}
                />
            {
                teleconsult.doctor && <ListItem>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <AntdMiniIcon name='UserCircleOutline' size={44} color={colors.brands2} />
                        {/* <Image source={consultIcon} resizeMode="cover" style={{ width: 44, height: 44, borderRadius: 16 }} /> */}
                        <View style={{marginLeft: 12}}>
                            <BoldText size={14}>Your GP</BoldText>
                            <CText size={16}>{teleconsult.doctor ?? 'Doctor Name'}</CText>
                        </View>
                    </View>
                </ListItem>
            }
        </Section>
        {
            statusActions && <View style={{flexDirection: 'row', margin: 12, marginTop: 16, marginBottom: 16 }}>
                <View style={{flex: 1}}>
                    { statusActions }
                </View>
            </View>   
        }
    </>
}

const PaymentsSection = ({ teleconsult }: { teleconsult: TeleconsultResp }) => {
    const { id, status, payment_breakdown, payments, total, balance, invoices, hide_invoice } = teleconsult;
    const [ paymentMethod, setPaymentMethod ] = useState<PaymentMethod>('paynow_stripe');
    
    const postPaymentMutation = useMutation({
        mutationFn: createPostpaymentV2ApiTeleconsultV2PostpaymentV2CreatePost,
        onSuccess: (resp) => {
            if (!resp.redirect_pathname) {
                toast.fail('Failed to redirect to payment page');
                return;
            }
            router.navigate({ pathname: resp.redirect_pathname, params: {
                breakdown: JSON.stringify(payment_breakdown),
                payment_provider_params: JSON.stringify(resp.payment_provider_params),
                id, total, balance
            }})
        },
        onError
    })

    // When initialising and returning from the payment screen
    useFocusEffect(
        useCallback(() => {
            // Get Default Payment from LocalStorage
            const getDefaultPayment = async () => {
                let defaultPayment = await getItem(localStoragePaymentMethodKey)
                if (defaultPayment != null) setPaymentMethod(defaultPayment.id)
            }
            getDefaultPayment();
            // TODO: May cause a race condition where payment succeeded and cancelled when navigating back which should not happen
            // cancelPendingPaymentsApi();
        }, [])
    );

    const makePayment = () => {
        postPaymentMutation.mutate({
            requestBody: {
                id
            }
        })
    }

    return <>
        <Section title={
                <Row style={{ margin: 12, marginTop: 12, marginBottom: 0 }}>
                    <Image source={paymentsIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
                    <TitleText style={{ marginLeft: 8 }}>Payments</TitleText>
                </Row>
            }
            top={4}
            >

            { payment_breakdown.length > 0 && <PaymentBreakdown breakdown={payment_breakdown} /> }
            <ListItemView extra={<CText size={16}>{`\$${total.toFixed(2)}`}</CText>} styles={{Extra: { color: 'green' }}}>
                <BoldText size={16}>Total</BoldText>
            </ListItemView>
            <>
                {
                    payments.map((payment, index) => (
                        <ListItem key={index} styles={{ Item: { marginTop: 16, marginBottom: 8 }}} extra={<CText size={16}>{`-\$${payment.payment_amount.toFixed(2)}`}</CText>}>
                            <CText size={16}>Paid on {formatDateTime(payment.updated_at)}</CText>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
                                { getPaymentMethodImg(payment.remarks?.['brand']?.toString() ?? payment.payment_method) }
                                { payment.remarks?.['last4'] && <BoldText style={{marginLeft: 4}}>**** { payment.remarks['last4']?.toString() }</BoldText>}
                            </View>
                        </ListItem>
                    ))
                }
                
                {/* TODO: Balance currently is $0.00 since there is no post payment*/}
                <ListItem extra={<CText size={16}>{`\$${balance.toFixed(2)}`}</CText>}>
                    <BoldText size={16}>Balance</BoldText>
                </ListItem>
            </>
            {/* Display Invoice */}
            {
                !hide_invoice && invoices.length != 0 && invoices.map((invoice) => (
                    <ListItemView key={invoice.url} extra={
                        invoice
                            ? <ButtonIcon icon="EyeOutline" onPress={() => router.navigate({ 
                                pathname: '/pdf_viewer',
                                params: {
                                    id: invoice.id,
                                    filename: invoice.filename,
                                    url: invoice.url,
                                    fileType: invoice.filetype
                                }})}
                                >
                                    View
                                </ButtonIcon>
                            : <ButtonIcon icon="LoopOutline">Processing</ButtonIcon>
                        }
                        >
                        <View>
                            {
                                invoice.subtitle && <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                    <View style={{ backgroundColor: colors.brands5, borderRadius: 4 }}>
                                        <BoldText size={11} style={{ margin: 4 }}>{invoice.subtitle}</BoldText>
                                    </View>
                                </View>
                            }
                            <View style={{flexDirection: 'row', alignItems: 'center' }}>
                                <AntdMiniIcon name='InvoiceOutline' size={24} />
                                <CText size={16} style={{marginLeft: 4}}>Invoice</CText>
                            </View>
                        </View>
                    </ListItemView>
                ))  
            }
            { 
                status == 'Outstanding' && (
                    <Button
                        onPress={makePayment}
                        type="primary"
                        style={{ margin: 12 }}
                        loading={postPaymentMutation.isPending}
                        disabled={postPaymentMutation.isPending}
                        >
                        Make Payment
                    </Button>
                )
            }
        </Section>

        {
            status == 'Outstanding' && <OutstandingPaymentSelection />
        }
    </>
}

const OutstandingPaymentSelection = () => {
    const qry = useQuery({
        queryKey: ['payment_methods', 'default'],
        queryFn: getDefaultPaymentMethodApiPaymentMethodsDefaultGet
    })

    useFocusEffect(
        useCallback(() => {
            qry.refetch()
        }, [])
    )

    const managePayments = () => {
        router.navigate('/profile/payment_methods')
    }

    return (
        <Section title={
            <Row style={{ marginLeft: 12, marginTop: 12 }}>
                <Image source={paymentIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
                <TitleText style={{ marginLeft: 8 }}>Payment Method</TitleText>
            </Row>
            }>
            <PaymentRow
                payment={qry.data} 
                extra={<ButtonIcon icon='EditSOutline' onPress={managePayments}>Change</ButtonIcon> }
                />
        </Section>
    )
}

const PrescriptionSection = ({ prescriptions }: { prescriptions: TeleconsultResp['prescriptions'] }) => (
    <Section title={
        <Row style={{ margin: 12, marginTop: 12, marginBottom: 0 }}>
            <Image source={drugIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
            <TitleText style={{ marginLeft: 8 }}>Prescriptions</TitleText>
        </Row>
        }>
        {
            prescriptions && prescriptions.map((p) => (
                <ListItem key={p.item_name}>
                    <View>
                        {
                            p.subtitle && <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                <View style={{ backgroundColor: colors.brands5, borderRadius: 4 }}>
                                    <BoldText size={11} style={{ margin: 4 }}>{p.subtitle}</BoldText>
                                </View>
                            </View>
                        }
                        <BoldText size={16} style={{marginTop: 4}}>{p.item_name}</BoldText>
                        <View style={{marginBottom: 4}}>
                            {
                                [p.instructions, ...p.precautions.split("\n")]
                                    .filter((t) => t)
                                    .map((t,i) => <CText key={i} size={16} style={{ marginTop: 8 }}>{t}</CText>)
                            }
                        </View>
                    </View>
                </ListItem>
            ))
        }
    </Section>
)

const DeliverySection = ({ teleconsult, allowChange }: { teleconsult: TeleconsultResp, allowChange: boolean }) => (
    <Section title={
        <Row style={{ marginLeft: 12, marginTop: 12 }}>
            <Image source={ teleconsult.collection_method == 'pickup' ? drugIcon : deliveryIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
            <TitleText style={{ marginLeft: 8 }}>{ teleconsult.collection_method == 'pickup' ? 'Pick-up medicine from (if any)' : 'Deliver medicines to (if any)' }</TitleText>
        </Row>
        }>
        <ListItemView
            extra={
                allowChange && <ButtonIcon icon="EditSOutline" onPress={() => router.navigate('/profile/address')}>Change</ButtonIcon>
            }>
            <CText size={16}>{teleconsult.address}</CText>
        </ListItemView>
        {
            teleconsult.collection_method && teleconsult.collection_method == 'pickup' && (
                <ListItemView>
                    <BoldText style={{ color: antd.inputLabel.color }}>Location for pick up</BoldText>
                    <CText size={16}>{teleconsult.branch_name}</CText>
                </ListItemView>
            )
        }
    </Section>
)

const AllergiesSection = ({ allergies }: { allergies: TeleconsultResp['allergies']}) => (
    <Section title={
        <Row style={{ marginLeft: 12, marginTop: 12 }}>
            <Image source={drugIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
            <TitleText style={{ marginLeft: 8 }}>Drug Allergies</TitleText>
        </Row>
        }>
        {
            allergies?.map((allergy) => (
                <ListItemView key={allergy}>
                    <CText size={16}>{allergy}</CText>
                </ListItemView>
            ))
        }
    </Section>
)

const DocumentsSection = ({ documents }: { documents: TeleconsultResp['documents'] }) => (
    <Section title={
        <Row style={{ margin: 12, marginTop: 12, marginBottom: 0 }}>
            <Image source={documentsIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
            <TitleText style={{ marginLeft: 8 }}>Documents</TitleText>
        </Row>
        }>
        {
            documents && documents.map((doc) => (
                <ListItem key={doc.url} extra={
                        <ButtonIcon icon="EyeOutline" onPress={() => router.navigate({
                            pathname: '/pdf_viewer',
                            params: {
                                id: doc.id,
                                filename: doc.filename,
                                url: doc.url,
                                fileType: doc.filetype
                            }})}
                        >
                            View
                        </ButtonIcon>
                    }>
                    <View>
                        {
                            doc.subtitle && <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                                <View style={{ backgroundColor: colors.brands5, borderRadius: 4 }}>
                                    <BoldText size={11} style={{ margin: 4 }}>{doc.subtitle}</BoldText>
                                </View>
                            </View>
                        }
                        <View style={{flexDirection: 'row', alignItems: 'center' }}>
                            {doc.icon == 'document' && <AntdMiniIcon name="FileOutline" size={24} />}
                            {doc.icon == 'mc' && <AntdMiniIcon name="MCOutline" size={24} />}
                            <CText style={{marginLeft: 4}}>{doc.title}</CText>
                        </View>
                    </View>
                </ListItem>
            ))
        }
    </Section>
)