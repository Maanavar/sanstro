import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * <Button> / <Pill> — the interaction primitives (audit §8.2, §8.3). They are
 * the reason the kit ships as components and not just tokens: the 44px touch
 * floor (audit B-3) needs `@media (pointer: coarse)`, which an inline style
 * cannot express. The `.ui-btn*` / `.ui-pill` classes in dashboard-nova.css
 * carry that media query, so every button is touch-safe by construction while
 * staying visually compact on desktop.
 */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  children,
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = ["ui-btn", `ui-btn--${variant}`, size === "sm" ? "ui-btn--sm" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    // eslint-disable-next-line react/button-has-type
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}

type PillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** Selected state — drives the gold fill and `aria-pressed` together. */
  active?: boolean;
};

export function Pill({ children, active = false, className, type = "button", ...rest }: PillProps) {
  const classes = ["ui-pill", className].filter(Boolean).join(" ");
  return (
    // eslint-disable-next-line react/button-has-type
    <button type={type} className={classes} aria-pressed={active} {...rest}>
      {children}
    </button>
  );
}
