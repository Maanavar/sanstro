import { describe, expect, it } from "vitest";

import { derivePlacementSignals, isKendraGroup } from "./dashboard-hybrid-parts";
import type { ChartExplanationPlanet } from "@/lib/types";

/**
 * Family & Charts printed three kendra counts, and they disagreed: the backend's
 * "N planets are in Kendra houses" line, the Planet-positions meta, and the
 * Strengths & watch-outs tile — which counted Kendra + Trikona under a label
 * readers took for the same thing ("4 in Kendra" beside "5 in Kendra / Trikona").
 *
 * Behind that sat a real miscount: the lagna arrives as `KENDRA_TRIKONA`, and
 * both web counters tested `=== "KENDRA"` (or `"KENDRA" || "TRIKONA"`), so a
 * planet in the 1st house was dropped from every count on the page.
 *
 * BLIND SPOT: this pins the web counters only. The backend summary counts off
 * `house_from_lagna` directly and is not exercised here.
 */
function planet(graha: string, houseGroup: string): ChartExplanationPlanet {
  return {
    graha,
    houseGroup,
    dignity: "NEUTRAL_SIGN",
    isVargottama: false,
    isCazimi: false,
    isCombust: false,
    isRetrograde: false,
    isPlanetaryWar: false,
  } as unknown as ChartExplanationPlanet;
}

describe("isKendraGroup", () => {
  it("counts the lagna, which is both a kendra and a trikona", () => {
    expect(isKendraGroup("KENDRA_TRIKONA")).toBe(true);
    expect(isKendraGroup("KENDRA")).toBe(true);
  });

  it("does not count a pure trikona or a dusthana", () => {
    expect(isKendraGroup("TRIKONA")).toBe(false);
    expect(isKendraGroup("DUSTHANA")).toBe(false);
    expect(isKendraGroup("OTHER")).toBe(false);
  });
});

describe("derivePlacementSignals — kendra tile", () => {
  it("counts a planet in the lagna as kendra", () => {
    const { kendra } = derivePlacementSignals([planet("SUN", "KENDRA_TRIKONA")], "en");
    expect(kendra).toBe(1);
  });

  it("counts kendra only, so it matches the Chart-strengths line beside it", () => {
    // Shaped like the chart that surfaced this: four in kendra, Ketu in the 5th,
    // three in dusthana. The tile used to print 5 here; the card printed 4.
    const planets = [
      planet("MOON", "KENDRA"),
      planet("MERCURY", "KENDRA"),
      planet("VENUS", "KENDRA"),
      planet("JUPITER", "KENDRA"),
      planet("KETU", "TRIKONA"),
      planet("SUN", "DUSTHANA"),
      planet("MARS", "DUSTHANA"),
      planet("SATURN", "DUSTHANA"),
    ];
    const { kendra, dusthana } = derivePlacementSignals(planets, "en");
    expect(kendra).toBe(4);
    expect(dusthana).toBe(3);
  });
});
