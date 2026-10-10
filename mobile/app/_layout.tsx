import React, { useEffect } from "react";
import { Platform, View, Text } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as ExpoFont from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "@/state/sessionContext";
import { LanguageProvider } from "@/state/languageContext";
import { useI18n } from "@/hooks/useI18n";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { ToastProvider } from "@/context/ToastContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { queryClient, sessionPersister, PERSIST_BUSTER } from "@/lib/queryClient";
import { getTokens } from "@/lib/secureStore";
import { beginAuthenticatedSession, endSession } from "@/state/sessionTransition";
import { syncPurchaseIdentity } from "@/lib/purchaseIdentity";
import { currentGeneration } from "@/lib/sessionIdentity";
import { initAnalytics, setAnalyticsConsent, setUser } from "@/lib/analytics";
import { loadGuestPrefs } from "@/features/guest/guestStore";
import { ENV } from "@/lib/env";
import { getMe } from "@/api/auth";
import { FONT_MAP } from "@/theme/typography";
// Lazy-loaded to avoid crashing in Expo Go — JSI modules fail at import time when native bridge is absent.
let Purchases: typeof import("react-native-purchases").default | null = null;
// A static import would run at module load and crash Expo Go, where the
// native bridge these JSI modules need does not exist. The require has to
// stay a require: that is the point, not an oversight.
// eslint-disable-next-line @typescript-eslint/no-require-imports
try { Purchases = require("react-native-purchases").default; } catch { /* Expo Go */ }

SplashScreen.preventAutoHideAsync();

// Init analytics once at module load — safe before React tree mounts.
initAnalytics(ENV.SENTRY_DSN, ENV.POSTHOG_API_KEY, ENV.POSTHOG_HOST);

// Configure RevenueCat — only if a key is provided (won't fire in CI/dev without keys).
const rcKey = Platform.OS === "ios" ? ENV.REVENUECAT_PUBLIC_KEY : ENV.REVENUECAT_ANDROID_KEY;
if (rcKey && Purchases) {
  try {
    Purchases.configure({ apiKey: rcKey });
  } catch {
    // SDK unavailable in some environments (Expo Go web).
  }
}

function OfflineBanner() {
  const isOffline = useOfflineStatus();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  if (!isOffline) return null;
  return (
    <View style={{
      position: "absolute", top: insets.top, left: 0, right: 0,
      backgroundColor: "#7C3AED", paddingVertical: 5,
      alignItems: "center", zIndex: 9999,
    }}>
      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
        {t({ ta: "இணைப்பு இல்லை", en: "No internet" })}
      </Text>
    </View>
  );
}

function RootNavigation() {
  const { setSession, clearSession, setReady } = useSession();

  useEffect(() => {
    async function bootstrap() {
      // Restore the stored analytics choice before anything can call setUser or
      // trackEvent. The module-level default is `false`, so a failed read leaves
      // analytics off rather than on.
      try {
        const prefs = await loadGuestPrefs();
        setAnalyticsConsent(prefs.analyticsOptedIn === true);
      } catch {
        // Storage unavailable — stay opted out.
      }

      try {
        await ExpoFont.loadAsync(FONT_MAP);
      } catch {
        // Non-fatal — system fonts will render.
      }

      try {
        const tokens = await getTokens();
        if (!tokens) {
          setReady();
          return;
        }

        const me = await getMe();

        // Establish the session identity BEFORE anything reads or writes this
        // account's private cache (A02 step 7). Until this call the process has
        // no user, so the persister has no namespace and queries cannot
        // restore — which is the point: on a warm start with another account's
        // bytes still on the device, nothing of theirs can be hydrated.
        await beginAuthenticatedSession(me.userId);

        // Determine the effective tier. RC is the source of truth for
        // subscription status: if RC confirms no active "premium" entitlement
        // but the backend tier still says "premium", treat the user as
        // "registered" — the subscription likely expired and the backend
        // webhook hasn't fired yet.
        //
        // The bind itself is NOT done here any more. It used to be
        // `purchases.logIn(me.userId)` on this line, inside a mount-only
        // effect, which is the whole of A04: interactive login never bound the
        // SDK and sign-out never unbound it. `beginAuthenticatedSession` above
        // owns it now, via src/lib/purchaseIdentity.ts.
        //
        // Awaited rather than assumed: the coordinator fires the bind without
        // waiting, and `getCustomerInfo()` below is only meaningful once it has
        // landed. The call is coalesced, so this joins the coordinator's bind
        // instead of starting a second one.
        const purchases = Purchases;
        if (rcKey && purchases) {
          try {
            await syncPurchaseIdentity(me.userId, currentGeneration());
            const ci = await purchases.getCustomerInfo();
            const hasPremium = !!ci.entitlements.active["premium"];
            const effectiveTier = hasPremium
              ? "premium"
              : me.tier === "premium"
              ? "registered" // expired subscription — RC overrides stale backend tier
              : me.tier;
            setSession(
              // /auth/me sends no display name — there is no such field anywhere in
          // the backend. `?? null` makes that explicit instead of storing
          // `undefined` in a slot typed `string | null`.
          { userId: me.userId, email: me.email, displayName: me.displayName ?? null },
              effectiveTier,
              me.openBeta
            );
            setUser(me.userId);
            return;
          } catch {
            // RevenueCat SDK unavailable (Expo Go, CI, no keys) — trust backend tier.
          }
        }

        setSession(
          // /auth/me sends no display name — there is no such field anywhere in
          // the backend. `?? null` makes that explicit instead of storing
          // `undefined` in a slot typed `string | null`.
          { userId: me.userId, email: me.email, displayName: me.displayName ?? null },
          me.tier,
          me.openBeta
        );
        setUser(me.userId);
      } catch (err: unknown) {
        const isUnauth =
          err instanceof Error && "status" in err && (err as { status: number }).status === 401;
        if (isUnauth) {
          // Stored credentials resolved to nothing. This used to clear only the
          // tokens, which left any persisted cache on the device and the
          // in-memory cache intact for the next account to read (A02).
          // revokeRemote: false — the server has already rejected them.
          await endSession({ revokeRemote: false });
        }
        clearSession();
      } finally {
        SplashScreen.hideAsync();
      }
    }

    bootstrap();
  }, []);

  return (
    <View style={{ flex: 1 }}>
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
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="learn" />
        <Stack.Screen name="vargas" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="profile-manager" />
      </Stack>
      <OfflineBanner />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      {/*
        Still mounted above SessionProvider, which is why the cache outlives
        every session and why A02 needed a coordinator rather than a tidier
        tree: the provider must not remount on a sign-in, or every account
        switch would throw away a warm cache and refetch everything. The
        persister resolves the account per call instead (see queryClient.ts),
        and `buster` makes the library discard a cache written under an older
        retention policy before it hydrates it.
      */}
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: sessionPersister, buster: PERSIST_BUSTER }}
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
