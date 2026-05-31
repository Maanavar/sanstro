"use client";

import { useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api";
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
  FamilyVaultTodayData,
  FamilySummaryData,
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

const SCORE_HIGH = "var(--color-score-high, #5C7654)";
const SCORE_MID = "var(--color-score-mid, #B85A2C)";
const SCORE_LOW = "var(--color-score-low, #A8482F)";

function scoreColor(score: number): string {
  if (score >= 65) return SCORE_HIGH;
  if (score >= 45) return SCORE_MID;
  return SCORE_LOW;
}

function AlertGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L21 20H3L12 3Z" stroke={SCORE_MID} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9V13.8" stroke={SCORE_MID} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="1.2" fill={SCORE_MID} />
    </svg>
  );
}

/* ── Score ring ─────────────────────────────────────────── */
function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = scoreColor(score);
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx + 1} textAnchor="middle" dominantBaseline="middle"
        fontFamily="var(--font-display)"
        fontSize={size <= 56 ? "1rem" : size <= 72 ? "1.125rem" : "1.5rem"}
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
      <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
        7-DAY OUTLOOK
      </p>
      {/* score numbers above bars */}
      <div style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-0_75)" }}>
        {scores.map((s, i) => (
          <span key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.625rem", color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>
            {s}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "flex-end", height: "40px" }}>
        {scores.map((s, i) => {
          const h = Math.max(6, (s / 100) * 36);
          const color = scoreColor(s);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "100%", height: `${h}px`, borderRadius: "3px 3px 0 0", background: color }} />
            </div>
          );
        })}
      </div>
      {/* day labels below bars */}
      <div style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-1)" }}>
        {labels.map((l, i) => (
          <span key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.625rem", color: "var(--color-faint)" }}>{l}</span>
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
  const toneColor = scoreColor(member.individualScore);
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
      background: "var(--color-surface)",
      border: `1px solid ${isChandrashtama ? "rgba(168,72,47,0.35)" : "var(--color-border)"}`,
      borderRadius: "var(--radius-md)",
      padding: "var(--space-5) var(--space-6)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2_5)",
    }}>
      {/* Top row: label + name + ring */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div style={{ flex: 1 }}>
          {relLabel && (
            <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {relLabel}
            </p>
          )}
          <p style={{ margin: "0 0 var(--space-0_75)", fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 500, color: "var(--color-text-strong)", lineHeight: 1.1 }}>
            {member.displayName}
          </p>
          {identityParts.length > 0 && (
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-muted)" }}>
              {identityParts.join(" · ")}
            </p>
          )}
        </div>
        <ScoreRing score={member.individualScore} size={64} />
      </div>

      {/* Status chips row */}
      <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
        <span style={{ padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: scoreBg, color: toneColor, border: `1px solid ${toneColor}44` }}>
          {lang === "ta" ? "இன்று" : "Today"} {band.label.toLowerCase()}
        </span>
        {bestW && (
          <span style={{ padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: "#FAF5EA", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            {lang === "ta" ? "சிறந்த" : "Best"} {formatClockLabel(bestW.start)} – {formatClockLabel(bestW.end)}
          </span>
        )}
        {avoidW && (
          <span style={{ padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)", color: SCORE_LOW }}>
            {lang === "ta" ? "தவிர்" : "Avoid"} {formatClockLabel(avoidW.start)} – {formatClockLabel(avoidW.end)}
          </span>
        )}
        {isChandrashtama && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 700, background: "#F2D8CC", color: SCORE_LOW, border: "1px solid rgba(168,72,47,0.4)" }}>
            <AlertGlyph /> {t("label_chandrashtamam", lang)}
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
  const toneColor = scoreColor(member.individualScore);
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
  const dashaColor   = dasha ? (DASHA_COLORS[dasha.current.mahadasha.lord]    ?? "var(--color-faint, #7A6F5E)") : "var(--color-faint)";
  const bhuktiColor  = dasha ? (DASHA_COLORS[dasha.current.antardasha.lord]   ?? "var(--color-faint, #7A6F5E)") : "var(--color-faint)";
  const antaramColor = dasha ? (DASHA_COLORS[dasha.current.pratyantardasha.lord] ?? "var(--color-faint, #7A6F5E)") : "var(--color-faint)";

  const identityParts: string[] = [];
  if (summary?.lagnaRasi) identityParts.push(`${summary.lagnaRasi} ${t("label_lagnam", lang)}`);
  if (summary?.moonRasi)   identityParts.push(`${summary.moonRasi} ${t("label_janma_rasi", lang)}`);
  if (summary?.janmaNakshatra) identityParts.push(summary.janmaNakshatra);

  return (
    <div style={{
      background: "var(--color-surface)",
      border: `1px solid ${isChandrashtama ? "rgba(168,72,47,0.4)" : "var(--color-border)"}`,
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-7)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-5)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div style={{ flex: 1 }}>
          {relLabel && (
            <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {relLabel}
            </p>
          )}
          {/* Name + Edit/Remove inline */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)", flexWrap: "wrap", marginBottom: "var(--space-1)" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500, color: "var(--color-text-strong)", lineHeight: 1.1 }}>
              {member.displayName}
            </h3>
            <button
              type="button"
              onClick={() => onEdit(member)}
              style={{ padding: "var(--space-0_75) var(--space-3)", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--color-border-strong)", background: "transparent", color: "var(--color-muted)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              {lang === "ta" ? "திருத்து" : "Edit"}
            </button>
            <button
              type="button"
              disabled={deletingId === member.familyMemberId}
              onClick={() => onDelete(member.familyMemberId, member.displayName)}
              style={{ padding: "var(--space-0_75) var(--space-3)", borderRadius: "var(--radius-pill)", border: "1.5px solid rgba(168,72,47,0.3)", background: "transparent", color: SCORE_LOW, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: deletingId === member.familyMemberId ? 0.5 : 1 }}
            >
              {deletingId === member.familyMemberId ? "…" : (lang === "ta" ? "நீக்கு" : "Remove")}
            </button>
          </div>
          {identityParts.length > 0 && (
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>
              {identityParts.join(" · ")}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)", flexShrink: 0 }}>
          <ScoreRing score={member.individualScore} size={88} />
          <span style={{ padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: scoreBg, color: toneColor, border: `1px solid ${toneColor}44` }}>
            {band.label}
          </span>
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {bestW && (
          <span style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: "#FAF5EA", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            {lang === "ta" ? "சிறந்த நேரம்" : "Best"} {formatClockLabel(bestW.start)} – {formatClockLabel(bestW.end)}
          </span>
        )}
        {avoidW && (
          <span style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)", color: SCORE_LOW }}>
            {lang === "ta" ? "தவிர்க்கவும்" : "Avoid"} {formatClockLabel(avoidW.start)} – {formatClockLabel(avoidW.end)}
          </span>
        )}
        {member.activeCycleTags.map((tag) => (
          <span key={tag} style={{ padding: "var(--space-1) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", background: "#FAF5EA", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
            {tag}
          </span>
        ))}
        {isChandrashtama && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 700, background: "#F2D8CC", color: SCORE_LOW, border: "1px solid rgba(168,72,47,0.4)" }}>
            <AlertGlyph /> {t("label_chandrashtamam", lang)}
          </span>
        )}
      </div>

      {/* Score breakdown grid */}
      {guidance?.scoreBreakdown && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--space-2_5)" }}>
          {(["moonTransit", "dashaSupport", "panchangam"] as const).map((k) => (
            <div key={k} style={{ padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "#FAF5EA", border: "1px solid var(--color-border)" }}>
              <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                {t(`reason_${k}` as Parameters<typeof t>[0], lang)}
              </p>
              <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 600, color: "var(--color-text-strong)" }}>
                {guidance.scoreBreakdown[k]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      {memberChart?.chart && (
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
          <RasiChart chart={memberChart.chart} label={t("label_d1", lang)} lang={lang} />
          <NavamsaChart chart={memberChart.chart} label={t("label_d9", lang)} lang={lang} />
        </div>
      )}

      {/* Dasha · Bhukti · Antaram */}
      {dasha && (
        <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${dashaColor}44`, background: `${dashaColor}0d`, padding: "var(--space-3_5) var(--space-4)" }}>
          <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
            {lang === "ta" ? "தசை · புக்தி · அந்தரம்" : "Dasa · Bhukti · Antaram"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
            {[
              { color: dashaColor,   lord: dasha.current.mahadasha.lord,       word: t("dasha_word", lang),   start: dasha.current.mahadasha.startDate,       end: dasha.current.mahadasha.endDate,       indent: 0 },
              { color: bhuktiColor,  lord: dasha.current.antardasha.lord,      word: t("bhukti_word", lang),  start: dasha.current.antardasha.startDate,      end: dasha.current.antardasha.endDate,      indent: 16 },
              { color: antaramColor, lord: dasha.current.pratyantardasha.lord, word: t("antaram_word", lang), start: dasha.current.pratyantardasha.startDate, end: dasha.current.pratyantardasha.endDate, indent: 32 },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginLeft: `${row.indent}px` }}>
                <div style={{ width: `${8 - i * 2}px`, height: `${8 - i * 2}px`, borderRadius: "50%", background: row.color, flexShrink: 0 }} />
                <span style={{ fontSize: `${0.84 - i * 0.04}rem`, fontWeight: 600, color: row.color, minWidth: "88px" }}>
                  {tPlanetLord(row.lord, lang)} {row.word}
                </span>
                <span style={{ fontSize: "0.625rem", color: "var(--color-faint)" }}>
                  {String(row.start)} → {String(row.end)}
                </span>
              </div>
            ))}
          </div>

          {memberChart?.dashaAntar && memberChart.dashaAntar.length > 0 && (
            <div style={{ marginTop: "var(--space-2_5)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-2_5)", display: "flex", flexDirection: "column", gap: "var(--space-0_75)" }}>
              <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.625rem", color: "var(--color-faint)", letterSpacing: "0.04em" }}>
                {tPlanetLord(dasha.current.mahadasha.lord, lang)} {t("dasha_word", lang)} — {t("dasha_all_bhukti", lang)}
              </p>
              {memberChart.dashaAntar.map((bh) => {
                const bst = dashaStatus(String(bh.startDate), String(bh.endDate), today);
                const isRunning = bh.lord === dasha.current.antardasha.lord && bst === "active";
                const bc = DASHA_COLORS[bh.lord] ?? "var(--color-faint, #7A6F5E)";
                return (
                  <div key={`${bh.lord}-${bh.startDate}`} style={{
                    display: "flex", alignItems: "center", gap: "var(--space-1_5)",
                    padding: isRunning ? "3px 8px" : "2px 4px",
                    borderRadius: "var(--radius-xs)",
                    background: isRunning ? `${bc}14` : "transparent",
                    border: isRunning ? `1px solid ${bc}44` : "1px solid transparent",
                    opacity: bst === "past" ? 0.45 : 1,
                  }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: bc, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: isRunning ? 700 : 400, color: isRunning ? bc : "var(--color-muted)", minWidth: "70px" }}>
                      {tPlanetLord(bh.lord, lang)} {t("bhukti_word", lang)}
                    </span>
                    <span style={{ fontSize: "0.625rem", color: "var(--color-faint)", flex: 1 }}>
                      {String(bh.startDate)} → {String(bh.endDate)}
                    </span>
                    <span style={{
                      fontSize: "0.625rem", fontWeight: 600, padding: "1px var(--space-1_5)", borderRadius: "var(--radius-pill)",
                      background: isRunning ? `${bc}22` : "#FAF5EA",
                      color: isRunning ? bc : "var(--color-faint)",
                      border: `1px solid ${isRunning ? bc + "55" : "var(--color-border)"}`,
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
  const [familyToday, setFamilyToday] = useState<FamilyVaultTodayData | null>(null);
  const [familySummary, setFamilySummary] = useState<FamilySummaryData | null>(null);

  useEffect(() => {
    if (!selectedVaultId) {
      setFamilyToday(null);
      setFamilySummary(null);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    void apiFetchJson<{ data: FamilyVaultTodayData }>(
      `/api/v1/family-vaults/${selectedVaultId}/today?date=${today}`
    )
      .then((r) => setFamilyToday(r.data ?? null))
      .catch(() => setFamilyToday(null));
    void apiFetchJson<{ data: FamilySummaryData }>(
      `/api/v1/family-vaults/${selectedVaultId}/summary?date=${today}`
    )
      .then((r) => setFamilySummary(r.data ?? null))
      .catch(() => setFamilySummary(null));
  }, [selectedVaultId, busy.family]);

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
  const familyScoreColor = scoreColor(familyScore);
  const scoreBg     = scoreBand.tone === "high" ? "#DCE4D2" : scoreBand.tone === "low" ? "#F2D8CC" : "#F0D9C4";

  const bestWindow  = familyAggregate?.bestFamilyWindows[0] ?? null;
  const avoidWindow = familyAggregate?.avoidForFamilyDecisions[0] ?? null;

  const vaultName   = familyDetail?.name ?? (vaults.find((v) => v.familyVaultId === selectedVaultId)?.name ?? "");
  const memberCount = members.length;
  const todayMembers = familyToday?.members ?? [];
  const todayHighCount = todayMembers.filter((m) => m.score >= 65).length;
  const todayMidCount = todayMembers.filter((m) => m.score >= 45 && m.score < 65).length;
  const todayLowCount = todayMembers.filter((m) => m.score < 45).length;

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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-7, 28px)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ── ROW 1: Full-width header — kicker + heading + desc LEFT, buttons RIGHT ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-5)", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)" }}>
            {vaultName
              ? `${vaultName.toUpperCase()} · ${memberCount} ${memberCount === 1 ? t("members_label", lang).toUpperCase() : t("members_label_pl", lang).toUpperCase()}`
              : t("family_kicker", lang)}
          </p>
          <h1 style={{
            margin: "0 0 var(--space-1_5)",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem,3vw,2.8rem)",
            fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.05, color: "var(--color-text-strong)",
          }}>
            {familyAggregate
              ? <>A shared, <em style={{ fontStyle: "italic", color: "var(--color-muted)" }}>{familyLabel}.</em></>
              : t("family_title", lang)}
          </h1>
          <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "#5a4f42" }}>
            {lang === "ta"
              ? "குடும்ப மதிப்பெண், உறுப்பினர் ஜாதகங்கள், பகிர்ந்த சிறந்த நேர சாளரங்கள்."
              : "Family score, member charts, shared best windows."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0, alignItems: "center" }}>
          {/* Multiple vault switcher */}
          {vaults.length > 1 && vaults.map((v) => (
            <button key={v.familyVaultId} type="button" onClick={() => onSelectVault(v)}
              style={{
                padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-pill)", border: "1.5px solid",
                borderColor: v.familyVaultId === selectedVaultId ? "var(--color-text-strong)" : "var(--color-border-strong)",
                background: v.familyVaultId === selectedVaultId ? "var(--color-text-strong)" : "transparent",
                color: v.familyVaultId === selectedVaultId ? "var(--color-bg)" : "var(--color-muted)",
                fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
              {v.name}
            </button>
          ))}
          <button type="button" onClick={onRefreshFamily} disabled={!selectedVaultId || busy.family}
            style={{ padding: "var(--space-2) var(--space-4_5)", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--color-border-strong)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {busy.family ? t("btn_refreshing", lang) : t("btn_refresh_family", lang)}
          </button>
          <button type="button" onClick={onOpenSetup}
            style={{ padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-pill)", border: "none", background: "var(--color-text-strong)", color: "var(--color-bg)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            + {t("btn_add_member", lang)}
          </button>
        </div>
      </div>

      {selectedVaultId && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-4) var(--space-5)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-3)",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
              {lang === "ta" ? "குடும்ப சுருக்கம்" : "Family Summary"}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>
              {(familySummary?.dateLocal ?? familyToday?.date ?? selectedDate)} {vaultName ? `· ${vaultName}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "2rem", color: scoreColor(familySummary?.familyScore ?? familyScore), lineHeight: 1 }}>
              {familySummary?.familyScore ?? familyScore}
              <span style={{ fontSize: "0.875rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>/100</span>
            </p>
            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
              <span style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", border: "1px solid rgba(92,118,84,0.35)", color: SCORE_HIGH, background: "rgba(92,118,84,0.12)" }}>
                {todayHighCount} {lang === "ta" ? "உயர்" : "High"}
              </span>
              <span style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", border: "1px solid rgba(184,90,44,0.35)", color: SCORE_MID, background: "rgba(184,90,44,0.12)" }}>
                {todayMidCount} {lang === "ta" ? "நடு" : "Mid"}
              </span>
              <span style={{ padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", border: "1px solid rgba(168,72,47,0.35)", color: SCORE_LOW, background: "rgba(168,72,47,0.12)" }}>
                {todayLowCount} {lang === "ta" ? "குறை" : "Low"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── ROW 2: 50/50 — Left = Family Today card · Right = member tiles stacked ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "var(--space-4)", alignItems: "stretch" }}>

        {/* LEFT: Family Today score card — stretches to full row height */}
        <div style={{
          background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)", boxShadow: "0 2px 16px rgba(60,40,20,0.07)",
          display: "flex", flexDirection: "column", gap: "var(--space-4)",
        }}>
          <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
            {lang === "ta" ? "குடும்பம் இன்று" : "FAMILY TODAY"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
            <div>
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "3.4rem", fontWeight: 500, lineHeight: 1, color: "var(--color-text-strong)" }}>
                {familyScore || "—"}
                {familyScore > 0 && <span style={{ fontSize: "1.125rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>/100</span>}
              </p>
              <span style={{ display: "inline-block", marginTop: "var(--space-2)", padding: "var(--space-0_75) var(--space-3)", borderRadius: "var(--radius-pill)", background: scoreBg, color: familyScoreColor, fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize" }}>
                {familyLabel || (busy.family ? "Loading…" : "—")}
              </span>
            </div>
            {familyScore > 0 && <ScoreRing score={familyScore} size={88} />}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2_5)" }}>
            <div style={{ borderRadius: "var(--radius-md)", background: "#DCE4D2", border: "1px solid rgba(92,118,84,0.3)", padding: "var(--space-3)" }}>
              <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: SCORE_HIGH }}>
                {lang === "ta" ? "பகிர்ந்த சிறந்த நேரம்" : "BEST SHARED"}
              </p>
              <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 600, color: SCORE_HIGH }}>
                {bestWindow ? `${formatClockLabel(bestWindow.start)} – ${formatClockLabel(bestWindow.end)}` : "—"}
              </p>
            </div>
            <div style={{ borderRadius: "var(--radius-md)", background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)", padding: "var(--space-3)" }}>
              <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: SCORE_LOW }}>
                {lang === "ta" ? "தவிர்க்கவும்" : "AVOID"}
              </p>
              <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: 600, color: SCORE_LOW }}>
                {avoidWindow ? `${formatClockLabel(avoidWindow.start)} – ${formatClockLabel(avoidWindow.end)}` : "—"}
              </p>
            </div>
          </div>
          <SevenDayBars scores={weekScores} labels={weekDayLabels} />
          {familyAggregate && familyAggregate.aggregateBreakdown.chandrashtamaCount > 0 && (
            <div style={{ padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", color: SCORE_LOW, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
                <AlertGlyph /> {familyAggregate.aggregateBreakdown.chandrashtamaCount} {t("member_chandrashtamam", lang)}
              </p>
            </div>
          )}
          {!selectedVaultId && !busy.vaults && vaults.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: "var(--space-2)" }}>
              <p style={{ margin: "0 0 var(--space-3)", color: "var(--color-faint)", fontSize: "0.875rem" }}>{t("vaults_empty", lang)}</p>
              <button type="button" onClick={onOpenSetup}
                style={{ padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-pill)", background: "var(--color-text-strong)", color: "var(--color-bg)", border: "none", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                + {t("btn_add_first_member", lang)}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Member tiles — vertical stack, full 50% width */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {todayMembers.length > 0 && (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3)" }}>
              <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                {lang === "ta" ? "இன்றைய உறுப்பினர் சுருக்கம்" : "Today Snapshot"}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--space-2)" }}>
                {todayMembers.map((item) => (
                  <div key={item.memberId} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-soft)", padding: "var(--space-2_5)" }}>
                    <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{item.displayName}</p>
                    <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.75rem", color: scoreColor(item.score) }}>
                      {item.score}/100
                    </p>
                    <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", color: "var(--color-muted)" }}>
                      {lang === "ta" ? "தசை" : "Dasha"}: {tPlanetLord(item.dashaLord, lang)}
                    </p>
                    {item.keyTransit && (
                      <p style={{ margin: 0, fontSize: "0.625rem", color: "var(--color-faint)" }}>
                        {item.keyTransit}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {busy.family && members.length === 0 ? (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-5)", display: "grid", gap: "var(--space-3)" }}>
              <div className="cd-skeleton" style={{ height: "14px", width: "40%", borderRadius: "var(--radius-sm)" }} />
              <div className="cd-skeleton" style={{ height: "10px", width: "80%", borderRadius: "var(--radius-sm)" }} />
              <div className="cd-skeleton" style={{ height: "10px", width: "70%", borderRadius: "var(--radius-sm)" }} />
            </div>
          ) : members.length === 0 && selectedVaultId ? (
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-7) var(--space-6)", textAlign: "center" }}>
              <p style={{ margin: "0 0 var(--space-3_5)", color: "var(--color-faint)", fontSize: "0.875rem" }}>{t("no_members_yet", lang)}</p>
              <button type="button" onClick={onOpenSetup}
                style={{ padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-pill)", background: "var(--color-text-strong)", color: "var(--color-bg)", border: "none", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Selector row: name pills + synastry toggle */}
          <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", flex: 1 }}>
              {members.map((m) => {
                const isActive = activeMemberId === m.familyMemberId;
                return (
                  <button key={m.familyMemberId} type="button"
                    onClick={() => { setSelectedMemberId(m.familyMemberId); setSubTab("members"); }}
                    style={{
                      padding: "var(--space-1_5) var(--space-4)", borderRadius: "var(--radius-pill)", border: "1.5px solid",
                      borderColor: isActive && subTab === "members" ? "var(--color-text-strong)" : "var(--color-border-strong)",
                      background: isActive && subTab === "members" ? "var(--color-text-strong)" : "transparent",
                      color: isActive && subTab === "members" ? "var(--color-bg)" : "var(--color-muted)",
                      fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
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
                  padding: "var(--space-1_5) var(--space-4)", borderRadius: "var(--radius-pill)", border: "1.5px solid",
                  borderColor: subTab === "synastry" ? "var(--color-text-strong)" : "var(--color-border-strong)",
                  background: subTab === "synastry" ? "var(--color-text-strong)" : "transparent",
                  color: subTab === "synastry" ? "var(--color-bg)" : "var(--color-muted)",
                  fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
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
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
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
        </div>
      )}
    </div>
  );
}
