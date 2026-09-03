const mockPosthog = {
  capture: jest.fn(),
  identify: jest.fn(),
  reset: jest.fn(),
};
const mockSentry = {
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
};

jest.mock("@sentry/react-native", () => mockSentry);
jest.mock("posthog-react-native", () => ({ PostHog: jest.fn(() => mockPosthog) }));
jest.mock("@react-native-async-storage/async-storage", () => ({}));

import { initAnalytics, setAnalyticsConsent, setUser, trackEvent } from "@/lib/analytics";

beforeEach(() => {
  jest.clearAllMocks();
  setAnalyticsConsent(false);
  initAnalytics("https://public@example.test/123", "posthog-test-key", "https://posthog.test");
});

describe("analytics consent and payload boundary", () => {
  it("does not identify users or send events before consent", () => {
    setUser("synthetic-user-id");
    trackEvent("onboarding_step_completed", { step: "location_entry" });

    expect(mockSentry.setUser).not.toHaveBeenCalledWith({ id: "synthetic-user-id" });
    expect(mockPosthog.identify).not.toHaveBeenCalled();
    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });

  it("drops astrological and location fields even after consent", () => {
    setAnalyticsConsent(true);
    trackEvent("onboarding_step_completed", {
      step: "location_entry",
      rasi: "mesham",
      nakshatra: "ashwini",
      city: "Example City",
      lat: 12.34,
      lon: 56.78,
      email: "synthetic@example.test",
      birthTime: "06:30",
    });

    expect(mockPosthog.capture).toHaveBeenCalledWith("onboarding_step_completed", { step: "location_entry" });
  });

  it("drops unknown event names instead of treating them as an implicit allowlist", () => {
    setAnalyticsConsent(true);
    trackEvent("birth_chart_opened", { rasi: "mesham" });

    expect(mockPosthog.capture).not.toHaveBeenCalled();
  });
});
