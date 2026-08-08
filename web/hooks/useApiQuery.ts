"use client";

import { useQuery, type QueryKey } from "@tanstack/react-query";

import { STALE } from "@/lib/queryClient";

/**
 * `useApiQuery` — the one read path for a panel that loads from the API.
 *
 * This is not a new abstraction; it is the one the five existing good hooks
 * (`usePlanData`, `usePersonalData`, `useFamilyData`, `useJournalData`,
 * `useMonthlyPanchangam`) already imply. What it replaces is a
 * character-for-character identical `useState` + `useEffect` + `cancelled` flag
 * block copied into six panels.
 *
 * The cost of those copies was not tidiness. Being outside react-query, each one
 * refetched on **every mount** — i.e. every tab switch, forever, for data that is
 * stable for a day. `STALE.today` is the right default here for the same reason
 * it is in `lib/queryClient.ts`: a natal chart's dashas do not change while the
 * user is clicking between tabs.
 *
 * The returned `state` deliberately keeps the vocabulary the panels already used
 * ("loading" | "error" | "idle") so the migration is a substitution rather than a
 * rewrite of every render branch, and so `<AsyncSection>` has one thing to switch
 * on.
 */
export type AsyncState = "loading" | "error" | "unavailable" | "idle";

export type UseApiQueryResult<T> = {
  data: T | undefined;
  state: AsyncState;
  error: unknown;
  refetch: () => void;
};

export function useApiQuery<T>({
  key,
  queryFn,
  enabled = true,
  staleTime = STALE.today,
  unavailableWhen,
}: {
  key: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  /**
   * Distinguish "this feature is not available for this chart" from "the request
   * failed". Only the propensities panel needs it today — it treats a 404 as an
   * empty state rather than an error — but that distinction was previously
   * expressed as a fourth value in a local `useState` union, which is exactly the
   * kind of per-copy divergence that made the six blocks stop being identical.
   */
  unavailableWhen?: (error: unknown) => boolean;
}): UseApiQueryResult<T> {
  const query = useQuery({
    queryKey: key,
    queryFn,
    enabled,
    staleTime,
  });

  let state: AsyncState = "idle";
  if (query.isPending && enabled) state = "loading";
  else if (query.isError) state = unavailableWhen?.(query.error) ? "unavailable" : "error";

  return {
    data: query.data,
    state,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
