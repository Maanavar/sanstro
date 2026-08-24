import { describe, expect, it } from "vitest";

import { GLOSSARY, GLOSSARY_LABELS, glossaryLabel, type GlossaryKey } from "./glossary";

/**
 * The glossary is the app's only mechanism for explaining a tradition-specific
 * term at the point a reader meets it — there is no glossary page, no help
 * screen and no FAQ. It sat at 20 entries covering the opt-in Deep Dive surface
 * while the two screens everybody lands on (Today, Calendar) rendered ~28 terms
 * with no definition anywhere in the product.
 *
 * These are cheap structural guards, not copy review. What they can catch is
 * the failure mode that actually happened: entries drifting out of parity with
 * the terms on screen, and entries that name a term without defining it.
 */
const keys = Object.keys(GLOSSARY) as GlossaryKey[];

describe("glossary integrity", () => {
  it("defines every term in both languages", () => {
    for (const key of keys) {
      expect(GLOSSARY[key].en.trim(), `${key}.en`).not.toBe("");
      expect(GLOSSARY[key].ta.trim(), `${key}.ta`).not.toBe("");
    }
  });

  it("writes definitions, not restatements", () => {
    // A definition has to say something. The house rule this encodes is that
    // "Rajju — the Rajju porutham" is not an entry; the shortest real entry in
    // the file runs well past this floor.
    for (const key of keys) {
      expect(GLOSSARY[key].en.length, `${key}.en is too short to be a definition`).toBeGreaterThan(40);
      expect(GLOSSARY[key].ta.length, `${key}.ta is too short to be a definition`).toBeGreaterThan(20);
    }
  });

  it("ends every definition as a sentence", () => {
    for (const key of keys) {
      expect(GLOSSARY[key].en.trim(), `${key}.en`).toMatch(/[.!?]$/);
      expect(GLOSSARY[key].ta.trim(), `${key}.ta`).toMatch(/[.!?]$/);
    }
  });

  it("covers the daily vocabulary the Today and Calendar surfaces render", () => {
    // These are the terms those two screens put in front of every reader,
    // unasked. Removing an entry here means a term went back to being
    // undefined — which is the state this expansion existed to end.
    const daily: GlossaryKey[] = [
      "panchangam", "tithi", "karana", "vara", "yogam", "paksham",
      "rahuKalam", "yamagandam", "kuligai", "nallaNeram", "abhijit", "hora",
      "chandrashtama", "karinaal", "soolam", "parigaram", "amirdhadhi",
      "muhurtham", "lagnam", "pada", "peyarchi", "sadeSati",
    ];
    for (const key of daily) {
      expect(GLOSSARY[key], `missing daily-vocabulary entry: ${key}`).toBeDefined();
    }
  });

  it("keeps the anxiety-bearing entries calibrated, not bare", () => {
    // Sade Sati and Chandrashtama are the two terms most likely to frighten a
    // reader who meets them cold on a red card. Their entries carry prevalence
    // or duration on purpose — a definition that only says "Saturn's difficult
    // period" makes the panic worse.
    expect(GLOSSARY.sadeSati.en).toMatch(/three times|7½|ends/i);
    expect(GLOSSARY.chandrashtama.en).toMatch(/each month|2¼/i);
  });
});

/**
 * A-027 — the display NAME of each term.
 *
 * Every call site until the Understand tab's search passed its own display text
 * as children, so the glossary never needed names. Listing the vocabulary with
 * no surrounding sentence exposed that: the first pass rendered the object key,
 * putting `rahuKalam`, `sthanaBala` and `naisargikaBala` on screen for English
 * readers, while Tamil got the first sentence of the definition standing in for
 * a name. These guard the shape that failure took.
 */
describe("glossary labels", () => {
  it("names every term in both languages", () => {
    for (const key of keys) {
      expect(GLOSSARY_LABELS[key]?.en.trim(), `${key}.en`).toBeTruthy();
      expect(GLOSSARY_LABELS[key]?.ta.trim(), `${key}.ta`).toBeTruthy();
    }
  });

  it("never leaks the identifier as the label", () => {
    // The exact defect: `charaDasha` shown to a reader instead of "Chara Dasha".
    for (const key of keys) {
      expect(GLOSSARY_LABELS[key].en, `${key}.en is the raw key`).not.toBe(key);
      expect(GLOSSARY_LABELS[key].en, `${key}.en is camelCase`).not.toMatch(/^[a-z]+[A-Z]/);
    }
  });

  it("keeps labels short enough to be a name, not a definition", () => {
    // The Tamil half of the first pass was `definition.split(".")[0]` — a whole
    // clause. A name fits on a chip.
    for (const key of keys) {
      expect(GLOSSARY_LABELS[key].en.length, `${key}.en too long for a label`).toBeLessThan(30);
      expect(GLOSSARY_LABELS[key].ta.length, `${key}.ta too long for a label`).toBeLessThan(40);
      expect(GLOSSARY_LABELS[key].ta, `${key}.ta ends like a sentence`).not.toMatch(/[.!?]$/);
    }
  });

  it("distinguishes the two things called Yogam", () => {
    // `yoga` is a chart combination; `yogam` is one of the almanac's five daily
    // limbs. They share a name in English AND Tamil, so a bare "Yogam" twice in
    // one result list would be a worse answer than none.
    expect(GLOSSARY_LABELS.yoga.en).not.toBe(GLOSSARY_LABELS.yogam.en);
    expect(GLOSSARY_LABELS.yoga.ta).not.toBe(GLOSSARY_LABELS.yogam.ta);
  });

  it("uses almanac Tamil, not Sanskrit transliteration", () => {
    expect(GLOSSARY_LABELS.sadeSati.ta).toBe("ஏழரைச் சனி");
    expect(GLOSSARY_LABELS.yamagandam.ta).toBe("எமகண்டம்");
  });

  it("resolves a label through the accessor in both languages", () => {
    expect(glossaryLabel("rahuKalam", "en")).toBe("Rahu Kalam");
    expect(glossaryLabel("rahuKalam", "ta")).toBe("ராகு காலம்");
  });
});
