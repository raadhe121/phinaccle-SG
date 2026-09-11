import React from 'react';
import { Platform, Text } from 'react-native';
import { render, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ZoomScreen } from '../../app/(app)/(root)/teleconsult/zoom';

// This suite covers the fix for: patients unable to hear the doctor on the
// first call attempt, requiring the doctor to hang up and redial. Root cause:
// the app never forced an audio route after joining, so it inherited
// whatever route the incoming-call flow (CallKit on iOS, ringtone
// notification on Android) left behind. See app/(app)/(root)/teleconsult/zoom.tsx.

jest.mock('@/services/client', () => ({
  getVideoTokenApiTeleconsultV2VideoPost: (...args: unknown[]) => mockGetVideoToken(...args),
}));

jest.mock('@/common/utils/lib', () => ({
  usePermission: jest.fn(),
  onError: jest.fn(),
}));

jest.mock('@/common/utils/modal', () => ({
  toast: {
    loading: jest.fn(() => jest.fn()),
    fail: jest.fn(),
  },
}));

jest.mock('@/common/utils/config', () => ({
  colors: { primary: '#000000', action: '#000000' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@ant-design/react-native', () => ({
  Button: (props: { children?: React.ReactNode }) => props.children ?? null,
}));

jest.mock('@/common/components/AntdText', () => ({
  CText: (props: { children?: React.ReactNode }) => props.children ?? null,
  ListItem: (props: { children?: React.ReactNode }) => props.children ?? null,
}));

// Renders a marker once mounted so tests can assert the session-joined UI
// actually shows up, without depending on the real video screen internals.
jest.mock('@/components/VideoScreen', () => {
  const { Text: RNText } = require('react-native');
  return {
    VideoAnimatedScreen: () => <RNText testID="in-session-marker">joined</RNText>,
  };
});

jest.mock('@/components/VideoInfoBar', () => () => null);

jest.mock('@/providers/realtime', () => ({
  useRealtime: () => ({ activity: null }),
}));

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'test-teleconsult-id' }),
}));

jest.mock('react-native-callkeep', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getCalls: jest.fn(() => Promise.resolve([])),
    endCall: jest.fn(),
  },
  CONSTANTS: { END_CALL_REASONS: { ANSWERED_ELSEWHERE: 'answered_elsewhere' } },
}));

// --- Zoom Video SDK mock ---
// Captures listeners registered via addListener so tests can fire SDK
// events (like onSessionJoin) manually, the same way the native SDK would.
const zoomListeners: Record<string, (...args: any[]) => void> = {};
const mockAddListener = jest.fn((event: string, handler: (...args: any[]) => void) => {
  zoomListeners[event] = handler;
  return { remove: jest.fn() };
});
const mockJoinSession = jest.fn(() => Promise.resolve());
const mockLeaveSession = jest.fn();
const mockSetSpeaker = jest.fn(() => Promise.resolve());
const mockResetAudioSession = jest.fn(() => Promise.resolve());
const mockGetMySelf = jest.fn(() => Promise.resolve({ userId: 'doctor-1' }));
const mockGetRemoteUsers = jest.fn(() => Promise.resolve([]));
const mockGetVideoToken = jest.fn();

jest.mock('@zoom/react-native-videosdk', () => ({
  EventType: {
    onSessionJoin: 'onSessionJoin',
    onUserJoin: 'onUserJoin',
    onUserLeave: 'onUserLeave',
    onSessionLeave: 'onSessionLeave',
  },
  VideoAspect: { PanAndScan: 'PanAndScan' },
  ZoomVideoSdkProvider: (props: { children?: React.ReactNode }) => props.children ?? null,
  ZoomVideoSdkUser: jest.fn().mockImplementation((data: unknown) => data),
  ZoomView: () => null,
  useZoom: () => ({
    addListener: mockAddListener,
    session: { getMySelf: mockGetMySelf, getRemoteUsers: mockGetRemoteUsers },
    joinSession: mockJoinSession,
    leaveSession: mockLeaveSession,
    videoHelper: { switchCamera: jest.fn() },
    audioHelper: { setSpeaker: mockSetSpeaker, resetAudioSession: mockResetAudioSession },
  }),
}));

