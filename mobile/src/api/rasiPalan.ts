import { ENV } from "@/lib/env";

export interface BiText {
  ta: string;
  en: string;
}

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

export interface RasiPalanResponse {
  success: boolean;
  data?: RasiPalanData;
  // The endpoint returns fields at the top level (not nested under data)
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
  const qs = new URLSearchParams({ rasi: params.rasi });
  if (params.date) qs.set("query_date", params.date);
  if (params.lat != null) qs.set("lat", String(params.lat));
  if (params.lng != null) qs.set("lng", String(params.lng));
  if (params.timezone) qs.set("timezone", params.timezone);

  const res = await fetch(`${ENV.API_BASE_URL}/public/rasi-palan?${qs.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`rasi-palan fetch failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as RasiPalanResponse;

  // Endpoint returns fields at top level
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
