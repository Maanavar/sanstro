"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
import type { EventWindowItem } from "@/lib/types";

export type EventType = "MARRIAGE" | "CAREER" | "FINANCE";

export type EventWindowsData = { windows: EventWindowItem[]; ageGated: boolean };

/**
 * `/charts/{id}/event-windows`, fetched once per (chart, event, range).
 *
 * It used to be fetched two entirely different ways: `dashboard-plan-tab-nova`
 * had a local `useEventWindowsQuery` inside react-query, and
 * `dashboard-event-windows` hand-rolled the same request with
 * `useState`/`useEffect`. Same URL, same 20-year range, two caches — so opening
 * Plan and then Life Areas put the identical request on the wire twice, and the
 * hand-rolled side did it again on every remount.
 *
 * The range is included in the key because dashboard surfaces can intentionally
 * request different horizons.
 */
export function eventWindowsKey(chartId: string, event: EventType, yearsAhead: number) {
  return ["event-windows", chartId, event, yearsAhead] as const;
}

export async function fetchEventWindows(
  chartId: string,
  event: EventType,
  yearsAhead = 20,
): Promise<EventWindowsData> {
  const currentYear = new Date().getFullYear();
  const res = await apiFetchJson<{ data: { windows: EventWindowItem[]; ageGated?: boolean } }>(
    `/api/v1/charts/${chartId}/event-windows?event=${event}&fromYear=${currentYear}&toYear=${currentYear + yearsAhead}`,
  );
  return { windows: res.data?.windows ?? [], ageGated: Boolean(res.data?.ageGated) };
}

export function useEventWindowsQuery(chartId: string, event: EventType, enabled = true, yearsAhead = 20) {
  return useQuery({
    queryKey: eventWindowsKey(chartId, event, yearsAhead),
    queryFn: () => fetchEventWindows(chartId, event, yearsAhead),
    enabled: enabled && !!chartId,
    staleTime: STALE.today,
  });
}
