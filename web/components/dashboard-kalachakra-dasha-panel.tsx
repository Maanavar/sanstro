"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { getKalachakraDasha, type KalachakraDashaData, type KalachakraDashaPeriod } from "@vinaadi/shared/api/kalachakraDasha";
import { CollapsibleSection } from "./collapsible-section";
import { GlossaryTerm } from "./glossary-term";
import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";

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
  const subtitleRest = isTamil
    ? " — சோதனை நிலையில் உள்ளது, மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை"
    : " — experimental, display only, not used in any scoring path";

  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <p style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", margin: "0 0 var(--space-2) 0" }}>
        <GlossaryTerm term="kalachakraDasha" lang={lang}>
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
          {isTamil ? "காலசக்ரா தசையை ஏற்ற முடியவில்லை." : "Could not load Kalachakra Dasha."}
        </p>
      )}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          <Card
            variant="high"
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "var(--space-2)",
              padding: "var(--space-2_5) var(--space-3)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ flex: 1 }}>
              <Kicker as="p" color="var(--color-score-high)" style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>
                {isTamil ? "தற்போதைய மஹா தசை" : "Current Mahadasha"}
              </Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {data.current.mahadasha.rasiName ?? data.current.mahadasha.rasiCode}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
                {data.current.mahadasha.startDate} – {data.current.mahadasha.endDate}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <Kicker as="p" color="var(--color-faint)" style={{ margin: "0 0 var(--space-0_5)", letterSpacing: "0.08em" }}>
                {isTamil ? "அந்தர் தசை" : "Antardasha"}
              </Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                {data.current.antardasha.rasiName ?? data.current.antardasha.rasiCode}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
                {data.current.antardasha.startDate} – {data.current.antardasha.endDate}
              </p>
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {data.mahadashas.map((period: KalachakraDashaPeriod, index: number) => (
              <Card
                key={`${period.startDate}-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-1_5) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  background: period.startDate === data.current.mahadasha.startDate ? "var(--color-surface)" : "transparent",
                }}
              >
                <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                  {period.rasiName ?? period.rasiCode}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
                  {period.years} {isTamil ? "ஆண்டுகள்" : "yrs"} · {period.startDate}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}
