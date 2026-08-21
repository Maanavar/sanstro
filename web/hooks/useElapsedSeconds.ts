"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Seconds elapsed since `active` last became true, ticking once a second.
 * Resets to 0 the moment `active` goes false, so a busy button's "Searching…
 * 4s" label doesn't carry a stale count into the next click.
 */
export function useElapsedSeconds(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      startRef.current = null;
      return;
    }
    startRef.current = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return elapsed;
}
