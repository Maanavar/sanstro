"use client";

import { useEffect, useRef, useState } from "react";
import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion language for the Nova dashboard — "celestial reveal".
 *
 * One easing family, one timing scale, used by every animated Nova surface so
 * nothing is hand-tuned per component. The numeric values here mirror the CSS
 * custom properties (`--ease-nova`, `--dur-*`) defined in dashboard-nova.css —
 * keep the two in sync. Everything degrades to instant when the user prefers
 * reduced motion (see `useCountUp` below and the `prefers-reduced-motion` guard
 * at the end of dashboard-nova.css).
 */

/** Celestial settle — mirrors `--ease-nova` in dashboard-nova.css. */
export const EASE_NOVA: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Timing scale in seconds (Framer takes seconds; CSS `--dur-*` are the ms
 * twins). The dashboard is a reading workspace, so navigation settles faster
 * than a first-time data reveal; only the score has a signature-length draw.
 */
export const DUR = { fast: 0.12, base: 0.24, slow: 0.36, reveal: 0.9 } as const;

/** Container that reveals its children in sequence. Pair with `revealItem`. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

/** A single element that fades + rises into place. Pair with `staggerContainer`. */
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, ease: EASE_NOVA },
  },
};

/** Reusable "fade + rise" transition for one-off `motion` elements. */
export const revealTransition: Transition = { duration: DUR.slow, ease: EASE_NOVA };

/** SSR-safe check of the OS reduced-motion preference. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animates a number from 0 → `target` on mount (and re-eases whenever `target`
 * changes), using an ease-out curve over `duration` ms. Returns the current
 * display value (round it at the call site).
 *
 * Jumps straight to `target` — no animation — when the user prefers reduced
 * motion. SSR renders 0 and the client hydrates 0, so hydration always matches;
 * the count-up then runs immediately on the first client frame.
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(from + delta * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
