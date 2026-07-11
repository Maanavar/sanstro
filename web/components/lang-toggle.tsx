"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LANG_COOKIE_NAME, LANG_STORAGE_KEY, type Lang } from "@/lib/i18n";
import { apiFetchJson } from "@/lib/api";

// ── Shared context ──────────────────────────────────────────────────────────

type LangCtx = [Lang, (l: Lang) => void];
const LangContext = createContext<LangCtx>(["en", () => {}]);

function persistLangPreference(lang: Lang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  document.cookie = `${LANG_COOKIE_NAME}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
}

export function LangProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Reconcile any client-stored preference with the server-provided default.
  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    const resolved = stored === "ta" || stored === "en" ? stored : initialLang;
    setLangState(resolved);
    persistLangPreference(resolved);
  }, [initialLang]);

  // Sync to server-side preference once the authenticated session resolves.
  useEffect(() => {
    function onSessionLang(e: Event) {
      const serverLang = (e as CustomEvent<Lang>).detail;
      if (serverLang === "ta" || serverLang === "en") {
        setLangState(serverLang);
        persistLangPreference(serverLang);
      }
    }
    window.addEventListener("vinaadi:lang-resolved", onSessionLang);
    return () => window.removeEventListener("vinaadi:lang-resolved", onSessionLang);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    persistLangPreference(l);
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
    // Persist to server (fire-and-forget; silently ignored for unauthenticated users)
    void apiFetchJson("/settings/ui", {
      method: "PATCH",
      body: JSON.stringify({ lang: next }),
    }).catch(() => undefined);
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
