"use client";

import React, { useState } from "react";

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

  return (
    <div>
      <button
        type="button"
        className="collapsible__trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        <span className={`collapsible__arrow${open ? " collapsible__arrow--open" : ""}`} aria-hidden="true">
          <Chevron open={open} />
        </span>
      </button>
      {open && (
        <div className="collapsible__body">
          {children}
        </div>
      )}
    </div>
  );
}
