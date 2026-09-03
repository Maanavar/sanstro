"use client";

import { useEffect, useState } from "react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import { formatDateLabel, todayIso } from "@/lib/format";
import {
  getChartPersonalCycle,
  type PersonalCycleResponse,
  type PersonalYearEpoch,
} from "@vinaadi/shared/api/numerology";

import {
  NumberReadingCard,
  NumerologyError,
  NumerologyLoading,
  NumerologyUnavailable,
  ReadingsWithheldNote,
  TraditionNote,
  isNumerologyUnavailable,
} from "./dashboard-numerology-shared";
import { Card } from "./ui/card";
import { Field, Input } from "./ui/field";
import { Kicker } from "./ui/kicker";

/**
 * Personal year / month / day (Phase 4, NUM-40 … NUM-41).
 *
 * The epoch is doctrine, not decoration. Under `"birthday"` the personal year
 * turns on the native's birthday; under `"january"` on 1 January; under
 * `"chithirai"` at Puthandu, resolved from the ephemeris at the native's own
 * longitude. The same date sits in a different personal year under each, so the
 * window and the convention that produced it are always rendered together —
 * a bare "you are in a 7 year" is unfalsifiable without them.
 *
 * Default here is `"birthday"`, chosen for coherence with varshaphala (the solar
 * return is the birthday boundary), not because the other conventions are wrong.
 *
 * ## What was wrong with this panel (2026-07-29)
 *
 * It rendered three bare digits and three graha names and explained none of it.
 * Three specific omissions, and the first is the one that made the other two
 * read as a broken screen rather than a partial one:
 *
 * 1. **It was the only numerology view with no honest-absence note.** Every
 *    sibling renders `ReadingsWithheldNote` off `readingsAvailable`; this one
 *    could not, because `PersonalCycleResponse` was the single response in the
 *    feature that never carried the field. So the reader got numbers with no
 *    meaning *and* no account of why the meaning was missing. The field was
 *    added to the schema in the same change.
 * 2. **No statement of where the numbers come from.** `psychic` and `destiny`
 *    have `CORE_NUMBER_GLOSS` ("from the day of the month you were born");
 *    year, month and day had nothing, so "Month · 4 · Rahu" was unreadable.
 * 3. **The chain between them was invisible** — and it is the whole structure.
 *    The month is *the year root plus the calendar month*; the day is *the month
 *    root plus the day of the month* (`numerology_timing.personal_month` /
 *    `personal_day`). Each number is built from the one before it, which is the
 *    single fact that turns three unrelated digits into a cycle.
 *
 * All three additions are facts about the calculation, not readings of a person
 * — the rule stated in `dashboard-numerology-shared.tsx` — so none of them
 * touch the withheld corpus.
 */

type Props = {
  lang: Lang;
  chartId: string;
};

/**
 * Rendering of the server-configured epoch flag — a label for a decision the
 * backend already made, not a control. Exhaustive over `PersonalYearEpoch` on
 * purpose: adding a fourth convention should fail the type check here rather
 * than render a blank window description.
 */
const EPOCH_COPY: Record<PersonalYearEpoch, { en: string; ta: string }> = {
  birthday: { en: "turns on your birthday", ta: "உங்கள் பிறந்தநாளில் மாறுகிறது" },
  january: { en: "turns on 1 January", ta: "ஜனவரி 1 அன்று மாறுகிறது" },
  chithirai: { en: "turns at Puthandu (Chithirai)", ta: "புத்தாண்டில் (சித்திரை) மாறுகிறது" },
};

/* The calendar month and day the server actually keyed the month/day numbers
 * to. Read off `onDate` (the server's echo of what it computed) rather than the
 * local input, so the hint can never describe a different date than the numbers
 * beside it — the two diverge for one render while a new date is in flight. */
function monthOf(isoDate: string): number {
  return Number(isoDate.slice(5, 7));
}

