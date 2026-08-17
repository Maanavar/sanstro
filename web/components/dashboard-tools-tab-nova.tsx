"use client";

import type { CSSProperties } from "react";
import {
  ScrollText, CalendarDays, History, Sunrise, Moon, Sparkles, Timer, CalendarClock,
  HeartHandshake, Hash, ArrowLeft, ArrowRight, ChevronRight, type LucideIcon,
} from "lucide-react";

import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData, RelationshipAlertItem, VarshaphalaData } from "@/lib/types";
import type { MemberChart } from "@/hooks/useFamilyData";

import { ChartGenerateInlinePanel } from "./chart-generate-inline-panel";
import { DashboardAnnualWrapped } from "./dashboard-annual-wrapped";
import { RetrospectivePanel } from "./dashboard-retrospective-panel";
import { NumerologyPanel, type NumerologyMemberOption } from "./dashboard-numerology-panel-nova";
import { DashboardBabyNamesTool } from "./dashboard-tools-baby-names-nova";
import { NovaPoruthamPanel, type PoruthamFamilyMember } from "./dashboard-tools-porutham-nova";
import { NovaActivityTimingCard } from "./dashboard-today-deepdive-extras-nova";
import { VarshaphalaPanel } from "./dashboard-varshaphala-panel";
import { RasippalanTool } from "@/app/(marketing)/tools/indraiya-rasipalan/RasippalanTool";
import { MuhurtaTool } from "@/app/(marketing)/tools/muhurta-calculator/MuhurtaTool";
import { SynastryMatrix } from "./synastry-matrix";
import { SynastryPanel } from "./dashboard-synastry-panel";
import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";

/**
 * Nova rebuild of the Tools tab (see docs/DASHBOARD_UI_REVAMP_PLAN.md §6.12).
 * Confirmed via grep that `tool-card.tsx`/`tools-grid.tsx` (§3's original
 * mapping guess) are dead code — Classic's real Tools tab is the inline
 * "cd-tools-v3" markup in dashboard-workspace.tsx, which had never had a
 * `uiVariant` branch at all (the reason "Tools doesn't look like the new
 * design" — every other tab has had a Nova pass, this one hadn't). Reuses
 * the exact same `showPorutham`/`showChartGenerate`/`showWrapped`/
 * `showRetrospective` state and `activeTool`/`onOpenTool`/`onCloseTool`
 * derivation Classic's branch already has (hoisted one level up in
 * dashboard-workspace.tsx so both uiVariant branches share it, no second
 * copy of the state).
 */

// The deferred Classic panels (chart generation / annual wrapped /
// retrospective / rasipalan) read the older Classic scoped token families
// directly. The legacy-token to Nova semantic-color bridge that
// reskins them to native Nova dark now lives as the scoped `.nova-tool-island`
// rule in dashboard-nova.css (audit A1 — keeps this component literal-free while
// the bridge behaviour is unchanged; the redirect stays scoped to the island,
// not blanket-applied to these widely-shared raw names).
function NovaToolIsland({ children }: { children: React.ReactNode }) {
  return <div className="nova-tool-island">{children}</div>;
}

type ToolCardSpec = {
  id: string;
  /** B-8 — one icon language (lucide) across the launcher grid, not per-OS emoji. */
  icon: LucideIcon;
  color: string;
  nameEn: string;
  nameTa: string;
  descEn: string;
  descTa: string;
  metaEn: string;
  metaTa: string;
  disabled?: boolean;
  kind: "inline" | "cross-nav";
};

