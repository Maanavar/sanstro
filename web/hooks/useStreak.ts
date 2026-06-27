"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vinaadi-streak";

type StreakState = {
  days: number;
  lastVisit: string; // ISO date "YYYY-MM-DD"
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function useStreak(): { days: number } {
  const [days, setDays] = useState(0);

  useEffect(() => {
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setDays(state.days);
  }, []);

  return { days };
}
