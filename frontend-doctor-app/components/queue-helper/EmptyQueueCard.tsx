import React from 'react';
import { View } from '@ant-design/react-native';
import { EmptyIcon } from '../../common/components/AntdMiniIcon';
import { CText } from '../../common/components/AntdText';
import { colors } from '../../common/utils/config';

export default function EmptyQueueCard() {
  return (
      <View style={{
        margin: 12,
        flexDirection: "column",
        alignItems: "center",
      }}>
        <EmptyIcon />
        <CText style={{ color: colors.brands3, marginTop: 8 }}>None at the moment</CText>
      </View>
  );
};
