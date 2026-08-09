"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE_NAME, LANG_STORAGE_KEY, resolveLang, type Lang } from "@/lib/i18n";
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
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Reconcile any client-stored preference with the server-provided default.
  //
  // F7 part two — `initialLang` is now what the *server* rendered the page in,
  // not merely a default the client is free to override. localStorage does not
  // expire and the cookie does (max-age 1y), so a visitor returning after a
  // long gap, or one who cleared cookies only, can arrive with a Tamil
  // preference the server could not see and an English page already painted.
  // Writing the cookie back is not enough on a server-rendered page — the copy
  // is in the HTML — so this self-heals with one `router.refresh()`, once, only
  // when the two actually disagree. Re-persisting on every visit is deliberate
  // and unchanged: it rolls the cookie's expiry forward, which is what stops
  // the drift recurring.
  useEffect(() => {
    const resolved = resolveLang(localStorage.getItem(LANG_STORAGE_KEY), initialLang);
    setLangState(resolved);
    persistLangPreference(resolved);
    if (resolved !== initialLang) startTransition(() => router.refresh());
  }, [initialLang, router]);

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
    // Server-rendered pages hold their copy in the RSC payload, so context
    // alone can no longer switch them. `refresh()` re-fetches that payload in
    // place — it keeps client state, scroll and focus, and is wrapped in a
    // transition so the current language stays interactive until the new one
    // arrives. Pages still reading `useLang()` update from the context first
    // and are unaffected by the refresh landing a moment later.
    startTransition(() => router.refresh());
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
