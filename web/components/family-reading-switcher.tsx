"use client";

import { useEffect, useId, useRef, useState } from "react";

import { careReasonLabel, type CareReason } from "@/lib/family-flags";
import { scoreColor } from "@/lib/format";
import type { Lang } from "@/lib/i18n";

/**
 * The Family page's "Reading for" bar: who the reading sections are about,
 * and where in them the reader is.
 *
 * Sections 3-9 of the Family page all read ONE member's chart, but the only
 * control that chose the member sat above all of them. Comparing two people's
 * dashas meant scrolling past six sections to the member cards, then scrolling
 * back down, where the switch had jumped the reader to the overview anyway.
 * This bar is the first child of the reading region and sticks below the
 * dashboard top bar for exactly as long as that region is on screen, so it
 * leaves on its own before the family-level Connections section, which reads
 * no single chart.
 *
 * Switching here keeps the reader on the same section (the parent restores
 * the scroll anchor). Picking a member card in section 2 still opens that
 * member's overview: that is "start reading this person", not "same section,
 * someone else".
 */

export type SwitcherMember = {
  id: string;
  name: string;
  isSelf: boolean;
  score: number;
  careReason: CareReason | null;
};

export type SwitcherSection = { id: string; label: string };

/** Gap between the dashboard top bar and the stuck switcher. */
export const SWITCHER_STICK_GAP = 8;

/** Bottom edge of the dashboard's own sticky chrome (`.cd-topbar`), read live:
 *  it is taller below 1024px, where it also carries the tab strip. */
export function readStickyChromeHeight(): number {
  if (typeof document === "undefined") return 0;
  const el = document.querySelector<HTMLElement>(".cd-topbar");
  return el ? Math.round(el.getBoundingClientRect().height) : 0;
}

function useStickyChromeHeight(): number {
  const [height, setHeight] = useState(54);
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".cd-topbar");
    if (!el) {
      setHeight(0);
      return;
    }
    const read = () => setHeight(Math.round(el.getBoundingClientRect().height));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return height;
}

/** The reading line: the y below which a section counts as "being read". Shared
 *  by the scrollspy here and the parent's anchor restore, so both agree on which
 *  section the reader is in. */
export function readingLineFor(bar: HTMLElement | null): number {
  return readStickyChromeHeight() + SWITCHER_STICK_GAP + (bar?.offsetHeight ?? 0) + 24;
}

/** The last listed section whose top has crossed the reading line. */
export function sectionAtLine(sectionIds: string[], line: number): HTMLElement | null {
  let current: HTMLElement | null = null;
  for (const id of sectionIds) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (current === null || el.getBoundingClientRect().top <= line) current = el;
    else break;
  }
  return current;
}

/** First grapheme, not first code unit: a Tamil name's first letter is often a
 *  consonant plus a vowel sign (கீ, தா), and `charAt(0)` splits it. */
