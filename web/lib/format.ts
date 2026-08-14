export {
  todayIso,
  addDays,
  formatDateLabel,
  formatClockLabel,
  formatDateTimeLabel,
} from "@vinaadi/shared/utils/format";
import { addDays, todayIso } from "@vinaadi/shared/utils/format";
import { SCORE_THRESHOLDS, scoreTonePct } from "@vinaadi/shared/utils/score";
import { verdictPhrase } from "./verdict-lexicon";

const WEEKDAY_INDEX: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

/** The soonest ISO date (YYYY-MM-DD) whose weekday matches `weekday` (an English
 *  enum key), counting today. On the matching day itself this returns today, so a
 *  "best on {weekday}" chip points at today rather than a week out. Returns
 *  `fromIso` unchanged for an unknown weekday. UTC throughout, matching addDays. */
export function nextWeekdayDate(weekday: string, fromIso: string = todayIso()): string {
  const target = WEEKDAY_INDEX[weekday.toUpperCase()];
  if (target === undefined) return fromIso;
  const cur = new Date(`${fromIso}T00:00:00Z`).getUTCDay();
  return addDays(fromIso, (target - cur + 7) % 7);
}

export interface ScoreBand {
  label: string;
  tone: "high" | "mid" | "low";
}

// ── Hijri (Islamic) calendar ─────────────────────────────────────────────────
// Derived civilly from the Gregorian date via Intl's Umm al-Qura calendar. India
// / Tamil Nadu follow local moon sighting, which runs ~1 day behind the Saudi
// Umm al-Qura civil calendar, so we convert the day BEFORE and read its Hijri
// date — this reproduces the India-observed dates exactly (cross-checked against
// this repo's own 2026 Muslim festival table: Ramadan begins 19 Feb, Eid ul-Fitr
// 21 Mar, Bakrid = Dhu al-Hijjah 10 on 28 May, Hijri New Year 17 Jun). Sighting
// still varies locally by ±1 day, surfaced as a caveat in the UI and matching the
// "subject to local moon sighting" framing on the Muslim festivals pages.
const HIJRI_INDIA_SIGHTING_OFFSET_DAYS = -1;
const HIJRI_MONTHS: readonly { en: string; ta: string }[] = [
  { en: "Muharram", ta: "முஹர்ரம்" },
  { en: "Safar", ta: "சஃபர்" },
  { en: "Rabi al-Awwal", ta: "ரபியுல் அவ்வல்" },
  { en: "Rabi al-Thani", ta: "ரபியுல் ஆகிர்" },
  { en: "Jumada al-Awwal", ta: "ஜமாதுல் அவ்வல்" },
  { en: "Jumada al-Thani", ta: "ஜமாதுல் ஆகிர்" },
  { en: "Rajab", ta: "ரஜப்" },
  { en: "Shaban", ta: "ஷஅபான்" },
  { en: "Ramadan", ta: "ரமலான்" },
  { en: "Shawwal", ta: "ஷவ்வால்" },
  { en: "Dhu al-Qadah", ta: "துல்கஅதா" },
  { en: "Dhu al-Hijjah", ta: "துல்ஹஜ்" },
];

export interface HijriDate {
  /** e.g. "Safar 1, 1448 AH" */
  en: string;
  /** e.g. "சஃபர் 1, 1448 ஹிஜ்ரி" */
  ta: string;
}

/** Convert an ISO (YYYY-MM-DD) Gregorian date to its Umm al-Qura Hijri date.
 *  Returns null on malformed input or if the runtime lacks the Islamic
 *  calendar (older/no-ICU builds). */
export function formatHijriDate(isoDate: string): HijriDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  try {
    const dt = new Date(`${isoDate}T12:00:00Z`); // noon UTC avoids a TZ day-flip
    dt.setUTCDate(dt.getUTCDate() + HIJRI_INDIA_SIGHTING_OFFSET_DAYS);
    const parts = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).formatToParts(dt);
    const get = (t: string) => parts.find((p) => p.type === t)?.value;
    const monthNum = Number(get("month"));
    const day = get("day");
    const year = get("year");
    const month = HIJRI_MONTHS[monthNum - 1];
    if (!month || !day || !year) return null;
    return {
      en: `${month.en} ${day}, ${year} AH`,
      ta: `${month.ta} ${day}, ${year} ஹிஜ்ரி`,
    };
  } catch {
    return null;
  }
}

