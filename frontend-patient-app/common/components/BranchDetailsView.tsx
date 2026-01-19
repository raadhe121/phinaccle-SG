import React from 'react';
import { View, Linking, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@ant-design/react-native';
import { useQuery } from '@tanstack/react-query';
import { getBranchDetailsApiSupportBranchBranchIdGet } from '@/services/client';
import { BoldText, CText, InfoButton, OpeningHours, ReactQueryChild, Row, Height } from './AntdText';
import AntdMiniIcon from './AntdMiniIcon';
import { colors } from '../utils/config';
import { openMaps } from '../utils/lib';

interface BranchDetailsViewProps {
  branchId: string;
  buttonText?: string;
  onButtonPress?: () => void;
  buttonDisabled?: boolean;
  extraContent?: React.ReactNode;
  showButton?: boolean;
}

export const BranchDetailsView: React.FC<BranchDetailsViewProps> = ({
  branchId,
  buttonText = 'Select location',
  onButtonPress,
  buttonDisabled = false,
  extraContent,
  showButton = true
}) => {
  const qry = useQuery({
    queryKey: ['branch', branchId],
    queryFn: ({ queryKey }) => getBranchDetailsApiSupportBranchBranchIdGet({ branchId: queryKey[1] as string })
  });

  return (
    <>
      <ReactQueryChild query={qry}>
        {qry.data && (
          <>
            {qry.data.image_url && (
              <View style={{ marginLeft: 12, marginRight: 12 }}>
                <Image source={{ uri: qry.data.image_url }} resizeMode='cover' style={{ width: '100%', height: 200, borderRadius: 8 }} />
              </View>
            )}
            {qry.data.address && (
              <View style={{ margin: 12 }}>
                <BoldText size={15}>Location</BoldText>
                <CText size={13} style={{ marginTop: 8 }}>{qry.data.address}</CText>
                <Row>
                  <InfoButton onPress={() => qry.data.url ? Linking.openURL(qry.data.url) : openMaps(qry.data.address!)} style={{ marginTop: 8 }}>
                    Open Maps
                  </InfoButton>
                </Row>
              </View>
            )}
            {(qry.data.phone || qry.data.whatsapp) && (
              <View style={{ margin: 12 }}>
                <BoldText size={15}>Contact</BoldText>
                {qry.data.phone && (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${qry.data.phone}`)}>
                    <Row style={{ marginTop: 8, alignItems: 'center' }}>
                      <AntdMiniIcon name="PhoneOutline" size={16} color={colors.primary} />
                      <CText size={14} style={{ color: colors.primary, marginLeft: 4 }}>
                        {qry.data.phone}
                      </CText>
                    </Row>
                  </TouchableOpacity>
                )}
                {qry.data.whatsapp && (
                  <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${qry.data.whatsapp.replace(/\D/g, '')}`)}>
                    <Row style={{ marginTop: 8, alignItems: 'center' }}>
                      <AntdMiniIcon name="MessageOutline" size={16} color={colors.primary} />
                      <CText size={14} style={{ color: colors.primary, marginLeft: 4 }}>
                        {qry.data.whatsapp}
                      </CText>
                    </Row>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <OpeningHours hours={qry.data.operating_hours} />
            {extraContent}
            {showButton && onButtonPress && (
              <Button type='primary' style={{ margin: 12 }} onPress={onButtonPress} disabled={buttonDisabled}>
                <BoldText size={17} style={{ color: 'white' }}>{buttonText}</BoldText>
              </Button>
            )}
          </>
        )}
      </ReactQueryChild>
      <Height h={12} />
    </>
  );
};