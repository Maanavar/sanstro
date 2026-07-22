"use client";

import { useState } from "react";

import { formatClockLabel, formatDateLabel, scoreColor } from "@/lib/format";
import { t, tNakshatra, tPlanetLord, tTithi, tYoga } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { compareSynastry } from "@vinaadi/shared/api/relationships";
import type {
  ChartDoshamInsight,
  ChartYogaInsight,
  FamilyAggregateMember,
  FamilyMemberTodayScore,
  PanchangamDailyResponseData,
} from "@/lib/types";

import type { MemberChart } from "@/hooks/useFamilyData";
import { RasiChart, NavamsaChart } from "./dashboard-charts";
import { DASHA_COLORS } from "./dashboard-dasha";
import { YOGA_DISPLAY } from "./dashboard-yoga-dosham-panel";
import { NovaScoreDial, NovaProgressBar } from "./dashboard-ui-nova";

/**
 * Nova "Family member" screen — Phase 5 of the dashboard revamp (see
 * docs/DASHBOARD_UI_REVAMP_PLAN.md §6.4). A dedicated, full-screen detail
 * view reached from the Family tab via a deliberate "View full profile"
 * action (Phase 4's inline "Open →" expand stays for a quick glance — see
 * the plan's Progress Log for why both patterns were kept). Every field
 * below reuses data already fetched for the Family tab's memberCharts —
 * no new backend endpoints, no new astrology.
 */

function NovaKicker({ children, color = "var(--color-accent)" }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color }}>
      {children}
    </p>
  );
}

function NovaCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      {children}
    </div>
  );
}

function TimingCard({ label, value, color, borderColor, bgColor }: { label: string; value: string; color: string; borderColor: string; bgColor: string }) {
  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: "11px", padding: "13px 16px" }}>
      <div style={{ fontSize: "10px", letterSpacing: "0.1em", color, textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "3px", color: "var(--color-text-strong)" }}>{value}</div>
    </div>
  );
}

function dashaElapsedPct(startDate: string, endDate: string, today: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date(today).getTime();
  if (!(end > start)) return 0;
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

type RelationshipParticipant = { id: string; displayName: string; chartId: string; relationLabel: string | null };
type RelationshipRow = { participant: RelationshipParticipant; score: number };

function NovaMemberRelationshipsCard({
  lang,
  viewedChartId,
  participants,
  bestFamilyWindow,
}: {
  lang: Lang;
  viewedChartId: string;
  participants: RelationshipParticipant[];
  bestFamilyWindow: { start: string; end: string } | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RelationshipRow[]>([]);

  async function load() {
    setLoaded(true);
    setLoading(true);
    const results = await Promise.all(
      participants.map(async (p) => {
        try {
          const res = await compareSynastry(viewedChartId, p.chartId);
          return { participant: p, score: res.data.score };
        } catch {
          return null;
        }
      }),
    );
    setRows(results.filter((r): r is RelationshipRow => r !== null));
    setLoading(false);
  }

  return (
    <NovaCard>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <NovaKicker>
          {lang === "ta" ? <>குடும்பத்தில் · <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>உறவுகள்</span></> : "In the family"}
        </NovaKicker>
        {!loaded && participants.length > 0 && (
          <button type="button" onClick={() => void load()} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            {lang === "ta" ? "ஏற்று →" : "Load →"}
          </button>
        )}
      </div>

      {loading && <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</p>}

      {rows.map((row) => {
        const color = scoreColor(row.score);
        return (
          <div key={row.participant.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: color, color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
              {row.participant.displayName.charAt(0).toUpperCase()}
            </span>
            <span style={{ fontSize: "12.5px", fontWeight: 600, flex: 1 }}>
              {row.participant.displayName}{row.participant.relationLabel ? ` · ${row.participant.relationLabel}` : ""}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 700, color }}>{row.score}<span style={{ color: "var(--color-faint)", fontWeight: 500 }}>/100</span></span>
          </div>
        );
      })}

      {bestFamilyWindow && (
        <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--color-muted)", background: "var(--color-accent-muted)", borderRadius: "9px", padding: "9px 12px", marginTop: "2px" }}>
          {lang === "ta" ? "குடும்பத்துடன் சிறந்த பகிர்ந்த நேரம் " : "Best shared window with family "}
          <b style={{ color: "var(--color-accent-strong)" }}>{formatClockLabel(bestFamilyWindow.start)} – {formatClockLabel(bestFamilyWindow.end)}</b>.
        </div>
      )}
    </NovaCard>
  );
}

