"use client";

import { useEffect, useRef, useState } from "react";

import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";
import type { Lang } from "@/lib/i18n";

// Click/tap-to-reveal definition, not hover-only, so it works on touch. Closes
// on an outside click. See H8 (#89) — Deep Dive terms like "gochar"/"dasha"
// had no in-place explanation.
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
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  const def = GLOSSARY[term];
  if (!def) return <>{children}</>;

  return (
    <span ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
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
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 40,
            bottom: "calc(100% + 6px)",
            left: 0,
            width: "max-content",
            minWidth: "200px",
            maxWidth: "260px",
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
        </span>
      )}
    </span>
  );
}
