"use client";


import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

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

export function Field({ label, children, helper }: { label: string; children: ReactNode; helper?: string }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {helper ? <span className="field__helper">{helper}</span> : null}
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
    primary: { background: "#B85A2C", color: "#FAF5EA", border: "1.5px solid #B85A2C" },
    secondary: { background: "transparent", color: "#3D352B", border: "1.5px solid #D4C8AE" },
    ghost: { background: "transparent", color: "#B85A2C", border: "1.5px solid rgba(184,90,44,0.4)" },
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
  HIGH:   "var(--color-score-high, #5C7654)",
  MEDIUM: "var(--color-score-mid, #B85A2C)",
  LOW:    "var(--color-faint, #7A6F5E)",
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

export function PlaceCombobox({ value, onChange }: { value: string; onChange: (city: CityEntry | null, rawText: string) => void }) {
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
        value={query} placeholder="Type a city…" autoComplete="off"
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => handleInput(e.target.value)}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: "10px",
          border: "1.5px solid #E4DBC8", background: "#FFFFFF",
          color: "#3D352B", fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
        }}
      />
      {open && filtered.length > 0 && (
        <ul style={{
          position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0,
          background: "#FFFFFF", border: "1.5px solid #D4C8AE",
          borderRadius: "10px", marginTop: "4px", maxHeight: "220px", overflowY: "auto",
          padding: "4px 0", listStyle: "none",
          boxShadow: "0 8px 24px rgba(26,22,18,0.12)",
        }}>
          {filtered.slice(0, 40).map((city, idx) => (
            <li key={`${city.name}-${idx}`} onMouseDown={() => select(city)}
              style={{ padding: "9px 14px", cursor: "pointer", fontSize: "0.875rem", color: "#3D352B", fontFamily: "inherit" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F4EEE2"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
              {city.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

