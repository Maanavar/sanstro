"use client";

import { useEffect, useState } from "react";

import { formatDateLabel } from "@/lib/format";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { classifyPeyarchiToneFromMoon } from "@/lib/peyarchi";
import type { PeyarchiEvent, PeyarchiReportData } from "@/lib/types";

type PeyarchiBannerProps = {
  events: PeyarchiEvent[];
  lang: Lang;
  peyarchiReport: PeyarchiReportData | null;
};

type BannerTone = "supportive" | "neutral" | "caution";

function tonePalette(tone: BannerTone) {
  if (tone === "supportive") {
    return {
      border: "rgba(92,118,84,0.4)",
      background: "#DCE4D2",
      text: "#3a6b40",
      mutedText: "#5C7654",
    };
  }
  if (tone === "caution") {
    return {
      border: "rgba(168,72,47,0.35)",
      background: "#F2D8CC",
      text: "#8c3e18",
      mutedText: "#A8482F",
    };
  }
  return {
    border: "rgba(184,90,44,0.35)",
    background: "#F0D9C4",
    text: "#7a3412",
    mutedText: "#B85A2C",
  };
}

export function PeyarchiBanner({ events, lang, peyarchiReport }: PeyarchiBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [outlookExpanded, setOutlookExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const nextDismissed: Record<string, boolean> = {};
    for (const event of events) {
      if (window.localStorage.getItem(`peyarchi:dismissed:${event.alertId}`) === "1") {
        nextDismissed[event.alertId] = true;
      }
    }
    setDismissed(nextDismissed);
  }, [events]);

  if (!mounted) {
    return null;
  }

  const visible = events.find((event) => !dismissed[event.alertId]) ?? null;

  if (!visible) {
    return null;
  }

  const palette = tonePalette(classifyPeyarchiToneFromMoon(visible.planet, visible.impactFromMoon));
  const borderColor = palette.border;
  const background = palette.background;
  const textColor = palette.text;

  const messageEn = `${visible.labelEn} moves to ${visible.toRasi} on ${formatDateLabel(visible.peyarchiDateLocal)} (${visible.daysFromToday} days away). This places it in the ${visible.impactFromMoon}th house from Moon.`;
  const messageTa = `${visible.labelTa}: ${visible.toRasi} rasiyil ${formatDateLabel(visible.peyarchiDateLocal)} (${visible.daysFromToday} naatkalil). Ithu Chandira rasiyilirundhu ${visible.impactFromMoon}-am idaththai kurikkirathu.`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "10px",
          padding: "12px 14px",
          borderRadius: "10px",
          border: `1px solid ${borderColor}`,
          background,
        }}
      >
        <p style={{ margin: 0, color: textColor, fontSize: "0.84rem", lineHeight: 1.45, flex: 1 }}>
          {lang === "ta" ? messageTa : messageEn}
        </p>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          {peyarchiReport && peyarchiReport.events.length > 0 && (
            <button
              type="button"
              onClick={() => setOutlookExpanded((v) => !v)}
              style={{
                border: `1px solid ${borderColor}`,
                background: "transparent",
                color: textColor,
                borderRadius: "6px",
                padding: "3px 8px",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}
            >
              {outlookExpanded ? t("btn_hide_outlook", lang) : t("btn_view_outlook", lang)}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(`peyarchi:dismissed:${visible.alertId}`, "1");
              setDismissed((current) => ({ ...current, [visible.alertId]: true }));
            }}
            title="Dismiss"
            style={{
              border: `1px solid ${borderColor}`,
              background: "transparent",
              color: palette.mutedText,
              borderRadius: "999px",
              width: "24px",
              height: "24px",
              cursor: "pointer",
              fontSize: "0.7rem",
              fontWeight: 600,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* FEATURE-11: Peyarchi report outlook panel */}
      {outlookExpanded && peyarchiReport && peyarchiReport.events.length > 0 && (
        <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#FAF5EA", border: "1px solid #D4C8AE" }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, color: "#7A6F5E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            🪐 {t("peyarchi_outlook_label", lang)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {peyarchiReport.events.map((ev, i) => {
              const evTone = classifyPeyarchiToneFromMoon(ev.planet, ev.houseFromMoon);
              const evPalette = tonePalette(evTone);
              return (
              <div key={`${ev.planet}-${ev.transitDate}-${i}`} style={{ padding: "8px 10px", borderRadius: "6px", background: evPalette.background, border: `1px solid ${evPalette.border}` }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.7rem", color: evPalette.mutedText, fontWeight: 600 }}>
                  {tPlanetLord(ev.planet, lang)} · {ev.transitDate} · {lang === "ta" ? "சந்திர ராசியிலிருந்து" : "House"} {ev.houseFromMoon} {lang === "ta" ? "வீடு" : "from Moon"}
                </p>
                <p style={{ margin: 0, fontSize: "0.76rem", color: evPalette.text, lineHeight: 1.45 }}>
                  {lang === "ta" ? ev.outlookTa : ev.outlookEn}
                </p>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

