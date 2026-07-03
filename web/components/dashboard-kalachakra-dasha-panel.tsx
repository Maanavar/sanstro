"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { getKalachakraDasha, type KalachakraDashaData, type KalachakraDashaPeriod } from "@vinaadi/shared/api/kalachakraDasha";
import { CollapsibleSection } from "./collapsible-section";

const W = {
  ink: "var(--panel-earth-dark)",
  muted: "var(--color-faint)",
  border: "var(--panel-tan)",
  borderLt: "var(--panel-tan-light)",
  surface: "var(--panel-cream)",
  surfaceMd: "var(--panel-hover)",
  accent: "var(--panel-brand)",
} as const;

// Kalachakra Dasha — rasi-based, non-uniform period lengths (4-21 years).
// Experimental / display only — see app/calculations/kalachakra_dasha.py for
// the cited Saravali source, the documented Portion-Zero cycle convention,
// and a discovered inconsistency in the source's own worked example. Lords
// are rasis, so the API already returns a display name (rasiName) — no
// separate label table needed here.
type Props = {
  lang: Lang;
  chartId: string;
};

export function KalachakraDashaPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [data, setData] = useState<KalachakraDashaData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setState("loading");
    getKalachakraDasha(chartId)
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setState("idle");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [chartId]);

  const title = isTamil ? "காலசக்ரா தசை" : "Kalachakra Dasha";
  const subtitle = isTamil
    ? "இரண்டாம்நிலை/ஒப்பீட்டு தசை — சோதனை நிலையில் உள்ளது, மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை"
    : "Secondary/comparison dasha — experimental, display only, not used in any scoring path";

  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <p style={{ color: W.muted, fontSize: 12, margin: "0 0 var(--space-2) 0" }}>{subtitle}</p>
      {state === "loading" && (
        <p style={{ color: W.muted, fontSize: 13, margin: 0 }}>
          {isTamil ? "ஏற்றுகிறது…" : "Loading…"}
        </p>
      )}
      {state === "error" && (
        <p style={{ color: "var(--panel-brand)", fontSize: 13, margin: 0 }}>
          {isTamil ? "காலசக்ரா தசையை ஏற்ற முடியவில்லை." : "Could not load Kalachakra Dasha."}
        </p>
      )}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              padding: "var(--space-2_5) var(--space-3)",
              borderRadius: "var(--radius-md)",
              background: "var(--cl-sage-soft)",
              border: "1px solid var(--cl-sage-border)",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: "var(--color-score-high)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isTamil ? "தற்போதைய மஹா தசை" : "Current Mahadasha"}
              </p>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: W.ink }}>
                {data.current.mahadasha.rasiName ?? data.current.mahadasha.rasiCode}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: W.muted }}>
                {data.current.mahadasha.startDate} – {data.current.mahadasha.endDate}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.625rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isTamil ? "அந்தர் தசை" : "Antardasha"}
              </p>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: W.ink }}>
                {data.current.antardasha.rasiName ?? data.current.antardasha.rasiCode}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: W.muted }}>
                {data.current.antardasha.startDate} – {data.current.antardasha.endDate}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {data.mahadashas.map((period: KalachakraDashaPeriod, index: number) => (
              <div
                key={`${period.startDate}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-1_5) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${W.borderLt}`,
                  background: period.startDate === data.current.mahadasha.startDate ? W.surfaceMd : "transparent",
                }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: W.ink }}>
                  {period.rasiName ?? period.rasiCode}
                </span>
                <span style={{ fontSize: "0.75rem", color: W.muted }}>
                  {period.years} {isTamil ? "ஆண்டுகள்" : "yrs"} · {period.startDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}
