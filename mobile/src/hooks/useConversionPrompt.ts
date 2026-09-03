import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "@/state/sessionContext";

const KEYS = {
  rasiPalanViews: "vinaadi_rasi_palan_views",
  streakDays:     "vinaadi_streak_days",
  lastStreakDate: "vinaadi_last_streak_date",
} as const;

export type ConversionTrigger =
  | "rasi_palan_streak"
  | "porutham_result_tap"
  | "jadhagam_gate"
  | "week_streak";

export function useConversionPrompt() {
  const { tier } = useSession();

  const recordRasiPalanView = useCallback(async (): Promise<ConversionTrigger | null> => {
    if (tier !== "guest") return null;
    const raw = await AsyncStorage.getItem(KEYS.rasiPalanViews);
    const count = raw ? Number(raw) + 1 : 1;
    await AsyncStorage.setItem(KEYS.rasiPalanViews, String(count));
    if (count >= 3) return "rasi_palan_streak";
    return null;
  }, [tier]);

  const recordTodayVisit = useCallback(async (): Promise<ConversionTrigger | null> => {
    if (tier !== "guest") return null;
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = await AsyncStorage.getItem(KEYS.lastStreakDate);
    const streak = await AsyncStorage.getItem(KEYS.streakDays);
    const streakCount = streak ? Number(streak) : 0;

    if (lastDate === today) return null;

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const newStreak = lastDate === yesterday ? streakCount + 1 : 1;
    await AsyncStorage.multiSet([
      [KEYS.lastStreakDate, today],
      [KEYS.streakDays, String(newStreak)],
    ]);
    if (newStreak >= 7) return "week_streak";
    return null;
  }, [tier]);

  return { recordRasiPalanView, recordTodayVisit };
}
