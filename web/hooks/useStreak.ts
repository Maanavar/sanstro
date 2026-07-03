"use client";

import { useEffect, useState } from "react";

import "@/lib/api"; // side effect: registers the shared API client
import { pingStreak } from "@vinaadi/shared/api/streak";

const STORAGE_KEY = "vinaadi-streak";

type StreakState = {
  days: number;
  lastVisit: string; // local date "YYYY-MM-DD"
};

function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayIso(): string {
  return toLocalIso(new Date());
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalIso(d);
}

function readLocalStreak(): StreakState {
  const today = todayIso();
  let state: StreakState = { days: 1, lastVisit: today };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StreakState>;
      if (parsed.lastVisit === today) {
        // Same day — no change needed, just surface current streak
        state = { days: parsed.days ?? 1, lastVisit: today };
      } else if (parsed.lastVisit === yesterdayIso()) {
        // Consecutive day — increment
        state = { days: (parsed.days ?? 1) + 1, lastVisit: today };
      } else {
        // Gap — reset to 1
        state = { days: 1, lastVisit: today };
      }
    }
  } catch {
    state = { days: 1, lastVisit: today };
  }
  return state;
}

function writeLocalStreak(state: StreakState): void {
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

export function useStreak(): { days: number } {
  const [days, setDays] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Local streak first — instant value, and the guest fallback.
    const local = readLocalStreak();
    writeLocalStreak(local);
    setDays(local.days);

    // Server streak for signed-in users; local value doubles as one-time seed.
    pingServerOnce(local.days)
      .then((serverDays) => {
        if (cancelled) return;
        setDays(serverDays);
        writeLocalStreak({ days: serverDays, lastVisit: todayIso() });
      })
      .catch(() => {
        // Guest or offline — the localStorage value stands.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { days };
}
