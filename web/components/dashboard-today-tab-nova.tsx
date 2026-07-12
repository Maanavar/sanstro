"use client";

import { useEffect, useState } from "react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { addDays, formatClockLabel, formatDateLabel, getScoreVerdictFromGuidance } from "@/lib/format";
import { tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DailyGuidanceWindow,
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

import { NovaClampedText, NovaScoreDial } from "./dashboard-ui-nova";
import { CelestialGlyphNova, MiniMoonGlyph } from "./celestial-glyph-nova";
import { HeroSkyBackdrop } from "./celestial-ambient-nova";
import { moonPhaseFromTithi } from "@/lib/lunar";
import { useStreak } from "@/hooks/useStreak";
import { useEveningPreview } from "@/hooks/useEveningPreview";

import { DashboardTodayRibbonNova } from "./dashboard-today-ribbon-nova";
import { DashboardTodayDecideNova } from "./dashboard-today-decide-nova";
import { DashboardTodayOneLinersNova, DashboardTodayGlanceRowNova } from "./dashboard-today-glance-nova";
import { MorningGuidanceCard } from "./morning-guidance-card";

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
 * itself lives in Settings → Notifications), Prasna/Horary trigger,
 * and PDF download — all one click away via "Open Chart & Explanations".
 */

export type DashboardTodayTabNovaProps = {
  lang: Lang;
  activeLifeMode?: LifeMode;
  birthDisplayName: string;
  selectedDate: string;
  todayDate: string;
  personalMemberChart: { displayName: string } | null;
  personalChartSummary: ChartSummaryData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  personalSani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  weekAhead: WeekAheadData | null;
  familyAggregate: FamilyAggregateData | null;
  lifeAreas?: LifeAreasResponseData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  /** 3-day window starting at selectedDate (today..+2) — reused here purely
   *  to read tomorrow's item for the evening preview swap, no extra fetch. */
  dailyGuidanceRange?: DailyGuidanceRangeData | null;
  onGoToFamily?: () => void;
  onGoToJournal?: () => void;
  onGoToCalendar?: () => void;
  onGoToLifeAreas?: () => void;
  onGoToTransits?: () => void;
  /** Opens the "Family & Charts" tab, where the full chart engine now lives. */
  onGoToCharts?: () => void;
  onOpenAskVinaadi: () => void;
  onOpenNotificationSettings?: () => void;
};

