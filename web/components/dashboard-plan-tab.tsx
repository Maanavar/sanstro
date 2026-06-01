"use client";

import { useState } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ActivityTimingData, GoalData, WhatIfData } from "@/lib/types";

import { Button, Chip, Surface } from "./dashboard-ui";
import { DecisionPanel } from "./dashboard-decision-panel";
import { DashboardMuhurtaPicker } from "./dashboard-muhurta-picker";
import { DashboardLifeEventLog } from "./dashboard-life-event-log";

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
  { value: "spiritual", en: "Spiritual initiation or pilgrimage", ta: "ஆன்மீக தீட்சை / தீர்த்தயாத்திரை" },
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
  { value: "spiritual", en: "Grihapravesh or religious event", ta: "கிரகப்பிரவேசம் / மதகார்யம்" },
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
  type PlanSubTab = "goals" | "whatif" | "timing" | "muhurta" | "decisions";
  const [planSubTab, setPlanSubTab] = useState<PlanSubTab>("goals");
  const PLAN_SUB_TABS: { key: PlanSubTab; label: string }[] = [
    { key: "goals", label: lang === "ta" ? "இலக்குகள்" : "Goals" },
    { key: "whatif", label: lang === "ta" ? "என்ன ஆகும்?" : "What-If" },
    { key: "timing", label: lang === "ta" ? "சிறந்த நாட்கள்" : "Best Dates" },
    { key: "muhurta", label: lang === "ta" ? "முஹூர்த்தம்" : "Muhurta" },
    { key: "decisions", label: lang === "ta" ? "முடிவுகள்" : "Decisions" },
  ];

  const [activityType, setActivityType] = useState(ACTIVITY_OPTIONS[0].value);
  const [activityMonth, setActivityMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [activityTimingResult, setActivityTimingResult] = useState<ActivityTimingData | null>(null);
  const [activityTimingBusy, setActivityTimingBusy] = useState(false);

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

      <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
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

            {goals.length === 0 && <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.75rem", color: W.muted }}>{t("goals_empty", lang)}</p>}

            {goals.length < 3 && (
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
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
            <p style={{ margin: "0 0 var(--space-3_5)", fontSize: "0.875rem", color: W.muted, lineHeight: 1.5 }}>{t("whatif_panel_desc", lang)}</p>

            <div style={{ display: "flex", gap: "var(--space-2_5)", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "var(--space-3_5)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt }}>{t("whatif_scenario", lang)}</span>
                <select style={{ ...fieldStyle, minWidth: "220px" }} value={whatIfScenario} onChange={(e) => onWhatIfScenarioChange(e.target.value)}>
                  {WHATIF_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {lang === "ta" ? opt.ta : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
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

      {planSubTab === "timing" && (
        <Surface title={t("activity_timing_label", lang)}>
          <div className="surface__body">
            <div style={{ display: "flex", gap: "var(--space-2_5)", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "var(--space-3_5)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt }}>{t("activity_label", lang)}</span>
                <select style={{ ...fieldStyle, minWidth: "240px" }} value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {lang === "ta" ? opt.ta : opt.en}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt }}>{t("activity_month_label", lang)}</span>
                <input style={{ ...fieldStyle, minWidth: "140px" }} type="month" value={activityMonth} onChange={(e) => setActivityMonth(e.target.value)} />
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
                style={{
                  padding: "var(--space-2) var(--space-4_5)",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${W.ink}`,
                  cursor: activityTimingBusy ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  background: activityTimingBusy ? W.borderLt : W.ink,
                  color: activityTimingBusy ? W.mutedLt : W.surfaceMd,
                  fontFamily: "inherit",
                }}
              >
                {activityTimingBusy ? t("btn_finding", lang) : t("btn_find_best_dates", lang)}
              </button>
            </div>

            {activityTimingResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {activityTimingResult.topDates.map((item, i) => (
                  <div key={item.dateLocal} style={{ padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: W.card, border: `1px solid ${W.borderLt}`, display: "flex", gap: "var(--space-2_5)", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt, minWidth: "16px" }}>{i + 1}.</span>
                    <div>
                      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", marginBottom: "var(--space-0_75)", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: W.inkMid }}>{item.dateLocal}</span>
                        <Chip tone={item.score >= 70 ? "success" : item.score >= 50 ? "neutral" : "warning"}>{item.score}/100</Chip>
                        <span style={{ fontSize: "0.75rem", color: W.muted }}>{item.alignment}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted, lineHeight: 1.4, fontStyle: "italic" }}>{lang === "ta" ? item.reasonTa : item.reasonEn}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          <div style={{ padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-sm)", background: W.surface, border: `1px solid ${W.borderLt}`, marginBottom: "var(--space-3)" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: W.muted, lineHeight: 1.55 }}>
              {lang === "ta"
                ? "குறிப்பிட்ட நிகழ்வுகளுக்கான சிறந்த நேரம் மற்றும் திதி-நட்சத்திர பொருத்தம் இங்கே காணலாம்."
                : "Find the best hour-precise time slot for a specific ceremony or event, checked against panchangam, dasha, and kalam."}
            </p>
          </div>
          <DashboardMuhurtaPicker lang={lang} chartId={chartId || null} />
        </>
      )}

      {planSubTab === "goals" && <DashboardLifeEventLog lang={lang} chartId={chartId || null} />}
    </div>
  );
}
