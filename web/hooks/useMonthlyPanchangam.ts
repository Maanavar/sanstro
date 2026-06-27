"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
import type { ApiEnvelope, PanchangamMonthlyData } from "@/lib/types";

type Location = {
  lat: number;
  lng: number;
  timezone: string;
};

type MonthlyPanchangamRequest = {
  year: number;
  month: number;
  location: Location;
};

export function useMonthlyPanchangam() {
  const [request, setRequest] = useState<MonthlyPanchangamRequest | null>(null);

  const query = useQuery({
    queryKey: [
      "panchangam",
      "monthly",
      request?.year,
      request?.month,
      request?.location.lat,
      request?.location.lng,
      request?.location.timezone,
    ],
    queryFn: async () => {
      if (!request) return null;
      const response = await apiFetchJson<ApiEnvelope<PanchangamMonthlyData>>(
        `/api/v1/panchangam/monthly${toQuery({
          year: request.year,
          month: request.month,
          lat: request.location.lat,
          lng: request.location.lng,
          timezone: request.location.timezone,
        })}`,
      );
      return response.data;
    },
    enabled: request !== null,
    staleTime: STALE.today,
  });

  const fetchMonth = useCallback((year: number, month: number, location: Location | null) => {
    setRequest(location ? { year, month, location } : null);
  }, []);

  return {
    monthlyPanchangam: query.data ?? null,
    isMonthlyPanchangamLoading: query.isFetching,
    monthlyPanchangamError: query.error ? readErrorMessage(query.error) : null,
    fetchMonthlyPanchangam: fetchMonth,
  };
}
