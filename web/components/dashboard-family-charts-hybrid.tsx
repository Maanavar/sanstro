"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { apiFetchJson } from "@/lib/api";
import { formatClockLabel, scoreColor } from "@/lib/format";
import { dt } from "@/lib/dashboard-i18n";
import {
  CARE_FILTER_NOTE,
  activeSaniCycles,
  careReasonLabel,
  careReasonNote,
  memberCareReason,
  saniCycleName,
  saniCycleNote,
  type CareReason,
} from "@/lib/family-flags";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import { compareSynastry } from "@vinaadi/shared/api/relationships";
import type {
  ChartCalculateResponseData,
  CharaDashaData,
  FamilyAggregateData,
  FamilyAggregateMember,
  FamilyCompositeTimelineData,
  FamilyMemberData,
  FamilyMemberTodayScore,
  FamilyVaultDetailData,
  FamilyVaultListItem,
  FamilyVaultTodayData,
  LifeAreasResponseData,
  PanchangamDailyResponseData,
  RelationshipAlertItem,
  SaniCycleData,
  SolarReturnData,
} from "@/lib/types";
import type { MemberChart } from "@/hooks/useFamilyData";
import { useApiQuery } from "@/hooks/useApiQuery";

import { formatChandrashtamaWindowSummary, formatHeaderDate, getTamilMonthDate } from "./dashboard-calendar-shared";
import {
  ScoreRing,
  formatRelLabel,
  FamilySevenDayOutlook,
  ageFromBirth,
} from "./dashboard-family-shared";
import { DashboardFamilyMemberNova } from "./dashboard-family-member-nova";
import { DashboardOneMinuteReading } from "./dashboard-one-minute-reading";
import { DashboardFiveMinuteReading } from "./dashboard-five-minute-reading";
import { NovaScoreDial } from "./dashboard-ui-nova";
import { DashboardFamilyHarmonyRemedies } from "./dashboard-family-harmony-remedies";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
import { Card, Chip, Kicker } from "./ui";
import { NakshatraBadge } from "./nakshatra-badge";
import { AdvancedAstrologyGate } from "./advanced-astrology-gate";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { NovaYogaDoshamPanel } from "./dashboard-life-areas-yogas-doshams-nova";
import { VargasPanel } from "./dashboard-vargas-panel";
import { ShadbalaPanel } from "./dashboard-shadbala-panel";
import { YoginiDashaPanel } from "./dashboard-yogini-dasha-panel";
import { AshtottariDashaPanel } from "./dashboard-ashtottari-dasha-panel";
import { KalachakraDashaPanel } from "./dashboard-kalachakra-dasha-panel";
import { ConditionalDashasPanel } from "./dashboard-conditional-dashas-panel";
import { CollapsibleSection } from "./collapsible-section";
import {
  NovaChartValidationChip,
} from "./dashboard-today-deepdive-extras-nova";
import { ShareCardButton } from "./dashboard-share-card";
import { ChandrashtamaCard, downloadJadhagamPdf } from "./dashboard-personal-shared";
import {
  HySection,
  HyPlanetOrbs,
  HyBhavaTable,
  HyBhuktiTimeline,
  HyTodayFacts,
  HyProfileCard,
  HyYogaDoshaCard,
  HyStrengthsWatchoutsCard,
  HyRemediesCard,
  HyLifeAreaForecast,
  HyTransitOverview,
  HyDetailedForecast,
  HyDailyAffirmation,
} from "./dashboard-hybrid-parts";
import { DashboardAskVinaadi } from "./dashboard-ask-vinaadi";
import { RASI_TRAITS } from "@/lib/rasi-traits";
import { RASI_LORDS, D1_RASI_NAMES } from "@/lib/chart-utils";
import { ZodiacBadge } from "./zodiac-badge";

/**
 * Family & Charts — "Hybrid v2" graphical redesign (imported from the Claude
 * Design mockup of the same name). A single-scroll, section-railed page where
 * **selecting a member drives every reading section below it**.
 *
 * This is the default Family tab (promoted 2026-07-22, replacing the earlier
 * DashboardFamilyTabNova). Every function of the previous tab is preserved —
 * see the function-preservation checklist in the plan. Content that lives on
 * other tabs (Predictions/Forecast, Transits, AI/Notes) is a link-out card
 * here, never a second implementation.
 *
 * All colour resolves through CSS tokens so the page renders in both themes.
 */

const ELDER_AGE = 60;
const MINOR_AGE = 18;

type RelationBucket = "elder" | "adult" | "child";
type RelationFilter = "all" | RelationBucket | "needsCare";

function ageBucket(age: number | null | undefined): RelationBucket {
  if (age == null || Number.isNaN(age)) return "adult";
  if (age < MINOR_AGE) return "child";
  if (age >= ELDER_AGE) return "elder";
  return "adult";
}

/** Two independent sources say the same thing, and either can be missing:
 *  the aggregate's cycle tag arrives with the member list, while the transit
 *  snapshot only lands once that member's chart bundle resolves (and stays
 *  null if it failed). Reading both means the flag shows on first paint and
 *  survives a bundle error, instead of appearing a beat late or not at all. */
function memberIsChandrashtama(member: FamilyAggregateMember, chart: MemberChart | undefined): boolean {
  if (chart?.transit?.isChandrashtama) return true;
  return member.activeCycleTags.includes("CHANDRASHTAMA");
}


const FAMILY_HERO_TEXT: Record<string, { en: string; ta: string }> = {
  STRONG_FAMILY_DAY: { en: "Strongly supportive — a great day to move together.", ta: "மிகவும் சாதகமான நாள் — ஒன்றாக முன்னேற சிறந்த நேரம்." },
  SUPPORTIVE:         { en: "Supportive — keep plans calm and steady.",            ta: "ஆதரவான நாள் — திட்டங்களை அமைதியாக வையுங்கள்." },
  SUPPORTIVE_MIXED:   { en: "Supportive, mixed — lead the day together.",          ta: "ஆதரவும் கலப்பும் — நாளை ஒன்றாக வழிநடத்துங்கள்." },
  CARE_REQUIRED:      { en: "Care required — keep it simple today.",              ta: "கவனம் தேவை — இன்று எளிமையாக வையுங்கள்." },
  REST_AND_REFLECT:   { en: "A quieter day — rest and reflect together.",          ta: "அமைதியான நாள் — ஒன்றாக ஓய்வெடுங்கள்." },
};

function bondToneLine(score: number, lang: Lang): string {
  if (score >= 65) return lang === "ta" ? "அரவணைப்பான, ஆதரவான பொருத்தம்" : "warm and supportive";
  if (score >= 50) return lang === "ta" ? "நிலையான, பொதுவாக இணக்கமான பொருத்தம்" : "steady, generally aligned";
  if (score >= 40) return lang === "ta" ? "கலவையான பொருத்தம் — எளிமையாக வையுங்கள்" : "mixed — keep things simple";
  return lang === "ta" ? "பொறுமை தேவைப்படும் பொருத்தம்" : "needs a little patience";
}

/** Minutes since midnight, clamped to a 6am–6pm display axis. */
function timeToAxisPct(hm: string | undefined): number | null {
  if (!hm) return null;
  const [hStr, mStr] = hm.split(":");
  const h = Number.parseInt(hStr ?? "", 10);
  const m = Number.parseInt(mStr ?? "0", 10);
  if (Number.isNaN(h)) return null;
  const minutes = h * 60 + (Number.isNaN(m) ? 0 : m);
  const start = 6 * 60;
  const end = 18 * 60;
  return Math.max(0, Math.min(100, ((minutes - start) / (end - start)) * 100));
}

/* ── Today's rhythm sparkline card (day-arc SVG, ported from the Nova family
      tab; the sun rides exactly on the drawn quadratic stroke). ─────────── */
