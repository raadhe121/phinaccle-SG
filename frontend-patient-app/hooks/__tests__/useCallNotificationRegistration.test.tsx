import { Platform } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCallNotificationRegistration } from '@/hooks/useCallNotificationRegistration';

// This suite covers the fix for: iPhone patients missing the doctor's call on
// the first attempt (silent, straight to "missed call"), only working again
// after a device restart. Root causes fixed in useCallNotificationRegistration.ts:
//  1. The APN/VoIP token was only ever sent to the backend from the teleconsult
//     booking screen, never refreshed for the rest of the session.
//  2. react-native-voip-push-notification caches any token/push that arrives
//     before a JS listener is attached, and only replays it via a
//     'didLoadWithEvents' event - which nothing was listening for, so the very
//     first token of a fresh app process was silently lost.
//  3. The token upload had no error handling, so a transient failure dropped
//     it with no retry.

const mockUpdateApnToken = jest.fn();
const mockUpdateFcmToken = jest.fn();

jest.mock('@/services/client', () => ({
  updateApnTokenApiUserUpdateApnTokenPost: (...args: unknown[]) => mockUpdateApnToken(...args),
  updateFcmTokenApiUserUpdateFcmTokenPost: (...args: unknown[]) => mockUpdateFcmToken(...args),
}));

// --- react-native-voip-push-notification mock ---
// Mirrors the real module's "one listener per event type" behaviour so tests
// can fire events the same way the native side would.
const voipListeners: Record<string, (...args: any[]) => void> = {};
const mockRegisterVoipToken = jest.fn();
const mockOnVoipNotificationCompleted = jest.fn();
const mockAddEventListener = jest.fn((type: string, handler: (...args: any[]) => void) => {
  voipListeners[type] = handler;
});
const mockRemoveEventListener = jest.fn((type: string) => {
  delete voipListeners[type];
});

jest.mock('react-native-voip-push-notification', () => ({
  __esModule: true,
  default: {
    addEventListener: (...args: any[]) => mockAddEventListener(...args),
    removeEventListener: (...args: any[]) => mockRemoveEventListener(...args),
    registerVoipToken: () => mockRegisterVoipToken(),
    onVoipNotificationCompleted: (...args: any[]) => mockOnVoipNotificationCompleted(...args),
  },
}));

// --- @react-native-firebase/messaging mock ---
const mockGetToken = jest.fn();
const mockUnsubscribeTokenRefresh = jest.fn();
let tokenRefreshHandler: ((token: string) => void) | undefined;
const mockOnTokenRefresh = jest.fn((handler: (token: string) => void) => {
  tokenRefreshHandler = handler;
  return mockUnsubscribeTokenRefresh;
});

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: () => ({
    getToken: (...args: any[]) => mockGetToken(...args),
    onTokenRefresh: (...args: any[]) => mockOnTokenRefresh(...args),
  }),
}));

