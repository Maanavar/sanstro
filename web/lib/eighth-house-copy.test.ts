import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { EighthHouseFactor, EighthHouseReading } from "@vinaadi/shared";
import {
  eighthHouseAlsoCounted,
  eighthHouseLine,
  eighthHouseNotApplied,
  eighthHouseTitle,
} from "./eighth-house-copy";
import { rasiDisplayName } from "./chart-utils";
import { tPlanetLord } from "./i18n";

const GOLDEN = path.resolve(__dirname, "../../tests/golden/eighth_house/eighth_house_copy.json");

const f = (o: Partial<EighthHouseFactor>): EighthHouseFactor => ({
  kind: "OCCUPANT", reference: "LAGNA", graha: "MARS", rasi: 11, house: 8, nature: "MALEFIC",
  condition: null, dignity: "NEUTRAL", combust: false, lordship: [], ownHouse: false, via: "IN",
  target: "HOUSE", placementId: "D1.MARS", alsoCountedIn: [], rule: "PHALADEEPIKA_11_1", tier: "classical_rule", ...o,
});
const reading = (role: EighthHouseReading["role"]): EighthHouseReading => ({
  role, mangalyaReference: role === "NOT_APPLIED" ? null : "BOTH", eighthFromLagna: 11, eighthFromMoon: 1,
  factors: [], d9Note: null, maleficInfluence: false, tier: "engine_inference",
});

describe("FAA-30 8th-house copy", () => {
  it("renders names through the display boundary in both languages", () => {
    for (const lang of ["en", "ta"] as const) {
      const line = eighthHouseLine(f({}), lang);
      expect(line).toContain(rasiDisplayName(11, lang));
      expect(line).toContain(tPlanetLord("MARS", lang));
      expect(line).not.toContain("MARS");
    }
  });

  it("says mangalya only for a stated bride", () => {
    expect(eighthHouseTitle(reading("BRIDE"), "en")).toMatch(/Mangalya/);
    expect(eighthHouseTitle(reading("BRIDE"), "ta")).toMatch(/மாங்கல்ய/);
    for (const lang of ["en", "ta"] as const) {
      const groom = eighthHouseTitle(reading("GROOM_8TH"), lang).toLowerCase();
      expect(groom).not.toMatch(/mangalya|மாங்கல்ய/);
    }
    expect(eighthHouseNotApplied("en")).toMatch(/stated gender/);
  });

  it("names the shared placement once, as one finding", () => {
    const line = eighthHouseAlsoCounted(f({ alsoCountedIn: ["SEVVAI_DOSHAM"] }), "en");
    expect(line).toBe("The same placement is counted in Sevvai dosham; it is one finding, not two.");
    expect(eighthHouseAlsoCounted(f({}), "en")).toBe("");
  });

  it("reproduces the golden file the PDF copy is checked against", () => {
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
    expect(golden.cases.length).toBeGreaterThan(100);
    for (const c of golden.cases) {
      expect(eighthHouseLine(c.factor, c.lang)).toBe(c.line);
      expect(eighthHouseAlsoCounted(c.factor, c.lang)).toBe(c.also);
    }
  });

  it("never uses lifespan, widowhood, verdict or grading words", () => {
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
    const all = golden.cases.map((c: { line: string; also: string }) => `${c.line} ${c.also}`).join(" ").toLowerCase()
      + eighthHouseNotApplied("en").toLowerCase() + eighthHouseNotApplied("ta");
    for (const banned of ["widow", "death", "lifespan", "longevity", "die", "weak mangalya", "maraka",
      "விதவை", "மரண", "ஆயுள்", "மாரக", "அமங்கல"]) {
      expect(all).not.toContain(banned);
    }
  });
});
