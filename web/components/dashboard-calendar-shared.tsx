"use client";

// Shared calendar utilities/leaf-components extracted from the (now-deleted)
// Classic dashboard-calendar-tab.tsx during the Nova-only migration
// (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3b). Pure functions/constants plus
// three presentational leaf components (DayTimeline, MoonPhaseMark,
// LunarTithiBadge) with no Classic/Nova fork.

import { D1_RASI_NAMES, D1_RASI_NAMES_TA } from "@/lib/chart-utils";
import { addDays, formatClockHour, formatClockLabel, formatDateLabel } from "@/lib/format";
import { tLang, tNakshatra } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { lunarSpecialTithiMeta } from "@/lib/lunar";
import { festivalGlyph } from "@/lib/astro-symbols";
import type { BiText, PanchangamDailyResponseData, PanchangamFestival } from "@/lib/types";
// `limbNow` lives in lib/ rather than here so the marketing home hero can
// promote its limbs without pulling this whole dashboard module into the
// marketing bundle. Re-exported for the calendar surfaces already importing
// from this file.
export { limbNow } from "@/lib/panchangam-limb";
export type { LimbNow } from "@/lib/panchangam-limb";

export type CalendarView = "panchangam" | "monthly";

// The canonical tables, not a fourth hand-copy — see lib/chart-utils.
export const RASI_NAMES_EN = D1_RASI_NAMES;
export const RASI_NAMES_TA = D1_RASI_NAMES_TA;

// Tamil solar months start dates (approximate Gregorian: month-day)
// Chithirai begins ~Apr 14, then every ~30–31 days
const TAMIL_MONTHS_EN = [
  "Chithirai", "Vaigasi", "Aani", "Aadi", "Aavani", "Purattasi",
  "Aippasi", "Karthigai", "Margazhi", "Thai", "Maasi", "Panguni",
];
const TAMIL_MONTHS_TA = [
  "சித்திரை", "வைகாசி", "ஆனி", "ஆடி", "ஆவணி", "புரட்டாசி",
  "ஐப்பசி", "கார்த்திகை", "மார்கழி", "தை", "மாசி", "பங்குனி",
];
// Each month starts on these Gregorian md pairs (year-independent approximation).
//
// WARNING: this is a display approximation, not the doctrine. The authority is
// the backend's `tamil_calendar.tamil_solar_date`, which bisects the actual
// sankranti instant and applies the sunset rule (doctrine A-3). This table
// cannot track that — it is already a day off the backend for Karthigai, Thai
// and Panguni in 2026 — so prefer the server-supplied Tamil date wherever one
// is available, and never patch a single year's row here to chase a mismatch:
// a per-year override lived on line 40 of this file until 2026-08-19 and it
// silently disagreed with the engine.
const TAMIL_MONTH_STARTS: Array<[number, number]> = [
  [4, 14], [5, 15], [6, 15], [7, 17], [8, 17], [9, 17],
  [10, 18], [11, 16], [12, 16], [1, 14], [2, 13], [3, 14],
];

// Deliberately NOT exported — call `resolveTamilDate` below instead. Keeping
// the approximation module-private is what stops a second Tamil date from
// being rendered beside the server's, which is precisely how the deleted 2026
// Aavani override came to disagree with the engine on a live surface.
function getTamilMonthDate(dateStr: string, lang: Lang): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const month = d.getMonth() + 1; // 1-based
  const day = d.getDate();
  const tamilMonthStarts = TAMIL_MONTH_STARTS;

  // Find which Tamil month this Gregorian date falls in
  let tamilMonthIdx = -1;
  for (let i = 0; i < 12; i++) {
    const [sm, sd] = tamilMonthStarts[i]!;
    const [nm, nd] = tamilMonthStarts[(i + 1) % 12]!;
    const inMonth = (month === sm && day >= sd) || (i < 11 ? (month === nm && day < nd) : (month === nm && day < nd) || (month < sm));
    if (month === sm && day >= sd) { tamilMonthIdx = i; break; }
    if (i < 11 && month === nm && day < nd) { tamilMonthIdx = i; break; }
  }
  // Fallback: find nearest
  if (tamilMonthIdx < 0) {
    const dayOfYear = (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000;
    tamilMonthIdx = Math.floor(((dayOfYear - 104 + 365) % 365) / 30.4) % 12;
  }

  // Compute day within Tamil month
  const [sm, sd] = tamilMonthStarts[tamilMonthIdx]!;
  const startDate = new Date(d.getFullYear(), sm - 1, sd);
  if (sm > month || (sm === month && sd > day)) {
    startDate.setFullYear(d.getFullYear() - 1);
  }
  const tamilDay = Math.floor((d.getTime() - startDate.getTime()) / 86400000) + 1;

  const monthName = lang === "ta"
    ? (TAMIL_MONTHS_TA[tamilMonthIdx] ?? "")
    : (TAMIL_MONTHS_EN[tamilMonthIdx] ?? "");
  return lang === "ta"
    ? `${monthName} ${tamilDay}`
    : `${monthName} ${tamilDay}`;
}

