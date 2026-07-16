"use client";

import { useEffect, useState } from "react";

export type Theme = "system" | "light" | "dark";

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
function resolve(theme: Theme): "light" | "dark" {
  if (theme === "system") return systemPrefersLight() ? "light" : "dark";
  return theme;
}

function applyTheme(theme: Theme) {
  // Always set an explicit data-theme so the existing [data-theme="light"] /
  // :not([data-theme="light"]) CSS blocks apply for the System case too. Kept in
  // sync with the pre-paint inline script in app/layout.tsx.
  document.documentElement.setAttribute("data-theme", resolve(theme));
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial: Theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setThemeState(initial);
    applyTheme(initial);
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

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return { theme, setTheme };
}
