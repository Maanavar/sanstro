"use client";

import { useEffect, useMemo, useState } from "react";

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

import { formatHeaderDate, getTamilMonthDate } from "./dashboard-calendar-tab";
import { ScoreRing, formatRelLabel, MemberDetailExpanded } from "./dashboard-family-tab";
import { DashboardFamilyMemberNova } from "./dashboard-family-member-nova";
import type { MemberChart } from "@/hooks/useFamilyData";
import { NovaScoreDial } from "./dashboard-ui-nova";
import { SynastryMatrix } from "./synastry-matrix";
import { SynastryPanel } from "./dashboard-synastry-panel";

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

function memberNeedsCare(member: FamilyAggregateMember, todayItem: FamilyMemberTodayScore | undefined): boolean {
  if (todayItem?.chandrashtama) return true;
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
  if (score >= 40) return lang === "ta" ? "நிலையான, பொதுவாக இணக்கமான பொருத்தம்" : "steady, generally aligned";
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

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
        {lang === "ta" ? "இன்றைய தாளம்" : "Today's rhythm"}
      </div>
      <div>
        <svg width="100%" height="60" viewBox="0 0 300 60" style={{ display: "block" }}>
          <path d="M6,52 Q150,-8 294,52" stroke="rgba(212,175,95,.35)" strokeWidth="1.5" fill="none" />
          {bestStartPct != null && bestEndPct != null && (
            <rect x={3 + bestStartPct * 2.88} y="40" width={Math.max(4, (bestEndPct - bestStartPct) * 2.88)} height="6" rx="3" fill="var(--color-high)" opacity="0.85" />
          )}
          {avoidStartPct != null && avoidEndPct != null && (
            <rect x={3 + avoidStartPct * 2.88} y="40" width={Math.max(4, (avoidEndPct - avoidStartPct) * 2.88)} height="6" rx="3" fill="var(--color-low)" opacity="0.85" />
          )}
          {nowPct != null && (
            <circle cx={3 + nowPct * 2.88} cy="18" r="4.5" fill="var(--color-accent-strong)" />
          )}
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-faint)", marginTop: "1px" }}>
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
        <NovaKicker>{lang === "ta" ? "இன்றைய குடும்ப பொருத்தம்" : "Family bonds today"}</NovaKicker>
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
            {lang === "ta" ? "இன்று வலுவான பொருத்தம்: " : "Strongest bond today: "}
            <b style={{ color: "var(--color-accent-strong)" }}>{strongest.a.displayName} ↔ {strongest.b.displayName}</b>
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
  vaults: FamilyVaultListItem[];
  familyDetail: FamilyVaultDetailData | null;
  familyAggregate: FamilyAggregateData | null;
  familyComposite: FamilyCompositeTimelineData | null;
  familyMembers: FamilyMemberData[];
  memberCharts: MemberChart[];
  relationshipAlerts: RelationshipAlertItem[];
  alertsLoading: boolean;
  panchangam: PanchangamDailyResponseData | null;
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
  vaults,
  familyAggregate,
  familyMembers,
  memberCharts,
  relationshipAlerts,
  alertsLoading,
  panchangam,
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
      const fm = familyMembers.find((f) => f.familyMemberId === m.familyMemberId);
      const chart = memberCharts.find((mc) => mc.memberId === m.familyMemberId);
      const todayItem = (familyToday?.members ?? []).find((tm) => tm.memberId === m.familyMemberId);
      const bucket = ageBucket(chart?.summary?.currentAge);
      const careFlag = memberNeedsCare(m, todayItem);
      return { member: m, familyMember: fm, chart, todayItem, bucket, careFlag };
    });
  }, [familyAggregate, familyMembers, memberCharts, familyToday]);

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
  const activeMemberChart = activeMember ? memberCharts.find((mc) => mc.memberId === activeMember.familyMemberId) : undefined;
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

  const memberOptions = members.map((m) => {
    const fm = familyMembers.find((f) => f.familyMemberId === m.familyMemberId);
    return { memberId: m.familyMemberId, displayName: m.displayName, relationshipToOwner: fm?.relationshipToOwner ?? "other" };
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
          {bondParticipants.length > 1 && (
            <button type="button" onClick={() => setSynastrySubTab((v) => !v)} style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "1px solid var(--color-border-strong)", borderRadius: "9px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
              ◇ {lang === "ta" ? "பொருத்தம்" : "Compatibility"}
            </button>
          )}
          <button type="button" onClick={onOpenSetup} style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "9px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            + {lang === "ta" ? "உறுப்பினரைச் சேர்" : "Add member"}
          </button>
        </div>
      </div>

      {/* ===== Relation filter chips ===== */}
      {members.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
                marginLeft: "auto", fontSize: "12px",
                color: relationFilter === "needsCare" ? "var(--color-on-accent)" : "var(--color-low)",
                background: relationFilter === "needsCare" ? "var(--color-low)" : "transparent",
                border: `1px solid ${relationFilter === "needsCare" ? "var(--color-low)" : "var(--color-border)"}`,
                borderRadius: "999px", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
              }}>
              {lang === "ta" ? `கவனம் தேவை ${bucketCounts.needsCare}` : `Needs care ${bucketCounts.needsCare}`} <span style={{ color: "var(--color-low)" }}>●</span>
            </button>
          )}
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

      {/* ===== Members grid ===== */}
      {members.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "4px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
              {lang === "ta" ? "உறுப்பினர்கள்" : "Members"}
            </div>
            <div style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>
              {lang === "ta" ? "முழு விவரத்தைத் திறக்க ஒரு கார்டைத் தட்டவும்" : "tap any card to open the full profile"}
            </div>
          </div>
          <div className="nova-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {filteredMeta.map(({ member, familyMember, chart, todayItem, careFlag }) => (
              <NovaFamilyMemberCard
                key={member.familyMemberId}
                lang={lang}
                member={member}
                todayItem={todayItem}
                memberChart={chart}
                relationLabel={formatRelLabel(familyMember?.relationshipToOwner)}
                isSelf={false}
                needsCare={careFlag}
                onOpen={() => setSelectedMemberId(member.familyMemberId)}
              />
            ))}
          </div>
        </>
      )}

      {/* ===== Inline expanded detail — a quick glance; "View full profile" opens the
          dedicated family-member screen (Phase 5). Both patterns are kept deliberately
          (user decision, see Progress Log) rather than replacing one with the other. ===== */}
      {activeMember && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
          />
        </div>
      )}

      {/* ===== Compatibility (existing Synastry Matrix/Panel, re-skinned for free — already var(--color-*)-driven) ===== */}
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

      {/* ===== Bonds + shared events ===== */}
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
  );
}
