import type * as Server from "../generated/api-types";
import { getApiClient } from "./client";

/**
 * Types are the server's own (A14 step 7), generated from the response model.
 * The hand-written version omitted `tajakaPlanets`, `itthasalaPairs` and
 * `isarafaPairs`, which the route has always sent.
 */
export type VarshaphalaAreaOutlook = Server.VarshaphalaAreaOutlook;
export type VarshaphalaData = Server.VarshaphalaData;

export function getVarshaphala(
  chartId: string,
  year: number,
): Promise<{ success: boolean; data: VarshaphalaData }> {
  return getApiClient().get(
    `/charts/${chartId}/varshaphala`,
    { year },
  ) as Promise<{ success: boolean; data: VarshaphalaData }>;
}
