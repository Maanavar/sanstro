/**
 * §8.4 — nakshatra page names (owner ruling 2026-10-21, Option A).
 *
 * "Anusham Nakshathiram (Anuradha)" on English pages, "அனுஷம் நட்சத்திரம்
 * (அனுராதா)" on Tamil ones: Tamil name first, Sanskrit in brackets, each in
 * the page's own script, built from tNakshatra rather than typed.
 *
 * Evaluates every page's real generateMetadata on both language twins — the
 * Tamil twin is a separate branch of withTamilTwin — and checks the title's
 * script agrees with the page language.
 *
 * BLIND SPOT: the Tamil-script Sanskrit forms are transliterations; this checks
 * their script, not their spelling. They await the native Tamil review.
 */
import { readdirSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";
import { NAKSHATRA_NAMES, NAKSHATRA_SANSKRIT_NAMES } from "@vinaadi/shared";
import { NATCHATHIRAM_LIST } from "./natchathiram-data";
import { nakshatraDisplayName } from "./nakshatra-display-name";

const urlLang = vi.hoisted(() => ({ value: null as string | null }));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(urlLang.value ? { "x-lang": urlLang.value } : {}),
}));

const TAMIL = /[஀-௿]/;
const LATIN = /[A-Za-z]/;
const NUMBERS = Array.from({ length: 27 }, (_, i) => i + 1);

describe("nakshatraDisplayName", () => {
  it("reads as the ruling's example in both languages", () => {
    expect(nakshatraDisplayName(17, "en")).toBe("Anusham Nakshathiram (Anuradha)");
    expect(nakshatraDisplayName(17, "ta")).toBe("அனுஷம் நட்சத்திரம் (அனுராதா)");
  });

  it("has a Sanskrit entry, or a deliberate null, for every nakshatra key", () => {
    expect(Object.keys(NAKSHATRA_SANSKRIT_NAMES)).toEqual(Object.keys(NAKSHATRA_NAMES));
  });

  it("omits the bracket only where the Sanskrit name is the Tamil one", () => {
    const bare = Object.entries(NAKSHATRA_SANSKRIT_NAMES).filter(([, v]) => v === null).map(([k]) => k);
    expect(bare).toEqual(["ASWINI", "BHARANI", "ROHINI", "SWATHI", "REVATHI"]);
    expect(nakshatraDisplayName(4, "en")).toBe("Rohini Nakshathiram");
  });

  it.each(NUMBERS)("nakshatra %i: English carries no Tamil script, Tamil no Latin letters", (n) => {
    expect(nakshatraDisplayName(n, "en")).not.toMatch(TAMIL);
    expect(nakshatraDisplayName(n, "ta")).not.toMatch(LATIN);
  });

  it("refuses an out-of-range number", () => {
    expect(() => nakshatraDisplayName(0, "en")).toThrow(RangeError);
    expect(() => nakshatraDisplayName(28, "ta")).toThrow(RangeError);
  });
});

const PAGES = path.resolve(import.meta.dirname, "../app/(marketing)/natchathiram");
const SLUGS = readdirSync(PAGES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

function titleOf(meta: Metadata): string {
  const t = meta.title;
  return typeof t === "string" ? t : t && "absolute" in t ? t.absolute : String(t ?? "");
}

describe("page titles lead with the display name, in the page's script", () => {
  it("finds all 27 star pages", () => {
    expect(SLUGS.sort()).toEqual(NATCHATHIRAM_LIST.map((n) => n.slug).sort());
  });

  it.each(SLUGS)("%s: base and visual, both twins", async (slug) => {
    const n = NATCHATHIRAM_LIST.find((s) => s.slug === slug)!.number;
    type Page = { generateMetadata: () => Promise<Metadata> };
    // Vite resolves one variable segment per import, so the two shapes stay literal.
    const pages: [string, Page][] = [
      ["", (await import(`../app/(marketing)/natchathiram/${slug}/page.tsx`)) as Page],
      ["/visual", (await import(`../app/(marketing)/natchathiram/${slug}/visual/page.tsx`)) as Page],
    ];
    for (const [sub, page] of pages) {
      for (const lang of ["en", "ta"] as const) {
        urlLang.value = lang === "ta" ? "ta" : null;
        const title = titleOf(await page.generateMetadata());
        expect(title.startsWith(nakshatraDisplayName(n, lang)), `${slug}${sub} (${lang}): ${title}`).toBe(true);
        if (lang === "en") expect(title).not.toMatch(TAMIL);
      }
    }
    urlLang.value = null;
  });
});
