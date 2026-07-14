"use client";

import React, { useEffect, useRef, useState } from "react";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

/**
 * Shared modal behavior (DASH-05) — the dialog semantics drawer-panel.tsx and
 * life-mode-picker.tsx already implement, extracted so every dashboard modal
 * gets them from one place: role="dialog" + aria-modal, focus moved into the
 * panel on open and restored to the trigger on close, Tab focus trap, Escape
 * to close, click-outside to close. Purely behavioral — each modal keeps its
 * own look via `panelStyle` / `overlayStyle`.
 */
export function ModalShell({
  label,
  onClose,
  children,
  overlayStyle,
  panelStyle,
  overlayClassName,
  panelClassName,
}: {
  /** Accessible name announced for the dialog. */
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  overlayStyle?: React.CSSProperties;
  panelStyle?: React.CSSProperties;
  /** When set, the class owns the overlay look — default inline styles are skipped. */
  overlayClassName?: string;
  panelClassName?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus();
    };
  }, [onClose]);

  const defaultOverlayStyle: React.CSSProperties | undefined = overlayClassName
    ? undefined
    : {
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(26,22,18,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", overflowY: "auto",
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={overlayClassName}
      style={{ ...defaultOverlayStyle, ...overlayStyle }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={panelRef} tabIndex={-1} className={panelClassName} style={{ outline: "none", ...panelStyle }}>
        {children}
      </div>
    </div>
  );
}

export type ConfirmDialogState = {
  /** Dialog headline, already localized. */
  title: string;
  /** Body copy, already localized. */
  body: string;
  /** Destructive-action button label, already localized. */
  confirmLabel: string;
  /** When set, the user must type this exact string to arm the button —
   *  used for vault deletion (type the vault name). */
  typeToConfirm?: string;
  onConfirm: () => void;
};

/**
 * In-design replacement for the browser `confirm()` popups (DASH-05):
 * destructive-styled button, bilingual copy supplied by the caller (built with
 * `t()`), optional type-the-name arming for the most destructive actions.
 */
export function ConfirmDialog({
  lang,
  state,
  onClose,
}: {
  lang: Lang;
  state: ConfirmDialogState;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const armed = !state.typeToConfirm || typed.trim() === state.typeToConfirm;

  return (
    <ModalShell
      label={state.title}
      onClose={onClose}
      panelStyle={{
        width: "min(420px, 100%)",
        background: "var(--deepdive-surface, var(--panel-cream))",
        border: "1.5px solid var(--deepdive-border-light, var(--panel-tan-light))",
        borderRadius: "16px",
        padding: "24px",
        display: "flex", flexDirection: "column", gap: "14px",
        boxShadow: "0 24px 64px rgba(26,22,18,0.18)",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--deepdive-ink, var(--panel-earth-dark))" }}>
        {state.title}
      </h3>
      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "var(--deepdive-ink-mid, var(--panel-earth))" }}>
        {state.body}
      </p>
      {state.typeToConfirm && (
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)" }}>
          {lang === "ta"
            ? `உறுதிப்படுத்த "${state.typeToConfirm}" என தட்டச்சு செய்யுங்கள்`
            : `Type "${state.typeToConfirm}" to confirm`}
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            style={{
              width: "100%", padding: "9px 12px", borderRadius: "10px",
              border: "1.5px solid var(--deepdive-border-light, var(--panel-tan-light))",
              background: "var(--chart-cell-default)",
              color: "var(--deepdive-ink-mid, var(--panel-earth))",
              fontSize: "0.875rem", fontFamily: "inherit", fontWeight: 400, outline: "none",
            }}
          />
        </label>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "9px 16px", borderRadius: "10px", cursor: "pointer",
            border: "1.5px solid var(--deepdive-border, var(--panel-tan))",
            background: "transparent", color: "var(--deepdive-ink-mid, var(--panel-earth))",
            fontSize: "0.85rem", fontWeight: 600, fontFamily: "inherit",
          }}
        >
          {t("btn_cancel", lang)}
        </button>
        <button
          type="button"
          disabled={!armed}
          onClick={() => { state.onConfirm(); onClose(); }}
          style={{
            padding: "9px 16px", borderRadius: "10px",
            border: "1.5px solid var(--color-score-weak, #C04530)",
            background: armed ? "var(--color-score-weak, #C04530)" : "transparent",
            color: armed ? "#fff" : "var(--color-faint)",
            fontSize: "0.85rem", fontWeight: 700, fontFamily: "inherit",
            cursor: armed ? "pointer" : "not-allowed",
          }}
        >
          {state.confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
