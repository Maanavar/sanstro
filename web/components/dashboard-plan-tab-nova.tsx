"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  BiText,
  EventWindowItem,
  GoalData,
  WhatIfData,
} from "@/lib/types";

import {
  GOAL_EVENT_MAP,
  GOAL_OPTIONS,
  normalizeGoalType,
  PlanEventsPanel,
} from "./dashboard-plan-shared";
import type { EventType } from "./dashboard-event-windows";
import { humaniseReason } from "./dashboard-event-windows";
import { novaDetailCardStyle } from "./dashboard-explore-detail-nova";
import { NovaLifeEventLogCard } from "./dashboard-plan-life-event-log-nova";
import { NovaPlanWhatIfPanel } from "./dashboard-plan-whatif-nova";
import { NovaPlanMuhurtaPanel } from "./dashboard-plan-muhurta-nova";
import { NovaPlanDecisionsPanel } from "./dashboard-plan-decisions-nova";
import { NovaSelect } from "./nova-select";

/**
 * Nova Goals tab (nav id `"plan"`, labelled "Goals" in the top strip) —
 * Phase 10 of the dashboard revamp, mapped from the mockup's `plan` screen
 * (docs/DASHBOARD_UI_REVAMP_PLAN.md §6.9). A full tab-level screen (own
 * 5-way sub-nav) like Life Areas' Nova tab — not a "detail drill-down", so
 * no shared shell with dashboard-explore-detail-nova.tsx applies beyond its
 * genuinely generic `novaDetailCardStyle` card container.
 *
 * Transits & Dasha (dashboard-plan-transits-nova.tsx's `NovaTransitsView`,
 * §6.10) used to be a second view toggled inside this same tab; it is now
 * its own top-level nav destination (nav id `"transits"`) — the "See the
 * dasa timeline →" link below navigates there via `onGoToTransits` rather
 * than switching an in-tab view.
 *
 * The mockup's static export only expands the "Goals" pill (same
 * one-sub-tab-captured pattern as Phase 9's Life Areas Overview) — Life
 * Events / What-If / Best Dates & Muhurta / Decisions were deliberately
 * deferred (Classic-styled) when this phase first shipped, reusing the
 * same Classic JSX Classic's own tab already rendered for those sub-tabs,
 * extracted at the time into standalone exported components
 * (`PlanEventsPanel`/`PlanWhatIfPanel`/`PlanMuhurtaPanel`/
 * `PlanDecisionsPanel` in dashboard-plan-tab.tsx) so both Classic and Nova
 * could render them without duplicating ~250 lines of stateful JSX — a
 * mechanical, behavior-preserving refactor, not a rewrite.
 *
 * Re-skinned in a later pass (2026-07-06, see Progress Log and the new
 * §6.9.1): `PlanEventsPanel` turned out already Nova-safe (its embedded
 * `DashboardLifeEvents` styles entirely via CSS classes written dark-theme-
 * first, `var(--color-text)`-driven with translucent-white overlays, not
 * Classic's warm-cream tokens) and is still reused verbatim, unchanged. The
 * other 3 needed fresh Nova-token rebuilds — `dashboard-plan-whatif-nova.tsx`
 * (`NovaPlanWhatIfPanel`), `dashboard-plan-decisions-nova.tsx`
 * (`NovaPlanDecisionsPanel`), and `dashboard-plan-muhurta-nova.tsx`
 * (`NovaPlanMuhurtaPanel`, which itself wraps two more fresh rebuilds of
 * the heavier widgets it embeds — `dashboard-plan-muhurta-picker-nova.tsx`
 * and `dashboard-plan-muhurtham-naal-nova.tsx`).
 *
 * The "Goals" content itself is a real re-skin plus two genuinely new
 * pieces built on data that already existed:
 * - "Nearest supportive window" hero card — derived by re-fetching the
 *   same `/api/v1/charts/{id}/event-windows` endpoint `EventWindowsPanel`
 *   already calls (backend returns windows sorted by score, not
 *   chronologically — re-sorted client-side here to find the nearest
 *   upcoming/active one), for the first goal-mapped event type. No new
 *   astrology: the "which planet's dasa" headline is only shown when one
 *   of the window's fired reason codes explicitly names a planet
 *   (`mercury_dasha_active` etc.) — the API never serializes the actual
 *   10th/7th/2nd/11th *relative* lord's identity, so that generic case is
 *   left unnamed rather than guessed.
 * - "Supportive windows" list — same data, grouped per unique goal-mapped
 *   event type exactly like Classic's existing `seenEvents` grouping,
 *   sorted chronologically (nearest first) rather than by score, since
 *   this is a planning tool ("what's coming up") not a leaderboard.
 * - "Life event log" card — `NovaLifeEventLogCard`, a fresh-Nova-token
 *   rebuild of Classic's `DashboardLifeEventLog` (same API calls), not a
 *   gap-fix — that file's `W` token palette was the same class flagged
 *   unsafe-to-redirect by the 2026-07-06 browser QA round.
 *
 * Mockup's "Remind me →" per-window link is a genuine stub — grepped for
 * any per-event/per-date reminder mechanism; the only existing "reminder"
 * feature (`dashboard-personal-overview.tsx`'s "Save reminder" button) is
 * a recurring daily morning-notification toggle, not a schedule-a-future-
 * date reminder. Omitted, same precedent as Phase 1's "Add to my day"/
 * Phase 4's "Plan together".
 */

