"use client";

import { useEffect, useState } from "react";
import { apiFetchJson, toQuery } from "@/lib/api";
import { getScoreBand, formatClockLabel, formatDateLabel, scoreColor, SCORE_HIGH, SCORE_MID, SCORE_LOW } from "@/lib/format";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ApiEnvelope,
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  DailyGuidanceData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  FamilyAggregateMember,
  FamilyCompositeTimelineData,
  FamilyMemberData,
  FamilyVaultDetailData,
  FamilyVaultJournalData,
  FamilyVaultJournalEntryData,
  FamilyVaultJournalSummaryData,
  FamilyVaultListItem,
  FamilyVaultTodayData,
  PeyarchiEvent,
  RelationshipAlertItem,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { SynastryMatrix } from "./synastry-matrix";
import { SynastryPanel } from "./dashboard-synastry-panel";
import { AlertGlyph } from "./icons";
import { DASHA_COLORS, dashaStatus } from "./dashboard-dasha";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";

const SCORE_CHIP_KEYS = ["moonTransit", "gocharSupport", "dashaSupport", "panchangam", "personalCautions", "remedialActionSupport"] as const;

type ScoreChipMeta = { max: number; signed?: boolean; labelEn: string; labelTa: string; descEn: string; descTa: string };
const SCORE_CHIP_META: Record<typeof SCORE_CHIP_KEYS[number], ScoreChipMeta> = {
  moonTransit:           { max: 28,               labelEn: "Moon transit",        labelTa: "சந்திர நகர்வு",       descEn: "Moon's position relative to your natal Moon today",       descTa: "இன்று சந்திரன் உங்கள் ஜாதக சந்திரனிலிருந்து எந்த இடத்தில் உள்ளார்" },
  gocharSupport:         { max: 24,               labelEn: "Gochar transits",     labelTa: "கோசார ஆதரவு",        descEn: "Today's transiting planets interacting with your chart",   descTa: "இன்றைய கோசார கிரகங்கள் உங்கள் ஜாதகத்தை எவ்வாறு பாதிக்கின்றன" },
  dashaSupport:          { max: 19,               labelEn: "Dasa support",        labelTa: "தசை ஆதரவு",          descEn: "Current Mahadasha & Antardasha lord strength",             descTa: "நடப்பு மகாதசை மற்றும் அந்தர்தசை ஆதரவு" },
  panchangam:            { max: 14,               labelEn: "Panchangam",          labelTa: "பஞ்சாங்கம்",         descEn: "Tithi, Yoga & Karana quality today",                       descTa: "இன்றைய திதி, யோகம், கரணம் தரம்" },
  personalCautions:      { max:  9,               labelEn: "Personal safety",     labelTa: "தனிப்பட்ட பாதுகாப்பு",  descEn: "Personal safety score — lower when Saturn cycle, Chandrashtama or combustion is active", descTa: "தனிப்பட்ட பாதுகாப்பு — சனி சுழற்சி, சந்திராஷ்டமம் அல்லது கிரக அஸ்தமனம் உள்ளபோது குறையும்" },
  remedialActionSupport: { max:  6,               labelEn: "Remedial support",    labelTa: "பரிகார ஆதரவு",       descEn: "Bonus when a personal hora window is available today",     descTa: "தனிப்பட்ட ஹோரா சாளரம் கிடைக்கும்போது கூடுதல் மதிப்பெண்" },
};

