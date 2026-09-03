import { useState, useEffect, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";

// Returns true when the device appears to have no network connectivity.
// Uses Google's generate_204 endpoint (standard Android connectivity check)
// so it can distinguish "connected but no internet" from "no connection".
// Re-checks every time the app comes to the foreground.
export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  const check = useCallback(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch("https://clients3.google.com/generate_204", {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      setIsOffline(res.status !== 204);
    } catch {
      clearTimeout(timer);
      setIsOffline(true);
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  return isOffline;
}
