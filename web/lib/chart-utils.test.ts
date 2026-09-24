import { describe, expect, it } from "vitest";

import {
  buildD1CellDetail,
  buildD9CellDetail,
  computeD9LagnaRasi,
  houseFrom,
  rasiDisplayName,
} from "./chart-utils";
import type { ChartCalculateResponseData } from "./types";

function sampleChart(): ChartCalculateResponseData {
  return {
    chartId: "chart-1",
    birthProfile: {
      birthProfileId: "profile-1",
      displayName: "Test User",
      birthDateLocal: "1990-01-01",
      birthTimeLocal: "10:30:00",
      birthPlace: "Chennai",
      birthTimezone: "Asia/Kolkata",
      calculationStatus: "completed",
      warnings: [],
    },
    birthDateTimeUTC: "1990-01-01T05:00:00Z",
    julianDay: 2447892.5,
    ayanamsa: { type: "LAHIRI", valueDegrees: 23.5 },
    lagna: {
      rasi: 1,
      rasiName: "Mesham",
      absoluteLongitude: 10,
      degreeInRasi: 10,
      nakshatra: 1,
      nakshatraName: "Aswini",
      pada: 4,
      // Server-sent, and it must agree with `absoluteLongitude` above:
      // navamsa of 10° Mesham is Kadagam. `buildD9CellDetail` now reads this
      // field instead of re-deriving it, so an arbitrary value here would
      // silently move every D9 house in the fixture.
      d9Rasi: 4,
    },
    planets: [
      {
        graha: "SUN",
        rasiName: "Mesham",
        absoluteLongitude: 20,
        rasi: 1,
        degreeInRasi: 20,
        nakshatra: 2,
        nakshatraName: "Bharani",
        pada: 2,
        houseFromLagna: 1,
        speedDegPerDay: 1,
        isRetrograde: false,
        isCombust: false,
        d9Rasi: 2,
        isVargottama: false,
        showRetrogradeBadge: false,
        // Rishabam is Venus's sign and Venus is the Sun's natural enemy, so
        // this is what the server's `d9_dignity_label` returns for D9 = 2.
        // A fixture that pairs a sign with a dignity it cannot carry teaches
        // the next reader a rule that is not the engine's.
        d9Dignity: "ENEMY_SIGN",
      },
      {
        graha: "SATURN",
        rasiName: "Kanni",
        absoluteLongitude: 170,
        rasi: 6,
        degreeInRasi: 20,
        nakshatra: 14,
        nakshatraName: "Chitra",
        pada: 1,
        houseFromLagna: 6,
        speedDegPerDay: 0.1,
        isRetrograde: true,
        isCombust: false,
        d9Rasi: 6,
        isVargottama: true,
        showRetrogradeBadge: true,
        // Kanni is Mercury's sign and Mercury is Saturn's natural friend.
        // Saturn's own signs are Magaram and Kumbam, never Kanni.
        d9Dignity: "FRIEND_SIGN",
      },
    ],
    yogas: [],
    doshams: [],
    calculationVersion: "v1",
    calculationStatus: "completed",
    warnings: [],
    ephemerisBackend: "swisseph",
  };
}

describe("chart utils", () => {
  it("uses inclusive whole-sign house counting", () => {
    expect(houseFrom(9, 12)).toBe(4);
    expect(houseFrom(1, 1)).toBe(1);
    expect(houseFrom(12, 1)).toBe(2);
  });

  it("computes D9 lagna using 108-pada modality mapping", () => {
    expect(computeD9LagnaRasi(10)).toBe(4);
    expect(computeD9LagnaRasi(35)).toBe(11);
  });

  it("renders string-only rasi fields in the active language without uppercase leaks", () => {
    expect(rasiDisplayName("KANNI", "en")).toBe("Kanni");
    expect(rasiDisplayName("KANNI", "ta")).toBe("கன்னி");
    expect(rasiDisplayName("UNRECOGNISED_RASI", "en")).toBe("Unrecognised Rasi");
  });

  // The three shapes the backend actually sends for one sign: `rasi` (number),
  // `rasiName` ("Mithunam", from RASI_NAMES) and `rasiCode` ("MITHUNAM"). A
  // caller that picked the wrong one used to print English at a Tamil reader —
  // DXA-08's own fix left nine such sites standing because only the code shape
  // looks wrong on sight.
  it("resolves every shape the backend sends for the same sign", () => {
    for (const shape of [3, "MITHUNAM", "Mithunam", "மிதுனம்"] as const) {
      expect(rasiDisplayName(shape, "ta")).toBe("மிதுனம்");
      expect(rasiDisplayName(shape, "en")).toBe("Mithunam");
    }
  });

  it("returns empty for an absent rasi rather than a placeholder", () => {
    expect(rasiDisplayName(null, "ta")).toBe("");
    expect(rasiDisplayName(undefined, "en")).toBe("");
    expect(rasiDisplayName("  ", "en")).toBe("");
  });

  it("builds D1 and D9 cell detail payloads for explain overlay", () => {
    const chart = sampleChart();
    const d1 = buildD1CellDetail(chart, 1);
    expect(d1.houseFromRef).toBe(1);
    expect(d1.isLagna).toBe(true);
    expect(d1.occupants.map((o) => o.graha)).toEqual(["Lagna", "SUN"]);

    const d9 = buildD9CellDetail(chart, 4);
    expect(d9.isLagna).toBe(true);
    expect(d9.occupants[0].graha).toBe("Lagna");
  });
});
