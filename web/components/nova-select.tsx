"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";

/**
 * Nova-styled dropdown — replaces ad-hoc native `<select>` elements inside the
 * Nova ([data-ui="nova"]) dashboard. A native `<select>`'s *popup* list is
 * UA-rendered OS chrome (`color-scheme: dark` only tints it) and can't pick up
 * Nova's card look — radius, gold accent, cream text — so it read as a jarring
 * plain OS listbox against Nova's custom-styled dark cards. This renders both the
 * closed trigger AND the open options panel with Nova's own `--color-*` tokens.
 *
 * API mirrors the pattern the old selects used: a controlled `value` string plus
 * `onChange(value)`. Pass `placeholder` to reproduce a leading blank `<option>`
 * (shown when `value === ""`).
 */
export type NovaSelectOption = { value: string; label: string; disabled?: boolean; group?: string };

export function NovaSelect({
  value,
  onChange,
  options,
  placeholder,
  style,
  containerStyle,
  ariaLabel,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: NovaSelectOption[];
  placeholder?: string;
  /** Visual overrides for the closed trigger (border/bg/padding/font). */
  style?: CSSProperties;
  /** Layout for the wrapper — the element that participates in the parent's
   *  flex/grid (e.g. `flex`, `width`, `minWidth`). Kept separate from `style`
   *  so sizing lands on the wrapper while visuals stay on the trigger. */
  containerStyle?: CSSProperties;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value) ?? null;
  const triggerLabel = selected ? selected.label : (placeholder ?? "");

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // When opening, start the active highlight on the current selection.
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === value);
      setActiveIndex(idx);
    }
  }, [open, value, options]);

  function commit(index: number) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  }

  function moveActive(delta: number) {
    if (options.length === 0) return;
    let next = activeIndex;
    for (let step = 0; step < options.length; step++) {
      next = (next + delta + options.length) % options.length;
      if (!options[next]?.disabled) break;
    }
    setActiveIndex(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        else moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        else moveActive(-1);
        break;
      case "Home":
        if (open) { event.preventDefault(); setActiveIndex(options.findIndex((o) => !o.disabled)); }
        break;
      case "End":
        if (open) { event.preventDefault(); for (let i = options.length - 1; i >= 0; i--) { if (!options[i]?.disabled) { setActiveIndex(i); break; } } }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) setOpen(true);
        else if (activeIndex >= 0) commit(activeIndex);
        break;
      case "Escape":
        if (open) { event.preventDefault(); setOpen(false); }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const triggerStyle: CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1.5px solid var(--color-border)",
    background: "var(--color-surface-soft, var(--color-surface))",
    color: selected ? "var(--color-text-strong)" : "var(--color-faint)",
    fontSize: "14px",
    fontFamily: "inherit",
    // The trigger is often placed inside a bold `<label>`; without an explicit
    // weight it inherits that label's 700 and makes the selected value look
    // like a heading rather than a field value.
    fontWeight: 400,
    textAlign: "left",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  return (
    <div ref={rootRef} style={{ position: "relative", ...containerStyle }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={triggerStyle}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{triggerLabel}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" style={{ flexShrink: 0, color: "var(--color-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 120ms ease" }}>
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 40,
            margin: 0,
            padding: "4px",
            listStyle: "none",
            maxHeight: "260px",
            overflowY: "auto",
            borderRadius: "10px",
            border: "1px solid var(--color-border-strong)",
            background: "var(--color-surface)",
            boxShadow: "0 12px 32px rgba(var(--nova-shadow-ink, 0, 0, 0), 0.35)",
          }}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isActive = index === activeIndex;
            const showGroupHeader = opt.group != null && opt.group !== options[index - 1]?.group;
            return (
              <div key={opt.value || `opt-${index}`}>
                {showGroupHeader && (
                  <div style={{ padding: "6px 11px 3px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-faint)" }}>
                    {opt.group}
                  </div>
                )}
              <li
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
                onMouseEnter={() => !opt.disabled && setActiveIndex(index)}
                onClick={() => commit(index)}
                style={{
                  padding: "8px 11px",
                  borderRadius: "7px",
                  fontSize: "13.5px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: opt.disabled ? "not-allowed" : "pointer",
                  color: opt.disabled ? "var(--color-faint)" : isSelected ? "var(--color-accent-strong)" : "var(--color-text)",
                  background: isActive && !opt.disabled ? "var(--color-accent-muted)" : "transparent",
                  opacity: opt.disabled ? 0.6 : 1,
                }}
              >
                {opt.label}
              </li>
              </div>
            );
          })}
        </ul>
      )}
    </div>
  );
}
