"use client";

import { ArrowRight } from "lucide-react";
import type { ReactNode, Ref } from "react";

import type { Lang } from "@/lib/i18n";
import type { OneMinuteBeat, OneMinuteReadingData } from "@vinaadi/shared/api/oneMinuteReading";

/**
 * The `.om` reading surface, once.
 *
 * Three surfaces render it now — the two-minute reading, the four-minute one,
 * and the length switch on Family & Charts (DXA-37) — and until this file they
 * rendered it by copy. That was defensible while there were two: the
 * five-minute component's own header called itself "deliberately a thin sibling
 * … it reuses that component's `.om` prose styling verbatim", because the long
 * reading IS the short one's beats extended, not a different kind of object. A
 * third copy is not defensible, and the switch needs both lengths inside ONE
 * section anyway: the harness counts `section.om` and Family must show exactly
 * one.
 *
 * What stays OUT of here is everything the two readings genuinely differ on —
 * the two-minute reading's lazy mount, its read-and-collapse recap, and its
 * pending-question machinery. Those live in their own component, and the beats
 * area is a `children` slot precisely so the question can be interleaved
 * between beats without this file knowing the question exists.
 *
 * The rendering rules this markup encodes are the product, not styling
 * preference; they are written out in `dashboard-one-minute-reading.tsx` and in
 * docs/ONE_MINUTE_READING_2026-08-04.md §2. Read them before changing a tag.
 */

/** The falsifiable opening — set as a lead, never as the first of seven blocks. */
export const LEAD_BEAT = "who_you_are";
/** The action to take; lands on its own tinted surface so the piece has an end. */
export const CLOSING_BEAT = "one_thing";
/** The terms the reading is offered under — set quietly, second. */
export const TERMS_BEAT = "what_this_rests_on";

export function monthYear(value: string, lang: Lang): string {
  const [year, month] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month) return "";
  return new Date(year, month - 1, 1).toLocaleDateString(
    lang === "ta" ? "ta-IN" : "en-IN",
    { month: "long", year: "numeric" },
  );
}

/**
 * "As of August — written for the period you are in now, and it holds until
 * March." Three cases, because a half-formed date sentence is worse than none.
 */
export function readingMeta(asOf: string, holdsUntil: string, lang: Lang): string {
  const asOfLabel = monthYear(asOf, lang);
  const holdsLabel = monthYear(holdsUntil, lang);
  if (asOfLabel && holdsLabel) {
    return lang === "ta"
      ? `${asOfLabel} நிலவரப்படி — நீங்கள் இருக்கும் நடப்புக் காலத்திற்காக எழுதப்பட்டது; ${holdsLabel} வரை இது மாறாது.`
      : `As of ${asOfLabel} — written for the period you are in now, and it holds until ${holdsLabel}.`;
  }
  if (asOfLabel) {
    return lang === "ta" ? `${asOfLabel} நிலவரப்படி.` : `As of ${asOfLabel}.`;
  }
  return "";
}

/**
 * The advertised lengths, and the ONE place they are written down.
 *
 * `advertised minutes = round(median EN words / 118)`. The number is measured,
 * never chosen: 118 words per advertised minute is this product's own
 * established rate, set when a 236-word median reading shipped as "two
 * minutes", and the long reading measured 487 median EN words across a
 * 120-chart sweep — 4.1 of those minutes, hence four. Re-measure whenever
 * beats are added; the name follows the measurement, never the reverse.
 *
 * DXA-37 put a switch beside the title, so the titles and the switch labels now
 * have to agree. They read the same constant rather than being typed twice:
 * a renamed reading whose own control still advertises the old number is worse
 * than either number alone.
 *
 * Displayed copy only. Module names, routes (`/charts/{id}/five-minute`),
 * feature flags and spec filenames are untouched by a rename — a route rename
 * breaks three packages to change a word the reader never sees.
 */
export const READING_MINUTES = { short: 2, long: 4 } as const;

/**
 * The short reading's title.
 *
 * The question is whether the READER is the subject, which is not the same as
 * which register the copy is in — "client_with_guardian" is a teenager reading
 * their own chart, so it is their chart. This used to test for "parent", so the
 * moment the backend grew a third register an adult family member's card was
 * headed "Your chart in one minute" over somebody else's reading.
 */
export function twoMinuteTitle(lang: Lang, displayName: string, addressedTo: string): string {
  const readerIsSubject = addressedTo === "self" || addressedTo === "client_with_guardian";
  const given = displayName.split(" ")[0] || displayName;
  if (readerIsSubject) {
    return lang === "ta" ? "உங்கள் ஜாதகம் — இரண்டு நிமிடங்களில்" : "Your chart in two minutes";
  }
  return lang === "ta"
    ? `${given} — இரண்டு நிமிடங்களில்`
    : `${given}, in two minutes`;
}

