"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { readErrorMessage } from "@/lib/api";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import { verdictPhrase } from "@/lib/verdict-lexicon";
import { ConfidenceBadge } from "./dashboard-ui";
import { NavamsaChart, RasiChart } from "./dashboard-charts";
import { CompatibilityIntelligencePanel } from "./compatibility-intelligence-panel";
import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";
import { compareSynastry, compareCharts } from "@vinaadi/shared/api/relationships";
import type { Lang } from "@/lib/i18n";
import type { DirectSynastryData } from "@vinaadi/shared/api/relationships";
import type {
  ChartCalculateResponseData,
  DirectPoruthamData,
  RelationshipAlertItem,
} from "@/lib/types";

type MemberOption = { memberId: string; displayName: string; relationshipToOwner?: string };
type MemberChartOption = { memberId: string; displayName: string; chart: ChartCalculateResponseData };

type Props = {
  lang: Lang;
  chartId: string;
  familyVaultId: string;
  memberOptions: MemberOption[];
  ownerChart: ChartCalculateResponseData | null;
  memberCharts: MemberChartOption[];
  relationshipAlerts: RelationshipAlertItem[];
  alertsLoading: boolean;
};

/* ── palette helpers ─────────────────────────────────────── */
function scoreTone(score: number) {
  if (score >= 65) return { color: "var(--chart-d9-active)", bg: "var(--chart-d9-active-bg)", border: "var(--color-high-border)" };
  if (score >= 40) return { color: "var(--color-mid-text)", bg: "var(--chart-d1-lagna-bg)", border: "var(--color-mid-border)" };
  return { color: "var(--planet-saturn)", bg: "var(--color-low-bg)", border: "var(--color-low-border)" };
}

function statusTone(status: "good" | "mixed" | "caution") {
  if (status === "good")    return { color: "var(--chart-d9-active)",  bg: "var(--chart-d9-active-bg)",  border: "var(--color-high-border)" };
  if (status === "mixed")   return { color: "var(--color-mid-text)",  bg: "var(--chart-d1-lagna-bg)",  border: "var(--color-mid-border)" };
  return                           { color: "var(--planet-saturn)",  bg: "var(--color-low-bg)",  border: "var(--color-low-border)" };
}

function toneStyle(tone: string) {
  if (tone === "harmony")  return { color: "var(--chart-d9-active)",  bg: "var(--chart-d9-active-bg)",  border: "var(--color-high-border)" };
  if (tone === "tension")  return { color: "var(--planet-saturn)",  bg: "var(--color-low-bg)",  border: "var(--color-low-border)" };
  return                           { color: "var(--color-mid-text)",  bg: "var(--chart-d1-lagna-bg)",  border: "var(--color-mid-border)" };
}

function toneLabel(tone: string, lang: Lang): string {
  if (tone === "harmony")  return t("synastry_aspect_supportive", lang);
  if (tone === "tension")  return t("synastry_aspect_challenging", lang);
  return t("synastry_aspect_neutral", lang);
}

/** Backend aspect pairs look like "A_VENUS-B_MARS" (A = owner, B = the compared member) —
 *  render as readable planet names instead of the raw internal labels. */
function formatSynastryPair(pair: string): string {
  return pair
    .split("-")
    .map((token) => {
      const planet = token.replace(/^[AB]_/, "");
      return planet.charAt(0) + planet.slice(1).toLowerCase();
    })
    .join(" ↔ ");
}

type PoruthamWeight = "Low" | "Medium" | "High" | "Critical";
type PoruthamMeta = { labelEn: string; labelTa: string; checksEn: string; checksTa: string; weight: PoruthamWeight };

