"use client";

import { useRef, type ReactNode } from "react";

/**
 * <Segmented> — the single replacement for the 7 different hand-rolled
 * second-level nav patterns the audit counts (§3, A-1): segmented toggle, flat
 * pills, rounded pills, card grid, etc. all collapse to this one control, so
 * "switch view within a tab" looks and behaves identically everywhere.
 *
 * Semantics: a `role="tablist"` of `role="tab"` buttons with roving tabindex +
 * Left/Right/Home/End keyboard support — a real a11y upgrade over the bare
 * `<button onClick>` rows it replaces. Styling lives in `.ui-segmented*` in
 * dashboard-nova.css; it scrolls horizontally (no wrap) when the options
 * overflow a narrow viewport.
 */

export type SegmentedOption<T extends string> = {
  key: T;
  label: ReactNode;
};

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (key: T) => void;
  /** Accessible name for the tablist (e.g. "Life-area views"). */
  ariaLabel: string;
  className?: string;
};

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusIndex = (idx: number) => {
    const clamped = (idx + options.length) % options.length;
    btnRefs.current[clamped]?.focus();
    onChange(options[clamped].key);
  };

  const onKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusIndex(currentIdx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusIndex(currentIdx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusIndex(0);
        break;
      case "End":
        e.preventDefault();
        focusIndex(options.length - 1);
        break;
      default:
        break;
    }
  };

  const classes = ["ui-segmented", className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="tablist" aria-label={ariaLabel}>
      {options.map((opt, idx) => {
        const selected = opt.key === value;
        return (
          <button
            key={opt.key}
            ref={(el) => {
              btnRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className="ui-segmented__btn"
            onClick={() => onChange(opt.key)}
            onKeyDown={(e) => onKeyDown(e, idx)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
