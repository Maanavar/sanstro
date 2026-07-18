"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { formatClockLabel, scoreColor } from "@/lib/format";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { compareSynastry } from "@vinaadi/shared/api/relationships";
import type {
  ChartCalculateResponseData,
  FamilyAggregateData,
  FamilyAggregateMember,
  FamilyCompositeTimelineData,
  FamilyMemberData,
  FamilyMemberTodayScore,
  FamilyVaultDetailData,
  FamilyVaultListItem,
  FamilyVaultTodayData,
  PanchangamDailyResponseData,
  RelationshipAlertItem,
} from "@/lib/types";

import { formatHeaderDate, getTamilMonthDate } from "./dashboard-calendar-shared";
import { ScoreRing, formatRelLabel, MemberDetailExpanded, FamilySevenDayOutlook, ageFromBirth } from "./dashboard-family-shared";
import { DashboardFamilyMemberNova } from "./dashboard-family-member-nova";
import type { MemberChart } from "@/hooks/useFamilyData";
import { NovaScoreDial } from "./dashboard-ui-nova";
import { SynastryMatrix } from "./synastry-matrix";
import { SynastryPanel } from "./dashboard-synastry-panel";
import { DashboardChartsPanelNova } from "./dashboard-charts-panel-nova";
import { DashboardFamilyHarmonyRemedies } from "./dashboard-family-harmony-remedies";

/**
 * Nova "Family" tab — Phase 4 of the dashboard revamp (see
 * docs/DASHBOARD_UI_REVAMP_PLAN.md §6.3 for the full gap/mapping table).
 * Re-skin where the data already exists (family score, per-member charts,
 * synastry), net-new presentation where the mockup implies a summary layer
 * over existing data (relation buckets, needs-care/brightest split, all-pairs
 * bonds). Everything below is real data — nothing invented.
 */

const ELDER_AGE = 60;
const MINOR_AGE = 18;
const LOW_SCORE_THRESHOLD = 45; // mirrors app/services/family_vault_service.py's low_score_count cutoff

type RelationBucket = "elder" | "adult" | "child";
type RelationFilter = "all" | RelationBucket | "needsCare";

function ageBucket(age: number | null | undefined): RelationBucket {
  if (age == null || Number.isNaN(age)) return "adult";
  if (age < MINOR_AGE) return "child";
  if (age >= ELDER_AGE) return "elder";
  return "adult";
}

function memberNeedsCare(member: FamilyAggregateMember, isChandrashtama: boolean): boolean {
  if (isChandrashtama) return true;
  if (member.individualScore < LOW_SCORE_THRESHOLD) return true;
  return member.activeCycleTags.some((tag) => tag.includes("SANI") || tag.includes("CHANDRASHTAMA"));
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

/** Minutes since midnight, clamped to a 6am–6pm(360min) display axis. */
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

/* ── Kicker label (shared visual convention across Nova screens) ── */
function NovaKicker({ children, color = "var(--color-accent)" }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color }}>
      {children}
    </p>
  );
}

