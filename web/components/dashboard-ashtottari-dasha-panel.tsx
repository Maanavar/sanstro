"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { getAshtottariDasha, type AshtottariDashaData, type AshtottariDashaPeriod } from "@vinaadi/shared/api/ashtottariDasha";
import { CollapsibleSection } from "./collapsible-section";

const W = {
  ink: "var(--deepdive-ink, var(--panel-earth-dark))",
  muted: "var(--color-faint)",
  border: "var(--deepdive-border, var(--panel-tan))",
  borderLt: "var(--deepdive-border-light, var(--panel-tan-light))",
  surface: "var(--deepdive-surface, var(--panel-cream))",
  surfaceMd: "var(--deepdive-surface-strong, var(--panel-hover))",
  accent: "var(--deepdive-accent, var(--panel-brand))",
} as const;

// Ashtottari Dasha — 108-year secondary/comparison dasha, 8 lords, no Ketu.
// See app/calculations/ashtottari_dasha.py for the documented Krittikadi
// nakshatra-lord convention this project uses, and its noted uncertainty.
const LORD_LABEL: Record<string, { en: string; ta: string }> = {
  SUN: { en: "Sun", ta: "சூரியன்" },
  MOON: { en: "Moon", ta: "சந்திரன்" },
  MARS: { en: "Mars", ta: "செவ்வாய்" },
  MERCURY: { en: "Mercury", ta: "புதன்" },
  JUPITER: { en: "Jupiter", ta: "குரு" },
  VENUS: { en: "Venus", ta: "சுக்ரன்" },
  SATURN: { en: "Saturn", ta: "சனி" },
  RAHU: { en: "Rahu", ta: "ராகு" },
};

function lordName(lord: string, isTamil: boolean): string {
  const label = LORD_LABEL[lord];
  return isTamil ? label?.ta ?? lord : label?.en ?? lord;
}

type Props = {
  lang: Lang;
  chartId: string;
};

export function AshtottariDashaPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [data, setData] = useState<AshtottariDashaData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setState("loading");
    getAshtottariDasha(chartId)
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

  const title = isTamil ? "அஷ்டோத்தரி தசை — 108 ஆண்டு சுழற்சி" : "Ashtottari Dasha — 108-Year Cycle";
  // Experimental caveat, consistent with the other secondary engines (UX #40).
  const subtitle = isTamil
    ? "இரண்டாம்நிலை/ஒப்பீட்டு தசை · சோதனை நிலை — காட்சிக்கு மட்டும், மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை"
    : "Secondary/comparison dasha · Experimental — display only, not used in any scoring path";

  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <p style={{ color: W.muted, fontSize: 12, margin: "0 0 var(--space-2) 0" }}>{subtitle}</p>
      {state === "loading" && (
        <p style={{ color: W.muted, fontSize: 13, margin: 0 }}>
          {isTamil ? "ஏற்றுகிறது…" : "Loading…"}
        </p>
      )}
      {state === "error" && (
        <p style={{ color: "var(--deepdive-accent, var(--panel-brand))", fontSize: 13, margin: 0 }}>
          {isTamil ? "அஷ்டோத்தரி தசையை ஏற்ற முடியவில்லை." : "Could not load Ashtottari Dasha."}
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
                {lordName(data.current.mahadasha.lord, isTamil)}
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
                {lordName(data.current.antardasha.lord, isTamil)}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: W.muted }}>
                {data.current.antardasha.startDate} – {data.current.antardasha.endDate}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {data.mahadashas.map((period: AshtottariDashaPeriod, index: number) => (
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
                  {lordName(period.lord, isTamil)}
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
