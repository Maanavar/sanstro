import Constants from "expo-constants";

function require_env(key: string): string {
  const v = Constants.expoConfig?.extra?.[key] as string | undefined;
  if (!v) throw new Error(`Missing EAS env: ${key}`);
  return v;
}

export const ENV = {
  get API_BASE_URL(): string {
    return (Constants.expoConfig?.extra?.["apiBaseUrl"] as string | undefined) ?? "http://localhost:8000";
  },
  get EAS_PROJECT_ID(): string {
    return require_env("eas.projectId");
  },
  get SENTRY_DSN(): string {
    return (Constants.expoConfig?.extra?.["sentryDsn"] as string | undefined) ?? "";
  },
  get POSTHOG_API_KEY(): string {
    return (Constants.expoConfig?.extra?.["posthogApiKey"] as string | undefined) ?? "";
  },
  get POSTHOG_HOST(): string {
    return (Constants.expoConfig?.extra?.["posthogHost"] as string | undefined) ?? "https://app.posthog.com";
  },
} as const;