function HyRhythmCard({
  lang,
  selectedDate,
  bestWindow,
  avoidWindow,
  careMembers,
  brightMembers,
  rahuKalam,
  yamagandam,
}: {
  lang: Lang;
  selectedDate: string;
  bestWindow: { start: string; end: string } | null;
  avoidWindow: { start: string; end: string } | null;
  careMembers: { displayName: string; note: string }[];
  brightMembers: { displayName: string; score: number }[];
  rahuKalam?: { start: string; end: string };
  yamagandam?: { start: string; end: string };
}) {
  const bestStartPct = timeToAxisPct(bestWindow?.start);
  const bestEndPct = timeToAxisPct(bestWindow?.end);
  const avoidStartPct = timeToAxisPct(avoidWindow?.start);
  const avoidEndPct = timeToAxisPct(avoidWindow?.end);
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const nowPct = isToday ? timeToAxisPct(`${new Date().getHours()}:${new Date().getMinutes()}`) : null;

  const ARC_X0 = 20, ARC_X1 = 300, ARC_SPAN = ARC_X1 - ARC_X0;
  const ARC_BASE = 74, ARC_PEAK = 16;
  const pctToX = (pct: number) => ARC_X0 + (pct / 100) * ARC_SPAN;
  const sunX = nowPct != null ? pctToX(nowPct) : null;
  const sunY = nowPct != null ? ARC_BASE - 2 * (nowPct / 100) * (1 - nowPct / 100) * (ARC_BASE - ARC_PEAK) : null;

  return (
    <Card style={{ padding: "var(--space-6) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-accent-strong)" }}>
        {lang === "ta" ? "இன்றைய தாளம்" : "Today's rhythm"}
      </div>
      <div>
        <svg viewBox="0 0 320 92" style={{ width: "100%", height: "auto", display: "block" }} preserveAspectRatio="xMidYMid meet">
          <path d={`M${ARC_X0},${ARC_BASE} Q160,${ARC_PEAK} ${ARC_X1},${ARC_BASE}`} stroke="var(--color-border-strong)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <rect x={ARC_X0} y={ARC_BASE - 1.5} width={ARC_SPAN} height="3" rx="1.5" fill="var(--color-border)" />
          {bestStartPct != null && bestEndPct != null && (
            <rect x={pctToX(bestStartPct)} y={ARC_BASE - 2.5} width={Math.max(5, ((bestEndPct - bestStartPct) / 100) * ARC_SPAN)} height="5" rx="2.5" fill="var(--color-high)" />
          )}
          {avoidStartPct != null && avoidEndPct != null && (
            <rect x={pctToX(avoidStartPct)} y={ARC_BASE - 2.5} width={Math.max(5, ((avoidEndPct - avoidStartPct) / 100) * ARC_SPAN)} height="5" rx="2.5" fill="var(--color-low)" />
          )}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line key={pct} x1={pctToX(pct)} y1={ARC_BASE + 4} x2={pctToX(pct)} y2={ARC_BASE + 10} stroke="var(--color-faint)" strokeWidth="1.5" strokeLinecap="round" />
          ))}
          {sunX != null && sunY != null && (
            <g>
              <circle cx={sunX} cy={sunY} r="10" fill="var(--color-accent)" opacity="0.18" />
              <circle cx={sunX} cy={sunY} r="5.5" fill="var(--color-accent-strong)" stroke="var(--color-surface)" strokeWidth="1.5" />
            </g>
          )}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "1px", paddingInline: "6.25%" }}>
          <span>6a</span><span>9a</span><span>12p</span><span>3p</span><span>6p</span>
        </div>
      </div>

      {careMembers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Kicker color="var(--color-low)">{lang === "ta" ? "மென்மையான கவனம் தேவை" : "Needs gentle care"}</Kicker>
          {careMembers.map((m) => (
            <Card key={m.displayName} variant="low" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3)" }}>
              <span style={{ width: "26px", height: "26px", borderRadius: "var(--radius-pill)", background: "var(--color-low)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "var(--text-sm)", fontWeight: 700, flexShrink: 0 }}>
                {m.displayName.charAt(0).toUpperCase()}
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, flex: 1 }}>{m.displayName}</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-low)" }}>{m.note}</span>
            </Card>
          ))}
        </div>
      )}

      {brightMembers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Kicker color="var(--color-high)">{lang === "ta" ? "இன்று மிகவும் பிரகாசமானவர்" : "Brightest today"}</Kicker>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {brightMembers.map((m) => (
              <Card key={m.displayName} variant="high" style={{ flex: "1 1 100px", display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-2)", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-3)" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "var(--radius-pill)", background: "var(--color-mid)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "var(--text-xs)", fontWeight: 700, flexShrink: 0 }}>
                  {m.displayName.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{m.displayName}</span>
                <span style={{ marginLeft: "auto", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-high)" }}>{m.score}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Inauspicious kalams — day+location facts, so they belong to the whole
          family's shared rhythm rather than any one member. Fills the card's
          lower zone. */}
      {(rahuKalam || yamagandam) && (
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--space-2)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
          <Kicker color="var(--color-low)">{lang === "ta" ? "தவிர்க்க வேண்டிய நேரங்கள்" : "Avoid windows"}</Kicker>
          {rahuKalam && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "var(--radius-pill)", background: "var(--color-low)", flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{lang === "ta" ? "ராகு காலம்" : "Rahu Kalam"}</span>
              <b style={{ color: "var(--color-low)", fontWeight: 700 }}>{formatClockLabel(rahuKalam.start)} – {formatClockLabel(rahuKalam.end)}</b>
            </div>
          )}
          {yamagandam && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "var(--radius-pill)", background: "var(--color-mid)", flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{lang === "ta" ? "எமகண்டம்" : "Yamagandam"}</span>
              <b style={{ color: "var(--color-mid)", fontWeight: 700 }}>{formatClockLabel(yamagandam.start)} – {formatClockLabel(yamagandam.end)}</b>
            </div>
          )}
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
            {lang === "ta" ? "இந்த நேரங்களில் புதிய முக்கியப் பணிகளைத் தொடங்குவதைத் தவிர்க்கவும்." : "Avoid starting important new work during these windows."}
          </p>
        </div>
      )}
    </Card>
  );
}

/* ── Family bonds (all-pairs synastry), ported. ──────────────────────── */
type BondParticipant = { id: string; displayName: string; chartId: string };
type BondPair = { a: BondParticipant; b: BondParticipant; score: number };

function HyBondsCard({ lang, participants }: { lang: Lang; participants: BondParticipant[] }) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<BondPair[]>([]);

  async function loadBonds() {
    setLoaded(true);
    setLoading(true);
    const toCompute: [BondParticipant, BondParticipant][] = [];
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        toCompute.push([participants[i]!, participants[j]!]);
      }
    }
    const results = await Promise.all(
      toCompute.map(async ([a, b]) => {
        try {
          const res = await compareSynastry(a.chartId, b.chartId);
          return { a, b, score: res.data.score };
        } catch {
          return null;
        }
      }),
    );
    setPairs(results.filter((r): r is BondPair => r !== null).sort((x, y) => y.score - x.score));
    setLoading(false);
  }

  const strongest = pairs[0];
  const rest = pairs.slice(1, 5);

  return (
    <Card style={{ padding: "var(--space-6) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <Kicker color="var(--color-mid)">{lang === "ta" ? "குடும்ப பொருத்தம்" : "Family bonds"}</Kicker>
        {!loaded && (
          <button type="button" onClick={() => void loadBonds()} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {lang === "ta" ? "ஏற்று" : "Load bonds"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
      </div>
      {loading && <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</p>}
      {strongest && (
        <Card variant="accent" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
          <Sparkles size={16} strokeWidth={1.5} aria-hidden="true" />
          <div style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-text)" }}>
            {lang === "ta" ? "வலுவான பொருத்தம்: " : "Strongest bond: "}
            <b style={{ color: "var(--color-accent-strong)" }}>{strongest.a.displayName} ↔ {strongest.b.displayName}</b>{" "}
            <span style={{ fontWeight: 700, color: scoreColor(strongest.score) }}>{strongest.score}<span style={{ color: "var(--color-faint)", fontWeight: 500 }}>/100</span></span>
            {" — "}{bondToneLine(strongest.score, lang)}.
          </div>
        </Card>
      )}
      {rest.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
          {rest.map((pair) => {
            const color = scoreColor(pair.score);
            return (
              <Card key={`${pair.a.id}-${pair.b.id}`} style={{ borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{pair.a.displayName} ↔ {pair.b.displayName}</span>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color }}>{pair.score}<span style={{ color: "var(--color-faint)", fontWeight: 500 }}>/100</span></span>
                </div>
                <div style={{ height: "5px", borderRadius: "var(--radius-sm)", background: "var(--color-border)" }}>
                  <div style={{ width: `${Math.max(0, Math.min(100, pair.score))}%`, height: "100%", borderRadius: "var(--radius-sm)", background: color }} />
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{bondToneLine(pair.score, lang)}</div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── Sade Sati / Ashtama Sani cycle — folded in from the retired Transits &
      Dashas tab (2026-07-21). Two cycles, reckoned from the Moon and from the
      Lagna, plus the engine's plain-language confirmation sentence. Active
      cycles read in the caution palette; quiet ones stay calm. ─────────────── */
function HySaniCard({ lang, sani }: { lang: Lang; sani: SaniCycleData }) {
  const cycles = [
    { label: lang === "ta" ? "சனி · சந்திரனிலிருந்து" : "Sani · from Moon", cycle: sani.moonBasedCycle },
    { label: lang === "ta" ? "சனி · லக்னத்திலிருந்து" : "Sani · from Lagna", cycle: sani.lagnaBasedCycle },
  ];
  return (
    <Card style={{ padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <Kicker color="var(--color-accent-strong)">{lang === "ta" ? "ஏழரை / அஷ்டம சனி" : "Sade Sati / Ashtama Sani"}</Kicker>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
        {cycles.map(({ label, cycle }) => (
          <Card key={label} variant={cycle.isActive ? "low" : "default"} style={{ background: cycle.isActive ? undefined : "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <Kicker as="span" color={cycle.isActive ? "var(--color-low)" : "var(--color-faint)"} style={{ letterSpacing: "0.1em" }}>{label}</Kicker>
            {/* Named, not the raw enum — this card is where a reader lands to
                find out what the member card's ♄ chip meant, and it used to
                answer with "EZHARAI_SANI_PHASE_1". */}
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-md)", fontWeight: 600, color: cycle.isActive ? "var(--color-low)" : "var(--color-high)" }}>{cycle.type ? saniCycleName(cycle.type, lang) : (lang === "ta" ? "இயல்பு" : "Normal")}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.45 }}>{cycle.supportiveLabel ?? (lang === "ta" ? "செயலில் சனி அழுத்தம் இல்லை." : "No active Saturn-pressure cycle.")}</span>
          </Card>
        ))}
      </div>
      {sani.confirmationSentence && (
        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", fontStyle: "italic", lineHeight: 1.5 }}>{sani.confirmationSentence}</p>
      )}
    </Card>
  );
}

/* ── Member selector card — click to make this member the page's subject. ── */
function HyMemberSelectorCard({
  lang,
  member,
  todayItem,
  memberChart,
  relationLabel,
  isSelf,
  isActive,
  careReason,
  saniCycles,
  onOpen,
}: {
  lang: Lang;
  member: FamilyAggregateMember;
  todayItem: FamilyMemberTodayScore | undefined;
  memberChart: MemberChart | undefined;
  relationLabel: string | null;
  isSelf: boolean;
  isActive: boolean;
  careReason: CareReason | null;
  saniCycles: string[];
  onOpen: () => void;
}) {
  const summary = memberChart?.summary;
  const dasha = memberChart?.dasha;
  const bestWindow = memberChart?.dailyGuidance?.bestWindows[0];
  const color = scoreColor(member.individualScore);
  const insight = todayItem ? (lang === "ta" ? todayItem.highlightTa : todayItem.highlightEn) : "";

  const lagnaDashaLine = summary
    ? `${summary.lagnaRasi} ${t("label_lagnam", lang)}${dasha ? ` · ${tPlanetLord(dasha.current.mahadasha.lord, lang)}–${tPlanetLord(dasha.current.antardasha.lord, lang)}` : ""}`
    : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        background: isActive ? "var(--color-accent-muted)" : "var(--color-surface)",
        // Only a *today* condition tints the border. A Saturn cycle running for
        // the next seven years must not paint this card red every single day.
        border: `1.5px solid ${isActive ? "var(--color-accent)" : careReason === "lowScore" ? "var(--color-low-border)" : careReason === "chandrashtama" ? "var(--color-mid-border)" : isSelf ? "var(--color-border-strong)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)", padding: "var(--space-5) var(--space-5)",
        display: "flex", flexDirection: "column", gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <span style={{ flexShrink: 0, width: "44px", height: "44px", borderRadius: "var(--radius-pill)", background: color, color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "var(--text-md)", fontWeight: 700, fontFamily: "var(--font-display)" }}>
          {member.displayName.charAt(0).toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>{member.displayName}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{isSelf ? (lang === "ta" ? "நீங்கள்" : "You") : relationLabel ?? ""}</div>
        </div>
        <ScoreRing score={member.individualScore} size={46} />
      </div>
      {lagnaDashaLine && <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{lagnaDashaLine}</div>}
      {insight && <div style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-text)" }}>{insight}</div>}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {bestWindow && (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-high)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>
            ☀ {formatClockLabel(bestWindow.start)}–{formatClockLabel(bestWindow.end)}
          </span>
        )}
        {/* Every flag names its own cause. The old single "needs care" chip
            fired for Chandrashtama, a Saturn cycle *or* a low score and said
            which none of the time — so a member reading 53 / "Steady day" wore
            a red care chip with nothing on the card to explain it.
            Chandrashtama is amber ("awareness, not alarm", as on the owner's
            own Today hero); the score-derived chip is red and worded off the
            same band that colours the ring beside it. */}
        {careReason && (
          <span
            title={careReasonNote(careReason, lang)}
            style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: careReason === "chandrashtama" ? "var(--color-mid)" : "var(--color-low)", background: careReason === "chandrashtama" ? "var(--color-mid-bg)" : "var(--color-low-bg)", border: `1px solid ${careReason === "chandrashtama" ? "var(--color-mid-border)" : "var(--color-low-border)"}`, borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-2)" }}
          >
            {careReason === "chandrashtama" ? "🌘 " : ""}{careReasonLabel(careReason, lang)}
          </span>
        )}
        {/* Saturn cycles last 2.5–7.5 years. Named, so the reader knows what it
            is, and quiet, so a permanent condition never reads as today's news.
            Selecting the member opens the full Sani card further down. */}
        {saniCycles[0] && (
          <span
            title={saniCycleNote(saniCycles, lang)}
            style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-muted)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-2)" }}
          >
            ♄ {saniCycleName(saniCycles[0], lang)}
          </span>
        )}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-accent-strong)", fontWeight: 600 }}>
          {isActive ? (lang === "ta" ? "✓ படிக்கிறது" : "✓ Reading") : <>{lang === "ta" ? "படி" : "Read"}<ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" /></>}
        </span>
      </div>
    </button>
  );
}

/* ── Header action button (shared visual style). ─────────────────────── */
function HyActionButton({ onClick, disabled, active, primary, children }: {
  onClick?: () => void; disabled?: boolean; active?: boolean; primary?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
        fontSize: "var(--text-sm)", fontWeight: primary ? 700 : 600, fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-4)",
        color: primary ? "var(--color-on-accent)" : active ? "var(--color-accent-strong)" : "var(--color-text)",
        background: primary ? "var(--color-accent)" : active ? "var(--color-accent-muted)" : "transparent",
        border: primary ? "none" : `1px solid ${active ? "var(--color-accent)" : "var(--color-border-strong)"}`,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

/* ── Highlight card — a labelled insight with a timeframe tag so the reader
      knows whether it's a permanent birth-star trait or a today-only note. ── */
function HyHighlightCard({ icon, title, timeframe, accent, tintBg, tintBorder, children }: {
  icon: string; title: string; timeframe: string; accent: string;
  tintBg?: string; tintBorder?: string; children: React.ReactNode;
}) {
  return (
    <Card style={{ background: tintBg, borderColor: tintBorder, padding: "var(--space-4) var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", background: "color-mix(in srgb, var(--color-text-strong) 4%, transparent)", display: "grid", placeItems: "center", color: accent, fontSize: "var(--text-base)", flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: accent }}>{title}</span>
        <span style={{ marginLeft: "auto", fontSize: "var(--text-xs)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-faint)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)", whiteSpace: "nowrap" }}>{timeframe}</span>
      </div>
      {children}
    </Card>
  );
}

/* ── Props ──────────────────────────────────────────────────────────── */
export type DashboardFamilyChartsHybridProps = {
  lang: Lang;
  selectedDate: string;
  selectedVaultId: string;
  ownerChartId: string;
  ownerChart: ChartCalculateResponseData | null;
  ownerMemberChart: MemberChart | null;
  vaults: FamilyVaultListItem[];
  familyDetail: FamilyVaultDetailData | null;
  familyAggregate: FamilyAggregateData | null;
  familyComposite: FamilyCompositeTimelineData | null;
  familyMembers: FamilyMemberData[];
  memberCharts: MemberChart[];
  relationshipAlerts: RelationshipAlertItem[];
  alertsLoading: boolean;
  panchangam: PanchangamDailyResponseData | null;
  mode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
  /** Navigates to the dedicated Journal tab. */
  onGoToJournal?: () => void;
  onOpenPrasna?: () => void;
  showPrasna?: boolean;
  onClosePrasna?: () => void;
  busy: {
    family: boolean;
    vaults: boolean;
    deletingVaultId: string;
    deletingMemberId: string;
    memberCharts: boolean;
  };
  onRefreshFamily: () => void;
  onOpenSetup: () => void;
  onSelectVault: (item: FamilyVaultListItem) => void;
  onDeleteVault: (vaultId: string, name: string) => void;
  onDeleteMember: (memberId: string, name: string) => void;
  onEditMember: (member: FamilyAggregateMember) => void;
  onGoToLifeAreas?: () => void;
  /** Deep link-outs to specific Life Areas sub-tabs — the single homes for the
   *  full Remedies plan and 6/12-month Forecast (IA audit 2026-07-22, Phase
   *  1/2). Fall back to `onGoToLifeAreas` (Overview) when not provided. */
  onGoToRemedies?: () => void;
  onGoToForecast?: () => void;
  /** Compatibility (synastry) moved to the Tools tab (2026-07-21) — the header
   *  chip and the Connections pointer route there instead of an in-page toggle. */
  onGoToTools?: () => void;
  /** Deep-link target: a section id on this single-scroll page ("hy-dashas",
   *  "hy-members", …) to scroll to on arrival. Several sections mount only once
   *  the owner's reading has loaded, so the scroll retries briefly until the
   *  element exists, then reports back via onFocusConsumed (so a later Back
   *  doesn't re-fire it). Absent/never-mounting target = lands at top, the
   *  prior behaviour — no regression. */
  focusSection?: string | null;
  onFocusConsumed?: () => void;
};

export function DashboardFamilyChartsHybrid({
  lang,
  selectedDate,
  selectedVaultId,
  ownerChartId,
  ownerChart,
  ownerMemberChart,
  vaults,
  familyAggregate,
  familyComposite,
  familyMembers,
  memberCharts,
  panchangam,
  mode,
  onGoToJournal,
  onGoToLifeAreas,
  onGoToRemedies,
  onGoToForecast,
  onGoToTools,
  busy,
  onRefreshFamily,
  onOpenSetup,
  onSelectVault,
  onDeleteMember,
  onEditMember,
  focusSection,
  onFocusConsumed,
}: DashboardFamilyChartsHybridProps) {
  const [detailView, setDetailView] = useState(false);
  const [familyToday, setFamilyToday] = useState<FamilyVaultTodayData | null>(null);
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [remediesNonce, setRemediesNonce] = useState(0);

  const astroText = (v: string) => (lang === "en" ? tamilizeAstroEnglish(v) : v);

  const harmonyRef = useRef<HTMLDivElement | null>(null);

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
  }

  useEffect(() => {
    if (remediesNonce > 0) harmonyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [remediesNonce]);

  // Deep-link scroll: a section (e.g. the Dasa chapter's "Open ->" -> #hy-dashas,
  // Family Today's "Family ->" -> #hy-members) may not be in the DOM yet on
  // arrival because it waits on the owner's reading. Retry for up to ~4s, then
  // give up quietly. onFocusConsumed clears the request so browser Back to this
  // tab doesn't yank the scroll again.
  useEffect(() => {
    if (!focusSection) return;
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      if (document.getElementById(focusSection)) {
        jumpTo(focusSection);
        onFocusConsumed?.();
        return;
      }
      if (tries++ < 40) timer = window.setTimeout(attempt, 100);
      else onFocusConsumed?.();
    };
    attempt();
    return () => window.clearTimeout(timer);
    // jumpTo/onFocusConsumed are stable enough; only the target should re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSection]);

  // Family "today" per-member scores.
  useEffect(() => {
    if (!selectedVaultId) { setFamilyToday(null); return; }
    const today = new Date().toISOString().slice(0, 10);
    const controller = new AbortController();
    const { signal } = controller;
    void apiFetchJson<{ data: FamilyVaultTodayData }>(`/api/v1/family-vaults/${selectedVaultId}/today?date=${today}`, { signal })
      .then((r) => { if (!signal.aborted) setFamilyToday(r.data ?? null); })
      .catch(() => { if (!signal.aborted) setFamilyToday(null); });
    return () => controller.abort();
  }, [selectedVaultId, busy.family]);

  const members = familyAggregate?.members ?? [];
  const todayMembers = familyToday?.members ?? [];
  const ownerDisplayName = ownerChart?.birthProfile?.displayName || (lang === "ta" ? "நீங்கள்" : "You");

  const memberMeta = useMemo(() => {
    return (familyAggregate?.members ?? []).map((m) => {
      const isOwnerRow = m.familyMemberId === m.birthProfileId;
      const fm = familyMembers.find((f) => f.familyMemberId === m.familyMemberId);
      const chart = isOwnerRow ? (ownerMemberChart ?? undefined) : memberCharts.find((mc) => mc.memberId === m.familyMemberId);
      const todayItem = (familyToday?.members ?? []).find((tm) => tm.memberId === m.familyMemberId);
      const birthDateLocal = chart?.chart?.birthProfile?.birthDateLocal ?? null;
      const bucket = ageBucket(birthDateLocal ? ageFromBirth(birthDateLocal, selectedDate) : null);
      const isChandrashtama = memberIsChandrashtama(m, chart);
      const careReason = memberCareReason(m, isChandrashtama);
      const saniCycles = activeSaniCycles(m.activeCycleTags);
      return { member: m, familyMember: fm, chart, todayItem, bucket, careReason, saniCycles, isChandrashtama, isSelf: isOwnerRow };
    });
  }, [familyAggregate, familyMembers, memberCharts, familyToday, ownerMemberChart, selectedDate]);

  const bucketCounts = useMemo(() => {
    const counts = { elder: 0, adult: 0, child: 0, needsCare: 0 };
    for (const meta of memberMeta) {
      counts[meta.bucket] += 1;
      if (meta.careReason) counts.needsCare += 1;
    }
    return counts;
  }, [memberMeta]);

  const filteredMeta = memberMeta.filter((meta) => {
    if (relationFilter === "all") return true;
    if (relationFilter === "needsCare") return meta.careReason !== null;
    return meta.bucket === relationFilter;
  });

  const familyScore = familyAggregate?.familyScore ?? 0;
  const familyLabelRaw = familyAggregate?.familyLabel ?? "";
  const heroText = FAMILY_HERO_TEXT[familyLabelRaw] ?? FAMILY_HERO_TEXT.SUPPORTIVE_MIXED!;
  const bestWindow = familyAggregate?.bestFamilyWindows[0] ?? null;
  const avoidWindow = familyAggregate?.avoidForFamilyDecisions[0] ?? null;

  const careMembers = memberMeta
    .filter((meta) => meta.careReason !== null).slice(0, 2)
    .map((meta) => ({
      displayName: meta.member.displayName,
      // Say why, when we know why — "rest · avoid decisions" alone left the
      // family's one Chandrashtama member indistinguishable from a low score.
      note: meta.careReason === "chandrashtama"
        ? (lang === "ta" ? "சந்திராஷ்டமம் · ஓய்வு" : "chandrashtama · rest")
        : (lang === "ta" ? "ஓய்வு · முடிவுகளை தவிர்க்கவும்" : "rest · avoid decisions"),
    }));
  const brightMembers = [...memberMeta]
    .sort((a, b) => b.member.individualScore - a.member.individualScore).slice(0, 2)
    .map((meta) => ({ displayName: meta.member.displayName, score: meta.member.individualScore }));

  const weekday = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "long" });
  const dateLine = `${weekday} · ${formatHeaderDate(selectedDate, lang)} · ${getTamilMonthDate(selectedDate, lang)}`;

  // ── The subject of every reading section: selected member, or the owner. ──
  const ownerMeta = memberMeta.find((m) => m.isSelf) ?? null;
  const activeMeta = memberMeta.find((m) => m.member.familyMemberId === selectedMemberId) ?? ownerMeta;
  const activeMember = activeMeta?.member ?? null;
  const activeIsSelf = activeMeta?.isSelf ?? true;
  // familyAggregate (and so memberMeta) is empty for a vault with no FamilyMember
  // rows — the backend 422s before it ever reaches its own owner-injection step.
  // readingChartId/readingName already fall back to the owner below; without this,
  // `reading` was the one field left with no fallback, so every chart-shaped
  // section (D1/D9, bhava table, planet orbs, full technical reading) rendered
  // nothing for a user who hasn't added a family member yet. `ownerMemberChart` is
  // the owner's own reading, loaded independently of the family vault — it is
  // already what isOwnerRow members resolve to above, so this is the same value,
  // not a new fetch. Only applies when there is no member at all (not when a
  // selected member's own chart failed to load, which must stay blank).
  const reading = activeMeta?.chart ?? (activeMember === null ? ownerMemberChart ?? undefined : undefined);
  const readingChartId = activeMember?.chartId ?? ownerChartId;
  const readingName = activeMember?.displayName ?? ownerDisplayName;
  const activeTodayItem = activeMember ? todayMembers.find((tm) => tm.memberId === activeMember.familyMemberId) : undefined;

  const activeMemberIndex = activeMember ? members.findIndex((m) => m.familyMemberId === activeMember.familyMemberId) : -1;
  const prevMember = activeMemberIndex > 0 ? members[activeMemberIndex - 1] : null;
  const nextMember = activeMemberIndex >= 0 && activeMemberIndex < members.length - 1 ? members[activeMemberIndex + 1] : null;
  const activeRelationLabel = activeMember
    ? formatRelLabel(familyMembers.find((fm) => fm.familyMemberId === activeMember.familyMemberId)?.relationshipToOwner)
    : null;

  const relationshipParticipants = activeMember
    ? [
        ...(ownerChartId ? [{ id: "owner", displayName: ownerDisplayName, chartId: ownerChartId, relationLabel: lang === "ta" ? "நீங்கள்" : "You" }] : []),
        ...memberCharts.filter((mc) => mc.memberId !== activeMember.familyMemberId).map((mc) => ({
          id: mc.memberId, displayName: mc.displayName, chartId: mc.chart.chartId,
          relationLabel: formatRelLabel(familyMembers.find((fm) => fm.familyMemberId === mc.memberId)?.relationshipToOwner),
        })),
      ]
    : [];

  const bondParticipants: BondParticipant[] = [
    ...(ownerChartId ? [{ id: "owner", displayName: ownerDisplayName, chartId: ownerChartId }] : []),
    ...memberCharts.map((mc) => ({ id: mc.memberId, displayName: mc.displayName, chartId: mc.chart.chartId })),
  ];

  // Chara Dasha + Solar Return for the active reading's chart (ported from the
  // Nova charts panel; classical-timing reference material).
  const returnYear = Number.parseInt((selectedDate || "").slice(0, 4), 10) || new Date().getFullYear();
  const { data: charaDasha = null } = useApiQuery({
    key: ["chara-dasha", readingChartId],
    queryFn: () =>
      apiFetchJson<{ data: CharaDashaData }>(`/api/v1/charts/${readingChartId}/chara-dasha`).then((res) => res.data ?? null),
    enabled: !!readingChartId,
  });
  const { data: solarReturn = null } = useApiQuery({
    key: ["solar-return", readingChartId, returnYear],
    queryFn: () =>
      apiFetchJson<{ data: SolarReturnData }>(`/api/v1/charts/${readingChartId}/solar-return?year=${returnYear}`).then(
        (res) => res.data ?? null,
      ),
    enabled: !!readingChartId,
  });
  // Life-area year-ahead forecast for the active reading's chart (§8). The
  // backend keys the date on `asOf` (aliased) — matching usePersonalData's
  // direct fetch, not the drifted shared wrapper's `date` param.
  const { data: lifeAreas = null } = useApiQuery({
    key: ["life-areas", readingChartId, selectedDate],
    queryFn: () =>
      apiFetchJson<{ data: LifeAreasResponseData }>(`/api/v1/charts/${readingChartId}/life-areas?asOf=${selectedDate}`).then(
        (res) => res.data ?? null,
      ),
    enabled: !!readingChartId,
  });

  function selectMember(id: string) {
    setSelectedMemberId(id);
    jumpTo("hy-overview");
  }

  // ── Full-profile screen (unchanged dedicated member view). ──
  if (detailView && activeMember) {
    return (
      <DashboardFamilyMemberNova
        lang={lang}
        selectedDate={selectedDate}
        member={activeMember}
        memberChart={reading}
        relationLabel={activeRelationLabel}
        todayItem={activeTodayItem}
        panchangam={panchangam}
        bestFamilyWindow={bestWindow}
        relationshipParticipants={relationshipParticipants}
        onBack={() => setDetailView(false)}
        onPrev={prevMember ? () => setSelectedMemberId(prevMember.familyMemberId) : null}
        onNext={nextMember ? () => setSelectedMemberId(nextMember.familyMemberId) : null}
        prevName={prevMember?.displayName ?? null}
        nextName={nextMember?.displayName ?? null}
        onEdit={() => onEditMember(activeMember)}
        onDelete={() => onDeleteMember(activeMember.familyMemberId, activeMember.displayName)}
        deleting={busy.deletingMemberId === activeMember.familyMemberId}
      />
    );
  }

  const dailyGuidance = reading?.dailyGuidance ?? null;
  const readingSummary = reading?.summary ?? null;
  const readingChart = reading?.chart ?? null;
  const nakshatraCard = reading?.nakshatraCard ?? null;
  // Chandrashtama for whoever is being read — the owner sees this spelled out
  // on their own Today hero, but a family member's only mention of it used to
  // be the dedicated full-profile screen behind "View full profile".
  const readingIsChandrashtama = activeMeta?.isChandrashtama ?? reading?.transit?.isChandrashtama ?? false;
  // `chandrashtamamToday` is derived from today's transiting Moon rasi, not
  // from any one chart — the affected janma rasi (and so its star windows) is
  // the same for everyone in the vault, so these windows are correct for the
  // member being read, exactly as they are for the owner on Today.
  const readingChandrashtamaWindows = panchangam
    ? formatChandrashtamaWindowSummary(panchangam.chandrashtamamToday?.janmaNakshatraWindows ?? [], panchangam.dateLocal, lang)
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-12)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ═══ 1 · FAMILY TODAY ═══ */}
        <section id="hy-today" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", scrollMarginTop: "72px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <div>
              <Kicker color="var(--color-mid)">{lang === "ta" ? "குடும்பம் இன்று" : "Family today"}</Kicker>
              {/* audit B-1: the lead section's title is the page's one top-level
                  heading (Family & Charts previously had no headings at all). */}
              <h1 style={{ margin: "5px 0 0", fontFamily: "var(--font-display)", fontSize: "var(--display-md)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                {lang === "ta" ? "பகிரப்பட்ட, ஆதரவான நாள்." : <>A shared, <span style={{ color: "var(--color-accent-strong)" }}>{familyLabelRaw ? familyLabelRaw.toLowerCase().replace(/_/g, " ") : "supportive"}</span> day.</>}
              </h1>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", marginTop: "4px" }}>
                {dateLine} · {lang === "ta" ? "அனைவரின் ஜாதகமும் ஒன்றாக" : `everyone's charts read together · ${members.length} members`}
              </div>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
              {vaults.length > 1 && vaults.map((v: FamilyVaultListItem) => (
                <HyActionButton key={v.familyVaultId} active={v.familyVaultId === selectedVaultId} primary={false} onClick={() => onSelectVault(v)}>{v.name}</HyActionButton>
              ))}
              <HyActionButton onClick={onRefreshFamily} disabled={!selectedVaultId || busy.family}>
                {busy.family ? (lang === "ta" ? "புதுப்பிக்கிறது…" : "Refreshing…") : `↻ ${lang === "ta" ? "புதுப்பி" : "Refresh"}`}
              </HyActionButton>
              {memberCharts.length > 0 && onGoToTools && (
                <HyActionButton onClick={onGoToTools}>◇ {lang === "ta" ? "பொருத்தம்" : "Compatibility"}</HyActionButton>
              )}
              {members.length > 1 && (
                <HyActionButton onClick={() => setRemediesNonce((n) => n + 1)}>🪔 {lang === "ta" ? "பரிகாரம்" : "Remedies"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" /></HyActionButton>
              )}
              {onGoToJournal && <HyActionButton onClick={onGoToJournal}>✎ {lang === "ta" ? "ஜர்னல்" : "Journal"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" /></HyActionButton>}
              <HyActionButton primary onClick={onOpenSetup}>+ {lang === "ta" ? "உறுப்பினரைச் சேர்" : "Add member"}</HyActionButton>
            </div>
          </div>

          {/* Cold-start nudge */}
          {members.length <= 1 && (
            <Card variant="accent" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap", padding: "var(--space-5) var(--space-6)" }}>
              <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-strong)" }}>{t("family_coldstart_title", lang)}</div>
                <p style={{ margin: "6px 0 0", fontSize: "var(--text-base)", lineHeight: 1.55, color: "var(--color-muted)" }}>{t("family_coldstart_body", lang)}</p>
                <p style={{ margin: "8px 0 0", fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-faint)" }}>🕒 {t("family_coldstart_time_note", lang)}</p>
              </div>
              <HyActionButton primary onClick={onOpenSetup}>{t("family_coldstart_cta", lang)}</HyActionButton>
            </Card>
          )}

          <div className="hy-grid-hero">
            {/* Harmony hero */}
            <Card className="hy-ring-pulse" style={{ position: "relative", overflow: "hidden", borderColor: "var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "var(--space-7) var(--space-7)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "center", flexWrap: "wrap" }}>
                <NovaScoreDial score={familyScore} size={122} label={lang === "ta" ? "/ 100 · குடும்பம்" : "/ 100 · FAMILY"} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Kicker color="var(--color-mid)">{lang === "ta" ? "குடும்ப ஒற்றுமை" : "Family harmony"}</Kicker>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 600, lineHeight: 1.2, marginTop: "6px", color: "var(--color-text-strong)" }}>
                    {lang === "ta" ? heroText.ta : heroText.en}
                  </div>
                  {familyAggregate?.summary && (
                    <div style={{ fontSize: "var(--text-base)", lineHeight: 1.55, color: "var(--color-muted)", marginTop: "8px" }}>
                      {lang === "ta" ? familyAggregate.summary.ta : familyAggregate.summary.en}
                    </div>
                  )}
                </div>
              </div>
              {bestWindow && (
                <Card variant="high" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
                  <span style={{ flexShrink: 0, width: "34px", height: "34px", borderRadius: "var(--radius-pill)", background: "var(--color-high-bg)", display: "grid", placeItems: "center", fontSize: "var(--text-md)" }}>☀</span>
                  <div style={{ flex: 1 }}>
                    <Kicker color="var(--color-high)">{lang === "ta" ? "சிறந்த பகிர்ந்த நேரம்" : "Best shared window"}</Kicker>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 700, marginTop: "2px" }}>
                      {formatClockLabel(bestWindow.start)} – {formatClockLabel(bestWindow.end)} <span style={{ color: "var(--color-muted)", fontWeight: 500 }}>· {lang === "ta" ? `அனைத்து ${members.length} பேரும்` : `all ${members.length} aligned`}</span>
                    </div>
                  </div>
                </Card>
              )}
              {/* 7-day outlook — shared derivation with Classic/Nova. */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }}>
                <FamilySevenDayOutlook lang={lang} selectedDate={selectedDate} familyScore={familyScore} familyComposite={familyComposite} members={members} />
              </div>
            </Card>

            <HyRhythmCard lang={lang} selectedDate={selectedDate} bestWindow={bestWindow} avoidWindow={avoidWindow} careMembers={careMembers} brightMembers={brightMembers} rahuKalam={panchangam?.kalam.rahuKalam} yamagandam={panchangam?.kalam.yamagandam} />
          </div>
        </section>

        {/* ═══ 2 · MEMBERS ═══ */}
        {members.length > 0 && (
          <HySection
            id="hy-members"
            title={lang === "ta" ? "உறுப்பினர்கள்" : "Members"}
            sub={lang === "ta" ? "ஒருவரைத் தேர்ந்தெடுக்கவும் — கீழே அனைத்தும் அவர்களின் ஜாதகம்" : "select a member — everything below reads their chart"}
            meta={
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
                {([
                  ["all", lang === "ta" ? `அனைவரும் ${members.length}` : `All ${members.length}`],
                  ["elder", lang === "ta" ? `மூத்தோர் ${bucketCounts.elder}` : `Elders ${bucketCounts.elder}`],
                  ["adult", lang === "ta" ? `பெரியவர்கள் ${bucketCounts.adult}` : `Adults ${bucketCounts.adult}`],
                  ["child", lang === "ta" ? `குழந்தைகள் ${bucketCounts.child}` : `Children ${bucketCounts.child}`],
                ] as [RelationFilter, string][]).map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setRelationFilter(key)}
                    style={{ fontSize: "var(--text-sm)", fontWeight: relationFilter === key ? 700 : 500, color: relationFilter === key ? "var(--color-on-accent)" : "var(--color-text)", background: relationFilter === key ? "var(--color-accent)" : "transparent", border: `1px solid ${relationFilter === key ? "var(--color-accent)" : "var(--color-border-strong)"}`, borderRadius: "var(--radius-pill)", padding: "var(--space-2) var(--space-4)", cursor: "pointer", fontFamily: "inherit" }}>
                    {label}
                  </button>
                ))}
                {bucketCounts.needsCare > 0 && (
                  <button type="button" onClick={() => setRelationFilter(relationFilter === "needsCare" ? "all" : "needsCare")}
                    // The pill's own criterion, so its count is never a number
                    // the reader has to reverse-engineer from the cards.
                    title={dt(CARE_FILTER_NOTE, lang)}
                    style={{ fontSize: "var(--text-sm)", color: relationFilter === "needsCare" ? "var(--color-on-accent)" : "var(--color-low)", background: relationFilter === "needsCare" ? "var(--color-low)" : "transparent", border: `1px solid ${relationFilter === "needsCare" ? "var(--color-low)" : "var(--color-border)"}`, borderRadius: "var(--radius-pill)", padding: "var(--space-2) var(--space-4)", cursor: "pointer", fontFamily: "inherit" }}>
                    {lang === "ta" ? `கவனம் ${bucketCounts.needsCare}` : `Needs care ${bucketCounts.needsCare}`} ●
                  </button>
                )}
              </div>
            }
          >
            {/* Filtering to "Needs care" is the moment the criterion matters,
                so it is stated on screen rather than left to a hover title. */}
            {relationFilter === "needsCare" && (
              <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
                {dt(CARE_FILTER_NOTE, lang)}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
              {filteredMeta.map(({ member, familyMember, chart, todayItem, careReason, saniCycles, isSelf }) => (
                <HyMemberSelectorCard
                  key={member.familyMemberId}
                  lang={lang}
                  member={member}
                  todayItem={todayItem}
                  memberChart={chart}
                  relationLabel={formatRelLabel(familyMember?.relationshipToOwner)}
                  isSelf={isSelf}
                  isActive={activeMember?.familyMemberId === member.familyMemberId}
                  careReason={careReason}
                  saniCycles={saniCycles}
                  onOpen={() => selectMember(member.familyMemberId)}
                />
              ))}
            </div>
          </HySection>
        )}

        {/* ═══ 3 · MEMBER OVERVIEW ═══ */}
        {activeMember && (
          <section id="hy-overview" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", scrollMarginTop: "72px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <div>
                <Kicker color="var(--color-mid)">{lang === "ta" ? `படிக்கிறது · ${readingName}` : `Reading · ${readingName}`}</Kicker>
                <h2 style={{ margin: "6px 0 0", fontFamily: "var(--font-display)", fontSize: "clamp(1.7rem,2.8vw,2.2rem)", fontWeight: 600, lineHeight: 1.1, color: "var(--color-text-strong)" }}>
                  {lang === "ta" ? <>வணக்கம், <span style={{ color: "var(--color-accent-strong)" }}>{readingName}</span> 👋</> : <>Vanakkam, <span style={{ color: "var(--color-accent-strong)" }}>{readingName}</span> 👋</>}
                </h2>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", marginTop: "6px" }}>
                  {activeIsSelf ? (lang === "ta" ? "உங்கள் ஜாதகம் & இன்றைய வழிகாட்டுதல்" : "Your chart & guidance for the day") : (activeRelationLabel ?? "")}
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <NovaChartValidationChip lang={lang} validationStatus={readingSummary?.chartValidationStatus} />
                {readingChartId && (
                  <>
                    <ShareCardButton chartId={readingChartId} cardType="NAKSHATRA" lang={lang} label={lang === "ta" ? "நட்சத்திர அட்டை" : "Share Birth Star"} />
                    <ShareCardButton chartId={readingChartId} cardType="DAILY_VIBE" lang={lang} date={selectedDate} label={lang === "ta" ? "இன்றைய வைப்" : "Share Today's Vibe"} />
                    <HyActionButton active onClick={() => void downloadJadhagamPdf(readingChartId, selectedDate, lang)}>⤓ {lang === "ta" ? "PDF" : "Download PDF"}</HyActionButton>
                  </>
                )}
              </div>
            </div>

            {/* "Your Chart in One Minute" — the first thing on the active
                member's reading, and deliberately ABOVE the score dial: it is
                the one piece here written to be read rather than scanned, and
                a number placed before it would be answered first. Renders
                nothing while the `one_minute_reading` flag is off.
                docs/ONE_MINUTE_READING_2026-08-04.md §7. */}
            {readingChartId && <DashboardOneMinuteReading lang={lang} chartId={readingChartId} />}

            {/* "Your Chart in Five Minutes" — directly below the two-minute
                reading, since it deepens the same beats rather than opening a
                new one. Renders nothing while the `five_minute_reading` flag
                is off, or for any register other than "self".
                docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md. */}
            {readingChartId && <DashboardFiveMinuteReading lang={lang} chartId={readingChartId} />}

            <div className="hy-grid-hero">
              {/* Cosmic snapshot */}
              <Card style={{ position: "relative", overflow: "hidden", borderColor: "var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "var(--space-7) var(--space-7)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                <div style={{ display: "flex", gap: "var(--space-6)", alignItems: "center", flexWrap: "wrap" }}>
                  {dailyGuidance && <NovaScoreDial score={dailyGuidance.score} size={122} label={lang === "ta" ? "/ 100 · இன்று" : "/ 100 · TODAY"} />}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, lineHeight: 1.2, color: "var(--color-text-strong)" }}>
                      {dailyGuidance ? (lang === "ta" ? dailyGuidance.confidenceReason.ta : dailyGuidance.confidenceReason.en) : (lang === "ta" ? "இன்றைய ஜாதக நிலை" : "Today's chart snapshot")}
                    </div>
                    {readingSummary && (
                      <div style={{ fontSize: "var(--text-base)", lineHeight: 1.55, color: "var(--color-muted)", marginTop: "9px" }}>
                        {lang === "ta" ? readingSummary.primaryLanguageText.ta : readingSummary.primaryLanguageText.en}
                      </div>
                    )}
                  </div>
                </div>
                {/* Identity chips */}
                {readingSummary && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "var(--space-3)" }}>
                    {[
                      [lang === "ta" ? "ராசி" : "Rasi", astroText(readingSummary.moonRasi)],
                      [lang === "ta" ? "நட்சத்திரம்" : "Nakshatra", `${astroText(readingSummary.janmaNakshatra)} · ${readingSummary.janmaPada}`],
                      [lang === "ta" ? "லக்னம்" : "Lagnam", astroText(readingSummary.lagnaRasi)],
                      [lang === "ta" ? "வயது" : "Age", String(readingSummary.currentAge)],
                    ].map(([label, value]) => (
                      <Card key={label} style={{ display: "block", background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
                        <Kicker as="div" color="var(--color-faint)">{label}</Kicker>
                        <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)", marginTop: "4px" }}>{value}</div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>

              {/* Today for X */}
              <Card style={{ borderRadius: "var(--radius-xl)", padding: "var(--space-6) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ color: "var(--color-accent-strong)", fontSize: "var(--text-md)" }}>☀</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-accent-strong)" }}>{lang === "ta" ? `${readingName} இன்று` : `Today for ${readingName}`}</span>
                </div>
                {readingIsChandrashtama && (
                  <ChandrashtamaCard
                    lang={lang}
                    chandrashtamaEnds={dailyGuidance?.chandrashtamaEnds ?? null}
                    descriptionTa={null}
                    descriptionEn={null}
                    windowsSummary={readingChandrashtamaWindows}
                  />
                )}
                {dailyGuidance && (
                  <div style={{ fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-muted)" }}>
                    {lang === "ta" ? dailyGuidance.reasons.moonTransit.ta : dailyGuidance.reasons.moonTransit.en}
                  </div>
                )}
                <HyTodayFacts
                  lang={lang}
                  memberName={readingName}
                  memberNakshatraName={readingSummary?.janmaNakshatra}
                  weekdayLord={panchangam?.vara.lord}
                  weekdayKey={panchangam?.vara.weekday}
                  dayNakshatraName={panchangam?.nakshatra.name}
                  goodWindow={dailyGuidance?.bestWindows[0] ?? panchangam?.kalam.nallaNeram?.[0] ?? null}
                  goodWindowLabel={dailyGuidance?.bestWindows[0]
                    ? (lang === "ta" ? "சிறந்த தனிப்பட்ட நேரம் " : "Best personal window ")
                    : (lang === "ta" ? "நல்ல நேரம் " : "Nalla Neram ")}
                />
                <div style={{ flex: 1 }} />
                <button type="button" onClick={() => setDetailView(true)} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", alignSelf: "flex-start", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  {lang === "ta" ? "முழு விவரம் காண்" : "View full profile"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </Card>
            </div>
          </section>
        )}

        {/* ═══ 4 · CHARTS & HOUSES ═══ */}
        {readingChart && (
          <HySection
            id="hy-charts"
            title={lang === "ta" ? "ஜாதகம் & வீடுகள்" : "Charts & houses"}
            sub={lang === "ta" ? "D1, D9 & பாவ மேலோட்டம்" : "D1, D9 & bhava overview · Lahiri · whole-sign houses"}
          >
            <div className="hy-grid-charts">
              {/* Column layout + justify-center: the bhava table (12 rows) is the
                  tallest cell and stretches these two square-chart cards to match;
                  centring the chart vertically and adding a caption fills the
                  formerly-empty band below each chart usefully. */}
              <Card style={{ borderRadius: "var(--radius-xl)", padding: "var(--space-5) var(--space-5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
                <RasiChart chart={readingChart} lang={lang} label={lang === "ta" ? "D1 — ராசி" : "D1 — Rasi"} showExplain={false} />
                <p style={{ margin: 0, fontSize: "var(--text-xs)", lineHeight: 1.5, color: "var(--color-faint)", textAlign: "center", maxWidth: "34ch" }}>
                  {lang === "ta" ? "ராசி (D1) — பிறப்பின் போது கிரகங்கள் அமர்ந்த ராசிகளும் வீடுகளும். வாழ்க்கையின் முதன்மைப் படம்." : "Rasi (D1) — the signs and houses the planets occupied at birth. Your primary life chart."}
                </p>
              </Card>
              <Card style={{ borderRadius: "var(--radius-xl)", padding: "var(--space-5) var(--space-5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
                <NavamsaChart chart={readingChart} lang={lang} label={lang === "ta" ? "D9 — நவாம்சம்" : "D9 — Navamsa"} showExplain={false} />
                <p style={{ margin: 0, fontSize: "var(--text-xs)", lineHeight: 1.5, color: "var(--color-faint)", textAlign: "center", maxWidth: "34ch" }}>
                  {lang === "ta" ? "நவாம்சம் (D9) — திருமணம், தர்மம், கிரகங்களின் உள் வலிமை. D1-ஐ உறுதி செய்யும் நுட்பப் படம்." : "Navamsa (D9) — marriage, dharma and the inner strength of each planet. It confirms and refines the D1."}
                </p>
              </Card>
              <HyBhavaTable lang={lang} chart={readingChart} explanationPlanets={reading?.explanation?.planets} />
            </div>

            {/* Profile cards — birth star + rasi + lagnam, one unified look
                (glyph · name · green ruling-planet · blurb · trait chips). */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
              {nakshatraCard && (
                <HyProfileCard
                  kicker={t("nakshatra_card_label", lang)}
                  glyph={<NakshatraBadge nakshatra={nakshatraCard.number} size={40} />}
                  name={lang === "ta" ? nakshatraCard.nameTa : astroText(nakshatraCard.nameEn)}
                  rulingPlanetLabel={`${t("nakshatra_ruling_planet", lang)}: ${tPlanetLord(nakshatraCard.rulingPlanet, lang)}`}
                  blurb={lang === "ta" ? nakshatraCard.profile.ta : astroText(nakshatraCard.profile.en)}
                  traits={[
                    ...nakshatraCard.strengths.map((s) => ({ label: lang === "ta" ? s.ta : astroText(s.en), tone: "good" as const })),
                    ...nakshatraCard.cautions.map((c) => ({ label: lang === "ta" ? c.ta : astroText(c.en), tone: "warn" as const })),
                  ]}
                />
              )}
              {([
                [readingChart.planets.find((p) => p.graha === "MOON")?.rasi, "rasi_trait_card_label"],
                [readingChart.lagna.rasi, "lagna_trait_card_label"],
              ] as [number | undefined, "rasi_trait_card_label" | "lagna_trait_card_label"][]).map(([rasiNum, key]) => {
                if (rasiNum == null) return null;
                const entry = RASI_TRAITS[rasiNum];
                if (!entry) return null;
                const lord = RASI_LORDS[rasiNum];
                return (
                  <HyProfileCard
                    key={key}
                    kicker={t(key, lang)}
                    glyph={<ZodiacBadge rasi={rasiNum} size={40} />}
                    name={D1_RASI_NAMES[rasiNum] ?? String(rasiNum)}
                    rulingPlanetLabel={lord ? `${t("nakshatra_ruling_planet", lang)}: ${tPlanetLord(lord, lang)}` : undefined}
                    blurb={lang === "ta" ? entry.profile.ta : astroText(entry.profile.en)}
                    traits={[
                      ...entry.traits.map((s) => ({ label: lang === "ta" ? s.ta : astroText(s.en), tone: "good" as const })),
                      { label: lang === "ta" ? entry.caution.ta : astroText(entry.caution.en), tone: "warn" as const },
                    ]}
                  />
                );
              })}
            </div>

            {/* Birth-time / border conditions (Dagda, Cazimi, Sankranti…) */}
            {readingChart.birthConditions && readingChart.birthConditions.length > 0 && (
              <div style={{ display: "grid", gap: "var(--space-3)" }}>
                {readingChart.birthConditions.map((condition) => {
                  const accent = condition.severity === "BOOST" ? "var(--color-high)" : condition.severity === "ALERT" ? "var(--color-mid)" : "var(--color-accent-secondary)";
                  return (
                    <div key={condition.code} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", padding: "var(--space-4) var(--space-5)", borderRadius: "var(--radius-lg)", background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderInlineStart: `3px solid ${accent}` }}>
                      <Chip tone={condition.severity === "BOOST" ? "high" : "mid"}>{lang === "ta" ? condition.titleTa : condition.titleEn}</Chip>
                      <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text-secondary)" }}>{lang === "ta" ? condition.descriptionTa : condition.descriptionEn}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Chart-level highlight cards — moved here (2026-07-22) so they sit
                directly BELOW the birth-time condition cards (Dagda etc., above)
                and ABOVE Planet positions, grouping every chart-level reading in
                one place instead of splitting them into the overview. Two
                CHART-level cards (this chart's speciality, from the engine
                summary) + two TODAY cards (opportunities / guidance), each tagged
                chart-permanent vs. today. */}
            {(() => {
              const chartTag = lang === "ta" ? "ஜாதகம்" : "chart";
              const todayTag = lang === "ta" ? "இன்று" : "today";
              const summary = reading?.explanation?.summary;
              // Birth-time conditions (Dagda, Cazimi, Sankranti…) are folded into
              // the engine's positives/cautions as "Birth-time condition — …" lines,
              // but they already render as their own cards just above. Drop them
              // from these prose lists so they aren't said twice.
              const notBirthCondition = (it: { en: string; ta: string }) =>
                !it.en.startsWith("Birth-time condition —") && !it.ta.startsWith("பிறப்பு நேர நிலை —");
              const positives = (summary?.positives ?? []).filter(notBirthCondition);
              const cautions = (summary?.cautions ?? []).filter(notBirthCondition);
              const oppText = dailyGuidance?.reasons.dashaSupport
                ? (lang === "ta" ? dailyGuidance.reasons.dashaSupport.ta : dailyGuidance.reasons.dashaSupport.en) : "";
              const guidanceText = dailyGuidance?.actionSuggestion
                ? (lang === "ta" ? dailyGuidance.actionSuggestion.ta : dailyGuidance.actionSuggestion.en) : "";
              if (positives.length === 0 && cautions.length === 0 && !oppText && !guidanceText) return null;
              const proseList = (items: { en: string; ta: string }[], dot: string) => (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {items.slice(0, 5).map((it, i) => (
                    <div key={i} style={{ display: "flex", gap: "var(--space-2)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-muted)" }}>
                      <span style={{ color: dot, flexShrink: 0, marginTop: "1px" }}>•</span>
                      <span>{lang === "ta" ? it.ta : astroText(it.en)}</span>
                    </div>
                  ))}
                </div>
              );
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-3)" }}>
                  {positives.length > 0 && (
                    <HyHighlightCard icon="✓" title={lang === "ta" ? "இந்த ஜாதகத்தின் பலம்" : "Chart strengths"} timeframe={chartTag} accent="var(--color-high)" tintBg="var(--color-high-bg)" tintBorder="var(--color-high-border)">
                      {proseList(positives, "var(--color-high)")}
                    </HyHighlightCard>
                  )}
                  {cautions.length > 0 && (
                    <HyHighlightCard icon="!" title={lang === "ta" ? "கவனத்தில் கொள்ள" : "Watch-outs"} timeframe={chartTag} accent="var(--color-low)" tintBg="var(--color-low-bg)" tintBorder="var(--color-low-border)">
                      {proseList(cautions, "var(--color-low)")}
                    </HyHighlightCard>
                  )}
                  {oppText && (
                    <HyHighlightCard icon="◈" title={lang === "ta" ? "வாய்ப்புகள்" : "Opportunities"} timeframe={todayTag} accent="var(--color-accent-secondary)">
                      <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>{oppText}</p>
                    </HyHighlightCard>
                  )}
                  {guidanceText && (
                    <HyHighlightCard icon="✻" title={lang === "ta" ? "வழிகாட்டுதல்" : "Guidance"} timeframe={todayTag} accent="var(--color-mid)">
                      <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>{guidanceText}</p>
                    </HyHighlightCard>
                  )}
                </div>
              );
            })()}
          </HySection>
        )}

        {/* ═══ 5 · PLANET POSITIONS ═══ */}
        {readingChart && (() => {
          const explPlanets = reading?.explanation?.planets ?? [];
          const kendraCount = explPlanets.filter((p) => p.houseGroup === "KENDRA").length;
          const strongest = reading?.explanation?.summary?.strongestPlanet;
          const meta = explPlanets.length > 0 ? (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {kendraCount} {lang === "ta" ? "கிரகங்கள் கேந்திரத்தில்" : `planet${kendraCount === 1 ? "" : "s"} in Kendra`}
              {strongest && <> · {lang === "ta" ? "வலிமையான கிரகம் " : "strongest planet "}<b style={{ color: "var(--color-accent-strong)", fontWeight: 600 }}>{tPlanetLord(strongest, lang)}</b></>}
            </div>
          ) : undefined;
          return (
            <HySection
              id="hy-planets"
              title={lang === "ta" ? "கிரக நிலைகள்" : "Planet positions"}
              sub={lang === "ta" ? "ஒரு கோளத்தை அல்லது வரிசையைத் தட்டவும்" : "tap an orb or row for the full explanation"}
              meta={meta}
            >
              <HyPlanetOrbs lang={lang} planets={readingChart.planets} explanationPlanets={explPlanets} animate />
            </HySection>
          );
        })()}

        {/* ═══ 6 · DASHAS & TIMELINE ═══ */}
        {reading?.dasha && (
          <HySection
            id="hy-dashas"
            title={lang === "ta" ? "தசைகள் & காலவரிசை" : "Dashas & timeline"}
            sub={lang === "ta" ? "தற்போதைய தசை மற்றும் துணைக் காலங்கள்" : "current dasa and sub-periods"}
            meta={
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {lang === "ta" ? "விம்சோத்தரி · லாஹிரி அயனாம்சம்" : "Vimsottari · Lahiri ayanamsa"}
              </div>
            }
          >
            <HyBhuktiTimeline
              lang={lang}
              dasha={reading.dasha}
              dashaMaha={reading.dashaMaha}
              dashaAntar={reading.dashaAntar}
              today={selectedDate}
              birthDateLocal={readingChart?.birthProfile?.birthDateLocal}
              dashaSupportText={dailyGuidance?.reasons.dashaSupport ?? null}
              onOpenForecast={() => jumpTo("hy-forecast")}
            />
          </HySection>
        )}

        {/* ═══ 7 · YOGAS, STRENGTHS & REMEDIES ═══ */}
        {(reading?.explanation || (readingSummary?.yogas && readingSummary.yogas.length > 0)) && (
          <HySection
            id="hy-insights"
            title={lang === "ta" ? "யோகம், பலம் & பரிகாரம்" : "Yogas, strengths & remedies"}
            sub={lang === "ta" ? "இந்த ஜாதகத்தின் அடையாளம் — முழு விளக்கம் கீழே" : "this chart's signature — full explanation below"}
          >
            {reading?.explanation ? (
              <div className="hy-grid-triad">
                <HyYogaDoshaCard lang={lang} yogaDosham={reading.explanation.yogaDosham} onViewAll={() => jumpTo("hy-explain")} />
                <HyStrengthsWatchoutsCard lang={lang} planets={reading.explanation.planets} />
                {/* Remedies preview only — the full prescriptive plan (temple,
                    mantra, japa, gemstone, daanam) is owned by Life Areas ->
                    Remedies. "View all" deep-links to that sub-tab, the single
                    home for the artifact (IA audit 2026-07-22, Phase 1/2). */}
                <HyRemediesCard lang={lang} planets={reading.explanation.planets} onViewAll={onGoToRemedies ?? onGoToLifeAreas} />
              </div>
            ) : (
              /* Explanation still loading — keep the flat yoga glance rather than nothing. */
              <Card style={{ borderRadius: "var(--radius-xl)", padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <Kicker color="var(--color-mid)">{lang === "ta" ? "யோகம் & தோஷம்" : "Yoga & doshas"}</Kicker>
                {(readingSummary?.yogas ?? []).slice(0, 8).map((y) => (
                  <div key={y.name} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{y.name}</span>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)", color: y.isPresent ? "var(--color-high)" : "var(--color-faint)", background: y.isPresent ? "var(--color-high-bg)" : "transparent", border: `1px solid ${y.isPresent ? "var(--color-high-border)" : "var(--color-border)"}` }}>
                      {y.isPresent ? (y.isCurrentlyActive ? (lang === "ta" ? "செயலில்" : "Active") : (lang === "ta" ? "உள்ளது" : "Present")) : (lang === "ta" ? "இல்லை" : "Absent")}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </HySection>
        )}

        {/* ═══ 8 · PREDICTIONS & FORECAST (year-ahead life areas + transits) ═══ */}
        <section id="hy-forecast" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", scrollMarginTop: "72px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,2.4vw,1.75rem)", fontWeight: 600, color: "var(--color-text-strong)" }}>{lang === "ta" ? "முன்னறிவிப்பு & முன்னோட்டம்" : "Predictions & forecast"}</h2>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{lang === "ta" ? `${readingName} — வரும் வருடத்தின் முக்கிய வாழ்க்கைத் துறைகள்` : `${readingName} — key life areas for the year ahead`}</div>
          </div>
          <div className="hy-grid-forecast">
            {/* Left (1.9fr): the life-area outlook table + the detailed
                dasha-period forecast underneath it. */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
              {/* Compact preview — the full expandable horizon + deep per-area
                  analysis is owned by Life Areas -> Predictions (its single
                  home). "Open full analysis ->" deep-links to that sub-tab, the
                  only path to the full table (IA audit 2026-07-22, Phase 1/2). */}
              <HyLifeAreaForecast compact lang={lang} areas={lifeAreas?.areas ?? null} age={readingSummary?.currentAge} onOpenLifeAreas={onGoToForecast ?? onGoToLifeAreas} />
              <HyDetailedForecast
                lang={lang}
                dasha={reading?.dasha ?? null}
                dashaAntar={reading?.dashaAntar ?? []}
                dashaMaha={reading?.dashaMaha ?? null}
                planets={reading?.explanation?.planets}
                lagnaRasi={readingChart?.lagna.rasi}
                today={selectedDate}
                onViewAll={onGoToForecast ?? onGoToLifeAreas}
              />
            </div>
            {/* Right (1fr): transit overview, then the (real) Ask Vinaadi
                assistant scoped to the reading chart, then a daily affirmation. */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minWidth: 0 }}>
              <HyTransitOverview lang={lang} transit={reading?.transit ?? null} memberName={readingName} />
              {reading?.sani && <HySaniCard lang={lang} sani={reading.sani} />}
              {readingChartId && <DashboardAskVinaadi lang={lang} chartId={readingChartId} embedded />}
              <HyDailyAffirmation lang={lang} selectedDate={selectedDate} dayScore={dailyGuidance?.score} seed={readingChartId ?? readingName} />
            </div>
          </div>
        </section>

        {/* ═══ 9 · FULL TECHNICAL READING (Level-3 deep reference) ═══
             Phase 4 (docs/family-charts-humanization-audit.md): this is the
             bottom of the Meaning->Why->Mechanics ladder — the complete jyotishi's
             reading. Relabelled and collapsed by default (dropped `defaultOpen`)
             so a newcomer is never met by a wall of Level-6 prose; anyone who
             wants it is one tap away. */}
        {readingChart && (
          <HySection
            id="hy-explain"
            title={lang === "ta" ? "முழு ஜோதிட விளக்கம்" : "Full technical reading"}
            sub={lang === "ta" ? "ஒரு ஜோதிடர் படிக்கும் முழு விவரம் — தலைப்பு வாரியாக" : "the complete jyotishi's reading — every topic, in detail"}
          >
            <ChartExplanationPanel
              lang={lang}
              chart={readingChart}
              explanation={reading?.explanation ?? null}
              summary={readingSummary}
              transit={reading?.transit ?? null}
              sani={reading?.sani ?? null}
              peyarchiUpcoming={reading?.peyarchiUpcoming ?? []}
              dasha={reading?.dasha ?? null}
              dashaAntar={reading?.dashaAntar ?? []}
              renderYogaDoshamPanel={({ lang: l, yogas, doshams }) => <NovaYogaDoshamPanel lang={l} yogas={yogas} doshams={doshams} />}
            />

            <VargasPanel
              lang={lang}
              vargas={readingChart.vargas}
              d1Planets={Object.fromEntries(readingChart.planets.map((p) => [p.graha, p.rasi]))}
              equalBhava={readingChart.equalBhava}
              vargaReliability={readingChart.vargaReliability}
            />

            {readingChartId && <ShadbalaPanel lang={lang} chartId={readingChartId} />}
            <AdvancedAstrologyGate lang={lang} mode={mode}>
              {readingChartId && <YoginiDashaPanel lang={lang} chartId={readingChartId} />}
              {readingChartId && <AshtottariDashaPanel lang={lang} chartId={readingChartId} />}
              {readingChartId && <KalachakraDashaPanel lang={lang} chartId={readingChartId} />}
              {readingChartId && <ConditionalDashasPanel lang={lang} chartId={readingChartId} />}
            </AdvancedAstrologyGate>

            {(charaDasha || solarReturn) && (
              <Card>
                <Kicker>{lang === "ta" ? "பாரம்பரிய கால நிர்ணயம்" : "Classical Timing"}</Kicker>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
                  {charaDasha && (
                    <CollapsibleSection title={lang === "ta" ? "ஜைமினி சார தசை" : "Jaimini Chara Dasha"} defaultOpen={false}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", paddingTop: "var(--space-2)" }}>
                        {charaDasha.currentPeriod && (
                          <Card variant="high" style={{ display: "block", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)" }}>
                            <Kicker as="p" color="var(--color-high)" style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>{lang === "ta" ? "தற்போதைய சார தசை" : "Current Chara Dasha"}</Kicker>
                            <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{charaDasha.currentPeriod.rasi_name}</p>
                            <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{charaDasha.currentPeriod.start_date} – {charaDasha.currentPeriod.end_date}</p>
                          </Card>
                        )}
                        {charaDasha.periods.map((period) => (
                          <Card key={`${period.rasi}-${period.start_date}`} style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-1_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: charaDasha.currentPeriod?.rasi === period.rasi ? "var(--color-surface-soft)" : "transparent" }}>
                            <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>{period.rasi_name}</span>
                            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{period.years} {lang === "ta" ? "ஆண்டுகள்" : "yrs"} · {period.start_date}</span>
                          </Card>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                  {solarReturn && (
                    <CollapsibleSection title={lang === "ta" ? `${solarReturn.returnYear} ஆண்டு தாஜகா` : `${solarReturn.returnYear} Annual Chart`} defaultOpen={false}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-2_5)", paddingTop: "var(--space-2)" }}>
                        <Card variant="soft" style={{ display: "block", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)" }}>
                          <Kicker as="p" color="var(--color-faint)" style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>{lang === "ta" ? "வருட லக்னம்" : "SR Lagna"}</Kicker>
                          <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{solarReturn.srLagnaRasiName}</p>
                        </Card>
                        <Card variant="soft" style={{ display: "block", padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-md)" }}>
                          <Kicker as="p" color="var(--color-faint)" style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>{lang === "ta" ? "முந்தா" : "Muntha"}</Kicker>
                          <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{solarReturn.munthaRasiName}</p>
                        </Card>
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              </Card>
            )}
          </HySection>
        )}

        {/* ═══ 10 · FAMILY CONNECTIONS ═══ */}
        <section id="hy-connections" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", scrollMarginTop: "72px", paddingBottom: "var(--space-2)" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,2.4vw,1.75rem)", fontWeight: 600, color: "var(--color-text-strong)" }}>{lang === "ta" ? "குடும்ப உறவுகள்" : "Family connections"}</h2>

          {selectedVaultId && members.length > 1 && (
            <div ref={harmonyRef} style={{ scrollMarginTop: "72px" }}>
              <DashboardFamilyHarmonyRemedies lang={lang} vaultId={selectedVaultId} memberCount={members.length} openSignal={remediesNonce} />
            </div>
          )}

          {/* Cross-chart compatibility (synastry) now lives in the Tools tab —
              a pointer, not a second copy of the matrix/panel. */}
          {memberCharts.length > 0 && onGoToTools && (
            <button
              type="button"
              onClick={onGoToTools}
              style={{ textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-5) var(--space-5)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}
            >
              <span style={{ flexShrink: 0, width: "34px", height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", color: "var(--color-accent-secondary)", fontSize: "var(--text-md)" }}>◇</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{lang === "ta" ? "பொருத்தம் / இணக்கம்" : "Compatibility"}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{lang === "ta" ? "இருவரின் ஜாதகப் பொருத்தம் இப்போது கருவிகள் தாவலில் உள்ளது." : "Cross-chart synastry now lives in the Tools tab."}</div>
              </div>
              <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", whiteSpace: "nowrap" }}>{lang === "ta" ? "கருவிகளில் திற" : "Open in Tools"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" /></span>
            </button>
          )}

          <div className="hy-grid-forecast">
            <HyBondsCard lang={lang} participants={bondParticipants} />
            <Card style={{ padding: "var(--space-6) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <Kicker color="var(--color-mid)">{lang === "ta" ? "பகிரப்பட்ட முகூர்த்தம்" : "Shared muhurtham"}</Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-faint)" }}>
                {lang === "ta" ? "இது விரைவில் வரும் — தற்போது தனிநபர் நாள்காட்டி மட்டுமே கிடைக்கிறது." : "Coming soon — there's no cross-family shared-events feed yet. Check each member's own Calendar tab for now."}
              </p>
            </Card>
          </div>

          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.6, maxWidth: "900px" }}>
            {lang === "ta" ? "பரிகாரம் மனதை அமைதிப்படுத்தி, சரியான நேரத்துடன் உங்கள் முயற்சியை இணைக்கிறது — ஒரு குறிப்பிட்ட விளைவை உறுதி செய்ய முடியாது." : "Pariharam steadies the mind and aligns your effort with the right time — it cannot guarantee a specific outcome. None of this is a substitute for medical, legal, or financial advice."}
          </div>
        </section>
    </div>
  );
}
