"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { formatClockLabel, getScoreBand } from "@/lib/format";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ActivityTimingData,
  ChartCalculateResponseData,
  ChartSummaryData,
  ChartValidationStatus,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineResponseData,
  NotificationPreferenceData,
  PanchangamDailyResponseData,
  PrasnaResponse,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { formatChandrashtamaWindowSummary } from "./dashboard-calendar-tab";
import { GlossaryTerm } from "./glossary-term";
import { GUIDANCE_REASON_KEYS } from "./dashboard-personal-tab";
import {
  ACTIVITY_OPTIONS,
  alignmentTone,
  currentMonthIso,
  formatShortDate,
  formatWeekday,
} from "./dashboard-activity-timing-card";
import { CHANNEL_OPTS, TIME_PRESETS } from "./morning-guidance-card";
import { QUESTION_AREAS, outlookLabel } from "./dashboard-prasna-widget";
import { JathagamKattam } from "./dashboard-charts";
import { ShareCardButton } from "./dashboard-share-card";
import { DrawerPanel } from "./drawer-panel";
import { NovaSelect } from "./nova-select";
import { Chip, Metric, Surface } from "./dashboard-ui";

/**
 * Deep Dive completeness follow-up (see docs/DASHBOARD_UI_REVAMP_PLAN.md §7/§8) —
 * the 6 pieces Nova's Today tab hadn't yet folded in from Classic's
 * dashboard-personal-tab.tsx. Same data/logic as Classic throughout; only the
 * JSX/styling is fresh Nova-token markup (Classic's own inline styles here
 * read several Classic-only literal-hex custom properties — --panel-earth,
 * --panel-tan, --panel-cream, --panel-brand, etc. — that dashboard-nova.css's
 * gap-fix block deliberately does NOT redirect, since redirecting them broke
 * "selected pill" text app-wide during the 2026-07-06 browser QA round; see
 * that Progress Log entry). Everything below is grouped into Nova's Deep
 * Dive collapsed section, not the top-level page, keeping the at-a-glance
 * sections (hero/ribbon/decide/anticipation/glance) uncluttered.
 */

// ───────────────────────── 1. Chart validation confidence chip ─────────────────────────

export function NovaChartValidationChip({
  lang,
  validationStatus,
}: {
  lang: Lang;
  validationStatus: ChartValidationStatus | null | undefined;
}) {
  if (!validationStatus) return null;
  const { confidence, matchCount, totalChecked } = validationStatus;
  const color =
    confidence === "HIGH" ? "var(--color-high)" :
    confidence === "MEDIUM" ? "var(--color-mid)" :
    confidence === "LOW" ? "var(--color-low)" :
    "var(--color-faint)";
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
      padding: "4px 12px", borderRadius: "999px",
      background: `${color}18`, border: `1px solid ${color}44`,
      fontSize: "0.75rem", fontWeight: 600, color,
    }}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

// ───────────────────────── 2. Chart Context / Guidance / Gochar two-col ─────────────────────────

