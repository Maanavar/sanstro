import { getApiClient } from "./client";
import type { MuhurtaResponseData } from "../types";

export interface NatchathiramData {
  number: number;
  name_ta: string;
  name_en: string;
  deity_ta: string;
  deity_en: string;
  symbol_ta: string;
  symbol_en: string;
  pada_descriptions: { pada: number; desc_ta: string; desc_en: string }[];
  general_ta: string;
  general_en: string;
}

export interface DoshamFlag {
  name_ta: string;
  name_en: string;
  present: boolean;
  severity: "none" | "mild" | "moderate" | "severe";
  description_ta: string;
  description_en: string;
  pariharam_ta: string;
  pariharam_en: string;
}

export interface YogamEntry {
  name_ta: string;
  name_en: string;
  strength: "weak" | "moderate" | "strong";
  description_ta: string;
  description_en: string;
}

export interface PariharamEntry {
  dosha_ta: string;
  dosha_en: string;
  temples_ta: string;
  temples_en: string;
  colours_ta: string;
  colours_en: string;
  mantras_ta: string;
  mantras_en: string;
  stones_ta: string;
  stones_en: string;
}

export interface PrashanData {
  question: string;
  answer_ta: string;
  answer_en: string;
  outcome: "favorable" | "unfavorable" | "mixed";
  lagna: string;
  lagna_ta: string;
}

export interface MuhurtaPayload {
  chartId: string;
  activity: string;
  dateFrom: string;
  dateTo: string;
}

export function getNatchathiram(
  nakshatraNumber: number,
): Promise<{ success: boolean; data: NatchathiramData }> {
  return getApiClient().get(
    "/public-tools/natchathiram",
    { number: nakshatraNumber },
  ) as Promise<{ success: boolean; data: NatchathiramData }>;
}

export function getDosham(
  chartId: string,
): Promise<{ success: boolean; data: DoshamFlag[] }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/dosham`,
  ) as Promise<{ success: boolean; data: DoshamFlag[] }>;
}

export function getYogam(
  chartId: string,
): Promise<{ success: boolean; data: YogamEntry[] }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/yogam`,
  ) as Promise<{ success: boolean; data: YogamEntry[] }>;
}

export function getPariharam(
  chartId: string,
): Promise<{ success: boolean; data: PariharamEntry[] }> {
  return getApiClient().get(
    `/charts/${encodeURIComponent(chartId)}/pariharam`,
  ) as Promise<{ success: boolean; data: PariharamEntry[] }>;
}

export function getPrashan(payload: {
  question: string;
  timestamp: string;
}): Promise<{ success: boolean; data: PrashanData }> {
  return getApiClient().post("/public-tools/prashan", payload) as Promise<{
    success: boolean;
    data: PrashanData;
  }>;
}

export function getMuhurta(
  params: MuhurtaPayload,
): Promise<{ success: boolean; data: MuhurtaResponseData }> {
  return getApiClient().get("/muhurta", {
    chartId: params.chartId,
    activity: params.activity,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  }) as Promise<{
    success: boolean;
    data: MuhurtaResponseData;
  }>;
}