"use client";

import { useEffect, useState } from "react";

import { formatDateLabel } from "@/lib/format";
import { t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { PeyarchiEvent, PeyarchiReportData } from "@/lib/types";

type PeyarchiBannerProps = {
  events: PeyarchiEvent[];
  lang: Lang;
  peyarchiReport: PeyarchiReportData | null;
};

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

  const tone = visible.daysFromToday <= 7 ? "urgent" : "soon";
  const borderColor = tone === "urgent" ? "rgba(248,113,113,0.6)" : "rgba(251,191,36,0.55)";
  const background = tone === "urgent" ? "rgba(239,68,68,0.11)" : "rgba(251,191,36,0.1)";
  const textColor = tone === "urgent" ? "#fecaca" : "#fde68a";

  const messageEn = `${visible.labelEn} moves to ${visible.toRasi} on ${formatDateLabel(visible.peyarchiDateLocal)} - ${visible.daysFromToday} days away. This places it in the ${visible.impactFromMoon}th house from Moon.`;
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
              border: "1px solid rgba(255,255,255,0.22)",
              background: "transparent",
              color: "rgba(255,255,255,0.72)",
              borderRadius: "999px",
              width: "24px",
              height: "24px",
              cursor: "pointer",
            }}
          >
            x
          </button>
        </div>
      </div>

      {/* FEATURE-11: Peyarchi report outlook panel */}
      {outlookExpanded && peyarchiReport && peyarchiReport.events.length > 0 && (
        <div style={{ padding: "12px 14px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            🪐 {t("peyarchi_outlook_label", lang)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {peyarchiReport.events.map((ev, i) => (
              <div key={`${ev.planet}-${ev.transitDate}-${i}`} style={{ padding: "8px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                  {ev.planet} · {ev.transitDate} · House {ev.houseFromMoon} from Moon
                </p>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>
                  {lang === "ta" ? ev.outlookTa : ev.outlookEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


