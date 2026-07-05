"use client";

import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { formatClockLabel, formatDateLabel, scoreColor } from "@/lib/format";
import { t, tLang, tNakshatra, tPlanetLord, tTithi, tWeekday } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import type {
  CharaDashaData,
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  DailyGuidanceData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  LifeAreasResponseData,
  LifeMode,
  NakshatraCardData,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  PeyarchiEvent,
  SaniCycleData,
  SolarReturnData,
  TransitSnapshotData,
  WeekAheadData,
} from "@/lib/types";

import { GRAHA_ABBR, RASI_NAMES } from "./dashboard-charts";
import { DASHA_COLORS } from "./dashboard-dasha";
import { downloadJadhagamPdf } from "./dashboard-personal-tab";
import { Chip, Surface } from "./dashboard-ui";
import { NovaScoreDial } from "./dashboard-ui-nova";
import { CollapsibleSection } from "./collapsible-section";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { VargasPanel } from "./dashboard-vargas-panel";
import { ShadbalaPanel } from "./dashboard-shadbala-panel";
import { YoginiDashaPanel } from "./dashboard-yogini-dasha-panel";
import { AshtottariDashaPanel } from "./dashboard-ashtottari-dasha-panel";
import { KalachakraDashaPanel } from "./dashboard-kalachakra-dasha-panel";
import { useStreak } from "@/hooks/useStreak";

import { DashboardTodayRibbonNova } from "./dashboard-today-ribbon-nova";
import { DashboardTodayDecideNova } from "./dashboard-today-decide-nova";
import { DashboardTodayAnticipationRowNova, DashboardTodayGlanceRowNova } from "./dashboard-today-glance-nova";

/**
 * Nova "Today" tab — Phase 1 of the dashboard revamp (see
 * docs/DASHBOARD_UI_REVAMP_PLAN.md). Re-skin, not a rewrite: every field
 * below comes from the exact same hooks/data Classic's Today tab
 * (dashboard-personal-tab.tsx) already receives from dashboard-workspace.tsx.
 *
 * The Deep Dive section intentionally covers a bounded subset of Classic's
 * full detail (planet table, chart explanation, vargas, shadbala, the three
 * alternate dashas, classical timing, nakshatra card, PDF) — NOT yet carried
 * over: the two-col Chart Context/Guidance-detail/Gochar surfaces, the
 * Dasa-Bhukti-Antaram strip, DashboardActivityTimingCard (the single-activity
 * month browser — distinct from this file's 4-activity Decide grid),
 * MorningGuidanceCard, and the Prasna/Horary trigger. Nothing is lost for
 * users — Classic is still one Settings toggle away — but these should be
 * folded into Nova in a follow-up pass before Classic's Today tab is ever
 * retired for good.
 */

