"use client";

// Shared calendar utilities/leaf-components extracted from the (now-deleted)
// Classic dashboard-calendar-tab.tsx during the Nova-only migration
// (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3b). Pure functions/constants plus
// three presentational leaf components (DayTimeline, MoonPhaseMark,
// LunarTithiBadge) with no Classic/Nova fork.

import { addDays, formatClockLabel, formatDateLabel } from "@/lib/format";
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

export const RASI_NAMES_EN = ["", "Mesham", "Rishabam", "Mithunam", "Kadagam", "Simmam", "Kanni", "Thulam", "Viruchigam", "Dhanusu", "Magaram", "Kumbam", "Meenam"];
export const RASI_NAMES_TA = ["", "மேஷம்", "ரிஷபம்", "மிதுனம்", "கடகம்", "சிம்மம்", "கன்னி", "துலாம்", "விருச்சிகம்", "தனுசு", "மகரம்", "கும்பம்", "மீனம்"];

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
 * So the approximation is a *loading placeholder*, not a second opinion. It
 * fills the header for the frame before the panchangam response lands, and the
 * server value replaces it the moment there is one. Two Tamil dates rendered
 * from two different sources is how the deleted 2026 Aavani override came to
 * disagree with the engine in the first place; prefer this helper over calling
 * `getTamilMonthDate` directly anywhere a response is in scope.
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
  return getTamilMonthDate(dateStr, lang);
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
  const clock = formatClockLabel(endsAt);
  if (!endsAtIso.includes("T")) return clock;
  const endDate = endsAtIso.slice(0, 10);
  if (endDate === dateLocal) return clock;
  const dayLabel = endDate === addDays(dateLocal, 1)
    ? (lang === "ta" ? "நாளை" : "tomorrow")
    : formatDateLabel(endDate);
  return lang === "ta" ? `${dayLabel}, ${clock}` : `${clock} (${dayLabel})`;
}

export function formatChandrashtamaWindowEdge(value: string, dateLocal: string): string {
  const clock = formatClockLabel(value);
  if (!value.includes("T")) return clock;
  const edgeDate = value.slice(0, 10);
  return edgeDate === dateLocal ? clock : `${clock}, ${formatDateLabel(edgeDate)}`;
}

export function formatChandrashtamaWindowSummary(
  windows: PanchangamDailyResponseData["chandrashtamamToday"]["janmaNakshatraWindows"],
  dateLocal: string,
  lang: Lang,
): string {
  return windows
    .map((window) => `${tNakshatra(window.name, lang)} ${formatChandrashtamaWindowEdge(window.start, dateLocal)} - ${formatChandrashtamaWindowEdge(window.end, dateLocal)}`)
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

export function tamilMonthOnly(value: string): string {
  const trimmed = value.trim();
  const splitAt = trimmed.lastIndexOf(" ");
  return splitAt > 0 ? trimmed.slice(0, splitAt) : trimmed;
}

export type DayTimelineBand = {
  key: string;
  start: string;
  end: string;
  /** best/good are the auspicious greens; the three avoid kinds step down in
   *  intensity so Rahu > Yama > Kuligai reads at a glance, mirroring the
   *  severity ramp of the "Your day" ribbon on the Today tab. */
  kind: "best" | "good" | "avoid-strong" | "avoid" | "avoid-soft";
  label: string;
};

const DAY_TIMELINE_BAND_STYLE: Record<DayTimelineBand["kind"], { fill: string; opacity: number }> = {
  best: { fill: "var(--color-score-high)", opacity: 0.9 },
  good: { fill: "var(--color-score-high)", opacity: 0.5 },
  "avoid-strong": { fill: "var(--color-score-low)", opacity: 0.9 },
  avoid: { fill: "var(--color-score-mid)", opacity: 0.88 },
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

function formatHourLabel(h: number): string {
  const hr = ((Math.round(h) % 24) + 24) % 24;
  if (hr === 0) return "12 am";
  if (hr < 12) return `${hr} am`;
  if (hr === 12) return "12 pm";
  return `${hr - 12} pm`;
}

export function DayTimeline({
  bands,
  sunrise,
  sunset,
}: {
  bands: DayTimelineBand[];
  sunrise?: string;
  sunset?: string;
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
      <svg viewBox="0 0 600 188" style={{ width: "100%", height: "auto", display: "block" }}>
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
              <title>{`${band.label} ${formatClockLabel(band.start)} – ${formatClockLabel(band.end)}`}</title>
            </rect>
          );
        })}

        {ticks.map((h) => {
          const x = hourToX(h);
          return (
            <g key={h}>
              <line x1={x} y1={HORIZON_Y + 3} x2={x} y2={HORIZON_Y + 11} stroke={"var(--color-faint)"} strokeWidth="2" />
              <text x={x} y={HORIZON_Y + 26} textAnchor="middle" fontSize="12" fill={"var(--color-faint)"} fontFamily="var(--font-mono)">{formatHourLabel(h)}</text>
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

export const VRATHA_FESTIVAL_PATTERN = /ekadashi|ekadasi|pradosham|sashti|chaturthi|chathurthi|ashtami|amavas|pourn|vratam|vratham|thiruvonam/i;

