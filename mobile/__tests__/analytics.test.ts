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

// Imports stay below the Jest factories so the optional native modules are
// replaced before analytics is evaluated.
// eslint-disable-next-line import/first
import { captureError, initAnalytics, setAnalyticsConsent, setUser, trackEvent } from "@/lib/analytics";

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

  it("allows the life-focus Ask tap with only aggregate-safe properties", () => {
    setAnalyticsConsent(true);
    trackEvent("life_focus_ask_chip_tapped", {
      focus: "CAREER",
      surface: "mobile",
      chip_index: 1,
      question: "private free text must never leave the device",
    });

    expect(mockPosthog.capture).toHaveBeenCalledWith("life_focus_ask_chip_tapped", {
      focus: "CAREER",
      surface: "mobile",
      chip_index: 1,
    });
  });
});

describe("analytics consent has a surface that can grant it", () => {
  it("sends events once consent is granted, and stops the moment it is withdrawn", () => {
    setAnalyticsConsent(true);
    trackEvent("onboarding_step_completed", { step: "rasi_picker" });
    expect(mockPosthog.capture).toHaveBeenCalledTimes(1);

    // Withdrawal has to take effect immediately and drop the identity with it,
    // not merely stop future sessions.
    setAnalyticsConsent(false);
    trackEvent("onboarding_step_completed", { step: "location_entry" });
    expect(mockPosthog.capture).toHaveBeenCalledTimes(1);
    expect(mockPosthog.reset).toHaveBeenCalled();
    expect(mockSentry.setUser).toHaveBeenCalledWith(null);
  });

  it("keeps crash reporting outside the consent gate", () => {
    // Deliberate split: crash reporting under legitimate interest, product
    // analytics under consent. A test so nobody "harmonises" the two silently.
    captureError(new Error("synthetic failure"));
    expect(mockSentry.captureException).toHaveBeenCalled();
  });
});

describe("Sentry context is scrubbed (spec §9)", () => {
  it("strips birth details and free text from the extra context", () => {
    // Running outside the consent gate is exactly why this matters: a crash in
    // a birth-details screen is where someone attaches the form state they
    // were debugging, and it would leave the device from an account that
    // granted nothing.
    captureError(new Error("synthetic failure"), {
      step: "location_entry",
      birthDate: "1990-01-01",
      birthPlace: "Example City",
      email: "synthetic@example.test",
      question: "free text the person typed",
    });

    expect(mockSentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: { step: "location_entry" },
    });
  });

  it("sends no extra at all when nothing survives scrubbing", () => {
    captureError(new Error("synthetic failure"), { birthTime: "06:30" });
    expect(mockSentry.captureException).toHaveBeenCalledWith(expect.any(Error), {
      extra: undefined,
    });
  });
});

describe("the taxonomy is shared with the web app", () => {
  it("accepts an event this client does not fire but the taxonomy defines", () => {
    // Both clients now read one allowlist (packages/shared/src/analytics.ts).
    // Before, mobile kept its own pair of sets and web had none, so the two
    // boundaries could not be tested together or kept in step.
    setAnalyticsConsent(true);
    trackEvent("paywall_viewed", { trigger_feature: "ask" });
    expect(mockPosthog.capture).toHaveBeenCalledWith("paywall_viewed", { trigger_feature: "ask" });
  });

  it("still drops the properties the old local allowlist dropped", () => {
    setAnalyticsConsent(true);
    trackEvent("share_card_shared", { pages: 2, rasi: "mesham", memberName: "Synthetic Person" });
    expect(mockPosthog.capture).toHaveBeenCalledWith("share_card_shared", { pages: 2 });
  });
});
