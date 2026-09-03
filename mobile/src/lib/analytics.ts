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

export function captureError(err: unknown, context?: Record<string, unknown>) {
  _sentry?.captureException(err, { extra: context });
}

export function setUser(userId: string | null) {
  _sentry?.setUser(userId ? { id: userId } : null);
  if (userId) {
    _posthog?.identify(userId);
  } else {
    _posthog?.reset();
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  _posthog?.capture(name, props);
}
