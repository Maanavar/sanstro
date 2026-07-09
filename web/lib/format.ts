export {
  todayIso,
  addDays,
  formatDateLabel,
  formatClockLabel,
  formatDateTimeLabel,
} from "@vinaadi/shared/utils/format";
import { scoreTonePct } from "@vinaadi/shared/utils/score";

export interface ScoreBand {
  label: string;
  tone: "high" | "mid" | "low";
}

export const SCORE_HIGH = "var(--color-score-high, #5C7654)";
export const SCORE_MID = "var(--color-score-mid, #B85A2C)";
export const SCORE_LOW = "var(--color-score-low, #A8482F)";

// ── Four-band score palette ─────────────────────────────────────────────────
// Product-set thresholds (2026-07): ≥70 dark green · 60–70 light green ·
// 50–60 gold · <50 red. These are the canonical colors for every 0–100 daily
// score surface — dots, tiles, rings, dials, avatars. Kept as CSS custom
// properties (with hard fallbacks for the Classic warm theme) so the Nova dark
// theme can retune them in one place.
export const SCORE_STRONG = "var(--color-score-strong, #3F7A4E)"; // ≥70 dark green
export const SCORE_GOOD = "var(--color-score-good, #6B9E5E)"; //   60–70 light green
export const SCORE_FAIR = "var(--color-score-fair, #C8892E)"; //   50–60 orange/gold
export const SCORE_WEAK = "var(--color-score-weak, #C04530)"; //   <50 red

/** The one canonical 0–100 → color map. Four discrete bands, product-set:
 *  ≥70 dark green (strong), 60–70 light green (good), 50–60 gold (fair),
 *  <50 red (weak). Use for every score dot/tile/ring/dial. */
export function scoreBandColor(score: number): string {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 70) return SCORE_STRONG;
  if (s >= 60) return SCORE_GOOD;
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
 *  colour palette (≥70 strong · 60–70 supportive · 50–60 steady · <50 caution)
 *  so a score's label, colour and "needs care" flag never disagree. */
export function getScoreBand(score: number): ScoreBand {
  if (score >= 70) return { label: "strong day", tone: "high" };
  if (score >= 60) return { label: "supportive", tone: "high" };
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
 *  four-band palette (green ≥60 · gold 50–60 · red <50) so the dial's word and
 *  its colour always agree. */
export function getScoreVerdict(score: number, lang: "ta" | "en"): ScoreVerdict {
  const color = scoreBandColor(score);
  if (score >= 60) return { verdict: lang === "ta" ? "நல்ல நாள்" : "Good day", tone: "high", color };
  if (score >= 50) return { verdict: lang === "ta" ? "பரவாயில்லை" : "An okay day", tone: "mid", color };
  return { verdict: lang === "ta" ? "ஜாக்கிரதை" : "Take care", tone: "low", color };
}