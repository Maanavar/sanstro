"use client";

import { useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { LifeMode } from "@/lib/types";
import { DashboardAskVinaadi } from "./dashboard-ask-vinaadi";

type GoalTrack = "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | null;

interface DashboardAskVinaadiWidgetProps {
  lang: Lang;
  chartId: string | null;
  goalTrack?: GoalTrack;
  activeLifeMode?: LifeMode;
  onUpgrade?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nova puts "Ask Vinaadi" in the navbar (dashboard-hero.tsx), so the
      floating launcher is suppressed there; the panel itself still works. */
  hideLauncher?: boolean;
}

export function DashboardAskVinaadiWidget({ lang, chartId, goalTrack, activeLifeMode, onUpgrade, open, onOpenChange, hideLauncher }: DashboardAskVinaadiWidgetProps) {
  const [chipsRemaining, setChipsRemaining] = useState<number | null>(null);

  // Counter badge — show remaining free chips when fewer than the daily allowance.
  useEffect(() => {
    apiFetchJson<{ chipsRemaining: number | null; isPremium: boolean; dailyLimit: number }>(
      "/api/v1/ask-vinaadi/daily-status",
    )
      .then((s) => setChipsRemaining(s.isPremium ? null : s.chipsRemaining))
      .catch(() => {});
  }, [open]);

  const showBadge = chipsRemaining !== null && chipsRemaining < 3;

  return (
    <>
      {!hideLauncher && (
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        title={lang === "ta" ? "வினாடி கேளுங்கள்" : "Ask Vinaadi"}
        style={{
          position: "fixed",
          // Stacked directly above the feedback FAB (bottom:24px, 44px tall)
          // with just enough gap to read as two separate buttons — this used
          // to sit at bottom:196px, leaving a ~128px dead zone between the
          // two FABs that swallowed whatever page content scrolled under it
          // (e.g. list rows, form fields, card icons on Plan/Journal/Tools).
          bottom: "80px",
          right: "18px",
          zIndex: 160,
          border: "none",
          borderRadius: "999px",
          padding: "12px 16px",
          background: "var(--color-accent, var(--panel-brand))",
          color: "var(--color-on-accent, #fff)",
          fontWeight: 700,
          fontSize: "0.875rem",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(184,90,44,0.35)",
        }}
      >
        {lang === "ta" ? "கேள் வினாடி" : "Ask Vinaadi"}
        {showBadge && (
          <span
            title={lang === "ta" ? `இன்று ${chipsRemaining} மீதம்` : `${chipsRemaining} left today`}
            style={{
              position: "absolute", top: "-6px", right: "-6px", minWidth: "18px", height: "18px",
              padding: "0 5px", borderRadius: "999px", background: chipsRemaining! > 0 ? "var(--chart-d9-active)" : "var(--planet-saturn)",
              color: "var(--color-on-accent, #fff)", fontSize: "0.6875rem", fontWeight: 800, lineHeight: "18px", textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          >
            {chipsRemaining}
          </span>
        )}
      </button>
      )}

      {open && (
        <div
          style={{
            position: "fixed",
            // Classic's trigger is the bottom-right launcher FAB, so the panel
            // stacks just above it. Nova's trigger (cd-ask-nav-btn) lives in the
            // topbar instead — anchoring to `bottom` there left the panel
            // floating in the middle of the screen, disconnected from the
            // button that opened it, so Nova anchors from the top instead.
            ...(hideLauncher ? { top: "110px" } : { bottom: "138px" }),
            right: "18px",
            width: "min(480px, calc(100vw - 32px))",
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 170,
            borderRadius: "14px",
            background: "var(--color-surface, var(--chart-cell-default))",
            border: "1px solid var(--color-border, var(--panel-tan-light))",
            boxShadow: "0 16px 48px rgba(61,53,43,0.24)",
            padding: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--color-muted, var(--panel-mid-earth))",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
          <DashboardAskVinaadi lang={lang} chartId={chartId} goalTrack={goalTrack} activeLifeMode={activeLifeMode} onUpgrade={onUpgrade} />
        </div>
      )}
    </>
  );
}
