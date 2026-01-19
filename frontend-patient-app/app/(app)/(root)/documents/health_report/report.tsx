import React, { useEffect } from "react";
import AntdMiniIcon, { labReportIcon } from "@/common/components/AntdMiniIcon";
import { BoldText, CMarkdown, HeaderTitleTag, ReactQueryChild, ButtonIcon, CText, HealthReportTag, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { antd, colors } from "@/common/utils/config";
import { getReportSummaryApiHealthReportReportPost, LabReportBlock, ReportSummaryResp, TestResult, WarningBlock } from "@/services/client";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { View, TouchableHighlight, Image } from "react-native";
import { getDocumentAccessCode } from "@/providers/documents";
import TabBlock, { TabBlockRoute } from "@/common/components/TabBlock";
import dayjs from "dayjs";
import { toast } from "@/common/utils/modal";

const routes: TabBlockRoute[] = [
    { key: 'All', title: 'All' },
    { key: 'Out of Range', title: 'Out of Range', icon: 'ExclamationCircleFill', iconColor: colors.danger },
    { key: 'Borderline', title: 'Borderline', icon: 'ExclamationCircleFill', iconColor: colors.warning },
    { key: 'Normal', title: 'Normal', icon: 'CheckCircleFill', iconColor: colors.success },
]

const getVisibleRoutes = (data: ReportSummaryResp) => {
    const _resultTypes = data.results.map((row) => row.tag.title);
    return routes.filter(({ key }) => key === 'All'|| _resultTypes.includes(key))
}

// 1) Health Report Screen - Loading and Data Fetching
export default function HealthReportScreen() {
    const { id } = useLocalSearchParams();
    const { code } = getDocumentAccessCode();

    // Query for fetching health report data
    const qry = useQuery({
        queryKey: ['healthReport', id],
        queryFn: ({ queryKey }) => getReportSummaryApiHealthReportReportPost({ 
            requestBody: { id: queryKey[1] as string, code }
        }),
        retry: (failureCount, error: any) => {
            // Don't retry on 403 errors (need disclaimer acceptance)
            if (error?.status === 403) {
                return false;
            }
            return failureCount < 3;
        }
    });

    // Handle errors separately
    useEffect(() => {
        if (qry.error) {
            const error = qry.error as any;
            if (error?.status === 403) {
                // Redirect to disclaimer screen if 403 error
                router.replace({
                    pathname: "/documents/health_report/disclaimer" as any,
                    params: { id }
                });
            } else {
                toast.fail('Failed to fetch health report');
                router.back();
            }
        }
    }, [qry.error, id]);

    return (
        <KeyboardView
            navBack={() => router.back()}
            edges={[]}
            title={<HeaderTitleTag tag='My Records' title='My Health Report' />}
            wrapScroll={false}
            >
            
            <ReactQueryChild query={qry}>
                {qry.data && <>
                    <View style={{ flexDirection: 'row', marginTop: 12, marginBottom: 0, alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ marginLeft: 12, marginRight: 12, }}>
                            <BoldText size={13}>Comprehensive Health Screening</BoldText>
                        </View>
                        <View style={{ backgroundColor: colors.brands5, borderRadius: 4, marginRight: 12 }}>
                            <CMarkdown size={11} style={{ margin: 5 }}>{dayjs(qry.data?.created_at).format('DD MMM YYYY, hh:mmA')}</CMarkdown>
                        </View>
                    </View>
                    <TabBlock
                        routes={getVisibleRoutes(qry.data)}
                        onRender={(route) => (
                            <ReportSection routeKey={route.key} data={qry.data} />
                        )}
                        />
                </>}
            </ReactQueryChild>  
        </KeyboardView>
    );
}


// 3) Tab Content - Report Section

// Utility function to chunk array into groups of specified size
const chunkArray = (array: any[], size: number) => {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
        chunkedArr.push(array.slice(i, i + size));
    }
    return chunkedArr;
};


export const healthReportColorMapping: { [key: string]: any } = {
    'red': colors.danger,
    'orange': colors.warning,
    'green': colors.success,
}

const viewLabReport = (hl7Id: string, filename: string) => {
    const pdfUrl = `/api/document/health_report/${hl7Id}`
    router.navigate({ 
        pathname: '/documents/viewer', 
        params: { id: hl7Id, pdfUrl, filename, fileType: 'pdf' }
    });
}

export const renderLabReportBlock = (row: LabReportBlock) => (
    <View key={''+row?.document?.id} style={{ margin: 12 }}>
        <BoldText size={12}>For in-depth results and information</BoldText>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center'}}>
            <Image source={labReportIcon} style={{ width: 24, height: 24 }} />
            <CText size={16} style={{ marginLeft: 5, flexGrow: 1, flexShrink: 1 }}>Health Report</CText>
            <ButtonIcon icon="EyeOutline" onPress={() => viewLabReport(row.document.id, row.document.title)}>View</ButtonIcon>
        </View>
    </View>
)

type ReportSectionProps = {
    routeKey: string;
    data: ReportSummaryResp;
}

const showKey = (key: string, routeKey: string) => routeKey === 'All' || routeKey === key;

function ReportSection({ routeKey, data }: ReportSectionProps) {
    const profiles = data.results.filter((row: TestResult) => routeKey === 'All' || row.tag.title === routeKey).map((row: TestResult) => row.profile);

    return <Section title={<></>}>
        {[
            ...data.warnings
                .filter((row: WarningBlock) => row.category && showKey(row.category.title, routeKey))
                .map((row: WarningBlock, i) => (
                    <View key={i} style={{ flexDirection: 'row', margin: 12 }}>
                        <AntdMiniIcon name='ExclamationCircleFill' size={18} color={row.category?.color} />
                        <CMarkdown 
                            size={13}
                            style={{ flexShrink: 1, marginLeft: 8 }}
                            mkStyles={{ strong: { ...antd.boldText, color: row.category?.color }}}
                            >
                            {row.description}
                        </CMarkdown>
                    </View>
                )),
            chunkArray(
                data.results.filter((row: TestResult) => routeKey === 'All' || row.tag.title === routeKey)
                , 3).map((chunks: TestResult[], i) => (
                <View key={i} style={{ flexDirection: 'row'}}>
                    {[
                        ...chunks.map((row: TestResult) => (
                                <TouchableHighlight key={row.profile.id} underlayColor={colors.underlay} onPress={() => router.push({ pathname: '/documents/health_report/details', params: { id: data.id, profiles: JSON.stringify(profiles), profile: row.profile.id }})} style={{ flex: 1 }}>
                                    <View style={{ flex: 1, flexGrow: 1, alignItems: 'center', marginTop: 12, marginBottom: 12, justifyContent: 'space-between' }}>
                                        <Image
                                            source={{ uri: row.profile_icon }}
                                            resizeMode="contain"
                                            style={{ width: 45, height: 45 }}
                                            />
                                        
                                        <BoldText size={12} style={{ textAlign: 'center', marginTop: 6, marginBottom: 9 }}>{row.profile.title}</BoldText>
                                        <HealthReportTag size={11} color={row.tag.color}>{row.tag.title}</HealthReportTag>
                                    </View>
                                </TouchableHighlight>
                            )),
                            ...Array.from({ length: 3 - chunks.length }).map((_, i) => (
                                <View key={i} style={{ flex: 1, flexGrow: 1 }} />
                            ))
                    ]}
                </View>
            )),
            ...data.lab_reports.map((row: LabReportBlock) => renderLabReportBlock(row))
        ]}
    </Section>
}