const PORUTHAM_META: Record<string, PoruthamMeta> = {
  "Dinam":        { labelEn: "Dinam",                       labelTa: "தினம்",                      checksEn: "Daily harmony and day-star compatibility",          checksTa: "நாள் தோறும் ஒத்திசைவு மற்றும் தின நட்சத்திர பொருத்தம்", weight: "Medium" },
  "Ganam":        { labelEn: "Ganam",                       labelTa: "கணம்",                       checksEn: "Temperament match (Deva/Manushya/Rakshasa nature)",  checksTa: "இயல்பு பொருத்தம் (தேவ/மனுஷ்ய/ராக்ஷச குணம்)",             weight: "High" },
  // Meanings below follow the classical assignments (and the Tools tab's
  // KUTA_GOVERNS): Mahendra governs progeny/lineage and Stree Dirgham the
  // bride's long-term prosperity — longevity of the bond is Rajju's domain.
  // The earlier "longevity" wording on both rows was off (2026-07 audit).
  "Mahendra":     { labelEn: "Mahendra",                    labelTa: "மகேந்திரம்",                checksEn: "Progeny, lineage and protective support",            checksTa: "சந்ததி வளர்ச்சி மற்றும் பாதுகாப்பு ஆதரவு",               weight: "High" },
  "Stree Dirgha": { labelEn: "Stree Dheergam",              labelTa: "ஸ்த்ரீ தீர்கம்",           checksEn: "The bride's long-term prosperity and wellbeing",     checksTa: "மணமகளின் நீண்டகால செழுமை மற்றும் நலன்",                  weight: "High" },
  "Yoni":         { labelEn: "Yoni",                        labelTa: "யோனி",                       checksEn: "Physical and emotional intimacy compatibility",      checksTa: "உடல்/உணர்வு நெருக்கம் பொருத்தம்",                        weight: "Medium" },
  "Rasi":         { labelEn: "Rasi",                        labelTa: "ராசி",                       checksEn: "General sign-level compatibility",                   checksTa: "பொதுவான ராசி அடிப்படையிலான பொருத்தம்",                   weight: "High" },
  "Graha Maitri": { labelEn: "Rasiyathipam (Graha Maitri)", labelTa: "ராசியதிபதி (கிரக மைத்திரி)", checksEn: "Rasi-lord friendship and mutual support",           checksTa: "ராசி அதிபதிகளின் நட்பு மற்றும் ஒத்துழைப்பு",              weight: "Medium" },
  "Vedha":        { labelEn: "Vedha",                       labelTa: "வேதம்",                      checksEn: "Traditional obstruction pair check",                 checksTa: "பாரம்பரிய தடுப்பு ஜோடி சோதனை",                           weight: "Critical" },
  "Vasya":        { labelEn: "Vasya",                       labelTa: "வாஸ்யம்",                    checksEn: "Mutual attraction/influence dynamics",               checksTa: "பரஸ்பர ஈர்ப்பு/செல்வாக்கு இயக்கம்",                     weight: "Low" },
  "Rajju":        { labelEn: "Rajju",                       labelTa: "ரஜ்ஜு",                      checksEn: "Traditional marital longevity risk marker",          checksTa: "பாரம்பரிய திருமண நீட்சி ஆபத்து குறியீடு",                weight: "Critical" },
};

function getPoruthamMeta(name: string, nameTa: string, context: string): PoruthamMeta {
  const fallback: PoruthamMeta = {
    labelEn: name,
    labelTa: nameTa,
    checksEn: "Compatibility signal",
    checksTa: "பொருத்தம் குறியீடு",
    weight: "Medium",
  };
  const base = PORUTHAM_META[name] ?? fallback;
  if (context === "MARRIAGE") return base;

  const contextualChecksEn: Record<string, Partial<Record<string, string>>> = {
    FRIENDSHIP: {
      Dinam: "Day-to-day rhythm and comfort in regular interaction",
      Ganam: "Temperament match and social chemistry",
      Rasi: "General compatibility pattern",
      "Graha Maitri": "Mutual support and understanding",
      Vedha: "Potential friction-trigger check",
    },
    BUSINESS: {
      Ganam: "Working-style and decision-temperament alignment",
      Mahendra: "Long-term growth and continuity potential",
      Rasi: "General partnership compatibility pattern",
      "Graha Maitri": "Leadership and communication compatibility",
      Vasya: "Influence balance and collaboration dynamics",
    },
    FAMILY: {
      Rasi: "Overall emotional harmony pattern",
      Ganam: "Temperament fit within family life",
      Vedha: "Potential conflict-trigger check",
      Vasya: "Cooperation and mutual support dynamics",
      "Graha Maitri": "Understanding and guidance support",
    },
    GENERAL: {
      Dinam: "Day-to-day rhythm compatibility",
      Ganam: "Temperament compatibility",
      Rasi: "General compatibility pattern",
      "Graha Maitri": "Mutual support signal",
    },
  };

  return {
    ...base,
    checksEn: contextualChecksEn[context]?.[name] ?? base.checksEn,
  };
}

function weightLabel(weight: PoruthamWeight, lang: Lang): string {
  if (lang === "ta") {
    if (weight === "Critical") return "முக்கியம்";
    if (weight === "High")     return "உயர்";
    if (weight === "Medium")   return "நடுத்தரம்";
    return "குறைந்த";
  }
  return weight;
}

