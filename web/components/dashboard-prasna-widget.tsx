"use client";

import { useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { PrasnaResponse } from "@/lib/types";
import { Button } from "./dashboard-ui";
import { DrawerPanel } from "./drawer-panel";

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  sage: "#5C7654",
  terracotta: "#B85A2C",
  rust: "#A8482F",
} as const;

const QUESTION_AREAS = [
  { key: "JOB",       labelKey: "prasna_area_job" as const },
  { key: "MARRIAGE",  labelKey: "prasna_area_marriage" as const },
  { key: "HEALTH",    labelKey: "prasna_area_health" as const },
  { key: "FINANCE",   labelKey: "prasna_area_finance" as const },
  { key: "PROPERTY",  labelKey: "prasna_area_property" as const },
  { key: "TRAVEL",    labelKey: "prasna_area_travel" as const },
  { key: "LEGAL",     labelKey: "prasna_area_legal" as const },
  { key: "CHILDREN",  labelKey: "prasna_area_children" as const },
  { key: "GENERAL",   labelKey: "prasna_area_general" as const },
];

function outlookColor(outlook: PrasnaResponse["outlook"]) {
  if (outlook === "FAVOURABLE") return W.sage;
  if (outlook === "UNFAVOURABLE") return W.rust;
  if (outlook === "DELAY") return W.terracotta;
  return W.muted;
}

function outlookLabel(outlook: PrasnaResponse["outlook"], lang: Lang): string {
  const map = {
    FAVOURABLE:   t("prasna_outlook_favourable", lang),
    UNFAVOURABLE: t("prasna_outlook_unfavourable", lang),
    MIXED:        t("prasna_outlook_mixed", lang),
    DELAY:        t("prasna_outlook_delay", lang),
  };
  return map[outlook];
}

type Props = {
  lang: Lang;
  open: boolean;
  onClose: () => void;
  timezone: string;
  latitude: number;
  longitude: number;
};

export function PrasnaWidget({ lang, open, onClose, timezone, latitude, longitude }: Props) {
  const [selectedArea, setSelectedArea] = useState("GENERAL");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrasnaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetchJson<{ success: boolean; data: PrasnaResponse }>("/api/v1/prasna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_area: selectedArea,
          timezone_name: timezone,
          latitude,
          longitude,
        }),
      });
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(lang === "ta" ? "பதில் கிடைக்கவில்லை." : "No result returned.");
      }
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setResult(null);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <DrawerPanel
      title={t("prasna_title", lang)}
      onClose={handleClose}
    >
      <div style={{ padding: "var(--space-4) var(--space-4) var(--space-8)", maxWidth: "480px" }}>
        <p style={{ fontSize: "0.83rem", color: W.muted, marginBottom: "var(--space-4)", lineHeight: 1.6 }}>
          {t("prasna_desc", lang)}
        </p>

        {/* Area selection */}
        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "var(--space-2_5)" }}>
          {t("prasna_area_label", lang)}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
          {QUESTION_AREAS.map(({ key, labelKey }) => {
            const isActive = key === selectedArea;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedArea(key)}
                style={{
                  padding: "5px 14px",
                  borderRadius: "var(--radius-pill)",
                  border: `1.5px solid ${isActive ? W.terracotta : W.borderLt}`,
                  background: isActive ? "rgba(184,90,44,0.1)" : W.surface,
                  color: isActive ? W.terracotta : W.inkMid,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {t(labelKey, lang)}
              </button>
            );
          })}
        </div>

        <Button variant="primary" onClick={handleAsk} disabled={loading}>
          {loading ? t("prasna_asking", lang) : t("prasna_ask", lang)}
        </Button>

        {error && (
          <p style={{ marginTop: "var(--space-3)", fontSize: "0.82rem", color: W.rust }}>{error}</p>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop: "var(--space-5)" }}>
            {/* Outlook banner */}
            <div style={{
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-card)",
              background: `${outlookColor(result.outlook)}18`,
              border: `1.5px solid ${outlookColor(result.outlook)}44`,
              marginBottom: "var(--space-4)",
            }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 700, color: outlookColor(result.outlook), marginBottom: "2px" }}>
                {outlookLabel(result.outlook, lang)}
              </p>
              <p style={{ fontSize: "0.83rem", color: W.inkMid, lineHeight: 1.55 }}>
                {lang === "ta" ? result.outlookTa : result.outlookEn}
              </p>
            </div>

            {/* Meta row */}
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
              <MetaChip label={t("prasna_lagna", lang)} value={result.prasnaLagnaName} />
              <MetaChip label={t("prasna_moon", lang)} value={result.moonNakshatraName} />
              <MetaChip label={t("prasna_karaka", lang)} value={`${result.karaka} (H${result.karakaHouse})`} />
            </div>

            {/* Positive indicators */}
            {result.positiveIndicators.length > 0 && (
              <div style={{ marginBottom: "var(--space-3)" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: W.sage, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-1_5)" }}>
                  {t("prasna_positive", lang)}
                </p>
                {result.positiveIndicators.map((ind, i) => (
                  <p key={i} style={{ fontSize: "0.82rem", color: W.inkMid, marginBottom: "4px" }}>
                    + {ind}
                  </p>
                ))}
              </div>
            )}

            {/* Negative indicators */}
            {result.negativeIndicators.length > 0 && (
              <div style={{ marginBottom: "var(--space-3)" }}>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, color: W.terracotta, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-1_5)" }}>
                  {t("prasna_negative", lang)}
                </p>
                {result.negativeIndicators.map((ind, i) => (
                  <p key={i} style={{ fontSize: "0.82rem", color: W.inkMid, marginBottom: "4px" }}>
                    − {ind}
                  </p>
                ))}
              </div>
            )}

            {/* Caution */}
            {(lang === "ta" ? result.cautionTa : result.cautionEn) && (
              <div style={{
                padding: "var(--space-2_5) var(--space-3)",
                borderRadius: "6px",
                background: "rgba(184,90,44,0.07)",
                border: `1px solid rgba(184,90,44,0.25)`,
                fontSize: "0.8rem",
                color: W.terracotta,
                lineHeight: 1.55,
              }}>
                ⚠ {lang === "ta" ? result.cautionTa : result.cautionEn}
              </div>
            )}
          </div>
        )}
      </div>
    </DrawerPanel>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: "var(--space-1_5) var(--space-3)",
      borderRadius: "var(--radius-card)",
      background: W.surfaceMd,
      border: `1px solid ${W.borderLt}`,
    }}>
      <p style={{ fontSize: "0.68rem", color: W.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "0.85rem", fontWeight: 700, color: W.inkMid }}>{value}</p>
    </div>
  );
}
