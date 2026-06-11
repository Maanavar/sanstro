"use client";

import React, { useEffect, useState } from "react";

import { t } from "@/lib/i18n";
import { SCORE_HIGH, SCORE_MID, SCORE_LOW } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import type { LifeAreaPredictionData, PredictionBundle } from "@/lib/types";


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
  deferred?: boolean;
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

function predictionIsDeferred(pred: LifeAreaPredictionData): boolean {
  const factorKeys = pred.astrologicalFactors.map((factor) => factor.key);
  if (factorKeys.includes("age_phase_gate")) return true;
  const text = pred.mainPredictionEn.toLowerCase();
  return text.includes("age-gated") || text.includes("not applicable in this phase") || text.includes("deferred to later phase");
}

function PredictionCard({ title, pred, lang, expanded, onToggle, featured, deferred = false }: PredictionCardProps) {
  const tone = confidenceTone(pred.confidence);

  const detailSection = (
    <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div style={{ display: "grid", gridTemplateColumns: pred.challenges.length > 0 ? "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" : "1fr", gap: "var(--space-6)" }}>
        {pred.supports.length > 0 && (
          <div>
            <p className="cd-kicker" style={{ marginBottom: "var(--space-2)", letterSpacing: "0.1em" }}>{t("pred_supports", lang)}</p>
            <SupportList items={pred.supports} color={SCORE_HIGH} lang={lang} />
          </div>
        )}
        {pred.challenges.length > 0 && (
          <div>
            <p className="cd-kicker" style={{ marginBottom: "var(--space-2)", letterSpacing: "0.1em", color: SCORE_MID }}>{t("pred_challenges", lang)}</p>
            <SupportList items={pred.challenges} color={SCORE_MID} lang={lang} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
        <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
          <p className="cd-kicker" style={{ letterSpacing: "0.08em" }}>{t("pred_dasha_support", lang)}</p>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: supportTone(pred.dashaSupport) }}>{supportLabel(pred.dashaSupport, lang)}</p>
        </div>

        <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
          <p className="cd-kicker" style={{ letterSpacing: "0.08em" }}>{t("pred_transit_support", lang)}</p>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: supportTone(pred.transitSupport) }}>{supportLabel(pred.transitSupport, lang)}</p>
        </div>

        {pred.timingWindowStart && pred.timingWindowEnd && (
          <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", padding: "var(--space-3) var(--space-4)" }}>
            <p className="cd-kicker" style={{ letterSpacing: "0.08em" }}>{t("pred_timing_window", lang)}</p>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-strong)" }}>{pred.timingWindowStart} to {pred.timingWindowEnd}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (featured && expanded) {
    return (
      <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", background: "var(--color-surface)", overflow: "hidden", boxShadow: "0 2px 14px rgba(60,40,20,0.08)", fontFamily: "var(--font-body)" }}>
        <div className="cd-featured-panel">
          <div style={{ padding: "var(--space-8)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <p className="cd-kicker--inline" style={{ letterSpacing: "0.1em" }}>{title}</p>
              {deferred && (
                <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "var(--space-0_75) var(--space-2_5)", borderRadius: "var(--radius-pill)", background: "rgba(168,72,47,0.12)", color: SCORE_LOW, border: "1px solid rgba(168,72,47,0.3)" }}>
                  {lang === "ta" ? "பின்வரும் கட்டம்" : "Later phase"}
                </span>
              )}
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: tone.bg, color: tone.text, border: `1px solid ${tone.border}` }}>{confidenceLabel(pred.confidence, lang)}</span>
            </div>

            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 2vw, 1.75rem)", fontWeight: 500, lineHeight: 1.2, color: "var(--color-text-strong)", letterSpacing: "-0.02em" }}>
              {lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}
            </h2>

            {detailSection}
          </div>

          <div className="cd-featured-panel__aside" style={{ padding: "var(--space-8)", background: "var(--color-surface-soft)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p className="cd-kicker--inline" style={{ letterSpacing: "0.08em" }}>{t("pred_confidence", lang)}</p>
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
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", margin: "0 0 var(--space-1)" }}>
            <p className="cd-kicker--inline" style={{ letterSpacing: "0.1em", color: SCORE_MID }}>{title}</p>
            {deferred && (
              <span style={{ fontSize: "0.625rem", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "rgba(168,72,47,0.12)", color: SCORE_LOW, border: "1px solid rgba(168,72,47,0.3)" }}>
                {lang === "ta" ? "பின்வரும் கட்டம்" : "Later phase"}
              </span>
            )}
          </div>
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
  maritalStatus?: string;
};

export function PredictionDetailPanel({ lang, predictions, loading, maritalStatus }: Props) {
  const [expanded, setExpanded] = useState<ExpandState>({ marriage: true, career: false, wealth: false, health: false });
  const isMarried = maritalStatus === "married" || maritalStatus === "widowed" || maritalStatus === "divorced";

  function toggle(key: keyof ExpandState) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // For married people, rename the marriage prediction to relationship/harmony — the 7th house
  // still matters (partnership quality, family decisions) but a new-wedding framing is wrong.
  const marriagePredTitle = isMarried
    ? (lang === "ta" ? "உறவு & குடும்ப இணக்கம்" : "Relationship & Family Harmony")
    : t("pred_marriage_title", lang);

  const items: Array<{ key: keyof ExpandState; title: string; pred: LifeAreaPredictionData | null | undefined }> = [
    { key: "marriage", title: marriagePredTitle, pred: predictions?.marriage },
    { key: "career", title: t("pred_career_title", lang), pred: predictions?.career },
    { key: "wealth", title: t("pred_wealth_title", lang), pred: predictions?.wealth },
    { key: "health", title: t("pred_health_title", lang), pred: predictions?.health },
  ];

  const orderedItems = items
    .filter((item): item is { key: keyof ExpandState; title: string; pred: LifeAreaPredictionData } => Boolean(item.pred))
    .sort((a, b) => {
      const deferredA = predictionIsDeferred(a.pred) ? 1 : 0;
      const deferredB = predictionIsDeferred(b.pred) ? 1 : 0;
      if (deferredA !== deferredB) return deferredA - deferredB;
      const order: Record<keyof ExpandState, number> = { marriage: 0, career: 1, wealth: 2, health: 3 };
      return order[a.key] - order[b.key];
    });

  const firstKey = orderedItems[0]?.key ?? null;

  useEffect(() => {
    if (!firstKey) return;
    setExpanded({ marriage: false, career: false, wealth: false, health: false, [firstKey]: true });
  }, [firstKey]);

  if (loading) {
    return <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>{t("pred_loading", lang)}</p>;
  }

  if (!orderedItems.length) {
    return (
      <div style={{ padding: "var(--space-4) var(--space-5)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", fontFamily: "var(--font-body)" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.6 }}>
          {lang === "ta"
            ? "இந்த குடும்ப உறுப்பினரின் கணிப்புகள் தனி பகுப்பாய்வு தேவைப்படுகின்றன. தனிப்பட்ட கணிப்புகளுக்கு உங்கள் சொந்த சுயவிவரத்தை தேர்ந்தெடுக்கவும்."
            : "Predictions are computed for your own profile. Switch to your profile to see your personalised readings, or use Life Events for this member."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontFamily: "var(--font-body)" }}>
      {isMarried && predictions?.marriage && (
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.5, padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", background: "rgba(92,118,84,0.07)", border: "1px solid rgba(92,118,84,0.2)" }}>
          {lang === "ta"
            ? "நீங்கள் திருமணமானவர் — 7-ம் வீடு இங்கே உறவு தரம், பாலத்துவம் மற்றும் குடும்ப ஒற்றுமையைக் காட்டுகிறது; புதிய திருமணம் அல்ல."
            : "This person is married — the 7th-house reading here covers relationship quality, partnership, and family cohesion, not a new wedding."}
        </p>
      )}
      {orderedItems.map(({ key, title, pred }) => (
        pred ? (
          <PredictionCard
            key={key}
            title={title}
            pred={pred}
            lang={lang}
            expanded={expanded[key]}
            onToggle={() => toggle(key)}
            featured={key === firstKey}
            deferred={predictionIsDeferred(pred)}
          />
        ) : null
      ))}
    </div>
  );
}
