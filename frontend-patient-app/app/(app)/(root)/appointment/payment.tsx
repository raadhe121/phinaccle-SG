import React, { useCallback } from 'react';
import { BoldText, ButtonIcon, CMarkdown, CText, HeaderTitleTag, Height, ListItem, Row, Section, TitleText } from '@/common/components/AntdText';
import KeyboardView from '@/common/components/KeyboardView';
import { Button } from '@ant-design/react-native';
import { router, useFocusEffect } from 'expo-router';
import { PaymentRow } from '../profile/payment_methods';
import { paymentIcon, paymentsIcon } from '@/common/components/AntdMiniIcon';
import { Image } from 'expo-image';
import { checkPaymentSuccessApiAppointmentV1PaymentSuccessPost, getPaymentMethodsApiPaymentMethodsGet, makePaymentApiAppointmentV1PaymentPost, PriceBreakdownItem } from '@/services/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAppointmentStore } from '@/hooks/useAppointment';
import { onError } from '@/common/utils/lib';
import { useOnForegroundFocus } from '@/hooks/useOnForegroundFocus';

export const PaymentBreakdown = ({ items }: { items: PriceBreakdownItem[] }) => {
  return <>
    {items.map(({ title, amount }: { title: string, amount: number }) => (
      <ListItem divider={false} key={title} extra={<CText size={16}>{formatCurrency(amount)}</CText>}>
        <CMarkdown size={16}>{title}</CMarkdown>
      </ListItem>
    ))}
  </>
}

const formatCurrency = (amt: number) => {
  return amt.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });
};

export default function PaymentScreen() {
  const { payment } = useAppointmentStore();

  const successMutation = useMutation({
    mutationFn: checkPaymentSuccessApiAppointmentV1PaymentSuccessPost,
    onSuccess: (resp) => {
      // Payment is already successful, redirect to the consultation page
      if (resp.success) {
        router.dismissTo('/')
        router.navigate({ pathname: '/appointment/consultation', params: { id: payment!.id } })
      }
    },
    onError: onError
  })

  const paymentMutation = useMutation({
    mutationFn: makePaymentApiAppointmentV1PaymentPost,
    onSuccess: (resp) => {
      console.log('paymentMutation onSuccess', resp)
      // Payment is already successful, redirect to the consultation page
      if (resp.redirect_pathname == '/appointment/consultation') {
        router.dismissTo('/');
        router.navigate({ pathname: '/appointment/consultation', params: { id: payment!.id } })
      // Payment is not successful, redirect to the payment page
      } else {
        router.navigate({ 
          pathname: resp.redirect_pathname, 
          params: {
            payment_provider_params: JSON.stringify(resp.payment_provider_params),
          }
        })
      }
    },
    onError: onError
  });

  // Check when app is back to foreground. 
  // Source: https://shemseddine.medium.com/a-react-native-hook-for-when-the-app-is-back-in-focus-d7023799d085
  useOnForegroundFocus(() => {
    successMutation.mutate({ appointmentId: payment!.id })
  })

  if (!payment) {
    return (
      <KeyboardView
        navBack={() => router.back()}
        title={<HeaderTitleTag tag='Book Appointment' title='Review Details' />}
      >
        <CText>Failed to load payment details</CText>
      </KeyboardView>
    )
  }

  const action = (
    <Button
      onPress={() => {
        paymentMutation.mutate({ appointmentId: payment.id })
      }}
      type="primary"
      loading={paymentMutation.isPending}
      disabled={paymentMutation.isPending}
    >
      Make Payment
    </Button>
  );

  return (
    <KeyboardView
      action={action}
      navBack={() => router.back()}
      title={<HeaderTitleTag tag='Book Appointment' title='Review Details' />}
    >
      <Section title={
        <Row style={{ margin: 12, marginBottom: 0 }}>
          <Image source={paymentsIcon} contentFit="contain" style={{ width: 25, height: 25 }} />
          <TitleText style={{ marginLeft: 8 }}>Appointment Fees Payable</TitleText>
        </Row>
      }>
        <PaymentBreakdown items={[
          ...payment.items,
          { title: 'GST', amount: payment.gst}
        ]} />
        <ListItem divider={false} extra={<BoldText size={16}>{formatCurrency(payment.total)}</BoldText>}>
          <BoldText size={16}>Total To Pay</BoldText>
        </ListItem>
      </Section>

      <PaymentMethodSection />
      <Height h={24} />
    </KeyboardView>
  );
}

const PaymentMethodSection = () => {
  const qry = useQuery({
    queryKey: ['payment_methods'],
    queryFn: () => getPaymentMethodsApiPaymentMethodsGet(),
  })

  const managePayments = () => router.navigate('/profile/payment_methods');

  return (
    <Section title={
      <Row style={{ margin: 12, marginBottom: 0 }}>
        <Image source={paymentIcon} contentFit="contain" style={{ width: 25, height: 25 }} />
        <TitleText style={{ marginLeft: 8 }}>Payment Method</TitleText>
      </Row>
    }>
      <PaymentRow
        payment={qry.data?.payment_methods.find((p) => p.is_default) ?? qry.data?.payment_methods[0]}
        extra={<ButtonIcon icon='EditSOutline' onPress={managePayments}>Change</ButtonIcon>}
      />
    </Section>
  )
}