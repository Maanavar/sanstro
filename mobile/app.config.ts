import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Vinaadi",
  slug: "vinaadi",
  owner: "zasdigital",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#FAF7F2",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: process.env.APP_BUNDLE_ID ?? "ai.vinaadi.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Used to calculate panchangam timings for your location.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FAF7F2",
    },
    package: process.env.APP_BUNDLE_ID ?? "ai.vinaadi.app",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-secure-store",
      { faceIDPermission: "Used to secure your auth tokens." },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#D4611A",
        sounds: [],
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
        iosAppId: process.env.ADMOB_IOS_APP_ID ?? "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
      },
    ],
    // Injects App Group entitlement (iOS) + AppWidget manifest entries (Android).
    "./plugins/withWidgets",
    // react-native-purchases (RevenueCat) has no Expo plugin — initialized in JS at app start.
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID ?? "dd9f9f60-baa4-4967-9937-14461766cb85",
    },
    apiBaseUrl:           process.env.API_BASE_URL           ?? "http://localhost:8000",
    sentryDsn:            process.env.SENTRY_DSN             ?? "",
    posthogApiKey:        process.env.POSTHOG_API_KEY        ?? "",
    posthogHost:          process.env.POSTHOG_HOST           ?? "https://app.posthog.com",
    revenuecatPublicKey:  process.env.REVENUECAT_PUBLIC_KEY  ?? "",
    revenuecatAndroidKey: process.env.REVENUECAT_ANDROID_KEY ?? "",
  },
  scheme: "vinaadi",
  newArchEnabled: true,
});
