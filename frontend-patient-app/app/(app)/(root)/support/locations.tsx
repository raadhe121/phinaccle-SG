import React, { useState } from "react";
import { BoldText, CText, ExtraTag, ListItemView, NavHeader3, ScrollbarPadding, Section, TitleText } from "@/common/components/AntdText";
import { BranchDetailsView } from "@/common/components/BranchDetailsView";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { getBranchesApiSupportBranchesGet } from "@/services/client";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { Route, TabBar, TabView } from "react-native-tab-view";
import { BranchList } from "@/services/client";

export default function BranchSelectScreen() {
    const { service } = useLocalSearchParams();
    const [tabViewIndex, setTabViewIndex] = useState(0);

    const qry = useQuery({
        queryKey: ['support', 'branches'],
        queryFn: () => getBranchesApiSupportBranchesGet(),
    })

    const branchesByCategory: { [key: string]: BranchList[] } = qry.data?.reduce((acc, b) => {
        if (!acc[b.category]) {
            acc[b.category] = []
        }
        acc[b.category].push(b)
        return acc
    }, {} as { [key: string]: BranchList[] }) ?? {}

    const tabBarKeys = [
        'All Clinics',
        'Open Only',
        ...Object.keys(branchesByCategory).sort(),
    ]

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
                        marginRight: -10 + (tabBarKeys.at(-1) === route.key ? 12 : 0), 
                        backgroundColor: 'transparent', 
                        borderWidth: 1, 
                        borderColor: focused ? colors.brands2 : colors.brands4, 
                        borderRadius: 8, 
                        height: 36, 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                    <BoldText size={14} style={{ color: focused ? colors.brands2 : colors.brands1, marginLeft: 20, marginRight: 20 }}>
                        {route.title}
                    </BoldText>
                </View>
            )}
            />
    )

    return (
        <KeyboardView
            navBack={() => router.back()}
            header={<NavHeader3 navBack={router.back} />}
            wrapScroll={false}
            edges={[]}
            >
                {!qry.data && <ScrollView>
                    { qry.isPending && <ActivityIndicator /> }
                    { qry.isError && <BoldText>{qry.error.message}</BoldText>}
                </ScrollView>}
                { 
                    qry.data && <TabView
                        lazy
                        renderTabBar={renderTabBar}
                        navigationState={{ index: tabViewIndex, routes: tabBarKeys.map((key) => ({ key, title: key })) }}
                        onIndexChange={setTabViewIndex}
                        renderScene={({ route }: { route: Route }) => {
                            if (route.key === 'All Clinics') {
                                return <BranchListRow service={service as string} branches={qry.data} />
                            } else if (route.key === 'Open Only') {
                                return <BranchListRow service={service as string} branches={qry.data.filter((b) => b.availability === 'Open')} />
                            }
                            return <BranchListRow service={service as string} branches={qry.data.filter((b) => b.category === route.key)} />
                        }}
                        />
                }
        </KeyboardView>
    )
}

const BranchDetails = ({ branch }: { service: string, branch: BranchList }) => {
    return (
        <BranchDetailsView
            branchId={branch.id}
            showButton={false}
        />
    );
}

const BranchListRow = ({ service, branches }: { service: string, branches: BranchList[] }) => {
    const [branchId, setBranchId] = useState<string | undefined>(undefined);
    const branchesByCategory: { [key: string]: BranchList[] } = branches.reduce((acc, b) => {
        if (!acc[b.category]) {
            acc[b.category] = []
        }
        acc[b.category].push(b)
        return acc
    }, {} as { [key: string]: BranchList[] })

    return (
        <ScrollView>
            {
                Object.keys(branchesByCategory).sort().map((category) => (
                    <Section
                        key={category}
                        title={<TitleText>{category}</TitleText>}
                        bottom={12}
                        >
                        {
                            branchesByCategory[category].map((b) => {
                                if (branchId === b.id) {
                                    return <View
                                            key={b.id}
                                            style={{ backgroundColor: colors.brands4 }}
                                            >
                                            <ListItemView
                                                onPress={() => setBranchId(undefined)}
                                                extra={
                                                    <ExtraTag color={b.availability === 'Open' ? colors.success : colors.disabled}>{b.availability}</ExtraTag>
                                                }
                                                >
                                                <CText size={16} style={{ marginTop: 14, marginBottom: 14 }}>{b.name}</CText>
                                            </ListItemView>
                                            <BranchDetails branch={b} service={service} />
                                        </View>
                                }


                                return <ListItemView
                                    key={b.id}
                                    onPress={() => setBranchId(b.id)}
                                    extra={
                                        <ExtraTag color={b.availability === 'Open' ? colors.success : colors.disabled}>{b.availability}</ExtraTag>
                                    }
                                    >
                                    <CText size={16} style={{ marginTop: 14, marginBottom: 14 }}>{b.name}</CText>
                                </ListItemView>
                            })
                        }
                    </Section>
                ))
            }
            <ScrollbarPadding />
        </ScrollView>
    )
}