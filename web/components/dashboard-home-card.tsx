"use client";

import { formatClockLabel, getScoreBand } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { DailyGuidanceData } from "@/lib/types";

interface DashboardHomeCardProps {
  lang: Lang;
  todayGuidance: DailyGuidanceData | null;
  onSeeFullGuidance: () => void;
  onJournal: () => void;
}

const SCORE_HIGH = "var(--color-score-high, #5C7654)";
const SCORE_MID = "var(--color-score-mid, #B85A2C)";
const SCORE_LOW = "var(--color-score-low, #A8482F)";

function BoltGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "12px", height: "12px" }}>
      <path d="M13 2L5 14h6l-1 8 9-13h-6l0-7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ width: "12px", height: "12px" }}>
      <path d="M4 10l4 4 8-8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: "12px", height: "12px" }}>
      <path d="M12 3l9 17H3L12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function DashboardHomeCard({
  lang,
  todayGuidance,
  onSeeFullGuidance,
  onJournal,
}: DashboardHomeCardProps) {
  if (!todayGuidance) return null;

  const band = getScoreBand(todayGuidance.score);
  const scoreColor = band.tone === "high" ? SCORE_HIGH : band.tone === "mid" ? SCORE_MID : SCORE_LOW;

  const bestWindow = todayGuidance.bestWindows?.[0] ?? null;
  const cautionWindow = todayGuidance.cautionWindows?.[0] ?? null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(184,90,44,0.08) 0%, rgba(255,255,255,0.9) 100%)",
        border: "1px solid rgba(184,90,44,0.22)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-5) var(--space-6)",
        marginBottom: "var(--space-5)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          marginBottom: "var(--space-3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)" }}>
          <span style={{ fontSize: "1.8rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{todayGuidance.score}</span>
          <span style={{ fontSize: "0.875rem", color: "var(--color-faint)", lineHeight: 1.3 }}>
            /100
            <br />
            <span style={{ color: scoreColor, fontWeight: 600 }}>{band.label}</span>
          </span>
        </div>

        <span
          style={{
            fontSize: "0.75rem",
            padding: "var(--space-1) var(--space-2_5)",
            borderRadius: "var(--radius-pill)",
            background: `${scoreColor}20`,
            color: scoreColor,
            border: `1px solid ${scoreColor}40`,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
          }}
        >
          <BoltGlyph />
          Live
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)", marginBottom: "var(--space-3)" }}>
        {bestWindow && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ color: SCORE_HIGH, display: "inline-flex", alignItems: "center" }}><CheckGlyph /></span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", minWidth: "70px" }}>{t("home_best_window", lang)}</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: SCORE_HIGH }}>{formatClockLabel(bestWindow.start)} - {formatClockLabel(bestWindow.end)}</span>
          </div>
        )}
        {cautionWindow && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ color: SCORE_LOW, display: "inline-flex", alignItems: "center" }}><WarningGlyph /></span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-faint)", minWidth: "70px" }}>{t("home_avoid_window", lang)}</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: SCORE_LOW }}>{formatClockLabel(cautionWindow.start)} - {formatClockLabel(cautionWindow.end)}</span>
          </div>
        )}
      </div>

      {todayGuidance.actionSuggestion && (
        <div
          style={{
            background: "rgba(255,255,255,0.75)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-2_5) var(--space-3_5)",
            marginBottom: "var(--space-3)",
          }}
        >
          <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {t("home_one_action", lang)}
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.45 }}>
            {lang === "ta" ? todayGuidance.actionSuggestion.ta : todayGuidance.actionSuggestion.en}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onSeeFullGuidance}
          style={{
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(184,90,44,0.4)",
            background: "rgba(184,90,44,0.12)",
            color: "var(--color-score-mid)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("home_see_full", lang)}
        </button>
        <button
          type="button"
          onClick={onJournal}
          style={{
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            color: "var(--color-muted)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("home_journal", lang)}
        </button>
      </div>
    </div>
  );
}
