import { describe, expect, it } from "vitest";
import type { CrossChartObservation } from "@vinaadi/shared";
import { crossChartBadge, crossChartLine, crossChartRowVisible } from "./cross-chart-copy";
import { rasiDisplayName } from "./chart-utils";
import { tPlanetLord } from "./i18n";

const row = (o: Partial<CrossChartObservation>): CrossChartObservation => ({
  direction: "A_TO_B", key: "SEVENTH_LORD", graha: "VENUS", rasi: 3,
  houseFromLagna: 9, houseFromMoon: null, status: "SUPPORT", tier: "engine_inference", ...o,
});

const ROWS: CrossChartObservation[] = [
  row({}),
  row({ houseFromLagna: null, houseFromMoon: 6, status: "NOTE" }),
  row({ key: "LAGNA", graha: null, rasi: 1, houseFromLagna: 7 }),
  row({ key: "MOON", graha: "MOON", rasi: 5, houseFromLagna: 11, status: "NOTE" }),
  row({ key: "MOON", graha: "MOON", rasi: 5, houseFromLagna: null, houseFromMoon: 8, status: "NOTE" }),
  row({ key: "VENUS", graha: "VENUS", rasi: 1, houseFromLagna: 7 }),
];

describe("FAA-33 cross-chart copy", () => {
  it("renders the rasi and graha through the display boundary in both languages", () => {
    for (const lang of ["en", "ta"] as const) {
      const line = crossChartLine(ROWS[0], "Asha", "Bala", lang);
      expect(line).toContain(rasiDisplayName(3, lang));
      expect(line).toContain(tPlanetLord("VENUS", lang));
      expect(line).not.toContain("VENUS");
    }
  });

  it("names the Moon reference separately from the lagna reference", () => {
    expect(crossChartLine(ROWS[4], "Asha", "Bala", "en")).toContain("Bala's Moon sign");
    expect(crossChartLine(ROWS[3], "Asha", "Bala", "en")).toContain("Bala's lagna");
    expect(crossChartLine(ROWS[4], "Asha", "Bala", "ta")).toContain("ராசியிலிருந்து");
    expect(crossChartLine(ROWS[3], "Asha", "Bala", "ta")).toContain("லக்னத்திலிருந்து");
  });

  it("hides an overlay row off the partner's 7th and keeps it on the 7th", () => {
    expect(crossChartRowVisible(ROWS[5])).toBe(true);
    expect(crossChartRowVisible(row({ key: "JUPITER", graha: "JUPITER", houseFromLagna: 1, status: "NEUTRAL" }))).toBe(false);
  });

  it("says what the house means, and reads the 11th as favourable but 6/8/12 as ask-your-astrologer", () => {
    expect(crossChartBadge(ROWS[0], "en")).toBe("Fortune and shared values (favourable)");
    expect(crossChartBadge(ROWS[3], "en")).toBe("Gains and fulfilment (favourable)");
    expect(crossChartBadge(ROWS[4], "en")).toBe("Sudden changes (ask your astrologer about this)");
    expect(crossChartBadge(ROWS[2], "ta")).toBe("இல்லறத் துணை (சாதகம்)");
    expect(crossChartBadge(row({ key: "LAGNA", houseFromLagna: 10, status: "NEUTRAL" }), "en")).toBe("Work and standing (neutral)");
    // Every house 1-12 has a meaning in both languages.
    for (let h = 1; h <= 12; h++) {
      for (const lang of ["en", "ta"] as const) {
        expect(crossChartBadge(row({ houseFromLagna: h }), lang).startsWith("(")).toBe(false);
      }
    }
  });

  it("never uses verdict, lifespan or dosham words", () => {
    const all = ROWS.flatMap((o) => (["en", "ta"] as const).flatMap((l) => [crossChartLine(o, "Asha", "Bala", l), crossChartBadge(o, l)]))
      .join(" ").toLowerCase();
    for (const banned of ["destined", "guarantee", "meant for", "reject", "bad", "dosham", "தோஷம்", "widow", "death"]) {
      expect(all).not.toContain(banned);
    }
  });
});
