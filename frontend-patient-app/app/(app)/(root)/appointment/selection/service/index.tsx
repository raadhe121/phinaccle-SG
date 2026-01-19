import React from "react"
import { BoldText, CMarkdown, CText, H1Text, NavHeader3, ReactQueryChild } from "@/common/components/AntdText"
import KeyboardView from "@/common/components/KeyboardView"
import { colors } from "@/common/utils/config"
import { MAX_BOOKING_DURATION, useAppointmentStore } from "@/hooks/useAppointment"
import { useQuery, useMutation } from "@tanstack/react-query"
import { router, useLocalSearchParams } from "expo-router"
import { TextInput, TouchableHighlight, View, StyleSheet, Alert } from "react-native"
import { useState } from "react"
import AntdMiniIcon from "@/common/components/AntdMiniIcon"
import { modal } from "@/common/utils/modal"
import { onError } from "@/common/utils/lib"
import { validateCorporateCodeApiAppointmentV1ValidateCorporateCodeGet, getServicesApiAppointmentV1ServicesGet, ServiceGroup } from "@/services/client"
import { SurveyForm } from "../../survey/components"

const CorporateStudentCode = () => {
  const [corpCodeInput, setCorpCodeInput] = useState('');
  const { corporateCode, setCorporateCode, resetServiceGroups } = useAppointmentStore();

  const validateCodeMutation = useMutation({
    mutationFn: validateCorporateCodeApiAppointmentV1ValidateCorporateCodeGet,
    onSuccess: (data) => {
      setCorporateCode({
        code: data.code,
        organization: data.organization,
        patientSurveyTemplate: data.patient_survey_template,
        corporateSurveyTemplate: data.corporate_survey_template as SurveyForm | null,
        onlyPrimaryUser: data.only_primary_user
      });
      setCorpCodeInput('');
      resetServiceGroups();
    },
    onError
  });

  const applyCode = () => {
    if (corporateCode) {
      modal.warn({
        title: 'Continue without code?',
        content: 'Are you sure to miss the personalized services & benefits offered by your code? You can re-enter your code anytime again later.',
        labels: ["Cancel", "Yes"],
        onOk() {
          setCorporateCode(null);
          setCorpCodeInput('');
          resetServiceGroups();
        },
        onCancel() {},
      });
      return;
    }
    if (!corpCodeInput.trim()) {
      Alert.alert('Error', 'Please enter a code');
      return;
    }
    validateCodeMutation.mutate({ code: corpCodeInput });
  }

  return (
    <>
      <View style={styles.codeContainer}>
        <BoldText size={16}>Are you a corporate or student?</BoldText>
        <CText size={14} style={{ marginTop: 4 }}>
          Enter your code to unlock personalized access to medical services just for you.
        </CText>
        <View style={styles.inputContainer}>
          {
            corporateCode 
              ? (
                <CText style={styles.input} size={17}>{corporateCode.code}</CText>
              )
              : <TextInput
                  style={styles.input}
                  placeholder="Enter corporate/student code"
                  placeholderTextColor={colors.light}
                  value={ corporateCode ?? corpCodeInput }
                  onChangeText={(v) => setCorpCodeInput(v.toUpperCase())}
                  editable={!validateCodeMutation.isPending && corporateCode == null}
                />
          }
          
          <TouchableHighlight
            style={[styles.submitButton, validateCodeMutation.isPending && { opacity: 0.7 }]}
            underlayColor={colors.underlay}
            onPress={applyCode}
            disabled={!corporateCode && !corpCodeInput || validateCodeMutation.isPending}
          >
            <>
              {
                corporateCode 
                  ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <AntdMiniIcon name='DeleteOutline' color={colors.danger} size={20} />
                      <CText size={15} style={{ color: colors.danger, marginLeft: 4 }}>Remove</CText>
                    </View>
                  )
                  : (
                    <CText size={15} style={{ color: colors.primary }}>
                      {validateCodeMutation.isPending ? 'Submitting...' : 'Submit'}
                    </CText>
                  )
              }
            </>
          </TouchableHighlight>
        </View>
      </View>
      { 
        corporateCode && <View>
          <CMarkdown size={17} color={colors.success} style={{ marginHorizontal: 12, marginBottom: 16 }} >
          {`Your organization is **${corporateCode?.organization}** You are eligible for these services below:`}
          </CMarkdown>
        </View> 
      }
    </>
  )
}

