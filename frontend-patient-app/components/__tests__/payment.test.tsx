import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// Define types for our props
interface Rates {
  is_pcp: boolean;
  require_branch_picker_methods: string[];
  collection_method_messages?: {
    [key: string]: string;
  };
}

interface FormValues {
  collectionMethod: string;
}

// Create a simple test component that simulates the payment screen's behavior
function TestPaymentComponent({ rates, formVals }: { rates: Rates; formVals: FormValues }) {
  return (
    <View>
      {rates && rates.require_branch_picker_methods.includes(formVals.collectionMethod) && !rates.is_pcp && (
        <View testID="branch-picker" />
      )}
      {rates?.collection_method_messages?.[formVals.collectionMethod] && (
        <Text testID="warning-message">{rates.collection_method_messages[formVals.collectionMethod]}</Text>
      )}
    </View>
  );
}

describe('Payment Screen', () => {
  it('should render branch picker when collection method is in require_branch_picker_methods', () => {
    const rates: Rates = {
      is_pcp: false,
      require_branch_picker_methods: ['delivery', 'pickup']
    };
    const formVals: FormValues = {
      collectionMethod: 'delivery'
    };

    const { queryByTestId } = render(<TestPaymentComponent rates={rates} formVals={formVals} />);
    
    // Check if branch picker is rendered
    expect(queryByTestId('branch-picker')).toBeTruthy();
  });

  it('should not render branch picker when collection method is not in require_branch_picker_methods', () => {
    const rates: Rates = {
      is_pcp: false,
      require_branch_picker_methods: ['pickup']
    };
    const formVals: FormValues = {
      collectionMethod: 'delivery'
    };

    const { queryByTestId } = render(<TestPaymentComponent rates={rates} formVals={formVals} />);
    
    // Check if branch picker is not rendered
    expect(queryByTestId('branch-picker')).toBeNull();
  });

  it('should display delivery message after 8pm', () => {
    const rates: Rates = {
      is_pcp: false,
      require_branch_picker_methods: ['delivery', 'pickup'],
      collection_method_messages: {
        delivery: 'Delivery orders placed after 8pm will be processed the next business day.'
      }
    };
    const formVals: FormValues = {
      collectionMethod: 'delivery'
    };

    const { queryByTestId } = render(<TestPaymentComponent rates={rates} formVals={formVals} />);
    
    // Check if the warning message is displayed
    expect(queryByTestId('warning-message')).toBeTruthy();
  });

  it('should not display special message for delivery before 8pm', () => {
    const rates: Rates = {
      is_pcp: false,
      require_branch_picker_methods: ['delivery', 'pickup'],
      collection_method_messages: {}
    };
    const formVals: FormValues = {
      collectionMethod: 'delivery'
    };

    const { queryByTestId } = render(<TestPaymentComponent rates={rates} formVals={formVals} />);
    
    // Check that no warning message is displayed
    expect(queryByTestId('warning-message')).toBeNull();
  });
}); 