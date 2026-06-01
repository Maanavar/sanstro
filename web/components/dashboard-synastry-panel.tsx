"use client";

import React, { useState } from "react";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { t, tLang, tPlanetLord } from "@/lib/i18n";
import { ConfidenceBadge } from "./dashboard-ui";
import { NavamsaChart, RasiChart } from "./dashboard-charts";
import type { Lang } from "@/lib/i18n";
import type {
  ApiEnvelope,
  ChartCalculateResponseData,
  SynastryData,
  PorutthamData,
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
  if (score >= 65) return { color: "#5C7654", bg: "#DCE4D2", border: "rgba(92,118,84,0.3)" };
  if (score >= 40) return { color: "#B85A2C", bg: "#F0D9C4", border: "rgba(184,90,44,0.3)" };
  return { color: "#A8482F", bg: "#F2D8CC", border: "rgba(168,72,47,0.3)" };
}

function statusTone(status: "good" | "mixed" | "caution") {
  if (status === "good")    return { color: "#5C7654",  bg: "#DCE4D2",  border: "rgba(92,118,84,0.35)" };
  if (status === "mixed")   return { color: "#B85A2C",  bg: "#F0D9C4",  border: "rgba(184,90,44,0.3)" };
  return                           { color: "#A8482F",  bg: "#F2D8CC",  border: "rgba(168,72,47,0.3)" };
}

function toneStyle(tone: string) {
  if (tone === "supportive")  return { color: "#5C7654",  bg: "#DCE4D2",  border: "rgba(92,118,84,0.35)" };
  if (tone === "challenging") return { color: "#A8482F",  bg: "#F2D8CC",  border: "rgba(168,72,47,0.3)" };
  return                             { color: "#B85A2C",  bg: "#F0D9C4",  border: "rgba(184,90,44,0.3)" };
}

function toneLabel(tone: string, lang: Lang): string {
  if (tone === "supportive")  return t("synastry_aspect_supportive", lang);
  if (tone === "challenging") return t("synastry_aspect_challenging", lang);
  return t("synastry_aspect_neutral", lang);
}

type PoruthamWeight = "Low" | "Medium" | "High" | "Critical";
type PoruthamMeta = { labelEn: string; labelTa: string; checksEn: string; checksTa: string; weight: PoruthamWeight };

