"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "vinaadi-theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

function systemPrefersLight(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(LIGHT_QUERY).matches
  );
}

/** Resolve a theme choice to a concrete "light" | "dark" attribute value.
 *  UXD-03 — "system" now follows the OS preference instead of always being dark. */
function resolve(theme: Theme): ResolvedTheme {
  if (theme === "system") return systemPrefersLight() ? "light" : "dark";
  return theme;
}

// ── Shared store ───────────────────────────────────────────────────────────
// Module-level, not per-hook state: the navbar toggle (dashboard-hero) and the
// Appearance segmented control (dashboard-settings-session-tab) are mounted at
// the same time, and two independent useState copies would drift the moment
// either one moved. Every call site reads this one value.
//
// The store starts at the same value the server rendered ("system" / "dark") and
// is only reconciled with localStorage in an effect, so hydration matches. The
// pre-paint script in app/layout.tsx has already painted the right theme by then
// — this is React catching up to the DOM, not the other way round.
let currentTheme: Theme = "system";
let currentResolved: ResolvedTheme = "dark";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readTheme(): Theme {
  return currentTheme;
}

function readResolved(): ResolvedTheme {
  return currentResolved;
}

function serverTheme(): Theme {
  return "system";
}

function serverResolved(): ResolvedTheme {
  return "dark";
}

function applyTheme(theme: Theme) {
  currentTheme = theme;
  currentResolved = resolve(theme);
  // Always set an explicit data-theme so the existing [data-theme="light"] /
  // :not([data-theme="light"]) CSS blocks apply for the System case too. Kept in
  // sync with the pre-paint inline script in app/layout.tsx.
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", currentResolved);
  }
  emit();
}

function hydrateFromStorage() {
  if (typeof window === "undefined") return;
  let stored: string | null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode / blocked site data. Leave the store alone rather than
    // resetting it to "system" — a read that throws is not a choice of System,
    // and clobbering here would silently undo a toggle made in this session.
    return;
  }
  applyTheme(stored === "light" || stored === "dark" || stored === "system" ? stored : "system");
}

/** What is actually painted right now. The pre-paint script in app/layout.tsx
 *  writes this attribute before React exists, so it is the one source that is
 *  correct on the first frame — the in-memory store is only correct once some
 *  consumer has mounted, and the navbar toggle must work before that. */
function showingNow(): ResolvedTheme {
  if (typeof document === "undefined") return currentResolved;
  const painted = document.documentElement.getAttribute("data-theme");
  return painted === "light" || painted === "dark" ? painted : currentResolved;
}

/** Persist and apply an explicit choice. Safe to call outside React. */
export function setTheme(next: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage is a convenience here; the in-memory store still drives the page.
  }
  applyTheme(next);
}

/** One-click flip between the two themes, for the navbar control.
 *  Flips whatever is *on screen* — so from "system" on a dark device the first
 *  click lands on Warm, not on Nova Galaxy again. It writes an explicit choice;
 *  Settings › Appearance is where "System" is handed back. */
export function toggleTheme() {
  setTheme(showingNow() === "dark" ? "light" : "dark");
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const resolvedTheme = useSyncExternalStore(subscribe, readResolved, serverResolved);

  useEffect(() => {
    hydrateFromStorage();
  }, []);

  // While the choice is "system", track live OS preference changes so the
  // dashboard flips without a reload when the user changes their OS appearance.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(LIGHT_QUERY);
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
