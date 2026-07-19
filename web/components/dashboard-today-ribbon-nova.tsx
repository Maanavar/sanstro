"use client";

import { motion, useReducedMotion } from "framer-motion";

import { formatClockLabel, getScoreBand, scoreColorScale } from "@/lib/format";
import { tNakshatra, tTithi } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { DUR, EASE_NOVA } from "@/lib/motion";
import { formatClockInZone, minutesOfDayInZone } from "@/lib/tz";
import type { PanchangamDailyResponseData, WeekAheadData } from "@/lib/types";

/**
 * Nova "Your day" timeline spine — the single card that owns every panchangam
 * time: sunrise/sunset, Horai (current + next), the week-ahead dots, the
 * segmented Rahu Kalam / Yamagandam / Kuligai / Nalla Neram bar, and the
 * Nakshatram/Tithi/Vaaram footer. Nothing panchangam-related renders outside
 * this card on the Today tab — everything else (calendar month view, full
 * gowri table) lives one click away via "Full panchangam →".
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

// Segment fills/inks resolve through the --ribbon-* token set defined in
// dashboard-nova.css. Earlier these were literal hex/rgba pinned to
// text-strong / alert-critical at fixed opacities — fine while Nova was
// always dark, but under Light the translucent fills washed out on cream
// and dark type landed on saturated fills. The tokens flip per theme so
// every segment stays legible in both modes (see the ribbon block there).
const RAHU_BG = "var(--ribbon-rahu-bg)";
const RAHU_FG = "var(--ribbon-rahu-fg)";
const YAMA_BG = "var(--ribbon-yama-bg)";
const YAMA_FG = "var(--ribbon-yama-fg)";
const KULIGAI_BG = "var(--ribbon-kuligai-bg)";
const KULIGAI_FG = "var(--ribbon-kuligai-fg)";
const BEST_BG = "var(--ribbon-best-bg)";
const BEST_FG = "var(--ribbon-best-fg)";
const GOOD_BG = "var(--ribbon-good-bg)";
const GOOD_FG = "var(--ribbon-good-fg)";

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

/** Finds the Horai (planetary hour) active at `now`, and the one after it.
 *  panchangam.hora entries can wrap past midnight (night horas), so both the
 *  entry's own span and `now` are normalized onto a rolling clock before
 *  comparing. */
export function findHorai(hora: PanchangamDailyResponseData["hora"], nowMin: number) {
  if (!hora || hora.length === 0) return { current: null, next: null };
  const spans = hora.map((h) => {
    const s = timeToMinutes(h.start);
    let e = timeToMinutes(h.end);
    if (s === null || e === null) return null;
    if (e <= s) e += 1440;
    return { entry: h, s, e };
  }).filter((x): x is { entry: PanchangamDailyResponseData["hora"][number]; s: number; e: number } => x !== null);

  const inSpan = (s: number, e: number, m: number) => (m >= s && m < e) || (m + 1440 >= s && m + 1440 < e);
  const currentIdx = spans.findIndex(({ s, e }) => inSpan(s, e, nowMin));
  const current = currentIdx >= 0 ? spans[currentIdx] : null;
  const next = currentIdx >= 0 && currentIdx + 1 < spans.length ? spans[currentIdx + 1] : null;
  return { current: current?.entry ?? null, next: next?.entry ?? null };
}