export type DashboardToolsTabNovaProps = {
  lang: Lang;
  activeTool: string | null;
  needsProfile: boolean;
  onOpenTool: (toolId: string) => void;
  onCloseTool: () => void;
  showPorutham: boolean;
  showChartGenerate: boolean;
  showWrapped: boolean;
  showRetrospective: boolean;
  showRasipalan: boolean;
  showActivityTiming: boolean;
  showVarshaphala: boolean;
  showSynastry: boolean;
  /** Numerology (Phase 7) — chart-aware Chaldean readings, gated on the
   *  `numerology_engine` flag (ON since 2026-07-28). If that flag is ever off
   *  in a given environment every route behind it 404s, which the panel
   *  renders as "not switched on yet" rather than as an error. */
  showNumerology: boolean;
  /** Baby Name Finder — its own tool, not a Numerology view. Takes raw birth
   *  details (no saved profile needed), gated on `numerology_baby_naming`. */
  showBabyNames: boolean;
  varshaphalaData: VarshaphalaData | null;
  varshaphalaLoading: boolean;
  onLoadVarshaphala: (year: number) => void;
  personalChartId: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  familyVaultId?: string;
  familyMembersForPorutham: PoruthamFamilyMember[];
  /** Family members with a saved chart, for the Numerology tool's "Reading
   *  for" switcher — same source as `synastryMemberCharts`, no extra fetch. */
  numerologyMembers: NumerologyMemberOption[];
  /** Compatibility (synastry) tool — cross-chart reads for the family. Owner
   *  chart + the vault's member charts feed the same SynastryMatrix/SynastryPanel
   *  the Family page used to host (moved here 2026-07-21). */
  ownerChart: ChartCalculateResponseData | null;
  synastryMemberCharts: MemberChart[];
  synastryMemberOptions: { memberId: string; displayName: string; relationshipToOwner?: string }[];
  relationshipAlerts: RelationshipAlertItem[];
  relationshipAlertsLoading: boolean;
  onGoToPlan: () => void;
  onGoToCalendar: () => void;
  onOpenAskVinaadi: () => void;
};

