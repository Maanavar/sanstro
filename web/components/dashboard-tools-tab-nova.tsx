"use client";

import type { CSSProperties } from "react";

import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData, RelationshipAlertItem, VarshaphalaData } from "@/lib/types";
import type { MemberChart } from "@/hooks/useFamilyData";

import { ChartGenerateInlinePanel } from "./chart-generate-inline-panel";
import { DashboardAnnualWrapped } from "./dashboard-annual-wrapped";
import { RetrospectivePanel } from "./dashboard-retrospective-panel";
import { NovaPoruthamPanel, type PoruthamFamilyMember } from "./dashboard-tools-porutham-nova";
import { NovaActivityTimingCard } from "./dashboard-today-deepdive-extras-nova";
import { VarshaphalaPanel } from "./dashboard-varshaphala-panel";
import { RasippalanTool } from "@/app/tools/indraiya-rasipalan/RasippalanTool";
import { SynastryMatrix } from "./synastry-matrix";
import { SynastryPanel } from "./dashboard-synastry-panel";

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
// retrospective / rasipalan — each 300-700 lines of its own stateful UI, none
// captured in the Nova tools mockups) read the older `--panel-*`/`--chart-*`/
// `--chartgrid-*` token family directly. Nova's base .cd-shell only redirects
// *some* of those names (the ones shared with already-migrated components), so
// left alone these panels render the broken dark-bg + near-black-text combo
// that a partial redirect produces. Earlier this was worked around by forcing
// the whole island back to Classic light values; per the 2026-07 UI pass it's
// now reskinned to native Nova dark instead — every token this family uses is
// mapped to its Nova --color-* equivalent, scoped locally to the island (via
// var() so it tracks the ambient Nova palette) rather than blanket-redirecting
// these widely-shared raw names in dashboard-nova.css, which the existing
// --chartgrid-/--deepdive-/--yogadosham- scoped-fallback blocks deliberately
// avoided doing. --color-faint is intentionally NOT pinned here — the panels
// should inherit Nova's own faint on the dark surface.
const NOVA_TOOL_ISLAND_STYLE: CSSProperties = {
  "--panel-brand": "var(--color-accent)",
  "--panel-cream": "var(--color-surface)",
  "--panel-earth": "var(--color-text)",
  "--panel-earth-dark": "var(--color-text-strong)",
  "--panel-tan": "var(--color-border)",
  "--panel-tan-light": "var(--color-border)",
  "--panel-hover": "var(--color-surface-2)",
  "--panel-warm-light": "var(--color-accent-muted)",
  "--chart-cell-default": "var(--color-surface-soft)",
  "--chart-d9-active": "var(--color-high)",
  "--chart-amber": "var(--color-accent-strong)",
  "--planet-saturn": "var(--color-low)",
  "--dignity-neecha": "var(--color-low)",
  "--ring-brand": "var(--color-accent-muted)",
  "--chartgrid-ink": "var(--color-text-strong)",
  "--chartgrid-ink-strong": "var(--color-text-strong)",
  "--chartgrid-border": "var(--color-border)",
  "--chartgrid-border-light": "var(--color-border)",
  "--chartgrid-surface": "var(--color-surface-soft)",
  // Rasipalan (indraiya-rasipalan/RasippalanTool) is the one panel here built
  // on the older Classic `--cl-*` token family instead of --panel-*/--chart-*.
  // Nova's base .cd-shell only redirects a handful of --cl-* names (sage-edge,
  // rust-edge, brand-edge…), so the rest resolve to Classic *light* values and
  // the tool renders the old light-on-dark look inside the Nova island. Map the
  // full set it uses to their Nova --color-* equivalents (via var() so they
  // track the ambient Nova palette), same approach as the --panel-*/--chart-*
  // block above. Safe on the shared island: the other panels (chartgen /
  // wrapped / retrospective) use no --cl-* tokens at all.
  "--cl-surface": "var(--color-surface)",
  "--cl-bg": "var(--color-bg)",
  "--cl-bg-2": "var(--color-surface-soft)",
  "--cl-border": "var(--color-border)",
  "--cl-accent": "var(--color-accent)",
  "--cl-ink": "var(--color-text-strong)",
  "--cl-ink-2": "var(--color-text)",
  "--cl-muted": "var(--color-muted)",
  "--cl-brand-tint": "var(--color-accent-muted)",
  "--cl-brand-ring-md": "var(--color-border-strong)",
  "--cl-sage-tint": "var(--color-high-bg)",
  "--cl-sage-mid": "var(--color-high-border)",
  "--cl-neutral-tint": "var(--color-surface-soft)",
  "--cl-neutral-ring": "var(--color-border)",
  "--cl-neutral-mid": "var(--color-border-strong)",
  "--cl-neutral-ink": "var(--color-text)",
  "--cl-rust-tint": "var(--color-low-bg)",
  "--cl-rust-fill": "var(--color-low-bg)",
  "--cl-rust-ring": "var(--color-low-border)",
  "--cl-rust-mid": "var(--color-low-border)",
  "--veil-white-55": "var(--color-surface)",
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "14px",
  padding: "22px 24px",
} as CSSProperties;

