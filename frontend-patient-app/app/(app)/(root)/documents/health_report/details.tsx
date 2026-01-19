import { useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image'
import { BoldText, CMarkdown, CText, HealthReportTag, NavHeader3, ReactQueryChild, Section } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { getReportProfileApiHealthReportReportProfileReqPost, LabResultBlock, OverallBlock, Profile } from "@/services/client";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { healthReportColorMapping, renderLabReportBlock } from './report';
import TabBlock from '@/common/components/TabBlock';
import { getDocumentAccessCode } from '@/providers/documents';

export default function DetailsScreen() {
    const { id, profiles, profile } = useLocalSearchParams();

    return <KeyboardView
        edges={[]}
        navBack={router.back}
        header={<NavHeader3 navBack={router.back} />}
        scrollOverflow='hidden'
        wrapScroll={false}
        >
        <TabBlock
            routes={
                (JSON.parse(profiles as string)).map((profile: Profile) => ({
                    key: profile.id,
                    title: profile.title.replace('\n', ' '),
                    // icon: '',
                    // iconColor: '',
                }))
            }
            activeRoute={profile as string}
            onRender={(route) => (
                <DetailsView profile={route.key} id={id as string} />
            )}/>
    </KeyboardView>
}

function DetailsView({ id, profile }: { id: string, profile: string }) {
    const { width } = useWindowDimensions();
    const { code } = getDocumentAccessCode();

    const qry = useQuery({
        queryKey: ['healthReport', id, profile],
        queryFn: ({ queryKey }) => getReportProfileApiHealthReportReportProfileReqPost({ 
            profileReq: profile,
            requestBody: { id, code }
        })
    })

    return (
        <ReactQueryChild query={qry}>
            { qry.data && <>
                <View style={{ margin: 12, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <BoldText size={25} style={{ flexGrow: 1, flexShrink: 1 }}>{qry.data.profile.title}</BoldText>
                    <Image
                        source={{ uri: qry.data.profile_icon }}
                        resizeMode="contain"
                        style={{ width: 34, height: 34, marginRight: 12 }}
                        />
                </View>
                <Section title={<></>}>
                    {[
                        ...qry.data.overalls.map((item: OverallBlock) => (
                            <View key={item.title} style={{ margin: 12 }}>
                                <BoldText size={14}>Overall result</BoldText>
                                <BoldText size={17} style={{ marginTop: 6, color: healthReportColorMapping[item.color] }}>{item.title}</BoldText>
                                { item.message && <CMarkdown size={12} style={{ marginTop: 12 }}>{item.message}</CMarkdown>}
                            </View>
                        )),
                        ...qry.data.results.map((item: LabResultBlock) => (
                            <View key={item.title} style={{ margin: 12 }}>
                                <BoldText size={14}>{item.title}</BoldText>
                                <View style={{ marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <BoldText size={18}>{item.value}</BoldText>
                                    { item.tag && <View>
                                        <HealthReportTag size={11} color={item.tag.color}>{item.tag.title}</HealthReportTag>
                                    </View> }
                                </View>
                                { item.desirable_range && <>
                                   <BoldText size={12} style={{ marginTop: 16 }}>Desirable Range</BoldText>
                                   { item.desirable_range.value && <CText size={16} style={{ marginTop: 6 }}>{item.desirable_range.value}</CText>}
                                   { item.desirable_range.image && <Image source={{ height: item.desirable_range.image_ratio ? (width / item.desirable_range.image_ratio) : 150, uri: item.desirable_range.image }} style={{ marginTop: 16 }} resizeMode="contain" />}
                                </>}
                                { item.message && <CMarkdown size={12} style={{ marginTop: 12 }}>{item.message}</CMarkdown>}
                            </View>
                        )),
                        ...qry.data.lab_reports.map((row) => renderLabReportBlock(row)),
                    ]}
                </Section>
            </>}
        </ReactQueryChild>
    );
}