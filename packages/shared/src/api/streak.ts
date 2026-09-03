import { getApiClient } from "./client";

export interface StreakData {
  days: number;
  longestDays: number;
  lastActiveDate: string | null;
}

export const streakKeys = {
  current: () => ["streak"] as const,
};

export function getStreak(): Promise<{ success: boolean; data: StreakData }> {
  return getApiClient().get("/streak") as Promise<{ success: boolean; data: StreakData }>;
}

/**
 * Record today's activity and return the updated streak. Idempotent per day.
 * `localDays` is a one-time seed from a pre-existing local streak; the server
 * honours it only when the user has no server-side streak row yet.
 */
export function pingStreak(localDays?: number): Promise<{ success: boolean; data: StreakData }> {
  return getApiClient().post(
    "/streak/ping",
    localDays && localDays > 0 ? { localDays } : {},
  ) as Promise<{ success: boolean; data: StreakData }>;
}
