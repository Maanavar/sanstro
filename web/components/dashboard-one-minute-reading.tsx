"use client";

import { ArrowRight } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { Lang } from "@/lib/i18n";
import {
  useAnswerPendingQuestion,
  useOneMinuteReading,
  type OneMinuteReadingState,
} from "@/hooks/useChartReading";
import type { OneMinuteReadingData } from "@vinaadi/shared/api/oneMinuteReading";
import {
  BasisToggle,
  BeatBlock,
  CLOSING_BEAT,
  LEAD_BEAT,
  ReadingPendingQuestion,
  ReadingShell,
  ReadingSkeleton,
  pendingQuestionIndex,
  readingMeta,
  twoMinuteTitle,
} from "./dashboard-reading-shell";

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

/**
 * The beat ids with typographic meaning — the lead, the close, and the terms
 * the reading is offered under — live in `dashboard-reading-shell.tsx`, which
 * is what renders them. `TERMS_BEAT` is set QUIETLY and deliberately so: it
 * arrives second, immediately after the lead, and given the same weight as the
 * body it reads as the reading's own second sentence, cold water two sentences
 * in. It is not part of the reading; it is the terms the reading is offered
 * under, and the type has to say so before the words do.
 */

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
  /**
   * Pre-fetched by a parent holding both reading lengths (DXA-37).
   *
   * Passing the state in, rather than letting this component fetch, is what
   * makes the length switch free: crossfading unmounts this view, and a
   * component that owned its own request would re-issue it on every toggle.
   */
  reading?: OneMinuteReadingState;
  /** Header controls, left of the basis toggle — the length switch. */
  headerExtra?: ReactNode;
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

export function DashboardOneMinuteReading({
  lang,
  chartId,
  deferUntilVisible = false,
  onOpenFullChart,
  collapseWhenRead = false,
  reading,
  headerExtra,
}: DashboardOneMinuteReadingProps) {
  const [showBasis, setShowBasis] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!deferUntilVisible);
  // Fetching lives in the hook (DXA-37) so the length switch on Family can hold
  // both readings at once; everything below is what is true of THIS surface.
  // The hook is always called, never conditionally — `enabled` is what stands
  // it down when a parent has already fetched.
  const own = useOneMinuteReading(chartId, { enabled: shouldLoad && !reading });
  const { data, status, showSkeleton, reload } = reading ?? own;
  const { answering, answer } = useAnswerPendingQuestion(reload);
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
    (value: string) => {
      const question = data?.pendingQuestion;
      if (!question) return;
      void answer(data.birthProfileId, question.field, value);
    },
    [data, answer],
  );

  if (!shouldLoad) return <div ref={lazyRef} aria-hidden="true" style={{ height: 1 }} />;

  if (status === "absent") return null;

  if (status === "loading" || !data) return showSkeleton ? <ReadingSkeleton /> : null;

  const meta = readingMeta(data.asOf, data.readingWindow?.to ?? "", lang);
  const title = twoMinuteTitle(lang, data.displayName, data.addressedTo);
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
            {lang === "ta" ? "மீண்டும் படிக்க" : "Read it again"}
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
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
  const askIndex = pendingQuestionIndex(data);
  const askBlock = question ? (
    <ReadingPendingQuestion
      question={question}
      lang={lang}
      answering={answering}
      onAnswer={answerQuestion}
    />
  ) : null;

  return (
    <ReadingShell
      titleId={titleId}
      title={title}
      meta={meta}
      note={rewrittenNote}
      headerExtra={headerExtra}
      basisToggle={
        hasBasis ? (
          <BasisToggle lang={lang} open={showBasis} onToggle={() => setShowBasis((open) => !open)} />
        ) : null
      }
      nextLabel={lang === "ta" ? data.nextStep.label.ta : data.nextStep.label.en}
      onOpenFullChart={onOpenFullChart}
      sectionRef={sectionRef}
    >
      {data.beats.map((beat, index) => (
        <Fragment key={beat.id}>
          {index === askIndex && askBlock}
          <BeatBlock beat={beat} lang={lang} showBasis={showBasis} />
        </Fragment>
      ))}
      {/* Anchor beat absent, so the question closes the piece rather than
          opening it — never dropped, never in front of the writing. */}
      {askIndex >= data.beats.length && askBlock}
    </ReadingShell>
  );
}
