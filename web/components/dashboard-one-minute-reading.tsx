"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";

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
 * - **Honest is not the same as useful.** That line resolves the trust problem
 *   and does nothing for the attention one: on the daily home it sat under
 *   ~240 words announcing that they had not changed and would not until March.
 *   A daily surface's contract is that what is on it changed since yesterday,
 *   or is about to. `collapseWhenRead` is that contract applied — whole on the
 *   surface the reading belongs to, and on Today only while it is genuinely
 *   new to this reader.
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

/**
 * The one beat that MOVED, best first. Everything else in the reading is natal
 * and will read the same in ten years — `who_you_are`, `what_this_rests_on`,
 * `strength_and_cost`, the decade beats. `period_now` is the sentence the
 * antardasha boundary actually rewrote, so it is the only line worth spending
 * on a surface the reader opens every morning.
 */
const RECAP_BEATS = ["period_now", "right_now", CLOSING_BEAT, LEAD_BEAT] as const;

/** How long the reading has to sit in view before it counts as read. A render
 *  is not a reading: `deferUntilVisible` arms 360px ahead of the scroll, and a
 *  fast scroll past is not a reading either. */
const READ_DWELL_MS = 1500;

type LoadStatus = "loading" | "ready" | "absent";

export type DashboardOneMinuteReadingProps = {
  lang: Lang;
  chartId: string;
  /** Delay the endpoint call until this reading is close to the viewport. */
  deferUntilVisible?: boolean;
  /** Navigates to the full chart; omit on surfaces that already are it. */
  onOpenFullChart?: () => void;
  /**
   * Collapse to a one-line pointer once this reader has read this reading.
   *
   * For the daily home only. The reading moves at the antardasha boundary —
   * `readingWindow` is literally the current antardasha, months to years wide —
   * and most of its beats never move at all, so Today was spending its third
   * slot on ~240 words that had not changed since the reader last saw them, and
   * whose own subtitle said as much ("it holds until March"). A daily surface's
   * contract is that what is on it changed since yesterday, or is about to.
   *
   * Not passed on Family & Charts: that is the reading's permanent home, where
   * a reader goes *to* read it, and it stays whole there.
   */
  collapseWhenRead?: boolean;
};

/** Per-chart record of which reading this reader has actually read.
 *
 * The stored VALUE is the reading window's start date, never a boolean — that
 * is what makes the dismissal expire by itself. When the antardasha rolls, the
 * backend sends a new `readingWindow.from`, the stored value stops matching,
 * and the reading comes back in full. A boolean would have hidden it for good
 * after one read, and the bhukti turn is the single most consequential thing
 * this reading says all year. */
function readStorageKey(chartId: string): string {
  return `vinaadi-om-read:${chartId}`;
}

function loadReadWindow(chartId: string): string | null {
  try {
    return localStorage.getItem(readStorageKey(chartId));
  } catch {
    // Private mode, storage disabled, no window at all — treat as unread, which
    // fails toward showing the writing rather than hiding it.
    return null;
  }
}

function saveReadWindow(chartId: string, windowFrom: string): void {
  try {
    localStorage.setItem(readStorageKey(chartId), windowFrom);
  } catch {
    /* Nothing to do — the reading simply stays expanded next time. */
  }
}

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

/** Day, month and year from a `YYYY-MM-DD` wire date — built in local time for
 *  the same reason `monthYear` is. */
function fullDate(value: string, lang: Lang): string {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(year, month - 1, day).toLocaleDateString(
    lang === "ta" ? "ta-IN" : "en-IN",
    { day: "numeric", month: "long", year: "numeric" },
  );
}

/** The first sentence, and never a cliff-hanger: text with no terminator comes
 *  back whole rather than cut mid-clause. Finding 14 of the hero review was
 *  exactly this failure one component over. */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return match ? match[0] : trimmed;
}

/** One sentence standing in for the whole reading, taken from the beat that
 *  moved. Falls back through `RECAP_BEATS` and finally to the first beat the
 *  backend sent, so this never renders empty whatever the register. */
