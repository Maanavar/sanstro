"use client";

import { useEffect, useId, useRef, useState } from "react";

import { searchPlaces, type PlaceSearchResult } from "@vinaadi/shared/api/places";
import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export type CityEntry = {
  name: string;
  lat: string;
  lng: string;
  timezone: string;
};

// Mirrors `app/api/places.py`'s `_MIN_QUERY_LENGTH` — below this the backend
// returns no results, so there is no point firing a request.
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 200;
const SEARCH_LIMIT = 20;

/** Backend returns city + state + country as separate fields (no static list
 * to pre-join against anymore); rebuild the "City, State, Country" display
 * string every other part of this app already expects. `admin1Name` is
 * nullable for places GeoNames doesn't subdivide. */
function formatPlaceName(place: PlaceSearchResult): string {
  const region = place.admin1Name ? `${place.admin1Name}, ` : "";
  return `${place.name}, ${region}${place.countryName}`;
}

function toCityEntry(place: PlaceSearchResult): CityEntry {
  return {
    name: formatPlaceName(place),
    lat: String(place.lat),
    lng: String(place.lng),
    timezone: place.timezone,
  };
}

type GeocodeFallbackResponse = {
  lat: number | null;
  lon: number | null;
  countryCode: string | null;
  timezone: string | null;
  error: string | null;
};

type PlaceComboboxProps = {
  value: string;
  onChange: (city: CityEntry | null, rawText: string) => void;
  lang?: Lang;
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
 *
 * `aria-label` is pulled out and forwarded explicitly, because that blanket
 * non-spread also swallowed it: this input is a `role="combobox"` whose visible
 * caption is a sibling `<span>`, so without it the control has no accessible
 * name at all. Named separately rather than by relaxing the rule above (F10).
 *
 * B-006: results come from the bundled offline `/places/search` endpoint, not
 * an in-memory array — debounced 200ms, minimum 2 characters (below that the
 * backend returns nothing, so there is nothing to request). A stale response
 * (an earlier keystroke's request resolving after a later one) is dropped via
 * `requestSeq`, not `AbortController` — one fewer moving part for a debounce
 * this short. `onChange` only ever receives a non-null `city` from an explicit
 * selection now (list pick, or the online fallback below) — typing text that
 * happens to match a known name no longer silently claims a match the way the
 * old synchronous array lookup did; `place-coordinates-field.tsx`'s "matched"
 * state is set by the caller from this same explicit selection.
 */
export function PlaceCombobox({ value, onChange, className = "", placeholder = "Type a city...", "aria-label": ariaLabel, lang = "en", ...inputProps }: PlaceComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState<CityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchedOnline, setSearchedOnline] = useState(false);
  const [onlineFailed, setOnlineFailed] = useState(false);
  const requestSeq = useRef(0);

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

  useEffect(() => {
    setListboxId(reactId);
  }, [reactId]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const trimmed = query.trim();
    setOnlineFailed(false);
    setSearchedOnline(false);
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const seq = ++requestSeq.current;
    const timer = setTimeout(() => {
      searchPlaces(trimmed, SEARCH_LIMIT)
        .then((res) => {
          if (requestSeq.current !== seq) return; // a later keystroke already superseded this
          setResults(res.data.map(toCityEntry));
          setLoading(false);
        })
        .catch(() => {
          if (requestSeq.current !== seq) return;
          setResults([]);
          setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setActiveIndex((current) => {
      if (results.length === 0) return 0;
      return Math.min(current, results.length - 1);
    });
  }, [results]);

  function select(city: CityEntry) {
    setQuery(city.name);
    setOpen(false);
    setActiveIndex(0);
    setResults([]);
    onChange(city, city.name);
  }

  function handleInput(text: string) {
    setQuery(text);
    setOpen(true);
    setActiveIndex(0);
    onChange(null, text);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const city = results[activeIndex];
      if (city) select(city);
      return;
    }
    if (event.key === "Tab") {
      const city = results[activeIndex];
      if (open && city) select(city);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // Explicit, opt-in only (owner ruling B-006) — never fired automatically.
  // Reuses the existing server-side Nominatim proxy (`app/api/geo.py`), which
  // already caches results for 30 days.
  async function searchOnline() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearchedOnline(true);
    setOnlineFailed(false);
    try {
      const res = await apiFetchJson<GeocodeFallbackResponse>("/geo/geocode", {
        method: "POST",
        body: JSON.stringify({ query: trimmed }),
      });
      if (res.error || res.lat == null || res.lon == null) {
        setOnlineFailed(true);
        setLoading(false);
        return;
      }
      setLoading(false);
      select({
        name: trimmed,
        lat: String(res.lat),
        lng: String(res.lon),
        timezone: res.timezone ?? "Asia/Kolkata",
      });
    } catch {
      setOnlineFailed(true);
      setLoading(false);
    }
  }

  const trimmedQuery = query.trim();
  const showListbox = open && results.length > 0;
  const showNoResults = open && !loading && trimmedQuery.length >= MIN_QUERY_LENGTH && results.length === 0;

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        className={className || undefined}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={listboxId && open && results[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
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
      <span role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>
        {loading ? t("place_searching", lang) : ""}
      </span>
      {showListbox && (
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
          {results.map((city, idx) => (
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
      {showNoResults && (
        <div
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
            padding: "10px 14px",
            boxShadow: "0 8px 24px rgba(26,22,18,0.12)",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--pcbx-ink, var(--panel-earth))" }}>
            {t("place_no_results", lang)}
          </p>
          {onlineFailed ? (
            <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "var(--color-faint)" }}>
              {t("place_search_online_failed", lang)}
            </p>
          ) : !searchedOnline ? (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                void searchOnline();
              }}
              style={{
                marginTop: "6px",
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "0.75rem",
                color: "var(--pcbx-ink, var(--panel-brand))",
                textDecoration: "underline",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t("place_search_online", lang)}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