export default function ServiceSelectScreen() {
  const { index } = useLocalSearchParams();
  const { corporateCode, serviceGroups, setServiceGroups, patients, branchIds } = useAppointmentStore();

  // Calculate current total duration
  const currentTotalDuration = serviceGroups?.reduce((total, group, ind) => {
    return ind !== parseInt(index as string) ? total + group.duration : total;
  }, 0) || 0;

  const servicesQuery = useQuery({
    queryKey: ['services', corporateCode?.code, branchIds],
    queryFn: ({ queryKey }) => getServicesApiAppointmentV1ServicesGet({
      code: queryKey[1] as string,
      branchIds: queryKey[2] ? (queryKey[2] as string[]).join(',') : null
    })
  });

  const selectService = (serviceGroup: ServiceGroup) => {
    // Calculate new total duration if this service is selected
    const newDuration = currentTotalDuration + serviceGroup.duration;
    
    // Check if selecting this service would exceed 45 minutes
    if (newDuration > MAX_BOOKING_DURATION) {
      Alert.alert(
        'Duration Limit Exceeded',
        `Selecting this service would exceed the maximum appointment duration of ${MAX_BOOKING_DURATION} minutes.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!serviceGroup.default_item) {
      router.push({
        pathname: '/appointment/selection/service/detail',
        params: { serviceGroup: JSON.stringify(serviceGroup), index }
      });
    } else {
      setServiceGroups(
        index as string,
        {
          ...serviceGroup,
          items: [serviceGroup.default_item]
        }
      );
      router.back();
    }
  }

  return (
    <KeyboardView
      edges={[]}
      navBack={router.back}
      header={<NavHeader3 navBack={router.back} />}
      scrollOverflow='hidden'
    >
      <H1Text>Select service type</H1Text>
      <CorporateStudentCode />

      {/* Services List */}
      <View style={{ marginLeft: 12, marginRight: 12 }}>
        <ReactQueryChild query={servicesQuery}>
          {
            servicesQuery.data?.services
              .filter((service: ServiceGroup) => 
                (serviceGroups?.[parseInt(index as string)]?.id === service.id ||
                !serviceGroups?.some(sg => sg.id === service.id)) &&
                (currentTotalDuration + service.duration) <= MAX_BOOKING_DURATION
              ).length === 0 ? (
              <CText size={14} style={{ textAlign: 'center' }}>
                There are no more services available for booking.
              </CText>
            ) : (
              servicesQuery.data?.services
                ?.filter((service: ServiceGroup) => 
                  (serviceGroups?.[parseInt(index as string)]?.id === service.id ||
                  !serviceGroups?.some(sg => sg.id === service.id)) &&
                  (currentTotalDuration + service.duration) <= MAX_BOOKING_DURATION
                )
                .map((service: ServiceGroup) => (
                  <TouchableHighlight
                    key={service.id}
                    underlayColor={colors.underlay}
                    onPress={() => selectService(service)}
                    style={styles.serviceItem}
                  >
                    <View style={styles.serviceContent}>
                      <View style={styles.serviceLeftSection}>
                        <CText size={16} style={{ marginLeft: 8 }}>{service.name}</CText>
                      </View>
                      {/* <View style={styles.serviceRightSection}>
                        <View style={styles.durationBadge}>
                          <CText size={11} style={{ color: colors.primary }}>{service.duration}m / pax</CText>
                        </View>
                        <AntdMiniIcon name='RightOutline' color={colors.primary} size={20} />
                      </View> */}
                    </View>
                  </TouchableHighlight>
                ))
            )
          }
        </ReactQueryChild>
      </View>
    </KeyboardView>
  )
}

const styles = StyleSheet.create({
  codeContainer: {
    backgroundColor: colors.brands4,
    borderRadius: 8,
    padding: 12,
    margin: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 17,
  },
  submitButton: {
    padding: 12,
    height: '100%',
  },
  serviceItem: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    marginBottom: 16,
  },
  serviceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  serviceLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationBadge: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginRight: 16,
  },
});