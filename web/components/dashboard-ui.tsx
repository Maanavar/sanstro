"use client";


import { useState } from "react";
import type { ReactNode } from "react";

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
  return (
    <button className={`button button--${variant}`} type={type} onClick={onClick} disabled={disabled} title={title}>
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
      <input className="input" value={query} placeholder="Type a city…" autoComplete="off"
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => handleInput(e.target.value)} />
      {open && filtered.length > 0 && (
        <ul style={{
          position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0,
          background: "var(--surface, #1c1c1e)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "8px", marginTop: "4px", maxHeight: "220px", overflowY: "auto",
          padding: "4px 0", listStyle: "none",
        }}>
          {filtered.slice(0, 40).map((city) => (
            <li key={city.name} onMouseDown={() => select(city)}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-primary, #fff)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
              {city.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

