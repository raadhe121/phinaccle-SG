import { BoldText, ButtonIcon, CText, Label, ListItemView, Row, Section, TitleText } from '@/common/components/AntdText';
import { Input } from '@ant-design/react-native';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Image } from 'expo-image'
import { colors } from '@/common/utils/config';
import AntdMiniIcon, { paymentsIcon } from '@/common/components/AntdMiniIcon';
import { useMutation } from '@tanstack/react-query';
import { validateCorporateCodeApiTeleconsultPrepaymentValidateCodeGet } from '@/services/client';
import { toast } from '@/common/utils/modal';
import { onError } from '@/common/utils/lib';
import React from 'react';
import { useTeleconsultProvider } from '../teleconsult_provider';
import { PaymentBreakdown } from '../payment';

export const RatesForm = () => {
    const { rates, setValidCorpCode } = useTeleconsultProvider();
    // Used for storing and validating corporate code
    const [ corpCode, setCorpCode ] = useState<string>('');
    const corpCodeMutation = useMutation({
        mutationFn: validateCorporateCodeApiTeleconsultPrepaymentValidateCodeGet,
        onSuccess: () => {
            toast.success('Corporate Code Applied')
            setCorpCode('');
            setValidCorpCode(corpCode);
        },
        onError
    })

    const applyCorporateCode = () => corpCodeMutation.mutate({ code: corpCode });
    const clearCorporateCode = () => setValidCorpCode(undefined);
    
    if (!rates) {
        return <ActivityIndicator style={{ marginTop: 12 }} />;
    }

    return <Section title={
        <Row style={{ marginLeft: 12, marginTop: 12 }}>
            <Image source={paymentsIcon} resizeMode="contain" style={{ width: 25, height: 25 }} />
            <TitleText style={{ marginLeft: 8 }}>Consultation Fees Payable</TitleText>
        </Row>
        }>
        <PaymentBreakdown breakdown={rates.breakdown} />
        {
            !rates.is_pcp && <Label label='Corporate Code'>
                <Input
                    value={rates.code ?? corpCode}
                    onChangeText={(val) => setCorpCode(val?.toUpperCase())}
                    placeholder="Enter here"
                    disabled={!!rates.code}
                    suffix={
                        <>
                            {rates.code && <ButtonIcon icon="CloseCircleOutline" onPress={clearCorporateCode}>Clear</ButtonIcon>}
                            {!rates.code && <ButtonIcon onPress={applyCorporateCode} disabled={!corpCode || corpCode.length == 0} loading={corpCodeMutation.isPending}>Apply</ButtonIcon>}
                        </>
                    }
                />
            </Label>
        }
        <ListItemView extra={<CText size={16}>{`\$${rates.total.toFixed(2)}`}</CText>}>
            <BoldText size={16}>Total To Pay</BoldText>
        </ListItemView>
        {
            !rates.is_pcp && (
                <>
                    <View style={{ backgroundColor: colors.brands4, margin: 12, marginTop: 16, marginBottom: 16, borderRadius: 4 }}>
                        <View style={{ margin: 12, marginTop: 8, marginBottom: 8, flexDirection: 'row' }}>
                            <AntdMiniIcon name='SoundOutline' size={18} color={colors.brands2} />
                            <CText size={15} style={{ color: colors.brands2, marginLeft: 8, flexShrink: 1 }}>Final price including prescription and delivery (if any) to be confirmed & paid only after consultation.</CText>
                        </View>
                    </View>
                    <View style={{ backgroundColor: colors.alert, margin: 12, marginTop: 4, marginBottom: 16, borderRadius: 4 }}>
                        <View style={{ margin: 12, marginTop: 8, marginBottom: 8, flexDirection: 'row' }}>
                            <AntdMiniIcon name='SoundOutline' size={18} color={colors.warning} />
                            <CText size={15} style={{ color: colors.warning, marginLeft: 8, flexShrink: 1 }}>If you are on an insurance scheme, please apply ‘INS’ in the corporate code field.</CText>
                        </View>
                    </View>
                </>
            )
        }
    </Section>
}