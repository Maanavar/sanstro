"use client";

import React, { useState } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ActivityTimingData, GoalData, WhatIfData } from "@/lib/types";

import { Button, Chip, Surface } from "./dashboard-ui";
import { DecisionPanel } from "./dashboard-decision-panel";
import { DashboardMuhurtaPicker } from "./dashboard-muhurta-picker";
import { DashboardLifeEventLog } from "./dashboard-life-event-log";
import { EventWindowsPanel } from "./dashboard-event-windows";

// Map a declared goal to the event-window engine's event type so we can show
// the next supportive timing windows for that specific goal.
const GOAL_EVENT_MAP: Record<string, "MARRIAGE" | "CAREER" | "FINANCE"> = {
  job_change: "CAREER",
  business_start: "CAREER",
  education: "CAREER",
  marriage: "MARRIAGE",
  family_harmony: "MARRIAGE",
  child_birth: "MARRIAGE",
  property: "FINANCE",
  money: "FINANCE",
};

type DashboardPlanTabProps = {
  lang: Lang;
  chartId: string;
  hasBirthProfile: boolean;

  goals: GoalData[];
  goalsBusy: boolean;
  addingGoalType: string;
  onAddingGoalTypeChange: (v: string) => void;
  removingGoalId: string;
  onAddGoal: (goalType: string) => void;
  onRemoveGoal: (goalId: string) => void;

  whatIfScenario: string;
  whatIfDate: string;
  whatIfResult: WhatIfData | null;
  whatIfBusy: boolean;
  whatIfError: string;
  onWhatIfScenarioChange: (v: string) => void;
  onWhatIfDateChange: (v: string) => void;
  onRunWhatIf: () => void;
  mode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
};

const GOAL_OPTIONS: Array<[string, Parameters<typeof t>[0]]> = [
  ["job_change", "goal_job_change"],
  ["business_start", "goal_business"],
  ["marriage", "goal_marriage"],
  ["education", "goal_education"],
  ["property", "goal_property"],
  ["health", "goal_health"],
  ["travel_abroad", "goal_travel"],
  ["spiritual", "goal_spiritual"],
  ["family_harmony", "goal_family"],
  ["money", "goal_money"],
  ["child_birth", "goal_child"],
  ["other", "goal_other"],
];

function normalizeGoalType(goalType: string): string {
  return goalType === "financial" ? "money" : goalType;
}

const WHATIF_OPTIONS: Array<{ value: string; en: string; ta: string }> = [
  { value: "job_change", en: "Job change or new role", ta: "வேலை மாற்றம் / புதிய பொறுப்பு" },
  { value: "business_start", en: "Start a new business", ta: "புதிய தொழில் தொடங்குதல்" },
  { value: "marriage", en: "Marriage", ta: "திருமணம்" },
  { value: "education", en: "Education / Exam / Study", ta: "கல்வி / தேர்வு" },
  { value: "property", en: "Buy property or land", ta: "சொத்து வாங்குதல்" },
  { value: "money", en: "Investment or financial move", ta: "முதலீடு / நிதி முடிவு" },
  { value: "travel_abroad", en: "Travel abroad or relocation", ta: "வெளிநாடு பயணம் / இடமாற்றம்" },
  { value: "health", en: "Medical procedure or surgery", ta: "மருத்துவ சிகிச்சை / அறுவை" },
  { value: "spiritual", en: "Spiritual initiation or pilgrimage", ta: "ஆன்மீக தொடக்கம் / புனித பயணம்" },
  { value: "family_harmony", en: "Resolve family matter", ta: "குடும்ப பிரச்சினை தீர்க்க" },
  { value: "child_birth", en: "Child birth or naming", ta: "குழந்தை பிறப்பு / பெயரிடல்" },
  { value: "other", en: "General timing check", ta: "பொதுவான நேர சரிபார்ப்பு" },
];