type PlanSubTab = "goals" | "events" | "whatif" | "muhurta" | "decisions";

const PLAN_SUB_TABS: { key: PlanSubTab; en: string; ta: string }[] = [
  { key: "goals", en: "Goals", ta: "இலக்குகள்" },
  { key: "events", en: "Life Events", ta: "வாழ்க்கை நிகழ்வுகள்" },
  { key: "whatif", en: "What-If", ta: "என்ன ஆகும்?" },
  { key: "muhurta", en: "Best Dates & Muhurta", ta: "சிறந்த நாள் & முஹூர்த்தம்" },
  { key: "decisions", en: "Decisions", ta: "முடிவுகள்" },
];

// Only these reason codes name an actual planet directly — the "Nth-house
// lord" reasons (e.g. `10th_lord_dasha_active`) are relative to the chart's
// lagna and the API never serializes which planet that resolves to, so
// they're deliberately left out of this map rather than guessed.
const NAMED_LORD_REASON: Record<string, string> = {
  mercury_dasha_active: "MERCURY",
  sun_dasha_active: "SUN",
  venus_dasha_active: "VENUS",
  jupiter_dasha_active: "JUPITER",
};

function namedLordFromReasons(reasons: string[]): string | null {
  for (const r of reasons) {
    if (NAMED_LORD_REASON[r]) return NAMED_LORD_REASON[r];
  }
  return null;
}

const EVENT_ADVICE: Record<EventType, { future: BiText; active: BiText }> = {
  CAREER: {
    future: {
      en: "Until then: prepare, build skills, and save — this isn't the moment to leap.",
      ta: "அதுவரை: திறன்களை வளர்த்து, சேமித்து தயாராகுங்கள் — இது பாய்ச்சல் செய்யும் நேரம் அல்ல.",
    },
    active: {
      en: "A supportive stretch for career moves — a reasonable window to act.",
      ta: "தொழில் முடிவுகளுக்கு ஆதரவான காலம் — செயல்பட ஏற்ற நேரம்.",
    },
  },
  MARRIAGE: {
    future: {
      en: "Until then: focus on compatibility, savings, and family conversations.",
      ta: "அதுவரை: பொருத்தம், சேமிப்பு, குடும்ப உரையாடல்களில் கவனம் செலுத்துங்கள்.",
    },
    active: {
      en: "A supportive stretch for marriage or relationship decisions.",
      ta: "திருமணம் அல்லது உறவு முடிவுகளுக்கு ஆதரவான காலம்.",
    },
  },
  FINANCE: {
    future: {
      en: "Until then: research and plan, and build reserves rather than committing.",
      ta: "அதுவரை: ஆராய்ந்து திட்டமிடுங்கள், முழுமையாக உறுதிபடுத்தும் முன் சேமிப்பை உருவாக்குங்கள்.",
    },
    active: {
      en: "A supportive stretch for financial moves — a reasonable window to act.",
      ta: "நிதி முடிவுகளுக்கு ஆதரவான காலம் — செயல்பட ஏற்ற நேரம்.",
    },
  },
};

