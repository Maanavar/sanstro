import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { EighthHouseCouple, EighthHouseFactor, EighthHouseJointLine, EighthHouseReading } from "@vinaadi/shared";
import {
  EIGHTH_HOUSE_JOINT_NOTE,
  eighthHouseAlsoCounted,
  eighthHouseJointLine,
  eighthHouseJointLines,
  eighthHouseLine,
  eighthHouseNotApplied,
  eighthHouseTitle,
} from "./eighth-house-copy";
import { rasiDisplayName } from "./chart-utils";
import { tPlanetLord } from "./i18n";

const GOLDEN = path.resolve(__dirname, "../../tests/golden/eighth_house/eighth_house_copy.json");
const LANGS = ["en", "ta"] as const;
const KEYS: EighthHouseJointLine["key"][] = ["MALEFIC_IN_EIGHTH", "EIGHTH_LORD_DEBILITATED_OR_COMBUST"];
const PATTERNS: EighthHouseJointLine["pattern"][] = ["BOTH", "ONE", "NEITHER"];

const f = (o: Partial<EighthHouseFactor>): EighthHouseFactor => ({
  kind: "OCCUPANT", reference: "LAGNA", graha: "MARS", rasi: 11, house: 8, nature: "MALEFIC",
  condition: null, dignity: "NEUTRAL", combust: false, lordship: [], ownHouse: false, via: "IN",
  target: "HOUSE", placementId: "D1.MARS", alsoCountedIn: [], rule: "PHALADEEPIKA_11_1", tier: "classical_rule", ...o,
});
const reading = (role: EighthHouseReading["role"]): EighthHouseReading => ({
  role, mangalyaReference: role === "NOT_APPLIED" ? null : "BOTH", eighthFromLagna: 11, eighthFromMoon: 1,
  factors: [], d9Note: null, maleficInLagnaEighth: false, lagnaEighthLordDebilitatedOrCombust: false,
  tier: "engine_inference",
});

/**
 * The factor `cases` were generated once from this file's functions and are
 * kept; `joint` and `jointNote` are rebuilt here. WRITE_GOLDEN=1 pnpm vitest
 * run lib/eighth-house-copy.test.ts rewrites the file.
 */
function buildGolden() {
  const current = JSON.parse(readFileSync(GOLDEN, "utf8"));
  const joint = LANGS.flatMap((lang) =>
    KEYS.flatMap((key) => PATTERNS.map((pattern) => ({ key, pattern, lang, line: eighthHouseJointLine(key, pattern, lang) }))));
  const jointNote = LANGS.map((lang) => ({ lang, text: EIGHTH_HOUSE_JOINT_NOTE[lang] }));
  return {
    _note: "Generated from web/lib/eighth-house-copy.ts (joint lines: WRITE_GOLDEN=1 pnpm vitest run lib/eighth-house-copy.test.ts). web/lib/eighth-house-copy.test.ts and tests/test_faa30_mangalya_sthana.py (the PDF copy) must both reproduce every line. Regenerate only when the web copy changes on purpose.",
    cases: current.cases,
    joint,
    jointNote,
  };
}

describe("FAA-30 8th-house copy", () => {
  it("renders names through the display boundary in both languages", () => {
    for (const lang of LANGS) {
      const line = eighthHouseLine(f({}), lang);
      expect(line).toContain(rasiDisplayName(11, lang));
      expect(line).toContain(tPlanetLord("MARS", lang));
      expect(line).not.toContain("MARS");
    }
  });

  it("says mangalya only for a stated bride", () => {
    expect(eighthHouseTitle(reading("BRIDE"), "en")).toMatch(/Mangalya/);
    expect(eighthHouseTitle(reading("BRIDE"), "ta")).toMatch(/மாங்கல்ய/);
    for (const lang of LANGS) {
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

  it("words each joint line by its own cause, lagna side only (OWNER-Q-D4)", () => {
    const couple = (joint: EighthHouseJointLine[]): EighthHouseCouple => ({ personA: reading("BRIDE"), personB: reading("GROOM_8TH"), joint });
    expect(eighthHouseJointLines(couple([]), "en")).toEqual([]);
    const lines = eighthHouseJointLines(couple([
      { key: "MALEFIC_IN_EIGHTH", pattern: "BOTH" },
      { key: "EIGHTH_LORD_DEBILITATED_OR_COMBUST", pattern: "NEITHER" },
    ]), "en");
    expect(lines).toEqual([
      "In both charts a malefic sits in the 8th from the lagna, outside its own sign.",
      "In neither chart is the lord of the 8th from the lagna debilitated or combust.",
    ]);
    for (const lang of LANGS) {
      const all = KEYS.flatMap((k) => PATTERNS.map((p) => eighthHouseJointLine(k, p, lang)));
      expect(new Set(all).size).toBe(6);
      for (const line of all) expect(line).toMatch(lang === "en" ? /from the lagna/ : /லக்னத்திலிருந்து/);
      // The merged pre-D4 wording never comes back.
      expect(all.join(" ")).not.toMatch(/malefic influence|பாவக் கிரகத் தாக்கம்/i);
    }
  });

  it("reproduces the golden file the PDF copy is checked against", () => {
    const built = buildGolden();
    if (process.env.WRITE_GOLDEN === "1") writeFileSync(GOLDEN, `${JSON.stringify(built, null, 1)}\n`, "utf8");
    const golden = JSON.parse(readFileSync(GOLDEN, "utf8"));
    expect(golden.cases.length).toBeGreaterThan(100);
    for (const c of golden.cases) {
      expect(eighthHouseLine(c.factor, c.lang)).toBe(c.line);
      expect(eighthHouseAlsoCounted(c.factor, c.lang)).toBe(c.also);
    }
    expect(golden.joint).toEqual(built.joint);
    expect(golden.jointNote).toEqual(built.jointNote);
  });

  it("never uses lifespan, widowhood, verdict or grading words", () => {
    const golden = buildGolden();
    const all = [
      ...golden.cases.map((c: { line: string; also: string }) => `${c.line} ${c.also}`),
      ...golden.joint.map((c) => c.line), ...golden.jointNote.map((n) => n.text),
      eighthHouseNotApplied("en"), eighthHouseNotApplied("ta"),
    ].join(" ").toLowerCase();
    for (const banned of ["widow", "death", "lifespan", "longevity", "die", "weak mangalya", "maraka",
      "endanger", "danger", "reject", "incompatible", "not suitable", "unsuitable", "bad match", "afflicted mangalya",
      "supported", "mixed", "needs attention",
      "விதவை", "மரண", "ஆயுள்", "மாரக", "அமங்கல", "பொருந்தாது", "நிராகரி"]) {
      expect(all).not.toContain(banned);
    }
  });
});
