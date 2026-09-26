"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Clock3, MapPin, Moon, Star, Sunrise, Sunset } from "lucide-react";

import { placeCityLabel } from "@vinaadi/shared/checkIn";

import { formatClockHour, formatClockLabel, scoreColorScale, getScoreBand } from "@/lib/format";
import { dt, LOCATION_CHECK } from "@/lib/dashboard-i18n";
import { tNakshatra, tPlanetLord, tTithi } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { GlossaryKey } from "@/lib/glossary";
import { DUR, EASE_NOVA } from "@/lib/motion";
import { formatClockInZone, minutesOfDayInZone, toDateKeyInZone } from "@/lib/tz";
import { resolveKalamStatus, type KalamKey } from "@/lib/kalam-live";
import type { PanchangamDailyResponseData, WeekAheadData } from "@/lib/types";
import { GlossaryTerm } from "./glossary-term";

/**
 * Nova "Your day" — the day drawn as one horizon: the sun's arc from sunrise
 * to sunset, the kalam / Nalla Neram bar beneath it, and the moments the star
 * and the tithi turn over, placed where they fall on the clock.
 *
 * What this card owns, because nothing else on Today shows it: the SHAPE of
 * the day over time, how much of it has gone, the running Horai, the star and
 * tithi change-over times, and the week ahead.
 *
 * What it deliberately does NOT repeat (2026-09-26, after a redesign pass
 * printed each of these a second time on the same page):
 *   - today's star and tithi names — the hero masthead carries them;
 *   - the named list of timings with their ranges — the hero rail's avoid card
 *     and Key timings card carry them. Here a window's name and time appear
 *     only for the one window being looked at, in the readout line;
 *   - a day score as a number — the hero dial is the page's one score, so the
 *     week strip encodes each day as a bar and keeps the number in its label;
 *   - a "full almanac" button — the Key timings card has it; the week strip's
 *     days open the same calendar.
 * Sunrise and sunset print once, at the feet of the arc.
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

/** A change-over of one of the day's limbs, placed on the clock. */
type LimbMark = {
  key: "star" | "tithi";
  min: number;
  glossary: GlossaryKey;
  label: string;
  text: string;
  aria: string;
};

type SpanStatus = "now" | "past" | "future";

const STATUS_TEXT: Record<SpanStatus, { en: string; ta: string }> = {
  now:    { en: "Now",           ta: "இப்போது" },
  past:   { en: "Earlier today", ta: "முடிந்தது" },
  future: { en: "Coming up",     ta: "வரவுள்ளது" },
};

// The week strip's accessible name must not fall back to `getScoreBand`'s
// English label on the Tamil page (aria-label is rendering — CLAUDE.md).
const TONE_TEXT: Record<"high" | "mid" | "low", { en: string; ta: string }> = {
  high: { en: "supportive", ta: "நல்ல நாள்" },
  mid:  { en: "steady",     ta: "சமநிலை" },
  low:  { en: "take care",  ta: "கவனம்" },
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

/* ── Sun arc geometry ─────────────────────────────────────────────────────
   One quadratic Bézier in a 100 × 40 viewBox, stretched to the card's width.
   Its x is linear in t (the control point sits at the midpoint), so the sun at
   t = elapsed daylight lands at exactly the same x as the NOW line on the bar
   below: pct(sunrise) is 0 and pct(sunset) is the arc's right foot. */
const ARC_BASE = 38;
const ARC_CTRL = -30; // peaks the arc at y = 4
const SKY_PAD_PX = 16; // room above the peak for the sun's disc

function arcPoint(t: number, xEnd: number) {
  return { x: t * xEnd, y: ARC_BASE + 2 * t * (1 - t) * (ARC_CTRL - ARC_BASE) };
}

/** The [0, t] piece of the arc — itself a quadratic (de Casteljau). */
function arcPathTo(t: number, xEnd: number): string {
  const cx = (t * xEnd) / 2;
  const cy = ARC_BASE + t * (ARC_CTRL - ARC_BASE);
  const p = arcPoint(t, xEnd);
  return `M 0 ${ARC_BASE} Q ${cx} ${cy} ${p.x} ${p.y}`;
}

/** True once the element has been on screen. The card sits below the fold and
 *  is scroll-revealed, so a sweep started on mount would finish unseen. jsdom
 *  and some webviews have no IntersectionObserver: treat those as seen. */
function useSeenOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold: 0.35 });
    io.observe(node);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

