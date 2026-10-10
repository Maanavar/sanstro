import type * as Server from "../generated/api-types";
import { getApiClient } from "./client";

/*
 * Types are the server's own (A14 step 7), generated from the response model.
 * The hand-written CharaDashaData had `charKarakas: … | null`; the route always
 * sends all eight karakas (the calculation refuses the Rahu-less shape), and
 * declared `lagnaRasi: string` until 2026-10-08 although it is a rasi number.
 */
export type CharaPeriod = Server.CharaDashaPeriod;
// Jaimini Chara Karakas (BPHS Ch. 32) — see app/calculations/jaimini_karakas.py
// for the documented Rahu/tie-break conventions this project uses.
export type CharaKarakaMap = Server.CharaKarakas;
export type CharaDashaData = Server.CharaDashaData;

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
