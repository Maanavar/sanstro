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

export function DashboardHomeCard({
  lang,
  todayGuidance,
  onSeeFullGuidance,
  onJournal,
}: DashboardHomeCardProps) {
  if (!todayGuidance) return null;

  const band = getScoreBand(todayGuidance.score);
  const scoreColour =
    band.tone === "high"
      ? "#4ade80"
      : band.tone === "mid"
      ? "#fbbf24"
      : "#f87171";

  const bestWindow = todayGuidance.bestWindows?.[0] ?? null;
  const cautionWindow = todayGuidance.cautionWindows?.[0] ?? null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(229,184,77,0.08) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(229,184,77,0.25)",
        borderRadius: "14px",
        padding: "20px 24px",
        marginBottom: "20px",
      }}
    >
      {/* Score line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: scoreColour,
              lineHeight: 1,
            }}
          >
            {todayGuidance.score}
          </span>
          <span
            style={{
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.3,
            }}
          >
            /100
            <br />
            <span style={{ color: scoreColour, fontWeight: 600 }}>
              {band.label}
            </span>
          </span>
        </div>
        <span
          style={{
            fontSize: "0.7rem",
            padding: "4px 10px",
            borderRadius: "999px",
            background: `${scoreColour}20`,
            color: scoreColour,
            border: `1px solid ${scoreColour}40`,
            fontWeight: 600,
          }}
        >
          ⚡
        </span>
      </div>

      {/* Windows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        {bestWindow && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem" }}>✅</span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", minWidth: "70px" }}>
              {t("home_best_window", lang)}
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#4ade80" }}>
              {formatClockLabel(bestWindow.start)} – {formatClockLabel(bestWindow.end)}
            </span>
          </div>
        )}
        {cautionWindow && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem" }}>⚠️</span>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", minWidth: "70px" }}>
              {t("home_avoid_window", lang)}
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#f87171" }}>
              {formatClockLabel(cautionWindow.start)} – {formatClockLabel(cautionWindow.end)}
            </span>
          </div>
        )}
      </div>

      {/* Action suggestion */}
      {todayGuidance.actionSuggestion && (
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            padding: "10px 14px",
            marginBottom: "14px",
          }}
        >
          <p
            style={{
              margin: "0 0 2px",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            📍 {t("home_one_action", lang)}
          </p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.45 }}>
            {lang === "ta" ? todayGuidance.actionSuggestion.ta : todayGuidance.actionSuggestion.en}
          </p>
        </div>
      )}

      {/* CTAs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onSeeFullGuidance}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(229,184,77,0.4)",
            background: "rgba(229,184,77,0.12)",
            color: "#e5b84d",
            fontSize: "0.8rem",
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
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.8rem",
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
