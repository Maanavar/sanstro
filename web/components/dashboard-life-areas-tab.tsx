"use client";

import React, { useState } from "react";
import { t } from "@/lib/i18n";
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
import { LifeAreaCard } from "./life-area-card";
import { DrawerPanel } from "./drawer-panel";
import { PredictionDetailPanel } from "./dashboard-prediction-panel";
import { YogaDoshamPanel } from "./dashboard-yoga-dosham-panel";
import { JadhagamReportPanel } from "./dashboard-jadhagam-report-panel";

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

type MemberOption = { memberId: string; displayName: string };
type SubTab = "scores" | "predictions" | "yogas" | "report";

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
  birthDisplayName: string;
  memberCharts: MemberOption[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
};

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
  birthDisplayName,
  memberCharts,
  selectedMemberId,
  onSelectMember,
}: DashboardLifeAreasTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("scores");
  const [selectedArea, setSelectedArea] = useState<LifeAreaData | null>(null);
  const currentAge = chartSummary?.currentAge ?? null;
  const activePhases = currentAge !== null ? getAgePhases(currentAge) : null;

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: "scores",      label: lang === "ta" ? "கண்ணோட்டம்" : "Overview" },
    { key: "predictions", label: t("predictions_tab_label", lang) },
    { key: "yogas",       label: `${t("yogas_title", lang)} & ${t("doshams_title", lang)}` },
    { key: "report",      label: lang === "ta" ? "முழு அறிக்கை" : "Full report" },
  ];

  /* Theme line for hero — derived from active phases */
  const phaseTheme = activePhases
    ? (lang === "ta"
        ? `தற்போது: ${activePhases.slice(0, 3).join(", ")}`
        : `${activePhases.slice(0, 3).map((p) => p.replace(/_/g, " ")).join(", ")} are this year's themes.`)
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", fontFamily: "var(--font-body)" }}>

      {/* ── Hero ── */}
      <div>
        <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B85A2C" }}>
          {t("tab_life_areas", lang)}{currentAge !== null ? ` · ${lang === "ta" ? "வயது" : "AGE"} ${currentAge}` : ""}
        </p>
        <h1 style={{
          margin: "0 0 var(--space-3)",
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: "#1A1612",
        }}>
          {lang === "ta" ? "நீங்கள் எங்கே நிற்கிறீர்கள்," : "Where you stand,"}
          <br />
          <em style={{ fontStyle: "italic", color: "#7A6F5E" }}>
            {lang === "ta" ? "துறை வாரியாக." : "area by area."}
          </em>
        </h1>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#5a4f42", lineHeight: 1.6, maxWidth: "56ch" }}>
          {lang === "ta"
            ? "ஒவ்வொரு மதிப்பெண்ணும் உங்கள் தற்போதைய மாதசை மற்றும் கோசார நிலையை அடிப்படையாகக் கொண்டது."
            : `Each score reads support under your current Moon Dasa and active transits. ${phaseTheme}`}
        </p>
      </div>

      {/* ── Member selector + Sub-tab nav row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>

        {/* Member pills */}
        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => onSelectMember(null)}
            style={{
              padding: "var(--space-1) var(--space-4)", borderRadius: "var(--radius-pill)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
              border: "1.5px solid",
              borderColor: selectedMemberId === null ? "#B85A2C" : "#D4C8AE",
              background: selectedMemberId === null ? "#F0D9C4" : "transparent",
              color: selectedMemberId === null ? "#8c3e18" : "#7A6F5E",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: "var(--space-1_5)",
            }}
          >
            {selectedMemberId === null && (
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#B85A2C", display: "inline-block", flexShrink: 0 }} />
            )}
            {birthDisplayName || t("personal_you", lang)}
          </button>
          {memberCharts.map((mc) => (
            <button
              key={mc.memberId}
              type="button"
              onClick={() => onSelectMember(mc.memberId)}
              style={{
                padding: "var(--space-1) var(--space-4)", borderRadius: "var(--radius-pill)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                border: "1.5px solid",
                borderColor: selectedMemberId === mc.memberId ? "#1A1612" : "#D4C8AE",
                background: selectedMemberId === mc.memberId ? "#1A1612" : "transparent",
                color: selectedMemberId === mc.memberId ? "#F4EEE2" : "#7A6F5E",
                fontFamily: "inherit",
              }}
            >
              {mc.displayName}
            </button>
          ))}
        </div>

        {/* Sub-tab pills — right side */}
        <div style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {SUB_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSubTab(key)}
              style={{
                padding: "var(--space-1_5) var(--space-4)",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.75rem",
                fontWeight: 600,
                cursor: "pointer",
                border: "1.5px solid",
                borderColor: subTab === key ? "#1A1612" : "#D4C8AE",
                background: subTab === key ? "#1A1612" : "transparent",
                color: subTab === key ? "#F4EEE2" : "#7A6F5E",
                fontFamily: "inherit",
                transition: "all 0.12s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sub-tab: Overview (scores grid) ── */}
      {subTab === "scores" && (
        <>
          {!lifeAreas ? (
            <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "0.875rem" }}>{t("life_areas_empty", lang)}</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
                {lifeAreas.areas.map((area: LifeAreaData) => {
                  const ageRelevant = currentAge === null || isAreaRelevantForAge(area.area, currentAge);
                  return (
                    <LifeAreaCard
                      key={area.area}
                      area={area}
                      lang={lang}
                      ageRelevant={ageRelevant}
                      onOpenDetail={() => setSelectedArea(area)}
                    />
                  );
                })}
              </div>

              {selectedArea && (
                <DrawerPanel
                  title={lang === "ta" ? selectedArea.label.ta : selectedArea.label.en}
                  onClose={() => setSelectedArea(null)}
                >
                  <LifeAreaCard
                    area={selectedArea}
                    lang={lang}
                    ageRelevant={currentAge === null || isAreaRelevantForAge(selectedArea.area, currentAge)}
                  />
                </DrawerPanel>
              )}
            </>
          )}
        </>
      )}

      {/* ── Sub-tab: Predictions ── */}
      {subTab === "predictions" && (
        <PredictionDetailPanel lang={lang} predictions={predictions} loading={predictionsLoading} />
      )}

      {/* ── Sub-tab: Yogas & Doshams ── */}
      {subTab === "yogas" && (
        <YogaDoshamPanel lang={lang} yogas={yogas} doshams={doshams} />
      )}

      {/* ── Sub-tab: Full report ── */}
      {subTab === "report" && (
        <JadhagamReportPanel
          lang={lang}
          report={jadhagamReport}
          loading={jadhagamReportLoading}
          onLoad={onLoadJadhagamReport}
        />
      )}

    </div>
  );
}
