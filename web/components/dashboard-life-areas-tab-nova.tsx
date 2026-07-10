"use client";

import { useState } from "react";

import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { getScoreBand } from "@/lib/format";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
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
  GoalData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  TransitSnapshotData,
  SaniCycleData,
  PanchangamDailyResponseData,
} from "@/lib/types";

import { LifeAreaCard } from "./life-area-card";
import { DrawerPanel } from "./drawer-panel";
import { NovaPredictionsPanel } from "./dashboard-life-areas-predictions-nova";
import { NovaYogaDoshamPanel } from "./dashboard-life-areas-yogas-doshams-nova";
import { NovaJadhagamReportPanel } from "./dashboard-life-areas-report-nova";
import { NovaRemediesPanel } from "./dashboard-life-areas-remedies-nova";
import { EventWindowsPanel } from "./dashboard-event-windows";
import { isAreaRelevantForAge } from "./dashboard-life-areas-shared";
import { GOAL_OPTIONS } from "./dashboard-plan-shared";
import { novaDetailCardStyle } from "./dashboard-explore-detail-nova";
import { NovaGocharCard, NovaGuidanceCard } from "./dashboard-today-deepdive-extras-nova";

/**
 * Nova Life Areas tab — Phase 9 of the dashboard revamp, mapped from the
 * mockup's `life-areas` screen (docs/DASHBOARD_UI_REVAMP_PLAN.md §6.8). A
 * full tab-level screen (own sub-nav, member switcher) like Today/Family/
 * Explore's Nova tabs — not a "detail drill-down" like explore-moolam/
 * explore-sevvai, so no shared shell with dashboard-explore-detail-nova.tsx
 * applies here (only its genuinely generic `novaDetailCardStyle` card
 * container is reused, nothing structural).
 *
 * The mockup's static export turned out to be a live capture of Classic's
 * own "Overview" sub-tab (`dashboard-life-areas-tab.tsx`) — same hero copy,
 * same member pills, same 5-tab sub-nav, and `LifeAreaCard` already renders
 * every field the mockup shows. `LifeAreaCard` is reused **verbatim** here
 * (not re-skinned) — see §6.8: it was already 100% Nova-token-driven once
 * earlier phases' gap-fixes landed, apart from one literal hardcoded hex in
 * its remedy box, fixed directly in that file.
 *
 * The mockup's two genuinely new ideas are net-new here:
 * - Tier grouping (Needs attention/Steady/Supportive) — derived from
 *   `getScoreBand`'s existing tone thresholds plus the real `caution`
 *   field (an area is "Needs attention" if its tone is low OR it carries a
 *   caution, matching the mockup's own Health example), not an invented
 *   boundary.
 * - The goal-focus strip — `goals` is threaded in from `usePlanData`,
 *   already fetched workspace-wide for the Plan tab (no new fetch); goal
 *   display labels reuse Plan's own `GOAL_OPTIONS` map rather than
 *   re-authoring goal names.
 *
 * The other 4 sub-tabs (Predictions/Yogas & Doshams/Remedies/Full report)
 * were deliberately deferred (Classic-styled) when this phase first shipped
 * — the mockup's static export never expands them, and their underlying
 * panels read multiple Classic-only tokens (same precedent as Phase 2's
 * initial `cal-monthly` deferral). Re-skinned in a later pass (2026-07-06,
 * see Progress Log): `dashboard-life-areas-predictions-nova.tsx`,
 * `dashboard-life-areas-yogas-doshams-nova.tsx`,
 * `dashboard-life-areas-remedies-nova.tsx`, and
 * `dashboard-life-areas-report-nova.tsx` (a thin wrapper reusing
 * `JadhagamReportPanel` verbatim — that file turned out ~95% Nova-safe
 * already, so only its Yogas & Doshams sub-section needed substituting via
 * a new optional `renderYogaDoshamPanel` prop, not a full rebuild).
 */

type MemberOption = { memberId: string; displayName: string };
type SubTab = "scores" | "predictions" | "yogas" | "report" | "remedies";
type Tier = "attention" | "steady" | "supportive";

const GOAL_LABEL_BY_TYPE = new Map(GOAL_OPTIONS);
const cardStyle = novaDetailCardStyle;

function tierOf(area: LifeAreaData): Tier {
  const tone = getScoreBand(area.score).tone;
  if (tone === "low" || area.caution) return "attention";
  if (tone === "high") return "supportive";
  return "steady";
}

