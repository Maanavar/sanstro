/**
 * Shared setup for the "screens" Jest project — mocks the native modules
 * that nearly every real screen touches indirectly (a SafeAreaView, an
 * onboarding progress bar's entrance animation, an AsyncStorage-backed pref)
 * so individual screen tests don't each have to rediscover the same three
 * mocks. Module-specific mocks (analytics, a particular API call) stay in
 * the test file that needs them.
 */

// react-native-reanimated's own `/mock` entry point (the documented jest
// mock for v3) does NOT work under this app's v4 + the split-out
// `react-native-worklets` package: `mock.ts` itself imports the real
// `./index`, which constructs `NativeWorklets` at module load and throws
// ("Native part of Worklets doesn't seem to be initialized") — there is no
// native binding under Jest. Getting reanimated v4 running under Jest is a
// real, separate infra task (a working `react-native-worklets` mock, or a
// jest-expo version that ships one). Until then: mock out whichever specific
// component actually imports reanimated (e.g. `@/components/
// OnboardingProgressBar`) in the test file that renders it, rather than
// trying to mock the library globally here.

// react-native-safe-area-context has no shipped jest mock in this version —
// SafeAreaView/useSafeAreaInsets need a real device to size against, which
// doesn't exist under Jest. Stand in with the plain View and a zeroed inset.
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: View,
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// In-memory AsyncStorage — same shape as the manual mock in
// __tests__/guestStore.test.ts, generalised so any screen using userPrefs /
// languageContext / sessionContext's storage doesn't need its own copy.
const mockAsyncStorageState = new Map();
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key) => Promise.resolve(mockAsyncStorageState.get(key) ?? null)),
  setItem: jest.fn((key, value) => {
    mockAsyncStorageState.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    mockAsyncStorageState.delete(key);
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((key) => mockAsyncStorageState.delete(key));
    return Promise.resolve();
  }),
}));
