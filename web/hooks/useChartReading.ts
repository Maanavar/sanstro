"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/api";

import {
  getOneMinuteReading,
  type OneMinuteReadingData,
} from "@vinaadi/shared/api/oneMinuteReading";
import {
  getFiveMinuteReading,
  type FiveMinuteReadingData,
} from "@vinaadi/shared/api/fiveMinuteReading";

/**
 * Fetching for the two chart readings, lifted out of their components (DXA-37).
 *
 * The reason is the length switch, not tidiness. Family & Charts now renders
 * ONE reading with a 2 min / 4 min control, and the control can only be offered
 * once we know the four-minute reading exists — that endpoint 404s for any
 * register but "self" and whenever its flag is off. So the parent has to hold
 * both requests, and it must hold them across the switch: if the data lived in
 * the two components, crossfading between them would unmount one and re-fetch
 * it on every toggle.
 *
 * Both hooks keep the behaviours their components had, because those
 * behaviours were each bought with an incident:
 *
 * - **A 404 is "absent", not "broken".** A flag-off deployment answers 404 for
 *   every chart id, and the surface renders nothing rather than an error.
 * - **The skeleton is held back 200ms.** Under that, showing and hiding a
 *   placeholder IS the layout shift, and a fast 404 would flash a placeholder
 *   for a feature that is not there.
 * - **Staleness uses a cancelled flag, not an AbortSignal.** The shared
 *   ApiClient interface carries no signal; a superseded response is ignored
 *   either way, and the distinction only matters to the socket.
 * - **Through the shared wrapper, never a hand-written path.** That package is
 *   the one place the route shape was checked against the FastAPI decorator,
 *   and two wrappers in it have silently drifted from their routes before.
 */

export type ReadingStatus = "loading" | "ready" | "absent";

export type ReadingState<T> = {
  data: T | null;
  status: ReadingStatus;
  /** True only once the wait is long enough for a placeholder to be honest. */
  showSkeleton: boolean;
};

/** Delay the placeholder; see the note above. */
function useDelayedSkeleton(status: ReadingStatus): boolean {
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (status !== "loading") {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [status]);
  return showSkeleton;
}

export type OneMinuteReadingState = ReadingState<OneMinuteReadingData> & {
  /**
   * Re-fetch after the reader answers the pending question.
   *
   * `keepOnError` is why this is exposed rather than kept private: a transient
   * failure on that re-fetch must not blank a reading that is still on screen
   * and still correct.
   */
  reload: (options?: { keepOnError?: boolean }) => Promise<void>;
};

export function useOneMinuteReading(
  chartId: string,
  { enabled = true }: { enabled?: boolean } = {},
): OneMinuteReadingState {
  const [data, setData] = useState<OneMinuteReadingData | null>(null);
  const [status, setStatus] = useState<ReadingStatus>("loading");
  const cancelledRef = useRef(false);

  const fetchInto = useCallback(
    (options?: { cancelled?: () => boolean; keepOnError?: boolean }) =>
      getOneMinuteReading(chartId)
        .then((res) => {
          if (options?.cancelled?.()) return;
          if (res.data) {
            setData(res.data);
            setStatus("ready");
          } else if (!options?.keepOnError) {
            setData(null);
            setStatus("absent");
          }
        })
        .catch(() => {
          if (options?.cancelled?.() || options?.keepOnError) return;
          setData(null);
          setStatus("absent");
        }),
    [chartId],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    cancelledRef.current = false;
    setData(null);
    setStatus("loading");
    void fetchInto({ cancelled: () => cancelled });
    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [fetchInto, enabled]);

  const reload = useCallback(
    (options?: { keepOnError?: boolean }) =>
      fetchInto({ cancelled: () => cancelledRef.current, keepOnError: options?.keepOnError }),
    [fetchInto],
  );

  return { data, status, showSkeleton: useDelayedSkeleton(status), reload };
}

export function useFiveMinuteReading(
  chartId: string,
  { enabled = true }: { enabled?: boolean } = {},
): ReadingState<FiveMinuteReadingData> {
  const [data, setData] = useState<FiveMinuteReadingData | null>(null);
  const [status, setStatus] = useState<ReadingStatus>("loading");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setData(null);
    setStatus("loading");
    getFiveMinuteReading(chartId)
      .then((res) => {
        if (cancelled) return;
        if (res.data) {
          setData(res.data);
          setStatus("ready");
        } else {
          setData(null);
          setStatus("absent");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setStatus("absent");
      });
    return () => {
      cancelled = true;
    };
  }, [chartId, enabled]);

  return { data, status, showSkeleton: useDelayedSkeleton(status) };
}

/**
 * Answering the reading's one pending question.
 *
 * The PATCH goes to the birth profile, and the reading is re-fetched with
 * `keepOnError` so a failed re-fetch leaves the question in place over a
 * reading that is still correct, rather than blanking the surface. This is the
 * only direct `apiFetchJson` here: it writes a birth-profile field, not a
 * reading, and it is the same call the component made before DXA-37 moved it.
 */
export function useAnswerPendingQuestion(
  reload: (options?: { keepOnError?: boolean }) => Promise<void>,
) {
  const [answering, setAnswering] = useState(false);

  const answer = useCallback(
    async (birthProfileId: string, field: string, value: string) => {
      setAnswering(true);
      try {
        await apiFetchJson(`/api/v1/birth-profiles/${birthProfileId}`, {
          method: "PATCH",
          body: JSON.stringify({ [field]: value }),
        });
        await reload({ keepOnError: true });
      } catch {
        // Leave the question in place; the reading below it is still correct.
      } finally {
        setAnswering(false);
      }
    },
    [reload],
  );

  return { answering, answer };
}
