import type { BirthProfileSnapshot, DailyGuidanceData } from "./types";

export type BirthTimeConfidenceLevel = "high" | "medium" | "low" | "unknown";

export type ScoreDriverKey = keyof DailyGuidanceData["scoreBreakdown"];

export type ScoreDriverReasonKey =
  | "moonTransit"
  | "dashaSupport"
  | "panchangam"
  | "gochar"
  | "personalCaution"
  | null;

export interface ScoreDriver {
  key: ScoreDriverKey;
  value: number;
  reasonKey: ScoreDriverReasonKey;
}

const DRIVER_REASON_MAP: Record<ScoreDriverKey, ScoreDriverReasonKey> = {
  moonTransit: "moonTransit",
  dashaSupport: "dashaSupport",
  panchangam: "panchangam",
  gocharSupport: "gochar",
  personalCautions: "personalCaution",
  remedialActionSupport: null,
};

export function getScoreDrivers(
  scoreBreakdown: DailyGuidanceData["scoreBreakdown"],
): { strongestSupport: ScoreDriver | null; strongestCaution: ScoreDriver | null } {
  const drivers: ScoreDriver[] = (Object.keys(scoreBreakdown) as ScoreDriverKey[]).map((key) => ({
    key,
    value: scoreBreakdown[key],
    reasonKey: DRIVER_REASON_MAP[key],
  }));

  const supportive = drivers
    .filter((driver) => driver.value >= 0)
    .sort((a, b) => b.value - a.value);
  const cautionary = drivers
    .filter((driver) => driver.value < 0)
    .sort((a, b) => a.value - b.value);

  return {
    strongestSupport: supportive[0] ?? null,
    strongestCaution: cautionary[0] ?? null,
  };
}

export function getBirthTimeConfidence(profile: BirthProfileSnapshot | null): {
  level: BirthTimeConfidenceLevel;
  minutes: number | null;
} {
  if (!profile?.birthTimeLocal) {
    return { level: "unknown", minutes: null };
  }

  const minutes = profile.birthTimeConfidenceMinutes ?? null;
  if (minutes === null) {
    return { level: "medium", minutes: null };
  }
  if (minutes <= 2) {
    return { level: "high", minutes };
  }
  if (minutes <= 10) {
    return { level: "medium", minutes };
  }
  return { level: "low", minutes };
}
