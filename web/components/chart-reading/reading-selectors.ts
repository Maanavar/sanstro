// Pure selection logic for the Story view (FTR-09..15). No React, no copy that
// is not built from chart fields — each function takes the payload and returns
// the few facts a chapter shows, so the triage rules are unit-testable on
// their own (reading-selectors.test.ts).
//
// The rule every function here answers to (docs/FULL_READING_STORY_MODE_PLAN_2026-10-04.md
// §3.1): one idea per card, verdict before reason before mechanics, and the
// whole Story view under a visible-word budget. Nothing is dropped from the
// payload — what a chapter does not show stays one toggle away in the
// Astrologer view.

import {
  displayName as yogaDisplayName,
  doshamStanding,
  isAdverseYoga,
  isRunningInDasha,
  yogaReadingStatus,
  yogaStanding,
  type StandingTone,
} from "@vinaadi/shared/yogaDisplay";

import { gocharaGrade, type GocharaGrade } from "@vinaadi/shared/api/transits";
import { doshamResidual } from "@vinaadi/shared/doshamReckoning";
import { CHAPTER_ORDER, houseTheme, type ChapterId } from "@vinaadi/shared/reading";

import { rasiNumber } from "@/lib/chart-utils";
import type { Lang } from "@/lib/i18n";
import type {
  BiText,
  ChartDoshamInsight,
  ChartExplanationData,
  ChartExplanationFacet,
  ChartExplanationPlanet,
  ChartExplanationStory,
  ChartYogaInsight,
  PeyarchiEvent,
} from "@/lib/types";

import { displayPlanet, houseGroupFor, ordinalSuffix } from "./reading-helpers";

export { CHAPTER_ORDER, CHAPTER_TITLES, houseTheme, lagnaLordPlacement } from "@vinaadi/shared/reading";
export type { ChapterId } from "@vinaadi/shared/reading";

export function nextChapter(id: ChapterId): ChapterId | null {
  const index = CHAPTER_ORDER.indexOf(id);
  return index >= 0 && index < CHAPTER_ORDER.length - 1 ? CHAPTER_ORDER[index + 1] : null;
}

const pick = (text: BiText, lang: Lang) => (lang === "ta" ? text.ta : text.en);

/** "2nd house" / "2-ஆம் வீடு". */
export function houseOrdinal(house: number, lang: Lang): string {
  return lang === "ta" ? `${house}-ஆம் வீடு` : `${ordinalSuffix(house)} house`;
}

// ── Headline ────────────────────────────────────────────────────────────────

/**
 * The one sentence at the top of the reading. Built from the running
 * mahadasa lord and the house it occupies at birth — so it reads differently
 * for every chart (the humanization audit's anti-Barnum test), and it names
 * the single fact that most shapes "what is my life about right now".
 */
export function storyHeadline(explanation: ChartExplanationData | null | undefined, lang: Lang): string | null {
  // FTR-21: the server's headline when it sent one (same template, one source).
  const server = explanation?.story?.headline;
  if (server) return pick(server, lang);
  const maha = explanation?.currentActivation?.activeLords?.find((lord) => lord.level === "MAHADASHA");
  if (!maha) return null;
  const name = displayPlanet(maha.lord, lang);
  const theme = houseTheme(maha.natalHouseFromLagna, lang);
  return lang === "ta"
    ? `இப்போது ${name} தசை நடக்கிறது; பிறப்பில் ${name} உங்கள் ${maha.natalHouseFromLagna}-ஆம் வீட்டில் (${theme}) அமைந்துள்ளது.`
    : `${name} sets the tone now: its dasa is running, from your ${houseOrdinal(maha.natalHouseFromLagna, lang)} — ${theme}.`;
}

// ── Chapter 1 · Who you are ────────────────────────────────────────────────

export type HouseTone = "pillar" | "growth" | "care" | "other";

/** The house-group tint for the chart map. Lagna (1st) reads as a pillar. */
export function houseTone(house: number): HouseTone {
  const group = houseGroupFor(house);
  if (group === "kendra") return "pillar";
  if (group === "trikona") return "growth";
  if (group === "dusthana") return "care";
  return "other";
}

// ── Chapter 2 · Your nine planets ──────────────────────────────────────────

