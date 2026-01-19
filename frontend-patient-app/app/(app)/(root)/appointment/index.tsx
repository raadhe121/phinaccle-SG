import React from "react";
import { CMarkdown, CText, Height, ListItem, Section, TitleText } from "@/common/components/AntdText";
import KeyboardView from "@/common/components/KeyboardView";
import { Button } from "@ant-design/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors } from "@/common/utils/config";
import { useAppointmentStore, MAX_BOOKING_DURATION, MAX_SERVICE_GROUPS } from "@/hooks/useAppointment";
import { Alert, View } from "react-native";
import dayjs from "dayjs";
import { confirmAppointmentApiAppointmentV1ConfirmPost, getPriceApiAppointmentV1ReviewPost } from "@/services/client";
import { useMutation } from "@tanstack/react-query";
import { modal } from "@/common/utils/modal";
import { onError } from "@/common/utils/lib";
import { useAppointmentDeeplink } from "@/hooks/useAppointmentDeeplink";

// Common picker component for all selection types
export type CommonPickerProps = {
  value?: string | React.ReactNode | null;
  placeholder?: string;
  path: '/appointment/selection/service' |
        '/appointment/selection/datetime' |
        '/appointment/selection/location' |
        '/family/select' |
        string; // Allow for additional paths
  params?: Record<string, string>;
  disabled?: boolean;
};

const CommonPicker = ({ value, placeholder, path, params, disabled }: CommonPickerProps) => {
  return (
    <ListItem
      onPress={disabled ? undefined : () => router.push({
        pathname: path as any, // Cast to any to avoid TypeScript errors with additional paths
        params
      })}
      styles={{
        Content: { color: (!value ? colors.light : colors.text) },
      }}
      arrow="horizontal"
      divider={false}
    >
      {value ?? placeholder}
    </ListItem>
  );
};

