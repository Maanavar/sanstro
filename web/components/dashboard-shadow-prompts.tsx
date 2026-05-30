"use client";

import { useState } from "react";

import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { todayIso } from "@/lib/format";
import { Surface } from "./dashboard-ui";

interface BiText {
  ta: string;
  en: string;
}

interface JournalPrompt {
  promptId: string;
  category: string;
  text: BiText;
}

type Mode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

interface DashboardShadowPromptsProps {
  lang: Lang;
  mode?: Mode;
  chartId: string | null;
}

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "var(--color-faint)",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
} as const;

export function DashboardShadowPrompts({ lang, mode = "BALANCED", chartId }: DashboardShadowPromptsProps) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<JournalPrompt[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (mode === "BEGINNER" || !chartId) return null;

  async function fetchPrompts() {
    if (prompts) {
      setOpen((v) => !v);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const today = todayIso();
      const j = await apiFetchJson<{ success: boolean; data: { prompts: JournalPrompt[] } }>(`/api/v1/journal/prompts?chartId=${chartId}&date=${today}&promptType=SHADOW`);
      setPrompts((j?.data?.prompts ?? []) as JournalPrompt[]);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Surface title={lang === "ta" ? "????? ???????" : "Shadow Work"}>
      <div className="surface__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              {lang === "ta" ? "????? ???????" : "Shadow Work"}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: W.muted, lineHeight: 1.5 }}>
              {lang === "ta" ? "?????? 8??? ??????? 12??? ?? ??????????? ???????????? ????? ?????????" : "Deep reflective prompts based on your 8th and 12th house placements"}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPrompts}
            style={{
              padding: "6px 16px",
              borderRadius: "10px",
              border: `1px solid ${open ? W.ink : W.border}`,
              background: open ? W.ink : "transparent",
              color: open ? W.surfaceMd : W.inkMid,
              fontSize: "0.875rem",
              cursor: "pointer",
              fontWeight: 600,
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            {lang === "ta" ? "?????????? ?????" : "Explore inner landscape"}
          </button>
        </div>

        {open && (
          <div style={{ marginTop: "14px" }}>
            {loading && <p style={{ fontSize: "0.875rem", color: W.muted }}>{lang === "ta" ? "??????????�" : "Loading..."}</p>}

            {!loading && prompts && prompts.length > 0 && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: W.mutedLt, marginBottom: "10px" }}>
                  {lang === "ta" ? "?????????�" : "Reflect on..."}
                </p>
                {prompts.map((p, i) => (
                  <div key={p.promptId} style={{ padding: "12px 14px", borderRadius: "10px", border: `1px solid ${W.borderLt}`, marginBottom: "8px", background: W.card, display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1rem", marginTop: "1px" }}>{["??", "??", "??"][i] ?? "?"}</span>
                    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.55, color: W.inkMid }}>{lang === "ta" ? p.text.ta : p.text.en}</p>
                  </div>
                ))}
              </div>
            )}

            {!loading && prompts && prompts.length === 0 && (
              <p style={{ fontSize: "0.875rem", color: W.muted }}>{lang === "ta" ? "??????? ????????? ?????????????." : "No prompts available at the moment."}</p>
            )}
          </div>
        )}
      </div>
    </Surface>
  );
}
