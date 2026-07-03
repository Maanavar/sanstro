"use client";

import { useEffect, useState } from "react";
import { SkeletonDashboardCard, SkeletonDashaTimeline, SkeletonChartPanel, SkeletonMetricStrip } from "@/components/skeleton";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { formatClockLabel, formatDateLabel, getScoreBand, scoreColor, SCORE_HIGH } from "@/lib/format";
import { gowriCategoryLabel, gowriPeriodLabel, gowriPurposeLabel } from "@/lib/gowri";
import { t, tLang, tTithi, tNakshatra, tWeekday, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  AmbientAlertItem,
  CharaDashaData,
  LifeAreaData,
  LifeAreasResponseData,
  LifeMode,
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
import { ShadbalaPanel } from "./dashboard-shadbala-panel";
import { YoginiDashaPanel } from "./dashboard-yogini-dasha-panel";
import { AshtottariDashaPanel } from "./dashboard-ashtottari-dasha-panel";
import { KalachakraDashaPanel } from "./dashboard-kalachakra-dasha-panel";
import { MorningGuidanceCard } from "./morning-guidance-card";
import { PrasnaWidget } from "./dashboard-prasna-widget";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { ShareCardButton } from "./dashboard-share-card";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import { PersonalHero } from "./dashboard-personal-hero";
import { PersonalOverview } from "./dashboard-personal-overview";
import { useStreak } from "@/hooks/useStreak";

const EMOTIONAL_WEATHER_FIELDS = [
  { labelTa: "உணர்வு நிலை", labelEn: "Emotional tone", key: "toneText" as const },
  { labelTa: "உடல் போக்கு", labelEn: "Physical tendency", key: "physicalTendencyText" as const },
  { labelTa: "சிறந்த பயன்பாடு", labelEn: "Best use of day", key: "bestUseOfDayText" as const },
] as const;

const SCORE_CHIP_KEYS = ["moonTransit", "dashaSupport", "panchangam"] as const;
const GUIDANCE_REASON_KEYS = ["moonTransit", "dashaSupport", "panchangam", "gochar", "personalCaution"] as const;
function kalamSlotKey(
  slot: PanchangamDailyResponseData["kalam"]["nallaNeram"][number],
  index: number,
): string {
  return `${slot.period ?? "slot"}-${slot.name ?? slot.slot}-${slot.start}-${slot.end}-${index}`;
}

export type DashboardPersonalTabProps = {
  lang: Lang;
  activeLifeMode?: LifeMode;
  onChangeFocus?: () => void;
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
  lifeAreas?: LifeAreasResponseData | null;
  onGoToFamily?: () => void;
  onGoToJournal?: () => void;
  onOpenPrasna?: () => void;
  showPrasna?: boolean;
  onClosePrasna?: () => void;
  dasha: DashaTimelineResponseData | null;
  dashaMaha?: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
};


export function DashboardPersonalTab({
  lang,
  activeLifeMode,
  onChangeFocus,
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
  lifeAreas,
  onGoToFamily,
  onGoToJournal,
  onOpenPrasna,
  showPrasna = false,
  onClosePrasna,
  dasha,
  dashaMaha = null,
  dashaAntar,
}: DashboardPersonalTabProps) {
  const { days: streakDays } = useStreak();
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

  const chandrashtamaWindowsSummary = (() => {
    const windows = panchangam?.chandrashtamamToday?.janmaNakshatraWindows ?? [];
    if (!windows.length) return "";
    return windows
      .map((w) => `${tNakshatra(w.name, lang)} ${formatClockLabel(w.start)}–${formatClockLabel(w.end)}`)
      .join(", ");
  })();

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
    const response = await fetch(`/api/backend/api/v1/charts/${activeChartId}/export/pdf?asOf=${asOf}&lang=${lang}`, {
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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <SkeletonMetricStrip />
        <SkeletonDashboardCard lines={4} showIcon />
        <SkeletonDashaTimeline />
        <SkeletonChartPanel />
      </div>
    );
  }

  const validationStatus = personalChartSummary?.chartValidationStatus ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--panel-earth)" }}>

      {/* ── Chart validation confidence chip ── */}
      {validationStatus && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {(() => {
            const { confidence, matchCount, totalChecked } = validationStatus;
            const color = confidence === "HIGH" ? "var(--chart-d9-active)" : confidence === "MEDIUM" ? "var(--panel-brand)" : confidence === "LOW" ? "var(--planet-saturn)" : "var(--color-faint)";
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
              <span style={{ fontSize: "0.875rem", color: "var(--panel-earth)" }}>
                {t("today_panchangam", lang)}
                {" — "}
                <span style={{ color: "var(--color-faint)", fontWeight: 400, fontSize: "0.875rem" }}>
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
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--panel-earth-dark)" }}>{row.value}{row.hint && <span style={{ color: "var(--color-faint)", fontSize: "0.75rem" }}> {row.hint}</span>}</p>
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
            <ChandrashtamaCard
              lang={lang}
              chandrashtamaEnds={personalDailyGuidance?.chandrashtamaEnds ?? null}
              descriptionTa={null}
              descriptionEn={null}
              windowsSummary={chandrashtamaWindowsSummary}
            />
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

      {/* ── Streak badge ── */}
      {streakDays > 1 && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "4px 12px", borderRadius: "var(--radius-pill)",
          background: "var(--color-amber-bg, #fffbeb)",
          border: "1px solid var(--color-amber-border, #fde68a)",
          fontSize: "0.75rem", fontWeight: 600, color: "var(--color-amber, #d97706)",
          alignSelf: "flex-start",
        }}>
          <span aria-hidden="true">🔥</span>
          {lang === "ta" ? `${streakDays} நாள் தொடர்ச்சி` : `${streakDays}-day streak`}
        </div>
      )}

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

      {/* ── Life-area pulse + quick actions ── */}
      {(lifeAreas?.areas?.length || onGoToJournal) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {lifeAreas?.areas && lifeAreas.areas.length > 0 && (
            <TodayLifeAreaPulse areas={lifeAreas.areas.slice(0, 4)} lang={lang} />
          )}
          {onGoToJournal && (
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                type="button"
                onClick={onGoToJournal}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "var(--radius-pill)",
                  background: "var(--panel-brand)", border: "none",
                  color: "white", fontSize: "0.875rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M4 5h6M4 7.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {lang === "ta" ? "தருணம் பதிவு" : "Log moment"}
              </button>
            </div>
          )}
        </div>
      )}

      <PersonalOverview
        lang={lang}
        selectedDate={selectedDate}
        dashaText={dashaText}
        dashaBhuktiText={dashaBhuktiText}
        personalChartSummary={personalChartSummary}
        personalDailyGuidance={personalDailyGuidance}
        panchangam={panchangam}
        nakshatraCard={nakshatraCard}
        weekAhead={weekAhead}
        savingReminder={savingReminder}
        reminderMessage={reminderMessage}
        onSaveReminder={handleSaveReminder}
        astroText={astroText}
      />
      {/* ── Existing detailed sections (Snapshot, Chart, Guidance, Planets, Nakshatra) ── */}
      {/* Override dark-theme CSS vars so all Surface/Chip/Metric children read properly on cream */}
      <div style={{
        "--color-surface": "var(--chart-cell-default)",
        "--color-surface-2": "var(--panel-cream)",
        "--color-surface-3": "var(--chart-cell-selected)",
        "--color-border": "var(--panel-tan)",
        "--color-text": "var(--panel-earth-dark)",
        "--color-muted": "var(--panel-mid-earth)",
        "--color-accent": "var(--panel-brand)",
        "--color-accent-muted": "var(--ring-brand)",
        "--color-accent-secondary": "var(--chart-d9-active)",
        "--color-alert-critical": "var(--planet-saturn)",
        "--color-alert-caution": "var(--panel-brand)",
        "--color-positive": "var(--chart-d9-active-dark)",
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
        lifeMode={activeLifeMode}
        onChangeFocus={onChangeFocus}
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
                  <div style={{ marginBottom: "var(--space-2_5)", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--color-amber-bg)", border: "1px solid var(--color-amber-border)" }}>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-amber)", textTransform: "uppercase", letterSpacing: "0.06em" }}>🕉 {t("tithi_card_label", lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.tithiCard, lang)}</p>
                  </div>
                )}
                {personalDailyGuidance.contextInsight && (
                  <div style={{ marginBottom: "var(--space-2_5)", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "var(--color-violet-bg)", border: "1px solid var(--color-violet-border)" }}>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-violet)", textTransform: "uppercase", letterSpacing: "0.06em" }}>📋 {t("context_insight_label", lang)}</p>
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
                  <div style={{ marginTop: "var(--space-2_5)", paddingTop: "var(--space-2_5)", borderTop: "1px solid var(--veil-white-07)" }}>
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
                  <div style={{ marginTop: "var(--space-2_5)", paddingTop: "var(--space-2)", borderTop: "1px solid var(--veil-white-07)" }}>
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
                  <Metric
                    label={t("label_chandrashtamam", lang)}
                    value={personalTransit.isChandrashtama ? t("label_active", lang) : t("label_none", lang)}
                    hint={personalTransit.isChandrashtama && chandrashtamaWindowsSummary
                      ? chandrashtamaWindowsSummary
                      : personalSani.confirmationSentence
                    }
                    tone={personalTransit.isChandrashtama ? "low" : "rest"}
                  />
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
                    <td style={{ fontWeight: 600 }}><span style={{ color: DASHA_COLORS[planet.graha] ?? "var(--color-accent-secondary)", marginRight: "var(--space-1)" }}>{GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2)}</span>{planet.graha}</td>
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
                <tr style={{ borderTop: "1px solid var(--veil-white-12)", opacity: 0.75 }}>
                  <td style={{ fontWeight: 600 }}><span style={{ color: "var(--chart-amber)", marginRight: "var(--space-1)" }}>ல</span>{t("label_lagnam", lang)}</td>
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
                <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: "var(--chart-d9-active)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("nakshatra_strengths", lang)}</p>
                <div className="chip-row">{nakshatraCard.strengths.map((s) => <Chip key={s.en} tone="success">{lang === "ta" ? s.ta : astroText(s.en)}</Chip>)}</div>
              </div>
            )}
            {nakshatraCard.cautions.length > 0 && (
              <div>
                <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, color: "var(--panel-brand)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("nakshatra_cautions", lang)}</p>
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
          border: "1px solid var(--panel-tan-light)",
          background: "var(--panel-cream)",
        }}>
          <VargasPanel
            lang={lang}
            vargas={personalChart.vargas}
            d1Planets={Object.fromEntries(personalChart.planets.map(p => [p.graha, p.rasi]))}
            bhavaChalit={personalChart.bhavaChalit}
            vargaReliability={personalChart.vargaReliability}
          />
        </div>
      )}

      {/* ── Shadbala (classical six-fold strength) ── */}
      {activeChartId && (
        <div style={{
          padding: "var(--space-3_5) var(--space-4_5)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--panel-tan-light)",
          background: "var(--panel-cream)",
        }}>
          <ShadbalaPanel lang={lang} chartId={activeChartId} />
        </div>
      )}

      {/* ── Yogini Dasha (36-year secondary/comparison dasha) ── */}
      {activeChartId && (
        <div style={{
          padding: "var(--space-3_5) var(--space-4_5)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--panel-tan-light)",
          background: "var(--panel-cream)",
        }}>
          <YoginiDashaPanel lang={lang} chartId={activeChartId} />
        </div>
      )}

      {/* ── Ashtottari Dasha (108-year secondary/comparison dasha) ── */}
      {activeChartId && (
        <div style={{
          padding: "var(--space-3_5) var(--space-4_5)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--panel-tan-light)",
          background: "var(--panel-cream)",
        }}>
          <AshtottariDashaPanel lang={lang} chartId={activeChartId} />
        </div>
      )}

      {/* ── Kalachakra Dasha (rasi-based, experimental/display-only) ── */}
      {activeChartId && (
        <div style={{
          padding: "var(--space-3_5) var(--space-4_5)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--panel-tan-light)",
          background: "var(--panel-cream)",
        }}>
          <KalachakraDashaPanel lang={lang} chartId={activeChartId} />
        </div>
      )}

      {/* ── Classical Timing (Chara Dasha + Solar Return) ── */}
      {(charaDasha || solarReturn) && (
        <div style={{
          "--color-surface": "var(--chart-cell-default)",
          "--color-surface-2": "var(--panel-cream)",
          "--color-surface-3": "var(--chart-cell-selected)",
          "--color-border": "var(--panel-tan)",
          "--color-text": "var(--panel-earth-dark)",
          "--color-muted": "var(--panel-mid-earth)",
          "--color-accent": "var(--panel-brand)",
          "--color-accent-secondary": "var(--chart-d9-active)",
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
                    {charaDasha.atmakaraka && (
                      <div style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {lang === "ta" ? "ஆத்மகாரகன்" : "Atmakaraka"}
                          </p>
                          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                            {tPlanetLord(charaDasha.atmakaraka, lang)}
                          </p>
                        </div>
                        {charaDasha.karakamsaRasiName && (
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              {lang === "ta" ? "காரகாம்சம்" : "Karakamsa"}
                            </p>
                            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
                              {charaDasha.karakamsaRasiName}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {charaDasha.currentPeriod && (
                      <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)", background: "var(--cl-sage-soft)", border: "1px solid var(--cl-sage-border)" }}>
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
                          <span style={{ marginLeft: "var(--space-1_5)", fontSize: "0.625rem", padding: "2px 6px", borderRadius: "var(--radius-pill)", background: "var(--cl-sage-mid)", color: "var(--color-score-high)", border: "1px solid var(--cl-sage-border)" }}>
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
          <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>
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

const CHANDRASHTAMA_AVOID = {
  ta: [
    "முக்கியமான ஒப்பந்தங்கள் கையெழுத்திட வேண்டாம்",
    "புதிய வியாபார முயற்சி தொடங்க வேண்டாம்",
    "அதிக பண பரிவர்த்தனை தவிர்க்கவும்",
    "தேவையற்ற சர்ச்சைகளில் ஈடுபட வேண்டாம்",
  ],
  en: [
    "Don't sign important contracts or agreements",
    "Don't launch a new business or major venture",
    "Avoid large financial transactions or loans",
    "Don't get drawn into unnecessary arguments",
  ],
};

const CHANDRASHTAMA_CAN_DO = {
  ta: [
    "ஆன்மீக நடைமுறைகள் — தியானம், ஜபம், பூஜை",
    "குடும்பத்தினருடன் அமைதியாக நேரம் செலவிடுங்கள்",
    "ஓய்வு எடுங்கள் — உள் வலிமை திரட்டும் காலம்",
    "ஆலய தரிசனம் & தர்மம் செய்வது நல்லது",
  ],
  en: [
    "Spiritual practice — meditation, japa, puja",
    "Spend quiet time with family and loved ones",
    "Rest and restore — build inner reserves",
    "Temple visit and charitable giving are beneficial",
  ],
};

export function ChandrashtamaCard({ lang, chandrashtamaEnds, descriptionTa, descriptionEn, windowsSummary }: {
  lang: Lang;
  chandrashtamaEnds: string | null | undefined;
  descriptionTa: string | null | undefined;
  descriptionEn: string | null | undefined;
  windowsSummary: string;
}) {
  const isTa = lang === "ta";
  const endLabel = chandrashtamaEnds
    ? `${isTa ? "முடியும் நேரம்: " : "Ends: "}${new Date(chandrashtamaEnds).toLocaleString(isTa ? "ta-IN" : "en-IN")}`
    : (isTa ? "இன்று கூடுதல் கவனம் தேவை." : "Extra care advised today.");
  const description = isTa ? descriptionTa : descriptionEn;

  return (
    <div style={{
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--color-amber-border, #d97706)",
      background: "var(--color-amber-bg, #fffbeb)",
      overflow: "hidden",
    }}>
      {/* Header row */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--space-2)",
        padding: "var(--space-2_5) var(--space-4)",
        background: "var(--color-amber, #d97706)", color: "white",
      }}>
        <span style={{ fontWeight: 800, fontSize: "1rem" }}>!</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>
            {isTa ? "சந்திராஷ்டமம் நடப்பு" : "Chandrashtama is active"}
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>
            {windowsSummary ? `${isTa ? "ஜன்ம நட்சத்திர நேரங்கள்" : "Janma star windows"}: ${windowsSummary}` : endLabel}
          </p>
        </div>
        <a
          href="/learn/what-is-chandrashtama"
          target="_blank"
          rel="noopener"
          style={{ fontSize: "0.75rem", color: "white", textDecoration: "underline", whiteSpace: "nowrap" }}
        >
          {isTa ? "அறிய →" : "Learn →"}
        </a>
      </div>

      {description && (
        <p style={{ margin: 0, padding: "var(--space-2_5) var(--space-4)", fontSize: "0.875rem", color: "var(--panel-earth-dark)", borderBottom: "1px solid var(--color-amber-border, #fde68a)" }}>
          {description}
        </p>
      )}

      {/* Do / Don't */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        <div style={{ padding: "var(--space-2_5) var(--space-4)", borderRight: "1px solid var(--color-amber-border, #fde68a)" }}>
          <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--planet-saturn, #b45309)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {isTa ? "தவிர்க்கவும்" : "Avoid"}
          </p>
          {(isTa ? CHANDRASHTAMA_AVOID.ta : CHANDRASHTAMA_AVOID.en).map((item) => (
            <p key={item} style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--panel-earth)", lineHeight: 1.4 }}>
              <span style={{ color: "var(--planet-saturn, #b45309)", marginRight: "4px" }}>✕</span>{item}
            </p>
          ))}
        </div>
        <div style={{ padding: "var(--space-2_5) var(--space-4)" }}>
          <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--chart-d9-active-dark, #047857)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {isTa ? "செய்யலாம்" : "Do"}
          </p>
          {(isTa ? CHANDRASHTAMA_CAN_DO.ta : CHANDRASHTAMA_CAN_DO.en).map((item) => (
            <p key={item} style={{ margin: "0 0 4px", fontSize: "0.75rem", color: "var(--panel-earth)", lineHeight: 1.4 }}>
              <span style={{ color: "var(--chart-d9-active-dark, #047857)", marginRight: "4px" }}>✓</span>{item}
            </p>
          ))}
        </div>
      </div>

      <p style={{ margin: 0, padding: "var(--space-2) var(--space-4)", fontSize: "0.6875rem", color: "var(--panel-mid-earth)", borderTop: "1px solid var(--color-amber-border, #fde68a)", fontStyle: "italic" }}>
        {isTa
          ? "சந்திராஷ்டமம் 'கெட்ட நாள்' அல்ல — இது கவனமாக செயல்பட வேண்டிய காலம். சரியாக திட்டமிட்டால் நன்மை பெறலாம்."
          : "Chandrashtama is not a 'bad day' — it's a time for awareness and care. With right planning, you can still thrive."}
      </p>
    </div>
  );
}

function TodayLifeAreaPulse({ areas, lang }: { areas: LifeAreaData[]; lang: Lang }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
      {areas.map((area) => {
        const score = Math.round(area.score);
        const color = score >= 65
          ? "var(--chart-d9-active-dark)"
          : score >= 45
          ? "var(--panel-brand)"
          : "var(--planet-saturn)";
        const bg = score >= 65
          ? "var(--chart-d9-active-dark)"
          : score >= 45
          ? "var(--panel-brand)"
          : "var(--planet-saturn)";
        const rawLabel = lang === "ta" ? area.label.ta : area.label.en;
        const label = rawLabel.length > 8 ? rawLabel.slice(0, 7) + "…" : rawLabel;
        return (
          <div
            key={area.area}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "52px" }}
          >
            <div style={{
              width: "44px", height: "44px", borderRadius: "999px",
              background: bg, display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 800, fontSize: "0.9rem",
              boxShadow: `0 2px 8px ${color}44`,
            }}>
              {score}
            </div>
            <span style={{
              fontSize: "0.625rem", color: "var(--panel-mid-earth)",
              textAlign: "center", maxWidth: "52px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
