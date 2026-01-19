import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Input } from '@ant-design/react-native';
import { CText, CCheckbox, Label } from '@/common/components/AntdText';

// {
//   "placeholder": "Please specify here",
//   "conditional": {
//     "dependsOn": "is_employee",
//     "showIf": "No"
//   }
// }

// Type Definitions
export interface BaseSurveyField {
  id?: string;
  title: string;
  required?: boolean;
  type?: 'Radio' | 'Number' | 'Checkbox' | 'Text';
}

export interface RadioField extends BaseSurveyField {
  type: 'Radio';
  options: string[];
  othersTextInput?: string;
}

export interface NumberField extends BaseSurveyField {
  type: 'Number';
  placeholder?: string;
  unit?: string;
}

export interface CheckboxField extends BaseSurveyField {
  type: 'Checkbox';
  options: string[];
  othersTextInput?: string;
}

export interface TextField extends BaseSurveyField {
  type: 'Text';
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

export type SurveyField = RadioField | NumberField | CheckboxField | TextField;

export interface SurveySection {
  title?: string;
  fields: SurveyField[];
}

export interface SurveyForm {
  title: string;
  sections: SurveySection[];
}

// Component Props
interface RadioProps {
  field: RadioField;
  index: number;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

interface NumberProps {
  field: NumberField;
  index: number;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

interface CheckboxProps {
  field: CheckboxField;
  index: number;
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}

interface TextFieldProps {
  field: TextField;
  index: number;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

// Radio Component
export const Radio: React.FC<RadioProps> = ({ field, index, value, onChange, error }) => {
  const hasOthers = field.othersTextInput && field.options.includes(field.othersTextInput);
  
  // Initialize others text and selection state based on existing value
  const isExistingOthersValue = value && value !== field.othersTextInput && !field.options.includes(value);
  const [othersText, setOthersText] = useState(isExistingOthersValue ? value : '');
  const [isOthersSelected, setIsOthersSelected] = useState(
    value === field.othersTextInput || !!isExistingOthersValue
  );
  const othersInputRef = useRef<any>(null);

  // Update state when value prop changes (for form persistence)
  useEffect(() => {
    const isNewOthersValue = value && value !== field.othersTextInput && !field.options.includes(value);
    if (isNewOthersValue) {
      setOthersText(value);
      setIsOthersSelected(true);
    } else if (value === field.othersTextInput) {
      setIsOthersSelected(true);
    } else {
      setIsOthersSelected(false);
      setOthersText('');
    }
  }, [value, field.othersTextInput, field.options]);

  const handleOptionSelect = (option: string) => {
    if (option === field.othersTextInput && hasOthers) {
      setIsOthersSelected(true);
      onChange(othersText || option);
      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        othersInputRef.current?.focus();
      }, 50);
    } else {
      setIsOthersSelected(false);
      onChange(option);
      if (option !== field.othersTextInput) {
        setOthersText('');
      }
    }
  };

  const handleOthersTextChange = (text: string) => {
    setOthersText(text);
    // If text is empty, use the original option, otherwise use the text
    onChange(text.trim());
  };

