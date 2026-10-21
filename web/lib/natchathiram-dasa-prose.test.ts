import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dasaProseTimingClaims } from "./dasa-prose-timing";
import { DASA_TIMING_HOLD } from "./natchathiram-dasa-hold";
import { NATCHATHIRAM_DASA_TIMINGS } from "./generated/natchathiram-dasa-timings";
import * as base from "./natchathiram-data";
import type { NatchathiramEntry } from "./natchathiram-data";
import { NATCHATHIRAM_EN } from "./natchathiram-data-en";

/**
 * FSA-03 — no hand-typed dasa timing reaches a reader.
 *
 * The engine-rendered timeline carries every length, age and bhukti time
 * (`tests/test_natchathiram_dasa_timings.py` proves those numbers). This file
 * proves the prose beside it adds none of its own:
 *
 * - the live base pages (`/natchathiram/<slug>`) carry none, in either language;
 * - a visual page may leave `DASA_TIMING_HOLD` only once its dasa prose carries
 *   none — so lifting the hold early fails here, not in a reader's hands;
 * - no visual page declares a timing field, and each lists its dasas in the
 *   engine's order, so prose cannot drift onto the wrong dasa's row.
 *
 * Blind spot: `dasaProseTimingClaims` cannot see a life stage standing in for
 * an age ("lands in adolescence"). Those are reviewed by hand.
 */

const PAGES_DIR = path.resolve(__dirname, "../app/(marketing)/natchathiram");
const visualSlugs = readdirSync(PAGES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((slug) => {
    try {
      readFileSync(path.join(PAGES_DIR, slug, "visual", "page.tsx"));
      return true;
    } catch {
      return false;
    }
  });

function visualSource(slug: string): string {
  return readFileSync(path.join(PAGES_DIR, slug, "visual", "page.tsx"), "utf8");
}

/** The English dasa entries and the Tamil themes/details, as source text. */
function visualDasaProse(source: string): string {
  const region = (startKey: string) => {
    const start = source.indexOf(startKey);
    if (start < 0) return "";
    const end = source.indexOf("spirituality:", start);
    return source.slice(start, end < 0 ? undefined : end);
  };
  return region("dashaTimeline:") + region("dashaThemes:");
}

const entries = Object.values(base).filter(
  (v): v is NatchathiramEntry => typeof v === "object" && v !== null && "sections" in v && "slug" in v,
);

describe("dasa prose timing detector", () => {
  it.each([
    "Moon–Rahu antardasa (approximately ages 8–9) is the most turbulent sub-period",
    "Mars dasa from 10 to 17 lands Rohini in adolescence",
    "lasting 20 months, beginning approximately in the 5th year of Mars dasa",
    "lasting twenty months",
    "the seventh sub-period of Mars dasa",
    "property in the early forties",
    "சந்திர–ராகு அந்தர்தசை (சுமார் 8–9 வயது)",
    "நாற்பதுகளின் நடுவில் கவனிக்க வேண்டும்",
    "இருபது மாதங்கள்",
  ])("flags %s", (text) => {
    expect(dasaProseTimingClaims(text)).not.toEqual([]);
  });

  it.each([
    "Moon–Rahu bhukti is the most turbulent sub-period of this dasha.",
    "Venus as rasi lord makes this window carry unusual warmth.",
    "சந்திர–ராகு புக்தி இந்த தசையின் கலக்கமான துணைக் காலம்.",
  ])("passes %s", (text) => {
    expect(dasaProseTimingClaims(text)).toEqual([]);
  });
});

describe("live base pages", () => {
  it("covers all 27 stars", () => {
    expect(entries.map((e) => e.number).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 27 }, (_, i) => i + 1),
    );
  });

  // Every paragraph that mentions a dasa, in any section: three of the claims
  // fixed on 2026-10-21 sat in the family and career sections, not the dasa one.
  const MENTIONS_DASA = /தசை|திசை|\bdas(h)?a\b/i;

  it.each(entries.map((e) => [e.slug, e] as const))("%s: no Tamil paragraph states a dasa timing", (_slug, entry) => {
    const paras = Object.values(entry.sections).flatMap((s) => s.paras);
    expect(entry.sections.dasha.paras.length).toBeGreaterThan(0);
    expect(paras.filter((p) => MENTIONS_DASA.test(p)).flatMap(dasaProseTimingClaims)).toEqual([]);
  });

  it.each(entries.map((e) => [e.slug] as const))("%s: no English paragraph states a dasa timing", (slug) => {
    // No `?? []`: a missing entry must fail, not pass as "no claims" — that
    // fallback once let this test read the wrong map and pass for all 27.
    const en = NATCHATHIRAM_EN[slug];
    expect(en?.dasha.length).toBeGreaterThan(0);
    const paras = Object.values(en!).flat();
    expect(paras.filter((p) => MENTIONS_DASA.test(p)).flatMap(dasaProseTimingClaims)).toEqual([]);
  });
});

describe("visual pages", () => {
  it("finds all 27", () => {
    expect(visualSlugs).toHaveLength(27);
  });

  it.each(visualSlugs.map((s) => [s] as const))("%s declares no hand-typed timing field", (slug) => {
    // An object key, not "sub-period:" inside prose.
    expect(visualSource(slug)).not.toMatch(/[{,]\s*(period|ageRange)\s*:/);
  });

  it.each(visualSlugs.map((s) => [s] as const))("%s lists its dasas in the engine's order", (slug) => {
    const entry = entries.find((e) => e.slug === slug);
    expect(entry).toBeDefined();
    const engine = NATCHATHIRAM_DASA_TIMINGS[entry!.number - 1].mahadashas.map((m) => m.lord);
    const planets = [...visualSource(slug).matchAll(/planet:\s*"(\w+)"/g)].map((m) => m[1].toUpperCase());
    expect(planets).toEqual(engine.slice(0, planets.length));
  });

  it.each(visualSlugs.filter((s) => !DASA_TIMING_HOLD.has(s)).map((s) => [s] as const))(
    "%s is out of the hold, so its dasa prose states no timing",
    (slug) => {
      expect(dasaProseTimingClaims(visualDasaProse(visualSource(slug)))).toEqual([]);
    },
  );
});
