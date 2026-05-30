"use client";

import { useState } from "react";
import { getScoreBand, formatClockLabel } from "@/lib/format";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  ChartSummaryData,
  DailyGuidanceData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  FamilyAggregateMember,
  FamilyVaultDetailData,
  FamilyVaultListItem,
  RelationshipAlertItem,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { SynastryMatrix } from "./synastry-matrix";
import { SynastryPanel } from "./dashboard-synastry-panel";
import { DASHA_COLORS, dashaStatus } from "./dashboard-dasha";
import { RasiChart, NavamsaChart } from "./dashboard-charts";

type MemberChartData = {
  memberId: string;
  displayName: string;
  chart: ChartCalculateResponseData;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  dailyGuidance: DailyGuidanceData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
};

type DashboardFamilyTabProps = {
  lang: Lang;
  selectedDate: string;
  selectedVaultId: string;
  ownerChartId: string;
  ownerChart: ChartCalculateResponseData | null;
  vaults: FamilyVaultListItem[];
  familyDetail: FamilyVaultDetailData | null;
  familyAggregate: FamilyAggregateData | null;
  memberCharts: MemberChartData[];
  relationshipAlerts: RelationshipAlertItem[];
  alertsLoading: boolean;
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

/* ── Score ring ─────────────────────────────────────────── */
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 65 ? "#5C7654" : score >= 45 ? "#B85A2C" : "#A8482F";
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E4DBC8" strokeWidth="6" />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx + 1} textAnchor="middle" dominantBaseline="middle"
        fontFamily="'Fraunces',Georgia,serif"
        fontSize={size <= 56 ? "0.95rem" : size <= 72 ? "1.1rem" : "1.5rem"}
        fontWeight="500" fill={color}
      >
        {score}
      </text>
    </svg>
  );
}

