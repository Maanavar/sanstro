import { getApiClient } from "./client";
import type { PublicPoruthamGridItem, PublicPoruthamStarData } from "../types";

export interface PoruthamPayload {
  boyNakshatraNumber: number;
  girlNakshatraNumber: number;
  boyPada?: number;
  girlPada?: number;
}

export function getPorutham(
  payload: PoruthamPayload,
): Promise<{ success: boolean; data: PublicPoruthamStarData }> {
  return getApiClient().post("/public/porutham/by-star", payload) as Promise<{
    success: boolean;
    data: PublicPoruthamStarData;
  }>;
}

export interface PoruthamGridPayload {
  girlNakshatraNumber: number;
  girlPada?: number;
}

export function getPoruthamGrid(
  payload: PoruthamGridPayload,
): Promise<{ success: boolean; girlNakshatraNumber: number; results: PublicPoruthamGridItem[] }> {
  return getApiClient().post("/public/porutham/by-star/grid", payload) as Promise<{
    success: boolean;
    girlNakshatraNumber: number;
    results: PublicPoruthamGridItem[];
  }>;
}
