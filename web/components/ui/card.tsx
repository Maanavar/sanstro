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

type CardVariant = "default" | "soft" | "accent" | "dashed";

type CardProps = {
  children: ReactNode;
  /** Surface tone. `soft` = elevated, `accent` = gold-tinted, `dashed` = the
   *  "bridge / learn more" affordance. */
  variant?: CardVariant;
  /** Tighter padding for dense/nested cards. */
  compact?: boolean;
  as?: "div" | "section" | "article" | "aside";
  className?: string;
  style?: React.CSSProperties;
};

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: "",
  soft: "ui-card--soft",
  accent: "ui-card--accent",
  dashed: "ui-card--dashed",
};

export function Card({
  children,
  variant = "default",
  compact = false,
  as = "div",
  className,
  style,
}: CardProps) {
  const Tag = as;
  const classes = ["ui-card", VARIANT_CLASS[variant], compact ? "ui-card--pad-sm" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={classes} style={style}>
      {children}
    </Tag>
  );
}

/** Alias — some surfaces read more naturally as a "panel" than a "card". */
export const Panel = Card;