/* ── Today's rhythm sparkline card ── */
function NovaFamilyRhythmCard({
  lang,
  selectedDate,
  bestWindow,
  avoidWindow,
  careMembers,
  brightMembers,
}: {
  lang: Lang;
  selectedDate: string;
  bestWindow: { start: string; end: string } | null;
  avoidWindow: { start: string; end: string } | null;
  careMembers: { displayName: string; note: string }[];
  brightMembers: { displayName: string; score: number }[];
}) {
  const bestStartPct = timeToAxisPct(bestWindow?.start);
  const bestEndPct = timeToAxisPct(bestWindow?.end);
  const avoidStartPct = timeToAxisPct(avoidWindow?.start);
  const avoidEndPct = timeToAxisPct(avoidWindow?.end);
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const nowPct = isToday ? timeToAxisPct(`${new Date().getHours()}:${new Date().getMinutes()}`) : null;

  // Arc geometry — same "sun rides the drawn arc" math as the personal/panchangam
  // DayTimeline (dashboard-personal-hero.tsx): for a quadratic arc with equal end
  // heights y0=y2=ARC_BASE and control ARC_PEAK, the on-curve y at fraction t is
  // ARC_BASE - 2·t(1-t)·(ARC_BASE-ARC_PEAK), so the sun sits exactly on the stroke.
  const ARC_X0 = 20, ARC_X1 = 300, ARC_SPAN = ARC_X1 - ARC_X0; // 20..300 within a 320 viewBox
  const ARC_BASE = 74, ARC_PEAK = 16;
  const pctToX = (pct: number) => ARC_X0 + (pct / 100) * ARC_SPAN;
  const sunX = nowPct != null ? pctToX(nowPct) : null;
  const sunY = nowPct != null
    ? ARC_BASE - 2 * (nowPct / 100) * (1 - nowPct / 100) * (ARC_BASE - ARC_PEAK)
    : null;

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
        {lang === "ta" ? "இன்றைய தாளம்" : "Today's rhythm"}
      </div>
      <div>
        <svg viewBox="0 0 320 92" style={{ width: "100%", height: "auto", display: "block" }} preserveAspectRatio="xMidYMid meet">
          {/* Day arc (dawn → noon → dusk) */}
          <path d={`M${ARC_X0},${ARC_BASE} Q160,${ARC_PEAK} ${ARC_X1},${ARC_BASE}`} stroke="var(--color-border-strong)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Horizon line */}
          <rect x={ARC_X0} y={ARC_BASE - 1.5} width={ARC_SPAN} height="3" rx="1.5" fill="var(--color-border)" />
          {/* Best shared window */}
          {bestStartPct != null && bestEndPct != null && (
            <rect x={pctToX(bestStartPct)} y={ARC_BASE - 2.5} width={Math.max(5, ((bestEndPct - bestStartPct) / 100) * ARC_SPAN)} height="5" rx="2.5" fill="var(--color-score-high, #5C7654)" />
          )}
          {/* Avoid window */}
          {avoidStartPct != null && avoidEndPct != null && (
            <rect x={pctToX(avoidStartPct)} y={ARC_BASE - 2.5} width={Math.max(5, ((avoidEndPct - avoidStartPct) / 100) * ARC_SPAN)} height="5" rx="2.5" fill="var(--color-score-low, #A8482F)" />
          )}
          {/* Hour ticks */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line key={pct} x1={pctToX(pct)} y1={ARC_BASE + 4} x2={pctToX(pct)} y2={ARC_BASE + 10} stroke="var(--color-faint)" strokeWidth="1.5" strokeLinecap="round" />
          ))}
          {/* Sun riding the arc at current time */}
          {sunX != null && sunY != null && (
            <g>
              <circle cx={sunX} cy={sunY} r="10" fill="var(--color-accent)" opacity="0.18" />
              <circle cx={sunX} cy={sunY} r="5.5" fill="var(--color-accent-strong)" stroke="var(--color-surface)" strokeWidth="1.5" />
            </g>
          )}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-faint)", marginTop: "1px", padding: "0 6.25%" }}>
          <span>6a</span><span>9a</span><span>12p</span><span>3p</span><span>6p</span>
        </div>
      </div>

      {careMembers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <NovaKicker color="var(--color-low)">{lang === "ta" ? "மென்மையான கவனம் தேவை" : "Needs gentle care"}</NovaKicker>
          {careMembers.map((m) => (
            <div key={m.displayName} style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "9px", padding: "9px 12px" }}>
              <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-low)", color: "var(--color-text-strong)", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                {m.displayName.charAt(0).toUpperCase()}
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 600, flex: 1 }}>{m.displayName}</span>
              <span style={{ fontSize: "11px", color: "var(--color-low)" }}>{m.note}</span>
            </div>
          ))}
        </div>
      )}

      {brightMembers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <NovaKicker color="var(--color-high)">{lang === "ta" ? "இன்று மிகவும் பிரகாசமானவர்" : "Brightest today"}</NovaKicker>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {brightMembers.map((m) => (
              <div key={m.displayName} style={{ flex: "1 1 100px", display: "flex", alignItems: "center", gap: "8px", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "9px", padding: "9px 11px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--color-mid)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                  {m.displayName.charAt(0).toUpperCase()}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>{m.displayName}</span>
                <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 700, color: "var(--color-high)" }}>{m.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Member grid card ── */
function NovaFamilyMemberCard({
  lang,
  member,
  todayItem,
  memberChart,
  relationLabel,
  isSelf,
  needsCare,
  onOpen,
}: {
  lang: Lang;
  member: FamilyAggregateMember;
  todayItem: FamilyMemberTodayScore | undefined;
  memberChart: MemberChart | undefined;
  relationLabel: string | null;
  isSelf: boolean;
  needsCare: boolean;
  onOpen: () => void;
}) {
  const summary = memberChart?.summary;
  const dasha = memberChart?.dasha;
  const bestWindow = memberChart?.dailyGuidance?.bestWindows[0];
  const color = scoreColor(member.individualScore);
  const insight = todayItem ? (lang === "ta" ? todayItem.highlightTa : todayItem.highlightEn) : "";

  const lagnaDashaLine = summary
    ? `${summary.lagnaRasi} ${t("label_lagnam", lang)}${dasha ? ` · ${tPlanetLord(dasha.current.mahadasha.lord, lang)}–${tPlanetLord(dasha.current.antardasha.lord, lang)}–${tPlanetLord(dasha.current.pratyantardasha.lord, lang)}` : ""}`
    : "";

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        background: "var(--color-surface)",
        border: `1px solid ${needsCare ? "var(--color-low-border)" : isSelf ? "var(--color-border-strong)" : "var(--color-border)"}`,
        borderRadius: "var(--radius-lg)", padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ flexShrink: 0, width: "44px", height: "44px", borderRadius: "50%", background: color, color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "17px", fontWeight: 700, fontFamily: "var(--font-display)" }}>
          {member.displayName.charAt(0).toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-strong)" }}>{member.displayName}</div>
          <div style={{ fontSize: "11px", color: "var(--color-faint)" }}>{isSelf ? (lang === "ta" ? "நீங்கள்" : "You") : relationLabel ?? ""}</div>
        </div>
        <ScoreRing score={member.individualScore} size={46} />
      </div>
      {lagnaDashaLine && (
        <div style={{ fontSize: "11px", color: "var(--color-faint)" }}>{lagnaDashaLine}</div>
      )}
      {insight && (
        <div style={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--color-text)" }}>{insight}</div>
      )}
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {bestWindow && (
          <span style={{ fontSize: "11px", color: "var(--color-high)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "999px", padding: "4px 10px" }}>
            ☀ {formatClockLabel(bestWindow.start)}–{formatClockLabel(bestWindow.end)}
          </span>
        )}
        {needsCare && (
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-low)", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "5px", padding: "3px 8px" }}>
            {lang === "ta" ? "கவனம் தேவை" : "needs care"}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "11.5px", color: "var(--color-accent-strong)", fontWeight: 600 }}>
          {lang === "ta" ? "திற →" : "Open →"}
        </span>
      </div>
    </button>
  );
}

/* ── Family bonds (all-pairs synastry) ── */
type BondParticipant = { id: string; displayName: string; chartId: string };
type BondPair = { a: BondParticipant; b: BondParticipant; score: number };

function NovaFamilyBondsCard({
  lang,
  participants,
}: {
  lang: Lang;
  participants: BondParticipant[];
}) {
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
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <NovaKicker>{lang === "ta" ? "குடும்ப பொருத்தம்" : "Family bonds"}</NovaKicker>
        {!loaded && (
          <button type="button" onClick={() => void loadBonds()} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {lang === "ta" ? "ஏற்று →" : "Load bonds →"}
          </button>
        )}
      </div>

      {loading && (
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</p>
      )}

      {strongest && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "10px", padding: "11px 14px" }}>
          <span style={{ fontSize: "15px" }}>✦</span>
          <div style={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--color-text)" }}>
            {lang === "ta" ? "வலுவான பொருத்தம்: " : "Strongest bond: "}
            <b style={{ color: "var(--color-accent-strong)" }}>{strongest.a.displayName} ↔ {strongest.b.displayName}</b>
            {" "}
            <span style={{ fontWeight: 700, color: scoreColor(strongest.score) }}>
              {strongest.score}<span style={{ color: "var(--color-faint)", fontWeight: 500 }}>/100</span>
            </span>
            {" — "}{bondToneLine(strongest.score, lang)}.
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="nova-grid-2" style={{ display: "grid", gap: "10px" }}>
          {rest.map((pair) => {
            const color = scoreColor(pair.score);
            return (
              <div key={`${pair.a.id}-${pair.b.id}`} style={{ border: "1px solid var(--color-border)", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "7px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 600 }}>{pair.a.displayName} ↔ {pair.b.displayName}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color }}>{pair.score}<span style={{ color: "var(--color-faint)", fontWeight: 500 }}>/100</span></span>
                </div>
                <div style={{ height: "5px", borderRadius: "3px", background: "var(--color-border)" }}>
                  <div style={{ width: `${Math.max(0, Math.min(100, pair.score))}%`, height: "100%", borderRadius: "3px", background: color }} />
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--color-faint)" }}>{bondToneLine(pair.score, lang)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main tab ───────────────────────────────────────────── */
export type DashboardFamilyTabNovaProps = {
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
  /** Navigates to the dedicated Journal tab — the family tab no longer embeds
   *  its own journal panel (it duplicated that tab behind an invisible toggle). */
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
};

export function DashboardFamilyTabNova({
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
  relationshipAlerts,
  alertsLoading,
  panchangam,
  mode,
  onGoToJournal,
  onOpenPrasna,
  showPrasna,
  onClosePrasna,
  busy,
  onRefreshFamily,
  onOpenSetup,
  onSelectVault,
  onDeleteMember,
  onEditMember,
}: DashboardFamilyTabNovaProps) {
  const [detailView, setDetailView] = useState(false);
  const [familyToday, setFamilyToday] = useState<FamilyVaultTodayData | null>(null);
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [synastrySubTab, setSynastrySubTab] = useState(false);
  const [remediesNonce, setRemediesNonce] = useState(0);

  // Both header actions used to look dead: their targets render far below the
  // fold, so a click produced no visible change. Scroll the opened section
  // (or the freshly selected member's detail) into view instead.
  const synastryRef = useRef<HTMLDivElement | null>(null);
  const memberDetailRef = useRef<HTMLDivElement | null>(null);
  const harmonyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (synastrySubTab) synastryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [synastrySubTab]);
  useEffect(() => {
    if (selectedMemberId) memberDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedMemberId]);
  useEffect(() => {
    if (remediesNonce > 0) harmonyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [remediesNonce]);

  useEffect(() => {
    if (!selectedVaultId) {
      setFamilyToday(null);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const controller = new AbortController();
    const { signal } = controller;
    void apiFetchJson<{ data: FamilyVaultTodayData }>(
      `/api/v1/family-vaults/${selectedVaultId}/today?date=${today}`, { signal },
    )
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
      // Age and chandrashtama both sourced from this member's own chart at the currently
      // navigated selectedDate — same fields MemberDetailExpanded uses below on this same
      // screen, so the grid badge/filter and the expanded card can never disagree.
      const birthDateLocal = chart?.chart?.birthProfile?.birthDateLocal ?? null;
      const bucket = ageBucket(birthDateLocal ? ageFromBirth(birthDateLocal, selectedDate) : null);
      const careFlag = memberNeedsCare(m, chart?.transit?.isChandrashtama ?? false);
      return { member: m, familyMember: fm, chart, todayItem, bucket, careFlag, isSelf: isOwnerRow };
    });
  }, [familyAggregate, familyMembers, memberCharts, familyToday, ownerMemberChart, selectedDate]);

  const bucketCounts = useMemo(() => {
    const counts = { elder: 0, adult: 0, child: 0, needsCare: 0 };
    for (const meta of memberMeta) {
      counts[meta.bucket] += 1;
      if (meta.careFlag) counts.needsCare += 1;
    }
    return counts;
  }, [memberMeta]);

  const filteredMeta = memberMeta.filter((meta) => {
    if (relationFilter === "all") return true;
    if (relationFilter === "needsCare") return meta.careFlag;
    return meta.bucket === relationFilter;
  });

  const familyScore = familyAggregate?.familyScore ?? 0;
  const familyLabelRaw = familyAggregate?.familyLabel ?? "";
  const heroText = FAMILY_HERO_TEXT[familyLabelRaw] ?? FAMILY_HERO_TEXT.SUPPORTIVE_MIXED!;
  const bestWindow = familyAggregate?.bestFamilyWindows[0] ?? null;
  const avoidWindow = familyAggregate?.avoidForFamilyDecisions[0] ?? null;

  const careMembers = memberMeta
    .filter((meta) => meta.careFlag)
    .slice(0, 2)
    .map((meta) => ({
      displayName: meta.member.displayName,
      note: lang === "ta" ? "ஓய்வு · முடிவுகளை தவிர்க்கவும்" : "rest · avoid decisions",
    }));
  const brightMembers = [...memberMeta]
    .sort((a, b) => b.member.individualScore - a.member.individualScore)
    .slice(0, 2)
    .map((meta) => ({ displayName: meta.member.displayName, score: meta.member.individualScore }));

  const weekday = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "long" });
  const dateLine = `${weekday} · ${formatHeaderDate(selectedDate, lang)} · ${getTamilMonthDate(selectedDate, lang)}`;

  const activeMember = members.find((m) => m.familyMemberId === selectedMemberId) ?? null;
  const activeIsSelf = activeMember ? activeMember.familyMemberId === activeMember.birthProfileId : true;
  const activeMemberChart = activeMember
    ? (activeIsSelf
        ? (ownerMemberChart ?? undefined)
        : memberCharts.find((mc) => mc.memberId === activeMember.familyMemberId))
    : undefined;
  // Whichever profile is open drives the deep-dive chart panel below — the owner
  // by default, or the selected member once a tile is clicked. This keeps the
  // panel from always showing the owner's own chart under someone else's tile.
  const chartsPanelChartId = activeMember ? activeMember.chartId : ownerChartId;
  const chartsPanelChart = activeMember ? activeMemberChart : (ownerMemberChart ?? undefined);
  const chartsPanelDisplayName = activeMember ? activeMember.displayName : ownerDisplayName;
  const activeMemberIndex = activeMember ? members.findIndex((m) => m.familyMemberId === activeMember.familyMemberId) : -1;
  const prevMember = activeMemberIndex > 0 ? members[activeMemberIndex - 1] : null;
  const nextMember = activeMemberIndex >= 0 && activeMemberIndex < members.length - 1 ? members[activeMemberIndex + 1] : null;
  const activeTodayItem = activeMember ? todayMembers.find((tm) => tm.memberId === activeMember.familyMemberId) : undefined;
  const activeRelationLabel = activeMember
    ? formatRelLabel(familyMembers.find((fm) => fm.familyMemberId === activeMember.familyMemberId)?.relationshipToOwner)
    : null;
  const relationshipParticipants = activeMember
    ? [
        ...(ownerChartId ? [{ id: "owner", displayName: ownerDisplayName, chartId: ownerChartId, relationLabel: lang === "ta" ? "நீங்கள்" : "You" }] : []),
        ...memberCharts
          .filter((mc) => mc.memberId !== activeMember.familyMemberId)
          .map((mc) => ({
            id: mc.memberId,
            displayName: mc.displayName,
            chartId: mc.chart.chartId,
            relationLabel: formatRelLabel(familyMembers.find((fm) => fm.familyMemberId === mc.memberId)?.relationshipToOwner),
          })),
      ]
    : [];

  const bondParticipants: BondParticipant[] = [
    ...(ownerChartId ? [{ id: "owner", displayName: ownerDisplayName, chartId: ownerChartId }] : []),
    ...memberCharts.map((mc) => ({ id: mc.memberId, displayName: mc.displayName, chartId: mc.chart.chartId })),
  ];

  // Built from memberCharts (not the raw `members` aggregate) — the aggregate includes a
  // synthetic owner row (familyMemberId === birthProfileId, see useFamilyData.ts) that
  // memberCharts already filters out. Using `members` here let the owner show up as a
  // selectable comparison target in Relationship Compatibility/Porutham, i.e. comparing
  // the root user against themselves.
  const memberOptions = memberCharts.map((mc) => {
    const fm = familyMembers.find((f) => f.familyMemberId === mc.memberId);
    return { memberId: mc.memberId, displayName: mc.displayName, relationshipToOwner: fm?.relationshipToOwner ?? "other" };
  });
  const memberChartsForSynastry = memberCharts.map((m) => ({ memberId: m.memberId, displayName: m.displayName, chart: m.chart }));

  if (detailView && activeMember) {
    return (
      <DashboardFamilyMemberNova
        lang={lang}
        selectedDate={selectedDate}
        member={activeMember}
        memberChart={activeMemberChart}
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Page header ===== */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <NovaKicker>
            {lang === "ta" ? <>குடும்பம் இன்று · <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>குடும்பம்</span></> : <>Family today</>}
          </NovaKicker>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 600, marginTop: "5px", color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "பகிரப்பட்ட, ஆதரவான நாள்." : <>A shared, <span style={{ color: "var(--color-accent-strong)" }}>{familyLabelRaw ? familyLabelRaw.toLowerCase().replace(/_/g, " ") : "supportive"}</span> day.</>}
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--color-muted)", marginTop: "2px" }}>
            {dateLine} · {lang === "ta" ? "அனைவரின் ஜாதகமும் ஒன்றாக படிக்கப்படுகிறது" : "everyone's charts read together"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {vaults.length > 1 && vaults.map((v) => (
            <button key={v.familyVaultId} type="button" onClick={() => onSelectVault(v)}
              style={{
                fontSize: "12px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                borderRadius: "9px", padding: "8px 14px",
                border: `1px solid ${v.familyVaultId === selectedVaultId ? "var(--color-accent)" : "var(--color-border-strong)"}`,
                background: v.familyVaultId === selectedVaultId ? "var(--color-accent)" : "transparent",
                color: v.familyVaultId === selectedVaultId ? "var(--color-on-accent)" : "var(--color-text)",
              }}>
              {v.name}
            </button>
          ))}
          <button type="button" onClick={onRefreshFamily} disabled={!selectedVaultId || busy.family}
            style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)", background: "transparent", border: "1px solid var(--color-border-strong)", borderRadius: "9px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            {busy.family ? (lang === "ta" ? "புதுப்பிக்கிறது…" : "Refreshing…") : (lang === "ta" ? "புதுப்பி" : "Refresh")}
          </button>
          {memberCharts.length > 0 && (
            <button type="button" onClick={() => setSynastrySubTab((v) => !v)}
              style={{
                fontSize: "12px", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                borderRadius: "9px", padding: "8px 14px",
                border: `1px solid ${synastrySubTab ? "var(--color-accent)" : "var(--color-border-strong)"}`,
                background: synastrySubTab ? "var(--color-accent-muted)" : "transparent",
                color: "var(--color-accent-strong)",
              }}>
              ◇ {lang === "ta" ? "பொருத்தம்" : "Compatibility"}
            </button>
          )}
          {members.length > 1 && (
            <button type="button" onClick={() => setRemediesNonce((n) => n + 1)}
              style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "1px solid var(--color-border-strong)", borderRadius: "9px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              🪔 {lang === "ta" ? "பரிகாரம் →" : "Remedies →"}
            </button>
          )}
          {onGoToJournal && (
            <button type="button" onClick={onGoToJournal} style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "1px solid var(--color-border-strong)", borderRadius: "9px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              ✎ {lang === "ta" ? "ஜர்னல் →" : "Journal →"}
            </button>
          )}
          <button type="button" onClick={onOpenSetup} style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "9px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            + {lang === "ta" ? "உறுப்பினரைச் சேர்" : "Add member"}
          </button>
        </div>
      </div>

      {/* ===== Cold-start nudge — the vault has no one but the owner yet, so the
          reason most family users came (shared harmony/best-times/compatibility)
          isn't available. Reassures on birth-time precision too, since P04
          deferred adding a member rather than guess an exact time she didn't
          have on hand — the backend has always accepted an approximate one (#4/#60). */}
      {members.length <= 1 && (
        <div style={{
          display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap",
          background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)",
          borderRadius: "var(--radius-lg)", padding: "20px 24px",
        }}>
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, color: "var(--color-text-strong)" }}>
              {t("family_coldstart_title", lang)}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "13px", lineHeight: 1.55, color: "var(--color-muted)" }}>
              {t("family_coldstart_body", lang)}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "12px", lineHeight: 1.5, color: "var(--color-faint)" }}>
              🕒 {t("family_coldstart_time_note", lang)}
            </p>
          </div>
          <button type="button" onClick={onOpenSetup} style={{ flexShrink: 0, fontSize: "13.5px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "10px", padding: "12px 20px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {t("family_coldstart_cta", lang)}
          </button>
        </div>
      )}

      {/* ===== Harmony hero + rhythm ===== */}
      <div className="nova-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 348px", gap: "18px" }}>
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "26px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
            <NovaScoreDial score={familyScore} size={118} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <NovaKicker>
                {lang === "ta" ? <>குடும்ப ஒற்றுமை · <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>ஒற்றுமை</span></> : "Family harmony"}
              </NovaKicker>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 600, lineHeight: 1.2, marginTop: "6px", color: "var(--color-text-strong)" }}>
                {lang === "ta" ? heroText.ta : heroText.en}
              </div>
              {familyAggregate?.summary && (
                <div style={{ fontSize: "13.5px", lineHeight: 1.55, color: "var(--color-muted)", marginTop: "8px" }}>
                  {lang === "ta" ? familyAggregate.summary.ta : familyAggregate.summary.en}
                </div>
              )}
            </div>
          </div>
          {bestWindow && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "11px", padding: "13px 16px" }}>
              <span style={{ flexShrink: 0, width: "34px", height: "34px", borderRadius: "50%", background: "var(--color-high-bg)", display: "grid", placeItems: "center", fontSize: "15px" }}>☀</span>
              <div style={{ flex: 1 }}>
                <NovaKicker color="var(--color-high)">{lang === "ta" ? "சிறந்த பகிர்ந்த நேரம்" : "Best shared window"}</NovaKicker>
                <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>
                  {formatClockLabel(bestWindow.start)} – {formatClockLabel(bestWindow.end)} <span style={{ color: "var(--color-muted)", fontWeight: 500 }}>· {lang === "ta" ? `அனைத்து ${members.length} பேரும் ஒத்திசைவு` : `all ${members.length} aligned`}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <NovaFamilyRhythmCard
          lang={lang}
          selectedDate={selectedDate}
          bestWindow={bestWindow}
          avoidWindow={avoidWindow}
          careMembers={careMembers}
          brightMembers={brightMembers}
        />
      </div>

      {/* ===== 7-day outlook — shared derivation with Classic, see dashboard-family-tab.tsx ===== */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 22px" }}>
        <FamilySevenDayOutlook lang={lang} selectedDate={selectedDate} familyScore={familyScore} familyComposite={familyComposite} members={members} />
      </div>

      {/* ===== Members grid — relation filter chips live in this header (not as
          their own top-of-page row) since they only ever control this grid;
          keeping the control next to what it filters. ===== */}
      {members.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                {lang === "ta" ? "உறுப்பினர்கள்" : "Members"}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>
                {lang === "ta" ? "முழு விவரத்தைத் திறக்க ஒரு கார்டைத் தட்டவும்" : "tap any card to open the full profile"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {([
                ["all", lang === "ta" ? `அனைவரும் ${members.length}` : `All ${members.length}`],
                ["elder", lang === "ta" ? `மூத்தோர் ${bucketCounts.elder}` : `Elders ${bucketCounts.elder}`],
                ["adult", lang === "ta" ? `பெரியவர்கள் ${bucketCounts.adult}` : `Adults ${bucketCounts.adult}`],
                ["child", lang === "ta" ? `குழந்தைகள் ${bucketCounts.child}` : `Children ${bucketCounts.child}`],
              ] as [RelationFilter, string][]).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setRelationFilter(key)}
                  style={{
                    fontSize: "12px", fontWeight: relationFilter === key ? 700 : 500,
                    color: relationFilter === key ? "var(--color-on-accent)" : "var(--color-text)",
                    background: relationFilter === key ? "var(--color-accent)" : "transparent",
                    border: `1px solid ${relationFilter === key ? "var(--color-accent)" : "var(--color-border-strong)"}`,
                    borderRadius: "999px", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
                  }}>
                  {label}
                </button>
              ))}
              {bucketCounts.needsCare > 0 && (
                <button type="button" onClick={() => setRelationFilter(relationFilter === "needsCare" ? "all" : "needsCare")}
                  style={{
                    fontSize: "12px",
                    color: relationFilter === "needsCare" ? "var(--color-on-accent)" : "var(--color-low)",
                    background: relationFilter === "needsCare" ? "var(--color-low)" : "transparent",
                    border: `1px solid ${relationFilter === "needsCare" ? "var(--color-low)" : "var(--color-border)"}`,
                    borderRadius: "999px", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
                  }}>
                  {lang === "ta" ? `கவனம் தேவை ${bucketCounts.needsCare}` : `Needs care ${bucketCounts.needsCare}`} <span style={{ color: "var(--color-low)" }}>●</span>
                </button>
              )}
            </div>
          </div>
          <div className="nova-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {filteredMeta.map(({ member, familyMember, chart, todayItem, careFlag, isSelf }) => (
              <NovaFamilyMemberCard
                key={member.familyMemberId}
                lang={lang}
                member={member}
                todayItem={todayItem}
                memberChart={chart}
                relationLabel={formatRelLabel(familyMember?.relationshipToOwner)}
                isSelf={isSelf}
                needsCare={careFlag}
                onOpen={() => setSelectedMemberId(member.familyMemberId)}
              />
            ))}
          </div>
        </>
      )}

      {/* ===== Inline expanded detail — quick glance only (identity, score,
          best/avoid, score breakdown). The D1/D9 pictorial chart, the full
          chart-explanation tabs AND the Dasa·Bhukti·Antaram detail are
          deliberately NOT repeated here — they live once, in reading order
          (kattam → birth star → dasha), in the "Chart & explanations"
          deep-dive panel (DashboardChartsPanelNova directly below). "View
          full profile" opens the separate dedicated family-member screen
          (Phase 5), which has its own compact D1/D9 + summary and doesn't
          touch the deep-dive panel either. ===== */}
      {activeMember && (
        <div ref={memberDetailRef} style={{ display: "flex", flexDirection: "column", gap: "10px", scrollMarginTop: "80px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setDetailView(true)}
              style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "7px 16px", cursor: "pointer", fontFamily: "inherit" }}
            >
              {lang === "ta" ? "முழு விவரம் காண் →" : "View full profile →"}
            </button>
          </div>
          <MemberDetailExpanded
            member={activeMember}
            memberChart={activeMemberChart}
            relationshipToOwner={familyMembers.find((fm) => fm.familyMemberId === activeMember.familyMemberId)?.relationshipToOwner}
            onDelete={onDeleteMember}
            onEdit={onEditMember}
            deletingId={busy.deletingMemberId}
            today={selectedDate}
            lang={lang}
            hideChartAndExplanation
          />
        </div>
      )}

      {/* ===== Chart & explanations — the full astrology engine, moved off the
          Today homepage into this "Family & Charts" tab. Sits directly under
          the quick-glance card because both are about the same subject (the
          owner by default, or the selected member once a tile is opened) —
          previously this panel was pushed all the way down past Compatibility/
          Journal/Bonds, which broke the "look at one person" flow by forcing a
          scroll through unrelated family-wide content first. Prasna stays
          owner-only (gated inside the panel via isSelf) since it's account-
          level, not per-person astrology; Activity Timing lives in the Tools
          tab and Morning Guidance on the Today homepage. The Today tab's
          "Why this prediction?" bridge card links here. ===== */}
      {chartsPanelChartId && chartsPanelChart && (
        <DashboardChartsPanelNova
          lang={lang}
          activeChartId={chartsPanelChartId}
          selectedDate={selectedDate}
          personalChart={chartsPanelChart.chart}
          personalChartExplanation={chartsPanelChart.explanation}
          personalChartSummary={chartsPanelChart.summary}
          personalTransit={chartsPanelChart.transit}
          personalSani={chartsPanelChart.sani}
          peyarchiUpcoming={chartsPanelChart.peyarchiUpcoming}
          dasha={chartsPanelChart.dasha}
          dashaAntar={chartsPanelChart.dashaAntar}
          nakshatraCard={chartsPanelChart.nakshatraCard}
          mode={mode}
          isSelf={activeIsSelf}
          viewerDisplayName={chartsPanelDisplayName}
          onOpenPrasna={onOpenPrasna}
          showPrasna={showPrasna}
          onClosePrasna={onClosePrasna}
        />
      )}

      {/* ===== Family connections — everything that's about the group rather than
          one person (compatibility calculator, all-pairs bonds, shared muhurtham),
          grouped under one heading so it reads as a single "family relationships"
          zone at the bottom of the tab. Compatibility stays opt-in via the
          header's toggle button, which scrolls here when opened (its target
          being below the whole chart deep-dive is why the button used to look
          dead). Bonds/Muhurtham stay always-on. The family journal panel that
          used to sit after this zone is gone — the header's Journal button now
          navigates to the dedicated Journal tab instead. ===== */}
      <div ref={synastryRef} style={{ display: "flex", flexDirection: "column", gap: "18px", scrollMarginTop: "80px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
          {lang === "ta" ? "குடும்ப உறவுகள்" : "Family connections"}
        </div>

        {/* Family-harmony remedies — reads combustion/retrogression/node/weak-planet
            across every member's chart into one shared parigaram list. Only shown
            once there's more than the owner in the vault (a one-person "family" has
            no cross-chart pattern to consolidate). The header's "Remedies" button
            scrolls here (harmonyRef) and bumps remediesNonce to auto-load it. */}
        {selectedVaultId && members.length > 1 && (
          <div ref={harmonyRef} style={{ scrollMarginTop: "80px" }}>
            <DashboardFamilyHarmonyRemedies
              lang={lang}
              vaultId={selectedVaultId}
              memberCount={members.length}
              openSignal={remediesNonce}
            />
          </div>
        )}

        {synastrySubTab && (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {ownerChartId && memberCharts.length > 0 && (
              <SynastryMatrix
                lang={lang}
                ownerChartId={ownerChartId}
                familyVaultId={selectedVaultId}
                members={memberCharts.map((mc) => ({ memberId: mc.memberId, displayName: mc.displayName, chartId: mc.chart.chartId }))}
              />
            )}
            <SynastryPanel
              lang={lang}
              chartId={ownerChartId}
              familyVaultId={selectedVaultId}
              memberOptions={memberOptions}
              ownerChart={ownerChart}
              memberCharts={memberChartsForSynastry}
              relationshipAlerts={relationshipAlerts}
              alertsLoading={alertsLoading}
            />
          </div>
        )}

        <div className="nova-grid-2" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "18px" }}>
          <NovaFamilyBondsCard lang={lang} participants={bondParticipants} />

          {/* Shared muhurtham — genuine stub: no backend concept of a shared/cross-member
              events feed exists yet (only per-person daily guidance/festivals). Not invented. */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <NovaKicker>{lang === "ta" ? "பகிரப்பட்ட முகூர்த்தம்" : "Shared muhurtham"}</NovaKicker>
            <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.6, color: "var(--color-faint)" }}>
              {lang === "ta"
                ? "இது விரைவில் வரும் — தற்போது தனிநபர் நாள்காட்டி மட்டுமே கிடைக்கிறது."
                : "Coming soon — there's no cross-family shared-events feed yet. Check each member's own Calendar tab for now."}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
