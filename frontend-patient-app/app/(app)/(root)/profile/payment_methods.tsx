import { modal } from '@/common/utils/modal';
import { CText, HeaderTitleTag, Height, ListItemView, ReactQueryChild, Section, SmallButtonIcon, SubtitleText } from '@/common/components/AntdText';
import KeyboardView from '@/common/components/KeyboardView';
import { Button, Toast } from '@ant-design/react-native';
import { router, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback } from 'react';
import { ActivityIndicator, Text, TouchableHighlight, View } from 'react-native';
import AntdMiniIcon, { getPaymentMethodImg } from '@/common/components/AntdMiniIcon';
import { deletePaymentMethodApiPaymentMethodsDeleteDelete, getPaymentMethodsApiPaymentMethodsGet, PaymentMethodDetail, setDefaultPaymentMethodApiPaymentMethodsSetDefaultPost } from '@/services/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onError } from '@/common/utils/lib';
import { colors } from '@/common/utils/config';

export const PaymentRow = ({ payment, extra }: { payment?: PaymentMethodDetail, extra: ReactNode }) => (
    
    <ListItemView extra={extra}>
        {
            payment && <View style={{flexDirection: 'row', alignItems: 'center'}}>
                { getPaymentMethodImg(payment.icon) }
                <View style={{marginLeft: 8}}>
                    <CText>{payment.title}</CText>
                    {payment.subtitle && <SubtitleText>{payment.subtitle}</SubtitleText>}
                </View>
            </View>
        }
    </ListItemView>
)

const lighten = (color: string, amount: number) => {
    const [r, g, b] = color.match(/\w\w/g)!.map(x => parseInt(x, 16));
    return `rgba(${r}, ${g}, ${b}, ${amount})`;
}

export const CTAButton = ({ color, onPress, title, icon }: { color: string, onPress: () => void, title: string, icon?: string }) => (
    <View style={{ marginLeft: 4, borderRadius: 8, borderColor: color, borderWidth: 1, overflow: 'hidden' }}>
        <TouchableHighlight underlayColor={lighten(color, 0.2)} onPress={onPress}>
            <View style={{ marginLeft: 12, marginRight: 12, marginTop: 4, marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                {icon && <AntdMiniIcon name={icon} size={13} style={{ marginRight: 4 }} />}
                <CText size={13} style={{ color }}>{title}</CText>
            </View>
        </TouchableHighlight>
    </View>
)

export default function PaymentMethods() {
    const queryClient = useQueryClient();
    const qry = useQuery({
        queryKey: ['payment_methods'],
        queryFn: () => getPaymentMethodsApiPaymentMethodsGet(),
    })

    const setDefaultMutation = useMutation({
        mutationFn: setDefaultPaymentMethodApiPaymentMethodsSetDefaultPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment_methods'] })
        },
        onError: onError
    })

    const removePaymentMutation = useMutation({
        mutationFn: deletePaymentMethodApiPaymentMethodsDeleteDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment_methods'] })
            Toast.success({
                content: 'Payment method removed',
                duration: 1,
                stackable: true,
            });
        },
        onError: onError
    })

    const removePaymentMethod = (id: string) => {
        modal.warn({
            title: 'Remove Payment Method?',
            content: 'Are you sure you want to remove this payment method?',
            labels: ['Cancel', 'Remove'],
            onCancel: () => {},
            onOk: () => removePaymentMutation.mutate({ requestBody: { payment_method_id: id } })
        })
    }

    useFocusEffect(
        useCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['payment_methods'] })
        }, [])
    )

    const setDefault = async (row: PaymentMethodDetail) => {
        setDefaultMutation.mutate({ requestBody: { payment_method: row.method, payment_method_id: row.id } });
    }

    const action = <Button onPress={() => router.back()} type="primary">
            Done
        </Button>

    return (
        <KeyboardView
            action={action}
            navBack={() => router.back()}
            title={<HeaderTitleTag tag='My Profile' title='Payment Methods' />}
            >
            <ReactQueryChild query={qry}>
                <Section title={<Height h={24} />}>
                { 
                    qry.data && qry.data.payment_methods.map((payment) => (
                        <PaymentRow
                            key={payment.id}
                            payment={payment}
                            extra={
                                <View style={{ flexDirection: 'row'}}>
                                    { (setDefaultMutation.isPending || qry.isFetching) && setDefaultMutation.variables?.requestBody?.payment_method_id == payment.id && <ActivityIndicator size="small" color={colors.primary} />}
                                    { payment.can_remove && <CTAButton color={colors.danger} onPress={() => removePaymentMethod(payment.id)} title="Remove" /> }
                                    {
                                        payment.is_default
                                            ? <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center'}}>
                                                <AntdMiniIcon name="CheckCircleFill" size={12} color={colors.success} />
                                                <Text style={{marginLeft: 4, color: colors.success}}>Default</Text>
                                            </View>
                                            : <CTAButton color={colors.primary} onPress={() => setDefault(payment)} icon='CheckOutline' title="Default" />
                                    }
                                </View>
                            }
                            />
                    ))
                }
                </Section>
            </ReactQueryChild>
            <View style={{ height: 12 }}></View>
            { qry.data?.enable_add_2c2p && <Section title='Add New'>
                {/* <ListItemView
                    onPress={addNets}
                    extra={<Ionicons name="chevron-forward" size={24} />}
                    >
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Image source={paymentMethodsImgs['nets']} style={{ width: 80, height: 24, resizeMode: 'contain'}} />
                        <View style={{marginLeft: 8}}>
                            <Text>NETS Bank Card</Text>
                            <Text size={12} style={{color: 'grey'}}>Add NETS Bank Card</Text>
                        </View>
                    </View>
                </ListItemView> */}
                {
                    qry.data?.enable_add_2c2p && <ListItemView onPress={() => router.push('/payments/2c2p/add_card')}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <AntdMiniIcon name="BankcardOutline" size={18} />
                            <View style={{marginLeft: 10}}>
                                <CText size={16}>Add Debit / Credit Card</CText>
                            </View>
                        </View>
                    </ListItemView>
                }
            </Section>}
        </KeyboardView>
    )
}