export type DashboardTodayTabNovaProps = {
  lang: Lang;
  activeLifeMode?: LifeMode;
  birthDisplayName: string;
  selectedDate: string;
  todayDate: string;
  personalMemberChart: { displayName: string } | null;
  personalChart: ChartCalculateResponseData | null;
  personalChartExplanation: ChartExplanationData | null;
  personalChartSummary: ChartSummaryData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  weekAhead: WeekAheadData | null;
  familyAggregate: FamilyAggregateData | null;
  lifeAreas?: LifeAreasResponseData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  nakshatraCard: NakshatraCardData | null;
  onGoToFamily?: () => void;
  onGoToJournal?: () => void;
  onGoToCalendar?: () => void;
  onOpenAskVinaadi: () => void;
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

export function DashboardTodayTabNova({
  lang,
  activeLifeMode,
  birthDisplayName,
  selectedDate,
  todayDate,
  personalMemberChart,
  personalChart,
  personalChartExplanation,
  personalChartSummary,
  personalDailyGuidance,
  personalTransit,
  personalSani,
  peyarchiUpcoming,
  panchangam,
  panchangamTimings,
  weekAhead,
  familyAggregate,
  lifeAreas,
  dasha,
  dashaAntar,
  nakshatraCard,
  onGoToFamily,
  onGoToJournal,
  onGoToCalendar,
  onOpenAskVinaadi,
}: DashboardTodayTabNovaProps) {
  const { days: streakDays } = useStreak();
  const displayName = personalMemberChart?.displayName ?? birthDisplayName;
  const activeChartId = personalChart?.chartId ?? personalChartSummary?.chartId ?? "";
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);

  const [charaDasha, setCharaDasha] = useState<CharaDashaData | null>(null);
  const [solarReturn, setSolarReturn] = useState<SolarReturnData | null>(null);

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
      `/api/v1/charts/${activeChartId}/solar-return?year=${returnYear}`, { signal },
    )
      .then((res) => { if (!signal.aborted) setSolarReturn(res.data ?? null); })
      .catch(() => { if (!signal.aborted) setSolarReturn(null); });

    return () => controller.abort();
  }, [activeChartId, selectedDate]);

  const score = personalDailyGuidance?.score ?? null;
  const bestWindow = personalDailyGuidance?.bestWindows[0] ?? null;
  const weekday = panchangam ? tWeekday(panchangam.vara.weekday, lang) : "";
  const paksha = panchangam?.tithi.paksha;
  const wax = paksha === "SHUKLA";

  async function downloadPdf() {
    await downloadJadhagamPdf(activeChartId, selectedDate, lang);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ===== 1. Greeting hero + score dial ===== */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, var(--color-surface-soft), var(--color-surface-3))",
        border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "28px 30px",
      }}>
        <div style={{ display: "flex", gap: "28px", alignItems: "stretch", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "260px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12.5px", color: "var(--color-muted)" }}>
                {weekday && `${weekday} · `}{formatDateLabel(selectedDate)}
                {panchangam?.tamilDate && <> · <span style={{ color: "var(--color-accent-strong)", fontWeight: 600 }}>{lang === "ta" ? panchangam.tamilDate.ta : panchangam.tamilDate.en}</span></>}
              </span>
              {paksha && (
                <span style={{ fontSize: "12px", color: "var(--color-accent-secondary)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {wax ? "◐" : "◑"} {wax ? (lang === "ta" ? "வளர்பிறை" : "Waxing") : (lang === "ta" ? "தேய்பிறை" : "Waning")} · {wax ? (lang === "ta" ? "சுக்ல பக்ஷம்" : "Sukla Paksham") : (lang === "ta" ? "கிருஷ்ண பக்ஷம்" : "Krishna Paksham")}
                </span>
              )}
              {streakDays > 1 && (
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "11.5px", fontWeight: 700, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "5px 12px" }}>
                  ✦ {lang === "ta" ? `${streakDays} நாள் தொடர்ச்சி` : `${streakDays}-day check-in streak`}
                </span>
              )}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 3.4vw, 2.4rem)", fontWeight: 600, lineHeight: 1.08, color: "var(--color-text-strong)" }}>
              {greetingWord(lang)}, {displayName}.
            </div>
            {personalDailyGuidance?.emotionalWeather && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent-secondary)", fontWeight: 700 }}>
                    {lang === "ta" ? "மனநிலை வானிலை" : "Emotional weather"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-nova-prose), Georgia, serif", fontSize: "16px", lineHeight: 1.6, color: "var(--color-text)", maxWidth: "620px" }}>
                  {tLang(personalDailyGuidance.text, lang)}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                  {[
                    { icon: "🌿", label: personalDailyGuidance.emotionalWeather.tone, color: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)" },
                    { icon: "🤝", label: personalDailyGuidance.emotionalWeather.physicalTendency, color: "var(--color-accent)", bg: "var(--color-accent-muted)", border: "var(--color-border-strong)" },
                    { icon: "⚠", label: personalDailyGuidance.emotionalWeather.bestUseOfDay, color: "var(--color-low)", bg: "var(--color-low-bg)", border: "var(--color-low-border)" },
                  ].filter((tag) => tag.label).map((tag) => (
                    <span key={tag.label} style={{ fontSize: "12px", color: "var(--color-text)", background: tag.bg, border: `1px solid ${tag.border}`, borderRadius: "999px", padding: "6px 13px" }}>
                      {tag.icon} {tag.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {personalDailyGuidance && (
            <div style={{ flex: "none", width: "210px", borderLeft: "1px solid var(--color-border)", paddingLeft: "26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <NovaScoreDial score={score ?? 0} label={`/100 · ${personalDailyGuidance.label.toUpperCase()}`} />
              <a href="#nova-deep-dive" style={{ fontSize: "11.5px", color: "var(--color-accent-secondary)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                {lang === "ta" ? "இந்த மதிப்பெண் ஏன்? →" : "See why this score →"}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ===== 2. Panchangam almanac band ===== */}
      {panchangam && (
        <div style={{ display: "flex", alignItems: "center", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "13px 20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ flex: "none", paddingRight: "18px", borderRight: "1px solid var(--color-border)" }}>
            <div style={{ fontFamily: "var(--font-tamil), sans-serif", fontSize: "11px", color: "var(--color-accent)", fontWeight: 600 }}>பஞ்சாங்கம்</div>
            <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "1px" }}>{lang === "ta" ? "இன்றைய பஞ்சாங்கம்" : "Today's almanac"}</div>
          </div>
          <div style={{ flex: "1", minWidth: "260px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", paddingLeft: "18px" }}>
            {[
              { label: lang === "ta" ? "நட்சத்திரம்" : "Nakshatram", value: tNakshatra(panchangam.nakshatra.name, lang) },
              { label: lang === "ta" ? "திதி" : "Tithi", value: tTithi(panchangam.tithi.name, lang) },
              { label: lang === "ta" ? "நல்ல நேரம்" : "Nalla Neram", value: panchangam.kalam.nallaNeram[0] ? `${formatClockLabel(panchangam.kalam.nallaNeram[0].start)} – ${formatClockLabel(panchangam.kalam.nallaNeram[0].end)}` : "—", color: "var(--color-high)" },
              { label: lang === "ta" ? "ராகு காலம்" : "Rahu Kalam", value: `${formatClockLabel(panchangam.kalam.rahuKalam.start)} – ${formatClockLabel(panchangam.kalam.rahuKalam.end)}`, color: "var(--color-low)" },
              { label: lang === "ta" ? "சூரிய உதயம்" : "Sunrise", value: formatClockLabel(panchangam.sunrise) },
            ].map((f) => (
              <div key={f.label}>
                <div style={{ fontSize: "10.5px", letterSpacing: "0.08em", color: "var(--color-accent)", textTransform: "uppercase" }}>{f.label}</div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, marginTop: "2px", color: f.color ?? "var(--color-text-strong)" }}>{f.value}</div>
              </div>
            ))}
          </div>
          {onGoToCalendar && (
            <button type="button" onClick={onGoToCalendar} style={{ flex: "none", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", paddingLeft: "16px" }}>
              {lang === "ta" ? "முழு பஞ்சாங்கம் →" : "Full panchangam →"}
            </button>
          )}
        </div>
      )}

      {/* ===== 3. One thing + Remedy ===== */}
      {personalDailyGuidance && (
        <div className="nova-grid-2" style={{ gridTemplateColumns: "1.55fr 1fr" }}>
          <div style={{ background: "linear-gradient(120deg, var(--color-accent-muted), transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent-strong)", fontWeight: 700 }}>
                {lang === "ta" ? "இன்றைய முக்கிய கவனம்" : "Today's one focus"}
              </span>
            </div>
            <div style={{ fontFamily: "var(--font-nova-prose), Georgia, serif", fontSize: "18px", lineHeight: 1.45, color: "var(--color-text-strong)" }}>
              {tLang(personalDailyGuidance.actionSuggestion, lang)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "2px" }}>
              {bestWindow && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", color: "var(--color-high)", borderRadius: "9px", padding: "9px 14px", fontSize: "13px", fontWeight: 700 }}>
                  ☀ {lang === "ta" ? "செய்யுங்கள்" : "Do it"} {formatClockLabel(bestWindow.start)} – {formatClockLabel(bestWindow.end)}
                </span>
              )}
              {onGoToJournal && (
                <button type="button" onClick={onGoToJournal} style={{ marginLeft: "auto", border: "1px solid var(--color-border-strong)", color: "var(--color-accent-strong)", background: "none", borderRadius: "9px", padding: "9px 16px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {lang === "ta" ? "தருணம் பதிவு" : "Log a moment"}
                </button>
              )}
            </div>
          </div>

          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "11px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
                {lang === "ta" ? "பரிகாரம்" : "Remedy"}
              </span>
            </div>
            <div style={{ fontSize: "13.5px", lineHeight: 1.55, color: "var(--color-text)" }}>
              {tLang(personalDailyGuidance.remedy, lang)}
            </div>
          </div>
        </div>
      )}

      {/* ===== 4. Day timeline ribbon ===== */}
      <DashboardTodayRibbonNova lang={lang} panchangam={panchangam} onGoToCalendar={onGoToCalendar} />

      {/* ===== 5. Ask + Decide ===== */}
      <DashboardTodayDecideNova
        lang={lang}
        chartId={activeChartId || null}
        selectedDate={selectedDate}
        activeLifeMode={activeLifeMode}
        onOpenAskVinaadi={onOpenAskVinaadi}
      />

      {/* ===== 6. Coming up + Week ahead ===== */}
      <DashboardTodayAnticipationRowNova
        lang={lang}
        peyarchiUpcoming={peyarchiUpcoming}
        personalSani={personalSani}
        weekAhead={weekAhead}
        selectedDate={selectedDate}
        onGoToCalendar={onGoToCalendar}
      />

      {/* ===== 7. Family / Dasa chapter / Life areas ===== */}
      <DashboardTodayGlanceRowNova
        lang={lang}
        familyAggregate={familyAggregate}
        personalChartSummary={personalChartSummary}
        dasha={dasha}
        dashaAntar={dashaAntar}
        selectedDate={selectedDate}
        lifeAreas={lifeAreas}
        onGoToFamily={onGoToFamily}
      />

      {/* ===== 8. Deep dive (collapsed) ===== */}
      <div id="nova-deep-dive">
        <div style={{ background: "rgba(243,236,221,0.03)", border: "1px dashed var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "6px 22px" }} className="cd-shell">
          <CollapsibleSection
            title={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 0" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                    {lang === "ta" ? "ஆழமான பார்வை — இன்றைய ஜோதிடம்" : "Deep dive — the astrology behind today"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-faint)", marginTop: "2px" }}>
                    {lang === "ta" ? "முழு வழிகாட்டுதல், D1 & D9 அட்டவணைகள், கிரக நிலைகள், யோகங்கள் & தோஷங்கள்" : "Full guidance, D1 & D9 charts, planet positions, yogas & doshams, score breakdown"}
                  </div>
                </div>
              </div>
            }
            defaultOpen={false}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", paddingBottom: "16px" }}>
              {activeChartId && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => void downloadPdf()}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", border: "1px solid var(--color-border-strong)", background: "none", color: "var(--color-accent-strong)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    ⤓ {lang === "ta" ? "PDF பதிவிறக்கம்" : "Download PDF"}
                  </button>
                </div>
              )}

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
                            <td style={{ fontWeight: 600 }}><span style={{ color: DASHA_COLORS[planet.graha] ?? "var(--color-accent-secondary)", marginRight: "6px" }}>{GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2)}</span>{planet.graha}</td>
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

              {nakshatraCard && (
                <Surface title={t("nakshatra_card_label", lang)}>
                  <div className="surface__body">
                    <div className="surface__headline">
                      <span>{lang === "ta" ? nakshatraCard.nameTa : astroText(nakshatraCard.nameEn)}</span>
                      <Chip tone="accent">{t("nakshatra_ruling_planet", lang)}: {tPlanetLord(nakshatraCard.rulingPlanet, lang)}</Chip>
                    </div>
                    <p className="surface__text">{lang === "ta" ? nakshatraCard.profile.ta : astroText(nakshatraCard.profile.en)}</p>
                    {nakshatraCard.strengths.length > 0 && (
                      <div className="chip-row">{nakshatraCard.strengths.map((s) => <Chip key={s.en} tone="success">{lang === "ta" ? s.ta : astroText(s.en)}</Chip>)}</div>
                    )}
                    {nakshatraCard.cautions.length > 0 && (
                      <div className="chip-row">{nakshatraCard.cautions.map((c) => <Chip key={c.en} tone="warning">{lang === "ta" ? c.ta : astroText(c.en)}</Chip>)}</div>
                    )}
                  </div>
                </Surface>
              )}

              {personalChart && (
                <VargasPanel
                  lang={lang}
                  vargas={personalChart.vargas}
                  d1Planets={Object.fromEntries(personalChart.planets.map((p) => [p.graha, p.rasi]))}
                  bhavaChalit={personalChart.bhavaChalit}
                  vargaReliability={personalChart.vargaReliability}
                />
              )}

              {activeChartId && <ShadbalaPanel lang={lang} chartId={activeChartId} />}
              {activeChartId && <YoginiDashaPanel lang={lang} chartId={activeChartId} />}
              {activeChartId && <AshtottariDashaPanel lang={lang} chartId={activeChartId} />}
              {activeChartId && <KalachakraDashaPanel lang={lang} chartId={activeChartId} />}

              {(charaDasha || solarReturn) && (
                <Surface title={lang === "ta" ? "பாரம்பரிய கால நிர்ணயம்" : "Classical Timing"}>
                  <div className="surface__body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
                    {charaDasha && (
                      <CollapsibleSection title={lang === "ta" ? "ஜைமினி சார தசை" : "Jaimini Chara Dasha"} defaultOpen={false}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingTop: "var(--space-2)" }}>
                          {charaDasha.currentPeriod && (
                            <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)" }}>
                              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-high)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                {lang === "ta" ? "தற்போதைய சார தசை" : "Current Chara Dasha"}
                              </p>
                              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{charaDasha.currentPeriod.rasi_name}</p>
                              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>{charaDasha.currentPeriod.start_date} – {charaDasha.currentPeriod.end_date}</p>
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
                      <CollapsibleSection title={lang === "ta" ? `${solarReturn.returnYear} ஆண்டு தாஜகா` : `${solarReturn.returnYear} Annual Chart`} defaultOpen={false}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-2_5)", paddingTop: "var(--space-2)" }}>
                          <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                            <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang === "ta" ? "வருட லக்னம்" : "SR Lagna"}</p>
                            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{solarReturn.srLagnaRasiName}</p>
                          </div>
                          <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)" }}>
                            <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lang === "ta" ? "முந்தா" : "Muntha"}</p>
                            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{solarReturn.munthaRasiName}</p>
                          </div>
                        </div>
                      </CollapsibleSection>
                    )}
                  </div>
                </Surface>
              )}
            </div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}