/**
 * The Tamil date for a day, preferring the value the server computed.
 *
 * The backend derives this from the real sankranti instant and the sunset rule
 * (`app/calculations/tamil_calendar.py`, doctrine A-3). `getTamilMonthDate`
 * above cannot: it is a year-independent month-start approximation and is
 * already a day off the engine for Karthigai, Thai and Panguni in 2026.
 *
 * D6 forbids a client approximation before the panchangam response arrives.
 * Keep the private approximation intact until its deletion is explicitly
 * approved, but do not call it from a rendered date surface.
 */
export function resolveTamilDate(
  serverValue: BiText | null | undefined,
  dateStr: string,
  lang: Lang,
): string {
  if (serverValue) {
    const fromServer = tLang(serverValue, lang);
    if (fromServer) return fromServer;
  }
  return "";
}

const NAKSHATRA_ORDER = [
  "ASWINI", "BHARANI", "KARTHIGAI", "ROHINI", "MIRUGASEERIDAM", "THIRUVATHIRAI",
  "PUNARPOOSAM", "POOSAM", "AYILYAM", "MAGAM", "POORAM", "UTHIRAM", "HASTHAM",
  "CHITHIRAI", "SWATHI", "VISAKAM", "ANUSHAM", "KETTAI", "MOOLAM", "POORADAM",
  "UTHIRADAM", "THIRUVONAM", "AVITTAM", "SADAYAM", "POORATTATHI", "UTHIRATTATHI", "REVATHI",
];

export function parseHmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// A panchangam limb (tithi/nakshatra/…) carries the segment active at sunrise
// plus the one that follows. When the user is viewing *today* and the clock has
// passed the segment's end, the headline should become the next segment so the
// card reflects what is actually running now.
//
// `endsAt` (bare "HH:MM", date stripped) is kept only for display. Rollover
// must compare `endsAtIso` (a full local datetime) against the real instant —
// two prior clock-only heuristics (a hard-coded `end >= 240` / 04:00 cutoff,
// then `end > sunrise`) both guessed the missing date from the clock value
// alone, and both broke whenever a boundary landed on the *next* calendar day
// at a clock time that still looked like "later today" (2026-07-20 Saptami
// ending 04:03 the next morning; 2026-07-25 Kettai nakshatra ending 07:35 the
// next morning). Comparing exact instants removes the guess entirely.
export function activeLimb(
  name: string,
  endsAt: string,
  nextName: string,
  nowMinutes: number,
  endsAtIso: string,
  nowIso?: string,
): { activeName: string; until: string | null; upcomingName: string | null; rolledOver: boolean } {
  const notPromoted = { activeName: name, until: endsAt, upcomingName: nextName, rolledOver: false };
  if (nowMinutes < 0) return notPromoted;

  const endInstant = new Date(endsAtIso).getTime();
  if (Number.isNaN(endInstant)) return notPromoted;
  const nowInstant = nowIso ? new Date(nowIso).getTime() : Date.now();

  if (nowInstant > endInstant) {
    return { activeName: nextName, until: null, upcomingName: null, rolledOver: true };
  }
  return notPromoted;
}

