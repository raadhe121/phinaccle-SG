import React, { useState } from "react";
import { BoldText, CText, ExtraTag, ListItem, ListItemView, NavHeader3, ScrollbarPadding, Section, TitleText } from "@/common/components/AntdText";
import { BranchDetailsView } from "@/common/components/BranchDetailsView";
import KeyboardView from "@/common/components/KeyboardView";
import { colors } from "@/common/utils/config";
import { AvailableBranch, getAvailableBranchesApiWalkinBranchesGet } from "@/services/client";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { Route, TabBar, TabView } from "react-native-tab-view";
import AntdMiniIcon from "@/common/components/AntdMiniIcon";

type BranchReturnParams = {
    branchId: string;
    branchService: string;
    branchName: string;
}

type NavBackFunc = (_: BranchReturnParams) => void;

export function BranchPicker({ branch, placeholder = 'Please Select', service }: { branch?: string, placeholder?: string, service: string }) {
    return (
        <ListItem
            onPress={() => router.push({
                    pathname: '/walkin/branches', 
                    params: { service }
                })}
            styles={{
                Content: { color: !branch ? colors.disabled : 'black' },
            }}
            arrow="horizontal"
            divider={false}
            >
            {branch ?? placeholder}
        </ListItem>
    )
}

export default function BranchSelectScreen() {
    const { service } = useLocalSearchParams();
    const [tabViewIndex, setTabViewIndex] = useState(0);

    const qry = useQuery({
        queryKey: ['walkin', 'branches', service],
        queryFn: () => getAvailableBranchesApiWalkinBranchesGet({ service: service as string }),
    })

    const branchesByCategory: { [key: string]: AvailableBranch[] } = qry.data?.reduce((acc, b) => {
        if (!acc[b.category]) {
            acc[b.category] = []
        }
        acc[b.category].push(b)
        return acc
    }, {} as { [key: string]: AvailableBranch[] }) ?? {}

    const tabBarKeys = [
        'All Clinics',
        'Open Only',
        ...Object.keys(branchesByCategory).sort(),
    ]

    const navBack = (params: BranchReturnParams) => {
        router.dismissTo({
            pathname: '/walkin',
            params,
        })
    }

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
                                return <BranchList service={service as string} branches={qry.data} navBack={navBack} />
                            } else if (route.key === 'Open Only') {
                                return <BranchList service={service as string} branches={qry.data.filter((b) => b.availability === 'Open')} navBack={navBack} />
                            }
                            return <BranchList service={service as string} branches={qry.data.filter((b) => b.category === route.key)} navBack={navBack} />
                        }}
                        />
                }
        </KeyboardView>
    )
}

const BranchDetails = ({ service, branch, navBack }: { service: string, branch: AvailableBranch, navBack: NavBackFunc }) => {
    const _navBack = () => navBack({ branchService: service, branchId: branch.id, branchName: branch.name });

    const extraContent = (
        <View style={{ margin: 12, backgroundColor: colors.alert, borderRadius: 4 }}>
            <View style={{ margin: 12, marginTop: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                <AntdMiniIcon name="ExclamationCircleFill" size={16} color={colors.warning} />
                <CText style={{ marginLeft: 8, flexGrow: 1, flexShrink: 1, color: colors.warning }} size={15}>
                    Please note that queue requests starts 15 mins after the clinic is open
                </CText>
            </View>
        </View>
    );

    return (
        <BranchDetailsView
            branchId={branch.id}
            buttonText="Select Clinic"
            onButtonPress={_navBack}
            buttonDisabled={branch.availability != 'Open'}
            extraContent={extraContent}
        />
    );
}

const BranchList = ({ service, branches, navBack }: { service: string, branches: AvailableBranch[], navBack: NavBackFunc }) => {
    const [branchId, setBranchId] = useState<string | undefined>(undefined);
    const branchesByCategory: { [key: string]: AvailableBranch[] } = branches.reduce((acc, b) => {
        if (!acc[b.category]) {
            acc[b.category] = []
        }
        acc[b.category].push(b)
        return acc
    }, {} as { [key: string]: AvailableBranch[] })

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
                                            <BranchDetails branch={b} service={service} navBack={navBack} />
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