export function NovaChartContextGuidanceGochar({
  lang,
  activeChartId,
  selectedDate,
  personalChart,
  personalChartSummary,
  personalDailyGuidance,
  personalTransit,
  personalSani,
  panchangam,
  dailyGuidanceRange,
  astroText,
}: {
  lang: Lang;
  activeChartId: string;
  selectedDate: string;
  personalChart: ChartCalculateResponseData | null;
  personalChartSummary: ChartSummaryData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  panchangam: PanchangamDailyResponseData | null;
  dailyGuidanceRange?: DailyGuidanceRangeData | null;
  astroText: (value: string) => string;
}) {
  const bestWindow = personalDailyGuidance?.bestWindows[0] ?? null;
  const avoidWindow = personalDailyGuidance?.cautionWindows[0] ?? null;
  const personalScoreBand = personalDailyGuidance ? getScoreBand(personalDailyGuidance.score) : null;
  const chandrashtamaWindowsSummary = panchangam
    ? formatChandrashtamaWindowSummary(panchangam.chandrashtamamToday?.janmaNakshatraWindows ?? [], panchangam.dateLocal, lang)
    : "";

  return (
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
              <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                <ShareCardButton chartId={activeChartId} cardType="NAKSHATRA" lang={lang} label={lang === "ta" ? "நட்சத்திர அட்டை பகிர்" : "Share Birth Star Card"} />
                <ShareCardButton chartId={activeChartId} cardType="DAILY_VIBE" lang={lang} date={selectedDate} label={lang === "ta" ? "இன்றைய வைப் பகிர்" : "Share Today's Vibe"} />
              </div>
            )}
          </div>
        ) : (
          <p className="empty-state">{t("chart_no_profile", lang)}</p>
        )}
      </Surface>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Surface title={t("surface_guidance", lang)}>
          {personalDailyGuidance ? (
            <div className="surface__body">
              {personalDailyGuidance.tithiCard && (
                <div style={{ marginBottom: "10px", padding: "10px 12px", borderRadius: "8px", background: "var(--color-mid-bg)", border: "1px solid var(--color-mid-border)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-mid)", textTransform: "uppercase", letterSpacing: "0.06em" }}>🕉 {t("tithi_card_label", lang)}</p>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.tithiCard, lang)}</p>
                </div>
              )}
              {personalDailyGuidance.contextInsight && (
                <div style={{ marginBottom: "10px", padding: "10px 12px", borderRadius: "8px", background: "var(--color-accent-secondary-muted)", border: "1px solid rgba(167, 139, 201, 0.32)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-accent-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>📋 {t("context_insight_label", lang)}</p>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.5 }}>{tLang(personalDailyGuidance.contextInsight, lang)}</p>
                </div>
              )}
              <div className="surface__headline">
                <span>{`${personalDailyGuidance.score}/100 – ${getScoreBand(personalDailyGuidance.score).label}`}</span>
                <Chip tone={personalScoreBand?.tone === "high" ? "success" : personalScoreBand?.tone === "low" ? "warning" : "neutral"}>{personalDailyGuidance.label}</Chip>
              </div>
              <p className="surface__text">{tLang(personalDailyGuidance.text, lang)}</p>
              {personalDailyGuidance.pratyantarNarrative && (
                <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                  <p style={{ margin: "0 0 3px", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {lang === "ta" ? "பிரத்யந்தர தசை" : "Pratyantar signal"}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.45, color: "var(--color-text)" }}>
                    {tLang(personalDailyGuidance.pratyantarNarrative, lang)}
                  </p>
                </div>
              )}
              {personalDailyGuidance.nakshatraPerspective && (
                <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.5 }}>
                  {astroText(tLang(personalDailyGuidance.nakshatraPerspective, lang))}
                </p>
              )}
              <div className="surface__metrics">
                <Metric label={t("label_best_time", lang)} value={bestWindow ? formatClockLabel(bestWindow.start) : ""} hint={bestWindow ? formatClockLabel(bestWindow.end) : ""} tone="high" />
                <Metric label={t("label_caution_time", lang)} value={avoidWindow ? formatClockLabel(avoidWindow.start) : ""} hint={avoidWindow ? formatClockLabel(avoidWindow.end) : ""} tone="low" />
                <Metric label={t("label_moon_transit", lang)} value={`${personalDailyGuidance.scoreBreakdown.moonTransit}`} hint={`${t("dasha_word", lang)} ${personalDailyGuidance.scoreBreakdown.dashaSupport}`} />
              </div>
              {personalDailyGuidance.reasons && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--veil-white-07)" }}>
                  <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("why_this_prediction", lang)}</p>
                  {GUIDANCE_REASON_KEYS.map((key) => (
                    <div key={key} className="cd-responsive-detail-row" style={{ marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-muted)", minWidth: "84px", paddingTop: "2px" }}>{t(`reason_${key}` as Parameters<typeof t>[0], lang)}</span>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)", lineHeight: 1.4 }}>{tLang(personalDailyGuidance.reasons[key], lang)}</p>
                    </div>
                  ))}
                </div>
              )}
              {dailyGuidanceRange && dailyGuidanceRange.items.length > 0 && (
                <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--veil-white-07)" }}>
                  <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("label_next_3_days", lang)}</p>
                  <div className="chip-row">
                    {dailyGuidanceRange.items.map((item) => {
                      const band = getScoreBand(item.score);
                      return (
                        <Chip key={item.dateLocal} tone={band.tone === "high" ? "success" : band.tone === "low" ? "warning" : "neutral"}>
                          {item.dateLocal} {item.score}/100
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

        <Surface title={<GlossaryTerm term="gochar" lang={lang}>{t("surface_gochar", lang)}</GlossaryTerm>}>
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
            </div>
          ) : <p className="empty-state">{t("gochar_empty", lang)}</p>}
        </Surface>
      </div>
    </div>
  );
}