export function moonRasiFromNakshatra(name: string, pada = 1): number {
  const idx = NAKSHATRA_ORDER.indexOf(name.toUpperCase());
  if (idx < 0) return 0;
  const normalizedPada = Math.min(4, Math.max(1, Math.trunc(pada) || 1));
  const absolutePada = idx * 4 + (normalizedPada - 1);
  return Math.floor(absolutePada / 9) + 1;
}

// A bare clock time like "7:35 am" next to a limb's "until" label is
// ambiguous about which calendar day it falls on once the boundary rolls
// past midnight (the same source of confusion `activeLimb` above disambiguates
// for rollover). Mirrors `formatChandrashtamaWindowEdge`'s day-qualifier
// approach, using "tomorrow" for the common next-day case.
export function formatUntilLabel(endsAt: string, endsAtIso: string, dateLocal: string, lang: Lang): string {
  const clock = formatClockLabel(endsAt, lang);
  if (!endsAtIso.includes("T")) return clock;
  const endDate = endsAtIso.slice(0, 10);
  if (endDate === dateLocal) return clock;
  const dayLabel = endDate === addDays(dateLocal, 1)
    ? (lang === "ta" ? "நாளை" : "tomorrow")
    : formatDateLabel(endDate);
  return lang === "ta" ? `${dayLabel}, ${clock}` : `${clock} (${dayLabel})`;
}

export function formatChandrashtamaWindowEdge(value: string, dateLocal: string, lang: Lang = "en"): string {
  const clock = formatClockLabel(value, lang);
  if (!value.includes("T")) return clock;
  const edgeDate = value.slice(0, 10);
  return edgeDate === dateLocal ? clock : `${clock}, ${formatDateLabel(edgeDate)}`;
}

/** The reader's OWN Chandrashtama window — not the day's whole list.
 *
 *  A personal card that says "Chandrashtama is active" and then prints every
 *  star of the day underneath is naming somebody else's star to the one person
 *  it does not apply to: on 2026-09-09 the card would have told a Moolam native
 *  their day was Pooradam's. The card only appears on the reader's own day, and
 *  the day belongs to the star standing at sunrise, so `affectedJanmaNakshatraName`
 *  identifies their window without the client needing the natal chart at all.
 *
 *  Returns "" when the star is absent (a panchangam snapshot cached before
 *  v44) so callers fall back to the full list rather than showing nothing.
 */
/** The reader's own Chandrashtama window for this day, or "" when the day holds
 *  none — callers fall back to the day's full list rather than render an empty
 *  alert.
 *
 *  Takes the rasi as well as the star because the star alone does not identify a
 *  window. Nine of the 27 stars straddle a rasi boundary, so a straddling star
 *  appears twice in a day with two rasis, and its two halves of natives are in
 *  Chandrashtama a fortnight apart. Matching on the name alone printed the
 *  Dhanusu half's hours to a Magaram native — reported 2026-09-09.
 *
 *  `ownRasiNumber` may be absent (a guidance row cached before it was sent), and
 *  a window's `rasiNumber` may be 0 (a panchangam snapshot before v45). Either
 *  way this falls back to the name-only match, which is right for the 18 stars
 *  that do not straddle and no worse than before for the nine that do. */
export function formatOwnChandrashtamaWindow(
  windows: PanchangamDailyResponseData["chandrashtamamToday"]["janmaNakshatraWindows"],
  ownStarName: string | undefined,
  dateLocal: string,
  lang: Lang,
  ownRasiNumber?: number | null,
): string {
  if (!ownStarName) return "";
  const named = windows.filter((window) => window.name === ownStarName);
  const mine = (ownRasiNumber
    ? named.find((window) => !window.rasiNumber || window.rasiNumber === ownRasiNumber)
    : undefined) ?? named[0];
  if (!mine) return "";
  return `${tNakshatra(mine.name, lang)} ${formatChandrashtamaWindowEdge(mine.start, dateLocal, lang)} - ${formatChandrashtamaWindowEdge(mine.end, dateLocal, lang)}`;
}

