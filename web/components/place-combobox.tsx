"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { TN_CITIES } from "@/lib/tn-cities";
import type { CityEntry } from "@/lib/tn-cities";

type PlaceComboboxProps = {
  value: string;
  onChange: (city: CityEntry | null, rawText: string) => void;
};

export function PlaceCombobox({ value, onChange }: PlaceComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const filtered = useMemo(
    () => (query.length < 1 ? TN_CITIES : TN_CITIES.filter((city) => city.name.toLowerCase().includes(query.toLowerCase()))),
    [query],
  );

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
    const exact = TN_CITIES.find((city) => city.name.toLowerCase() === text.toLowerCase());
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
        placeholder="Type a city..."
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && filtered[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(event) => handleInput(event.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: "10px",
          border: "1.5px solid #E4DBC8",
          background: "#FFFFFF",
          color: "#3D352B",
          fontSize: "0.875rem",
          fontFamily: "inherit",
          outline: "none",
        }}
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
            background: "#FFFFFF",
            border: "1.5px solid #D4C8AE",
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
                color: "#3D352B",
                fontFamily: "inherit",
                background: idx === activeIndex ? "#F4EEE2" : "",
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
