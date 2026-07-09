"use client";

import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import type {
  CharaDashaData,
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  NakshatraCardData,
  PanchangamDailyResponseData,
  PeyarchiEvent,
  SaniCycleData,
  SolarReturnData,
  TransitSnapshotData,
} from "@/lib/types";

import { GRAHA_ABBR, RASI_NAMES } from "./dashboard-charts";
import { DASHA_COLORS } from "./dashboard-dasha";
import { downloadJadhagamPdf } from "./dashboard-personal-tab";
import { Chip, Surface } from "./dashboard-ui";
import { CollapsibleSection } from "./collapsible-section";
import { AdvancedAstrologyGate } from "./advanced-astrology-gate";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { VargasPanel } from "./dashboard-vargas-panel";
import { ShadbalaPanel } from "./dashboard-shadbala-panel";
import { YoginiDashaPanel } from "./dashboard-yogini-dasha-panel";
import { AshtottariDashaPanel } from "./dashboard-ashtottari-dasha-panel";
import { KalachakraDashaPanel } from "./dashboard-kalachakra-dasha-panel";
import {
  NovaActivityTimingCard,
  NovaChartIdentityCard,
  NovaChartValidationChip,
  NovaGuidanceGocharRow,
  NovaPrasnaTrigger,
  NovaPrasnaWidget,
} from "./dashboard-today-deepdive-extras-nova";
import { DasaBhuktiAntaramDetail } from "./dashboard-family-tab";
import { MorningGuidanceCard } from "./morning-guidance-card";

/**
 * Nova "chart & explanations" deep-dive panel. This is the full astrology
 * engine — planet positions, chart explanation, divisional charts, Shadbala,
 * the alternate dashas, classical timing, birth-star profile, Prasna and PDF
 * export — lifted verbatim out of the Nova Today tab (dashboard-today-tab-nova.tsx
 * §8). It now lives under the "Family & Charts" tab so the Today homepage stays a
 * decision layer only; the Today tab links here via its "Why this prediction?"
 * bridge card. Every field comes from the same hooks/data as before — this is a
 * move, not new computation.
 *
 * Whoever's profile is currently open in the Family tab feeds this panel —
 * it is not owner-only. `isSelf`/`viewerDisplayName` only control the title
 * text and gate the account-level widgets (Prasna, notification settings)
 * that don't make sense while looking at someone else's chart.
 */

export type DashboardChartsPanelNovaProps = {
  lang: Lang;
  activeChartId: string;
  selectedDate: string;
  personalChart: ChartCalculateResponseData | null;
  personalChartExplanation: ChartExplanationData | null;
  personalChartSummary: ChartSummaryData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  panchangam: PanchangamDailyResponseData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  dailyGuidanceRange?: DailyGuidanceRangeData | null;
  nakshatraCard: NakshatraCardData | null;
  mode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
  /** Whose chart this is. Defaults to the account owner. */
  isSelf?: boolean;
  /** Display name to use in the title when isSelf is false. */
  viewerDisplayName?: string;
  onDateChange?: (date: string) => void;
  onOpenPrasna?: () => void;
  showPrasna?: boolean;
  onClosePrasna?: () => void;
  onOpenNotificationSettings?: () => void;
};

