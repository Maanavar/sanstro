"use client";

import { useRef, useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { DashaTimelineItem, DashaTimelineResponseData } from "@/lib/types";
import { plainLangDashaLord } from "@/lib/plainlang";

type Mode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

interface DashboardDashaScrubberProps {
  lang: Lang;
  mode?: Mode;
  dashaMaha: DashaTimelineResponseData | null;
  todayDate: string;
}

const LORD_COLOR: Record<string, string> = {
  SUN:     "#f97316",
  MOON:    "#a78bfa",
  MARS:    "#ef4444",
  RAHU:    "#6366f1",
  JUPITER: "#eab308",
  SATURN:  "#64748b",
  MERCURY: "#22c55e",
  KETU:    "#e879f9",
  VENUS:   "#ec4899",
};

function lordColor(lord: string): string {
  return LORD_COLOR[lord.toUpperCase()] ?? "#94a3b8";
}

function yearsBetween(start: string, end: string): number {
  return Math.max(0.5, (new Date(end).getTime() - new Date(start).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function formatYear(iso: string): string {
  return iso.slice(0, 4);
}

function isCurrent(item: DashaTimelineItem, today: string): boolean {
  return item.startDate <= today && item.endDate >= today;
}

function isPast(item: DashaTimelineItem, today: string): boolean {
  return item.endDate < today;
}

export function DashboardDashaScrubber({
  lang,
  mode = "BALANCED",
  dashaMaha,
  todayDate,
}: DashboardDashaScrubberProps) {
  const [selectedLord, setSelectedLord] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!dashaMaha) return null;

  const mahas = dashaMaha.timeline.filter(p => p.level === "maha");
  if (mahas.length === 0) return null;

  const totalYears = mahas.reduce((s, p) => s + yearsBetween(p.startDate, p.endDate), 0);
  const currentItem = mahas.find(p => isCurrent(p, todayDate));

  return (
    <div
      style={{
        border: "1px solid var(--color-border, #e2e8f0)",
        borderRadius: "12px",
        padding: "16px",
        background: "var(--color-surface)",
        marginBottom: "16px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-muted, #94a3b8)",
          marginBottom: "12px",
        }}
      >
        {lang === "ta" ? "தசை காலரேகை" : "Dasha Timeline"}
      </p>

      {/* Horizontal scrubber track */}
      <div
        ref={scrollRef}
        style={{
          overflowX: "auto",
          paddingBottom: "6px",
          cursor: "grab",
        }}
      >
        <div
          style={{
            display: "flex",
            minWidth: "max-content",
            height: "48px",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {mahas.map((p, i) => {
            const widthPct = (yearsBetween(p.startDate, p.endDate) / totalYears) * 100;
            const past = isPast(p, todayDate);
            const current = isCurrent(p, todayDate);
            const color = lordColor(p.lord);
            const isSelected = selectedLord === p.lord + i;

            return (
              <div
                key={`${p.lord}-${i}`}
                title={`${p.lord} ${formatYear(p.startDate)}–${formatYear(p.endDate)}`}
                onClick={() => setSelectedLord(prev => (prev === p.lord + i ? null : p.lord + i))}
                style={{
                  width: `${widthPct}%`,
                  minWidth: "40px",
                  background: past ? `${color}40` : color,
                  opacity: past ? 0.5 : 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                  border: current ? "2px solid var(--color-on-accent, #fff)" : isSelected ? `2px solid ${color}` : "none",
                  boxSizing: "border-box",
                  transition: "opacity 0.15s",
                  zIndex: current || isSelected ? 2 : 1,
                }}
              >
                {/* Lord name */}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: past ? "var(--color-muted, #64748b)" : "var(--color-on-accent, #fff)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "90%",
                  }}
                >
                  {mode === "BEGINNER"
                    ? plainLangDashaLord(p.lord, "BEGINNER", lang)
                    : p.lord.charAt(0) + p.lord.slice(1).toLowerCase()}
                </span>
                {/* Years */}
                <span
                  style={{
                    fontSize: "9px",
                    color: past ? "var(--color-muted, #94a3b8)" : "rgba(255,255,255,0.8)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatYear(p.startDate)}–{formatYear(p.endDate)}
                </span>

                {/* You-are-here marker */}
                {current && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "0",
                      height: "0",
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: "6px solid var(--color-on-accent, #fff)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* You are here label */}
      {currentItem && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-muted, #94a3b8)", marginTop: "10px", textAlign: "center" }}>
          ▲ {t("dasha_you_are_here", lang)} — {mode === "BEGINNER" ? plainLangDashaLord(currentItem.lord, "BEGINNER", lang) : currentItem.lord} (
          {formatYear(currentItem.startDate)}–{formatYear(currentItem.endDate)})
        </p>
      )}

      {/* Expanded detail card for selected era */}
      {selectedLord && (() => {
        const idx = parseInt(selectedLord.replace(/[^0-9]/g, ""), 10);
        const item = mahas[idx];
        if (!item) return null;
        const past = isPast(item, todayDate);
        const current = isCurrent(item, todayDate);
        const color = lordColor(item.lord);
        const antars = dashaMaha.timeline.filter(
          p => p.level === "antar" && p.startDate >= item.startDate && p.endDate <= item.endDate
        );

        return (
          <div
            style={{
              marginTop: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: `1px solid ${color}44`,
              background: `${color}0a`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
              <strong style={{ fontSize: "0.9rem" }}>
                {mode === "BEGINNER"
                  ? plainLangDashaLord(item.lord, "BEGINNER", lang)
                  : item.lord.charAt(0) + item.lord.slice(1).toLowerCase()}{" "}
                {lang === "ta" ? "தசை" : "Dasha"}{" "}
                <span style={{ fontWeight: 400, color: "var(--color-muted, #64748b)" }}>
                  {formatYear(item.startDate)}–{formatYear(item.endDate)}
                </span>
              </strong>
              {current && (
                <span style={{ fontSize: "10px", background: color, color: "var(--color-on-accent, #fff)", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                  {t("dasha_you_are_here", lang)}
                </span>
              )}
              {past && (
                <span style={{ fontSize: "10px", color: "var(--color-muted, #94a3b8)" }}>
                  {t("dasha_past_era", lang)}
                </span>
              )}
              {!past && !current && (
                <span style={{ fontSize: "10px", color: "var(--color-muted, #64748b)" }}>
                  {t("dasha_future_era", lang)}
                </span>
              )}
            </div>

            <p style={{ fontSize: "0.8rem", color: "var(--color-muted, #64748b)", marginBottom: antars.length > 0 ? "10px" : "0" }}>
              {Math.round(yearsBetween(item.startDate, item.endDate))}{" "}
              {lang === "ta" ? "ஆண்டுகள் நீடிக்கும்" : "year period"}
            </p>

            {/* Antar periods */}
            {antars.length > 0 && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-muted, #94a3b8)", marginBottom: "6px" }}>
                  {lang === "ta" ? "அந்தர்தசைகள்" : "Sub-periods"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {antars.slice(0, 9).map((a, ai) => {
                    const aCurrent = isCurrent(a, todayDate);
                    const aColor = lordColor(a.lord);
                    return (
                      <div
                        key={ai}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: aCurrent ? aColor : `${aColor}20`,
                          color: aCurrent ? "var(--color-on-accent, #fff)" : "var(--color-text, #1e293b)",
                          fontSize: "11px",
                          fontWeight: aCurrent ? 700 : 400,
                          border: `1px solid ${aColor}44`,
                        }}
                      >
                        {mode === "BEGINNER"
                          ? plainLangDashaLord(a.lord, "BEGINNER", lang)
                          : a.lord.charAt(0) + a.lord.slice(1).toLowerCase()}{" "}
                        <span style={{ opacity: 0.7 }}>{formatYear(a.startDate)}–{formatYear(a.endDate)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
