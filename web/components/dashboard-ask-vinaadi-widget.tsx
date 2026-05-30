"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { DashboardAskVinaadi } from "./dashboard-ask-vinaadi";

type GoalTrack = "CAREER" | "EXAM" | "RELATIONSHIP" | "FINANCIAL" | null;

interface DashboardAskVinaadiWidgetProps {
  lang: Lang;
  chartId: string | null;
  goalTrack?: GoalTrack;
}

export function DashboardAskVinaadiWidget({ lang, chartId, goalTrack }: DashboardAskVinaadiWidgetProps) {
  const [open, setOpen] = useState(false);

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
          background: "rgba(99,102,241,0.92)",
          color: "var(--color-on-accent, #fff)",
          fontWeight: 700,
          fontSize: "0.82rem",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
        }}
      >
        {lang === "ta" ? "கேள் வினாடி" : "Ask Vinaadi"}
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
            background: "rgba(10,14,24,0.98)",
            border: "1px solid rgba(99,102,241,0.35)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
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
                color: "rgba(255,255,255,0.7)",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <DashboardAskVinaadi lang={lang} chartId={chartId} goalTrack={goalTrack} />
        </div>
      )}
    </>
  );
}
