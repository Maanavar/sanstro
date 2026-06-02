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
  RemedyPlanItem,
  GemstoneAdviceItem,
} from "@/lib/types";
import { LifeAreaCard } from "./life-area-card";
import { DrawerPanel } from "./drawer-panel";
import { PredictionDetailPanel } from "./dashboard-prediction-panel";
import { YogaDoshamPanel } from "./dashboard-yoga-dosham-panel";
import { JadhagamReportPanel } from "./dashboard-jadhagam-report-panel";
import { EventWindowsPanel } from "./dashboard-event-windows";
import { RemediesPanel } from "./dashboard-remedies-panel";

// Areas that are always relevant once a person is 18+ (health is always relevant)
const ALWAYS_ON_AFTER_18 = new Set(["HEALTH", "SPIRITUAL", "MONEY", "CAREER"]);

// Areas that unlock when the person is married
const MARRIAGE_AREAS = new Set(["FAMILY_HARMONY", "CHILDREN"]);

function isAreaRelevantForAge(areaKey: string, age: number, maritalStatus?: string): boolean {
  const isMarried = maritalStatus === "married" || maritalStatus === "widowed" || maritalStatus === "divorced";

  // Health is relevant at every age
  if (areaKey === "HEALTH") return true;

  // Under 12: only health, education, family basics
  if (age < 12) return areaKey === "EDUCATION" || areaKey === "FAMILY_HARMONY";

  // 12-17: education + health
  if (age < 18) return areaKey === "EDUCATION";

  // 18+: most areas are relevant
  if (ALWAYS_ON_AFTER_18.has(areaKey)) return true;

  // Education stays relevant until 30
  if (areaKey === "EDUCATION") return age < 30;

  // Relationships (dating/marriage prospects) relevant from 18 onwards
  if (areaKey === "RELATIONSHIPS") return true;

  // Property, foreign travel, litigation relevant from 25 onwards
  if (areaKey === "PROPERTY" || areaKey === "FOREIGN" || areaKey === "LITIGATION") return age >= 25;

  // Family harmony and children unlock for married/divorced/widowed persons at any age 18+,
  // or for unmarried persons 35+ (may still be relevant)
  if (MARRIAGE_AREAS.has(areaKey)) return isMarried || age >= 35;

  return true;
}

type MemberOption = { memberId: string; displayName: string };
type SubTab = "scores" | "predictions" | "yogas" | "report" | "remedies";

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
  maritalStatus?: string;
  memberCharts: MemberOption[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string | null) => void;
  chartId?: string | null;
  remedyPlan?: RemedyPlanItem[] | null;
  gemstoneAdvice?: GemstoneAdviceItem[] | null;
  remediesLoading?: boolean;
  onLoadRemedies?: () => void;
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
  maritalStatus,
  memberCharts,
  selectedMemberId,
  onSelectMember,
  chartId = null,
  remedyPlan = null,
  gemstoneAdvice = null,
  remediesLoading = false,
  onLoadRemedies,
}: DashboardLifeAreasTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("scores");
  const [selectedArea, setSelectedArea] = useState<LifeAreaData | null>(null);
  const currentAge = chartSummary?.currentAge ?? null;

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: "scores",      label: lang === "ta" ? "கண்ணோட்டம்" : "Overview" },
    { key: "predictions", label: t("predictions_tab_label", lang) },
    { key: "yogas",       label: `${t("yogas_title", lang)} & ${t("doshams_title", lang)}` },
    { key: "remedies",    label: t("remedies_title", lang) },
    { key: "report",      label: lang === "ta" ? "முழு அறிக்கை" : "Full report" },
  ];

  const isMarried = maritalStatus === "married" || maritalStatus === "widowed" || maritalStatus === "divorced";
  const phaseTheme = currentAge !== null
    ? (lang === "ta"
        ? `வயது ${currentAge}${isMarried ? " · திருமணமானவர்" : ""}`
        : `Age ${currentAge}${isMarried ? " · Married" : ""}`)
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
                  const ageRelevant = currentAge === null || isAreaRelevantForAge(area.area, currentAge, maritalStatus);
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
                    ageRelevant={currentAge === null || isAreaRelevantForAge(selectedArea.area, currentAge, maritalStatus)}
                  />
                </DrawerPanel>
              )}
            </>
          )}
        </>
      )}

      {/* ── Sub-tab: Predictions ── */}
      {subTab === "predictions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <PredictionDetailPanel lang={lang} predictions={predictions} loading={predictionsLoading} />
          {lifeAreas?.chartId && (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-4)" }}>
              <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                {lang === "ta" ? "நிகழ்வு நேரங்கள்" : "Event Windows"}
              </p>
              <EventWindowsPanel lang={lang} chartId={lifeAreas.chartId} />
            </div>
          )}
        </div>
      )}

      {/* ── Sub-tab: Yogas & Doshams ── */}
      {subTab === "yogas" && (
        <YogaDoshamPanel lang={lang} yogas={yogas} doshams={doshams} />
      )}

      {/* ── Sub-tab: Remedies ── */}
      {subTab === "remedies" && (
        <RemediesPanel
          lang={lang}
          chartId={chartId ?? null}
          remedyPlan={remedyPlan ?? null}
          gemstoneAdvice={gemstoneAdvice ?? null}
          loading={remediesLoading ?? false}
          onLoad={onLoadRemedies ?? (() => {})}
        />
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