export default function AppointmentScreen() {
  const affiliateCode = useAppointmentDeeplink();
  const params = useLocalSearchParams<{ branch_ids?: string }>();
  const { corporateCode, serviceGroups, patients, patientSurvey, corporateSurvey, others, location, startDateTime, setPayment, setPatients, setBranchIds } = useAppointmentStore();
  // Calculate total duration of selected services
  const totalDuration = serviceGroups?.reduce((total, group) => total + group.duration, 0) || 0;
  const confirmMutation = useMutation({
    mutationFn: confirmAppointmentApiAppointmentV1ConfirmPost,
    onSuccess: (data) => {
      router.dismissTo('/')
      router.navigate({
        pathname: '/appointment/consultation',
        params: {
          id: data.id
        }
      })
    },
    onError: onError
  })

  const reviewMutation = useMutation({
    mutationFn: getPriceApiAppointmentV1ReviewPost,
    onSuccess: (data) => {
      setPayment(data);
      if (data.total == 0) {
        modal.warn({
          title: 'Confirm Appointment',
          content: 'Are you sure you want to book this appointment?',
          labels: ["Cancel", "Confirm"],
          onCancel: () => {},
          onOk: () => confirmMutation.mutate({
            appointmentId: data.id
          })
        })
      } else {
        router.navigate('/appointment/payment')
      }
    },
    onError: onError
  })

  const handleContinue = () => {
    if (!serviceGroups || !patients || !location || !startDateTime) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    reviewMutation.mutate({
      requestBody: {
        affiliate_code: affiliateCode,
        code: corporateCode?.code,
        service_groups: serviceGroups.map(({ id, items }) => ({ id, items: (items ?? []).map(({ id }) => id) })),
        patients: patients.map(({ id: patientId }) => {
          if (patientId === 'myself') {
            return { type: 'myself' }
          }
          if (patientId.startsWith('other_')) {
            return { type: 'guest', name: others?.find(({ id }) => id === patientId)?.name, mobile: others?.find(({ id }) => id === patientId)?.mobileNumber }
          }
          return { type: 'family', id: patientId }
        }),
        patient_survey: patientSurvey,
        corporate_survey: corporateSurvey,
        branch_id: location.id,
        start_dt: startDateTime
      }
    })
  }

  const action = <Button
    onPress={handleContinue}
    type="primary"
    disabled={!serviceGroups || !patients || !location || !startDateTime || reviewMutation.isPending || (corporateCode?.corporateSurveyTemplate && !corporateSurvey)}
    loading={reviewMutation.isPending}
  >
    Continue
  </Button>

  // Format the datetime for display
  const formattedDateTime = () => {
    if (!startDateTime) return null
    return dayjs(startDateTime).format('MMM D, YYYY h:mm A')
  }

  // Only allow adding service if total duration is less than 45 minutes and less than 2 services
  const allowAddService = (!serviceGroups || serviceGroups?.length < MAX_SERVICE_GROUPS) && totalDuration < MAX_BOOKING_DURATION;

  // Auto-select 'Myself' when onlyPrimaryUser is true and service is selected
  React.useEffect(() => {
    if (corporateCode?.onlyPrimaryUser && serviceGroups && serviceGroups.length > 0 && !patients) {
      setPatients([{ id: 'myself', name: 'Myself' }]);
    }
  }, [corporateCode, serviceGroups, patients, setPatients]);

  // Parse and store branch_ids from URL params
  React.useEffect(() => {
    if (params.branch_ids) {
      const branchIds = params.branch_ids.split(',').map(id => id.trim()).filter(Boolean);
      if (branchIds.length > 0) {
        setBranchIds(branchIds);
      }
    }
  }, [params.branch_ids, setBranchIds]);

  return <KeyboardView action={action} navBack={() => router.back()} title='Book Appointment'>
    <Height h={12} />
    <View style={{ margin: 12 }}>
      <TitleText style={{ margin: 0, marginBottom: 4 }}>Select service type</TitleText>
      <CText size={14}>
        You can add max. {MAX_SERVICE_GROUPS} different services in one appointment. A single appointment can accommodate max. of {MAX_BOOKING_DURATION} mins for all patients combined.
      </CText>
    </View>
      {
        serviceGroups?.map((serviceGroup, index) => (
          <Section key={index} title={<></>} bottom={12}>
            <CommonPicker
              key={index}
              value={
                <CMarkdown size={14}>
                  {`**${serviceGroup.name}**\n${serviceGroup.items?.map((item) => item.name).join('\n') ?? ''}`.trim()}
                </CMarkdown>}
              placeholder="Select Service"
              path="appointment/selection/service"
              params={{ index: index.toString() }}
            />
          </Section>
        ))
      }
      {
        allowAddService && (
          <Section key={serviceGroups?.length} title={<></>} bottom={12}>
          <CommonPicker
            params={{ index: serviceGroups?.length?.toString() || '0' }}
            placeholder={ !serviceGroups ? "Select Service" : "Add another service?" }
            path="appointment/selection/service"
          />
          </Section>
        )
      }
    {
      serviceGroups && <Section title={<TitleText>Consult for</TitleText>} bottom={12}>
        <CommonPicker
          value={patients && patients.length > 0 ? <CText size={16}>{patients?.map(patient => patient.name).join('\n')}</CText> : null}
          placeholder="Select patients"
          path="appointment/selection/patients"
          params={{ maxPatients: Math.floor(MAX_BOOKING_DURATION / totalDuration).toString() }}
          disabled={corporateCode?.onlyPrimaryUser}
        />
      </Section>
    }
    {
      (patients) && <Section title={<TitleText>Preferred location</TitleText>} bottom={12}>
      <CommonPicker
        value={
          location
            ? <CMarkdown size={17}>
              {(location?.type === 'onsite' ? '**Onsite services**\n' : '') + location?.name}
            </CMarkdown>
            : null
        }
        placeholder="Select location"
        path="appointment/selection/location"
        />
      </Section>
    }
    {
      (location) && <Section title={<TitleText>Appointment date & time</TitleText>} bottom={12}>
        <CommonPicker
          value={formattedDateTime()}
          placeholder="Select date & time"
          path="appointment/selection/datetime"
        />
      </Section>
    }
    {
      startDateTime && corporateCode?.corporateSurveyTemplate && <Section title={<TitleText>Lifestyle Survey</TitleText>} bottom={12}>
        <CommonPicker
          value={corporateSurvey && "Completed"}
          placeholder="Complete Survey"
          path="appointment/survey"
        />
      </Section>
    }
    <Height h={12} />
  </KeyboardView>
}
