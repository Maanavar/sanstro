"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowRight, Bell, CalendarDays, CalendarPlus, ChevronDown, Leaf, Moon, MoonStar, Sparkles, Star, Sun, Target, TrendingUp, X, type LucideIcon } from "lucide-react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { addDays, formatClockLabel, formatClockRange, formatDateLabel, getLifeAreaVerdict, getScoreVerdictFromGuidance } from "@/lib/format";
import type { GlossaryKey } from "@/lib/glossary";
import { t, tLang, tNakshatra, tTithi } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import {
  dt,
  EMOTIONAL_WEATHER,
  FIRST_RESULT_GUIDE,
  LIFE_FOCUS,
  TODAY_HERO,
  TODAY_TIMINGS,
  weatherLabel,
} from "@/lib/dashboard-i18n";
import { gowriCategoryLabel, gowriPurposeLabel } from "@/lib/gowri";
import { NO_FOCUS, type AppliedFocus } from "@/lib/life-focus";
import { hourInZone, minutesOfDayInZone, timeOnDateToMs } from "@/lib/tz";
import {
  clearSegments,
  findSecondaryAbhijitWindow,
  pickFeaturedWindow,
  pickRecommendedWindow,
  spansOverlap,
  type TimingSpan,
} from "@/lib/today-windows";
import type {
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  LifeAreasResponseData,
  LifeMode,
  NotificationPreferenceData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  PeyarchiEvent,
  SaniCycleData,
  WeekAheadData,
} from "@/lib/types";

import { NovaClampedText, NovaScoreDial, Reveal, StatusLive, type StatusMessage } from "./dashboard-ui-nova";
import { festivalTags, limbNow } from "./dashboard-calendar-shared";
import { bandPhrase, bandTone } from "@/lib/reasoning";
import { MiniMoonGlyph } from "./celestial-glyph-nova";
import { PendingPlaceholder } from "./pending-placeholder-nova";
import { HeroSkyBackdrop, DeepDiveOrbitGlyph } from "./celestial-ambient-nova";
import { lunarSpecialTithiMeta, moonPhaseFromTithi } from "@/lib/lunar";
import { useStreak } from "@/hooks/useStreak";
import { StreakChip } from "./streak-chip";
import { useEveningPreview } from "@/hooks/useEveningPreview";
import type { MemberChart } from "@/hooks/useFamilyData";

import { Card, Kicker } from "./ui";
import { downloadJadhagamPdf } from "./dashboard-personal-shared";
import { GlossaryTerm } from "./glossary-term";
import { DashboardTodayRibbonNova } from "./dashboard-today-ribbon-nova";
import { DashboardTodayActivityBoardNova } from "./dashboard-today-activity-board-nova";
import {
  DashboardTodayFamilyRemedyRowNova,
  DashboardTodayLifeAreasDasaRowNova,
  DashboardTodayQuickLinksNova,
} from "./dashboard-today-glance-nova";
import { DashboardOneMinuteReading } from "./dashboard-one-minute-reading";
import { FocusNudgeStrip, LifeModeBadge } from "./life-mode-picker";

/**
 * Hash navigation scrolls to its target, but leaves keyboard focus on the
 * activated link. Move focus after the browser has completed its native hash
 * navigation so a keyboard or screen-reader user arrives at the explanation.
 */
function focusDeepDiveAfterHashNavigation() {
  window.setTimeout(() => {
    document.getElementById("nova-deep-dive")?.focus({ preventScroll: true });
  }, 0);
}

/**
 * Nova "Today" tab — decision layer only (design 8a). Every field below
 * comes from the exact same hooks/data Classic's Today tab
 * (dashboard-personal-tab.tsx) already receives from dashboard-workspace.tsx;
 * this is a re-layout, not new computation, except the small client-derived
 * pieces design 8a flags [NEW] (countdown, NOW marker, Horai chip — Horai
 * itself is real backend data via panchangam.hora, just not looked up
 * anywhere before this).
 *
 * The Deep Dive section covers the full set of Classic's detail panels
 * (see docs/DASHBOARD_UI_REVAMP_PLAN.md §8, Deep Dive completeness pass):
 * chart validation chip, Chart Context/Guidance/Gochar two-col, Dasa-Bhukti-
 * Antaram strip, activity timing month browser, planet table, chart
 * explanation, vargas, shadbala, the three alternate dashas, classical
 * timing, nakshatra card, morning guidance settings pointer (the opt-in
 * itself lives in Settings -> Notifications), Prasna/Horary trigger,
 * and PDF download — all one click away via "Open Chart & Explanations".
 */

export type DashboardTodayTabNovaProps = {
  lang: Lang;
  userMode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
  activeLifeMode?: LifeMode;
  /** Life focus, Phase 0 (docs/LIFE_FOCUS_PLAN_2026-09-22.md, T0): the
   *  masthead chip opens the picker; the 60-day strip asks to keep or change. */
  onOpenFocusPicker?: () => void;
  showFocusNudge?: boolean;
  onKeepFocus?: () => Promise<void>;
  onDismissFocusNudge?: () => void;
  /** Life focus, Phase 2 (T1–T5): what to pin and lift. The caller passes
   *  NO_FOCUS for a chart that is not the reader's own (D4). */
  lifeFocus?: AppliedFocus;
  birthDisplayName: string;
  selectedDate: string;
  todayDate: string;
  personalMemberChart: Pick<MemberChart, "memberId" | "displayName"> | null;
  personalChartSummary: ChartSummaryData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  personalSani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  weekAhead: WeekAheadData | null;
  familyAggregate: FamilyAggregateData | null;
  /** DXA-03: data still on its way. While true, cards show placeholders
   *  instead of their empty-state copy. */
  personalPending?: boolean;
  /** DXA-07: everything on this pane is still the previously selected day's,
   *  held on screen while the newly selected day loads. The pane dims and the
   *  day it describes is read from the data, not from `selectedDate`. */
  showingPreviousDay?: boolean;
  familyPending?: boolean;
  remedyMemberCharts?: Array<Pick<MemberChart, "memberId" | "displayName" | "dailyGuidance">>;
  lifeAreas?: LifeAreasResponseData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  /** 3-day window starting at selectedDate (today..+2) — reused here purely
   *  to read tomorrow's item for the evening preview swap, no extra fetch. */
  dailyGuidanceRange?: DailyGuidanceRangeData | null;
  /** IANA timezone the panchangam was computed for — every "now" comparison
   *  on this surface happens in this zone, not the browser's (DASH-01). */
  panchangamTimezone?: string | null;
  /** Bundle sections the backend could not compute (DASH-02) — non-empty
   *  shows the "some sections couldn't load" retry chip. */
  bundleSectionErrors?: Record<string, string>;
  /** Re-runs the day bundle fetch (DASH-02 retry affordance). */
  onRetryBundle?: () => void;
  onGoToFamily?: () => void;
  onGoToJournal?: () => void;
  onGoToCalendar?: () => void;
  onGoToLifeAreas?: () => void;
  /** Opens the "Family & Charts" tab (the chart/dasa deep-dive home). Renamed
   *  from the misleading `onGoToTransits` — there is no `transits` tab (IA
   *  audit 2026-07-22, Phase 5). */
  onGoToChart?: () => void;
  /** Opens the "Family & Charts" tab, where the full chart engine now lives. */
  onGoToCharts?: () => void;
  onOpenAskVinaadi: () => void;
  onOpenNotificationSettings?: () => void;
  /** Quick Links row (homepage redesign 2026-07-24) — true when no birth
   *  profile is saved yet, gray out the chart-dependent tiles (Compatibility,
   *  Activity Timing, Numerology), matching the Tools tab's own gating. */
  needsProfile?: boolean;
  onOpenChartGen?: () => void;
  onOpenMuhurta?: () => void;
  onOpenCompatibility?: () => void;
  onOpenActivityTiming?: () => void;
  onOpenRasipalan?: () => void;
  onOpenNumerology?: () => void;
  onGoToExplore?: () => void;
  onGoToAllTools?: () => void;
};

/** Greeting keyed to the hour in the panchangam timezone (DASH-01) so it
 *  agrees with the hero sun/moon glyph and the ribbon's NOW marker. */
function greetingWord(lang: Lang, hour: number): string {
  if (lang === "ta") {
    if (hour < 12) return "காலை வணக்கம்";
    if (hour < 17) return "மதிய வணக்கம்";
    return "மாலை வணக்கம்";
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Human label for a guidance-window `type` ("RAHU_KALAM" -> "Rahu Kalam").
 *  Known kalams get real Tamil names; anything else is prettified English. */
function windowTypeLabel(type: string, lang: Lang): string {
  const known: Array<[string, { en: string; ta: string }]> = [
    ["RAHU", { en: "Rahu Kalam", ta: "ராகு காலம்" }],
    ["YAMA", { en: "Yamagandam", ta: "யமகண்டம்" }],
    ["KULIGAI", { en: "Kuligai", ta: "குளிகை" }],
    ["GULIKA", { en: "Kuligai", ta: "குளிகை" }],
  ];
  const hit = known.find(([key]) => type.toUpperCase().includes(key))?.[1];
  if (hit) return lang === "ta" ? hit.ta : hit.en;
  return type
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function windowTypeGlossary(type: string): GlossaryKey | null {
  const normalized = type.toUpperCase();
  if (normalized.includes("RAHU")) return "rahuKalam";
  if (normalized.includes("YAMA")) return "yamagandam";
  if (normalized.includes("KULIGAI") || normalized.includes("GULIKA")) return "kuligai";
  if (normalized.includes("ABHIJIT")) return "abhijit";
  if (normalized.includes("HORA")) return "hora";
  if (normalized.includes("NERAM") || normalized.includes("GOWRI")) return "nallaNeram";
  return null;
}

/**
 * Finding 7 (hero review 2026-09-04) — say so when Abhijit runs into a kala.
 *
 * Abhijit is ~48 minutes fixed around solar noon and Friday's Rahu Kalam is the
 * 4th of eight day-parts, so the two collide structurally, not rarely — 24 of
 * Abhijit's 49 minutes on the reviewed day. The row called it "auspicious for
 * anyone, whatever their chart" with no qualifier, one card away from a
 * recommendation whose whole argument is "clear of Rahu Kalam, Yamagandam and
 * Kuligai". Two contradictory instructions from one panel.
 *
 * The note states the app's already-implemented position (owner ruling
 * 2026-08-23: an overlapping window is never promoted) and names the clear
 * part, rather than picking new doctrine. Whether Abhijit *overrides* the kalas
 * — genuinely contested, and many Tamil families say it does not — is queued in
 * docs/ASTROLOGER_REVIEW_QUEUE.md.
 */
function abhijitOverlapNote(
  abhijit: TimingSpan,
  avoidKalas: Array<{ label: string; start: string; end: string }>,
  lang: Lang,
): string {
  const hits = avoidKalas.filter((k) => spansOverlap(abhijit, k));
  if (hits.length === 0) return "";
  const names = hits.map((k) => k.label).join(lang === "ta" ? ", " : ", ");
  const clear = clearSegments(abhijit, hits);
  if (clear.length === 0) {
    return dt(TODAY_TIMINGS.abhijitFullyCovered, lang).replace("%1$s", names);
  }
  const clearText = clear
    .map((seg) => formatClockRange(seg.start, seg.end, lang))
    .join(" · ");
  return dt(TODAY_TIMINGS.abhijitOverlap, lang).replace("%1$s", names).replace("%2$s", clearText);
}

function formatDuration(ms: number, lang: Lang): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return lang === "ta" ? `${m} நிமிடம்` : `${m}m`;
  if (m <= 0) return lang === "ta" ? `${h} மணி` : `${h}h`;
  return lang === "ta" ? `${h}மணி ${m}நிமிடம்` : `${h}h ${m}m`;
}

function FirstResultGuide({
  lang,
  action,
}: {
  lang: Lang;
  action: DailyGuidanceData["actionSuggestion"] | null | undefined;
}) {
  const items = [
    { title: dt(FIRST_RESULT_GUIDE.scoreTitle, lang), body: dt(FIRST_RESULT_GUIDE.scoreBody, lang) },
    { title: dt(FIRST_RESULT_GUIDE.avoidTitle, lang), body: dt(FIRST_RESULT_GUIDE.avoidBody, lang) },
    {
      title: dt(FIRST_RESULT_GUIDE.actionTitle, lang),
      body: action ? tLang(action, lang) : dt(FIRST_RESULT_GUIDE.actionFallback, lang),
    },
  ];
  return (
    <Card style={{
      borderColor: "var(--color-border-strong)",
      padding: "var(--space-4) var(--space-5)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-accent-strong)" }}>
          {dt(FIRST_RESULT_GUIDE.heading, lang)}
        </h2>
        <a href="/learn/vedic-vs-western" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent-secondary)", fontWeight: 700, textDecoration: "none" }}>
          {dt(FIRST_RESULT_GUIDE.learnLink, lang)}
          <ArrowRight size={12} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "middle", marginLeft: "var(--space-1)" }} />
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-3)" }}>
        {items.map((item) => (
          <div key={item.title} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 800, color: "var(--color-text-strong)" }}>
              {item.title}
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-muted)" }}>
              {item.body}
            </p>
          </div>
        ))}
      </div>
      <a href="#nova-deep-dive" onClick={focusDeepDiveAfterHashNavigation} style={{ alignSelf: "flex-start", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 700, textDecoration: "none" }}>
        {dt(FIRST_RESULT_GUIDE.whyTrail, lang)}
        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "middle", marginLeft: "var(--space-1)" }} />
      </a>
    </Card>
  );
}

