import React from 'react';
import { Alert, View } from 'react-native';
import { Section, GRButton, Height } from '@/common/components/AntdText';
import KeyboardView from '@/common/components/KeyboardView';
import { router } from 'expo-router';
import { useMultiPatientSurvey, TabValidationState } from '@/hooks/useAppointmentSurvey';
import { Radio, Number, Checkbox, Text, SurveySection, SurveyField, SurveyForm } from './components';
import TabBlock, { TabBlockRoute } from '@/common/components/TabBlock';
import { colors } from '@/common/utils/config';
import { useAppointmentStore } from '@/hooks/useAppointment';

// Form defaults from template
export const FORM_DEFAULTS = {
  type: 'Radio',
  required: true,
  options: ["Yes", "No"],
  othersTextInput: "Others"
};

// Apply defaults to all fields
const surveyTemplateWithDefaults = (surveyTemplateJson: SurveyForm) => ({
  ...surveyTemplateJson,
  sections: surveyTemplateJson.sections.map<SurveySection>((section) => ({
    ...section,
    fields: section.fields.map<SurveyField>((field: any) => ({ ...FORM_DEFAULTS, ...field }))
  }))
});

// Get validation state for a patient
const getValidationState = (patientId: string, tabValidationStates: TabValidationState[]) => {
  return tabValidationStates.find(state => state.patientId === patientId);
};

const SurveyPage: React.FC = () => {
  const { patients, corporateCode, corporateSurvey, setCorporateSurvey } = useAppointmentStore();
  const surveyTemplate = surveyTemplateWithDefaults(corporateCode?.corporateSurveyTemplate!);
  const {
    patientsData,
    isSubmitting,
    tabValidationStates,
    updateResponse,
    submitAllSurveys
  } = useMultiPatientSurvey({
    surveyTemplate: surveyTemplate,
    patients: patients!,
    defaultValues: corporateSurvey || undefined,
    onSubmit: async (allPatientsData) => {
      const responses = allPatientsData.reduce((acc, {patientId, surveyData: { responses }}) => {
        acc[patientId] = responses;
        return acc;
      }, {} as Record<string, Record<string, string | string[]>>);
      setCorporateSurvey(responses);
      router.back();
    }
  });

  // Create routes for TabBlock with validation indicators
  const routes: TabBlockRoute[] = patients!.map(patient => {
    const validationState = getValidationState(patient.id, tabValidationStates);
    const { isValid, hasErrors } = validationState || { isValid: false, hasErrors: false };
    
    let iconColor = colors.brands4;
    let icon = undefined;
    
    if (hasErrors) {
      iconColor = '#ef4444';
      icon = 'CloseCircleOutline';
    } else if (isValid) {
      iconColor = '#22c55e';
      icon = 'CheckCircleOutline';
    }
    
    return {
      key: patient.id,
      title: patient.name,
      icon,
      iconColor
    };
  });

  const renderField = (field: SurveyField, fieldIndex: number, patientId: string) => {
    const fieldId = field.id || field.title;
    const patientData = patientsData.find(p => p.patientId === patientId);
    const value = patientData?.surveyData.responses[fieldId];
    const error = patientData?.surveyData.errors[fieldId];

    switch (field.type) {
      case 'Radio':
        return (
          <Radio
            key={fieldId}
            field={field}
            index={fieldIndex}
            value={typeof value === 'string' ? value : ''}
            onChange={(newValue) => updateResponse(fieldId, newValue, patientId)}
            error={error}
          />
        );
      
      case 'Number':
        return (
          <Number
            key={fieldId}
            field={field}
            index={fieldIndex}
            value={typeof value === 'string' ? value : ''}
            onChange={(newValue) => updateResponse(fieldId, newValue, patientId)}
            error={error}
          />
        );
      
      case 'Checkbox':
        return (
          <Checkbox
            key={fieldId}
            field={field}
            index={fieldIndex}
            values={Array.isArray(value) ? value : []}
            onChange={(newValues) => updateResponse(fieldId, newValues, patientId)}
            error={error}
          />
        );

      case 'Text':
        return (
          <Text
            key={fieldId}
            field={field}
            index={fieldIndex}
            value={typeof value === 'string' ? value : ''}
            onChange={(newValue) => updateResponse(fieldId, newValue, patientId)}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  const renderSection = (section: SurveySection, sectionIndex: number, patientId: string) => {
    // Calculate global field index across all sections
    let globalFieldIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
      globalFieldIndex += surveyTemplate.sections[i].fields.length;
    }

    return (
      <Section key={sectionIndex} title={section.title} bottom={12}>
        {section.fields.map((field, fieldIndex) => 
          renderField(field, globalFieldIndex + fieldIndex, patientId)
        )}
      </Section>
    );
  };

  const handleSubmit = async () => {
    try {
      await submitAllSurveys();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "An unknown error occurred",
        [{ text: "OK" }]
      );
    }
  };

  const renderTabContent = (route: TabBlockRoute) => {
    return (
      <View>
        {surveyTemplate.sections.map((section, index) => renderSection(section, index, route.key))}
        <Height h={12} />
      </View>
    );
  };

  const action = (
    <GRButton
      title="Save Responses"
      type="primary"
      loading={isSubmitting}
      onPress={handleSubmit}
    />
  );

  return (
    <KeyboardView
      title={corporateCode?.corporateSurveyTemplate?.title || "Lifestyle Survey"}
      navBack={() => router.back()}
      action={action}
      wrapScroll={false}
    >
      <TabBlock
        lazy={false}
        bottomPadding={false}
        routes={routes}
        onRender={renderTabContent}
      />
    </KeyboardView>
  );
};

export default SurveyPage;