type Tick = { key: string; pct: number; align: "start" | "center" | "end"; node: ReactNode; kind: "sun" | "hour" };

function DayHorizon({
  lang,
  reduce,
  segments,
  limbMarks,
  ticks,
  pctOf,
  sunsetPct,
  phase,
  dayT,
  nowPct,
  nowLabel,
  currentKalamKey,
  shownKey,
  onPick,
  onHover,
}: {
  lang: Lang;
  reduce: boolean;
  segments: Segment[];
  limbMarks: LimbMark[];
  ticks: Tick[];
  pctOf: (minutes: number) => number;
  sunsetPct: number;
  /** "day" draws the sun on the arc; "night" draws the moon on the horizon
   *  line after sunset; null is a day other than today, with no NOW at all. */
  phase: "day" | "night" | null;
  /** Fraction of daylight gone, 0..1 (only meaningful when phase is "day"). */
  dayT: number;
  nowPct: number;
  nowLabel: string;
  currentKalamKey: KalamKey | undefined;
  shownKey: string | null;
  onPick: (key: string) => void;
  onHover: (key: string | null) => void;
}) {
  const gradId = useId();
  const [ref, seen] = useSeenOnce<HTMLDivElement>();

  // One progress value drives the whole sweep — sun, drawn arc, NOW line and
  // the elapsed veil — so they cannot drift apart mid-animation. The targets
  // are motion values too: `now` ticks every minute and the sweep follows it.
  const progress = useMotionValue(reduce ? 1 : 0);
  const tTarget = useMotionValue(dayT);
  const pctTarget = useMotionValue(nowPct);
  const xEnd = useMotionValue(sunsetPct);
  useEffect(() => { tTarget.set(dayT); }, [dayT, tTarget]);
  useEffect(() => { pctTarget.set(nowPct); }, [nowPct, pctTarget]);
  useEffect(() => { xEnd.set(sunsetPct); }, [sunsetPct, xEnd]);

  useEffect(() => {
    if (!seen) return;
    if (reduce) {
      progress.set(1);
      return;
    }
    const controls = animate(progress, 1, { duration: DUR.reveal * 1.6, ease: EASE_NOVA });
    return () => controls.stop();
  }, [seen, reduce, progress]);

  const litPath = useTransform([progress, tTarget, xEnd], ([p, t, x]: number[]) => arcPathTo(p * t, x));
  const sunLeft = useTransform([progress, tTarget, xEnd], ([p, t, x]: number[]) => `${arcPoint(p * t, x).x}%`);
  const sunTop = useTransform([progress, tTarget, xEnd], ([p, t, x]: number[]) =>
    `calc(${SKY_PAD_PX}px + ${(arcPoint(p * t, x).y / 40).toFixed(4)} * (100% - ${SKY_PAD_PX}px))`);
  const nowLeft = useTransform([progress, pctTarget], ([p, n]: number[]) => `${p * n}%`);

  const fullArc = `M 0 ${ARC_BASE} Q ${sunsetPct / 2} ${ARC_CTRL} ${sunsetPct} ${ARC_BASE}`;
  // The NOW chip rides beside the sun or moon; past ~62% it flips to the
  // left so it never runs off the card's right edge.
  const chipSide = nowPct > 62 ? "left" : "right";
  const nowChip = (
    <span className={`day-ribbon__now-chip day-ribbon__now-chip--${chipSide}`}>
      <span>{lang === "ta" ? "இப்போது" : "Now"}</span>
      <b>{nowLabel}</b>
    </span>
  );

  return (
    <div className="day-ribbon__horizon" ref={ref}>
      <div className="day-ribbon__sky" aria-hidden="true">
        <svg className="day-ribbon__arc" viewBox="0 0 100 40" preserveAspectRatio="none" focusable="false">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--color-accent)", stopOpacity: 0.16 }} />
              <stop offset="100%" style={{ stopColor: "var(--color-accent)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={`${fullArc} Z`} fill={`url(#${gradId})`} stroke="none" />
          <path d={fullArc} className="day-ribbon__arc-path" vectorEffect="non-scaling-stroke" />
          {phase && <motion.path d={litPath} className="day-ribbon__arc-lit" vectorEffect="non-scaling-stroke" />}
          <line x1="0" y1={ARC_BASE} x2="100" y2={ARC_BASE} className="day-ribbon__horizon-line" vectorEffect="non-scaling-stroke" />
        </svg>
        {phase === "day" && (
          <motion.span className="day-ribbon__body day-ribbon__body--sun" style={{ left: sunLeft, top: sunTop }}>
            <span className="day-ribbon__sun" />
            {nowChip}
          </motion.span>
        )}
        {phase === "night" && (
          <motion.span className="day-ribbon__body day-ribbon__body--moon" style={{ left: nowLeft }}>
            <Moon size={14} strokeWidth={2} />
            {nowChip}
          </motion.span>
        )}
      </div>

      <div className="day-ribbon__track">
        <div className="day-ribbon__segments" role="group" aria-label={lang === "ta" ? "இன்றைய நேரங்கள்" : "Today's timing windows"}>
          {segments.map((segment) => {
            const widthPct = pctOf(segment.endMin) - pctOf(segment.startMin);
            const isCurrentKalam = segment.kalamKey !== undefined && segment.kalamKey === currentKalamKey;
            return (
              <button
                key={segment.key}
                type="button"
                className="day-ribbon__segment"
                data-current-kalam={isCurrentKalam ? segment.kalamKey : undefined}
                data-shown={shownKey === segment.key ? "true" : undefined}
                aria-current={isCurrentKalam ? "time" : undefined}
                aria-label={`${segment.legendName} ${segment.legendTime}`}
                onClick={() => onPick(segment.key)}
                onFocus={() => onPick(segment.key)}
                onMouseEnter={() => onHover(segment.key)}
                onMouseLeave={() => onHover(null)}
                style={{
                  left: `${pctOf(segment.startMin)}%`,
                  width: `${Math.max(widthPct, 1.5)}%`,
                  background: segment.bg,
                  color: segment.fg,
                }}
              >
                {widthPct >= 7 && <span aria-hidden="true">{segment.badge}</span>}
              </button>
            );
          })}
        </div>

        {phase && <motion.span className="day-ribbon__elapsed" style={{ width: nowLeft }} aria-hidden="true" />}
        {phase && <motion.span className="day-ribbon__now-line" style={{ left: nowLeft }} aria-hidden="true" />}

        {limbMarks.map((mark) => (
          <button
            key={mark.key}
            type="button"
            className={`day-ribbon__limb day-ribbon__limb--${mark.key}`}
            data-shown={shownKey === `limb-${mark.key}` ? "true" : undefined}
            style={{ left: `${pctOf(mark.min)}%` }}
            aria-label={mark.aria}
            onClick={() => onPick(`limb-${mark.key}`)}
            onFocus={() => onPick(`limb-${mark.key}`)}
            onMouseEnter={() => onHover(`limb-${mark.key}`)}
            onMouseLeave={() => onHover(null)}
          >
            {mark.key === "star"
              ? <Star size={11} strokeWidth={2.4} aria-hidden="true" />
              : <Moon size={11} strokeWidth={2.4} aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="day-ribbon__scale">
        {ticks.map((tick) => (
          <span
            key={tick.key}
            className={`day-ribbon__tick day-ribbon__tick--${tick.kind} day-ribbon__tick--${tick.align}`}
            style={{ left: `${tick.pct}%` }}
          >
            {tick.node}
          </span>
        ))}
      </div>
    </div>
  );
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
  const reduce = useReducedMotion() ?? false;
  const titleId = useId();
  // What the readout line describes: a hover previews, a click / focus pins.
  const [picked, setPicked] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  if (!panchangam) return null;

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

  // The engine groups windows by kind; the bar and the tab order follow the
  // clock instead.
  segments.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const latestSegmentEnd = segments.reduce((max, s) => Math.max(max, s.endMin), 0);
  const rangeStart = sunriseMin;
  const rangeEnd = Math.max(sunsetMin + 180, latestSegmentEnd, rangeStart + 60);
  const rangeSpan = rangeEnd - rangeStart;

  function pct(minutes: number): number {
    return Math.max(0, Math.min(100, ((minutes - rangeStart) / rangeSpan) * 100));
  }

  const nowMin = minutesOfDayInZone(now, timeZone);
  const nowInRange = isToday && nowMin >= rangeStart && nowMin <= rangeEnd;
  const nowPct = pct(nowMin);
  const phase: "day" | "night" | null = !nowInRange ? null : nowMin <= sunsetMin ? "day" : "night";
  const dayT = Math.max(0, Math.min(1, (nowMin - sunriseMin) / Math.max(1, sunsetMin - sunriseMin)));
  const { current: currentHora, next: nextHora } = isToday
    ? findHorai(panchangam.hora, nowMin)
    : { current: null, next: null };
  // Tamil goes through the almanac period-words; ICU's ta-IN would print
  // "பிற்பகல்", which is not the ruled vocabulary.
  const nowLabel = lang === "ta"
    ? formatClockLabel(`${Math.floor(nowMin / 60)}:${nowMin % 60}`, "ta")
    : formatClockInZone(now, "en-IN", timeZone);

  // ── Star and tithi change-overs ─────────────────────────────────────────
  // The hero masthead names the star and tithi running now; what it cannot
  // show is WHEN they turn over, which is the thing a reader planning the day
  // needs (the 2026-08-19 "Swathi all day" defect was exactly this). Each
  // change is a marker on the bar at its clock time. Only a change that falls
  // on this date and inside the drawn range is placed — an `endsAt` of 10:35
  // tomorrow would otherwise land on today's 10:35.
  const limbMarks: LimbMark[] = [];
  const placeLimb = (
    key: LimbMark["key"],
    limb: { name: string; endsAt?: string | null; endsAtIso?: string | null; nextName?: string | null },
    localize: (name: string, lang: Lang) => string,
  ) => {
    const at = timeToMinutes(limb.endsAt);
    if (at === null || !limb.nextName) return;
    if (limb.endsAtIso && limb.endsAtIso.slice(0, 10) !== panchangam.dateLocal) return;
    if (at < rangeStart || at > rangeEnd) return;
    const time = formatClockLabel(limb.endsAt!, lang);
    const from = localize(limb.name, lang);
    const to = localize(limb.nextName, lang);
    const isStar = key === "star";
    limbMarks.push({
      key,
      min: at,
      glossary: isStar ? "nakshatra" : "tithi",
      label: isStar
        ? (lang === "ta" ? "நட்சத்திரம்" : "Star")
        : (lang === "ta" ? "திதி" : "Tithi"),
      text: lang === "ta" ? `${from} ${time} வரை · பின்பு ${to}` : `${from} until ${time}, then ${to}`,
      aria: isStar
        ? (lang === "ta" ? `நட்சத்திரம் ${time} மாறுகிறது` : `Star changes at ${time}`)
        : (lang === "ta" ? `திதி ${time} மாறுகிறது` : `Tithi changes at ${time}`),
    });
  };
  placeLimb("star", panchangam.nakshatra, tNakshatra);
  placeLimb("tithi", panchangam.tithi, tTithi);

  // ── Scale under the bar: sunrise and sunset once, hour ticks between ──────
  const sunsetPct = pct(sunsetMin);
  const ticks: Tick[] = [
    {
      key: "sunrise",
      pct: 0,
      align: "start",
      kind: "sun",
      node: (
        <>
          <Sunrise size={14} strokeWidth={2} aria-hidden="true" />
          <span className="day-ribbon__tick-text">
            <small>{lang === "ta" ? "சூரிய உதயம்" : "sunrise"}</small>
            <b>{formatClockLabel(panchangam.sunrise, lang)}</b>
          </span>
        </>
      ),
    },
    {
      key: "sunset",
      pct: sunsetPct,
      align: sunsetPct > 88 ? "end" : "center",
      kind: "sun",
      node: (
        <>
          <Sunset size={14} strokeWidth={2} aria-hidden="true" />
          <span className="day-ribbon__tick-text">
            <small>{lang === "ta" ? "அஸ்தமனம்" : "sunset"}</small>
            <b>{formatClockLabel(panchangam.sunset, lang)}</b>
          </span>
        </>
      ),
    },
  ];
  for (let m = Math.ceil(rangeStart / 60) * 60; m <= rangeEnd; m += 180) {
    const p = pct(m);
    // Hours that would print on top of a sun label are dropped, not squeezed.
    if (p < 14 || Math.abs(p - sunsetPct) < 12) continue;
    const hm = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    // Tamil ticks stack the period-word over the hour: "மதியம் 12:00"
    // side by side would crowd the scale at phone width.
    const [word, hour] = lang === "ta" ? formatClockHour(hm, "ta").split(" ") : [null, formatClockLabel(hm, lang)];
    ticks.push({
      key: `h-${m}`,
      pct: p,
      align: p > 92 ? "end" : "center",
      kind: "hour",
      node: <span className="day-ribbon__tick-text">{word && <small>{word}</small>}<b>{hour}</b></span>,
    });
  }

  // ── The readout line ────────────────────────────────────────────────────
  // It names ONE thing: whatever the reader is pointing at, or else the window
  // they are standing in (or the next one today). Never the whole list — the
  // hero rail already prints that.
  const statusOf = (start: number, end: number): SpanStatus | null => {
    if (!isToday) return null;
    if (nowMin >= start && nowMin < end) return "now";
    return nowMin >= end ? "past" : "future";
  };
  const defaultKey = isToday
    ? (segments.find((s) => nowMin >= s.startMin && nowMin < s.endMin)
      ?? segments.find((s) => s.startMin > nowMin))?.key ?? null
    : null;
  const knownKey = (key: string | null) =>
    key !== null && (segments.some((s) => s.key === key) || limbMarks.some((m) => `limb-${m.key}` === key));
  const shownKey = [hovered, picked, defaultKey].find(knownKey) ?? null;
  const shownSegment = segments.find((s) => s.key === shownKey) ?? null;
  const shownLimb = limbMarks.find((m) => `limb-${m.key}` === shownKey) ?? null;

  let readout: ReactNode;
  if (shownSegment) {
    const status = statusOf(shownSegment.startMin, shownSegment.endMin);
    readout = (
      <>
        <span className="day-ribbon__swatch" style={{ background: shownSegment.bg }} aria-hidden="true" />
        {status && <span className={`day-ribbon__status day-ribbon__status--${status}`}>{STATUS_TEXT[status][lang === "ta" ? "ta" : "en"]}</span>}
        <strong>
          {shownSegment.glossary
            ? <GlossaryTerm term={shownSegment.glossary} lang={lang}>{shownSegment.legendName}</GlossaryTerm>
            : shownSegment.legendName}
        </strong>
        <span className={shownSegment.kalamKey ? "day-ribbon__time is-caution" : "day-ribbon__time is-supportive"}>
          {shownSegment.legendTime}
        </span>
      </>
    );
  } else if (shownLimb) {
    const status = isToday ? (nowMin >= shownLimb.min ? "past" : "future") : null;
    readout = (
      <>
        <span className="day-ribbon__swatch day-ribbon__swatch--limb" aria-hidden="true">
          {shownLimb.key === "star" ? <Star size={11} strokeWidth={2.4} /> : <Moon size={11} strokeWidth={2.4} />}
        </span>
        {status && <span className={`day-ribbon__status day-ribbon__status--${status}`}>{STATUS_TEXT[status][lang === "ta" ? "ta" : "en"]}</span>}
        <strong><GlossaryTerm term={shownLimb.glossary} lang={lang}>{shownLimb.label}</GlossaryTerm></strong>
        <span className="day-ribbon__time">{shownLimb.text}</span>
      </>
    );
  } else {
    readout = (
      <span className="day-ribbon__hint">
        {lang === "ta"
          ? "நேரக்கோட்டின் எந்தப் பகுதியையும் தொட்டால் அதன் பெயரும் நேரமும் தெரியும்."
          : "Select any part of the timeline to see what it is and when."}
      </span>
    );
  }

  const weekDays = weekAhead?.days ?? [];

  return (
    <motion.section
      // Keyed on the panchangam's own date, not the picker's (DXA-07): the
      // caller holds the previous day on screen while the next one loads, so
      // keying on the selection would turn the page to a day that is not
      // rendered yet and then sit there, un-turned, when it arrives.
      key={panchangam.dateLocal}
      className="day-ribbon"
      aria-labelledby={titleId}
      initial={reduce ? false : { opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduce ? 0 : DUR.slow, ease: EASE_NOVA }}
    >
      <header className="day-ribbon__head">
        <div className="day-ribbon__heading">
          <h2 id={titleId} className="nova-card-title">
            {lang === "ta" ? "இன்றைய நாள்" : "Your day"}
          </h2>
          {placeLabel && (
            <span className="day-ribbon__place" title={place ?? undefined}>
              <MapPin size={12} strokeWidth={2} aria-hidden="true" />
              {dt(LOCATION_CHECK.timingsFor, lang).replace("%1$s", placeLabel)}
            </span>
          )}
        </div>

        {weekDays.length > 0 && (
          <div className="day-ribbon__week" role="group" aria-label={lang === "ta" ? "இந்த வாரம்" : "This week"}>
            {weekDays.map((day, index) => {
              const isSelected = day.dateLocal === selectedDate;
              const date = new Date(`${day.dateLocal}T12:00:00`);
              const locale = lang === "ta" ? "ta-IN" : "en-IN";
              const weekday = date.toLocaleDateString(locale, { weekday: "short" });
              const dayNumber = date.toLocaleDateString(locale, { day: "numeric" });
              const tone = TONE_TEXT[getScoreBand(day.score).tone][lang === "ta" ? "ta" : "en"];
              return (
                <button
                  key={day.dateLocal}
                  type="button"
                  className="day-ribbon__day"
                  data-selected={isSelected ? "true" : undefined}
                  aria-current={isSelected ? "date" : undefined}
                  onClick={onGoToCalendar}
                  disabled={!onGoToCalendar}
                  aria-label={`${weekday} ${dayNumber}: ${day.score} / 100 · ${tone}`}
                >
                  <span className="day-ribbon__day-name">{weekday}</span>
                  <span className="day-ribbon__day-num">{dayNumber}</span>
                  <span className="day-ribbon__day-bar" aria-hidden="true">
                    <motion.i
                      style={{ background: scoreColorScale(day.score), transformOrigin: "left center" }}
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: Math.max(0.12, Math.min(1, day.score / 100)) }}
                      transition={{ duration: reduce ? 0 : DUR.reveal, ease: EASE_NOVA, delay: reduce ? 0 : 0.1 + index * 0.05 }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      <DayHorizon
        lang={lang}
        reduce={reduce}
        segments={segments}
        limbMarks={limbMarks}
        ticks={ticks}
        pctOf={pct}
        sunsetPct={sunsetPct}
        phase={phase}
        dayT={dayT}
        nowPct={nowPct}
        nowLabel={nowLabel}
        currentKalamKey={currentKalam?.key}
        shownKey={shownKey}
        onPick={setPicked}
        onHover={setHovered}
      />

      <div className="day-ribbon__readout">
        <motion.div
          key={shownKey ?? "hint"}
          className="day-ribbon__detail"
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : DUR.base, ease: EASE_NOVA }}
        >
          {readout}
        </motion.div>

        {currentHora && (
          <div className="day-ribbon__hora" role="group" aria-label={lang === "ta" ? "தற்போதைய ஹோரை" : "Current hora"}>
            <Clock3 size={14} strokeWidth={2} aria-hidden="true" />
            <span className="day-ribbon__hora-label">
              <GlossaryTerm term="hora" lang={lang}>{lang === "ta" ? "ஹோரை" : "Hora"}</GlossaryTerm>
            </span>
            <b>{tPlanetLord(currentHora.lord, lang)}</b>
            {nextHora && (
              <span className="day-ribbon__hora-next">
                {lang === "ta"
                  ? `${formatClockLabel(nextHora.start, lang)} முதல் ${tPlanetLord(nextHora.lord, lang)}`
                  : `then ${tPlanetLord(nextHora.lord, lang)} at ${formatClockLabel(nextHora.start, lang)}`}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}
