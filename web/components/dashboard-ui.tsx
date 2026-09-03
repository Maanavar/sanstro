"use client";


import { cloneElement, isValidElement, useState } from "react";
import type { CSSProperties, InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
export function Metric({
  label, value, hint, tone = "mid",
}: {
  label: string; value: string; hint?: string; tone?: "high" | "mid" | "low" | "rest";
}) {
  return (
    <div className={`metric metric--${tone}`}>
      <p className="metric__label">{label}</p>
      <p className="metric__value">{value}</p>
      {hint ? <p className="metric__hint">{hint}</p> : null}
    </div>
  );
}

export function Field({
  id,
  label,
  children,
  helper,
  error,
  valid,
  required,
}: {
  id?: string;
  label: string;
  children: ReactNode;
  helper?: string;
  error?: string;
  valid?: boolean;
  required?: boolean;
}) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "control"}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helper ? `${fieldId}-helper` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as any, {
        id: (children as any).props?.id ?? fieldId,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": describedBy,
        "aria-required": required ? "true" : undefined,
        required: required || (children as any).props?.required,
      })
    : children;

  return (
    <label className="field" htmlFor={fieldId}>
      <span className="field__label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      <div className="input-wrapper">
        {control}
        {valid && !error ? (
          <span className="input-wrapper__check" aria-hidden="true">
            <CheckCircle2 size={16} strokeWidth={1.5} />
          </span>
        ) : null}
      </div>
      {error ? (
        <span id={errorId} className="field__error" role="alert" aria-live="polite">
          <AlertCircle size={14} strokeWidth={1.5} aria-hidden="true" />
          {error}
        </span>
      ) : null}
      {helper && !error ? <span id={helperId} className="field__helper">{helper}</span> : null}
    </label>
  );
}

/* ── Sanctioned form controls (SHD-03) ──────────────────────────────
   One styled text input + select, warm "deep-dive" surface. Consolidates
   the per-file WInput/WSelect copies (UXD-11). Non-error styling is
   pixel-identical to the setup-tab original; `error` also sets aria-invalid. */
export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <input
      {...rest}
      aria-invalid={error || rest["aria-invalid"] || undefined}
      style={{
        width: "100%", padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: `1.5px solid ${error ? "var(--color-low, var(--planet-saturn))" : "var(--deepdive-border-light, var(--panel-tan-light))"}`,
        background: rest.readOnly ? "var(--deepdive-surface-strong, var(--panel-hover))" : "var(--chart-cell-default)",
        color: "var(--deepdive-ink-mid, var(--panel-earth))", fontSize: "0.875rem", fontFamily: "inherit",
        outline: "none", cursor: rest.readOnly ? "default" : undefined,
        ...style,
      }}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <select
      {...rest}
      aria-invalid={error || rest["aria-invalid"] || undefined}
      style={{
        width: "100%", padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: `1.5px solid ${error ? "var(--color-low, var(--planet-saturn))" : "var(--deepdive-border-light, var(--panel-tan-light))"}`,
        background: "var(--chart-cell-default)",
        color: "var(--deepdive-ink-mid, var(--panel-earth))", fontSize: "0.875rem", fontFamily: "inherit",
        outline: "none",
        ...style,
      }}
    />
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "accent" }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}