/**
 * Facets that never lead a planet's "why" in the Story view:
 * - `placement` is the meaning line already;
 * - `activation` is the "Active now" badge;
 * - `transit` belongs to Chapter 3 (a *now* fact, not a *who* fact);
 * - `remedy` belongs to the remedies card (say it once);
 * - `avastha`, `lordship` and a neutral `nakshatra` are mechanics.
 */
const WHY_EXCLUDED = new Set<ChartExplanationFacet["key"]>(["placement", "activation", "transit", "remedy", "avastha", "lordship"]);

const TONE_RANK: Record<ChartExplanationFacet["tone"], number> = { CAUTION: 0, BOOST: 1, NEUTRAL: 2 };

/**
 * The (at most two) lines that explain a planet's verdict.
 *
 * `synthesis` leads when the engine wrote one — it exists only where the
 * planet's signals conflict, and reconciling them is exactly the "why". After
 * it, CAUTION before BOOST: the line that tempers a verdict matters more than
 * the one that repeats it. NEUTRAL facets are descriptive and stay in the
 * full detail list.
 */
export function whyFacets(
  planet: Pick<ChartExplanationPlanet, "facets"> & { graha?: string },
  story?: ChartExplanationStory | null,
): ChartExplanationFacet[] {
  const facets = planet.facets ?? [];
  // FTR-21: the server's pick when it sent one; the rule below is its mirror.
  const server = story?.planets.find((p) => p.graha === planet.graha);
  if (server) return server.whyFacetKeys.flatMap((key) => facets.filter((f) => f.key === key).slice(0, 1));
  const synthesis = facets.filter((f) => f.key === "synthesis");
  const rest = facets
    .filter((f) => f.key !== "synthesis" && !WHY_EXCLUDED.has(f.key) && f.tone !== "NEUTRAL")
    .map((f, index) => ({ f, index }))
    .sort((a, b) => TONE_RANK[a.f.tone] - TONE_RANK[b.f.tone] || a.index - b.index)
    .map(({ f }) => f);
  return [...synthesis, ...rest].slice(0, 2);
}

/** Does this planet lead a running dasa period? (engine's own activation facet) */
export function isActiveNow(
  planet: Pick<ChartExplanationPlanet, "facets"> & { graha?: string },
  story?: ChartExplanationStory | null,
): boolean {
  const server = story?.planets.find((p) => p.graha === planet.graha);
  if (server) return server.activeNow;
  return (planet.facets ?? []).some((f) => f.key === "activation" && f.tone === "BOOST");
}

/** The traditional order the nine are read in. */
export const GRAHA_ORDER = ["SUN", "MOON", "MARS", "MERCURY", "JUPITER", "VENUS", "SATURN", "RAHU", "KETU"];

export function orderedPlanets<T extends { graha: string }>(planets: T[]): T[] {
  return [...planets]
    .filter((p) => GRAHA_ORDER.includes(p.graha))
    .sort((a, b) => GRAHA_ORDER.indexOf(a.graha) - GRAHA_ORDER.indexOf(b.graha));
}

/** `mutual`: the two planets aspect each other — drawn once, arrowheads at both ends. */
export type AspectLine = { from: string; to: string; fromRasi: number; toRasi: number; mutual?: boolean };

/**
 * Natal aspects touching the selected planet, as rasi-to-rasi lines for the
 * chart overlay. Only the selected planet's lines are drawn: all twelve at
 * once is a hairball nobody can read.
 */
export function aspectLinesFor(
  graha: string | null,
  aspects: ChartExplanationData["aspects"],
  planets: { graha: string; rasi: number }[],
): AspectLine[] {
  if (!graha) return [];
  const rasiOf = new Map(planets.map((p) => [p.graha, p.rasi]));
  const lines = aspects
    .filter((a) => a.sourcePlanet === graha || a.targetPlanet === graha)
    .flatMap((a) => {
      const fromRasi = rasiOf.get(a.sourcePlanet);
      const toRasi = rasiOf.get(a.targetPlanet);
      return fromRasi && toRasi && fromRasi !== toRasi ? [{ from: a.sourcePlanet, to: a.targetPlanet, fromRasi, toRasi }] : [];
    });
  // A mutual 7th (or any two-way pair) would draw a solid and a dashed line on
  // the same path; keep the outgoing one and mark it mutual.
  const key = (a: string, b: string) => `${a}>${b}`;
  const all = new Set(lines.map((l) => key(l.from, l.to)));
  return lines
    .filter((l) => !(l.to === graha && all.has(key(graha, l.from))))
    .map((l) => (all.has(key(l.to, l.from)) ? { ...l, mutual: true } : l));
}

