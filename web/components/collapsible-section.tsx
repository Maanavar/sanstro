"use client";

import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
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
          ▼
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
