import type { ReactNode } from "react";

/**
 * <Card> / <Panel> — the shared surface primitive (audit §8.2). Replaces the
 * ad-hoc bordered `<div style={{ background, border, borderRadius, padding,
 * … }}>` repeated hundreds of times across the tab files (roughly half of the
 * 654 inline styles the audit counts). Visually identical to the long-standing
 * `novaDetailCardStyle`, so the two are interchangeable during rollout.
 *
 * All styling lives in the `.ui-card*` classes in dashboard-nova.css, so a
 * card reads the token layer and inherits dark/light + reduced-motion for free.
 */

type CardVariant = "default" | "soft" | "accent" | "dashed" | "high" | "low" | "mid";

type CardProps = {
  children: ReactNode;
  /** Surface tone. `soft` = elevated, `accent` = gold-tinted, `dashed` = the
   *  "bridge / learn more" affordance, `high`/`mid`/`low` = semantic
   *  positive/caution/negative callouts (mirrors the shared score tokens). */
  variant?: CardVariant;
  /** Tighter padding for dense/nested cards. */
  compact?: boolean;
  as?: "div" | "section" | "article" | "aside";
  className?: string;
  style?: React.CSSProperties;
  /** For click-to-select rows (e.g. a date option in a list) — same clickable-
   *  div pattern the hand-rolled card it replaces already used, not a new
   *  a11y regression. Prefer a real `<button>` outside `<Card>` when possible. */
  onClick?: () => void;
} & Omit<React.HTMLAttributes<HTMLElement>, "style" | "className" | "onClick" | "children">;

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: "",
  soft: "ui-card--soft",
  accent: "ui-card--accent",
  dashed: "ui-card--dashed",
  high: "ui-card--high",
  low: "ui-card--low",
  mid: "ui-card--mid",
};

export function Card({
  children,
  variant = "default",
  compact = false,
  as = "div",
  className,
  style,
  onClick,
  ...rest
}: CardProps) {
  const Tag = as;
  const classes = ["ui-card", VARIANT_CLASS[variant], compact ? "ui-card--pad-sm" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={classes} style={style} onClick={onClick} {...rest}>
      {children}
    </Tag>
  );
}

/** Alias — some surfaces read more naturally as a "panel" than a "card". */
export const Panel = Card;
