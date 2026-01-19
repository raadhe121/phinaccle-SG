import { useState, useCallback, useMemo } from 'react';
import { SurveyForm, SurveyField } from '@/app/(app)/(root)/appointment/survey/components';
import { Patient } from './useAppointment';

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface SurveyData {
  responses: Record<string, string | string[]>;
  errors: Record<string, string>;
  isValid: boolean;
}

export interface PatientSurveyData {
  patientId: string;
  patientName: string;
  surveyData: SurveyData;
}

export interface TabValidationState {
  patientId: string;
  isValid: boolean;
  hasErrors: boolean;
  errorCount: number;
}

export interface UseAppointmentSurveyProps {
  surveyTemplate: SurveyForm;
  defaultValues?: Record<string, string | string[]>;
  onSubmit?: (data: SurveyData) => Promise<void>;
}

export interface UseAppointmentSurveyReturn {
  // State
  surveyData: SurveyData;
  isSubmitting: boolean;
  
  // Actions
  updateResponse: (fieldId: string, value: string | string[]) => void;
  validateSurvey: () => ValidationError[];
  submitSurvey: () => Promise<void>;
  
  // Computed
  allFieldsFlat: SurveyField[];
  getFieldValue: (fieldId: string) => string | string[] | undefined;
  getFieldError: (fieldId: string) => string | undefined;
}