  return (
    <Label label={`${index + 1}. ${field.title}`} error={error}>
      {field.options.map((option, optionIndex) => (
        <View key={optionIndex} className={optionIndex == 0 ? "" : "mt-1"}>
          <TouchableOpacity
            className="flex-row items-center py-2"
            onPress={() => handleOptionSelect(option)}
          >
            <CCheckbox 
              checked={option === field.othersTextInput ? isOthersSelected : value === option}
              onChecked={() => handleOptionSelect(option)}
            />
            <CText className="ml-3 flex-1">{option}</CText>
          </TouchableOpacity>
          
          {option === field.othersTextInput && hasOthers && isOthersSelected && (
            <View className="mt-2">
              <Input
                ref={othersInputRef}
                placeholder="Please specify..."
                value={othersText}
                onChangeText={handleOthersTextChange}
              />
            </View>
          )}
        </View>
      ))}
    </Label>
  );
};

// Number Component
export const Number: React.FC<NumberProps> = ({ field, index, value, onChange, error }) => {
  const handleChange = (text: string) => {
    // Only allow numbers and decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    onChange(numericValue);
  };

  return (
    <Label label={`${index + 1}. ${field.title}`} error={error}>
      <View className="mt-1">
        <Input
          placeholder={field.placeholder || 'Enter number...'}
          value={value || ''}
          onChangeText={handleChange}
          keyboardType="numeric"
          onFocus={() => {
            // Add extra scroll padding when focused
            setTimeout(() => {
              // Scroll the input into view with extra padding
            }, 100);
          }}
        />
      </View>
    </Label>
  );
};

// Checkbox Component
export const Checkbox: React.FC<CheckboxProps> = ({ field, index, values, onChange, error }) => {
  const hasOthers = field.othersTextInput && field.options.includes(field.othersTextInput);
  
  // Initialize others text and selection state based on existing values
  const existingOthersValue = values.find(v => v !== field.othersTextInput && !field.options.includes(v));
  const [othersText, setOthersText] = useState(existingOthersValue || '');
  const [isOthersSelected, setIsOthersSelected] = useState(
    values.includes(field.othersTextInput || '') || !!existingOthersValue
  );
  const othersInputRef = useRef<any>(null);

  // Update state when values prop changes (for form persistence)
  useEffect(() => {
    const newExistingOthersValue = values.find(v => v !== field.othersTextInput && !field.options.includes(v));
    const newIsOthersSelected = values.includes(field.othersTextInput || '') || !!newExistingOthersValue;
    
    setOthersText(newExistingOthersValue || '');
    setIsOthersSelected(newIsOthersSelected);
  }, [values, field.othersTextInput, field.options]);

  const handleOptionToggle = (option: string) => {
    const isSelected = values.includes(option) || (option === field.othersTextInput && isOthersSelected);
    let newValues: string[];

    if (isSelected) {
      if (option === field.othersTextInput) {
        setIsOthersSelected(false);
        setOthersText('');
        // Remove the "Others" option and any custom text that was entered
        newValues = values.filter(v => 
          v !== field.othersTextInput && 
          field.options.includes(v) // Keep only predefined options
        );
      } else {
        newValues = values.filter(v => v !== option);
      }
    } else {
      if (option === field.othersTextInput) {
        setIsOthersSelected(true);
        newValues = [...values, field.othersTextInput];
        // Focus the input if "Others" option is selected
        setTimeout(() => {
          othersInputRef.current?.focus();
        }, 100);
      } else {
        newValues = [...values, option];
      }
    }

    onChange(newValues);
  };

  const handleOthersTextChange = (text: string) => {
    setOthersText(text);
    if (isOthersSelected) {
      // Keep all other selected options, only replace the "Others" related values
      const otherSelectedValues = values.filter(v => 
        v !== field.othersTextInput && 
        // Don't filter out previous "Others" custom text entries
        field.options.includes(v)
      );
      
      // Add the new text (or the "Others" placeholder if empty)
      const newCustomValue = text.trim() || field.othersTextInput || '';
      onChange([...otherSelectedValues, newCustomValue]);
    }
  };

  return (
      <Label label={`${index + 1}. ${field.title}`} error={error}>
        {field.options.map((option, optionIndex) => {
          const isOptionSelected = option === field.othersTextInput ? isOthersSelected : values.includes(option);
          
          return (
            <View key={optionIndex} className={optionIndex == 0 ? "" : "mt-1"}>
              <TouchableOpacity
                className="flex-row items-center py-2"
                onPress={() => handleOptionToggle(option)}
              >
                <CCheckbox 
                  checked={isOptionSelected}
                  onChecked={() => handleOptionToggle(option)}
                />
                <CText className="ml-3 flex-1">{option}</CText>
              </TouchableOpacity>
              
              {option === field.othersTextInput && hasOthers && isOthersSelected && (
                <View className="mt-2">
                  <Input
                    ref={othersInputRef}
                    placeholder="Please specify..."
                    value={othersText}
                    onChangeText={handleOthersTextChange}
                  />
                </View>
              )}
            </View>
          );
        })}
      </Label>
  );
};

// Text Component
export const Text: React.FC<TextFieldProps> = ({ field, index, value, onChange, error }) => {
  const handleChange = (text: string) => {
    onChange(text);
  };

  return (
    <Label label={`${index + 1}. ${field.title}`} error={error}>
      <View className="mt-1">
        <Input
          placeholder={field.placeholder || 'Enter text...'}
          value={value || ''}
          onChangeText={handleChange}
          multiline={field.multiline}
          maxLength={field.maxLength}
          numberOfLines={field.multiline ? 4 : 1}
          onFocus={() => {
            // Add extra scroll padding when focused
            setTimeout(() => {
              // Scroll the input into view with extra padding
            }, 100);
          }}
        />
      </View>
    </Label>
  );
};

// Export all components and types
export default {
  Radio,
  Number,
  Checkbox,
  Text,
};