function greetingWord(lang: Lang): string {
  const hour = new Date().getHours();
  if (lang === "ta") {
    if (hour < 12) return "காலை வணக்கம்";
    if (hour < 17) return "மதிய வணக்கம்";
    return "மாலை வணக்கம்";
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeOnDateToMs(dateLocal: string, clock: string): number | null {
  const timePart = clock.includes("T") ? clock.split("T")[1] : clock;
  const [hh, mm] = (timePart ?? "").split(":");
  if (hh === undefined || mm === undefined) return null;
  const d = new Date(`${dateLocal}T${hh.padStart(2, "0")}:${mm.padStart(2, "0")}:00`);
  const t = d.getTime();
  return Number.isNaN(t) ? null : t;
}

function formatDuration(ms: number, lang: Lang): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return lang === "ta" ? `${m} நிமிடம்` : `${m}m`;
  if (m <= 0) return lang === "ta" ? `${h} மணி` : `${h}h`;
  return lang === "ta" ? `${h}மணி ${m}நிமிடம்` : `${h}h ${m}m`;
}

/**
 * Choose which best-window to feature in the hero. The backend always lists
 * Abhijit first — a ~48-min slot fixed around solar noon, so it barely moves
 * day to day and made the hero read "12:02–12:50" every single day. We instead
 * prefer the user's own planetary-hora windows (PERSONAL_HORA — keyed to lagna
 * lord + running dasha), which land at a different clock time each weekday, then
 * any benefic hora, and only fall back to Abhijit when nothing personal exists.
 * On today we surface the next window that hasn't ended yet, so the hero stays
 * actionable as the day advances; on other dates we show the first.
 */
function pickFeaturedWindow(
  windows: DailyGuidanceWindow[] | undefined,
  now: Date,
  isToday: boolean,
  dateLocal: string,
): DailyGuidanceWindow | null {
  if (!windows || windows.length === 0) return null;
  const personal = windows.filter((w) => w.type.includes("PERSONAL_HORA"));
  const horas = windows.filter((w) => w.type.includes("HORA"));
  const preferred = personal.length ? personal : horas.length ? horas : windows;
  if (isToday) {
    const upcoming = preferred.find((w) => {
      const endMs = timeOnDateToMs(dateLocal, w.end);
      return endMs === null || endMs >= now.getTime();
    });
    return upcoming ?? preferred[preferred.length - 1] ?? null;
  }
  return preferred[0] ?? null;
}

export function DashboardTodayTabNova({
  lang,
  activeLifeMode,
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
  lifeAreas,
  dasha,
  dashaAntar,
  dailyGuidanceRange,
  onGoToFamily,
  onGoToJournal,
  onGoToCalendar,
  onGoToLifeAreas,
  onGoToTransits,
  onGoToCharts,
  onOpenAskVinaadi,
  onOpenNotificationSettings,
}: DashboardTodayTabNovaProps) {
  const { days: streakDays } = useStreak();
  const { enabled: eveningPreviewOn, setEnabled: setEveningPreviewOn } = useEveningPreview();
  const displayName = personalMemberChart?.displayName ?? birthDisplayName;
  const activeChartId = personalChartSummary?.chartId ?? "";
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  // Drives the timeline's NOW marker and the best-window countdown — ticks
  // once a minute, matching design 8a's "updates each minute" spec without
  // re-rendering on every animation frame.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const score = personalDailyGuidance?.score ?? null;
  const weekday = panchangam ? panchangam.vara.weekday : "";
  const paksha = panchangam?.tithi.paksha;
  const wax = paksha === "SHUKLA";

  const isToday = selectedDate === todayDate;

  // Feature a personalized, day-varying window rather than the always-noon
  // Abhijit slot the backend lists first (see pickFeaturedWindow).
  const bestWindow = pickFeaturedWindow(personalDailyGuidance?.bestWindows, now, isToday, selectedDate);

  // Real lunar phase for today, drawn straight from the tithi we already have —
  // drives the hero moon's shape and size (thin crescent → full disc).
  const moonPhase = panchangam ? moonPhaseFromTithi(panchangam.tithi.number, panchangam.tithi.paksha) : null;
  // Sun by day, moon from dusk on — matches the greeting word's own cutoffs.
  const heroCelestial: "sun" | "moon" = now.getHours() >= 17 ? "moon" : "sun";
  // Pournami / Amavasai earn a one-time gold shimmer on the hero glyph.
  const isSpecialTithi = Boolean(panchangam?.specialTithiDay);

  // After 8pm, the hero can swap to a preview of tomorrow + a journal
  // prompt for today — reuses the already-fetched 3-day dailyGuidanceRange
  // (today..+2), no extra network call. Gated by isToday so opening a past
  // or future date from the calendar never triggers it.
  const tomorrowIso = addDays(selectedDate, 1);
  const tomorrowGuidance = dailyGuidanceRange?.items.find((item) => item.dateLocal === tomorrowIso) ?? null;
  const showEveningPreview = eveningPreviewOn && isToday && now.getHours() >= 20 && tomorrowGuidance !== null;
  const tomorrowWeekday = new Date(`${tomorrowIso}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "long" });

  let windowPhase: "before" | "during" | "after" | null = null;
  let windowCountdown: string | null = null;
  if (bestWindow && isToday) {
    const startMs = timeOnDateToMs(selectedDate, bestWindow.start);
    const endMs = timeOnDateToMs(selectedDate, bestWindow.end);
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
    setReminderMessage(null);
    try {
      const current = await apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications");
      const nextChannel = current.data.notification_channel === "none" ? "both" : current.data.notification_channel;
      const nextTime = current.data.morningAlertTime || "06:00";
      await apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationChannel: nextChannel,
          morningAlertEnabled: true,
          morningAlertTime: nextTime,
        }),
      });
      setReminderMessage(lang === "ta" ? "காலை நினைவூட்டல் சேமிக்கப்பட்டது." : "Morning reminder saved.");
    } catch (error) {
      const message = readErrorMessage(error);
      setReminderMessage(lang === "ta" ? `சேமிக்க முடியவில்லை: ${message}` : `Could not save reminder: ${message}`);
    } finally {
      setSavingReminder(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ===== 1. Hero: greeting, one theme line, mood chips, embedded
          best-window "next action" tile, and the one canonical score. ===== */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, var(--color-surface-soft), var(--color-surface-3))",
        border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "26px 28px",
      }}>
        <HeroSkyBackdrop moon={moonPhase} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "28px", alignItems: "stretch", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "280px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12.5px", color: "var(--color-muted)" }}>
                {weekday && `${weekday} · `}{formatDateLabel(selectedDate)}
                {panchangam?.tamilDate && <> · <span style={{ color: "var(--color-accent-strong)", fontWeight: 600 }}>{lang === "ta" ? panchangam.tamilDate.ta : panchangam.tamilDate.en}</span></>}
              </span>
              {paksha && (
                <span style={{ fontSize: "12px", color: "var(--color-accent-secondary)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {moonPhase ? <MiniMoonGlyph phase={moonPhase} size={15} /> : (wax ? "◐" : "◑")} {wax ? (lang === "ta" ? "வளர்பிறை" : "Waxing") : (lang === "ta" ? "தேய்பிறை" : "Waning")} · {wax ? (lang === "ta" ? "சுக்ல பக்ஷம்" : "Sukla Paksham") : (lang === "ta" ? "கிருஷ்ண பக்ஷம்" : "Krishna Paksham")}
                </span>
              )}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                {streakDays > 1 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "11.5px", fontWeight: 700, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "5px 12px" }}>
                    ✦ {lang === "ta" ? `${streakDays} நாள் தொடர்ச்சி` : `${streakDays}-day check-in streak`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEveningPreviewOn(!eveningPreviewOn)}
                  title={lang === "ta"
                    ? "இரவு 8 மணிக்குப் பின் நாளையை முன்னோட்டமாகக் காட்டு"
                    : "After 8pm, preview tomorrow here instead of today"}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600,
                    color: eveningPreviewOn ? "var(--color-accent-strong)" : "var(--color-faint)",
                    background: eveningPreviewOn ? "var(--color-accent-muted)" : "none",
                    border: `1px solid ${eveningPreviewOn ? "var(--color-border-strong)" : "var(--color-border)"}`,
                    borderRadius: "999px", padding: "5px 10px 5px 8px", cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  🌙 {lang === "ta" ? "மாலை முன்னோட்டம்" : "Evening preview"}
                  <span style={{
                    display: "inline-block", width: "20px", height: "11px", borderRadius: "999px",
                    background: eveningPreviewOn ? "var(--color-high)" : "rgba(243,236,221,0.18)",
                    position: "relative", flex: "none", transition: "background 0.15s",
                  }}>
                    <span style={{
                      position: "absolute", top: "1.5px", left: eveningPreviewOn ? "10px" : "1.5px",
                      width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-on-accent, #221a2c)",
                      transition: "left 0.15s",
                    }} />
                  </span>
                </button>
              </div>
            </div>
            {showEveningPreview && tomorrowGuidance ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <CelestialGlyphNova
                    variant="moon"
                    moon={moonPhase}
                    size={58}
                    special={isSpecialTithi}
                    ariaLabel={lang === "ta" ? "இன்றைய நிலா" : "Tonight's moon"}
                  />
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.7rem, 3.2vw, 2.25rem)", fontWeight: 600, lineHeight: 1.08, color: "var(--color-text-strong)" }}>
                    {greetingWord(lang)}, {displayName}.
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-accent-secondary)", fontWeight: 600 }}>
                  {lang === "ta" ? "நாளையைப் பற்றி ஒரு முன்னோட்டம் — " : "A look ahead to tomorrow — "}
                  {tomorrowWeekday}, {formatDateLabel(tomorrowIso)}
                </div>
                <NovaClampedText
                  lines={3}
                  maxWidth="600px"
                  style={{ fontFamily: "var(--font-nova-prose), Georgia, serif", fontSize: "15.5px", lineHeight: 1.55, color: "var(--color-text)" }}
                >
                  {tLang(tomorrowGuidance.briefing ?? tomorrowGuidance.text, lang)}
                </NovaClampedText>
                {(() => {
                  const tw = pickFeaturedWindow(tomorrowGuidance.bestWindows, now, false, tomorrowIso);
                  return tw ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px", color: "var(--color-high)", fontWeight: 600 }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-high)", flex: "none" }} />
                      {lang === "ta" ? "நாளை சிறந்த நேரம்" : "Tomorrow's best window"} · {formatClockLabel(tw.start)} – {formatClockLabel(tw.end)}
                    </div>
                  ) : null;
                })()}

                {/* Journal prompt — the evening half of design's "preview +
                    journal prompt" ask, replacing the best-window action tile. */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "13px", marginTop: "2px", flexWrap: "wrap", rowGap: "10px",
                  background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)",
                  borderRadius: "12px", padding: "12px 15px",
                }}>
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-accent-strong)" }}>
                      {lang === "ta" ? "இன்று எப்படி இருந்தது?" : "How did today go?"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "2px" }}>
                      {lang === "ta" ? "நாள் முடிவதற்குள் ஒரு சிறு குறிப்பு பதிவு செய்யுங்கள்." : "Log a quick note before the day closes."}
                    </div>
                  </div>
                  {onGoToJournal && (
                    <button
                      type="button"
                      onClick={onGoToJournal}
                      style={{ fontSize: "12px", fontWeight: 700, background: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", flex: "none" }}
                    >
                      {lang === "ta" ? "குறிப்பு எழுத →" : "Write a quick note →"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <CelestialGlyphNova
                    variant={heroCelestial}
                    moon={moonPhase}
                    size={58}
                    special={isSpecialTithi}
                    ariaLabel={heroCelestial === "moon"
                      ? (lang === "ta" ? "இன்றைய நிலா" : "Tonight's moon")
                      : (lang === "ta" ? "இன்றைய சூரியன்" : "Today's sun")}
                  />
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.7rem, 3.2vw, 2.25rem)", fontWeight: 600, lineHeight: 1.08, color: "var(--color-text-strong)" }}>
                    {greetingWord(lang)}, {displayName}.
                  </div>
                </div>
                {personalDailyGuidance && (
                  <NovaClampedText
                    lines={3}
                    maxWidth="600px"
                    style={{ fontFamily: "var(--font-nova-prose), Georgia, serif", fontSize: "15.5px", lineHeight: 1.55, color: "var(--color-text)" }}
                  >
                    {tLang(personalDailyGuidance.briefing ?? personalDailyGuidance.text, lang)}
                  </NovaClampedText>
                )}
                {personalDailyGuidance?.emotionalWeather && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                      { icon: "🌿", label: personalDailyGuidance.emotionalWeather.tone, color: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)" },
                      { icon: "✦", label: personalDailyGuidance.emotionalWeather.physicalTendency, color: "var(--color-accent-strong)", bg: "var(--color-accent-muted)", border: "var(--color-border-strong)" },
                      { icon: "⚠", label: personalDailyGuidance.emotionalWeather.bestUseOfDay, color: "var(--color-low)", bg: "var(--color-low-bg)", border: "var(--color-low-border)" },
                    ].filter((tag) => tag.label).map((tag) => (
                      <span key={tag.label} style={{ fontSize: "12px", color: "var(--color-text)", background: tag.bg, border: `1px solid ${tag.border}`, borderRadius: "999px", padding: "5px 12px" }}>
                        {tag.icon} {tag.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Next-action tile — the single best-window callout, embedded in
                    the hero per design 8a §3 (not a separate card below it). */}
                {bestWindow && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "13px", marginTop: "2px", flexWrap: "wrap", rowGap: "10px",
                    background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)",
                    borderRadius: "12px", padding: "12px 15px",
                  }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "var(--color-high)", boxShadow: "0 0 0 4px var(--color-high-bg)", flex: "none" }} />
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-high)" }}>
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
                      {personalDailyGuidance?.actionSuggestion && (
                        <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "2px" }}>
                          {tLang(personalDailyGuidance.actionSuggestion, lang)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flex: "none" }}>
                      <button
                        type="button"
                        onClick={() => void handleSaveReminder()}
                        disabled={savingReminder}
                        style={{ fontSize: "12px", fontWeight: 700, background: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit" }}
                      >
                        {savingReminder ? (lang === "ta" ? "…" : "Saving…") : (lang === "ta" ? "நினைவூட்டு" : "Remind me")}
                      </button>
                      {onGoToJournal && (
                        <button
                          type="button"
                          onClick={onGoToJournal}
                          style={{ fontSize: "12px", fontWeight: 600, border: "1px solid var(--color-border-strong)", color: "var(--color-accent-strong)", background: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {lang === "ta" ? "தருணம் பதிவு" : "Log a moment"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {reminderMessage && (
                  <p style={{ margin: 0, fontSize: "11.5px", color: reminderMessage.includes("Could not") || reminderMessage.includes("முடியவில்லை") ? "var(--color-low)" : "var(--color-high)" }}>
                    {reminderMessage}
                  </p>
                )}
              </>
            )}
          </div>

          {/* The ONLY score on the page — tomorrow's, while previewing tomorrow. */}
          {showEveningPreview && tomorrowGuidance ? (() => {
            const verdict = getScoreVerdictFromGuidance(tomorrowGuidance.label, tomorrowGuidance.score, lang);
            return (
              <div style={{ flex: "none", width: "200px", borderLeft: "1px solid var(--color-border)", paddingLeft: "26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "9px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent-secondary)", fontWeight: 700 }}>
                  {lang === "ta" ? "நாளை" : "Tomorrow"}
                </div>
                <NovaScoreDial score={tomorrowGuidance.score} color={verdict.color} label={lang === "ta" ? "100க்கு" : "/ 100"} />
                <div style={{ fontSize: "11px", color: "var(--color-faint)", textAlign: "center" }}>{verdict.verdict}</div>
              </div>
            );
          })() : personalDailyGuidance && (() => {
            const verdict = getScoreVerdictFromGuidance(personalDailyGuidance.label, score ?? 0, lang);
            return (
              <div style={{ flex: "none", width: "200px", borderLeft: "1px solid var(--color-border)", paddingLeft: "26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "9px" }}>
                <NovaScoreDial score={score ?? 0} color={verdict.color} label={lang === "ta" ? "100க்கு" : "/ 100"} />
                <div style={{ fontSize: "11px", color: "var(--color-faint)", textAlign: "center" }}>{verdict.verdict}</div>
                <a href="#nova-deep-dive" style={{ fontSize: "11.5px", color: "var(--color-accent-secondary)", fontWeight: 600, textDecoration: "none" }}>
                  {lang === "ta" ? "இந்த மதிப்பெண் ஏன்? →" : "Why this score →"}
                </a>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ===== 2. "Is today okay for…?" promoted decision strip. ===== */}
      <DashboardTodayDecideNova
        lang={lang}
        chartId={activeChartId || null}
        selectedDate={selectedDate}
        activeLifeMode={activeLifeMode}
        bestWindow={bestWindow}
        now={now}
        isToday={isToday}
        onOpenAskVinaadi={onOpenAskVinaadi}
      />

      {/* ===== 3. Timeline spine: sunrise-to-sunrise, panchangam + horai +
          week-ahead dots merged in — the one place all day-timing lives. ===== */}
      <DashboardTodayRibbonNova
        lang={lang}
        panchangam={panchangam}
        weekAhead={weekAhead}
        selectedDate={selectedDate}
        now={now}
        onGoToCalendar={onGoToCalendar}
      />

      {/* ===== 4. Glance row: family (avatars + dots) · life areas (stat
          tiles) · dasa chapter. ===== */}
      <DashboardTodayGlanceRowNova
        lang={lang}
        familyAggregate={familyAggregate}
        personalChartSummary={personalChartSummary}
        dasha={dasha}
        dashaAntar={dashaAntar}
        selectedDate={selectedDate}
        lifeAreas={lifeAreas}
        onGoToFamily={onGoToFamily}
        onGoToTransits={onGoToTransits}
        onGoToLifeAreas={onGoToLifeAreas}
      />

      {/* ===== 5. Collapsed one-liners: coming up + remedy — never taller
          than one line each. ===== */}
      {personalDailyGuidance && (
        <DashboardTodayOneLinersNova
          lang={lang}
          peyarchiUpcoming={peyarchiUpcoming}
          personalSani={personalSani}
          remedy={personalDailyGuidance.remedy}
          savingReminder={savingReminder}
          reminderMessage={reminderMessage}
          onSaveReminder={() => void handleSaveReminder()}
          onGoToCalendar={onGoToCalendar}
        />
      )}

      {/* ===== 6. Deep-dive bridge — the single doorway to the chart engine.
          The full engine (planet table, chart explanation, vargas, shadbala,
          alternate dashas, classical timing, birth-star profile, Prasna, PDF)
          lives in the "Family & Charts" tab (DashboardChartsPanelNova). This
          keeps Today a decision layer only. The hero's "Why this score →"
          anchors here; this card's button opens the full charts. ===== */}
      {personalDailyGuidance && (
        <div id="nova-deep-dive" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "21px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
              {lang === "ta" ? "இந்த கணிப்பு ஏன்?" : "Why this prediction?"}
            </span>
            <span style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>
              {lang === "ta" ? "இன்றைய ஜோதிடத்தின் அடிப்படை" : "the astrology behind today"}
            </span>
            {onGoToCharts && (
              <button
                type="button"
                onClick={onGoToCharts}
                style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "8px", padding: "9px 15px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {lang === "ta" ? "ஜாதகம் & விளக்கம் திற →" : "Open Chart & Explanations →"}
              </button>
            )}
          </div>
          {personalDailyGuidance.reasons && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {[
                { label: lang === "ta" ? "தசை அடுக்கு" : "Dasa layer", text: personalDailyGuidance.reasons.dashaSupport },
                { label: lang === "ta" ? "பஞ்சாங்கம்" : "Panchangam", text: personalDailyGuidance.reasons.panchangam },
                { label: lang === "ta" ? "கோசாரம்" : "Transit", text: personalDailyGuidance.reasons.gochar },
              ].filter((tile) => tile.text).map((tile) => (
                <div key={tile.label} style={{ background: "rgba(243,236,221,0.04)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontSize: "12px", lineHeight: 1.5, color: "var(--color-muted)" }}>
                  <b style={{ color: "var(--color-accent-strong)" }}>{tile.label}</b> — {tLang(tile.text, lang)}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>
            {lang === "ta" ? (
              <>கிரக நிலைகள் · ஜாதகம் · வர்க்க அட்டவணைகள் · தசை அட்டவணைகள் · நட்சத்திர விவரம் இப்போது <b style={{ color: "var(--color-muted)" }}>குடும்பம் &amp; ஜாதகம்</b> தாவலில் உள்ளன.</>
            ) : (
              <>Planet positions · birth chart · divisional charts · dasha tables · birth-star profile now live in <b style={{ color: "var(--color-muted)" }}>Family &amp; Charts</b>.</>
            )}
          </div>
        </div>
      )}

      {/* ===== 7. Morning Guidance pointer — status + deep-link to Settings →
          Notifications, where the actual opt-in (enable, delivery time,
          channel) lives. Account-level, so it belongs on the homepage rather
          than inside a specific person's chart deep-dive. ===== */}
      <MorningGuidanceCard lang={lang} onOpenSettings={onOpenNotificationSettings} />
    </div>
  );
}
