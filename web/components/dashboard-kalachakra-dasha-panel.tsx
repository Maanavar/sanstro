"use client";

import type { Lang } from "@/lib/i18n";
import { getKalachakraDasha } from "@vinaadi/shared/api/kalachakraDasha";
import { useApiQuery } from "@/hooks/useApiQuery";
import { SecondaryDashaPanel } from "./dashboard-secondary-dasha-panel";

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
            name: data.current.mahadasha.rasiName ?? data.current.mahadasha.rasiCode,
            startDate: data.current.mahadasha.startDate,
            endDate: data.current.mahadasha.endDate,
          },
          antardasha: {
            name: data.current.antardasha.rasiName ?? data.current.antardasha.rasiCode,
            startDate: data.current.antardasha.startDate,
            endDate: data.current.antardasha.endDate,
          },
        }
      }
      periods={data?.mahadashas.map((period, index) => ({
        key: `${period.startDate}-${index}`,
        name: period.rasiName ?? period.rasiCode,
        years: period.years,
        startDate: period.startDate,
        isCurrent: period.startDate === data.current.mahadasha.startDate,
      }))}
    />
  );
}
