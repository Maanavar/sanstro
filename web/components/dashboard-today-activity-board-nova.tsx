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
 * - Green and amber are shown; the neutral majority is collapsed behind a
 *   toggle. Listing six "routine progress is fine" rows would bury the two
 *   lines that carry information.
 * - On a Chandrashtama day the engine returns no favourable rows at all. The
 *   card says so explicitly rather than rendering an empty green column, so it
 *   reads as a deliberate call and not as missing data.
 * - Amber, not red, and "worth a second look" rather than "do not" — the same
 *   non-fatalist framing the Chandrashtama pill uses. A caution here is a
 *   reason to slow down, not a prohibition.
 */

import React, { useEffect, useMemo, useState } from "react";

import { getActivityTimingBatch } from "@vinaadi/shared/api/activityTiming";
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

function GroupHeading({ color, label, note }: { color: string; label: string; note?: string | null }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "4px",
      }}
    >
      <span
        style={{
          fontSize: "11.5px",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color,
        }}
      >
        {label}
      </span>
      {note && (
        <span style={{ fontSize: "12px", color: "var(--color-muted)", minWidth: 0 }}>
          {"· "}
          {note}
        </span>
      )}
    </div>
  );
}

function VerdictRow({
  verdict,
  lang,
  tone,
  /** Suppressed when the group heading already states it. */
  showReason,
  betterDate,
  onGoToCalendar,
}: {
  verdict: DailyActivityVerdict;
  lang: Lang;
  tone: "good" | "caution";
  showReason: boolean;
  betterDate?: string | null;
  onGoToCalendar?: () => void;
}) {
  const color = tone === "good" ? "var(--color-high)" : "var(--color-mid)";
  const betterLabel = betterDate
    ? lang === "ta"
      ? `சிறந்தது ${shortDate(betterDate, lang)}`
      : `better ${shortDate(betterDate, lang)}`
    : null;
  return (
    <li
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "8px",
        padding: "5px 0",
        lineHeight: 1.45,
      }}
    >
      <span aria-hidden="true" style={{ color, fontWeight: 700, flex: "none" }}>
        {tone === "good" ? "✓" : "!"}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: "13px", color: "var(--color-text)", fontWeight: 600 }}>
          {tx(verdict.label, lang)}
        </span>
        {showReason && (
          <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
            {" — "}
            {tx(verdict.reason, lang)}
          </span>
        )}
      </span>
      {/* A caution is only actionable if it can name when instead. The calendar
          opens on the month, not the day — the label promises no more. */}
      {betterLabel &&
        (onGoToCalendar ? (
          <button
            type="button"
            onClick={onGoToCalendar}
            style={{
              flex: "none",
              font: "inherit",
              fontSize: "12px",
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
          <span style={{ flex: "none", fontSize: "12px", color: "var(--color-faint)", whiteSpace: "nowrap" }}>
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
  const [showNeutral, setShowNeutral] = useState(false);
  const [timing, setTiming] = useState<Record<string, ActivityTimingData | null>>({});

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

  const favourableReason = dominantReason(favourable, lang);
  const cautionReason = dominantReason(caution, lang);
  const windowNote = windowQualifier(bestWindow, now, isToday, lang, timeZone);

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
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-text-accent)",
          }}
        >
          {lang === "ta" ? "இன்று நல்ல நாளா…?" : "Is today okay for…?"}
        </h3>
        {/* The rules cover eleven activities; this is the way out for the
            twelfth. Ask Vinaadi's permanent home is the topbar — this is a
            contextual entry point, not a second one competing for the page. */}
        <button
          type="button"
          onClick={onOpenAskVinaadi}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12.5px",
            color: "var(--color-accent-secondary)",
            background: "none",
            border: "1px dashed var(--color-accent-secondary-muted)",
            borderRadius: "999px",
            padding: "6px 13px",
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          + {lang === "ta" ? "உங்கள் கேள்வி" : "Ask your own"}
        </button>
      </div>

      {favourable.length > 0 && (
        <>
          <GroupHeading
            color="var(--color-high)"
            label={lang === "ta" ? "ஆதரவு உள்ளது" : "Favourable"}
            note={[favourableReason, windowNote].filter(Boolean).join(" · ") || null}
          />
          <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0 }}>
            {favourable.map((v) => (
              <VerdictRow
                key={v.activity}
                verdict={v}
                lang={lang}
                tone="good"
                showReason={tx(v.reason, lang) !== favourableReason}
              />
            ))}
          </ul>
        </>
      )}

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

      {caution.length > 0 && (
        <>
          <GroupHeading
            color="var(--color-mid)"
            label={lang === "ta" ? "நிதானம் தேவை" : "Worth a second look"}
            note={cautionReason}
          />
          <ul style={{ listStyle: "none", margin: "0 0 8px", padding: 0 }}>
            {caution.map((v) => (
              <VerdictRow
                key={v.activity}
                verdict={v}
                lang={lang}
                tone="caution"
                showReason={tx(v.reason, lang) !== cautionReason}
                betterDate={betterDateFor(v.activity)}
                onGoToCalendar={onGoToCalendar}
              />
            ))}
          </ul>
        </>
      )}

      {neutral.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowNeutral((prev) => !prev)}
            aria-expanded={showNeutral}
            style={{
              background: "none",
              border: "none",
              padding: "4px 0 0",
              cursor: "pointer",
              font: "inherit",
              fontSize: "12px",
              color: "var(--color-muted)",
              textDecoration: "underline",
            }}
          >
            {showNeutral
              ? lang === "ta"
                ? "மற்றவற்றை மறை"
                : "Hide the rest"
              : lang === "ta"
                ? `மற்ற ${neutral.length} செயல்கள் — வழக்கம் போல்`
                : `${neutral.length} others — business as usual`}
          </button>
          {showNeutral && (
            <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
              {neutral.map((v) => (
                <li
                  key={v.activity}
                  style={{
                    padding: "3px 0",
                    fontSize: "12.5px",
                    color: "var(--color-muted)",
                    lineHeight: 1.45,
                  }}
                >
                  {tx(v.label, lang)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
