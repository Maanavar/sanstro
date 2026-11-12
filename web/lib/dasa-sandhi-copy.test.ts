/**
 * FAA-31 copy gate. Generates tests/golden/dasa_sandhi/dasa_sandhi_copy.json
 * (WRITE_GOLDEN=1), which app/services/dasa_sandhi_copy.py must reproduce.
 *
 * Pure string functions: it needs no DOM, but it declares no environment
 * either. The suite runs one environment for every file, and a per-file
 * override is the thing that caused 658 silent failures once already.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DasaSandhi, DasaSandhiPair } from "@vinaadi/shared";
import {
  DASA_SANDHI_INTRO,
  DASA_SANDHI_NOTE,
  dasaSandhiBandLine,
  dasaSandhiHorizon,
  dasaSandhiPairLine,
  dasaSandhiWindowLine,
  sandhiMonths,
} from "./dasa-sandhi-copy";

const GOLDEN = path.resolve(__dirname, "../../tests/golden/dasa_sandhi/dasa_sandhi_copy.json");
const LANGS = ["en", "ta"] as const;

/** A flagged pair. Defaults are the CLOSE case: changes 3.5 months apart, so
 *  the +/-6-month spans overlap by 12 - 3.5 = 8.5 months. */
const pair = (o: Partial<DasaSandhiPair> = {}): DasaSandhiPair => ({
  outgoingA: "MERCURY", incomingA: "KETU", changeA: "2028-08-10",
  outgoingB: "SATURN", incomingB: "MERCURY", changeB: "2028-04-24",
  windowAStart: "2028-02-10", windowAEnd: "2029-02-09",
  windowBStart: "2027-10-24", windowBEnd: "2028-10-24",
  changeGapDays: 108, windowGapDays: -257, windowsOverlap: true, band: "CLOSE",
  ...o,
});

const couple = (o: Partial<DasaSandhi> = {}): DasaSandhi => ({
  pairs: [], band: null, horizonYears: 10,
  horizonStart: "2026-11-12", horizonEnd: "2036-11-11",
  option: "A_FIXED", fixedMonths: 6, rule: "PROKERALA_PORUTHAM_P17", tier: "engine_inference",
  ...o,
});

const NEAR = pair({
  outgoingA: "MERCURY", incomingA: "KETU", changeA: "2031-03-09",
  outgoingB: "SUN", incomingB: "MOON", changeB: "2031-10-18",
  windowAStart: "2030-09-07", windowAEnd: "2031-09-07",
  windowBStart: "2031-04-18", windowBEnd: "2032-04-17",
  changeGapDays: 223, windowGapDays: -142, windowsOverlap: true, band: "NEAR",
});
/** Windows apart. Unreachable on the ruled configuration (a flagged pair's
 *  spans always overlap); kept so the other window options stay covered. */
const APART = pair({ changeGapDays: 548, windowGapDays: 183, windowsOverlap: false, band: "NEAR" });

const CASES: { name: string; d: DasaSandhi }[] = [
  { name: "none", d: couple() },
  { name: "close", d: couple({ band: "CLOSE", pairs: [pair()] }) },
  { name: "near", d: couple({ band: "NEAR", pairs: [NEAR] }) },
  { name: "two_pairs", d: couple({ band: "CLOSE", pairs: [pair(), NEAR] }) },
  { name: "apart", d: couple({ band: "NEAR", pairs: [APART] }) },
];

