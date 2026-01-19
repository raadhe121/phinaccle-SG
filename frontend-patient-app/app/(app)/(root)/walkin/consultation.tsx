import React, { useEffect, useRef } from "react";
import AntdMiniIcon, { consultIcon, documentsIcon, drugIcon, paymentsIcon, queueIcon } from "@/common/components/AntdMiniIcon";
import { BoldText, ButtonIcon, CMarkdown, CText, HeaderTag, HeaderTitleTag, Height, ListItem, ListItemView, OpeningHours, ReactQueryChild, Row, ScrollbarPadding, Section, TitleText, WarningBlock } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors, tagColorMapping } from "@/common/utils/config";
import { router, useLocalSearchParams } from "expo-router";
import { View, TouchableHighlight } from "react-native";
import { Image } from 'expo-image'
import { ApiError, cancelWalkinApiWalkinCancelGet, getWalkinDetailsApiWalkinDetailsGet, VisitType, DocType, WalkinQueueStatus, WalkinDetailsResp, getBranchDetailsApiSupportBranchBranchIdGet } from "@/services/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button, Toast } from "@ant-design/react-native";
import { useRealtime } from "@/providers/realtime";
import { modal } from "@/common/utils/modal";
import { useLaunchActivity } from "@/hooks/useLaunchActivity";

type ActivityProps = {
    type: VisitType | DocType,
    title: string,
    subtitle?: string | null,
    icon?: string,
    content?: string | null,
    boldContent?: string | null,
    tag?: string | null,
    onPress?: () => void,
}

export const DocumentRow = (props: ActivityProps) => {
    const marginVertical = 12;

    return <View style={{ margin: 12, marginTop: marginVertical, marginBottom: marginVertical }}>
        {
            props.subtitle && <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                <View style={{ backgroundColor: colors.brands5, borderRadius: 4 }}>
                    <CMarkdown size={11} style={{ margin: 4 }}>{props.subtitle}</CMarkdown>
                </View>
            </View>
        }
        <View style={{ flexDirection: 'row', alignItems: 'center',flexShrink: 1 }}>
            <AntdMiniIcon name={props.icon ?? 'FileOutline'} size={28} />
            <CText size={16} style={{ flexGrow: 1, flexShrink: 1, marginLeft: 6 }} numberOfLines={1}>{props.title}</CText>
            <BoldText size={16} style={{ color: colors.brands2, marginRight: 12  }}>{props.content}</BoldText>
            <ButtonIcon icon="EyeOutline" onPress={props.onPress}>View</ButtonIcon>
        </View>
    </View>
}

