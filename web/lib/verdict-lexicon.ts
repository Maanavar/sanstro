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

type Domain = "daily" | "porutham" | "lifeArea" | "harmony" | "doshamSeverity";

/**
 * Composed verdict phrase shown to the user, per domain label — [ta, en].
 * Three approved irregularities: daily RESTORATIVE → ஓய்வு நாள் (a rest day is
 * gentle, not a caution); caution rungs have no trailing noun; and the
 * `lifeArea` middle rung is கலப்பான (mixed), not சமநிலையான (steady), following
 * the same ruling the backend records for prediction/synastry — a mixed
 * *period* means something different from a calm, even *day*.
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
  // A life-area score is a *standing outlook* over the running dasha and the
  // slow transits — months, not today. (Measured: over 500 consecutive days
  // with the dasha held fixed, the score moved on 44 of them; Career took four
  // distinct values in the whole window.) Its noun is காலகட்டம் / "period"
  // precisely so it can never be read on the same clock as the daily dial or
  // the "Is today okay for…?" muhurtam board sitting beside it on Today.
  //
  // Three rungs, not four, because the engine itself bands a life area three
  // ways at 70 / 45 (`_score_area`'s own closing prose: strong / moderate and
  // steady / needs attention). A fourth UI-only rung would be a boundary the
  // engine never drew — the split that had Health 45 reading "Needs care" on
  // the tile and "moderate and steady" in its own detail text.
  lifeArea: {
    EXCELLENT: ["மிகச் சிறந்த காலகட்டம்", "Excellent period"],
    MIXED: ["கலப்பான காலகட்டம்", "Mixed period"],
    CAUTION: ["கவனம் தேவை", "Needs care"],
  },
  // Compatibility Intelligence sub-layer harmony (navamsa, dasha, Moon-Moon,
  // Venus). F-DSP-01: the panel used to put these engine keys straight into a
  // <Badge text=...>, so a Tamil reader saw "STRONG" / "SUPPORTIVE". The noun
  // is இணக்கம், matching the synastry row in the backend twin — the same idea
  // one level up.
  harmony: {
    EXCELLENT: ["மிகச் சிறந்த இணக்கம்", "Excellent harmony"],
    STRONG: ["வலுவான இணக்கம்", "Strong harmony"],
    SUPPORTIVE: ["ஆதரவான இணக்கம்", "Supportive"],
    GOOD: ["நல்ல இணக்கம்", "Good harmony"],
    MODERATE: ["நடுத்தர இணக்கம்", "Moderate harmony"],
    MIXED: ["கலப்பான இணக்கம்", "Mixed harmony"],
    NEUTRAL: ["நடுநிலை", "Neutral"],
    TENSE: ["இறுக்கமான இணக்கம்", "Tense"],
    CHALLENGING: ["சவாலான இணக்கம்", "Challenging"],
    WEAK: ["பலவீனமான இணக்கம்", "Weak harmony"],
  },
  // Dosham severity is a magnitude, not a quality verdict, so it has no
  // VerdictRung — only display words. Rendered on the Sevvai badge.
  doshamSeverity: {
    SEVERE: ["தீவிரம்", "Severe"],
    MODERATE: ["நடுத்தரம்", "Moderate"],
    MILD: ["லேசானது", "Mild"],
    NONE: ["இல்லை", "None"],
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

/**
 * Same as `verdictPhrase`, but never returns null: an unmapped label falls
 * back to the raw key. For badges, where there is nothing sensible to render
 * instead — a blank badge hides the verdict entirely, which is worse than an
 * untranslated one, and leaves nothing for a Tamil-mode check to catch.
 */
export function verdictPhraseOrKey(
  domain: Domain,
  label: string,
  lang: "ta" | "en",
): string {
  return verdictPhrase(domain, label, lang) ?? label;
}
