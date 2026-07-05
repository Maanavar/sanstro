"use client";

import type { Lang } from "@/lib/i18n";
import { formatClockLabel } from "@/lib/format";
import type { PanchangamDailyResponseData } from "@/lib/types";

/**
 * Nova section 4 — "Your day at a glance" segmented timeline ribbon.
 * Built entirely from real panchangam data (Rahu Kalam + Nalla Neram slots);
 * range and segment count are derived per-day, never hardcoded, so a day
 * with one Nalla Neram slot (or none) still renders correctly.
 */

function timeToMinutes(value: string | undefined | null): number | null {
  if (!value) return null;
  const timePart = value.includes("T") ? value.split("T")[1] : value;
  const [hhStr, mmStr] = (timePart ?? "").split(":");
  const hh = Number.parseInt(hhStr ?? "", 10);
  const mm = Number.parseInt(mmStr ?? "0", 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

type Segment = {
  key: string;
  startMin: number;
  endMin: number;
  color: string;
  label: string;
};

export function DashboardTodayRibbonNova({
  lang,
  panchangam,
  onGoToCalendar,
}: {
  lang: Lang;
  panchangam: PanchangamDailyResponseData | null;
  onGoToCalendar?: () => void;
}) {
  if (!panchangam) return null;

  const sunriseMin = timeToMinutes(panchangam.sunrise);
  const sunsetMin = timeToMinutes(panchangam.sunset);
  if (sunriseMin === null || sunsetMin === null) return null;

  const segments: Segment[] = [];

  const rahuStart = timeToMinutes(panchangam.kalam.rahuKalam.start);
  const rahuEnd = timeToMinutes(panchangam.kalam.rahuKalam.end);
  if (rahuStart !== null && rahuEnd !== null) {
    segments.push({
      key: "rahu",
      startMin: rahuStart,
      endMin: rahuEnd,
      color: "var(--color-low)",
      label: `${lang === "ta" ? "ராகு காலம்" : "Rahu Kalam"} ${formatClockLabel(panchangam.kalam.rahuKalam.start)}–${formatClockLabel(panchangam.kalam.rahuKalam.end)}`,
    });
  }

  (panchangam.kalam.nallaNeram ?? []).forEach((slot, i) => {
    const s = timeToMinutes(slot.start);
    const e = timeToMinutes(slot.end);
    if (s === null || e === null) return;
    segments.push({
      key: `nalla-${i}`,
      startMin: s,
      endMin: e,
      color: "var(--color-high)",
      label: `${lang === "ta" ? "நல்ல நேரம்" : "Nalla Neram"} ${formatClockLabel(slot.start)}–${formatClockLabel(slot.end)}`,
    });
  });

  // Range: sunrise to the later of (sunset + 3h cushion) or the latest segment end,
  // so evening Nalla Neram slots that fall after sunset never clip.
  const latestSegmentEnd = segments.reduce((max, s) => Math.max(max, s.endMin), 0);
  const rangeStart = sunriseMin;
  const rangeEnd = Math.max(sunsetMin + 180, latestSegmentEnd, rangeStart + 60);
  const rangeSpan = rangeEnd - rangeStart;

  function pct(minutes: number): number {
    return Math.max(0, Math.min(100, ((minutes - rangeStart) / rangeSpan) * 100));
  }

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowInRange = nowMin >= rangeStart && nowMin <= rangeEnd;
  const nowPct = pct(nowMin);
  const nowLabel = now.toLocaleTimeString(lang === "ta" ? "ta-IN" : "en-IN", { hour: "numeric", minute: "2-digit" });

  // Hour tick marks every ~3h across the real range.
  const ticks: number[] = [];
  for (let m = Math.ceil(rangeStart / 60) * 60; m <= rangeEnd; m += 180) {
    ticks.push(m);
  }

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 24px 18px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
            {lang === "ta" ? "இன்றைய நேரப்பட்டி" : "Your day at a glance"}
          </span>
          <span style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>
            {formatClockLabel(panchangam.sunrise)} → {formatClockLabel(panchangam.sunset)}
          </span>
        </div>
        {nowInRange && (
          <span style={{ fontSize: "11.5px", color: "var(--color-high)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-high)", boxShadow: "0 0 0 3px var(--color-high-bg)" }} />
            {lang === "ta" ? "இப்போது" : "Now"} · {nowLabel}
          </span>
        )}
      </div>

      <div style={{ position: "relative", height: "40px", borderRadius: "8px", overflow: "hidden", background: "rgba(243,236,221,0.05)" }}>
        {segments.map((s) => (
          <div
            key={s.key}
            title={s.label}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${pct(s.startMin)}%`,
              width: `${Math.max(pct(s.endMin) - pct(s.startMin), 1.5)}%`,
              background: s.color,
              opacity: 0.55,
            }}
          />
        ))}
        {nowInRange && (
          <div style={{ position: "absolute", top: "-4px", bottom: "-4px", left: `${nowPct}%`, width: "2px", background: "var(--color-high)", boxShadow: "0 0 8px var(--color-high)" }} />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", color: "var(--color-faint)", marginTop: "7px" }}>
        {ticks.map((m) => (
          <span key={m}>{formatClockLabel(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)}</span>
        ))}
      </div>

      <div style={{ display: "flex", gap: "20px", marginTop: "12px", fontSize: "12px", color: "var(--color-text)", flexWrap: "wrap", alignItems: "center" }}>
        {segments.map((s) => (
          <span key={`legend-${s.key}`} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: s.color }} />
            {s.label}
          </span>
        ))}
        {onGoToCalendar && (
          <button
            type="button"
            onClick={onGoToCalendar}
            style={{ marginLeft: "auto", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}
          >
            {lang === "ta" ? "முழு பஞ்சாங்கம் →" : "Full panchangam →"}
          </button>
        )}
      </div>
    </div>
  );
}
