import type { ReactNode } from "react";

/**
 * <Kicker> / <SectionHeader> — the shared uppercase eyebrow + section-head
 * primitives (audit §1.3). Replaces the 4× locally-redefined `NovaKicker`, the
 * family `HyKicker`, and the ~220 inline `textTransform:"uppercase"` label rows.
 * One definition means every screen's micro-heading is the same size, tracking,
 * and colour. Styling lives in `.ui-kicker*` / `.ui-section-header*` in
 * dashboard-nova.css, so it reads the token layer and themes for free.
 */

type KickerTone = "accent" | "muted";

type KickerProps = {
  children: ReactNode;
  /** `accent` (gold, default) for section eyebrows; `muted` for quieter labels. */
  tone?: KickerTone;
  /** Per-instance color override (category tinting) — takes precedence over `tone`. */
  color?: string;
  className?: string;
  as?: "span" | "p" | "div";
};

export function Kicker({ children, tone = "accent", color, className, as = "span" }: KickerProps) {
  const Tag = as;
  const classes = ["ui-kicker", tone === "muted" ? "ui-kicker--muted" : "", className]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} style={color ? { color } : undefined}>{children}</Tag>;
}

type SectionHeaderProps = {
  /** The eyebrow line (rendered through <Kicker>). */
  title: ReactNode;
  /** Optional supporting line under the kicker. */
  hint?: ReactNode;
  /** Optional right-aligned slot (a control, count, or link). */
  right?: ReactNode;
  tone?: KickerTone;
  className?: string;
};

export function SectionHeader({ title, hint, right, tone = "accent", className }: SectionHeaderProps) {
  const classes = ["ui-section-header", className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      <div className="ui-section-header__text">
        <Kicker tone={tone}>{title}</Kicker>
        {hint ? <span className="ui-section-header__hint">{hint}</span> : null}
      </div>
      {right ? <div className="ui-section-header__right">{right}</div> : null}
    </div>
  );
}
