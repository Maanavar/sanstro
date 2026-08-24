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

type Placement = { top: number; left: number; below: boolean; maxHeight: number };
/** Below this a clamped panel is not worth reading, so it scrolls instead. */
const MIN_PANEL_HEIGHT = 120;

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
  const linkRef = useRef<HTMLAnchorElement>(null);
  // Portalling separated the panel from its trigger in the DOM, which removed
  // the only thing that associated them for a screen reader: reading order.
  // `aria-describedby` restores it explicitly — the definition is announced as
  // the description of the term, wherever in the document the panel lives.
  const tipId = useId();

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // `scrollHeight`, NOT `offsetHeight`: this is the height the content WANTS,
    // and it stays the same once `maxHeight` below starts clamping the box. Read
    // from `offsetHeight` the measurement would be of the already-clamped panel,
    // so each pass would re-derive a smaller box from the last one.
    const tipHeight = tipRef.current?.scrollHeight ?? 0;

    const roomAbove = a.top - MARGIN * 2;
    const roomBelow = viewportHeight - a.bottom - MARGIN * 2;

    // Above by preference, below when it does not fit above — and when it fits
    // NEITHER side, the roomier one. That last branch is the one that was
    // missing: the old test read `a.top - tipHeight - MARGIN < 0` and flipped
    // below without ever asking whether it fits below either, so a tall
    // definition on a term near the TOP of a short viewport was placed below
    // and ran straight off the bottom of the screen (measured at 390×844: a
    // panel ending at y=1171 against an 844px viewport).
    let below: boolean;
    if (tipHeight <= roomAbove) below = false;
    else if (tipHeight <= roomBelow) below = true;
    else below = roomBelow > roomAbove;

    // A definition taller than the space on either side scrolls inside the
    // panel rather than being clipped by the viewport — an unreachable tail is
    // the same defect as the clipping the portal was introduced to fix.
    const maxHeight = Math.max(MIN_PANEL_HEIGHT, below ? roomBelow : roomAbove);
    const height = Math.min(tipHeight, maxHeight);

    // Clamp so the panel is inside the viewport on BOTH axes. Horizontal was
    // always clamped; a term near the right edge would otherwise push a 260px
    // panel off-screen.
    const top = Math.min(
      Math.max(MARGIN, below ? a.bottom + MARGIN : a.top - height - MARGIN),
      Math.max(MARGIN, viewportHeight - height - MARGIN),
    );
    const left = Math.min(Math.max(MARGIN, a.left), Math.max(MARGIN, window.innerWidth - WIDTH - MARGIN));
    setPlacement({ top, left, below, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
  }, [open, reposition]);

  // Closing unmounts the panel. If focus is inside it when that happens the
  // browser drops focus to <body> and a keyboard reader loses their place at
  // the far end of the document — so every close path says whether focus
  // should be handed back to the term.
  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) anchorRef.current?.focus();
  }, []);

  const holdsFocus = useCallback(
    () =>
      !!anchorRef.current?.contains(document.activeElement) ||
      !!tipRef.current?.contains(document.activeElement),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent) => {
      const inAnchor = anchorRef.current?.contains(e.target as Node);
      const inTip = tipRef.current?.contains(e.target as Node);
      if (!inAnchor && !inTip) close(holdsFocus());
    };
    const onKey = (e: KeyboardEvent) => {
      // Escape is listened for on the document so it works from anywhere, which
      // means it also fires when this gloss holds no focus at all — restore
      // focus only when it does, or Escape elsewhere on the page would yank the
      // reader to a term they are not looking at.
      if (e.key === "Escape") close(holdsFocus());
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
  }, [open, reposition, close, holdsFocus]);

  const def = GLOSSARY[term];
  if (!def) return <>{children}</>;

  const tip = open && (
    <span
      ref={tipRef}
      id={tipId}
      // NOT `role="tooltip"` any more, and the panel is queried by this data
      // attribute instead (unit tests and web/e2e/glossary-tooltip-mobile.spec.ts
      // both). A tooltip is a description with no focusable content — but this
      // panel is click-toggled from a button carrying `aria-expanded`, and it
      // holds a link. That is a disclosure, and it is now labelled as one:
      // `aria-controls` on the trigger ties the two together, and the trigger's
      // `aria-describedby` still points at the definition text alone, so the
      // announcement a reader gets on the term is unchanged. The role was the
      // one thing telling a screen reader the link inside was not meant to be
      // reached — which was true only while it was unreachable.
      data-glossary-panel="true"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        if (e.shiftKey) {
          // Backwards out of the panel lands on the term it belongs to, not on
          // whatever happens to precede <body>'s last child.
          e.preventDefault();
          anchorRef.current?.focus();
          return;
        }
        // Forwards means "done with this gloss": hand focus back to the term
        // and let the browser's own sequential navigation continue from there,
        // so the next Tab stop is the one after the term on screen. Default is
        // deliberately not prevented — moving focus first is what redirects it.
        close(true);
      }}
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
        // Paired with the clamp in `reposition`: the panel never leaves the
        // viewport, and a definition too tall for the room scrolls in place.
        maxHeight: placement ? `${placement.maxHeight}px` : undefined,
        overflowY: "auto",
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
      {/* `aria-describedby` points HERE, not at the panel, so a screen reader
          announces the definition and stops. Pointed at the panel it read the
          "See all terms" link as the tail of every definition on the dashboard. */}
      <span id={`${tipId}-def`}>{lang === "ta" ? def.ta : def.en}</span>
      <Link
        ref={linkRef}
        // Deep-links to this term's own card rather than the top of a 42-card
        // index — `GlossaryIndex` gives every article `id={key}`.
        href={`/dashboard/glossary#${term}`}
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
        onKeyDown={(e) => {
          // THE PANEL IS PORTALLED TO <body>, so it sits at the END of the
          // document in DOM order — and focus order follows DOM order, not
          // screen position. Tabbing off an opened term therefore went to
          // whatever follows the term on the page, and "See all terms" waited
          // at the far end of the document behind every other control on the
          // dashboard. It was a mouse-only link on a keyboard-operable
          // disclosure, and nothing on screen said so.
          //
          // One key restores the obvious behaviour: while the gloss is open,
          // Tab from the term steps INTO it. Shift+Tab from the panel comes
          // back, Tab again leaves, Escape closes — see the panel's handler.
          if (!open || e.key !== "Tab" || e.shiftKey) return;
          const link = linkRef.current;
          if (!link) return;
          e.preventDefault();
          link.focus();
        }}
        aria-expanded={open}
        aria-controls={open ? tipId : undefined}
        aria-describedby={open ? `${tipId}-def` : undefined}
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
