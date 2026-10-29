import Constants from "expo-constants";

// `path` is dot-separated because app.config.ts nests some keys (`extra.eas.projectId`);
// a flat `extra["eas.projectId"]` lookup never finds them.
function require_env(path: string): string {
  let node: unknown = Constants.expoConfig?.extra;
  for (const part of path.split(".")) {
    node = node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined;
  }
  if (typeof node !== "string" || !node) throw new Error(`Missing EAS env: ${path}`);
  return node;
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
  get REVENUECAT_PUBLIC_KEY(): string {
    return (Constants.expoConfig?.extra?.["revenuecatPublicKey"] as string | undefined) ?? "";
  },
  get REVENUECAT_ANDROID_KEY(): string {
    return (Constants.expoConfig?.extra?.["revenuecatAndroidKey"] as string | undefined) ?? "";
  },
} as const;
