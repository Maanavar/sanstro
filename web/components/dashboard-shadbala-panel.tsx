"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { getShadbala, type PlanetShadbala, type ShadbalaData } from "@vinaadi/shared/api/shadbala";
import { CollapsibleSection } from "./collapsible-section";
import { GlossaryTerm } from "./glossary-term";
import type { GlossaryKey } from "@/lib/glossary";

const PLANET_LABEL: Record<string, { en: string; ta: string }> = {
  SUN: { en: "Sun", ta: "சூரியன்" },
  MOON: { en: "Moon", ta: "சந்திரன்" },
  MARS: { en: "Mars", ta: "செவ்வாய்" },
  MERCURY: { en: "Mercury", ta: "புதன்" },
  JUPITER: { en: "Jupiter", ta: "குரு" },
  VENUS: { en: "Venus", ta: "சுக்ரன்" },
  SATURN: { en: "Saturn", ta: "சனி" },
};

const COMPONENTS: [keyof PlanetShadbala, string, GlossaryKey][] = [
  ["sthana", "Sthana", "sthanaBala"],
  ["dig", "Dig", "digBala"],
  ["kala", "Kala", "kalaBala"],
  ["chesta", "Chesta", "chestaBala"],
  ["naisargika", "Naisargika", "naisargikaBala"],
  ["drik", "Drik", "drikBala"],
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
      <p style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", margin: "0 0 var(--space-2) 0" }}>{subtitle}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-2_5)" }}>
        {COMPONENTS.map(([key, name, glossaryKey]) => (
          <GlossaryTerm key={key} term={glossaryKey} lang={lang}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{name} bala</span>
          </GlossaryTerm>
        ))}
      </div>
      {state === "loading" && (
        <p style={{ color: "var(--color-faint)", fontSize: "var(--text-base)", margin: 0 }}>
          {isTamil ? "ஏற்றுகிறது…" : "Loading…"}
        </p>
      )}
      {state === "error" && (
        <p style={{ color: "var(--color-low)", fontSize: "var(--text-base)", margin: 0 }}>
          {isTamil ? "ஷட்பலத்தை ஏற்ற முடியவில்லை." : "Could not load Shadbala."}
        </p>
      )}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          <p style={{ color: "var(--color-text-strong)", fontSize: "var(--text-sm)", margin: 0, lineHeight: 1.55 }}>
            {isTamil
              ? "ரூபம் என்பது கிரக பலத்தின் செம்மொழி அளவு. ஒவ்வொரு கிரகமும் ஆறு மூலங்களிலிருந்து (இடம், திசை, காலம், இயக்கம், இயற்கைத் தரம், பார்வை) பலம் பெறுகிறது; அது ரூபங்களாகக் கூட்டப்படுகிறது. ஒரு கிரகம் அதற்குத் தேவையான ரூபத்தைத் தாண்டினால், அதன் வீடு மற்றும் தசை பலன்களை முழுமையாகத் தரும் அளவு வலிமையானது; குறைவாக இருந்தால், அப்பலன்கள் மெதுவாக வரும், முயற்சியும் பரிகாரமும் உதவும்."
              : "A Rupa is the classical unit of planetary strength. Each planet earns strength from six sources (position, direction, time, motion, natural rank, and aspects), summed in Rupas. Clear the required Rupas and the planet is strong enough to deliver its house and dasha results fully; below that, those results come slower and benefit from effort or remedies."}
          </p>
          {data.note && <p style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", margin: 0, lineHeight: 1.5 }}>{data.note}</p>}
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
        border: `1px solid var(--color-border)`,
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface-soft)",
        padding: "var(--space-3) var(--space-3_5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ color: "var(--color-text-strong)", fontSize: "var(--text-md)" }}>
          {isTamil ? label?.ta ?? p.graha : label?.en ?? p.graha}
        </strong>
        <span
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            color: p.isStrong ? "var(--color-high)" : "var(--color-low)",
            background: p.isStrong ? "var(--color-high-bg)" : "var(--color-low-bg)",
            borderRadius: "var(--radius-pill)",
            padding: "var(--space-1) var(--space-2)",
          }}
        >
          {p.isStrong ? (isTamil ? "பலம்" : "Strong") : isTamil ? "பலவீனம்" : "Weak"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--color-text-strong)" }}>{p.rupas.toFixed(2)}</span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
          {isTamil ? "தேவை" : "req"} {p.requiredRupas.toFixed(1)} {isTamil ? "ரூபம்" : "Rupas"} · {ratioPct}%
        </span>
      </div>
      <div style={{ height: 6, borderRadius: "var(--radius-sm)", background: "var(--color-surface)", overflow: "hidden", marginTop: "var(--space-2)" }}>
        <div
          style={{
            height: 6,
            width: `${ratioPct}%`,
            borderRadius: "var(--radius-sm)",
            background: p.isStrong ? "var(--color-high)" : "var(--color-low)",
          }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
        {COMPONENTS.map(([key, name]) => (
          <span
            key={name}
            style={{
              display: "inline-flex",
              gap: "var(--space-1)",
              alignItems: "center",
              fontSize: "var(--text-xs)",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-pill)",
              padding: "var(--space-1) var(--space-2)",
            }}
          >
            <span style={{ color: "var(--color-faint)" }}>{name}</span>
            <strong style={{ color: "var(--color-text-strong)" }}>{Number(p[key]).toFixed(0)}</strong>
          </span>
        ))}
      </div>
      <p style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", margin: "8px 0 0", lineHeight: 1.5 }}>
        {p.isStrong
          ? isTamil
            ? `${label?.ta ?? p.graha} தேவையான பலத்தைத் தாண்டுகிறது — அதன் வீடு மற்றும் தசை பலன்கள் தானாகவே நிலைக்கும்.`
            : `${label?.en ?? p.graha} clears its required strength — its house and dasha results tend to hold up on their own.`
          : isTamil
            ? `${label?.ta ?? p.graha} தேவையான பலத்திற்குக் குறைவு — அதன் பலன்கள் மெதுவாக வரும்; முயற்சி அல்லது பரிகாரம் உதவும்.`
            : `${label?.en ?? p.graha} is below the required strength — its results come slower and benefit from conscious effort or remedies.`}
      </p>
    </div>
  );
}
