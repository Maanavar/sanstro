"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/lang-toggle";
import { searchSite, type SearchDoc, type SearchCategory } from "@/lib/search-index";

const CATEGORY_TA: Record<SearchCategory, string> = {
  Nakshatra: "நட்சத்திரம்",
  Dosham: "தோஷம்",
  Yogam: "யோகம்",
  Temple: "கோயில்",
  Pariharam: "பரிகாரம்",
  Tool: "கருவி",
  Page: "பக்கம்",
};

export function SiteSearch() {
  const router = useRouter();
  const [lang] = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The overlay portals to <body> — the trigger sits inside a `backdrop-filter`
  // header, which creates a containing block for `position: fixed` descendants
  // and would otherwise pin the panel to the nav bar's box instead of the viewport.
  useEffect(() => { setMounted(true); }, []);

  const results: SearchDoc[] = query.trim() ? searchSite(query) : [];

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    triggerRef.current?.focus();
  }, []);

  // Global "/" shortcut to open (ignored while typing in a field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || open) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      e.preventDefault();
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus the input + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);

  function go(doc: SearchDoc) {
    router.push(doc.href);
    close();
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      const doc = results[active];
      if (doc) go(doc);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="cl-search-trigger"
        aria-label={lang === "en" ? "Search the site" : "தளத்தில் தேடு"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </button>

      {mounted && open && createPortal(
        <div
          className="cl-search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={lang === "en" ? "Site search" : "தள தேடல்"}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="cl-search-panel">
            <div className="cl-search-inputrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="cl-search-input"
                placeholder={lang === "en" ? "Search nakshatram, dosham, tool…" : "நட்சத்திரம், தோஷம், கருவி தேடு…"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                autoComplete="off"
                aria-label={lang === "en" ? "Search" : "தேடு"}
              />
              <button type="button" className="cl-search-close" onClick={close} aria-label={lang === "en" ? "Close search" : "தேடலை மூடு"}>
                <kbd>Esc</kbd>
              </button>
            </div>

            {query.trim() && (
              <ul className="cl-search-results" role="listbox">
                {results.length === 0 ? (
                  <li className="cl-search-empty">
                    {lang === "en" ? "No matches. Try a nakshatra or dosham name." : "பொருத்தம் இல்லை. நட்சத்திரம் அல்லது தோஷம் பெயரை முயலவும்."}
                  </li>
                ) : (
                  results.map((doc, i) => (
                    <li key={doc.href} role="option" aria-selected={i === active}>
                      <button
                        type="button"
                        className="cl-search-result"
                        data-active={i === active}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => go(doc)}
                      >
                        <span className="cl-search-result__title">{lang === "ta" ? doc.ta : doc.en}</span>
                        <span className="cl-search-result__sub">{lang === "ta" ? doc.en : doc.ta}</span>
                        <span className="cl-search-result__cat">{lang === "ta" ? CATEGORY_TA[doc.category] : doc.category}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

            <div className="cl-search-hints">
              <span><kbd>↑</kbd><kbd>↓</kbd>{lang === "en" ? "Navigate" : "நகர்த்து"}</span>
              <span><kbd>↵</kbd>{lang === "en" ? "Open" : "திற"}</span>
              <span><kbd>Esc</kbd>{lang === "en" ? "Close" : "மூடு"}</span>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .cl-search-trigger {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 40px; min-height: 40px; border-radius: 999px;
          border: 1.5px solid var(--cl-border); background: var(--cl-surface);
          color: var(--cl-ink); cursor: pointer;
          transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
        }
        .cl-search-trigger:hover { border-color: var(--cl-ink); }
        .cl-search-trigger:focus-visible {
          outline: none; border-color: var(--cl-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--cl-accent) 22%, transparent);
        }
        .cl-search-trigger:active { transform: scale(0.94); }

        .cl-search-overlay {
          position: fixed; inset: 0; z-index: 400;
          background: color-mix(in srgb, var(--cl-ink) 46%, transparent);
          backdrop-filter: blur(3px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 12vh 16px 16px;
          animation: cl-search-fade 140ms ease-out;
        }
        .cl-search-panel {
          width: min(560px, 100%); background: var(--cl-surface);
          border: 1px solid var(--cl-border); border-radius: 16px;
          box-shadow: 0 24px 64px var(--cl-shadow); overflow: hidden;
          animation: cl-search-rise 160ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes cl-search-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cl-search-rise {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-search-overlay, .cl-search-panel { animation: none; }
        }

        .cl-search-inputrow {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; border-bottom: 1px solid var(--cl-border);
          color: var(--cl-muted);
        }
        .cl-search-input {
          flex: 1; border: none; outline: none; background: transparent;
          font-family: inherit; font-size: 1rem; color: var(--cl-ink);
        }
        .cl-search-input::placeholder { color: var(--cl-muted); opacity: 0.8; }
        .cl-search-close {
          border: none; background: transparent; padding: 2px; cursor: pointer;
          display: inline-flex; border-radius: 6px;
        }
        .cl-search-close:focus-visible {
          outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--cl-accent) 22%, transparent);
        }
        .cl-search-results {
          list-style: none; margin: 0; padding: 6px; max-height: 52vh; overflow-y: auto;
        }
        .cl-search-empty { padding: 18px 12px; color: var(--cl-muted); font-size: 0.9rem; }
        .cl-search-result {
          display: flex; align-items: baseline; gap: 8px; width: 100%;
          padding: 10px 12px; border: none; border-radius: 10px;
          background: transparent; cursor: pointer; text-align: left;
          font-family: inherit; transition: background 100ms ease;
        }
        .cl-search-result[data-active="true"] { background: var(--cl-bg-2); }
        .cl-search-result:focus-visible {
          outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--cl-accent) 40%, transparent);
        }
        .cl-search-result__title { font-weight: 700; color: var(--cl-ink); font-size: 0.95rem; }
        .cl-search-result__sub { color: var(--cl-muted); font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cl-search-result__cat {
          margin-left: auto; flex-shrink: 0; font-size: 0.65rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em; color: var(--cl-accent);
          background: var(--cl-accent-soft); border-radius: 999px; padding: 3px 8px;
        }

        .cl-search-hints {
          display: flex; align-items: center; gap: 16px;
          padding: 10px 16px; border-top: 1px solid var(--cl-border);
          background: var(--cl-bg-2);
        }
        .cl-search-hints span {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.72rem; color: var(--cl-muted);
        }
        .cl-search-hints kbd, .cl-search-close kbd {
          font-family: inherit; font-size: 0.68rem; font-weight: 700;
          color: var(--cl-muted); background: var(--cl-surface);
          border: 1px solid var(--cl-border-2); border-radius: 5px;
          padding: 2px 6px; line-height: 1.4;
        }
      `}</style>
    </>
  );
}
