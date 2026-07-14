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
  DashaTimelineItem,
  DashaTimelineResponseData,
  NakshatraCardData,
  PeyarchiEvent,
  SaniCycleData,
  SolarReturnData,
  TransitSnapshotData,
} from "@/lib/types";

import { GRAHA_ABBR, RASI_NAMES } from "./dashboard-charts";
import { DASHA_COLORS } from "./dashboard-dasha";
import { downloadJadhagamPdf } from "./dashboard-personal-shared";
import { Chip, Surface } from "./dashboard-ui";
import { CollapsibleSection } from "./collapsible-section";
import { AdvancedAstrologyGate } from "./advanced-astrology-gate";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { NovaYogaDoshamPanel } from "./dashboard-life-areas-yogas-doshams-nova";
import { VargasPanel } from "./dashboard-vargas-panel";
import { ShadbalaPanel } from "./dashboard-shadbala-panel";
import { YoginiDashaPanel } from "./dashboard-yogini-dasha-panel";
import { AshtottariDashaPanel } from "./dashboard-ashtottari-dasha-panel";
import { KalachakraDashaPanel } from "./dashboard-kalachakra-dasha-panel";
import { ConditionalDashasPanel } from "./dashboard-conditional-dashas-panel";
import {
  NovaChartIdentityCard,
  NovaChartValidationChip,
  NovaPrasnaTrigger,
  NovaPrasnaWidget,
  NovaRasiTraitCard,
} from "./dashboard-today-deepdive-extras-nova";
import { DasaBhuktiAntaramDetail } from "./dashboard-family-shared";
import { ShareCardButton } from "./dashboard-share-card";

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
 *
 * Today's guidance + Gochar (transits/panchangam) previously lived here as
 * their own zone (see git history) — moved to the Life Areas tab's Overview
 * sub-tab on 2026-07-09 so the "how am I doing" landing page leads with
 * today's snapshot. This panel keeps the reference material only.
 */

export type DashboardChartsPanelNovaProps = {
  lang: Lang;
  activeChartId: string;
  selectedDate: string;
  personalChart: ChartCalculateResponseData | null;
  personalChartExplanation: ChartExplanationData | null;
  personalChartSummary: ChartSummaryData | null;
  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  nakshatraCard: NakshatraCardData | null;
  mode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
  /** Whose chart this is. Defaults to the account owner. */
  isSelf?: boolean;
  /** Display name to use in the title when isSelf is false. */
  viewerDisplayName?: string;
  onOpenPrasna?: () => void;
  showPrasna?: boolean;
  onClosePrasna?: () => void;
};

