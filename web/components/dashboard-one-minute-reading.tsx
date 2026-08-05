"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import {
  getOneMinuteReading,
  type OneMinuteBeat,
  type OneMinuteReadingData,
} from "@vinaadi/shared/api/oneMinuteReading";

/**
 * "Your Chart in One Minute" — docs/ONE_MINUTE_READING_2026-08-04.md.
 *
 * The rendering rules are the product, not styling preference:
 *
 * - **Prose, not panels.** One centred column, generous measure, real
 *   paragraph rhythm. Everything else on this page is a card of facts; this is
 *   the one surface someone reads rather than scans, so it is not a <Card> at
 *   all — the `.om` block in dashboard-nova.css gives it its own page-like
 *   surface, and the reason it is not the shared card primitive is written
 *   there.
 * - **No numbers.** No score, no ring, no chip carrying a value. A rating
 *   beside a narrative verdict fuses into one confused claim.
 * - **Jargon stays behind ONE disclosure.** Each beat's `basis` is the only
 *   place technical vocabulary appears. It used to open per beat, which put the
 *   same five underlined words under seven consecutive paragraphs and turned a
 *   piece of writing into a list of toggles. Whether the reader wants the
 *   astrological layer is one decision, so it is asked once, in the header,
 *   out of the prose column.
 * - **"As of" is stated, and so is how long it holds.** The reading moves at
 *   the antardasha boundary, not daily. Saying only "as of August" leaves a
 *   returning reader wondering why it is unchanged; naming the window the
 *   backend already sends turns that stability into the honest part it is.
 *
 * Renders nothing at all when the endpoint 404s, which is what a flag-off
 * deployment returns — and the loading skeleton is held back 200ms so that
 * fast 404 never flashes a placeholder for a feature that is not there.
 */

/** The falsifiable opening — set as a lead, never as the first of seven blocks. */
const LEAD_BEAT = "who_you_are";
/** The action to take; lands on its own tinted surface so the piece has an end. */
const CLOSING_BEAT = "one_thing";
/**
 * What the reading rests on, and how to tell if it is wrong. Set QUIETLY and
 * deliberately so: it arrives second, immediately after the lead, and given the
 * same weight as the body it reads as the reading's own second sentence —
 * cold water two sentences in. It is not part of the reading; it is the terms
 * the reading is offered under, and the type has to say so before the words do.
 */
const TERMS_BEAT = "what_this_rests_on";

type LoadStatus = "loading" | "ready" | "absent";

export type DashboardOneMinuteReadingProps = {
  lang: Lang;
  chartId: string;
  /** Navigates to the full chart; omit on surfaces that already are it. */
  onOpenFullChart?: () => void;
};

/** Month + year from a `YYYY-MM-DD` wire date, built in local time.
 *
 * `new Date("2026-08-01")` parses as UTC midnight, which is the previous month
 * anywhere west of UTC — a one-day error that only ever shows up on the 1st,
 * i.e. exactly when nobody is looking for it. */
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

export function DashboardOneMinuteReading({
  lang,
  chartId,
  onOpenFullChart,
}: DashboardOneMinuteReadingProps) {
  const [data, setData] = useState<OneMinuteReadingData | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showBasis, setShowBasis] = useState(false);
  const [answering, setAnswering] = useState(false);

  // Through the shared wrapper, not a hand-written path: it is the one place
  // the route shape was checked against the FastAPI decorator, and two wrappers
  // in that package have silently drifted from their routes before.
  // `getOneMinuteReading` resolves to the identical request `apiFetchJson`
  // would build — the ApiClient adapter in lib/api.ts is apiFetchJson, and
  // normalizeApiPath supplies the /api/v1 the wrapper's path omits.
  //
  // Staleness is handled with a cancelled flag rather than an AbortSignal
  // because the shared ApiClient interface carries no signal, which is what
  // every other wrapper consumer here does (dashboard-yogini-dasha-panel.tsx).
  // The distinction only matters to the socket, not to the state: a superseded
  // response is ignored either way.
  const load = useCallback(
    (options?: { cancelled?: () => boolean; keepOnError?: boolean }) =>
      getOneMinuteReading(chartId)
        .then((res) => {
          if (options?.cancelled?.()) return;
          if (res.data) {
            setData(res.data);
            setStatus("ready");
          } else if (!options?.keepOnError) {
            setData(null);
            setStatus("absent");
          }
        })
        .catch(() => {
          // A flag-off deployment answers 404 for every chart id. Absent, not
          // broken. `keepOnError` is the re-fetch after answering the pending
          // question: a transient failure there must not blank a reading that
          // is still on screen and still correct.
          if (options?.cancelled?.() || options?.keepOnError) return;
          setData(null);
          setStatus("absent");
        }),
    [chartId],
  );

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setStatus("loading");
    void load({ cancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Reserve the height only once the wait is long enough to be perceptible.
  // Under that, showing and hiding a placeholder is itself the layout shift.
  useEffect(() => {
    if (status !== "loading") {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [status]);

  const answerQuestion = useCallback(
    async (value: string) => {
      if (!data?.pendingQuestion) return;
      setAnswering(true);
      try {
        await apiFetchJson(`/api/v1/birth-profiles/${data.birthProfileId}`, {
          method: "PATCH",
          body: JSON.stringify({ [data.pendingQuestion.field]: value }),
        });
        await load({ keepOnError: true });
      } catch {
        // Leave the question in place; the reading below it is still correct.
      } finally {
        setAnswering(false);
      }
    },
    [data, load],
  );

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
  // Three cases, because a half-formed date sentence is worse than no sentence.
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

  const given = data.displayName.split(" ")[0] || data.displayName;
  const title =
    data.addressedTo === "parent"
      ? lang === "ta"
        ? `${given} — ஒரு நிமிடத்தில்`
        : `${given}, in one minute`
      : lang === "ta"
        ? "உங்கள் ஜாதகம் — ஒரு நிமிடத்தில்"
        : "Your chart in one minute";
  const titleId = `om-title-${chartId}`;

  const hasBasis = data.beats.some((beat) => beat.basis);

  const question = data.pendingQuestion;
  // Placed in the gap left by the beat that was withheld for want of this
  // answer. The anchor comes from the backend, which owns the beat order.
  //
  // This used to anchor on a hardcoded `your_age_question` and fall back to
  // index 0. Once the backend started actually withholding that beat the
  // fallback became the live path, and the question moved to the very top —
  // asking a reader their marital status before they had read a word of their
  // own reading. So the fallback is now the END of the piece: still never
  // dropped, and never in front of the writing.
  const askIndex = question
    ? (() => {
        const found = data.beats.findIndex((beat) => beat.id === question.beforeBeat);
        return found >= 0 ? found : data.beats.length;
      })()
    : -1;
  const askBlock = question ? (
    <div className="om__ask">
      <p className="om__ask-prompt">
        {lang === "ta" ? question.prompt.ta : question.prompt.en}
      </p>
      <div className="om__ask-options">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="om__ask-btn"
            disabled={answering}
            onClick={() => void answerQuestion(option.value)}
          >
            {lang === "ta" ? option.label.ta : option.label.en}
          </button>
        ))}
      </div>
    </div>
  ) : null;

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
          {data.beats.map((beat, index) => (
            <Fragment key={beat.id}>
              {index === askIndex && askBlock}
              <BeatBlock beat={beat} lang={lang} showBasis={showBasis} />
            </Fragment>
          ))}
          {/* The fallback above: anchor beat absent, so the question closes the
              piece rather than opening it. */}
          {askIndex >= data.beats.length && askBlock}
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
