import { getApiClient } from "./client";
import type { BiText } from "../types";

export interface RasiPalanData {
  rasi: number;
  rasiName: BiText;
  date: string;
  moonRasi: number;
  moonHouse: number;
  headline: BiText;
  body: BiText;
  luckyColor: BiText;
  luckyNumbers: number[];
  pariharam: BiText;
  tone: "positive" | "neutral" | "caution" | "warn";
}

interface RasiPalanResponse {
  success?: boolean;
  data?: RasiPalanData;
  rasi?: number;
  rasiName?: BiText;
  date?: string;
  moonRasi?: number;
  moonHouse?: number;
  headline?: BiText;
  body?: BiText;
  luckyColor?: BiText;
  luckyNumbers?: number[];
  pariharam?: BiText;
  tone?: string;
}

export async function getRasiPalan(params: {
  rasi: string;
  date?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
}): Promise<RasiPalanData> {
  const json = (await getApiClient().get(
    "/public/rasi-palan",
    {
      rasi: params.rasi,
      query_date: params.date,
      lat: params.lat,
      lng: params.lng,
      timezone: params.timezone,
    },
  )) as RasiPalanResponse;

  return {
    rasi: json.rasi ?? 1,
    rasiName: json.rasiName ?? { ta: "", en: "" },
    date: json.date ?? params.date ?? "",
    moonRasi: json.moonRasi ?? 0,
    moonHouse: json.moonHouse ?? 1,
    headline: json.headline ?? { ta: "", en: "" },
    body: json.body ?? { ta: "", en: "" },
    luckyColor: json.luckyColor ?? { ta: "", en: "" },
    luckyNumbers: json.luckyNumbers ?? [],
    pariharam: json.pariharam ?? { ta: "", en: "" },
    tone: (json.tone as RasiPalanData["tone"]) ?? "neutral",
  };
}