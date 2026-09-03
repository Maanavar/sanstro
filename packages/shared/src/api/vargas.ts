import { getApiClient } from "./client";

export interface VargaData {
  name: string;
  label: string;
  labelTa: string;
  positions: Record<string, number>;
  reliability?: string;
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
  D24: { label: "Chaturvimsamsa", labelTa: "சதுர்விம்சாம்சம்" },
  D27: { label: "Bhamsa", labelTa: "பாம்சம்" },
  D40: { label: "Khavedamsa", labelTa: "காவேதாம்சம்" },
  D45: { label: "Akshavedamsa", labelTa: "அக்ஷவேதாம்சம்" },
  D60: { label: "Shashtiamsa", labelTa: "ஷஷ்டியாம்சம்" },
};

export const vargaKeys = {
  chart: (chartId: string) => ["vargas", chartId] as const,
};

export async function getVargas(
  chartId: string,
): Promise<{ success: boolean; data: VargasResult }> {
  const res = (await getApiClient().get(`/charts/${encodeURIComponent(chartId)}`)) as {
    success: boolean;
    data: {
      vargas: Record<string, Record<string, number>>;
      vargaReliability?: Record<string, string>;
    };
  };
  const raw = res.data?.vargas ?? {};
  const reliability = res.data?.vargaReliability ?? {};
  const priority = ["D1", "D9", "D10", "D2", "D3", "D7", "D12", "D24", "D27", "D40", "D45", "D60"];
  const vargas: VargaData[] = priority
    .filter((key) => raw[key])
    .map((key) => ({
      name: key,
      label: VARGA_META[key]?.label ?? key,
      labelTa: VARGA_META[key]?.labelTa ?? key,
      positions: raw[key],
      reliability: reliability[key],
    }));
  return { success: true, data: { chartId, vargas } };
}
