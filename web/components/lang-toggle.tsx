"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LANG_STORAGE_KEY, type Lang } from "@/lib/i18n";

// ── Shared context ──────────────────────────────────────────────────────────

type LangCtx = [Lang, (l: Lang) => void];
const LangContext = createContext<LangCtx>(["en", () => {}]);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "ta" || stored === "en") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(LANG_STORAGE_KEY, l);
  }

  return (
    <LangContext.Provider value={[lang, setLang]}>
      {children}
    </LangContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useLang(): LangCtx {
  return useContext(LangContext);
}

// ── Toggle button ───────────────────────────────────────────────────────────

interface LangToggleProps {
  onChange?: (lang: Lang) => void;
}

export function LangToggle({ onChange }: LangToggleProps) {
  const [lang, setLang] = useLang();

  function toggle() {
    const next: Lang = lang === "en" ? "ta" : "en";
    setLang(next);
    onChange?.(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="cl-lang-toggle"
      aria-label={lang === "en" ? "Switch to Tamil" : "Switch to English"}
      title={lang === "en" ? "தமிழில் பார்க்க" : "View in English"}
    >
      <span className={lang === "en" ? "cl-lang-toggle__active" : "cl-lang-toggle__inactive"}>EN</span>
      <span className="cl-lang-toggle__sep">|</span>
      <span className={lang === "ta" ? "cl-lang-toggle__active" : "cl-lang-toggle__inactive"}>தமிழ்</span>
    </button>
  );
}
