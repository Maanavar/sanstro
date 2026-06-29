import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerFcmToken } from "@vinaadi/shared/api/notifications";
import { useSession } from "@/state/sessionContext";

const KEY_PROMPTED = "@vinaadi/push_prompted";
const KEY_DISMISSED_UNTIL = "@vinaadi/push_dismissed_until";
const DISMISS_DAYS = 30;

export type PushOptInState = "unknown" | "should_show" | "hidden";

export function usePushNotificationOptIn(scoreLoaded: boolean) {
  const { tier } = useSession();
  const [state, setState] = useState<PushOptInState>("unknown");

  useEffect(() => {
    if (!scoreLoaded || tier === "guest") return;

    async function check() {
      const [prompted, dismissedUntil] = await Promise.all([
        AsyncStorage.getItem(KEY_PROMPTED),
        AsyncStorage.getItem(KEY_DISMISSED_UNTIL),
      ]);

      if (prompted) { setState("hidden"); return; }

      if (dismissedUntil) {
        const until = new Date(dismissedUntil);
        if (new Date() < until) { setState("hidden"); return; }
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") { setState("hidden"); return; }

      setState("should_show");
    }

    void check();
  }, [scoreLoaded, tier]);

  const dismiss = useCallback(async () => {
    setState("hidden");
    const until = new Date(Date.now() + DISMISS_DAYS * 86_400_000).toISOString();
    await AsyncStorage.setItem(KEY_DISMISSED_UNTIL, until);
  }, []);

  const requestAndRegister = useCallback(async (): Promise<boolean> => {
    setState("hidden");
    await AsyncStorage.setItem(KEY_PROMPTED, "1");

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return false;

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Vinaadi",
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      const tokenData = await Notifications.getDevicePushTokenAsync();
      await registerFcmToken(tokenData.data);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { state, dismiss, requestAndRegister };
}
