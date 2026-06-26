import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as ExpoFont from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
// Lazy-loaded to avoid crashing in Expo Go — JSI modules fail at import time when native bridge is absent.
let Purchases: typeof import("react-native-purchases").default | null = null;
try { Purchases = require("react-native-purchases").default; } catch { /* Expo Go */ }
import { SessionProvider, useSession } from "@/state/sessionContext";
import { LanguageProvider } from "@/state/languageContext";
import { ToastProvider } from "@/context/ToastContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { queryClient, asyncStoragePersister } from "@/lib/queryClient";
import { getTokens, clearTokens } from "@/lib/secureStore";
import { initAnalytics, setUser } from "@/lib/analytics";
import { ENV } from "@/lib/env";
import { getMe } from "@/api/auth";
import { FONT_MAP } from "@/theme/typography";

SplashScreen.preventAutoHideAsync();

// Init analytics once at module load â€” safe before React tree mounts.
initAnalytics(ENV.SENTRY_DSN, ENV.POSTHOG_API_KEY, ENV.POSTHOG_HOST);

// Configure RevenueCat â€” only if a key is provided (won't fire in CI/dev without keys).
const rcKey = Platform.OS === "ios" ? ENV.REVENUECAT_PUBLIC_KEY : ENV.REVENUECAT_ANDROID_KEY;
if (rcKey && Purchases) {
  try {
    Purchases.configure({ apiKey: rcKey });
  } catch {
    // SDK unavailable in some environments (Expo Go web).
  }
}

function RootNavigation() {
  const { setSession, clearSession, setReady } = useSession();

  useEffect(() => {
    async function bootstrap() {
      try {
        await ExpoFont.loadAsync(FONT_MAP);
      } catch {
        // Non-fatal â€” system fonts will render.
      }

      try {
        const tokens = await getTokens();
        if (!tokens) {
          setReady();
          return;
        }

        const me = await getMe();

        // Sync RevenueCat user identity and determine effective tier.
        // RC is the source of truth for subscription status. If RC confirms no
        // active "premium" entitlement but the backend tier still says "premium",
        // treat the user as "registered" — the subscription likely expired and
        // the backend webhook hasn't fired yet.
        const purchases = Purchases;
        if (rcKey && purchases) {
          try {
            await purchases.logIn(me.userId);
            const ci = await purchases.getCustomerInfo();
            const hasPremium = !!ci.entitlements.active["premium"];
            const effectiveTier = hasPremium
              ? "premium"
              : me.tier === "premium"
              ? "registered" // expired subscription — RC overrides stale backend tier
              : me.tier;
            setSession(
              { userId: me.userId, email: me.email, displayName: me.displayName },
              effectiveTier
            );
            setUser(me.userId);
            return;
          } catch {
            // RevenueCat SDK unavailable (Expo Go, CI, no keys) — trust backend tier.
          }
        }

        setSession(
          { userId: me.userId, email: me.email, displayName: me.displayName },
          me.tier
        );
        setUser(me.userId);
      } catch (err: unknown) {
        const isUnauth =
          err instanceof Error && "status" in err && (err as { status: number }).status === 401;
        if (isUnauth) {
          await clearTokens();
        }
        clearSession();
      } finally {
        SplashScreen.hideAsync();
      }
    }

    bootstrap();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="jadhagam" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="daily-score" />
      <Stack.Screen name="chandrashtama" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="family-vault" />
      <Stack.Screen name="ask-vinaadi" />
      <Stack.Screen name="dasha" />
      <Stack.Screen name="transits" />
      <Stack.Screen name="varshaphala" />
      <Stack.Screen name="rectification" />
      <Stack.Screen name="wrapped" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <SessionProvider>
          <LanguageProvider>
            <ToastProvider>
              <ConfirmProvider>
                <RootNavigation />
              </ConfirmProvider>
            </ToastProvider>
          </LanguageProvider>
        </SessionProvider>
      </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
