"use client";

// Shared family utilities/leaf-components extracted from the (now-deleted)
// Classic dashboard-family-tab.tsx during the Nova-only migration
// (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3b). Pure functions/constants plus
// presentational components with no Classic/Nova fork: ScoreRing,
// formatRelLabel, ageFromBirth, MemberDetailExpanded, FamilySevenDayOutlook,
// DasaBhuktiAntaramDetail.

import { getScoreBand, formatClockLabel, scoreColor, SCORE_LOW } from "@/lib/format";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ChartCalculateResponseData,
  ChartExplanationData,
  ChartSummaryData,
  DailyGuidanceData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateMember,
  FamilyCompositeTimelineData,
  PeyarchiEvent,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

import { AlertGlyph } from "./icons";
import { DASHA_COLORS, dashaStatus } from "./dashboard-dasha";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
import { ChartExplanationPanel } from "./dashboard-chart-explanation";
import { Chip, Surface } from "./dashboard-ui";

export type MemberChartData = {
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

/* ── Format relationship label ───────────────────────────── */
export function formatRelLabel(rel: string | undefined | null): string | null {
  if (!rel || rel === "other") return null;
  return rel.charAt(0).toUpperCase() + rel.slice(1).toLowerCase();
}

// Issue #12: give each member card one more genuinely useful, at-a-glance fact —
// their current age — computed from already-fetched birth data (no new fetch).
export function ageFromBirth(birthDate: string, today: string): number | null {
  const b = new Date(birthDate);
  const t = new Date(today);
  if (Number.isNaN(b.getTime()) || Number.isNaN(t.getTime())) return null;
  let age = t.getFullYear() - b.getFullYear();
  const monthDiff = t.getMonth() - b.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && t.getDate() < b.getDate())) age -= 1;
  return age >= 0 && age < 150 ? age : null;
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
  hideChartAndExplanation = false,
}: {
  member: FamilyAggregateMember;
  memberChart: MemberChartData | undefined;
  relationshipToOwner: string | undefined;
  onDelete: (memberId: string, name: string) => void;
  onEdit: (member: FamilyAggregateMember) => void;
  deletingId: string;
  today: string;
  lang: Lang;
  /** Nova's Family tab renders its own D1/D9 pictorial + ChartExplanationPanel
   *  further down the same page (the "Chart & explanations" deep-dive panel) —
   *  set true there so this quick-glance card doesn't repeat both wholesale.
   *  Classic has no such panel below, so it keeps the default (false). */
  hideChartAndExplanation?: boolean;
}) {
  const band = getScoreBand(member.individualScore);
  const toneColor = scoreColor(member.individualScore);
  const scoreBg   = band.tone === "high" ? "var(--color-high-bg)" : band.tone === "low" ? "var(--color-low-bg)" : "var(--color-mid-bg)";
  const isChandrashtama = memberChart?.transit?.isChandrashtama ?? false;

  const relLabel = formatRelLabel(relationshipToOwner);

  const summary = memberChart?.summary;
  const guidance = memberChart?.dailyGuidance;
  const bestW = guidance?.bestWindows[0];
  const avoidW = guidance?.cautionWindows[0];
  const dasha = memberChart?.dasha;

  const identityParts: string[] = [];
  if (summary?.lagnaRasi) identityParts.push(`${summary.lagnaRasi} ${t("label_lagnam", lang)}`);
  if (summary?.moonRasi)   identityParts.push(`${summary.moonRasi} ${t("label_janma_rasi", lang)}`);
  if (summary?.janmaNakshatra) identityParts.push(summary.janmaNakshatra);

  const birthDateLocal = memberChart?.chart?.birthProfile?.birthDateLocal ?? null;
  const memberAge = birthDateLocal ? ageFromBirth(birthDateLocal, today) : null;

  return (
    <div style={{
      background: "var(--color-surface)",
      border: `1px solid ${isChandrashtama ? "var(--color-low-border)" : "var(--color-border)"}`,
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
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 500, color: "var(--color-text-strong)", lineHeight: 1.1, overflowWrap: "anywhere", wordBreak: "break-word" }}>
              {member.displayName}
            </h3>
            <button
              type="button"
              onClick={() => onEdit(member)}
              style={{ padding: "var(--space-0_75) var(--space-3)", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--color-border-strong)", background: "transparent", color: "var(--color-muted)", fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              {lang === "ta" ? "திருத்து" : "Edit"}
            </button>
            <button
              type="button"
              disabled={deletingId === member.familyMemberId}
              onClick={() => onDelete(member.familyMemberId, member.displayName)}
              style={{ padding: "var(--space-0_75) var(--space-3)", borderRadius: "var(--radius-pill)", border: "1.5px solid var(--color-low-border)", background: "transparent", color: SCORE_LOW, fontSize: "var(--text-sm)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: deletingId === member.familyMemberId ? 0.5 : 1 }}
            >
              {deletingId === member.familyMemberId ? "…" : (lang === "ta" ? "நீக்கு" : "Remove")}
            </button>
          </div>
          {identityParts.length > 0 && (
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)" }}>
              {identityParts.join(" · ")}
            </p>
          )}
          {(dasha || memberAge !== null) && (
            <p style={{ margin: "var(--space-0_75) 0 0", fontSize: "var(--text-base)", color: "var(--color-muted)" }}>
              {dasha && (
                <>
                  {t("dasha_word", lang)}:{" "}
                  <b style={{ color: "var(--color-text-strong)", fontWeight: 600 }}>
                    {tPlanetLord(dasha.current.mahadasha.lord, lang)}–{tPlanetLord(dasha.current.antardasha.lord, lang)}
                  </b>
                </>
              )}
              {dasha && memberAge !== null ? " · " : ""}
              {memberAge !== null && <>{lang === "ta" ? "வயது" : "Age"} {memberAge}</>}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)", flexShrink: 0 }}>
          <ScoreRing score={member.individualScore} size={88} />
          <span style={{ padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-sm)", fontWeight: 600, background: scoreBg, color: toneColor, border: `1px solid ${toneColor}44` }}>
            {band.label}
          </span>
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {bestW && (
          <span style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-sm)", fontWeight: 600, background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
            {lang === "ta" ? "சிறந்த நேரம்" : "Best"} {formatClockLabel(bestW.start)} – {formatClockLabel(bestW.end)}
          </span>
        )}
        {avoidW && (
          <span style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-sm)", fontWeight: 600, background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", color: SCORE_LOW }}>
            {lang === "ta" ? "தவிர்க்கவும்" : "Avoid"} {formatClockLabel(avoidW.start)} – {formatClockLabel(avoidW.end)}
          </span>
        )}
        {member.activeCycleTags.map((tag) => (
          <span key={tag} style={{ padding: "var(--space-1) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-sm)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
            {tag}
          </span>
        ))}
        {isChandrashtama && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-sm)", fontWeight: 700, background: "var(--color-low-bg)", color: SCORE_LOW, border: "1px solid var(--color-low-border)" }}>
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
            const color = isNegative ? "var(--color-score-low)" : scoreColor(value / meta.max * 100);
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
      {!hideChartAndExplanation && memberChart?.chart && (
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
          <RasiChart chart={memberChart.chart} label={t("label_d1", lang)} lang={lang} />
          <NavamsaChart chart={memberChart.chart} label={t("label_d9", lang)} lang={lang} />
        </div>
      )}

      {!hideChartAndExplanation && memberChart?.chart && (
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

      {/* Dasha · Bhukti · Antaram — Nova hides it here (hideChartAndExplanation)
          because its deep-dive panel below renders the same block once, in
          reading order after the kattam. Classic keeps it inline. */}
      {!hideChartAndExplanation && (
        <DasaBhuktiAntaramDetail lang={lang} today={today} dasha={dasha ?? null} dashaAntar={memberChart?.dashaAntar} />
      )}

    </div>
  );
}

/* ── Dasa · Bhukti · Antaram detail (current stack + all bhuktis) ──
   Used by MemberDetailExpanded in this file so the dasha story lives in
   exactly one component. */
export function DasaBhuktiAntaramDetail({
  lang,
  today,
  dasha,
  dashaAntar,
}: {
  lang: Lang;
  today: string;
  dasha: DashaTimelineResponseData | null;
  dashaAntar?: DashaTimelineItem[] | null;
}) {
  if (!dasha) return null;
  const dashaColor   = DASHA_COLORS[dasha.current.mahadasha.lord]       ?? "var(--color-faint)";
  const bhuktiColor  = DASHA_COLORS[dasha.current.antardasha.lord]      ?? "var(--color-faint)";
  const antaramColor = DASHA_COLORS[dasha.current.pratyantardasha.lord] ?? "var(--color-faint)";

  return (
    <Surface title={lang === "ta" ? "தசை · புக்தி · அந்தரம்" : "Dasa · Bhukti · Antaram"}>
      <div className="surface__body">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
          {[
            { color: dashaColor,   lord: dasha.current.mahadasha.lord,       word: t("dasha_word", lang),   start: dasha.current.mahadasha.startDate,       end: dasha.current.mahadasha.endDate,       indent: 0 },
            { color: bhuktiColor,  lord: dasha.current.antardasha.lord,      word: t("bhukti_word", lang),  start: dasha.current.antardasha.startDate,      end: dasha.current.antardasha.endDate,      indent: 16 },
            { color: antaramColor, lord: dasha.current.pratyantardasha.lord, word: t("antaram_word", lang), start: dasha.current.pratyantardasha.startDate, end: dasha.current.pratyantardasha.endDate, indent: 32 },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginLeft: `${row.indent}px` }}>
              <div style={{ width: `${8 - i * 2}px`, height: `${8 - i * 2}px`, borderRadius: "var(--radius-pill)", background: row.color, flexShrink: 0 }} />
              <span style={{ fontSize: `${0.84 - i * 0.04}rem`, fontWeight: 600, color: "var(--color-text-strong)", minWidth: "88px" }}>
                {tPlanetLord(row.lord, lang)} {row.word}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-faint)" }}>
                {String(row.start)} – {String(row.end)}
              </span>
            </div>
          ))}
        </div>

        {dashaAntar && dashaAntar.length > 0 && (
          <div style={{ marginTop: "var(--space-2_5)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-2_5)", display: "flex", flexDirection: "column", gap: "var(--space-0_75)" }}>
            <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "var(--text-2xs)", color: "var(--color-faint)", letterSpacing: "0.04em" }}>
              {tPlanetLord(dasha.current.mahadasha.lord, lang)} {t("dasha_word", lang)} — {t("dasha_all_bhukti", lang)}
            </p>
            {dashaAntar.map((bh) => {
              const bst = dashaStatus(String(bh.startDate), String(bh.endDate), today);
              const isRunning = bh.lord === dasha.current.antardasha.lord && bst === "active";
              const bc = DASHA_COLORS[bh.lord] ?? "var(--color-faint)";
              return (
                <div key={`${bh.lord}-${bh.startDate}`} style={{
                  display: "flex", alignItems: "center", gap: "var(--space-1_5)",
                  padding: "var(--space-0_75) var(--space-2)",
                  borderRadius: "var(--radius-xs)",
                  background: isRunning ? "var(--color-accent-muted)" : "transparent",
                  opacity: bst === "past" ? 0.5 : 1,
                }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "var(--radius-pill)", background: bc, flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: isRunning ? 700 : 400, color: isRunning ? "var(--color-accent-strong)" : "var(--color-muted)", minWidth: "70px" }}>
                    {tPlanetLord(bh.lord, lang)} {t("bhukti_word", lang)}
                  </span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-faint)", flex: 1 }}>
                    {String(bh.startDate)} – {String(bh.endDate)}
                  </span>
                  <Chip tone={isRunning ? "accent" : "neutral"}>
                    {isRunning ? t("status_active", lang) : bst === "past" ? t("status_past", lang) : t("status_upcoming", lang)}
                  </Chip>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Surface>
  );
}

/* ── 7-day family outlook (shared by Classic + Nova family tabs) ───────── */
export function FamilySevenDayOutlook({
  lang,
  selectedDate,
  familyScore,
  familyComposite,
  members,
}: {
  lang: Lang;
  selectedDate: string;
  familyScore: number;
  familyComposite: FamilyCompositeTimelineData | null;
  members: FamilyAggregateMember[];
}) {
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
    <>
      <p className="cd-kicker" style={{ margin: "0 0 var(--space-2_5)" }}>
        {lang === "ta" ? "7-நாள் கணிப்பு" : "7-DAY OUTLOOK"}
      </p>
      {/* Score numbers */}
      <div style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-0_75)" }}>
        {weekScores.map((s, i) => (
          <span key={i} style={{ flex: 1, textAlign: "center", fontSize: "var(--text-2xs)", color: "var(--color-faint)", fontFamily: "var(--font-mono)" }}>{s}</span>
        ))}
      </div>
      {/* Bars */}
      <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "flex-end", height: "44px" }}>
        {weekScores.map((s, i) => {
          const h = Math.max(8, (s / 100) * 40);
          const c = scoreColor(s);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ width: "100%", height: `${h}px`, borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", background: c }} />
            </div>
          );
        })}
      </div>
      {/* Dots + day labels */}
      <div style={{ display: "flex", gap: "var(--space-1)", marginTop: "var(--space-1_5)" }}>
        {weekDayLabels.map((l, i) => {
          const c = scoreColor(weekScores[i]);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-0_75)" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "var(--radius-pill)", background: c, display: "block" }} />
              <span style={{ fontSize: "var(--text-2xs)", color: c, fontWeight: 500 }}>{l}</span>
            </div>
          );
        })}
      </div>

      {/* Per-member 7-day trend */}
      {memberWeekTrends.length > 0 && (
        <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
          {memberWeekTrends.map((trend) => (
            <div key={trend.familyMemberId} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span style={{ minWidth: "84px", maxWidth: "84px", fontSize: "var(--text-sm)", color: "var(--color-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {trend.displayName}
              </span>
              <div style={{ display: "flex", gap: "var(--space-1)", flex: 1 }}>
                {trend.scores.map((s, i) => (
                  <span key={i} style={{
                    flex: 1, height: "4px", borderRadius: "var(--radius-sm)",
                    background: s == null ? "var(--color-border)" : scoreColor(s),
                    opacity: s == null ? 0.4 : 1,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