/** Every distinct affected janma rasi the day touches, in the order they occur.
 *
 *  The Moon crosses a rasi boundary on roughly two days in five, and the
 *  affected point crosses at the same instant seven signs away, so on those days
 *  the day has TWO affected rasis. `affectedJanmaRasiNumber` is a sunrise scalar
 *  and names only the first — which is how a Magaram reader saw an almanac card
 *  headed "Affected Rasi: Dhanusu" on a day that was genuinely theirs from the
 *  afternoon. `fallback` covers a pre-v45 snapshot, whose windows carry no rasi. */
export function chandrashtamaAffectedRasiNumbers(
  windows: PanchangamDailyResponseData["chandrashtamamToday"]["janmaNakshatraWindows"],
  fallback: number,
): number[] {
  const seen: number[] = [];
  for (const window of windows) {
    if (window.rasiNumber && !seen.includes(window.rasiNumber)) seen.push(window.rasiNumber);
  }
  return seen.length > 0 ? seen : (fallback ? [fallback] : []);
}

export function formatChandrashtamaWindowSummary(
  windows: PanchangamDailyResponseData["chandrashtamamToday"]["janmaNakshatraWindows"],
  dateLocal: string,
  lang: Lang,
): string {
  // A star is qualified by its rasi only when the day holds it twice — which
  // happens exactly for the nine stars that straddle a rasi boundary, on the day
  // the affected point crosses it. Without the qualifier the list reads as the
  // same star twice over with no way to tell which half is yours; with it on
  // every row it is noise on the four days in five that have one rasi.
  const repeated = new Set(
    windows.filter((w, i) => windows.findIndex((other) => other.name === w.name) !== i).map((w) => w.name),
  );
  return windows
    .map((window) => {
      const qualifier = repeated.has(window.name) && window.rasiNumber
        ? ` (${rasiName(window.rasiNumber, lang)})`
        : "";
      return `${tNakshatra(window.name, lang)}${qualifier} ${formatChandrashtamaWindowEdge(window.start, dateLocal, lang)} - ${formatChandrashtamaWindowEdge(window.end, dateLocal, lang)}`;
    })
    .join("; ");
}

export function chandrashtamaAffectedNatalRasi(moonRasi: number): number {
  if (!moonRasi) return 0;
  return ((moonRasi - 1 - 7 + 12) % 12) + 1;
}

export function rasiName(rasi: number, lang: Lang): string {
  return (lang === "ta" ? RASI_NAMES_TA[rasi] : RASI_NAMES_EN[rasi]) ?? "";
}

export function formatHeaderDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return formatDateLabel(value);
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// `tamilMonthOnly` moved to lib/format for the same reason `limbNow` did — the
// muhurta picker needs it and must not pull this whole module in. Re-exported
// for the calendar surfaces already importing it from here.
export { tamilMonthOnly } from "@/lib/format";

export type DayTimelineBand = {
  key: string;
  start: string;
  end: string;
  /** Kuligai is contextual, not a generic avoid period. Keep it visually
   *  distinct from both the auspicious and avoid ramps.
   *
   *  `avoid-scoped` is the narrow-scope rung: Durmuhurtham binds only on
   *  auspicious work and new beginnings, so it must not paint at Rahu's or
   *  Yamagandam's intensity. It is the same hue as `avoid`, one step down —
   *  narrower scope reads as lighter, never as more severe. */
  kind: "best" | "good" | "contextual" | "avoid-strong" | "avoid" | "avoid-scoped" | "avoid-soft";
  label: string;
};

/** The one severity ramp. `NovaAvoidStrip`'s dots read their fill and opacity
 *  from this table by band kind, because the strip and the timeline paint the
 *  same windows a few pixels apart — two ramps disagreeing on one card is
 *  worse than having none. Change a colour here and both surfaces move. */
export const DAY_TIMELINE_BAND_STYLE: Record<DayTimelineBand["kind"], { fill: string; opacity: number }> = {
  best: { fill: "var(--color-score-high)", opacity: 0.9 },
  good: { fill: "var(--color-score-high)", opacity: 0.5 },
  contextual: { fill: "var(--color-accent-secondary)", opacity: 0.64 },
  "avoid-strong": { fill: "var(--color-score-low)", opacity: 0.9 },
  avoid: { fill: "var(--color-score-mid)", opacity: 0.88 },
  "avoid-scoped": { fill: "var(--color-score-mid)", opacity: 0.62 },
  "avoid-soft": { fill: "var(--color-score-mid)", opacity: 0.45 },
};

