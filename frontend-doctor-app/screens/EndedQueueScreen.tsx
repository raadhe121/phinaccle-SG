import React, { useCallback, useState } from 'react';
import EndedQueue from '../components/queue-helper/EndedQueue';
import { useFocusEffect } from '@react-navigation/native';
import { BoldText, MText, TitleText } from '../common/components/AntdText';
import KeyboardView from '../common/components/KeyboardView';
import { Route, TabBar, TabView } from 'react-native-tab-view';
import { colors } from '../common/utils/config';
import { ActivityIndicator, TouchableHighlight, useWindowDimensions, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { readEndedTeleconsultsWithDoctorIdApiDoctorTeleconsultTeleconsultsEndedGet } from '@/services/client';
import { DatePicker } from '@ant-design/react-native';
import AntdMiniIcon from '@/common/components/AntdMiniIcon';
import dayjs, { Dayjs } from 'dayjs';

export default function EndedQueueScreen() {
    const { width } = useWindowDimensions();
    const queryClient = useQueryClient();
    const [index, setIndex] = React.useState(0);
    const [routes, setRoutes] = React.useState([
        { key: 'all', title: 'All' },
        { key: 'private', title: 'Private' },
        { key: 'mw', title: 'MWs' },
    ]);
    const [ selectedDate, setSelectedDate ] = useState<Dayjs>(dayjs());
    const qry = useQuery({
        queryKey: ['teleconsults', 'ended', selectedDate.format('YYYY-MM-DD')],
        queryFn: ({ queryKey }) => readEndedTeleconsultsWithDoctorIdApiDoctorTeleconsultTeleconsultsEndedGet({ date: queryKey[queryKey.length - 1] }),
    })
    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['teleconsults', 'ended'] })
        }, [])
    );

    const tabWidth = ((width - 12) / routes.length) - 12;
    const renderTabBar = (props: any) => (
        <TabBar
            {...props}
            pressColor='transparent'
            style={{ marginLeft: 6, marginRight: 6, backgroundColor: 'transparent' }}
            tabStyle={{ height: 60 }}
            renderIndicator={() => <></>}
            renderLabel={({ route, focused, color }) => (
                <View style={{
                        width: tabWidth,
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

    const renderScene = ({ route }: { route: Route }) => {
        if (qry.isPending) return <ActivityIndicator style={{ marginTop: 12 }} />;
        if (!qry.data) return;

        switch (route.key) {
            case 'all':
                return <EndedQueue teleconsults={qry.data} />
            case 'private':
                return <EndedQueue teleconsults={qry.data.filter(t => t.patient_type == 'private_patient')} />
            case 'mw':
                return <EndedQueue teleconsults={qry.data.filter(t => t.patient_type == 'migrant_worker')} />
            default:
                return null;
        }
    };

    return (
        <KeyboardView
            edges={[]}
            showLogo={true}
            title={<TitleText size={25}>Ended</TitleText>}
            wrapScroll={false}
            >
            <DateSelector selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
            <TabView
                renderTabBar={renderTabBar}
                navigationState={{ index, routes }}
                onIndexChange={setIndex}
                renderScene={renderScene}
                />
        </KeyboardView>
    );
};

const DateSelector = ({ selectedDate, setSelectedDate }: { selectedDate: Dayjs, setSelectedDate: (_: Dayjs) => void }) => {
    const nextDisabled = selectedDate >= dayjs().startOf('day');

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', margin: 12, marginTop: 6, marginBottom: 6 }}>
            <TouchableHighlight underlayColor={colors.underlay} onPress={() => setSelectedDate(selectedDate.subtract(1, 'day'))} style={{ borderRadius: 8 }}>
                <View style={{ margin: 8 }}>
                    <AntdMiniIcon name="LeftOutline" size={24} />
                </View>
            </TouchableHighlight>

            <DatePicker
                value={selectedDate.toDate()}
                maxDate={new Date()}
                onChange={(date) => setSelectedDate(dayjs(date))}
                format="YYYY-MM-DD">
                <MText size={16} style={{ flexGrow: 1, textAlign: 'center'}}>{selectedDate.format('DD MMM YYYY')}</MText>
            </DatePicker>

            <TouchableHighlight
                underlayColor={colors.underlay}
                disabled={nextDisabled} 
                onPress={() => setSelectedDate(selectedDate.add(1, 'day'))}
                style={{ borderRadius: 8 }}
                >
                <View style={{ margin: 4 }}>
                    <AntdMiniIcon name="RightOutline" size={24} color={nextDisabled ? colors.greyButton : undefined} />
                </View>
            </TouchableHighlight>
        </View>
    )
}