export const useAppointmentSurvey = ({
  surveyTemplate,
  defaultValues = {},
  onSubmit
}: UseAppointmentSurveyProps): UseAppointmentSurveyReturn => {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    responses: defaultValues,
    errors: {},
    isValid: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitAttempt, setHasSubmitAttempt] = useState(false);

  // Flatten all fields from all sections for easier access
  const allFieldsFlat = useMemo(() => {
    return surveyTemplate.sections.reduce<SurveyField[]>((acc, section) => {
      return [...acc, ...section.fields];
    }, []);
  }, [surveyTemplate]);

  // Validation logic
  const validateField = useCallback((field: SurveyField, value: string | string[] | undefined): string | null => {
    if (field.required) {
      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        return `${field.title} is required`;
      }

      // Special validation for "Others" option - only show after submit attempt
      if (field.type === 'Radio' || field.type === 'Checkbox') {
        const radioField = field as any;
        if (radioField.othersTextInput) {
          if (field.type === 'Radio' && typeof value === 'string') {
            // For radio: if value equals the "Others" option text (not user input), it's invalid
            if (value === radioField.othersTextInput) {
              return `Please specify ${field.title.toLowerCase()}`;
            }
          } else if (field.type === 'Checkbox' && Array.isArray(value)) {
            // For checkbox: if "Others" option is selected but no custom text provided
            if (value.includes(radioField.othersTextInput) && !value.some(v => v !== radioField.othersTextInput && v.trim() !== '')) {
              return `Please specify ${field.title.toLowerCase()}`;
            }
          }
        }
      }
    }

    if (field.type === 'Number' && value && typeof value === 'string') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `${field.title} must be a valid number`;
      }
      if (numValue < 0) {
        return `${field.title} must be a positive number`;
      }
    }

    return null;
  }, []);

  const validateSurvey = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    const errorMap: Record<string, string> = {};

    allFieldsFlat.forEach(field => {
      const fieldId = field.id || field.title;
      const value = surveyData.responses[fieldId];
      const error = validateField(field, value);
      
      if (error) {
        errors.push({ fieldId, message: error });
        errorMap[fieldId] = error;
      }
    });

    setSurveyData(prev => ({
      ...prev,
      errors: errorMap,
      isValid: errors.length === 0
    }));

    return errors;
  }, [surveyData.responses, allFieldsFlat, validateField]);

  // Update response for a specific field
  const updateResponse = useCallback((fieldId: string, value: string | string[]) => {
    setSurveyData(prev => {
      const updatedResponses = {
        ...prev.responses,
        [fieldId]: value
      };

      // Clear error for this field if it exists
      const updatedErrors = { ...prev.errors };
      delete updatedErrors[fieldId];

      // Validate this specific field
      const field = allFieldsFlat.find(f => (f.id || f.title) === fieldId);
      if (field && hasSubmitAttempt) {
        const error = validateField(field, value);
        if (error) {
          updatedErrors[fieldId] = error;
        }
      }

      return {
        responses: updatedResponses,
        errors: updatedErrors,
        isValid: Object.keys(updatedErrors).length === 0
      };
    });
  }, [allFieldsFlat, validateField, hasSubmitAttempt]);

  // Submit survey
  const submitSurvey = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setHasSubmitAttempt(true); // Mark that submit has been attempted
    
    try {
      const errors = validateSurvey();
      if (errors.length > 5) {
        throw new Error("Please fix the errors in relevant sections before submitting");
      } else if (errors.length > 0) {
        throw new Error("Please fix the following errors:\n" + errors.map((error) => error.message).join("\n"));
      }

      if (onSubmit) {
        await onSubmit(surveyData);
      }
    } catch (error) {
      console.error('Survey submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, validateSurvey, onSubmit, surveyData]);

  // Helper functions
  const getFieldValue = useCallback((fieldId: string) => {
    return surveyData.responses[fieldId];
  }, [surveyData.responses]);

  const getFieldError = useCallback((fieldId: string) => {
    return surveyData.errors[fieldId];
  }, [surveyData.errors]);

  return {
    // State
    surveyData,
    isSubmitting,
    
    // Actions
    updateResponse,
    validateSurvey,
    submitSurvey,
    
    // Computed
    allFieldsFlat,
    getFieldValue,
    getFieldError
  };
};

// Multi-patient survey hook
export interface UseMultiPatientSurveyProps {
  surveyTemplate: SurveyForm;
  patients: Patient[];
  defaultValues?: Record<string, Record<string, string | string[]>>;
  onSubmit?: (allPatientsData: PatientSurveyData[]) => Promise<void>;
}

export interface UseMultiPatientSurveyReturn {
  // State
  patientsData: PatientSurveyData[];
  isSubmitting: boolean;
  tabValidationStates: TabValidationState[];
  
  // Actions
  updateResponse: (fieldId: string, value: string | string[], patientId: string) => void;
  validateAllPatients: () => ValidationError[];
  submitAllSurveys: () => Promise<void>;
  
  // Computed
  allFieldsFlat: SurveyField[];
  getFieldValue: (fieldId: string) => string | string[] | undefined;
  getFieldError: (fieldId: string) => string | undefined;
}

export const useMultiPatientSurvey = ({
  surveyTemplate,
  patients,
  defaultValues = {},
  onSubmit
}: UseMultiPatientSurveyProps): UseMultiPatientSurveyReturn => {
  // Initialize patient data
  const [patientsData, setPatientsData] = useState<PatientSurveyData[]>(() => 
    patients.map(patient => ({
      patientId: patient.id,
      patientName: patient.name,
      surveyData: {
        responses: defaultValues[patient.id] || {},
        errors: {},
        isValid: false
      }
    }))
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitAttempt, setHasSubmitAttempt] = useState(false);

  // Flatten all fields from all sections for easier access
  const allFieldsFlat = useMemo(() => {
    return surveyTemplate.sections.reduce<SurveyField[]>((acc, section) => {
      return [...acc, ...section.fields];
    }, []);
  }, [surveyTemplate]);


  // Validation logic (same as single patient)
  const validateField = useCallback((field: SurveyField, value: string | string[] | undefined): string | null => {
    if (field.required) {
      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        return `${field.title} is required`;
      }

      // Special validation for "Others" option
      if (field.type === 'Radio' || field.type === 'Checkbox') {
        const radioField = field as any;
        if (radioField.othersTextInput) {
          if (field.type === 'Radio' && typeof value === 'string') {
            if (value === radioField.othersTextInput) {
              return `Please specify ${field.title.toLowerCase()}`;
            }
          } else if (field.type === 'Checkbox' && Array.isArray(value)) {
            if (value.includes(radioField.othersTextInput) && !value.some(v => v !== radioField.othersTextInput && v.trim() !== '')) {
              return `Please specify ${field.title.toLowerCase()}`;
            }
          }
        }
      }
    }

    if (field.type === 'Number' && value && typeof value === 'string') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return `${field.title} must be a valid number`;
      }
      if (numValue < 0) {
        return `${field.title} must be a positive number`;
      }
    }

    return null;
  }, []);

  // Validate single patient
  const validatePatient = useCallback((patientData: PatientSurveyData): ValidationError[] => {
    const errors: ValidationError[] = [];

    allFieldsFlat.forEach(field => {
      const fieldId = field.id || field.title;
      const value = patientData.surveyData.responses[fieldId];
      const error = validateField(field, value);
      
      if (error) {
        errors.push({ fieldId, message: error });
      }
    });

    return errors;
  }, [allFieldsFlat, validateField]);

  // Calculate tab validation states
  const tabValidationStates = useMemo((): TabValidationState[] => {
    return patientsData.map(patientData => {
      const errors = validatePatient(patientData);
      return {
        patientId: patientData.patientId,
        isValid: errors.length === 0,
        hasErrors: errors.length > 0,
        errorCount: errors.length
      };
    });
  }, [patientsData, validatePatient]);


  // Update response for specified patient
  const updateResponse = useCallback((fieldId: string, value: string | string[], patientId: string) => {
    setPatientsData(prev => prev.map(patientData => {
      if (patientData.patientId !== patientId) return patientData;

      const updatedResponses = {
        ...patientData.surveyData.responses,
        [fieldId]: value
      };

      // Clear error for this field if it exists
      const updatedErrors = { ...patientData.surveyData.errors };
      delete updatedErrors[fieldId];

      // Validate this specific field if submit has been attempted
      const field = allFieldsFlat.find(f => (f.id || f.title) === fieldId);
      if (field && hasSubmitAttempt) {
        const error = validateField(field, value);
        if (error) {
          updatedErrors[fieldId] = error;
        }
      }

      return {
        ...patientData,
        surveyData: {
          responses: updatedResponses,
          errors: updatedErrors,
          isValid: Object.keys(updatedErrors).length === 0
        }
      };
    }));
  }, [allFieldsFlat, validateField, hasSubmitAttempt]);

  // Validate all patients
  const validateAllPatients = useCallback((): ValidationError[] => {
    const allErrors: ValidationError[] = [];
    
    patientsData.forEach(patientData => {
      const errors = validatePatient(patientData);
      const errorMap: Record<string, string> = {};
      
      errors.forEach(error => {
        errorMap[error.fieldId] = error.message;
        allErrors.push({
          ...error,
          fieldId: `${patientData.patientId}:${error.fieldId}` // Prefix with patient ID
        });
      });
    });

    // Update patient data with validation results
    setPatientsData(prev => prev.map(patientData => {
      const errors = validatePatient(patientData);
      const errorMap: Record<string, string> = {};
      
      errors.forEach(error => {
        errorMap[error.fieldId] = error.message;
      });

      return {
        ...patientData,
        surveyData: {
          ...patientData.surveyData,
          errors: errorMap,
          isValid: errors.length === 0
        }
      };
    }));

    return allErrors;
  }, [validatePatient, patientsData]);

  // Submit all surveys
  const submitAllSurveys = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setHasSubmitAttempt(true);
    
    try {
      const allErrors = validateAllPatients();
      if (allErrors.length > 0) {
        if (allErrors.length > 5) {
          throw new Error("Please fix the errors in relevant sections before submitting");
        } else {
          // Group errors by patient for better error message
          const errorsByPatient = allErrors.reduce((acc, error) => {
            const patientId = error.fieldId.split(':')[0];
            if (!acc[patientId]) acc[patientId] = [];
            acc[patientId].push(error.message);
            return acc;
          }, {} as Record<string, string[]>);
          
          const errorMsg = Object.entries(errorsByPatient)
            .map(([patientId, errors]) => {
              const patient = patients.find(p => p.id === patientId);
              return `${patient?.name || patientId}:\n${errors.join('\n')}`;
            })
            .join('\n\n');
          
          throw new Error("Please fix the following errors:\n" + errorMsg);
        }
      }

      if (onSubmit) {
        await onSubmit(patientsData);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, validateAllPatients, validatePatient, onSubmit, patientsData, patients]);

  // Helper functions (deprecated - data is now accessed directly in components)
  const getFieldValue = useCallback((fieldId: string) => {
    // This is kept for compatibility but shouldn't be used
    return undefined;
  }, []);

  const getFieldError = useCallback((fieldId: string) => {
    // This is kept for compatibility but shouldn't be used
    return undefined;
  }, []);

  return {
    // State
    patientsData,
    isSubmitting,
    tabValidationStates,
    
    // Actions
    updateResponse,
    validateAllPatients,
    submitAllSurveys,
    
    // Computed
    allFieldsFlat,
    getFieldValue,
    getFieldError
  };
};