function dayOf(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

export function NumerologyCycleSection({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [onDate, setOnDate] = useState(todayIso());
  const [data, setData] = useState<PersonalCycleResponse | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "unavailable">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setPhase("loading");
    getChartPersonalCycle(chartId, onDate)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setPhase("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isNumerologyUnavailable(err)) {
          setPhase("unavailable");
          return;
        }
        setError(readErrorMessage(err));
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [chartId, onDate]);

  if (phase === "unavailable") return <NumerologyUnavailable lang={lang} />;

  const epochCopy = data ? EPOCH_COPY[data.year.epoch] : null;

  return (
    <Card style={{ gap: "var(--space-4)" }}>
      <div>
        <Kicker as="div">{isTamil ? "தனிப்பட்ட சுழற்சி" : "Personal cycle"}</Kicker>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {isTamil
            ? "பிறந்த தேதியிலிருந்து வரும் ஆண்டு, மாதம் மற்றும் நாள் எண்கள். பிறந்த தேதி ஜாதகத்திலிருந்து எடுக்கப்படுகிறது."
            : "Year, month and day numbers from the date of birth — taken from the jadhagam, not re-entered."}
        </p>
      </div>

      <div style={{ maxWidth: "260px" }}>
        <Field
          label={isTamil ? "எந்தத் தேதிக்கு" : "For which date"}
          helper={
            isTamil
              ? "எதிர்கால தேதியை வைத்து அன்றைய எண்களைப் பாருங்கள்"
              : "Set a future date to see its numbers"
          }
        >
          <Input type="date" value={onDate} onChange={(e) => setOnDate(e.target.value)} />
        </Field>
      </div>

      {phase === "loading" ? <NumerologyLoading lang={lang} /> : null}
      {phase === "error" ? <NumerologyError lang={lang} message={error} /> : null}

      {data && phase === "ready" ? (
        <>
          {/* The year window and the convention that produced it, together. */}
          <Card variant="soft" compact style={{ gap: "var(--space-1)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {isTamil ? "தற்போதைய தனிப்பட்ட ஆண்டு" : "Current personal year"}
            </div>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--display-sm)",
                  fontWeight: 600,
                  lineHeight: 1,
                  color: "var(--color-text-strong)",
                }}
              >
                {data.year.reading.root}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
                {isTamil ? data.year.reading.grahaTa : data.year.reading.grahaEn}
              </span>
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
              {formatDateLabel(data.year.cycleStart)} — {formatDateLabel(data.year.cycleEnd)}
              {epochCopy ? ` · ${isTamil ? epochCopy.ta : epochCopy.en}` : ""}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {isTamil ? "கணக்கிடப்பட்ட ஆண்டு" : "Governing year"} · {data.year.governingYear}
            </div>
          </Card>

          {/* Year meaning — what this year is about */}
          {data.year.meaning && (
            <Card variant="soft" style={{ gap: "var(--space-2)" }}>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isTamil ? "இந்தக் கட்டத்தின் கருப்பொருள்" : "The theme of this period"}
              </div>
              {data.year.meaning.themeEn && (
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-text)" }}>
                  <strong>{isTamil ? "கருப்பொருள்: " : "Theme: "}</strong>
                  {isTamil ? data.year.meaning.themeTa : data.year.meaning.themeEn}
                </p>
              )}
              {data.year.meaning.actionEn && (
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-text)" }}>
                  <strong>{isTamil ? "செய்ய வேண்டியவை: " : "Focus on: "}</strong>
                  {isTamil ? data.year.meaning.actionTa : data.year.meaning.actionEn}
                </p>
              )}
              {data.year.meaning.watchEn && (
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-text)" }}>
                  <strong>{isTamil ? "கவனிக்க வேண்டியவை: " : "Watch for: "}</strong>
                  {isTamil ? data.year.meaning.watchTa : data.year.meaning.watchEn}
                </p>
              )}
            </Card>
          )}

          <div className="nova-grid-3" style={{ gap: "var(--space-3)" }}>
            <NumberReadingCard
              reading={data.year.reading}
              label={isTamil ? "ஆண்டு" : "Year"}
              lang={lang}
              hint={
                isTamil
                  ? `பிறந்த நாள் + பிறந்த மாதம் + ${data.year.governingYear} இலக்கங்களின் கூட்டுத்தொகை = ${data.year.reading.total}`
                  : `digit sum of birth day + birth month + ${data.year.governingYear} = ${data.year.reading.total}`
              }
            />
            <NumberReadingCard
              reading={data.month.reading}
              label={isTamil ? "மாதம்" : "Month"}
              lang={lang}
              hint={
                isTamil
                  ? `ஆண்டு எண் ${data.year.reading.root} + நாட்காட்டி மாதம் ${monthOf(data.onDate)} = ${data.month.reading.total}`
                  : `year number ${data.year.reading.root} + calendar month ${monthOf(data.onDate)} = ${data.month.reading.total}`
              }
            />
            <NumberReadingCard
              reading={data.day.reading}
              label={isTamil ? "நாள்" : "Day"}
              lang={lang}
              hint={
                isTamil
                  ? `தனிப்பட்ட மாத எண் ${data.month.reading.root} (நாட்காட்டி மாதம் அல்ல) + தேதி ${dayOf(data.onDate)} = ${data.day.reading.total}`
                  : `personal month number ${data.month.reading.root} (not the calendar month) + day of month ${dayOf(data.onDate)} = ${data.day.reading.total}`
              }
            />
          </div>

          {/* The structure, said once. Without it the three cards above read as
              three unrelated digits rather than as one cycle nested inside
              another — and the nesting is the only reason the day number moves
              when the year does. */}
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.6 }}>
            {isTamil
              ? "ஒவ்வொன்றும் அதற்கு முந்தையதிலிருந்து கட்டப்படுகிறது — ஆண்டு எண் மாத எண்ணுக்குள், மாத எண் நாள் எண்ணுக்குள். ஆண்டின் எல்லை மட்டுமே மரபைப் பொறுத்தது; மாதமும் நாளும் எல்லா மரபிலும் நாட்காட்டித் தேதியைப் பின்பற்றுகின்றன."
              : "Each is built from the one before it — the year number feeds the month, the month feeds the day. Only the year boundary is a matter of convention; the month and day steps follow the calendar date under every one of them."}
          </div>

          {/* The reason there is no meaning printed beside any of these
              numbers. This panel is the one that most needs saying so. */}
          <ReadingsWithheldNote lang={lang} readingsAvailable={data.readingsAvailable} />
          <TraditionNote lang={lang} traditionEn={data.traditionEn} traditionTa={data.traditionTa} />
        </>
      ) : null}
    </Card>
  );
}
