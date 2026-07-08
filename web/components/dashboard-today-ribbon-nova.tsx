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

const RAHU_BG = "#6b332e";
const RAHU_FG = "#f3ecdd";
const BEST_BG = "var(--color-accent)";
const BEST_FG = "var(--color-on-accent)";
const GOOD_BG = "#5f7a68";
const GOOD_FG = "#f3ecdd";

type PartOfDay = "morning" | "afternoon" | "evening";

function partOfDay(startMin: number): PartOfDay {
  const hour = Math.floor(startMin / 60) % 24;
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const PART_OF_DAY_TEXT: Record<PartOfDay, { badge: { en: string; ta: string }; legend: { en: string; ta: string } }> = {
  morning:   { badge: { en: "GOOD AM",  ta: "காலை" },   legend: { en: "Good morning",   ta: "காலை நல்ல நேரம்" } },
  afternoon: { badge: { en: "GOOD DAY", ta: "மதியம்" }, legend: { en: "Good afternoon", ta: "மதிய நல்ல நேரம்" } },
  evening:   { badge: { en: "GOOD EVE", ta: "மாலை" },   legend: { en: "Good evening",   ta: "மாலை நல்ல நேரம்" } },
};

type Segment = {
  key: string;
  startMin: number;
  endMin: number;
  bg: string;
  fg: string;
  badge: string;
  legendName: string;
  legendTime: string;
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
      bg: RAHU_BG,
      fg: RAHU_FG,
      badge: lang === "ta" ? "ராகு காலம்" : "RAHU KALAM",
      legendName: lang === "ta" ? "ராகு காலம்" : "Rahu Kalam",
      legendTime: `${formatClockLabel(panchangam.kalam.rahuKalam.start)} – ${formatClockLabel(panchangam.kalam.rahuKalam.end)}`,
    });
  }

  (panchangam.kalam.nallaNeram ?? []).forEach((slot, i) => {
    const s = timeToMinutes(slot.start);
    const e = timeToMinutes(slot.end);
    if (s === null || e === null) return;
    if (i === 0) {
      segments.push({
        key: `nalla-${i}`,
        startMin: s,
        endMin: e,
        bg: BEST_BG,
        fg: BEST_FG,
        badge: lang === "ta" ? "சிறந்தது" : "BEST",
        legendName: lang === "ta" ? "நல்ல நேரம்" : "Nalla Neram",
        legendTime: `${formatClockLabel(slot.start)} – ${formatClockLabel(slot.end)}`,
      });
    } else {
      const part = PART_OF_DAY_TEXT[partOfDay(s)];
      segments.push({
        key: `nalla-${i}`,
        startMin: s,
        endMin: e,
        bg: GOOD_BG,
        fg: GOOD_FG,
        badge: lang === "ta" ? part.badge.ta : part.badge.en,
        legendName: lang === "ta" ? part.legend.ta : part.legend.en,
        legendTime: `${formatClockLabel(slot.start)} – ${formatClockLabel(slot.end)}`,
      });
    }
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
            {lang === "ta" ? "சூரிய உதயம்" : "sunrise"} {formatClockLabel(panchangam.sunrise)} → {formatClockLabel(panchangam.sunset)}
          </span>
        </div>
        {nowInRange && (
          <span style={{ fontSize: "11.5px", color: "var(--color-text)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--color-high)", boxShadow: "0 0 0 3px var(--color-high-bg)" }} />
            {lang === "ta" ? "இப்போது" : "Now"} · {nowLabel}
          </span>
        )}
      </div>

      <div
        style={{
          position: "relative",
          height: "44px",
          borderRadius: "10px",
          overflow: "hidden",
          background: "var(--color-surface-3)",
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(243,236,221,0.07) 0px, rgba(243,236,221,0.07) 1px, transparent 1px, transparent 7px)",
        }}
      >
        {segments.map((s) => {
          const widthPct = pct(s.endMin) - pct(s.startMin);
          return (
            <div
              key={s.key}
              title={`${s.legendName} ${s.legendTime}`}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${pct(s.startMin)}%`,
                width: `${Math.max(widthPct, 1.5)}%`,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {widthPct >= 6 && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: s.fg,
                    whiteSpace: "nowrap",
                    padding: "0 6px",
                  }}
                >
                  {s.badge}
                </span>
              )}
            </div>
          );
        })}
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
            <span style={{ width: "9px", height: "9px", borderRadius: "2px", background: s.bg, flex: "none" }} />
            <span style={{ color: "var(--color-text-strong)", fontWeight: 600 }}>{s.legendName}</span>
            <span style={{ color: "var(--color-faint)" }}>{s.legendTime}</span>
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
