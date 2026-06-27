import { getApiClient } from "./client";

export interface VargaData {
  name: string;
  label: string;
  labelTa: string;
  positions: Record<string, number>;
}

export interface VargasResult {
  chartId: string;
  vargas: VargaData[];
}

const VARGA_META: Record<string, { label: string; labelTa: string }> = {
  D1: { label: "Rasi", labelTa: "ராசி" },
  D9: { label: "Navamsa", labelTa: "நவாம்சம்" },
  D10: { label: "Dashamsa", labelTa: "தசாம்சம்" },
  D2: { label: "Hora", labelTa: "ஹோரா" },
  D3: { label: "Dreshkana", labelTa: "திரேஷ்காணம்" },
  D7: { label: "Saptamsa", labelTa: "சப்தாம்சம்" },
  D12: { label: "Dvadashamsa", labelTa: "துவாதசாம்சம்" },
};

export const vargaKeys = {
  chart: (chartId: string) => ["vargas", chartId] as const,
};

export async function getVargas(
  chartId: string,
): Promise<{ success: boolean; data: VargasResult }> {
  const res = (await getApiClient().get(`/charts/${encodeURIComponent(chartId)}`)) as {
    success: boolean;
    data: { vargas: Record<string, Record<string, number>> };
  };
  const raw = res.data?.vargas ?? {};
  const priority = ["D1", "D9", "D10", "D2", "D3", "D7", "D12"];
  const vargas: VargaData[] = priority
    .filter((key) => raw[key])
    .map((key) => ({
      name: key,
      label: VARGA_META[key]?.label ?? key,
      labelTa: VARGA_META[key]?.labelTa ?? key,
      positions: raw[key],
    }));
  return { success: true, data: { chartId, vargas } };
}
