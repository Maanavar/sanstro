/**
 * Ashtakavarga bindu lookup for the Guru/Sani peyarchi card.
 *
 * The chart payload gives Lagna as a display *name* but Ashtakavarga is keyed
 * by rasi number, so the lookup recovers the Lagna rasi from a natal planet's
 * (rasi, houseFromLagna) pair and walks forward to the transited rasi. Both
 * steps are modular arithmetic over a 1-based 12-cycle — the classic place for
 * a silent off-by-one, and a wrong bindu here is a wrong astrological claim
 * that nothing else in the stack would catch.
 *
 * Added with the Ashtakavarga surfacing from the 2026-07-18 astrologer review.
 */
import { describe, expect, it } from "vitest";
import { lagnaRasiNumber, ordinalSuffix, transitBindus } from "./dashboard-chart-explanation";
import type { ChartPlanet } from "@/lib/types";

function planet(rasi: number, houseFromLagna: number): ChartPlanet {
  return {
    graha: "SUN",
    rasiName: "",
    absoluteLongitude: 0,
    rasi,
    degreeInRasi: 0,
    nakshatra: 1,
    nakshatraName: "",
    pada: 1,
    houseFromLagna,
    speedDegPerDay: 0,
    isRetrograde: false,
    isCombust: false,
    d9Rasi: 1,
    isVargottama: false,
    showRetrogradeBadge: false,
  } as ChartPlanet;
}

describe("lagnaRasiNumber", () => {
  it("recovers the Lagna rasi for every (lagna, planet rasi) pair", () => {
    // Exhaustive rather than sampled: the wrap-around cases are the whole risk.
    for (let lagna = 1; lagna <= 12; lagna += 1) {
      for (let rasi = 1; rasi <= 12; rasi += 1) {
        const houseFromLagna = (((rasi - lagna) % 12) + 12) % 12 + 1;
        expect(lagnaRasiNumber([planet(rasi, houseFromLagna)])).toBe(lagna);
      }
    }
  });

  it("returns null when no planet carries usable placement data", () => {
    expect(lagnaRasiNumber([])).toBeNull();
  });
});

describe("transitBindus", () => {
  // Lagna = Kumbam (11). A planet in Mesha (1) is then in the 3rd from Lagna.
  const planets = [planet(1, 3)];

  it("reads the bindu of the rasi actually being transited", () => {
    // Saturn transiting the 4th from Lagna -> rasi 2 (Rishabam).
    const chart = {
      planets,
      ashtakavarga: { SATURN: { 2: 7, 4: 1 } as Record<number, number> },
    };
    expect(lagnaRasiNumber(planets)).toBe(11);
    expect(transitBindus(chart, "SATURN", 4)).toBe(7);
  });

  it("falls back to Saturn's table for the nodes, matching the server", () => {
    const chart = {
      planets,
      ashtakavarga: { SATURN: { 2: 5 } as Record<number, number> },
    };
    expect(transitBindus(chart, "RAHU", 4)).toBe(5);
    expect(transitBindus(chart, "KETU", 4)).toBe(5);
  });

  it("returns null rather than a fabricated bindu when data is missing", () => {
    expect(transitBindus({ planets }, "SATURN", 4)).toBeNull();
    expect(transitBindus({ planets, ashtakavarga: {} }, "SATURN", 4)).toBeNull();
    expect(
      transitBindus({ planets, ashtakavarga: { SATURN: {} } }, "SATURN", 4),
    ).toBeNull();
  });
});

describe("ordinalSuffix", () => {
  it("produces correct English ordinals for every house number", () => {
    // Saturn's 3rd aspect rendered as "special 3th aspect" until this was fixed
    // (the engine key ends in a literal "TH", so the ordinal is rebuilt in the
    // label and the suffix was hardcoded). Caught while assembling the Tamil/
    // English review sheet, 2026-07-18.
    const expected = [
      "1st", "2nd", "3rd", "4th", "5th", "6th",
      "7th", "8th", "9th", "10th", "11th", "12th",
    ];
    for (let n = 1; n <= 12; n += 1) {
      expect(ordinalSuffix(n)) .toBe(expected[n - 1]);
    }
  });

  it("handles the 11-13 teen exception", () => {
    expect(ordinalSuffix(11)).toBe("11th");
    expect(ordinalSuffix(12)).toBe("12th");
    expect(ordinalSuffix(13)).toBe("13th");
  });
});
