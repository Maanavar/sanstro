import { dt, s, type BiStr } from "./dashboard-i18n";
import { getScoreBand } from "./format";
import type { Lang } from "./i18n";
import { verdictPhrase } from "./verdict-lexicon";

/**
 * Why a family member's card carries a flag today — and, just as importantly,
 * why some conditions are *not* flags.
 *
 * The Family grid used to paint one generic red "needs care" chip that fired
 * for three unrelated reasons (Chandrashtama, an active Saturn cycle, a low
 * score) and named none of them. On a member reading 53 / "Steady day" with a
 * multi-year Saturn cycle running, the card said "steady" and "needs care" at
 * once, with nothing on screen to reconcile them.
 *
 * Two rules come out of that, and this module is where they live:
 *
 *  1. **A flag names its own cause.** No chip says "care" without saying why.
 *  2. **Today's card carries today's condition.** Ezharai / Ashtama /
 *     Ardhashtama / Kandaka Sani run for 2.5–7.5 *years*. A badge that is on
 *     every day for seven years is not an alert, it is a fact about the chart —
 *     so it renders as quiet named context and is deliberately excluded from
 *     the "needs care" count and the today palette.
 */

/** Saturn-cycle tags the family aggregate can append (see
 *  `app/services/family_vault_service.py::_member_active_tags`, fed by
 *  `classify_sani_cycle` from the Moon and `KANDAKA_SANI` from the Lagna).
 *  Ordered most- to least-significant: a member can be inside a Moon-based and
 *  a Lagna-based cycle at once, and the card shows one chip. */
const SANI_CYCLE_RANK = [
  "JANMA_SANI",
  "EZHARAI_SANI_PHASE_2",
  "EZHARAI_SANI_PHASE_1",
  "EZHARAI_SANI_PHASE_3",
  "ASHTAMA_SANI",
  "ARDHASHTAMA_SANI",
  "KANTAKA_SANI",
  "KANDAKA_SANI",
] as const;

/** Tamil almanac naming, matching `app/calculations/display_names.py` — the
 *  backend already ships these names, so a chip must never invent a second one
 *  ("Sade Sati" for ஏழரை சனி) for the same cycle. */
const SANI_CYCLE_NAME: Record<string, BiStr> = {
  JANMA_SANI: s("Janma Sani", "ஜன்ம சனி"),
  EZHARAI_SANI_PHASE_1: s("Ezharai Sani · opening", "ஏழரை சனி · தொடக்கம்"),
  EZHARAI_SANI_PHASE_2: s("Ezharai Sani · middle", "ஏழரை சனி · நடுவு"),
  EZHARAI_SANI_PHASE_3: s("Ezharai Sani · closing", "ஏழரை சனி · முடிவு"),
  ASHTAMA_SANI: s("Ashtama Sani", "அஷ்டம சனி"),
  ARDHASHTAMA_SANI: s("Ardhashtama Sani", "அர்த்தாஷ்டம சனி"),
  KANTAKA_SANI: s("Kantaka Sani", "கண்டக சனி"),
  KANDAKA_SANI: s("Kantaka Sani · from Lagna", "கண்டக சனி · லக்னம்"),
};

/** Every active Saturn cycle on a member, most-significant first. */
export function activeSaniCycles(activeCycleTags: readonly string[]): string[] {
  return SANI_CYCLE_RANK.filter((tag) => activeCycleTags.includes(tag));
}

/** Display name for a Saturn-cycle tag. Unknown tags de-snake rather than
 *  leaking `EZHARAI_SANI_PHASE_1` onto the screen. */
export function saniCycleName(tag: string, lang: Lang): string {
  const known = SANI_CYCLE_NAME[tag];
  if (known) return dt(known, lang);
  return tag.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const SANI_CONTEXT_NOTE = s(
  "A long Saturn cycle — background context for months or years, not a verdict on today.",
  "நீண்ட கால சனி சுழற்சி — மாதங்கள் அல்லது ஆண்டுகள் நீளும் பின்னணி; இன்றைய தீர்ப்பு அல்ல.",
);

/** Hover/assistive note for the Saturn chip, naming every active cycle. */
export function saniCycleNote(tags: readonly string[], lang: Lang): string {
  const names = activeSaniCycles(tags).map((tag) => saniCycleName(tag, lang));
  return names.length > 1
    ? `${names.join(" · ")} — ${dt(SANI_CONTEXT_NOTE, lang)}`
    : dt(SANI_CONTEXT_NOTE, lang);
}

/** A today-scoped reason a member needs attention. Saturn cycles are absent by
 *  design — see the module note. */
export type CareReason = "chandrashtama" | "lowScore";

/**
 * Today's care reason for a member, or null.
 *
 * The low-score arm reads `getScoreBand`, the same function that colours the
 * ring printed beside the chip, so the two can never disagree. (It previously
 * used a private 45 cutoff while the ring turned red at 50, leaving members in
 * the 45–49 gap red-ringed but unflagged.)
 */
export function memberCareReason(
  member: { individualScore: number },
  isChandrashtama: boolean,
): CareReason | null {
  if (isChandrashtama) return "chandrashtama";
  if (getScoreBand(member.individualScore).tone === "low") return "lowScore";
  return null;
}

const CHANDRASHTAMA_CHIP = s("Chandrashtama", "சந்திராஷ்டமம்");
const CAUTION_CHIP_FALLBACK = s("Needs care", "கவனம் தேவை");

const CARE_NOTE: Record<CareReason, BiStr> = {
  chandrashtama: s(
    "The Moon is in the 8th sign from their birth Moon today — rest, and avoid new starts. It passes in about a day.",
    "இன்று சந்திரன் இவரது பிறப்பு சந்திர ராசியிலிருந்து 8வது ராசியில் — ஓய்வு, புதிய தொடக்கங்களைத் தவிர்க்கவும். ஒரு நாளில் கடந்துவிடும்.",
  ),
  lowScore: s(
    "Today's score is in the caution band — keep the day simple.",
    "இன்றைய மதிப்பெண் எச்சரிக்கை நிலையில் — நாளை எளிமையாக வையுங்கள்.",
  ),
};

/**
 * Chip text for a care reason.
 *
 * Chandrashtama is named. The score chip keeps the shared lexicon's word for
 * the caution rung ("Needs care" / "கவனம் தேவை", astrologer-approved
 * 2026-07-14) — that word was never the problem, firing it for three unrelated
 * causes was. Now it appears only when the ring beside it is already in the
 * caution band, so chip and number always agree.
 */
export function careReasonLabel(reason: CareReason, lang: Lang): string {
  if (reason === "chandrashtama") return dt(CHANDRASHTAMA_CHIP, lang);
  return verdictPhrase("daily", "CAUTION", lang) ?? dt(CAUTION_CHIP_FALLBACK, lang);
}

/** One-line explanation of a care reason, for the chip's hover/assistive text. */
export function careReasonNote(reason: CareReason, lang: Lang): string {
  return dt(CARE_NOTE[reason], lang);
}

/** What the "Needs care" filter selects, stated in the UI so the count is never
 *  a number the reader has to reverse-engineer. */
export const CARE_FILTER_NOTE = s(
  "Chandrashtama today, or a day score in the caution band. Long Saturn cycles show on the card but are not counted here.",
  "இன்று சந்திராஷ்டமம், அல்லது எச்சரிக்கை நிலையிலான நாள் மதிப்பெண். நீண்ட கால சனி சுழற்சிகள் அட்டையில் காட்டப்படும், ஆனால் இங்கு எண்ணப்படுவதில்லை.",
);