// ───────────────────────── 3. Dasa · Bhukti · Antaram strip ─────────────────────────

export function NovaDasaBhuktiAntaramStrip({
  lang,
  personalChartSummary,
  dashaMaha,
}: {
  lang: Lang;
  personalChartSummary: ChartSummaryData | null;
  dashaMaha?: DashaTimelineResponseData | null;
}) {
  if (!personalChartSummary) return null;
  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: "4px" }}>
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
  );
}

// ───────────────────────── 4. Activity Timing (single-activity month browser) ─────────────────────────

const novaFieldStyle = {
  borderRadius: "10px",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-strong)",
  fontSize: "0.875rem",
  padding: "8px 10px",
  fontFamily: "inherit",
} as const;

export function NovaActivityTimingCard({
  lang,
  chartId,
  selectedDate,
  onDateChange,
}: {
  lang: Lang;
  chartId: string;
  selectedDate: string;
  onDateChange?: (date: string) => void;
}) {
  const [activityType, setActivityType] = useState(ACTIVITY_OPTIONS[0].value);
  const [activityMonth, setActivityMonth] = useState(() => selectedDate.slice(0, 7) || currentMonthIso());
  const [result, setResult] = useState<ActivityTimingData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextMonth = selectedDate.slice(0, 7);
    if (nextMonth) setActivityMonth(nextMonth);
  }, [selectedDate]);

  useEffect(() => {
    if (!chartId || !activityMonth) {
      setResult(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setBusy(true);
    setError(null);
    void apiFetchJson<{ success: boolean; data: ActivityTimingData }>(
      `/api/v1/activity-timing${toQuery({ chartId, activity: activityType, month: activityMonth })}`,
    )
      .then((response) => { if (!cancelled) setResult(response.data ?? null); })
      .catch((fetchError) => { if (!cancelled) { setResult(null); setError(readErrorMessage(fetchError)); } })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [activityMonth, activityType, chartId]);

  return (
    <Surface title={t("activity_timing_label", lang)}>
      <div className="surface__body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <p className="surface__text" style={{ margin: 0 }}>
          {lang === "ta"
            ? "இந்த மாதத்தில் உங்கள் செயல் தொடக்கத்திற்கு ஏற்ற நாட்களை உடனே பார்க்கலாம். ஒரு தேதியைத் தேர்வு செய்தால் அந்த நாளைத் திறக்கும்."
            : "See the strongest dates for your chosen activity this month. Picking a date switches to that day."}
        </p>
        <div className="cd-responsive-row" style={{ gap: "10px", alignItems: "flex-end" }}>
          <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)" }}>{t("activity_label", lang)}</span>
            <NovaSelect
              value={activityType}
              onChange={setActivityType}
              ariaLabel={t("activity_label", lang)}
              containerStyle={{ minWidth: "240px" }}
              options={ACTIVITY_OPTIONS.map((option) => ({ value: option.value, label: lang === "ta" ? option.ta : option.en }))}
            />
          </div>
          <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)" }}>{t("activity_month_label", lang)}</span>
            <input style={{ ...novaFieldStyle, minWidth: "140px" }} type="month" value={activityMonth} onChange={(event) => setActivityMonth(event.target.value)} />
          </div>
          <div style={{ minWidth: "140px" }}>
            <Chip tone={busy ? "accent" : "neutral"}>
              {busy ? t("btn_finding", lang) : `${result?.topDates.length ?? 0} ${lang === "ta" ? "நாட்கள்" : "dates"}`}
            </Chip>
          </div>
        </div>

        {error && <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-low)" }}>{error}</p>}

        {!busy && result && result.topDates.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {result.topDates.slice(0, 3).map((item, index) => {
              const isSelected = selectedDate === item.dateLocal;
              const weekday = formatWeekday(item.dateLocal, lang);
              const content = (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)" }}>{index + 1}.</span>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{formatShortDate(item.dateLocal, lang)}</span>
                    {weekday && <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>{weekday}</span>}
                    <Chip tone={alignmentTone(item.alignment)}>{item.alignment}</Chip>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-high)" }}>{item.score}/100</span>
                    {isSelected && <Chip tone="accent">{lang === "ta" ? "தற்போது பார்க்கப்படுகிறது" : "Viewing"}</Chip>}
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "var(--color-text)", lineHeight: 1.5 }}>
                    {lang === "ta" ? item.reasonTa : item.reasonEn}
                  </p>
                </>
              );
              const rowStyle = {
                padding: "12px",
                borderRadius: "10px",
                border: `1px solid ${isSelected ? "var(--color-high-border)" : "var(--color-border)"}`,
                background: isSelected ? "var(--color-high-bg)" : "var(--color-surface)",
              } as const;
              if (!onDateChange) {
                return <div key={item.dateLocal} style={rowStyle}>{content}</div>;
              }
              return (
                <button key={item.dateLocal} type="button" onClick={() => onDateChange(item.dateLocal)} style={{ ...rowStyle, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                  {content}
                </button>
              );
            })}
          </div>
        )}

        {!busy && !error && result && result.topDates.length === 0 && (
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-faint)" }}>
            {lang === "ta" ? "இந்த மாதத்திற்கு பொருத்தமான தேதிகள் கிடைக்கவில்லை." : "No matching dates were found for this month."}
          </p>
        )}
      </div>
    </Surface>
  );
}

