"use client";

import React, { useState } from "react";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LifeAreaPredictionData, PredictionBundle } from "@/lib/types";

const SCORE_HIGH = "var(--color-score-high, #5C7654)";
const SCORE_MID = "var(--color-score-mid, #B85A2C)";
const SCORE_LOW = "var(--color-score-low, #A8482F)";

type ExpandState = {
  marriage: boolean;
  career: boolean;
  wealth: boolean;
  health: boolean;
};

type PredictionCardProps = {
  title: string;
  pred: LifeAreaPredictionData;
  lang: Lang;
  expanded: boolean;
  onToggle: () => void;
  featured?: boolean;
};

function confidenceTone(confidence: string) {
  if (confidence === "HIGH") return { bg: "#DCE4D2", border: "rgba(92,118,84,0.35)", text: SCORE_HIGH };
  if (confidence === "LOW") return { bg: "#F2D8CC", border: "rgba(168,72,47,0.35)", text: SCORE_LOW };
  return { bg: "#F0D9C4", border: "rgba(184,90,44,0.35)", text: SCORE_MID };
}

function supportTone(value: string) {
  if (value === "STRONG") return SCORE_HIGH;
  if (value === "WEAK") return SCORE_LOW;
  return SCORE_MID;
}

function supportLabel(value: string, lang: Lang) {
  if (value === "STRONG") return t("pred_strong", lang);
  if (value === "PARTIAL") return t("pred_partial", lang);
  return t("pred_weak", lang);
}

function confidenceLabel(value: string, lang: Lang) {
  if (value === "HIGH") return t("pred_high", lang);
  if (value === "MEDIUM") return t("pred_medium", lang);
  return t("pred_low", lang);
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ width: "14px", height: "14px", color: "var(--color-faint)", transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms ease" }}>
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SupportList({ items, color, lang }: { items: { ta: string; en: string }[]; color: string; lang: Lang }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {items.map((item, index) => (
        <li key={index} style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start", fontSize: "0.875rem", lineHeight: 1.5, color: "var(--color-text)" }}>
          <span style={{ color, fontWeight: 700, lineHeight: 1, marginTop: "var(--space-0_75)" }} aria-hidden="true">&bull;</span>
          {lang === "ta" ? item.ta : item.en}
        </li>
      ))}
    </ul>
  );
}

function PredictionCard({ title, pred, lang, expanded, onToggle, featured }: PredictionCardProps) {
  const tone = confidenceTone(pred.confidence);

  const detailSection = (
    <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div style={{ display: "grid", gridTemplateColumns: pred.challenges.length > 0 ? "1fr 1fr" : "1fr", gap: "var(--space-6)" }}>
        {pred.supports.length > 0 && (
          <div>
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-faint)" }}>{t("pred_supports", lang)}</p>
            <SupportList items={pred.supports} color={SCORE_HIGH} lang={lang} />
          </div>
        )}
        {pred.challenges.length > 0 && (
          <div>
            <p style={{ margin: "0 0 var(--space-2)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: SCORE_MID }}>{t("pred_challenges", lang)}</p>
            <SupportList items={pred.challenges} color={SCORE_MID} lang={lang} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
        <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>{t("pred_dasha_support", lang)}</p>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: supportTone(pred.dashaSupport) }}>{supportLabel(pred.dashaSupport, lang)}</p>
        </div>

        <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>{t("pred_transit_support", lang)}</p>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: supportTone(pred.transitSupport) }}>{supportLabel(pred.transitSupport, lang)}</p>
        </div>

        {pred.timingWindowStart && pred.timingWindowEnd && (
          <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
            <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>{t("pred_timing_window", lang)}</p>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-strong)" }}>{pred.timingWindowStart} to {pred.timingWindowEnd}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (featured && expanded) {
    return (
      <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", overflow: "hidden", boxShadow: "0 2px 14px rgba(60,40,20,0.08)", fontFamily: "var(--font-body)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(220px, 280px)", gap: 0 }}>
          <div style={{ padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, color: "var(--color-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</p>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: tone.bg, color: tone.text, border: `1px solid ${tone.border}` }}>{confidenceLabel(pred.confidence, lang)}</span>
            </div>

            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 2vw, 1.75rem)", fontWeight: 500, lineHeight: 1.2, color: "var(--color-text-strong)", letterSpacing: "-0.02em" }}>
              {lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}
            </h2>

            {detailSection}
          </div>

          <div style={{ padding: "var(--space-8)", borderLeft: "1px solid var(--color-border)", background: "var(--color-surface-soft)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p style={{ margin: 0, fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-faint)" }}>{t("pred_confidence", lang)}</p>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: 1, color: tone.text }}>{confidenceLabel(pred.confidence, lang)}</p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
              {lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}
            </p>
          </div>
        </div>

        <button type="button" onClick={onToggle} style={{ width: "100%", padding: "var(--space-3)", border: 0, borderTop: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-muted)", fontSize: "0.75rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)", cursor: "pointer", fontFamily: "inherit" }}>
          <Chevron open />
          {lang === "ta" ? "மூடு" : "Collapse"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", overflow: "hidden", boxShadow: expanded ? "0 2px 12px rgba(60,40,20,0.06)" : "none", fontFamily: "var(--font-body)" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "var(--space-5) var(--space-6)",
          background: expanded ? "var(--color-surface-soft)" : "var(--color-surface)",
          border: 0,
          borderBottom: expanded ? "1px solid var(--color-border)" : "none",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-4)",
          fontFamily: "inherit",
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 var(--space-1)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: SCORE_MID }}>{title}</p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.5 }}>{lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: tone.bg, color: tone.text, border: `1px solid ${tone.border}` }}>{confidenceLabel(pred.confidence, lang)}</span>
          <Chevron open={expanded} />
        </div>
      </button>

      {expanded ? detailSection : null}
    </div>
  );
}

type Props = {
  lang: Lang;
  predictions: PredictionBundle | null;
  loading: boolean;
};

export function PredictionDetailPanel({ lang, predictions, loading }: Props) {
  const [expanded, setExpanded] = useState<ExpandState>({ marriage: true, career: false, wealth: false, health: false });

  function toggle(key: keyof ExpandState) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>{t("pred_loading", lang)}</p>;
  }

  if (!predictions || (!predictions.marriage && !predictions.career && !predictions.wealth && !predictions.health)) {
    return <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>{t("pred_empty", lang)}</p>;
  }

  const items: Array<{ key: keyof ExpandState; title: string; pred: LifeAreaPredictionData | null | undefined }> = [
    { key: "marriage", title: t("pred_marriage_title", lang), pred: predictions.marriage },
    { key: "career", title: t("pred_career_title", lang), pred: predictions.career },
    { key: "wealth", title: t("pred_wealth_title", lang), pred: predictions.wealth },
    { key: "health", title: t("pred_health_title", lang), pred: predictions.health },
  ];

  const firstKey = items.find((item) => item.pred)?.key;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontFamily: "var(--font-body)" }}>
      {items.map(({ key, title, pred }) => (
        pred ? (
          <PredictionCard
            key={key}
            title={title}
            pred={pred}
            lang={lang}
            expanded={expanded[key]}
            onToggle={() => toggle(key)}
            featured={key === firstKey}
          />
        ) : null
      ))}
    </div>
  );
}