export type DashboardFamilyMemberNovaProps = {
  lang: Lang;
  selectedDate: string;
  member: FamilyAggregateMember;
  memberChart: MemberChart | undefined;
  relationLabel: string | null;
  todayItem: FamilyMemberTodayScore | undefined;
  panchangam: PanchangamDailyResponseData | null;
  bestFamilyWindow: { start: string; end: string } | null;
  relationshipParticipants: RelationshipParticipant[];
  onBack: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  prevName: string | null;
  nextName: string | null;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
};

export function DashboardFamilyMemberNova({
  lang,
  selectedDate,
  member,
  memberChart,
  relationLabel,
  todayItem,
  panchangam,
  bestFamilyWindow,
  relationshipParticipants,
  onBack,
  onPrev,
  onNext,
  prevName,
  nextName,
  onEdit,
  onDelete,
  deleting,
}: DashboardFamilyMemberNovaProps) {
  const [showAllPlanets, setShowAllPlanets] = useState(false);
  const [showFullDasaTimeline, setShowFullDasaTimeline] = useState(false);
  const [showAllYogas, setShowAllYogas] = useState(false);

  const chart = memberChart?.chart ?? null;
  const summary = memberChart?.summary ?? null;
  const dasha = memberChart?.dasha ?? null;
  const guidance = memberChart?.dailyGuidance ?? null;
  const transit = memberChart?.transit ?? null;
  const sani = memberChart?.sani ?? null;
  const bestWindow = guidance?.bestWindows[0] ?? null;
  const isChandrashtama = transit?.isChandrashtama ?? false;
  const insight = todayItem ? (lang === "ta" ? todayItem.highlightTa : todayItem.highlightEn) : "";

  const identityLine = chart
    ? [
        formatDateLabel(chart.birthProfile.birthDateLocal),
        chart.birthProfile.birthTimeLocal ? formatClockLabel(chart.birthProfile.birthTimeLocal) : null,
        chart.birthProfile.birthPlace,
      ].filter(Boolean).join(" · ") +
      (summary ? ` — ${summary.lagnaRasi} ${t("label_lagnam", lang)} · ${summary.moonRasi} ${t("label_janma_rasi", lang)}${summary.janmaNakshatra ? ` · ${summary.janmaNakshatra}` : ""}` : "")
    : "";

  const dasaLine = dasha
    ? `${tPlanetLord(dasha.current.mahadasha.lord, lang)} ${t("dasha_word", lang)} · ${tPlanetLord(dasha.current.antardasha.lord, lang)} ${t("bhukti_word", lang)} · ${tPlanetLord(dasha.current.pratyantardasha.lord, lang)} ${t("antaram_word", lang)}`
    : null;
  const panchangamLine = panchangam
    ? `${lang === "ta" ? "திதி" : "Tithi"} ${panchangam.tithi.number} ${tTithi(panchangam.tithi.name, lang)} · ${tYoga(panchangam.yoga.name, lang)} ${lang === "ta" ? "யோகம்" : "Yoga"}`
    : null;
  const transitLine = sani?.moonBasedCycle.isActive
    ? sani.confirmationSentence
    : isChandrashtama
      ? (lang === "ta" ? "இன்று சந்திராஷ்டமம் — கவனமாக இருக்கவும்." : "Chandrashtama today — proceed with care.")
      : (lang === "ta" ? "இன்று பெரிய கிரகநகர்வு எச்சரிக்கை இல்லை." : "No major transit caution today.");

  const upcomingMaha = dasha
    ? dasha.timeline
        .filter((p) => p.level === "maha" && p.startDate > dasha.current.mahadasha.endDate)
        .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
    : [];
  const visibleMaha = showFullDasaTimeline ? upcomingMaha : upcomingMaha.slice(0, 3);
  const elapsedPct = dasha ? dashaElapsedPct(String(dasha.current.mahadasha.startDate), String(dasha.current.mahadasha.endDate), selectedDate) : 0;

  const allPlanets = chart?.planets ?? [];
  const visiblePlanets = showAllPlanets ? allPlanets : allPlanets.slice(0, 5);
  const strongest = allPlanets
    .filter((p) => typeof p.strengthScore === "number")
    .sort((a, b) => (b.strengthScore ?? 0) - (a.strengthScore ?? 0))[0] ?? null;

  const presentYogas: ChartYogaInsight[] = (chart?.yogas ?? []).filter((y) => y.isPresent);
  const presentDoshams: ChartDoshamInsight[] = (chart?.doshams ?? []).filter((d) => d.isPresent);
  const activeCount = presentYogas.length + presentDoshams.length;
  const combinedInsights = [
    ...presentYogas.map((y) => ({
      type: "YOGA" as const,
      name: YOGA_DISPLAY[y.name] ? (lang === "ta" ? YOGA_DISPLAY[y.name]!.ta : YOGA_DISPLAY[y.name]!.en) : y.name.replaceAll("_", " "),
      desc: lang === "ta" ? y.descriptionTa : y.descriptionEn,
      cancelled: false,
    })),
    ...presentDoshams.map((d) => ({
      type: "DOSHAM" as const,
      name: d.label || d.name.replaceAll("_", " "),
      desc: lang === "ta" ? d.descriptionTa : d.descriptionEn,
      cancelled: d.isCancelled,
    })),
  ];
  const visibleInsights = showAllYogas ? combinedInsights : combinedInsights.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Breadcrumb + prev/next ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        <button type="button" onClick={onBack} style={{ color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", letterSpacing: "inherit", textTransform: "inherit", padding: 0 }}>
          {lang === "ta" ? "‹ குடும்பத்திற்குத் திரும்பு" : "‹ Back to Family"}
        </button>
        <span style={{ color: "var(--color-faint)" }}>{lang === "ta" ? "உறுப்பினர் விவரம்" : "Member profile"}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px", letterSpacing: "0.02em", textTransform: "none" }}>
          {onPrev && prevName && (
            <button type="button" onClick={onPrev} style={{ fontSize: "12px", color: "var(--color-text)", background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>
              ◄ {prevName}
            </button>
          )}
          {onNext && nextName && (
            <button type="button" onClick={onNext} style={{ fontSize: "12px", color: "var(--color-text)", background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>
              {nextName} ►
            </button>
          )}
        </div>
      </div>

      {/* ===== Member header ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <span style={{ flexShrink: 0, width: "64px", height: "64px", borderRadius: "50%", background: "var(--color-accent)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "26px", fontWeight: 700, fontFamily: "var(--font-display)" }}>
          {member.displayName.charAt(0).toUpperCase()}
        </span>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "30px", fontWeight: 600, color: "var(--color-text-strong)" }}>{member.displayName}</div>
            {relationLabel && (
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "4px 12px" }}>
                {relationLabel}
              </span>
            )}
            <button type="button" onClick={onEdit} style={{ fontSize: "11.5px", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
              {lang === "ta" ? "திருத்து" : "Edit"}
            </button>
            <button type="button" disabled={deleting} onClick={onDelete} style={{ fontSize: "11.5px", color: "var(--color-low)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline", opacity: deleting ? 0.5 : 1 }}>
              {deleting ? "…" : (lang === "ta" ? "நீக்கு" : "Remove")}
            </button>
          </div>
          {identityLine && <div style={{ fontSize: "12.5px", color: "var(--color-muted)", marginTop: "3px" }}>{identityLine}</div>}
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "14px" }}>
          {insight && (
            <div style={{ textAlign: "right", maxWidth: "220px" }}>
              <div style={{ fontSize: "10.5px", letterSpacing: "0.1em", color: "var(--color-text-accent)", textTransform: "uppercase", fontWeight: 700 }}>{lang === "ta" ? "இன்று" : "Today"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-muted)" }}>{insight}</div>
            </div>
          )}
          <NovaScoreDial score={member.individualScore} size={64} label="/100" />
        </div>
      </div>

      {/* ===== Timing strip ===== */}
      <div className="nova-grid-anticipation" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <TimingCard
          label={lang === "ta" ? "சிறந்த நேரம்" : "Best window"}
          value={bestWindow ? `${formatClockLabel(bestWindow.start)} – ${formatClockLabel(bestWindow.end)}` : "—"}
          color="var(--color-high)" borderColor="var(--color-high-border)" bgColor="var(--color-high-bg)"
        />
        <TimingCard
          label={lang === "ta" ? "ராகு காலம்" : "Rahu Kalam"}
          value={panchangam ? `${formatClockLabel(panchangam.kalam.rahuKalam.start)} – ${formatClockLabel(panchangam.kalam.rahuKalam.end)}` : "—"}
          color="var(--color-low)" borderColor="var(--color-low-border)" bgColor="var(--color-low-bg)"
        />
        <TimingCard
          label={lang === "ta" ? "நட்சத்திரம்" : "Nakshatram"}
          value={panchangam ? tNakshatra(panchangam.nakshatra.name, lang) : "—"}
          color="var(--color-accent)" borderColor="var(--color-border-strong)" bgColor="var(--color-accent-muted)"
        />
        <TimingCard
          label={lang === "ta" ? "சந்திராஷ்டமம்" : "Chandrashtamam"}
          value={isChandrashtama ? (lang === "ta" ? "உள்ளது" : "Active") : (lang === "ta" ? "இல்லை" : "None")}
          color={isChandrashtama ? "var(--color-low)" : "var(--color-high)"}
          borderColor="var(--color-border-strong)" bgColor="var(--color-accent-muted)"
        />
      </div>

      {/* ===== Charts + Guidance ===== */}
      <div className="nova-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        {chart && (
          <NovaCard>
            <NovaKicker>{lang === "ta" ? "ஜாதகங்கள்" : "Charts"}</NovaKicker>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
              <RasiChart chart={chart} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              <NavamsaChart chart={chart} label={t("label_d9", lang)} lang={lang} showExplain={false} />
            </div>
          </NovaCard>
        )}

        {guidance && (
          <NovaCard>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <NovaKicker>{lang === "ta" ? "இன்றைய வழிகாட்டுதல்" : "Today's guidance"}</NovaKicker>
              <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>{guidance.score}/100 · {guidance.label}</span>
            </div>
            <div style={{ fontSize: "13.5px", lineHeight: 1.65, color: "var(--color-text)" }}>
              {lang === "ta" ? guidance.text.ta : guidance.text.en}
            </div>
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "9px" }}>
              <NovaKicker>{lang === "ta" ? "இந்த கணிப்பு ஏன்?" : "Why this prediction?"}</NovaKicker>
              {dasaLine && (
                <div style={{ display: "flex", gap: "10px", fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-muted)" }}>
                  <span style={{ flexShrink: 0, width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", marginTop: "6px" }} />
                  <span><b style={{ color: "var(--color-text-strong)" }}>{lang === "ta" ? "தசை" : "Dasa"}</b> — {dasaLine}.</span>
                </div>
              )}
              {panchangamLine && (
                <div style={{ display: "flex", gap: "10px", fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-muted)" }}>
                  <span style={{ flexShrink: 0, width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", marginTop: "6px" }} />
                  <span><b style={{ color: "var(--color-text-strong)" }}>{lang === "ta" ? "பஞ்சாங்கம்" : "Panchangam"}</b> — {panchangamLine}.</span>
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-muted)" }}>
                <span style={{ flexShrink: 0, width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", marginTop: "6px" }} />
                <span><b style={{ color: "var(--color-text-strong)" }}>{lang === "ta" ? "கிரகநகர்வு" : "Transit"}</b> — {transitLine}</span>
              </div>
            </div>
            <div style={{ marginTop: "auto", background: "linear-gradient(135deg, var(--color-accent-muted), transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "11px", padding: "13px 15px" }}>
              <NovaKicker color="var(--color-accent-strong)">{lang === "ta" ? "பரிகாரம்" : "Remedy"}</NovaKicker>
              <div style={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--color-text)", marginTop: "4px" }}>
                {lang === "ta" ? guidance.remedy.ta : guidance.remedy.en}
              </div>
            </div>
          </NovaCard>
        )}
      </div>

      {/* ===== Dasa + Planets ===== */}
      <div className="nova-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "18px" }}>
        {dasha && (
          <NovaCard>
            <NovaKicker>{lang === "ta" ? "தசை நிலை" : "Dasa position"}</NovaKicker>
            <div style={{ display: "flex", gap: "18px" }}>
              {[
                { label: t("dasha_word", lang), lord: dasha.current.mahadasha.lord },
                { label: t("bhukti_word", lang), lord: dasha.current.antardasha.lord },
                { label: t("antaram_word", lang), lord: dasha.current.pratyantardasha.lord },
              ].map((row, i) => (
                <div key={row.label} style={i > 0 ? { borderLeft: "1px solid var(--color-border)", paddingLeft: "18px" } : undefined}>
                  <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--color-faint)", textTransform: "uppercase" }}>{row.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 600, marginTop: "2px", color: i === 2 ? "var(--color-accent-strong)" : "var(--color-text-strong)" }}>
                    {tPlanetLord(row.lord, lang)}
                  </div>
                </div>
              ))}
            </div>
            <NovaProgressBar value={elapsedPct} tone="accent" />
            <div style={{ fontSize: "11px", color: "var(--color-faint)" }}>
              {tPlanetLord(dasha.current.mahadasha.lord, lang)} {t("dasha_word", lang)} · {String(dasha.current.mahadasha.startDate).slice(0, 4)} → {String(dasha.current.mahadasha.endDate).slice(0, 4)} · {Math.round(elapsedPct)}% {lang === "ta" ? "முடிந்தது" : "elapsed"}
            </div>
            {visibleMaha.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
                {visibleMaha.map((p) => (
                  <div key={`${p.lord}-${p.startDate}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text)" }}>
                    <span>{tPlanetLord(p.lord, lang)}</span>
                    <span style={{ color: "var(--color-faint)" }}>{String(p.startDate).slice(0, 4)} – {String(p.endDate).slice(0, 4)}</span>
                  </div>
                ))}
              </div>
            )}
            {upcomingMaha.length > 3 && (
              <button type="button" onClick={() => setShowFullDasaTimeline((v) => !v)} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start" }}>
                {showFullDasaTimeline ? (lang === "ta" ? "குறை ▴" : "Show less ▴") : (lang === "ta" ? "முழு தசை காலவரிசை காண் ▾" : "Show full dasa timeline ▾")}
              </button>
            )}
          </NovaCard>
        )}

        {allPlanets.length > 0 && (
          <NovaCard>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <NovaKicker>{lang === "ta" ? "கிரக நிலை" : "Planet positions"}</NovaKicker>
              {allPlanets.length > 5 && (
                <button type="button" onClick={() => setShowAllPlanets((v) => !v)} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  {showAllPlanets ? (lang === "ta" ? "குறை ▴" : "Show less ▴") : (lang === "ta" ? `அனைத்தும் (${allPlanets.length}) & பாகைகள் ▾` : `All ${allPlanets.length} & degrees ▾`)}
                </button>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr>
                    {[
                      lang === "ta" ? "கிரகம்" : "Planet",
                      lang === "ta" ? "ராசி" : "Sign",
                      lang === "ta" ? "வீடு" : "House",
                      ...(showAllPlanets ? [lang === "ta" ? "பாகை" : "Degree"] : []),
                      lang === "ta" ? "குறிப்பு" : "Note",
                    ].map((header) => (
                      <th key={header} style={{ textAlign: "left", fontSize: "0.65625rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700, padding: "10px 12px", borderBottom: "1px solid var(--color-border-strong)", whiteSpace: "nowrap" }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePlanets.map((planet) => {
                    const isDasaLord = dasha != null && planet.graha === dasha.current.mahadasha.lord;
                    const isStrongest = strongest != null && planet.graha === strongest.graha;
                    return (
                      <tr key={planet.graha} style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-text-strong) 7%, transparent)" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: DASHA_COLORS[planet.graha] ?? "var(--color-accent-secondary)" }}>{tPlanetLord(planet.graha, lang)}</td>
                        <td style={{ padding: "10px 12px", color: "var(--color-text)" }}>{planet.rasiName}</td>
                        <td style={{ padding: "10px 12px", color: "var(--color-text)" }}>{planet.houseFromLagna}</td>
                        {showAllPlanets && <td style={{ padding: "10px 12px", color: "var(--color-text)" }}>{planet.degreeInRasi.toFixed(2)}°</td>}
                        <td style={{ padding: "10px 12px" }}>
                          {isDasaLord ? (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-accent)" }}>{lang === "ta" ? "தசாதிபதி" : "DASA LORD"}</span>
                          ) : planet.isRetrograde ? (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-low)", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "5px", padding: "2px 7px" }}>{lang === "ta" ? "வக்ரம்" : "Retro"}</span>
                          ) : isStrongest ? (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "5px", padding: "2px 7px" }}>{lang === "ta" ? "வலுவானது" : "Strongest"}</span>
                          ) : (
                            <span style={{ color: "var(--color-faint)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </NovaCard>
        )}
      </div>

      {/* ===== Yogas & Doshams + Relationships ===== */}
      <div className="nova-grid-2" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "18px" }}>
        <NovaCard>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <NovaKicker>{lang === "ta" ? "யோகங்கள் & தோஷங்கள்" : "Yogas & Doshams"}</NovaKicker>
            <span style={{ fontSize: "11px", color: "var(--color-faint)" }}>{activeCount} {lang === "ta" ? "செயலில்" : "active"}</span>
          </div>
          {combinedInsights.length === 0 ? (
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>{t("yogas_empty", lang)}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {visibleInsights.map((item, i) => {
                const isYoga = item.type === "YOGA";
                const tone = isYoga ? "high" : item.cancelled ? "mid" : "low";
                const bg = tone === "high" ? "var(--color-high-bg)" : tone === "mid" ? "var(--color-mid-bg)" : "var(--color-low-bg)";
                const border = tone === "high" ? "var(--color-high-border)" : tone === "mid" ? "var(--color-mid-border)" : "var(--color-low-border)";
                const badgeColor = tone === "high" ? "var(--color-high)" : tone === "mid" ? "var(--color-mid)" : "var(--color-low)";
                return (
                  <div key={`${item.type}-${item.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: "11px", background: bg, border: `1px solid ${border}`, borderRadius: "9px", padding: "10px 13px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-on-accent)", background: badgeColor, borderRadius: "5px", padding: "3px 8px", flexShrink: 0 }}>{item.type}</span>
                    <span style={{ fontSize: "12.5px", fontWeight: 600, flex: 1 }}>{item.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-muted)", textAlign: "right" }}>{item.desc}</span>
                  </div>
                );
              })}
            </div>
          )}
          {combinedInsights.length > 3 && (
            <button type="button" onClick={() => setShowAllYogas((v) => !v)} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start" }}>
              {showAllYogas ? (lang === "ta" ? "குறை ▴" : "Show less ▴") : (lang === "ta" ? `அனைத்தும் (${combinedInsights.length}) காண் ▾` : `Show all ${combinedInsights.length} yogas & doshams ▾`)}
            </button>
          )}
        </NovaCard>

        <NovaMemberRelationshipsCard
          lang={lang}
          viewedChartId={member.chartId}
          participants={relationshipParticipants}
          bestFamilyWindow={bestFamilyWindow}
        />
      </div>
    </div>
  );
}
