"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

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
import { displayName as yogaDisplayName } from "./dashboard-yoga-dosham-panel";
import { NovaPredictionsPanel } from "./dashboard-life-areas-predictions-nova";
import { DashboardPropensitiesPanelNova } from "./dashboard-propensities-panel-nova";
import { HyLifeAreaForecast } from "./dashboard-hybrid-parts";
import { NovaJadhagamReportPanel } from "./dashboard-life-areas-report-nova";
import { NovaRemediesPanel } from "./dashboard-life-areas-remedies-nova";
import { EventWindowsPanel } from "./dashboard-event-windows";
import { GOAL_OPTIONS } from "./dashboard-plan-shared";
import { NovaGocharCard, NovaGuidanceCard } from "./dashboard-today-deepdive-extras-nova";
import { Segmented, Card, Button, Pill, BilingualText } from "./ui";
import { Kicker } from "./ui/kicker";

/**
 * Nova Life Areas tab — Phase 9 of the dashboard revamp, mapped from the
 * mockup's `life-areas` screen (docs/DASHBOARD_UI_REVAMP_PLAN.md §6.8). A
 * full tab-level screen (own sub-nav, member switcher) like Today/Family/
 * Explore's Nova tabs — not a "detail drill-down" like explore-moolam/
 * explore-sevvai, so no shared shell with dashboard-explore-detail-nova.tsx
 * applies here.
 *
 * REFERENCE TAB for the 2026-07-23 master-audit component kit (web/components/
 * ui/): this tab is the first converted to <Segmented>/<Card>/<Button>/<Pill>/
 * <BilingualText> — the sub-nav is one <Segmented> (was the 7th hand-rolled
 * nav pattern), tier names are real <h2> headings (B-1), every inline surface
 * is a <Card>, and every font-size reads a --text-* scale step (B-2/B-6). New
 * work on other tabs should follow this file's shape, not the old inline style.
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
type SubTab = "scores" | "predictions" | "chances" | "yogas" | "report" | "remedies";
type Tier = "attention" | "steady" | "supportive";

const GOAL_LABEL_BY_TYPE = new Map(GOAL_OPTIONS);

function tierOf(area: LifeAreaData): Tier {
  const tone = getScoreBand(area.score).tone;
  if (tone === "low" || area.caution) return "attention";
  if (tone === "high") return "supportive";
  return "steady";
}

/**
 * Activation-only yoga/dosham glance for the Life Areas tab. Per the IA audit
 * (2026-07-22, D1), the *full* yoga & dosham catalog — the deep "what/why/how"
 * accordion — has a single canonical home in the member-selectable chart view
 * (Family & Charts). Life Areas keeps only the outcome-flavoured "what's firing
 * now" summary and links out for the rest, so the catalog never renders in two
 * tabs. Reuses `yogaDisplayName` so names follow the canonical map, never raw
 * enums.
 */