const PORUTHAM_META: Record<string, PoruthamMeta> = {
  "Dinam":        { labelEn: "Dinam",                       labelTa: "தினம்",                      checksEn: "Daily harmony and day-star compatibility",          checksTa: "நாள் தோறும் ஒத்திசைவு மற்றும் தின நட்சத்திர பொருத்தம்", weight: "Medium" },
  "Ganam":        { labelEn: "Ganam",                       labelTa: "கணம்",                       checksEn: "Temperament match (Deva/Manushya/Rakshasa nature)",  checksTa: "இயல்பு பொருத்தம் (தேவ/மனுஷ்ய/ராக்ஷச குணம்)",             weight: "High" },
  "Mahendra":     { labelEn: "Mahendra",                    labelTa: "மகேந்திரம்",                checksEn: "Longevity and prosperity support",                   checksTa: "இணை வாழ்க்கை நீட்சி மற்றும் வளர்ச்சி ஆதரம்",            weight: "High" },
  "Stree Dirgha": { labelEn: "Stree Dheergam",              labelTa: "ஸ்த்ரீ தீர்கம்",           checksEn: "Traditional spouse longevity indication",            checksTa: "பாரம்பரியமாக துணைவர் ஆயுள் குறியீடு",                     weight: "High" },
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
  if (weight === "Critical") return { color: "#A8482F", bg: "#F2D8CC",  border: "rgba(168,72,47,0.3)" };
  if (weight === "High")     return { color: "#B85A2C", bg: "#F0D9C4",  border: "rgba(184,90,44,0.3)" };
  if (weight === "Medium")   return { color: "#5a4f42", bg: "#FAF5EA",  border: "#E4DBC8" };
  return                            { color: "var(--color-faint)", bg: "#FAF5EA",  border: "#E4DBC8" };
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
        borderColor: active ? "#1A1612" : "#D4C8AE",
        background: active ? "#1A1612" : "transparent",
        color: active ? "#F4EEE2" : "#7A6F5E",
        fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
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
      <circle cx={36} cy={36} r={r} fill="none" stroke="#E4DBC8" strokeWidth="6" />
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
        <div key={fallbackName} style={{ border: "1px solid #E4DBC8", borderRadius: "var(--radius-md)", padding: "var(--space-3_5)", background: "#FAF5EA" }}>
          <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.875rem", fontWeight: 700, color: "#1A1612" }}>
            {chart?.birthProfile.displayName ?? fallbackName}
          </p>
          <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.75rem", color: "var(--color-faint)" }}>
            {chart?.birthProfile.birthDateLocal ?? (lang === "ta" ? "பிறந்த தேதி இல்லை" : "DOB unavailable")}
          </p>
          {chart ? (
            view === "D1"
              ? <RasiChart chart={chart} label={t("label_d1", lang)} lang={lang} showExplain={false} />
              : <NavamsaChart chart={chart} label={t("label_d9", lang)} lang={lang} showExplain={false} />
          ) : (
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-faint)" }}>
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
  const [synastry, setSynastry]                 = useState<SynastryData | null>(null);
  const [compatLoading, setCompatLoading]       = useState(false);
  const [compatError, setCompatError]           = useState("");
  const [kattamView, setKattamView]             = useState<"D1" | "D9">("D1");

  /* Porutham state */
  const [poruthamMemberId, setPoruthamMemberId] = useState("");
  const [porutham, setPorutham]                 = useState<PorutthamData | null>(null);
  const [poruthamLoading, setPoruthamLoading]   = useState(false);
  const [poruthamError, setPoruthamError]       = useState("");
  const [poruthamContext, setPoruthamContext]   = useState("GENERAL");
  const [poruthamPdfBusy, setPoruthamPdfBusy]   = useState(false);

  const compatMemberChart = memberCharts.find((m) => m.memberId === compatMemberId)?.chart ?? null;
  const poruthamMemberChart = memberCharts.find((m) => m.memberId === poruthamMemberId)?.chart ?? null;

  async function loadSynastry(memberId: string) {
    if (!memberId || !chartId) return;
    setCompatMemberId(memberId);
    setSynastry(null);
    setCompatError("");
    setCompatLoading(true);
    try {
      const r = await apiFetchJson<ApiEnvelope<SynastryData>>(
        `/api/v1/relationships/${memberId}/synastry${toQuery({ familyVaultId })}`
      );
      setSynastry(r.data);
    } catch (err) {
      setCompatError(readErrorMessage(err));
    } finally {
      setCompatLoading(false);
    }
  }

  async function loadPorutham(memberId: string, context: string) {
    if (!memberId || !familyVaultId) return;
    setPoruthamMemberId(memberId);
    setPorutham(null);
    setPoruthamError("");
    setPoruthamLoading(true);
    try {
      const r = await apiFetchJson<ApiEnvelope<PorutthamData>>(
        `/api/v1/relationships/${memberId}/porutham${toQuery({ familyVaultId, compatibilityContext: context })}`
      );
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
      const response = await fetch("/api/backend/api/v1/relationships/compare/pdf", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "#3D352B" }}>

      {/* Header */}
      <div>
        <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-faint)" }}>
          {t("synastry_panel_title", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#7A6F5E" }}>
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
            <p style={{ fontSize: "0.875rem", color: "var(--color-faint)" }}>{t("synastry_no_vault", lang)}</p>
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
                <p style={{ fontSize: "0.875rem", color: "var(--color-faint)" }}>{t("synastry_select_member", lang)}</p>
              )}
              {compatLoading && (
                <p style={{ fontSize: "0.875rem", color: "var(--color-faint)" }}>{t("synastry_loading", lang)}</p>
              )}

              {compatError && (
                <div style={{ padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)", background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)" }}>
                  <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.875rem", fontWeight: 700, color: "#A8482F" }}>
                    {lang === "ta" ? "இணக்கம் ஏற்றல் தோல்வி" : "Could not load compatibility"}
                  </p>
                  <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.75rem", color: "#A8482F" }}>{compatError}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#7A6F5E", lineHeight: 1.5 }}>
                    {lang === "ta"
                      ? "குடும்ப உறுப்பினரின் ஜாதகம் கணக்கிடப்படவில்லை இருக்கலாம்."
                      : "The family member's chart may not be calculated yet. Edit member → Recalculate, then try again."}
                  </p>
                </div>
              )}

              {synastry && !compatLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

                  {/* Score card */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "var(--radius-md)", padding: "var(--space-5)", display: "flex", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)", flexShrink: 0 }}>
                      <SmallScoreRing score={synastry.compatibilityScore} />
                      <span style={{
                        padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", fontSize: "0.75rem", fontWeight: 600, textAlign: "center",
                        background: scoreTone(synastry.compatibilityScore).bg,
                        color: scoreTone(synastry.compatibilityScore).color,
                        border: `1px solid ${scoreTone(synastry.compatibilityScore).border}`,
                      }}>
                        {synastry.compatibilityLabel}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                        {t("synastry_summary", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
                        {tLang(synastry.summary, lang)}
                      </p>
                      <div style={{ marginTop: "var(--space-2)" }}>
                        <ConfidenceBadge
                          level={synastry.compatibilityScore >= 70 ? "HIGH" : synastry.compatibilityScore >= 45 ? "MEDIUM" : "LOW"}
                          reason={{
                            ta: synastry.compatibilityScore >= 70 ? "வலிமையான ஜாதக பொருத்தம்" : synastry.compatibilityScore >= 45 ? "மிதமான ஜாதக பொருத்தம்" : "கலந்த ஜாதக சமிக்ஞைகள்",
                            en: synastry.compatibilityScore >= 70 ? "Strong chart compatibility" : synastry.compatibilityScore >= 45 ? "Moderate chart compatibility" : "Mixed chart signals",
                          }}
                          lang={lang}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Caution */}
                  {synastry.caution && (
                    <div style={{ padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-md)", background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)" }}>
                      <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#A8482F", display: "flex", alignItems: "center", gap: "4px" }}>
                        <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden="true"><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                        {t("synastry_caution", lang)}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#A8482F", lineHeight: 1.5 }}>
                        {tLang(synastry.caution, lang)}
                      </p>
                    </div>
                  )}

                  {/* Chart comparison */}
                  <div style={{ background: "#FAF5EA", border: "1px solid #E4DBC8", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                      <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
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
                  {(synastry.aspects ?? []).length > 0 && (
                    <div>
                      <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                        {t("synastry_aspects", lang)}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {(synastry.aspects ?? []).map((a, i) => {
                          const ts = toneStyle(a.tone);
                          return (
                            <div key={i} style={{
                              display: "flex", gap: "var(--space-3)", alignItems: "flex-start",
                              padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-md)",
                              background: "#FFFFFF", border: `1px solid ${ts.border}`,
                            }}>
                              <span style={{
                                fontSize: "0.625rem", fontWeight: 700, color: ts.color,
                                border: `1px solid ${ts.border}`, borderRadius: "4px",
                                padding: "var(--space-0_5) var(--space-1_5)", whiteSpace: "nowrap", marginTop: "var(--space-0_5)", flexShrink: 0,
                                background: ts.bg,
                              }}>
                                {toneLabel(a.tone, lang)}
                              </span>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.875rem", fontWeight: 700, color: "#1A1612" }}>
                                  {a.planet1} – {a.aspectType} – {a.planet2}
                                  <span style={{ fontWeight: 400, color: "var(--color-faint)", marginLeft: "var(--space-1_5)", fontSize: "0.75rem" }}>
                                    {a.orb.toFixed(1)}°
                                  </span>
                                </p>
                                <p style={{ margin: 0, fontSize: "0.75rem", color: "#7A6F5E", lineHeight: 1.45 }}>
                                  {lang === "ta" ? a.descriptionTa : a.descriptionEn}
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
                    <div style={{ padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)", background: "#F0D9C4", border: "1px solid rgba(184,90,44,0.25)" }}>
                      <p style={{ margin: "0 0 var(--space-2_5)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B85A2C" }}>
                        {t("synastry_timing", lang)}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {(synastry.timingIndicators ?? []).map((ti, i) => (
                          <div key={i} style={{ display: "flex", gap: "var(--space-2_5)", alignItems: "flex-start" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#B85A2C", minWidth: "54px", paddingTop: "var(--space-0_5)" }}>
                              {tPlanetLord(ti.planet, lang)}
                            </span>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "#3D352B", lineHeight: 1.45 }}>
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
            <p style={{ fontSize: "0.875rem", color: "var(--color-faint)" }}>
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
                    <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                      {lang === "ta" ? "பொருத்த வகை" : "Context"}
                    </span>
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
                      <span style={{ fontSize: "0.625rem", marginLeft: "var(--space-1)", opacity: 0.65 }}>· {m.relationshipToOwner}</span>
                    )}
                  </Pill>
                ))}
              </div>

              {poruthamLoading && <p style={{ fontSize: "0.875rem", color: "var(--color-faint)" }}>{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</p>}
              {poruthamError && <p style={{ fontSize: "0.875rem", color: "#A8482F" }}>{poruthamError}</p>}

              {porutham && !poruthamLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

                  {/* Marriage chart comparison */}
                  {poruthamContext === "MARRIAGE" && (
                    <div style={{ background: "#FAF5EA", border: "1px solid #E4DBC8", borderRadius: "var(--radius-md)", padding: "var(--space-4)" }}>
                      <p style={{ margin: "0 0 var(--space-3)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                        {lang === "ta" ? "திருமண ஜாதக கட்ட ஒப்பீடு (D1)" : "Marriage Chart Comparison (D1)"}
                      </p>
                      <ChartComparisonCard lang={lang} ownerChart={ownerChart} memberChart={poruthamMemberChart} view="D1" />
                    </div>
                  )}

                  {/* Context note */}
                  {porutham.contextNote && (
                    <div style={{ padding: "var(--space-2_5) var(--space-3_5)", borderRadius: "var(--radius-md)", background: "#FAF5EA", border: "1px solid #E4DBC8" }}>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#7A6F5E", lineHeight: 1.5 }}>
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
                        border: "1px solid #D4C8AE",
                        background: "#FAF5EA",
                        color: poruthamPdfBusy ? "var(--color-faint)" : "#3D352B",
                        fontSize: "0.75rem",
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
                  <div style={{ background: "#FFFFFF", border: "1px solid #E4DBC8", borderRadius: "var(--radius-md)", padding: "var(--space-5)", display: "flex", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
                    <div style={{ flexShrink: 0 }}>
                      <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "2.8rem", fontWeight: 500, lineHeight: 1, color: "#1A1612" }}>
                        {porutham.totalScore}
                        <span style={{ fontSize: "1.125rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>/{porutham.maxScore}</span>
                      </p>
                      <p style={{ margin: "var(--space-1) 0 0", fontSize: "0.75rem", color: "#7A6F5E" }}>
                        {porutham.label} · {porutham.percentage.toFixed(0)}%
                      </p>
                      {(porutham.rajjuDosha || porutham.vedhaDosha) && (
                        <div style={{ marginTop: "var(--space-2)", display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap" }}>
                          {porutham.rajjuDosha && (
                            <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: "#F2D8CC", color: "#A8482F", border: "1px solid rgba(168,72,47,0.35)" }}>
                              <svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                              {lang === "ta" ? "ராஜ்ஜு தோஷம்" : "Rajju Dosha"}
                            </span>
                          )}
                          {porutham.vedhaDosha && (
                            <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: "#F2D8CC", color: "#A8482F", border: "1px solid rgba(168,72,47,0.35)" }}>
                              <svg viewBox="0 0 24 24" fill="none" width="10" height="10" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
                              {lang === "ta" ? "வேதா தோஷம்" : "Vedha Dosha"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
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
                          background: isCriticalFail ? "#F2D8CC" : "#FFFFFF",
                          border: `1px solid ${isCriticalFail ? "rgba(168,72,47,0.3)" : "#E4DBC8"}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2_5)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.875rem", fontWeight: 700, color: "#1A1612" }}>
                                {lang === "ta" ? meta.labelTa : meta.labelEn}
                              </p>
                              <p style={{ margin: 0, fontSize: "0.75rem", color: "#7A6F5E", lineHeight: 1.35 }}>
                                {lang === "ta" ? meta.checksTa : meta.checksEn}
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
                              <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: wtTone.bg, color: wtTone.color, border: `1px solid ${wtTone.border}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {weightLabel(meta.weight, lang)}
                              </span>
                              <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: stTone.bg, color: stTone.color, border: `1px solid ${stTone.border}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {lang === "ta" ? (status === "good" ? "நல்லது" : status === "mixed" ? "கலப்பு" : "கவனம்") : (status === "good" ? "Good" : status === "mixed" ? "Mixed" : "Caution")}
                              </span>
                              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1A1612", fontFamily: "var(--font-mono)" }}>
                                {k.score}/{k.maxScore}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ width: "100%", height: "5px", borderRadius: "3px", background: "#E4DBC8", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: "3px", width: `${barPct}%`, background: stTone.color, transition: "width 400ms ease" }} />
                          </div>

                          {isCriticalFail && (
                            <p style={{ margin: "var(--space-2) 0 0", fontSize: "0.75rem", color: "#A8482F", lineHeight: 1.4 }}>
                              {k.name === "Rajju"
                                ? (lang === "ta" ? "ரஜ்ஜு தோஷம் கண்டறியப்பட்டுள்ளது. பாரம்பரியமாக இது முக்கிய கவனிக்க வேண்டிய குறியீடு." : "Rajju dosha is active. Traditionally this is treated as a critical caution signal.")
                                : (lang === "ta" ? "வேத தோஷம் கண்டறியப்பட்டுள்ளது. பாரம்பரியமாக இது தடுப்பு ஜோடி குறியீடாக கருதப்படுகிறது." : "Vedha dosha is active. Traditionally this indicates an obstruction-pair caution.")}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
            <p style={{ fontSize: "0.875rem", color: "var(--color-faint)" }}>{t("rel_alerts_loading", lang)}</p>
          ) : relationshipAlerts.length === 0 ? (
            <p style={{ fontSize: "0.875rem", color: "var(--color-faint)" }}>{t("rel_alerts_empty", lang)}</p>
          ) : (
            relationshipAlerts.map((alert) => {
              const dayLabel =
                alert.daysFromToday === 0 ? t("alert_today", lang)
                : alert.daysFromToday === 1 ? t("alert_tomorrow", lang)
                : `${alert.daysFromToday} ${t("alert_days_away", lang)}`;
              return (
                <div key={alert.alertId} style={{
                  padding: "var(--space-3_5) var(--space-4)", borderRadius: "var(--radius-md)",
                  background: "#FFFFFF", border: "1px solid #E4DBC8",
                }}>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap", marginBottom: "var(--space-1_5)" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1A1612" }}>
                      {alert.memberName}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#3D352B" }}>
                      {tLang(alert.title, lang)}
                    </span>
                    <span style={{ fontSize: "0.625rem", padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: "#FAF5EA", border: "1px solid #E4DBC8", color: "#7A6F5E" }}>
                      {dayLabel}
                    </span>
                    <span style={{ fontSize: "0.625rem", color: "var(--color-faint)" }}>
                      sig: {alert.significanceScore}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#7A6F5E", lineHeight: 1.5 }}>
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
