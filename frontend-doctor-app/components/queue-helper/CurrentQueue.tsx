import React from 'react';
import { TouchableHighlight } from 'react-native';
import { QueueCard } from './QueueCard';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import EmptyQueueCard from './EmptyQueueCard';
import { ReactQueryChild, Section, TitleText } from '../../common/components/AntdText';
import { readOngoingTeleconsultApiDoctorTeleconsultTeleconsultsOngoingGet } from '@/services/client';
import { useQuery } from '@tanstack/react-query';
import { colors } from '@/common/utils/config';

export default function CurrentQueue() {
    const qry = useQuery({
        queryKey: ['teleconsults', 'ongoing'],
        queryFn: readOngoingTeleconsultApiDoctorTeleconsultTeleconsultsOngoingGet
    })
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    const handlePress = (id: string) => navigation.navigate("Consultation", { id })

    return (
        <>
        <TitleText size={18} style={{ marginTop: 24 }}>Current</TitleText>
        <ReactQueryChild query={qry}>
            <Section title={<></>}>
                
                    { !qry.data && <EmptyQueueCard /> }
                    { qry.data && <TouchableHighlight underlayColor={colors.underlay} onPress={() => handlePress(qry.data!.id)}>
                            <QueueCard teleconsult={qry.data} index={0} />
                        </TouchableHighlight> }
            </Section>
        </ReactQueryChild>
        </>
    );
};

