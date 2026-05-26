import { describe, expect, it } from "vitest";

import {
  buildD1CellDetail,
  buildD9CellDetail,
  computeD9LagnaRasi,
  houseFrom,
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
