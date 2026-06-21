import * as Sentry from "@sentry/react-native";

let _posthog: { capture: (name: string, props?: Record<string, unknown>) => void; identify: (id: string) => void; reset: () => void } | null = null;

export function initAnalytics(sentryDsn: string, posthogApiKey: string, posthogHost: string) {
  Sentry.init({ dsn: sentryDsn, enableNative: true });

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PostHog } = require("posthog-react-native") as {
      PostHog: new (apiKey: string, opts: { host: string }) => {
        capture: (name: string, props?: Record<string, unknown>) => void;
        identify: (id: string) => void;
        reset: () => void;
      };
    };
    _posthog = new PostHog(posthogApiKey, { host: posthogHost });
  } catch {
    // posthog-react-native not yet installed — events are silently dropped.
  }
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(err, { extra: context });
}

export function setUser(userId: string | null) {
  Sentry.setUser(userId ? { id: userId } : null);
  if (userId) {
    _posthog?.identify(userId);
  } else {
    _posthog?.reset();
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  _posthog?.capture(name, props);
}
