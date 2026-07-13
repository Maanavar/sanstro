import type { Lang } from "@/lib/i18n";
import type { ReasoningBand, ReasoningReading } from "@/lib/types";

// Mirrors BAND_PHRASE in app/services/narrative_engine.py — the one
// tone-validated confidence vocabulary (reasoning doctrine D2/D6). If the
// server copy changes, change it here in the same PR.
const BAND_PHRASE: Record<ReasoningBand, { ta: string; en: string }> = {
  STRONG:  { ta: "வலுவான ஆதரவு", en: "strongly supported" },
  LIKELY:  { ta: "நல்ல ஆதரவு", en: "well supported" },
  MIXED:   { ta: "கலவையான நிலை", en: "mixed" },
  WEAK:    { ta: "கவனம் தேவை", en: "needs attention" },
  BLOCKED: { ta: "இப்போதைக்கு வேறு பாதை நல்லது", en: "not indicated — a redirect is wiser" },
  SILENT:  { ta: "ஜாதகம் அமைதியாக உள்ளது", en: "the chart is quiet" },
};

export function bandPhrase(band: ReasoningBand, lang: Lang): string {
  const phrase = BAND_PHRASE[band] ?? BAND_PHRASE.MIXED;
  return lang === "ta" ? phrase.ta : phrase.en;
}

/** Chip colours per band, using the same tokens the confidence chips use. */
export function bandTone(band: ReasoningBand): { bg: string; border: string; text: string } {
  switch (band) {
    case "STRONG":
    case "LIKELY":
      return { bg: "var(--chart-d9-active-bg)", border: "var(--cl-sage-border)", text: "var(--color-score-high)" };
    case "WEAK":
    case "BLOCKED":
      return { bg: "var(--panel-warm-tint)", border: "var(--cl-rust-35)", text: "var(--color-score-low)" };
    case "SILENT":
      return { bg: "var(--color-surface-soft)", border: "var(--color-border)", text: "var(--color-muted)" };
    default:
      return { bg: "var(--chart-d1-lagna-bg)", border: "var(--cl-brand-edge)", text: "var(--color-score-mid)" };
  }
}

// Mirrors READING_VOICE in app/services/narrative_engine.py — short chip
// labels (not the full sentence; the server already prepends the full
// bilingual voice into the area's narrative for PROMISED_NOT_NOW,
// NOT_PROMISED and ACTIVE_BUT_UNPROMISED when reasoning_contradiction is
// on). This chip exists so every reading state — including the ones that
// don't rewrite the narrative (PROMISED_AND_TIMED, MIXED, SILENT) — is
// visible at a glance for QA/testing. If the server copy changes, change
// it here in the same PR.
const READING_PHRASE: Record<ReasoningReading, { ta: string; en: string }> = {
  PROMISED_AND_TIMED:    { ta: "இணைந்த ஆதரவு",              en: "Aligned — act" },
  PROMISED_NOT_NOW:      { ta: "வாக்களிக்கப்பட்டது, இப்போது இல்லை", en: "Promised, not now" },
  ACTIVE_BUT_UNPROMISED: { ta: "செயலூக்கம் — வேறு திசை",        en: "Active — redirect" },
  NOT_PROMISED:          { ta: "இப்போது இல்லை",               en: "Not indicated" },
  MIXED:                 { ta: "கலவையான நிலை",                en: "Mixed signal" },
  SILENT:                { ta: "ஜாதகம் அமைதி",                en: "Chart is quiet" },
};

export function readingPhrase(reading: ReasoningReading, lang: Lang): string {
  const phrase = READING_PHRASE[reading] ?? READING_PHRASE.MIXED;
  return lang === "ta" ? phrase.ta : phrase.en;
}

/** Chip colours per reading, reusing the exact bandTone tone groups. */
export function readingTone(reading: ReasoningReading): { bg: string; border: string; text: string } {
  switch (reading) {
    case "PROMISED_AND_TIMED":
      return { bg: "var(--chart-d9-active-bg)", border: "var(--cl-sage-border)", text: "var(--color-score-high)" };
    case "NOT_PROMISED":
      return { bg: "var(--panel-warm-tint)", border: "var(--cl-rust-35)", text: "var(--color-score-low)" };
    case "SILENT":
      return { bg: "var(--color-surface-soft)", border: "var(--color-border)", text: "var(--color-muted)" };
    default:
      return { bg: "var(--chart-d1-lagna-bg)", border: "var(--cl-brand-edge)", text: "var(--color-score-mid)" };
  }
}