// ───────────────────────── 5. Morning Guidance opt-in ─────────────────────────

function NovaPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: "999px", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
        border: `1.5px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
        background: active ? "var(--color-accent)" : "transparent",
        color: active ? "var(--color-on-accent)" : "var(--color-muted)",
        fontFamily: "inherit", transition: "all 0.12s ease",
      }}
    >
      {children}
    </button>
  );
}

function NovaToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex", width: "36px", height: "20px", borderRadius: "999px",
        border: `1.5px solid ${checked ? "var(--color-accent)" : "var(--color-border)"}`,
        background: checked ? "var(--color-accent)" : "var(--color-surface-soft)",
        position: "relative", flexShrink: 0, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <span style={{
        position: "absolute", top: "2px", left: checked ? "16px" : "2px", width: "14px", height: "14px",
        borderRadius: "50%", background: checked ? "var(--color-on-accent)" : "var(--color-faint)", transition: "left 0.15s",
      }} />
    </span>
  );
}

export function NovaMorningGuidanceCard({ lang }: { lang: Lang }) {
  const [prefs, setPrefs] = useState<NotificationPreferenceData | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("06:00");
  const [channel, setChannel] = useState<"none" | "email" | "push" | "both">("email");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications")
      .then((r) => {
        const p = r.data;
        setPrefs(p);
        setEnabled(p.morningAlertEnabled);
        setTime(p.morningAlertTime || "06:00");
        setChannel(p.notification_channel === "none" ? "email" : p.notification_channel);
      })
      .catch(() => {});
  }, []);

  function save(nextEnabled: boolean, nextTime: string, nextChannel: "none" | "email" | "push" | "both") {
    setSaving(true);
    setSaved(false);
    apiFetchJson<{ success: boolean; data: NotificationPreferenceData }>("/api/v1/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        morningAlertEnabled: nextEnabled,
        morningAlertTime: nextTime,
        notificationChannel: nextEnabled ? nextChannel : (prefs?.notification_channel ?? "none"),
      }),
    })
      .then((r) => {
        setPrefs(r.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  }

  function handleToggle(v: boolean) { setEnabled(v); save(v, time, channel); }
  function handleTime(v: string) { setTime(v); if (enabled) save(true, v, channel); }
  function handleChannel(v: "email" | "push" | "both") { setChannel(v); if (enabled) save(true, time, v); }

  if (prefs === null) return null;

  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px",
      padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Bell size={20} color="var(--color-accent-strong)" strokeWidth={1.5} aria-hidden="true" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-strong)" }}>
            {lang === "ta" ? "காலை வழிகாட்டல்" : "Morning Guidance"}
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.4, marginTop: "2px" }}>
            {lang === "ta" ? "ஒவ்வொரு நாளும் காலையில் உங்கள் ஜோதிட வழிகாட்டலை பெறுங்கள்" : "Receive your daily astrological guidance every morning"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {saving && <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>…</span>}
          {saved && !saving && (
            <span style={{ fontSize: "0.75rem", color: "var(--color-high)", fontWeight: 600 }}>
              {lang === "ta" ? "சேமிக்கப்பட்டது" : "Saved"}
            </span>
          )}
          <NovaToggle checked={enabled} onChange={handleToggle} />
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: enabled ? "var(--color-text)" : "var(--color-muted)" }}>
        {lang === "ta" ? "இன்றைய வழிகாட்டலை ஒவ்வொரு காலையும் அனுப்பவும்" : "Send me today's guidance every morning"}
      </p>

      {enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {lang === "ta" ? "நேரம்" : "Time"}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {TIME_PRESETS.map((p) => (
                <NovaPill key={p.value} active={time === p.value} onClick={() => handleTime(p.value)}>
                  {lang === "ta" ? p.labelTa : p.labelEn}
                </NovaPill>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {lang === "ta" ? "வழிமுறை" : "Delivery"}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {CHANNEL_OPTS.map((opt) => (
                <NovaPill key={opt.value} active={channel === opt.value} onClick={() => handleChannel(opt.value)}>
                  {lang === "ta" ? opt.labelTa : opt.labelEn}
                </NovaPill>
              ))}
            </div>
          </div>
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
            <p style={{ margin: "0 0 6px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text)" }}>
              {lang === "ta" ? "உள்ளடக்கம்" : "Each morning includes"}
            </p>
            <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "2px" }}>
              {(lang === "ta" ? [
                "சந்திராஷ்டம எச்சரிக்கை (பொருந்தும் போது)",
                "இன்றைய நல்ல நேரம்",
                "ராகு காலம்",
                "தசை / புக்தி சூழல்",
                "ஒரு வழிகாட்டல் கருத்து",
              ] : [
                "Chandrashtama warning (if applicable)",
                "Today's Nalla Neram",
                "Rahu Kalam",
                "Current Dasha / Bhukti context",
                "One action guidance",
              ]).map((item) => (
                <li key={item} style={{ fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.4 }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 6. Prasna (Horary) trigger + widget ─────────────────────────

function novaOutlookColor(outlook: PrasnaResponse["outlook"]) {
  if (outlook === "FAVOURABLE") return "var(--color-high)";
  if (outlook === "UNFAVOURABLE") return "var(--color-low)";
  if (outlook === "DELAY") return "var(--color-mid)";
  return "var(--color-faint)";
}

function NovaMetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "6px 12px", borderRadius: "10px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
      <p style={{ fontSize: "0.68rem", color: "var(--color-faint)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{value}</p>
    </div>
  );
}

export function NovaPrasnaTrigger({ lang, onOpenPrasna }: { lang: Lang; onOpenPrasna?: () => void }) {
  if (!onOpenPrasna) return null;
  return (
    <div className="cd-responsive-row" style={{ alignItems: "center", gap: "12px" }}>
      <button
        type="button"
        onClick={onOpenPrasna}
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", border: "1px solid var(--color-border-strong)", background: "none", color: "var(--color-accent-strong)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
      >
        {lang === "ta" ? "ப்ரஸ்ன கேள்வி கேளுங்கள்" : "Ask a Horary Question"}
      </button>
      <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>
        {lang === "ta" ? "பிறந்த நேரம் தெரியாவிட்டால் அல்லது உடனடி கேள்விக்கு" : "When birth time is unknown or for an immediate question"}
      </span>
    </div>
  );
}

export function NovaPrasnaWidget({
  lang, open, onClose, timezone, latitude, longitude,
}: {
  lang: Lang; open: boolean; onClose: () => void; timezone: string; latitude: number; longitude: number;
}) {
  const [selectedArea, setSelectedArea] = useState("GENERAL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrasnaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetchJson<{ success: boolean; data: PrasnaResponse }>("/api/v1/prasna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_area: selectedArea, timezone_name: timezone, latitude, longitude }),
      });
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(lang === "ta" ? "பதில் கிடைக்கவில்லை." : "No result returned.");
      }
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setResult(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <DrawerPanel title={t("prasna_title", lang)} onClose={handleClose}>
      <div style={{ padding: "16px 16px 32px", maxWidth: "480px" }}>
        <p style={{ fontSize: "0.83rem", color: "var(--color-muted)", marginBottom: "16px", lineHeight: 1.6 }}>
          {t("prasna_desc", lang)}
        </p>

        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
          {t("prasna_area_label", lang)}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {QUESTION_AREAS.map(({ key, labelKey }) => {
            const isActive = key === selectedArea;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedArea(key)}
                style={{
                  padding: "5px 14px", borderRadius: "999px",
                  border: `1.5px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: isActive ? "var(--color-accent-muted)" : "var(--color-surface-soft)",
                  color: isActive ? "var(--color-accent-strong)" : "var(--color-text)",
                  fontWeight: isActive ? 700 : 500, fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {t(labelKey, lang)}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void handleAsk()}
          disabled={loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 20px", borderRadius: "999px",
            border: "1px solid var(--color-accent)", background: "var(--color-accent)", color: "var(--color-on-accent)",
            fontSize: "0.875rem", fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "inherit",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? t("prasna_asking", lang) : t("prasna_ask", lang)}
        </button>

        {error && <p style={{ marginTop: "12px", fontSize: "0.82rem", color: "var(--color-low)" }}>{error}</p>}

        {result && (
          <div style={{ marginTop: "20px" }}>
            <div style={{
              padding: "12px 16px", borderRadius: "12px",
              background: `${novaOutlookColor(result.outlook)}18`,
              border: `1.5px solid ${novaOutlookColor(result.outlook)}44`,
              marginBottom: "16px",
            }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: novaOutlookColor(result.outlook), marginBottom: "2px" }}>
                {outlookLabel(result.outlook, lang)}
              </p>
              <p style={{ fontSize: "0.83rem", color: "var(--color-text)", lineHeight: 1.55 }}>
                {lang === "ta" ? result.outlookTa : result.outlookEn}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
              <NovaMetaChip label={t("prasna_lagna", lang)} value={result.prasnaLagnaName} />
              <NovaMetaChip label={t("prasna_moon", lang)} value={result.moonNakshatraName} />
              <NovaMetaChip label={t("prasna_karaka", lang)} value={`${result.karaka} (H${result.karakaHouse})`} />
            </div>

            {result.positiveIndicators.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-high)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  {t("prasna_positive", lang)}
                </p>
                {result.positiveIndicators.map((ind, i) => (
                  <p key={i} style={{ fontSize: "0.82rem", color: "var(--color-text)", marginBottom: "4px" }}>+ {ind}</p>
                ))}
              </div>
            )}

            {result.negativeIndicators.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-mid)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                  {t("prasna_negative", lang)}
                </p>
                {result.negativeIndicators.map((ind, i) => (
                  <p key={i} style={{ fontSize: "0.82rem", color: "var(--color-text)", marginBottom: "4px" }}>− {ind}</p>
                ))}
              </div>
            )}

            {(lang === "ta" ? result.cautionTa : result.cautionEn) && (
              <div style={{
                padding: "10px 12px", borderRadius: "6px", background: "var(--color-mid-bg)",
                border: "1px solid var(--color-mid-border)", fontSize: "0.8rem", color: "var(--color-mid)", lineHeight: 1.55,
              }}>
                ⚠ {lang === "ta" ? result.cautionTa : result.cautionEn}
              </div>
            )}
          </div>
        )}
      </div>
    </DrawerPanel>
  );
}