// The timeline is a "daylight dome": the arc spans the day's real sunrise ->
// sunset and the area under it is filled, so it reads as the lit part of the
// day. The axis range is dynamic — it starts a touch before sunrise and ends a
// touch after whichever is later, sunset or the last band — so evening Nalla
// Neram slots stay on-canvas without leaving a long dead rail hanging off the
// right edge (the earlier fixed 6am–9pm axis did exactly that). The short
// stretches of bare rail before the dome and after it are dawn and dusk.
const AXIS_X0 = 40;
const AXIS_W = 520;
const HORIZON_Y = 158;
// Quadratic control-point Y. A quadratic peaks at (HORIZON_Y + CONTROL_Y) / 2,
// so this puts the visual apex near y≈99 — a gentle dome, not a tall bell.
const CONTROL_Y = 40;
// Fallbacks only used if a day is missing sunrise/sunset in the payload.
const DEFAULT_SUNRISE_H = 6;
const DEFAULT_SUNSET_H = 18;

function toHours(timeStr: string): number | null {
  const timePart = timeStr.includes("T") ? timeStr.split("T")[1] ?? "" : timeStr;
  const [h, m] = timePart.split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  return h! + (Number.isFinite(m) ? m! : 0) / 60;
}

function formatHourLabel(h: number, lang: Lang): string {
  const hr = ((Math.round(h) % 24) + 24) % 24;
  return formatClockHour(`${hr}:00`, lang);
}

