"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { getShadbala, type PlanetShadbala, type ShadbalaData } from "@vinaadi/shared/api/shadbala";
import { CollapsibleSection } from "./collapsible-section";

const W = {
  ink: "var(--deepdive-ink, var(--panel-earth-dark))",
  muted: "var(--color-faint)",
  border: "var(--deepdive-border, var(--panel-tan))",
  borderLt: "var(--deepdive-border-light, var(--panel-tan-light))",
  surface: "var(--deepdive-surface, var(--panel-cream))",
  surfaceMd: "var(--deepdive-surface-strong, var(--panel-hover))",
  strong: "#2E7D32",
  weak: "var(--deepdive-accent, var(--panel-brand))",
} as const;

const PLANET_LABEL: Record<string, { en: string; ta: string }> = {
  SUN: { en: "Sun", ta: "சூரியன்" },
  MOON: { en: "Moon", ta: "சந்திரன்" },
  MARS: { en: "Mars", ta: "செவ்வாய்" },
  MERCURY: { en: "Mercury", ta: "புதன்" },
  JUPITER: { en: "Jupiter", ta: "குரு" },
  VENUS: { en: "Venus", ta: "சுக்ரன்" },
  SATURN: { en: "Saturn", ta: "சனி" },
};

const COMPONENTS: [keyof PlanetShadbala, string][] = [
  ["sthana", "Sthana"],
  ["dig", "Dig"],
  ["kala", "Kala"],
  ["chesta", "Chesta"],
  ["naisargika", "Naisargika"],
  ["drik", "Drik"],
];

type Props = {
  lang: Lang;
  chartId: string;
};

export function ShadbalaPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [data, setData] = useState<ShadbalaData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setState("loading");
    getShadbala(chartId)
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

  const title = isTamil ? "ஷட்பலம் — கிரக பலம்" : "Shadbala — Planetary Strength";
  const subtitle = isTamil
    ? "ஆறு பகுதி செம்மொழி பலம் (ரூபம்) · சோதனை நிலை"
    : "Six-component classical strength (Rupas) · Experimental";

  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <p style={{ color: W.muted, fontSize: 12, margin: "0 0 var(--space-2) 0" }}>{subtitle}</p>
      {state === "loading" && (
        <p style={{ color: W.muted, fontSize: 13, margin: 0 }}>
          {isTamil ? "ஏற்றுகிறது…" : "Loading…"}
        </p>
      )}
      {state === "error" && (
        <p style={{ color: W.weak, fontSize: 13, margin: 0 }}>
          {isTamil ? "ஷட்பலத்தை ஏற்ற முடியவில்லை." : "Could not load Shadbala."}
        </p>
      )}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          <p style={{ color: W.muted, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{data.note}</p>
          {data.planets.map((p) => (
            <PlanetCard key={p.graha} p={p} isTamil={isTamil} />
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}

function PlanetCard({ p, isTamil }: { p: PlanetShadbala; isTamil: boolean }) {
  const label = PLANET_LABEL[p.graha];
  const ratioPct = Math.min(100, Math.round(p.strengthRatio * 100));
  return (
    <div
      style={{
        border: `1px solid ${W.borderLt}`,
        borderRadius: "var(--radius-md)",
        background: W.surface,
        padding: "var(--space-3) var(--space-3_5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ color: W.ink, fontSize: 15 }}>
          {isTamil ? label?.ta ?? p.graha : label?.en ?? p.graha}
        </strong>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: p.isStrong ? W.strong : W.weak,
            background: p.isStrong ? "rgba(46,125,50,0.12)" : "rgba(198,40,40,0.10)",
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          {p.isStrong ? (isTamil ? "பலம்" : "Strong") : isTamil ? "பலவீனம்" : "Weak"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: W.ink }}>{p.rupas.toFixed(2)}</span>
        <span style={{ fontSize: 12, color: W.muted }}>
          {isTamil ? "தேவை" : "req"} {p.requiredRupas.toFixed(1)} {isTamil ? "ரூபம்" : "Rupas"}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: W.surfaceMd, overflow: "hidden", marginTop: 6 }}>
        <div
          style={{
            height: 6,
            width: `${ratioPct}%`,
            borderRadius: 3,
            background: p.isStrong ? W.strong : W.weak,
          }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {COMPONENTS.map(([key, name]) => (
          <span
            key={name}
            style={{
              display: "inline-flex",
              gap: 4,
              alignItems: "center",
              fontSize: 11,
              background: W.surfaceMd,
              borderRadius: 999,
              padding: "2px 8px",
            }}
          >
            <span style={{ color: W.muted }}>{name}</span>
            <strong style={{ color: W.ink }}>{Number(p[key]).toFixed(0)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