// ── Chapter 3 · Running now ────────────────────────────────────────────────

/** 0..1 share of a period already elapsed on `today` (clamped). */
export function periodProgress(startDate: string, endDate: string, today: Date): number {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(1, Math.max(0, (today.getTime() - start) / (end - start)));
}

/** Whole days from `today` to an ISO date (negative when already past). */
export function daysUntil(isoDate: string, today: Date): number {
  const target = Date.parse(`${isoDate.slice(0, 10)}T00:00:00`);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - base) / 86_400_000);
}

const GRADE_TONE: Record<GocharaGrade, "good" | "care" | "steady"> = {
  SUPPORTIVE: "good",
  MIXED: "steady",
  NEEDS_CARE: "care",
};

/**
 * Guru from the Janma Rasi, as a tone (colour + icon + word). Reads the shared
 * doctrine table (`gocharaGrade`, packages/shared/src/api/transits.ts — rulings
 * D2/D3, 2026-10-04) so web, mobile and every card grade one transit the same
 * way. 1/3/4/10 "Mixed" is Vinaadi's presentation grade over a classical
 * non-supportive set, and is documented as such there.
 */
export function guruTone(houseFromMoon: number): "good" | "care" | "steady" {
  return GRADE_TONE[gocharaGrade("JUPITER", houseFromMoon) ?? "MIXED"];
}

/** Sani from the Janma Rasi: supportive only in 3/6/11, care everywhere else (D2). */
export function saniTone(houseFromMoon: number): "good" | "care" | "steady" {
  return GRADE_TONE[gocharaGrade("SATURN", houseFromMoon) ?? "MIXED"];
}

/** Natal planets in the houses a transit graha aspects (whole-sign, from Lagna). */
export function touchedByTransit(
  graha: "JUPITER" | "SATURN",
  transitHouseFromLagna: number,
  planets: { graha: string; houseFromLagna: number }[],
): string[] {
  const offsets = graha === "JUPITER" ? [4, 6, 8] : [2, 6, 9];
  const houses = offsets.map((offset) => ((transitHouseFromLagna - 1 + offset) % 12) + 1);
  return orderedPlanets(planets.filter((p) => houses.includes(p.houseFromLagna))).map((p) => p.graha);
}

// ── Yoga ranking (ruling D4, 2026-10-04; revised by the O-25 ruling, 2026-10-05) ──
//
// "Top 3" means the three most consequential yogas in THIS chart, never the
// three most famous names, so there is no name-based hierarchy anywhere here.
// The two lists answer different questions, so their keys differ (O-25):
//   Lasting gifts  — fully formed → natal strength (grade, then fewer
//                    cancellation/affliction factors). Today's dasa does not
//                    decide a lifelong ranking: activation is a badge here,
//                    never a key.
//   Running now    — fully formed → activation (a gate: not activated = not
//                    listed; then the Maha/Antar tier) → natal strength → the
//                    engine's activation score.
// Then, in both lists, `structuralReach` (houses the forming grahas rule, then
// occupy, then Lagna involvement) — a Vinaadi product tie-break, not classical
// doctrine. The server computes it (`_chart_build._structural_reach`); it is
// compared here, never re-derived. Without it, ties would fall to the engine's
// detection order, which is a hidden name hierarchy.
// ADHI_RAJA_GRADE never enters either list until its Saravali source is
// verified in print (O-25 ruling); it stays in the Astrologer view.

const STRENGTH_RANK: Record<string, number> = { STRONG: 0, PARTIAL: 1, WEAK: 2 };
const TIER_RANK: Record<string, number> = { STRONG: 0, MODERATE: 1, NONE: 2 };
const NOT_IN_TOP = new Set(["ADHI_RAJA_GRADE"]);

function activationRank(y: ChartYogaInsight): number {
  if (y.activationTier) return TIER_RANK[y.activationTier] ?? 2;
  return isRunningInDasha({ ...y, isCancelled: false }) ? 1 : 2;
}