function NovaToolIsland({ children }: { children: React.ReactNode }) {
  return <div style={NOVA_TOOL_ISLAND_STYLE}>{children}</div>;
}

type ToolCardSpec = {
  id: string;
  icon: string;
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
  varshaphalaData: VarshaphalaData | null;
  varshaphalaLoading: boolean;
  onLoadVarshaphala: (year: number) => void;
  personalChartId: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  familyVaultId?: string;
  familyMembersForPorutham: PoruthamFamilyMember[];
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
  varshaphalaData,
  varshaphalaLoading,
  onLoadVarshaphala,
  personalChartId,
  selectedDate,
  onDateChange,
  familyVaultId,
  familyMembersForPorutham,
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
      id: "chartgen", icon: "📜", color: "var(--color-accent-strong)",
      nameEn: "Jadhagam Generator", nameTa: "ஜாதகம் உருவாக்கி",
      descEn: "Full horoscope from birth details — D1 & D9 charts, dasa table, yogams — as a shareable PDF.",
      descTa: "பிறந்த விவரங்களிலிருந்து முழு ஜாதகம் — D1 & D9 அட்டவணைகள், தசை அட்டவணை, யோகங்கள் — PDF ஆக.",
      metaEn: "needs · birth details", metaTa: "தேவை · பிறப்பு விவரங்கள்", kind: "inline",
    },
    {
      id: "wrapped", icon: "🗓", color: "var(--color-accent-secondary)",
      nameEn: "Annual Wrapped", nameTa: "ஆண்டு சுருக்கம்",
      descEn: "Review the dasa transitions and Jothidam themes that shaped a year.",
      descTa: "ஒரு ஆண்டை வடிவமைத்த தசை மாற்றங்கள் மற்றும் ஜோதிட கருப்பொருள்கள்.",
      metaEn: "uses · your saved chart", metaTa: "பயன்படுத்துவது · உங்கள் ஜாதகம்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "retro", icon: "🔍", color: "var(--color-high)",
      nameEn: "Retrospective", nameTa: "பின்னோக்கு பார்வை",
      descEn: "Enter a past event and compare it with dasha and transit signatures.",
      descTa: "கடந்த நிகழ்வை தசை மற்றும் கிரகநகர்வு வடிவங்களுடன் ஒப்பிடு.",
      metaEn: "uses · your saved chart", metaTa: "பயன்படுத்துவது · உங்கள் ஜாதகம்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "muhurta", icon: "☀", color: "var(--color-high)",
      nameEn: "Muhurta Finder", nameTa: "முகூர்த்தம்",
      descEn: "Best date and hour for a wedding, gruhapravesam or new venture — scored against your chart.",
      descTa: "திருமணம், கிரகப்பிரவேசம் அல்லது புதிய முயற்சிக்கான சிறந்த தேதி/நேரம் — உங்கள் ஜாதகத்திற்கேற்ப.",
      metaEn: "in · Plan tab", metaTa: "இதில் · Plan தாவல்", kind: "cross-nav",
    },
    {
      id: "panchangam", icon: "◐", color: "var(--color-accent-secondary)",
      nameEn: "Panchangam Planner", nameTa: "பஞ்சாங்கம்",
      descEn: "Day-by-day almanac for any date and place — nalla neram, rahu kalam, tithi and star windows.",
      descTa: "எந்த தேதி மற்றும் இடத்திற்கும் அன்றாட பஞ்சாங்கம் — நல்ல நேரம், ராகு காலம், திதி, நட்சத்திரம்.",
      metaEn: "in · Calendar tab", metaTa: "இதில் · Calendar தாவல்", kind: "cross-nav",
    },
    {
      id: "rasipalan", icon: "✦", color: "var(--color-accent-strong)",
      nameEn: "Indraiya Rasipalan", nameTa: "இன்றைய ராசிபலன்",
      descEn: "Today's palan for all 12 rasis — read one for a friend, or share the day's outlook.",
      descTa: "12 ராசிகளுக்குமான இன்றைய பலன் — நண்பருக்காக படியுங்கள் அல்லது பகிருங்கள்.",
      metaEn: "today's transits", metaTa: "இன்றைய கிரகநிலை", kind: "inline",
    },
    {
      id: "activityTiming", icon: "⏱", color: "var(--color-high)",
      nameEn: "Activity Timing", nameTa: "செயல் நேரம்",
      descEn: "Find the strongest dates this month for travel, signing, moving in, or any activity — scored against your chart.",
      descTa: "பயணம், ஒப்பந்தம், வீடு மாறுதல் அல்லது எந்த செயலுக்கும் இந்த மாதம் சிறந்த தேதிகளைக் கண்டறியுங்கள் — உங்கள் ஜாதகத்திற்கேற்ப.",
      metaEn: "uses · your saved chart", metaTa: "பயன்படுத்துவது · உங்கள் ஜாதகம்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "varshaphala", icon: "☀", color: "var(--color-accent-strong)",
      nameEn: "Varshaphala — Annual Chart", nameTa: "வர்ஷபலம் — ஆண்டு ஜாதகம்",
      descEn: "Your solar-return year chart — muntha, year lord, and a month-by-month outlook for any year.",
      descTa: "உங்கள் சூரிய வருடாந்திர ஜாதகம் — முந்தை, ஆண்டு அதிபதி, மற்றும் மாதம் வாரியான பலன்.",
      metaEn: "uses · your saved chart", metaTa: "பயன்படுத்துவது · உங்கள் ஜாதகம்", disabled: needsProfile, kind: "inline",
    },
    {
      id: "synastry", icon: "◇", color: "var(--color-accent-secondary)",
      nameEn: "Compatibility", nameTa: "பொருத்தம் / இணக்கம்",
      descEn: "Cross-chart synastry for any two people in your family — a harmony score, supportive and tension points, and a relationship read.",
      descTa: "உங்கள் குடும்பத்தில் இருவரின் ஜாதகப் பொருத்தம் — இணக்க மதிப்பெண், ஆதரவு/பதற்றப் புள்ளிகள், உறவு விளக்கம்.",
      metaEn: "uses · your family charts", metaTa: "பயன்படுத்துவது · குடும்ப ஜாதகங்கள்", disabled: needsProfile, kind: "inline",
    },
  ];

  const cardStyle = (tool: ToolCardSpec): CSSProperties => ({
    background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px",
    padding: "20px 22px", display: "flex", flexDirection: "column", gap: "9px", textAlign: "left",
    cursor: tool.disabled ? "default" : "pointer", opacity: tool.disabled ? 0.55 : 1,
    fontFamily: "inherit", width: "100%",
  });

  function renderCardBody(tool: ToolCardSpec) {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <span style={{ flex: "none", width: "38px", height: "38px", borderRadius: "50%", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", fontSize: "16px", color: tool.color }}>{tool.icon}</span>
          <div style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--color-text-strong)" }}>{lang === "ta" ? tool.nameTa : tool.nameEn}</div>
        </div>
        <div style={{ fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-text)" }}>{lang === "ta" ? tool.descTa : tool.descEn}</div>
        <div style={{ display: "flex", alignItems: "center", marginTop: "auto", paddingTop: "4px" }}>
          <span style={{ fontSize: "11px", color: "var(--color-faint)" }}>{lang === "ta" ? tool.metaTa : tool.metaEn}</span>
          <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600 }}>
            {tool.disabled ? (lang === "ta" ? "ஜாதகம் தேவை" : "Needs profile") : (lang === "ta" ? "திற →" : "Open →")}
          </span>
        </div>
      </>
    );
  }

  if (activeTool) {
    const tool = TOOLS.find((c) => c.id === activeTool) ?? { nameEn: "Marriage Porutham", nameTa: "பொருத்தம்" };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--color-muted)" }}>
          <button type="button" onClick={onCloseTool} style={{ color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span aria-hidden="true">←</span> {lang === "ta" ? "கருவிகள்" : "Tools"}
          </button>
          <span>›</span>
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
        {showActivityTiming && personalChartId && (
          <NovaActivityTimingCard lang={lang} chartId={personalChartId} selectedDate={selectedDate} onDateChange={onDateChange} />
        )}
        {showVarshaphala && personalChartId && (
          <VarshaphalaPanel lang={lang} chartId={personalChartId} data={varshaphalaData} loading={varshaphalaLoading} onLoad={onLoadVarshaphala} />
        )}
        {showSynastry && (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
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
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <div>
        <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "var(--color-text-accent)", textTransform: "uppercase", fontWeight: 700 }}>
          {lang === "ta" ? "கருவிகள்" : "Tools"} · <span style={{ fontFamily: "var(--font-tamil), sans-serif", letterSpacing: 0, textTransform: "none" }}>கருவிகள்</span>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontWeight: 600, marginTop: "6px", color: "var(--color-text-strong)" }}>
          {lang === "ta" ? "உங்கள் ஜாதகங்களை அறிந்த கருவிகள்" : "Calculators that know your charts"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-muted)", marginTop: "3px" }}>
          {lang === "ta" ? "ஒவ்வொரு கருவியும் உங்கள் சேமிக்கப்பட்ட ஜாதகங்களைப் படிக்கும் — மீண்டும் தட்டச்சு தேவையில்லை." : "Every tool reads from your saved family charts — no re-typing birth details."}
        </div>
      </div>

      {/* Hero tool: Porutham — Classic's own "most used" primary tool */}
      <button type="button" onClick={() => onOpenTool("porutham")} style={{
        background: "linear-gradient(120deg, var(--color-accent-muted), rgba(212,175,95,.05))",
        border: "1px solid var(--color-border-strong)", borderRadius: "14px", padding: "24px 26px",
        display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", cursor: "pointer", fontFamily: "inherit", textAlign: "left", width: "100%",
      }}>
        <div style={{ flex: "1", minWidth: "240px", display: "flex", flexDirection: "column", gap: "9px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent-strong)", fontWeight: 700 }}>
              {lang === "ta" ? "அதிகம் பயன்படுத்தப்படுவது" : "Most used"}
            </span>
            <span style={{ fontFamily: "var(--font-tamil), sans-serif", fontSize: "12.5px", color: "var(--color-muted)" }}>திருமணப் பொருத்தம்</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 600, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "பொருத்தம் / இணக்கம்" : "Marriage Porutham"}
          </div>
          <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--color-text)", maxWidth: "560px" }}>
            {lang === "ta"
              ? "தினம் முதல் வேதை வரை முழு 10 பொருத்த சோதனை — ரஜ்ஜு மற்றும் செவ்வாய் தோஷ குறுக்கு சோதனைகளுடன், எளிய வார்த்தைகளில் ஒரு தீர்ப்பு. திருமணம், நட்பு, வியாபாரம் அல்லது குடும்பம் — அனைத்திற்கும்."
              : "The full 10-porutham match — Dinam to Vethai — with Rajju and Sevvai dosham cross-checks, and a verdict in plain words. Covers marriage, friendship, business, or family contexts."}
          </div>
        </div>
        <span style={{ flex: "none", background: "var(--color-accent)", color: "var(--color-on-accent)", borderRadius: "9px", padding: "11px 22px", fontSize: "12.5px", fontWeight: 700 }}>
          {lang === "ta" ? "பொருத்தம் ஓட்டு →" : "Run porutham →"}
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
              if (tool.kind === "cross-nav") { if (tool.id === "muhurta") onGoToPlan(); else onGoToCalendar(); return; }
              onOpenTool(tool.id);
            }}
            style={cardStyle(tool)}
          >
            {renderCardBody(tool)}
          </button>
        ))}
      </div>

      {/* Recent results — genuine stub, no tool-run history is tracked anywhere in the backend (confirmed by grep) */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "18px 22px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
          {lang === "ta" ? "சமீபத்திய முடிவுகள்" : "Recent results"}
        </span>
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>
          {lang === "ta"
            ? "கருவி இயக்க வரலாறு இன்னும் சேமிக்கப்படவில்லை — விரைவில்."
            : "Tool run history isn't tracked yet — coming soon."}
        </p>
      </div>
    </div>
  );
}
