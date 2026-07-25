"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import {
  getConditionalDashas,
  type ConditionalDashasData,
  type ConditionalDashaSystem,
  type ConditionalDashaApplicabilityResult,
} from "@vinaadi/shared/api/conditionalDashas";
import { CollapsibleSection } from "./collapsible-section";
import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";

// Conditional nakshatra dashas — the seven Parashari conditional udu dashas.
// Tables anchored to a single cited source (satyori/Santhanam BPHS); see
// app/calculations/conditional_dashas.py for the documented single-source
// posture. Experimental / display-only — none feed the daily score, and the
// applicability report never auto-hides a system.
const LORD_LABEL: Record<string, { en: string; ta: string }> = {
  SUN: { en: "Sun", ta: "சூரியன்" },
  MOON: { en: "Moon", ta: "சந்திரன்" },
  MARS: { en: "Mars", ta: "செவ்வாய்" },
  MERCURY: { en: "Mercury", ta: "புதன்" },
  JUPITER: { en: "Jupiter", ta: "குரு" },
  VENUS: { en: "Venus", ta: "சுக்ரன்" },
  SATURN: { en: "Saturn", ta: "சனி" },
  RAHU: { en: "Rahu", ta: "ராகு" },
  KETU: { en: "Ketu", ta: "கேது" },
};

function lordName(lord: string, isTamil: boolean): string {
  const label = LORD_LABEL[lord];
  return isTamil ? label?.ta ?? lord : label?.en ?? lord;
}

type Props = {
  lang: Lang;
  chartId: string;
};

// Applies / Does not apply / Needs review — informational, never hides a system.
function StatusChip({ applicable, lang }: { applicable: boolean | null; lang: Lang }) {
  const isTamil = lang === "ta";
  const config =
    applicable === true
      ? { label: isTamil ? "பொருந்தும்" : "Applies", bg: "var(--color-high-bg)", fg: "var(--color-high)", bd: "var(--color-high-border)" }
      : applicable === false
        ? { label: isTamil ? "பொருந்தாது" : "Does not apply", bg: "var(--color-surface-soft)", fg: "var(--color-muted)", bd: "var(--color-border)" }
        : { label: isTamil ? "மதிப்பாய்வு தேவை" : "Needs review", bg: "var(--color-high-bg)", fg: "var(--color-text-strong)", bd: "var(--color-high-border)" };
  return (
    <span
      style={{
        fontSize: "var(--text-2xs)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        padding: "var(--space-1) var(--space-2)",
        borderRadius: "var(--radius-pill)",
        background: config.bg,
        color: config.fg,
        border: `1px solid ${config.bd}`,
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}

function SystemCard({
  system,
  applicability,
  lang,
}: {
  system: ConditionalDashaSystem;
  applicability?: ConditionalDashaApplicabilityResult;
  lang: Lang;
}) {
  const isTamil = lang === "ta";
  const label = `${isTamil ? system.nameTa : system.nameEn} — ${system.totalYears} ${isTamil ? "ஆண்டு" : "yr"}`;
  const title = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
      {label}
      {applicability ? <StatusChip applicable={applicability.applicable} lang={lang} /> : null}
    </span>
  );
  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingTop: "var(--space-1)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
          {isTamil ? system.applicabilityTa : system.applicabilityEn}
          {applicability?.reason ? ` · ${applicability.reason}` : ""}
        </p>
        <Card
          variant="soft"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "var(--space-2)",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ flex: 1 }}>
            <Kicker as="p" color="var(--color-faint)" style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>
              {isTamil ? "தற்போதைய மஹா" : "Current Maha"}
            </Kicker>
            <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
              {lordName(system.current.mahadasha.lord, isTamil)}
            </p>
            <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {system.current.mahadasha.startDate} – {system.current.mahadasha.endDate}
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <Kicker as="p" color="var(--color-faint)" style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>
              {isTamil ? "அந்தர்" : "Antar"}
            </Kicker>
            <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
              {lordName(system.current.antardasha.lord, isTamil)}
            </p>
            <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {system.current.antardasha.startDate} – {system.current.antardasha.endDate}
            </p>
          </div>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-0_5)" }}>
          {system.mahadashas.slice(0, system.mahadashas.length / 2).map((period, index) => (
            <Card
              key={`${period.startDate}-${index}`}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-1) var(--space-2_5)",
                borderRadius: "var(--radius-sm)",
                background: period.startDate === system.current.mahadasha.startDate ? "var(--color-surface)" : "transparent",
              }}
            >
              <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>{lordName(period.lord, isTamil)}</span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
                {period.years} {isTamil ? "ஆண்டு" : "yr"} · {period.startDate}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  );
}

export function ConditionalDashasPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [data, setData] = useState<ConditionalDashasData | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setState("loading");
    getConditionalDashas(chartId)
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

  const title = isTamil ? "நிபந்தனை நக்ஷத்ர தசைகள் (7)" : "Conditional Nakshatra Dashas (7)";
  const subtitle = isTamil
    ? "பிறப்பு நிபந்தனையால் தேர்ந்தெடுக்கப்படும் விம்சோத்தரி வகைகள் · சோதனை நிலை — காட்சிக்கு மட்டும், மதிப்பெண்ணில் பயன்படுத்தப்படவில்லை"
    : "Vimshottari variants selected by a birth condition · Experimental — display only, not used in any scoring path";

  const applicabilityByKey = new Map<string, ConditionalDashaApplicabilityResult>(
    (data?.applicability.results ?? []).map((r) => [r.key, r]),
  );

  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <p style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", margin: "0 0 var(--space-2) 0", lineHeight: 1.5 }}>{subtitle}</p>
      {state === "loading" && (
        <p style={{ color: "var(--color-faint)", fontSize: "var(--text-base)", margin: 0 }}>{isTamil ? "ஏற்றுகிறது…" : "Loading…"}</p>
      )}
      {state === "error" && (
        <p style={{ color: "var(--color-mid)", fontSize: "var(--text-base)", margin: 0 }}>
          {isTamil ? "நிபந்தனை தசைகளை ஏற்ற முடியவில்லை." : "Could not load conditional dashas."}
        </p>
      )}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
          <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
            {isTamil ? "பக்ஷம்" : "Paksha"}: {data.applicability.paksha === "SHUKLA" ? (isTamil ? "சுக்ல" : "Shukla") : (isTamil ? "கிருஷ்ண" : "Krishna")}
            {data.applicability.isDayBirth !== null && (
              <>
                {" · "}
                {data.applicability.isDayBirth ? (isTamil ? "பகல் பிறப்பு" : "Day birth") : (isTamil ? "இரவு பிறப்பு" : "Night birth")}
                {data.applicability.isDayBirthApproximate ? (isTamil ? " (தோராயம்)" : " (approx.)") : ""}
              </>
            )}
          </p>
          {data.dashas.map((system) => (
            <SystemCard key={system.key} system={system} applicability={applicabilityByKey.get(system.key)} lang={lang} />
          ))}
        </div>
      )}
    </CollapsibleSection>
  );
}
