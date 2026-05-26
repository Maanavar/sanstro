"use client";

import React, { useState } from "react";
import { getScoreBand } from "@/lib/format";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  LifeAreaData,
  LifeAreasResponseData,
  PredictionBundle,
  ChartYogaInsight,
  ChartDoshamInsight,
  JadhagamReportData,
  ChartSummaryData,
} from "@/lib/types";

// Maps backend life-area keys to display areas for age-phase filtering
const AREA_PHASE_MAP: Record<string, string[]> = {
  CAREER:           ["career", "career_preparation", "career_peak"],
  MONEY:            ["wealth_foundation", "wealth", "career", "career_peak"],
  HEALTH:           ["health"],
  RELATIONSHIPS:    ["marriage", "career", "career_peak", "wealth_foundation", "wealth", "property", "children", "spirituality", "family_legacy"],
  EDUCATION:        ["education", "career_preparation"],
  SPIRITUAL:        ["spirituality", "family_legacy"],
  FAMILY_HARMONY:   ["family", "children", "family_legacy"],
};

function getAgePhases(age: number): string[] {
  if (age < 12) return ["health", "education", "family"];
  if (age < 24) return ["education", "health", "career_preparation"];
  if (age < 35) return ["career", "marriage", "wealth_foundation"];
  if (age < 50) return ["career_peak", "wealth", "property", "children"];
  return ["health", "spirituality", "family_legacy"];
}

function isAreaRelevantForAge(areaKey: string, age: number): boolean {
  const activePhases = getAgePhases(age);
  const phases = AREA_PHASE_MAP[areaKey] ?? [];
  return phases.some((p) => activePhases.includes(p));
}
import { PredictionDetailPanel } from "./dashboard-prediction-panel";
import { YogaDoshamPanel } from "./dashboard-yoga-dosham-panel";
import { JadhagamReportPanel } from "./dashboard-jadhagam-report-panel";
import { RetrospectivePanel } from "./dashboard-retrospective-panel";
import { DecisionPanel } from "./dashboard-decision-panel";

type MemberOption = { memberId: string; displayName: string };