type EventWindowsQueryData = { windows: EventWindowItem[]; ageGated: boolean };

function useEventWindowsQuery(chartId: string, event: EventType, enabled: boolean) {
  return useQuery({
    queryKey: ["event-windows", chartId, event],
    queryFn: async (): Promise<EventWindowsQueryData> => {
      const currentYear = new Date().getFullYear();
      const res = await apiFetchJson<{ data: { windows: EventWindowItem[]; ageGated?: boolean } }>(
        `/api/v1/charts/${chartId}/event-windows?event=${event}&fromYear=${currentYear}&toYear=${currentYear + 20}`,
      );
      return { windows: res.data?.windows ?? [], ageGated: Boolean(res.data?.ageGated) };
    },
    enabled: enabled && !!chartId,
    staleTime: STALE.today,
  });
}

function chronological(windows: EventWindowItem[]): EventWindowItem[] {
  return [...windows].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function nearestWindow(windows: EventWindowItem[], todayStr: string): EventWindowItem | null {
  return chronological(windows).find((w) => w.endDate >= todayStr) ?? null;
}

type DashboardPlanTabNovaProps = {
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

  onGoToLifeAreas: () => void;
  onGoToCalendar: () => void;
  onGoToJournal: () => void;
  // Transits & Dasha is now its own top-level nav destination (nav id
  // "transits") — this navigates away rather than switching an in-tab view.
  onGoToTransits: () => void;
};

export function DashboardPlanTabNova({
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
  onGoToLifeAreas,
  onGoToCalendar,
  onGoToJournal,
  onGoToTransits,
}: DashboardPlanTabNovaProps) {
  const [subTab, setSubTab] = useState<PlanSubTab>("goals");
  const todayStr = new Date().toISOString().slice(0, 10);

  const { groups, unmapped } = useMemo(() => {
    const seen = new Set<EventType>();
    const g: { event: EventType; goalLabels: string[] }[] = [];
    const um: GoalData[] = [];
    for (const goal of goals) {
      const norm = normalizeGoalType(goal.goalType);
      const evt = GOAL_EVENT_MAP[norm];
      const labelKey = GOAL_OPTIONS.find(([v]) => v === norm)?.[1];
      const label = labelKey ? t(labelKey, lang) : goal.goalType;
      if (!evt) { um.push(goal); continue; }
      const existing = g.find((x) => x.event === evt);
      if (existing) existing.goalLabels.push(label);
      else { seen.add(evt); g.push({ event: evt, goalLabels: [label] }); }
    }
    return { groups: g, unmapped: um };
  }, [goals, lang]);

  const hasEvent = (evt: EventType) => groups.some((g) => g.event === evt);
  const marriageQ = useEventWindowsQuery(chartId, "MARRIAGE", hasEvent("MARRIAGE"));
  const careerQ = useEventWindowsQuery(chartId, "CAREER", hasEvent("CAREER"));
  const financeQ = useEventWindowsQuery(chartId, "FINANCE", hasEvent("FINANCE"));
  const queryByEvent: Record<EventType, typeof marriageQ> = { MARRIAGE: marriageQ, CAREER: careerQ, FINANCE: financeQ };

  const heroGroup = groups[0] ?? null;
  const heroQuery = heroGroup ? queryByEvent[heroGroup.event] : null;
  const heroAgeGated = heroGroup?.event === "MARRIAGE" && Boolean(heroQuery?.data?.ageGated);
  const heroWindow = heroQuery?.data ? nearestWindow(heroQuery.data.windows, todayStr) : null;

  if (!hasBirthProfile) {
    return (
      <div style={{ ...novaDetailCardStyle, border: "1px dashed var(--color-border-strong)" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>
          {lang === "ta" ? "முதலில் உங்கள் ஜாதக விவரங்களை சேர்க்கவும்." : "Add your birth profile first to use planning tools."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Header ===== */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
            {t("tab_plan", lang)}
          </p>
          <h1 style={{ margin: "6px 0 8px", fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 600, lineHeight: 1.15, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "நம்பிக்கையுடன் " : "Plan with "}
            <em style={{ fontStyle: "italic", color: "var(--color-accent-strong)" }}>{lang === "ta" ? "திட்டமிடுங்கள்." : "confidence."}</em>
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", lineHeight: 1.55, maxWidth: "520px" }}>
            {lang === "ta"
              ? "இலக்குகளை அமைக்கவும், முடிவுகளை பரிசோதிக்கவும், முக்கிய முடிவுகளுக்கு ஆதரவான தேதிகளைத் தேர்ந்தெடுக்கவும்."
              : "Set goals, simulate outcomes, and pick high-support dates for important moves."}
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToTransits}
          style={{ display: "flex", alignItems: "center", gap: "7px", background: "var(--color-surface)", color: "var(--color-muted)", border: "1px solid var(--color-border)", borderRadius: "11px", padding: "10px 16px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          🪐 {t("tab_transits", lang)} →
        </button>
      </div>

      {/* ===== Sub-nav pills ===== */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {PLAN_SUB_TABS.map(({ key, en, ta }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            style={{ fontSize: "12px", fontWeight: subTab === key ? 700 : 600, color: subTab === key ? "var(--color-on-accent)" : "var(--color-muted)", background: subTab === key ? "var(--color-accent)" : "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "999px", padding: "7px 15px", cursor: "pointer", fontFamily: "inherit" }}
          >
            {lang === "ta" ? ta : en}
          </button>
        ))}
      </div>

      {/* ===== Sub-tab: Goals ===== */}
      {subTab === "goals" && (
        <>
          <div className={heroGroup ? "nova-grid-anticipation" : undefined}>
            {/* ── My goals ── */}
            <div style={novaDetailCardStyle}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
                  {lang === "ta" ? "என் இலக்குகள்" : "My goals"}
                </span>
                <span style={{ fontSize: "12px", color: "var(--color-faint)" }}>
                  {lang === "ta" ? "தினசரி வழிகாட்டல் அதற்கேற்ப செறிவூட்டப்படும்" : "Daily guidance is enriched to match"}
                </span>
              </div>

              {goals.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {goals.map((g) => {
                    const norm = normalizeGoalType(g.goalType);
                    const labelKey = GOAL_OPTIONS.find(([v]) => v === norm)?.[1];
                    return (
                      <span key={g.goalId} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 600, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "7px 14px" }}>
                        {labelKey ? t(labelKey, lang) : g.goalType}
                        <button
                          type="button"
                          onClick={() => onRemoveGoal(g.goalId)}
                          disabled={removingGoalId === g.goalId}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", padding: 0, fontSize: "0.75rem", lineHeight: 1, fontWeight: 400 }}
                        >
                          {removingGoalId === g.goalId ? "…" : "✕"}
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {goals.length === 0 && (
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-muted)" }}>{t("goals_empty", lang)}</p>
              )}

              {goals.length < 3 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <NovaSelect
                    value={addingGoalType || "job_change"}
                    onChange={onAddingGoalTypeChange}
                    ariaLabel={t("goals_add", lang)}
                    containerStyle={{ flex: "1 1 200px" }}
                    style={{ fontSize: "12.5px" }}
                    options={GOAL_OPTIONS.map(([val, key]) => ({ value: val, label: t(key, lang) }))}
                  />
                  <button
                    type="button"
                    onClick={() => onAddGoal(addingGoalType || "job_change")}
                    disabled={goalsBusy}
                    style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "9px", padding: "10px 16px", cursor: goalsBusy ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                  >
                    {goalsBusy ? t("goals_adding", lang) : t("goals_add", lang)}
                  </button>
                </div>
              )}

              {goals.length > 0 && (
                <p style={{ margin: 0, fontSize: "11.5px", lineHeight: 1.5, color: "var(--color-muted)", background: "var(--color-accent-muted)", borderRadius: "8px", padding: "9px 12px" }}>
                  {lang === "ta" ? "உங்கள் இலக்குகள் " : "Your goals are highlighted in "}
                  <button type="button" onClick={onGoToLifeAreas} style={{ background: "none", border: "none", padding: 0, color: "var(--color-accent-strong)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                    {t("tab_life_areas", lang)}
                  </button>
                  {lang === "ta" ? " மற்றும் இன்றைய சுருக்கத்தில் முன்னிலைப்படுத்தப்படும்." : " and Today's snapshot, so the most relevant areas stand out."}
                </p>
              )}
            </div>

            {/* ── Nearest supportive window ── */}
            {heroGroup && (
              <div style={{ position: "relative", overflow: "hidden", background: "var(--nova-hero-gradient)", border: "1px solid var(--color-accent-secondary-muted)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent-secondary)", fontWeight: 700 }}>
                  {lang === "ta" ? "அருகிலுள்ள ஆதரவான காலம்" : "Nearest supportive window"}
                </span>
                {heroQuery?.isLoading ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>{lang === "ta" ? "கணக்கிடுகிறோம்…" : "Calculating…"}</p>
                ) : heroWindow ? (() => {
                  const lord = namedLordFromReasons(heroWindow.reasons);
                  const isActiveNow = heroWindow.startDate <= todayStr && todayStr <= heroWindow.endDate;
                  const startLabel = new Date(`${heroWindow.startDate}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { month: "short", year: "numeric" });
                  const advice = EVENT_ADVICE[heroGroup.event][isActiveNow ? "active" : "future"];
                  const yearsUntil = (new Date(`${heroWindow.startDate}T12:00:00`).getTime() - Date.now()) / (365.25 * 24 * 3600 * 1000);
                  return (
                    <>
                      <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, color: "var(--color-accent-strong)", lineHeight: 1.2 }}>
                        {isActiveNow ? (lang === "ta" ? "இப்போது" : "Right now") : startLabel}
                        {lord ? ` · ${tPlanetLord(lord, lang)} ${lang === "ta" ? "தசை" : "dasa"}` : ""}
                      </p>
                      <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.6, color: "var(--color-muted)" }}>
                        {lang === "ta" ? "இதற்கு " : "For "}
                        <b style={{ color: "var(--color-text-strong)" }}>{heroGroup.goalLabels.join(lang === "ta" ? " மற்றும் " : " and ")}</b>
                        {!isActiveNow && yearsUntil >= 0
                          ? (lang === "ta"
                              ? `, அடுத்த ஆதரவான காலம் சுமார் ${yearsUntil >= 1.5 ? `${Math.round(yearsUntil)} ஆண்டுகளில்` : `${Math.max(1, Math.round(yearsUntil * 12))} மாதங்களில்`} தொடங்குகிறது. `
                              : `, the next high-support stretch begins in ~${yearsUntil >= 1.5 ? `${Math.round(yearsUntil)} years` : `${Math.max(1, Math.round(yearsUntil * 12))} months`}. `)
                          : (lang === "ta" ? ", இது ஒரு ஆதரவான காலம். " : ", this is a supportive stretch. ")}
                        {lang === "ta" ? advice.ta : advice.en}
                      </p>
                      <button
                        type="button"
                        onClick={onGoToCalendar}
                        style={{ marginTop: "auto", textAlign: "left", background: "var(--color-accent-secondary-muted)", border: "1px solid var(--color-accent-secondary-muted)", borderRadius: "8px", padding: "8px 11px", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        <span style={{ fontSize: "11.5px", color: "var(--color-muted)" }}>
                          {lang === "ta" ? "வேகமான சூரிய/சுக்கிர சிக்னல்கள் உங்கள் " : "Short-term triggers (fast Sun/Venus signals) still appear in your "}
                          <span style={{ color: "var(--color-accent-secondary)", fontWeight: 600 }}>{lang === "ta" ? t("tab_calendar", lang) : "Calendar"}</span>
                          {lang === "ta" ? "-ல் தொடர்ந்து தோன்றும்." : "."}
                        </span>
                      </button>
                    </>
                  );
                })() : heroAgeGated ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", lineHeight: 1.5 }}>
                    {lang === "ta"
                      ? "இந்த சுயவிவரத்திற்கு திருமண நேரங்கள் காட்டப்படவில்லை."
                      : "Marriage timing isn't shown for this profile."}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", lineHeight: 1.5 }}>
                    {lang === "ta"
                      ? "அடுத்த 20 ஆண்டுகளில் குறிப்பிடத்தக்க ஆதரவான காலம் இல்லை."
                      : "No notable supportive window in the next 20 years."}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Supportive windows (one card per goal-mapped event type) ── */}
          {groups.map((group) => {
            const q = queryByEvent[group.event];
            const windows = q.data ? chronological(q.data.windows) : [];
            const groupAgeGated = group.event === "MARRIAGE" && Boolean(q.data?.ageGated);
            return (
              <div key={group.event} style={novaDetailCardStyle}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
                    {group.goalLabels.join(" · ")} — {lang === "ta" ? "ஆதரவான காலங்கள்" : "supportive windows"}
                  </span>
                  <button type="button" onClick={onGoToTransits} style={{ background: "none", border: "none", padding: 0, fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {lang === "ta" ? "தசை காலவரிசையைப் பார் →" : "See the dasa timeline →"}
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: "12px", lineHeight: 1.55, color: "var(--color-muted)", background: "rgba(243,236,221,0.04)", borderRadius: "8px", padding: "9px 12px" }}>
                  {lang === "ta"
                    ? "தசை நேரமும் கிரகநகர்வு ஆதரவும் சேரும்போது ஒரு காலம் தோன்றும். இதை திட்டமிடல் சிக்னலாக எடுத்துக்கொள்ளுங்கள், உறுதியான நிகழ்வாக அல்ல."
                    : "A window appears when dasa timing and transit support overlap. Treat it as a planning signal, not a guaranteed event."}
                </p>

                {q.isLoading && <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>{lang === "ta" ? "கணக்கிடுகிறோம்…" : "Calculating…"}</p>}

                {!q.isLoading && windows.length === 0 && groupAgeGated && (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>
                    {lang === "ta"
                      ? "இந்த சுயவிவரத்திற்கு திருமண நேரங்கள் காட்டப்படவில்லை."
                      : "Marriage timing isn't shown for this profile."}
                  </p>
                )}

                {!q.isLoading && windows.length === 0 && !groupAgeGated && (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>
                    {lang === "ta" ? "அடுத்த 20 ஆண்டுகளில் குறிப்பிடத்தக்க காலம் இல்லை." : "No notable windows in the next 20 years."}
                  </p>
                )}

                {windows.map((w, i) => {
                  const scoreColor = w.score >= 65 ? "var(--color-score-high)" : w.score >= 45 ? "var(--color-score-mid)" : "var(--color-score-low)";
                  const startLabel = new Date(`${w.startDate}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
                  const endLabel = new Date(`${w.endDate}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
                  const isActive = w.startDate <= todayStr && todayStr <= w.endDate;
                  return (
                    <div key={`${w.startDate}-${i}`} style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: isActive ? "var(--color-accent-muted)" : "var(--color-surface)", border: `1px solid ${isActive ? "var(--color-border-strong)" : "var(--color-border)"}`, borderRadius: "11px", padding: "15px 18px" }}>
                      <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "74px" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, color: scoreColor, lineHeight: 1 }}>{w.score}</span>
                        <span style={{ fontSize: "10px", letterSpacing: "0.08em", color: "var(--color-faint)", textTransform: "uppercase" }}>/100 {lang === "ta" ? "ஆதரவு" : "support"}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--color-text-strong)" }}>{startLabel} — {endLabel}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "6px" }}>
                          {w.reasons.map((r, ri) => (
                            <span key={`${r}-${ri}`} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>· {humaniseReason(r, lang)}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5 }}>
                  <b style={{ color: "var(--color-accent-strong)" }}>{lang === "ta" ? "இந்த மதிப்பெண் என்ன அளவிடுகிறது:" : "What the score measures:"}</b>{" "}
                  {lang === "ta"
                    ? "செயலில் உள்ள தசை அதிபதிகளும் தற்போதைய கிரகநகர்வும் இந்த இலக்கை எவ்வளவு ஆதரிக்கின்றன. அதிகமானது ஆதரவானது — இது ஒரு உறுதியான விளைவை உத்தரவாதம் அளிக்காது."
                    : "How strongly the active dasa lords and current transits support this goal, on your chart. Higher is more supportive — it does not guarantee outcomes."}
                </p>
              </div>
            );
          })}

          {unmapped.map((g) => {
            const norm = normalizeGoalType(g.goalType);
            const labelKey = GOAL_OPTIONS.find(([v]) => v === norm)?.[1];
            const label = labelKey ? t(labelKey, lang) : g.goalType;
            return (
              <div key={g.goalId} style={novaDetailCardStyle}>
                <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
                  {label} — {lang === "ta" ? "ஆதரவான காலங்கள்" : "supportive windows"}
                </span>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", lineHeight: 1.5 }}>
                  {lang === "ta"
                    ? "இந்த இலக்கிற்கு, 'என்ன ஆகும்?' மற்றும் 'சிறந்த நாள் & முஹூர்த்தம்' தாவல்களில் உகந்த தேதிகளைக் கண்டறியவும்."
                    : "For this goal, use the What-If and Best Dates & Muhurta tabs to find favourable dates tailored to your chart."}
                </p>
              </div>
            );
          })}

          {/* ── Life event log ── */}
          <NovaLifeEventLogCard lang={lang} chartId={chartId || null} />
        </>
      )}

      {/* ===== Sub-tab: Life Events — reused verbatim, already Nova-safe ===== */}
      {subTab === "events" && (
        <>
          <PlanEventsPanel lang={lang} chartId={chartId} />
          <NovaLifeEventLogCard lang={lang} chartId={chartId || null} />
        </>
      )}
      {subTab === "whatif" && (
        <NovaPlanWhatIfPanel
          lang={lang}
          whatIfScenario={whatIfScenario}
          whatIfDate={whatIfDate}
          whatIfResult={whatIfResult}
          whatIfBusy={whatIfBusy}
          whatIfError={whatIfError}
          onWhatIfScenarioChange={onWhatIfScenarioChange}
          onWhatIfDateChange={onWhatIfDateChange}
          onRunWhatIf={onRunWhatIf}
        />
      )}
      {subTab === "decisions" && <NovaPlanDecisionsPanel lang={lang} chartId={chartId} mode={mode} />}
      {subTab === "muhurta" && <NovaPlanMuhurtaPanel lang={lang} chartId={chartId} />}
    </div>
  );
}
