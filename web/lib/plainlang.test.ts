import { describe, expect, it } from "vitest";

import { plainLang, plainLangBiText, plainLangDashaLord } from "./plainlang";
import { tPlanetLord } from "./i18n";

/**
 * T12 follow-up (UX_BLINDSPOT_HANDOFF_2026-08-23.md): the full-name graha keys
 * — the only ones any live caller reaches — used to leave six of nine grahas
 * bare, so BEGINNER's inline gloss and BALANCED's tap-to-explain fired only
 * when Saturn, Rahu or Ketu happened to be the running lord.
 *
 * These pin the invariant that closed it, not the individual strings: every
 * graha, under BOTH key forms, resolves to a label that says something its own
 * canonical name does not. A row re-added bare, or one key form re-glossed
 * without the other, fails here rather than silently going quiet on screen.
 */

const GRAHAS: Array<[full: string, short: string]> = [
  ["SUN", "SU"],
  ["MOON", "MO"],
  ["MARS", "MA"],
  ["MERCURY", "ME"],
  ["JUPITER", "JU"],
  ["VENUS", "VE"],
  ["SATURN", "SA"],
  ["RAHU", "RA"],
  ["KETU", "KE"],
];

describe("PLAIN_LANG graha rows", () => {
  it.each(GRAHAS)("%s carries a role gloss in both languages", (full) => {
    const entry = plainLangBiText(full);
    expect(entry).not.toBeNull();

    // The failure mode this exists for: `graha()` with no gloss arg returns the
    // canonical name as its own "definition", which is truthy but says nothing.
    expect(entry!.en).not.toBe(tPlanetLord(full, "en"));
    expect(entry!.ta).not.toBe(tPlanetLord(full, "ta"));
  });

  it.each(GRAHAS)("%s and its two-letter code resolve to identical text", (full, short) => {
    // One literal per graha, expanded into both key forms — the drift that
    // produced two different Tamil readings of Saturn's role cannot recur.
    expect(plainLangBiText(short)).toEqual(plainLangBiText(full));
  });

  it.each(GRAHAS)("%s names the graha with tPlanetLord, never a re-typed spelling", (full) => {
    // Four panels once spelled Venus "சுக்ரன்" against the app's "சுக்கிரன்"
    // because the name was written out here as well as in i18n.
    expect(plainLangBiText(full)!.ta).toContain(tPlanetLord(full, "ta"));
    expect(plainLangBiText(full)!.en).toContain(tPlanetLord(full, "en"));
  });

  it("leads Guru with wisdom, not growth (owner ruling 2026-08-24)", () => {
    // Guru is the jñāna-kāraka. Expansion/prosperity are real significations
    // and stay on the detail surfaces ("Wisdom & growth", "wisdom, wealth,
    // children, teachers/guru"), but the one-line identity is wisdom — this
    // row was the only place in the app that led with growth.
    expect(plainLangBiText("JUPITER")!.en).toBe("Jupiter (wisdom planet)");
    expect(plainLangBiText("JUPITER")!.ta).toContain("ஞானகாரகன்");
    expect(plainLangBiText("JUPITER")!.en).not.toContain("growth");
    expect(plainLangBiText("JUPITER")!.ta).not.toContain("வளர்ச்சி");
  });

  it("never calls Rahu or Ketu a planet — they're chāyā grahas, shadow points with no body", () => {
    expect(plainLangBiText("RAHU")!.en).not.toContain("planet");
    expect(plainLangBiText("KETU")!.en).not.toContain("planet");
  });

  it("replaces Rahu's old 'change force' gloss (owner ruling 2026-08-24)", () => {
    // "Change" didn't identify Rahu specifically — nearly every graha can
    // produce change. "Amplifying shadow" carries both load-bearing
    // properties: shadow nature (no physical body) and that whatever Rahu
    // touches becomes intensified rather than just altered.
    expect(plainLangBiText("RAHU")!.en).toBe("Rahu (amplifying shadow)");
    expect(plainLangBiText("RAHU")!.ta).toContain("தீவிரப்படுத்தும் நிழல்");
    expect(plainLangBiText("RAHU")!.en).not.toContain("change force");
  });

  it("keeps Ketu's detachment-force gloss unchanged", () => {
    expect(plainLangBiText("KETU")!.en).toBe("Ketu (detachment force)");
  });
});

describe("plainLangDashaLord", () => {
  it("inlines the gloss in BEGINNER mode for every graha", () => {
    expect(plainLangDashaLord("MOON", "BEGINNER", "en")).toBe("Moon (mind planet)");
    expect(plainLangDashaLord("VENUS", "BEGINNER", "en")).toBe("Venus (love planet)");
    expect(plainLangDashaLord("SATURN", "BEGINNER", "en")).toBe("Saturn (discipline planet)");
  });

  it("leaves the lord untouched in BALANCED and TRADITIONAL", () => {
    // BALANCED surfaces the same dictionary as a tooltip instead (see
    // DashaLordLabel); it must not inline it here.
    expect(plainLangDashaLord("MOON", "BALANCED", "en")).toBe("MOON");
    expect(plainLangDashaLord("MOON", "TRADITIONAL", "en")).toBe("MOON");
  });

  it("returns an unrecognised lord unchanged rather than throwing", () => {
    expect(plainLangDashaLord("UNKNOWN_LORD", "BEGINNER", "en")).toBe("UNKNOWN_LORD");
    expect(plainLangBiText("UNKNOWN_LORD")).toBeNull();
  });
});

describe("plainLang", () => {
  // No caller in the tree today; kept because it is the sentence-level entry
  // point the full-name rows were once left bare for. If it comes back, this
  // pins that it still only speaks in BEGINNER mode.
  it("only substitutes in BEGINNER mode", () => {
    expect(plainLang("MESHA", "BEGINNER", "en")).toBe("Aries (Ram)");
    expect(plainLang("MESHA", "BALANCED", "en")).toBe("MESHA");
  });
});
