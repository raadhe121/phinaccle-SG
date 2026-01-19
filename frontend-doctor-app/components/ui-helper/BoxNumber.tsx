import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from '@ant-design/react-native';
import { colors } from '../../common/utils/config';
import { BoldText } from '../../common/components/AntdText';
import AntdMiniIcon from '../../common/components/AntdMiniIcon';

export const BoxNumber = ({ index }: { index: number }) => (
    <View style={styles.container}>
        <BoldText size={18} style={{ color: colors.brands2 }}>{index}</BoldText>
    </View>
);

export const BoxVideo = () => (
    <View style={{ ...styles.container, backgroundColor: colors.brands2 }}>
        <AntdMiniIcon name="VideoOutlineAlt" color="white" size={20} />
       </View>
)

const styles = StyleSheet.create({
    container: {
        borderColor: colors.brands2,
        borderRadius: 20,
        borderWidth: 1,
        minWidth: 35,
        minHeight: 35,
        alignItems: "center",
        justifyContent: "center"
    },
})
