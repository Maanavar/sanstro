"use client";

import React, { useState } from "react";
import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, DecisionBriefData } from "@/lib/types";

const SCENARIOS = [
  "job_change", "business_start", "marriage", "education", "property",
  "health", "travel", "spiritual", "family", "money", "child", "other",
] as const;
type Scenario = typeof SCENARIOS[number];

type Props = {
  lang: Lang;
  chartId: string;
};

function verdictColor(verdict: string): string {
  if (verdict === "FAVOURABLE") return "#4ade80";
  if (verdict === "CAUTION") return "#f87171";
  return "#fbbf24";
}

function verdictLabel(verdict: string, lang: Lang): string {
  if (verdict === "FAVOURABLE") return t("verdict_favourable", lang);
  if (verdict === "CAUTION") return t("verdict_caution", lang);
  if (verdict === "DEFER") return t("decision_defer", lang);
  return t("verdict_neutral", lang);
}

function scenarioLabel(scenario: string, lang: Lang): string {
  const map: Record<string, { ta: string; en: string }> = {
    job_change:       { ta: "வேலை மாற்றம்",         en: "Job Change" },
    business_start:   { ta: "தொழில் தொடக்கம்",      en: "Business Start" },
    marriage:         { ta: "திருமணம்",             en: "Marriage" },
    education:        { ta: "கல்வி",               en: "Education" },
    property:         { ta: "சொத்து",              en: "Property" },
    health:           { ta: "உடல்நலம்",            en: "Health" },
    travel:           { ta: "பயணம்",              en: "Travel" },
    spiritual:        { ta: "ஆன்மிகம்",            en: "Spiritual" },
    family:           { ta: "குடும்பம்",            en: "Family" },
    money:            { ta: "பணம்",               en: "Money" },
    child:            { ta: "குழந்தை",             en: "Child" },
    other:            { ta: "மற்றவை",              en: "Other" },
  };
  return (map[scenario] ?? { ta: scenario, en: scenario })[lang];
}

export function DecisionPanel({ lang, chartId }: Props) {
  const [scenario, setScenario] = useState<Scenario>("job_change");
  const [targetDate, setTargetDate] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [result, setResult] = useState<DecisionBriefData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyse() {
    if (!chartId || !targetDate) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const r = await apiFetchJson<ApiEnvelope<DecisionBriefData>>("/api/v1/decisions/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartId,
          targetDate,
          scenario,
          optionALabel: optionA.trim() || undefined,
          optionBLabel: optionB.trim() || undefined,
        }),
      });
      setResult(r.data);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("decision_panel_title", lang)}
        </p>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
          {t("decision_panel_desc", lang)}
        </p>
      </div>

      {/* Input form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
              {t("decision_scenario", lang)}
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as Scenario)}
              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(30,30,40,0.9)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            >
              {SCENARIOS.map((s) => (
                <option key={s} value={s}>{scenarioLabel(s, lang)}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
              {t("decision_target_date", lang)} *
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
              {t("decision_option_a", lang)}
            </label>
            <input
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              placeholder={lang === "ta" ? "உதாரணம்: இப்போதே ஆரம்பி" : "e.g. Start now"}
              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: "4px", textTransform: "uppercase" }}>
              {t("decision_option_b", lang)}
            </label>
            <input
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              placeholder={lang === "ta" ? "உதாரணம்: 3 மாதம் காத்திரு" : "e.g. Wait 3 months"}
              style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void analyse()}
          disabled={loading || !chartId || !targetDate}
          style={{
            alignSelf: "flex-start", padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer",
            fontSize: "0.8rem", fontWeight: 700,
            background: loading || !chartId || !targetDate ? "rgba(255,255,255,0.08)" : "rgba(229,184,77,0.85)",
            color: loading || !chartId || !targetDate ? "rgba(255,255,255,0.3)" : "#0a0800",
          }}
        >
          {loading ? t("decision_analysing", lang) : t("decision_analyse", lang)}
        </button>
        {error && <p style={{ margin: 0, fontSize: "0.76rem", color: "#f87171" }}>{error}</p>}
      </div>

      {/* Result */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Recommended verdict */}
          <div style={{
            padding: "16px 20px", borderRadius: "12px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center",
          }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                {t("decision_recommended", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, lineHeight: 1, color: verdictColor(result.recommended) }}>
                {result.recommended === "DEFER" ? t("decision_defer", lang) : result.recommended}
              </p>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                {t("decision_confidence", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: verdictColor(result.recommended) }}>
                {result.confidence}%
              </p>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                {t("decision_reasoning", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                {tLang(result.reasoning, lang)}
              </p>
            </div>
          </div>

          {/* Option comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { key: "A" as const, data: result.optionA, isRecommended: result.recommended === "A" },
              { key: "B" as const, data: result.optionB, isRecommended: result.recommended === "B" },
            ].map(({ key, data, isRecommended }) => (
              <div key={key} style={{
                padding: "14px 16px", borderRadius: "10px",
                background: isRecommended ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)",
                border: isRecommended ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.09)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: isRecommended ? "#4ade80" : "rgba(255,255,255,0.55)", textTransform: "uppercase" }}>
                    {t(`decision_option_${key.toLowerCase()}` as any, lang)}{isRecommended && " ✓"}
                  </p>
                  <span style={{ fontSize: "1.2rem", fontWeight: 900, color: isRecommended ? "#4ade80" : "#fbbf24" }}>
                    {data.score}
                  </span>
                </div>
                <p style={{ margin: "0 0 6px", fontSize: "0.76rem", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                  {data.label}
                </p>
                {data.alignmentNotes.length > 0 && (
                  <ul style={{ margin: "0 0 6px", padding: "0 0 0 14px" }}>
                    {data.alignmentNotes.map((note, i) => (
                      <li key={i} style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.4, marginBottom: "2px" }}>{note}</li>
                    ))}
                  </ul>
                )}
                {data.riskFactors.length > 0 && (
                  <div style={{ padding: "6px 8px", borderRadius: "5px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    {data.riskFactors.map((rf, i) => (
                      <p key={i} style={{ margin: i > 0 ? "2px 0 0" : 0, fontSize: "0.7rem", color: "#f87171", lineHeight: 1.4 }}>⚠ {rf}</p>
                    ))}
                  </div>
                )}
                {data.optimalWindow && (
                  <p style={{ margin: "6px 0 0", fontSize: "0.7rem", color: "#fbbf24" }}>
                    ◷ {t("decision_optimal_window", lang)}: {data.optimalWindow}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Caution */}
          {result.caution && (
            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.22)" }}>
              <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase" }}>
                ⚠ {t("decision_caution", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#fca5a5", lineHeight: 1.5 }}>
                {tLang(result.caution, lang)}
              </p>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>
          {t("decision_empty", lang)}
        </p>
      )}
    </div>
  );
}
