import React from "react";
import { BoldText, ButtonIcon, CMarkdown, CText, HeaderTag, HeaderTitleTag, Height, ListItem, ListItemView, ReactQueryChild, Row, Section, TitleText } from "@/common/components/AntdText";
import { Linking, TouchableHighlight, View } from "react-native";
import { Image } from 'expo-image';
import { colors, tagColorMapping } from "@/common/utils/config";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KeyboardView from '@/common/components/KeyboardView';
import AntdMiniIcon, { getPaymentMethodImg, myfamilyIcon } from "@/common/components/AntdMiniIcon";
import { paymentsIcon } from "@/common/components/AntdMiniIcon";
import { formatDateTime, onError, openMaps as openMapsUtil } from "@/common/utils/lib";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { modal } from "@/common/utils/modal";
import { cancelAppointmentApiAppointmentV1AppointmentsIdCancelPost, getAppointmentDetailsApiAppointmentV1AppointmentsIdGet, GetAppointmentDetailsApiAppointmentV1AppointmentsIdGetResponse } from "@/services/client";

export default function AppointmentDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const qry = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointmentDetailsApiAppointmentV1AppointmentsIdGet({ id: id as string })
  });

  return (
    <KeyboardView
      edges={[]}
      navBack={() => router.back()}
      title={<HeaderTitleTag tag='Activities' title='Appointment' />}
    >
      <ReactQueryChild query={qry}>
        {qry.data && (
          <>
            <AppointmentSection appointment={qry.data} />
            <ConsultForSection consultFor={qry.data.consult_for} />
            {qry.data.payments.total > 0 && <PaymentsSection payments={qry.data.payments} />}
          </>
        )}
      </ReactQueryChild>
      <Height h={insets.bottom + 12} />
    </KeyboardView>
  );
}

const AppointmentActions = ({ id, actions }: { id: string, actions: { cancel: boolean, reschedule: boolean } }) => {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: cancelAppointmentApiAppointmentV1AppointmentsIdCancelPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
    onError
  });

  const ActionButton = ({ onPress, label, loading }: { onPress: () => void, label: string, loading?: boolean }) => {
    return (
      <TouchableHighlight onPress={loading ? undefined : onPress} underlayColor={colors.underlay} style={{ flex: 1, borderColor: colors.primary, borderWidth: 1, borderRadius: 8, padding: 12, justifyContent: 'center', alignItems: 'center' }}>
        <BoldText size={18} style={{ color: colors.primary }}>{label}</BoldText>
      </TouchableHighlight>
    )
  }

  const onCancel = () => {
    modal.warn({
      iconColor: colors.danger,
      title: "Cancel appointment & agree to not be refunded?",
      content: <CMarkdown size={15} textAlign="center">Are you sure you want to cancel this health screening appointment? **Please note that your payment will not be refunded**, and the date and timeslot you selected will become available for others.</CMarkdown>,
      labels: ["Cancel", "Yes, Cancel"],
      onCancel: () => {},
      onOk: () => cancelMutation.mutate({ id })
    });
  }

  const onReschedule = () => {
    router.push({
      pathname: '/appointment/reschedule',
      params: { id }
    });
  }

  return (
    <View style={{ flexDirection: 'row', margin: 12, gap: 12 }}>
      {actions.cancel && <ActionButton onPress={onCancel} label="Cancel" loading={cancelMutation.isPending} />}
      {actions.reschedule && <ActionButton onPress={onReschedule} label="Reschedule" />}
    </View>
  )
}

