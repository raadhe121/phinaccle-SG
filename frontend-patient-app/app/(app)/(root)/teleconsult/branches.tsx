import React, { useState } from "react";
import { BoldText, CText, ExtraTag, ListItem, ListItemView, NavHeader3, ScrollbarPadding, Section, TitleText } from "@/common/components/AntdText";
import { BranchDetailsView } from "@/common/components/BranchDetailsView";
import KeyboardView from "@/common/components/KeyboardView";
import { antd, colors } from "@/common/utils/config";
import { AvailableBranch, CollectionMethod, getAvailableBranchesApiTeleconsultV2BranchesGet, GetAvailableBranchesApiTeleconsultV2BranchesGetResponse } from "@/services/client";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View, ActivityIndicator } from "react-native";
import { Route, TabBar, TabView } from "react-native-tab-view";
import { Modal } from "@ant-design/react-native";
import Markdown from "react-native-markdown-display";

export function BranchPicker({ branch, placeholder = 'Please Select', mode }: { branch?: string, placeholder?: string, mode: CollectionMethod }) {
    return (
        <ListItem
            onPress={() => router.push({
                    pathname: '/teleconsult/branches', 
                    params: { mode }
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
    const { mode } = useLocalSearchParams();
    const [tabViewIndex, setTabViewIndex] = useState(0);

    const qry = useQuery({
        queryKey: ['teleconsult', 'branches', mode],
        queryFn: () => getAvailableBranchesApiTeleconsultV2BranchesGet({ mode: mode as CollectionMethod }),
    })
    console.log("Collection Mode: ", mode)

    const branchesByCategory: { [key: string]: AvailableBranch[] } = qry.data?.branches.reduce((acc: { [key: string]: AvailableBranch[] }, b: AvailableBranch) => {
        if (!acc[b.category]) {
            acc[b.category] = []
        }
        acc[b.category].push(b)
        return acc
    }, {} as { [key: string]: AvailableBranch[] }) ?? {}

    const tabBarKeys = [
        'All Clinics',
        'Same Day',
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
                            return <BranchList data={qry.data} branches={qry.data.branches} />
                        } else if (route.key === 'Same Day') {
                            return <BranchList data={qry.data} branches={qry.data.branches.filter((b: AvailableBranch) => b.availability === 'Same Day')} />
                        }
                        return <BranchList data={qry.data} branches={qry.data.branches.filter((b: AvailableBranch) => b.category === route.key)} />
                    }}
                    />
            }
        </KeyboardView>
    )
}

const BranchDetails = ({ data, branch }: { data: GetAvailableBranchesApiTeleconsultV2BranchesGetResponse, branch: AvailableBranch }) => {
    const onSelectClinic = () => {
        const mkStyles = { 
            body: { ...antd.defaultText, fontSize: 14, textAlign: 'center', color: colors.text, align: 'center', justifyContent: 'center' },
            strong: antd.boldText,
        }
    
        const msg_key = branch.msg_key || 'default';
        const defaultMessage = "Kindly note the following:\n[]()\n1. Your selected clinic will serve as the location where you collect your medications.";
        const msg = data?.messages?.[msg_key] ?? defaultMessage;
    
        Modal.alert(
            <BoldText size={16}>Location & Fees</BoldText>,
            <Markdown style={mkStyles as any}>{msg}</Markdown>,
            [
                { 
                    text: 'Cancel', 
                    onPress: () => {}, 
                },
                {   
                    text: 'I Accept',
                    style: antd.boldText,
                    onPress: () => router.dismissTo({
                            pathname: '/teleconsult/payment',
                            params: { branchId: branch.id, branchName: branch.name },
                        })
                },
            ]
        )
    }

    return (
        <BranchDetailsView
            branchId={branch.id}
            buttonText="Select Clinic"
            onButtonPress={onSelectClinic}
            buttonDisabled={branch.availability == 'Closed'}
        />
    );
}

const BranchList = ({ data, branches }: { data: GetAvailableBranchesApiTeleconsultV2BranchesGetResponse, branches: AvailableBranch[] }) => {
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
                                                    <ExtraTag color={b.availability === 'Same Day' ? colors.success : colors.disabled}>{b.availability}</ExtraTag>
                                                }
                                                >
                                                <CText size={16} style={{ marginTop: 14, marginBottom: 14 }}>{b.name}</CText>
                                            </ListItemView>
                                            <BranchDetails data={data} branch={b} />
                                        </View>
                                }


                                return <ListItemView
                                    key={b.id}
                                    onPress={() => setBranchId(b.id)}
                                    extra={
                                        <ExtraTag color={b.availability === 'Same Day' ? colors.success : colors.disabled}>{b.availability}</ExtraTag>
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