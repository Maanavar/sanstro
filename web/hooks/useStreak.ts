"use client";

import { useEffect, useState } from "react";

import "@/lib/api"; // side effect: registers the shared API client
import { pingStreak } from "@vinaadi/shared/api/streak";
import { computeStreak, todayIso, type StreakState } from "./streak-logic";

const STORAGE_KEY = "vinaadi-streak";

export type StreakResult = {
  days: number;
  best: number;
  /** True when today's visit kept an otherwise-broken streak via the grace day. */
  forgiven: boolean;
};

function readStored(): StreakState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StreakState;
  } catch {
    return null;
  }
}

function writeStored(state: StreakState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — server value is still shown for this session
  }
}

// One server ping per day, shared across all hook consumers on the page.
let inflight: { date: string; promise: Promise<number> } | null = null;

function pingServerOnce(localDays: number): Promise<number> {
  const today = todayIso();
  if (!inflight || inflight.date !== today) {
    const promise = pingStreak(localDays).then((resp) => resp.data.days);
    inflight = { date: today, promise };
    // A failed ping (guest, offline) should not poison the rest of the day.
    promise.catch(() => {
      if (inflight?.promise === promise) inflight = null;
    });
  }
  return inflight.promise;
}

export function useStreak(): StreakResult {
  const [result, setResult] = useState<StreakResult>({ days: 0, best: 0, forgiven: false });

  useEffect(() => {
    let cancelled = false;

    // Local streak first — instant value, and the guest fallback.
    const { state, forgiven } = computeStreak(readStored(), todayIso());
    writeStored(state);
    setResult({ days: state.days, best: state.best, forgiven });

    // Server streak for signed-in users; local value doubles as one-time seed.
    // (The server is authoritative for `days`; `best`/`forgiven` stay local — a
    // server-side grace day is the backend follow-up for full multi-device parity.)
    pingServerOnce(state.days)
      .then((serverDays) => {
        if (cancelled) return;
        setResult((prev) => ({ ...prev, days: serverDays, best: Math.max(prev.best, serverDays) }));
        writeStored({ ...state, days: serverDays, best: Math.max(state.best, serverDays) });
      })
      .catch(() => {
        // Guest or offline — the localStorage value stands.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
