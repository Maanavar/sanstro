"use client";

import { useState } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { formatClockLabel, formatDateLabel, getScoreBand } from "@/lib/format";

import { t, tLang, tTithi, tNakshatra, tWeekday, tPlanetLord } from "@/lib/i18n";

import type { Lang } from "@/lib/i18n";

import type {
  ActivityTimingData,
  AmbientAlertItem,
  ChartCalculateResponseData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaStoryData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  GoalData,
  JournalCorrelationData,
  NakshatraCardData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  PeyarchiEvent,
  PeyarchiReportData,
  SaniCycleData,
  TransitSnapshotData,
  WhatIfData,
} from "@/lib/types";


import { GRAHA_ABBR, NavamsaChart, RASI_NAMES, RasiChart } from "./dashboard-charts";
import { DASHA_COLORS, dashaStatus, DashaTimeline } from "./dashboard-dasha";
import { DashboardDailySnapshot } from "./dashboard-daily-snapshot";
import { PeyarchiBanner } from "./peyarchi-banner";
import { Button, Chip, Metric, Surface } from "./dashboard-ui";


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



  personalMemberChart: { displayName: string } | null;

  personalChart: ChartCalculateResponseData | null;

  personalChartSummary: ChartSummaryData | null;

  personalDailyGuidance: DailyGuidanceData | null;

  dailyGuidanceRange: DailyGuidanceRangeData | null;

  personalDasha: DashaTimelineResponseData | null;

  personalDashaMaha: DashaTimelineResponseData | null;

  personalDashaAntar: DashaTimelineItem[];

  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;


  goals: GoalData[];

  goalsBusy: boolean;

  addingGoalType: string;

  onAddingGoalTypeChange: (goalType: string) => void;

  removingGoalId: string;

  chartId: string;

  onAddGoal: (goalType: string) => void;

  onRemoveGoal: (goalId: string) => void;



  whatIfScenario: string;

  whatIfDate: string;

  whatIfResult: WhatIfData | null;

  whatIfBusy: boolean;

  whatIfError: string;

  onWhatIfScenarioChange: (scenario: string) => void;

  onWhatIfDateChange: (date: string) => void;

  onRunWhatIf: () => void;



  ambientAlerts: AmbientAlertItem[];

  formatScoreLabel: (score: number) => string;

  nakshatraCard: NakshatraCardData | null;
  peyarchiReport: PeyarchiReportData | null;
  dashaStory: DashaStoryData | null;
  journalCorrelations: JournalCorrelationData | null;
};



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

  personalMemberChart,

  personalChart,

  personalChartSummary,

  personalDailyGuidance,

  dailyGuidanceRange,

  personalDasha,

  personalDashaMaha,

  personalDashaAntar,

  personalTransit,
  personalSani,
  peyarchiUpcoming,
  panchangam,
  panchangamTimings,
  goals,

  goalsBusy,

  addingGoalType,

  onAddingGoalTypeChange,

  removingGoalId,

  chartId,

  onAddGoal,

  onRemoveGoal,

  whatIfScenario,

  whatIfDate,

  whatIfResult,

  whatIfBusy,

  whatIfError,

  onWhatIfScenarioChange,

  onWhatIfDateChange,

  onRunWhatIf,

  ambientAlerts,

  formatScoreLabel,

  nakshatraCard,
  peyarchiReport,
  dashaStory,
  journalCorrelations,

}: DashboardPersonalTabProps) {

  const personalScoreBand = personalDailyGuidance ? getScoreBand(personalDailyGuidance.score) : null;

  // FEATURE-08: Activity timing local state
  const [activityType, setActivityType] = useState("job_change");
  const [activityMonth, setActivityMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activityTimingResult, setActivityTimingResult] = useState<ActivityTimingData | null>(null);
  const [activityTimingBusy, setActivityTimingBusy] = useState(false);

  // FEATURE-09: Dasha story expand state
  const [dashaStoryExpanded, setDashaStoryExpanded] = useState(false);



  return (

    <div className="tab-section">

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>

              <div>

                <p className="section-kicker">{t("personal_kicker", lang)}</p>

                <h2 className="section-title">

                  {personalMemberChart ? personalMemberChart.displayName : birthDisplayName || t("personal_title_default", lang)}

                </h2>

                <p className="section-description">

                  {selectedDate === todayDate ? t("personal_today", lang) : formatDateLabel(selectedDate)} — {t("personal_desc", lang)}

                </p>

              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>

                {/* Member selector */}

                {memberCharts.length > 0 && (

                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>

                    <button type="button" onClick={() => onSelectPersonalView(null)}

                      style={{

                        padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: personalViewId === null ? 700 : 400,

                        background: personalViewId === null ? "rgba(229,184,77,0.25)" : "rgba(255,255,255,0.07)",

                        color: personalViewId === null ? "#e5b84d" : "rgba(255,255,255,0.55)",

                        outline: personalViewId === null ? "1px solid rgba(229,184,77,0.5)" : "1px solid transparent",

                      }}>

                      ◎ {birthDisplayName || t("personal_you", lang)}

                    </button>

                    {memberCharts.map((mc) => (

                      <button key={mc.memberId} type="button" onClick={() => onSelectPersonalView(mc.memberId)}

                        style={{

                          padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: personalViewId === mc.memberId ? 700 : 400,

                          background: personalViewId === mc.memberId ? "rgba(147,197,253,0.2)" : "rgba(255,255,255,0.06)",

                          color: personalViewId === mc.memberId ? "#93c5fd" : "rgba(255,255,255,0.5)",

                          outline: personalViewId === mc.memberId ? "1px solid rgba(147,197,253,0.4)" : "1px solid transparent",

                        }}>

                        {mc.displayName}

                      </button>

                    ))}

                  </div>

                )}

                {!personalViewId && birthProfileId && (

                  <Button onClick={() => onOpenEditProfile()} variant="secondary">{t("btn_edit", lang)}</Button>

                )}

                {!personalViewId && (

                  <Button onClick={() => onRefreshPersonal()} variant="ghost" disabled={!birthProfileId || busyPersonal}>

                    {busyPersonal ? t("btn_refreshing", lang) : t("btn_refresh", lang)}

                  </Button>

                )}

              </div>

            </div>

            <PeyarchiBanner events={peyarchiUpcoming} lang={lang} peyarchiReport={peyarchiReport} />

            {/* Chandrashtama banner — based on selected date transit */}
            {personalTransit?.isChandrashtama && (
              <div style={{

                padding: "12px 20px", borderRadius: "10px", marginBottom: "4px",

                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(248,113,113,0.35)",

                color: "#fca5a5", fontSize: "0.88rem", fontWeight: 500,

              }}>

                {t("chandrashtama_warning", lang)}

              </div>

            )}



            {/* Ambient Alerts (C08) */}

            {ambientAlerts.length > 0 && (

              <div style={{ marginBottom: "4px", padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>

                <p style={{ margin: "0 0 8px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>

                  🔔 {t("ambient_alerts_label", lang)}

                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                  {ambientAlerts.slice(0, 3).map((alert) => {

                    const isP = alert.source === "PEYARCHI";

                    const accentColor = isP ? "#fbbf24" : "#93c5fd";

                    const dayLabel = alert.daysFromToday === 0

                      ? t("alert_today", lang)

                      : alert.daysFromToday === 1

                      ? t("alert_tomorrow", lang)

                      : `${alert.daysFromToday} ${t("alert_days_away", lang)}`;

                    return (

                      <div key={alert.alertId} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>

                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: accentColor, flexShrink: 0, marginTop: "5px", boxShadow: `0 0 4px ${accentColor}` }} />

                        <div style={{ flex: 1 }}>

                          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "3px" }}>

                            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: accentColor }}>

                              {tLang(alert.title, lang)}

                            </span>

                            <span style={{ fontSize: "0.62rem", padding: "1px 6px", borderRadius: "999px", background: `${accentColor}18`, border: `1px solid ${accentColor}40`, color: accentColor }}>

                              {dayLabel}

                            </span>

                            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.28)" }}>

                              {alert.significanceScore}

                            </span>

                          </div>

                          <p style={{ margin: 0, fontSize: "0.74rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>

                            {tLang(alert.message, lang)}

                          </p>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </div>

            )}



            <DashboardDailySnapshot
              lang={lang}
              guidance={personalDailyGuidance}
              transit={personalTransit}
              sani={personalSani}
              panchangam={panchangam}
              birthProfile={personalChart?.birthProfile ?? null}
            />



            {/* Row 1: Chart context (left) | Daily guidance + Gochar stacked (right) */}

            <div className="two-col">

              <Surface title={t("surface_chart_context", lang)}>

                {personalChart ? (

                  <div className="surface__body">

                    <div className="surface__headline">

                      <span>{personalChartSummary?.displayName ?? personalChart.birthProfile.displayName}</span>

                      <Chip tone="accent">{personalChartSummary ? `${personalChartSummary.currentMahadasha} ${t("dasha_word", lang)}` : personalChart.calculationVersion}</Chip>

                    </div>

                    <p className="surface__text">

                      {personalChartSummary

                        ? `${personalChartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${personalChartSummary.moonRasi} ${t("label_janma_rasi", lang)} · ${personalChartSummary.janmaNakshatra} ${t("label_nakshatra", lang)} ${t("label_padam", lang)} ${personalChartSummary.janmaPada}`

                        : t("chart_loading", lang)}

                    </p>

                    <div className="surface__metrics">

                      <Metric label={t("label_birth_date", lang)} value={personalChart.birthProfile.birthDateLocal} hint={personalChart.birthProfile.birthPlace ?? personalChart.birthProfile.birthProfileId.slice(0, 8)} />

                      <Metric label={t("label_lagnam", lang)} value={personalChart.lagna.rasiName ?? `Raasi ${personalChart.lagna.rasi}`} hint={`${personalChart.lagna.degreeInRasi.toFixed(2)}° · ${personalChart.lagna.nakshatraName} ${t("label_padam", lang)} ${personalChart.lagna.pada}`} tone="high" />

                    </div>

                    <div style={{ marginTop: "16px", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>

                      <RasiChart chart={personalChart} label={t("label_d1", lang)} lang={lang} />

                      <NavamsaChart chart={personalChart} label={t("label_d9", lang)} lang={lang} />

                    </div>

                  </div>

                ) : (

                  <p className="empty-state">{t("chart_no_profile", lang)}</p>

                )}

              </Surface>



              {/* Right column: Daily guidance + Gochar & Panchangam stacked */}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                <Surface title={t("surface_guidance", lang)}>

                  {personalDailyGuidance ? (

                    <div className="surface__body">

                      {/* FEATURE-05: Tithi special content card */}

                      {personalDailyGuidance.tithiCard && (

                        <div style={{ marginBottom: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(251,191,36,0.22)" }}>

                          <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em" }}>

                            🕉 {t("tithi_card_label", lang)}

                          </p>

                          <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>

                            {tLang(personalDailyGuidance.tithiCard, lang)}

                          </p>

                        </div>

                      )}

                      {/* Context Insight */}

                      {personalDailyGuidance.contextInsight && (

                        <div style={{ marginBottom: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(167,139,250,0.25)" }}>

                          <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.06em" }}>

                            📋 {t("context_insight_label", lang)}

                          </p>

                          <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>

                            {tLang(personalDailyGuidance.contextInsight, lang)}

                          </p>

                        </div>

                      )}

                      {/* Journal Insight */}

                      {personalDailyGuidance.journalInsight && (

                        <div style={{ marginBottom: "10px", padding: "10px 12px", borderRadius: "8px", background: "rgba(20,184,166,0.07)", border: "1px solid rgba(45,212,191,0.22)" }}>

                          <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#2dd4bf", textTransform: "uppercase", letterSpacing: "0.06em" }}>

                            📔 {t("journal_insight_label", lang)}

                          </p>

                          <p style={{ margin: "0 0 6px", fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>

                            {tLang(personalDailyGuidance.journalInsight.text, lang)}

                          </p>

                          {personalDailyGuidance.journalInsight.signals.length > 0 && (

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>

                              {personalDailyGuidance.journalInsight.signals.slice(0, 3).map((sig) => (

                                <span key={sig.lifeArea} style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: "999px", background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.25)", color: "#2dd4bf" }}>

                                  {sig.lifeArea} {"●".repeat(Math.min(sig.count, 3))}

                                </span>

                              ))}

                            </div>

                          )}

                        </div>

                      )}

                      <div className="surface__headline">

                        <span>{formatScoreLabel(personalDailyGuidance.score)}</span>

                        <Chip tone={personalScoreBand?.tone === "high" ? "success" : personalScoreBand?.tone === "low" ? "warning" : "neutral"}>

                          {personalDailyGuidance.label}

                        </Chip>

                      </div>

                      <p className="surface__text">{tLang(personalDailyGuidance.text, lang)}</p>

                      <div className="surface__metrics">

                        <Metric label={t("label_best_time", lang)} value={personalDailyGuidance.bestWindows[0] ? formatClockLabel(personalDailyGuidance.bestWindows[0].start) : "—"} hint={personalDailyGuidance.bestWindows[0] ? formatClockLabel(personalDailyGuidance.bestWindows[0].end) : "—"} tone="high" />

                        <Metric label={t("label_caution_time", lang)} value={personalDailyGuidance.cautionWindows[0] ? formatClockLabel(personalDailyGuidance.cautionWindows[0].start) : "—"} hint={personalDailyGuidance.cautionWindows[0] ? formatClockLabel(personalDailyGuidance.cautionWindows[0].end) : "—"} tone="low" />

                        <Metric label={t("label_moon_transit", lang)} value={`${personalDailyGuidance.scoreBreakdown.moonTransit}`} hint={`${t("dasha_word", lang)} ${personalDailyGuidance.scoreBreakdown.dashaSupport}`} />

                      </div>

                      {tLang(personalDailyGuidance.actionSuggestion, lang) && (

                        <p style={{ marginTop: "8px", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>

                          {tLang(personalDailyGuidance.actionSuggestion, lang)}

                        </p>

                      )}

                      {/* Emotional Weather + Nakshatra Lens */}

                      {personalDailyGuidance.emotionalWeather && (

                        <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>

                          <p style={{ margin: "0 0 6px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>

                            {t("emotional_weather_label", lang)}

                          </p>

                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "6px" }}>

                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>

                              <span style={{ color: "rgba(255,255,255,0.3)" }}>{t("emotional_tone_label", lang)}: </span>

                              {personalDailyGuidance.emotionalWeather.tone}

                            </span>

                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>

                              <span style={{ color: "rgba(255,255,255,0.3)" }}>{t("physical_tendency_label", lang)}: </span>

                              {personalDailyGuidance.emotionalWeather.physicalTendency}

                            </span>

                            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>

                              <span style={{ color: "rgba(255,255,255,0.3)" }}>{t("best_use_label", lang)}: </span>

                              {personalDailyGuidance.emotionalWeather.bestUseOfDay}

                            </span>

                          </div>

                          <p style={{ margin: "0 0 3px", fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>

                            {tLang(personalDailyGuidance.emotionalWeather.toneText, lang)}

                          </p>

                          <p style={{ margin: "0 0 3px", fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>

                            {tLang(personalDailyGuidance.emotionalWeather.physicalTendencyText, lang)}

                          </p>

                          <p style={{ margin: "0 0 3px", fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>

                            {tLang(personalDailyGuidance.emotionalWeather.bestUseOfDayText, lang)}

                          </p>

                          {personalDailyGuidance.emotionalWeather.avoidBefore && (

                            <p style={{ margin: "3px 0 0", fontSize: "0.74rem", color: "#fbbf24", lineHeight: 1.45 }}>

                              ⚠ {t("avoid_before_label", lang)}: {tLang(personalDailyGuidance.emotionalWeather.avoidBefore, lang)}

                            </p>

                          )}

                          {personalDailyGuidance.nakshatraPerspective && (

                            <p style={{ margin: "8px 0 0", fontSize: "0.74rem", color: "rgba(255,255,255,0.45)", fontStyle: "italic", lineHeight: 1.45, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>

                              <span style={{ color: "rgba(255,255,255,0.28)", fontStyle: "normal", fontWeight: 600 }}>{t("nakshatra_lens_label", lang)}: </span>

                              {tLang(personalDailyGuidance.nakshatraPerspective, lang)}

                            </p>

                          )}

                        </div>

                      )}

                      {personalDailyGuidance.reasons && (

                        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

                          <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("why_this_prediction", lang)}</p>

                          {(["moonTransit", "dashaSupport", "panchangam", "gochar", "personalCaution"] as const).map((key) => (

                            <div key={key} style={{ display: "flex", gap: "8px", marginBottom: "5px", alignItems: "flex-start" }}>

                              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.28)", minWidth: "84px", paddingTop: "2px" }}>

                                {t(`reason_${key}` as any, lang)}

                              </span>

                              <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>

                                {tLang(personalDailyGuidance.reasons[key], lang)}

                              </p>

                            </div>

                          ))}

                        </div>

                      )}

                      {personalDailyGuidance.remedy && (

                        <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "7px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>

                          <p className="surface__subhead" style={{ color: "#fbbf24", marginBottom: "3px" }}>{t("remedy_label", lang)}</p>

                          <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>{tLang(personalDailyGuidance.remedy, lang)}</p>

                        </div>

                      )}

                      {!personalViewId && dailyGuidanceRange && (

                        <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

                          <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("label_next_3_days", lang)}</p>

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

                        <Metric label={t("label_chandrashtamam", lang)} value={personalTransit.isChandrashtama ? t("label_active", lang) : t("label_none", lang)}

                          hint={personalSani.confirmationSentence} tone={personalTransit.isChandrashtama ? "low" : "rest"} />

                        {personalSani.moonBasedCycle.isActive && (

                          <Metric label={t("label_sani_cycle", lang)} value={personalSani.moonBasedCycle.type ?? "—"} hint={personalSani.moonBasedCycle.supportiveLabel ?? ""} tone="low" />

                        )}

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

                        <div className="chip-row">

                          <Chip tone="accent">{t("label_rahu_kalam", lang)} {formatClockLabel(panchangam.kalam.rahuKalam.start)}–{formatClockLabel(panchangam.kalam.rahuKalam.end)}</Chip>

                          <Chip tone="warning">{t("label_yamagandam", lang)} {formatClockLabel(panchangam.kalam.yamagandam.start)}–{formatClockLabel(panchangam.kalam.yamagandam.end)}</Chip>

                          <Chip>{t("label_kuligai", lang)} {formatClockLabel(panchangam.kalam.kuligai.start)}–{formatClockLabel(panchangam.kalam.kuligai.end)}</Chip>

                          {panchangam.kalam.nallaNeram && (
                            <Chip tone="success">{t("label_nalla_neram", lang)} {formatClockLabel(panchangam.kalam.nallaNeram.start)}–{formatClockLabel(panchangam.kalam.nallaNeram.end)}</Chip>
                          )}

                          {panchangamTimings && !panchangam.abhijit.isRestrictedByWeekday && (

                            <Chip tone="success">{t("label_abhijit", lang)} {formatClockLabel(panchangam.abhijit.start)}–{formatClockLabel(panchangam.abhijit.end)}</Chip>

                          )}

                        </div>

                      </div>

                    </div>

                  ) : (

                    <p className="empty-state">{t("gochar_empty", lang)}</p>

                  )}

                </Surface>

              </div>

            </div>



            {/* Row 2: Full-width Graha table with extra columns */}

            <Surface title={t("surface_planets", lang)}>

              {personalChart ? (

                <div className="table-wrap">

                  <table className="table">

                    <thead>

                      <tr>

                        <th>{t("col_graha", lang)}</th><th>{t("col_rasi", lang)}</th><th>{t("col_degree", lang)}</th><th>{t("col_nakshatra", lang)}</th>

                        <th>{t("col_pada", lang)}</th><th>{t("col_house", lang)}</th><th>{t("col_d9_rasi", lang)}</th><th>{t("col_special", lang)}</th>

                      </tr>

                    </thead>

                    <tbody>

                      {personalChart.planets.map((planet) => (

                        <tr key={planet.graha}>

                          <td style={{ fontWeight: 600 }}>

                            <span style={{ color: DASHA_COLORS[planet.graha] ?? "#93c5fd", marginRight: "4px" }}>

                              {GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2)}

                            </span>

                            {planet.graha}

                          </td>

                          <td>{planet.rasiName}</td>

                          <td>{planet.degreeInRasi.toFixed(2)}°</td>

                          <td>{planet.nakshatraName}</td>

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

                        <td style={{ fontWeight: 600 }}><span style={{ color: "#e5b84d", marginRight: "4px" }}>ல</span> {t("label_lagnam", lang)}</td>

                        <td>{personalChart.lagna.rasiName}</td>

                        <td>{personalChart.lagna.degreeInRasi.toFixed(2)}°</td>

                        <td>{personalChart.lagna.nakshatraName}</td>

                        <td style={{ textAlign: "center" }}>{personalChart.lagna.pada}</td>

                        <td style={{ textAlign: "center" }}>1</td>

                        <td>—</td><td />

                      </tr>

                    </tbody>

                  </table>

                </div>

              ) : (

                <p className="empty-state">{t("planets_empty", lang)}</p>

              )}

            </Surface>



            {/* FEATURE-10: Nakshatra Personality Card */}

            {nakshatraCard && (

              <Surface title={t("nakshatra_card_label", lang)}>

                <div className="surface__body">

                  <div className="surface__headline">

                    <span>{lang === "ta" ? nakshatraCard.nameTa : nakshatraCard.nameEn}</span>

                    <Chip tone="accent">{t("nakshatra_ruling_planet", lang)}: {tPlanetLord(nakshatraCard.rulingPlanet, lang)}</Chip>

                  </div>

                  <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>

                    <span style={{ marginRight: "12px" }}>{t("nakshatra_deity", lang)}: <strong style={{ color: "rgba(255,255,255,0.65)" }}>{lang === "ta" ? nakshatraCard.deityTa : nakshatraCard.deityEn}</strong></span>

                    <span>{t("nakshatra_symbol", lang)}: <strong style={{ color: "rgba(255,255,255,0.65)" }}>{lang === "ta" ? nakshatraCard.symbolTa : nakshatraCard.symbolEn}</strong></span>

                  </p>

                  <p className="surface__text">{lang === "ta" ? nakshatraCard.profile.ta : nakshatraCard.profile.en}</p>

                  {nakshatraCard.strengths.length > 0 && (

                    <div style={{ marginBottom: "8px" }}>

                      <p style={{ margin: "0 0 5px", fontSize: "0.68rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("nakshatra_strengths", lang)}</p>

                      <div className="chip-row">

                        {nakshatraCard.strengths.map((s, i) => (

                          <Chip key={i} tone="success">{lang === "ta" ? s.ta : s.en}</Chip>

                        ))}

                      </div>

                    </div>

                  )}

                  {nakshatraCard.cautions.length > 0 && (

                    <div>

                      <p style={{ margin: "0 0 5px", fontSize: "0.68rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("nakshatra_cautions", lang)}</p>

                      <div className="chip-row">

                        {nakshatraCard.cautions.map((c, i) => (

                          <Chip key={i} tone="warning">{lang === "ta" ? c.ta : c.en}</Chip>

                        ))}

                      </div>

                    </div>

                  )}

                </div>

              </Surface>

            )}



            {/* Row 3: Dasha — full timeline (current period highlighted inline) */}

            {personalDasha ? (

              <Surface title={t("surface_dasha", lang)}>

                <div className="surface__body">

                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.05em" }}>
                      {t("dasha_timeline_label", lang)}
                    </p>
                    <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
                      {t("balance_at_birth", lang)}: {personalDasha.openingDasha.balanceYearsAtBirth.toFixed(1)}y
                    </span>
                  </div>

                  <DashaTimeline

                    dasha={personalDashaMaha ?? personalDasha}

                    dashaAntar={personalDashaAntar}

                    today={selectedDate}

                    dashaSupport={personalDailyGuidance ? Math.min(100, Math.round(personalDailyGuidance.scoreBreakdown.dashaSupport / 0.20)) : 50}

                    lang={lang}

                    birthDateLocal={personalChart?.birthProfile.birthDateLocal}

                    currentPeriodAction={personalDailyGuidance ? tLang(personalDailyGuidance.actionSuggestion, lang) : undefined}

                    currentPeriodCaution={personalDailyGuidance ? tLang(personalDailyGuidance.cautionSuggestion, lang) : undefined}

                  />

                  {/* FEATURE-09: Dasha Story Timeline */}

                  {dashaStory && (

                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>

                      <button type="button" onClick={() => setDashaStoryExpanded((v) => !v)}

                        style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600 }}>

                        <span style={{ transition: "transform 0.2s", display: "inline-block", transform: dashaStoryExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>

                        {dashaStoryExpanded ? t("btn_collapse_dasha_story", lang) : t("btn_expand_dasha_story", lang)}

                      </button>

                      {dashaStoryExpanded && (

                        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>

                          {dashaStory.periods.map((period) => {

                            const pc = DASHA_COLORS[period.lord] ?? "#94a3b8";

                            return (

                              <div key={`${period.lord}-${period.startDate}`} style={{

                                padding: "8px 12px", borderRadius: "8px",

                                background: period.isCurrent ? `${pc}12` : "rgba(255,255,255,0.02)",

                                border: `1px solid ${period.isCurrent ? pc + "44" : "rgba(255,255,255,0.06)"}`,

                              }}>

                                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "3px" }}>

                                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: period.isCurrent ? pc : "rgba(255,255,255,0.55)", minWidth: "80px" }}>

                                    {tPlanetLord(period.lord, lang)}

                                  </span>

                                  <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>

                                    {period.startDate.slice(0, 4)}–{period.endDate.slice(0, 4)} · {t("dasha_story_age", lang)} {period.ageStart}–{period.ageEnd}

                                  </span>

                                  {period.isCurrent && <Chip tone="success">{t("status_active", lang)}</Chip>}

                                </div>

                                <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.45, fontStyle: "italic" }}>

                                  {lang === "ta" ? period.themeTa : period.themeEn}

                                </p>

                              </div>

                            );

                          })}

                        </div>

                      )}

                    </div>

                  )}

                </div>

              </Surface>

            ) : null}



            {/* ”¬”¬ Goals Panel ”¬”¬ */}

            {chartId && personalViewId === null && (

              <Surface title={t("goals_panel_title", lang)}>

                <p style={{ margin: "0 0 12px", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>

                  {t("goals_panel_desc", lang)}

                </p>



                {/* Active goals chips */}

                {goals.length > 0 && (

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>

                    {goals.map((g) => (

                      <div key={g.goalId} style={{

                        display: "flex", alignItems: "center", gap: "6px",

                        padding: "5px 10px", borderRadius: "20px",

                        background: "rgba(229,184,77,0.15)", border: "1px solid rgba(229,184,77,0.35)",

                        fontSize: "0.78rem", color: "#e5b84d", fontWeight: 600,

                      }}>

                        <span>{t(`goal_${g.goalType.replace("_", "")}` as Parameters<typeof t>[0], lang) || g.goalType}</span>

                        <button type="button" onClick={() => onRemoveGoal(g.goalId)} disabled={removingGoalId === g.goalId}

                          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: "0 0 0 2px", fontSize: "0.75rem", lineHeight: 1 }}>

                          {removingGoalId === g.goalId ? "…" : "×"}

                        </button>

                      </div>

                    ))}

                  </div>

                )}

                {goals.length === 0 && (

                  <p style={{ margin: "0 0 12px", fontSize: "0.76rem", color: "rgba(255,255,255,0.3)" }}>{t("goals_empty", lang)}</p>

                )}



                {/* Add goal row */}

                {goals.length < 3 && (

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>

                    <select className="input" style={{ flex: "1 1 180px", maxWidth: "260px" }}

                      value={addingGoalType || "job_change"}

                      onChange={(e) => onAddingGoalTypeChange(e.target.value)}>

                      {[

                        ["job_change", t("goal_job_change", lang)],

                        ["business_start", t("goal_business", lang)],

                        ["marriage", t("goal_marriage", lang)],

                        ["education", t("goal_education", lang)],

                        ["property", t("goal_property", lang)],

                        ["health", t("goal_health", lang)],

                        ["travel_abroad", t("goal_travel", lang)],

                        ["spiritual", t("goal_spiritual", lang)],

                        ["family_harmony", t("goal_family", lang)],

                        ["money", t("goal_money", lang)],

                        ["child_birth", t("goal_child", lang)],

                        ["other", t("goal_other", lang)],

                      ].map(([val, label]) => (

                        <option key={val} value={val}>{label}</option>

                      ))}

                    </select>

                    <Button onClick={() => onAddGoal(addingGoalType || "job_change")} disabled={goalsBusy} variant="primary">

                      {goalsBusy ? t("goals_adding", lang) : t("goals_add", lang)}

                    </Button>

                  </div>

                )}

              </Surface>

            )}



            {/* ”¬”¬ What-If Simulator ”¬”¬ */}

            {chartId && personalViewId === null && (

              <Surface title={t("whatif_panel_title", lang)}>

                <p style={{ margin: "0 0 14px", fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>

                  {t("whatif_panel_desc", lang)}

                </p>



                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "14px" }}>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{t("whatif_scenario", lang)}</span>

                    <select className="input" style={{ minWidth: "180px" }}

                      value={whatIfScenario} onChange={(e) => onWhatIfScenarioChange(e.target.value)}>

                      {[

                        ["job_change", t("goal_job_change", lang)],

                        ["business_start", t("goal_business", lang)],

                        ["marriage", t("goal_marriage", lang)],

                        ["education", t("goal_education", lang)],

                        ["property", t("goal_property", lang)],

                        ["health", t("goal_health", lang)],

                        ["travel_abroad", t("goal_travel", lang)],

                        ["spiritual", t("goal_spiritual", lang)],

                        ["family_harmony", t("goal_family", lang)],

                        ["money", t("goal_money", lang)],

                        ["child_birth", t("goal_child", lang)],

                        ["other", t("goal_other", lang)],

                      ].map(([val, label]) => (

                        <option key={val} value={val}>{label}</option>

                      ))}

                    </select>

                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{t("whatif_date", lang)}</span>

                    <input className="input" type="date" value={whatIfDate}

                      onChange={(e) => onWhatIfDateChange(e.target.value)} />

                  </div>

                  <Button onClick={onRunWhatIf} disabled={whatIfBusy || !whatIfDate} variant="primary">

                    {whatIfBusy ? t("whatif_running", lang) : t("whatif_run", lang)}

                  </Button>

                </div>



                {whatIfError && (

                  <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#f87171" }}>{whatIfError}</p>

                )}



                {whatIfResult && (() => {

                  const r = whatIfResult;

                  const verdictColor = r.verdict === "FAVOURABLE" ? "#4ade80" : r.verdict === "CAUTION" ? "#f87171" : "#fbbf24";

                  const verdictKey = r.verdict === "FAVOURABLE" ? "verdict_favourable" : r.verdict === "CAUTION" ? "verdict_caution" : "verdict_neutral";

                  const strengthColor = (s: string) => s === "STRONG" ? "#4ade80" : s === "WEAK" ? "#f87171" : "#fbbf24";

                  const strengthKey = (s: string) => s === "STRONG" ? "strength_strong" : s === "WEAK" ? "strength_weak" : "strength_moderate";

                  return (

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                      {/* Overall score + verdict */}

                      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>

                        <div style={{ textAlign: "center" }}>

                          <p style={{ margin: "0 0 2px", fontSize: "2.2rem", fontWeight: 900, color: verdictColor, lineHeight: 1 }}>{r.overallScore}</p>

                          <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>/100</p>

                        </div>

                        <div style={{ padding: "6px 14px", borderRadius: "8px", background: `${verdictColor}18`, border: `1px solid ${verdictColor}55` }}>

                          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800, color: verdictColor }}>{t(verdictKey as Parameters<typeof t>[0], lang)}</p>

                        </div>

                      </div>



                      {/* Summary */}

                      <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>

                        {lang === "ta" ? r.summary.ta : r.summary.en}

                      </p>



                      {/* Triple confirmation table */}

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                        <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>

                          {t("whatif_result_title", lang)}

                        </p>

                        {([

                          [t("whatif_natal", lang), r.tripleConfirmation.natalPromise, r.tripleConfirmation.natalPromiseStrength],

                          [t("whatif_dasha", lang), r.tripleConfirmation.dashaSupport, r.tripleConfirmation.dashaSupportStrength],

                          [t("whatif_gochar", lang), r.tripleConfirmation.gocharSupport, r.tripleConfirmation.gocharSupportStrength],

                        ] as [string, string, string][]).map(([label, text, strength]) => (

                          <div key={label} style={{

                            padding: "10px 12px", borderRadius: "8px",

                            background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.08)",

                          }}>

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>

                              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{label}</span>

                              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: strengthColor(strength) }}>

                                {t(strengthKey(strength) as Parameters<typeof t>[0], lang)}

                              </span>

                            </div>

                            <p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{text}</p>

                          </div>

                        ))}

                      </div>



                      {/* Best period */}

                      <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>

                        <p style={{ margin: "0 0 3px", fontSize: "0.68rem", fontWeight: 700, color: "#4ade80" }}>{t("whatif_best_period", lang)}</p>

                        <p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>

                          {lang === "ta" ? r.bestPeriodInWindow.ta : r.bestPeriodInWindow.en}

                        </p>

                      </div>



                      {/* Caution note */}

                      <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>

                        <p style={{ margin: "0 0 3px", fontSize: "0.68rem", fontWeight: 700, color: "#fbbf24" }}>{t("whatif_caution", lang)}</p>

                        <p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>

                          {lang === "ta" ? r.cautionNote.ta : r.cautionNote.en}

                        </p>

                      </div>



                      {/* Remedy */}

                      <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)" }}>

                        <p style={{ margin: "0 0 3px", fontSize: "0.68rem", fontWeight: 700, color: "#fbbf24" }}>{t("whatif_remedy", lang)}</p>

                        <p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>

                          {lang === "ta" ? r.remedy.ta : r.remedy.en}

                        </p>

                      </div>



                      {/* Disclaimer */}

                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5, fontStyle: "italic" }}>

                        {t("whatif_disclaimer", lang)}: {lang === "ta" ? r.disclaimer.ta : r.disclaimer.en}

                      </p>

                    </div>

                  );

                })()}

              </Surface>

            )}



            {/* FEATURE-08: Activity Timing Tool */}

            {chartId && personalViewId === null && (

              <Surface title={t("activity_timing_label", lang)}>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "14px" }}>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{t("activity_label", lang)}</span>

                    <select className="input" style={{ minWidth: "180px" }} value={activityType} onChange={(e) => setActivityType(e.target.value)}>

                      {[

                        ["job_change", t("activity_job_change", lang)],

                        ["business_start", t("activity_business_start", lang)],

                        ["marriage", t("activity_marriage", lang)],

                        ["education", t("activity_education", lang)],

                        ["property", t("activity_property", lang)],

                        ["health", t("activity_health", lang)],

                        ["travel", t("activity_travel", lang)],

                        ["spiritual", t("activity_spiritual", lang)],

                        ["family", t("activity_family", lang)],

                        ["money", t("activity_money", lang)],

                        ["child", t("activity_child", lang)],

                        ["other", t("activity_other", lang)],

                      ].map(([val, label]) => (

                        <option key={val} value={val}>{label}</option>

                      ))}

                    </select>

                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>

                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{t("activity_month_label", lang)}</span>

                    <input className="input" type="month" value={activityMonth} onChange={(e) => setActivityMonth(e.target.value)} style={{ minWidth: "140px" }} />

                  </div>

                  <button type="button" disabled={activityTimingBusy}

                    onClick={() => {

                      setActivityTimingBusy(true);

                      apiFetchJson<{ success: boolean; data: ActivityTimingData }>(

                        `/api/v1/activity-timing${toQuery({ chartId, activity: activityType, month: activityMonth })}`

                      ).then((r) => setActivityTimingResult(r.data)).catch(() => {}).finally(() => setActivityTimingBusy(false));

                    }}

                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.8rem", background: "rgba(229,184,77,0.85)", color: "#0a0800" }}>

                    {activityTimingBusy ? t("btn_finding", lang) : t("btn_find_best_dates", lang)}

                  </button>

                </div>

                {activityTimingResult && (

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                    {activityTimingResult.topDates.map((item, i) => (

                      <div key={item.dateLocal} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "10px", alignItems: "flex-start" }}>

                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", minWidth: "16px" }}>{i + 1}.</span>

                        <div>

                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "3px" }}>

                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>{item.dateLocal}</span>

                            <Chip tone={item.score >= 70 ? "success" : item.score >= 50 ? "neutral" : "warning"}>{item.score}/100</Chip>

                            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{item.alignment}</span>

                          </div>

                          <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4, fontStyle: "italic" }}>

                            {lang === "ta" ? item.reasonTa : item.reasonEn}

                          </p>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </Surface>

            )}



            {/* FEATURE-12: Journal Correlations */}

            {journalCorrelations && (

              <Surface title={t("journal_patterns_label", lang)}>

                {!journalCorrelations.hasSufficientData ? (

                  <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(45,212,191,0.05)", border: "1px solid rgba(45,212,191,0.15)" }}>

                    <p style={{ margin: "0 0 5px", fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>

                      {journalCorrelations.entryCount} / {journalCorrelations.minimumEntriesRequired} {t("journal_entries_progress", lang)}

                    </p>

                    <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>

                      {t("journal_keep_going", lang)}

                    </p>

                  </div>

                ) : (

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                    {journalCorrelations.correlations.map((corr, i) => (

                      <div key={i} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>

                        <p style={{ margin: "0 0 3px", fontSize: "0.76rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>

                          {lang === "ta" ? corr.descriptionTa : corr.descriptionEn}

                        </p>

                        <p style={{ margin: 0, fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>

                          {t("journal_mood_avg", lang)}: {corr.avgMood.toFixed(1)} · {corr.sampleCount} {t("journal_sample_count", lang)}

                        </p>

                      </div>

                    ))}

                  </div>

                )}

              </Surface>

            )}

    </div>

  );

}