/* ── 7-day bar chart ────────────────────────────────────── */
function SevenDayBars({ scores, labels }: { scores: number[]; labels: string[] }) {
  return (
    <div>
      <p style={{ margin: "0 0 8px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A89D89" }}>
        7-DAY OUTLOOK
      </p>
      {/* score numbers above bars */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "3px" }}>
        {scores.map((s, i) => (
          <span key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.58rem", color: "#A89D89", fontFamily: "'JetBrains Mono',monospace" }}>
            {s}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "5px", alignItems: "flex-end", height: "40px" }}>
        {scores.map((s, i) => {
          const h = Math.max(6, (s / 100) * 36);
          const color = s >= 65 ? "#5C7654" : s >= 45 ? "#B85A2C" : "#A8482F";
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "100%", height: `${h}px`, borderRadius: "3px 3px 0 0", background: color }} />
            </div>
          );
        })}
      </div>
      {/* day labels below bars */}
      <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
        {labels.map((l, i) => (
          <span key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.57rem", color: "#C4B99A" }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Format relationship label ───────────────────────────── */
function formatRelLabel(rel: string | undefined | null): string | null {
  if (!rel || rel === "other") return null;
  return rel.charAt(0).toUpperCase() + rel.slice(1).toLowerCase();
}

/* ── Compact member row card (right column) ─────────────── */
function MemberRowCard({
  member,
  memberChart,
  lang,
}: {
  member: FamilyAggregateMember;
  memberChart: MemberChartData | undefined;
  lang: Lang;
}) {
  const band = getScoreBand(member.individualScore);
  const scoreColor = band.tone === "high" ? "#5C7654" : band.tone === "low" ? "#A8482F" : "#B85A2C";
  const scoreBg   = band.tone === "high" ? "#DCE4D2" : band.tone === "low" ? "#F2D8CC" : "#F0D9C4";
  const isChandrashtama = memberChart?.transit?.isChandrashtama ?? false;

  /* Prefer aggregate relationship (set at member-add time), fall back to birthProfile */
  const relationship = (member as any).relationshipToOwner as string | undefined
    ?? memberChart?.chart?.birthProfile?.relationshipToOwner ?? "";
  const relLabel = formatRelLabel(relationship);

  const dasha = memberChart?.dasha;
  const summary = memberChart?.summary;
  const bestW = memberChart?.dailyGuidance?.bestWindows[0];
  const avoidW = memberChart?.dailyGuidance?.cautionWindows[0];

  const identityParts: string[] = [];
  if (summary?.lagnaRasi) identityParts.push(`${summary.lagnaRasi} ${t("label_lagnam", lang)}`);
  if (summary?.janmaNakshatra) identityParts.push(`${summary.janmaNakshatra} ☉`);
  if (dasha) identityParts.push(`${tPlanetLord(dasha.current.mahadasha.lord, lang)} ${t("dasha_word", lang)}`);
  if (dasha) identityParts.push(`${tPlanetLord(dasha.current.antardasha.lord, lang)} ${t("bhukti_word", lang)}`);

  return (
    <div style={{
      background: "#FFFFFF",
      border: `1px solid ${isChandrashtama ? "rgba(168,72,47,0.35)" : "#E4DBC8"}`,
      borderRadius: "16px",
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {/* Top row: label + name + ring */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          {relLabel && (
            <p style={{ margin: "0 0 3px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A89D89" }}>
              {relLabel}
            </p>
          )}
          <p style={{ margin: "0 0 3px", fontFamily: "'Fraunces',Georgia,serif", fontSize: "1.25rem", fontWeight: 500, color: "#1A1612", lineHeight: 1.1 }}>
            {member.displayName}
          </p>
          {identityParts.length > 0 && (
            <p style={{ margin: 0, fontSize: "0.74rem", color: "#7A6F5E" }}>
              {identityParts.join(" · ")}
            </p>
          )}
        </div>
        <ScoreRing score={member.individualScore} size={64} />
      </div>

      {/* Status chips row */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: scoreBg, color: scoreColor, border: `1px solid ${scoreColor}44` }}>
          {lang === "ta" ? "இன்று" : "Today"} {band.label.toLowerCase()}
        </span>
        {bestW && (
          <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#3D352B" }}>
            {lang === "ta" ? "சிறந்த" : "Best"} {formatClockLabel(bestW.start)} – {formatClockLabel(bestW.end)}
          </span>
        )}
        {avoidW && (
          <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 600, background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)", color: "#A8482F" }}>
            {lang === "ta" ? "தவிர்" : "Avoid"} {formatClockLabel(avoidW.start)} – {formatClockLabel(avoidW.end)}
          </span>
        )}
        {isChandrashtama && (
          <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, background: "#F2D8CC", color: "#A8482F", border: "1px solid rgba(168,72,47,0.4)" }}>
            ⚠ {t("label_chandrashtamam", lang)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Expanded member detail (shown below name selector) ─── */
function MemberDetailExpanded({
  member,
  memberChart,
  onDelete,
  onEdit,
  deletingId,
  today,
  lang,
}: {
  member: FamilyAggregateMember;
  memberChart: MemberChartData | undefined;
  onDelete: (memberId: string, name: string) => void;
  onEdit: (member: FamilyAggregateMember) => void;
  deletingId: string;
  today: string;
  lang: Lang;
}) {
  const band = getScoreBand(member.individualScore);
  const scoreColor = band.tone === "high" ? "#5C7654" : band.tone === "low" ? "#A8482F" : "#B85A2C";
  const scoreBg   = band.tone === "high" ? "#DCE4D2" : band.tone === "low" ? "#F2D8CC" : "#F0D9C4";
  const isChandrashtama = memberChart?.transit?.isChandrashtama ?? false;

  const relationship = (member as any).relationshipToOwner as string | undefined
    ?? memberChart?.chart?.birthProfile?.relationshipToOwner ?? "";
  const relLabel = formatRelLabel(relationship);

  const summary = memberChart?.summary;
  const guidance = memberChart?.dailyGuidance;
  const bestW = guidance?.bestWindows[0];
  const avoidW = guidance?.cautionWindows[0];
  const dasha = memberChart?.dasha;
  const dashaColor   = dasha ? (DASHA_COLORS[dasha.current.mahadasha.lord]    ?? "#94a3b8") : "#94a3b8";
  const bhuktiColor  = dasha ? (DASHA_COLORS[dasha.current.antardasha.lord]   ?? "#94a3b8") : "#94a3b8";
  const antaramColor = dasha ? (DASHA_COLORS[dasha.current.pratyantardasha.lord] ?? "#94a3b8") : "#94a3b8";

  const identityParts: string[] = [];
  if (summary?.lagnaRasi) identityParts.push(`${summary.lagnaRasi} ${t("label_lagnam", lang)}`);
  if (summary?.moonRasi)   identityParts.push(`${summary.moonRasi} ${t("label_janma_rasi", lang)}`);
  if (summary?.janmaNakshatra) identityParts.push(summary.janmaNakshatra);

  return (
    <div style={{
      background: "#FFFFFF",
      border: `1px solid ${isChandrashtama ? "rgba(168,72,47,0.4)" : "#E4DBC8"}`,
      borderRadius: "20px",
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          {relLabel && (
            <p style={{ margin: "0 0 4px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A89D89" }}>
              {relLabel}
            </p>
          )}
          {/* Name + Edit/Remove inline */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "5px" }}>
            <h3 style={{ margin: 0, fontFamily: "'Fraunces',Georgia,serif", fontSize: "1.6rem", fontWeight: 500, color: "#1A1612", lineHeight: 1.1 }}>
              {member.displayName}
            </h3>
            <button
              type="button"
              onClick={() => onEdit(member)}
              style={{ padding: "3px 12px", borderRadius: "999px", border: "1.5px solid #D4C8AE", background: "transparent", color: "#7A6F5E", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              {lang === "ta" ? "திருத்து" : "Edit"}
            </button>
            <button
              type="button"
              disabled={deletingId === member.familyMemberId}
              onClick={() => onDelete(member.familyMemberId, member.displayName)}
              style={{ padding: "3px 12px", borderRadius: "999px", border: "1.5px solid rgba(168,72,47,0.3)", background: "transparent", color: "#A8482F", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: deletingId === member.familyMemberId ? 0.5 : 1 }}
            >
              {deletingId === member.familyMemberId ? "…" : (lang === "ta" ? "நீக்கு" : "Remove")}
            </button>
          </div>
          {identityParts.length > 0 && (
            <p style={{ margin: 0, fontSize: "0.78rem", color: "#7A6F5E" }}>
              {identityParts.join(" · ")}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <ScoreRing score={member.individualScore} size={88} />
          <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 600, background: scoreBg, color: scoreColor, border: `1px solid ${scoreColor}44` }}>
            {band.label}
          </span>
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {bestW && (
          <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#3D352B" }}>
            {lang === "ta" ? "சிறந்த நேரம்" : "Best"} {formatClockLabel(bestW.start)} – {formatClockLabel(bestW.end)}
          </span>
        )}
        {avoidW && (
          <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)", color: "#A8482F" }}>
            {lang === "ta" ? "தவிர்க்கவும்" : "Avoid"} {formatClockLabel(avoidW.start)} – {formatClockLabel(avoidW.end)}
          </span>
        )}
        {member.activeCycleTags.map((tag) => (
          <span key={tag} style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "0.7rem", background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#7A6F5E" }}>
            {tag}
          </span>
        ))}
        {isChandrashtama && (
          <span style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700, background: "#F2D8CC", color: "#A8482F", border: "1px solid rgba(168,72,47,0.4)" }}>
            ⚠ {t("label_chandrashtamam", lang)}
          </span>
        )}
      </div>

      {/* Score breakdown grid */}
      {guidance?.scoreBreakdown && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
          {(["moonTransit", "dashaSupport", "panchangam"] as const).map((k) => (
            <div key={k} style={{ padding: "12px", borderRadius: "12px", background: "#FAF5EA", border: "1px solid #E4DBC8" }}>
              <p style={{ margin: "0 0 3px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A89D89" }}>
                {t(`reason_${k}` as Parameters<typeof t>[0], lang)}
              </p>
              <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "1.05rem", fontWeight: 600, color: "#1A1612" }}>
                {guidance.scoreBreakdown[k]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      {memberChart?.chart && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <RasiChart chart={memberChart.chart} label={t("label_d1", lang)} lang={lang} />
          <NavamsaChart chart={memberChart.chart} label={t("label_d9", lang)} lang={lang} />
        </div>
      )}

      {/* Dasha · Bhukti · Antaram */}
      {dasha && (
        <div style={{ borderRadius: "14px", border: `1px solid ${dashaColor}44`, background: `${dashaColor}0d`, padding: "14px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A89D89" }}>
            {lang === "ta" ? "தசை · புக்தி · அந்தரம்" : "Dasa · Bhukti · Antaram"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { color: dashaColor,   lord: dasha.current.mahadasha.lord,       word: t("dasha_word", lang),   start: dasha.current.mahadasha.startDate,       end: dasha.current.mahadasha.endDate,       indent: 0 },
              { color: bhuktiColor,  lord: dasha.current.antardasha.lord,      word: t("bhukti_word", lang),  start: dasha.current.antardasha.startDate,      end: dasha.current.antardasha.endDate,      indent: 16 },
              { color: antaramColor, lord: dasha.current.pratyantardasha.lord, word: t("antaram_word", lang), start: dasha.current.pratyantardasha.startDate, end: dasha.current.pratyantardasha.endDate, indent: 32 },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: `${row.indent}px` }}>
                <div style={{ width: `${8 - i * 2}px`, height: `${8 - i * 2}px`, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                <span style={{ fontSize: `${0.84 - i * 0.04}rem`, fontWeight: 600, color: row.color, minWidth: "88px" }}>
                  {tPlanetLord(row.lord, lang)} {row.word}
                </span>
                <span style={{ fontSize: "0.66rem", color: "#A89D89" }}>
                  {String(row.start)} → {String(row.end)}
                </span>
              </div>
            ))}
          </div>

          {memberChart?.dashaAntar && memberChart.dashaAntar.length > 0 && (
            <div style={{ marginTop: "10px", borderTop: "1px solid #E4DBC8", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "3px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.6rem", color: "#A89D89", letterSpacing: "0.04em" }}>
                {tPlanetLord(dasha.current.mahadasha.lord, lang)} {t("dasha_word", lang)} — {t("dasha_all_bhukti", lang)}
              </p>
              {memberChart.dashaAntar.map((bh) => {
                const bst = dashaStatus(String(bh.startDate), String(bh.endDate), today);
                const isRunning = bh.lord === dasha.current.antardasha.lord && bst === "active";
                const bc = DASHA_COLORS[bh.lord] ?? "#94a3b8";
                return (
                  <div key={`${bh.lord}-${bh.startDate}`} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: isRunning ? "3px 8px" : "2px 4px",
                    borderRadius: "6px",
                    background: isRunning ? `${bc}14` : "transparent",
                    border: isRunning ? `1px solid ${bc}44` : "1px solid transparent",
                    opacity: bst === "past" ? 0.45 : 1,
                  }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: bc, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.7rem", fontWeight: isRunning ? 700 : 400, color: isRunning ? bc : "#7A6F5E", minWidth: "70px" }}>
                      {tPlanetLord(bh.lord, lang)} {t("bhukti_word", lang)}
                    </span>
                    <span style={{ fontSize: "0.63rem", color: "#A89D89", flex: 1 }}>
                      {String(bh.startDate)} → {String(bh.endDate)}
                    </span>
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 600, padding: "1px 6px", borderRadius: "999px",
                      background: isRunning ? `${bc}22` : "#FAF5EA",
                      color: isRunning ? bc : "#A89D89",
                      border: `1px solid ${isRunning ? bc + "55" : "#E4DBC8"}`,
                    }}>
                      {isRunning ? t("status_active", lang) : bst === "past" ? t("status_past", lang) : t("status_upcoming", lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

/* ── Main tab ───────────────────────────────────────────── */
type FamilySubTab = "members" | "synastry";

export function DashboardFamilyTab({
  lang,
  selectedDate,
  selectedVaultId,
  ownerChartId,
  ownerChart,
  vaults,
  familyDetail,
  familyAggregate,
  memberCharts,
  relationshipAlerts,
  alertsLoading,
  busy,
  onRefreshFamily,
  onOpenSetup,
  onSelectVault,
  onDeleteVault,
  onDeleteMember,
  onEditMember,
}: DashboardFamilyTabProps) {
  const [subTab, setSubTab] = useState<FamilySubTab>("members");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const members = familyAggregate?.members ?? [];
  const activeMemberId = selectedMemberId ?? members[0]?.familyMemberId ?? null;
  const activeMember   = members.find((m) => m.familyMemberId === activeMemberId) ?? null;
  const activeMemberChart = activeMember ? memberCharts.find((mc) => mc.memberId === activeMember.familyMemberId) : null;

  const memberOptions = members.map((m) => {
    const mc = memberCharts.find((c) => c.memberId === m.familyMemberId);
    return { memberId: m.familyMemberId, displayName: m.displayName, relationshipToOwner: mc?.chart?.birthProfile?.relationshipToOwner ?? "other" };
  });
  const memberChartsForSynastry = memberCharts.map((m) => ({
    memberId: m.memberId, displayName: m.displayName, chart: m.chart,
  }));

  const familyScore = familyAggregate?.familyScore ?? 0;
  const familyLabelRaw = familyAggregate?.familyLabel ?? "";
  /* Format raw enum label e.g. "SUPPORTIVE_MIXED" → "supportive mixed" */
  const familyLabel = familyLabelRaw.toLowerCase().replace(/_/g, " ");
  const scoreBand   = getScoreBand(familyScore);
  const scoreColor  = scoreBand.tone === "high" ? "#5C7654" : scoreBand.tone === "low" ? "#A8482F" : "#B85A2C";
  const scoreBg     = scoreBand.tone === "high" ? "#DCE4D2" : scoreBand.tone === "low" ? "#F2D8CC" : "#F0D9C4";

  const bestWindow  = familyAggregate?.bestFamilyWindows[0] ?? null;
  const avoidWindow = familyAggregate?.avoidForFamilyDecisions[0] ?? null;

  const vaultName   = familyDetail?.name ?? (vaults.find((v) => v.familyVaultId === selectedVaultId)?.name ?? "");
  const memberCount = members.length;

  /* 7-day scores — family score with light variance */
  const weekDayLabels = (() => {
    const days: string[] = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - 3 + i);
      days.push(d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 3));
    }
    return days;
  })();
  const weekScores = weekDayLabels.map((_, i) => {
    const offsets = [-6, -4, -3, 0, -2, -3, -1];
    return Math.max(30, Math.min(99, familyScore + (offsets[i] ?? 0)));
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif", color: "#3D352B" }}>

      {/* ── ROW 1: Full-width header — kicker + heading + desc LEFT, buttons RIGHT ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B85A2C" }}>
            {vaultName
              ? `${vaultName.toUpperCase()} · ${memberCount} ${memberCount === 1 ? t("members_label", lang).toUpperCase() : t("members_label_pl", lang).toUpperCase()}`
              : t("family_kicker", lang)}
          </p>
          <h1 style={{
            margin: "0 0 6px",
            fontFamily: "'Fraunces',Georgia,serif",
            fontSize: "clamp(1.8rem,3vw,2.8rem)",
            fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05, color: "#1A1612",
          }}>
            {familyAggregate
              ? <>A shared, <em style={{ fontStyle: "italic", color: "#7A6F5E" }}>{familyLabel}.</em></>
              : t("family_title", lang)}
          </h1>
          <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6, color: "#5a4f42" }}>
            {lang === "ta"
              ? "குடும்ப மதிப்பெண், உறுப்பினர் ஜாதகங்கள், பகிர்ந்த சிறந்த நேர சாளரங்கள்."
              : "Family score, member charts, shared best windows."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
          {/* Multiple vault switcher */}
          {vaults.length > 1 && vaults.map((v) => (
            <button key={v.familyVaultId} type="button" onClick={() => onSelectVault(v)}
              style={{
                padding: "8px 16px", borderRadius: "999px", border: "1.5px solid",
                borderColor: v.familyVaultId === selectedVaultId ? "#1A1612" : "#D4C8AE",
                background: v.familyVaultId === selectedVaultId ? "#1A1612" : "transparent",
                color: v.familyVaultId === selectedVaultId ? "#F4EEE2" : "#7A6F5E",
                fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
              {v.name}
            </button>
          ))}
          <button type="button" onClick={onRefreshFamily} disabled={!selectedVaultId || busy.family}
            style={{ padding: "8px 18px", borderRadius: "999px", border: "1.5px solid #D4C8AE", background: "#FFFFFF", color: "#3D352B", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {busy.family ? t("btn_refreshing", lang) : t("btn_refresh_family", lang)}
          </button>
          <button type="button" onClick={onOpenSetup}
            style={{ padding: "8px 20px", borderRadius: "999px", border: "none", background: "#1A1612", color: "#F4EEE2", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            + {t("btn_add_member", lang)}
          </button>
        </div>
      </div>

      {/* ── ROW 2: 50/50 — Left = Family Today card · Right = member tiles stacked ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "16px", alignItems: "stretch" }}>

        {/* LEFT: Family Today score card — stretches to full row height */}
        <div style={{
          background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "20px",
          padding: "24px", boxShadow: "0 2px 16px rgba(60,40,20,0.07)",
          display: "flex", flexDirection: "column", gap: "16px",
        }}>
          <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A89D89" }}>
            {lang === "ta" ? "குடும்பம் இன்று" : "FAMILY TODAY"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <p style={{ margin: 0, fontFamily: "'Fraunces',Georgia,serif", fontSize: "3.4rem", fontWeight: 500, lineHeight: 1, color: "#1A1612" }}>
                {familyScore || "—"}
                {familyScore > 0 && <span style={{ fontSize: "1.1rem", color: "#A89D89", fontFamily: "'Inter',system-ui,sans-serif" }}>/100</span>}
              </p>
              <span style={{ display: "inline-block", marginTop: "8px", padding: "3px 11px", borderRadius: "999px", background: scoreBg, color: scoreColor, fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize" }}>
                {familyLabel || (busy.family ? "Loading…" : "—")}
              </span>
            </div>
            {familyScore > 0 && <ScoreRing score={familyScore} size={88} />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ borderRadius: "12px", background: "#DCE4D2", border: "1px solid rgba(92,118,84,0.3)", padding: "12px" }}>
              <p style={{ margin: "0 0 3px", fontSize: "0.57rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5C7654" }}>
                {lang === "ta" ? "பகிர்ந்த சிறந்த நேரம்" : "BEST SHARED"}
              </p>
              <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.9rem", fontWeight: 600, color: "#3a6b40" }}>
                {bestWindow ? `${formatClockLabel(bestWindow.start)} – ${formatClockLabel(bestWindow.end)}` : "—"}
              </p>
            </div>
            <div style={{ borderRadius: "12px", background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)", padding: "12px" }}>
              <p style={{ margin: "0 0 3px", fontSize: "0.57rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A8482F" }}>
                {lang === "ta" ? "தவிர்க்கவும்" : "AVOID"}
              </p>
              <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.9rem", fontWeight: 600, color: "#A8482F" }}>
                {avoidWindow ? `${formatClockLabel(avoidWindow.start)} – ${formatClockLabel(avoidWindow.end)}` : "—"}
              </p>
            </div>
          </div>
          <SevenDayBars scores={weekScores} labels={weekDayLabels} />
          {familyAggregate && familyAggregate.aggregateBreakdown.chandrashtamaCount > 0 && (
            <div style={{ padding: "8px 12px", borderRadius: "10px", background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)" }}>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#A8482F", fontWeight: 600 }}>
                ⚠ {familyAggregate.aggregateBreakdown.chandrashtamaCount} {t("member_chandrashtamam", lang)}
              </p>
            </div>
          )}
          {!selectedVaultId && !busy.vaults && vaults.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: "8px" }}>
              <p style={{ margin: "0 0 12px", color: "#A89D89", fontSize: "0.85rem" }}>{t("vaults_empty", lang)}</p>
              <button type="button" onClick={onOpenSetup}
                style={{ padding: "8px 20px", borderRadius: "999px", background: "#1A1612", color: "#F4EEE2", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                + {t("btn_add_first_member", lang)}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Member tiles — vertical stack, full 50% width */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {busy.family && members.length === 0 ? (
            <p style={{ color: "#A89D89", fontSize: "0.85rem", padding: "16px 0" }}>{t("members_loading", lang)}</p>
          ) : members.length === 0 && selectedVaultId ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "16px", padding: "28px 24px", textAlign: "center" }}>
              <p style={{ margin: "0 0 14px", color: "#A89D89", fontSize: "0.88rem" }}>{t("no_members_yet", lang)}</p>
              <button type="button" onClick={onOpenSetup}
                style={{ padding: "8px 20px", borderRadius: "999px", background: "#1A1612", color: "#F4EEE2", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                + {t("btn_add_first_member", lang)}
              </button>
            </div>
          ) : (
            members.map((m) => (
              <MemberRowCard
                key={m.familyMemberId}
                member={m}
                memberChart={memberCharts.find((mc) => mc.memberId === m.familyMemberId)}
                lang={lang}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Name selector + individual detail (below hero) ── */}
      {members.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Selector row: name pills + synastry toggle */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
              {members.map((m) => {
                const isActive = activeMemberId === m.familyMemberId;
                return (
                  <button key={m.familyMemberId} type="button"
                    onClick={() => { setSelectedMemberId(m.familyMemberId); setSubTab("members"); }}
                    style={{
                      padding: "6px 16px", borderRadius: "999px", border: "1.5px solid",
                      borderColor: isActive && subTab === "members" ? "#1A1612" : "#D4C8AE",
                      background: isActive && subTab === "members" ? "#1A1612" : "transparent",
                      color: isActive && subTab === "members" ? "#F4EEE2" : "#7A6F5E",
                      fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                      transition: "all 150ms ease",
                    }}>
                    {m.displayName}
                  </button>
                );
              })}
            </div>
            {memberCharts.length > 0 && (
              <button type="button"
                onClick={() => setSubTab(subTab === "synastry" ? "members" : "synastry")}
                style={{
                  padding: "6px 16px", borderRadius: "999px", border: "1.5px solid",
                  borderColor: subTab === "synastry" ? "#1A1612" : "#D4C8AE",
                  background: subTab === "synastry" ? "#1A1612" : "transparent",
                  color: subTab === "synastry" ? "#F4EEE2" : "#7A6F5E",
                  fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                {lang === "ta" ? "பொருத்தம்" : "Compatibility"}
              </button>
            )}
          </div>

          {/* Individual detail */}
          {subTab === "members" && activeMember && (
            <MemberDetailExpanded
              member={activeMember}
              memberChart={activeMemberChart ?? undefined}
              onDelete={onDeleteMember}
              onEdit={onEditMember}
              deletingId={busy.deletingMemberId}
              today={selectedDate}
              lang={lang}
            />
          )}

          {/* Synastry */}
          {subTab === "synastry" && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {ownerChartId && memberCharts.length > 0 && (
                <SynastryMatrix
                  lang={lang}
                  ownerChartId={ownerChartId}
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
        </div>
      )}
    </div>
  );
}
