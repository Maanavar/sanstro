"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { getYoginiDasha, type YoginiDashaData, type YoginiDashaPeriod } from "@vinaadi/shared/api/yoginiDasha";
import { CollapsibleSection } from "./collapsible-section";
import { GlossaryTerm } from "./glossary-term";

const W = {
  ink: "var(--deepdive-ink, var(--panel-earth-dark))",
  muted: "var(--color-faint)",
  border: "var(--deepdive-border, var(--panel-tan))",
  borderLt: "var(--deepdive-border-light, var(--panel-tan-light))",
  surface: "var(--deepdive-surface, var(--panel-cream))",
  surfaceMd: "var(--deepdive-surface-strong, var(--panel-hover))",
  accent: "var(--deepdive-accent, var(--panel-brand))",
} as const;

// Yogini Dasha (Devi Bhagavata / Muhurta Chintamani tradition) — 8 Yoginis,
// fixed Mangala..Sankata order. See app/calculations/yogini_dasha.py for the
// documented starting-offset convention.
const YOGINI_LABEL: Record<string, { en: string; ta: string }> = {
  MANGALA: { en: "Mangala", ta: "மங்களை" },
  PINGALA: { en: "Pingala", ta: "பிங்களை" },
  DHANYA: { en: "Dhanya", ta: "தன்யா" },
  BHRAMARI: { en: "Bhramari", ta: "பிராமரி" },
  BHADRIKA: { en: "Bhadrika", ta: "பத்ரிகை" },
  ULKA: { en: "Ulka", ta: "உல்கா" },
  SIDDHA: { en: "Siddha", ta: "சித்தா" },
  SANKATA: { en: "Sankata", ta: "சங்கடா" },
};

const RULING_PLANET_LABEL: Record<string, { en: string; ta: string }> = {
  SUN: { en: "Sun", ta: "சூரியன்" },
  MOON: { en: "Moon", ta: "சந்திரன்" },
  MARS: { en: "Mars", ta: "செவ்வாய்" },
  MERCURY: { en: "Mercury", ta: "புதன்" },
  JUPITER: { en: "Jupiter", ta: "குரு" },
  VENUS: { en: "Venus", ta: "சுக்ரன்" },
  SATURN: { en: "Saturn", ta: "சனி" },
  RAHU: { en: "Rahu", ta: "ராகு" },
};

function yoginiName(yogini: string, isTamil: boolean): string {
  const label = YOGINI_LABEL[yogini];
  return isTamil ? label?.ta ?? yogini : label?.en ?? yogini;
}

function planetName(planet: string, isTamil: boolean): string {
  const label = RULING_PLANET_LABEL[planet];
  return isTamil ? label?.ta ?? planet : label?.en ?? planet;
}

type Props = {
  lang: Lang;
  chartId: string;
};

export function YoginiDashaPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [data, setData] = useState<YoginiDashaData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setState("loading");
    getYoginiDasha(chartId)
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

  const title = isTamil ? "யோகினி தசை — 36 ஆண்டு சுழற்சி" : "Yogini Dasha — 36-Year Cycle";
  // Consistent experimental caveat so unverified engines don't wear the same
  // confidence as the validated core (UX #40).
  const subtitleRest = isTamil
    ? " (தேவி பாகவதம் / முஹூர்த்த சிந்தாமணி மரபு) · சோதனை நிலை, மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை"
    : " (Devi Bhagavata / Muhurta Chintamani tradition) · Experimental, not used in any scoring path";

  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <p style={{ color: W.muted, fontSize: 12, margin: "0 0 var(--space-2) 0" }}>
        <GlossaryTerm term="yoginiDasha" lang={lang}>
          {isTamil ? "இரண்டாம்நிலை/ஒப்பீட்டு தசை" : "Secondary/comparison dasha"}
        </GlossaryTerm>
        {subtitleRest}
      </p>
      {state === "loading" && (
        <p style={{ color: W.muted, fontSize: 13, margin: 0 }}>
          {isTamil ? "ஏற்றுகிறது…" : "Loading…"}
        </p>
      )}
      {state === "error" && (
        <p style={{ color: "var(--deepdive-accent, var(--panel-brand))", fontSize: 13, margin: 0 }}>
          {isTamil ? "யோகினி தசையை ஏற்ற முடியவில்லை." : "Could not load Yogini Dasha."}
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
                {yoginiName(data.current.mahadasha.yogini, isTamil)}
                <span style={{ fontWeight: 400, color: W.muted, fontSize: "0.75rem" }}>
                  {" · "}{planetName(data.current.mahadasha.rulingPlanet, isTamil)}
                </span>
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
                {yoginiName(data.current.antardasha.yogini, isTamil)}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "0.75rem", color: W.muted }}>
                {data.current.antardasha.startDate} – {data.current.antardasha.endDate}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {data.mahadashas.map((period: YoginiDashaPeriod) => (
              <div
                key={period.startDate}
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
                  {yoginiName(period.yogini, isTamil)}
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
