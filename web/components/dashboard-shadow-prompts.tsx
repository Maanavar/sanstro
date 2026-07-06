"use client";

import { useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
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
  ink: "var(--panel-earth-dark)",
  inkMid: "var(--panel-earth)",
  muted: "var(--color-faint)",
  mutedLt: "var(--color-faint)",
  border: "var(--panel-tan)",
  borderLt: "var(--panel-tan-light)",
  surface: "var(--panel-cream)",
  surfaceMd: "var(--panel-hover)",
  card: "var(--chart-cell-default)",
  terracotta: "var(--panel-brand)",
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
    <Surface title={t("shadow_prompts_title", lang)}>
      <div className="surface__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              {t("shadow_prompts_title", lang)}
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: W.muted, lineHeight: 1.5 }}>
              {t("shadow_prompts_desc", lang)}
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
            {t("shadow_prompts_cta", lang)}
          </button>
        </div>

        {open && (
          <div style={{ marginTop: "14px" }}>
            {loading && <p style={{ fontSize: "0.875rem", color: W.muted }}>{t("journal_prompts_loading", lang)}</p>}

            {!loading && prompts && prompts.length > 0 && (
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: W.mutedLt, marginBottom: "10px" }}>
                  {t("shadow_prompts_reflect_on", lang)}
                </p>
                {prompts.map((p, i) => (
                  <div key={p.promptId} style={{ padding: "12px 14px", borderRadius: "10px", border: `1px solid ${W.borderLt}`, marginBottom: "8px", background: W.card, display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1rem", marginTop: "1px" }}>{["1.", "2.", "3."][i] ?? "?"}</span>
                    <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.55, color: W.inkMid }}>{lang === "ta" ? p.text.ta : p.text.en}</p>
                  </div>
                ))}
              </div>
            )}

            {!loading && prompts && prompts.length === 0 && (
              <p style={{ fontSize: "0.875rem", color: W.muted }}>{t("shadow_prompts_empty", lang)}</p>
            )}
          </div>
        )}
      </div>
    </Surface>
  );
}
