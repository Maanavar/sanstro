"use client";

import { useEffect, useState } from "react";
import { ArrowRight, X, Diamond, Sparkle, AlertTriangle, Leaf, type LucideIcon } from "lucide-react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { addDays, formatClockLabel, formatDateLabel, getScoreVerdictFromGuidance } from "@/lib/format";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { dt, FIRST_RESULT_GUIDE } from "@/lib/dashboard-i18n";
import { hourInZone, minutesOfDayInZone, timeOnDateToMs } from "@/lib/tz";
import { findSecondaryAbhijitWindow, pickFeaturedWindow } from "@/lib/today-windows";
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

import { NovaClampedText, NovaScoreDial, NovaStarRow, StatusLive, type StatusMessage } from "./dashboard-ui-nova";
import { festivalTags } from "./dashboard-calendar-shared";
import { bandPhrase, bandTone } from "@/lib/reasoning";
import { MiniMoonGlyph } from "./celestial-glyph-nova";
import { HeroSkyBackdrop, DeepDiveOrbitGlyph } from "./celestial-ambient-nova";
import { lunarSpecialTithiMeta, moonPhaseFromTithi } from "@/lib/lunar";
import { useStreak } from "@/hooks/useStreak";
import { StreakChip } from "./streak-chip";
import { useEveningPreview } from "@/hooks/useEveningPreview";
import type { MemberChart } from "@/hooks/useFamilyData";

import { Card, Kicker } from "./ui";
import { downloadJadhagamPdf } from "./dashboard-personal-shared";
import { DashboardTodayRibbonNova, findHorai } from "./dashboard-today-ribbon-nova";
import { DashboardTodayActivityBoardNova } from "./dashboard-today-activity-board-nova";
import {
  DashboardTodayFamilyRemedyRowNova,
  DashboardTodayLifeAreasDasaRowNova,
  DashboardTodayQuickLinksNova,
} from "./dashboard-today-glance-nova";
import { DashboardOneMinuteReading } from "./dashboard-one-minute-reading";

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
      <a href="#nova-deep-dive" style={{ alignSelf: "flex-start", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 700, textDecoration: "none" }}>
        {dt(FIRST_RESULT_GUIDE.whyTrail, lang)}
        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "middle", marginLeft: "var(--space-1)" }} />
      </a>
    </Card>
  );
}

