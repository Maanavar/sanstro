import type { AlignmentVerdict, FunctionalNature, NumberAlignment } from "@vinaadi/shared/api/numerology";
import type { Lang } from "@/lib/i18n";

/**
 * Vocabulary shared by the dashboard and the marketing tools.
 *
 * ## Why this file exists
 *
 * `components/dashboard-numerology-shared.tsx` owned these maps, but it is a
 * dashboard module: it imports `Card`/`Chip`/`Kicker` and its inline styles
 * read `var(--color-*)`, which are defined only under
 * `[data-ui="nova"] .cd-shell`. Importing it from a marketing page renders
 * those tokens as **undefined** — the phantom-token failure the light-theme
 * audit caught, where text goes invisible rather than merely wrong.
 *
 * So `app/tools/baby-name-finder` kept its own private copy of
 * `VERDICT_LABEL`. Two hand-maintained copies of the same enum vocabulary is
 * exactly how "Out of step" starts meaning two different things in two tabs.
 *
 * Everything here is **presentation-neutral**: no React, no dashboard
 * imports, no CSS tokens. Strings only, so each surface can render them in
 * its own visual language. `dashboard-numerology-shared.tsx` re-exports these
 * so its existing call sites are untouched.
 */

/** Chip tone. A plain union, deliberately not imported from the Chip component. */
export type VerdictTone = "high" | "mid" | "low" | "neutral" | "accent";

type VerdictSpec = { en: string; ta: string; tone: VerdictTone };

export const VERDICT_LABEL: Record<AlignmentVerdict, VerdictSpec> = {
  strongly_aligned: { en: "Strongly aligned", ta: "மிகவும் இணக்கம்", tone: "high" },
  aligned: { en: "Aligned", ta: "இணக்கம்", tone: "high" },
  neutral: { en: "Neutral", ta: "நடுநிலை", tone: "neutral" },
  misaligned: { en: "Out of step", ta: "ஒத்துவரவில்லை", tone: "mid" },
  strongly_misaligned: { en: "Well out of step", ta: "மிகவும் ஒத்துவரவில்லை", tone: "low" },
};

/**
 * Kept deliberately consistent with the labels already used by the chart
 * explanation and jadhagam report panels — the same enum must not read as two
 * different vocabularies in two tabs. `UPACHAYA` is the one key those maps
 * predate; the alignment engine emits it, so it is labelled here.
 */
export const NATURE_LABEL: Record<FunctionalNature, { en: string; ta: string }> = {
  LAGNA_LORD: { en: "Lagna lord", ta: "லக்னாதிபதி" },
  YOGAKARAKA: { en: "Yogakaraka", ta: "யோககாரகன்" },
  TRIKONA: { en: "Trikona lord", ta: "திரிகோண அதிபதி" },
  KENDRA: { en: "Kendra lord", ta: "கேந்திர அதிபதி" },
  UPACHAYA: { en: "Upachaya lord", ta: "உபசய அதிபதி" },
  MARAKA: { en: "Maraka lord", ta: "மாரகாதிபதி" },
  DUSTHANA: { en: "Dusthana lord", ta: "துஷ்டானாதிபதி" },
  NEUTRAL: { en: "Neutral", ta: "நடுநிலை" },
};

export function verdictLabel(verdict: AlignmentVerdict, lang: Lang): string {
  const spec = VERDICT_LABEL[verdict];
  if (!spec) return verdict.replaceAll("_", " ");
  return lang === "ta" ? spec.ta : spec.en;
}

export function verdictTone(verdict: AlignmentVerdict): VerdictTone {
  return VERDICT_LABEL[verdict]?.tone ?? "neutral";
}

export function natureLabel(nature: FunctionalNature, lang: Lang): string {
  const spec = NATURE_LABEL[nature];
  if (!spec) return nature.replaceAll("_", " ");
  return lang === "ta" ? spec.ta : spec.en;
}

/** Whose chart is being explained. Baby Name Finder is always "child". */
export type ChartSubject = "self" | "child";

/**
 * The whole rating in one sentence a first-time reader owns.
 *
 * Built from three facts the numbered derivation also uses — the graha, its
 * functional role, and the verdict band — so it can never claim something the
 * working contradicts. It deliberately does NOT restate the score: on the
 * dashboard the number is already three lines up at display size, and
 * repeating it is what made the card feel like it was arguing with itself.
 *
 * Direction comes off `verdict`, never the raw score, because the band is
 * what the last step names — a summary saying "works with" beside a step
 * saying "Out of step" is the defect this whole pass exists to fix.
 *
 * Pure strings: the dashboard renders it inside `WhyThisRating`, the
 * marketing page inside its own `cl-num-*` markup.
 */
export function plainSummaryText(
  alignment: Pick<NumberAlignment, "number" | "verdict" | "functionalNature" | "grahaEn" | "grahaTa">,
  subject: ChartSubject,
  lang: Lang,
): string {
  const isTamil = lang === "ta";
  const graha = isTamil ? alignment.grahaTa : alignment.grahaEn;
  const term = natureLabel(alignment.functionalNature, lang);
  const whose = isTamil
    ? subject === "child"
      ? "இந்தக் குழந்தையின் ஜாதகத்தில்"
      : "உங்கள் ஜாதகத்தில்"
    : subject === "child"
      ? "this child's chart"
      : "your chart";

  const supportive =
    alignment.verdict === "strongly_aligned" || alignment.verdict === "aligned";
  const against =
    alignment.verdict === "misaligned" || alignment.verdict === "strongly_misaligned";

  if (isTamil) {
    const lead = `${alignment.number} என்ற எண் ${graha}-க்குரியது; ${whose} ${graha} ${term}.`;
    if (supportive) return `${lead} அதனால் இந்தப் பெயரின் எண்ணும் ஜாதகமும் ஒரே திசையில் இழுக்கின்றன.`;
    if (against) return `${lead} அதனால் இந்தப் பெயரின் எண் ஜாதகத்துக்கு எதிர்த் திசையில் இழுக்கிறது.`;
    return `${lead} அதனால் இந்தப் பெயரின் எண் ஜாதகத்துக்கு உதவவும் இல்லை, தடையாகவும் இல்லை.`;
  }

  const lead = `${alignment.number} is ${graha}'s number, and in ${whose} ${graha} is ${term}.`;
  if (supportive) return `${lead} So this name's number and the chart pull the same way.`;
  if (against) return `${lead} So this name's number pulls against the chart.`;
  return `${lead} So this name's number neither helps nor hinders the chart.`;
}