export function DashboardChartsPanelNova({
  lang,
  activeChartId,
  selectedDate,
  personalChart,
  personalChartExplanation,
  personalChartSummary,
  personalTransit,
  personalSani,
  peyarchiUpcoming,
  dasha,
  dashaAntar,
  nakshatraCard,
  mode,
  isSelf = true,
  viewerDisplayName,
  onOpenPrasna,
  showPrasna = false,
  onClosePrasna,
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
    // overflowAnchor none: this panel is a stack of expanding/collapsing
    // blocks (chart explanation, vargas, Shadbala, the alternate dashas).
    // Native scroll anchoring picks anchor nodes inside whichever block is
    // unmounting and throws the viewport to an unrelated spot; the panels'
    // own trigger-pinning (collapsible-section.tsx, chart-explanation) is
    // the single deliberate scroll correction instead.
    <div id="nova-charts-panel" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowAnchor: "none" }}>
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
            <>
              <ShareCardButton chartId={activeChartId} cardType="NAKSHATRA" lang={lang} label={lang === "ta" ? "நட்சத்திர அட்டை பகிர்" : "Share Birth Star Card"} />
              <ShareCardButton chartId={activeChartId} cardType="DAILY_VIBE" lang={lang} date={selectedDate} label={lang === "ta" ? "இன்றைய வைப் பகிர்" : "Share Today's Vibe"} />
            </>
          )}
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

      {/* ===== 1. Chart context — full width, no longer squeezed into a
          two-col alongside the birth-star/dasa cards, so the D1 & D9 kattam
          render at full size side by side (there's the room for it on this
          full-page tab). Just the identity facts: rasi, nakshatram, lagnam,
          dob. ===== */}
      <NovaChartIdentityCard
        lang={lang}
        personalChart={personalChart}
        personalChartSummary={personalChartSummary}
        dasha={dasha}
        astroText={astroText}
      />

      {/* ===== 2. Profile cards row — birth star, rasi and lagnam trait cards
          share the same visual treatment (Surface box + ruling-planet chip +
          profile + trait chips), followed by the Dasa·Bhukti·Antaram timeline
          in the same neutral card styling so the row reads as one consistent
          design language instead of a patchwork of different-looking boxes.
          Placed ahead of the raw planet-positions table so the "who you are"
          narrative reads before the reference data. ===== */}
      <div className="nova-grid-4">
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
        <NovaRasiTraitCard lang={lang} rasi={personalChart?.planets.find((p) => p.graha === "MOON")?.rasi} titleKey="rasi_trait_card_label" astroText={astroText} />
        <NovaRasiTraitCard lang={lang} rasi={personalChart?.lagna.rasi} titleKey="lagna_trait_card_label" astroText={astroText} />
        <DasaBhuktiAntaramDetail lang={lang} today={selectedDate} dasha={dasha} dashaAntar={dashaAntar} />
      </div>

      {/* ===== Border Alert — birth-time junction/edge conditions (Cazimi,
          Sankranti birth, Grahana Janma…). Rendered only when the chart
          actually carries one, so it reads as a genuine alert, not clutter. ===== */}
      {personalChart && personalChart.birthConditions && personalChart.birthConditions.length > 0 && (
        <Surface title={t("surface_border_alert", lang)}>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {personalChart.birthConditions.map((condition) => {
              const accent = condition.severity === "BOOST"
                ? "var(--color-success, #3fb950)"
                : condition.severity === "ALERT"
                  ? "var(--color-warning, #d29922)"
                  : "var(--color-accent-secondary)";
              return (
                <div
                  key={condition.code}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "var(--space-3)",
                    borderRadius: "var(--radius-md, 10px)",
                    background: "var(--color-surface-raised, rgba(255,255,255,0.03))",
                    borderInlineStart: `3px solid ${accent}`,
                  }}
                >
                  <Chip tone={condition.severity === "BOOST" ? "success" : "warning"}>
                    {lang === "ta" ? condition.titleTa : condition.titleEn}
                  </Chip>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                    {lang === "ta" ? condition.descriptionTa : condition.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>
        </Surface>
      )}

      {/* ===== 3. Planet positions — the detailed reference zone. Chart
          explanation renders open (not collapsed) right underneath the
          table. ===== */}
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
                    <td>
                      <div className="table__flags">
                        {planet.isRetrograde ? <Chip tone="warning">{t("flag_vakra", lang)}</Chip> : null}
                        {planet.isCombust ? <Chip tone="warning">{t("flag_astam", lang)}</Chip> : null}
                        {planet.isCazimi ? <Chip tone="success">{t("flag_cazimi", lang)}</Chip> : null}
                        {planet.isVargottama ? <Chip tone="success">{t("flag_vargottamam", lang)}</Chip> : null}
                      </div>
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
              renderYogaDoshamPanel={({ lang: l, yogas, doshams }) => <NovaYogaDoshamPanel lang={l} yogas={yogas} doshams={doshams} />}
            />
          </div>
        )}
      </Surface>

      {/* ===== 3. Divisional charts, strength & alternate dashas, classical
          timing — reference material, unchanged order. ===== */}
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
        {activeChartId && <ConditionalDashasPanel lang={lang} chartId={activeChartId} />}
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

      {/* ===== Tools — Activity Timing moved to the Tools tab and Morning
          Guidance moved to the Today homepage (both are account-level utility
          actions, not chart reference material); Prasna stays here since it's
          a direct "ask a question about this chart" action. ===== */}
      {isSelf && onOpenPrasna && (
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "18px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-accent)" }}>
            {lang === "ta" ? "கருவிகள்" : "Tools"}
          </p>
          <NovaPrasnaTrigger lang={lang} onOpenPrasna={onOpenPrasna} />
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
