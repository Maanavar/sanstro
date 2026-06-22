import { apiGet } from "./client";

// Varga (divisional chart) data comes from the full chart endpoint.
// The backend returns vargas as: dict[varga_name, dict[planet, house_number]]
// e.g. { "D9": { "Sun": 4, "Moon": 7, ... }, "D10": { ... } }

export interface VargaData {
  name: string;          // "D1", "D9", "D10"
  label: string;         // "Rasi", "Navamsa", "Dashamsa"
  labelTa: string;
  positions: Record<string, number>; // planet -> house
}

export interface VargasResult {
  chartId: string;
  vargas: VargaData[];
}

const VARGA_META: Record<string, { label: string; labelTa: string; purpose: string; purposeTa: string }> = {
  D1: { label: "Rasi", labelTa: "ராசி", purpose: "Overall life", purposeTa: "ஒட்டுமொத்த வாழ்க்கை" },
  D9: { label: "Navamsa", labelTa: "நவாம்சம்", purpose: "Marriage & dharma", purposeTa: "திருமணம் & தர்மம்" },
  D10: { label: "Dashamsa", labelTa: "தசாம்சம்", purpose: "Career & status", purposeTa: "தொழில் & அந்தஸ்து" },
  D2: { label: "Hora", labelTa: "ஹோரா", purpose: "Wealth", purposeTa: "செல்வம்" },
  D3: { label: "Dreshkana", labelTa: "திரேஷ்காணம்", purpose: "Siblings", purposeTa: "உடன்பிறப்புகள்" },
  D7: { label: "Saptamsa", labelTa: "சப்தாம்சம்", purpose: "Children", purposeTa: "குழந்தைகள்" },
  D12: { label: "Dvadashamsa", labelTa: "துவாதசாம்சம்", purpose: "Parents", purposeTa: "பெற்றோர்" },
};

export const vargaKeys = {
  chart: (chartId: string) => ["vargas", chartId] as const,
};

export async function getVargas(chartId: string): Promise<{ success: boolean; data: VargasResult }> {
  const res = await apiGet<{ success: boolean; data: { vargas: Record<string, Record<string, number>> } }>(
    `/charts/${encodeURIComponent(chartId)}`
  );
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
