"use client";

import { useCallback, useRef, useState } from "react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import type { ApiEnvelope, PanchangamMonthlyData } from "@/lib/types";

type Location = {
  lat: number;
  lng: number;
  timezone: string;
};

export function useMonthlyPanchangam() {
  const [data, setData] = useState<PanchangamMonthlyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchMonth = useCallback(async (year: number, month: number, location: Location | null) => {
    if (!location) {
      setData(null);
      setError(null);
      return;
    }

    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetchJson<ApiEnvelope<PanchangamMonthlyData>>(
        `/api/v1/panchangam/monthly${toQuery({ year, month, lat: location.lat, lng: location.lng, timezone: location.timezone })}`,
      );
      if (currentRequest !== requestId.current) return;
      setData(response.data);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setData(null);
      setError(readErrorMessage(err));
    } finally {
      if (currentRequest === requestId.current) {
        setIsLoading(false);
      }
    }
  }, []);

  return { monthlyPanchangam: data, isMonthlyPanchangamLoading: isLoading, monthlyPanchangamError: error, fetchMonthlyPanchangam: fetchMonth };
}