function byNatal(a: ChartYogaInsight, b: ChartYogaInsight): number {
  return (
    (STRENGTH_RANK[a.strength] ?? 2) - (STRENGTH_RANK[b.strength] ?? 2) ||
    (a.cancellationFactors?.length ?? 0) - (b.cancellationFactors?.length ?? 0) ||
    (b.structuralReach ?? 0) - (a.structuralReach ?? 0)
  );
}

function byActive(a: ChartYogaInsight, b: ChartYogaInsight): number {
  return (
    activationRank(a) - activationRank(b) ||
    (STRENGTH_RANK[a.strength] ?? 2) - (STRENGTH_RANK[b.strength] ?? 2) ||
    (a.cancellationFactors?.length ?? 0) - (b.cancellationFactors?.length ?? 0) ||
    (b.structuralReach ?? 0) - (a.structuralReach ?? 0) ||
    (b.activationScore ?? 0) - (a.activationScore ?? 0)
  );
}

const isValidBenefic = (y: ChartYogaInsight) =>
  !isAdverseYoga(y.name) && !NOT_IN_TOP.has(y.name) && yogaReadingStatus(y) === "PRESENT";

/** `top_natal_yogas`: the strongest lasting benefic yogas in the birth chart. */
export function topNatalYogas(yogas: ChartYogaInsight[], limit = 3): ChartYogaInsight[] {
  return yogas.filter(isValidBenefic).sort(byNatal).slice(0, limit);
}

/** `top_active_yogas`: the strongest benefic yogas the running dasa actually activates. */
export function topActiveYogas(yogas: ChartYogaInsight[], limit = 3): ChartYogaInsight[] {
  return yogas.filter((y) => isValidBenefic(y) && activationRank(y) < 2).sort(byActive).slice(0, limit);
}

/**
 * Yogas the running period switches on — the *timing* axis. "Active" is
 * reserved for this axis app-wide (2026-09-23 status-axes ruling); the
 * birth-chart standing lives in Chapter 4.
 */
export function runningYogas(yogas: ChartYogaInsight[], lang: Lang, story?: ChartExplanationStory | null): string[] {
  return (story ? story.topActiveYogas : topActiveYogas(yogas).map((y) => y.name)).map((name) => yogaDisplayName(name, lang));
}

/** The server's picks, resolved back to the payload rows (FTR-21). */
function byNames<T extends { name: string }>(rows: T[], names: string[]): T[] {
  return names.flatMap((name) => rows.filter((row) => row.name === name).slice(0, 1));
}

// ── Chapter 4 · Gifts & care ───────────────────────────────────────────────

export type PatternChip = { name: string; label: string; tone: StandingTone; effect: string };

/**
 * The summary lines the Family page's §4 "Chart strengths" / "Watch-outs"
 * cards print (FTR-18): birth-time conditions are left out (they have their
 * own cards there) and each card stops at HIGHLIGHT_CAP. Both §4 and Chapter 4
 * read this, so every line is said exactly once: §4 the first lines, the
 * chapter's "more notes" the rest.
 */
export const HIGHLIGHT_CAP = 5;

export function highlightLines(items: BiText[]): BiText[] {
  return items.filter((it) => !it.en.startsWith("Birth-time condition —") && !it.ta.startsWith("பிறப்பு நேர நிலை —"));
}

/**
 * Chapter 4's "Key yogas": `topNatalYogas` (D4), labelled with the same
 * `yogaStanding` word the §7 chips use, so a yoga never reads "Strong" here
 * and "Mild" there. A chart routinely carries 28-30 yoga rows; the rest stay
 * in the Astrologer view.
 */
export function giftPatterns(yogas: ChartYogaInsight[], lang: Lang, story?: ChartExplanationStory | null): PatternChip[] {
  return (story ? byNames(yogas, story.topNatalYogas) : topNatalYogas(yogas)).map((y) => {
    const standing = yogaStanding(y, lang);
    return {
      name: yogaDisplayName(y.name, lang),
      label: standing.label,
      tone: standing.tone,
      effect: (lang === "ta" ? y.effectTa : y.effectEn) ?? "",
    };
  });
}