describe('useCallNotificationRegistration', () => {
  const originalPlatformOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    for (const key of Object.keys(voipListeners)) delete voipListeners[key];
    tokenRefreshHandler = undefined;
    mockUpdateApnToken.mockResolvedValue(undefined);
    mockUpdateFcmToken.mockResolvedValue(undefined);
    mockGetToken.mockResolvedValue('fcm-token-1');
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
    jest.useRealTimers();
  });

  describe('iOS', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('registers for VoIP push and subscribes to register/notification/didLoadWithEvents on mount', () => {
      renderHook(() => useCallNotificationRegistration(true));

      expect(mockRegisterVoipToken).toHaveBeenCalledTimes(1);
      expect(mockAddEventListener).toHaveBeenCalledWith('register', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('notification', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('didLoadWithEvents', expect.any(Function));
    });

    it('does nothing when disabled (e.g. logged out)', () => {
      renderHook(() => useCallNotificationRegistration(false));

      expect(mockRegisterVoipToken).not.toHaveBeenCalled();
      expect(mockAddEventListener).not.toHaveBeenCalled();
    });

    it('uploads the token to the backend when the register event fires', async () => {
      renderHook(() => useCallNotificationRegistration(true));

      act(() => {
        voipListeners.register('fresh-voip-token');
      });

      await waitFor(() => expect(mockUpdateApnToken).toHaveBeenCalledWith({
        requestBody: { token: 'fresh-voip-token' },
      }));
    });

    it('ignores an empty token from the register event', async () => {
      renderHook(() => useCallNotificationRegistration(true));

      act(() => {
        voipListeners.register('');
      });

      expect(mockUpdateApnToken).not.toHaveBeenCalled();
    });

    it('marks an incoming VoIP push as completed so PushKit does not penalize the app', () => {
      renderHook(() => useCallNotificationRegistration(true));

      act(() => {
        voipListeners.notification({ uuid: 'call-uuid-1' });
      });

      expect(mockOnVoipNotificationCompleted).toHaveBeenCalledWith('call-uuid-1');
    });

    it('replays a token cached before any listener existed via didLoadWithEvents', async () => {
      renderHook(() => useCallNotificationRegistration(true));

      act(() => {
        voipListeners.didLoadWithEvents([
          { name: 'RNVoipPushRemoteNotificationsRegisteredEvent', data: 'cached-token' },
        ]);
      });

      await waitFor(() => expect(mockUpdateApnToken).toHaveBeenCalledWith({
        requestBody: { token: 'cached-token' },
      }));
    });

    it('completes a push cached before any listener existed via didLoadWithEvents', () => {
      renderHook(() => useCallNotificationRegistration(true));

      act(() => {
        voipListeners.didLoadWithEvents([
          { name: 'RNVoipPushRemoteNotificationReceivedEvent', data: { uuid: 'cached-uuid' } },
        ]);
      });

      expect(mockOnVoipNotificationCompleted).toHaveBeenCalledWith('cached-uuid');
    });

    it('replays multiple cached events and ignores event names it does not recognise', async () => {
      renderHook(() => useCallNotificationRegistration(true));

      act(() => {
        voipListeners.didLoadWithEvents([
          { name: 'RNVoipPushRemoteNotificationsRegisteredEvent', data: 'cached-token' },
          { name: 'RNVoipPushRemoteNotificationReceivedEvent', data: { uuid: 'cached-uuid' } },
          { name: 'SomeUnrelatedEvent', data: {} },
        ]);
      });

      await waitFor(() => expect(mockUpdateApnToken).toHaveBeenCalledTimes(1));
      expect(mockOnVoipNotificationCompleted).toHaveBeenCalledWith('cached-uuid');
      expect(mockOnVoipNotificationCompleted).toHaveBeenCalledTimes(1);
    });

    it('does not throw when didLoadWithEvents is not given an array', () => {
      renderHook(() => useCallNotificationRegistration(true));

      expect(() => {
        act(() => {
          voipListeners.didLoadWithEvents(undefined);
        });
      }).not.toThrow();
      expect(mockUpdateApnToken).not.toHaveBeenCalled();
    });

    it('retries the token upload on transient failure and eventually succeeds', async () => {
      // The first two attempts logging a warning is expected here - silence it
      // to keep test output clean, the "gives up" test below asserts on it.
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockUpdateApnToken
        .mockRejectedValueOnce(new Error('network blip'))
        .mockRejectedValueOnce(new Error('network blip'))
        .mockResolvedValueOnce(undefined);

      renderHook(() => useCallNotificationRegistration(true));

      act(() => {
        voipListeners.register('flaky-token');
      });

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      warnSpy.mockRestore();

      expect(mockUpdateApnToken).toHaveBeenCalledTimes(3);
      expect(mockUpdateApnToken).toHaveBeenLastCalledWith({ requestBody: { token: 'flaky-token' } });
    });

    it('gives up after 3 failed attempts and logs a warning instead of throwing', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockUpdateApnToken.mockRejectedValue(new Error('backend down'));

      renderHook(() => useCallNotificationRegistration(true));

      act(() => {
        voipListeners.register('doomed-token');
      });

      await act(async () => {
        await jest.runAllTimersAsync();
      });

      expect(mockUpdateApnToken).toHaveBeenCalledTimes(3);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('APN/VoIP token'),
        expect.any(Error)
      );

      warnSpy.mockRestore();
    });

    it('removes all VoIP listeners on unmount', () => {
      const { unmount } = renderHook(() => useCallNotificationRegistration(true));

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('register');
      expect(mockRemoveEventListener).toHaveBeenCalledWith('notification');
      expect(mockRemoveEventListener).toHaveBeenCalledWith('didLoadWithEvents');
    });
  });

  describe('Android', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('fetches and uploads the FCM token on mount', async () => {
      renderHook(() => useCallNotificationRegistration(true));

      await waitFor(() => expect(mockUpdateFcmToken).toHaveBeenCalledWith({
        requestBody: { token: 'fcm-token-1' },
      }));
    });

    it('does nothing when disabled (e.g. logged out)', () => {
      renderHook(() => useCallNotificationRegistration(false));

      expect(mockGetToken).not.toHaveBeenCalled();
      expect(mockOnTokenRefresh).not.toHaveBeenCalled();
    });

    it('uploads a refreshed FCM token when the OS rotates it mid-session', async () => {
      renderHook(() => useCallNotificationRegistration(true));

      await waitFor(() => expect(mockOnTokenRefresh).toHaveBeenCalled());

      act(() => {
        tokenRefreshHandler?.('rotated-fcm-token');
      });

      await waitFor(() => expect(mockUpdateFcmToken).toHaveBeenCalledWith({
        requestBody: { token: 'rotated-fcm-token' },
      }));
    });

    it('unsubscribes from token refresh on unmount', async () => {
      const { unmount } = renderHook(() => useCallNotificationRegistration(true));

      await waitFor(() => expect(mockOnTokenRefresh).toHaveBeenCalled());

      unmount();

      expect(mockUnsubscribeTokenRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