function recapLine(data: OneMinuteReadingData, lang: Lang): string {
  const pick = (id: string): string => {
    const beat = data.beats.find((b) => b.id === id);
    if (!beat) return "";
    return (lang === "ta" ? beat.text.ta : beat.text.en).trim();
  };
  for (const id of RECAP_BEATS) {
    const text = pick(id);
    if (text) return firstSentence(text);
  }
  const first = data.beats[0];
  if (!first) return "";
  return firstSentence(lang === "ta" ? first.text.ta : first.text.en);
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
  deferUntilVisible = false,
  onOpenFullChart,
  collapseWhenRead = false,
}: DashboardOneMinuteReadingProps) {
  const [data, setData] = useState<OneMinuteReadingData | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showBasis, setShowBasis] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!deferUntilVisible);
  const lazyRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  /**
   * The window this reader had already read when the page loaded, and it is
   * deliberately NOT updated when this visit marks the reading read — the
   * collapse takes effect on the next visit, never under the reader who is
   * mid-paragraph. Read synchronously so a reading that is going to collapse
   * never flashes open first; there is no hydration risk because nothing but a
   * sentinel renders until the fetch resolves.
   */
  const [readWindow, setReadWindow] = useState<string | null>(() =>
    typeof window === "undefined" ? null : loadReadWindow(chartId),
  );
  const markedRef = useRef(false);

  useEffect(() => {
    setShouldLoad(!deferUntilVisible);
  }, [chartId, deferUntilVisible]);

  useEffect(() => {
    markedRef.current = false;
    setReadWindow(loadReadWindow(chartId));
  }, [chartId]);

  useEffect(() => {
    if (!deferUntilVisible || shouldLoad) return;
    const node = lazyRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "360px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [deferUntilVisible, shouldLoad]);

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
    if (!shouldLoad) return;
    let cancelled = false;
    setData(null);
    setStatus("loading");
    void load({ cancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, [load, shouldLoad]);

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

  const currentWindow = data?.readingWindow?.from ?? "";
  // Already read, and this is a surface that acts on that.
  const showRecap = collapseWhenRead && !!currentWindow && readWindow === currentWindow && !data?.pendingQuestion;
  // Read before, but the backend has since rewritten it for a new antardasha.
  const wasRewritten = collapseWhenRead && !!readWindow && !!currentWindow && readWindow !== currentWindow;

  /**
   * Mark the reading read once it has actually been in the viewport for a
   * moment — a second observer, at the section itself and with no lead margin,
   * because the lazy-load observer above deliberately fires 360px early. The
   * dwell is the difference between "collapsed because you read it" and
   * "collapsed because you scrolled past it".
   *
   * Runs on every surface, not only the collapsing one: reading it on Family &
   * Charts *is* having read it, and the duplicate on Today should stand down
   * accordingly.
   */
  useEffect(() => {
    if (!currentWindow || readWindow === currentWindow || markedRef.current) return;
    const node = sectionRef.current;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const commit = () => {
      if (markedRef.current) return;
      markedRef.current = true;
      saveReadWindow(chartId, currentWindow);
    };
    if (typeof IntersectionObserver === "undefined" || !node) {
      // No observer to lean on: the reading is on screen and the dwell is the
      // only evidence available. Better than never marking it read at all,
      // which would make the collapse unreachable on that browser.
      timer = setTimeout(commit, READ_DWELL_MS);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          timer = setTimeout(() => {
            commit();
            observer.disconnect();
          }, READ_DWELL_MS);
        } else if (timer) {
          clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
  }, [chartId, currentWindow, readWindow]);

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

  if (!shouldLoad) return <div ref={lazyRef} aria-hidden="true" style={{ height: 1 }} />;

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
  // The question is whether the READER is the subject, which is not the same as
  // which register the copy is in — "client_with_guardian" is a teenager
  // reading their own chart, so it is their chart. This used to test for
  // "parent", so the moment the backend grew a third register an adult family
  // member's card was headed "Your chart in one minute" over somebody else's
  // reading — the same mistake as the body copy, one line further out.
  const readerIsSubject =
    data.addressedTo === "self" || data.addressedTo === "client_with_guardian";
  const title =
    readerIsSubject
      ? lang === "ta"
        ? "உங்கள் ஜாதகம் — இரண்டு நிமிடங்களில்"
        : "Your chart in two minutes"
      : lang === "ta"
        ? `${given} — இரண்டு நிமிடங்களில்`
        : `${given}, in two minutes`;
  const titleId = `om-title-${chartId}`;

  /**
   * Read already, and unchanged since: one line and a way back to it.
   *
   * Deliberately still the same single mount, in the same slot, rather than a
   * second copy lower down the page — the reading owns its own fetch, so two
   * mount points would mean two requests and two answers to "has this been
   * read". At one line the position costs nothing, and when the antardasha
   * turns and the reading comes back in full, it comes back *here*, high on the
   * page, which is where the year's most consequential sentence belongs.
   */
  if (showRecap) {
    return (
      <section className="om-recap" aria-labelledby={titleId}>
        <div className="om-recap__text">
          <h2 id={titleId} className="om-recap__title">{title}</h2>
          <p className="om-recap__line">{recapLine(data, lang)}</p>
        </div>
        {onOpenFullChart && (
          <button type="button" className="om-recap__link" onClick={onOpenFullChart}>
            {lang === "ta" ? "மீண்டும் படிக்க →" : "Read it again →"}
          </button>
        )}
      </section>
    );
  }

  /**
   * Back, because it is genuinely different. Without this line a reader who has
   * seen the collapsed row for months has no way to tell a rewrite from a bug,
   * and the antardasha turn — the one thing here worth interrupting them for —
   * would arrive looking like a page that failed to remember them.
   */
  const rewrittenNote = wasRewritten
    ? lang === "ta"
      ? `${fullDate(currentWindow, lang)} அன்று நீங்கள் புதிய தசைக் காலத்தில் நுழைந்தீர்கள் — இந்த வாசிப்பு மீண்டும் எழுதப்பட்டது.`
      : `Rewritten — you entered a new period on ${fullDate(currentWindow, lang)}.`
    : "";

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
    <section className="om" aria-labelledby={titleId} ref={sectionRef}>
      <div className="om__col">
        <header className="om__head">
          <div className="om__head-text">
            {rewrittenNote && <p className="om__rewritten">{rewrittenNote}</p>}
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
