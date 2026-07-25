"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * <Chip> / <StatusChip> — the shared status/label chip primitives (audit §1.3).
 * `Chip` replaces the Classic `Chip`, the Settings local `Chip`, and the inline
 * tone pills; `StatusChip` replaces the Setup local `StatusChip`. Styling lives
 * in `.ui-chip*` / `.ui-status-chip*` in dashboard-nova.css, so tones read the
 * token layer and theme for free.
 */

type ChipTone = "neutral" | "high" | "mid" | "low" | "accent";

type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  tone?: ChipTone;
  /** Selected/active — drives the filled look and `aria-pressed` together. */
  active?: boolean;
};

export function Chip({ children, tone = "neutral", active, onClick, className, type = "button", ...rest }: ChipProps) {
  const classes = ["ui-chip", `ui-chip--${tone}`, active ? "ui-chip--active" : "", className]
    .filter(Boolean)
    .join(" ");
  // Static label when there's no click handler; interactive chip otherwise.
  if (!onClick && active === undefined) {
    return <span className={classes}>{children}</span>;
  }
  return (
    // eslint-disable-next-line react/button-has-type
    <button type={type} className={classes} aria-pressed={active} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

type StatusChipProps = {
  done: boolean;
  label: string;
};

export function StatusChip({ done, label }: StatusChipProps) {
  const classes = ["ui-status-chip", done ? "ui-status-chip--done" : ""].filter(Boolean).join(" ");
  return (
    <span className={classes}>
      {done ? <Check size={12} strokeWidth={2} aria-hidden="true" /> : null}
      {label}
    </span>
  );
}