export function DashboardTodayTabNova({
  lang,
  userMode = "BALANCED",
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
  const activeChartId = personalChartSummary?.chartId ?? "";
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<StatusMessage | null>(null);

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

  const isToday = selectedDate === todayDate;

  // Feature a personalized, day-varying window rather than the always-noon
  // Abhijit slot the backend lists first (see lib/today-windows.ts).
  const bestWindow = pickFeaturedWindow(personalDailyGuidance?.bestWindows, now, isToday, selectedDate, panchangamTimezone);
  // DASH-10.1 (2026-07-16): Abhijit never fully disappears — surfaced as a
  // small secondary line when a personal window won the hero instead.
  const secondaryAbhijitWindow = findSecondaryAbhijitWindow(personalDailyGuidance?.bestWindows, bestWindow);
  // Keep a ranked timing conflict attached to the one actionable recommendation,
  // rather than rendering a second copy of the best-window card in the rail.
  const windowConflict = bestWindow ? personalDailyGuidance?.bestWindowConflicts?.[0] ?? null : null;

  // Real lunar phase for today, drawn straight from the tithi we already have —
  // drives the hero sky backdrop's moon shape (thin crescent -> full disc).
  const moonPhase = panchangam ? moonPhaseFromTithi(panchangam.tithi.number, panchangam.tithi.paksha) : null;

  // Hero tile rail (redesign 2026-07-18): avoid window = the day's first
  // caution window, falling back to Rahu Kalam from the panchangam; Horai
  // resolves against "now" so it only renders when viewing today.
  const avoidWindow = personalDailyGuidance?.cautionWindows?.[0]
    ?? (panchangam ? { type: "RAHU_KALAM", start: panchangam.kalam.rahuKalam.start, end: panchangam.kalam.rahuKalam.end } : null);
  const { current: heroHora, next: heroNextHora } = isToday && panchangam
    ? findHorai(panchangam.hora, zoneMinutes)
    : { current: null, next: null };

  // After 8pm (panchangam-local), the hero can swap to a preview of tomorrow +
  // a journal prompt for today — reuses the already-fetched 3-day
  // dailyGuidanceRange (today..+2), no extra network call. Gated by isToday so
  // opening a past or future date from the calendar never triggers it.
  const tomorrowIso = addDays(selectedDate, 1);
  const tomorrowGuidance = dailyGuidanceRange?.items.find((item) => item.dateLocal === tomorrowIso) ?? null;
  const showEveningPreview = eveningPreviewOn && isToday && zoneHour >= 20 && tomorrowGuidance !== null;
  const tomorrowWeekday = new Date(`${tomorrowIso}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "long" });

  let windowPhase: "before" | "during" | "after" | null = null;
  let windowCountdown: string | null = null;
  if (bestWindow && isToday) {
    const startMs = timeOnDateToMs(selectedDate, bestWindow.start, panchangamTimezone);
    const endMs = timeOnDateToMs(selectedDate, bestWindow.end, panchangamTimezone);
    if (startMs !== null && endMs !== null) {
      const nowMs = now.getTime();
      if (nowMs < startMs) {
        windowPhase = "before";
        windowCountdown = formatDuration(startMs - nowMs, lang);
      } else if (nowMs <= endMs) {
        windowPhase = "during";
        windowCountdown = formatDuration(endMs - nowMs, lang);
      } else {
        windowPhase = "after";
      }
    }
  }

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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* ===== 1. Hero: greeting, one theme line, mood chips, embedded
          best-window "next action" tile, and the one canonical score. ===== */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, var(--color-surface-soft), var(--color-surface-3))",
        border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "var(--space-6) var(--space-7)",
      }}>
        <HeroSkyBackdrop moon={moonPhase} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "var(--space-7)", alignItems: "stretch", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "280px", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                {weekday && `${weekday} · `}{formatDateLabel(selectedDate)}
                {panchangam?.tamilDate && <> · <span style={{ color: "var(--color-accent-strong)", fontWeight: 600 }}>{lang === "ta" ? panchangam.tamilDate.ta : panchangam.tamilDate.en}</span></>}
              </span>
              {paksha && (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-accent-secondary)", display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)" }}>
                  {moonPhase ? <MiniMoonGlyph phase={moonPhase} size={18} /> : (wax ? "◐" : "◑")} {specialTithiMeta ? specialTithiMeta.label : wax ? (lang === "ta" ? "வளர்பிறை" : "Waxing") : (lang === "ta" ? "தேய்பிறை" : "Waning")} · {primaryFestival ? primaryFestival.name : wax ? (lang === "ta" ? "சுக்ல பக்ஷம்" : "Sukla Paksham") : (lang === "ta" ? "கிருஷ்ண பக்ஷம்" : "Krishna Paksham")}
                </span>
              )}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <StreakChip days={streakDays} best={streakBest} forgiven={streakForgiven} lang={lang} />
                <button
                  type="button"
                  onClick={() => setEveningPreviewOn(!eveningPreviewOn)}
                  title={lang === "ta"
                    ? "இரவு 8 மணிக்குப் பின் நாளையை முன்னோட்டமாகக் காட்டு"
                    : "After 8pm, preview tomorrow here instead of today"}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)", fontSize: "var(--text-xs)", fontWeight: 600,
                    color: eveningPreviewOn ? "var(--color-accent-strong)" : "var(--color-faint)",
                    background: eveningPreviewOn ? "var(--color-accent-muted)" : "none",
                    border: `1px solid ${eveningPreviewOn ? "var(--color-border-strong)" : "var(--color-border)"}`,
                    borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2_5) var(--space-1) var(--space-2)", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  🌙 {lang === "ta" ? "மாலை முன்னோட்டம்" : "Evening preview"}
                  <span style={{
                    display: "inline-block", width: "20px", height: "11px", borderRadius: "var(--radius-pill)",
                    background: eveningPreviewOn ? "var(--color-high)" : "color-mix(in srgb, var(--color-text-strong) 18%, transparent)",
                    position: "relative", flex: "none", transition: "background 0.15s",
                  }}>
                    <span style={{
                      position: "absolute", top: "1.5px", left: eveningPreviewOn ? "10px" : "1.5px",
                      width: "8px", height: "8px", borderRadius: "var(--radius-pill)", background: "var(--color-on-accent)",
                      transition: "left 0.15s",
                    }} />
                  </span>
                </button>
              </div>
            </div>
            {showEveningPreview && tomorrowGuidance ? (
              <>
                <Kicker>{t("tab_today", lang)}</Kicker>
                <div style={{ fontSize: "clamp(17px, 1.8vw, 22px)", color: "var(--color-accent-secondary)", lineHeight: 1.2 }}>
                  {greetingWord(lang, zoneHour)},
                </div>
                {/* audit B-1: the greeting+name is the page's one <h1> — Today
                    previously shipped zero headings (no document outline). */}
                <h1 style={{
                  margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, lineHeight: 1.08,
                  fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)", maxWidth: "480px",
                  background: "linear-gradient(120deg, var(--color-text-strong), var(--color-accent-secondary))",
                  WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {heroFirstName}
                </h1>
                <div style={{ fontSize: "var(--text-base)", color: "var(--color-accent-secondary)", fontWeight: 600 }}>
                  {lang === "ta" ? "நாளையைப் பற்றி ஒரு முன்னோட்டம் — " : "A look ahead to tomorrow — "}
                  {tomorrowWeekday}, {formatDateLabel(tomorrowIso)}
                </div>
                <NovaClampedText
                  lines={3}
                  maxWidth="600px"
                  style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-md)", lineHeight: 1.55, color: "var(--color-text)" }}
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
                          {lang === "ta" ? `சூரிய உதயம் ${formatClockLabel(panchangam.sunrise)} இல் நாள் முடிகிறது` : `day closes at sunrise ${formatClockLabel(panchangam.sunrise)}`}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", marginTop: "2px" }}>
                      {(() => {
                        const tw = pickFeaturedWindow(tomorrowGuidance.bestWindows, now, false, tomorrowIso, panchangamTimezone);
                        return tw
                          ? (lang === "ta"
                            ? <>நாளை முதல் நல்ல நேரம் · <b style={{ color: "var(--color-high)" }}>{formatClockLabel(tw.start)} – {formatClockLabel(tw.end)}</b></>
                            : <>Tomorrow&rsquo;s first good window · <b style={{ color: "var(--color-high)" }}>{formatClockLabel(tw.start)} – {formatClockLabel(tw.end)}</b></>)
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
                      onClick={() => void handleSaveReminder()}
                      disabled={savingReminder}
                      style={{ fontSize: "var(--text-sm)", fontWeight: 600, border: "1px solid var(--color-border-strong)", color: "var(--color-accent-strong)", background: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3_5)", cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit" }}
                    >
                      {savingReminder ? (lang === "ta" ? "…" : "Saving…") : (lang === "ta" ? "நினைவூட்டு" : "Remind me")}
                    </button>
                  </div>
                </Card>
                <StatusLive status={reminderStatus} />
              </>
            ) : (
              <>
                <Kicker>{t("tab_today", lang)}</Kicker>
                <div style={{ fontSize: "clamp(17px, 1.8vw, 22px)", color: "var(--color-accent-secondary)", lineHeight: 1.2 }}>
                  {greetingWord(lang, zoneHour)},
                </div>
                {/* audit B-1: the greeting+name is the page's one <h1> — Today
                    previously shipped zero headings (no document outline). */}
                <h1 style={{
                  margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, lineHeight: 1.08,
                  fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)", maxWidth: "480px",
                  background: "linear-gradient(120deg, var(--color-text-strong), var(--color-accent-secondary))",
                  WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {heroFirstName}
                </h1>
                <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55, maxWidth: "520px" }}>
                  {lang === "ta"
                    ? "இன்றைய வழிகாட்டுதல், ஜாதக மதிப்பெண் மற்றும் சிறந்த நேரங்கள் — ஒரே பார்வையில்."
                    : "Today's guidance, your chart score, and the best windows — at a glance."}
                </p>
                {personalDailyGuidance && (
                  <NovaClampedText
                    lines={3}
                    maxWidth="600px"
                    style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-md)", lineHeight: 1.55, color: "var(--color-text)" }}
                  >
                    {tLang(personalDailyGuidance.briefing ?? personalDailyGuidance.text, lang)}
                  </NovaClampedText>
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
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "var(--space-2)", alignSelf: "flex-start",
                      textDecoration: "none", fontFamily: "inherit",
                      background: "var(--color-mid-bg)", border: "1px solid var(--color-mid-border)",
                      borderRadius: "var(--radius-pill)", padding: "var(--space-1_5) var(--space-3_5)", maxWidth: "100%",
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: "var(--text-base)", flex: "none" }}>🌘</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <b style={{ color: "var(--color-mid-text)", fontWeight: 700 }}>{lang === "ta" ? "இன்று சந்திராஷ்டமம்" : "Chandrashtama today"}</b>
                      <span style={{ color: "var(--color-muted)" }}> — {lang === "ta" ? "கவனம் தேவை, பயம் அல்ல" : "a day for awareness, not alarm"}</span>
                    </span>
                    <span style={{ display: "inline-flex", color: "var(--color-mid-text)", flex: "none" }}><ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></span>
                  </a>
                )}
                {personalDailyGuidance?.emotionalWeather && (
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    {([
                      { Icon: Leaf, label: personalDailyGuidance.emotionalWeather.tone, color: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)" },
                      { Icon: Sparkle, label: personalDailyGuidance.emotionalWeather.physicalTendency, color: "var(--color-accent-strong)", bg: "var(--color-accent-muted)", border: "var(--color-border-strong)" },
                      { Icon: AlertTriangle, label: personalDailyGuidance.emotionalWeather.bestUseOfDay, color: "var(--color-low)", bg: "var(--color-low-bg)", border: "var(--color-low-border)" },
                    ] as { Icon: LucideIcon; label: string; color: string; bg: string; border: string }[]).filter((tag) => tag.label).map((tag) => (
                      <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)", fontSize: "var(--text-sm)", color: "var(--color-text)", background: tag.bg, border: `1px solid ${tag.border}`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                        <tag.Icon size={13} strokeWidth={2} aria-hidden="true" style={{ color: tag.color }} /> {tag.label}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ flex: 1 }} />

                {/* Next-action tile — the single best-window callout, embedded in
                    the hero per design 8a §3 (not a separate card below it). */}
                {bestWindow && (
                  <Card variant="high" style={{
                    display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", marginTop: "2px", flexWrap: "wrap", rowGap: "var(--space-2_5)",
                    borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)",
                  }}>
                    <span className="nova-pulse-dot" style={{ width: "9px", height: "9px", borderRadius: "var(--radius-pill)", background: "var(--color-high)", boxShadow: "0 0 0 4px var(--color-high-bg)", flex: "none" }} />
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-high)", fontVariantNumeric: "tabular-nums" }}>
                        {lang === "ta" ? "சிறந்த நேரம்" : "Best window"} · {formatClockLabel(bestWindow.start)} – {formatClockLabel(bestWindow.end)}
                        {windowCountdown && (
                          <span style={{ fontWeight: 400, color: "var(--color-faint)" }}>
                            {" · "}
                            {windowPhase === "before"
                              ? (lang === "ta" ? `${windowCountdown} இல் தொடங்குகிறது` : `starts in ${windowCountdown}`)
                              : (lang === "ta" ? `${windowCountdown} இல் முடிகிறது` : `ends in ${windowCountdown}`)}
                          </span>
                        )}
                      </div>
                      {windowConflict && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-low)", marginTop: "6px", paddingTop: "6px", borderTop: "1px solid var(--color-border)", lineHeight: 1.35, display: "flex", gap: "var(--space-2)" }}>
                          <AlertTriangle size={12} strokeWidth={2} aria-hidden="true" style={{ flex: "none", marginTop: "2px" }} />
                          <span>
                            <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                              {formatClockLabel(windowConflict.start)} – {formatClockLabel(windowConflict.end)}
                            </span>
                            {" · "}
                            {lang === "ta" ? windowConflict.text.ta : windowConflict.text.en}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-2)", flex: "none" }}>
                      <button
                        type="button"
                        onClick={() => void handleSaveReminder()}
                        disabled={savingReminder}
                        style={{ fontSize: "var(--text-sm)", fontWeight: 700, background: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3_5)", cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit" }}
                      >
                        {savingReminder ? (lang === "ta" ? "…" : "Saving…") : (lang === "ta" ? "நினைவூட்டு" : "Remind me")}
                      </button>
                      {onGoToJournal && (
                        <button
                          type="button"
                          onClick={onGoToJournal}
                          style={{ fontSize: "var(--text-sm)", fontWeight: 600, border: "1px solid var(--color-border-strong)", color: "var(--color-accent-strong)", background: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3_5)", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {lang === "ta" ? "தருணம் பதிவு" : "Log a moment"}
                        </button>
                      )}
                    </div>
                  </Card>
                )}
                <StatusLive status={reminderStatus} />
              </>
            )}
          </div>

          {/* The ONLY score on the page — tomorrow's, while previewing tomorrow.
              Framed card per the 2026-07-18 redesign, stars derived from the
              same score the dial shows. */}
          {(() => {
            const isTomorrow = showEveningPreview && tomorrowGuidance != null;
            const dialSource = isTomorrow ? tomorrowGuidance : personalDailyGuidance;
            if (!dialSource) return null;
            const dialScore = dialSource.score ?? 0;
            const verdict = getScoreVerdictFromGuidance(dialSource.label, dialScore, lang);
            return (
              <Card style={{
                flex: "none", width: "196px", alignSelf: "center",
                background: "color-mix(in srgb, var(--color-surface) 62%, transparent)",
                borderColor: "var(--color-border-strong)", borderRadius: "var(--radius-md)",
                padding: "var(--space-4_5) var(--space-3_5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
              }}>
                <Kicker style={{ letterSpacing: "0.14em" }}>
                  {isTomorrow
                    ? (lang === "ta" ? "நாளைய மதிப்பெண்" : "Tomorrow's score")
                    : (lang === "ta" ? "இன்றைய மதிப்பெண்" : "Today's score")}
                </Kicker>
                <NovaScoreDial score={dialScore} color={verdict.color} label={lang === "ta" ? "100க்கு" : "/ 100"} />
                <NovaStarRow value={dialScore / 20} size={14} />
                {/* UXD-19 — the calm verdict phrase leads; the number supports it. */}
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-md)", fontWeight: 700, color: verdict.color, textAlign: "center", lineHeight: 1.15 }}>{verdict.verdict}</div>
                {!isTomorrow && personalDailyGuidance?.band && (() => {
                  const bt = bandTone(personalDailyGuidance.band);
                  return (
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: bt.bg, color: bt.text, border: `1px solid ${bt.border}` }}>
                      {bandPhrase(personalDailyGuidance.band, lang)}
                    </span>
                  );
                })()}
                <a href="#nova-deep-dive" style={{ fontSize: "var(--text-xs)", color: "var(--color-accent-secondary)", fontWeight: 600, textDecoration: "none" }}>
                  {lang === "ta" ? "இந்த மதிப்பெண் ஏன்?" : "Why this score"}
                  <ArrowRight size={12} strokeWidth={2} aria-hidden="true" style={{ verticalAlign: "middle", marginLeft: "var(--space-1)" }} />
                </a>
              </Card>
            );
          })()}

          {/* Timing rail: the primary card above owns the featured best window;
              this rail holds its complementary auspicious timing plus caution
              and current-Horai context. */}
          {(secondaryAbhijitWindow || avoidWindow || heroHora) && (
            <div style={{ flex: "none", width: "224px", alignSelf: "center", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {secondaryAbhijitWindow && (
                <Card style={{ flex: "none", background: "color-mix(in srgb, var(--color-surface) 62%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3_5)", display: "flex", flexDirection: "row", gap: "var(--space-3)", alignItems: "center" }}>
                  <div aria-hidden="true" style={{ width: "32px", height: "32px", borderRadius: "var(--radius-pill)", background: "var(--color-high-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-high)", flex: "none" }}><Sparkle size={16} strokeWidth={2} /></div>
                  <div style={{ minWidth: 0 }}>
                    <Kicker as="div" color="var(--color-high)">
                      {lang === "ta" ? "அபிஜித் முகூர்த்தம்" : "Abhijit muhurtham"}
                    </Kicker>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)", marginTop: "3px", fontVariantNumeric: "tabular-nums" }}>
                      {formatClockLabel(secondaryAbhijitWindow.start)} – {formatClockLabel(secondaryAbhijitWindow.end)}
                    </div>
                    {secondaryAbhijitWindow.text && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "2px", lineHeight: 1.35 }}>
                        {lang === "ta" ? secondaryAbhijitWindow.text.ta : secondaryAbhijitWindow.text.en}
                      </div>
                    )}
                  </div>
                </Card>
              )}
              {avoidWindow && (
                <Card style={{ flex: "none", background: "color-mix(in srgb, var(--color-surface) 62%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3_5)", display: "flex", flexDirection: "row", gap: "var(--space-3)", alignItems: "center" }}>
                  <div aria-hidden="true" style={{ width: "32px", height: "32px", borderRadius: "var(--radius-pill)", background: "var(--color-low-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-low)", flex: "none" }}><X size={16} strokeWidth={2} /></div>
                  <div style={{ minWidth: 0 }}>
                    <Kicker as="div" color="var(--color-low)">
                      {lang === "ta" ? "தவிர்க்க வேண்டிய நேரம்" : "Avoid window"}
                    </Kicker>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)", marginTop: "3px", fontVariantNumeric: "tabular-nums" }}>
                      {formatClockLabel(avoidWindow.start)} – {formatClockLabel(avoidWindow.end)}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "2px" }}>
                      {windowTypeLabel(avoidWindow.type, lang)}
                    </div>
                  </div>
                </Card>
              )}
              {heroHora && (
                <Card style={{ flex: "none", background: "color-mix(in srgb, var(--color-surface) 62%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3_5)", display: "flex", flexDirection: "row", gap: "var(--space-3)", alignItems: "center" }}>
                  <div aria-hidden="true" style={{ width: "32px", height: "32px", borderRadius: "var(--radius-pill)", background: "color-mix(in srgb, var(--color-accent-secondary) 16%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-accent-secondary)", flex: "none" }}><Diamond size={15} strokeWidth={2} /></div>
                  <div style={{ minWidth: 0 }}>
                    <Kicker as="div" color="var(--color-accent-secondary)">
                      {lang === "ta" ? "இப்போதைய ஓரை" : "Horai now"}
                    </Kicker>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)", marginTop: "3px" }}>
                      {tPlanetLord(heroHora.lord, lang)}
                    </div>
                    {heroNextHora && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "2px" }}>
                        {lang === "ta" ? "அடுத்தது" : "Next"}: {tPlanetLord(heroNextHora.lord, lang)} · {formatClockLabel(heroNextHora.start)}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== Quick Links — one-tap shortcuts to the highest-value functions
          that otherwise sit behind the "More" nav dropdown (Tools/Explore) or
          have no top-level nav entry at all (Journal). Placed right after the
          hero per the homepage redesign (2026-07-24). ===== */}
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
      />

      {userMode === "BEGINNER" && personalDailyGuidance && (
        <FirstResultGuide lang={lang} action={personalDailyGuidance.actionSuggestion} />
      )}

      {activeChartId && (
        <DashboardOneMinuteReading
          lang={lang}
          chartId={activeChartId}
          onOpenFullChart={onGoToCharts}
          deferUntilVisible
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
      <DashboardTodayActivityBoardNova
        board={personalDailyGuidance?.activityBoard}
        lang={lang}
        chartId={activeChartId || null}
        selectedDate={selectedDate}
        bestWindow={bestWindow}
        now={now}
        isToday={isToday}
        timeZone={panchangamTimezone}
        onOpenAskVinaadi={onOpenAskVinaadi}
        onGoToCalendar={onGoToCalendar}
      />

      {/* ===== 3. Timeline spine: sunrise-to-sunrise, panchangam + horai +
          week-ahead dots merged in — the one place all day-timing lives. ===== */}
      <DashboardTodayRibbonNova
        lang={lang}
        panchangam={panchangam}
        weekAhead={weekAhead}
        selectedDate={selectedDate}
        now={now}
        timeZone={panchangamTimezone}
        onGoToCalendar={onGoToCalendar}
      />

      {/* ===== 4. Life Areas + Dasa Chapter row (redesign 2026-07-18). ===== */}
      <DashboardTodayLifeAreasDasaRowNova
        lang={lang}
        personalChartSummary={personalChartSummary}
        dasha={dasha}
        dashaAntar={dashaAntar}
        selectedDate={selectedDate}
        lifeAreas={lifeAreas}
        onGoToChart={onGoToChart}
        onGoToLifeAreas={onGoToLifeAreas}
      />

      {/* ===== 5. Family Today + Remedy For You row (redesign 2026-07-18,
          "Coming up" folded into Family Today's footer 2026-08-20) — the
          remedy grows from a one-liner into a card with its own save action;
          family members get star tiles; Family Today pins "Coming up" to its
          bottom so a small/solo household doesn't leave the card looking
          empty next to the taller Remedy card. ===== */}
      <DashboardTodayFamilyRemedyRowNova
        lang={lang}
        familyAggregate={familyAggregate}
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

      {/* ===== 6. Deep-dive bridge — the single doorway to the chart engine.
          The full engine (planet table, chart explanation, vargas, shadbala,
          alternate dashas, classical timing, birth-star profile, Prasna, PDF)
          lives in the "Family & Charts" tab (DashboardChartsPanelNova). This
          keeps Today a decision layer only. The hero's "Why this score ->"
          anchors here; this card's button opens the full charts. ===== */}
      {personalDailyGuidance && (
        <Card id="nova-deep-dive" style={{ borderColor: "var(--color-border-strong)", padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3_5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-accent-strong)" }}>
              {lang === "ta" ? "இந்த கணிப்பு ஏன்?" : "Why this prediction?"}
            </h2>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {lang === "ta" ? "இன்றைய ஜோதிடத்தின் அடிப்படை" : "the astrology behind today"}
            </span>
            {onGoToCharts && (
              <button
                type="button"
                onClick={onGoToCharts}
                style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3_5)", cursor: "pointer", fontFamily: "inherit" }}
              >
                {lang === "ta" ? "ஜாதகம் & விளக்கம் திற" : "Open Chart & Explanations"}
                <ArrowRight size={13} strokeWidth={2} aria-hidden="true" style={{ marginLeft: "var(--space-1)" }} />
              </button>
            )}
            {activeChartId && (
              <button
                type="button"
                onClick={() => void downloadJadhagamPdf(activeChartId, selectedDate, lang)}
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
            const tiles = [
              { label: lang === "ta" ? "தசை அடுக்கு" : "Dasa layer", text: personalDailyGuidance.reasons.dashaSupport },
              { label: lang === "ta" ? "பஞ்சாங்கம்" : "Panchangam", text: personalDailyGuidance.reasons.panchangam },
              { label: lang === "ta" ? "கோசாரம்" : "Transit", text: personalDailyGuidance.reasons.gochar },
            ].filter((tile) => tile.text);
            // Tiles sit in their own (narrower-than-full) column beside the
            // orbit illustration — .nova-deepdive-grid (2fr/1fr, collapses to
            // one column ≤860px) rather than stretching the tiles the full
            // card width the way a plain auto-fit grid would.
            return (
              <div className="nova-deepdive-grid">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-2_5)" }}>
                  {tiles.map((tile) => (
                    <Card key={tile.label} style={{ display: "block", background: "color-mix(in srgb, var(--color-text-strong) 4%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3_5)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>
                      <div style={{ marginBottom: "6px" }}>
                        <b style={{ color: "var(--color-accent-strong)", fontSize: "var(--text-sm)" }}>{tile.label}</b>
                      </div>
                      {tLang(tile.text, lang)}
                    </Card>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DeepDiveOrbitGlyph size={168} />
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
