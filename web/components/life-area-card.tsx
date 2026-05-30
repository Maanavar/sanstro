"use client";

import { getScoreBand } from "@/lib/format";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LifeAreaData } from "@/lib/types";

interface LifeAreaCardProps {
  area: LifeAreaData;
  lang: Lang;
  ageRelevant: boolean;
  onOpenDetail?: () => void;
}

export function LifeAreaCard({ area, lang, ageRelevant, onOpenDetail }: LifeAreaCardProps) {
  const scoreBand = getScoreBand(area.score);

  /* Score bar + trend colors in Clarity palette */
  const barColor =
    scoreBand.tone === "high" ? "#5C7654"
    : scoreBand.tone === "low" ? "#A8482F"
    : "#B85A2C";

  const trendIcon = area.trend === "UP" ? "↑ UP" : area.trend === "DOWN" ? "↓ DOWN" : "– FLAT";
  const trendColor =
    area.trend === "UP" ? "#5C7654"
    : area.trend === "DOWN" ? "#A8482F"
    : "#B85A2C";

  return (
    <div style={{
      padding: "24px 28px",
      borderRadius: "20px",
      background: "#FFFFFF",
      border: "1px solid #E4DBC8",
      display: "flex",
      flexDirection: "column",
      gap: "0",
      opacity: ageRelevant ? 1 : 0.32,
      boxShadow: "0 2px 12px rgba(60,40,20,0.06)",
      fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif",
    }}>

      {/* ── Header: area label + trend ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, color: "#A89D89", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {tLang(area.label, lang)}
        </p>
        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: trendColor, letterSpacing: "0.06em" }}>
          {trendIcon}
        </span>
      </div>

      {/* ── Fraunces score number ── */}
      <p style={{ margin: "0 0 10px", fontFamily: "'Fraunces', Georgia, serif", fontSize: "3.6rem", fontWeight: 500, lineHeight: 1, color: "#1A1612", letterSpacing: "-0.03em" }}>
        {area.score}
        <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.95rem", fontWeight: 400, color: "#A89D89", marginLeft: "2px" }}>/100</span>
      </p>

      {/* ── Score bar ── */}
      <div style={{ height: "4px", borderRadius: "999px", background: "#E4DBC8", marginBottom: "16px", overflow: "hidden" }}>
        <div style={{ width: `${area.score}%`, height: "100%", borderRadius: "999px", background: barColor }} />
      </div>

      {/* ── Narrative ── */}
      <p style={{ margin: "0 0 16px", fontSize: "0.88rem", color: "#3D352B", lineHeight: 1.6 }}>
        {tLang(area.narrative, lang)}
      </p>

      {/* ── Karaka · house footer ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #E4DBC8" }}>
        <span style={{ fontSize: "0.72rem", color: "#A89D89" }}>
          {t("life_area_karaka", lang)} · {lang === "ta" ? "கிரகம்" : "planet"}
        </span>
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7A6F5E" }}>
          {area.driver?.planet ?? "—"}
        </span>
      </div>

      {/* ── Caution (collapsed under border) ── */}
      {area.caution && (
        <div style={{ marginTop: "12px", padding: "8px 12px", borderRadius: "8px", background: "#F2D8CC", border: "1px solid rgba(168,72,47,0.3)" }}>
          <p style={{ margin: 0, fontSize: "0.74rem", color: "#8c3e18", lineHeight: 1.45 }}>
            ⚠ {tLang(area.caution, lang)}
          </p>
        </div>
      )}

      {/* ── Remedy ── */}
      {area.remedy && (
        <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "8px", background: "#F0D9C4", border: "1px solid rgba(184,90,44,0.25)" }}>
          <p style={{ margin: "0 0 2px", fontSize: "0.58rem", fontWeight: 700, color: "#B85A2C", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t("remedy_label", lang)}
          </p>
          <p style={{ margin: 0, fontSize: "0.74rem", color: "#7a3412", lineHeight: 1.45 }}>
            {tLang(area.remedy, lang)}
          </p>
        </div>
      )}

      {/* ── Details button ── */}
      {onOpenDetail && (
        <button
          type="button"
          onClick={onOpenDetail}
          style={{
            alignSelf: "flex-end",
            marginTop: "12px",
            padding: "5px 16px",
            borderRadius: "999px",
            border: "1.5px solid #D4C8AE",
            background: "transparent",
            color: "#7A6F5E",
            fontSize: "0.74rem",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "border-color 120ms ease, color 120ms ease",
          }}
        >
          {lang === "ta" ? "விவரம் →" : "Details →"}
        </button>
      )}
    </div>
  );
}
