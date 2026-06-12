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
}

export function DashboardAskVinaadiWidget({ lang, chartId, goalTrack, activeLifeMode, onUpgrade }: DashboardAskVinaadiWidgetProps) {
  const [open, setOpen] = useState(false);
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={lang === "ta" ? "வினாடி கேளுங்கள்" : "Ask Vinaadi"}
        style={{
          position: "fixed",
          bottom: "196px",
          right: "18px",
          zIndex: 160,
          border: "none",
          borderRadius: "999px",
          padding: "12px 16px",
          background: "var(--color-accent, #B85A2C)",
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
              padding: "0 5px", borderRadius: "999px", background: chipsRemaining! > 0 ? "#5C7654" : "#A8482F",
              color: "#fff", fontSize: "0.6875rem", fontWeight: 800, lineHeight: "18px", textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          >
            {chipsRemaining}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "260px",
            right: "18px",
            width: "min(480px, calc(100vw - 32px))",
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 170,
            borderRadius: "14px",
            background: "var(--color-surface, #FFFFFF)",
            border: "1px solid var(--color-border, #E4DBC8)",
            boxShadow: "0 16px 48px rgba(61,53,43,0.24)",
            padding: "10px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--color-muted, #675b4b)",
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