const AppointmentSection = ({ appointment }: { appointment: GetAppointmentDetailsApiAppointmentV1AppointmentsIdGetResponse }) => {
  const openMaps = () => {
    appointment.branch.url ? Linking.openURL(appointment.branch.url) : openMapsUtil(appointment.branch.address);
  }

  const tagText = appointment.status;
  const tagColor = tagText ? tagColorMapping?.[tagText] ?? colors.success : colors.success;

  return (
    <>
      <Section title={<Height h={16} />}>
        <View style={{ marginHorizontal: 12, marginVertical: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <CText size={16} style={{ flexGrow: 1, flexShrink: 1 }}>{appointment.start_datetime}</CText>
            <HeaderTag color={tagColor}>{tagText}</HeaderTag>
          </View>
          {
            appointment.services.map((service) => (
              <View key={service.name} style={{ marginTop: 16, flexDirection: 'row', alignItems: 'flex-start' }}>
                <Image source={{ uri: service.icon }} style={{ width: 45, height: 45 }} />
                <View style={{ marginLeft: 12 }}>
                  <BoldText size={14}>{service.name}</BoldText>
                  <CMarkdown size={16}>{service.details}</CMarkdown>
                </View>
              </View>
            ))
          }
        </View>


        <ListItem>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexGrow: 1, flexShrink: 1 }}>
              <Image source={{ uri: appointment.branch.icon }} style={{ width: 45, height: 45 }} />
              <View style={{ marginLeft: 12, flexGrow: 1, flexShrink: 1 }}>
                <BoldText size={14}>Branch</BoldText>
                <CText size={16}>{appointment.branch.name}</CText>
              </View>
            </View>
            <TouchableHighlight
              underlayColor={colors.underlay}
              style={{ borderRadius: 4 }}
              onPress={openMaps}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', margin: 4 }}>
                <AntdMiniIcon name="LocationFill" size={24} color={colors.text} />
                <BoldText size={14} style={{ marginLeft: 4 }}>Map</BoldText>
              </View>
            </TouchableHighlight>
          </View>
        </ListItem>
      </Section>

      <AppointmentActions id={appointment.id} actions={appointment.actions} />
    </>
  );
};

const ConsultForSection = ({ consultFor }: { consultFor: string[] }) => {
  return (
    <Section title={
      <Row style={{ margin: 12, marginBottom: 0 }}>
        <Image source={myfamilyIcon} contentFit="contain" style={{ width: 25, height: 25 }} />
        <TitleText style={{ marginLeft: 8 }}>Consult For</TitleText>
      </Row>
    }>
      <ListItemView>
        {consultFor.map((person, index) => (<CText key={index} size={16}>{person}</CText>))}
      </ListItemView>
    </Section>
  );
};



const PaymentsSection = ({ payments: { items, gst, total, payments, invoices } }: { payments: GetAppointmentDetailsApiAppointmentV1AppointmentsIdGetResponse['payments'] }) => {
  return (
    <Section title={
      <Row style={{ margin: 12, marginBottom: 0 }}>
        <Image source={paymentsIcon} contentFit="contain" style={{ width: 25, height: 25 }} />
        <TitleText style={{ marginLeft: 8 }}>Payments</TitleText>
      </Row>
    }>
      <View>
        {items.map(({ title, amount }: { title: string, amount: number }) => (
          <ListItem divider={false} key={title} extra={<CText size={16}>{`$${amount.toFixed(2)}`}</CText>}>
            <CMarkdown size={16}>{title}</CMarkdown>
          </ListItem>
        ))}
        <ListItem divider={false} extra={<CText size={16}>{`$${gst.toFixed(2)}`}</CText>}>
          <CMarkdown size={16}>GST</CMarkdown>
        </ListItem>
      </View>
      <ListItemView extra={<CText size={16}>{`\$${total.toFixed(2)}`}</CText>} styles={{ Extra: { color: 'green' } }}>
        <BoldText size={16}>Total</BoldText>
      </ListItemView>
      {
        payments.length > 0 && payments.map((payment, index) => (
          <ListItem key={index} styles={{ Item: { marginTop: 8, marginBottom: 8 } }} extra={<CText size={16}>{`-\$${payment.payment_amount.toFixed(2)}`}</CText>}>
            <CText size={16}>Paid on {formatDateTime(payment.updated_at)}</CText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              {getPaymentMethodImg(payment.remarks?.['brand']?.toString() ?? payment.payment_method)}
              {payment.remarks?.['last4'] && <BoldText style={{ marginLeft: 4 }}>**** {payment.remarks['last4']?.toString()}</BoldText>}
            </View>
          </ListItem>
        ))
      }
      {
        invoices.length > 0 && invoices.map((invoice) => (
          <ListItemView key={invoice.id} extra={
            <ButtonIcon icon="EyeOutline" onPress={
              () => router.navigate({ 
                pathname: '/pdf_viewer', 
                params: {
                  id: invoice.id,
                  filename: invoice.filename, 
                  url: invoice.url,
                  fileType: invoice.filetype
                }})}
            >
              View
            </ButtonIcon>
          }
          >
            <View>
              {
                invoice.subtitle && <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                  <View style={{ backgroundColor: colors.brands5, borderRadius: 4 }}>
                    <BoldText size={11} style={{ margin: 4 }}>{invoice.subtitle}</BoldText>
                  </View>
                </View>
              }
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AntdMiniIcon name='InvoiceOutline' size={24} />
                <CText size={16} style={{ marginLeft: 4 }}>Invoice</CText>
              </View>
            </View>
          </ListItemView>
          ))
      }
    </Section>
  );
}