export function Button({
  children, onClick, type = "button", variant = "secondary", disabled, title,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost"; disabled?: boolean; title?: string;
}) {
  // Component-scoped token names with the Classic values as fallback (Classic
  // is a no-op; only Nova's dashboard-nova.css definitions override them). Same
  // fallback-chain trick as --pcbx-*/--chartgrid-* — the raw --panel-* names are
  // shared "conflicting-role" tokens that can't be globally remapped under Nova.
  // See docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3 (dashboard-ui Button leak).
  const variantStyles: Record<"primary" | "secondary" | "ghost", CSSProperties> = {
    primary:   { background: "var(--dui-btn-accent, var(--panel-brand))",  color: "var(--dui-btn-on-accent, var(--panel-cream))", border: "1.5px solid var(--dui-btn-accent, var(--panel-brand))" },
    secondary: { background: "transparent",                                 color: "var(--dui-btn-ink, var(--panel-earth))",       border: "1.5px solid var(--dui-btn-border, var(--panel-tan))" },
    ghost:     { background: "transparent",                                 color: "var(--dui-btn-accent, var(--panel-brand))",    border: "1.5px solid var(--dui-btn-accent-border, var(--panel-brand-border))" },
  };
  const fallbackStyle: CSSProperties = {
    padding: "8px 20px",
    borderRadius: "10px",
    fontWeight: variant === "primary" ? 700 : 600,
    fontSize: "0.875rem",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    opacity: disabled ? 0.55 : 1,
    ...variantStyles[variant],
  };
  return (
    <button className={`button button--${variant}`} style={fallbackStyle} type={type} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

/**
 * `collapsible` turns the title row into a disclosure trigger. Opt-in, so every
 * existing Surface keeps rendering exactly as before — a plain, always-open
 * title div with no button semantics.
 *
 * `summary` rides on the right of the title row and is shown **only while
 * closed**: a collapsed section whose header says nothing but its own name
 * gives the reader no reason to open it, and no way to skip it either. Pass the
 * one fact that decides that (a score, a count), not a second copy of the body.
 */
export function Surface({
  title,
  children,
  collapsible = false,
  defaultOpen = false,
  summary,
}: {
  title: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  summary?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!collapsible) {
    return (
      <div className="surface">
        <div className="surface__title">{title}</div>
        {children}
      </div>
    );
  }

  return (
    <div className="surface">
      <button
        type="button"
        className="surface__title"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          width: "100%",
          // The class ships the collapsed-state bottom margin; an open section
          // needs it too, so keep it rather than letting the reset drop it.
          margin: open ? undefined : 0,
          padding: 0,
          border: "none",
          background: "none",
          font: "inherit",
          fontSize: "0.72rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          textAlign: "left",
          cursor: "pointer",
          minHeight: "32px",
        }}
      >
        <span aria-hidden="true" style={{ display: "inline-flex", transform: open ? "rotate(90deg)" : "none", transition: "transform 140ms ease", flex: "none" }}>
          <svg viewBox="0 0 20 20" style={{ width: "12px", height: "12px" }} aria-hidden="true">
            <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span style={{ minWidth: 0 }}>{title}</span>
        {!open && summary ? (
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "var(--space-2)", letterSpacing: "normal", textTransform: "none", minWidth: 0 }}>
            {summary}
          </span>
        ) : null}
      </button>
      {open && children}
    </div>
  );
}

import type { ConfidenceTier } from "@/lib/types";
import type { Lang } from "@/lib/i18n";

const CONFIDENCE_DOTS: Record<ConfidenceTier, string> = {
  HIGH:   "●●●",
  MEDIUM: "●●○",
  LOW:    "●○○",
};
const CONFIDENCE_COLORS: Record<ConfidenceTier, string> = {
  HIGH:   "var(--color-score-high)",
  MEDIUM: "var(--color-score-mid)",
  LOW:    "var(--color-faint)",
};

export function ConfidenceBadge({
  level,
  reason,
  lang,
}: {
  level: ConfidenceTier;
  reason: { ta: string; en: string };
  lang: Lang;
}) {
  const label = level === "HIGH"
    ? (lang === "ta" ? "உயர் நம்பகத்தன்மை" : "High confidence")
    : level === "MEDIUM"
    ? (lang === "ta" ? "மிதமான நம்பகத்தன்மை" : "Moderate")
    : (lang === "ta" ? "சாத்தியமான குறிப்பு" : "Indicative only");

  const reasonText = lang === "ta" ? reason.ta : reason.en;

  return (
    <span
      className="confidence-badge"
      style={{ color: CONFIDENCE_COLORS[level] }}
      title={reasonText}
    >
      <span className="confidence-dots">{CONFIDENCE_DOTS[level]}</span>
      {" "}
      <span className="confidence-label">{label}</span>
    </span>
  );
}