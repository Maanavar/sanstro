"use client";

import { rasiDisplayName } from "@/lib/chart-utils";
import type { Lang } from "@/lib/i18n";
import { getKalachakraDasha } from "@vinaadi/shared/api/kalachakraDasha";
import { useApiQuery } from "@/hooks/useApiQuery";
import { SecondaryDashaPanel } from "./dashboard-secondary-dasha-panel";

// Kalachakra Dasha — rasi-based, non-uniform period lengths (4-21 years).
// Experimental / display only — see app/calculations/kalachakra_dasha.py for
// the cited Saravali source, the documented Portion-Zero cycle convention,
// and a discovered inconsistency in the source's own worked example. Lords are
// rasis: read the numeric `rasi` through rasiDisplayName, not the API's
// `rasiName ?? rasiCode` pair — that name is English-only and the code is the
// raw enum, so a Tamil reader got "Mithunam", or "MITHUNAM" when it was null.
// 9 rasis per Paramayus cycle (app/calculations/kalachakra_dasha.py:
// KALACHAKRA_CHAKRAS — every chakra/pada sequence is 9 rasis long).
const KALACHAKRA_SEQUENCE_LENGTH = 9;

type Props = {
  lang: Lang;
  chartId: string;
};

export function KalachakraDashaPanel({ lang, chartId }: Props) {
  const { data, state, refetch } = useApiQuery({
    key: ["kalachakra-dasha", chartId],
    queryFn: () => getKalachakraDasha(chartId).then((res) => res.data),
    enabled: !!chartId,
  });

  return (
    <SecondaryDashaPanel
      lang={lang}
      glossaryTerm="kalachakraDasha"
      title={{ ta: "காலசக்ரா தசை", en: "Kalachakra Dasha" }}
      caveat={{
        ta: " — சோதனை நிலையில் உள்ளது, மதிப்பெண் கணக்கீட்டில் பயன்படுத்தப்படவில்லை",
        en: " — experimental, display only, not used in any scoring path",
      }}
      error={{ ta: "காலசக்ரா தசையை ஏற்ற முடியவில்லை.", en: "Could not load Kalachakra Dasha." }}
      state={state}
      onRetry={refetch}
      current={
        data && {
          mahadasha: {
            name: rasiDisplayName(data.current.mahadasha.rasi, lang),
            startDate: data.current.mahadasha.startDate,
            endDate: data.current.mahadasha.endDate,
          },
          antardasha: {
            name: rasiDisplayName(data.current.antardasha.rasi, lang),
            startDate: data.current.antardasha.startDate,
            endDate: data.current.antardasha.endDate,
          },
        }
      }
      // The engine builds 3 full Paramayus cycles (27 mahadashas, ~250-300
      // years) so long-range period lookups resolve — but a life only ever
      // runs one. Show the first cycle: 9 mahadashas (the birth pada's own
      // Paramayus, 83-100 years).
      periods={data?.mahadashas.slice(0, KALACHAKRA_SEQUENCE_LENGTH).map((period, index) => ({
        key: `${period.startDate}-${index}`,
        name: rasiDisplayName(period.rasi, lang),
        years: period.years,
        startDate: period.startDate,
        isCurrent: period.startDate === data.current.mahadasha.startDate,
      }))}
    />
  );
}
