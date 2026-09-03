"use client";

import { tPlanetLord, type Lang } from "@/lib/i18n";
import { getYoginiDasha } from "@vinaadi/shared/api/yoginiDasha";
import { useApiQuery } from "@/hooks/useApiQuery";
import { SecondaryDashaPanel } from "./dashboard-secondary-dasha-panel";

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

const YOGINI_SEQUENCE_LENGTH = Object.keys(YOGINI_LABEL).length;

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

  return (
    <SecondaryDashaPanel
      lang={lang}
      glossaryTerm="yoginiDasha"
      title={{ ta: "யோகினி தசை — 36 ஆண்டு சுழற்சி", en: "Yogini Dasha — 36-Year Cycle" }}
      // Consistent experimental caveat so unverified engines don't wear the same
      // confidence as the validated core (UX #40).
      caveat={{
        ta: " (தேவி பாகவதம் / முஹூர்த்த சிந்தாமணி மரபு) · சோதனை நிலை, மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை",
        en: " (Devi Bhagavata / Muhurta Chintamani tradition) · Experimental, not used in any scoring path",
      }}
      error={{ ta: "யோகினி தசையை ஏற்ற முடியவில்லை.", en: "Could not load Yogini Dasha." }}
      state={state}
      onRetry={refetch}
      current={
        data && {
          mahadasha: {
            // Yogini is the only one of the three whose current mahadasha names a
            // second thing — the Yogini's ruling planet.
            name: (
              <>
                {yoginiName(data.current.mahadasha.yogini, isTamil)}
                <span style={{ fontWeight: 400, color: "var(--color-faint)", fontSize: "var(--text-sm)" }}>
                  {" · "}
                  {planetName(data.current.mahadasha.rulingPlanet, isTamil)}
                </span>
              </>
            ),
            startDate: data.current.mahadasha.startDate,
            endDate: data.current.mahadasha.endDate,
          },
          antardasha: {
            name: yoginiName(data.current.antardasha.yogini, isTamil),
            startDate: data.current.antardasha.startDate,
            endDate: data.current.antardasha.endDate,
          },
        }
      }
      // The engine builds 4 full 36-year cycles (32 mahadashas, ~144 years) so
      // long-range period lookups resolve — but a life only ever runs one. Show
      // the first cycle: 8 mahadashas, matching the "36-Year Cycle" title.
      periods={data?.mahadashas.slice(0, YOGINI_SEQUENCE_LENGTH).map((period, index) => ({
        key: `${period.startDate}-${index}`,
        name: yoginiName(period.yogini, isTamil),
        years: period.years,
        startDate: period.startDate,
        isCurrent: period.startDate === data.current.mahadasha.startDate,
      }))}
    />
  );
}