/** The long reading's title. Titled FOUR minutes, not five, since 2026-08-12. */
export function fourMinuteTitle(lang: Lang): string {
  return lang === "ta" ? "உங்கள் ஜாதகம் — நான்கு நிமிடங்களில்" : "Your chart in four minutes";
}

export function BeatBlock({
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

/**
 * The one disclosure. Jargon appears in exactly one place, and whether the
 * reader wants the astrological layer is asked once, in the header, out of the
 * prose column — not per beat, which put the same five underlined words under
 * seven consecutive paragraphs.
 */
export function BasisToggle({
  lang,
  open,
  onToggle,
}: {
  lang: Lang;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="om__basis-toggle"
      onClick={onToggle}
      aria-expanded={open}
    >
      {open
        ? lang === "ta"
          ? "அடிப்படையை மறை"
          : "Hide the astrology"
        : lang === "ta"
          ? "அடிப்படையைக் காட்டு"
          : "Show the astrology"}
    </button>
  );
}

/**
 * The one question the reading is allowed to ask.
 *
 * Placed in the gap left by the beat the backend withheld for want of this
 * answer, and the anchor comes from the backend, which owns the beat order.
 * It used to anchor on a hardcoded `your_age_question` and fall back to index
 * 0; once the backend actually started withholding that beat the fallback
 * became the live path, and the question moved to the very top — asking a
 * reader their marital status before they had read a word of their own
 * reading. The fallback is now the END of the piece: still never dropped, and
 * never in front of the writing.
 */
export function ReadingPendingQuestion({
  question,
  lang,
  answering,
  onAnswer,
}: {
  question: NonNullable<OneMinuteReadingData["pendingQuestion"]>;
  lang: Lang;
  answering: boolean;
  onAnswer: (value: string) => void;
}) {
  return (
    <div className="om__ask">
      <p className="om__ask-prompt">{lang === "ta" ? question.prompt.ta : question.prompt.en}</p>
      <div className="om__ask-options">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="om__ask-btn"
            disabled={answering}
            onClick={() => onAnswer(option.value)}
          >
            {lang === "ta" ? option.label.ta : option.label.en}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Where the question goes: the withheld beat's slot, or the end. */
export function pendingQuestionIndex(data: OneMinuteReadingData): number {
  const question = data.pendingQuestion;
  if (!question) return -1;
  const found = data.beats.findIndex((beat) => beat.id === question.beforeBeat);
  return found >= 0 ? found : data.beats.length;
}

/** Held back 200ms by every caller, so a fast 404 never flashes a placeholder. */
export function ReadingSkeleton() {
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

export type ReadingShellProps = {
  titleId: string;
  title: string;
  /** "As of …" — see `readingMeta`. Empty string renders nothing. */
  meta?: string;
  /** A line ABOVE the title, for news about the reading itself (a rewrite). */
  note?: string;
  /** Header controls, left of the basis toggle. DXA-37's length switch. */
  headerExtra?: ReactNode;
  basisToggle?: ReactNode;
  /** The beats, and anything interleaved between them. */
  children: ReactNode;
  nextLabel?: string;
  onOpenFullChart?: () => void;
  sectionRef?: Ref<HTMLElement>;
};

export function ReadingShell({
  titleId,
  title,
  meta,
  note,
  headerExtra,
  basisToggle,
  children,
  nextLabel,
  onOpenFullChart,
  sectionRef,
}: ReadingShellProps) {
  return (
    <section className="om" aria-labelledby={titleId} ref={sectionRef}>
      <div className="om__col">
        <header className="om__head">
          <div className="om__head-text">
            {note && <p className="om__rewritten">{note}</p>}
            <h2 id={titleId} className="om__title">
              {title}
            </h2>
            {meta && <p className="om__meta">{meta}</p>}
          </div>

          {(headerExtra || basisToggle) && (
            <div className="om__head-actions">
              {headerExtra}
              {basisToggle}
            </div>
          )}
        </header>

        <div className="om__beats">{children}</div>

        {onOpenFullChart && nextLabel && (
          // DXA-09 / DXA-37 step 9: a Lucide arrow, not a "→" glyph set in the
          // body font. The glyph is the only icon on this surface and it was
          // the only text character doing an icon's job.
          <button type="button" className="om__next" onClick={onOpenFullChart}>
            {nextLabel}
            <ArrowRight size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
