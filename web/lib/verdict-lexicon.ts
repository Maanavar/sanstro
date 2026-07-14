/**
 * Shared Tamil verdict lexicon (C-5) — web mirror of the backend source of
 * truth `app/calculations/verdict_lexicon.py`. Keep the two in sync when either
 * changes (they are a hand-maintained pair, not generated).
 *
 * One canonical quality ladder so a user moving between Today, prediction,
 * Family compatibility, and Porutham meets the SAME Tamil verdict word family
 * for the same quality tier — even though each domain keeps its own internal
 * enum and its own tier count. Each surface composes the shared root with its
 * own noun (நாள் / பொருத்தம் / இணக்கம்) so it reads naturally in context.
 *
 * Native-Tamil approved in the live astrologer session 2026-07-14.
 */

export type VerdictRung = "EXCELLENT" | "GOOD" | "BALANCED" | "CAUTION";

/** Shared adjective root per rung — the through-line every surface shares. */
export const VERDICT_ROOT: Record<VerdictRung, { ta: string; en: string }> = {
  EXCELLENT: { ta: "மிகச் சிறந்த", en: "Excellent" },
  GOOD: { ta: "நல்ல", en: "Good" },
  BALANCED: { ta: "சமநிலையான", en: "Balanced" },
  CAUTION: { ta: "கவனம் தேவை", en: "Needs care" },
};

type Domain = "daily" | "porutham";

/**
 * Composed verdict phrase shown to the user, per domain label — [ta, en].
 * Two approved irregularities: daily RESTORATIVE → ஓய்வு நாள் (a rest day is
 * gentle, not a caution); caution rungs have no trailing noun.
 */
export const VERDICT_PHRASE: Record<Domain, Record<string, [string, string]>> = {
  daily: {
    STRONG_SUPPORT: ["மிகச் சிறந்த நாள்", "Excellent day"],
    GOOD: ["நல்ல நாள்", "Good day"],
    BALANCED: ["சமநிலையான நாள்", "Balanced day"],
    CAUTION: ["கவனம் தேவை", "Needs care"],
    RESTORATIVE: ["ஓய்வு நாள்", "Rest day"],
  },
  porutham: {
    EXCELLENT: ["மிகச் சிறந்த பொருத்தம்", "Excellent match"],
    GOOD: ["நல்ல பொருத்தம்", "Good match"],
    AVERAGE: ["சமநிலையான பொருத்தம்", "Balanced match"],
    CAUTION: ["கவனம் தேவை", "Needs care"],
  },
};

/** Composed verdict phrase for a domain label, or null if unmapped. */
export function verdictPhrase(
  domain: Domain,
  label: string,
  lang: "ta" | "en",
): string | null {
  const entry = VERDICT_PHRASE[domain][label];
  if (!entry) return null;
  return lang === "ta" ? entry[0] : entry[1];
}