const ACTIVITY_OPTIONS: Array<{ value: string; en: string; ta: string }> = [
  { value: "job_change", en: "Job change or new role", ta: "வேலை மாற்றம் / புதிய பொறுப்பு" },
  { value: "business_start", en: "Start a new business", ta: "புதிய தொழில் தொடங்குதல்" },
  { value: "marriage", en: "Marriage ceremony", ta: "திருமண நிகழ்வு" },
  { value: "education", en: "Exam / Course start", ta: "தேர்வு / படிப்பு தொடக்கம்" },
  { value: "property", en: "Property purchase / registration", ta: "சொத்து வாங்கல் / பதிவு" },
  { value: "money", en: "Investment or major financial decision", ta: "முதலீடு / நிதி முடிவு" },
  { value: "travel", en: "Travel abroad or long journey", ta: "வெளிநாடு / நீண்ட பயணம்" },
  { value: "health", en: "Medical procedure or surgery", ta: "மருத்துவ சிகிச்சை / அறுவை" },
  { value: "spiritual", en: "Grihapravesh or religious event", ta: "புதுமனை புகு விழா / ஆன்மிக நிகழ்வு" },
  { value: "child", en: "Child birth or naming ceremony", ta: "குழந்தை பிறப்பு / பெயரிடல்" },
  { value: "other", en: "General auspicious day", ta: "பொதுவான நல்ல நாள்" },
];

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "var(--color-faint)",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
} as const;

const fieldStyle: React.CSSProperties = {
  borderRadius: "var(--radius-md)",
  border: `1.5px solid ${W.borderLt}`,
  background: W.card,
  color: W.inkMid,
  fontSize: "0.875rem",
  padding: "var(--space-2) var(--space-2_5)",
  fontFamily: "inherit",
};

