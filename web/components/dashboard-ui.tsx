"use client";


import { cloneElement, isValidElement, useState } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { TN_CITIES } from "@/lib/tn-cities";
import type { CityEntry } from "@/lib/tn-cities";
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

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "accent" }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}

export function Button({
  children, onClick, type = "button", variant = "secondary", disabled, title,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost"; disabled?: boolean; title?: string;
}) {
  const variantStyles: Record<"primary" | "secondary" | "ghost", CSSProperties> = {
    primary:   { background: "var(--panel-brand)",  color: "var(--panel-cream)", border: "1.5px solid var(--panel-brand)" },
    secondary: { background: "transparent",          color: "var(--panel-earth)", border: "1.5px solid var(--panel-tan)" },
    ghost:     { background: "transparent",          color: "var(--panel-brand)", border: "1.5px solid var(--panel-brand-border)" },
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

export function Surface({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface">
      <div className="surface__title">{title}</div>
      {children}
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

type PlaceComboboxProps = {
  value: string;
  onChange: (city: CityEntry | null, rawText: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

export function PlaceCombobox({
  value,
  onChange,
  placeholder = "Type a city...",
  className = "",
  ...inputProps
}: PlaceComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const filtered = query.length < 1 ? TN_CITIES : TN_CITIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  function select(city: CityEntry) { setQuery(city.name); setOpen(false); onChange(city, city.name); }
  function handleInput(text: string) {
    setQuery(text); setOpen(true);
    const exact = TN_CITIES.find((c) => c.name.toLowerCase() === text.toLowerCase());
    onChange(exact ?? null, text);
  }
  return (
    <div style={{ position: "relative" }}>
      <input
        {...inputProps}
        className={className}
        value={query} placeholder={placeholder} autoComplete={inputProps.autoComplete ?? "off"}
        onFocus={(event) => { inputProps.onFocus?.(event); setOpen(true); }}
        onBlur={(event) => { inputProps.onBlur?.(event); setTimeout(() => setOpen(false), 150); }}
        onChange={(e) => handleInput(e.target.value)}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: "var(--radius-md)",
          border: "1.5px solid var(--panel-tan-light)", background: "var(--panel-cream)",
          color: "var(--panel-earth)", fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
        }}
      />
      {open && filtered.length > 0 && (
        <ul style={{
          position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0,
          background: "var(--panel-cream)", border: "1.5px solid var(--panel-tan)",
          borderRadius: "var(--radius-md)", marginTop: "4px", maxHeight: "220px", overflowY: "auto",
          padding: "4px 0", listStyle: "none",
          boxShadow: "0 8px 24px var(--panel-shadow)",
        }}>
          {filtered.slice(0, 40).map((city, idx) => (
            <li key={`${city.name}-${idx}`} onMouseDown={() => select(city)}
              style={{ padding: "9px 14px", cursor: "pointer", fontSize: "0.875rem", color: "var(--panel-earth)", fontFamily: "inherit" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--panel-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
              {city.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}