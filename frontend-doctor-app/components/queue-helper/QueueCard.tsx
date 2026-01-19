import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from '@ant-design/react-native';
import { BoxNumber, BoxVideo } from '../ui-helper/BoxNumber';
import { formatDateTime } from '../../common/utils/lib';
import { BoldText, CText, HeaderTag } from '../../common/components/AntdText';
import { colors, tagColorMapping } from '../../common/utils/config';
import { SGiMedICType, TeleconsultResponse } from '@/services/client';

export const idLabel: { [key in SGiMedICType]: string } = {
    'PINK IC': 'NRIC',
    'BLUE IC/ENTRY PERMIT': 'NRIC',
    'FIN NUMBER': 'FIN',
    'PASSPORT': 'Passport',
}

export const QueueCard = ({ index = 1, teleconsult, showIndex = true }: { index?: number, teleconsult: TeleconsultResponse, showIndex?: boolean }) => {
    const statusTxt = teleconsult.status == 'Checked In' 
        ? teleconsult.additional_status ?? teleconsult.status 
        : teleconsult.status;
    const tagColor = tagColorMapping?.[statusTxt];

    return (
        <View style={styles.container} key={teleconsult.id}>
            {
                showIndex && <View style={styles.leftCard}>
                    {
                        teleconsult.status === 'Consult Start'
                            ? <BoxVideo />
                            : <BoxNumber index={index} />
                    }
                </View>
            }
            <View style={styles.rightCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CText size={13}>{formatDateTime(teleconsult.checkin_time)}</CText>
                    <HeaderTag color={tagColor}>{statusTxt}</HeaderTag>
                </View>
                <BoldText size={17}>{teleconsult.user.name}</BoldText>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                    {/* SGiMed Queue Number */}
                    <View style={{ borderWidth: 1, borderRadius: 7, borderColor: colors.brands2, alignItems: 'center', marginRight: 4, marginTop: 4 }}>
                        <View style={{ margin: 6, marginTop: 4, marginBottom: 4 }}>
                            <CText size={13} style={{ color: colors.brands2 }}>Queue: {teleconsult.queue_number}</CText>
                        </View>
                    </View>

                    {/* ID Information */}
                    <View style={{ borderWidth: 1, borderRadius: 7, borderColor: colors.disabled, alignItems: 'center', marginRight: 4, marginTop: 4 }}>
                        <View style={{ margin: 6, marginTop: 4, marginBottom: 4 }}>
                            <CText size={13} style={{ color: colors.disabled }}>{idLabel[teleconsult.user.ic_type]}: {teleconsult.user.nric}</CText>
                        </View>
                    </View>

                    {/* Branch Name */}
                    <View style={{ borderWidth: 1, borderRadius: 7, borderColor: colors.warning, alignItems: 'center', marginRight: 4, marginTop: 4 }}>
                        <View style={{ margin: 6, marginTop: 4, marginBottom: 4 }}>
                            <CText size={13} style={{ color: colors.warning }}>Branch: {teleconsult.branch_name}</CText>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        // backgroundColor: "white",
        margin: 12,
        marginTop: 16,
        marginBottom: 16,
    },
    leftCard: {
        alignItems: 'center',
        marginRight: 12,
    },
    rightCard: {
        flex: 1,
    },
    dateText: {
        fontSize: 12,
        fontWeight: "300",
        marginBottom: 5,
    },
    nameText: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 5,
    },
    finText: {
        fontSize: 14,
        fontWeight: "400",
        marginBottom: 10,
    },
    numberText: {
        fontSize: 18,
        fontWeight: "700",
    },
    dateStatusContainer: {
        flexDirection: "row",
        justifyContent: "space-between"
    }
})