export const SCORE_HIGH = "var(--color-score-high, #5C7654)";
export const SCORE_MID = "var(--color-score-mid, #B85A2C)";
export const SCORE_LOW = "var(--color-score-low, #A8482F)";

// ── Four-band score palette ─────────────────────────────────────────────────
// Product-set thresholds (2026-07): ≥70 dark green · 65–70 light green ·
// 50–65 gold · <50 red. These are the canonical colors for every 0–100 daily
// score surface — dots, tiles, rings, dials, avatars. Kept as CSS custom
// properties (with hard fallbacks for the Classic warm theme) so the Nova dark
// theme can retune them in one place.
//
// The good/fair boundary is 65, not 60, so it lines up with the engine's own
// `_score_label` (GOOD ≥65) and the shared `SCORE_THRESHOLDS.HIGH`. When it sat
// at 60, a 60–64 score drew green from every score-driven surface (Family Today
// rings) and gold from every label-driven one (the Today hero dial) — the same
// number, two colours, on one screen.
export const SCORE_STRONG = "var(--color-score-strong, #3F7A4E)"; // ≥70 dark green
export const SCORE_GOOD = "var(--color-score-good, #6B9E5E)"; //   65–70 light green
export const SCORE_FAIR = "var(--color-score-fair, #C8892E)"; //   50–65 orange/gold
export const SCORE_WEAK = "var(--color-score-weak, #C04530)"; //   <50 red

/** The one canonical 0–100 → color map. Four discrete bands, product-set:
 *  ≥70 dark green (strong), 65–70 light green (good), 50–65 gold (fair),
 *  <50 red (weak). Use for every score dot/tile/ring/dial. */
export function scoreBandColor(score: number): string {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 70) return SCORE_STRONG;
  if (s >= SCORE_THRESHOLDS.HIGH) return SCORE_GOOD;
  if (s >= 50) return SCORE_FAIR;
  return SCORE_WEAK;
}

/** Back-compat alias — every existing dot/tile call site now resolves to the
 *  four-band palette. (Was a continuous OKLab interpolation; product moved to
 *  four explicit bands so a score's colour maps 1:1 to its stated verdict.) */
export function scoreColorScale(score: number): string {
  return scoreBandColor(score);
}

/** Translucent tint of a score color (for borders/backgrounds). Works with
 *  var()/color-mix() strings, which hex-alpha concatenation does not. */
export function scoreColorAlpha(color: string, alphaPct: number): string {
  return `color-mix(in srgb, ${color} ${alphaPct}%, transparent)`;
}

/** Color for a 0–100 daily score — the four-band palette (see scoreBandColor). */
export function scoreColor(score: number): string {
  return scoreBandColor(score);
}

/** Color for a 0–1 compatibility/porutham percentage. */
export function scoreColorPct(pct: number): string {
  const tone = scoreTonePct(pct);
  if (tone === "high") return SCORE_HIGH;
  if (tone === "mid") return SCORE_MID;
  return SCORE_LOW;
}

/** Band label + 3-way tone for a 0–100 score. Thresholds mirror the four-band
 *  colour palette (≥70 strong · 65–70 supportive · 50–65 steady · <50 caution)
 *  so a score's label, colour and "needs care" flag never disagree. */
export function getScoreBand(score: number): ScoreBand {
  if (score >= 70) return { label: "strong day", tone: "high" };
  if (score >= SCORE_THRESHOLDS.HIGH) return { label: "supportive", tone: "high" };
  if (score >= 50) return { label: "steady", tone: "mid" };
  if (score >= 40) return { label: "soft caution", tone: "low" };
  return { label: "take care", tone: "low" };
}

export interface ScoreVerdict {
  /** Plain folk-language verdict — the நல்ல நாள் / ஜாக்கிரதை that low-literacy
   *  users asked for (UX #9/#50). Weather-framed, never fatalist. */
  verdict: string;
  tone: "high" | "mid" | "low";
  color: string;
}

/** A one-word, plain-language reading of the 0–100 daily score. Deliberately
 *  three-way (good / okay / take-care) to answer the single question folk users
 *  have, instead of an English-caps band label. Boundaries and colour follow the
 *  four-band palette (green ≥65 · gold 50–65 · red <50) so the dial's word and
 *  its colour always agree. */
