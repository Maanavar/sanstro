"use client";

import { useMemo, useState } from "react";

import { formatClockLabel } from "@/lib/format";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  BirthProfileSnapshot,
  DailyGuidanceData,
  PanchangamDailyResponseData,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";
import { getBirthTimeConfidence, getScoreDrivers, type ScoreDriver } from "@/lib/uiux-enhancements";

import { Chip, Surface } from "./dashboard-ui";

function driverLabel(driver: ScoreDriver | null, lang: Lang): string {
  if (!driver) return "—";
  if (!driver.reasonKey) {
    return lang === "ta" ? "Pariharam support" : "Remedial support";
  }
  return t(`reason_${driver.reasonKey}` as any, lang);
}

export function DashboardDailySnapshot({
  lang,
  guidance,
  transit,
  sani,
  panchangam,
  birthProfile,
}: {
  lang: Lang;
  guidance: DailyGuidanceData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  panchangam: PanchangamDailyResponseData | null;
  birthProfile: BirthProfileSnapshot | null;
}) {
  const [showDualLanguage, setShowDualLanguage] = useState(false);

  const drivers = useMemo(
    () => (guidance ? getScoreDrivers(guidance.scoreBreakdown) : null),
    [guidance],
  );
  const confidence = getBirthTimeConfidence(birthProfile);

  if (!guidance) {
    return null;
  }

  const actionPrimary = tLang(guidance.actionSuggestion, lang);
  const actionSecondary = lang === "ta" ? guidance.actionSuggestion.en : guidance.actionSuggestion.ta;
  const scoreSummaryPrimary = tLang(guidance.text, lang);
  const scoreSummarySecondary = lang === "ta" ? guidance.text.en : guidance.text.ta;

  const confidenceLabel =
    confidence.level === "high"
      ? (lang === "ta" ? "High confidence" : "High confidence")
      : confidence.level === "medium"
        ? (lang === "ta" ? "Moderate confidence" : "Moderate confidence")
        : confidence.level === "low"
          ? (lang === "ta" ? "Low confidence" : "Low confidence")
          : (lang === "ta" ? "Birth time not set" : "Birth time not set");

  return (
    <Surface title={`${t("personal_today", lang)} Snapshot`}>
      <div className="surface__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <p className="surface__text" style={{ margin: 0 }}>
            {scoreSummaryPrimary}
          </p>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setShowDualLanguage((v) => !v)}
            style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "0.72rem" }}
          >
            {showDualLanguage ? "Single language" : "TA + EN"}
          </button>
        </div>

        {showDualLanguage && (
          <p className="surface__text" style={{ marginTop: "6px", color: "rgba(255,255,255,0.55)" }}>
            {scoreSummarySecondary}
          </p>
        )}

        <div className="snapshot-grid">
          <div className="snapshot-box">
            <p className="snapshot-kicker">Score</p>
            <p className="snapshot-value">{guidance.score}/100</p>
            <p className="snapshot-hint">{guidance.label}</p>
          </div>

          <div className="snapshot-box">
            <p className="snapshot-kicker">Timing</p>
            <p className="snapshot-value">
              {guidance.bestWindows[0]
                ? `${formatClockLabel(guidance.bestWindows[0].start)}–${formatClockLabel(guidance.bestWindows[0].end)}`
                : "—"}
            </p>
            <p className="snapshot-hint">
              {guidance.cautionWindows[0]
                ? `Caution: ${formatClockLabel(guidance.cautionWindows[0].start)}–${formatClockLabel(guidance.cautionWindows[0].end)}`
                : "No caution window"}
            </p>
          </div>

          <div className="snapshot-box">
            <p className="snapshot-kicker">Current Focus</p>
            <p className="snapshot-value">
              {transit?.isChandrashtama
                ? (lang === "ta" ? "Chandrashtama care" : "Chandrashtama care")
                : sani?.moonBasedCycle.isActive
                  ? sani.moonBasedCycle.type ?? "Sani cycle"
                  : "Steady day"}
            </p>
            <p className="snapshot-hint">
              {panchangam
                ? `Rahu Kalam ${formatClockLabel(panchangam.kalam.rahuKalam.start)}–${formatClockLabel(panchangam.kalam.rahuKalam.end)}`
                : "Panchangam not loaded"}
            </p>
          </div>

          <div className="snapshot-box">
            <p className="snapshot-kicker">Birth Data Confidence</p>
            <p className="snapshot-value">{confidenceLabel}</p>
            <p className="snapshot-hint">
              {birthProfile?.birthTimezone ?? "Timezone missing"}
              {confidence.minutes !== null ? ` • ±${confidence.minutes}m` : ""}
            </p>
          </div>
        </div>

        <div className="snapshot-action">
          <p className="snapshot-kicker" style={{ marginBottom: "4px" }}>
            One focused action
          </p>
          <p style={{ margin: 0, fontSize: "0.84rem", color: "rgba(255,255,255,0.76)", lineHeight: 1.5 }}>{actionPrimary}</p>
          {showDualLanguage && actionSecondary && (
            <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.58)", lineHeight: 1.45 }}>
              {actionSecondary}
            </p>
          )}
        </div>

        <details className="snapshot-details">
          <summary>See why this score</summary>
          <div className="snapshot-details__content">
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              {drivers?.strongestSupport && (
                <Chip tone="success">
                  Top support: {driverLabel(drivers.strongestSupport, lang)} ({drivers.strongestSupport.value})
                </Chip>
              )}
              {drivers?.strongestCaution && (
                <Chip tone="warning">
                  Top caution: {driverLabel(drivers.strongestCaution, lang)} ({drivers.strongestCaution.value})
                </Chip>
              )}
            </div>

            <div className="snapshot-score-grid">
              {Object.entries(guidance.scoreBreakdown).map(([key, value]) => (
                <div key={key} className="snapshot-score-grid__row">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </Surface>
  );
}
