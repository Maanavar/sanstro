import { describe, expect, it } from "vitest";

import { getBirthTimeConfidence, getScoreDrivers } from "./uiux-enhancements";

describe("uiux enhancements helpers", () => {
  it("returns strongest support and caution from score breakdown", () => {
    const result = getScoreDrivers({
      moonTransit: 14,
      dashaSupport: 22,
      panchangam: -6,
      gocharSupport: 10,
      personalCautions: -18,
      remedialActionSupport: 4,
    });

    expect(result.strongestSupport).toEqual({
      key: "dashaSupport",
      value: 22,
      reasonKey: "dashaSupport",
    });
    expect(result.strongestCaution).toEqual({
      key: "personalCautions",
      value: -18,
      reasonKey: "personalCaution",
    });
  });

  it("marks missing birth time as unknown confidence", () => {
    const confidence = getBirthTimeConfidence({
      birthProfileId: "p1",
      displayName: "Test",
      birthDateLocal: "1990-01-01",
      birthTimeLocal: null,
      birthPlace: "Chennai",
      birthTimezone: "Asia/Kolkata",
      calculationStatus: "completed",
      warnings: [],
    });

    expect(confidence).toEqual({ level: "unknown", minutes: null });
  });

  it("maps confidence minutes into high/medium/low levels", () => {
    const baseProfile = {
      birthProfileId: "p1",
      displayName: "Test",
      birthDateLocal: "1990-01-01",
      birthTimeLocal: "10:30:00",
      birthPlace: "Chennai",
      birthTimezone: "Asia/Kolkata",
      calculationStatus: "completed" as const,
      warnings: [] as string[],
    };

    expect(getBirthTimeConfidence({ ...baseProfile, birthTimeConfidenceMinutes: 1 })).toEqual({ level: "high", minutes: 1 });
    expect(getBirthTimeConfidence({ ...baseProfile, birthTimeConfidenceMinutes: 7 })).toEqual({ level: "medium", minutes: 7 });
    expect(getBirthTimeConfidence({ ...baseProfile, birthTimeConfidenceMinutes: 45 })).toEqual({ level: "low", minutes: 45 });
    expect(getBirthTimeConfidence(baseProfile)).toEqual({ level: "medium", minutes: null });
  });
});
