// Regression test for the "Telemedicine screen spins forever on rejoin" bug:
// OpenAPI.TOKEN must never hang past its timeout, even if getIdToken() (Firebase
// token refresh, seen stalling on iOS) never resolves - otherwise the axios
// request is never dispatched and react-query's isPending stays true forever.

let mockCurrentUser: { getIdToken: jest.Mock } | null = { getIdToken: jest.fn() };

jest.mock('@react-native-firebase/auth', () => () => ({
    get currentUser() {
        return mockCurrentUser;
    },
}));

jest.mock('@/Config', () => ({
    apiUrl: 'https://example.test',
    publicToken: 'PUBLIC_TOKEN',
}));

describe('OpenAPI.TOKEN', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();
        mockCurrentUser = { getIdToken: jest.fn() };
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('resolves with the real token when getIdToken succeeds quickly', async () => {
        mockCurrentUser!.getIdToken.mockResolvedValue('REAL_TOKEN');
        require('@/common/utils/config');
        const { OpenAPI } = require('@/services/client');

        await expect((OpenAPI.TOKEN as () => Promise<string>)()).resolves.toBe('REAL_TOKEN');
    });

    it('falls back to the public token instead of hanging when getIdToken never resolves', async () => {
        mockCurrentUser!.getIdToken.mockReturnValue(new Promise(() => {})); // never resolves
        require('@/common/utils/config');
        const { OpenAPI } = require('@/services/client');

        const tokenPromise = (OpenAPI.TOKEN as () => Promise<string>)();

        // Advance past the internal timeout - if the fix regresses to an
        // unbounded await, this promise will never settle and the test will hang/timeout.
        await jest.advanceTimersByTimeAsync(10000);

        await expect(tokenPromise).resolves.toBe('PUBLIC_TOKEN');
    });

    it('returns the public token immediately when there is no logged-in user', async () => {
        mockCurrentUser = null;
        require('@/common/utils/config');
        const { OpenAPI } = require('@/services/client');

        await expect((OpenAPI.TOKEN as () => Promise<string>)()).resolves.toBe('PUBLIC_TOKEN');
    });
});