function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  for (const { segment } of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(trimmed)) {
    return segment.toLocaleUpperCase();
  }
  return trimmed.charAt(0).toUpperCase();
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function FamilyReadingSwitcher({
  lang,
  members,
  activeId,
  onSwitch,
  sections,
  onJump,
  barRef,
}: {
  lang: Lang;
  members: SwitcherMember[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  sections: SwitcherSection[];
  onJump: (id: string) => void;
  barRef: React.RefObject<HTMLDivElement | null>;
}) {
  const chromeHeight = useStickyChromeHeight();
  const [stuck, setStuck] = useState(false);
  // Below 1024px the dashboard top bar alone is ~200px on a phone; pinning
  // this bar under it too would hold a third of the screen. So there it slides
  // away while the reader scrolls down and comes back on any scroll up.
  const [tucked, setTucked] = useState(false);
  const [moreRight, setMoreRight] = useState(false);
  /** Scrolls the bar itself causes (a jump, a switch's anchor restore) must
   *  not tuck it away from under the finger that just used it. */
  const holdUntilRef = useRef(0);
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? "");
  const chipsRef = useRef<HTMLDivElement | null>(null);
  const labelId = useId();
  const ta = lang === "ta";

  const sectionKey = sections.map((s) => s.id).join("|");

  // Scrollspy + stuck state, one rAF-throttled scroll listener. Seven sections
  // at most, so a per-frame getBoundingClientRect walk is cheaper than keeping
  // an IntersectionObserver's rootMargin in step with a top bar whose height
  // changes at a breakpoint.
  useEffect(() => {
    const ids = sectionKey ? sectionKey.split("|") : [];
    let frame = 0;
    let lastY = window.scrollY;
    // Only the reader's own scrolling tucks the bar. The page also moves when
    // per-chart panels land and the browser's scroll anchoring compensates —
    // measured on a phone: that alone re-tucked the bar a beat after the
    // reader had scrolled up to bring it back.
    let lastInputAt = 0;
    const onInput = () => {
      lastInputAt = Date.now();
    };
    // Guarded: jsdom (every component test that renders the Family page) has
    // no matchMedia; there the bar simply never tucks.
    const compact = typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 1023px)")
      : { matches: false };
    const measure = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      const region = bar.parentElement;
      const stickLine = readStickyChromeHeight() + SWITCHER_STICK_GAP;
      const isStuck = region ? region.getBoundingClientRect().top < stickLine - 1 : false;
      setStuck(isStuck);
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (!compact.matches || !isStuck || bar.contains(document.activeElement)) setTucked(false);
      else if (Date.now() < holdUntilRef.current) setTucked(false);
      else if (dy > 6 && Date.now() - lastInputAt < 400) setTucked(true);
      else if (dy < -6) setTucked(false);
      const current = sectionAtLine(ids, readingLineFor(bar));
      if (current) setActiveSection(current.id);
      const strip = chipsRef.current;
      setMoreRight(!!strip && strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const inputs = ["wheel", "touchmove", "keydown"] as const;
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    for (const type of inputs) window.addEventListener(type, onInput, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      for (const type of inputs) window.removeEventListener(type, onInput);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [sectionKey, barRef]);

  // Keep the active chip in view inside the strip. Done on the strip's own
  // scrollLeft: `scrollIntoView` would also scroll the page.
  // Also on resize: the strip narrows at the phone breakpoint.
  useEffect(() => {
    const reveal = () => {
      const strip = chipsRef.current;
      const chip = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!strip || !chip) return;
      const left = chip.offsetLeft - strip.offsetLeft;
      if (left < strip.scrollLeft) strip.scrollLeft = left - 8;
      else if (left + chip.offsetWidth > strip.scrollLeft + strip.clientWidth) {
        strip.scrollLeft = left + chip.offsetWidth - strip.clientWidth + 8;
      }
      setMoreRight(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1);
    };
    reveal();
    window.addEventListener("resize", reveal);
    return () => window.removeEventListener("resize", reveal);
  }, [activeId]);

  const holdFor = (ms: number) => {
    holdUntilRef.current = Date.now() + ms;
  };

  // `[` / `]` step through members. Only while the bar is actually on screen:
  // the Family pane stays mounted (display: none) behind other tabs, and a
  // shortcut must not switch a reading nobody can see.
  const activeIndex = members.findIndex((m) => m.id === activeId);
  useEffect(() => {
    if (members.length < 2) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "[" && event.key !== "]") return;
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const from = activeIndex < 0 ? 0 : activeIndex;
      const step = event.key === "]" ? 1 : -1;
      const next = members[(from + step + members.length) % members.length];
      if (!next) return;
      event.preventDefault();
      holdUntilRef.current = Date.now() + 2500;
      onSwitch(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [members, activeIndex, onSwitch, barRef]);

  const activeName = members.find((m) => m.id === activeId)?.name ?? members[0]?.name ?? "";
  const label = ta ? "படிக்கிறது" : "Reading for";

  return (
    <div
      ref={barRef}
      className="hy-switcher"
      data-stuck={stuck ? "true" : "false"}
      data-tucked={tucked ? "true" : "false"}
      style={{ top: `${chromeHeight + SWITCHER_STICK_GAP}px` }}
      // Tabbing into a tucked bar brings it back.
      onFocus={() => setTucked(false)}
    >
      <span id={labelId} className="hy-switcher__label">{label}</span>

      {members.length > 1 ? (
        <div
          ref={chipsRef}
          className="hy-switcher__chips"
          data-more-right={moreRight ? "true" : "false"}
          onScroll={(event) => {
            const strip = event.currentTarget;
            setMoreRight(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1);
          }}
          role="group"
          aria-labelledby={labelId}
          aria-keyshortcuts="[ ]"
        >
          {members.map((m) => {
            const active = m.id === activeId;
            const care = m.careReason ? careReasonLabel(m.careReason, lang) : null;
            const you = m.isSelf ? (ta ? "நீங்கள்" : "you") : null;
            // Spelled out: a name computed from the spans reads "Name , reason"
            // (each span is its own segment), and the dot is colour alone.
            const spoken = [m.name, you, care].filter(Boolean).join(", ");
            return (
              <button
                key={m.id}
                type="button"
                className="hy-switcher__chip"
                aria-pressed={active}
                aria-label={spoken}
                title={care ? `${m.name} · ${care}` : m.name}
                onClick={() => {
                  if (active) return;
                  holdFor(2500);
                  onSwitch(m.id);
                }}
              >
                <span className="hy-switcher__avatar" aria-hidden="true" style={{ background: scoreColor(m.score) }}>
                  {initialOf(m.name)}
                </span>
                <span className="hy-switcher__name">{m.name}</span>
                {you && <span className="hy-switcher__you">{you}</span>}
                {m.careReason && <span className="hy-switcher__care" data-reason={m.careReason} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="hy-switcher__single">{activeName}</span>
      )}

      {sections.length > 1 && (
        <label className="hy-switcher__jump">
          <span className="cd-visually-hidden">{ta ? "பகுதிக்குச் செல்" : "Jump to section"}</span>
          <select
            value={activeSection}
            onChange={(event) => {
              setActiveSection(event.target.value);
              // A smooth scroll across the whole page can outlast 2.5s.
              holdFor(3500);
              onJump(event.target.value);
            }}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
      )}

      {/* The reading below changes in place, with no navigation for a screen
          reader to notice. Say whose chart it now is. */}
      <span className="cd-visually-hidden" aria-live="polite">
        {members.length > 1 ? (ta ? `${activeName} ஜாதகம்` : `Now reading ${activeName}'s chart`) : ""}
      </span>
    </div>
  );
}