export function DashboardToolsTabNova({
  lang,
  activeTool,
  needsProfile,
  onOpenTool,
  onCloseTool,
  showPorutham,
  showChartGenerate,
  showWrapped,
  showRetrospective,
  showRasipalan,
  showActivityTiming,
  showVarshaphala,
  showSynastry,
  showNumerology,
  showBabyNames,
  varshaphalaData,
  varshaphalaLoading,
  onLoadVarshaphala,
  personalChartId,
  selectedDate,
  onDateChange,
  familyVaultId,
  familyMembersForPorutham,
  numerologyMembers,
  ownerChart,
  synastryMemberCharts,
  synastryMemberOptions,
  relationshipAlerts,
  relationshipAlertsLoading,
  onGoToPlan,
  onGoToCalendar,
  onOpenAskVinaadi,
}: DashboardToolsTabNovaProps) {
  const ownerChartId = ownerChart?.chartId ?? personalChartId;
  const TOOLS: ToolCardSpec[] = [
    {
      id: "chartgen", icon: ScrollText, color: "var(--color-accent-strong)",
      nameEn: "Jadhagam Generator", nameTa: "ஜாதகம் உருவாக்கி",
      descEn: "Full horoscope from birth details — D1 & D9 charts, dasa table, yogams — as a shareable PDF.",
      descTa: "பிறந்த விவரங்களிலிருந்து முழு ஜாதகம் — D1 & D9 அட்டவணைகள், தசை அட்டவணை, யோகங்கள் — PDF ஆக.",
      metaEn: "needs · birth details", metaTa: "தேவை · பிறப்பு விவரங்கள்", kind: "inline",
    },
    {
      id: "wrapped", icon: CalendarDays, color: "var(--color-accent-secondary)",
      nameEn: "Annual Wrapped", nameTa: "ஆண்டு சுருக்கம்",
      descEn: "Review the dasa transitions and Jothidam themes that shaped a year.",
      descTa: "ஒரு ஆண்டை வடிவமைத்த தசை மாற்றங்கள் மற்றும் ஜோதிட கருப்பொருள்கள்.",
      metaEn: "uses · your saved chart", metaTa: "பயன்படுத்துவது · உங்கள் ஜாதகம்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "retro", icon: History, color: "var(--color-high)",
      nameEn: "Retrospective", nameTa: "பின்னோக்கு பார்வை",
      descEn: "Enter a past event and compare it with dasha and transit signatures.",
      descTa: "கடந்த நிகழ்வை தசை மற்றும் கிரகநகர்வு வடிவங்களுடன் ஒப்பிடு.",
      metaEn: "uses · your saved chart", metaTa: "பயன்படுத்துவது · உங்கள் ஜாதகம்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "muhurta", icon: Sunrise, color: "var(--color-high)",
      nameEn: "Muhurta Finder", nameTa: "முகூர்த்தம்",
      descEn: "Best date and hour for a wedding, gruhapravesam or new venture — scored against your chart.",
      descTa: "திருமணம், கிரகப்பிரவேசம் அல்லது புதிய முயற்சிக்கான சிறந்த தேதி/நேரம் — உங்கள் ஜாதகத்திற்கேற்ப.",
      metaEn: "needs · birth details", metaTa: "தேவை · பிறப்பு விவரங்கள்", kind: "inline",
    },
    {
      id: "panchangam", icon: Moon, color: "var(--color-accent-secondary)",
      nameEn: "Panchangam Planner", nameTa: "பஞ்சாங்கம்",
      descEn: "Day-by-day almanac for any date and place — nalla neram, rahu kalam, tithi and star windows.",
      descTa: "எந்த தேதி மற்றும் இடத்திற்கும் அன்றாட பஞ்சாங்கம் — நல்ல நேரம், ராகு காலம், திதி, நட்சத்திரம்.",
      metaEn: "in · Calendar tab", metaTa: "இதில் · Calendar தாவல்", kind: "cross-nav",
    },
    {
      id: "rasipalan", icon: Sparkles, color: "var(--color-accent-strong)",
      nameEn: "Indraiya Rasipalan", nameTa: "இன்றைய ராசிபலன்",
      descEn: "Today's palan for all 12 rasis — read one for a friend, or share the day's outlook.",
      descTa: "12 ராசிகளுக்குமான இன்றைய பலன் — நண்பருக்காக படியுங்கள் அல்லது பகிருங்கள்.",
      metaEn: "today's transits", metaTa: "இன்றைய கிரகநிலை", kind: "inline",
    },
    {
      id: "activityTiming", icon: Timer, color: "var(--color-high)",
      nameEn: "Activity Timing", nameTa: "செயல் நேரம்",
      descEn: "Find the strongest dates this month for travel, signing, moving in, or any activity — scored against your chart.",
      descTa: "பயணம், ஒப்பந்தம், வீடு மாறுதல் அல்லது எந்த செயலுக்கும் இந்த மாதம் சிறந்த தேதிகளைக் கண்டறியுங்கள் — உங்கள் ஜாதகத்திற்கேற்ப.",
      metaEn: "uses · your saved chart", metaTa: "பயன்படுத்துவது · உங்கள் ஜாதகம்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "varshaphala", icon: CalendarClock, color: "var(--color-accent-strong)",
      nameEn: "Varshaphala — Annual Chart", nameTa: "வர்ஷபலம் — ஆண்டு ஜாதகம்",
      descEn: "Your solar-return year chart — muntha, year lord, and a month-by-month outlook for any year.",
      descTa: "உங்கள் சூரிய வருடாந்திர ஜாதகம் — முந்தை, ஆண்டு அதிபதி, மற்றும் மாதம் வாரியான பலன்.",
      metaEn: "uses · your saved chart", metaTa: "பயன்படுத்துவது · உங்கள் ஜாதகம்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "synastry", icon: HeartHandshake, color: "var(--color-accent-secondary)",
      nameEn: "Compatibility", nameTa: "பொருத்தம் / இணக்கம்",
      descEn: "Cross-chart synastry for any two people in your family — a harmony score, supportive and tension points, and a relationship read.",
      descTa: "உங்கள் குடும்பத்தில் இருவரின் ஜாதகப் பொருத்தம் — இணக்க மதிப்பெண், ஆதரவு/பதற்றப் புள்ளிகள், உறவு விளக்கம்.",
      metaEn: "uses · your family charts", metaTa: "பயன்படுத்துவது · குடும்ப ஜாதகங்கள்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "numerology", icon: Hash, color: "var(--color-accent-secondary)",
      nameEn: "Numerology", nameTa: "எண் கணிதம்",
      descEn: "Chaldean numbers read against a jadhagam — yours or any family member's — favourable numbers, fortune alignment, personal cycle and date scoring.",
      descTa: "கல்தேய எண்கள் ஒரு ஜாதகத்திற்கு எதிராகப் படிக்கப்படுகின்றன — உங்களுடையது அல்லது குடும்பத்தினர் யாருடையதும் — சாதக எண்கள், அதிர்ஷ்ட இணக்கம், தனிப்பட்ட சுழற்சி, தேதி மதிப்பீடு.",
      metaEn: "uses · your family charts", metaTa: "பயன்படுத்துவது · குடும்ப ஜாதகங்கள்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "babynames", icon: Sparkles, color: "var(--color-high)",
      nameEn: "Baby Name Finder", nameTa: "பெயர் தேடல்",
      descEn: "Names matched to a birth-nakshatra pada, ranked by Fortune Alignment — enter birth details directly, no saved profile needed. Draft: pending astrologer and native-speaker review.",
      descTa: "நட்சத்திர பாதத்திற்குப் பொருந்தும் பெயர்கள், Fortune Alignment வழியே தரவரிசைப்படுத்தப்பட்டவை — பிறப்பு விவரங்களை நேரடியாக உள்ளிடவும், சேமிக்கப்பட்ட சுயவிவரம் தேவையில்லை. வரைவு: மதிப்பாய்வு நிலுவையில்.",
      metaEn: "needs · birth details", metaTa: "தேவை · பிறப்பு விவரங்கள்", kind: "inline",
    },
  ];

  const cardStyle = (tool: ToolCardSpec): CSSProperties => ({
    background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
    padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-2)", textAlign: "left",
    cursor: tool.disabled ? "default" : "pointer", opacity: tool.disabled ? 0.55 : 1,
    fontFamily: "inherit", width: "100%",
  });

  function renderCardBody(tool: ToolCardSpec) {
    const isGenericMuhurta = tool.id === "muhurta";
    const description = isGenericMuhurta
      ? (lang === "ta" ? "யாருக்காகவும் பிறப்பு விவரங்கள், செயல் மற்றும் நிகழ்வு இடத்தை உள்ளிட்டு தனிப்பட்ட முகூர்த்தத்தைக் காணுங்கள். விவரங்கள் சேமிக்கப்படாது." : "Personalised dates and hours for anyone — enter birth details, activity and event location. Nothing is saved.")
      : (lang === "ta" ? tool.descTa : tool.descEn);
    const meta = isGenericMuhurta
      ? (lang === "ta" ? "தேவை · பிறப்பு விவரங்கள்" : "needs · birth details")
      : (lang === "ta" ? tool.metaTa : tool.metaEn);
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ flex: "none", width: "38px", height: "38px", borderRadius: "var(--radius-pill)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", color: tool.color }}>
            <tool.icon size={18} strokeWidth={2} aria-hidden focusable={false} />
          </span>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>{lang === "ta" ? tool.nameTa : tool.nameEn}</div>
        </div>
        <div style={{ fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-text)" }}>{description}</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: "auto", paddingTop: "var(--space-1)" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{meta}</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 600 }}>
            {tool.disabled ? (lang === "ta" ? "ஜாதகம் தேவை" : "Needs profile") : (lang === "ta" ? "திற" : "Open")}
            {!tool.disabled && <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />}
          </span>
        </div>
      </>
    );
  }

  if (activeTool) {
    const tool = TOOLS.find((c) => c.id === activeTool) ?? { nameEn: "Marriage Porutham", nameTa: "பொருத்தம்" };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
          <button type="button" onClick={onCloseTool} style={{ color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "var(--text-sm)", display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" /> {lang === "ta" ? "கருவிகள்" : "Tools"}
          </button>
          <ChevronRight size={14} strokeWidth={1.5} aria-hidden="true" />
          <span style={{ color: "var(--color-text)" }}>{lang === "ta" ? tool.nameTa : tool.nameEn}</span>
        </div>

        {showPorutham && (
          <NovaPoruthamPanel lang={lang} familyVaultId={familyVaultId} familyMembers={familyMembersForPorutham} onGoToMuhurta={onGoToPlan} onOpenAskVinaadi={onOpenAskVinaadi} />
        )}
        {showChartGenerate && (
          <NovaToolIsland><ChartGenerateInlinePanel lang={lang} /></NovaToolIsland>
        )}
        {showWrapped && (
          <NovaToolIsland><DashboardAnnualWrapped chartId={personalChartId} lang={lang} /></NovaToolIsland>
        )}
        {showRetrospective && personalChartId && (
          <NovaToolIsland><RetrospectivePanel chartId={personalChartId} lang={lang} /></NovaToolIsland>
        )}
        {showRasipalan && (
          <NovaToolIsland><RasippalanTool hideCta /></NovaToolIsland>
        )}
        {activeTool === "muhurta" && (
          <NovaToolIsland><MuhurtaTool /></NovaToolIsland>
        )}
        {showActivityTiming && personalChartId && (
          <NovaActivityTimingCard lang={lang} chartId={personalChartId} selectedDate={selectedDate} onDateChange={onDateChange} />
        )}
        {showVarshaphala && personalChartId && (
          <VarshaphalaPanel lang={lang} chartId={personalChartId} data={varshaphalaData} loading={varshaphalaLoading} onLoad={onLoadVarshaphala} />
        )}
        {showNumerology && personalChartId && (
          <NumerologyPanel lang={lang} chartId={personalChartId} members={numerologyMembers} />
        )}
        {showBabyNames && <DashboardBabyNamesTool lang={lang} />}
        {showSynastry && (
          <Card style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-6) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {ownerChartId && synastryMemberCharts.length > 0 && (
              <SynastryMatrix
                lang={lang}
                ownerChartId={ownerChartId}
                familyVaultId={familyVaultId ?? ""}
                members={synastryMemberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName, chartId: mc.chart.chartId }))}
              />
            )}
            <SynastryPanel
              lang={lang}
              chartId={ownerChartId}
              familyVaultId={familyVaultId ?? ""}
              memberOptions={synastryMemberOptions}
              ownerChart={ownerChart}
              memberCharts={synastryMemberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName, chart: mc.chart }))}
              relationshipAlerts={relationshipAlerts}
              alertsLoading={relationshipAlertsLoading}
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <Kicker as="div">
          {lang === "ta" ? "கருவிகள்" : "Tools"} · <span style={{ fontFamily: "var(--font-tamil), sans-serif", letterSpacing: 0, textTransform: "none" }}>கருவிகள்</span>
        </Kicker>
        {/* audit B-1: page title is the Tools tab's sole page heading. */}
        <h1 style={{ margin: "6px 0 0", fontFamily: "var(--font-display)", fontSize: "var(--display-md)", fontWeight: 600, color: "var(--color-text-strong)" }}>
          {lang === "ta" ? "உங்கள் ஜாதகங்களை அறிந்த கருவிகள்" : "Calculators that know your charts"}
        </h1>
        <div style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", marginTop: "3px" }}>
          {lang === "ta" ? "ஒவ்வொரு கருவியும் உங்கள் சேமிக்கப்பட்ட ஜாதகங்களைப் படிக்கும் — மீண்டும் தட்டச்சு தேவையில்லை." : "Every tool reads from your saved family charts — no re-typing birth details."}
        </div>
      </div>

      {/* Hero tool: Porutham — Classic's own "most used" primary tool */}
      <button type="button" onClick={() => onOpenTool("porutham")} style={{
        background: "linear-gradient(120deg, var(--color-accent-muted), transparent)",
        border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "var(--space-6) var(--space-7)",
        display: "flex", gap: "var(--space-6)", alignItems: "center", flexWrap: "wrap", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%",
      }}>
        <div style={{ flex: "1", minWidth: "240px", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Kicker color="var(--color-accent-strong)" style={{ letterSpacing: "0.14em" }}>
              {lang === "ta" ? "அதிகம் பயன்படுத்தப்படுவது" : "Most used"}
            </Kicker>
            <span style={{ fontFamily: "var(--font-tamil), sans-serif", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>திருமணப் பொருத்தம்</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "பொருத்தம் / இணக்கம்" : "Marriage Porutham"}
          </div>
          <div style={{ fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-text)", maxWidth: "560px" }}>
            {lang === "ta"
              ? "தினம் முதல் வேதை வரை முழு 10 பொருத்த சோதனை — ரஜ்ஜு மற்றும் செவ்வாய் தோஷ குறுக்கு சோதனைகளுடன், எளிய வார்த்தைகளில் ஒரு தீர்ப்பு. திருமணம், நட்பு, வியாபாரம் அல்லது குடும்பம் — அனைத்திற்கும்."
              : "The full 10-porutham match — Dinam to Vethai — with Rajju and Sevvai dosham cross-checks, and a verdict in plain words. Covers marriage, friendship, business, or family contexts."}
          </div>
        </div>
        <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "var(--space-1)", background: "var(--color-accent)", color: "var(--color-on-accent)", borderRadius: "var(--radius-sm)", padding: "var(--space-3) var(--space-6)", fontSize: "var(--text-sm)", fontWeight: 700 }}>
          {lang === "ta" ? "பொருத்தம் ஓட்டு" : "Run porutham"}
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </span>
      </button>

      {/* Tools grid */}
      <div className="nova-grid-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            disabled={tool.disabled}
            onClick={() => {
              if (tool.kind === "cross-nav") { onGoToCalendar(); return; }
              onOpenTool(tool.id);
            }}
            style={cardStyle(tool)}
          >
            {renderCardBody(tool)}
          </button>
        ))}
      </div>

      {/* Recent results — genuine stub, no tool-run history is tracked anywhere in the backend (confirmed by grep) */}
      <Card style={{ borderRadius: "var(--radius-lg)", padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <Kicker style={{ letterSpacing: "0.1em" }}>
          {lang === "ta" ? "சமீபத்திய முடிவுகள்" : "Recent results"}
        </Kicker>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
          {lang === "ta"
            ? "கருவி இயக்க வரலாறு இன்னும் சேமிக்கப்படவில்லை — விரைவில்."
            : "Tool run history isn't tracked yet — coming soon."}
        </p>
      </Card>
    </div>
  );
}
