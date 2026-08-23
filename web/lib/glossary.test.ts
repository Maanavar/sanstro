import { describe, expect, it } from "vitest";

import { GLOSSARY, type GlossaryKey } from "./glossary";

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