type DashboardLifeAreasTabNovaProps = {
  lang: Lang;
  personalDailyGuidance: DailyGuidanceData | null;
  dailyGuidanceRange?: DailyGuidanceRangeData | null;
  personalTransit: TransitSnapshotData | null;
  personalSani: SaniCycleData | null;
  panchangam: PanchangamDailyResponseData | null;
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
  goals: GoalData[];
  onGoToPlan: () => void;
  onGoToTransits: () => void;
};

export function DashboardLifeAreasTabNova({
  lang,
  personalDailyGuidance,
  dailyGuidanceRange,
  personalTransit,
  personalSani,
  panchangam,
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
  goals,
  onGoToPlan,
  onGoToTransits,
}: DashboardLifeAreasTabNovaProps) {
  const [subTab, setSubTab] = useState<SubTab>("scores");
  const [selectedArea, setSelectedArea] = useState<LifeAreaData | null>(null);
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);
  const currentAge = chartSummary?.currentAge ?? null;
  const isMarried = maritalStatus === "married" || maritalStatus === "widowed" || maritalStatus === "divorced";

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: "scores", label: lang === "ta" ? "கண்ணோட்டம்" : "Overview" },
    { key: "predictions", label: t("predictions_tab_label", lang) },
    { key: "yogas", label: `${t("yogas_title", lang)} & ${t("doshams_title", lang)}` },
    { key: "remedies", label: t("remedies_title", lang) },
    { key: "report", label: lang === "ta" ? "முழு அறிக்கை" : "Full report" },
  ];

  const activeGoals = goals.filter((g) => g.isActive);
  const focusedAreas = lifeAreas?.areas.filter((a) => a.isGoalFocus) ?? [];

  const tiers: { key: Tier; label: string; color: string; blurb: string; areas: LifeAreaData[] }[] = lifeAreas
    ? (["attention", "steady", "supportive"] as Tier[])
        .map((key) => ({
          key,
          label:
            // Nurturing, non-clinical framing — "Needs attention" + red read as
            // "something is wrong with my health" to folk mothers (#17/#99).
            key === "attention" ? (lang === "ta" ? "கூடுதல் அக்கறை" : "Give extra care")
              : key === "steady" ? (lang === "ta" ? "நிலையான முன்னேற்றம்" : "Steady")
              : (lang === "ta" ? "ஆதரவானவை" : "Supportive"),
          color: key === "attention" ? "var(--color-low)" : key === "steady" ? "var(--color-accent-strong)" : "var(--color-high)",
          blurb:
            key === "attention"
              ? (lang === "ta" ? "இவை இப்போது ஒரு மென்மையான காலகட்டத்தில் — ஏதோ தவறு என்று அர்த்தம் இல்லை; சற்று அதிக பொறுமையுடன் அணுகுங்கள்." : "A gentler season for these — it doesn't mean anything is wrong, just move with a little more patience.")
              : key === "steady"
              ? (chartSummary?.currentMahadasha
                  ? (lang === "ta"
                      ? `${tPlanetLord(chartSummary.currentMahadasha, lang)} தசையின் கீழ் படிப்படியான முன்னேற்றம் — பொறுமையும் கட்டமைப்பும் தேவை.`
                      : `Gradual progress under ${tPlanetLord(chartSummary.currentMahadasha, lang)} dasa — patience and structure.`)
                  : (lang === "ta" ? "நிலையான முன்னேற்றம் சாத்தியம்." : "Steady, gradual progress is possible."))
              : (lang === "ta" ? "இப்போது உங்கள் வலுவான பகுதிகள் — இவற்றை நம்பலாம்." : "Your stronger areas right now — lean on these."),
          areas: lifeAreas.areas.filter((a) => tierOf(a) === key),
        }))
        .filter((tier) => tier.areas.length > 0)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Header ===== */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
            {t("tab_life_areas", lang)}{currentAge !== null ? ` · ${lang === "ta" ? "வயது" : "Age"} ${currentAge}` : ""}
          </p>
          <h1 style={{ margin: "6px 0 8px", fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 600, lineHeight: 1.15, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "நீங்கள் எங்கே நிற்கிறீர்கள்," : "Where you stand,"}{" "}
            <em style={{ fontStyle: "italic", color: "var(--color-accent-strong)" }}>{lang === "ta" ? "துறை வாரியாக." : "area by area."}</em>
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", lineHeight: 1.55, maxWidth: "520px" }}>
            {lang === "ta"
              ? "ஒவ்வொரு மதிப்பெண்ணும் இன்றைய நிலையை அடிப்படையாகக் கொண்டது — உங்கள் ஜாதக வலிமை, தசை மற்றும் கிரகநகர்வு மூன்றையும் சேர்த்து கணக்கிடப்படுகிறது."
              : "Each score is a snapshot for today — natal chart strength, the active dasha period, and current transits, combined."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => onSelectMember(null)}
              style={{ fontSize: "12px", fontWeight: 700, color: selectedMemberId === null ? "var(--color-on-accent)" : "var(--color-muted)", background: selectedMemberId === null ? "var(--color-accent)" : "transparent", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}
            >
              {birthDisplayName || (lang === "ta" ? "நீங்கள்" : "You")}
            </button>
            {memberCharts.map((mc) => (
              <button
                key={mc.memberId}
                type="button"
                onClick={() => onSelectMember(mc.memberId)}
                style={{ fontSize: "12px", fontWeight: selectedMemberId === mc.memberId ? 700 : 600, color: selectedMemberId === mc.memberId ? "var(--color-on-accent)" : "var(--color-muted)", background: selectedMemberId === mc.memberId ? "var(--color-accent)" : "transparent", border: `1px solid ${selectedMemberId === mc.memberId ? "var(--color-border-strong)" : "var(--color-border)"}`, borderRadius: "999px", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {mc.displayName}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "11px", padding: "4px" }}>
            {SUB_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSubTab(key)}
                style={{ fontSize: "12px", fontWeight: subTab === key ? 700 : 600, color: subTab === key ? "var(--color-on-accent)" : "var(--color-muted)", background: subTab === key ? "var(--color-accent)" : "transparent", border: "none", borderRadius: "8px", padding: "6px 13px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Sub-tab: Overview ===== */}
      {subTab === "scores" && (
        <>
          {/* ===== Today's guidance & transits — moved here from "Family &
              Charts" (2026-07-09) so the "how am I doing" landing page leads
              with today's snapshot before the longer-arc life-domain scores
              below. Resolved per the Overview tab's own member switcher
              (selectedMemberId), same pattern as the Family/Transits tabs. ===== */}
          <NovaGocharCard
            lang={lang}
            personalDailyGuidance={personalDailyGuidance}
            personalTransit={personalTransit}
            personalSani={personalSani}
            panchangam={panchangam}
          />
          <NovaGuidanceCard
            lang={lang}
            personalDailyGuidance={personalDailyGuidance}
            dailyGuidanceRange={dailyGuidanceRange}
            astroText={astroText}
          />

          {!lifeAreas ? (
            <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "13px" }}>{t("life_areas_empty", lang)}</p>
          ) : (
            <>
            {lifeAreas.chartSignature && (
              <div style={{ ...cardStyle, flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", background: "var(--color-accent-muted)" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-strong)", whiteSpace: "nowrap" }}>
                  {lang === "ta" ? "ஜாதக முத்திரை" : "Chart signature"}
                </span>
                <p style={{ margin: 0, flex: "1 1 24ch", fontSize: "13px", color: "var(--color-text)", lineHeight: 1.55 }}>
                  {lang === "ta" ? lifeAreas.chartSignature.framing.ta : lifeAreas.chartSignature.framing.en}
                </p>
              </div>
            )}

            {activeGoals.length > 0 && (
              <div style={{ ...cardStyle, flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700, flex: "none" }}>
                  {lang === "ta" ? "உங்கள் இலக்கு" : "Your focus"}
                </span>
                {activeGoals.map((g) => (
                  <span key={g.goalId} style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "4px 12px" }}>
                    {t(GOAL_LABEL_BY_TYPE.get(g.goalType) ?? "goal_other", lang)}
                  </span>
                ))}
                {focusedAreas.length > 0 && (
                  <span style={{ fontSize: "12.5px", color: "var(--color-muted)" }}>
                    {lang === "ta"
                      ? `${focusedAreas.map((a) => tLang(a.label, lang)).join(", ")} உங்கள் இலக்குகளுக்கு ஏற்ப முன்னிலைப்படுத்தப்பட்டுள்ளன.`
                      : `${focusedAreas.map((a) => tLang(a.label, lang)).join(" and ")} ${focusedAreas.length === 1 ? "is" : "are"} highlighted to match your goals.`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onGoToPlan}
                  style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 600, color: "var(--color-accent-strong)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
                >
                  {lang === "ta" ? "திட்டத்தில் இலக்குகளை மாற்று →" : "Edit goals in Plan →"}
                </button>
              </div>
            )}

            {tiers.map((tier) => (
              <div key={tier.key} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: tier.color, fontWeight: 700 }}>{tier.label}</span>
                  <span style={{ fontSize: "12px", color: "var(--color-faint)" }}>{tier.blurb}</span>
                </div>
                <div className="nova-grid-4">
                  {tier.areas.map((area) => {
                    const ageRelevant = currentAge === null || isAreaRelevantForAge(area.area, currentAge, maritalStatus);
                    return (
                      <LifeAreaCard key={area.area} area={area} lang={lang} ageRelevant={ageRelevant} onOpenDetail={() => setSelectedArea(area)} />
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ ...cardStyle, flexDirection: "row", alignItems: "center", flexWrap: "wrap", background: "rgba(243,236,221,0.03)", border: "1px dashed var(--color-border-strong)" }}>
              <div style={{ flex: "1 1 260px" }}>
                <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                  {lang === "ta" ? "இந்த மதிப்பெண்கள் எதை அளவிடுகின்றன" : "What these scores measure"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-muted)" }}>
                  {lang === "ta"
                    ? "ஜாதக காரக வலிமை + தற்போதைய தசை இணக்கம் + இன்றைய கிரகநகர்வு ஆதரவு. இவை மெதுவாக மாறும் — ஒவ்வொரு மணி நேரமும் அல்ல, வாரம் ஒருமுறை பாருங்கள்."
                    : "Natal karaka strength + active dasha alignment + today's transit support. They shift slowly — check weekly, not hourly."}
                </p>
              </div>
              <button
                type="button"
                onClick={onGoToTransits}
                style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--color-accent-strong)", border: "1px solid var(--color-border-strong)", borderRadius: "9px", padding: "9px 16px", background: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                {lang === "ta" ? "பின்னணி கிரகநகர்வுகளைப் பார் →" : "See the transits behind them →"}
              </button>
            </div>

            {selectedArea && (
              <DrawerPanel title={lang === "ta" ? selectedArea.label.ta : selectedArea.label.en} onClose={() => setSelectedArea(null)}>
                <LifeAreaCard area={selectedArea} lang={lang} ageRelevant={currentAge === null || isAreaRelevantForAge(selectedArea.area, currentAge, maritalStatus)} />
              </DrawerPanel>
            )}
          </>
          )}
        </>
      )}

      {/* ===== Sub-tab: Predictions ===== */}
      {subTab === "predictions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <NovaPredictionsPanel lang={lang} predictions={predictions} loading={predictionsLoading} maritalStatus={maritalStatus} />
          {lifeAreas?.chartId && (
            <div style={cardStyle}>
              <p style={{ margin: "0 0 8px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                {lang === "ta" ? "நிகழ்வு நேரங்கள்" : "Event Windows"}
              </p>
              <EventWindowsPanel lang={lang} chartId={lifeAreas.chartId} isMarried={isMarried} />
            </div>
          )}
        </div>
      )}

      {/* ===== Sub-tab: Yogas & Doshams ===== */}
      {subTab === "yogas" && <NovaYogaDoshamPanel lang={lang} yogas={yogas} doshams={doshams} />}

      {/* ===== Sub-tab: Remedies ===== */}
      {subTab === "remedies" && (
        <NovaRemediesPanel
          lang={lang}
          chartId={chartId ?? null}
          remedyPlan={remedyPlan ?? null}
          gemstoneAdvice={gemstoneAdvice ?? null}
          loading={remediesLoading ?? false}
          onLoad={onLoadRemedies ?? (() => {})}
        />
      )}

      {/* ===== Sub-tab: Full report ===== */}
      {subTab === "report" && (
        <NovaJadhagamReportPanel lang={lang} report={jadhagamReport} loading={jadhagamReportLoading} onLoad={onLoadJadhagamReport} />
      )}
    </div>
  );
}