/* ── Today's hero while the day's data is on its way (DXA-05) ──────────────
   Loaded, the hero is six blocks tall: greeting, name, briefing, the weather
   chips, the best-window card, and — in the two side columns — the score dial
   and the timing rail. While `personalPending` is true only the first two
   exist, so the hero rendered ~70px short of where it settles and then grew
   under the reader, taking Quick Links and every row below it down with it.

   Each piece below stands in the slot of the block it waits for, in that
   block's own container (`.nova-hero-action`, the score card's padding, the
   rail's two cards), so the height held is the hero's own shape. A single
   reserved constant would have to be re-measured at every width and re-tuned
   whenever the hero changes; a shape does not.

   All of it is `aria-hidden`: the wait is announced once, by the lede's
   PendingPlaceholder, which owns the live region. */
function HeroSkelLine({ w, h = 13, radius = "var(--radius-sm)" }: { w: string; h?: number; radius?: string }) {
  return <span className="skel" style={{ display: "block", height: `${h}px`, width: w, borderRadius: radius }} />;
}

/** A skeleton bar sitting in a text line box of the real line's height, so a
 *  three-line stand-in occupies what three lines of that type will. */
function HeroSkelTextLine({ w, box, bar = 13 }: { w: string; box: number; bar?: number }) {
  return (
    <div style={{ height: `${box}px`, display: "flex", alignItems: "center" }}>
      <HeroSkelLine w={w} h={bar} />
    </div>
  );
}

/** The briefing: three clamped lines (24px line box) and the "Read more"
 *  control under them — 97px loaded, measured at 1440. Carries the wait's
 *  live region, so the rest of the pending hero can stay aria-hidden. */
function HeroPendingLede({ lang }: { lang: Lang }) {
  return (
    <div role="status" aria-busy="true" data-pending-placeholder="" style={{ width: "100%", maxWidth: "690px" }}>
      <span className="cd-visually-hidden">{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</span>
      <div aria-hidden="true">
        <HeroSkelTextLine w="100%" box={24} />
        <HeroSkelTextLine w="100%" box={24} />
        <HeroSkelTextLine w="62%" box={24} />
        <div style={{ height: "25px", display: "flex", alignItems: "flex-end", paddingBottom: "4px" }}>
          <HeroSkelLine w="104px" h={13} />
        </div>
      </div>
    </div>
  );
}

/** Life focus T1: the line under the briefing (12px type, 18px line box). It
 *  wraps by width and language, so `.nova-hero-skel--focus` carries the
 *  measured height; without it a focus reader's hero grew on arrival. */
function HeroPendingFocusLine() {
  return (
    <div className="nova-hero-skel--focus" aria-hidden="true" style={{ width: "100%", maxWidth: "690px" }}>
      <HeroSkelTextLine w="78%" box={18} bar={10} />
    </div>
  );
}

/* Four of these blocks are as tall as their copy wraps, which depends on both
   the width and the language — `.nova-hero-skel--*` in dashboard-nova.css
   carries those measured heights (en and ta, three widths). Everything else
   here holds its place by its own shape. */

/** Mood / body / best-used-for chips, and the sentence printed under them. */
function HeroPendingWeather() {
  return (
    <div
      aria-hidden="true"
      className="nova-hero-skel--weather"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}
    >
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {["124px", "118px", "168px"].map((w) => (
          <HeroSkelLine key={w} w={w} h={28} radius="var(--radius-pill)" />
        ))}
      </div>
      <HeroSkelTextLine w="78%" box={26} />
    </div>
  );
}

/** The best-window card: eyebrow, the promoted time with its two actions,
 *  and the reason under them. */