function YogaActivationSummary({
  lang,
  yogas,
  doshams,
  onGoToChart,
}: {
  lang: Lang;
  yogas: ChartYogaInsight[];
  doshams: ChartDoshamInsight[];
  onGoToChart: () => void;
}) {
  const presentYogas = yogas.filter((y) => y.isPresent);
  const presentDoshams = doshams.filter((d) => d.isPresent);
  const hasAny = presentYogas.length > 0 || presentDoshams.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", fontFamily: "var(--font-body)" }}>
      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
          {lang === "ta" ? "இப்போது செயலில் உள்ளவை" : "Active right now"}
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {lang === "ta"
            ? "இந்தக் காலகட்டத்தில் தசை/கிரகநகர்வால் தூண்டப்படும் யோகங்கள் & தோஷங்கள். முழு விளக்கம் உங்கள் ஜாதகப் பார்வையில்."
            : "Yogas & doshams your current dasha and transits are triggering. The full explanation lives in your chart view."}
        </p>

        {!hasAny ? (
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
            {lang === "ta" ? "இப்போது குறிப்பிட்டு செயலில் ஒன்றும் இல்லை." : "Nothing notably active for this chart right now."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {presentYogas.length > 0 && (
              <div>
                <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-high)" }}>{t("yogas_title", lang)}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  {presentYogas.map((y, i) => {
                    const active = y.isCurrentlyActive;
                    const color = active ? "var(--color-high)" : "var(--color-muted)";
                    return (
                      <span
                        key={`${y.name}-${i}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)", background: active ? "var(--color-high-bg)" : "var(--color-surface-soft)", border: `1px solid ${active ? "var(--color-high-border)" : "var(--color-border)"}`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}
                      >
                        {yogaDisplayName(y.name, lang)}
                        {typeof y.activationScore === "number" && (
                          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color }}>{y.activationScore}/100</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {presentDoshams.length > 0 && (
              <div>
                <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-low)" }}>{t("doshams_title", lang)}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  {presentDoshams.map((d) => {
                    const mitigated = d.isCancelled;
                    const color = mitigated ? "var(--color-high)" : "var(--color-low)";
                    const bg = mitigated ? "var(--color-high-bg)" : "var(--color-low-bg)";
                    const border = mitigated ? "var(--color-high-border)" : "var(--color-low-border)";
                    return (
                      <span
                        key={d.name}
                        style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)", background: bg, border: `1px solid ${border}`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}
                      >
                        {yogaDisplayName(d.name, lang)}
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color }}>
                          {mitigated ? (lang === "ta" ? "நிவர்த்தி" : "Mitigated") : (lang === "ta" ? "கவனம்" : "Active")}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <Button variant="secondary" onClick={onGoToChart} style={{ marginTop: "16px", alignSelf: "flex-start" }}>
          {lang === "ta" ? "ஜாதகத்தில் முழு யோக & தோஷ பகுப்பாய்வு" : "Full yoga & dosham analysis in your chart"}
          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </Card>
    </div>
  );
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
  /** Opens Family & Charts (the chart deep-dive home). Renamed from the
   *  misleading `onGoToTransits` — there is no `transits` tab (IA audit
   *  2026-07-22, Phase 5). */
  onGoToChart: () => void;
  /** A cross-tab request to open a specific sub-tab (e.g. Family's "View all
   *  remedies" wants `remedies`, "Forecast" wants `predictions`). When set,
   *  the tab focuses that sub-tab on arrival, then calls `onFocusConsumed` so a
   *  later plain nav lands on the default Overview instead of re-focusing (IA
   *  audit 2026-07-22, Phase 1/2 — links must land on the populated sub-tab). */
  focusSubTab?: string | null;
  onFocusConsumed?: () => void;
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
  onGoToChart,
  focusSubTab = null,
  onFocusConsumed,
}: DashboardLifeAreasTabNovaProps) {
  const SUB_TAB_KEYS: SubTab[] = ["scores", "predictions", "chances", "yogas", "remedies", "report"];
  const initialSubTab: SubTab = focusSubTab && (SUB_TAB_KEYS as string[]).includes(focusSubTab)
    ? (focusSubTab as SubTab)
    : "scores";
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab);
  // Honour a cross-tab focus request that arrives while already mounted, then
  // clear it so a later plain nav returns to Overview.
  useEffect(() => {
    if (focusSubTab && (SUB_TAB_KEYS as string[]).includes(focusSubTab)) {
      setSubTab(focusSubTab as SubTab);
      onFocusConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSubTab]);
  const [selectedArea, setSelectedArea] = useState<LifeAreaData | null>(null);
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);
  const currentAge = chartSummary?.currentAge ?? null;
  const isMarried = maritalStatus === "married" || maritalStatus === "widowed" || maritalStatus === "divorced";

  // Remedies is the single canonical home for the full plan (IA audit
  // 2026-07-22, Phase 2). `NovaRemediesPanel` used to only fetch on a "Load"
  // click, so anyone arriving via a link-out (Family's "View all remedies",
  // or a direct ?tab=life-areas deep link) landed on an empty panel. Auto-load
  // once the sub-tab is opened; the ref is keyed to the chart so switching the
  // selected member refetches for the right chart instead of showing stale data.
  const remediesLoadedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (subTab !== "remedies" || !onLoadRemedies) return;
    const key = chartId ?? null;
    if (remediesLoadedForRef.current === key) return;
    remediesLoadedForRef.current = key;
    onLoadRemedies();
  }, [subTab, chartId, onLoadRemedies]);

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: "scores", label: lang === "ta" ? "கண்ணோட்டம்" : "Overview" },
    { key: "predictions", label: t("predictions_tab_label", lang) },
    { key: "chances", label: lang === "ta" ? "வாய்ப்புகள் & எச்சரிக்கைகள்" : "Chances & Cautions" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Header ===== */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-5)", flexWrap: "wrap" }}>
        <div>
          <Kicker as="p" style={{ margin: 0 }}>
            {t("tab_life_areas", lang)}{currentAge !== null ? ` · ${lang === "ta" ? "வயது" : "Age"} ${currentAge}` : ""}
          </Kicker>
          <h1 style={{ margin: "6px 0 8px", fontFamily: "var(--font-display)", fontSize: "var(--display-md)", fontWeight: 600, lineHeight: 1.15, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "நீங்கள் எங்கே நிற்கிறீர்கள்," : "Where you stand,"}{" "}
            <em style={{ fontStyle: "italic", color: "var(--color-accent-strong)" }}>{lang === "ta" ? "துறை வாரியாக." : "area by area."}</em>
          </h1>
          <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.55, maxWidth: "520px" }}>
            {lang === "ta"
              ? "ஒவ்வொரு மதிப்பெண்ணும் இன்றைய நிலையை அடிப்படையாகக் கொண்டது — உங்கள் ஜாதக வலிமை, தசை மற்றும் கிரகநகர்வு மூன்றையும் சேர்த்து கணக்கிடப்படுகிறது."
              : "Each score is a snapshot for today — natal chart strength, the active dasha period, and current transits, combined."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-3)" }}>
          {/* Member switcher — kit <Pill> (audit B-7): one toggle chip, touch-safe. */}
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Pill active={selectedMemberId === null} onClick={() => onSelectMember(null)}>
              {birthDisplayName || (lang === "ta" ? "நீங்கள்" : "You")}
            </Pill>
            {memberCharts.map((mc) => (
              <Pill key={mc.memberId} active={selectedMemberId === mc.memberId} onClick={() => onSelectMember(mc.memberId)}>
                {mc.displayName}
              </Pill>
            ))}
          </div>
          {/* Sub-nav — the 7th hand-rolled pattern replaced by the one <Segmented>
              (audit A-1/B-7): tablist semantics + arrow-key nav + 44px touch. */}
          <Segmented<SubTab>
            ariaLabel={lang === "ta" ? "வாழ்க்கைத் துறை பார்வைகள்" : "Life-area views"}
            value={subTab}
            onChange={setSubTab}
            options={SUB_TABS.map(({ key, label }) => ({ key, label }))}
          />
        </div>
      </div>

      {/* ===== Sub-tab: Overview ===== */}
      {subTab === "scores" && (
        <>
          {/* ===== Today's guidance & transits — moved here from "Family &
              Charts" (2026-07-09) so the "how am I doing" landing page leads
              with today's snapshot before the longer-arc life-domain scores
              below. Resolved per the Overview tab's own member switcher
              (selectedMemberId), same pattern as the Family & Charts tab. ===== */}
          <NovaGocharCard
            lang={lang}
            personalDailyGuidance={personalDailyGuidance}
            personalTransit={personalTransit}
            personalSani={personalSani}
            panchangam={panchangam}
          />
          {/* Collapsed by default here (2026-08-22): the same guidance is the
              hero of the Today tab, so a reader arriving on Life Areas has
              almost certainly already read it, and open it pushed the actual
              life-domain scores — the reason this tab exists — below the fold.
              The header keeps the score visible, so nothing is hidden that
              would make someone open it just to check. */}
          <NovaGuidanceCard
            lang={lang}
            personalDailyGuidance={personalDailyGuidance}
            dailyGuidanceRange={dailyGuidanceRange}
            astroText={astroText}
            collapsible
          />

          {!lifeAreas ? (
            <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "var(--text-base)" }}>{t("life_areas_empty", lang)}</p>
          ) : (
            <>
            {lifeAreas.chartSignature && (
              <Card variant="accent" style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" }}>
                <Kicker color="var(--color-accent-strong)" style={{ whiteSpace: "nowrap" }}>
                  {lang === "ta" ? "ஜாதக முத்திரை" : "Chart signature"}
                </Kicker>
                <p style={{ margin: 0, flex: "1 1 24ch", fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                  {lang === "ta" ? lifeAreas.chartSignature.framing.ta : lifeAreas.chartSignature.framing.en}
                </p>
              </Card>
            )}

            {activeGoals.length > 0 && (
              <Card style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                <Kicker style={{ flex: "none" }}>
                  {lang === "ta" ? "உங்கள் இலக்கு" : "Your focus"}
                </Kicker>
                {activeGoals.map((g) => (
                  <span key={g.goalId} style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
                    {t(GOAL_LABEL_BY_TYPE.get(g.goalType) ?? "goal_other", lang)}
                  </span>
                ))}
                {focusedAreas.length > 0 && (
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                    {lang === "ta"
                      ? `${focusedAreas.map((a) => tLang(a.label, lang)).join(", ")} உங்கள் இலக்குகளுக்கு ஏற்ப முன்னிலைப்படுத்தப்பட்டுள்ளன.`
                      : `${focusedAreas.map((a) => tLang(a.label, lang)).join(" and ")} ${focusedAreas.length === 1 ? "is" : "are"} highlighted to match your goals.`}
                  </span>
                )}
                <Button variant="ghost" onClick={onGoToPlan} style={{ marginLeft: "auto" }}>
                  {lang === "ta" ? "திட்டத்தில் இலக்குகளை மாற்று" : "Edit goals in Plan"}
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                </Button>
              </Card>
            )}

            {tiers.map((tier) => (
              <section key={tier.key} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
                  {/* audit B-1: tier name is a real section heading, not a styled
                      div — screen readers get a document outline on this page. */}
                  <h2 style={{ margin: 0, fontSize: "var(--text-xs)", letterSpacing: "0.12em", textTransform: "uppercase", color: tier.color, fontWeight: 700 }}>{tier.label}</h2>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{tier.blurb}</span>
                </div>
                <div className="nova-grid-4">
                  {tier.areas.map((area) => (
                    <LifeAreaCard key={area.area} area={area} lang={lang} ageRelevant={area.ageRelevant !== false} onOpenDetail={() => setSelectedArea(area)} />
                  ))}
                </div>
              </section>
            ))}

            <Card variant="dashed" style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px" }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                  <BilingualText lang={lang} en="What these scores measure" ta="இந்த மதிப்பெண்கள் எதை அளவிடுகின்றன" />
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                  {lang === "ta"
                    ? "ஜாதக காரக வலிமை + தற்போதைய தசை இணக்கம் + இன்றைய கிரகநகர்வு ஆதரவு. இவை மெதுவாக மாறும் — ஒவ்வொரு மணி நேரமும் அல்ல, வாரம் ஒருமுறை பாருங்கள்."
                    : "Natal karaka strength + active dasha alignment + today's transit support. They shift slowly — check weekly, not hourly."}
                </p>
              </div>
              <Button variant="secondary" onClick={onGoToChart} style={{ whiteSpace: "nowrap" }}>
                {lang === "ta" ? "இதன் பின்னணி ஜாதகத்தைப் பார்" : "See the chart behind them"}
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </Card>

            {selectedArea && (
              <DrawerPanel title={lang === "ta" ? selectedArea.label.ta : selectedArea.label.en} onClose={() => setSelectedArea(null)}>
                <LifeAreaCard area={selectedArea} lang={lang} ageRelevant={selectedArea.ageRelevant !== false} />
              </DrawerPanel>
            )}
          </>
          )}
        </>
      )}

      {/* ===== Sub-tab: Predictions ===== */}
      {subTab === "predictions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <NovaPredictionsPanel lang={lang} predictions={predictions} loading={predictionsLoading} maritalStatus={maritalStatus} />

          {/* 6/12-month life-area forecast — the single full home for this
              table (IA audit 2026-07-22, Phase 2). Family & Charts shows only a
              compact preview and links here. Same data the tab already holds
              (`lifeAreas.areas`) — no new fetch. */}
          <Card>
            <h3 style={{ margin: "0 0 8px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "வரும் 6 / 12 மாத முன்னோட்டம்" : "Next 6 / 12-month forecast"}
            </h3>
            <HyLifeAreaForecast lang={lang} areas={lifeAreas?.areas ?? null} age={currentAge} />
          </Card>

          {lifeAreas?.chartId && (
            <Card>
              <h3 style={{ margin: "0 0 8px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                {lang === "ta" ? "நிகழ்வு நேரங்கள்" : "Event Windows"}
              </h3>
              <EventWindowsPanel lang={lang} chartId={lifeAreas.chartId} isMarried={isMarried} />
            </Card>
          )}
        </div>
      )}

      {/* ===== Sub-tab: Chances & Cautions ===== */}
      {subTab === "chances" && (lifeAreas?.chartId || chartId) && (
        <DashboardPropensitiesPanelNova lang={lang} chartId={(lifeAreas?.chartId ?? chartId) as string} />
      )}

      {/* ===== Sub-tab: Yogas & Doshams (activation-only + link-out) =====
          Per the IA audit (D1), the full catalog is owned by the chart view;
          here we show only what's firing now and link out for the rest. */}
      {subTab === "yogas" && (
        <YogaActivationSummary lang={lang} yogas={yogas} doshams={doshams} onGoToChart={onGoToChart} />
      )}

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
