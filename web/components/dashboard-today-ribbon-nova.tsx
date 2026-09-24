"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { placeCityLabel } from "@vinaadi/shared/checkIn";

import { limbNow } from "./dashboard-calendar-shared";
import { formatClockHour, formatClockLabel, getScoreBand, scoreColorScale } from "@/lib/format";
import { dt, LOCATION_CHECK } from "@/lib/dashboard-i18n";
import { tNakshatra, tTithi } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { GlossaryKey } from "@/lib/glossary";
import { DUR, EASE_NOVA } from "@/lib/motion";
import { formatClockInZone, minutesOfDayInZone, toDateKeyInZone } from "@/lib/tz";
import { resolveKalamStatus, type KalamKey } from "@/lib/kalam-live";
import type { PanchangamDailyResponseData, WeekAheadData } from "@/lib/types";
import { GlossaryTerm } from "./glossary-term";

/**
 * Nova "Your day" timeline spine — the single card that owns every panchangam
 * time: sunrise/sunset, Horai (current + next), the week-ahead dots, the
 * segmented Rahu Kalam / Yamagandam / Kuligai / Nalla Neram bar, and the
 * Nakshatram/Tithi/Vaaram footer. Nothing panchangam-related renders outside
 * this card on the Today tab — everything else (calendar month view, full
 * gowri table) lives one click away via the "Full panchangam" link.
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
  morning:   { badge: { en: "GOOD AM",  ta: "காலை" },   legend: { en: "Morning Nalla Neram",   ta: "காலை நல்ல நேரம்" } },
  afternoon: { badge: { en: "GOOD PM",  ta: "மதியம்" }, legend: { en: "Afternoon Nalla Neram", ta: "மதிய நல்ல நேரம்" } },
  evening:   { badge: { en: "GOOD EVE", ta: "மாலை" },   legend: { en: "Evening Nalla Neram",   ta: "மாலை நல்ல நேரம்" } },
};
// The English legends read "Good morning / Good afternoon / Good evening" —
// greetings, printed in a timing list under a hero that opens with one — while
// their Tamil twins name the slot (காலை நல்ல நேரம், "morning Nalla Neram").
// They now say what the Tamil says. "GOOD DAY" became "GOOD PM": on a day
// ribbon, "good day" reads as a verdict on the whole day.

type Segment = {
  key: string;
  kalamKey?: KalamKey;
  startMin: number;
  endMin: number;
  bg: string;
  fg: string;
  badge: string;
  legendName: string;
  glossary?: GlossaryKey;
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
  place,
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
  /** The place every time on this card was cut from (§2.4). Server-resolved
   *  (`panchangamPlace` on the dashboard bundle) rather than re-derived from
   *  the profile: the resolver falls back to the birth place when the current
   *  location is incomplete, and a client that re-picked the fields would
   *  label these timings with a place they were not computed for. */
  place?: string | null;
  onGoToCalendar?: () => void;
}) {
  // Page-turn: the whole ribbon re-reveals when the selected day changes, so
  // switching dates reads as turning to a fresh page of the almanac rather than
  // silently swapping numbers in place. Gated on reduced-motion in JS since the
  // key-remount replays a framer transform the CSS guard can't reach.
  const reduce = useReducedMotion();

  if (!panchangam) return null;

  // The star and tithi actually running, not the ones the day is named after.
  // A nakshatra span holds under half the day on 46.6% of days, and this card
  // used to print the sunrise value flat for all 24 hours — so on 2026-08-19 it
  // read "Swathi" from 06:00 to midnight, when Swathi ended at 06:47 and Visakam
  // held the remaining 96.8%. The Calendar tab, one click away, already promoted
  // correctly; the two surfaces disagreed. `sunriseName` is kept and shown when
  // it differs, because the almanac genuinely does call today a Swathi day.
  const isToday = selectedDate === toDateKeyInZone(now, timeZone);
  // §2.4. Every time on this card — sunrise, the kalam bar, the horai — is
  // cut from sunrise at one place, so the card says which place that is. It
  // sits on the meta line rather than in a prompt: a reader who has moved
  // should be able to see the mistake without being asked a question.
  const placeLabel = placeCityLabel(place);
  const currentKalam = resolveKalamStatus(panchangam.kalam, {
    now,
    dateLocal: panchangam.dateLocal,
    timeZone,
    isToday,
  }).current;
  const nowIso = now.toISOString();
  const nakNow = limbNow(panchangam.nakshatra, { isToday, nowIso });
  const tithiNow = limbNow(panchangam.tithi, { isToday, nowIso });

  const sunriseMin = timeToMinutes(panchangam.sunrise);
  const sunsetMin = timeToMinutes(panchangam.sunset);
  if (sunriseMin === null || sunsetMin === null) return null;

  const segments: Segment[] = [];

  const yamaStart = timeToMinutes(panchangam.kalam.yamagandam.start);
  const yamaEnd = timeToMinutes(panchangam.kalam.yamagandam.end);
  if (yamaStart !== null && yamaEnd !== null) {
    segments.push({
      key: "yama",
      kalamKey: "yamagandam",
      startMin: yamaStart,
      endMin: yamaEnd,
      bg: YAMA_BG,
      fg: YAMA_FG,
      badge: lang === "ta" ? "யமகண்டம்" : "YAMAGANDAM",
      legendName: lang === "ta" ? "யமகண்டம்" : "Yamagandam",
      glossary: "yamagandam",
      legendTime: `${formatClockLabel(panchangam.kalam.yamagandam.start, lang)} – ${formatClockLabel(panchangam.kalam.yamagandam.end, lang)}`,
    });
  }

  const rahuStart = timeToMinutes(panchangam.kalam.rahuKalam.start);
  const rahuEnd = timeToMinutes(panchangam.kalam.rahuKalam.end);
  if (rahuStart !== null && rahuEnd !== null) {
    segments.push({
      key: "rahu",
      kalamKey: "rahuKalam",
      startMin: rahuStart,
      endMin: rahuEnd,
      bg: RAHU_BG,
      fg: RAHU_FG,
      badge: lang === "ta" ? "ராகு காலம்" : "RAHU KALAM",
      legendName: lang === "ta" ? "ராகு காலம்" : "Rahu Kalam",
      glossary: "rahuKalam",
      legendTime: `${formatClockLabel(panchangam.kalam.rahuKalam.start, lang)} – ${formatClockLabel(panchangam.kalam.rahuKalam.end, lang)}`,
    });
  }

  const kuligaiStart = timeToMinutes(panchangam.kalam.kuligai.start);
  const kuligaiEnd = timeToMinutes(panchangam.kalam.kuligai.end);
  if (kuligaiStart !== null && kuligaiEnd !== null) {
    segments.push({
      key: "kuligai",
      kalamKey: "kuligai",
      startMin: kuligaiStart,
      endMin: kuligaiEnd,
      bg: KULIGAI_BG,
      fg: KULIGAI_FG,
      badge: lang === "ta" ? "குளிகை" : "KULIGAI",
      legendName: lang === "ta" ? "குளிகை" : "Kuligai",
      glossary: "kuligai",
      legendTime: `${formatClockLabel(panchangam.kalam.kuligai.start, lang)} – ${formatClockLabel(panchangam.kalam.kuligai.end, lang)}`,
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
        glossary: "nallaNeram",
        legendTime: `${formatClockLabel(slot.start, lang)} – ${formatClockLabel(slot.end, lang)}`,
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
        glossary: "nallaNeram",
        legendTime: `${formatClockLabel(slot.start, lang)} – ${formatClockLabel(slot.end, lang)}`,
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
  // Tamil goes through the almanac period-words; ICU's ta-IN would print
  // "பிற்பகல்", which is not the ruled vocabulary.
  const nowLabel = lang === "ta"
    ? formatClockLabel(`${Math.floor(nowMin / 60)}:${nowMin % 60}`, "ta")
    : formatClockInZone(now, "en-IN", timeZone);

  const ticks: number[] = [];
  for (let m = Math.ceil(rangeStart / 60) * 60; m <= rangeEnd; m += 180) {
    ticks.push(m);
  }

  return (
    <motion.div
      // Keyed on the panchangam's own date, not the picker's (DXA-07): the
      // caller holds the previous day on screen while the next one loads, so
      // keying on the selection would turn the page to a day that is not
      // rendered yet and then sit there, un-turned, when it arrives.
      key={panchangam.dateLocal}
      initial={reduce ? false : { opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduce ? 0 : DUR.slow, ease: EASE_NOVA }}
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-lg)", padding: "var(--space-5) var(--space-6) var(--space-4_5)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3_5)", marginBottom: "14px", flexWrap: "wrap", rowGap: "var(--space-2_5)" }}>
        <div>
          <h2 className="nova-card-title">
            {lang === "ta" ? "இன்றைய நாள்" : "Your day"}
          </h2>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "2px" }}>
            {placeLabel && (
              <>
                <b style={{ color: "var(--color-text)" }} title={place ?? undefined}>
                  {dt(LOCATION_CHECK.timingsFor, lang).replace("%1$s", placeLabel)}
                </b>
                {" · "}
              </>
            )}
            {lang === "ta" ? "சூரிய உதயம்" : "sunrise"} {formatClockLabel(panchangam.sunrise, lang)} · {lang === "ta" ? "அஸ்தமனம்" : "sunset"} {formatClockLabel(panchangam.sunset, lang)}
            {/* Was bare "Nakshatram". The natal star is labelled "Birth Star"
                everywhere else in the app, so the same concept carried two
                labels and a reader could not tell that this one moves daily —
                several read the day's star as their own. Named for what it is,
                and glossed in place. */}
            {" · "}
            <GlossaryTerm term="nakshatra" lang={lang}>
              {lang === "ta" ? "இன்றைய நட்சத்திரம்" : "Today's star"}
            </GlossaryTerm>{" "}
            <b style={{ color: "var(--color-text)" }}>{tNakshatra(nakNow.activeName, lang)}</b>
            {nakNow.rolledOver && (
              <span style={{ color: "var(--color-faint)" }}>
                {" "}({lang === "ta" ? `${tNakshatra(nakNow.sunriseName, lang)} ${formatClockLabel(panchangam.nakshatra.endsAt, lang)} வரை` : `${tNakshatra(nakNow.sunriseName, lang)} until ${formatClockLabel(panchangam.nakshatra.endsAt, lang)}`})
              </span>
            )}
            {!nakNow.rolledOver && nakNow.until && nakNow.upcomingName && (
              <span style={{ color: "var(--color-faint)" }}>
                {" "}({lang === "ta" ? `${formatClockLabel(nakNow.until, lang)} வரை · பின்பு ${tNakshatra(nakNow.upcomingName, lang)}` : `to ${formatClockLabel(nakNow.until, lang)}, then ${tNakshatra(nakNow.upcomingName, lang)}`})
              </span>
            )}
            {" · "}
            <GlossaryTerm term="tithi" lang={lang}>{lang === "ta" ? "திதி" : "Tithi"}</GlossaryTerm>{" "}
            <b style={{ color: "var(--color-text)" }}>{tTithi(tithiNow.activeName, lang)}</b>
            {tithiNow.rolledOver && (
              <span style={{ color: "var(--color-faint)" }}>
                {" "}({lang === "ta" ? `${tTithi(tithiNow.sunriseName, lang)} ${formatClockLabel(panchangam.tithi.endsAt, lang)} வரை` : `${tTithi(tithiNow.sunriseName, lang)} until ${formatClockLabel(panchangam.tithi.endsAt, lang)}`})
              </span>
            )}
          </div>
        </div>

        {/* Wraps so the button can drop under the week strip. Unwrapped, the
            Tamil pair (strip 251px + button 147px) held the page at 447px on
            every phone up to 414px, and English overflowed at 320px. The strip's
            4px gap is what lets Tamil's seven weekdays fit a 320px phone. */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: "var(--space-2_5) var(--space-3)", minWidth: 0, maxWidth: "100%" }}>
          {weekAhead && weekAhead.days.length > 0 && (
            <div style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}>
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
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-1)", background: "none", border: "none", cursor: onGoToCalendar ? "pointer" : "default", padding: 0, fontFamily: "inherit" }}
                  >
                    <span style={{
                      width: "9px", height: "9px", borderRadius: "var(--radius-pill)", background: color,
                      boxShadow: isToday ? "0 0 0 3px var(--color-accent-muted)" : "none",
                    }} />
                    <span style={{ fontSize: "var(--text-xs)", color: isToday ? "var(--color-accent-strong)" : "var(--color-faint)", fontWeight: isToday ? 700 : 400 }}>{wd}</span>
                  </button>
                );
              })}
            </div>
          )}
          {onGoToCalendar && (
            // An action, so the kit's secondary button (OD-4). Its inline
            // colour, fill and border had beaten every pill hover rule.
            <button
              type="button"
              className="ui-btn ui-btn--secondary ui-btn--sm"
              onClick={onGoToCalendar}
            >
              {lang === "ta" ? "முழு பஞ்சாங்கம்" : "Full panchangam"}
              <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
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
        <div style={{ position: "absolute", inset: "14px 0", borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--ribbon-track-bg)", boxShadow: "inset 0 0 0 1px var(--ribbon-track-border)" }}>
          {segments.map((s) => {
            const widthPct = pct(s.endMin) - pct(s.startMin);
            const isCurrentKalam = s.kalamKey !== undefined && s.kalamKey === currentKalam?.key;
            return (
              <div
                key={s.key}
                title={`${s.legendName} ${s.legendTime}`}
                data-current-kalam={isCurrentKalam ? s.kalamKey : undefined}
                aria-current={isCurrentKalam ? "time" : undefined}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${pct(s.startMin)}%`,
                  width: `${Math.max(widthPct, 1.5)}%`,
                  background: s.bg,
                  boxShadow: isCurrentKalam ? "inset 0 0 0 2px var(--ribbon-now-bg)" : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {widthPct >= 6 && (
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "var(--tracking-tag)", textTransform: "uppercase", color: s.fg, whiteSpace: "nowrap", padding: "0 var(--space-1_5)" }}>
                    {s.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {nowInRange && (
          <>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${nowPct}%`, width: "2px", background: "var(--ribbon-now-bg)", borderRadius: "var(--radius-sm)", boxShadow: "0 0 0 1px var(--ribbon-track-bg)" }} />
            <div style={{
              position: "absolute", top: "-4px", left: `${nowPct}%`, transform: "translateX(-50%)",
              fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--ribbon-now-fg)", background: "var(--ribbon-now-bg)",
              borderRadius: "var(--radius-sm)", padding: "var(--space-0_5) var(--space-1_5)", whiteSpace: "nowrap", boxShadow: "0 1px 3px var(--shadow-drop)",
            }}>
              {lang === "ta" ? "இப்போது" : "NOW"} {nowLabel}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--color-faint)", padding: "0 var(--space-0_5)" }}>
        {ticks.map((m) => {
          const hm = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
          if (lang !== "ta") return <span key={m}>{formatClockLabel(hm, lang)}</span>;
          // Tamil ticks stack the period-word over the hour: "மதியம் 12:00"
          // side by side would overflow six ticks at phone width.
          const [word, hour] = formatClockHour(hm, "ta").split(" ");
          return (
            <span key={m} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}>
              <span>{word}</span>
              <span>{hour}</span>
            </span>
          );
        })}
      </div>

      {/* Legend as a framed cell grid (redesign 2026-07-18) — one cell per
          segment, times colored by whether the window helps or warns. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", background: "color-mix(in srgb, var(--color-text-strong) 2.5%, transparent)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", marginTop: "16px", overflow: "hidden" }}>
        {segments.map((s) => (
          <div key={`legend-${s.key}`} style={{ display: "flex", gap: "var(--space-2_5)", alignItems: "center", padding: "var(--space-3) var(--space-3_5)", borderRight: "1px solid color-mix(in srgb, var(--color-text-strong) 5%, transparent)" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "var(--radius-sm)", background: s.bg, flex: "none" }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.glossary ? (
                  <GlossaryTerm term={s.glossary} lang={lang}>{s.legendName}</GlossaryTerm>
                ) : s.legendName}
              </div>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: s.key === "rahu" || s.key === "yama" || s.key === "kuligai" ? "var(--color-low)" : "var(--color-high)", marginTop: "1px", display: "flex", flexWrap: "wrap", columnGap: "0.3em" }}>
                {/* Wraps only at the dash: a Tamil range carries two period-words
                    and outgrows the 160px cell, but each end stays whole. */}
                {s.legendTime.split(" – ").map((part, i) => (
                  <span key={i} style={{ whiteSpace: "nowrap" }}>{i > 0 ? `– ${part}` : part}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