function weightTone(weight: PoruthamWeight) {
  if (weight === "Critical") return { color: "var(--planet-saturn)", bg: "var(--color-low-bg)",  border: "var(--color-low-border)" };
  if (weight === "High")     return { color: "var(--color-mid-text)", bg: "var(--chart-d1-lagna-bg)",  border: "var(--color-mid-border)" };
  if (weight === "Medium")   return { color: "var(--color-muted)", bg: "var(--color-surface-2)",  border: "var(--color-border)" };
  return                            { color: "var(--color-faint)", bg: "var(--color-surface-2)",  border: "var(--color-border)" };
}

function scoreStatusOf(score: number, max: number): "good" | "mixed" | "caution" {
  const p = max > 0 ? score / max : 0;
  if (p >= 0.7) return "good";
  if (p >= 0.4) return "mixed";
  return "caution";
}

function defaultContextForRelationship(relationship: string | undefined): string {
  switch (relationship) {
    case "spouse":      return "MARRIAGE";
    case "child":
    case "parent":
    case "sibling":
    case "grandparent": return "FAMILY";
    case "other":       return "FRIENDSHIP";
    default:            return "GENERAL";
  }
}

/* ── Pill button ─────────────────────────────────────────── */
function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "var(--space-1) var(--space-3_5)", borderRadius: "var(--radius-pill)", border: "1.5px solid",
        borderColor: active ? "var(--color-text-strong)" : "var(--color-border)",
        background: active ? "var(--color-text-strong)" : "transparent",
        color: active ? "var(--color-on-accent)" : "var(--color-faint)",
        fontSize: "var(--text-base)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        transition: "all 150ms ease",
      }}
    >
      {children}
    </button>
  );
}