export function DayTimeline({
  bands,
  sunrise,
  sunset,
  lang = "en",
}: {
  bands: DayTimelineBand[];
  sunrise?: string;
  sunset?: string;
  lang?: Lang;
}) {
  const sunriseH = (sunrise ? toHours(sunrise) : null) ?? DEFAULT_SUNRISE_H;
  const rawSunsetH = sunset ? toHours(sunset) : null;
  const sunsetH = rawSunsetH !== null && rawSunsetH > sunriseH ? rawSunsetH : DEFAULT_SUNSET_H;

  const bandSpans = bands.flatMap((band) => {
    const startH = toHours(band.start);
    const endH = toHours(band.end);
    return startH !== null && endH !== null && endH > startH ? [{ band, startH, endH }] : [];
  });

  // Dynamic axis: a small dawn/dusk margin on each side, widened only as far as
  // the actual content (earliest band or sunrise on the left, latest band or
  // sunset on the right) so the dome always dominates the frame.
  const earliest = Math.min(sunriseH, ...bandSpans.map((b) => b.startH));
  const latest = Math.max(sunsetH, ...bandSpans.map((b) => b.endH));
  const axisStartH = earliest - 0.5;
  const axisEndH = latest + 0.75;
  const span = axisEndH - axisStartH;

  const hourToX = (h: number): number => {
    const clamped = Math.max(axisStartH, Math.min(axisEndH, h));
    return AXIS_X0 + ((clamped - axisStartH) / span) * AXIS_W;
  };
  // Y on the sunrise->sunset quadratic, parameterised by clock hour.
  const arcY = (h: number): number => {
    const p = Math.max(0, Math.min(1, (h - sunriseH) / (sunsetH - sunriseH)));
    return HORIZON_Y + 2 * p * (1 - p) * (CONTROL_Y - HORIZON_Y);
  };

  const sunriseX = hourToX(sunriseH);
  const sunsetX = hourToX(sunsetH);
  const midX = (sunriseX + sunsetX) / 2;
  const domePath = `M${sunriseX},${HORIZON_Y} Q${midX},${CONTROL_Y} ${sunsetX},${HORIZON_Y}`;

  const drawn = bandSpans.map(({ band, startH, endH }) => {
    const x1 = hourToX(startH);
    const x2 = hourToX(endH);
    return { band, x: x1, width: Math.max(x2 - x1, 8) };
  });

  const legend: { label: string; fill: string; opacity: number }[] = [];
  for (const { band } of drawn) {
    if (!legend.some((entry) => entry.label === band.label)) {
      const style = DAY_TIMELINE_BAND_STYLE[band.kind];
      legend.push({ label: band.label, fill: style.fill, opacity: style.opacity });
    }
  }

  const now = new Date();
  const nowH = now.getHours() + now.getMinutes() / 60;
  const isDaytimeNow = nowH >= sunriseH && nowH <= sunsetH;

  // Ticks at rounded hour steps across the dynamic range.
  const step = span > 9 ? 3 : 2;
  const ticks: number[] = [];
  for (let h = Math.ceil(axisStartH / step) * step; h <= axisEndH; h += step) ticks.push(h);

  return (
    <div style={{ marginTop: "var(--space-3)" }}>
      <svg viewBox={`0 0 600 ${lang === "ta" ? 202 : 188}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="day-timeline-dome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={"var(--color-score-mid)"} stopOpacity="0.24" />
            <stop offset="100%" stopColor={"var(--color-score-mid)"} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Lit daytime dome: filled area under the arc, then the arc stroke. */}
        <path d={`${domePath} Z`} fill="url(#day-timeline-dome)" stroke="none" />
        <path d={domePath} fill="none" stroke={"var(--color-border-strong)"} strokeWidth="2" />

        {/* Horizon rail spans the whole axis; the tails outside the dome are
            dawn (left) and dusk (right). */}
        <rect x={AXIS_X0} y={HORIZON_Y - 1} width={AXIS_W} height="4" rx="2" fill={"var(--color-border)"} />

        {/* Sunrise / sunset anchors where the dome meets the horizon. */}
        <circle cx={sunriseX} cy={HORIZON_Y + 1} r="3.5" fill={"var(--color-score-mid)"} opacity="0.65" />
        <circle cx={sunsetX} cy={HORIZON_Y + 1} r="3.5" fill={"var(--color-score-mid)"} opacity="0.65" />

        {drawn.map(({ band, x, width }) => {
          const style = DAY_TIMELINE_BAND_STYLE[band.kind];
          return (
            <rect key={band.key} x={x} y={HORIZON_Y - 4} width={width} height="9" rx="5" fill={style.fill} opacity={style.opacity}>
              <title>{`${band.label} ${formatClockLabel(band.start, lang)} – ${formatClockLabel(band.end, lang)}`}</title>
            </rect>
          );
        })}

        {ticks.map((h) => {
          const x = hourToX(h);
          return (
            <g key={h}>
              <line x1={x} y1={HORIZON_Y + 3} x2={x} y2={HORIZON_Y + 11} stroke={"var(--color-faint)"} strokeWidth="2" />
              {lang === "ta" ? (
                // Period-word stacked over the hour so neighbouring ticks don't collide.
                <text x={x} textAnchor="middle" fontSize="11" fill={"var(--color-faint)"}>
                  {formatHourLabel(h, lang).split(" ").map((part, i) => (
                    <tspan key={i} x={x} y={HORIZON_Y + 24 + i * 14}>{part}</tspan>
                  ))}
                </text>
              ) : (
                <text x={x} y={HORIZON_Y + 26} textAnchor="middle" fontSize="12" fill={"var(--color-faint)"} fontFamily="var(--font-mono)">{formatHourLabel(h, lang)}</text>
              )}
            </g>
          );
        })}

        {/* "Now" marker — always present so the moment is never lost. During
            daylight the sun rides the arc at its real height; after dusk (or
            before dawn) a crescent moon sits on the horizon rail instead. The
            crescent is carved by a second circle filled with the card surface,
            which is the background here since night falls outside the dome. */}
        {isDaytimeNow ? (
          <circle cx={hourToX(nowH)} cy={arcY(nowH)} r="8" fill={"var(--color-score-mid)"} />
        ) : (
          <g>
            <circle cx={hourToX(nowH)} cy={HORIZON_Y - 9} r="6" fill={"var(--color-muted)"} />
            <circle cx={hourToX(nowH) + 3} cy={HORIZON_Y - 10.5} r="5.5" fill={"var(--color-surface)"} />
          </g>
        )}
      </svg>
      {legend.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2) var(--space-4)", marginTop: "var(--space-1)", paddingInline: "var(--space-2)" }}>
          {legend.map((entry) => (
            <span key={entry.label} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "var(--radius-sm)", background: entry.fill, opacity: entry.opacity, flex: "none" }} />
              {entry.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function timeWindowsOverlap(left: { start: string; end: string }, right: { start: string; end: string }): boolean {
  const leftStart = parseHmToMinutes(left.start);
  let leftEnd = parseHmToMinutes(left.end);
  const rightStart = parseHmToMinutes(right.start);
  let rightEnd = parseHmToMinutes(right.end);

  if (leftEnd <= leftStart) leftEnd += 24 * 60;
  if (rightEnd <= rightStart) rightEnd += 24 * 60;

  return leftStart < rightEnd && rightStart < leftEnd;
}

export function MoonPhaseMark({ kind, size = 10 }: { kind: "new" | "full"; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "var(--radius-pill)",
        border: "1.5px solid currentColor",
        background: kind === "new" ? "currentColor" : "transparent",
        display: "inline-block",
        flex: "0 0 auto",
      }}
    />
  );
}

export function LunarTithiBadge({
  value,
  lang,
  compact = false,
}: {
  value: string | null | undefined;
  lang: Lang;
  compact?: boolean;
}) {
  const meta = lunarSpecialTithiMeta(value, lang);
  if (!meta) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? "5px" : "var(--space-1_5)",
        borderRadius: "var(--radius-pill)",
        background: "var(--color-text-strong)",
        color: "var(--color-bg)",
        border: `1px solid ${"var(--color-text-strong)"}`,
        padding: compact ? "3px 7px" : "var(--space-1_5) var(--space-2_5)",
        fontSize: compact ? "0.68rem" : "0.75rem",
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <MoonPhaseMark kind={meta.kind} size={compact ? 8 : 10} />
      <span>{meta.label}</span>
      {!compact && <span style={{ opacity: 0.72, fontWeight: 700 }}>{meta.phaseLabel}</span>}
    </span>
  );
}

export const MONTH_LABELS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTH_LABELS_TA = [
  "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
  "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்",
];
export const WEEKDAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_LABELS_TA = ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"];

// Festival/observance icon glyphs keyed by a keyword found in the festival name.
// Falls back to a generic sparkle when nothing matches.
const FESTIVAL_ICON_RULES: Array<[RegExp, string]> = [
  [/pradhosam/i, "🪔"],
  [/sivarath/i, "🔱"],
  [/chathurthi/i, "🐘"],
  [/sashti/i, "🦚"],
  [/pournami|pournima|purnima/i, "🌕"],
  [/amavasai|amavasya/i, "🌑"],
  [/ekadasi/i, "🪷"],
  [/visakam|magam|uthiram/i, "⭐"],
];

export function festivalIcon(name: string): string {
  // Prefer the local rule table (kept for backwards-compatible icons), then fall
  // back to the shared glyph map so every surface uses the same symbol set.
  for (const [pattern, icon] of FESTIVAL_ICON_RULES) {
    if (pattern.test(name)) return icon;
  }
  return festivalGlyph(name);
}

export function festivalImagePath(name: string): string | null {
  if (/chaturthi|chathurthi/i.test(name)) return "/calendar/chathurthi.png";
  if (/sashti/i.test(name)) return "/calendar/shasti.png";
  if (/ekadasi|ekadashi/i.test(name)) return "/calendar/ekadashi.png";
  return null;
}

export function festivalTags(festival: Pick<PanchangamFestival, "category" | "tags">): string[] {
  const tags = festival.tags && festival.tags.length > 0 ? festival.tags : [festival.category];
  return Array.from(new Set(tags.filter(Boolean)));
}

// "pradhosam" is the backend's own spelling (festivals.py) — without it every
// Pradhosam fell into the Festivals filter and the Vratham toggle never hid it.
export const VRATHA_FESTIVAL_PATTERN = /ekadashi|ekadasi|pradosham|pradhosam|sashti|chaturthi|chathurthi|ashtami|amavas|pourn|vratam|vratham|thiruvonam/i;