export const ActivityRow = (props: ActivityProps) => {
    const icon = {
        'teleconsult': <Image source={consultIcon} contentFit="contain" style={{ width: 28, height: 28 }} />,
        'walkin': <Image source={queueIcon} contentFit="contain" style={{ width: 28, height: 28 }} />,
        'appointment': <Image source={queueIcon} contentFit="contain" style={{ width: 28, height: 28 }} />,
        'invoice': <AntdMiniIcon name='FileOutline' size={28} />,
        'mc': <AntdMiniIcon name='FileOutline' size={28} />,

    }[props.type]

    const marginVertical = 12;
    const tagText = props.tag && props.type == 'walkin' ? tagMapping?.[props.tag as WalkinQueueStatus].text ?? props.tag : props.tag;
    const tagColor = tagText ? tagColorMapping?.[tagText] ?? colors.success : colors.success;

    return <View style={{ margin: 12, marginTop: marginVertical, marginBottom: marginVertical }}>
        {
            props.subtitle && <View style={{ flexDirection: 'row', marginBottom: marginVertical }}>
                <View style={{ backgroundColor: colors.brands5, borderRadius: 4 }}>
                    <CMarkdown size={11} style={{ margin: 4 }}>{props.subtitle}</CMarkdown>
                </View>
            </View>
        }
        <Row style={{ alignItems: 'flex-start' }}>
            {
                props.icon
                    ? <Image source={{ uri: props.icon}} contentFit="contain" style={{ width: 28, height: 28 }} />
                    : icon
            }
            <View style={{ marginLeft: 8, flexGrow: 1, flexShrink: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <BoldText size={13} style={{ flexGrow: 1, flexShrink: 1 }} numberOfLines={1}>{props.title}</BoldText>
                    <HeaderTag color={tagColor}>{tagText}</HeaderTag>
                </View>
                <Row style={{ marginTop: 8, flexShrink: 1 }}>
                    <CText size={16}>
                        {props.content}
                        <BoldText size={16}>{props.boldContent}</BoldText>
                    </CText>
                </Row>
            </View>
        </Row>
    </View>
}

const tagMapping: { [key in WalkinQueueStatus]: { color: string, text?: string} } = {
    Pending: { color: colors.success },
    Rejected: { color: colors.danger },
    "Checked In": { color: colors.brands2, text: "In-Queue"},
    "Consult Start": { color: colors.brands2, text: "In-Queue"},
    Cancelled: { color: colors.disabled },
    Missed: { color: colors.disabled },
    "Checked Out": { color: colors.disabled },
}

export default function WalkInDetailsScreen() {
    const { activity } = useRealtime();
    const { id } = useLocalSearchParams();
    const qry = useQuery({
        queryKey: ['walkin', id],
        queryFn: () => getWalkinDetailsApiWalkinDetailsGet({ id: id as string })
    })
    const cancelMutation = useMutation({
        mutationFn: cancelWalkinApiWalkinCancelGet,
        onSuccess: ({ id }) => {
            router.replace({ pathname: '/walkin/consultation', params: { id } });
        },
        onError: (error: ApiError) => {
            Toast.fail({
                content: (error.body as { detail?: string })?.detail ?? error.message,
                duration: 1,
                stackable: true,
            })
        }
    })
    
    const idCache = useRef<string>(); // This is used when teleconsult becomes null when CHECKED_OUT state
    
    // This is to update the teleconsult data if the id is not present
    useEffect(() => {
        // Ignore since this is not a realtime record
        if (id) return;
        // Went into Checked Out State (activity becomes null)
        if (!activity && idCache.current) {
            router.replace({ pathname: '/walkin/consultation', params: { id: idCache.current } });
        }
        idCache.current = activity?.id.toString();
    }, [activity])

    const onCancel = () => {
        modal.warn({
            title: "Cancel Consultation",
            content: "Are you sure you want to cancel queue request?",
            labels: ["No", "Yes, Cancel"],
            onCancel: () => {},
            onOk: async () => cancelMutation.mutate()
        })
    }

    return <KeyboardView
        edges={[]} 
        navBack={router.back}
        title={<HeaderTitleTag tag='Activities' title='Queue Request' />}
        >
        <ReactQueryChild query={qry}>
            { qry.data && (
                <>
                    <Section title={<View style={{ height: 12 }}></View>}>
                        { 
                            qry.data.status == 'Checked In' && <View style={{ margin: 12, flexDirection: 'row', alignItems: 'center' }}>
                                <BoldText size={12}>Current Queue Number</BoldText>
                                <View style={{ marginLeft: 12, borderWidth: 1, borderRadius: 4, borderColor: colors.primary }}>
                                    <CText style={{ margin: 8, marginTop: 4, marginBottom: 4, color: colors.primary }} size={11}>{qry.data.branch_queue_number ?? '0'}</CText>
                                </View>
                                <View style={{ flexGrow: 1 }}></View>
                                <CText>Last update {qry.data.last_update}</CText>
                            </View> 
                        }
                        <ActivityRow
                            type='walkin'
                            title={`Queue Request (${qry.data.branch_name})`}
                            subtitle={qry.data.subtitle ?? undefined}
                            content={qry.data.queue_status}
                            boldContent={qry.data.status == 'Checked In' ? (qry.data.queue_number ?? '') : undefined}
                            tag={qry.data.status}
                            />
                        {
                            qry.data.status == 'Checked In' && (
                                <>
                                    <WarningBlock icon='ExclamationCircleFill' style={{ margin: 12 }}>
                                        <BoldText style={{ color: colors.warning }}>Please register at the counter upon arrival at the clinic. Thank you.</BoldText>{'\n\n'}
                                        Queue numbers:{'\n'}
                                        <BoldText style={{ color: colors.warning }}>21-100 </BoldText> 
                                        will be seen in the morning.{'\n'}
                                        <BoldText style={{ color: colors.warning }}>101-200 </BoldText>
                                        will be seen in the afternoon.{'\n'}
                                        <BoldText style={{ color: colors.warning }}>201-300 </BoldText>
                                        will be seen in the evening / night.
                                    </WarningBlock>
                                    <BranchOpeningHours branchId={qry.data.branch_id} />
                                </>
                            )
                        }
                    </Section>
                    {
                        (qry.data.status == 'Pending' || (qry.data.status == 'Checked In' && !qry.data.allow_add_dependants)) && (
                            <Button type='primary' onPress={onCancel} loading={cancelMutation.isPending} disabled={cancelMutation.isPending} style={{ margin: 12, backgroundColor: colors.danger, borderWidth: 0 }} activeStyle={{ backgroundColor: colors.danger }}>
                                <BoldText size={17} style={{ color: 'white'}}>Cancel</BoldText>
                            </Button>
                        )
                    }
                    {
                        // Check if patient has any dependants
                        qry.data.status == 'Checked In' && qry.data.allow_add_dependants && (
                            <Row style={{ margin: 12 }}>
                                <View style={{ flex: 1,flexGrow: 1 }}>
                                    <Button type='primary' onPress={onCancel} loading={cancelMutation.isPending} disabled={cancelMutation.isPending} style={{ backgroundColor: colors.danger, borderWidth: 0 }} activeStyle={{ backgroundColor: colors.danger }}>
                                        <BoldText size={17} style={{ color: 'white'}}>Cancel</BoldText>
                                    </Button>
                                </View>
                                <View style={{ width: 12 }} />
                                <View style={{ flex: 1, flexGrow: 1 }}>
                                    <Button type='ghost' onPress={() => router.navigate('./select')}>
                                        <BoldText size={17} style={{color: colors.primary}}>Add Dependant</BoldText>
                                    </Button>
                                </View>
                            </Row>
                        )
                    }
                    { 
                        qry.data.status == 'Checked Out' && (
                            <>
                                { qry.data.invoices && qry.data.invoices.length > 0 && <PaymentsSection queue={qry.data} /> }
                                { qry.data.prescriptions && qry.data.prescriptions.length > 0 && <PrescriptionSection prescriptions={qry.data.prescriptions} /> }
                                { qry.data.documents && qry.data.documents.length > 0 && <DocumentsSection documents={qry.data.documents} /> }
                            </>
                        )
                    }
                    { qry.data.status == 'Rejected' && <RejectedSection /> }
                    <Height h={12} />
                </>
            )}
        </ReactQueryChild>
        <ScrollbarPadding />
    </KeyboardView>
}

const PaymentsSection = ({ queue }: { queue: WalkinDetailsResp }) => {
    const { invoices } = queue;

    return <Section title={
            <Row style={{ margin: 12, marginTop: 12, marginBottom: 0 }}>
                <Image source={paymentsIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
                <TitleText style={{ marginLeft: 8 }}>Payments</TitleText>
            </Row>
            }
            >

        {/* <PaymentBreakdown breakdown={payment_breakdown} />
        <ListItemView extra={<CText size={16}>{`\$${total.toFixed(2)}`}</CText>} styles={{Extra: { color: 'green' }}}>
            <BoldText size={16}>Total</BoldText>
        </ListItemView> */}

        {/* Display Invoice */}
        {
            invoices && invoices.length > 0 && invoices.map((invoice) => (
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
    </Section>
}

const PrescriptionSection = ({ prescriptions }: { prescriptions: WalkinDetailsResp['prescriptions'] }) => (
    <Section title={
        <Row style={{ margin: 12, marginTop: 12, marginBottom: 0 }}>
            <Image source={drugIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
            <TitleText style={{ marginLeft: 8 }}>Prescriptions</TitleText>
        </Row>
        }>
        {
            prescriptions && prescriptions.map((p) => (
                <ListItem key={p.item_name}>
                    {
                        p.subtitle && <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                            <View style={{ backgroundColor: colors.brands5, borderRadius: 4 }}>
                                <BoldText size={11} style={{ margin: 4 }}>{p.subtitle}</BoldText>
                            </View>
                        </View>
                    }
                    <BoldText  size={16} style={{marginTop: 4}}>{p.item_name}</BoldText>
                    <View style={{marginBottom: 4}}>
                        {
                            [p.instructions, ...p.precautions.split("\n")]
                                .filter((t) => t)
                                .map((t, i) => <CText key={i} size={16} style={{ marginTop: 8 }}>{t}</CText>)
                        }
                    </View>
                </ListItem>
            ))
        }
    </Section>
)

const DocumentsSection = ({ documents }: { documents: WalkinDetailsResp['documents'] }) => (
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
                            {doc.icon == 'document' && <AntdMiniIcon name='FileOutline' size={24} />}
                            {doc.icon == 'mc' && <AntdMiniIcon name='MCOutline' size={24} />}
                            <CText style={{marginLeft: 4}}>{doc.title}</CText>
                        </View>
                    </View>
                </ListItem>
            ))
        }
    </Section>
)

const RejectedSection = () => {
    const { launchActivity } = useLaunchActivity(); 
    
    const onPress = () => launchActivity('teleconsult');
    return <View style={{ margin: 12, alignItems: 'center' }}>
        <TitleText>Unable to get queue number?</TitleText>
        <View style={{ borderColor: colors.primary, borderWidth: 1, borderRadius: 8, overflow: 'hidden', width: '100%' }}>
            <TouchableHighlight underlayColor={colors.underlay} onPress={onPress}>
                <View style={{ margin: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <Image
                        source={consultIcon}
                        resizeMode="contain"
                        style={{ width: 21, height: 21 }}
                        />
                    <BoldText size={18} style={{ marginLeft: 8, color: colors.primary }}>Book Telemedicine</BoldText>
                </View>
            </TouchableHighlight>
        </View>
    </View>
}

const BranchOpeningHours = ({ branchId }: { branchId: string }) => {
    const qry = useQuery({
        queryKey: ['branch', branchId],
        queryFn: () => getBranchDetailsApiSupportBranchBranchIdGet({ branchId })
    })
    
    if (!qry.data) return null;
    return <OpeningHours hours={qry.data.operating_hours} />
}
