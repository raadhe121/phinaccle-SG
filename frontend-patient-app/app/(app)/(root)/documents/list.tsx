import React from "react";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";
import { BoldText, CText, Divider, EmptyFlatlist, ScrollbarPadding } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { DocumentInfo, DocumentRouteType, getDocsV2ApiDocumentV2Post } from "@/services/client";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, TouchableHighlight, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Route, TabBar, TabView } from 'react-native-tab-view';
import { DocumentRow } from "../walkin/consultation";
import { getDocumentAccessCode } from "@/providers/documents";

type docType = {
    key: DocumentRouteType,
    title: string,
    icon?: string
}

const docTypeKeys: docType[] = [
    { key: 'All', title: 'All' },
    { key: 'My Family', title: 'My Family' },
    { key: 'Invoice', title: 'Invoice', icon: 'InvoiceOutline' },
    { key: 'Medical Certificate (MC)', title: 'MC', icon: 'MCOutline' },
    { key: 'Vaccination Report', title: 'Vaccination', icon: 'VaccinationOutline' },
    { key: 'Referral', title: 'Referral', icon: 'ReferralOutline' },
    { key: 'Health Report', title: 'Health Report', icon: 'HealthReportOutline' },
    { key: 'Lab Report', title: 'Lab', icon: 'LabOutline' },
    { key: 'Radiology Report', title: 'Radiology', icon: 'RadiologyOutline' },
]

export default function DocumentsScreen() {
    const [ tabViewIndex, setTabViewIndex ] = useState(0);

    const renderTabBar = (props: any) => (
        <TabBar
            {...props}
            style={{ backgroundColor: 'transparent' }}
            scrollEnabled={true}
            tabStyle={{ height: 60, width: 'auto', marginLeft: 12 }}
            renderIndicator={() => <></>}
            renderLabel={({ route, focused, color }) => (
                <View style={{ 
                        marginLeft: -10, 
                        marginRight: -10 + (docTypeKeys.at(-1)!.key === route.key ? 12 : 0), 
                        backgroundColor: 'transparent', 
                        borderWidth: 1, 
                        borderColor: focused ? colors.brands2 : colors.brands4, 
                        borderRadius: 8, 
                        height: 36, 
                        // alignItems: 'center', 
                        // justifyContent: 'center',
                        // flexDirection: 'row'
                    }}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 20, marginRight: 20}}>
                        {
                            route.icon && <>
                                <AntdMiniIcon name={route.icon} size={20} color={focused ? colors.brands2 : colors.brands1} />
                                <View style={{ width: 10 }} />
                            </>
                        }
                        <BoldText size={14} style={{ color: focused ? colors.brands2 : colors.brands1 }}>
                            {route.title}
                        </BoldText>
                    </View>
                </View>
            )}
            />
    )    

    return <KeyboardView 
        edges={[]}     
        title='My Records'
        navBack={router.back}
        wrapScroll={false}
        >
        <TabView
            lazy
            renderTabBar={renderTabBar}
            navigationState={{ index: tabViewIndex, routes: docTypeKeys }}
            onIndexChange={setTabViewIndex}
            renderScene={({ route }: { route: Route }) => <DocumentsList type={route.key as DocumentRouteType} />}
            />
    </KeyboardView>
    
}

export const viewDocument = (item: DocumentInfo) => {
    router.navigate({ 
        pathname: item.pathname ?? '/documents/viewer', 
        params: { id: item.id, fileType: item.file_type, filename: item.file_name }
    });
}

export function DocumentsList({ type }: { type: DocumentRouteType }) {
    const { code } = getDocumentAccessCode();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const qry = useInfiniteQuery({
        queryKey: ['documents', type],
        queryFn: ({ pageParam }) => getDocsV2ApiDocumentV2Post({requestBody: { offset: pageParam, type, code }}),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => lastPage.next_cursor
    })

    // Remove the query when the component is unmounted
    useEffect(() => {
        return () => queryClient.removeQueries({ queryKey: ['documents', type ] })
    }, [])


    // flex: 1 is required for the FlatList to scroll
    // Source: https://stackoverflow.com/a/59279254/6944050
    return (
        <View style={{ marginTop: 12, marginBottom: insets.bottom + 12, flex: 1 }}>
            <FlatList
                style={{ overflow: 'visible' }}
                contentContainerStyle={{ marginLeft: 12, marginRight: 12, borderRadius: 10, borderColor: colors.brands4, borderWidth: 1, overflow: 'hidden' }}
                data={qry.data?.pages.map((group, i) => group.data).flat()}
                ItemSeparatorComponent={() => <Divider mx={0} my={0} />}
                ListHeaderComponent={
                    type === 'My Family' 
                        ? <>
                            <View style={{ margin: 12 }}>
                                <BoldText size={14}>For family members over 21:</BoldText>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <CText size={13} style={{ flexShrink: 1, marginRight: 8 }}>
                                        Please call clinic to obtain records such as lab reports
                                    </CText>
                                    <View style={{ borderWidth: 1, borderColor: colors.primary, borderRadius: 4, overflow: 'hidden' }}>
                                        <TouchableHighlight underlayColor={colors.underlay} onPress={() => Linking.openURL('tel:62351852')}>
                                            <View style={{ margin: 12, marginTop: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                                                <AntdMiniIcon name="PhoneOutline" size={17} color={colors.primary} />
                                                <CText size={17} style={{ color: colors.primary, marginLeft: 8 }}>6235 1852</CText>
                                            </View>
                                        </TouchableHighlight>
                                    </View>
                                </View>
                            </View>
                            <Divider mx={0} my={0} />
                        </>
                        : <></>
                }
                renderItem={({ item }) => (
                    <DocumentRow
                        key={item.id}
                        icon={docTypeKeys.find(x => x.key === item.type)?.icon}
                        onPress={() => viewDocument(item)} 
                        title={item.title}
                        subtitle={item.subtitle}
                        content={item.content}
                        type={item.type == 'Invoice' ? 'invoice' : 'mc'}
                        />
                    )}
                ListEmptyComponent={() => qry.isFetching ? <ActivityIndicator style={{ margin: 12 }} /> : <EmptyFlatlist />}
                ListFooterComponent={() => qry.isFetchingNextPage && <ActivityIndicator style={{ margin: 12 }} />}
                keyExtractor={item => item.id}
                onEndReached={({ distanceFromEnd }) => {
                    if (distanceFromEnd < 0) return;
                    qry.fetchNextPage()
                }}
                />
            <ScrollbarPadding />
        </View>
    )
}
