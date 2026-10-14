"use client";

// The Story view (FTR-09): five chapters organised by the questions a reader
// actually has, instead of ten tabs organised by mechanism. One chapter at a
// time, a rail to jump, and a "Next" path so the reading has an end.

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, CalendarClock, Gift, Orbit, Timer, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Lang } from "@/lib/i18n";

import { Segmented } from "../ui/segmented";
import { CHAPTER_ORDER, CHAPTER_TITLES, nextChapter, type ChapterId } from "./reading-selectors";
import { ChapterWho } from "./story-who";
import { ChapterPlanets } from "./story-planets";
import { ChapterNow } from "./story-now";
import { ChapterGifts } from "./story-gifts";
import { ChapterComing } from "./story-coming";
import type { StoryProps } from "./story-parts";
import "./chart-reading.css";

const CHAPTER_ICON: Record<ChapterId, LucideIcon> = {
  who: UserRound,
  planets: Orbit,
  now: Timer,
  gifts: Gift,
  coming: CalendarClock,
};

const pick = (text: { ta: string; en: string }, lang: Lang) => (lang === "ta" ? text.ta : text.en);

export type { ReadingLinkTarget, StoryProps } from "./story-parts";

export function StoryView(props: StoryProps) {
  const { lang, onShowAstrologer } = props;
  const [chapter, setChapter] = useState<ChapterId>("who");

  // Keep the rail where the reader's eye is when a chapter swaps — the same
  // anchoring the Astrologer tabs use, since chapters differ in height.
  const railRef = useRef<HTMLDivElement | null>(null);
  const anchorTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (anchorTop.current === null || !railRef.current) return;
    const drift = railRef.current.getBoundingClientRect().top - anchorTop.current;
    if (drift !== 0) window.scrollBy(0, drift);
    anchorTop.current = null;
  }, [chapter]);

  function go(next: ChapterId, fromBottom = false) {
    if (fromBottom) {
      setChapter(next);
      // From the end of a chapter, bring the next one's start into view.
      requestAnimationFrame(() => railRef.current?.scrollIntoView({ block: "nearest" }));
      return;
    }
    anchorTop.current = railRef.current ? railRef.current.getBoundingClientRect().top : null;
    setChapter(next);
  }

  const next = nextChapter(chapter);
  const NextIcon = ArrowRight;

  let body: ReactNode = null;
  if (chapter === "who") body = <ChapterWho {...props} />;
  if (chapter === "planets") body = <ChapterPlanets {...props} />;
  if (chapter === "now") body = <ChapterNow {...props} />;
  if (chapter === "gifts") body = <ChapterGifts {...props} />;
  if (chapter === "coming") body = <ChapterComing {...props} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", overflowAnchor: "none" }}>
      <div
        ref={railRef}
        style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--color-surface-soft)", padding: "var(--space-1) 0" }}
      >
        <Segmented<ChapterId>
          ariaLabel={lang === "ta" ? "விளக்கப் பகுதிகள்" : "Reading chapters"}
          value={chapter}
          onChange={(id) => go(id)}
          options={CHAPTER_ORDER.map((id, index) => {
            const Icon = CHAPTER_ICON[id];
            return {
              key: id,
              label: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)", whiteSpace: "nowrap" }}>
                  <Icon size={15} strokeWidth={2} aria-hidden />
                  <span aria-hidden style={{ fontVariantNumeric: "tabular-nums", opacity: 0.7 }}>{index + 1}</span>
                  {pick(CHAPTER_TITLES[id], lang)}
                </span>
              ),
            };
          })}
        />
      </div>

      <div key={chapter} className="cr-rise" role="tabpanel" aria-label={pick(CHAPTER_TITLES[chapter], lang)}>
        {body}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
        {next ? (
          <button type="button" className="ui-btn ui-btn--secondary" onClick={() => go(next, true)} style={{ borderRadius: "var(--radius-pill)" }}>
            {lang === "ta" ? "அடுத்து" : "Next"}: {pick(CHAPTER_TITLES[next], lang)}
            <NextIcon size={15} aria-hidden />
          </button>
        ) : (
          <button type="button" className="ui-btn ui-btn--secondary" onClick={onShowAstrologer} style={{ borderRadius: "var(--radius-pill)" }}>
            {lang === "ta" ? "ஒவ்வொரு விவரத்தையும் ஜோதிடர் பார்வையில் காண்க" : "See every detail in the Astrologer view"}
            <NextIcon size={15} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
