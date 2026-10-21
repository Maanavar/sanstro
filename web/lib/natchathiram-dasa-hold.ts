import type { Metadata } from "next";
import { NAKSHATRA_LIST } from "@vinaadi/shared/constants";

/**
 * Nakshatra visual profiles held out of search until their dasa timings are
 * regenerated (FSA-03, owner ruling 2026-10-21 — docs/FULL_SYSTEM_AUDIT_2026-10-21.md).
 *
 * Every `/natchathiram/<slug>/visual` page hand-types bhukti timings ("Saturn–Mars
 * antardasa (~yr 5 of Saturn, ~age 5)"). Checked against Vimshottari arithmetic,
 * 87 of 146 machine-readable "yr N of X" claims are wrong, 65 of the 146 stated
 * ages cannot occur for any birth balance, and no page has every claim right.
 *
 * The ruling named 21 pages: the ones the audit's parser could read. The other
 * six (Ashwini, Bharani, Krittika, Rohini, Mrigashira, Ardra) phrase the same
 * claims differently ("approximately ages 8–9") and carry the same errors, so
 * all 27 are held. A page leaves this set only when its timings come from the
 * dasa engine and state their datum — "from the start of Saturn dasa", never a
 * bare number a reader takes as his age.
 *
 * `follow` stays true: the pages remain reachable and their links still count.
 */
export const DASA_TIMING_HOLD: ReadonlySet<string> = new Set(NAKSHATRA_LIST.map(({ slug }) => slug));

export function isDasaTimingHeld(slug: string): boolean {
  return DASA_TIMING_HOLD.has(slug);
}

/** Add `noindex` to a held visual page's metadata, on both language twins. */
export function withDasaTimingHold(meta: Metadata, slug: string): Metadata {
  if (!isDasaTimingHeld(slug)) return meta;
  return { ...meta, robots: { index: false, follow: true } };
}
