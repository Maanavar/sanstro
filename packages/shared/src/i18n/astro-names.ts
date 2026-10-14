/**
 * Rasi and graha names in the reader's language — the shared half of the
 * display boundary (CLAUDE.md "never render a name the server chose").
 *
 * The backend sends most astrology terms twice: a language-free key and a
 * pre-rendered English name. A name field is English-only, so rendering it
 * prints `Mithunam` at a Tamil reader; a code field prints `MITHUNAM` at
 * everybody. Render the key through here instead.
 *
 * `web/` has its own copies of these tables in `lib/chart-utils.ts` and
 * `lib/i18n.ts` and keeps them (grandfathered). This module exists because
 * `mobile/` had no boundary at all and was rendering `rasiName` and a raw
 * `mahadasha.lord` straight into the view (F-DSP-01); a third hand-copied
 * table in `mobile/` would have been the wrong answer. New code on either
 * surface should prefer this module.
 *
 * Tables are value-identical to the web ones — if you change one, change
 * both; they are a hand-maintained pair, not generated.
 */

import type { Lang } from "./strings";

/** Index 0 is unused so the array is 1-indexed, matching the `rasi` field. */
export const RASI_NAMES_EN: readonly string[] = [
  "", "Mesham", "Rishabam", "Mithunam", "Kadagam", "Simmam", "Kanni",
  "Thulam", "Viruchigam", "Dhanusu", "Magaram", "Kumbam", "Meenam",
];

export const RASI_NAMES_TA: readonly string[] = [
  "", "மேஷம்", "ரிஷபம்", "மிதுனம்", "கடகம்", "சிம்மம்", "கன்னி",
  "துலாம்", "விருச்சிகம்", "தனுசு", "மகரம்", "கும்பம்", "மீனம்",
];

/**
 * GURU and JUPITER are both present and both map to குரு: the dasha engine
 * emits JUPITER, the panchangam lord tables emit GURU, and a caller should
 * not have to know which.
 */
export const PLANET_LORDS: Record<string, { ta: string; en: string }> = {
  SUN:     { ta: "சூரியன்",   en: "Sun" },
  MOON:    { ta: "சந்திரன்",  en: "Moon" },
  MARS:    { ta: "செவ்வாய்",  en: "Mars" },
  MERCURY: { ta: "புதன்",     en: "Mercury" },
  GURU:    { ta: "குரு",      en: "Jupiter" },
  JUPITER: { ta: "குரு",      en: "Jupiter" },
  VENUS:   { ta: "சுக்கிரன்", en: "Venus" },
  SATURN:  { ta: "சனி",       en: "Saturn" },
  RAHU:    { ta: "ராகு",      en: "Rahu" },
  KETU:    { ta: "கேது",      en: "Ketu" },
  MANDHI:  { ta: "மாந்தி",    en: "Mandhi" },
};

/** The 1-12 index for a rasi in any shape the backend sends it, else null. */
export function rasiNumber(rasi: number | string | null | undefined): number | null {
  if (typeof rasi === "number") return rasi >= 1 && rasi <= 12 ? rasi : null;
  const folded = (rasi ?? "").trim().replaceAll("_", " ").toLowerCase();
  if (!folded) return null;
  const matches = (name: string) => name.toLowerCase() === folded;
  const index = Math.max(RASI_NAMES_EN.findIndex(matches), RASI_NAMES_TA.findIndex(matches));
  return index > 0 ? index : null;
}

/**
 * A rasi in the reader's language, whatever shape it arrived in — number,
 * Latin name, upper-case code, or Tamil script.
 *
 * An unrecognised value de-snakes to title case and stays Latin in both
 * languages: there is no Tamil name to give for a sign we do not know, and
 * inventing one would be worse than transliterating.
 */
export function rasiDisplayName(rasi: number | string | null | undefined, lang: Lang): string {
  const index = rasiNumber(rasi);
  if (index !== null) {
    const table = lang === "ta" ? RASI_NAMES_TA : RASI_NAMES_EN;
    return table[index] ?? `Rasi ${index}`;
  }
  const raw = typeof rasi === "string" ? rasi.trim() : "";
  if (!raw) return "";
  return raw.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** A graha/lord key in the reader's language; unknown keys pass through. */
export function tPlanetLord(key: string | null | undefined, lang: Lang): string {
  const raw = (key ?? "").trim();
  if (!raw) return "";
  const entry = PLANET_LORDS[raw.toUpperCase()];
  if (!entry) return raw;
  return lang === "ta" ? entry.ta : entry.en;
}
