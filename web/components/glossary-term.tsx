"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";
import type { Lang } from "@/lib/i18n";

// Click/tap-to-reveal definition, not hover-only, so it works on touch. Closes
// on an outside click. See H8 (#89) — Deep Dive terms like "gochar"/"dasha"
// had no in-place explanation.
//
// THE TOOLTIP IS PORTALLED TO <body> AND POSITIONED IN VIEWPORT COORDINATES.
// It used to be an absolutely-positioned child, which confined it to the
// nearest clipping ancestor and made this component unusable in exactly the
// places the vocabulary is densest: the Today ribbon's legend cells clip twice
// (`overflow: hidden` for the ellipsis and again for the grid's rounded
// corners) and the calendar day drawer scrolls. A gloss that renders sliced in
// half is worse than no gloss, so those surfaces simply went unglossed and the
// terms stayed unexplained. Portalling removes the constraint outright rather
// than asking every future call site to audit its ancestors' overflow.
//
// It also flips below the term when there isn't room above, so a term in the
// first row of a panel still gets a readable definition.

const MARGIN = 8;
const WIDTH = 260;
// Above the modal layer, not merely above the page. Portalling to <body> takes
// the tooltip out of every local stacking context, which is the point — but it
// also means the only thing keeping it in front is this number. The dashboard's
// drawers sit at 200, the rectification overlay at 500, and the share-card and
// learn-article modals at 9999; a term glossed inside one of those would paint
// its definition behind the modal. One value above the highest of them.
const Z_INDEX = 10000;

type Placement = { top: number; left: number; below: boolean };

export function GlossaryTerm({
  term,
  lang,
  children,
}: {
  term: GlossaryKey;
  lang: Lang;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  // Portalling separated the panel from its trigger in the DOM, which removed
  // the only thing that associated them for a screen reader: reading order.
  // `aria-describedby` restores it explicitly — the definition is announced as
  // the description of the term, wherever in the document the panel lives.
  const tipId = useId();

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const tipHeight = tipRef.current?.offsetHeight ?? 0;
    // Flip below only when the tooltip genuinely doesn't fit above. On the
    // first paint `tipHeight` is 0, which correctly reads as "it fits" — the
    // layout effect below measures and corrects before the browser paints.
    const below = a.top - tipHeight - MARGIN < 0;
    const top = below ? a.bottom + MARGIN : a.top - tipHeight - MARGIN;
    // Keep the panel inside the viewport horizontally; a term near the right
    // edge would otherwise push a 260px panel off-screen.
    const left = Math.min(Math.max(MARGIN, a.left), Math.max(MARGIN, window.innerWidth - WIDTH - MARGIN));
    setPlacement({ top, left, below });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent) => {
      const inAnchor = anchorRef.current?.contains(e.target as Node);
      const inTip = tipRef.current?.contains(e.target as Node);
      if (!inAnchor && !inTip) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // The panel is viewport-positioned, so it does not travel with the page:
    // recompute on scroll/resize rather than letting it drift off its term.
    // `capture` so a scrolling ancestor (the day drawer) is heard too.
    document.addEventListener("click", onDocPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("click", onDocPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  const def = GLOSSARY[term];
  if (!def) return <>{children}</>;

  const tip = open && (
    <span
      ref={tipRef}
      id={tipId}
      role="tooltip"
      style={{
        position: "fixed",
        top: placement?.top ?? -9999,
        left: placement?.left ?? -9999,
        // Hidden until measured, so the flip-below correction never flashes.
        visibility: placement ? "visible" : "hidden",
        zIndex: Z_INDEX,
        width: "max-content",
        minWidth: "200px",
        maxWidth: `${WIDTH}px`,
        padding: "var(--space-2) var(--space-2_5)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border-strong)",
        background: "var(--color-surface)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
        fontSize: "0.75rem",
        fontWeight: 400,
        lineHeight: 1.5,
        color: "var(--color-text)",
      }}
    >
      {lang === "ta" ? def.ta : def.en}
      <Link
        href="/dashboard/glossary"
        style={{
          display: "block",
          marginTop: "var(--space-1_5)",
          color: "var(--color-accent-secondary)",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {lang === "ta" ? "எல்லா சொற்களும்" : "See all terms"}
      </Link>
    </span>
  );

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={anchorRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        style={{
          textDecoration: "underline dotted",
          textUnderlineOffset: "3px",
          textDecorationColor: "var(--color-faint)",
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          font: "inherit",
          fontWeight: "inherit",
          color: "inherit",
          cursor: "help",
        }}
      >
        {children}
      </button>
      {/* `document` is absent during SSR and on the first render pass under
          jsdom-less environments; the tooltip only ever exists after a click,
          which is necessarily client-side. */}
      {tip && typeof document !== "undefined" ? createPortal(tip, document.body) : null}
    </span>
  );
}
