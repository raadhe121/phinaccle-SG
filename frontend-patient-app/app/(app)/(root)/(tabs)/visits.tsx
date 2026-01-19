import React from 'react';
import { BoldText, EmptySection, H1Text, Height, Row, Section, TabBarPadding } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { ActivityIndicator, ScrollView, TouchableHighlight, View } from "react-native";
import { Image } from 'expo-image'
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { checkmarkIcon } from "@/common/components/AntdMiniIcon";
import { colors } from "@/common/utils/config";
import { ActivityRow, DocumentRow } from "../walkin/consultation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Route, TabBar, TabView } from 'react-native-tab-view';
import { getAppointmentsApiAppointmentV1AppointmentsGet, getTeleconsultsApiVisitsTeleconsultsGet, getWalkinsApiVisitsWalkinsGet, VisitsResp, VisitType } from "@/services/client";
import { useLaunchActivity } from "@/hooks/useLaunchActivity";

type ActivityType = 'teleconsult' | 'walkin' | 'appointment';
const activityTypeKeys = [
    { key: 'teleconsult', title: 'Telemedicine' },
    { key: 'walkin', title: 'Queue Requests' },
    { key: 'appointment', title: 'Appointments' },
]

export default function ActivitiesScreen() {
    const [tabViewIndex, setTabViewIndex] = useState(0);

    // Source: https://github.com/satya164/react-native-tab-view/blob/main/src/TabBarIndicator.tsx#L48
    // const renderIndicator = ({ position, navigationState, getTabWidth, layout, width, gap }) => {

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
                        marginRight: -10 + (activityTypeKeys.at(-1)!.key === route.key ? 12 : 0), 
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

    return <KeyboardView edges={[]} 
        showLogo={true}
        title={
            <Row style={{ margin: 12 }}>
                <H1Text style={{ margin: 0, marginTop: 0, marginRight: 8 }}>My Visits</H1Text>
                <Image source={checkmarkIcon} resizeMode="contain" style={{ width: 32, height: 32 }} />
            </Row>
        }
        wrapScroll={false}
        >
        <TabView
            lazy
            renderTabBar={renderTabBar}
            navigationState={{ index: tabViewIndex, routes: activityTypeKeys }}
            onIndexChange={setTabViewIndex}
            renderScene={({ route }: { route: Route }) => <ActivityList type={route.key as ActivityType} />}
            />
    </KeyboardView>
}

type ActivityListProps = {
    type: ActivityType;
}

const ActivityList = ({ type }: ActivityListProps) => {
    const toastRef = useRef<() => void>();
    const { launchActivity } = useLaunchActivity();
    const queryClient = useQueryClient();
    const queryFuncMapping: { [key in ActivityType]: any } = {
        'teleconsult': getTeleconsultsApiVisitsTeleconsultsGet,
        'walkin': getWalkinsApiVisitsWalkinsGet,
        'appointment': getAppointmentsApiAppointmentV1AppointmentsGet,
    }

    const { isPending, isError, data, error } = useQuery<Array<VisitsResp>>({
        queryKey: ['activities', type],
        queryFn: queryFuncMapping[type],
    })

    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['activities', type] })
        }, [])
    )

    const onActivityPress = (visitType: VisitType, id?: string | null) => {
        if (!id) {
            launchActivity(visitType);
        } else {
            router.navigate({ pathname: `/${visitType}/consultation`, params: { id } })
        }
    }

    let child = <></>;
    if (isPending) {
        child = <ActivityIndicator />;
    } else if (isError) {
        child = <span>Error: {error.message}</span>;
    } else if (data.length === 0) {
        child = <EmptySection />
    } else {
        child = <Section title={<></>}>
            {
                data.map((activity: VisitsResp) => (
                    <TouchableHighlight key={activity.id} underlayColor={colors.underlay} onPress={() => onActivityPress(type as VisitType, activity.id)}>
                        <ActivityRow  {...activity} />
                    </TouchableHighlight>
                ))
            }
        </Section>
    }

    return <ScrollView>
        {child}
        <Height h={12} />
        <TabBarPadding />
    </ScrollView>
}