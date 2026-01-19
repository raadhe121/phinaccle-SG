import React, { useEffect } from 'react';
import { ScrollView, TouchableHighlight, useWindowDimensions } from 'react-native';
import { Toast, View } from '@ant-design/react-native';
import { QueueCard } from './QueueCard';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { BoldText, Height, ReactQueryChild, Section, TabBarPadding, TitleText } from '../../common/components/AntdText';
import { Route, TabBar, TabView } from 'react-native-tab-view';
import { colors } from '../../common/utils/config';
import { PatientType, readOngoingTeleconsultApiDoctorTeleconsultTeleconsultsOngoingGet, readTeleconsultsApiDoctorTeleconsultTeleconsultsGet, TeleconsultResponse } from '@/services/client';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import EmptyQueueCard from './EmptyQueueCard';

const UpcomingQueueList = ({ type, handlePress }: {  type: PatientType, handlePress: (id: string) => void }) => {
    const qry = useQuery({
        queryKey: ['teleconsults'],
        queryFn: readTeleconsultsApiDoctorTeleconsultTeleconsultsGet
    })

    const teleconsults = qry.data?.filter((teleconsult: TeleconsultResponse) => teleconsult.patient_type === type) ?? [];
    return (
        <ScrollView style={{ overflow: 'visible' }}>
            <ReactQueryChild query={qry}>
                <>
                {teleconsults.length === 0 && <Section title={<></>}><EmptyQueueCard /></Section>}
                {
                    teleconsults.length > 0 && (
                        <Section title={<></>}>
                            { teleconsults.map((teleconsult, index) => (
                                <TouchableHighlight underlayColor={colors.underlay} key={teleconsult.id} onPress={() => handlePress(teleconsult.id)}>
                                    <QueueCard key={teleconsult.id} index={index + 1} teleconsult={teleconsult} />
                                </TouchableHighlight>
                            )) }
                        </Section>
                    )
                }
                </>
            </ReactQueryChild>
            <Height h={12} />
            <TabBarPadding />
        </ScrollView>
    )
}

export default function UpcomingQueue({ query }: { query: UseQueryResult<TeleconsultResponse[]> }) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>()
    const { width } = useWindowDimensions();

    const ongoingQry = useQuery({
        queryKey: ['teleconsults', 'ongoing'],
        queryFn: readOngoingTeleconsultApiDoctorTeleconsultTeleconsultsOngoingGet
    })

    const [index, setIndex] = React.useState(0);
    const [routes, setRoutes] = React.useState([
        { key: 'private', title: 'Private (0)' },
        { key: 'mw', title: 'MWs (0)' },
    ]);

    const handlePress = (id: string) => {
        // if (ongoingQry?.data) {
        //     Toast.fail({
        //         content: "Please complete the current consultation first",
        //         duration: 1,
        //         stackable: true,
        //     });
        //     return;
        // }
        navigation.navigate("Consultation", { id });
    }

    useEffect(() => {
        if (!query.data) return;
        const privateteleconsults = query.data.filter((teleconsult: TeleconsultResponse) => teleconsult.patient_type === 'private_patient');
        const migrantWorkers = query.data.filter((teleconsult: TeleconsultResponse) => teleconsult.patient_type === 'migrant_worker');

        console.log("Updated Routes", privateteleconsults?.length)

        setRoutes([
            { key: 'private', title: `Private (${privateteleconsults?.length})` },
            { key: 'mw', title: `MWs (${migrantWorkers?.length})` },
        ])
    }, [query.data])

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
        switch (route.key) {
            case 'private':
                return <UpcomingQueueList type='private_patient' handlePress={handlePress} />
            case 'mw':
                return <UpcomingQueueList type='migrant_worker' handlePress={handlePress} />
            default:
                return null;
        }
    };

    return (
        <View style={{ flexGrow: 1, marginTop: 12 }}>
            <TitleText>In-Queue</TitleText>
            <TabView
                renderTabBar={renderTabBar}
                navigationState={{ index, routes }}
                onIndexChange={setIndex}
                renderScene={renderScene}
            />
        </View >
    );
};