export function DashboardPlanTab({
  lang,
  chartId,
  hasBirthProfile,
  goals,
  goalsBusy,
  addingGoalType,
  onAddingGoalTypeChange,
  removingGoalId,
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
  mode = "BALANCED",
}: DashboardPlanTabProps) {
  type PlanSubTab = "goals" | "whatif" | "muhurta" | "decisions";
  const [planSubTab, setPlanSubTab] = useState<PlanSubTab>("goals");
  const PLAN_SUB_TABS: { key: PlanSubTab; label: string }[] = [
    { key: "goals", label: lang === "ta" ? "இலக்குகள்" : "Goals" },
    { key: "whatif", label: lang === "ta" ? "என்ன ஆகும்?" : "What-If" },
    { key: "muhurta", label: lang === "ta" ? "சிறந்த நாள் & முஹூர்த்தம்" : "Best Dates & Muhurta" },
    { key: "decisions", label: lang === "ta" ? "முடிவுகள்" : "Decisions" },
  ];

  // Best Dates (activity timing) state — lives inside the Muhurta sub-tab
  const [activityType, setActivityType] = useState(ACTIVITY_OPTIONS[0].value);
  const [activityMonth, setActivityMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activityTimingResult, setActivityTimingResult] = useState<ActivityTimingData | null>(null);
  const [activityTimingBusy, setActivityTimingBusy] = useState(false);

  // Muhurta picker pre-fill state — set when user clicks "→ Check Muhurta" on a Best Dates result
  const [muhurtaPresetDate, setMuhurtaPresetDate] = useState<string | undefined>(undefined);
  const [muhurtaPresetActivity, setMuhurtaPresetActivity] = useState<string | undefined>(undefined);

  // Map Best Dates activity values → Muhurta picker activity IDs
  const ACTIVITY_TO_MUHURTA: Record<string, string> = {
    job_change: "JOB_START",
    business_start: "JOB_START",
    marriage: "MARRIAGE",
    education: "EXAM",
    property: "PURCHASE",
    money: "INVESTMENT",
    travel: "TRAVEL",
    health: "MEDICAL",
    spiritual: "SPIRITUAL",
    child: "SPIRITUAL",
    other: "",
  };

  if (!hasBirthProfile) {
    return (
      <div style={{ padding: "var(--space-4)", borderRadius: "var(--radius-md)", border: `1px dashed ${W.border}`, background: W.surface, color: W.muted, fontSize: "0.875rem" }}>
        {lang === "ta" ? "முதலில் உங்கள் ஜாதக விவரங்களை சேர்க்கவும்." : "Add your birth profile first to use planning tools."}
      </div>
    );
  }

  const verdictColor = (v: string) => (v === "FAVOURABLE" ? "#5C7654" : v === "CAUTION" ? "#A8482F" : "#B85A2C");
  const verdictKey = (v: string) => (v === "FAVOURABLE" ? "verdict_favourable" : v === "CAUTION" ? "verdict_caution" : "verdict_neutral");
  const strengthColor = (s: string) => (s === "STRONG" ? "#5C7654" : s === "WEAK" ? "#A8482F" : "#B85A2C");
  const strengthKey = (s: string) => (s === "STRONG" ? "strength_strong" : s === "WEAK" ? "strength_weak" : "strength_moderate");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4_5)", color: W.inkMid, fontFamily: "var(--font-body)" }}>
      <div
        style={{
          borderRadius: "var(--radius-lg)",
          border: `1px solid ${W.borderLt}`,
          background: `linear-gradient(135deg, ${W.surface} 0%, ${W.card} 70%)`,
          padding: "var(--space-5) var(--space-5_5)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <div>
          <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: W.terracotta }}>
            {t("tab_plan", lang)}
          </p>
          <h2 style={{ margin: "0 0 var(--space-1_5)", fontFamily: "var(--font-display)", fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)", letterSpacing: "-0.02em", color: W.ink }}>
            {lang === "ta" ? "திட்டமிடு" : "Plan with confidence"}
          </h2>
          <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted, lineHeight: 1.55, maxWidth: "62ch" }}>
            {lang === "ta"
              ? "உங்கள் இலக்குகளை அமைக்கவும், முடிவுகளை பரிசோதிக்கவும், சிறந்த தேதிகளை கண்டறியவும்."
              : "Set goals, simulate outcomes, and pick high-support dates for important moves."}
          </p>
        </div>

        {goals.length > 0 && (
          <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {lang === "ta" ? "உங்கள் இலக்கு:" : "Focus"}
            </span>
            {goals.map((g) => (
              <span key={g.goalId} style={{ fontSize: "0.75rem", padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", background: "#F0D9C4", border: "1px solid rgba(184,90,44,0.28)", color: "#8C3E18", fontWeight: 600 }}>
                {GOAL_OPTIONS.find(([v]) => v === normalizeGoalType(g.goalType))?.[1]
                  ? t(GOAL_OPTIONS.find(([v]) => v === normalizeGoalType(g.goalType))![1], lang)
                  : g.goalType}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="cd-responsive-pills" style={{ gap: "var(--space-1_5)" }}>
        {PLAN_SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPlanSubTab(key)}
            style={{
              padding: "var(--space-1_5) var(--space-3_5)",
              borderRadius: "var(--radius-pill)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              border: `1.5px solid ${planSubTab === key ? W.ink : W.border}`,
              background: planSubTab === key ? W.ink : "transparent",
              color: planSubTab === key ? W.surfaceMd : W.muted,
              fontFamily: "inherit",
              transition: "all 0.12s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {planSubTab === "goals" && (
        <Surface title={t("goals_panel_title", lang)}>
          <div className="surface__body">
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.875rem", color: W.muted, lineHeight: 1.5 }}>{t("goals_panel_desc", lang)}</p>

            {goals.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3_5)" }}>
                {goals.map((g) => (
                  <div key={g.goalId} style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", padding: "var(--space-1) var(--space-2_5)", borderRadius: "var(--radius-pill)", background: "#F0D9C4", border: "1px solid rgba(184,90,44,0.35)", fontSize: "0.875rem", color: "#8C3E18", fontWeight: 600 }}>
                    <span>
                      {GOAL_OPTIONS.find(([v]) => v === normalizeGoalType(g.goalType))?.[1]
                        ? t(GOAL_OPTIONS.find(([v]) => v === normalizeGoalType(g.goalType))![1], lang)
                        : g.goalType}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveGoal(g.goalId)}
                      disabled={removingGoalId === g.goalId}
                      style={{ background: "none", border: "none", cursor: "pointer", color: W.muted, padding: "0 0 0 var(--space-0_5)", fontSize: "0.75rem", lineHeight: 1 }}
                    >
                      {removingGoalId === g.goalId ? "..." : "x"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {goals.length > 0 && (
              <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#EEF6EA", border: "1px solid rgba(92,118,84,0.2)", marginBottom: "var(--space-3)" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#5C7654", lineHeight: 1.5 }}>
                  {lang === "ta"
                    ? "உங்கள் இலக்குகள் வாழ்க்கை பகுதிகளில் முன்னிலைப்படுத்தப்படும்; முக்கிய விஷயங்கள் தெளிவாக தெரியும்."
                    : "Your goals are highlighted in Life Areas and Daily Snapshot tabs, so the most relevant areas stand out."}
                </p>
              </div>
            )}

            {/* Methodology note for Goals "Supportive windows" score */}
            {goals.length > 0 && (
              <div style={{ padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#EEF1F8", border: "1px solid rgba(122,111,94,0.18)", marginBottom: "var(--space-3)" }}>
                <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.5 }}>
                  <strong style={{ color: W.inkMid }}>
                    {lang === "ta" ? "இந்த மதிப்பெண் என்ன காட்டுகிறது:" : "What these scores measure:"}
                  </strong>
                  {" "}
                  {lang === "ta"
                    ? "இந்த காலங்கள் பல வாரங்கள் அல்லது மாதங்களில் தசை ஆதரவை அளவிடுகின்றன — 'இந்த காலத்தில் தசை இந்த இலக்கை ஆதரிக்கிறதா?' என்ற கேள்விக்கு பதில். ஒரு குறிப்பிட்ட தேதிக்கு What-If கருவியை பயன்படுத்தவும்; அது தசை + கிரகநகர்வு + பிறப்பு ஜாதகம் மூன்றையும் சேர்த்து பார்க்கும்."
                    : "These windows measure long-term Dasha support over weeks or months — answering 'does this period's planetary period support this goal?' For a specific date, use What-If (it triple-checks natal promise + Dasha + transit for that exact day). The two scores naturally differ because they measure different things."}
                </p>
              </div>
            )}

            {/* Goal-specific timing — one EventWindowsPanel per unique event type */}
            {goals.length > 0 && chartId && (() => {
              // Group goals by their mapped event type; render one panel per event type
              const seenEvents = new Set<string>();
              const panels: React.ReactNode[] = [];
              for (const g of goals) {
                const norm = normalizeGoalType(g.goalType);
                const mappedEvent = GOAL_EVENT_MAP[norm];
                const goalLabel = GOAL_OPTIONS.find(([v]) => v === norm)?.[1];
                if (!mappedEvent) {
                  panels.push(
                    <div key={`goal-guide-${g.goalId}`} style={{ padding: "var(--space-3_5)", borderRadius: "var(--radius-md)", border: `1px solid ${W.borderLt}`, background: W.card }}>
                      <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.75rem", fontWeight: 700, color: W.terracotta, letterSpacing: "0.04em" }}>
                        {goalLabel ? t(goalLabel, lang) : g.goalType}
                        {" · "}
                        {lang === "ta" ? "ஆதரவான காலங்கள்" : "Supportive windows"}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.8125rem", color: W.muted, lineHeight: 1.5 }}>
                        {lang === "ta"
                          ? "இந்த இலக்கிற்கு, ‘சிறந்த தேதி’ மற்றும் ‘முஹூர்த்தம்’ தாவல்களில் உகந்த தேதிகளைக் கண்டறியவும்."
                          : "For this goal, use the ‘What-if’ and ‘Muhurta’ tabs to find favourable dates tailored to your chart."}
                      </p>
                    </div>
                  );
                } else if (!seenEvents.has(mappedEvent)) {
                  seenEvents.add(mappedEvent);
                  // Collect all goals sharing this event type for the label
                  const sharedGoalLabels = goals
                    .filter((og) => GOAL_EVENT_MAP[normalizeGoalType(og.goalType)] === mappedEvent)
                    .map((og) => {
                      const lk = GOAL_OPTIONS.find(([v]) => v === normalizeGoalType(og.goalType))?.[1];
                      return lk ? t(lk, lang) : og.goalType;
                    });
                  panels.push(
                    <div key={`goal-guide-${mappedEvent}`} style={{ padding: "var(--space-3_5)", borderRadius: "var(--radius-md)", border: `1px solid ${W.borderLt}`, background: W.card }}>
                      <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.75rem", fontWeight: 700, color: W.terracotta, letterSpacing: "0.04em" }}>
                        {sharedGoalLabels.join(" · ")}
                        {" · "}
                        {lang === "ta" ? "ஆதரவான காலங்கள்" : "Supportive windows"}
                      </p>
                      <EventWindowsPanel lang={lang} chartId={chartId} onlyEvent={mappedEvent} autoLoad />
                    </div>
                  );
                }
              }
              return <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3_5)", marginBottom: "var(--space-3_5)" }}>{panels}</div>;
            })()}

            {goals.length === 0 && <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.75rem", color: W.muted }}>{t("goals_empty", lang)}</p>}

            {goals.length < 3 && (
              <div className="cd-responsive-actions" style={{ gap: "var(--space-2)" }}>
                <select style={{ ...fieldStyle, flex: "1 1 180px", maxWidth: "260px" }} value={addingGoalType || "job_change"} onChange={(e) => onAddingGoalTypeChange(e.target.value)}>
                  {GOAL_OPTIONS.map(([val, key]) => (
                    <option key={val} value={val}>
                      {t(key, lang)}
                    </option>
                  ))}
                </select>
                <Button onClick={() => onAddGoal(addingGoalType || "job_change")} disabled={goalsBusy} variant="primary">
                  {goalsBusy ? t("goals_adding", lang) : t("goals_add", lang)}
                </Button>
              </div>
            )}
          </div>
        </Surface>
      )}

      {planSubTab === "whatif" && (
        <Surface title={t("whatif_panel_title", lang)}>
          <div className="surface__body">
            <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.875rem", color: W.muted, lineHeight: 1.5 }}>{t("whatif_panel_desc", lang)}</p>
            <div style={{ padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#EEF1F8", border: "1px solid rgba(122,111,94,0.18)", marginBottom: "var(--space-3_5)" }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.5 }}>
                <strong style={{ color: W.inkMid }}>
                  {lang === "ta" ? "இந்த மதிப்பெண் என்ன காட்டுகிறது:" : "What this score measures:"}
                </strong>
                {" "}
                {lang === "ta"
                  ? "நீங்கள் தேர்ந்தெடுத்த குறிப்பிட்ட தேதிக்கு மூன்று-உறுதிப்படுத்தல் பகுப்பாய்வு — பிறப்பு ஜாதக வாக்குறுதி + தசை ஆதரவு + கிரகநகர்வு நிலை ஒரே நேரத்தில் சரிபார்க்கப்படும். இது 'Goals' தாவலில் உள்ள மதிப்பெண்ணிலிருந்து வேறுபடும் — அது பல மாத தசை ஆதரவை அளவிடுகிறது; இது ஒரு குறிப்பிட்ட நாளை அளவிடுகிறது."
                  : "Triple-confirmation analysis for the exact date you chose — natal promise, Dasha support, and transit positions are all checked simultaneously. This will naturally differ from Goals window scores because Goals measures multi-month Dasha alignment, while What-If measures one specific day."}
              </p>
            </div>

            <div className="cd-responsive-row" style={{ gap: "var(--space-2_5)", alignItems: "flex-end", marginBottom: "var(--space-3_5)" }}>
              <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt }}>{t("whatif_scenario", lang)}</span>
                <select style={{ ...fieldStyle, minWidth: "220px" }} value={whatIfScenario} onChange={(e) => onWhatIfScenarioChange(e.target.value)}>
                  {WHATIF_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {lang === "ta" ? opt.ta : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt }}>{t("whatif_date", lang)}</span>
                <input style={fieldStyle} type="date" value={whatIfDate} onChange={(e) => onWhatIfDateChange(e.target.value)} />
              </div>

              <Button onClick={onRunWhatIf} disabled={whatIfBusy || !whatIfDate} variant="primary">
                {whatIfBusy ? t("whatif_running", lang) : t("whatif_run", lang)}
              </Button>
            </div>

            {whatIfError && <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.875rem", color: "#A8482F" }}>{whatIfError}</p>}

            {whatIfResult && (() => {
              const r = whatIfResult;
              const vc = verdictColor(r.verdict);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "2.2rem", fontWeight: 900, color: vc, lineHeight: 1 }}>{r.overallScore}</p>
                      <p style={{ margin: 0, fontSize: "0.625rem", color: W.mutedLt, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>/100</p>
                    </div>
                    <div style={{ padding: "var(--space-1_5) var(--space-3_5)", borderRadius: "var(--radius-sm)", background: `${vc}18`, border: `1px solid ${vc}55` }}>
                      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 800, color: vc }}>{t(verdictKey(r.verdict) as Parameters<typeof t>[0], lang)}</p>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.875rem", color: W.inkMid, lineHeight: 1.6 }}>{lang === "ta" ? r.summary.ta : r.summary.en}</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {t("whatif_result_title", lang)}
                    </p>
                    {([
                      [t("whatif_natal", lang), r.tripleConfirmation.natalPromise, r.tripleConfirmation.natalPromiseStrength],
                      [t("whatif_dasha", lang), r.tripleConfirmation.dashaSupport, r.tripleConfirmation.dashaSupportStrength],
                      [t("whatif_gochar", lang), r.tripleConfirmation.gocharSupport, r.tripleConfirmation.gocharSupportStrength],
                    ] as [string, string, string][]).map(([label, text, strength]) => (
                      <div key={label} style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: W.card, border: `1px solid ${W.borderLt}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-1)" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt }}>{label}</span>
                          <span style={{ fontSize: "0.625rem", fontWeight: 700, color: strengthColor(strength) }}>
                            {t(strengthKey(strength) as Parameters<typeof t>[0], lang)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: W.inkMid, lineHeight: 1.5 }}>{text}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#EEF6EA", border: "1px solid rgba(92,118,84,0.2)" }}>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: "#5C7654" }}>{t("whatif_best_period", lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: W.inkMid, lineHeight: 1.5 }}>{lang === "ta" ? r.bestPeriodInWindow.ta : r.bestPeriodInWindow.en}</p>
                  </div>

                  <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#F6EFE2", border: "1px solid rgba(184,90,44,0.2)" }}>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: "#B85A2C" }}>{t("whatif_caution", lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: W.inkMid, lineHeight: 1.5 }}>{lang === "ta" ? r.cautionNote.ta : r.cautionNote.en}</p>
                  </div>

                  <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#F6EFE2", border: "1px solid rgba(184,90,44,0.25)" }}>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, color: "#B85A2C" }}>{t("whatif_remedy", lang)}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: W.inkMid, lineHeight: 1.5 }}>{lang === "ta" ? r.remedy.ta : r.remedy.en}</p>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.5, fontStyle: "italic" }}>
                    {t("whatif_disclaimer", lang)}: {lang === "ta" ? r.disclaimer.ta : r.disclaimer.en}
                  </p>
                </div>
              );
            })()}
          </div>
        </Surface>
      )}

      {planSubTab === "decisions" && mode !== "BEGINNER" && (
        <Surface title={t("decision_panel_title", lang)}>
          <div className="surface__body">
            <div style={{ margin: "0 0 var(--space-3_5)", padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-sm)", background: "#EEF1F8", border: "1px solid rgba(122,111,94,0.2)" }}>
              <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.75rem", fontWeight: 700, color: W.inkMid, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {t("decision_support_what_label", lang)}
              </p>
              <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.875rem", color: W.inkMid, lineHeight: 1.5 }}>{t("decision_support_explainer", lang)}</p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.45, borderTop: `1px solid ${W.borderLt}`, paddingTop: "var(--space-2)" }}>
                <strong style={{ color: W.inkMid }}>{t("decision_vs_whatif_label", lang)}</strong> {t("decision_vs_whatif_body", lang)}
              </p>
            </div>
            <DecisionPanel lang={lang} chartId={chartId} />
          </div>
        </Surface>
      )}

      {planSubTab === "muhurta" && (
        <>
          {/* ── Step 1: Find the best dates ───────────────────────────── */}
          <Surface title={lang === "ta" ? "படி 1 — சிறந்த நாட்கள் கண்டறிய (விரைவு மாத கண்ணோட்டம்)" : "Step 1 — Find Best Dates (quick month scan)"}>
            <div className="surface__body">
              <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.75rem", color: W.muted, lineHeight: 1.5 }}>
                {lang === "ta"
                  ? "மாதம் முழுவதையும் விரைவாக ஆராய்ந்து, தசை + கிரகநகர்வு + பஞ்சாங்க தினத்தன்மை கொண்டு சிறந்த நாட்களைத் தேர்ந்தெடுக்கிறது. தேர்ந்த நாளை கிளிக் செய்யுங்கள் — படி 2 தானாக நிரம்பும்; அங்கே சரியான நேரத்தை கண்டறியலாம்."
                  : "Scans the whole month and picks the days with the best dasha + transit + day-quality alignment for your activity. Click any date to prefill Step 2, where you find the exact auspicious hour within that day."}
              </p>
              <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.72rem", color: W.muted, lineHeight: 1.45, padding: "var(--space-1_5) var(--space-2_5)", borderRadius: "var(--radius-sm)", background: "#EEF1F8", border: `1px solid rgba(122,111,94,0.18)` }}>
                {lang === "ta"
                  ? "படி 1 — 'எந்த நாள் நல்லது?' என்று சொல்கிறது. படி 2 — 'அந்த நாளில் எந்த நேரம் சிறந்தது?' என்று கண்டறிகிறது. இரண்டும் வேறு அளவீடுகளை பயன்படுத்துவதால் வெவ்வேறு தேதி/மதிப்பெண் காட்டலாம் — இது சரியானதே."
                  : "Step 1 answers 'which days are good?' Step 2 answers 'what is the best hour on a given day?' They use different criteria (day-level vs hour-level panchangam), so their scores and top dates will not always match — that is expected and correct."}
              </p>
              <div className="cd-responsive-row" style={{ gap: "var(--space-2_5)", alignItems: "flex-end", marginBottom: "var(--space-3)" }}>
                <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt }}>{t("activity_label", lang)}</span>
                  <select style={{ ...fieldStyle, minWidth: "240px" }} value={activityType} onChange={(e) => { setActivityType(e.target.value); setActivityTimingResult(null); }}>
                    {ACTIVITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {lang === "ta" ? opt.ta : opt.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="cd-responsive-form-block" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt }}>{t("activity_month_label", lang)}</span>
                  <input style={{ ...fieldStyle, minWidth: "140px" }} type="month" value={activityMonth} onChange={(e) => { setActivityMonth(e.target.value); setActivityTimingResult(null); }} />
                </div>
                <button
                  type="button"
                  disabled={activityTimingBusy}
                  onClick={() => {
                    setActivityTimingBusy(true);
                    apiFetchJson<{ success: boolean; data: ActivityTimingData }>(
                      `/api/v1/activity-timing${toQuery({ chartId, activity: activityType, month: activityMonth })}`,
                    )
                      .then((r) => setActivityTimingResult(r.data))
                      .catch(() => {})
                      .finally(() => setActivityTimingBusy(false));
                  }}
                  style={{ padding: "var(--space-2) var(--space-4_5)", borderRadius: "var(--radius-md)", border: `1px solid ${W.ink}`, cursor: activityTimingBusy ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.875rem", background: activityTimingBusy ? W.borderLt : W.ink, color: activityTimingBusy ? W.mutedLt : W.surfaceMd, fontFamily: "inherit" }}
                >
                  {activityTimingBusy ? t("btn_finding", lang) : t("btn_find_best_dates", lang)}
                </button>
              </div>

              {activityTimingResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.75rem", color: W.muted }}>
                    {lang === "ta"
                      ? "ஒரு தேதியை கிளிக் செய்யுங்கள் — படி 2 அந்த நாள் மட்டும் சரிபார்த்து சரியான நேரம் (முஹூர்த்தம்) காட்டும்."
                      : "Click a date to search only that day in Step 2 and find the best auspicious hour within it."}
                  </p>
                  {activityTimingResult.topDates.map((item, i) => {
                    const isSelected = muhurtaPresetDate === item.dateLocal;
                    const alignColor = item.alignment === "SUPPORTS" ? "#5C7654" : item.alignment === "CAUTION" ? "#A8482F" : "#B85A2C";
                    const alignBg = item.alignment === "SUPPORTS" ? "rgba(92,118,84,0.12)" : item.alignment === "CAUTION" ? "rgba(168,72,47,0.12)" : "rgba(184,90,44,0.12)";
                    const scoreColor = item.score >= 70 ? "#5C7654" : item.score >= 50 ? "#B85A2C" : "#A8482F";
                    let weekday = "";
                    try { weekday = new Date(item.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" }); } catch { /**/ }
                    let shortDate = "";
                    try { shortDate = new Date(item.dateLocal + "T12:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { shortDate = item.dateLocal; }
                    return (
                      <div
                        key={item.dateLocal}
                        style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)", background: isSelected ? "#EEF6EA" : W.card, border: `1.5px solid ${isSelected ? "rgba(92,118,84,0.5)" : W.borderLt}`, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "var(--space-3)", alignItems: "center", cursor: "pointer", transition: "all 0.12s" }}
                        onClick={() => {
                          setMuhurtaPresetDate(item.dateLocal);
                          setMuhurtaPresetActivity(ACTIVITY_TO_MUHURTA[activityType] ?? "");
                        }}
                      >
                        {/* Rank + score column */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "44px" }}>
                          <span style={{ fontSize: "0.5625rem", fontWeight: 700, color: W.mutedLt }}>{i + 1}.</span>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{item.score}</span>
                          <span style={{ fontSize: "0.5rem", fontWeight: 600, color: W.mutedLt }}>/100</span>
                        </div>
                        {/* Date + reason column */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: scoreColor }}>{shortDate}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: W.muted }}>{weekday}</span>
                            <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-pill)", background: alignBg, color: alignColor, border: `1px solid ${alignColor}44` }}>
                              {item.alignment}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: "0.8125rem", color: W.inkMid, lineHeight: 1.5 }}>{lang === "ta" ? item.reasonTa : item.reasonEn}</p>
                        </div>
                        {/* CTA */}
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isSelected ? "#5C7654" : W.muted, flexShrink: 0, whiteSpace: "nowrap" }}>
                          {lang === "ta" ? "முஹூர்த்தம் →" : "Get Muhurta →"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Surface>

          {/* ── Step 2: Muhurta time-slot picker ─────────────────────── */}
          <div style={{ marginTop: "var(--space-1)" }}>
            <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {lang === "ta" ? "படி 2 — சரியான நேரம் கண்டறிய (முஹூர்த்தம்)" : "Step 2 — Find the right hour (Muhurta)"}
            </p>
            <DashboardMuhurtaPicker
              lang={lang}
              chartId={chartId || null}
              initialDateFrom={muhurtaPresetDate}
              initialActivity={muhurtaPresetActivity}
            />
          </div>
        </>
      )}

      {planSubTab === "goals" && <DashboardLifeEventLog lang={lang} chartId={chartId || null} />}
    </div>
  );
}
