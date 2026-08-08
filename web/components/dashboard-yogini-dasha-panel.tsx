"use client";

import { tPlanetLord, type Lang } from "@/lib/i18n";
import { getYoginiDasha, type YoginiDashaPeriod } from "@vinaadi/shared/api/yoginiDasha";
import { useApiQuery } from "@/hooks/useApiQuery";
import { CollapsibleSection } from "./collapsible-section";
import { GlossaryTerm } from "./glossary-term";
import { AsyncSection } from "./ui/async-section";
import { Card } from "./ui/card";
import { Kicker } from "./ui/kicker";

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

function yoginiName(yogini: string, isTamil: boolean): string {
  const label = YOGINI_LABEL[yogini];
  return isTamil ? label?.ta ?? yogini : label?.en ?? yogini;
}

// The eight Yoginis above stay local — they are this system's own vocabulary and
// live nowhere else. Their RULING PLANETS were a second, redundant copy of the
// nine-graha map, and it spelled Venus "சுக்ரன்" against the app's "சுக்கிரன்",
// as did three sibling panels. `tPlanetLord` is canonical.
function planetName(planet: string, isTamil: boolean): string {
  return tPlanetLord(planet, isTamil ? "ta" : "en");
}

type Props = {
  lang: Lang;
  chartId: string;
};

export function YoginiDashaPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const { data, state, refetch } = useApiQuery({
    key: ["yogini-dasha", chartId],
    queryFn: () => getYoginiDasha(chartId).then((res) => res.data),
    enabled: !!chartId,
  });

  const title = isTamil ? "யோகினி தசை — 36 ஆண்டு சுழற்சி" : "Yogini Dasha — 36-Year Cycle";
  // Consistent experimental caveat so unverified engines don't wear the same
  // confidence as the validated core (UX #40).
  const subtitleRest = isTamil
    ? " (தேவி பாகவதம் / முஹூர்த்த சிந்தாமணி மரபு) · சோதனை நிலை, மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை"
    : " (Devi Bhagavata / Muhurta Chintamani tradition) · Experimental, not used in any scoring path";

  return (
    <CollapsibleSection title={title} defaultOpen={false}>
      <p style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", margin: "0 0 var(--space-2) 0" }}>
        <GlossaryTerm term="yoginiDasha" lang={lang}>
          {isTamil ? "இரண்டாம்நிலை/ஒப்பீட்டு தசை" : "Secondary/comparison dasha"}
        </GlossaryTerm>
        {subtitleRest}
      </p>
      <AsyncSection
        state={state}
        lang={lang}
        onRetry={refetch}
        error={{ ta: "யோகினி தசையை ஏற்ற முடியவில்லை.", en: "Could not load Yogini Dasha." }}
      />
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
                {yoginiName(data.current.mahadasha.yogini, isTamil)}
                <span style={{ fontWeight: 400, color: "var(--color-faint)", fontSize: "var(--text-sm)" }}>
                  {" · "}{planetName(data.current.mahadasha.rulingPlanet, isTamil)}
                </span>
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
                {yoginiName(data.current.antardasha.yogini, isTamil)}
              </p>
              <p style={{ margin: "var(--space-0_5) 0 0", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
                {data.current.antardasha.startDate} – {data.current.antardasha.endDate}
              </p>
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {data.mahadashas.map((period: YoginiDashaPeriod) => (
              <Card
                key={period.startDate}
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
                  {yoginiName(period.yogini, isTamil)}
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
