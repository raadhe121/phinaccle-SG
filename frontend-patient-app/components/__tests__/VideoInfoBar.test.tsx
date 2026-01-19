import React from 'react';
import { render, act } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import VideoInfoBar from '../VideoInfoBar';
import { TeleconsultWarningMessage } from '@/services/client';

// Mock all external dependencies
jest.mock('@/common/utils/config', () => ({
  colors: {
    primary: '#123456',
    action: '#654321'
  }
}));

jest.mock('@react-native-firebase/auth', () => {
  return () => ({
    currentUser: { uid: 'test-uid' },
    onAuthStateChanged: jest.fn(),
  });
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@ant-design/react-native', () => ({
  Button: () => null,
  Modal: (props: { visible?: boolean; children: React.ReactNode }) => props.visible ? props.children : null,
  View: (props: { children: React.ReactNode }) => props.children,
}));

jest.mock('@/common/components/AntdText', () => ({
  ListItem: (props: { children: React.ReactNode }) => props.children,
  TextLink: (props: { children: React.ReactNode }) => props.children,
  TitleText: (props: { children: React.ReactNode }) => props.children,
}));

jest.mock('dayjs', () => {
  return (time: number | string | Date) => {
    if (typeof time === 'number') {
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      return {
        format: () => `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      };
    }
    return {
      format: () => 'mock-time'
    };
  };
});

// Test suite
describe('VideoInfoBar Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should render without warning initially', () => {
    const { getByTestId, queryByTestId } = render(
      <VideoInfoBar elapsedTime={0} warningConfig={null} />
    );
    
    expect(getByTestId('info-button')).toBeTruthy();
    expect(queryByTestId('warning-message')).toBeNull();
  });

  it('should display warning when threshold is reached', () => {
    const warningConfig: TeleconsultWarningMessage = {
      state: 'on',
      display_after_secs: 10,
      message: 'Warning message'
    };

    const { getByTestId } = render(
      <VideoInfoBar elapsedTime={15} warningConfig={warningConfig} />
    );
    
    expect(getByTestId('warning-message')).toBeTruthy();
  });

  it('should not display warning if state is off', () => {
    const warningConfig: TeleconsultWarningMessage = {
      state: 'off',
      display_after_secs: 10,
      message: 'Warning message'
    };

    const { queryByTestId } = render(
      <VideoInfoBar elapsedTime={15} warningConfig={warningConfig} />
    );
    
    expect(queryByTestId('warning-message')).toBeNull();
  });

  it('should format time correctly in warning message', () => {
    const warningConfig: TeleconsultWarningMessage = {
      state: 'on',
      display_after_secs: 10,
      message: 'Warning message'
    };

    const { getByTestId } = render(
      <VideoInfoBar elapsedTime={65} warningConfig={warningConfig} />
    );
    
    const warningText = getByTestId('warning-message').props.children.join('');
    expect(warningText).toContain('01:05');
  });
}); 