type MemberChartData = {
  memberId: string;
  displayName: string;
  chart: ChartCalculateResponseData;
  explanation: ChartExplanationData | null;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  peyarchiUpcoming: PeyarchiEvent[];
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
  ownerMemberChart: MemberChartData | null;
  vaults: FamilyVaultListItem[];
  familyDetail: FamilyVaultDetailData | null;
  familyAggregate: FamilyAggregateData | null;
  familyComposite: FamilyCompositeTimelineData | null;
  familyMembers: FamilyMemberData[];
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
export function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
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
      <p className="cd-kicker" style={{ marginBottom: "var(--space-2)" }}>7-DAY OUTLOOK</p>
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
export function formatRelLabel(rel: string | undefined | null): string | null {
  if (!rel || rel === "other") return null;
  return rel.charAt(0).toUpperCase() + rel.slice(1).toLowerCase();
}

/* ── Expanded member detail (shown below name selector) ─── */
export function MemberDetailExpanded({
  member,
  memberChart,
  relationshipToOwner,
  onDelete,
  onEdit,
  deletingId,
  today,
  lang,
}: {
  member: FamilyAggregateMember;
  memberChart: MemberChartData | undefined;
  relationshipToOwner: string | undefined;
  onDelete: (memberId: string, name: string) => void;
  onEdit: (member: FamilyAggregateMember) => void;
  deletingId: string;
  today: string;
  lang: Lang;
}) {
  const band = getScoreBand(member.individualScore);
  const toneColor = scoreColor(member.individualScore);
  const scoreBg   = band.tone === "high" ? "var(--chart-d9-active-bg)" : band.tone === "low" ? "var(--panel-warm-tint)" : "var(--chart-d1-lagna-bg)";
  const isChandrashtama = memberChart?.transit?.isChandrashtama ?? false;

  const relLabel = formatRelLabel(relationshipToOwner);

  const summary = memberChart?.summary;
  const guidance = memberChart?.dailyGuidance;
  const bestW = guidance?.bestWindows[0];
  const avoidW = guidance?.cautionWindows[0];
  const dasha = memberChart?.dasha;
  const dashaColor   = dasha ? (DASHA_COLORS[dasha.current.mahadasha.lord]    ?? "var(--color-faint, var(--color-faint))") : "var(--color-faint)";
  const bhuktiColor  = dasha ? (DASHA_COLORS[dasha.current.antardasha.lord]   ?? "var(--color-faint, var(--color-faint))") : "var(--color-faint)";
  const antaramColor = dasha ? (DASHA_COLORS[dasha.current.pratyantardasha.lord] ?? "var(--color-faint, var(--color-faint))") : "var(--color-faint)";

  const identityParts: string[] = [];
  if (summary?.lagnaRasi) identityParts.push(`${summary.lagnaRasi} ${t("label_lagnam", lang)}`);
  if (summary?.moonRasi)   identityParts.push(`${summary.moonRasi} ${t("label_janma_rasi", lang)}`);
  if (summary?.janmaNakshatra) identityParts.push(summary.janmaNakshatra);

  return (
    <div style={{
      background: "var(--color-surface)",
      border: `1px solid ${isChandrashtama ? "var(--cl-rust-edge)" : "var(--color-border)"}`,
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-7)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-5)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div style={{ flex: 1 }}>
          {relLabel && <p className="cd-kicker">{relLabel}</p>}
          {/* Name + Edit/Remove inline */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)", flexWrap: "wrap", marginBottom: "var(--space-1)" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500, color: "var(--color-text-strong)", lineHeight: 1.1, overflowWrap: "anywhere", wordBreak: "break-word" }}>
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
              style={{ padding: "var(--space-0_75) var(--space-3)", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--cl-rust-30)", background: "transparent", color: SCORE_LOW, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: deletingId === member.familyMemberId ? 0.5 : 1 }}
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
          <span style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: "var(--panel-cream)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            {lang === "ta" ? "சிறந்த நேரம்" : "Best"} {formatClockLabel(bestW.start)} – {formatClockLabel(bestW.end)}
          </span>
        )}
        {avoidW && (
          <span style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: "var(--panel-warm-tint)", border: "1px solid var(--cl-rust-30)", color: SCORE_LOW }}>
            {lang === "ta" ? "தவிர்க்கவும்" : "Avoid"} {formatClockLabel(avoidW.start)} – {formatClockLabel(avoidW.end)}
          </span>
        )}
        {member.activeCycleTags.map((tag) => (
          <span key={tag} style={{ padding: "var(--space-1) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", background: "var(--panel-cream)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
            {tag}
          </span>
        ))}
        {isChandrashtama && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 700, background: "var(--panel-warm-tint)", color: SCORE_LOW, border: "1px solid var(--cl-rust-edge)" }}>
            <AlertGlyph /> {t("label_chandrashtamam", lang)}
          </span>
        )}
      </div>

      {/* Score breakdown grid — 6 weighted components; values approximately sum to total (±1 rounding) */}
      {guidance?.scoreBreakdown && (
        <div className="cd-score-chip-grid">
          {SCORE_CHIP_KEYS.map((k) => {
            const value = guidance.scoreBreakdown[k] ?? 0;
            const meta = SCORE_CHIP_META[k];
            const isNegative = value < 0;
            const pct = Math.round(Math.max(0, value) / meta.max * 100);
            const color = isNegative ? "var(--color-score-low, #A8482F)" : scoreColor(value / meta.max * 100);
            const displayValue = meta.signed && value > 0 ? `+${value}` : `${value}`;
            return (
              <div key={k} className="cd-score-chip">
                <p className="cd-kicker">{lang === "ta" ? meta.labelTa : meta.labelEn}</p>
                <div className="cd-score-chip__value-row">
                  <span className="cd-score-chip__value" style={{ color }}>{displayValue}</span>
                  <span className="cd-score-chip__max">/ {meta.max}</span>
                </div>
                <div className="cd-score-chip__bar-track">
                  <div className="cd-score-chip__bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <p className="cd-score-chip__desc">{lang === "ta" ? meta.descTa : meta.descEn}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts row */}
      {memberChart?.chart && (
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
          <RasiChart chart={memberChart.chart} label={t("label_d1", lang)} lang={lang} />
          <NavamsaChart chart={memberChart.chart} label={t("label_d9", lang)} lang={lang} />
        </div>
      )}

      {memberChart?.chart && (
        <ChartExplanationPanel
          lang={lang}
          chart={memberChart.chart}
          explanation={memberChart.explanation}
          summary={memberChart.summary}
          transit={memberChart.transit}
          sani={memberChart.sani}
          peyarchiUpcoming={memberChart.peyarchiUpcoming ?? []}
          dasha={memberChart.dasha}
          dashaAntar={memberChart.dashaAntar ?? []}
        />
      )}

      {/* Dasha · Bhukti · Antaram */}
      {dasha && (
        <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${dashaColor}44`, background: `${dashaColor}0d`, padding: "var(--space-3_5) var(--space-4)" }}>
          <p className="cd-kicker" style={{ marginBottom: "var(--space-2_5)" }}>
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
                const bc = DASHA_COLORS[bh.lord] ?? "var(--color-faint, var(--color-faint))";
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
                      background: isRunning ? `${bc}22` : "var(--panel-cream)",
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

/* ── Family journal (read-only) ──────────────────────────── */
const JOURNAL_AREA_KEY: Record<string, Parameters<typeof t>[0]> = {
  career: "journal_area_career",
  relationship: "journal_area_relationship",
  health: "journal_area_health",
  family: "journal_area_family",
  finance: "journal_area_finance",
  education: "journal_area_education",
  spiritual: "journal_area_spiritual",
  general: "journal_area_general",
};

function journalAreaLabel(lifeArea: string, lang: Lang): string {
  const key = JOURNAL_AREA_KEY[lifeArea];
  return key ? t(key, lang) : lifeArea;
}

function FamilyJournalPanel({
  lang,
  members,
  journalData,
  journalSummary,
  loading,
  memberFilter,
  onMemberFilterChange,
}: {
  lang: Lang;
  members: FamilyMemberData[];
  journalData: FamilyVaultJournalData | null;
  journalSummary: FamilyVaultJournalSummaryData | null;
  loading: boolean;
  memberFilter: string;
  onMemberFilterChange: (memberId: string) => void;
}) {
  const entries = journalData?.items ?? [];

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* Member filter */}
      <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
        <button type="button" onClick={() => onMemberFilterChange("all")}
          style={{
            padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", border: "1.5px solid",
            borderColor: memberFilter === "all" ? "var(--color-text-strong)" : "var(--color-border-strong)",
            background: memberFilter === "all" ? "var(--color-text-strong)" : "transparent",
            color: memberFilter === "all" ? "var(--color-bg)" : "var(--color-muted)",
            fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
          {lang === "ta" ? "அனைவரும்" : "All members"}
        </button>
        {members.map((m) => (
          <button key={m.familyMemberId} type="button" onClick={() => onMemberFilterChange(m.familyMemberId)}
            style={{
              padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", border: "1.5px solid",
              borderColor: memberFilter === m.familyMemberId ? "var(--color-text-strong)" : "var(--color-border-strong)",
              background: memberFilter === m.familyMemberId ? "var(--color-text-strong)" : "transparent",
              color: memberFilter === m.familyMemberId ? "var(--color-bg)" : "var(--color-muted)",
              fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
            {m.displayName}
          </button>
        ))}
      </div>

      {/* Summary strip */}
      {journalSummary && journalSummary.totalEntries > 0 && (
        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", alignItems: "center" }}>
          <span className="cd-kicker">
            {journalSummary.totalEntries} {lang === "ta" ? "பதிவுகள்" : "entries"}
          </span>
          {journalSummary.lifeAreaCounts.map((item) => (
            <span key={item.lifeArea} style={{ padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, background: "var(--panel-cream)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
              {journalAreaLabel(item.lifeArea, lang)} · {item.count}
            </span>
          ))}
        </div>
      )}

      {/* Entry list */}
      {loading && entries.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-faint)" }}>
          {lang === "ta" ? "ஏற்றுகிறது..." : "Loading..."}
        </p>
      ) : entries.length === 0 ? (
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-faint)" }}>
          {lang === "ta"
            ? "இன்னும் குடும்ப ஜர்னல் பதிவுகள் இல்லை. உங்கள் தனிப்பட்ட ஜர்னலில் ஒரு உறுப்பினரின் ஜாதகத்திற்கு பதிவு செய்யவும்."
            : "No family journal entries yet. Entries you write against a family member's chart in your personal Journal tab will show up here."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          {entries.map((entry: FamilyVaultJournalEntryData) => (
            <div key={entry.journalId} style={{ padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-md)", background: "var(--panel-cream)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{entry.memberDisplayName}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>{formatDateLabel(entry.entryDate)}</span>
                <span style={{ padding: "var(--space-0_75) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.6875rem", fontWeight: 600, background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
                  {journalAreaLabel(entry.lifeArea, lang)}
                </span>
                {entry.tags.map((tag) => (
                  <span key={tag} style={{ padding: "var(--space-0_75) var(--space-2)", borderRadius: "var(--radius-pill)", fontSize: "0.6875rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
                    {tag}
                  </span>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.noteText}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main tab ───────────────────────────────────────────── */
type FamilySubTab = "members" | "synastry" | "journal";

export function DashboardFamilyTab({
  lang,
  selectedDate,
  selectedVaultId,
  ownerChartId,
  ownerChart,
  ownerMemberChart,
  vaults,
  familyDetail,
  familyAggregate,
  familyComposite,
  familyMembers,
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
  const [journalMemberFilter, setJournalMemberFilter] = useState<string>("all");
  const [journalData, setJournalData] = useState<FamilyVaultJournalData | null>(null);
  const [journalSummary, setJournalSummary] = useState<FamilyVaultJournalSummaryData | null>(null);
  const [journalLoading, setJournalLoading] = useState(false);

  useEffect(() => {
    if (!selectedVaultId) {
      setFamilyToday(null);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const controller = new AbortController();
    const { signal } = controller;
    void apiFetchJson<{ data: FamilyVaultTodayData }>(
      `/api/v1/family-vaults/${selectedVaultId}/today?date=${today}`, { signal }
    )
      .then((r) => { if (!signal.aborted) setFamilyToday(r.data ?? null); })
      .catch(() => { if (!signal.aborted) setFamilyToday(null); });
    return () => controller.abort();
  }, [selectedVaultId, busy.family]);

  useEffect(() => {
    if (!selectedVaultId || subTab !== "journal") return;
    const controller = new AbortController();
    const { signal } = controller;
    setJournalLoading(true);
    Promise.all([
      apiFetchJson<ApiEnvelope<FamilyVaultJournalData>>(
        `/api/v1/family-vaults/${selectedVaultId}/journal${toQuery({
          familyMemberId: journalMemberFilter === "all" ? undefined : journalMemberFilter,
          limit: 100,
        })}`,
        { signal },
      ),
      apiFetchJson<ApiEnvelope<FamilyVaultJournalSummaryData>>(
        `/api/v1/family-vaults/${selectedVaultId}/journal/summary`, { signal },
      ),
    ])
      .then(([entriesRes, summaryRes]) => {
        if (signal.aborted) return;
        setJournalData(entriesRes.data);
        setJournalSummary(summaryRes.data);
      })
      .catch(() => { if (!signal.aborted) { setJournalData(null); setJournalSummary(null); } })
      .finally(() => { if (!signal.aborted) setJournalLoading(false); });
    return () => controller.abort();
  }, [selectedVaultId, subTab, journalMemberFilter]);

  const members = familyAggregate?.members ?? [];
  const activeMemberId = selectedMemberId ?? members[0]?.familyMemberId ?? null;
  const activeMember   = members.find((m) => m.familyMemberId === activeMemberId) ?? null;
  const activeMemberChart = activeMember
    ? (activeMember.familyMemberId === activeMember.birthProfileId
        ? ownerMemberChart
        : memberCharts.find((mc) => mc.memberId === activeMember.familyMemberId))
    : null;

  const memberOptions = members.map((m) => {
    const fm = familyMembers.find((f) => f.familyMemberId === m.familyMemberId);
    return { memberId: m.familyMemberId, displayName: m.displayName, relationshipToOwner: fm?.relationshipToOwner ?? "other" };
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
  const scoreBg     = scoreBand.tone === "high" ? "var(--chart-d9-active-bg)" : scoreBand.tone === "low" ? "var(--panel-warm-tint)" : "var(--chart-d1-lagna-bg)";

  const bestWindow  = familyAggregate?.bestFamilyWindows[0] ?? null;
  const avoidWindow = familyAggregate?.avoidForFamilyDecisions[0] ?? null;

  const vaultName   = familyDetail?.name ?? (vaults.find((v) => v.familyVaultId === selectedVaultId)?.name ?? "");
  const memberCount = members.length;
  const todayMembers = familyToday?.members ?? [];
  const todayHighCount = todayMembers.filter((m) => m.score >= 65).length;
  const todayMidCount = todayMembers.filter((m) => m.score >= 45 && m.score < 65).length;
  const todayLowCount = todayMembers.filter((m) => m.score < 45).length;

  /* 7-day scores — real family + per-member scores from composite (selectedDate → +6 days) */
  const weekDayLabels = (() => {
    const days: string[] = [];
    const base = new Date(selectedDate + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 3));
    }
    return days;
  })();
  const weekScores = weekDayLabels.map((_, i) => {
    const compositeItem = familyComposite?.items[i];
    if (compositeItem != null) return Math.max(30, Math.min(99, compositeItem.familyScore));
    // Composite still loading — placeholder based on today's score
    return Math.max(30, Math.min(99, familyScore + (i === 0 ? 0 : -2)));
  });
  /* Per-member 7-day trend, keyed by member so each row stays aligned across days */
  const memberWeekTrends = members.map((m) => ({
    familyMemberId: m.familyMemberId,
    displayName: m.displayName,
    scores: weekDayLabels.map((_, i) => familyComposite?.items[i]?.members.find((cm) => cm.familyMemberId === m.familyMemberId)?.individualScore ?? null),
  }));

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
          <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, color: "var(--panel-mid-earth)" }}>
            {lang === "ta"
              ? "குடும்ப மதிப்பெண், உறுப்பினர் ஜாதகங்கள், பகிர்ந்த சிறந்த நேர சாளரங்கள்."
              : "Family score, member charts, shared best windows."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
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

      {/* ── Family Today — unified card: score | windows | members | 7-day ── */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
        overflow: "hidden", boxShadow: "0 2px 16px var(--shadow-faint)",
      }}>
        {/* ── Top 3-column row ── */}
        <div style={{ display: "flex", alignItems: "stretch", flexWrap: "wrap" }}>

          {/* Col 1: Score ring + label */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", padding: "var(--space-5) var(--space-6)", borderRight: "1px solid var(--color-border)", flexShrink: 0 }}>
            <ScoreRing score={familyScore || 0} size={72} />
            <div>
              <p className="cd-kicker" style={{ margin: "0 0 var(--space-1_5)", color: "var(--color-muted)" }}>
                {lang === "ta" ? "குடும்பம் இன்று" : "FAMILY TODAY"}
              </p>
              <span style={{ display: "inline-block", padding: "var(--space-0_75) var(--space-3)", borderRadius: "var(--radius-pill)", background: scoreBg, color: familyScoreColor, fontSize: "0.8125rem", fontWeight: 600, textTransform: "capitalize" }}>
                {familyLabel || (busy.family ? "…" : "—")}
              </span>
            </div>
          </div>

          {/* Col 2: Best shared + Avoid */}
          <div style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-5) var(--space-6)", flex: "1 1 260px", borderRight: "1px solid var(--color-border)", alignItems: "center", flexWrap: "wrap" }}>
            <div className="cd-time-slot" style={{ flex: 1, minWidth: "110px", background: "var(--chart-d9-active-bg)", border: "1px solid var(--cl-sage-edge)" }}>
              <p className="cd-kicker" style={{ color: SCORE_HIGH }}>
                {lang === "ta" ? "சிறந்த நேரம்" : "BEST SHARED"}
              </p>
              <p className="cd-time-value" style={{ fontSize: "0.9375rem", color: SCORE_HIGH }}>
                {bestWindow ? `${formatClockLabel(bestWindow.start)} – ${formatClockLabel(bestWindow.end)}` : "—"}
              </p>
            </div>
            <div className="cd-time-slot" style={{ flex: 1, minWidth: "110px", background: "var(--panel-warm-tint)", border: "1px solid var(--cl-rust-30)" }}>
              <p className="cd-kicker" style={{ color: SCORE_LOW }}>
                {lang === "ta" ? "தவிர்க்கவும்" : "AVOID"}
              </p>
              <p className="cd-time-value" style={{ fontSize: "0.9375rem", color: SCORE_LOW }}>
                {avoidWindow ? `${formatClockLabel(avoidWindow.start)} – ${formatClockLabel(avoidWindow.end)}` : "—"}
              </p>
            </div>
          </div>

          {/* Col 3: Member comparison bars */}
          {todayMembers.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "var(--space-3)", padding: "var(--space-5) var(--space-6)", flex: "1 1 220px" }}>
              {todayMembers.map((item, idx) => {
                const toneColor = scoreColor(item.score);
                const relLabel = formatRelLabel(item.relationship);
                return (
                  <div key={`bar-${item.memberId ?? item.displayName}-${idx}`} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    {/* Label + name */}
                    <div style={{ minWidth: "90px" }}>
                      {relLabel && <p className="cd-kicker" style={{ margin: "0 0 2px", fontSize: "0.6rem" }}>{relLabel.toUpperCase()}</p>}
                      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "110px" }}>{item.displayName}</p>
                    </div>
                    {/* Horizontal bar */}
                    <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "var(--color-border)", overflow: "hidden", minWidth: "60px" }}>
                      <div style={{ height: "100%", borderRadius: "3px", width: `${Math.max(0, Math.min(100, item.score))}%`, background: toneColor, transition: "width 400ms ease" }} />
                    </div>
                    {/* Score */}
                    <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: toneColor, fontVariantNumeric: "tabular-nums", minWidth: "24px", textAlign: "right" }}>
                      {item.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 7-day outlook — full width, dashed top border ── */}
        <div style={{ padding: "var(--space-4) var(--space-6) var(--space-5)", borderTop: "1px dashed var(--color-border)" }}>
          <p className="cd-kicker" style={{ margin: "0 0 var(--space-2_5)" }}>
            {lang === "ta" ? "7-நாள் கணிப்பு" : "7-DAY OUTLOOK"}
          </p>
          {/* Score numbers */}
          <div style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-0_75)" }}>
            {weekScores.map((s, i) => (
              <span key={i} style={{ flex: 1, textAlign: "center", fontSize: "0.625rem", color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>{s}</span>
            ))}
          </div>
          {/* Bars */}
          <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "flex-end", height: "44px" }}>
            {weekScores.map((s, i) => {
              const h = Math.max(8, (s / 100) * 40);
              const c = scoreColor(s);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <div style={{ width: "100%", height: `${h}px`, borderRadius: "3px 3px 0 0", background: c }} />
                </div>
              );
            })}
          </div>
          {/* Dots + day labels */}
          <div style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-1_5)" }}>
            {weekDayLabels.map((l, i) => {
              const c = scoreColor(weekScores[i]);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: c, display: "block" }} />
                  <span style={{ fontSize: "0.625rem", color: c, fontWeight: 500 }}>{l}</span>
                </div>
              );
            })}
          </div>

          {/* Per-member 7-day trend */}
          {memberWeekTrends.length > 0 && (
            <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
              {memberWeekTrends.map((trend) => (
                <div key={trend.familyMemberId} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span style={{ minWidth: "84px", maxWidth: "84px", fontSize: "0.75rem", color: "var(--color-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {trend.displayName}
                  </span>
                  <div style={{ display: "flex", gap: "var(--space-1)", flex: 1 }}>
                    {trend.scores.map((s, i) => (
                      <span key={i} style={{
                        flex: 1, height: "4px", borderRadius: "2px",
                        background: s == null ? "var(--color-border)" : scoreColor(s),
                        opacity: s == null ? 0.4 : 1,
                      }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Chandrashtama alert ── */}
        {familyAggregate && familyAggregate.aggregateBreakdown.chandrashtamaCount > 0 && (
          <div style={{ margin: "0 var(--space-6) var(--space-5)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", background: "var(--panel-warm-tint)", border: "1px solid var(--cl-rust-30)" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", color: SCORE_LOW, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "var(--space-1)" }}>
              <AlertGlyph /> {familyAggregate.aggregateBreakdown.chandrashtamaCount} {t("member_chandrashtamam", lang)}
            </p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!selectedVaultId && !busy.vaults && vaults.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2) var(--space-6) var(--space-6)" }}>
            <p style={{ margin: "0 0 var(--space-3)", color: "var(--color-faint)", fontSize: "0.875rem" }}>{t("vaults_empty", lang)}</p>
            <button type="button" onClick={onOpenSetup}
              style={{ padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-pill)", background: "var(--color-text-strong)", color: "var(--color-bg)", border: "none", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              + {t("btn_add_first_member", lang)}
            </button>
          </div>
        )}
      </div>

      {/* ── Name selector + individual detail (below hero) ── */}
      {members.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Selector row: name pills + synastry toggle */}
        <div className="cd-responsive-row" style={{ gap: "var(--space-1_5)", alignItems: "center" }}>
            <div className="cd-responsive-pills" style={{ gap: "var(--space-1_5)", flex: 1 }}>
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
            <button type="button"
              onClick={() => setSubTab(subTab === "journal" ? "members" : "journal")}
              style={{
                padding: "var(--space-1_5) var(--space-4)", borderRadius: "var(--radius-pill)", border: "1.5px solid",
                borderColor: subTab === "journal" ? "var(--color-text-strong)" : "var(--color-border-strong)",
                background: subTab === "journal" ? "var(--color-text-strong)" : "transparent",
                color: subTab === "journal" ? "var(--color-bg)" : "var(--color-muted)",
                fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
              {lang === "ta" ? "ஜர்னல்" : "Journal"}
            </button>
          </div>

          {/* Individual detail */}
          {subTab === "members" && activeMember && (
            <MemberDetailExpanded
              member={activeMember}
              memberChart={activeMemberChart ?? undefined}
              relationshipToOwner={familyMembers.find((fm) => fm.familyMemberId === activeMember.familyMemberId)?.relationshipToOwner}
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

          {/* Family journal — read-only browse of the owner's own journal entries, filterable by member */}
          {subTab === "journal" && (
            <FamilyJournalPanel
              lang={lang}
              members={familyMembers}
              journalData={journalData}
              journalSummary={journalSummary}
              loading={journalLoading}
              memberFilter={journalMemberFilter}
              onMemberFilterChange={setJournalMemberFilter}
            />
          )}
        </div>
      )}
    </div>
  );
}