/* ── Score ring (small) ──────────────────────────────────── */
function SmallScoreRing({ score }: { score: number }) {
  const size = 72; const r = 28; const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const { color } = scoreTone(score);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`} transform="rotate(-90 36 36)" />
      <text x={36} y={37} textAnchor="middle" dominantBaseline="middle"
        fontFamily="var(--font-display)" fontSize="1.125rem" fontWeight="500" fill={color}>{score}</text>
    </svg>
  );
}

/* ── Chart comparison card ───────────────────────────────── */
function ChartComparisonCard({
  lang, ownerChart, memberChart, view,
}: {
  lang: Lang;
  ownerChart: ChartCalculateResponseData | null;
  memberChart: ChartCalculateResponseData | null;
  view: "D1" | "D9";
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: "var(--space-3)" }}>
      {[
        { chart: ownerChart,   fallbackName: lang === "ta" ? "நீங்கள்" : "You" },
        { chart: memberChart,  fallbackName: lang === "ta" ? "உறுப்பினர்" : "Member" },
      ].map(({ chart, fallbackName }) => (
        <div key={fallbackName} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3_5)", background: "var(--color-surface-2)" }}>
          <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
            {chart?.birthProfile.displayName ?? fallbackName}
          </p>
          <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
            {chart?.birthProfile.birthDateLocal ?? (lang === "ta" ? "பிறந்த தேதி இல்லை" : "DOB unavailable")}
          </p>
          {chart ? (
            view === "D1"
              ? <RasiChart chart={chart} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              : <NavamsaChart chart={chart} label={t("label_d9", lang)} lang={lang} showExplain={false} />
          ) : (
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
              {lang === "ta" ? "ஜாதகம் ஏற்றப்படவில்லை" : "Chart not loaded yet"}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function SynastryPanel({
  lang,
  chartId,
  familyVaultId,
  memberOptions,
  ownerChart,
  memberCharts,
  relationshipAlerts,
  alertsLoading,
}: Props) {
  const [subTab, setSubTab] = useState<"compatibility" | "porutham" | "alerts">("compatibility");

  /* Compatibility state */
  const [compatMemberId, setCompatMemberId]     = useState("");
  const [synastry, setSynastry]                 = useState<DirectSynastryData | null>(null);
  const [compatLoading, setCompatLoading]       = useState(false);
  const [compatError, setCompatError]           = useState("");
  const [kattamView, setKattamView]             = useState<"D1" | "D9">("D1");

  /* Porutham state */
  const [poruthamMemberId, setPoruthamMemberId] = useState("");
  const [porutham, setPorutham]                 = useState<DirectPoruthamData | null>(null);
  const [poruthamLoading, setPoruthamLoading]   = useState(false);
  const [poruthamError, setPoruthamError]       = useState("");
  const [poruthamContext, setPoruthamContext]   = useState("GENERAL");
  const [poruthamPdfBusy, setPoruthamPdfBusy]   = useState(false);
  const [showCiReport, setShowCiReport]         = useState(false);

  const compatMemberChart = memberCharts.find((m) => m.memberId === compatMemberId)?.chart ?? null;
  const poruthamMemberChart = memberCharts.find((m) => m.memberId === poruthamMemberId)?.chart ?? null;

  // Pin both scores to the SAME two charts the rest of the dashboard shows —
  // the owner's active chart (this panel's `chartId`) and the member's loaded
  // chart — via the direct compare endpoints. The older per-member vault
  // endpoints resolved "the owner's chart" a different way (the "self"
  // family-member's latest chart), so the same pair could score e.g. 43 here and
  // 54 in the Family-bonds card. Routing every surface through the pinned charts
  // makes a given pair show one consistent number everywhere.
  const ownerChartId = ownerChart?.chartId ?? chartId;

  async function loadSynastry(memberId: string) {
    const memberChart = memberCharts.find((m) => m.memberId === memberId)?.chart ?? null;
    if (!memberId || !ownerChartId || !memberChart) return;
    setCompatMemberId(memberId);
    setSynastry(null);
    setCompatError("");
    setCompatLoading(true);
    try {
      const r = await compareSynastry(ownerChartId, memberChart.chartId);
      setSynastry(r.data);
    } catch (err) {
      setCompatError(readErrorMessage(err));
    } finally {
      setCompatLoading(false);
    }
  }

  async function loadPorutham(memberId: string, context: string) {
    const memberChart = memberCharts.find((m) => m.memberId === memberId)?.chart ?? null;
    if (!memberId || !ownerChartId || !memberChart) return;
    setPoruthamMemberId(memberId);
    setPorutham(null);
    setPoruthamError("");
    setShowCiReport(false);
    setPoruthamLoading(true);
    try {
      const r = await compareCharts(ownerChartId, memberChart.chartId, context);
      setPorutham(r.data);
    } catch (err) {
      setPoruthamError(readErrorMessage(err));
    } finally {
      setPoruthamLoading(false);
    }
  }

  async function downloadPoruthamPdf() {
    if (!porutham || !ownerChart || !poruthamMemberChart || poruthamPdfBusy) return;
    setPoruthamPdfBusy(true);
    setPoruthamError("");
    try {
      const response = await fetch(`/api/backend/api/v1/relationships/compare/pdf?lang=${lang}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
        body: JSON.stringify({
          chartIdA: ownerChart.chartId,
          chartIdB: poruthamMemberChart.chartId,
          compatibilityContext: poruthamContext,
        }),
      });
      if (!response.ok) throw new Error(`${response.status}: PDF export failed`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `porutham_${ownerChart.birthProfile.displayName}_${poruthamMemberChart.birthProfile.displayName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPoruthamError(readErrorMessage(err));
    } finally {
      setPoruthamPdfBusy(false);
    }
  }

  const SUB_TABS: { key: "compatibility" | "porutham" | "alerts"; label: string }[] = [
    { key: "compatibility", label: t("synastry_panel_title", lang) },
    { key: "porutham",      label: lang === "ta" ? "பொருத்தம்" : "Porutham" },
    { key: "alerts",        label: t("rel_alerts_title", lang) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* Header */}
      <div>
        <p className="cd-kicker">
          {t("synastry_panel_title", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
          {t("synastry_panel_desc", lang)}
        </p>
      </div>

      {/* Sub-tab switcher */}
      <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
        {SUB_TABS.map(({ key, label }) => (
          <Pill key={key} active={subTab === key} onClick={() => setSubTab(key)}>{label}</Pill>
        ))}
      </div>

      {/* ── Compatibility ── */}
      {subTab === "compatibility" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {memberOptions.length === 0 ? (
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("synastry_no_vault", lang)}</p>
          ) : (
            <>
              {/* Member pills */}
              <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                {memberOptions.map((m) => (
                  <Pill key={m.memberId} active={compatMemberId === m.memberId}
                    onClick={() => void loadSynastry(m.memberId)}>
                    {m.displayName}
                  </Pill>
                ))}
              </div>

              {!compatMemberId && (
                <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("synastry_select_member", lang)}</p>
              )}
              {compatLoading && (
                <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("synastry_loading", lang)}</p>
              )}

              {compatError && (
                <Card variant="low" style={{ display: "block", padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)" }}>
                  <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--planet-saturn)" }}>
                    {lang === "ta" ? "இணக்கம் ஏற்றல் தோல்வி" : "Could not load compatibility"}
                  </p>
                  <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "var(--text-sm)", color: "var(--planet-saturn)" }}>{compatError}</p>
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.5 }}>
                    {lang === "ta"
                      ? "குடும்ப உறுப்பினரின் ஜாதகம் கணக்கிடப்படவில்லை இருக்கலாம்."
                      : "The family member's chart may not be calculated yet. Edit member -> Recalculate, then try again."}
                  </p>
                </Card>
              )}

              {synastry && !compatLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

                  {/* Score card */}
                  <div style={{ background: "var(--chart-cell-default)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-5)", display: "flex", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)", flexShrink: 0 }}>
                      <SmallScoreRing score={synastry.score} />
                      <span style={{
                        padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "var(--text-sm)", fontWeight: 600, textAlign: "center",
                        background: scoreTone(synastry.score).bg,
                        color: scoreTone(synastry.score).color,
                        border: `1px solid ${scoreTone(synastry.score).border}`,
                      }}>
                        {synastry.label}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <p className="cd-kicker" style={{ letterSpacing: "0.1em" }}>
                        {t("synastry_summary", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                        {tLang(synastry.summary, lang)}
                      </p>
                      <div style={{ marginTop: "var(--space-2)" }}>
                        <ConfidenceBadge
                          level={synastry.score >= 70 ? "HIGH" : synastry.score >= 45 ? "MEDIUM" : "LOW"}
                          reason={{
                            ta: synastry.score >= 70 ? "வலிமையான ஜாதக பொருத்தம்" : synastry.score >= 45 ? "மிதமான ஜாதக பொருத்தம்" : "கலந்த ஜாதக சமிக்ஞைகள்",
                            en: synastry.score >= 70 ? "Strong chart compatibility" : synastry.score >= 45 ? "Moderate chart compatibility" : "Mixed chart signals",
                          }}
                          lang={lang}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Caution — tension-tone aspects called out */}
                  {synastry.tensionNotes.length > 0 && (
                    <Card variant="low" style={{ display: "block", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)" }}>
                      <p className="cd-kicker" style={{ color: "var(--planet-saturn)", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden="true"><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                        {t("synastry_caution", lang)}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                        {synastry.tensionNotes.map((note, i) => (
                          <p key={i} style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--planet-saturn)", lineHeight: 1.5 }}>
                            {tLang(note, lang)}
                          </p>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Chart comparison */}
                  <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                      <p className="cd-kicker--inline" style={{ letterSpacing: "0.1em" }}>
                        {lang === "ta" ? "இரு ஜாதக கட்ட ஒப்பீடு" : "Chart Comparison"}
                      </p>
                      <div style={{ display: "flex", gap: "var(--space-1_5)" }}>
                        {(["D1", "D9"] as const).map((v) => (
                          <Pill key={v} active={kattamView === v} onClick={() => setKattamView(v)}>{t(`label_${v.toLowerCase()}` as Parameters<typeof t>[0], lang)}</Pill>
                        ))}
                      </div>
                    </div>
                    <ChartComparisonCard lang={lang} ownerChart={ownerChart} memberChart={compatMemberChart} view={kattamView} />
                  </div>

                  {/* Aspects */}
                  {synastry.keyAspects.length > 0 && (
                    <div>
                      <p className="cd-kicker" style={{ marginBottom: "var(--space-2_5)", letterSpacing: "0.1em" }}>
                        {t("synastry_aspects", lang)}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {synastry.keyAspects.map((a, i) => {
                          const ts = toneStyle(a.tone);
                          return (
                            <div key={i} style={{
                              display: "flex", gap: "var(--space-3)", alignItems: "flex-start",
                              padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-md)",
                              background: "var(--chart-cell-default)", border: `1px solid ${ts.border}`,
                            }}>
                              <span style={{
                                fontSize: "var(--text-2xs)", fontWeight: 700, color: ts.color,
                                border: `1px solid ${ts.border}`, borderRadius: "var(--radius-sm)",
                                padding: "var(--space-0_5) var(--space-1_5)", whiteSpace: "nowrap", marginTop: "var(--space-0_5)", flexShrink: 0,
                                background: ts.bg,
                              }}>
                                {toneLabel(a.tone, lang)}
                              </span>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                                  {formatSynastryPair(a.pair)} · {a.aspect}
                                  <span style={{ fontWeight: 400, color: "var(--color-faint)", marginLeft: "var(--space-1_5)", fontSize: "var(--text-sm)" }}>
                                    {a.orbDegrees.toFixed(1)}°
                                  </span>
                                </p>
                                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.45 }}>
                                  {tLang(a.note, lang)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Timing indicators */}
                  {(synastry.timingIndicators ?? []).length > 0 && (
                    <div style={{ padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)", background: "var(--chart-d1-lagna-bg)", border: "1px solid var(--color-mid-border)" }}>
                      <p className="cd-kicker" style={{ marginBottom: "var(--space-2_5)", letterSpacing: "0.1em", color: "var(--color-mid-text)" }}>
                        {t("synastry_timing", lang)}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {(synastry.timingIndicators ?? []).map((ti, i) => (
                          <div key={i} style={{ display: "flex", gap: "var(--space-2_5)", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-mid-text)", minWidth: "54px", paddingTop: "var(--space-0_5)" }}>
                              {tPlanetLord(ti.planet, lang)}
                            </span>
                            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.45 }}>
                              {tLang(ti.description, lang)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Porutham ── */}
      {subTab === "porutham" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {memberOptions.length === 0 ? (
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>
              {lang === "ta" ? "குடும்ப உறுப்பினர்கள் இல்லை." : "No family members available."}
            </p>
          ) : (
            <>
              {/* Context selector */}
              {(() => {
                const rel = memberOptions.find((m) => m.memberId === poruthamMemberId)?.relationshipToOwner;
                const familyRels = new Set(["parent", "child", "sibling", "grandparent"]);
                const hiddenCtx = familyRels.has(rel ?? "") ? new Set(["MARRIAGE"]) : new Set<string>();
                return (
                  <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", alignItems: "center" }}>
                    <Kicker color="var(--color-faint)" style={{ fontSize: "var(--text-2xs)", letterSpacing: "0.1em" }}>
                      {lang === "ta" ? "பொருத்த வகை" : "Context"}
                    </Kicker>
                    {(["GENERAL", "MARRIAGE", "FRIENDSHIP", "BUSINESS", "FAMILY"] as const)
                      .filter((ctx) => !hiddenCtx.has(ctx))
                      .map((ctx) => {
                        const label = ctx === "GENERAL" ? (lang === "ta" ? "பொதுவான" : "General")
                          : ctx === "MARRIAGE"    ? (lang === "ta" ? "திருமணம்" : "Marriage")
                          : ctx === "FRIENDSHIP"  ? (lang === "ta" ? "நட்பு" : "Friendship")
                          : ctx === "BUSINESS"    ? (lang === "ta" ? "தொழில்" : "Business")
                          : (lang === "ta" ? "குடும்பம்" : "Family");
                        return (
                          <Pill key={ctx} active={poruthamContext === ctx}
                            onClick={() => { setPoruthamContext(ctx); if (poruthamMemberId) void loadPorutham(poruthamMemberId, ctx); }}>
                            {label}
                          </Pill>
                        );
                      })}
                  </div>
                );
              })()}

              {/* Member selector */}
              <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                {memberOptions.map((m) => (
                  <Pill key={m.memberId} active={poruthamMemberId === m.memberId}
                    onClick={() => {
                      const ctx = defaultContextForRelationship(m.relationshipToOwner);
                      setPoruthamContext(ctx);
                      void loadPorutham(m.memberId, ctx);
                    }}>
                    {m.displayName}
                    {m.relationshipToOwner && m.relationshipToOwner !== "other" && (
                      <span style={{ fontSize: "var(--text-2xs)", marginLeft: "var(--space-1)", opacity: 0.65 }}>· {m.relationshipToOwner}</span>
                    )}
                  </Pill>
                ))}
              </div>

              {poruthamLoading && <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</p>}
              {poruthamError && <p style={{ fontSize: "var(--text-base)", color: "var(--planet-saturn)" }}>{poruthamError}</p>}

              {porutham && !poruthamLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

                  {/* Marriage chart comparison */}
                  {poruthamContext === "MARRIAGE" && (
                    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                      <p className="cd-kicker" style={{ marginBottom: "var(--space-3)", letterSpacing: "0.1em" }}>
                        {lang === "ta" ? "திருமண ஜாதக கட்ட ஒப்பீடு (D1)" : "Marriage Chart Comparison (D1)"}
                      </p>
                      <ChartComparisonCard lang={lang} ownerChart={ownerChart} memberChart={poruthamMemberChart} view="D1" />
                    </div>
                  )}

                  {/* Context note */}
                  {porutham.contextNote && (
                    <div style={{ padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-md)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                      <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)", lineHeight: 1.5 }}>
                        {lang === "ta" ? porutham.contextNote.ta : porutham.contextNote.en}
                      </p>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <button
                      type="button"
                      onClick={() => void downloadPoruthamPdf()}
                      disabled={poruthamPdfBusy || !ownerChart || !poruthamMemberChart}
                      style={{
                        padding: "var(--space-1_5) var(--space-3_5)",
                        borderRadius: "var(--radius-pill)",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-2)",
                        color: poruthamPdfBusy ? "var(--color-faint)" : "var(--color-text)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 700,
                        cursor: poruthamPdfBusy ? "wait" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {poruthamPdfBusy
                        ? (lang === "ta" ? "PDF பதிவிறக்குகிறது…" : "Downloading PDF…")
                        : (lang === "ta" ? "PDF பதிவிறக்கம்" : "Download PDF")}
                    </button>
                  </div>

                  {/* Total score */}
                  <div style={{ background: "var(--chart-cell-default)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-5)", display: "flex", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
                    <div style={{ flexShrink: 0 }}>
                      <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--display-lg)", fontWeight: 500, lineHeight: 1, color: "var(--color-text-strong)" }}>
                        {porutham.totalScore}
                        <span style={{ fontSize: "var(--text-lg)", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>/{porutham.maxScore}</span>
                      </p>
                      <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
                        {(verdictPhrase("porutham", porutham.label, lang) ?? porutham.label)} · {porutham.percentage.toFixed(0)}%
                      </p>
                      {(porutham.rajjuDosha || porutham.vedhaDosha) && (
                        <div style={{ marginTop: "var(--space-2)", display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                          {porutham.rajjuDosha && (
                            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: "var(--color-low-bg)", color: "var(--planet-saturn)", border: "1px solid var(--color-low-border)" }}>
                              <svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                              {lang === "ta" ? "ராஜ்ஜு தோஷம்" : "Rajju Dosha"}
                            </span>
                          )}
                          {porutham.vedhaDosha && (
                            <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: "var(--color-low-bg)", color: "var(--planet-saturn)", border: "1px solid var(--color-low-border)" }}>
                              <svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                              {lang === "ta" ? "வேதா தோஷம்" : "Vedha Dosha"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", lineHeight: 1.55 }}>
                        {lang === "ta" ? porutham.summary.ta : porutham.summary.en}
                      </p>
                    </div>
                  </div>

                  {/* 10-kuta rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    {porutham.kutas.map((k) => {
                      const meta = getPoruthamMeta(k.name, k.nameTa, poruthamContext);
                      const status = scoreStatusOf(k.score, k.maxScore);
                      const stTone = statusTone(status);
                      const wtTone = weightTone(meta.weight);
                      const isCriticalFail =
                        (k.name === "Rajju" && porutham.rajjuDosha) ||
                        (k.name === "Vedha" && porutham.vedhaDosha);
                      const barPct = Math.max(0, Math.min(100, k.maxScore > 0 ? (k.score / k.maxScore) * 100 : 0));

                      return (
                        <div key={k.name} style={{
                          padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)",
                          background: isCriticalFail ? "var(--color-low-bg)" : "var(--chart-cell-default)",
                          border: `1px solid ${isCriticalFail ? "var(--color-low-border)" : "var(--color-border)"}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2_5)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                                {lang === "ta" ? meta.labelTa : meta.labelEn}
                              </p>
                              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.35 }}>
                                {lang === "ta" ? meta.checksTa : meta.checksEn}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
                              <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: wtTone.bg, color: wtTone.color, border: `1px solid ${wtTone.border}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {weightLabel(meta.weight, lang)}
                              </span>
                              <span style={{ fontSize: "var(--text-2xs)", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: stTone.bg, color: stTone.color, border: `1px solid ${stTone.border}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {lang === "ta" ? (status === "good" ? "நல்லது" : status === "mixed" ? "கலப்பு" : "கவனம்") : (status === "good" ? "Good" : status === "mixed" ? "Mixed" : "Caution")}
                              </span>
                              <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)", fontFamily: "var(--font-mono)" }}>
                                {k.score}/{k.maxScore}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ width: "100%", height: "5px", borderRadius: "var(--radius-sm)", background: "var(--color-border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "var(--radius-sm)", width: `${barPct}%`, background: stTone.color, transition: "width 400ms ease" }} />
                          </div>

                          {isCriticalFail && (
                            <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)", color: "var(--planet-saturn)", lineHeight: 1.4 }}>
                              {k.name === "Rajju"
                                ? (lang === "ta" ? "ரஜ்ஜு தோஷம் கண்டறியப்பட்டுள்ளது. பாரம்பரியமாக இது முக்கிய கவனிக்க வேண்டிய குறியீடு." : "Rajju dosha is active. Traditionally this is treated as a critical caution signal.")
                                : (lang === "ta" ? "வேத தோஷம் கண்டறியப்பட்டுள்ளது. பாரம்பரியமாக இது தடுப்பு ஜோடி குறியீடாக கருதப்படுகிறது." : "Vedha dosha is active. Traditionally this indicates an obstruction-pair caution.")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Analysis (Compatibility Intelligence) — premium feature */}
                  {poruthamContext === "MARRIAGE" && (
                    <div style={{ marginTop: "var(--space-2)" }}>
                      {!showCiReport ? (
                        <Card variant="high" style={{
                          borderRadius: "var(--radius-md)", padding: "var(--space-4) var(--space-5)",
                          display: "flex", flexDirection: "row", gap: "var(--space-4)", alignItems: "center", flexWrap: "wrap",
                        }}>
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <p style={{ margin: "0 0 var(--space-1)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text-strong)" }}>
                              {lang === "ta" ? "இணக்க நுண்ணறிவு அறிக்கை" : "Full Compatibility Intelligence Report"}
                            </p>
                            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.55 }}>
                              {lang === "ta"
                                ? "7ஆம் இடம் · நவாம்சம் · தசை இணக்கம் · செவ்வாய் தோஷம் · உணர்வு இணக்கம் · ஒட்டுமொத்த மதிப்பெண் (0–100) உள்ளிட்ட 8 அடுக்கு ஆழமான பகுப்பாய்வு"
                                : "8-level deep analysis: 7th house · Navamsa · Dasha timing · Sevvai Dosham · Emotional compatibility · Overall score 0–100"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCiReport(true)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
                              padding: "var(--space-2) var(--space-5)",
                              background: "var(--color-text-strong)", color: "var(--color-surface-2)",
                              border: "none", borderRadius: "var(--radius-pill)", fontFamily: "inherit",
                              fontSize: "var(--text-base)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                            }}
                          >
                            {lang === "ta" ? "முழு அறிக்கை காண்க" : "View Full Report"}<ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </Card>
                      ) : (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "var(--text-base)", color: "var(--color-text-strong)" }}>
                              {lang === "ta" ? "இணக்க நுண்ணறிவு அறிக்கை" : "Compatibility Intelligence Report"}
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowCiReport(false)}
                              style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)", cursor: "pointer", fontFamily: "inherit" }}
                            >
                              {lang === "ta" ? "மறை" : "Hide"}
                            </button>
                          </div>
                          <CompatibilityIntelligencePanel
                            familyVaultId={familyVaultId}
                            memberId={poruthamMemberId}
                            chartIdA={ownerChart?.chartId}
                            lang={lang}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Alerts ── */}
      {subTab === "alerts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          {alertsLoading ? (
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("rel_alerts_loading", lang)}</p>
          ) : relationshipAlerts.length === 0 ? (
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("rel_alerts_empty", lang)}</p>
          ) : (
            relationshipAlerts.map((alert) => {
              const dayLabel =
                alert.daysFromToday === 0 ? t("alert_today", lang)
                : alert.daysFromToday === 1 ? t("alert_tomorrow", lang)
                : `${alert.daysFromToday} ${t("alert_days_away", lang)}`;
              return (
                <div key={alert.alertId} style={{
                  padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)",
                  background: "var(--chart-cell-default)", border: "1px solid var(--color-border)",
                }}>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap", marginBottom: "var(--space-1_5)" }}>
                    <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                      {alert.memberName}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>
                      {tLang(alert.title, lang)}
                    </span>
                    <span style={{ fontSize: "var(--text-2xs)", padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: "var(--color-surface-2)", border: "1px solid var(--color-border)", color: "var(--color-faint)" }}>
                      {dayLabel}
                    </span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-faint)" }}>
                      sig: {alert.significanceScore}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-faint)", lineHeight: 1.5 }}>
                    {tLang(alert.message, lang)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