function HeroPendingWindow() {
  return (
    <Card variant="high" className="nova-hero-action nova-hero-skel--window" aria-hidden="true">
      <div className="nova-hero-action__body" style={{ width: "100%", gap: "var(--space-2_5)" }}>
        <HeroSkelLine w="136px" h={11} />
        <div style={{ height: "42px", width: "100%", display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <HeroSkelLine w="min(200px, 52%)" h={30} />
          <span style={{ flex: 1 }} />
          <HeroSkelLine w="112px" h={34} radius="var(--radius-sm)" />
          <HeroSkelLine w="88px" h={34} radius="var(--radius-sm)" />
        </div>
        <HeroSkelTextLine w="100%" box={22} />
        {/* The reason runs to a second line except in English at three
            columns, where it fits on one; that line is dropped there by
            `.nova-hero-skel__reason-2` so the shape stays at or under the
            loaded card (E-4f). */}
        <div className="nova-hero-skel__reason-2">
          <HeroSkelTextLine w="64%" box={22} />
        </div>
      </div>
    </Card>
  );
}

/** The score column: the dial's card, then the epigraph — which is static
 *  copy, not data, so it prints now and stays exactly where it is. */
function HeroPendingScore({ lang }: { lang: Lang }) {
  return (
    <div className="nova-hero-score">
      <Card
        aria-hidden="true"
        className="nova-hero-skel--score"
        style={{
          minWidth: 0,
          background: "color-mix(in srgb, var(--color-surface) 62%, transparent)",
          borderColor: "var(--color-border-strong)", borderRadius: "var(--radius-md)",
          padding: "var(--space-5) var(--space-4)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "var(--space-3)",
        }}
      >
        <HeroSkelLine w="104px" h={11} />
        <HeroSkelLine w="172px" h={172} radius="var(--radius-pill)" />
        <HeroSkelLine w="152px" h={30} />
        <HeroSkelLine w="124px" h={22} />
      </Card>
      <p className="nova-hero-quote">
        &ldquo;{dt(TODAY_HERO.quote, lang)}&rdquo;
        <span className="nova-hero-quote__attribution">— {dt(TODAY_HERO.quoteAttribution, lang)}</span>
      </p>
    </div>
  );
}

/** The timing rail: the avoid window beside its glyph, then key timings. */
function HeroPendingRail() {
  const railCard = {
    flex: "none" as const,
    background: "color-mix(in srgb, var(--color-surface) 62%, transparent)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-4)",
  };
  return (
    <div className="nova-hero-rail" aria-hidden="true">
      <Card className="nova-hero-skel--avoid" style={{ ...railCard, display: "flex", flexDirection: "row", gap: "var(--space-3)", alignItems: "center" }}>
        <HeroSkelLine w="40px" h={40} radius="var(--radius-pill)" />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
          <HeroSkelLine w="92px" h={11} />
          <HeroSkelLine w="72%" h={25} />
          <HeroSkelLine w="46%" h={15} />
          <HeroSkelLine w="38%" h={15} />
        </div>
      </Card>
      <Card className="nova-hero-skel--timings" style={{ ...railCard, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <HeroSkelLine w="140px" h={11} />
        {[0, 1, 2, 3].map((i) => (
          <HeroSkelLine key={i} w={i === 3 ? "72%" : "100%"} h={48} />
        ))}
      </Card>
    </div>
  );
}

export function DashboardTodayTabNova({
  lang,
  userMode = "BALANCED",
  activeLifeMode = "BALANCED",
  onOpenFocusPicker,
  showFocusNudge = false,
  onKeepFocus,
  onDismissFocusNudge,
  lifeFocus = NO_FOCUS,
  birthDisplayName,
  selectedDate,
  todayDate,
  personalMemberChart,
  personalChartSummary,
  personalDailyGuidance,
  personalSani,
  peyarchiUpcoming,
  panchangam,
  weekAhead,
  familyAggregate,
  personalPending = false,
  showingPreviousDay = false,
  familyPending = false,
  remedyMemberCharts = [],
  lifeAreas,
  dasha,
  dashaAntar,
  dailyGuidanceRange,
  panchangamTimezone,
  bundleSectionErrors,
  onRetryBundle,
  onGoToFamily,
  onGoToJournal,
  onGoToCalendar,
  onGoToLifeAreas,
  onGoToChart,
  onGoToCharts,
  onOpenAskVinaadi,
  onOpenNotificationSettings,
  needsProfile = false,
  onOpenChartGen,
  onOpenMuhurta,
  onOpenCompatibility,
  onOpenActivityTiming,
  onOpenRasipalan,
  onOpenNumerology,
  onGoToExplore,
  onGoToAllTools,
}: DashboardTodayTabNovaProps) {
  const { days: streakDays, best: streakBest, forgiven: streakForgiven } = useStreak();
  const { enabled: eveningPreviewOn, setEnabled: setEveningPreviewOn } = useEveningPreview();
  const displayName = personalMemberChart?.displayName ?? birthDisplayName;
  const primaryRemedyMemberId = personalMemberChart?.memberId ?? (personalChartSummary?.chartId ? `chart:${personalChartSummary.chartId}` : "personal");
  const remedyMembers = [
    {
      memberId: primaryRemedyMemberId,
      displayName,
      remedy: personalDailyGuidance?.remedy ?? null,
      remedyFocus: personalDailyGuidance?.remedyFocus ?? null,
    },
    ...remedyMemberCharts
      .filter((member) => member.memberId !== primaryRemedyMemberId)
      .map((member) => ({
        memberId: member.memberId,
        displayName: member.displayName,
        remedy: member.dailyGuidance?.remedy ?? null,
        remedyFocus: member.dailyGuidance?.remedyFocus ?? null,
      })),
  ];
  // Hero greeting shows a first name only — the full name reads too formal
  // sitting right next to "Good morning".
  const heroFirstName = displayName.trim().split(/\s+/)[0] ?? displayName;
  // DXA-03: before the profile answers there is no name yet. Hold the line at
  // its final height instead of rendering an empty <h1> beside the sun.
  const heroName = heroFirstName || (personalPending ? (
    <span
      className="skel"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", width: "min(280px, 55vw)", height: "0.9em", borderRadius: "var(--radius-md)" }}
    />
  ) : null);
  const activeChartId = personalChartSummary?.chartId ?? "";
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<StatusMessage | null>(null);
  // Redesign 2026-09-07 — collapsed by default; see the comment on the render
  // site (`windowConflict`) for why this is a toggle rather than an always-open row.
  const [conflictOpen, setConflictOpen] = useState(false);

  // Drives the timeline's NOW marker and the best-window countdown — ticks
  // once a minute, matching design 8a's "updates each minute" spec without
  // re-rendering on every animation frame.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Hour/minute of "now" in the panchangam timezone (DASH-01) — a Toronto
  // browser with a Chennai panchangam must compare against Chennai's clock.
  const zoneHour = hourInZone(now, panchangamTimezone);
  const zoneMinutes = minutesOfDayInZone(now, panchangamTimezone);

  const score = personalDailyGuidance?.score ?? null;
  const weekday = panchangam ? panchangam.vara.weekday : "";
  const paksha = panchangam?.tithi.paksha;
  const wax = paksha === "SHUKLA";
  // Amavasai/Pournami are the two tithis where "which fortnight" (paksha) stops
  // being the useful label — show the actual new/full moon instead of "Waning"/
  // "Waxing" so this chip agrees with the calendar tab's LunarTithiBadge.
  const specialTithiMeta = lunarSpecialTithiMeta(panchangam?.specialTithiDay?.name, lang);
  // A named day (Varalakshmi Vratham, Ekadashi, ...) is more useful in the
  // hero's one-liner than the generic paksha name it would otherwise show —
  // world observances are excluded so a UN awareness day doesn't bump a real
  // festival off this compact slot.
  const primaryFestival = panchangam?.festivals.find((f) => !festivalTags(f).includes("observance")) ?? null;

  // DXA-07 — the day this pane is actually describing. While the newly
  // selected day loads, the panchangam, guidance and week strip on screen are
  // still the previous day's; reading the picker's date here instead would
  // print tomorrow's date over today's star, and would re-run every "is this
  // window running now?" comparison against a date the data does not cover.
  // Falls back to the picker when there is no panchangam to ask (a failed
  // section, or the very first load).
  const dataDate = panchangam?.dateLocal ?? selectedDate;
  const isToday = dataDate === todayDate;

  // T8 / A-013 — the day's three avoid-kalas, straight from the panchangam.
  // These are the spans a recommended window may never overlap; the ruling is
  // documented on `pickRecommendedWindow`.
  const avoidSpans: TimingSpan[] = panchangam
    ? [panchangam.kalam.rahuKalam, panchangam.kalam.yamagandam, panchangam.kalam.kuligai]
        .filter(Boolean)
        .map((k) => ({ start: k.start, end: k.end }))
    : [];

  // One promoted window, chosen by the almanac's own Gowri ranking and clear of
  // the avoid-kalas (owner ruling 2026-08-23, superseding DASH-10.1's
  // personal-hora precedence for this pick). `pickFeaturedWindow` remains the
  // fallback for the case the ruling cannot apply to — no windows carrying a
  // kala, e.g. a stale-snapshot response — so the hero never goes blank.
  const recommended = pickRecommendedWindow(personalDailyGuidance?.bestWindows, avoidSpans, {
    now, isToday, dateLocal: dataDate, timeZone: panchangamTimezone,
  });
  const bestWindow = recommended?.window
    ?? pickFeaturedWindow(personalDailyGuidance?.bestWindows, now, isToday, dataDate, panchangamTimezone);
  // DASH-10.1 (2026-07-16): Abhijit never fully disappears — surfaced as a
  // small secondary line when another window won the hero instead. It now lives
  // inside "Other traditional timings" rather than beside the promoted window.
  const secondaryAbhijitWindow = findSecondaryAbhijitWindow(personalDailyGuidance?.bestWindows, bestWindow);
  // Keep a ranked timing conflict attached to the one actionable recommendation,
  // rather than rendering a second copy of the best-window card in the rail.
  const windowConflict = bestWindow ? personalDailyGuidance?.bestWindowConflicts?.[0] ?? null : null;

  // Life focus T1 — one added sentence under the briefing, from numbers
  // already on this page: the focus area's life-area score (read through the
  // same period ladder and rounding as its tile, so the two cannot disagree)
  // and the window the hero already promotes. No new calculation. It says
  // "period", never "today", because a life-area score is not a daily one.
  const focusAreaData = lifeFocus.area ? lifeAreas?.areas.find((a) => a.area === lifeFocus.area) ?? null : null;
  const focusHeroLine = focusAreaData
    ? [
        dt(LIFE_FOCUS.heroArea, lang)
          .replace("%1", tLang(focusAreaData.label, lang))
          .replace("%2", getLifeAreaVerdict(Math.round(focusAreaData.score), lang).verdict),
        bestWindow
          ? dt(isToday ? LIFE_FOCUS.heroWindowToday : LIFE_FOCUS.heroWindowOther, lang)
              .replace("%s", `${formatClockLabel(bestWindow.start, lang)} – ${formatClockLabel(bestWindow.end, lang)}`)
          : null,
      ].filter(Boolean).join(" ")
    : null;

  // Real lunar phase for today, drawn straight from the tithi we already have —
  // drives the hero sky backdrop's moon shape (thin crescent -> full disc).
  const moonPhase = panchangam ? moonPhaseFromTithi(panchangam.tithi.number, panchangam.tithi.paksha) : null;

  // Hero tile rail (redesign 2026-07-18): avoid window = the day's first
  // caution window, falling back to Rahu Kalam from the panchangam; Horai
  // resolves against "now" so it only renders when viewing today.
  const avoidWindow = personalDailyGuidance?.cautionWindows?.[0]
    ?? (panchangam ? { type: "RAHU_KALAM", start: panchangam.kalam.rahuKalam.start, end: panchangam.kalam.rahuKalam.end } : null);

  // After 8pm (panchangam-local), the hero can swap to a preview of tomorrow +
  // a journal prompt for today — reuses the already-fetched 3-day
  // dailyGuidanceRange (today..+2), no extra network call. Gated by isToday so
  // opening a past or future date from the calendar never triggers it.
  const tomorrowIso = addDays(dataDate, 1);
  const tomorrowGuidance = dailyGuidanceRange?.items.find((item) => item.dateLocal === tomorrowIso) ?? null;
  const showEveningPreview = eveningPreviewOn && isToday && zoneHour >= 20 && tomorrowGuidance !== null;
  // The switch itself is only worth hero space in the window it can act in —
  // from 7pm, an hour before the swap, so a reader can turn it off *before*
  // tomorrow replaces today rather than after. It defaults to on, so gating on
  // "…or it is on" would have left it on screen all day for almost everyone,
  // which is the state this finding is about.
  const showEveningPreviewToggle = isToday && zoneHour >= 19;
  const tomorrowWeekday = new Date(`${tomorrowIso}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "long" });

  /** Live phase of any wall-clock span on the selected day, in the panchangam
   *  zone. Extracted from the best-window block so the avoid card can use the
   *  identical machinery (hero review 2026-09-04, finding 4) — the opportunity
   *  axis had three phase states and a countdown while the safety axis had
   *  none, so the avoid card went silent at exactly the moment the user was
   *  standing inside the window it exists to warn about. A caution earns live
   *  state more than an invitation does. */
  function spanPhase(span: { start: string; end: string } | null): {
    phase: "before" | "during" | "after" | null;
    countdown: string | null;
  } {
    if (!span || !isToday) return { phase: null, countdown: null };
    const startMs = timeOnDateToMs(dataDate, span.start, panchangamTimezone);
    const endMs = timeOnDateToMs(dataDate, span.end, panchangamTimezone);
    if (startMs === null || endMs === null) return { phase: null, countdown: null };
    const nowMs = now.getTime();
    if (nowMs < startMs) return { phase: "before", countdown: formatDuration(startMs - nowMs, lang) };
    if (nowMs <= endMs) return { phase: "during", countdown: formatDuration(endMs - nowMs, lang) };
    return { phase: "after", countdown: null };
  }

  const { phase: windowPhase, countdown: windowCountdown } = spanPhase(bestWindow);
  const { phase: avoidPhase, countdown: avoidCountdown } = spanPhase(avoidWindow);
  // Owner ask (2026-09-07): once today's avoid window has ended it no longer
  // earns hero space — it stays visible only while it is upcoming or running.
  // A past date's avoidWindow has no live phase (spanPhase short-circuits on
  // `isToday`), so it keeps showing as reference rather than being hidden.
  const showAvoidCard = avoidWindow != null && avoidPhase !== "after";

  // Finding 6 — the day's Nalla Neram spans, so the disclosure's Nalla Neram
  // row prints times like every other row instead of a bare definition. Same
  // array the ribbon already segments on the timeline below.
  const nallaNeramSpans = (panchangam?.kalam.nallaNeram ?? [])
    .filter((slot) => slot?.start && slot?.end)
    .map((slot) => ({ start: slot.start, end: slot.end }));

  // Finding 13 — nakshatram and tithi are the first two things a thirukanitham
  // reader looks up, ahead of paksha, and the hero header listed neither. Same
  // `limbNow` promotion the ribbon uses, so the two surfaces cannot disagree
  // about which star is actually running.
  // Guarded per-limb, not on `panchangam` as a whole: a bundle section can come
  // back partial (DASH-02), and a hero that throws is worse than a hero missing
  // one line of the header.
  const nakNow = panchangam?.nakshatra ? limbNow(panchangam.nakshatra, { isToday, nowIso: now.toISOString() }) : null;
  const tithiNow = panchangam?.tithi ? limbNow(panchangam.tithi, { isToday, nowIso: now.toISOString() }) : null;

  // ===== 5. Family Today + Remedy For You row (redesign 2026-07-18,
  // "Coming up" folded into Family Today's footer 2026-08-20) — the remedy
  // grows from a one-liner into a card with its own save action; family
  // members get star tiles; Family Today pins "Coming up" to its bottom so a
  // small/solo household doesn't leave the card looking empty next to the
  // taller Remedy card. Held in a variable because a REMEDIES focus renders it
  // directly under the hero instead (life focus T5).
  const familyRemedyRow = (
    <Reveal>
    <DashboardTodayFamilyRemedyRowNova
      lang={lang}
      familyAggregate={familyAggregate}
      familyPending={familyPending}
      remedy={personalDailyGuidance?.remedy ?? null}
      remedyFocus={personalDailyGuidance?.remedyFocus ?? null}
      remedyMembers={remedyMembers}
      savingReminder={savingReminder}
      reminderMessage={reminderStatus?.text ?? null}
      onSaveReminder={() => void handleSaveReminder()}
      onGoToFamily={onGoToFamily}
      onGoToLifeAreas={onGoToLifeAreas}
      peyarchiUpcoming={peyarchiUpcoming}
      personalSani={personalSani}
      onGoToCalendar={onGoToCalendar}
    />
    </Reveal>
  );

  async function handleSaveReminder() {
    if (savingReminder) return;
    setSavingReminder(true);
    setReminderStatus(null);
    try {
      const current = await apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications");
      if (current.data.notification_channel === "none") {
        // The user has notifications off — never silently enable a channel
        // for them (DASH-06). Send them to Settings -> Notifications to choose.
        if (onOpenNotificationSettings) {
          setReminderStatus({ text: t("reminder_pick_channel", lang), tone: "success" });
          onOpenNotificationSettings();
        } else {
          setReminderStatus({ text: t("reminder_channel_off", lang), tone: "error" });
        }
        return;
      }
      const nextTime = current.data.morningAlertTime || "06:00";
      await apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationChannel: current.data.notification_channel,
          morningAlertEnabled: true,
          morningAlertTime: nextTime,
        }),
      });
      setReminderStatus({ text: t("reminder_saved", lang), tone: "success" });
    } catch (error) {
      setReminderStatus({
        text: t("reminder_save_failed", lang).replace("%s", readErrorMessage(error)),
        tone: "error",
      });
    } finally {
      setSavingReminder(false);
    }
  }

  return (
    // DXA-07 — `data-stale` while the newly selected day is still loading: the
    // day on screen is the previous one, held in place rather than torn down,
    // and dimmed so it reads as "being replaced" instead of as the answer.
    // `aria-busy` says the same thing to a screen reader, which cannot see the
    // dim or the sub-bar's hairline.
    <div
      className="nova-today-pane"
      // The day this pane is rendering, as opposed to the one the picker
      // holds. They differ only while `data-stale` is set — which is what the
      // DXA-07 probe reads to prove the held day is actually replaced, and
      // not merely held forever (a stall and a fix look identical to a gate
      // that only measures height).
      data-day={dataDate}
      data-stale={showingPreviousDay ? "" : undefined}
      aria-busy={showingPreviousDay || undefined}
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
    >
      {/* ===== 1. Hero: greeting, one theme line, mood chips, embedded
          best-window "next action" tile, and the one canonical score.

          Structure (layout lives in `.nova-hero*`, dashboard-nova.css):
            masthead — full-width almanac strip: date · star · tithi · paksha ·
                       observance, with the streak chip / evening switch at the
                       right, closed by a hairline.
            row      — three top-aligned columns at ≥1200px: greeting +
                       briefing + best window · score (+ epigraph) · timing
                       rail. Two columns at ≥860px, one below. ===== */}
      <div className={personalPending && !personalDailyGuidance ? "nova-hero nova-hero--pending" : "nova-hero"}>
        <HeroSkyBackdrop moon={moonPhase} />
        {/* The four things a thirukanitham reader opens the page for (date,
            star, tithi, paksha) read as one almanac line across the whole
            hero, above the greeting — not stacked inside the greeting's own
            column where they competed with the name. Same data, same
            `limbNow` promotion. */}
        <div className="nova-hero-masthead">
          <span className="nova-hero-masthead__date">
            {weekday && `${weekday}, `}{formatDateLabel(dataDate)}
            {panchangam?.tamilDate && <> · <span style={{ color: "var(--color-accent-strong)" }}>{lang === "ta" ? panchangam.tamilDate.ta : panchangam.tamilDate.en}</span></>}
          </span>
          {/* Star · tithi · paksha · observance. Finding 13 put the star and
              the tithi ahead of paksha and that order is kept; each carries
              its own glyph so the four read as four facts rather than one
              sentence. Glyphs are lucide (the pre-delivery checklist bans
              emoji as icons) except the moon, which is the existing
              phase-accurate MiniMoonGlyph. */}
          {/* DXA-05 — the almanac's four limbs arrive with the day's bundle.
              Until then this row held one short date, and on a phone it grew
              38px → 100px when they landed, pushing the whole page down: the
              topmost shift on Today's cold load. Their slots are held at the
              widths the four labels take, so the row wraps now the way it
              will wrap then. D6 still governs the content — nothing here
              guesses a Tamil date or a star; this reserves the space and says
              nothing. */}
          {!nakNow && !paksha && personalPending && (
            <div className="nova-hero-masthead__limbs" aria-hidden="true">
              {[112, 122, 94, 146].map((w) => (
                <span className="nova-hero-masthead__limb" key={w}>
                  <HeroSkelLine w="15px" h={15} radius="var(--radius-pill)" />
                  <HeroSkelLine w={`${w}px`} h={13} />
                </span>
              ))}
            </div>
          )}
          {(nakNow || paksha) && (
            <div className="nova-hero-masthead__limbs">
              {nakNow && (
                <span className="nova-hero-masthead__limb">
                  <Star size={15} strokeWidth={1.9} aria-hidden="true" style={{ color: "var(--color-accent-strong)", flex: "none" }} />
                  <span>
                    <GlossaryTerm term="nakshatra" lang={lang}>{lang === "ta" ? "நட்சத்திரம்" : "Star"}</GlossaryTerm>{" "}
                    <b>{tNakshatra(nakNow.activeName, lang)}</b>
                  </span>
                </span>
              )}
              {tithiNow && (
                <span className="nova-hero-masthead__limb">
                  <Sparkles size={15} strokeWidth={1.9} aria-hidden="true" style={{ color: "var(--color-accent-strong)", flex: "none" }} />
                  <span>
                    <GlossaryTerm term="tithi" lang={lang}>{lang === "ta" ? "திதி" : "Tithi"}</GlossaryTerm>{" "}
                    <b>{tTithi(tithiNow.activeName, lang)}</b>
                  </span>
                </span>
              )}
              {paksha && (
                <span className="nova-hero-masthead__limb">
                  {moonPhase ? <MiniMoonGlyph phase={moonPhase} size={17} /> : <Moon size={15} strokeWidth={1.9} aria-hidden="true" style={{ color: "var(--color-accent-secondary)" }} />}
                  <b>{specialTithiMeta ? specialTithiMeta.label : wax ? (lang === "ta" ? "வளர்பிறை" : "Waxing") : (lang === "ta" ? "தேய்பிறை" : "Waning")}</b>
                </span>
              )}
              {paksha && (
                <span className="nova-hero-masthead__limb">
                  <CalendarDays size={15} strokeWidth={1.9} aria-hidden="true" style={{ color: "var(--color-accent-secondary)", flex: "none" }} />
                  <b>{primaryFestival ? primaryFestival.name : wax ? (lang === "ta" ? "சுக்ல பக்ஷம்" : "Sukla Paksham") : (lang === "ta" ? "கிருஷ்ண பக்ஷம்" : "Krishna Paksham")}</b>
                </span>
              )}
            </div>
          )}
          <div className="nova-hero-masthead__right">
                {onOpenFocusPicker && <LifeModeBadge mode={activeLifeMode} lang={lang} onClick={onOpenFocusPicker} />}
                <StreakChip days={streakDays} best={streakBest} forgiven={streakForgiven} lang={lang} />
                {/* Finding 10 — this is a *setting*, and it changes nothing
                    until 8pm (`showEveningPreview` gates on zoneHour >= 20).
                    It sat in prime hero real estate beside the day's most
                    important number, inert for ~20 hours a day. It now appears
                    only in the evening it applies to — and whenever it is
                    already on, so a reader can always reach the switch that is
                    doing something to their screen.

                    It is also a real `role="switch"` now: it looked like one
                    (track, knob, animated position) but shipped as a bare
                    <button>, so a screen-reader user heard "Evening preview,
                    button" and got no state before or after pressing it. The
                    repo's axe gate only checks contrast, so this passed CI. */}
                {showEveningPreviewToggle && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={eveningPreviewOn}
                  onClick={() => setEveningPreviewOn(!eveningPreviewOn)}
                  title={dt(TODAY_HERO.eveningPreviewHint, lang)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)", fontSize: "var(--text-xs)", fontWeight: 600,
                    color: eveningPreviewOn ? "var(--color-accent-strong)" : "var(--color-faint)",
                    background: eveningPreviewOn ? "var(--color-accent-muted)" : "none",
                    border: `1px solid ${eveningPreviewOn ? "var(--color-border-strong)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2_5) var(--space-1) var(--space-2)", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {/* A lucide glyph, not 🌙 — the pre-delivery checklist bans
                      emoji as icons, and a screen reader reads the emoji aloud
                      as "crescent moon" in the middle of the label. */}
                  <Moon size={12} strokeWidth={2} aria-hidden="true" />
                  {dt(TODAY_HERO.eveningPreviewLabel, lang)}
                  <span aria-hidden="true" style={{
                    display: "inline-block", width: "20px", height: "11px", borderRadius: "var(--radius-pill)",
                    background: eveningPreviewOn ? "var(--color-high)" : "color-mix(in srgb, var(--color-text-strong) 18%, transparent)",
                    position: "relative", flex: "none", transition: "background var(--dur-fast) var(--ease-nova)",
                  }}>
                    <span style={{
                      position: "absolute", top: "1.5px", left: eveningPreviewOn ? "10px" : "1.5px",
                      width: "8px", height: "8px", borderRadius: "var(--radius-pill)", background: "var(--color-on-accent)",
                      transition: "left var(--dur-fast) var(--ease-nova)",
                    }} />
                  </span>
                </button>
                )}
          </div>
        </div>

        {showFocusNudge && onOpenFocusPicker && onKeepFocus && onDismissFocusNudge && (
          <FocusNudgeStrip
            mode={activeLifeMode}
            lang={lang}
            onKeep={onKeepFocus}
            onChange={onOpenFocusPicker}
            onDismiss={onDismissFocusNudge}
          />
        )}

        <div className="nova-hero-row">
          <div className="nova-hero-col-main">
            {showEveningPreview && tomorrowGuidance ? (
              <>
                {/* Hero redesign 2026-09-04 — this was a "TODAY" kicker stacked
                    on a purple greeting: two eyebrow lines above the <h1>, the
                    first of which names the tab the reader is already looking
                    at. The greeting alone now carries the kicker treatment. */}
                <div style={{
                  fontSize: "var(--text-sm)", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase",
                  color: "var(--color-accent-strong)", lineHeight: 1.2, marginBottom: "var(--space-1)",
                }}>
                  {greetingWord(lang, zoneHour)},
                </div>
                {/* audit B-1: the greeting+name is the page's one <h1> — Today
                    previously shipped zero headings (no document outline). */}
                {/* `nova-hero-name` carries the forced-colors guard (finding
                    11): Windows High Contrast strips the gradient but keeps
                    `-webkit-text-fill-color: transparent`, which erased the
                    page's only <h1> entirely. */}
                {/* The name is the hero's anchor and was rendering at roughly
                    the same size as the briefing beneath it. The gradient (and
                    so finding 11's forced-colors guard) is kept, but weighted
                    to text-strong so it reads as the near-white it is meant to
                    be rather than as a purple wash. The ornament follows the
                    hour — a sun by day, a moon after dark — and is decorative,
                    so it sits outside the accessible name. */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3_5)", flexWrap: "wrap" }}>
                  <h1 className="nova-hero-name" style={{
                    margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, lineHeight: 1.06,
                    fontSize: "clamp(2.25rem, 3.4vw, 3.5rem)", maxWidth: "720px",
                    background: "linear-gradient(120deg, var(--color-text-strong) 68%, var(--color-accent-secondary))",
                    WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {heroName}
                  </h1>
                  {zoneHour >= 6 && zoneHour < 18
                    ? <Sun size={30} strokeWidth={1.7} aria-hidden="true" style={{ color: "var(--color-accent-strong)", flex: "none" }} />
                    : <Moon size={28} strokeWidth={1.7} aria-hidden="true" style={{ color: "var(--color-accent-secondary)", flex: "none" }} />}
                </div>
                <div style={{ fontSize: "var(--text-base)", color: "var(--color-accent-secondary)", fontWeight: 600 }}>
                  {lang === "ta" ? "நாளையைப் பற்றி ஒரு முன்னோட்டம் — " : "A look ahead to tomorrow — "}
                  {tomorrowWeekday}, {formatDateLabel(tomorrowIso)}
                </div>
                <NovaClampedText
                  lines={3}
                  maxWidth="690px"
                  moreLabel={dt(TODAY_HERO.readMore, lang)}
                  lessLabel={dt(TODAY_HERO.readLess, lang)}
                  style={{ fontFamily: "var(--font-body)", fontSize: "clamp(16px, 1.2vw, 19px)", lineHeight: 1.55, color: "var(--color-text)" }}
                >
                  {tLang(tomorrowGuidance.briefing ?? tomorrowGuidance.text, lang)}
                </NovaClampedText>
                <div style={{ flex: 1 }} />

                {/* Journal prompt — the evening half of design's "preview +
                    journal prompt" ask, replacing the best-window action tile.
                    Tomorrow's first good window folds into its sub-line. */}
                <Card variant="accent" style={{
                  display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", marginTop: "2px", flexWrap: "wrap", rowGap: "var(--space-2_5)",
                  borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)",
                }}>
                  <span className="nova-pulse-dot" style={{ width: "9px", height: "9px", borderRadius: "var(--radius-pill)", background: "var(--color-accent)", flex: "none" }} />
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-accent-strong)" }}>
                      {lang === "ta" ? "இன்று எப்படி இருந்தது?" : "How did today go?"}
                      {panchangam && (
                        <span style={{ fontWeight: 400, color: "var(--color-faint)" }}>
                          {" · "}
                          {lang === "ta" ? `சூரிய உதயம் ${formatClockLabel(panchangam.sunrise, lang)} இல் நாள் முடிகிறது` : `day closes at sunrise ${formatClockLabel(panchangam.sunrise, lang)}`}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", marginTop: "2px" }}>
                      {(() => {
                        const tw = pickFeaturedWindow(tomorrowGuidance.bestWindows, now, false, tomorrowIso, panchangamTimezone);
                        return tw
                          ? (lang === "ta"
                            ? <>நாளை முதல் நல்ல நேரம் · <b style={{ color: "var(--color-high)" }}>{formatClockLabel(tw.start, lang)} – {formatClockLabel(tw.end, lang)}</b></>
                            : <>Tomorrow&rsquo;s first good window · <b style={{ color: "var(--color-high)" }}>{formatClockLabel(tw.start, lang)} – {formatClockLabel(tw.end, lang)}</b></>)
                          : (lang === "ta" ? "நாள் முடிவதற்குள் ஒரு சிறு குறிப்பு பதிவு செய்யுங்கள்." : "Log a quick note before the day closes.");
                      })()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)", flex: "none" }}>
                    {onGoToJournal && (
                      <button
                        type="button"
                        onClick={onGoToJournal}
                        style={{ fontSize: "var(--text-sm)", fontWeight: 700, background: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3_5)", cursor: "pointer", fontFamily: "inherit", flex: "none" }}
                      >
                        {lang === "ta" ? "குறிப்பு எழுத" : "Write a quick note"}
                        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "middle", marginLeft: "var(--space-1)" }} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="ui-btn ui-btn--secondary"
                      onClick={() => void handleSaveReminder()}
                      disabled={savingReminder}
                    >
                      {savingReminder ? (lang === "ta" ? "…" : "Saving…") : (lang === "ta" ? "நினைவூட்டு" : "Remind me")}
                    </button>
                  </div>
                </Card>
                <StatusLive status={reminderStatus} />
              </>
            ) : (
              <>
                {/* Hero redesign 2026-09-04 — this was a "TODAY" kicker stacked
                    on a purple greeting: two eyebrow lines above the <h1>, the
                    first of which names the tab the reader is already looking
                    at. The greeting alone now carries the kicker treatment. */}
                <div style={{
                  fontSize: "var(--text-sm)", fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase",
                  color: "var(--color-accent-strong)", lineHeight: 1.2, marginBottom: "var(--space-1)",
                }}>
                  {greetingWord(lang, zoneHour)},
                </div>
                {/* audit B-1: the greeting+name is the page's one <h1> — Today
                    previously shipped zero headings (no document outline). */}
                {/* `nova-hero-name` carries the forced-colors guard (finding
                    11): Windows High Contrast strips the gradient but keeps
                    `-webkit-text-fill-color: transparent`, which erased the
                    page's only <h1> entirely. */}
                {/* The name is the hero's anchor and was rendering at roughly
                    the same size as the briefing beneath it. The gradient (and
                    so finding 11's forced-colors guard) is kept, but weighted
                    to text-strong so it reads as the near-white it is meant to
                    be rather than as a purple wash. The ornament follows the
                    hour — a sun by day, a moon after dark — and is decorative,
                    so it sits outside the accessible name. */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3_5)", flexWrap: "wrap" }}>
                  <h1 className="nova-hero-name" style={{
                    margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, lineHeight: 1.06,
                    fontSize: "clamp(2.25rem, 3.4vw, 3.5rem)", maxWidth: "720px",
                    background: "linear-gradient(120deg, var(--color-text-strong) 68%, var(--color-accent-secondary))",
                    WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {heroName}
                  </h1>
                  {zoneHour >= 6 && zoneHour < 18
                    ? <Sun size={30} strokeWidth={1.7} aria-hidden="true" style={{ color: "var(--color-accent-strong)", flex: "none" }} />
                    : <Moon size={28} strokeWidth={1.7} aria-hidden="true" style={{ color: "var(--color-accent-secondary)", flex: "none" }} />}
                </div>
                {/* Finding 12 — this line is onboarding copy: static, identical
                    every day, and sitting between the reader's name and the
                    briefing they came for. It earns its place only on a screen
                    that has no briefing to lead with. */}
                {/* While the briefing is still on its way, its place is held
                    rather than filled with this lede (DXA-03). */}
                {/* Three lines and the "Read more" control, the shape the
                    briefing resolves to (DXA-05) — then the two blocks that
                    follow it in the loaded column, so the column's height is
                    its final one. */}
                {!personalDailyGuidance && personalPending && (
                  <>
                    <HeroPendingLede lang={lang} />
                    {lifeFocus.area && <HeroPendingFocusLine />}
                    <HeroPendingWeather />
                    <HeroPendingWindow />
                  </>
                )}
                {!personalDailyGuidance && !personalPending && (
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55, maxWidth: "640px" }}>
                    {dt(TODAY_HERO.ledeNoGuidance, lang)}
                  </p>
                )}
                {personalDailyGuidance && (
                  <NovaClampedText
                    lines={3}
                    maxWidth="690px"
                    moreLabel={dt(TODAY_HERO.readMore, lang)}
                    lessLabel={dt(TODAY_HERO.readLess, lang)}
                    style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-md)", lineHeight: 1.55, color: "var(--color-text)" }}
                  >
                    {tLang(personalDailyGuidance.briefing ?? personalDailyGuidance.text, lang)}
                  </NovaClampedText>
                )}
                {personalDailyGuidance && focusHeroLine && (
                  <p className="nova-hero-focus-line" style={{ margin: 0, maxWidth: "690px", fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-muted)" }}>
                    {focusHeroLine}
                  </p>
                )}
                {/* Chandrashtama hero flag — when the transiting Moon is in the
                    8th from the user's Janma Rasi today. Previously this only
                    surfaced woven into the briefing prose + a card buried in
                    the deep-dive; this amber pill makes it legible at a glance
                    and taps through to the full ChandrashtamaCard. Amber (not
                    red) and "awareness, not alarm" copy keep the app's
                    non-fatalist doctrine — chandrashtama is a day for care,
                    not a "bad day". */}
                {personalDailyGuidance?.isChandrashtama && (
                  <a
                    href="#nova-deep-dive"
                    onClick={focusDeepDiveAfterHashNavigation}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "var(--space-2)", alignSelf: "flex-start",
                      textDecoration: "none", fontFamily: "inherit",
                      background: "var(--color-mid-bg)", border: "1px solid var(--color-mid-border)",
                      borderRadius: "var(--radius-pill)", padding: "var(--space-1_5) var(--space-3_5)", maxWidth: "100%",
                    }}
                  >
                    {/* lucide, not 🌘 — same rule as the evening-preview
                        switch: no emoji as icons, and no "waning crescent moon"
                        read aloud inside the label. */}
                    <MoonStar size={15} strokeWidth={2} aria-hidden="true" style={{ color: "var(--color-mid-text)", flex: "none" }} />
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <b style={{ color: "var(--color-mid-text)", fontWeight: 700 }}>
                        <GlossaryTerm term="chandrashtama" lang={lang}>{lang === "ta" ? "இன்று சந்திராஷ்டமம்" : "Chandrashtama today"}</GlossaryTerm>
                      </b>
                      <span style={{ color: "var(--color-muted)" }}> — {lang === "ta" ? "கவனம் தேவை, பயம் அல்ல" : "a day for awareness, not alarm"}</span>
                    </span>
                    <span style={{ display: "inline-flex", color: "var(--color-mid-text)", flex: "none" }}><ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></span>
                  </a>
                )}
                {/* ── Emotional weather (hero review 2026-09-04, findings 1-3) ──
                    Three things were wrong here at once, and all three were
                    fixed by using what the response already carried:

                    1. The chips printed the raw database enums — `tone`,
                       `physicalTendency`, `bestUseOfDay` are Python tokens, and
                       the third one rendered on screen as `balanced_routine`.
                       It stayed invisible only while the selected profile
                       happened to yield readable single words (`calm`,
                       `steady`); `low_energy`, `deep_work`, `people_facing`,
                       `execution_sprints` and `single_task_routine` all leak the
                       moment their profile is picked. In Tamil mode a Tamil
                       reader got English database tokens. `weatherLabel` maps
                       every token to a bilingual label and humanises anything
                       added to `_TONE_MAP` after it, so a token cannot reach
                       the screen again.

                    2. Tone was hard-coded by slot *position*, not by content —
                       the repo's own DASH-08 ruling ("tone travels with the
                       message") inverted. `bestUseOfDay` is the day's most
                       positive field and wore AlertTriangle in `--color-low`,
                       while `tone` — the field most likely to read `heavy` or
                       `scattered` — wore a green leaf. On a Saturn day the hero
                       said "heavy" in green and "deep work" in red. The three
                       slots now carry fixed semantics that match their fields.

                    3. `avoidBefore` — the one genuine caution in the payload —
                       was rendered on no web surface at all. So the hero showed
                       a fake warning while withholding the real one. It is now
                       the only thing on this block wearing a caution tone, and
                       in amber (mid), not red: same "awareness, not alarm"
                       doctrine the Chandrashtama pill above follows.

                    The chips stay short; the backend's reviewed bilingual
                    sentence (`bestUseOfDayText`) prints underneath, which is
                    the sentence the reader can actually act on. */}
                {personalDailyGuidance?.emotionalWeather && (() => {
                  const weather = personalDailyGuidance.emotionalWeather;
                  const chips = ([
                    { key: "tone", Icon: Leaf, axis: dt(EMOTIONAL_WEATHER.toneLabel, lang), token: weather.tone, color: "var(--color-accent-secondary)", bg: "var(--color-surface-soft)", border: "var(--color-border)" },
                    { key: "body", Icon: Activity, axis: dt(EMOTIONAL_WEATHER.bodyLabel, lang), token: weather.physicalTendency, color: "var(--color-accent-secondary)", bg: "var(--color-surface-soft)", border: "var(--color-border)" },
                    { key: "bestUse", Icon: Target, axis: dt(EMOTIONAL_WEATHER.bestUseLabel, lang), token: weather.bestUseOfDay, color: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)" },
                  ] as { key: string; Icon: LucideIcon; axis: string; token: string; color: string; bg: string; border: string }[])
                    .filter((chip) => chip.token);
                  const bestUseText = weather.bestUseOfDayText ? tLang(weather.bestUseOfDayText, lang) : "";
                  const avoidBefore = weather.avoidBefore ? tLang(weather.avoidBefore, lang) : "";
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {chips.length > 0 && (
                        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                          {chips.map((chip) => (
                            // The icon is the only thing separating "Calm" from
                            // "Steady" visually, and an icon says nothing aloud
                            // — the axis name is spoken before the value so the
                            // three chips are not three loose adjectives. A
                            // hidden span rather than aria-label: aria-label is
                            // not honoured on a generic span.
                            <span key={chip.key} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-base)", color: "var(--color-text)", background: chip.bg, border: `1px solid ${chip.border}`, borderRadius: "var(--radius-pill)", padding: "var(--space-1_5) var(--space-3_5)" }}>
                              <chip.Icon size={15} strokeWidth={2} aria-hidden="true" style={{ color: chip.color, flex: "none" }} />
                              <span className="cd-visually-hidden">{chip.axis}: </span>
                              {weatherLabel(chip.token, lang)}
                            </span>
                          ))}
                        </div>
                      )}
                      {bestUseText && (
                        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.5, maxWidth: "660px" }}>
                          <b style={{ color: "var(--color-text)", fontWeight: 600 }}>{dt(EMOTIONAL_WEATHER.bestUseLabel, lang)}</b>
                          {" — "}{bestUseText}
                        </p>
                      )}
                      {avoidBefore && (
                        <p style={{ margin: 0, display: "flex", gap: "var(--space-2)", alignItems: "flex-start", fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.5, maxWidth: "660px" }}>
                          <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" style={{ color: "var(--color-mid-text)", flex: "none", marginTop: "3px" }} />
                          <span>
                            <b style={{ color: "var(--color-mid-text)", fontWeight: 700 }}>{dt(EMOTIONAL_WEATHER.cautionLabel, lang)}</b>
                            {" — "}{avoidBefore}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div style={{ flex: 1 }} />

                {/* Next-action tile — the single best-window callout, embedded in
                    the hero per design 8a §3 (not a separate card below it). */}
                {bestWindow && (
                  <Card variant="high" className="nova-hero-action">
                    {/* Redesign 2026-09-07 (owner ask). The card carried six
                        blocks at near-equal weight and so had no entry point:
                        a 44px badge puck, the label, the time, a countdown, a
                        mechanics-first reason, and an always-open conflict row.

                        Rebuilt around one hero. The time is the answer the
                        reader opened the page for, so it is the largest thing
                        in the card; the label and the live state fold into a
                        single eyebrow above it; and the reason is re-ordered to
                        this repo's Meaning → Mechanics law — it used to lead
                        with "Uthi", the one word in the sentence a reader
                        cannot act on.

                        The puck is deleted rather than shrunk: it repeated the
                        label it sat beside, and cost the content ~56px of width
                        plus the button indent that existed only to clear it.
                        Its pulse moved to the eyebrow's live dot. This is
                        deliberately no longer a mirror of the avoid tile — that
                        is a 292px secondary tile in the rail, this is the main
                        column's primary action.

                        Second pass, same day (owner ask): the two actions and
                        the footnote used to sit on a row of their own beneath
                        the reason, which left the whole right half of a ~700px
                        card empty and cost the hero ~45px of height. The buttons
                        now ride the time's row, right-aligned, and the footnote
                        rides the eyebrow's — the card fills the width it already
                        occupies instead of growing downward. */}
                    <div className="nova-hero-action__body">
                      {/* A <span>, not a div: a line of label + state is
                          honestly inline, and the T8 test walks closest("div")
                          up from the label to assert the promoted time sits in
                          the same block as it. */}
                      <span className="nova-hero-action__eyebrow">
                        <TrendingUp size={13} strokeWidth={2.5} aria-hidden="true" className="nova-hero-action__glyph" />
                        <Kicker color="var(--color-high)">
                          <GlossaryTerm term="nallaNeram" lang={lang}>{lang === "ta" ? "சிறந்த நேரம்" : "Best window"}</GlossaryTerm>
                        </Kicker>
                        {windowCountdown && (
                          <span className={windowPhase === "during" ? "nova-hero-action__state is-live" : "nova-hero-action__state"}>
                            {windowPhase === "during" && (
                              <span className="nova-pulse-dot nova-hero-action__live" aria-hidden="true" />
                            )}
                            {dt(windowPhase === "before" ? TODAY_TIMINGS.startsIn : TODAY_TIMINGS.endsIn, lang).replace("%s", windowCountdown)}
                          </span>
                        )}
                        {/* This used to render open, permanently, as a bordered
                            row with its own alarm triangle, and then as a quiet
                            question on a row of its own. What it names is a
                            *different, non-promoted* window — a competing
                            method's pick and the caveat that cost it the slot —
                            so it is neither a hazard nor part of the answer: it
                            is the footnote that preempts "but my other almanac
                            said 3:20". It rides the end of the
                            eyebrow row, in the card's top-right corner, where a
                            tertiary affordance costs no height, and it names the
                            losing time so the label teaches something before it
                            is opened. */}
                        {windowConflict && (
                          <button
                            type="button"
                            className="nova-hero-action__footnote-toggle"
                            onClick={() => setConflictOpen((open) => !open)}
                            aria-expanded={conflictOpen}
                          >
                            {dt(TODAY_TIMINGS.conflictToggle, lang).replace("%s", formatClockLabel(windowConflict.start, lang))}
                            <ChevronDown size={13} strokeWidth={2.5} aria-hidden="true" className={conflictOpen ? "is-open" : undefined} />
                          </button>
                        )}
                      </span>

                      <div className="nova-hero-action__topline">
                        <div className={windowPhase === "during" ? "nova-hero-action__time is-live" : "nova-hero-action__time"}>
                          {formatClockLabel(bestWindow.start, lang)} – {formatClockLabel(bestWindow.end, lang)}
                          {/* The kala rides the time line rather than opening the
                              reason paragraph: it is a name, not a sentence, and
                              it cost a whole text row of its own. */}
                          {recommended?.window.kala && (
                            <span className="nova-hero-action__kala">{gowriCategoryLabel(recommended.window.kala, lang)}</span>
                          )}
                        </div>
                        <div className="nova-hero-action__buttons">
                          {/* Kit primary; only the size stays inline — the
                              hero's one action reads a step larger than the
                              kit's default, and a size never blocks a state. */}
                          <button
                            type="button"
                            className="ui-btn ui-btn--primary"
                            onClick={() => void handleSaveReminder()}
                            disabled={savingReminder}
                            style={{ fontSize: "var(--text-base)" }}
                          >
                            <Bell size={15} strokeWidth={2} aria-hidden="true" style={{ flex: "none" }} />
                            {savingReminder ? (lang === "ta" ? "…" : "Saving…") : (lang === "ta" ? "நினைவூட்டு" : "Remind me")}
                          </button>
                          {/* One filled action, one plain one. The outline used to
                              give both buttons the same silhouette, which made the
                              reader choose between two equals rather than see a
                              primary and its alternative. */}
                          {onGoToJournal && (
                            <button
                              type="button"
                              className="ui-btn ui-btn--ghost"
                              onClick={onGoToJournal}
                              style={{ fontSize: "var(--text-base)" }}
                            >
                              <CalendarPlus size={15} strokeWidth={2} aria-hidden="true" style={{ flex: "none" }} />
                              {lang === "ta" ? "தருணம் பதிவு" : "Log a moment"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* T8 — why THIS window, in the order a reader can use it:
                          what the window is good for (life-language the engine
                          already emits), then the clearance that let it win.
                          Purpose and clearance were two stacked paragraphs and
                          are now one line: they are one thought, and the second
                          row was pure height. Both strings are printed verbatim
                          — the sentence case is done with ::first-letter,
                          because they are kept in sync word-for-word with
                          panchangam.py. */}
                      {recommended && (
                        <p className="nova-hero-action__reason">
                          {gowriPurposeLabel(recommended.window.kala, lang) && (
                            <>
                              <span className="nova-hero-action__purpose">
                                {gowriPurposeLabel(recommended.window.kala, lang)}
                              </span>
                              {" · "}
                            </>
                          )}
                          <span style={recommended.collidesWithAvoid ? { color: "var(--color-low)" } : undefined}>
                            {recommended.collidesWithAvoid
                              ? dt(TODAY_TIMINGS.allCollide, lang)
                              : recommended.hasPassed
                                ? dt(TODAY_TIMINGS.hasPassed, lang)
                                : recommended.skippedForCollision > 0
                                  ? `${dt(TODAY_TIMINGS.clearOfKalas, lang)} ${dt(TODAY_TIMINGS.skippedForCollision, lang)}`
                                  : dt(TODAY_TIMINGS.clearOfKalas, lang)}
                          </span>
                        </p>
                      )}

                    </div>
                    {windowConflict && conflictOpen && (
                      <p className="nova-hero-action__footnote-body">
                        <span className="nova-hero-action__footnote-time">
                          {formatClockLabel(windowConflict.start, lang)} – {formatClockLabel(windowConflict.end, lang)}
                        </span>
                        {" · "}
                        {lang === "ta" ? windowConflict.text.ta : windowConflict.text.en}
                      </p>
                    )}
                  </Card>
                )}
                <StatusLive status={reminderStatus} />
              </>
            )}
          </div>

          {/* Score column — the ONLY score on the page, with the epigraph in
              flow beneath it. The epigraph used to be absolutely positioned
              over the rail's corner, and the rail carried a 120px offset to
              clear it, which bottom-loaded the whole hero. */}
          {/* Tomorrow's score while previewing tomorrow. Framed card per the
              2026-07-18 redesign. The column (card + epigraph) renders only
              when there is a score; without one the rail widens into its
              place (`.nova-hero-row:not(:has(.nova-hero-score))`) rather than
              leaving a hole in the middle of the hero. */}
          {/* DXA-05: while the day's data is on its way the score and rail
              columns do not exist at all, so the hero was only as tall as its
              text column and grew when they arrived — the largest shift left
              on Today's cold load. These hold the same two grid cells in the
              same shape (dial card + epigraph · avoid card + key timings). */}
          {personalPending && !personalDailyGuidance && (
            <>
              <HeroPendingScore lang={lang} />
              <HeroPendingRail />
            </>
          )}
          {(() => {
            const isTomorrow = showEveningPreview && tomorrowGuidance != null;
            const dialSource = isTomorrow ? tomorrowGuidance : personalDailyGuidance;
            if (!dialSource) return null;
            const dialScore = dialSource.score ?? 0;
            const verdict = getScoreVerdictFromGuidance(dialSource.label, dialScore, lang);
            return (
              <div className="nova-hero-score">
              <Card style={{
                minWidth: 0,
                background: "color-mix(in srgb, var(--color-surface) 62%, transparent)",
                borderColor: "var(--color-border-strong)", borderRadius: "var(--radius-md)",
                padding: "var(--space-5) var(--space-4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-3)",
              }}>
                {/* Finding 5 — one score used to be drawn four ways: the dial
                    (54/100), a star row (2.7/5, the harshest reading and the
                    only wordless one), the verdict phrase ("Balanced day") and
                    the band pill ("needs attention"). The bottom two disagree
                    in direction, 6px apart, with nothing saying they measure
                    different things — the exact shape of the recorded ruling
                    "Two Axes On One Card = Contradiction", which also records
                    that re-wording the secondary axis was tried and failed.

                    So: the star row is deleted outright (a second encoding of
                    the number already on the dial), and the band pill moves out
                    of the hero to the evidence section below, where it is
                    labelled as chart support and sits beside the reasons it is
                    derived from. Two encodings remain here, of one axis: the
                    precise number and the calm verdict that leads it. */}
                <Kicker style={{ letterSpacing: "0.14em" }}>
                  {dt(isTomorrow ? TODAY_HERO.tomorrowScore : TODAY_HERO.todayScore, lang)}
                </Kicker>
                {/* The dial is the hero's one number and was drawn at the same
                    118px it uses in the Life Areas and Family grids, where it
                    is one tile among many. Here it is the whole point of the
                    column, so it takes the size prop up. */}
                <NovaScoreDial score={dialScore} size={172} color={verdict.color} label={lang === "ta" ? "100க்கு" : "/ 100"} />
                {/* UXD-19 — the calm verdict phrase leads; the number supports it. */}
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: verdict.color, textAlign: "center", lineHeight: 1.15 }}>{verdict.verdict}</div>
                {/* Finding 9 — this link said "Why this score" and landed on a
                    section headed "Why this prediction?". One destination, two
                    names; the destination's heading wins. */}
                <a href="#nova-deep-dive" onClick={focusDeepDiveAfterHashNavigation} style={{ fontSize: "var(--text-base)", color: "var(--color-accent-secondary)", fontWeight: 600, textDecoration: "none" }}>
                  {dt(TODAY_HERO.whyLink, lang)}
                  <ArrowRight size={14} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "middle", marginLeft: "var(--space-1)" }} />
                </a>
              </Card>
              <p className="nova-hero-quote">
                &ldquo;{dt(TODAY_HERO.quote, lang)}&rdquo;
                <span className="nova-hero-quote__attribution">— {dt(TODAY_HERO.quoteAttribution, lang)}</span>
              </p>
              </div>
            );
          })()}

          {/* Timing rail. The hero above owns the ONE recommended window; this
              rail keeps the avoid window promoted beside it — that is the
              safety axis, not a competing recommendation — and lists the day's
              other named timings underneath it, times only.

              The "Other traditional timings" disclosure that used to close the
              rail was removed (owner call 2026-09-04). It had become a second,
              longer copy of the Key timings card below, and every system it
              named still has a home: Nalla Neram, Yamagandam, Kuligai and
              Abhijit in that card, Rahu Kalam on the avoid card above, Horai
              and the Nalla Neram segments on the ribbon under the hero. */}
          {(secondaryAbhijitWindow || showAvoidCard || panchangam) && (
            <div className="nova-hero-rail">
              {/* Finding 4 — the safety axis had no now-state while the
                  opportunity axis two columns left had three (before/during/
                  after) plus a countdown and a pulsing dot. So at 11:14 am,
                  with Rahu Kalam running 10:48–12:19, this card rendered
                  exactly what it renders at 4 pm: a static pair of times, while
                  the reader was standing inside the window. A caution earns
                  live state more than an invitation does. Same `spanPhase`
                  helper, same three states. */}
              {showAvoidCard && (
                <Card style={{ flex: "none", background: avoidPhase === "during" ? "var(--color-low-bg)" : "color-mix(in srgb, var(--color-surface) 62%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-4) var(--space-4)", display: "flex", flexDirection: "row", gap: "var(--space-3)", alignItems: "center", borderColor: avoidPhase === "during" ? "var(--color-low-border)" : undefined }}>
                  <div aria-hidden="true" style={{ position: "relative", width: "40px", height: "40px", borderRadius: "var(--radius-pill)", background: "var(--color-low-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-low)", flex: "none" }}>
                    <X size={19} strokeWidth={2} />
                    {avoidPhase === "during" && (
                      <span className="nova-pulse-dot" style={{ position: "absolute", top: "-1px", right: "-1px", width: "9px", height: "9px", borderRadius: "var(--radius-pill)", background: "var(--color-low)", boxShadow: "0 0 0 3px var(--color-surface)" }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Kicker as="div" color="var(--color-low)">
                      {lang === "ta" ? "தவிர்க்க வேண்டிய நேரம்" : "Avoid window"}
                    </Kicker>
                    <div className="nova-hero-time" style={{ marginTop: "4px" }}>
                      {formatClockLabel(avoidWindow.start, lang)} – {formatClockLabel(avoidWindow.end, lang)}
                    </div>
                    {avoidPhase && (
                      <div
                        role="status"
                        style={{
                          fontSize: "var(--text-sm)", fontWeight: avoidPhase === "during" ? 700 : 400, marginTop: "4px",
                          color: avoidPhase === "during" ? "var(--color-low)" : "var(--color-faint)",
                        }}
                      >
                        {avoidPhase === "during" && avoidCountdown
                          ? `${dt(TODAY_TIMINGS.avoidRunningNow, lang)} · ${dt(TODAY_TIMINGS.endsIn, lang).replace("%s", avoidCountdown)}`
                          : avoidCountdown
                            ? dt(TODAY_TIMINGS.startsIn, lang).replace("%s", avoidCountdown)
                            : null}
                      </div>
                    )}
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", marginTop: "3px" }}>
                      {windowTypeGlossary(avoidWindow.type) ? (
                        <GlossaryTerm term={windowTypeGlossary(avoidWindow.type)!} lang={lang}>{windowTypeLabel(avoidWindow.type, lang)}</GlossaryTerm>
                      ) : windowTypeLabel(avoidWindow.type, lang)}
                    </div>
                  </div>
                </Card>
              )}
              {/* ── Key timings, always visible (owner call 2026-09-04) ───────
                  The four a Tamil almanac reader checks by name, at a glance.
                  This was one of two copies until the "Other traditional
                  timings" disclosure was removed the same day; it is now the
                  only one, which is why the Abhijit row carries the kala
                  overlap (hero review finding 7) that used to live in the
                  panel. Rahu Kalam is deliberately absent — it is the avoid
                  card directly above, and repeating it here would put the day's
                  loudest caution in a quiet list. */}
              {(() => {
                const rows: Array<{ key: string; name: string; dot: string; times: string[]; note?: string }> = [];
                if (nallaNeramSpans.length) {
                  rows.push({
                    key: "nallaNeram",
                    name: lang === "ta" ? "நல்ல நேரம்" : "Nalla Neram",
                    dot: "var(--color-high)",
                    times: nallaNeramSpans
                      .map((s) => `${formatClockLabel(s.start, lang)} – ${formatClockLabel(s.end, lang)}`),
                  });
                }
                if (panchangam?.kalam.yamagandam) {
                  rows.push({
                    key: "yamagandam",
                    name: windowTypeLabel("YAMAGANDAM", lang),
                    dot: "var(--color-accent-secondary)",
                    times: [`${formatClockLabel(panchangam.kalam.yamagandam.start, lang)} – ${formatClockLabel(panchangam.kalam.yamagandam.end, lang)}`],
                  });
                }
                if (panchangam?.kalam.kuligai) {
                  rows.push({
                    key: "kuligai",
                    name: windowTypeLabel("KULIGAI", lang),
                    dot: "var(--color-low)",
                    times: [`${formatClockLabel(panchangam.kalam.kuligai.start, lang)} – ${formatClockLabel(panchangam.kalam.kuligai.end, lang)}`],
                  });
                }
                if (secondaryAbhijitWindow) {
                  rows.push({
                    key: "abhijit",
                    name: lang === "ta" ? "அபிஜித் முகூர்த்தம்" : "Abhijit muhurtham",
                    dot: "var(--color-accent)",
                    times: [`${formatClockLabel(secondaryAbhijitWindow.start, lang)} – ${formatClockLabel(secondaryAbhijitWindow.end, lang)}`],
                    // Finding 7. Abhijit is ~48 minutes fixed around solar noon
                    // and the kalas move by weekday, so on a large fraction of
                    // Fridays Rahu Kalam clips its head — 24 of 49 minutes on
                    // the reviewed day. Listing it as a plain good time, one
                    // card under a recommendation whose whole argument is that
                    // it is clear of the kalas, gives two contradictory
                    // instructions. The note states the app's already-ruled
                    // position and names the clear part; it renders only on the
                    // days the two actually collide.
                    note: panchangam
                      ? abhijitOverlapNote(secondaryAbhijitWindow, [
                        { label: windowTypeLabel("RAHU_KALAM", lang), ...panchangam.kalam.rahuKalam },
                        { label: windowTypeLabel("YAMAGANDAM", lang), ...panchangam.kalam.yamagandam },
                        { label: windowTypeLabel("KULIGAI", lang), ...panchangam.kalam.kuligai },
                      ], lang) || undefined
                      : undefined,
                  });
                }
                if (rows.length === 0) return null;
                return (
                  <Card style={{
                    flex: "none", background: "color-mix(in srgb, var(--color-surface) 62%, transparent)",
                    borderRadius: "var(--radius-md)", padding: "var(--space-4)",
                    display: "flex", flexDirection: "column", gap: "var(--space-3)",
                  }}>
                    <Kicker as="div">{dt(TODAY_HERO.keyTimings, lang)}</Kicker>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
                      {rows.map((row) => (
                        <div key={row.key}>
                          <div className="nova-hero-timing">
                            <span aria-hidden="true" className="nova-hero-timing__dot" style={{ background: row.dot }} />
                            <span className="nova-hero-timing__name">{row.name}</span>
                            <span className="nova-hero-timing__times">
                              {row.times.map((span) => <span key={span}>{span}</span>)}
                            </span>
                          </div>
                          {row.note && (
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-mid-text)", lineHeight: 1.4, marginTop: "3px" }}>
                              {row.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {onGoToCalendar && (
                      <button
                        type="button"
                        // OD-4 text link: `.ui-btn` had centred this row's
                        // content and floored it at 38px.
                        className="ui-link"
                        onClick={onGoToCalendar}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "var(--space-2)", alignSelf: "flex-start",
                          marginTop: "var(--space-1)", paddingTop: "var(--space-3)",
                          borderTop: "1px solid var(--color-border)",
                          width: "100%",
                          fontSize: "var(--text-base)", fontWeight: 600,
                          "--ui-link-color": "var(--color-accent-secondary)",
                        } as CSSProperties}
                      >
                        <CalendarDays size={15} strokeWidth={2} aria-hidden="true" style={{ flex: "none" }} />
                        {dt(TODAY_HERO.viewFullAlmanac, lang)}
                        <ArrowRight size={14} strokeWidth={2} aria-hidden="true" style={{ flex: "none" }} />
                      </button>
                    )}
                  </Card>
                );
              })()}

            </div>
          )}
        </div>
      </div>

      {/* Life focus T5: a REMEDIES focus puts the remedy row directly under the hero. */}
      {lifeFocus.remediesFirst && familyRemedyRow}

      {/* ===== Quick Links — one-tap shortcuts to the highest-value functions
          that otherwise sit behind the "More" nav dropdown (Tools/Explore) or
          have no top-level nav entry at all (Journal). Placed right after the
          hero per the homepage redesign (2026-07-24). ===== */}
      <Reveal>
      <DashboardTodayQuickLinksNova
        lang={lang}
        needsProfile={needsProfile}
        onOpenChartGen={onOpenChartGen}
        onOpenMuhurta={onOpenMuhurta}
        onOpenCompatibility={onOpenCompatibility}
        onOpenActivityTiming={onOpenActivityTiming}
        onOpenRasipalan={onOpenRasipalan}
        onOpenNumerology={onOpenNumerology}
        onGoToJournal={onGoToJournal}
        onGoToExplore={onGoToExplore}
        onGoToAllTools={onGoToAllTools}
        focusArea={lifeFocus.area}
      />
      </Reveal>

      {userMode === "BEGINNER" && personalDailyGuidance && (
        <FirstResultGuide lang={lang} action={personalDailyGuidance.actionSuggestion} />
      )}

      {/* The two-minute reading, but only while it has something new to say.
          `readingWindow` is the current antardasha — months to years — and most
          of its beats are natal and never move at all, so this slot was
          spending ~240 words a day on a piece of writing whose own subtitle
          says it will not change until March. Once read, it collapses to a
          single line pointing at Family & Charts, and it expands again by
          itself when the bhukti turns and the backend rewrites it. See
          `collapseWhenRead`. */}
      {activeChartId && (
        <DashboardOneMinuteReading
          lang={lang}
          chartId={activeChartId}
          onOpenFullChart={onGoToCharts}
          deferUntilVisible
          collapseWhenRead
        />
      )}

      {/* Fail-soft notice (DASH-02): the day bundle loaded but some sections
          couldn't be computed — offer a one-tap retry instead of blanking. */}
      {onRetryBundle && bundleSectionErrors && Object.keys(bundleSectionErrors).length > 0 && (
        <Card
          variant="low"
          role="status"
          style={{
            display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-2_5)", flexWrap: "wrap",
            padding: "var(--space-2_5) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text)",
          }}
        >
          <span aria-hidden="true" style={{ display: "inline-flex", color: "var(--color-low)" }}><AlertTriangle size={15} strokeWidth={2} /></span>
          <span style={{ flex: 1, minWidth: "180px" }}>
            {t("today_sections_failed", lang)}
          </span>
          <button
            type="button"
            onClick={onRetryBundle}
            style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent-strong)", background: "none", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3_5)", cursor: "pointer", fontFamily: "inherit" }}
          >
            {t("today_retry", lang)}
          </button>
        </Card>
      )}

      {/* ===== 2. "Is today okay for…?" — one activity-timing card. This was
          two sections (a four-pill decision strip above an eleven-row board)
          that asked the same question of the same engine and repeated four of
          the same activities under different labels; they are now one. ===== */}
      <Reveal>
      <DashboardTodayActivityBoardNova
        board={personalDailyGuidance?.activityBoard}
        lang={lang}
        chartId={activeChartId || null}
        selectedDate={dataDate}
        bestWindow={bestWindow}
        now={now}
        isToday={isToday}
        timeZone={panchangamTimezone}
        onOpenAskVinaadi={onOpenAskVinaadi}
        onGoToCalendar={onGoToCalendar}
        focusActivities={lifeFocus.activities}
        focusMode={activeLifeMode}
      />
      </Reveal>

      {/* ===== 3. Timeline spine: sunrise-to-sunrise, panchangam + horai +
          week-ahead dots merged in — the one place all day-timing lives. ===== */}
      <Reveal>
      <DashboardTodayRibbonNova
        lang={lang}
        panchangam={panchangam}
        weekAhead={weekAhead}
        selectedDate={dataDate}
        now={now}
        timeZone={panchangamTimezone}
        onGoToCalendar={onGoToCalendar}
      />
      </Reveal>

      {/* ===== 4. Life Areas + Dasa Chapter row (redesign 2026-07-18). ===== */}
      <Reveal>
      <DashboardTodayLifeAreasDasaRowNova
        lang={lang}
        personalChartSummary={personalChartSummary}
        dasha={dasha}
        dashaAntar={dashaAntar}
        selectedDate={dataDate}
        lifeAreas={lifeAreas}
        pending={personalPending}
        focusArea={lifeFocus.area}
        onGoToChart={onGoToChart}
        onGoToLifeAreas={onGoToLifeAreas}
      />
      </Reveal>

      {!lifeFocus.remediesFirst && familyRemedyRow}

      {/* ===== 6. Deep-dive bridge — the single doorway to the chart engine.
          The full engine (planet table, chart explanation, vargas, shadbala,
          alternate dashas, classical timing, birth-star profile, Prasna, PDF)
          lives in the "Family & Charts" tab (DashboardChartsPanelNova). This
          keeps Today a decision layer only. The hero's "Why this prediction ->"
          anchors here; this card's button opens the full charts.

          `tabIndex={-1}` so that jump actually moves focus here, not just the
          viewport (finding 9) — a keyboard or screen-reader user was left where
          they started, with no confirmation they had arrived anywhere. ===== */}
      {personalDailyGuidance && (
        <Card id="nova-deep-dive" tabIndex={-1} style={{ borderColor: "var(--color-border-strong)", padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-accent-strong)" }}>
              {lang === "ta" ? "இந்த கணிப்பு ஏன்?" : "Why this prediction?"}
            </h2>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {lang === "ta" ? "இன்றைய ஜோதிடத்தின் அடிப்படை" : "the astrology behind today"}
            </span>
            {/* Finding 5, second half — the band is evidence strength, not a
                second verdict on the day. Here it sits beside the reasons it
                comes from, with the axis named, instead of contradicting the
                verdict phrase in the hero. */}
            {personalDailyGuidance.band && (() => {
              const bt = bandTone(personalDailyGuidance.band);
              return (
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: bt.bg, color: bt.text, border: `1px solid ${bt.border}` }}>
                  {dt(TODAY_HERO.chartSupport, lang)}: {bandPhrase(personalDailyGuidance.band, lang)}
                </span>
              );
            })()}
            {onGoToCharts && (
              <button
                type="button"
                className="ui-btn ui-btn--primary"
                onClick={onGoToCharts}
                style={{ marginLeft: "auto" }}
              >
                {lang === "ta" ? "ஜாதகம் & விளக்கம் திற" : "Open Chart & Explanations"}
                <ArrowRight size={13} strokeWidth={2} aria-hidden="true" style={{ marginLeft: "var(--space-1)" }} />
              </button>
            )}
            {activeChartId && (
              <button
                type="button"
                onClick={() => void downloadJadhagamPdf(activeChartId, dataDate, lang)}
                style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "none", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3)", cursor: "pointer", fontFamily: "inherit", ...(onGoToCharts ? {} : { marginLeft: "auto" }) }}
              >
                ⤓ PDF
              </button>
            )}
          </div>
          {personalDailyGuidance.reasons && (() => {
            // No per-tile "NN/100" chip here. The breakdown values are *weighted
            // contributions* (weights 0.19 / 0.14 / 0.24), and reconstructing a
            // layer's own 0–100 score by dividing back out is lossy — the
            // contribution is a rounded int, so dasha 41 came back as 42 and
            // transit 35 as 33, contradicting the exact score the reason prose
            // already states in its first sentence ("…support is reduced
            // (41/100)"). The prose number is authoritative; showing a second,
            // reconstructed one beside it just read as the app disagreeing with
            // itself. One number, in the sentence, wins.
            type ReasonTile = { key: string; glossary: GlossaryKey; label: string; text: NonNullable<typeof personalDailyGuidance.reasons.dashaSupport> };
            const maybeTiles: Array<ReasonTile | null> = [
              personalDailyGuidance.reasons.dashaSupport
                ? { key: "dasha", glossary: "dasha", label: lang === "ta" ? "தசை அடுக்கு" : "Dasa layer", text: personalDailyGuidance.reasons.dashaSupport }
                : null,
              personalDailyGuidance.reasons.panchangam
                ? { key: "panchangam", glossary: "panchangam", label: lang === "ta" ? "பஞ்சாங்கம்" : "Panchangam", text: personalDailyGuidance.reasons.panchangam }
                : null,
              personalDailyGuidance.reasons.gochar
                ? { key: "gochar", glossary: "gochar", label: lang === "ta" ? "கோசாரம்" : "Transit", text: personalDailyGuidance.reasons.gochar }
                : null,
            ];
            const tiles = maybeTiles.filter((tile): tile is ReasonTile => tile !== null);
            // Tiles sit in their own (narrower-than-full) column beside the
            // orbit illustration — .nova-deepdive-grid (2fr/1fr, collapses to
            // one column ≤860px) rather than stretching the tiles the full
            // card width the way a plain auto-fit grid would.
            return (
              <div className="nova-deepdive-grid">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-2_5)" }}>
                  {tiles.map((tile) => (
                    <Card key={tile.key} style={{ display: "block", background: "color-mix(in srgb, var(--color-text-strong) 4%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3_5)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>
                      <div style={{ marginBottom: "6px" }}>
                        <b style={{ color: "var(--color-accent-strong)", fontSize: "var(--text-sm)" }}>
                          <GlossaryTerm term={tile.glossary} lang={lang}>{tile.label}</GlossaryTerm>
                        </b>
                      </div>
                      {tLang(tile.text, lang)}
                    </Card>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DeepDiveOrbitGlyph size={168} className="nova-deepdive-glyph" />
                </div>
              </div>
            );
          })()}
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
            {lang === "ta" ? (
              <>கிரக நிலைகள் · ஜாதகம் · வர்க்க அட்டவணைகள் · தசை அட்டவணைகள் · நட்சத்திர விவரம் இப்போது <b style={{ color: "var(--color-muted)" }}>குடும்பம் &amp; ஜாதகம்</b> தாவலில் உள்ளன.</>
            ) : (
              <>Planet positions · birth chart · divisional charts · dasha tables · birth-star profile now live in <b style={{ color: "var(--color-muted)" }}>Family &amp; Charts</b>.</>
            )}
          </div>
        </Card>
      )}

      {/* Morning Guidance moved to the workspace footer (redesign 2026-07-18)
          — see DashboardFooterMorningGuidance in dashboard-workspace.tsx. */}
    </div>
  );
}
