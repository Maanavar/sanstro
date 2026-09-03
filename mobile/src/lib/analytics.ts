import AsyncStorage from "@react-native-async-storage/async-storage";

type SentryModule = {
  init: (opts: { dsn: string; enableNative: boolean }) => void;
  captureException: (err: unknown, opts?: { extra?: Record<string, unknown> }) => void;
  setUser: (user: { id: string } | null) => void;
};

type AnalyticsClient = {
  capture: (name: string, props?: Record<string, unknown>) => void;
  identify: (id: string) => void;
  reset: () => void;
};

let _sentry: SentryModule | null = null;
let _posthog: AnalyticsClient | null = null;
let _analyticsConsent = false;

const ALLOWED_EVENTS = new Set([
  "onboarding_step_completed",
  "jadhagam_teaser_shown",
  "register_from_teaser",
  "share_card_opened",
  "share_card_shared",
  "onboarding_complete",
  "whatsapp_share_tapped",
]);

const ALLOWED_EVENT_PROPERTIES = new Set([
  "step",
  "skipped",
  "source",
  "report_upsell",
  "pages",
]);

/**
 * Consent is deliberately opt-in. The caller owns persistence/UI, while this
 * module is the non-bypassable transport gate for both identity and events.
 */
export function setAnalyticsConsent(granted: boolean): void {
  _analyticsConsent = granted;
  if (!granted) {
    _sentry?.setUser(null);
    _posthog?.reset();
  }
}

export function hasAnalyticsConsent(): boolean {
  return _analyticsConsent;
}

function allowedProperties(props?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!props) return undefined;
  const filtered = Object.fromEntries(
    Object.entries(props).filter(([key]) => ALLOWED_EVENT_PROPERTIES.has(key)),
  );
  return Object.keys(filtered).length > 0 ? filtered : undefined;
}

function isValidSentryDsn(dsn: string): boolean {
  if (!dsn) return false;
  try {
    const parsed = new URL(dsn);
    const projectId = parsed.pathname.split("/").filter(Boolean).at(-1) ?? "";
    return Boolean(
      parsed.protocol.startsWith("http") &&
      parsed.username &&
      parsed.host &&
      /^\d+$/.test(projectId)
    );
  } catch {
    return false;
  }
}

export function initAnalytics(sentryDsn: string, posthogApiKey: string, posthogHost: string) {
  const dsn = sentryDsn.trim();
  if (isValidSentryDsn(dsn)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      _sentry = require("@sentry/react-native") as SentryModule;
      _sentry.init({ dsn, enableNative: true });
    } catch {
      _sentry = null;
    }
  } else if (__DEV__) {
    console.warn("[analytics] SENTRY_DSN not set - crashes will not be reported");
  }

  const posthogKey = posthogApiKey.trim();
  if (!posthogKey) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PostHog } = require("posthog-react-native") as {
      PostHog: new (
        apiKey: string,
        opts: { host: string; customStorage: typeof AsyncStorage }
      ) => AnalyticsClient;
    };
    _posthog = new PostHog(posthogKey, {
      host: posthogHost.trim() || "https://app.posthog.com",
      customStorage: AsyncStorage,
    });
  } catch {
    // posthog-react-native not yet installed - events are silently dropped.
  }
}

/**
 * Deliberately NOT consent-gated, unlike setUser and trackEvent. Crash reporting
 * runs under legitimate interest — a stack trace carries no identity once setUser
 * has been withheld — while product analytics runs under consent. Do not
 * "harmonise" the two in either direction without revisiting DATA_PROTECTION.md.
 */
export function captureError(err: unknown, context?: Record<string, unknown>) {
  _sentry?.captureException(err, { extra: context });
}

export function setUser(userId: string | null) {
  if (!_analyticsConsent) return;
  _sentry?.setUser(userId ? { id: userId } : null);
  if (userId) {
    _posthog?.identify(userId);
  } else {
    _posthog?.reset();
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (!_analyticsConsent || !ALLOWED_EVENTS.has(name)) return;
  _posthog?.capture(name, allowedProperties(props));
}
