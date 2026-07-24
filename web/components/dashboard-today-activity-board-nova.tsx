"use client";

/**
 * "Is today okay for…?" — the one activity-timing card on the Today tab.
 *
 * This merges what used to be two adjacent sections asking the identical
 * question of the identical engine:
 *
 *   - a "Is today okay for…?" pill strip over four hardcoded activities
 *     (travel / property / money / job_change), and
 *   - a "What is today good for?" board over all eleven.
 *
 * They were not merely similar, they were the same rows twice: the strip's
 * `travel` is an alias of the board's `travel_abroad`, its "Signing" is the
 * board's "Property", its "New job" the board's "Job moves" — relabelled, so
 * the duplication read as two different answers rather than one repeated.
 * Everything below is one list, sourced from the board (data-driven: the
 * activities shown are the ones the day actually has something to say about,
 * not a fixed four), keeping the two things the strip alone could do:
 *
 *   - point a caution at a concrete better day this month, and
 *   - offer "Ask your own" for an activity the rules do not cover.
 *
 * Doctrine notes that shape the presentation:
 * - A reason carried by several activities is printed once, on the group
 *   heading, never once per row. On a plain Saturday four activities share
 *   "Saturday unfavourable" — repeating it four times was the exact noise
 *   that made the two old sections look redundant even to themselves.
 * - All three tones ride one horizontal carousel — favourable, then amber
 *   cautions, then the neutral "business as usual" rows — rather than hiding
 *   the neutral majority behind a toggle. When the row is wider than the
 *   viewport, ‹ › paging arrows appear in the header; on touch it just swipes.
 *   Neutral is a legible cool-slate tile, not a greyed-out one, so it reads as
 *   "steady" rather than "disabled".
 * - On a Chandrashtama day the engine returns no favourable rows at all. The
 *   card says so explicitly rather than rendering an empty green column, so it
 *   reads as a deliberate call and not as missing data.
 * - Amber, not red, and "worth a second look" rather than "do not" — the same
 *   non-fatalist framing the Chandrashtama pill uses. A caution here is a
 *   reason to slow down, not a prohibition.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getActivityTimingBatch } from "@vinaadi/shared/api/activityTiming";
import { NovaStarRow } from "./dashboard-ui-nova";
import { formatClockLabel } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { minutesOfDayInZone } from "@/lib/tz";
import type {
  ActivityTimingData,
  DailyActivityBoard,
  DailyActivityVerdict,
  DailyGuidanceWindow,
} from "@/lib/types";

function tx(value: { ta: string; en: string }, lang: Lang): string {
  return lang === "ta" ? value.ta : value.en;
}

function shortHour(clock: string, lang: Lang): string {
  const [time, period] = formatClockLabel(clock).split(" ");
  const hour = time?.split(":")[0] ?? time;
  if (lang === "ta") return `${hour} ${period === "am" ? "காலை" : "மாலை"}`;
  return `${hour} ${period}`;
}

function shortDate(dateLocal: string, lang: Lang): string {
  return new Date(`${dateLocal}T12:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
    day: "numeric",
    month: "short",
  });
}

/** Plain-language timing qualifier for the favourable group, framed against the
 *  day's one real best window rather than re-deriving a second,
 *  activity-specific window we don't have data for. It does not vary by
 *  activity, so it is printed once on the group heading rather than on every
 *  row. Window times are wall-clock at the panchangam location, so "now" is
 *  read in that zone (DASH-01). */
function windowQualifier(
  bestWindow: DailyGuidanceWindow | null,
  now: Date,
  isToday: boolean,
  lang: Lang,
  timeZone?: string | null,
): string | null {
  if (!bestWindow) return null;
  if (!isToday) {
    return lang === "ta"
      ? `சிறந்த நேரம் ${shortHour(bestWindow.start, lang)}`
      : `best window ${shortHour(bestWindow.start, lang)}`;
  }
  const [sh, sm] = bestWindow.start.split(":").map(Number);
  const [eh, em] = bestWindow.end.split(":").map(Number);
  const nowMin = minutesOfDayInZone(now, timeZone);
  const startMin = (sh ?? 0) * 60 + (sm ?? 0);
  const endMin = (eh ?? 0) * 60 + (em ?? 0);
  if (nowMin < startMin) {
    return lang === "ta"
      ? `${shortHour(bestWindow.start, lang)} இல் நல்லது`
      : `fine after ${shortHour(bestWindow.start, lang)}`;
  }
  if (nowMin <= endMin) return lang === "ta" ? "சிறந்த நேரத்தில்" : "in best window";
  return lang === "ta" ? "இன்று நல்லது" : "fine today";
}

