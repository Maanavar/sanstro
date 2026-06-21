import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as ExpoFont from "expo-font";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { SessionProvider, useSession } from "@/state/sessionContext";
import { LanguageProvider } from "@/state/languageContext";
import { queryClient, asyncStoragePersister } from "@/lib/queryClient";
import { getTokens, clearTokens } from "@/lib/secureStore";
import { initAnalytics } from "@/lib/analytics";
import { ENV } from "@/lib/env";
import { getMe } from "@/api/auth";
import { FONT_MAP } from "@/theme/typography";

SplashScreen.preventAutoHideAsync();

// Init once at module load — safe to call before the React tree mounts.
initAnalytics(ENV.SENTRY_DSN, ENV.POSTHOG_API_KEY, ENV.POSTHOG_HOST);

function RootNavigation() {
  const { setSession, clearSession, setReady } = useSession();

  useEffect(() => {
    async function bootstrap() {
      try {
        await ExpoFont.loadAsync(FONT_MAP);
      } catch {
        // Font load failures are non-fatal — system fonts will render
      }

      const tokens = await getTokens();
      if (!tokens) {
        setReady();
        return;
      }

      try {
        const me = await getMe();
        setSession(
          { userId: me.userId, email: me.email, displayName: me.displayName },
          me.tier
        );
      } catch (err: unknown) {
        // 401 from getMe triggers token rotation inside fetchWithAuth.
        // If we still end up here it means rotation also failed → guest.
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
      <Stack.Screen name="jadhagam/[id]" />
      <Stack.Screen name="jadhagam/upsell" />
      <Stack.Screen name="notifications/inbox" />
      <Stack.Screen name="notifications/settings" />
      <Stack.Screen name="daily-score" />
      <Stack.Screen name="chandrashtama" />
      <Stack.Screen name="premium" />
      <Stack.Screen name="family-vault" />
      <Stack.Screen name="ask-vinaadi" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <SessionProvider>
        <LanguageProvider>
          <RootNavigation />
        </LanguageProvider>
      </SessionProvider>
    </PersistQueryClientProvider>
  );
}