describe("FAA-31 dasa sandhi copy", () => {
  it("reproduces the golden file", () => {
    const golden = {
      intro: LANGS.map((lang) => ({ lang, text: DASA_SANDHI_INTRO[lang] })),
      note: LANGS.map((lang) => ({ lang, text: DASA_SANDHI_NOTE[lang] })),
      bands: CASES.flatMap(({ name, d }) =>
        LANGS.map((lang) => ({ name, lang, band: d.band, horizonYears: d.horizonYears, line: dasaSandhiBandLine(d, lang) })),
      ),
      horizons: LANGS.map((lang) => ({ lang, couple: couple(), line: dasaSandhiHorizon(couple(), lang) })),
      pairs: [pair(), NEAR, APART].flatMap((p) =>
        LANGS.map((lang) => ({
          lang, pair: p,
          line: dasaSandhiPairLine(p, "Person A", "Person B", lang),
          window: dasaSandhiWindowLine(p, lang),
        })),
      ),
      months: [0, 30.44, 108, 223, 365.25, 548].flatMap((days) =>
        LANGS.map((lang) => ({ days, lang, text: sandhiMonths(days, lang) })),
      ),
    };
    if (process.env.WRITE_GOLDEN === "1") {
      mkdirSync(path.dirname(GOLDEN), { recursive: true });
      writeFileSync(GOLDEN, `${JSON.stringify(golden, null, 2)}\n`, "utf-8");
    }
    expect(golden).toEqual(JSON.parse(readFileSync(GOLDEN, "utf-8")));
  });

  it("never grades, vetoes, or names a dosham or a remedy", () => {
    const every = CASES.flatMap(({ d }) =>
      LANGS.flatMap((lang) => [
        DASA_SANDHI_INTRO[lang], DASA_SANDHI_NOTE[lang],
        dasaSandhiBandLine(d, lang), dasaSandhiHorizon(d, lang),
        ...d.pairs.flatMap((p) => [dasaSandhiPairLine(p, "A", "B", lang), dasaSandhiWindowLine(p, lang)]),
      ]),
    );
    const text = every.join(" · ");
    // EC-RULING-06 and the advisory voice: no verdict, no mortality, no sale.
    // "score" is not banned as a word: the copy must be free to say it changes
    // none. What is banned is a line that actually grades or sells.
    for (const banned of [
      "widow", "death", "die", "lifespan", "avoid this marriage", "do not marry",
      "should not marry", "unsuitable", "rejected", "parihara",
      "danger", "warning", "risk of",
      "out of 10", "scored", "points for", "deduct", "buy the", "upgrade to",
    ]) {
      expect(text.toLowerCase()).not.toContain(banned);
    }
    // No grading adjective is applied to the couple.
    for (const graded of [/\b(good|bad|poor|strong|weak)\s+match\b/i, /\bnot\s+recommended\b/i]) {
      expect(text).not.toMatch(graded);
    }
    for (const banned of ["தோஷம் உள்ளது", "பரிகாரம் செய்", "திருமணம் வேண்டாம்", "மதிப்பெண் குறை", "ஆபத்து"]) {
      expect(text).not.toContain(banned);
    }
  });

  it("says the window measure restates the gap, so it is not read as a second finding", () => {
    const line = dasaSandhiWindowLine(pair(), "en");
    expect(line).toContain("restates the gap above rather than adding to it");
    // And it is visibly subordinate: it never carries the band words.
    expect(line).not.toContain("close together");
    expect(line).not.toContain("Read them alongside");
  });

  it("attributes the thresholds to a practice, not to doctrine", () => {
    expect(DASA_SANDHI_INTRO.en).toContain("not a rule from the classical texts");
    expect(DASA_SANDHI_INTRO.en).toContain("it is not a dosham");
    expect(DASA_SANDHI_INTRO.en).toContain("changes no score");
    expect(DASA_SANDHI_INTRO.ta).toContain("சாஸ்திர விதி அல்ல");
  });

  it("names both partners in a pair line, in the order given", () => {
    const line = dasaSandhiPairLine(pair(), "Priya", "Arun", "en");
    expect(line.indexOf("Priya")).toBeLessThan(line.indexOf("Arun"));
    expect(line).toContain("2028-08-10");
    expect(line).toContain("2028-04-24");
    expect(line).toContain("3.5 months apart");
  });

  it("the empty case says nothing was flagged and names the horizon", () => {
    expect(dasaSandhiBandLine(couple(), "en")).toContain("No two mahadasa changes");
    expect(dasaSandhiBandLine(couple(), "en")).toContain("10 years");
  });
});
