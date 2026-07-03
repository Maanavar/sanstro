import { getApiClient } from "./client";

export interface CharaPeriod {
  rasi: number;
  rasi_name: string;
  years: number;
  start_date: string;
  end_date: string;
}

// Jaimini Chara Karakas (BPHS Ch. 32) — see app/calculations/jaimini_karakas.py
// for the documented Rahu/tie-break conventions this project uses.
export interface CharaKarakaMap {
  ATMAKARAKA: string;
  AMATYAKARAKA: string;
  BHRATRUKARAKA: string;
  MATRUKARAKA: string;
  PITRUKARAKA: string;
  PUTRAKARAKA: string;
  GNATIKARAKA: string;
  DAARAKARAKA: string;
}

export interface CharaDashaData {
  chartId: string;
  lagnaRasi: string;
  currentPeriod: CharaPeriod | null;
  periods: CharaPeriod[];
  charKarakas: CharaKarakaMap | null;
  atmakaraka: string | null;
  karakamsaRasi: number | null;
  karakamsaRasiName: string | null;
}

export const charaDashaKeys = {
  timeline: (chartId: string) => ["chara-dasha", chartId] as const,
};

export function getCharaDasha(
  chartId: string,
): Promise<{ success: boolean; data: CharaDashaData }> {
  return getApiClient().get(
    `/charts/${chartId}/chara-dasha`,
  ) as Promise<{ success: boolean; data: CharaDashaData }>;
}
