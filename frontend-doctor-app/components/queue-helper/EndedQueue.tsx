import React from 'react';
import { QueueCard } from './QueueCard';
import EmptyQueueCard from './EmptyQueueCard';
import { Height, Section, TabBarPadding } from '../../common/components/AntdText';
import { TeleconsultResponse } from '@/services/client';
import { ScrollView, TouchableHighlight } from 'react-native';
import { colors } from '@/common/utils/config';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';

export default function EndedQueue({ teleconsults }: { teleconsults: TeleconsultResponse[] }) {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const handlePress = (id: string) => navigation.navigate("Consultation", { id })

    if (teleconsults.length == 0) {
        return <Section title={<></>}><EmptyQueueCard /></Section>
    }

    return (
        <ScrollView>
            <Section title={<></>}>
                {
                    teleconsults.map((teleconsult, index) => {
                        const card = <QueueCard key={teleconsult.id} index={index + 1} teleconsult={teleconsult} />;
                        if (teleconsult.status !== 'Checked Out') {
                            return <TouchableHighlight underlayColor={colors.underlay} key={teleconsult.id} onPress={() => handlePress(teleconsult.id)}>
                                {card}
                            </TouchableHighlight>
                        } else {
                            return card;
                        }  
                    })
                }
            </Section>
            <Height h={12} />
            <TabBarPadding />
        </ScrollView>
    )
};
