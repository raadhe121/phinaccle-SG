// From react-native-credit-card-input library
import { useCallback, useState } from 'react';
import cardValidator from 'card-validator';

export type CreditCardIssuer =
  | 'visa'
  | 'mastercard'
  | 'american-express'
  | 'diners-club'
  | 'discover'
  | 'jcb';

export type CreditCardFormField = 'number' | 'expiry' | 'cvc';

export type CreditCardFormValues = {
  number: string;
  expiry: string;
  cvc: string;
  type?: CreditCardIssuer;
};

export type ValidationState = 'empty' | 'incomplete' | 'invalid' | 'valid' | 'unsupported';

export type CreditCardFormState = {
  number: ValidationState;
  expiry: ValidationState;
  cvc: ValidationState;
};

export type CreditCardFormData = {
  valid: boolean;
  values: CreditCardFormValues;
  status: CreditCardFormState;
};

// --- Utilities

const toStatus = (validation: {
  isValid: boolean;
  isPotentiallyValid: boolean;
}): ValidationState => {
  return validation.isValid
    ? 'valid'
    : validation.isPotentiallyValid
      ? 'incomplete'
      : 'invalid';
};

const removeNonNumber = (string = '') => string.replace(/[^\d]/g, '');

const limitLength = (string = '', maxLength: number) =>
  string.slice(0, maxLength);

const addGaps = (string = '', gaps: number[]) => {
  const offsets = [0].concat(gaps).concat([string.length]);

  return offsets
    .map((end, index) => {
      if (index === 0) return '';
      const start = offsets[index - 1] || 0;
      return string.slice(start, end);
    })
    .filter((part) => part !== '')
    .join(' ');
};

const formatCardNumber = (
  number: string,
  maxLength: number,
  gaps: number[]
) => {
  const numberSanitized = removeNonNumber(number);
  const lengthSanitized = limitLength(numberSanitized, maxLength);
  const formatted = addGaps(lengthSanitized, gaps);
  return formatted;
};

const formatCardExpiry = (expiry: string) => {
  const sanitized = limitLength(removeNonNumber(expiry), 4);
  if (sanitized.match(/^[2-9]$/)) {
    return `0${sanitized}`;
  }
  if (sanitized.length > 2) {
    return `${sanitized.substr(0, 2)}/${sanitized.substr(2, sanitized.length)}`;
  }
  return sanitized;
};

const formatCardCVC = (cvc: string, cvcMaxLength: number) => {
  return limitLength(removeNonNumber(cvc), cvcMaxLength);
};

export const useCreditCardForm = ({
  supportedCardTypes,
  cardMaxLength,
  onChange = () => {},
}: {
  supportedCardTypes?: CreditCardIssuer[],
  cardMaxLength?: number,
  onChange?: (formData: CreditCardFormData) => void,
}) => {
  const [formState, setFormState] = useState<CreditCardFormState>({
    number: 'empty',
    expiry: 'empty',
    cvc: 'empty',
  });

  const [values, setValues] = useState<CreditCardFormValues>({
    number: '',
    expiry: '',
    cvc: '',
    type: undefined,
  });

  const onChangeValue = useCallback(
    (field: CreditCardFormField, value: string) => {
      const newValues = {
        ...values,
        [field]: value,
      };

      const numberValidation = cardValidator.number(newValues.number);

      // When card issuer cant be detected, use these default (3 digit CVC, 16 digit card number with spaces every 4 digit)
      const cvcMaxLength = numberValidation.card?.code.size || 3;
      const cardNumberGaps = numberValidation.card?.gaps || [4, 8, 12];
      // Credit card number can vary. Use the longest possible as maximum (otherwise fallback to 16)
      let cardNumberMaxLength = Math.max(...(numberValidation.card?.lengths || [16]));
      if (cardMaxLength && cardNumberMaxLength > cardMaxLength) {
        cardNumberMaxLength = cardMaxLength;
      }

      const newFormattedValues = {
        number: formatCardNumber(
          newValues.number,
          cardNumberMaxLength,
          cardNumberGaps
        ),
        expiry: formatCardExpiry(newValues.expiry),
        cvc: formatCardCVC(newValues.cvc, cvcMaxLength),
        type: numberValidation.card?.type as CreditCardIssuer,
      };

      const validateFormState = (field: CreditCardFormField, validator: (...params: any[]) => any, ...params: any[]) => {
        if (params[0].length === 0) return 'empty';
        if (field === 'number' && supportedCardTypes && newFormattedValues.type && !supportedCardTypes.includes(newFormattedValues.type)) return 'unsupported';
        return toStatus(validator(...params));
      }

      const newFormState = {
        number: validateFormState('number', cardValidator.number, newFormattedValues.number),
        expiry: validateFormState('expiry', cardValidator.expirationDate, newFormattedValues.expiry),
        cvc: validateFormState('cvc', cardValidator.cvv, newFormattedValues.cvc, cvcMaxLength),
      };

      setValues(newFormattedValues);
      setFormState(newFormState);

      onChange({
        valid:
          newFormState.number === 'valid' &&
          newFormState.expiry === 'valid' &&
          newFormState.cvc === 'valid',
        values: newFormattedValues,
        status: newFormState,
      });
    },
    [values, onChange]
  );

  return {
    values,
    status: formState,
    onChangeValue,
  };
};