export function getScoreVerdict(score: number, lang: "ta" | "en"): ScoreVerdict {
  const color = scoreBandColor(score);
  if (score >= SCORE_THRESHOLDS.HIGH) return { verdict: lang === "ta" ? "நல்ல நாள்" : "Good day", tone: "high", color };
  if (score >= 50) return { verdict: lang === "ta" ? "பரவாயில்லை" : "An okay day", tone: "mid", color };
  return { verdict: lang === "ta" ? "ஜாக்கிரதை" : "Take care", tone: "low", color };
}

// ── Life-area bands ─────────────────────────────────────────────────────────
// A life area is scored on a different axis from a day, and the engine bands it
// differently: `life_areas_service._score_area` closes its own prose at 70 and
// 45 ("strong" / "moderate and steady" / "needs attention"). The four-band
// DAILY palette above bands at 70 / 65 / 50 — so a life area scoring 45–49 read
// "Needs care" on the Today tile and "moderate and steady (45/100)" in its own
// detail text, one tap apart. The engine owns the doctrine, so the UI follows
// it here rather than the other way round.
const LIFE_AREA_STRONG = 70;
const LIFE_AREA_STEADY = 45;

/** Colour for a life-area score — three bands at the engine's own boundaries,
 *  reusing the existing palette tokens. Deliberately NOT `scoreBandColor`:
 *  that map is documented as the canonical colours for every *daily* score
 *  surface, and a life area is not one. Sharing it would put a red tile under
 *  the words "Mixed period" everywhere between 45 and 49. */
export function lifeAreaBandColor(score: number): string {
  if (score >= LIFE_AREA_STRONG) return SCORE_STRONG;
  if (score >= LIFE_AREA_STEADY) return SCORE_FAIR;
  return SCORE_WEAK;
}

/** A life-area score is NOT a daily score, so it must not borrow the daily
 *  lexicon. `getScoreVerdict` above says "Good day" / "An okay day" — printing
 *  that under a card whose own subtitle reads "your outlook this period — not a
 *  daily score" put the word *day* on a months-long number, and set it beside
 *  the "Is today okay for…?" muhurtam board as if the two answered the same
 *  question. This is the same 0–100 ladder, read in the period noun
 *  (காலகட்டம் / "period") and on the engine's own three bands, so word, colour
 *  and the area's detail prose can never disagree about one number. */
export function getLifeAreaVerdict(score: number, lang: "ta" | "en"): ScoreVerdict {
  const color = lifeAreaBandColor(score);
  const phrase = (label: string) => verdictPhrase("lifeArea", label, lang) ?? "";
  if (score >= LIFE_AREA_STRONG) return { verdict: phrase("EXCELLENT"), tone: "high", color };
  if (score >= LIFE_AREA_STEADY) return { verdict: phrase("MIXED"), tone: "mid", color };
  return { verdict: phrase("CAUTION"), tone: "low", color };
}

/** Headline verdict from the backend label — the label already encodes the
 *  canonical thresholds AND the chandrashtama cap, so word/colour can never
 *  contradict the engine. Falls back to score-only when label is absent
 *  (e.g. tomorrow-preview rows from older cached payloads). */
export function getScoreVerdictFromGuidance(
  label: string | null | undefined,
  score: number,
  lang: "ta" | "en",
): ScoreVerdict {
  // Verdict words come from the shared verdict lexicon (C-5) so Today matches
  // Porutham / compatibility. Tones and colours are unchanged.
  const phrase = (l: string) => verdictPhrase("daily", l, lang) ?? "";
  switch (label) {
    case "STRONG_SUPPORT":
      return {
        verdict: phrase("STRONG_SUPPORT"),
        tone: "high",
        color: score >= 70 ? SCORE_STRONG : SCORE_GOOD,
      };
    case "GOOD":
      return {
        verdict: phrase("GOOD"),
        tone: "high",
        color: score >= 70 ? SCORE_STRONG : SCORE_GOOD,
      };
    case "BALANCED":
      return {
        verdict: phrase("BALANCED"),
        tone: "mid",
        color: SCORE_FAIR,
      };
    case "RESTORATIVE":
      return {
        verdict: phrase("RESTORATIVE"),
        tone: "low",
        color: SCORE_WEAK,
      };
    case "CAUTION":
      return {
        verdict: phrase("CAUTION"),
        tone: "low",
        color: SCORE_WEAK,
      };
    default:
      return getScoreVerdict(score, lang);
  }
}