type DashboardLifeAreasTabProps = {
  lang: Lang;
  lifeAreas: LifeAreasResponseData | null;
  predictions: PredictionBundle | null;
  predictionsLoading: boolean;
  yogas: ChartYogaInsight[];
  doshams: ChartDoshamInsight[];
  jadhagamReport: JadhagamReportData | null;
  jadhagamReportLoading: boolean;
  onLoadJadhagamReport: () => void;
  chartSummary: ChartSummaryData | null;
  chartId: string;
  // member selector
  birthDisplayName: string;
  memberCharts: MemberOption[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
};

type SubTab = "scores" | "predictions" | "yogas" | "report" | "retrospective" | "decision";

export function DashboardLifeAreasTab({
  lang,
  lifeAreas,
  predictions,
  predictionsLoading,
  yogas,
  doshams,
  jadhagamReport,
  jadhagamReportLoading,
  onLoadJadhagamReport,
  chartSummary,
  chartId,
  birthDisplayName,
  memberCharts,
  selectedMemberId,
  onSelectMember,
}: DashboardLifeAreasTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("scores");
  const currentAge = chartSummary?.currentAge ?? null;
  const activePhases = currentAge !== null ? getAgePhases(currentAge) : null;

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: "scores", label: t("tab_life_areas", lang) },
    { key: "predictions", label: t("predictions_tab_label", lang) },
    { key: "yogas", label: `${t("yogas_title", lang)} / ${t("doshams_title", lang)}` },
    { key: "report", label: t("jadhagam_report_title", lang) },
    { key: "retrospective", label: t("retro_panel_title", lang) },
    { key: "decision", label: t("decision_panel_title", lang) },
  ];

  return (
    <div className="tab-section">
      <div className="section-kicker">{t("tab_life_areas", lang)}</div>
      <h2 className="section-title">{t("life_areas_title", lang)}</h2>
      <p className="section-desc">{t("life_areas_desc", lang)}</p>

      {/* Member selector */}
      {memberCharts.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "16px" }}>
          <button
            type="button"
            onClick={() => onSelectMember(null)}
            style={{
              padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: selectedMemberId === null ? 700 : 400,
              background: selectedMemberId === null ? "rgba(229,184,77,0.25)" : "rgba(255,255,255,0.07)",
              color: selectedMemberId === null ? "#e5b84d" : "rgba(255,255,255,0.55)",
              outline: selectedMemberId === null ? "1px solid rgba(229,184,77,0.5)" : "1px solid transparent",
            }}
          >
            ◎ {birthDisplayName || t("personal_you", lang)}
          </button>
          {memberCharts.map((mc) => (
            <button
              key={mc.memberId}
              type="button"
              onClick={() => onSelectMember(mc.memberId)}
              style={{
                padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer",
                fontSize: "0.78rem", fontWeight: selectedMemberId === mc.memberId ? 700 : 400,
                background: selectedMemberId === mc.memberId ? "rgba(147,197,253,0.2)" : "rgba(255,255,255,0.06)",
                color: selectedMemberId === mc.memberId ? "#93c5fd" : "rgba(255,255,255,0.5)",
                outline: selectedMemberId === mc.memberId ? "1px solid rgba(147,197,253,0.4)" : "1px solid transparent",
              }}
            >
              {mc.displayName}
            </button>
          ))}
        </div>
      )}

      {/* Sub-tab switcher */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "12px",
          marginBottom: "18px",
        }}
      >
        {SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
              border: subTab === key ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
              background: subTab === key ? "rgba(255,255,255,0.1)" : "transparent",
              color: subTab === key ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Sub-tab: Life area scores ─────────────────────────────────────── */}
      {subTab === "scores" && (
        <>
          {!lifeAreas ? (
            <p className="empty-state">{t("life_areas_empty", lang)}</p>
          ) : (
            <>
            {/* Age phase context banner */}
            {activePhases && currentAge !== null && (
              <div style={{
                marginBottom: "12px", padding: "10px 14px", borderRadius: "10px",
                background: "rgba(229,184,77,0.08)", border: "1px solid rgba(229,184,77,0.2)",
                fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5,
              }}>
                <span style={{ color: "#e5b84d", fontWeight: 700 }}>
                  {lang === "ta" ? `வயது ${currentAge} — ` : `Age ${currentAge} — `}
                </span>
                {lang === "ta"
                  ? `இந்த காலகட்டத்தில் முக்கியமான துறைகள்: ${activePhases.join(", ")}`
                  : `Key life phases now: ${activePhases.join(", ")}`}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              {lifeAreas.areas.map((area: LifeAreaData) => {
                const scoreBand = getScoreBand(area.score);
                const trendIcon = area.trend === "UP" ? "↑" : area.trend === "DOWN" ? "↓" : "→";
                const trendColor = area.trend === "UP" ? "#4ade80" : area.trend === "DOWN" ? "#f87171" : "#fbbf24";
                const ageRelevant = currentAge === null || isAreaRelevantForAge(area.area, currentAge);
                const borderColor = !ageRelevant
                  ? "rgba(255,255,255,0.06)"
                  : scoreBand.tone === "high"
                    ? "rgba(74,222,128,0.3)"
                    : scoreBand.tone === "low"
                    ? "rgba(248,113,113,0.3)"
                    : "rgba(251,191,36,0.25)";
                const bgColor = !ageRelevant
                  ? "rgba(255,255,255,0.02)"
                  : scoreBand.tone === "high"
                    ? "rgba(74,222,128,0.07)"
                    : scoreBand.tone === "low"
                    ? "rgba(248,113,113,0.07)"
                    : "rgba(251,191,36,0.05)";

                return (
                  <div
                    key={area.area}
                    style={{
                      padding: "18px 20px",
                      borderRadius: "12px",
                      background: bgColor,
                      border: `1px solid ${borderColor}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      opacity: ageRelevant ? 1 : 0.5,
                    }}
                  >
                    {!ageRelevant && (
                      <div style={{
                        fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.35)",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px",
                        padding: "2px 7px", alignSelf: "flex-start", letterSpacing: "0.05em",
                      }}>
                        {lang === "ta" ? "தற்போதைய வயதில் குறைவான முக்கியத்துவம்" : "Less relevant at current age"}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {tLang(area.label, lang)}
                        </p>
                        <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, lineHeight: 1 }}>
                          {area.score}
                          <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/100</span>
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: trendColor }}>{trendIcon}</span>
                        <span style={{ fontSize: "0.65rem", color: trendColor, fontWeight: 600 }}>{area.trend}</span>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                      {tLang(area.narrative, lang)}
                    </p>

                    <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", minWidth: "52px", paddingTop: "2px" }}>
                        {t("life_area_karaka", lang)}
                      </span>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                        {tLang(area.driver.reason, lang)}
                      </p>
                    </div>

                    {area.caution && (
                      <div style={{ padding: "6px 10px", borderRadius: "6px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" }}>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#f87171", lineHeight: 1.4 }}>
                          ⚠ {tLang(area.caution, lang)}
                        </p>
                      </div>
                    )}

                    <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>
                        {t("life_area_outlook", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.74rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                        {tLang(area.next30DayOutlook, lang)}
                      </p>
                    </div>

                    <div style={{ padding: "8px 10px", borderRadius: "7px", background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#fbbf24" }}>
                        {t("remedy_label", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>
                        {tLang(area.remedy, lang)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </>
      )}

      {/* ── Sub-tab: Deep predictions ─────────────────────────────────────── */}
      {subTab === "predictions" && (
        <PredictionDetailPanel lang={lang} predictions={predictions} loading={predictionsLoading} />
      )}

      {/* ── Sub-tab: Yogas & Doshams ─────────────────────────────────────── */}
      {subTab === "yogas" && (
        <YogaDoshamPanel lang={lang} yogas={yogas} doshams={doshams} />
      )}

      {/* ── Sub-tab: Full jadhagam report ────────────────────────────────── */}
      {subTab === "report" && (
        <JadhagamReportPanel
          lang={lang}
          report={jadhagamReport}
          loading={jadhagamReportLoading}
          onLoad={onLoadJadhagamReport}
        />
      )}

      {/* ── Sub-tab: Event retrospective ─────────────────────────────────── */}
      {subTab === "retrospective" && (
        <RetrospectivePanel lang={lang} chartId={chartId} />
      )}

      {/* ── Sub-tab: Decision support ────────────────────────────────────── */}
      {subTab === "decision" && (
        <DecisionPanel lang={lang} chartId={chartId} />
      )}
    </div>
  );
}
