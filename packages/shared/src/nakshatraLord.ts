/**
 * Nakshatra lords, derived rather than transcribed.
 *
 * Two frontends each carried their own hand-written 27-row lord table
 * (`NAKSHATRA_LORDS` in chart-generate-inline-panel, `NAKSHATRA_LORDS_TA` in
 * JadhagamTool). They happened to agree, but nothing held them together and a
 * fix applied to one would silently miss the other.
 *
 * The 27 lords are not arbitrary data — they are the 9-graha Vimshottari cycle
 * repeated three times. Deriving them from that cycle makes a 27-row
 * transcription error impossible to introduce, and matches how the backend does
 * it (`NAK_LORD` in app/calculations/dasha.py is the same one-line derivation).
 *
 * Where a chart response carries `nakshatraLord` from the backend, prefer that
 * field. This module is for surfaces that only have a nakshatra number.
 */

/** The Vimshottari dasha sequence — the cycle every nakshatra lord comes from. */
export const VIMSHOTTARI_SEQUENCE = [
  "KETU",
  "VENUS",
  "SUN",
  "MOON",
  "MARS",
  "RAHU",
  "JUPITER",
  "SATURN",
  "MERCURY",
] as const;

export type NakshatraLordCode = (typeof VIMSHOTTARI_SEQUENCE)[number];

/**
 * Graha code ruling a nakshatra (1-27).
 * Throws on an out-of-range number rather than returning a wrong lord — a
 * silently incorrect lord would propagate into a reading.
 */
export function nakshatraLord(nakshatra: number): NakshatraLordCode {
  if (!Number.isInteger(nakshatra) || nakshatra < 1 || nakshatra > 27) {
    throw new RangeError(`nakshatra must be an integer 1-27, received ${nakshatra}`);
  }
  return VIMSHOTTARI_SEQUENCE[(nakshatra - 1) % 9];
}

/** Short Tamil labels, as used in the dense chart grids. */
const LORD_SHORT_TA: Record<NakshatraLordCode, string> = {
  KETU: "கேது",
  VENUS: "சுக்",
  SUN: "சூரி",
  MOON: "சந்",
  MARS: "செவ்",
  RAHU: "ராகு",
  JUPITER: "குரு",
  SATURN: "சனி",
  MERCURY: "புத",
};

const LORD_SHORT_EN: Record<NakshatraLordCode, string> = {
  KETU: "Ke",
  VENUS: "Ve",
  SUN: "Su",
  MOON: "Mo",
  MARS: "Ma",
  RAHU: "Ra",
  JUPITER: "Ju",
  SATURN: "Sa",
  MERCURY: "Me",
};

/** Abbreviated lord label for a nakshatra, for table cells. */
export function nakshatraLordShort(nakshatra: number, lang: "ta" | "en"): string {
  const lord = nakshatraLord(nakshatra);
  return lang === "ta" ? LORD_SHORT_TA[lord] : LORD_SHORT_EN[lord];
}
