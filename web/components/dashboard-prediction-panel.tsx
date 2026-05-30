"use client";

import React, { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LifeAreaPredictionData, PredictionBundle } from "@/lib/types";

/* ── Clarity palette helpers ─────────────────────────────── */
function confidencePalette(c: string) {
  if (c === "HIGH")   return { bg: "#DCE4D2", border: "rgba(92,118,84,0.35)",   text: "#3a6b40",  pill: "#5C7654" };
  if (c === "LOW")    return { bg: "#F2D8CC", border: "rgba(168,72,47,0.35)",   text: "#8c3e18",  pill: "#A8482F" };
  return                     { bg: "#F0D9C4", border: "rgba(184,90,44,0.35)",   text: "#7a3412",  pill: "#B85A2C" };
}

function strengthColor(s: string) {
  if (s === "STRONG") return "#5C7654";
  if (s === "WEAK")   return "#A8482F";
  return "#B85A2C";
}

function strengthLabel(s: string, lang: Lang) {
  if (s === "STRONG") return t("pred_strong", lang);
  if (s === "PARTIAL") return t("pred_partial", lang);
  return t("pred_weak", lang);
}

function confidenceLabel(c: string, lang: Lang) {
  if (c === "HIGH")   return t("pred_high", lang);
  if (c === "MEDIUM") return t("pred_medium", lang);
  return t("pred_low", lang);
}

/* ── Single prediction card ────────────────────────────────── */
type PredictionCardProps = {
  title: string;
  pred: LifeAreaPredictionData;
  lang: Lang;
  expanded: boolean;
  onToggle: () => void;
  isFirst?: boolean;
};

