"use client";

import { memo, useEffect, useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { formatClockLabel, formatDateLabel, getScoreBand, scoreColor, SCORE_HIGH, SCORE_MID, SCORE_LOW } from "@/lib/format";
import { gowriCategoryLabel, gowriPeriodLabel, gowriPurposeLabel } from "@/lib/gowri";
import { t, tLang, tTithi, tNakshatra, tWeekday, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  AmbientAlertItem,
  CharaDashaData,
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  NakshatraCardData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  PeyarchiEvent,
  PeyarchiReportData,
  NotificationPreferenceData,
  SaniCycleData,
  SolarReturnData,
  TransitSnapshotData,
  WeekAheadData,
} from "@/lib/types";

import { GRAHA_ABBR, JathagamKattam, RASI_NAMES } from "./dashboard-charts";
import { DASHA_COLORS } from "./dashboard-dasha";
import { DashboardDailySnapshot } from "./dashboard-daily-snapshot";
import { PeyarchiBanner } from "./peyarchi-banner";
import { Button, Chip, Metric, Surface } from "./dashboard-ui";
import { DayStrip } from "./day-strip";
import { MemberChip } from "./member-chip";
import { AlertBanner } from "./alert-banner";
import { DashboardActivityTimingCard } from "./dashboard-activity-timing-card";
import { CollapsibleSection } from "./collapsible-section";
import { VargasPanel } from "./dashboard-vargas-panel";
import { MorningGuidanceCard } from "./morning-guidance-card";
import { PrasnaWidget } from "./dashboard-prasna-widget";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { ShareCardButton } from "./dashboard-share-card";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";

const EMOTIONAL_WEATHER_FIELDS = [
  { labelTa: "உணர்வு நிலை", labelEn: "Emotional tone", key: "toneText" as const },
  { labelTa: "உடல் போக்கு", labelEn: "Physical tendency", key: "physicalTendencyText" as const },
  { labelTa: "சிறந்த பயன்பாடு", labelEn: "Best use of day", key: "bestUseOfDayText" as const },
] as const;

const SCORE_CHIP_KEYS = ["moonTransit", "dashaSupport", "panchangam"] as const;
const GUIDANCE_REASON_KEYS = ["moonTransit", "dashaSupport", "panchangam", "gochar", "personalCaution"] as const;

type DashboardPersonalTabProps = {
  lang: Lang;
  birthDisplayName: string;
  selectedDate: string;
  todayDate: string;
  personalViewId: string | null;
  birthProfileId: string;
  busyPersonal: boolean;
  memberCharts: Array<{ memberId: string; displayName: string }>;
  onSelectPersonalView: (memberId: string | null) => void;
  onOpenEditProfile: () => void;
  onRefreshPersonal: () => void;
  onDateChange?: (date: string) => void;

  personalMemberChart: { displayName: string } | null;
  personalChart: ChartCalculateResponseData | null;
  personalChartExplanation: ChartExplanationData | null;
  personalChartSummary: ChartSummaryData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  dailyGuidanceRange: DailyGuidanceRangeData | null;
  weekAhead: WeekAheadData | null;
  familyAggregate: FamilyAggregateData | null;

  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;

  ambientAlerts: AmbientAlertItem[];
  formatScoreLabel: (score: number) => string;
  nakshatraCard: NakshatraCardData | null;
  peyarchiReport: PeyarchiReportData | null;
  onGoToFamily?: () => void;
  onOpenPrasna?: () => void;
  showPrasna?: boolean;
  onClosePrasna?: () => void;
  dasha: DashaTimelineResponseData | null;
  dashaMaha?: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
};


function kalamSlotKey(
  slot: PanchangamDailyResponseData["kalam"]["nallaNeram"][number],
  index: number,
): string {
  return `${slot.period ?? "slot"}-${slot.name ?? slot.slot}-${slot.start}-${slot.end}-${index}`;
}

/* ── Score ring SVG ─────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width="110" height="110" viewBox="0 0 110 110" style={{ display: "block" }}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#E4DBC8" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 55 55)"
      />
    </svg>
  );
}

/* ── Day timeline bar ───────────────────────────────────── */
function DayTimeline({
  bestStart, bestEnd, holdStart, holdEnd,
}: {
  bestStart?: string; bestEnd?: string;
  holdStart?: string; holdEnd?: string;
}) {
  /* Convert "HH:MM:SS" or "HH:MM" to hours-from-6am (0..12) → x offset (px, 20..300) */
  function toX(timeStr: string | undefined): number | null {
    if (!timeStr) return null;
    const parts = timeStr.split(":");
    const h = parseInt(parts[0] ?? "0", 10);
    const m = parseInt(parts[1] ?? "0", 10);
    const hoursFrom6 = (h + m / 60) - 6;
    if (hoursFrom6 < 0 || hoursFrom6 > 12) return null;
    return 20 + (hoursFrom6 / 12) * 280;
  }

  const bx1 = toX(bestStart);
  const bx2 = toX(bestEnd);
  const hx1 = toX(holdStart);
  const hx2 = toX(holdEnd);

  /* Sun x at current local time (clamped 6am–6pm) */
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;
  const sunHoursFrom6 = Math.max(0, Math.min(12, nowHours - 6));
  const sunX = 20 + (sunHoursFrom6 / 12) * 280;
  /* Sun y on arc: y = 82 - 2t(1-t)·64, t = sunHoursFrom6/12 */
  const t = sunHoursFrom6 / 12;
  const sunY = 82 - 2 * t * (1 - t) * 64;

  return (
    <div style={{ marginTop: "var(--space-2)" }}>
      <svg viewBox="0 0 320 110" style={{ width: "100%", height: "auto", display: "block" }} preserveAspectRatio="xMidYMid meet">
        {/* Arc */}
        <path d="M20,82 Q160,18 300,82" fill="none" stroke="#D4C8AE" strokeWidth="1.5" strokeLinecap="round" />
        {/* Horizon bar */}
        <rect x="20" y="79" width="280" height="5" rx="2.5" fill="#E4DBC8" />
        {/* Best window */}
        {bx1 !== null && bx2 !== null && (
          <rect x={bx1} y="78" width={Math.max(bx2 - bx1, 6)} height="7" rx="3.5" fill={SCORE_HIGH} />
        )}
        {/* Hold window */}
        {hx1 !== null && hx2 !== null && (
          <rect x={hx1} y="78" width={Math.max(hx2 - hx1, 6)} height="7" rx="3.5" fill={SCORE_LOW} />
        )}
        {/* Tick marks */}
        {[20, 90, 160, 230, 300].map((x) => (
          <line key={x} x1={x} y1="86" x2={x} y2="93" stroke="var(--color-faint)" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        {/* Sun dot */}
        <circle cx={sunX} cy={sunY} r="6" fill={SCORE_MID} />
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", padding: "0 calc(20/320*100%)", marginTop: "var(--space-0_5)" }}>
        {["6a", "9a", "12p", "3p", "6p"].map((h) => (
          <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "var(--color-faint)", textAlign: "center" }}>{h}</span>
        ))}
      </div>
    </div>
  );
}

type HeroProps = {
  lang: Lang;
  displayName: string;
  dateLabel: string;
  guidanceHeadline: string;
  score: number | null;
  personalScoreBand: ReturnType<typeof getScoreBand> | null;
  personalDailyGuidance: import("@/lib/types").DailyGuidanceData | null;
  bestWindow: import("@/lib/types").DailyGuidanceData["bestWindows"][number] | null;
  avoidWindow: import("@/lib/types").DailyGuidanceData["cautionWindows"][number] | null;
  panchangam: import("@/lib/types").PanchangamDailyResponseData | null;
  panchangamTimings: import("@/lib/types").PanchangamTimingsData | null;
  personalChartSummary: import("@/lib/types").ChartSummaryData | null;
  astroText: (v: string) => string;
};

const PersonalHero = memo(function PersonalHero({
  lang, displayName, dateLabel, guidanceHeadline, score, personalScoreBand,
  personalDailyGuidance, bestWindow, avoidWindow, panchangam, personalChartSummary, astroText,
}: HeroProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "var(--space-7)", alignItems: "start" }}>
      <div>
        <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B85A2C" }}>
          {dateLabel}
        </p>
        {personalDailyGuidance ? (
          <>
            <h1 style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#1A1612" }}>
              Today is{" "}
              <em style={{ fontStyle: "italic", color: "#7A6F5E" }}>
                {personalDailyGuidance.label.toLowerCase()}.
              </em>
              <br />
              {guidanceHeadline && !guidanceHeadline.includes("Today") ? guidanceHeadline : "Move step by step."}
            </h1>
            <p style={{ margin: "0 0 var(--space-5)", fontSize: "1rem", lineHeight: 1.7, color: "#3D352B", maxWidth: "52ch" }}>
              {lang === "ta" ? personalDailyGuidance.text.ta : personalDailyGuidance.text.en}
            </p>
          </>
        ) : (
          <h1 style={{ margin: "0 0 var(--space-4)", fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 500, letterSpacing: "-0.03em", color: "#1A1612" }}>
            {displayName ? `${displayName}'s day` : "Your day"}
          </h1>
        )}
        {personalDailyGuidance && (
          <DayTimeline
            bestStart={bestWindow?.start}
            bestEnd={bestWindow?.end}
            holdStart={avoidWindow?.start}
            holdEnd={avoidWindow?.end}
          />
        )}
      </div>

      {personalDailyGuidance && (
        <div className="cd-card--lg">
          <p className="cd-kicker">{t("personal_today", lang)}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <div>
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.5rem", fontWeight: 500, lineHeight: 1, color: "#1A1612" }}>
                {score}
                <span style={{ fontSize: "1.25rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>/100</span>
              </p>
              <span
                className="cd-score-pill"
                style={{
                  marginTop: "var(--space-2)",
                  background: score !== null && score >= 65 ? "#DCE4D2" : score !== null && score >= 45 ? "#F0D9C4" : "#F2D8CC",
                  color: score !== null ? scoreColor(score) : SCORE_MID,
                }}
              >
                {personalDailyGuidance.label}
              </span>
            </div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ScoreRing score={score ?? 0} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500, color: score !== null ? scoreColor(score) : SCORE_MID }}>
                {score}
              </div>
            </div>
          </div>

          <div className="cd-window-grid">
            <div className="cd-time-slot">
              <p className="cd-kicker">{lang === "ta" ? "நல்ல நேரம்" : "Nalla Neram"}</p>
              {(panchangam?.kalam?.nallaNeram?.length ?? 0) > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-0_75)" }}>
                  {panchangam!.kalam.nallaNeram.map((w, idx) => {
                    const lbl = gowriPeriodLabel(w.period, lang);
                    const category = gowriCategoryLabel(w.name, lang);
                    const purpose = gowriPurposeLabel(w.name, lang);
                    return (
                      <div key={kalamSlotKey(w, idx)} style={{ display: "grid", gap: "2px" }}>
                        <div>{[lbl, category].filter(Boolean).map((part) => <span key={part} style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-faint)", marginRight: "4px" }}>{part}</span>)}</div>
                        <span className="cd-time-value" style={{ fontSize: "0.9rem" }}>{formatClockLabel(w.start)} – {formatClockLabel(w.end)}</span>
                        {purpose && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--color-muted)" }}>{purpose}</span>}
                      </div>
                    );
                  })}
                </div>
              ) : bestWindow ? (
                <p className="cd-time-value">{formatClockLabel(bestWindow.start)} – {formatClockLabel(bestWindow.end)}</p>
              ) : <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "0.875rem" }}>—</p>}
            </div>
            <div className="cd-time-slot">
              <p className="cd-kicker">{lang === "ta" ? "யமகண்டம்" : "Yamagandam"}</p>
              {panchangam?.kalam?.yamagandam ? (
                <p className="cd-time-value">{formatClockLabel(panchangam.kalam.yamagandam.start)} – {formatClockLabel(panchangam.kalam.yamagandam.end)}</p>
              ) : <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "0.875rem" }}>—</p>}
            </div>
            <div className="cd-time-slot" style={{ background: "#DCE4D2", border: "1px solid rgba(92,118,84,0.3)" }}>
              <p className="cd-kicker" style={{ color: SCORE_HIGH }}>
                {panchangam?.kalam?.kuligai ? (lang === "ta" ? "குளிகை" : "Kuligai") : t("action_best_window", lang)}
              </p>
              <p className="cd-time-value" style={{ color: SCORE_HIGH }}>
                {panchangam?.kalam?.kuligai ? `${formatClockLabel(panchangam.kalam.kuligai.start)} – ${formatClockLabel(panchangam.kalam.kuligai.end)}` : bestWindow ? `${formatClockLabel(bestWindow.start)} – ${formatClockLabel(bestWindow.end)}` : "—"}
              </p>
            </div>
            <div className="cd-time-slot" style={{ background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)" }}>
              <p className="cd-kicker" style={{ color: SCORE_LOW }}>{lang === "ta" ? "ராகு காலம்" : "Rahu Kalam"}</p>
              <p className="cd-time-value" style={{ color: SCORE_LOW }}>
                {panchangam?.kalam?.rahuKalam ? `${formatClockLabel(panchangam.kalam.rahuKalam.start)} – ${formatClockLabel(panchangam.kalam.rahuKalam.end)}` : avoidWindow ? `${formatClockLabel(avoidWindow.start)} – ${formatClockLabel(avoidWindow.end)}` : "—"}
              </p>
            </div>
          </div>

          {personalChartSummary && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-2_5)", borderTop: "1px solid #E4DBC8", flexWrap: "wrap", gap: "var(--space-1_5)" }}>
              <span style={{ fontSize: "0.75rem", color: "#7A6F5E" }}>
                {personalChartSummary.lagnaRasi} {t("label_lagnam", lang)} · {astroText(personalChartSummary.janmaNakshatra)} ☉ {personalChartSummary.moonRasi}
              </span>
              <span className="cd-kicker--inline">D1 · D9 ready</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export function DashboardPersonalTab({
  lang,
  birthDisplayName,
  selectedDate,
  todayDate,
  personalViewId,
  birthProfileId,
  busyPersonal,
  memberCharts,
  onSelectPersonalView,
  onOpenEditProfile,
  onRefreshPersonal,
  onDateChange,
  personalMemberChart,
  personalChart,
  personalChartExplanation,
  personalChartSummary,
  personalDailyGuidance,
  dailyGuidanceRange,
  weekAhead,
  familyAggregate,
  personalTransit,
  personalSani,
  peyarchiUpcoming,
  panchangam,
  panchangamTimings,
  ambientAlerts,
  formatScoreLabel,
  nakshatraCard,
  peyarchiReport,
  onGoToFamily,
  onOpenPrasna,
  showPrasna = false,
  onClosePrasna,
  dasha,
  dashaMaha = null,
  dashaAntar,
}: DashboardPersonalTabProps) {
  const displayName = personalMemberChart?.displayName ?? birthDisplayName;
  const isChandrashtama = personalTransit?.isChandrashtama ?? false;
  const bestWindow = personalDailyGuidance?.bestWindows[0] ?? null;
  const avoidWindow = personalDailyGuidance?.cautionWindows[0] ?? null;
  const score = personalDailyGuidance?.score ?? null;
  const personalScoreBand = score !== null ? getScoreBand(score) : null;
  const activeChartId = personalChart?.chartId ?? personalChartSummary?.chartId ?? "";
  const [charaDasha, setCharaDasha] = useState<CharaDashaData | null>(null);
  const [solarReturn, setSolarReturn] = useState<SolarReturnData | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);

  useEffect(() => {
    if (!activeChartId) {
      setCharaDasha(null);
      setSolarReturn(null);
      return;
    }
    const returnYear = Number.parseInt((selectedDate || "").slice(0, 4), 10) || new Date().getFullYear();
    const controller = new AbortController();
    const { signal } = controller;

    void apiFetchJson<{ success: boolean; data: CharaDashaData }>(`/api/v1/charts/${activeChartId}/chara-dasha`, { signal })
      .then((res) => { if (!signal.aborted) setCharaDasha(res.data ?? null); })
      .catch(() => { if (!signal.aborted) setCharaDasha(null); });

    void apiFetchJson<{ success: boolean; data: SolarReturnData }>(
      `/api/v1/charts/${activeChartId}/solar-return?year=${returnYear}`, { signal }
    )
      .then((res) => { if (!signal.aborted) setSolarReturn(res.data ?? null); })
      .catch(() => { if (!signal.aborted) setSolarReturn(null); });

    return () => controller.abort();
  }, [activeChartId, selectedDate]);

  async function downloadPersonalChartPdf() {
    if (!activeChartId) return;
    const asOf = selectedDate || new Date().toISOString().slice(0, 10);
    const response = await fetch(`/api/backend/api/v1/charts/${activeChartId}/export/pdf?asOf=${asOf}`, {
      credentials: "include",
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jadhagam-${activeChartId}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
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

  /* Date label */
  const dateLabel = selectedDate === todayDate
    ? new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).toUpperCase()
    : formatDateLabel(selectedDate).toUpperCase();

  /* Guidance headline — first sentence */
  const guidanceHeadline = personalDailyGuidance
    ? tLang(personalDailyGuidance.text, lang).split(".")[0] + "."
    : "";
  const guidanceRest = personalDailyGuidance
    ? tLang(personalDailyGuidance.text, lang).split(".").slice(1).join(".").trim()
    : "";

  /* Dasha info */
  const dashaText = personalChartSummary
    ? `${personalChartSummary.currentMahadasha} ${t("dasha_word", lang)}`
    : null;
  const dashaBhuktiText = personalChartSummary
    ? `${personalChartSummary.currentAntardasha} ${t("bhukti_word", lang)}`
    : null;

  if (busyPersonal && !personalDailyGuidance && !personalChart) {
    return (
      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", display: "grid", gap: "var(--space-3)" }}>
          <div className="cd-skeleton" style={{ height: "14px", width: "28%", borderRadius: "var(--radius-sm)" }} />
          <div className="cd-skeleton" style={{ height: "44px", width: "72%", borderRadius: "var(--radius-sm)" }} />
          <div className="cd-skeleton" style={{ height: "12px", width: "86%", borderRadius: "var(--radius-sm)" }} />
          <div className="cd-skeleton" style={{ height: "12px", width: "64%", borderRadius: "var(--radius-sm)" }} />
        </div>
      </div>
    );
  }

  const validationStatus = personalChartSummary?.chartValidationStatus ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "#3D352B" }}>

      {/* ── Chart validation confidence chip ── */}
      {validationStatus && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {(() => {
            const { confidence, matchCount, totalChecked } = validationStatus;
            const color = confidence === "HIGH" ? "#5C7654" : confidence === "MEDIUM" ? "#B85A2C" : confidence === "LOW" ? "#A8482F" : "#7A6F5E";
            const icon = confidence === "HIGH" ? "✓" : confidence === "UNVALIDATED" ? "—" : "⚠";
            const label = confidence === "HIGH"
              ? (lang === "ta" ? `உயர் நம்பகம் — ${matchCount}/${totalChecked} பொருந்தியது` : `High confidence — ${matchCount}/${totalChecked} events matched`)
              : confidence === "MEDIUM"
              ? (lang === "ta" ? `நடுத்தர நம்பகம் — ${matchCount}/${totalChecked} பொருந்தியது` : `Moderate — ${matchCount}/${totalChecked} matched`)
              : confidence === "LOW"
              ? (lang === "ta" ? `குறைவான நம்பகம் — ${matchCount}/${totalChecked} பொருந்தியது` : `Low confidence — ${matchCount}/${totalChecked} matched`)
              : (lang === "ta" ? "நிகழ்வுகள் பதிவு செய்யப்படவில்லை" : "No life events on record");
            return (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "4px 12px", borderRadius: "var(--radius-pill)",
                background: `${color}18`, border: `1px solid ${color}44`,
                fontSize: "0.75rem", fontWeight: 600, color,
              }}>
                <span>{icon}</span>
                <span>{label}</span>
              </span>
            );
          })()}
        </div>
      )}

      {/* ── Panchangam drop (above alerts) ── */}
      {panchangam && (
        <div className="cd-panchangam-surface">
          <CollapsibleSection
            title={
              <span style={{ fontSize: "0.875rem", color: "#3D352B" }}>
                {t("today_panchangam", lang)}
                {" — "}
                <span style={{ color: "#7A6F5E", fontWeight: 400, fontSize: "0.875rem" }}>
                  {tWeekday(panchangam.vara.weekday, lang)} · {tNakshatra(panchangam.nakshatra.name, lang)} · {tTithi(panchangam.tithi.name, lang)}
                </span>
              </span>
            }
            defaultOpen={false}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", paddingTop: "var(--space-3)" }}>
              <div className="chip-row">
                <Chip tone="accent">{t("label_rahu_kalam", lang)} {formatClockLabel(panchangam.kalam.rahuKalam.start)}–{formatClockLabel(panchangam.kalam.rahuKalam.end)}</Chip>
                <Chip tone="warning">{t("label_yamagandam", lang)} {formatClockLabel(panchangam.kalam.yamagandam.start)}–{formatClockLabel(panchangam.kalam.yamagandam.end)}</Chip>
                <Chip>{t("label_kuligai", lang)} {formatClockLabel(panchangam.kalam.kuligai.start)}–{formatClockLabel(panchangam.kalam.kuligai.end)}</Chip>
{panchangam.kalam.nallaNeram?.map((w, idx) => {
                  const periodLabel = gowriPeriodLabel(w.period, lang);
                  const category = gowriCategoryLabel(w.name, lang);
                  const purpose = gowriPurposeLabel(w.name, lang);
                  const detail = [periodLabel, category, purpose].filter(Boolean).join(" · ");
                  return (
                    <Chip key={kalamSlotKey(w, idx)} tone="success">{t("label_nalla_neram", lang)}{detail ? ` (${detail})` : ""} {formatClockLabel(w.start)}–{formatClockLabel(w.end)}</Chip>
                  );
                })}
                {panchangamTimings && !panchangam.abhijit.isRestrictedByWeekday && (
                  <Chip tone="success">{t("label_abhijit", lang)} {formatClockLabel(panchangam.abhijit.start)}–{formatClockLabel(panchangam.abhijit.end)}</Chip>
                )}
              </div>
              <div className="cd-responsive-grid-2" style={{ gap: "var(--space-2)" }}>
                {[
                  { label: t("label_tithi", lang), value: `${panchangam.tithi.number} ${tTithi(panchangam.tithi.name, lang)}`, hint: `${t("label_ends_at", lang)} ${formatClockLabel(panchangam.tithi.endsAt)}` },
                  { label: t("label_nakshatra", lang), value: `${tNakshatra(panchangam.nakshatra.name, lang)} ${t("label_padam", lang)} ${panchangam.nakshatra.pada}`, hint: formatClockLabel(panchangam.nakshatra.endsAt) },
                  { label: t("label_sunrise", lang), value: formatClockLabel(panchangam.sunrise), hint: "" },
                  { label: t("label_sunset", lang), value: formatClockLabel(panchangam.sunset), hint: "" },
                ].map((row) => (
                  <div key={row.label}>
                    <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{row.label}</p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#1A1612" }}>{row.value}{row.hint && <span style={{ color: "var(--color-faint)", fontSize: "0.75rem" }}> {row.hint}</span>}</p>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ── Alerts ── */}
      {(isChandrashtama || ambientAlerts.length > 0 || peyarchiUpcoming.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {isChandrashtama && (
            <AlertBanner variant="critical" message={t("chandrashtama_warning", lang)} dismissible={false} />
          )}
          {ambientAlerts.slice(0, 2).map((alert) => (
            <AlertBanner key={alert.alertId} variant="caution"
              message={tLang(alert.title, lang) + " — " + tLang(alert.message, lang)} />
          ))}
          <PeyarchiBanner events={peyarchiUpcoming} lang={lang} peyarchiReport={peyarchiReport} />
        </div>
      )}

      {/* ── Action bar: refresh + PDF (personal tab is root-user only) ── */}
      <div className="cd-action-bar">
        <button
          type="button"
          onClick={() => onRefreshPersonal()}
          disabled={!birthProfileId || busyPersonal}
          className="cd-btn-pill"
        >
          {busyPersonal ? t("btn_refreshing", lang) : t("btn_refresh", lang)}
        </button>
        {activeChartId && (
          <button
            type="button"
            onClick={() => void downloadPersonalChartPdf()}
            style={{
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1_5)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {lang === "ta" ? "PDF பதிவிறக்கம்" : "Download PDF"}
          </button>
        )}
      </div>

      {/* ── HERO: Left headline + Right score card ── */}
      <PersonalHero
        lang={lang}
        displayName={displayName}
        dateLabel={dateLabel}
        guidanceHeadline={guidanceHeadline}
        score={score}
        personalScoreBand={personalScoreBand}
        personalDailyGuidance={personalDailyGuidance}
        bestWindow={bestWindow}
        avoidWindow={avoidWindow}
        panchangam={panchangam}
        panchangamTimings={panchangamTimings}
        personalChartSummary={personalChartSummary}
        astroText={astroText}
      />

      {/* ── Three info cards: Dasa | Nakshatra | Week Ahead ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-4)" }}>

        {/* Dasa card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "var(--radius-md)", padding: "var(--space-5)" }}>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
            {lang === "ta" ? "தசை" : "Dasa"}
          </p>
          <p style={{ margin: "0 0 var(--space-0_5)", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500, color: "#1A1612", lineHeight: 1.1 }}>
            {dashaText ?? "—"}
          </p>
          {dashaBhuktiText && (
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.875rem", color: "#7A6F5E" }}>
              {dashaBhuktiText}
            </p>
          )}
          {personalDailyGuidance?.emotionalWeather && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-2)", marginTop: "var(--space-2_5)" }}>
              {EMOTIONAL_WEATHER_FIELDS.map((field) => ({
                labelTa: field.labelTa,
                labelEn: field.labelEn,
                value: lang === "ta"
                  ? personalDailyGuidance.emotionalWeather![field.key]?.ta
                  : personalDailyGuidance.emotionalWeather![field.key]?.en,
              })).filter((row) => row.value).map((row) => (
                <div key={row.labelEn} style={{
                  padding: "var(--space-2_5) var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface-soft)",
                  border: "1px solid var(--color-border)",
                }}>
                  <p style={{
                    margin: "0 0 var(--space-0_5)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "var(--color-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "var(--font-body)",
                  }}>
                    {lang === "ta" ? row.labelTa : row.labelEn}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: "0.875rem",
                    color: "var(--color-text-strong)",
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.4,
                  }}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          )}
          {personalDailyGuidance?.scoreBreakdown && (
            <div style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-2)" }}>
              {SCORE_CHIP_KEYS.map((k) => (
                <span key={k} style={{
                  padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.625rem",
                  background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#7A6F5E",
                }}>
                  {t(`reason_${k}` as Parameters<typeof t>[0], lang)}: {personalDailyGuidance.scoreBreakdown[k]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Nakshatra card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "var(--radius-md)", padding: "var(--space-5)" }}>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
            {lang === "ta" ? "இன்றைய நட்சத்திரம்" : "Today's Birth Star"}
          </p>
          <p style={{ margin: "0 0 var(--space-1)", fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 500, color: "#1A1612", lineHeight: 1.1 }}>
            {panchangam ? tNakshatra(panchangam.nakshatra.name, lang) : (nakshatraCard ? (lang === "ta" ? nakshatraCard.nameTa : astroText(nakshatraCard.nameEn)) : "—")}
            {panchangam && (
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "var(--color-faint)", fontWeight: 400, marginLeft: "var(--space-1_5)" }}>
                · {lang === "ta" ? "பாதம்" : "root"} · {lang === "ta" ? "பாதம் தகவல்" : "pAdham info"}
              </span>
            )}
          </p>
          {nakshatraCard && (
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.5 }}>
              {lang === "ta" ? nakshatraCard.profile.ta : astroText(nakshatraCard.profile.en)}
            </p>
          )}
          {nakshatraCard && (
            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
              {nakshatraCard.strengths.slice(0, 2).map((s) => (
                <span key={s.en} style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", background: "#DCE4D2", border: "1px solid rgba(92,118,84,0.3)", color: "#5C7654" }}>
                  {lang === "ta" ? s.ta : s.en}
                </span>
              ))}
              {nakshatraCard.cautions.slice(0, 1).map((c) => (
                <span key={c.en} style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#7A6F5E" }}>
                  {lang === "ta" ? c.ta : c.en}
                </span>
              ))}
              {nakshatraCard.rulingPlanet && (
                <span style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#7A6F5E" }}>
                  {tPlanetLord(nakshatraCard.rulingPlanet, lang)} {lang === "ta" ? "ஆளும்" : "ruled"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Week ahead card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "var(--radius-md)", padding: "var(--space-5)" }}>
          <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
            {t("today_week_ahead", lang)}
          </p>
          {weekAhead && weekAhead.days.length > 0 ? (
            <>
              {/* Mini spark line */}
              <svg viewBox={`0 0 ${weekAhead.days.length * 32} 40`} style={{ width: "100%", height: "40px", display: "block", marginBottom: "var(--space-1_5)" }}>
                {weekAhead.days.map((day, i) => {
                  const x = i * 32 + 16;
                  const y = 36 - (day.score / 100) * 30;
                  const next = weekAhead.days[i + 1];
                  const nx = (i + 1) * 32 + 16;
                  const ny = next ? 36 - (next.score / 100) * 30 : y;
                  const isToday = day.dateLocal === selectedDate;
                  return (
                    <g key={day.dateLocal}>
                      {next && (
                        <line x1={x} y1={y} x2={nx} y2={ny} stroke="#D4C8AE" strokeWidth="1.5" />
                      )}
                      <circle
                        cx={x} cy={y} r={isToday ? 5 : 3.5}
                        fill={scoreColor(day.score)}
                        stroke={isToday ? "#1A1612" : "none"}
                        strokeWidth={isToday ? 1.5 : 0}
                      />
                    </g>
                  );
                })}
              </svg>
              {/* Day labels */}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {weekAhead.days.map((day) => (
                  <span key={day.dateLocal} style={{ fontSize: "0.625rem", color: "var(--color-faint)", textAlign: "center", flex: 1 }}>
                    {new Date(day.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" })}
                  </span>
                ))}
              </div>
              {/* Best/easiest annotation */}
              {weekAhead.days.length > 0 && (() => {
                const sorted = [...weekAhead.days].sort((a, b) => b.score - a.score);
                const best = sorted[0];
                const easiest = sorted[sorted.length - 1];
                const label = (d: typeof best) => new Date(d.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" });
                return (
                  <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.75rem", color: "#3D352B", lineHeight: 1.4 }}>
                    {lang === "ta" ? "சிறந்த நாள்" : "Best day"}{" "}
                    <strong style={{ color: SCORE_HIGH }}>{label(best)}</strong>
                    {" · "}
                    {lang === "ta" ? "எளிமையான மாலை" : "Easiest evening"}{" "}
                    <strong style={{ color: "#7A6F5E" }}>{label(easiest)}</strong>
                  </p>
                );
              })()}
            </>
          ) : (
            <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "0.875rem" }}>{t("guidance_empty", lang)}</p>
          )}
        </div>
      </div>

      {/* ── Remedy strip ── */}
      {personalDailyGuidance?.remedy && (
        <div style={{
          padding: "var(--space-4_5) var(--space-6)",
          borderRadius: "var(--radius-md)",
          background: "#F0D9C4",
          border: "1px solid rgba(184,90,44,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B85A2C" }}>
              {lang === "ta" ? "பரிகாரம் · இன்று" : "Remedy · Today"}
            </p>
            <p style={{ margin: 0, fontSize: "1rem", color: "#1A1612", fontFamily: "var(--font-display)", fontWeight: 500 }}>
              {tLang(personalDailyGuidance.remedy, lang)}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={() => void handleSaveReminder()}
              disabled={savingReminder}
              style={{
                padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-pill)", border: "1.5px solid #1A1612",
                background: savingReminder ? "#E4DBC8" : "#1A1612", color: savingReminder ? "#7A6F5E" : "#F4EEE2", fontSize: "0.875rem", fontWeight: 600,
                cursor: savingReminder ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              }}
            >
              {savingReminder
                ? (lang === "ta" ? "சேமிக்கிறது…" : "Saving…")
                : (lang === "ta" ? "நினைவூட்டல் சேமி" : "Save reminder")}
            </button>
            {reminderMessage && (
              <p style={{ margin: 0, fontSize: "0.75rem", color: reminderMessage.includes("Could not") || reminderMessage.includes("முடியவில்லை") ? "#A8482F" : "#5C7654" }}>
                {reminderMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Existing detailed sections (Snapshot, Chart, Guidance, Planets, Nakshatra) ── */}
      {/* Override dark-theme CSS vars so all Surface/Chip/Metric children read properly on cream */}
      <div style={{
        "--color-surface": "#FFFFFF",
        "--color-surface-2": "#FAF5EA",
        "--color-surface-3": "#EDE5D4",
        "--color-border": "#D4C8AE",
        "--color-text": "#1A1612",
        "--color-muted": "#5a4f42",
        "--color-accent": "#B85A2C",
        "--color-accent-muted": "rgba(184,90,44,0.12)",
        "--color-accent-secondary": "#5C7654",
        "--color-alert-critical": "#A8482F",
        "--color-alert-caution": "#B85A2C",
        "--color-positive": "#3a6b40",
        "background": "transparent",
        "display": "contents",
      } as React.CSSProperties}>

      {/* Daily snapshot (score breakdown, action) */}
      <DashboardDailySnapshot
        lang={lang}
        guidance={personalDailyGuidance}
        transit={personalTransit}
        sani={personalSani}
        panchangam={panchangam}
        birthProfile={personalChart?.birthProfile ?? null}
      />

      {activeChartId && (
        <DashboardActivityTimingCard
          chartId={activeChartId}
          lang={lang}
          selectedDate={selectedDate}
          onDateChange={onDateChange}
        />
      )}

      {/* Chart + Guidance two-column */}
      <div className="two-col">
        <Surface title={t("surface_chart_context", lang)}>
          {personalChart ? (
            <div className="surface__body">
              <div className="surface__headline">
                <span>{personalChartSummary?.displayName ?? personalChart.birthProfile.displayName}</span>
                <Chip tone="accent">
                  {personalChartSummary ? `${personalChartSummary.currentMahadasha} ${t("dasha_word", lang)}` : personalChart.calculationVersion}
                </Chip>
              </div>
              <p className="surface__text">
                {personalChartSummary
                  ? `${personalChartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${personalChartSummary.moonRasi} ${t("label_janma_rasi", lang)} · ${astroText(personalChartSummary.janmaNakshatra)} ${t("label_nakshatra", lang)} ${t("label_padam", lang)} ${personalChartSummary.janmaPada}`
                  : t("chart_loading", lang)}
              </p>
              <div className="surface__metrics">
                <Metric label={t("label_birth_date", lang)} value={personalChart.birthProfile.birthDateLocal} hint={personalChart.birthProfile.birthPlace ?? personalChart.birthProfile.birthProfileId.slice(0, 8)} />
                <Metric label={t("label_lagnam", lang)} value={personalChart.lagna.rasiName ?? `Raasi ${personalChart.lagna.rasi}`} hint={`${personalChart.lagna.degreeInRasi.toFixed(2)}° · ${astroText(personalChart.lagna.nakshatraName)} ${t("label_padam", lang)} ${personalChart.lagna.pada}`} tone="high" />
              </div>
              <JathagamKattam chart={personalChart} lang={lang} />
              {activeChartId && (
                <div style={{ display: "flex", gap: "8px", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
                  <ShareCardButton chartId={activeChartId} cardType="NAKSHATRA" lang={lang} label={lang === "ta" ? "நட்சத்திர அட்டை பகிர்" : "Share Birth Star Card"} />
                  <ShareCardButton chartId={activeChartId} cardType="DAILY_VIBE" lang={lang} date={selectedDate} label={lang === "ta" ? "இன்றைய வைப் பகிர்" : "Share Today's Vibe"} />
                </div>
              )}
            </div>
          ) : (
            <p className="empty-state">{t("chart_no_profile", lang)}</p>
          )}
        </Surface>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Surface title={t("surface_guidance", lang)}>
            {personalDailyGuidance ? (
              <div className="surface__body">
                {personalDailyGuidance.tithiCard && (
                  <div style={{ marginBottom: "var(--space-2_5)", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(251,191,36,0.22)" }}>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em" }}>🕉 {t("tithi_card_label", lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.tithiCard, lang)}</p>
                  </div>
                )}
                {personalDailyGuidance.contextInsight && (
                  <div style={{ marginBottom: "var(--space-2_5)", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(167,139,250,0.25)" }}>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em" }}>📋 {t("context_insight_label", lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.contextInsight, lang)}</p>
                  </div>
                )}
                <div className="surface__headline">
                  <span>{formatScoreLabel(personalDailyGuidance.score)}</span>
                  <Chip tone={personalScoreBand?.tone === "high" ? "success" : personalScoreBand?.tone === "low" ? "warning" : "neutral"}>{personalDailyGuidance.label}</Chip>
                </div>
                <p className="surface__text">{tLang(personalDailyGuidance.text, lang)}</p>
                {personalDailyGuidance.currentHoraLord && (
                  <div
                    style={{
                      marginTop: "var(--space-1_5)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-1_5)",
                      padding: "var(--space-1) var(--space-2_5)",
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-soft)",
                      fontSize: "0.75rem",
                    }}
                  >
                    <span style={{ color: "var(--color-faint)" }}>{lang === "ta" ? "தற்போதைய ஹோரா" : "Current hora"}</span>
                    <strong style={{ color: DASHA_COLORS[personalDailyGuidance.currentHoraLord] ?? "var(--color-accent)" }}>
                      {tPlanetLord(personalDailyGuidance.currentHoraLord, lang)}
                    </strong>
                  </div>
                )}
                {personalDailyGuidance.pratyantarNarrative && (
                  <div style={{ marginTop: "var(--space-2)", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {lang === "ta" ? "பிரத்யந்தர தசை" : "Pratyantar signal"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.45, color: "var(--color-text)" }}>
                      {tLang(personalDailyGuidance.pratyantarNarrative, lang)}
                    </p>
                  </div>
                )}
                {personalDailyGuidance.nakshatraPerspective && (
                  <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                    {astroText(tLang(personalDailyGuidance.nakshatraPerspective, lang))}
                  </p>
                )}
                <div className="surface__metrics">
                  <Metric label={t("label_best_time", lang)} value={bestWindow ? formatClockLabel(bestWindow.start) : ""} hint={bestWindow ? formatClockLabel(bestWindow.end) : ""} tone="high" />
                  <Metric label={t("label_caution_time", lang)} value={avoidWindow ? formatClockLabel(avoidWindow.start) : ""} hint={avoidWindow ? formatClockLabel(avoidWindow.end) : ""} tone="low" />
                  <Metric label={t("label_moon_transit", lang)} value={`${personalDailyGuidance.scoreBreakdown.moonTransit}`} hint={`${t("dasha_word", lang)} ${personalDailyGuidance.scoreBreakdown.dashaSupport}`} />
                </div>
                {personalDailyGuidance.reasons && (
                  <div style={{ marginTop: "var(--space-2_5)", paddingTop: "var(--space-2_5)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="surface__subhead" style={{ marginBottom: "var(--space-1_5)" }}>{t("why_this_prediction", lang)}</p>
                    {GUIDANCE_REASON_KEYS.map((key) => (
                      <div key={key} className="cd-responsive-detail-row" style={{ marginBottom: "var(--space-1)" }}>
                        <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-muted)", minWidth: "84px", paddingTop: "var(--space-0_5)" }}>{t(`reason_${key}` as Parameters<typeof t>[0], lang)}</span>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.4 }}>{tLang(personalDailyGuidance.reasons[key], lang)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {!personalViewId && dailyGuidanceRange && (
                  <div style={{ marginTop: "var(--space-2_5)", paddingTop: "var(--space-2)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="surface__subhead" style={{ marginBottom: "var(--space-1_5)" }}>{t("label_next_3_days", lang)}</p>
                    <div className="chip-row">
                      {dailyGuidanceRange.items.map((item) => {
                        const band = getScoreBand(item.score);
                        return (
                          <Chip key={item.dateLocal} tone={band.tone === "high" ? "success" : band.tone === "low" ? "warning" : "neutral"}>
                            {formatDateLabel(item.dateLocal)} {item.score}/100
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="empty-state">{t("guidance_empty", lang)}</p>
            )}
          </Surface>

          <Surface title={t("surface_gochar", lang)}>
            {personalTransit && personalSani && panchangam ? (
              <div className="stack">
                <div className="surface__metrics">
                  <Metric label={t("label_chandrashtamam", lang)} value={personalTransit.isChandrashtama ? t("label_active", lang) : t("label_none", lang)} hint={personalSani.confirmationSentence} tone={personalTransit.isChandrashtama ? "low" : "rest"} />
                  {personalSani.moonBasedCycle.isActive && <Metric label={t("label_sani_cycle", lang)} value={personalSani.moonBasedCycle.type ?? ""} hint={personalSani.moonBasedCycle.supportiveLabel ?? ""} tone="low" />}
                </div>
                <div className="surface__textBlock">
                  <p className="surface__subhead">{t("label_gochar_pos", lang)}</p>
                  <p className="surface__text">{t("label_janma_rasi_short", lang)} {personalTransit.janmaRasi} · {t("label_lagnam", lang)} {personalTransit.lagnaRasi}</p>
                  <div className="chip-row">
                    {personalTransit.transits.slice(0, 5).map((item) => (
                      <Chip key={item.graha}>{item.graha} · {item.currentRasi}</Chip>
                    ))}
                  </div>
                </div>
                <div className="surface__textBlock">
                  <p className="surface__subhead">{t("label_panchangam", lang)}</p>
                  <p className="surface__text">{tWeekday(panchangam.vara.weekday, lang)} · {t("label_tithi", lang)} {panchangam.tithi.number} {tTithi(panchangam.tithi.name, lang)} · {tNakshatra(panchangam.nakshatra.name, lang)}</p>
                </div>
              </div>
            ) : <p className="empty-state">{t("gochar_empty", lang)}</p>}
          </Surface>
        </div>
      </div>

      {/* Dasa · Bhukti · Antaram strip */}
      {personalChartSummary && (
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
          <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: "var(--space-1)" }}>
            {lang === "ta" ? "தசை நிலை" : "Dasa Position"}
          </span>
          {[
            { label: lang === "ta" ? "தசை" : "Dasa", value: personalChartSummary.currentMahadasha },
            { label: lang === "ta" ? "புக்தி" : "Bhukti", value: personalChartSummary.currentAntardasha },
            { label: lang === "ta" ? "அந்தரம்" : "Antaram", value: dashaMaha?.current?.pratyantardasha?.lord ?? null },
          ].map(({ label, value }) => value && (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
              <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)", fontFamily: "var(--font-body)" }}>{tPlanetLord(value, lang)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Planet table */}
      <Surface title={t("surface_planets", lang)}>
        {personalChart ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("col_graha", lang)}</th><th>{t("col_rasi", lang)}</th><th>{t("col_degree", lang)}</th>
                  <th>{t("col_nakshatra", lang)}</th><th>{t("col_pada", lang)}</th><th>{t("col_house", lang)}</th>
                  <th>{t("col_d9_rasi", lang)}</th><th>{t("col_special", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {personalChart.planets.map((planet) => (
                  <tr key={planet.graha}>
                    <td style={{ fontWeight: 600 }}><span style={{ color: DASHA_COLORS[planet.graha] ?? "#93c5fd", marginRight: "var(--space-1)" }}>{GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2)}</span>{planet.graha}</td>
                    <td>{planet.rasiName}</td>
                    <td>{planet.degreeInRasi.toFixed(2)}°</td>
                    <td>{astroText(planet.nakshatraName)}</td>
                    <td style={{ textAlign: "center" }}>{planet.pada}</td>
                    <td style={{ textAlign: "center" }}>{planet.houseFromLagna}</td>
                    <td>{RASI_NAMES[planet.d9Rasi] ?? planet.d9Rasi}</td>
                    <td className="table__flags">
                      {planet.isRetrograde ? <Chip tone="warning">{t("flag_vakra", lang)}</Chip> : null}
                      {planet.isCombust ? <Chip tone="warning">{t("flag_astam", lang)}</Chip> : null}
                      {planet.isVargottama ? <Chip tone="success">{t("flag_vargottamam", lang)}</Chip> : null}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid rgba(255,255,255,0.12)", opacity: 0.75 }}>
                  <td style={{ fontWeight: 600 }}><span style={{ color: "#e5b84d", marginRight: "var(--space-1)" }}>ல</span>{t("label_lagnam", lang)}</td>
                  <td>{personalChart.lagna.rasiName}</td>
                  <td>{personalChart.lagna.degreeInRasi.toFixed(2)}°</td>
                  <td>{astroText(personalChart.lagna.nakshatraName)}</td>
                  <td style={{ textAlign: "center" }}>{personalChart.lagna.pada}</td>
                  <td style={{ textAlign: "center" }}>1</td>
                  <td>–</td><td />
                </tr>
              </tbody>
            </table>
          </div>
        ) : <p className="empty-state">{t("planets_empty", lang)}</p>}

        {personalChart && (
          <div style={{ marginTop: "var(--space-4)" }}>
            <ChartExplanationPanel
              lang={lang}
              chart={personalChart}
              explanation={personalChartExplanation}
              summary={personalChartSummary}
              transit={personalTransit}
              sani={personalSani}
              peyarchiUpcoming={peyarchiUpcoming}
              dasha={dasha}
              dashaAntar={dashaAntar}
            />
          </div>
        )}
      </Surface>

      {/* Nakshatra card */}
      {nakshatraCard && (
        <Surface title={t("nakshatra_card_label", lang)}>
          <div className="surface__body">
            <div className="surface__headline">
              <span>{lang === "ta" ? nakshatraCard.nameTa : astroText(nakshatraCard.nameEn)}</span>
              <Chip tone="accent">{t("nakshatra_ruling_planet", lang)}: {tPlanetLord(nakshatraCard.rulingPlanet, lang)}</Chip>
            </div>
            <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.75rem", color: "var(--color-muted)" }}>
              <span style={{ marginRight: "var(--space-3)" }}>{t("nakshatra_deity", lang)}: <strong style={{ color: "var(--color-text)" }}>{lang === "ta" ? nakshatraCard.deityTa : nakshatraCard.deityEn}</strong></span>
              <span>{t("nakshatra_symbol", lang)}: <strong style={{ color: "var(--color-text)" }}>{lang === "ta" ? nakshatraCard.symbolTa : nakshatraCard.symbolEn}</strong></span>
            </p>
            <p className="surface__text">{lang === "ta" ? nakshatraCard.profile.ta : astroText(nakshatraCard.profile.en)}</p>
            {nakshatraCard.strengths.length > 0 && (
              <div style={{ marginBottom: "var(--space-2)" }}>
                <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: "#5C7654", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("nakshatra_strengths", lang)}</p>
                <div className="chip-row">{nakshatraCard.strengths.map((s) => <Chip key={s.en} tone="success">{lang === "ta" ? s.ta : astroText(s.en)}</Chip>)}</div>
              </div>
            )}
            {nakshatraCard.cautions.length > 0 && (
              <div>
                <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: "#B85A2C", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("nakshatra_cautions", lang)}</p>
                <div className="chip-row">{nakshatraCard.cautions.map((c) => <Chip key={c.en} tone="warning">{lang === "ta" ? c.ta : astroText(c.en)}</Chip>)}</div>
              </div>
            )}
          </div>
        </Surface>
      )}

      </div>{/* end css-var override wrapper */}

      {/* ── Divisional Charts (Vargas) ── */}
      {personalChart && (
        <div style={{
          padding: "var(--space-3_5) var(--space-4_5)",
          borderRadius: "var(--radius-md)",
          border: "1px solid #E4DBC8",
          background: "#FAF5EA",
        }}>
          <VargasPanel
            lang={lang}
            vargas={personalChart.vargas}
            d1Planets={Object.fromEntries(personalChart.planets.map(p => [p.graha, p.rasi]))}
            bhavaChalit={personalChart.bhavaChalit}
          />
        </div>
      )}

      {/* ── Classical Timing (Chara Dasha + Solar Return) ── */}
      {(charaDasha || solarReturn) && (
        <div style={{
          "--color-surface": "#FFFFFF",
          "--color-surface-2": "#FAF5EA",
          "--color-surface-3": "#EDE5D4",
          "--color-border": "#D4C8AE",
          "--color-text": "#1A1612",
          "--color-muted": "#5a4f42",
          "--color-accent": "#B85A2C",
          "--color-accent-secondary": "#5C7654",
          "background": "transparent",
        } as React.CSSProperties}>
          <Surface title={lang === "ta" ? "பாரம்பரிய கால நிர்ணயம்" : "Classical Timing"}>
            <div className="surface__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
              {charaDasha && (
                <CollapsibleSection
                  title={lang === "ta" ? "ஜைமினி சார தசை" : "Jaimini Chara Dasha"}
                  defaultOpen={false}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingTop: "var(--space-2)" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                      {lang === "ta"
                        ? "இது ராசி அடிப்படையிலான தசை. திருமணம், தொழில் மாற்றம் போன்ற நிகழ்வுகளின் நேரச் சிக்னலை காட்டும்."
                        : "This sign-based dasha is used to time life-event periods such as marriage and career transitions."}
                    </p>
                    {charaDasha.currentPeriod && (
                      <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)", background: "rgba(92,118,84,0.12)", border: "1px solid rgba(92,118,84,0.35)" }}>
                        <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-score-high)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {lang === "ta" ? "தற்போதைய சார தசை" : "Current Chara Dasha"}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                          {charaDasha.currentPeriod.rasi_name}
                        </p>
                        <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
                          {charaDasha.currentPeriod.start_date} – {charaDasha.currentPeriod.end_date}
                        </p>
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                      {charaDasha.periods.map((period) => (
                        <div key={`${period.rasi}-${period.start_date}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-1_5) var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: charaDasha.currentPeriod?.rasi === period.rasi ? "var(--color-surface-soft)" : "transparent" }}>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-strong)" }}>{period.rasi_name}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>{period.years} {lang === "ta" ? "ஆண்டுகள்" : "yrs"} · {period.start_date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>
              )}
              {solarReturn && (
                <CollapsibleSection
                  title={lang === "ta" ? `${solarReturn.returnYear} ஆண்டு தாஜகா` : `${solarReturn.returnYear} Annual Chart`}
                  defaultOpen={false}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-2_5)", paddingTop: "var(--space-2)" }}>
                    <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                      <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang === "ta" ? "வருட லக்னம்" : "SR Lagna"}</p>
                      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                        {solarReturn.srLagnaRasiName}
                        {solarReturn.lagnaMatchesNatal && (
                          <span style={{ marginLeft: "var(--space-1_5)", fontSize: "0.625rem", padding: "2px 6px", borderRadius: "var(--radius-pill)", background: "rgba(92,118,84,0.15)", color: "var(--color-score-high)", border: "1px solid rgba(92,118,84,0.35)" }}>
                            {lang === "ta" ? "நட்டாள்போல்" : "Same as natal"}
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                      <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang === "ta" ? "முந்தா" : "Muntha"}</p>
                      <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{solarReturn.munthaRasiName}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)" }}>{lang === "ta" ? "சூரிய நீளம்" : "Sun longitude"}: {solarReturn.sunLongAtReturn.toFixed(4)}°</p>
                    </div>
                  </div>
                </CollapsibleSection>
              )}
            </div>
          </Surface>
        </div>
      )}

      {/* ── Morning Guidance opt-in ── */}
      <MorningGuidanceCard lang={lang} />

      {/* ── Prasna (Horary) ── */}
      {onOpenPrasna && (
        <div className="cd-responsive-row" style={{ alignItems: "center", gap: "var(--space-3)" }}>
          <Button variant="ghost" onClick={onOpenPrasna}>
            {lang === "ta" ? "ப்ரஸ்ன கேள்வி கேளுங்கள்" : "Ask a Horary Question"}
          </Button>
          <span style={{ fontSize: "0.75rem", color: "#7A6F5E" }}>
            {lang === "ta" ? "பிறந்த நேரம் தெரியாவிட்டால் அல்லது உடனடி கேள்விக்கு" : "When birth time is unknown or for an immediate question"}
          </span>
        </div>
      )}

      {onClosePrasna && personalChart && (
        <PrasnaWidget
          lang={lang}
          open={showPrasna}
          onClose={onClosePrasna}
          timezone={personalChart.birthProfile.birthTimezone ?? "Asia/Kolkata"}
          latitude={personalChart.birthProfile.birthLatitude ?? 13.0827}
          longitude={personalChart.birthProfile.birthLongitude ?? 80.2707}
        />
      )}
    </div>
  );
}
