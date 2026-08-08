"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
import type { EventWindowItem } from "@/lib/types";

export type EventType = "MARRIAGE" | "CAREER" | "FINANCE";

export type EventWindowsData = { windows: EventWindowItem[]; ageGated: boolean };

/**
 * `/charts/{id}/event-windows`, fetched once per (chart, event).
 *
 * It used to be fetched two entirely different ways: `dashboard-plan-tab-nova`
 * had a local `useEventWindowsQuery` inside react-query, and
 * `dashboard-event-windows` hand-rolled the same request with
 * `useState`/`useEffect`. Same URL, same 20-year range, two caches — so opening
 * Plan and then Life Areas put the identical request on the wire twice, and the
 * hand-rolled side did it again on every remount.
 *
 * The year range is part of the request but NOT part of the key, deliberately:
 * it is derived from `new Date()` at call time and both call sites computed the
 * same `currentYear .. currentYear + 20`. Keying on it would split the cache at
 * midnight on New Year for no benefit.
 */
export function eventWindowsKey(chartId: string, event: EventType) {
  return ["event-windows", chartId, event] as const;
}

export async function fetchEventWindows(chartId: string, event: EventType): Promise<EventWindowsData> {
  const currentYear = new Date().getFullYear();
  const res = await apiFetchJson<{ data: { windows: EventWindowItem[]; ageGated?: boolean } }>(
    `/api/v1/charts/${chartId}/event-windows?event=${event}&fromYear=${currentYear}&toYear=${currentYear + 20}`,
  );
  return { windows: res.data?.windows ?? [], ageGated: Boolean(res.data?.ageGated) };
}

export function useEventWindowsQuery(chartId: string, event: EventType, enabled = true) {
  return useQuery({
    queryKey: eventWindowsKey(chartId, event),
    queryFn: () => fetchEventWindows(chartId, event),
    enabled: enabled && !!chartId,
    staleTime: STALE.today,
  });
}