function PredictionCard({ title, pred, lang, expanded, onToggle, isFirst }: PredictionCardProps) {
  const pal = confidencePalette(pred.confidence);

  /* Featured (first/marriage) card: large layout matching screenshot left panel */
  if (isFirst && expanded) {
    return (
      <div style={{
        borderRadius: "20px",
        border: "1px solid #E4DBC8",
        background: "#FFFFFF",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(60,40,20,0.06)",
        fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif",
      }}>
        {/* Two-column hero layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(220px, 280px)", gap: "0" }}>

          {/* Left: headline + details */}
          <div style={{ padding: "28px 32px" }}>
            {/* Area label + confidence badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, color: "#A89D89", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {title}
              </p>
              <span style={{
                fontSize: "0.7rem", fontWeight: 600, padding: "3px 10px", borderRadius: "999px",
                background: pal.bg, color: pal.text, border: `1px solid ${pal.border}`,
              }}>
                {confidenceLabel(pred.confidence, lang)} {lang === "ta" ? "சமிக்ஞை" : "signal"}
              </span>
            </div>

            {/* Main prediction — Fraunces */}
            <h2 style={{
              margin: "0 0 14px",
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(1.35rem, 2vw, 1.8rem)",
              fontWeight: 500,
              lineHeight: 1.2,
              color: "#1A1612",
              letterSpacing: "-0.02em",
            }}>
              {lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}
            </h2>

            {/* Supporting + Watch two-column */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginTop: "20px" }}>
              {pred.supports.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "0.62rem", fontWeight: 700, color: "#A89D89", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {t("pred_supports", lang)}
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                    {pred.supports.map((s, i) => (
                      <li key={i} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "0.82rem", color: "#3D352B", lineHeight: 1.45 }}>
                        <span style={{ color: "#5C7654", marginTop: "2px", flexShrink: 0 }}>•</span>
                        {lang === "ta" ? s.ta : s.en}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {pred.challenges.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "0.62rem", fontWeight: 700, color: "#B85A2C", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {t("pred_challenges", lang)}
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                    {pred.challenges.map((c, i) => (
                      <li key={i} style={{ display: "flex", gap: "6px", alignItems: "flex-start", fontSize: "0.82rem", color: "#3D352B", lineHeight: 1.45 }}>
                        <span style={{ color: "#B85A2C", marginTop: "2px", flexShrink: 0 }}>•</span>
                        {lang === "ta" ? c.ta : c.en}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right: Window + support breakdown */}
          <div style={{ padding: "28px 28px", borderLeft: "1px solid #E4DBC8", background: "#FAF5EA", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Timing window */}
            {pred.timingWindowStart && pred.timingWindowEnd && (
              <div>
                <p style={{ margin: "0 0 6px", fontSize: "0.62rem", fontWeight: 700, color: "#A89D89", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {t("pred_timing_window", lang)}
                </p>
                <p style={{ margin: 0, fontFamily: "'Fraunces', Georgia, serif", fontSize: "1.5rem", fontWeight: 500, color: "#1A1612", lineHeight: 1.15 }}>
                  {pred.timingWindowStart} →<br />{pred.timingWindowEnd}
                </p>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: "1px", background: "#E4DBC8" }} />

            {/* Dasha / Transit / Age phase support table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "#5a4f42" }}>{t("pred_dasha_support", lang)}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: strengthColor(pred.dashaSupport) }}>
                  {strengthLabel(pred.dashaSupport, lang)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "#5a4f42" }}>{t("pred_transit_support", lang)}</span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: strengthColor(pred.transitSupport) }}>
                  {strengthLabel(pred.transitSupport, lang)}
                </span>
              </div>
              {pred.astrologicalFactors.slice(0, 1).map((f) => (
                <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "#5a4f42" }}>
                    {lang === "ta" ? "வயது நிலை" : "Age phase"}
                  </span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: f.status === "SUPPORT" ? "#5C7654" : f.status === "CAUTION" ? "#A8482F" : "#B85A2C" }}>
                    {f.status === "SUPPORT" ? (lang === "ta" ? "நல்லது" : "Strong") : f.status === "CAUTION" ? (lang === "ta" ? "கவனம்" : "Weak") : (lang === "ta" ? "மிதம்" : "Moderate")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Collapse button */}
        <button onClick={onToggle} style={{
          width: "100%", padding: "10px", background: "#F4EEE2", border: "none", borderTop: "1px solid #E4DBC8",
          cursor: "pointer", fontSize: "0.72rem", color: "#7A6F5E", fontWeight: 600, fontFamily: "inherit",
        }}>
          ▲ {lang === "ta" ? "மூடு" : "Collapse"}
        </button>
      </div>
    );
  }

  /* Secondary cards — clickable header row + expandable detail panel */
  return (
    <div style={{
      borderRadius: "16px", border: "1px solid #E4DBC8",
      background: "#FFFFFF", overflow: "hidden",
      boxShadow: expanded ? "0 2px 12px rgba(60,40,20,0.06)" : "none",
    }}>
      {/* Header row — always clickable */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", padding: "20px 24px",
          background: expanded ? "#FAF5EA" : "#FFFFFF",
          border: "none", borderBottom: expanded ? "1px solid #E4DBC8" : "none",
          cursor: "pointer", fontFamily: "inherit",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
        }}
      >
        <div style={{ flex: 1, textAlign: "left" }}>
          <p style={{ margin: "0 0 4px", fontSize: "0.62rem", fontWeight: 700, color: "#B85A2C", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {title}
          </p>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#3D352B", lineHeight: 1.45 }}>
            {lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span style={{
            fontSize: "0.72rem", fontWeight: 700, padding: "4px 12px", borderRadius: "999px",
            background: pal.bg, color: pal.text, whiteSpace: "nowrap",
          }}>
            {confidenceLabel(pred.confidence, lang)}
          </span>
          <span style={{ fontSize: "0.68rem", color: "#A89D89" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Support breakdown row */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "140px", padding: "12px 16px", borderRadius: "10px", background: "#FAF5EA", border: "1px solid #E4DBC8" }}>
              <p style={{ margin: "0 0 3px", fontSize: "0.6rem", fontWeight: 700, color: "#A89D89", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {t("pred_dasha_support", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: strengthColor(pred.dashaSupport) }}>
                {strengthLabel(pred.dashaSupport, lang)}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: "140px", padding: "12px 16px", borderRadius: "10px", background: "#FAF5EA", border: "1px solid #E4DBC8" }}>
              <p style={{ margin: "0 0 3px", fontSize: "0.6rem", fontWeight: 700, color: "#A89D89", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {t("pred_transit_support", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: strengthColor(pred.transitSupport) }}>
                {strengthLabel(pred.transitSupport, lang)}
              </p>
            </div>
            {pred.timingWindowStart && pred.timingWindowEnd && (
              <div style={{ flex: 2, minWidth: "180px", padding: "12px 16px", borderRadius: "10px", background: "#FAF5EA", border: "1px solid #E4DBC8" }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.6rem", fontWeight: 700, color: "#A89D89", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {t("pred_timing_window", lang)}
                </p>
                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#1A1612" }}>
                  {pred.timingWindowStart} → {pred.timingWindowEnd}
                </p>
              </div>
            )}
          </div>

          {/* Supporting + Challenges */}
          <div style={{ display: "grid", gridTemplateColumns: pred.challenges.length > 0 ? "1fr 1fr" : "1fr", gap: "16px 24px" }}>
            {pred.supports.length > 0 && (
              <div>
                <p style={{ margin: "0 0 8px", fontSize: "0.62rem", fontWeight: 700, color: "#A89D89", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {t("pred_supports", lang)}
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {pred.supports.map((s, i) => (
                    <li key={i} style={{ display: "flex", gap: "6px", fontSize: "0.82rem", color: "#3D352B", lineHeight: 1.45 }}>
                      <span style={{ color: "#5C7654", flexShrink: 0 }}>•</span>
                      {lang === "ta" ? s.ta : s.en}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pred.challenges.length > 0 && (
              <div>
                <p style={{ margin: "0 0 8px", fontSize: "0.62rem", fontWeight: 700, color: "#B85A2C", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {t("pred_challenges", lang)}
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {pred.challenges.map((c, i) => (
                    <li key={i} style={{ display: "flex", gap: "6px", fontSize: "0.82rem", color: "#3D352B", lineHeight: 1.45 }}>
                      <span style={{ color: "#B85A2C", flexShrink: 0 }}>•</span>
                      {lang === "ta" ? c.ta : c.en}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main panel ─────────────────────────────────────────────── */
type Props = { lang: Lang; predictions: PredictionBundle | null; loading: boolean; };
type ExpandState = { marriage: boolean; career: boolean; wealth: boolean; health: boolean; };

export function PredictionDetailPanel({ lang, predictions, loading }: Props) {
  const [expanded, setExpanded] = useState<ExpandState>({ marriage: true, career: false, wealth: false, health: false });
  function toggle(key: keyof ExpandState) { setExpanded((p) => ({ ...p, [key]: !p[key] })); }

  if (loading) return (
    <p style={{ margin: 0, fontSize: "0.82rem", color: "#A89D89", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {t("pred_loading", lang)}
    </p>
  );

  if (!predictions || (!predictions.marriage && !predictions.career && !predictions.wealth && !predictions.health)) return (
    <p style={{ margin: 0, fontSize: "0.82rem", color: "#A89D89", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {t("pred_empty", lang)}
    </p>
  );

  const entries: { key: keyof ExpandState; title: string; pred: LifeAreaPredictionData | null | undefined }[] = [
    { key: "marriage", title: t("pred_marriage_title", lang), pred: predictions.marriage },
    { key: "career",   title: t("pred_career_title", lang),   pred: predictions.career },
    { key: "wealth",   title: t("pred_wealth_title", lang),   pred: predictions.wealth },
    { key: "health",   title: t("pred_health_title", lang),   pred: predictions.health },
  ];

  const firstKey = entries.find((e) => e.pred)?.key;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif" }}>
      {entries.map(({ key, title, pred }) =>
        pred ? (
          <PredictionCard
            key={key}
            title={title}
            pred={pred}
            lang={lang}
            expanded={expanded[key]}
            onToggle={() => toggle(key)}
            isFirst={key === firstKey}
          />
        ) : null
      )}
    </div>
  );
}
