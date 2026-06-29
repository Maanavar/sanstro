import { getApiClient } from "./client";
import type { DirectPoruthamData } from "../types";

export interface PoruthamPayload {
  boyNakshatraNumber: number;
  girlNakshatraNumber: number;
}

export function getPorutham(
  payload: PoruthamPayload,
): Promise<{ success: boolean; data: DirectPoruthamData }> {
  return getApiClient().post("/public/porutham", payload) as Promise<{
    success: boolean;
    data: DirectPoruthamData;
  }>;
}
