"use client";

import { useEffect, useState } from "react";

import type { MoonPhase } from "@/lib/lunar";

/**
 * Nova celestial atmosphere — two restrained, decorative sky layers that give
 * the dashboard a "time of day" feeling without ever touching the legibility of
 * the data on top:
 *
 *  • `CelestialAmbientNova` — a low-opacity band at the TOP of the page that
 *    shifts warm-gold (day) → amber (dusk) → indigo-with-stars (night). It sits
 *    inside `.cd-page` behind opaque content cards, so it only ever shows in the
 *    page gutters. Aria-hidden, pointer-events none, and it fades away before it
 *    reaches the first card — never a full-surface wash that would fight text.
 *
 *  • `HeroSkyBackdrop` — a full-bleed sky *inside* the Today greeting hero,
 *    aware of both time of day and the real moon phase (fuller moon → brighter,
 *    cooler night). Content in the hero stacks above it.
 *
 * Star twinkle reuses the shared `.nova-celestial__star` class, so the global
 * `prefers-reduced-motion` guard freezes everything to a correct still.
 */

type TimeOfDay = "dawn" | "day" | "dusk" | "night";

function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

// Fixed star field (percent coords) — deterministic for stable hydration.
const AMBIENT_STARS: Array<{ x: number; y: number; r: number; delay: number }> = [
  { x: 12, y: 30, r: 1.1, delay: 0 },
  { x: 26, y: 14, r: 0.8, delay: 1.1 },
  { x: 44, y: 40, r: 1.0, delay: 0.5 },
  { x: 58, y: 20, r: 0.9, delay: 1.8 },
  { x: 71, y: 46, r: 1.2, delay: 0.3 },
  { x: 83, y: 26, r: 0.8, delay: 2.2 },
  { x: 92, y: 52, r: 1.0, delay: 1.4 },
];

/** Page-wide atmosphere band. Renders nothing until mounted so the client owns
 *  the wall-clock read (no SSR/CSR time mismatch). */
export function CelestialAmbientNova() {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(new Date().getHours());
    const id = setInterval(() => setHour(new Date().getHours()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  if (hour === null) return null;

  const tod = timeOfDay(hour);
  const isNight = tod === "night" || tod === "dusk";

  // Top-anchored radial wash that fades to nothing by ~40% down the band.
  const wash: Record<TimeOfDay, string> = {
    dawn: "radial-gradient(120% 60% at 50% 0%, rgba(255,196,140,0.16) 0%, rgba(255,196,140,0) 55%)",
    day: "radial-gradient(120% 55% at 50% 0%, rgba(212,175,95,0.10) 0%, rgba(212,175,95,0) 55%)",
    dusk: "radial-gradient(120% 62% at 50% 0%, rgba(120,90,160,0.18) 0%, rgba(120,90,160,0) 58%)",
    night: "radial-gradient(120% 65% at 50% 0%, rgba(70,72,140,0.20) 0%, rgba(70,72,140,0) 60%)",
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "420px",
        pointerEvents: "none",
        zIndex: 0,
        background: wash[tod],
        opacity: 0.9,
        transition: "opacity 600ms ease",
      }}
    >
      {isNight && (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}
        >
          {AMBIENT_STARS.map((s) => (
            <circle
              key={`${s.x}-${s.y}`}
              cx={s.x}
              cy={s.y}
              r={s.r * (tod === "night" ? 0.16 : 0.12)}
              fill="#f3ecdd"
              className="nova-celestial__star"
              opacity={tod === "night" ? 0.7 : 0.4}
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}

/** Full-bleed sky inside the Today greeting hero. */
export function HeroSkyBackdrop({ moon }: { moon: MoonPhase | null }) {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(new Date().getHours());
    const id = setInterval(() => setHour(new Date().getHours()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  if (hour === null) return null;

  const tod = timeOfDay(hour);
  const isNight = tod === "night" || tod === "dusk";
  const fraction = moon?.fraction ?? 0;

  // Warmer by day, indigo by night; a fuller moon lifts the night brightness so
  // Pournami and Amavasai read differently even here.
  const nightLift = 0.08 + 0.14 * fraction;
  const sky: Record<TimeOfDay, string> = {
    dawn: "radial-gradient(120% 130% at 82% -20%, rgba(255,200,140,0.20), rgba(255,200,140,0) 60%)",
    day: "radial-gradient(120% 130% at 82% -20%, rgba(255,214,130,0.16), rgba(255,214,130,0) 60%)",
    dusk: "radial-gradient(120% 130% at 82% -20%, rgba(150,120,190,0.22), rgba(120,90,160,0) 62%)",
    night: `radial-gradient(120% 130% at 82% -20%, rgba(150,152,220,${nightLift}), rgba(70,72,140,0) 62%)`,
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background: sky[tod],
        overflow: "hidden",
      }}
    >
      {isNight && (
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0 }}
        >
          {AMBIENT_STARS.slice(0, 5).map((s) => (
            <circle
              key={`${s.x}-${s.y}`}
              cx={s.x}
              cy={s.y * 0.9}
              r={s.r * 0.14}
              fill="#f3ecdd"
              className="nova-celestial__star"
              opacity={0.6}
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
