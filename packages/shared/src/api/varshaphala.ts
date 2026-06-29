import { getApiClient } from "./client";

export interface VarshaphalaAreaOutlook {
  area: string;
  score: number;
  narrativeTa: string;
  narrativeEn: string;
  favourableMonths: number[];
}

export interface VarshaphalaData {
  chartId: string;
  year: number;
  solarReturnDate: string;
  solarReturnLagnaRasi: number;
  solarReturnLagnaName: string;
  munthaRasi: number;
  munthaRasiName: string;
  munthaHouseFromSrLagna: number;
  yearLord: string;
  yearLordHouse: number;
  areaOutlook: VarshaphalaAreaOutlook[];
}

export function getVarshaphala(
  chartId: string,
  year: number,
): Promise<{ success: boolean; data: VarshaphalaData }> {
  return getApiClient().get(
    `/charts/${chartId}/varshaphala`,
    { year },
  ) as Promise<{ success: boolean; data: VarshaphalaData }>;
}