export function DashboardTodayRibbonNova({
  lang,
  panchangam,
  weekAhead,
  selectedDate,
  now,
  timeZone,
  onGoToCalendar,
}: {
  lang: Lang;
  panchangam: PanchangamDailyResponseData | null;
  weekAhead: WeekAheadData | null;
  selectedDate: string;
  now: Date;
  /** Panchangam timezone — the NOW marker and Horai lookup are computed in
   *  this zone, since every time on this card is wall-clock at the panchangam
   *  location, not the browser's (DASH-01). */
  timeZone?: string | null;
  onGoToCalendar?: () => void;
}) {
  // Page-turn: the whole ribbon re-reveals when the selected day changes, so
  // switching dates reads as turning to a fresh page of the almanac rather than
  // silently swapping numbers in place. Gated on reduced-motion in JS since the
  // key-remount replays a framer transform the CSS guard can't reach.
  const reduce = useReducedMotion();

  if (!panchangam) return null;

  const sunriseMin = timeToMinutes(panchangam.sunrise);
  const sunsetMin = timeToMinutes(panchangam.sunset);
  if (sunriseMin === null || sunsetMin === null) return null;

  const segments: Segment[] = [];

  const yamaStart = timeToMinutes(panchangam.kalam.yamagandam.start);
  const yamaEnd = timeToMinutes(panchangam.kalam.yamagandam.end);
  if (yamaStart !== null && yamaEnd !== null) {
    segments.push({
      key: "yama",
      startMin: yamaStart,
      endMin: yamaEnd,
      bg: YAMA_BG,
      fg: YAMA_FG,
      badge: lang === "ta" ? "யமகண்டம்" : "YAMAGANDAM",
      legendName: lang === "ta" ? "யமகண்டம்" : "Yamagandam",
      legendTime: `${formatClockLabel(panchangam.kalam.yamagandam.start)} – ${formatClockLabel(panchangam.kalam.yamagandam.end)}`,
    });
  }

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

  const kuligaiStart = timeToMinutes(panchangam.kalam.kuligai.start);
  const kuligaiEnd = timeToMinutes(panchangam.kalam.kuligai.end);
  if (kuligaiStart !== null && kuligaiEnd !== null) {
    segments.push({
      key: "kuligai",
      startMin: kuligaiStart,
      endMin: kuligaiEnd,
      bg: KULIGAI_BG,
      fg: KULIGAI_FG,
      badge: lang === "ta" ? "குளிகை" : "KULIGAI",
      legendName: lang === "ta" ? "குளிகை" : "Kuligai",
      legendTime: `${formatClockLabel(panchangam.kalam.kuligai.start)} – ${formatClockLabel(panchangam.kalam.kuligai.end)}`,
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

  const latestSegmentEnd = segments.reduce((max, s) => Math.max(max, s.endMin), 0);
  const rangeStart = sunriseMin;
  const rangeEnd = Math.max(sunsetMin + 180, latestSegmentEnd, rangeStart + 60);
  const rangeSpan = rangeEnd - rangeStart;

  function pct(minutes: number): number {
    return Math.max(0, Math.min(100, ((minutes - rangeStart) / rangeSpan) * 100));
  }

  const nowMin = minutesOfDayInZone(now, timeZone);
  const nowInRange = nowMin >= rangeStart && nowMin <= rangeEnd;
  const nowPct = pct(nowMin);
  const nowLabel = formatClockInZone(now, lang === "ta" ? "ta-IN" : "en-IN", timeZone);

  const ticks: number[] = [];
  for (let m = Math.ceil(rangeStart / 60) * 60; m <= rangeEnd; m += 180) {
    ticks.push(m);
  }

  return (
    <motion.div
      key={selectedDate}
      initial={reduce ? false : { opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduce ? 0 : DUR.slow, ease: EASE_NOVA }}
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "20px 24px 18px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px", flexWrap: "wrap", rowGap: "10px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "இன்றைய நாள்" : "Your day"}
          </div>
          <div style={{ fontSize: "11.5px", color: "var(--color-faint)", marginTop: "2px" }}>
            {lang === "ta" ? "சூரிய உதயம்" : "sunrise"} {formatClockLabel(panchangam.sunrise)} · {lang === "ta" ? "அஸ்தமனம்" : "sunset"} {formatClockLabel(panchangam.sunset)}
            {" · "}{lang === "ta" ? "நட்சத்திரம்" : "Nakshatram"} <b style={{ color: "var(--color-text)" }}>{tNakshatra(panchangam.nakshatra.name, lang)}</b>
            {" · "}{lang === "ta" ? "திதி" : "Tithi"} <b style={{ color: "var(--color-text)" }}>{tTithi(panchangam.tithi.name, lang)}</b>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          {weekAhead && weekAhead.days.length > 0 && (
            <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
              {weekAhead.days.map((day) => {
                const isToday = day.dateLocal === selectedDate;
                // Continuous scale: a 46 day and a 64 day must not render as
                // the same dot even though both are "mid" band.
                const color = scoreColorScale(day.score);
                const band = getScoreBand(day.score);
                const wd = new Date(`${day.dateLocal}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "short" });
                return (
                  <button
                    key={day.dateLocal}
                    type="button"
                    onClick={onGoToCalendar}
                    title={`${band.label} · ${day.dateLocal}: ${day.score}/100`}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: onGoToCalendar ? "pointer" : "default", padding: 0, fontFamily: "inherit" }}
                  >
                    <span style={{
                      width: "9px", height: "9px", borderRadius: "50%", background: color,
                      boxShadow: isToday ? "0 0 0 3px var(--color-accent-muted)" : "none",
                    }} />
                    <span style={{ fontSize: "9.5px", color: isToday ? "var(--color-accent-strong)" : "var(--color-faint)", fontWeight: isToday ? 700 : 400 }}>{wd}</span>
                  </button>
                );
              })}
            </div>
          )}
          {onGoToCalendar && (
            <button
              type="button"
              onClick={onGoToCalendar}
              style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", cursor: "pointer", fontFamily: "inherit", padding: "6px 14px", whiteSpace: "nowrap" }}
            >
              {lang === "ta" ? "முழு பஞ்சாங்கம் →" : "Full panchangam →"}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: "46px",
          margin: "18px 2px 4px",
        }}
      >
        {/* Segments render inside this rounded + clipped track (rather than as
            siblings with their own smaller corner radius) so the bar's left
            and right ends are always evenly rounded, no matter which segment
            happens to sit at either edge. */}
        <div style={{ position: "absolute", inset: "14px 0", borderRadius: "8px", overflow: "hidden", background: "var(--ribbon-track-bg)", boxShadow: "inset 0 0 0 1px var(--ribbon-track-border)" }}>
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
                  <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: s.fg, whiteSpace: "nowrap", padding: "0 6px" }}>
                    {s.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {nowInRange && (
          <>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${nowPct}%`, width: "2px", background: "var(--ribbon-now-bg)", borderRadius: "2px", boxShadow: "0 0 0 1px var(--ribbon-track-bg)" }} />
            <div style={{
              position: "absolute", top: "-4px", left: `${nowPct}%`, transform: "translateX(-50%)",
              fontSize: "9.5px", fontWeight: 700, color: "var(--ribbon-now-fg)", background: "var(--ribbon-now-bg)",
              borderRadius: "4px", padding: "1px 6px", whiteSpace: "nowrap", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.22)",
            }}>
              {lang === "ta" ? "இப்போது" : "NOW"} {nowLabel}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-faint)", padding: "0 2px" }}>
        {ticks.map((m) => (
          <span key={m}>{formatClockLabel(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)}</span>
        ))}
      </div>

      {/* Legend as a framed cell grid (redesign 2026-07-18) — one cell per
          segment, times colored by whether the window helps or warns. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", background: "color-mix(in srgb, var(--color-text-strong) 2.5%, transparent)", border: "1px solid var(--color-border)", borderRadius: "12px", marginTop: "16px", overflow: "hidden" }}>
        {segments.map((s) => (
          <div key={`legend-${s.key}`} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "12px 15px", borderRight: "1px solid color-mix(in srgb, var(--color-text-strong) 5%, transparent)" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: s.bg, flex: "none" }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.legendName}</div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: s.key === "rahu" || s.key === "yama" || s.key === "kuligai" ? "var(--color-low)" : "var(--color-high)", marginTop: "1px", whiteSpace: "nowrap" }}>{s.legendTime}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
