"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DrawerPanelProps {
  title: string;
  /**
   * Second line under the title. The month drawer packed three calendar systems
   * (Gregorian · Tamil · Hijri) into `title`, which is one 1rem line inside a
   * 480px panel — it clipped. A title is one fact; everything qualifying it
   * belongs here, where it can wrap.
   */
  subtitle?: React.ReactNode;
  /** Controls that belong beside the title — e.g. the day drawer's ‹ › steppers. */
  headerAccessory?: React.ReactNode;
  /**
   * Pinned action bar. A drawer's primary action was previously the last thing
   * in the scroll, so on a long day it was below the fold and read as a
   * footnote. Anything passed here stays visible at the bottom of the panel.
   */
  footer?: React.ReactNode;
  /** Localised label for the close control — this app renders in ta and en. */
  closeLabel?: string;
  /** `lg` widens the sheet for content-dense surfaces (the day drawer). */
  size?: "md" | "lg";
  onClose: () => void;
  children: React.ReactNode;
  /** Visual theme. Defaults to the dark panel; "light" matches parchment surfaces. */
  theme?: "dark" | "light";
}

export function DrawerPanel({
  title,
  subtitle,
  headerAccessory,
  footer,
  closeLabel,
  size = "md",
  onClose,
  children,
  theme = "dark",
}: DrawerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Portal target, resolved after mount so SSR renders nothing rather than
  // touching `document`.
  //
  // `.cd-shell` and not `document.body`: the shell is where every `--color-*`,
  // `--space-*` and `--radius-*` token is declared, so a panel parented to the
  // body would render with no palette at all. Hoisting to the shell is enough
  // to fix the layering — it puts the panel in the same stacking context as
  // `.cd-topbar` instead of inside whichever tab subtree owns it, where a
  // z-index of 200 was being confined and the sticky header painted over the
  // drawer's own header. Body is the fallback for surfaces outside the shell.
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalHost(document.querySelector<HTMLElement>(".cd-shell") ?? document.body);
  }, []);

  // Focus trap and ESC key
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus();
    };
  }, [onClose]);

  // The backdrop is fixed but weightless: a wheel gesture over it scrolled the
  // page underneath, so closing the drawer landed the reader somewhere else in
  // the month. Lock the document while the sheet owns the screen.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const classes = [
    "drawer",
    theme === "light" ? "drawer--light" : "",
    size === "lg" ? "drawer--lg" : "",
  ].filter(Boolean).join(" ");

  const drawer = (
    <div className={classes} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="drawer__backdrop" onClick={onClose} />
      <div
        className="drawer__panel"
        ref={panelRef}
        tabIndex={-1}
        style={{ outline: "none" }}
      >
        <div className="drawer__header">
          <div className="drawer__heading">
            <h2 className="drawer__title" id={titleId}>{title}</h2>
            {subtitle ? <div className="drawer__subtitle">{subtitle}</div> : null}
          </div>
          <div className="drawer__header-actions">
            {headerAccessory}
            <button
              type="button"
              className="drawer__close"
              aria-label={closeLabel ?? "Close panel"}
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
        <div className="drawer__body">{children}</div>
        {footer ? <div className="drawer__footer">{footer}</div> : null}
      </div>
    </div>
  );

  return portalHost ? createPortal(drawer, portalHost) : null;
}
