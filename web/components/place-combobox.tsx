"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { PLACE_CITIES } from "@/lib/tn-cities";
import type { CityEntry } from "@/lib/tn-cities";

type PlaceComboboxProps = {
  value: string;
  onChange: (city: CityEntry | null, rawText: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">;

/**
 * `className` and `placeholder` were destructured here but never reached the
 * input — the Tamil placeholder the marketing tools pass was silently replaced
 * by a hardcoded English one, and a caller's field class was a no-op. Both are
 * applied now.
 *
 * `inputProps` is deliberately still NOT spread. The only caller using it is
 * `dashboard-edit-profile-modal.tsx`, which passes `required` inside a real
 * `<form onSubmit>` that already runs its own `fieldErrors` validation —
 * honouring it would hand that flow over to the browser's native validation
 * bubble instead. Spread it only alongside a decision about that modal.
 */
export function PlaceCombobox({ value, onChange, className = "", placeholder = "Type a city...", ...inputProps }: PlaceComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // `useId()` is not SSR-stable for this component. Most call sites reach it
  // through a `next/dynamic` panel with a `loading` fallback, so the Suspense
  // boundary above can suspend on the client (chunk still downloading at
  // hydration time) without having suspended during SSR — that shifts the
  // Suspense-fork path useId() encodes and yields a different id than the HTML
  // carries, tripping a hydration mismatch on `aria-controls`. See the same
  // note in celestial-glyph-nova.tsx.
  //
  // A fixed constant isn't an option here (two comboboxes co-exist in the edit
  // profile modal), but the id is only *needed* once the listbox exists, which
  // is after a focus — i.e. always post-mount. So keep it out of the server
  // HTML and out of the first client render, and adopt it in an effect.
  const reactId = useId();
  const [listboxId, setListboxId] = useState<string | undefined>(undefined);
  const filtered = useMemo(
    () => (query.length < 1 ? PLACE_CITIES : PLACE_CITIES.filter((city) => city.name.toLowerCase().includes(query.toLowerCase()))),
    [query],
  );

  useEffect(() => {
    setListboxId(reactId);
  }, [reactId]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (filtered.length === 0) return 0;
      return Math.min(current, filtered.length - 1);
    });
  }, [filtered]);

  function select(city: CityEntry) {
    setQuery(city.name);
    setOpen(false);
    setActiveIndex(0);
    onChange(city, city.name);
  }

  function handleInput(text: string) {
    setQuery(text);
    setOpen(true);
    setActiveIndex(0);
    const exact = PLACE_CITIES.find((city) => city.name.toLowerCase() === text.toLowerCase());
    onChange(exact ?? null, text);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!filtered.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % filtered.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + filtered.length) % filtered.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const city = filtered[activeIndex];
      if (city) select(city);
      return;
    }
    if (event.key === "Tab") {
      const city = filtered[activeIndex];
      if (open && city) select(city);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        className={className || undefined}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={listboxId && open && filtered[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(event) => handleInput(event.target.value)}
        onKeyDown={handleKeyDown}
        // Inline styles beat any class, so a caller that supplies its own field
        // class gets the defaults dropped entirely rather than fought with.
        // That is how the marketing tools (`cl-num-input`) sit in a row of
        // native inputs without this one rendering in dashboard chrome — the
        // class is expected to set its own width.
        style={
          className
            ? undefined
            : {
                width: "100%",
                padding: "9px 12px",
                borderRadius: "10px",
                // Scoped --pcbx-* names fall back to the exact Classic values, so
                // Classic call sites are a pixel no-op. dashboard-nova.css redefines
                // --pcbx-* under [data-ui="nova"] .cd-shell so the field + dropdown
                // render on Nova's dark palette instead of the Classic light tokens
                // (--panel-earth/--panel-tan/--panel-hover, which can't be globally
                // remapped — see the reverted-block note in dashboard-nova.css).
                border: "1.5px solid var(--pcbx-field-border, var(--panel-tan-light))",
                background: "var(--pcbx-field-bg, var(--chart-cell-default))",
                color: "var(--pcbx-ink, var(--panel-earth))",
                fontSize: "0.875rem",
                fontFamily: "inherit",
                outline: "none",
              }
        }
      />
      {open && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 50,
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--pcbx-field-bg, var(--chart-cell-default))",
            border: "1.5px solid var(--pcbx-list-border, var(--panel-tan))",
            borderRadius: "10px",
            marginTop: "4px",
            maxHeight: "220px",
            overflowY: "auto",
            padding: "4px 0",
            listStyle: "none",
            boxShadow: "0 8px 24px rgba(26,22,18,0.12)",
          }}
        >
          {filtered.slice(0, 40).map((city, idx) => (
            <li
              id={`${listboxId}-option-${idx}`}
              key={`${city.name}-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseDown={() => select(city)}
              onMouseEnter={() => setActiveIndex(idx)}
              style={{
                padding: "9px 14px",
                cursor: "pointer",
                fontSize: "0.875rem",
                color: "var(--pcbx-ink, var(--panel-earth))",
                fontFamily: "inherit",
                background: idx === activeIndex ? "var(--pcbx-option-active-bg, var(--panel-hover))" : "",
              }}
            >
              {city.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