export function DashboardChartsPanelNova({
  lang,
  activeChartId,
  selectedDate,
  personalChart,
  personalChartExplanation,
  personalChartSummary,
  personalDailyGuidance,
  personalTransit,
  personalSani,
  peyarchiUpcoming,
  panchangam,
  dasha,
  dashaAntar,
  dailyGuidanceRange,
  nakshatraCard,
  mode,
  isSelf = true,
  viewerDisplayName,
  onDateChange,
  onOpenPrasna,
  showPrasna = false,
  onClosePrasna,
  onOpenNotificationSettings,
}: DashboardChartsPanelNovaProps) {
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

  async function downloadPdf() {
    await downloadJadhagamPdf(activeChartId, selectedDate, lang);
  }

  return (
    <div id="nova-charts-panel" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Section header — this is the primary purpose of the Charts side of the tab */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: "18px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
            {isSelf
              ? (lang === "ta" ? "உங்கள் ஜாதகம் & விளக்கம்" : "Your chart & explanations")
              : (lang === "ta" ? `${viewerDisplayName} ஜாதகம் & விளக்கம்` : `${viewerDisplayName}'s chart & explanations`)}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-faint)", marginTop: "2px" }}>
            {lang === "ta"
              ? "முழு வழிகாட்டுதல், D1 & D9 அட்டவணைகள், கிரக நிலைகள், யோகங்கள் & தோஷங்கள்"
              : "Full guidance, D1 & D9 charts, planet positions, yogas & doshams, score breakdown"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <NovaChartValidationChip lang={lang} validationStatus={personalChartSummary?.chartValidationStatus} />
          {activeChartId && (
            <button
              type="button"
              onClick={() => void downloadPdf()}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", border: "1px solid var(--color-border-strong)", background: "none", color: "var(--color-accent-strong)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              ⤓ {lang === "ta" ? "PDF பதிவிறக்கம்" : "Download PDF"}
            </button>
          )}
        </div>
      </div>

      {/* ===== 1. Identity — the kattam leads. Reading order follows a classical
          consultation: jadhagam kattam (D1/D9) first, the person's birth-star
          profile beside it, then the single Dasa·Bhukti·Antaram detail. The old
          "Dasa Position" strip (a duplicate of the same data) is gone, and the
          birth-star card no longer floats between the planets table and the
          divisional charts. ===== */}
      <div className="two-col">
        <NovaChartIdentityCard
          lang={lang}
          activeChartId={activeChartId}
          selectedDate={selectedDate}
          personalChart={personalChart}
          personalChartSummary={personalChartSummary}
          astroText={astroText}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
          <DasaBhuktiAntaramDetail lang={lang} today={selectedDate} dasha={dasha} dashaAntar={dashaAntar} />
        </div>
      </div>

      {/* ===== 2. Today for this person — guidance + gochar ===== */}
      <NovaGuidanceGocharRow
        lang={lang}
        personalDailyGuidance={personalDailyGuidance}
        personalTransit={personalTransit}
        personalSani={personalSani}
        panchangam={panchangam}
        dailyGuidanceRange={dailyGuidanceRange}
        astroText={astroText}
      />

      {/* ===== 3. Reference — planet positions, explanation, divisional charts,
          strength & alternate dashas ===== */}
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
      <AdvancedAstrologyGate lang={lang} mode={mode}>
        {activeChartId && <YoginiDashaPanel lang={lang} chartId={activeChartId} />}
        {activeChartId && <AshtottariDashaPanel lang={lang} chartId={activeChartId} />}
        {activeChartId && <KalachakraDashaPanel lang={lang} chartId={activeChartId} />}
      </AdvancedAstrologyGate>

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

      {/* ===== Tools — things you *do* with a chart (find a date, ask a question,
          opt into daily nudges), grouped at the end deliberately: you read the
          chart above first, then reach for a tool. Activity Timing used to sit
          at the very top of this panel, ahead of the chart itself — moved here
          next to Prasna/Morning Guidance since all three are the same kind of
          thing (a utility action), not chart reference. Prasna/Morning
          Guidance stay account-level (isSelf-gated); Activity Timing works for
          whichever chart is open. ===== */}
      {activeChartId && (
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-accent)" }}>
            {lang === "ta" ? "கருவிகள்" : "Tools"}
          </p>
          <NovaActivityTimingCard lang={lang} chartId={activeChartId} selectedDate={selectedDate} onDateChange={onDateChange} />
          {isSelf && <MorningGuidanceCard lang={lang} onOpenSettings={onOpenNotificationSettings} />}
          {isSelf && <NovaPrasnaTrigger lang={lang} onOpenPrasna={onOpenPrasna} />}
        </div>
      )}
      {isSelf && onClosePrasna && personalChart && (
        <NovaPrasnaWidget
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
