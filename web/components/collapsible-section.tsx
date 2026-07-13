"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

interface CollapsibleSectionProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" style={{ width: "14px", height: "14px", transform: open ? "rotate(180deg)" : "none", transition: "transform 140ms ease" }}>
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const anchorTop = useRef<number | null>(null);

  // Expanding/collapsing changes document height below the trigger, and the
  // browser's native scroll anchoring sometimes picks the wrong anchor when a
  // large block of content unmounts (observed: closing a section could throw
  // the viewport up to an unrelated part of the page, with no JS scroll call
  // involved). Pin the trigger's own viewport position across the toggle
  // instead of trusting native anchoring.
  useLayoutEffect(() => {
    if (anchorTop.current === null || !triggerRef.current) return;
    const drift = triggerRef.current.getBoundingClientRect().top - anchorTop.current;
    if (drift !== 0) window.scrollBy(0, drift);
    anchorTop.current = null;
  }, [open]);

  function toggle() {
    anchorTop.current = triggerRef.current?.getBoundingClientRect().top ?? null;
    setOpen((v) => !v);
  }

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        className="collapsible__trigger"
        aria-expanded={open}
        onClick={toggle}
        style={{ overflowAnchor: "none" }}
      >
        <span>{title}</span>
        <span className={`collapsible__arrow${open ? " collapsible__arrow--open" : ""}`} aria-hidden="true">
          <Chevron open={open} />
        </span>
      </button>
      {open && (
        <div className="collapsible__body" style={{ overflowAnchor: "none" }}>
          {children}
        </div>
      )}
    </div>
  );
}
