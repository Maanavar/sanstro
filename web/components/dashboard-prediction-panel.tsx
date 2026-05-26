"use client";

import React, { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LifeAreaPredictionData, PredictionBundle } from "@/lib/types";

// ── Colour tokens ─────────────────────────────────────────────────────────────

const SUPPORT_COLOR = "#4ade80";
const CAUTION_COLOR = "#f87171";
const NEUTRAL_COLOR = "#fbbf24";

function supportColor(status: string): string {
  if (status === "SUPPORT") return SUPPORT_COLOR;
  if (status === "CAUTION") return CAUTION_COLOR;
  return NEUTRAL_COLOR;
}

function confidenceColor(c: string): string {
  if (c === "HIGH") return SUPPORT_COLOR;
  if (c === "LOW") return CAUTION_COLOR;
  return NEUTRAL_COLOR;
}

function strengthColor(s: string): string {
  if (s === "STRONG") return SUPPORT_COLOR;
  if (s === "WEAK") return CAUTION_COLOR;
  return NEUTRAL_COLOR;
}

function strengthLabel(s: string, lang: Lang): string {
  if (s === "STRONG") return t("pred_strong", lang);
  if (s === "PARTIAL") return t("pred_partial", lang);
  return t("pred_weak", lang);
}

function confidenceLabel(c: string, lang: Lang): string {
  if (c === "HIGH") return t("pred_high", lang);
  if (c === "MEDIUM") return t("pred_medium", lang);
  return t("pred_low", lang);
}

// ── Single prediction card ────────────────────────────────────────────────────

type PredictionCardProps = {
  title: string;
  pred: LifeAreaPredictionData;
  lang: Lang;
  expanded: boolean;
  onToggle: () => void;
};

function PredictionCard({ title, pred, lang, expanded, onToggle }: PredictionCardProps) {
  const cc = confidenceColor(pred.confidence);
  const borderColor =
    pred.confidence === "HIGH"
      ? "rgba(74,222,128,0.3)"
      : pred.confidence === "LOW"
      ? "rgba(248,113,113,0.3)"
      : "rgba(251,191,36,0.25)";
  const bgColor =
    pred.confidence === "HIGH"
      ? "rgba(74,222,128,0.06)"
      : pred.confidence === "LOW"
      ? "rgba(248,113,113,0.06)"
      : "rgba(251,191,36,0.04)";

  return (
    <div
      style={{
        borderRadius: "12px",
        border: `1px solid ${borderColor}`,
        background: bgColor,
        overflow: "hidden",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.45,
            }}
          >
            {lang === "ta" ? pred.mainPredictionTa : pred.mainPredictionEn}
          </p>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: cc,
              border: `1px solid ${cc}`,
              borderRadius: "4px",
              padding: "2px 6px",
              whiteSpace: "nowrap",
            }}
          >
            {confidenceLabel(pred.confidence, lang)}
          </span>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Dasha + Transit support row */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "12px" }}>
            <div
              style={{
                flex: 1,
                minWidth: "120px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                style={{
                  margin: "0 0 3px",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                }}
              >
                {t("pred_dasha_support", lang)}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: strengthColor(pred.dashaSupport),
                }}
              >
                {strengthLabel(pred.dashaSupport, lang)}
              </p>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: "120px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p
                style={{
                  margin: "0 0 3px",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                }}
              >
                {t("pred_transit_support", lang)}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: strengthColor(pred.transitSupport),
                }}
              >
                {strengthLabel(pred.transitSupport, lang)}
              </p>
            </div>
            {pred.timingWindowStart && pred.timingWindowEnd && (
              <div
                style={{
                  flex: 2,
                  minWidth: "180px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 3px",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  {t("pred_timing_window", lang)}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
                  {pred.timingWindowStart} → {pred.timingWindowEnd}
                </p>
              </div>
            )}
          </div>

          {/* Supports */}
          {pred.supports.length > 0 && (
            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "0.63rem",
                  fontWeight: 700,
                  color: SUPPORT_COLOR,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                ✓ {t("pred_supports", lang)}
              </p>
              <ul style={{ margin: 0, padding: "0 0 0 14px", display: "flex", flexDirection: "column", gap: "3px" }}>
                {pred.supports.map((s, i) => (
                  <li key={i} style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>
                    {lang === "ta" ? s.ta : s.en}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenges */}
          {pred.challenges.length > 0 && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(248,113,113,0.07)",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: "0.63rem",
                  fontWeight: 700,
                  color: CAUTION_COLOR,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                ⚠ {t("pred_challenges", lang)}
              </p>
              <ul style={{ margin: 0, padding: "0 0 0 14px", display: "flex", flexDirection: "column", gap: "3px" }}>
                {pred.challenges.map((c, i) => (
                  <li key={i} style={{ fontSize: "0.74rem", color: "#f87171", lineHeight: 1.4 }}>
                    {lang === "ta" ? c.ta : c.en}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Astrological factors */}
          {pred.astrologicalFactors.length > 0 && (
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "0.63rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t("pred_factors", lang)}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {pred.astrologicalFactors.map((f) => {
                  const fc = supportColor(f.status);
                  return (
                    <div
                      key={f.key}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-start",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${fc}22`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          color: fc,
                          border: `1px solid ${fc}`,
                          borderRadius: "3px",
                          padding: "1px 5px",
                          whiteSpace: "nowrap",
                          marginTop: "1px",
                          flexShrink: 0,
                        }}
                      >
                        {f.status === "SUPPORT"
                          ? t("pred_support_badge", lang)
                          : f.status === "CAUTION"
                          ? t("pred_caution_badge", lang)
                          : t("pred_neutral_badge", lang)}
                      </span>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
                        {lang === "ta" ? f.detail.ta : f.detail.en}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main panel — all 4 predictions ───────────────────────────────────────────

type Props = {
  lang: Lang;
  predictions: PredictionBundle | null;
  loading: boolean;
};

type ExpandState = {
  marriage: boolean;
  career: boolean;
  wealth: boolean;
  health: boolean;
};

export function PredictionDetailPanel({ lang, predictions, loading }: Props) {
  const [expanded, setExpanded] = useState<ExpandState>({
    marriage: true,
    career: false,
    wealth: false,
    health: false,
  });

  function toggle(key: keyof ExpandState) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
        {t("pred_loading", lang)}
      </p>
    );
  }

  if (!predictions || (!predictions.marriage && !predictions.career && !predictions.wealth && !predictions.health)) {
    return (
      <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
        {t("pred_empty", lang)}
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {predictions.marriage && (
        <PredictionCard
          title={t("pred_marriage_title", lang)}
          pred={predictions.marriage}
          lang={lang}
          expanded={expanded.marriage}
          onToggle={() => toggle("marriage")}
        />
      )}
      {predictions.career && (
        <PredictionCard
          title={t("pred_career_title", lang)}
          pred={predictions.career}
          lang={lang}
          expanded={expanded.career}
          onToggle={() => toggle("career")}
        />
      )}
      {predictions.wealth && (
        <PredictionCard
          title={t("pred_wealth_title", lang)}
          pred={predictions.wealth}
          lang={lang}
          expanded={expanded.wealth}
          onToggle={() => toggle("wealth")}
        />
      )}
      {predictions.health && (
        <PredictionCard
          title={t("pred_health_title", lang)}
          pred={predictions.health}
          lang={lang}
          expanded={expanded.health}
          onToggle={() => toggle("health")}
        />
      )}
    </div>
  );
}