/** The reason shared by most rows in a group, or null when they genuinely
 *  differ. Hoisted onto the heading only at 2+, below which naming it on the
 *  row itself is both shorter and more precise. */
function dominantReason(verdicts: DailyActivityVerdict[], lang: Lang): string | null {
  const counts = new Map<string, number>();
  for (const v of verdicts) {
    const reason = tx(v.reason, lang);
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  let winner: string | null = null;
  let best = 1;
  for (const [reason, count] of counts) {
    if (count > best) {
      winner = reason;
      best = count;
    }
  }
  return winner;
}

/** Glance glyph per activity — matched on the activity id + English label so
 *  backend id renames degrade to the generic star, never to a wrong icon. */
const ACTIVITY_ICONS: Array<[RegExp, string]> = [
  [/propert|land|house|sign/i, "⌂"],
  [/business|venture|launch/i, "✦"],
  [/marri|wedding|engag/i, "♥"],
  [/child|baby/i, "❀"],
  [/travel|journey|abroad/i, "➤"],
  [/money|invest|finan|gold/i, "◈"],
  [/job|career|work/i, "▣"],
  [/health|surg|medic/i, "✚"],
  [/vehicle|car/i, "⛟"],
  [/educat|study|exam|learn/i, "✎"],
];

function activityIcon(activity: string, labelEn: string): string {
  const haystack = `${activity} ${labelEn}`;
  return ACTIVITY_ICONS.find(([pattern]) => pattern.test(haystack))?.[1] ?? "✧";
}

/** Plain-language "what does this card mean" per activity, shown in the card's
 *  hover tooltip — because a bare label ("Money decisions", "Trying for a
 *  child") doesn't say what it covers or that it's a *muhurtam* (an auspicious
 *  day to undertake the thing), not a running verdict. Keyed on the stable
 *  backend activity id, so a label rewording never silently drops the help. */
const ACTIVITY_EXPLANATION: Record<string, { en: string; ta: string }> = {
  job_change: { en: "An auspicious day to start a new job or change roles.", ta: "புதிய வேலை தொடங்க / வேலை மாற்ற உகந்த நாள்." },
  business_start: { en: "An auspicious day to launch a business or new venture.", ta: "புதிய தொழில் தொடங்க உகந்த நாள்." },
  money: { en: "For big money moves — buying gold, investments, large purchases or loans.", ta: "தங்கம், முதலீடு, பெரிய கொள்முதல், கடன் போன்ற பெரிய பண முடிவுகளுக்கு." },
  property: { en: "For buying or registering property, or signing important agreements.", ta: "சொத்து வாங்க / பதிவு செய்ய / முக்கிய ஒப்பந்தங்களுக்கு உகந்த நாள்." },
  marriage: { en: "An auspicious day to begin or fix marriage matters.", ta: "திருமண காரியங்களைத் தொடங்க உகந்த நாள்." },
  family_harmony: { en: "For family gatherings, reconciliation or important family decisions.", ta: "குடும்ப கூட்டம், ஒற்றுமை, முக்கிய குடும்ப முடிவுகளுக்கு." },
  child_birth: { en: "A traditional muhurtam for conceiving a child (Garbhadhana).", ta: "குழந்தை பேறுக்கான பாரம்பரிய முகூர்த்தம் (கர்பாதானம்)." },
  education: { en: "For starting studies, admissions or a new course (Vidyarambham).", ta: "படிப்பு, சேர்க்கை, புதிய பாடம் தொடங்க (வித்யாரம்பம்) உகந்த நாள்." },
  travel_abroad: { en: "For setting out on a long journey or overseas travel.", ta: "நீண்ட பயணம் / வெளிநாட்டுப் பயணம் தொடங்க உகந்த நாள்." },
  health: { en: "For scheduling surgery, treatment or a medical procedure.", ta: "அறுவை சிகிச்சை / மருத்துவ சிகிச்சை திட்டமிட உகந்த நாள்." },
  spiritual: { en: "For beginning pujas, vratams, mantra or spiritual practice.", ta: "பூஜை, விரதம், மந்திரம், ஆன்மீக பயிற்சி தொடங்க." },
};

function activityExplanation(activity: string, lang: Lang): string | null {
  const e = ACTIVITY_EXPLANATION[activity];
  return e ? (lang === "ta" ? e.ta : e.en) : null;
}

type ActivityTone = "good" | "caution" | "neutral";

/** Per-tone visuals for `ActivityCardNova`. Stars re-encode the three-way
 *  alignment honestly (SUPPORTS → 4, NEUTRAL → 3, CAUTION → 2) — the middle
 *  value for NEUTRAL, not a fourth invented precision level. Neutral gets its
 *  own cool-slate token (--color-neutral, added for this), giving the board a
 *  genuine third semantic hue — green / amber / slate — instead of dropping to
 *  the faded --color-muted, which read as disabled rather than "steady". */
const TONE_STYLE: Record<ActivityTone, { color: string; bg: string; border: string; stars: number; statusEn: string; statusTa: string }> = {
  good: {
    color: "var(--color-high)",
    bg: "var(--color-high-bg)",
    border: "var(--color-high-border)",
    stars: 4,
    statusEn: "Favourable",
    statusTa: "ஆதரவு உள்ளது",
  },
  caution: {
    color: "var(--color-mid)",
    bg: "var(--color-mid-bg)",
    border: "var(--color-mid-border)",
    stars: 2,
    statusEn: "Worth a second look",
    statusTa: "நிதானம் தேவை",
  },
  neutral: {
    color: "var(--color-neutral)",
    bg: "var(--color-neutral-bg)",
    border: "var(--color-neutral-border)",
    stars: 3,
    statusEn: "Neutral",
    statusTa: "நடுநிலை",
  },
};

/**
 * One activity as a glance card (redesign 2026-07-18, extended to a neutral
 * tone 2026-07-19). The reason renders on the card only when it differs from
 * the group's shared one (stated once, on the section header) — same rule
 * for all three tones, so a Wednesday that's neutral for five activities
 * says "Wednesday is neutral" once, not five times.
 */
function ActivityCardNova({
  verdict,
  lang,
  tone,
  showReason,
  betterDate,
  onGoToCalendar,
}: {
  verdict: DailyActivityVerdict;
  lang: Lang;
  tone: ActivityTone;
  showReason: boolean;
  betterDate?: string | null;
  onGoToCalendar?: () => void;
}) {
  const { color, bg, border, stars, statusEn, statusTa } = TONE_STYLE[tone];
  const label = tx(verdict.label, lang);
  const reason = tx(verdict.reason, lang);
  const explanation = activityExplanation(verdict.activity, lang);
  // Tooltip: what the card means (the muhurtam it covers) first, then today's
  // reason. The explanation answers the "what is a money decision / trying for
  // a child?" question a bare label leaves open.
  const tooltip = explanation ? `${label} — ${explanation}\n${reason}` : `${label} — ${reason}`;
  const betterLabel = betterDate
    ? lang === "ta"
      ? `சிறந்தது ${shortDate(betterDate, lang)}`
      : `better ${shortDate(betterDate, lang)}`
    : null;
  return (
    <li
      title={tooltip}
      style={{
        flex: "0 0 158px",
        scrollSnapAlign: "start",
        background: `linear-gradient(160deg, ${bg}, transparent 75%)`,
        border: `1px solid ${border}`,
        borderRadius: "14px",
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "7px",
      }}
    >
      <div aria-hidden="true" style={{ width: "34px", height: "34px", borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color }}>
        {activityIcon(verdict.activity, verdict.label.en)}
      </div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </div>
      <NovaStarRow value={stars} size={12.5} color={color} />
      <div style={{ fontSize: "11px", fontWeight: 600, color, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {lang === "ta" ? statusTa : statusEn}
        {showReason ? ` · ${reason}` : ""}
      </div>
      {/* A caution is only actionable if it can name when instead. The calendar
          opens on the month, not the day — the label promises no more. */}
      {betterLabel &&
        (onGoToCalendar ? (
          <button
            type="button"
            onClick={onGoToCalendar}
            style={{
              alignSelf: "flex-start",
              font: "inherit",
              fontSize: "11.5px",
              fontWeight: 600,
              color: "var(--color-accent-secondary)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {betterLabel} →
          </button>
        ) : (
          <span style={{ fontSize: "11.5px", color: "var(--color-faint)", whiteSpace: "nowrap" }}>
            {betterLabel}
          </span>
        ))}
    </li>
  );
}

export function DashboardTodayActivityBoardNova({
  board,
  lang,
  chartId,
  selectedDate,
  bestWindow,
  now,
  isToday,
  timeZone,
  onOpenAskVinaadi,
  onGoToCalendar,
}: {
  board: DailyActivityBoard | null | undefined;
  lang: Lang;
  chartId: string | null;
  selectedDate: string;
  bestWindow: DailyGuidanceWindow | null;
  now: Date;
  isToday: boolean;
  /** Panchangam timezone — "now" comparisons happen in this zone (DASH-01). */
  timeZone?: string | null;
  onOpenAskVinaadi: () => void;
  onGoToCalendar?: () => void;
}) {
  const [timing, setTiming] = useState<Record<string, ActivityTimingData | null>>({});

  // Horizontal carousel: every activity — favourable, caution and neutral —
  // rides one scrolling row now, so ‹ › paging arrows replace the old
  // "N more" toggle. They surface only when the row actually overflows, and
  // each disables at its end of the track.
  const scrollerRef = useRef<HTMLUListElement | null>(null);
  const [scroll, setScroll] = useState({ overflow: false, atStart: true, atEnd: false });

  const syncScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth > 1;
    setScroll({
      overflow,
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft >= el.scrollWidth - el.clientWidth - 1,
    });
  }, []);

  const cardCount =
    (board?.favourable.length ?? 0) + (board?.caution.length ?? 0) + (board?.neutral.length ?? 0);

  useEffect(() => {
    syncScroll();
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(syncScroll);
    ro.observe(el);
    return () => ro.disconnect();
    // Re-measure when the card count changes (data load / date switch).
  }, [syncScroll, cardCount]);

  const pageScroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Only the cautioned activities are looked up: they are the only rows where
  // "when instead?" is the next question, and the batch caps at 12 ids.
  const cautionKeys = useMemo(
    () => (board?.caution ?? []).map((v) => v.activity).slice(0, 12),
    [board],
  );
  const cautionKey = cautionKeys.join(",");

  useEffect(() => {
    if (!chartId || !selectedDate || !cautionKey) {
      setTiming({});
      return;
    }
    let cancelled = false;
    getActivityTimingBatch(chartId, cautionKey.split(","), selectedDate.slice(0, 7), selectedDate)
      .then((response) => {
        if (cancelled) return;
        setTiming(response.data.results ?? {});
      })
      .catch(() => {
        // A missing better-date degrades the row to its reason alone, which is
        // still a complete verdict — never blank the card over it.
        if (cancelled) return;
        setTiming({});
      });
    return () => {
      cancelled = true;
    };
  }, [chartId, selectedDate, cautionKey]);

  // Older cached guidance rows predate this field.
  if (!board) return null;

  const { favourable, caution, neutral, isChandrashtama } = board;
  if (favourable.length === 0 && caution.length === 0 && neutral.length === 0) return null;

  // "State a shared cause once" still hoists the reason most favourable/caution
  // cards share onto the section header, not onto each card.
  const sharedReason = dominantReason([...favourable, ...caution], lang);
  const windowNote = windowQualifier(bestWindow, now, isToday, lang, timeZone);
  const headerNote = [sharedReason, windowNote].filter(Boolean).join(" · ") || null;
  // Neutral dedups its own dominant reason among the neutral cards only (kept
  // out of the header, which stays about the favourable/caution signal), so a
  // day that's neutral-for-five doesn't repeat that clause five times.
  const neutralSharedReason = dominantReason(neutral, lang);

  /** Next date this month, after the selected one, where the same activity
   *  actually SUPPORTS — turns "not today" into "then when". */
  const betterDateFor = (activity: string): string | null =>
    (timing[activity]?.topDates ?? [])
      .filter((d) => d.dateLocal > selectedDate && d.alignment === "SUPPORTS")
      .sort((x, y) => (x.dateLocal < y.dateLocal ? -1 : 1))[0]?.dateLocal ?? null;

  return (
    <section
      aria-label={lang === "ta" ? "இன்று எதற்கு ஏற்றது" : "What today favours"}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-strong)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-strong)",
          }}
        >
          {lang === "ta" ? "இன்று நல்ல நாளா…?" : "Is today okay for…?"}
        </h3>
        {headerNote && (
          <span style={{ fontSize: "12px", color: "var(--color-muted)", minWidth: 0 }}>
            {"· "}
            {headerNote}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {scroll.overflow && (
          <div style={{ display: "flex", gap: "6px", alignSelf: "center" }}>
            {([-1, 1] as const).map((dir) => {
              const disabled = dir === -1 ? scroll.atStart : scroll.atEnd;
              return (
                <button
                  key={dir}
                  type="button"
                  onClick={() => pageScroll(dir)}
                  disabled={disabled}
                  aria-label={
                    dir === -1
                      ? lang === "ta" ? "முந்தையவை" : "Scroll back"
                      : lang === "ta" ? "அடுத்தவை" : "Scroll forward"
                  }
                  style={{
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "1px solid var(--color-border-strong)",
                    background: "color-mix(in srgb, var(--color-text-strong) 4%, transparent)",
                    color: "var(--color-text)",
                    fontSize: "15px",
                    lineHeight: 1,
                    cursor: disabled ? "default" : "pointer",
                    opacity: disabled ? 0.35 : 1,
                    transition: "opacity 120ms ease",
                    fontFamily: "inherit",
                  }}
                >
                  {dir === -1 ? "‹" : "›"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Purpose line — this board answers a *different* question from the Life
          Areas tiles, and without saying so the two read as contradictory
          ("Medical procedures · Neutral" here vs "Health 44 · take care" there).
          This one is muhurtam: the auspicious day to *begin* something. Life
          Areas is the standing outlook of a domain. Both true, different axes. */}
      <p style={{ margin: "-4px 0 12px", fontSize: "12px", lineHeight: 1.5, color: "var(--color-faint)" }}>
        {lang === "ta"
          ? "ஒரு செயலை எப்போது தொடங்குவது நல்லது என்பதற்கான நேர வழிகாட்டி — வாழ்க்கைத் துறை மதிப்பெண் அல்ல."
          : "The auspicious day to begin something — a timing guide, not your life-area outlook."}
      </p>

      {/* An empty green column on a Chandrashtama day is a decision, not an
          absence — say so, or it reads as a loading failure. */}
      {favourable.length === 0 && isChandrashtama && (
        <p
          style={{
            margin: "0 0 12px",
            fontSize: "12.5px",
            lineHeight: 1.5,
            color: "var(--color-muted)",
          }}
        >
          {lang === "ta"
            ? "இன்று சந்திராஷ்டமம் என்பதால் புதிய தொடக்கங்கள் எதுவும் பரிந்துரைக்கப்படவில்லை. வழக்கமான வேலைகள் தொடரலாம்."
            : "Because today is your Chandrashtama, nothing is put forward as a good day to begin. Routine work carries on as normal."}
        </p>
      )}

      {/* One horizontal carousel — favourable, then cautions, then the neutral
          "business as usual" rows shown inline (no longer toggled away), then
          the dashed way out for the activity the rules don't cover. The ‹ ›
          arrows in the header page it; on touch it swipes. */}
      <ul
        ref={scrollerRef}
        onScroll={syncScroll}
        className="nova-activity-scroller"
        style={{
          listStyle: "none",
          margin: 0,
          padding: "2px 1px 4px",
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          scrollSnapType: "x proximity",
        }}
      >
        {favourable.map((v) => (
          <ActivityCardNova
            key={v.activity}
            verdict={v}
            lang={lang}
            tone="good"
            showReason={tx(v.reason, lang) !== sharedReason}
          />
        ))}
        {caution.map((v) => (
          <ActivityCardNova
            key={v.activity}
            verdict={v}
            lang={lang}
            tone="caution"
            showReason={tx(v.reason, lang) !== sharedReason}
            betterDate={betterDateFor(v.activity)}
            onGoToCalendar={onGoToCalendar}
          />
        ))}
        {neutral.map((v) => (
          <ActivityCardNova
            key={v.activity}
            verdict={v}
            lang={lang}
            tone="neutral"
            showReason={tx(v.reason, lang) !== neutralSharedReason}
          />
        ))}
        {/* The rules cover eleven activities; this is the way out for the
            twelfth. Ask Vinaadi's permanent home is the topbar — this is a
            contextual entry point, not a second one competing for the page. */}
        <li style={{ flex: "0 0 158px", scrollSnapAlign: "start", display: "flex" }}>
          <button
            type="button"
            onClick={onOpenAskVinaadi}
            style={{
              flex: 1,
              minHeight: "110px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontSize: "11px",
              lineHeight: 1.35,
              color: "var(--color-accent-secondary)",
              background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)",
              border: "1px dashed var(--color-accent-secondary-muted, var(--color-accent-secondary))",
              borderRadius: "14px",
              padding: "12px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span aria-hidden="true" style={{ width: "26px", height: "26px", borderRadius: "8px", background: "color-mix(in srgb, var(--color-accent-secondary) 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>+</span>
            {lang === "ta" ? "உங்கள் கேள்வி" : "Ask your own"}
          </button>
        </li>
      </ul>
    </section>
  );
}
