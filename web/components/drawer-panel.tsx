"use client";

import React, { useEffect, useRef } from "react";

interface DrawerPanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function DrawerPanel({ title, onClose, children }: DrawerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer__backdrop" onClick={onClose} />
      <div
        className="drawer__panel"
        ref={panelRef}
        tabIndex={-1}
        style={{ outline: "none" }}
      >
        <div className="drawer__header">
          <h2 className="drawer__title">{title}</h2>
          <button
            type="button"
            className="drawer__close"
            aria-label="Close panel"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </div>
  );
}