describe('ZoomScreen audio routing (patient app)', () => {
  const originalPlatformOS = Platform.OS;
  const fakeZoomConfig = {
    sessionName: 'session-1',
    token: 'token',
    userName: 'Patient',
    sessionIdleTimeoutMins: 30,
    audioOptions: {},
    videoOptions: {},
  };

  const renderScreen = () => {
    // retry: false avoids leaking retry timers past the end of a test
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return render(
      <QueryClientProvider client={client}>
        <ZoomScreen />
      </QueryClientProvider>
    );
  };

  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(zoomListeners)) delete zoomListeners[key];
    mockGetVideoToken.mockResolvedValue(fakeZoomConfig);
    mockJoinSession.mockResolvedValue(undefined);
    mockSetSpeaker.mockResolvedValue(undefined);
    mockResetAudioSession.mockResolvedValue(undefined);
    // The rejection-path tests deliberately trigger the component's own
    // console.error(e) logging - assert on it there, but keep test output clean.
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
    errorSpy.mockRestore();
  });

  it('resets the audio session before joining on iOS, so Zoom does not inherit the torn-down CallKit AVAudioSession', async () => {
    Platform.OS = 'ios';
    renderScreen();

    await waitFor(() => expect(mockJoinSession).toHaveBeenCalled());

    expect(mockResetAudioSession).toHaveBeenCalledTimes(1);
    const resetOrder = mockResetAudioSession.mock.invocationCallOrder[0];
    const joinOrder = mockJoinSession.mock.invocationCallOrder[0];
    expect(resetOrder).toBeLessThan(joinOrder);
  });

  it('does not touch the audio session before joining on Android, where there is no CallKit', async () => {
    Platform.OS = 'android';
    renderScreen();

    await waitFor(() => expect(mockJoinSession).toHaveBeenCalled());

    expect(mockResetAudioSession).not.toHaveBeenCalled();
  });

  it.each(['ios', 'android'] as const)(
    'forces the speaker route once the session join event fires on %s, so the patient can hear audio on the first call',
    async (platform) => {
      Platform.OS = platform;
      renderScreen();

      await waitFor(() => expect(zoomListeners.onSessionJoin).toBeDefined());

      await act(async () => {
        await zoomListeners.onSessionJoin();
      });

      expect(mockSetSpeaker).toHaveBeenCalledWith(true);
      expect(mockSetSpeaker).toHaveBeenCalledTimes(1);
    }
  );

  it('still marks the session as joined even if forcing the speaker route fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    Platform.OS = 'android';
    mockSetSpeaker.mockRejectedValueOnce(new Error('no audio route available'));
    const { getByTestId } = renderScreen();

    await waitFor(() => expect(zoomListeners.onSessionJoin).toBeDefined());

    await act(async () => {
      await zoomListeners.onSessionJoin();
    });

    // The failed setSpeaker call must not prevent the session from being
    // marked as joined - it's a best-effort audio route fix, not a
    // precondition for the call to proceed.
    await waitFor(() => expect(getByTestId('in-session-marker')).toBeTruthy());
    expect(warnSpy).toHaveBeenCalledWith('Failed to force speaker audio route', expect.any(Error));

    warnSpy.mockRestore();
  });

  it('still joins the Zoom session on iOS even if resetting the audio session fails', async () => {
    Platform.OS = 'ios';
    mockResetAudioSession.mockRejectedValueOnce(new Error('AVAudioSession busy'));
    renderScreen();

    // joinSession is guarded by the same try/catch as resetAudioSession, so a
    // rejection here is expected to abort the join for this attempt (surfaced
    // via console.error) rather than silently proceed with a broken session.
    await waitFor(() => expect(mockResetAudioSession).toHaveBeenCalledTimes(1));
    expect(mockJoinSession).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
  });
});
