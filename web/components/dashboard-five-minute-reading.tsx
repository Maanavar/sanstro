"use client";

import { Fragment, useEffect, useState } from "react";

import type { Lang } from "@/lib/i18n";
import {
  getFiveMinuteReading,
  type FiveMinuteReadingData,
} from "@vinaadi/shared/api/fiveMinuteReading";
import type { OneMinuteBeat } from "@vinaadi/shared/api/oneMinuteReading";

/**
 * "Your Chart in Five Minutes" — docs/FIVE_MINUTE_READING_SPEC_2026-08-11.md.
 *
 * Deliberately a thin sibling of dashboard-one-minute-reading.tsx, not a
 * generalisation over both: it reuses that component's `.om` prose styling
 * verbatim (same surface, same rules — prose not panels, no numbers, jargon
 * behind one disclosure) because the five-minute reading IS the two-minute
 * reading's own beats extended, not a different kind of object. What it does
 * NOT reuse is the pending-question machinery — `five_minute_reading_
 * service.build_five_minute_reading` always sends `pendingQuestion: null`
 * today (only "self" ships, and Beat 7's topic gating is what will someday
 * populate it), so that code path is left out here rather than stubbed for a
 * question that cannot yet be asked. Add it back in the same change that
 * makes the backend able to withhold a beat.
 *
 * Renders nothing when the endpoint 404s — flag off, or any register other
 * than "self" (which is everything but "self" right now, per the backend's
 * own module docstring).
 */

const LEAD_BEAT = "who_you_are";
const CLOSING_BEAT = "one_thing";
const TERMS_BEAT = "what_this_rests_on";

type LoadStatus = "loading" | "ready" | "absent";

export type DashboardFiveMinuteReadingProps = {
  lang: Lang;
  chartId: string;
  onOpenFullChart?: () => void;
};

function monthYear(value: string, lang: Lang): string {
  const [year, month] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month) return "";
  return new Date(year, month - 1, 1).toLocaleDateString(
    lang === "ta" ? "ta-IN" : "en-IN",
    { month: "long", year: "numeric" },
  );
}

function BeatBlock({
  beat,
  lang,
  showBasis,
}: {
  beat: OneMinuteBeat;
  lang: Lang;
  showBasis: boolean;
}) {
  const isLead = beat.id === LEAD_BEAT;
  const isClosing = beat.id === CLOSING_BEAT;
  const isTerms = beat.id === TERMS_BEAT;

  const paragraph = (
    <p className={`om__p${isLead ? " om__p--lead" : ""}${isTerms ? " om__p--terms" : ""}`}>
      {lang === "ta" ? beat.text.ta : beat.text.en}
    </p>
  );

  const beatClass = isClosing
    ? "om__beat om__beat--close"
    : isTerms
      ? "om__beat om__beat--terms"
      : "om__beat";

  return (
    <div className={beatClass}>
      {isClosing ? <div className="om__close">{paragraph}</div> : paragraph}
      {showBasis && beat.basis && (
        <p className="om__basis">{lang === "ta" ? beat.basis.ta : beat.basis.en}</p>
      )}
    </div>
  );
}

export function DashboardFiveMinuteReading({
  lang,
  chartId,
  onOpenFullChart,
}: DashboardFiveMinuteReadingProps) {
  const [data, setData] = useState<FiveMinuteReadingData | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showBasis, setShowBasis] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setStatus("loading");
    getFiveMinuteReading(chartId)
      .then((res) => {
        if (cancelled) return;
        if (res.data) {
          setData(res.data);
          setStatus("ready");
        } else {
          setData(null);
          setStatus("absent");
        }
      })
      .catch(() => {
        // A flag-off deployment, or any register but "self", answers 404 —
        // absent, not broken. See dashboard-one-minute-reading.tsx.
        if (cancelled) return;
        setData(null);
        setStatus("absent");
      });
    return () => {
      cancelled = true;
    };
  }, [chartId]);

  useEffect(() => {
    if (status !== "loading") {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === "absent") return null;

  if (status === "loading" || !data) {
    if (!showSkeleton) return null;
    return (
      <section className="om" aria-busy="true">
        <div className="om__col">
          <div className="om__skeleton">
            <span style={{ height: 27, width: "56%" }} />
            <span style={{ width: "40%", marginBottom: 12 }} />
            <span style={{ width: "97%" }} />
            <span style={{ width: "92%" }} />
            <span style={{ width: "70%" }} />
          </div>
        </div>
      </section>
    );
  }

  const asOfLabel = monthYear(data.asOf, lang);
  const holdsLabel = monthYear(data.readingWindow?.to ?? "", lang);
  const meta =
    asOfLabel && holdsLabel
      ? lang === "ta"
        ? `${asOfLabel} நிலவரப்படி — நீங்கள் இருக்கும் நடப்புக் காலத்திற்காக எழுதப்பட்டது; ${holdsLabel} வரை இது மாறாது.`
        : `As of ${asOfLabel} — written for the period you are in now, and it holds until ${holdsLabel}.`
      : asOfLabel
        ? lang === "ta"
          ? `${asOfLabel} நிலவரப்படி.`
          : `As of ${asOfLabel}.`
        : "";

  // TITLED "FOUR MINUTES", NOT FIVE, since 2026-08-12 — and the number is
  // measured, not chosen. Same fix as `dashboard-one-minute-reading.tsx`'s own
  // rename in 930689c ("one minute" -> "two minutes"): the displayed copy is
  // what was wrong, so the displayed copy is all that changes. Module name,
  // route (`/five-minute`), feature flag and spec filename are untouched.
  //
  // The rate is the product's own, not a fresh guess. That earlier rename put
  // a 236-word median reading on the label "two minutes" — 118 words per
  // advertised minute — and this reading measures 487 EN words median across a
  // 120-chart sweep, which is 4.1 of those minutes. See
  // `_FIVE_MIN_WORD_BUDGET`'s comment for the full distribution.
  const title =
    lang === "ta"
      ? "உங்கள் ஜாதகம் — நான்கு நிமிடங்களில்"
      : "Your chart in four minutes";
  const titleId = `fm-title-${chartId}`;
  const hasBasis = data.beats.some((beat) => beat.basis);

  return (
    <section className="om" aria-labelledby={titleId}>
      <div className="om__col">
        <header className="om__head">
          <div className="om__head-text">
            <h2 id={titleId} className="om__title">
              {title}
            </h2>
            {meta && <p className="om__meta">{meta}</p>}
          </div>

          {hasBasis && (
            <button
              type="button"
              className="om__basis-toggle"
              onClick={() => setShowBasis((open) => !open)}
              aria-expanded={showBasis}
            >
              {showBasis
                ? lang === "ta"
                  ? "அடிப்படையை மறை"
                  : "Hide the astrology"
                : lang === "ta"
                  ? "அடிப்படையைக் காட்டு"
                  : "Show the astrology"}
            </button>
          )}
        </header>

        <div className="om__beats">
          {data.beats.map((beat) => (
            <Fragment key={beat.id}>
              <BeatBlock beat={beat} lang={lang} showBasis={showBasis} />
            </Fragment>
          ))}
        </div>

        {onOpenFullChart && (
          <button type="button" className="om__next" onClick={onOpenFullChart}>
            {lang === "ta" ? data.nextStep.label.ta : data.nextStep.label.en} →
          </button>
        )}
      </div>
    </section>
  );
}
