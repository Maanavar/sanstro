/**
 * Data-integrity check for the number -> slug -> rich-content wiring that
 * dashboard-explore-nakshatram-nova.tsx's "Full nakshatra guide" card relies
 * on: NATCHATHIRAM_LIST maps every nakshatra number to a slug, and that slug
 * must resolve in both NATCHATHIRAM_MAP (Tamil, all 7 sections) and
 * NATCHATHIRAM_EN (English, same 7 sections) for all 27 stars — a mismatch
 * here would silently render an empty "Full guide" card for that star.
 */
import { describe, expect, it } from "vitest";
import { NATCHATHIRAM_LIST, NATCHATHIRAM_MAP } from "./natchathiram-data";
import { NATCHATHIRAM_EN } from "./natchathiram-data-en";

const SECTION_KEYS = ["personality", "career", "modern", "family", "dasha", "spiritual", "summary"] as const;

describe("natchathiram data wiring", () => {
  it("has exactly 27 nakshatras, numbered 1-27 with no gaps", () => {
    expect(NATCHATHIRAM_LIST).toHaveLength(27);
    const numbers = NATCHATHIRAM_LIST.map((n) => n.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 27 }, (_, i) => i + 1));
  });

  it("every listed slug resolves in NATCHATHIRAM_MAP with all 7 non-empty Tamil sections", () => {
    for (const entry of NATCHATHIRAM_LIST) {
      const rich = NATCHATHIRAM_MAP[entry.slug];
      expect(rich, `NATCHATHIRAM_MAP missing slug "${entry.slug}" (#${entry.number})`).toBeDefined();
      for (const key of SECTION_KEYS) {
        const paras = rich.sections[key].paras;
        expect(paras.length, `${entry.slug}.sections.${key} is empty`).toBeGreaterThan(0);
        expect(paras[0].length, `${entry.slug}.sections.${key}[0] is empty string`).toBeGreaterThan(0);
      }
    }
  });

  // NATCHATHIRAM_EN previously did not cover all 27 stars — ashlesha, magha
  // and purva-phalguni had no English translation, so both the marketing
  // page (natchathiram-page.tsx) and the dashboard's Nakshatram detail
  // screen silently fell back to Tamil paragraphs (via
  // normalizeTamilAstroText) under the English UI for these. Closed 2026-07
  // with DRAFT translations (see the doc comment on NATCHATHIRAM_EN's
  // ashlesha entry) pending astrologer/content-author sign-off — asserted
  // here as full coverage so a regression (a slug silently dropping back
  // out of English coverage) fails loudly.
  it("has English content for every one of the 27 stars", () => {
    for (const entry of NATCHATHIRAM_LIST) {
      const en = NATCHATHIRAM_EN[entry.slug];
      expect(en, `NATCHATHIRAM_EN missing slug "${entry.slug}" (#${entry.number})`).toBeDefined();
      for (const key of SECTION_KEYS) {
        const paras = en[key];
        expect(paras.length, `${entry.slug}.en.${key} is empty`).toBeGreaterThan(0);
        expect(paras[0].length, `${entry.slug}.en.${key}[0] is empty string`).toBeGreaterThan(0);
      }
    }
  });

  it("number 1 resolves to Ashwini in both Tamil and English content", () => {
    const slug = NATCHATHIRAM_LIST.find((n) => n.number === 1)?.slug;
    expect(slug).toBe("ashwini");
    expect(NATCHATHIRAM_MAP[slug!].name_en).toBe("Aswini");
    expect(NATCHATHIRAM_EN[slug!].personality[0]).toMatch(/Ashwini/i);
  });
});