/**
 * Doshams that still need care, plus adverse yogas the chart actually has —
 * the "handle with care" column. A mitigated dosham with a mild residual is
 * good news and stays in the full panel; one whose strong formation was only
 * just offset (residual MODERATE, DD-17) is still a care item. Mirror of
 * `reading_story._dosham_needs_care`.
 */
export function carePatterns(
  doshams: ChartDoshamInsight[],
  yogas: ChartYogaInsight[],
  lang: Lang,
  story?: ChartExplanationStory | null,
): PatternChip[] {
  if (story) {
    // FTR-21: the server picked the rows; the chip words stay the shared ones.
    return story.carePatterns.flatMap(({ name, kind }) => {
      if (kind === "DOSHAM") {
        const d = byNames(doshams, [name])[0];
        if (!d) return [];
        const standing = doshamStanding(d, lang);
        return [{ name: yogaDisplayName(d.name, lang), label: standing.label, tone: standing.tone, effect: "" }];
      }
      const y = byNames(yogas, [name])[0];
      if (!y) return [];
      const standing = yogaStanding(y, lang);
      return [{ name: yogaDisplayName(y.name, lang), label: standing.label, tone: standing.tone, effect: (lang === "ta" ? y.effectTa : y.effectEn) ?? "" }];
    });
  }
  const fromDoshams = doshams
    .filter((d) => d.isPresent && (!d.isCancelled || doshamResidual(d) === "MODERATE"))
    .map((d) => ({ standing: doshamStanding(d, lang), name: yogaDisplayName(d.name, lang), effect: "" }));
  // A formed-and-cancelled adverse yoga (Kemadruma-bhanga, say) is good news
  // and reads "Cancelled" — it belongs in the full panel, not under "watch".
  const fromYogas = yogas
    .filter((y) => isAdverseYoga(y.name) && yogaReadingStatus(y) === "PRESENT")
    .map((y) => ({ standing: yogaStanding(y, lang), name: yogaDisplayName(y.name, lang), effect: (lang === "ta" ? y.effectTa : y.effectEn) ?? "" }))
    .filter(({ standing }) => standing.tone === "caution" || standing.tone === "mid");
  return [...fromDoshams, ...fromYogas]
    .sort((a, b) => (a.standing.tone === "caution" ? 0 : 1) - (b.standing.tone === "caution" ? 0 : 1))
    .slice(0, 3)
    .map(({ standing, name, effect }) => ({ name, label: standing.label, tone: standing.tone, effect }));
}

// ── Chapter 5 · What's coming ──────────────────────────────────────────────

export type UpcomingMove = {
  planet: string;
  date: string;
  fromRasi: number | null;
  toRasi: number | null;
  houseFromMoon: number;
  houseFromLagna: number;
  saniCycleAfter: string | null;
  explanation: BiText | null;
};

/**
 * The next slow-planet sign changes, soonest first. Prefers the explanation
 * payload (it carries a reading per event); falls back to the bare peyarchi
 * feed. Rasi names arrive as strings in either shape, so they resolve to
 * numbers here — the timeline renders artwork and the reader's-language name
 * from the number, never the raw code (FTR-02).
 */
export function upcomingMoves(
  explanation: ChartExplanationData | null | undefined,
  feed: PeyarchiEvent[],
): UpcomingMove[] {
  const fromExplanation = explanation?.peyarchi?.events ?? [];
  const moves: UpcomingMove[] = fromExplanation.length
    ? fromExplanation.map((e) => ({
        planet: e.planet,
        date: e.eventDate,
        fromRasi: rasiNumber(e.fromRasi),
        toRasi: rasiNumber(e.toRasi),
        houseFromMoon: e.houseFromMoon,
        houseFromLagna: e.houseFromLagna,
        saniCycleAfter: e.saniCycleAfter,
        explanation: e.explanation,
      }))
    : feed.map((e) => ({
        planet: e.planet,
        date: e.peyarchiDateLocal,
        fromRasi: rasiNumber(e.fromRasi),
        toRasi: rasiNumber(e.toRasi),
        houseFromMoon: e.impactFromMoon,
        houseFromLagna: e.impactFromLagna,
        saniCycleAfter: e.saniCycleAfter,
        explanation: null,
      }));
  return [...moves].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
}
