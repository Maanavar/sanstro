"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { getAshtottariDasha, type AshtottariDashaData, type AshtottariDashaPeriod } from "@vinaadi/shared/api/ashtottariDasha";
import { CollapsibleSection } from "./collapsible-section";
import { GlossaryTerm } from "./glossary-term";

// Ashtottari Dasha — 108-year secondary/comparison dasha, 8 lords, no Ketu.
// See app/calculations/ashtottari_dasha.py for the documented Ardra-adi
// (B.V. Raman / Jataka Parijata) nakshatra-lord convention this project uses.
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

// Applies / Does not apply / Needs review — informational, never hides the
// timeline (parity with the conditional-dasha selector). See app/calculations/
// ashtottari_dasha.py for the classical rule and why it is disclosed, not gated.
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
  const subtitleRest = isTamil
    ? " · சோதனை நிலை — காட்சிக்கு மட்டும், மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை"
    : " · Experimental — display only, not used in any scoring path";

  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <p style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", margin: "0 0 var(--space-2) 0" }}>
        <GlossaryTerm term="ashtottariDasha" lang={lang}>
          {isTamil ? "இரண்டாம்நிலை/ஒப்பீட்டு தசை" : "Secondary/comparison dasha"}
        </GlossaryTerm>
        {subtitleRest}
      </p>
      {state === "loading" && (
        <p style={{ color: "var(--color-faint)", fontSize: "var(--text-base)", margin: 0 }}>
          {isTamil ? "ஏற்றுகிறது…" : "Loading…"}
        </p>
      )}
      {state === "error" && (
        <p style={{ color: "var(--color-mid)", fontSize: "var(--text-base)", margin: 0 }}>
          {isTamil ? "அஷ்டோத்தரி தசையை ஏற்ற முடியவில்லை." : "Could not load Ashtottari Dasha."}
        </p>
      )}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          {data.applicability && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-1)",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: `1px solid var(--color-border)`,
                background: "var(--color-surface-soft)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {isTamil ? "பாரம்பரிய பொருத்தம்" : "Classical applicability"}
                </span>
                <StatusChip applicable={data.applicability.applicable} lang={lang} />
              </span>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
                {isTamil ? data.applicability.ruleTa : data.applicability.ruleEn}
                {data.applicability.reason ? ` · ${data.applicability.reason}` : ""}
              </p>
              {data.applicability.pakshaSupports !== null && (
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.5 }}>
                  {isTamil ? "இரண்டாம்நிலை (பக்ஷம்/பகல்-இரவு): " : "Secondary (paksha / day-night): "}
                  {data.applicability.pakshaSupports ? (isTamil ? "ஆதரிக்கிறது" : "supports") : (isTamil ? "பூர்த்தியாகவில்லை" : "not met")}
                  {data.applicability.pakshaReason ? ` · ${data.applicability.pakshaReason}` : ""}
                  {data.applicability.isDayBirthApproximate ? (isTamil ? " (தோராயம்)" : " (approx.)") : ""}
                  {/* Honesty on the tradition choice: paksha is disclosed as supportive, */}
                  {/* not a gate. When unmet, say so plainly — some lineages require it. */}
                  {!data.applicability.pakshaSupports && (
                    <span>
                      {isTamil
                        ? " — சில பாரம்பரியங்களில் இது கட்டாய இணை-நிபந்தனை; இங்கு ஆதரவாக மட்டுமே கருதப்படுகிறது, மேலே உள்ள முடிவை மாற்றாது."
                        : " — some traditions require this as a co-condition; this reading treats it as supportive only, so it does not change the verdict above."}
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              padding: "var(--space-2_5) var(--space-3)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-high-bg)",
              border: "1px solid var(--color-high-border)",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--color-score-high)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isTamil ? "தற்போதைய மஹா தசை" : "Current Mahadasha"}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {lordName(data.current.mahadasha.lord, isTamil)}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
                {data.current.mahadasha.startDate} – {data.current.mahadasha.endDate}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "var(--text-2xs)", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isTamil ? "அந்தர் தசை" : "Antardasha"}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {lordName(data.current.antardasha.lord, isTamil)}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
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
                  border: `1px solid var(--color-border)`,
                  background: period.startDate === data.current.mahadasha.startDate ? "var(--color-surface)" : "transparent",
                }}
              >
                <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                  {lordName(period.lord, isTamil)}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
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
