"use client";

import { useEffect, useState } from "react";

import type { MoonPhase } from "@/lib/lunar";

/**
 * Nova celestial atmosphere — two restrained, decorative sky layers that give
 * the dashboard a "time of day" feeling without ever touching the legibility of
 * the data on top:
 *
 *  • `CelestialAmbientNova` — a sky that fills the ENTIRE content column
 *    (`.cd-page`, `position:absolute; inset:0`), not just the hero: a warm-gold
 *    (day) → amber (dusk) → indigo (night) crown of light at the top plus a
 *    twinkling star field sprinkled the whole scroll height. Because every
 *    content card is opaque and lifted above it (zIndex 1), the sky only ever
 *    shows through the page gutters — so the whole dashboard reads as floating
 *    over a calm sky, without ever touching text legibility. It's scoped to
 *    `.cd-page` (the column right of the left rail) so it never paints over the
 *    rail/nav chrome. Stars are round div dots (an SVG stretched over a tall
 *    scroll would smear them into streaks). Aria-hidden, pointer-events none.
 *    Theme-aware: on the light cream canvas the cream stars + indigo night wash
 *    can't read, so light mode drops both and shows only a soft daytime-gold
 *    crown. Moon-aware too — a fuller moon lifts the night wash + star
 *    brightness, so Pournami reads luminous and Amavasai reads as a deep, dim
 *    new-moon night (mirrors HeroSkyBackdrop's `nightLift`).
 *
 *  • `HeroSkyBackdrop` — a full-bleed sky *inside* the Today greeting hero,
 *    aware of both time of day and the real moon phase (fuller moon → brighter,
 *    cooler night). Content in the hero stacks above it.
 *
 * Star twinkle reuses the shared `.nova-celestial__star` class, so the global
 * `prefers-reduced-motion` guard freezes everything to a correct still.
 */

/**
 * Overall strength of the page sky. The `wash` gradients below are already
 * deliberately low-alpha; this value multiplies the whole layer, so it's the
 * single knob to dial the effect up or down after seeing it on a real screen.
 * 0 = sky off, 1 = as-authored.
 */
const AMBIENT_SKY_OPACITY = 0.9;

type TimeOfDay = "dawn" | "day" | "dusk" | "night";

function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

// Fixed star field spread across the full viewport (percent coords) —
// deterministic for stable hydration, varied radius + twinkle timing so it
// reads as a real sky rather than a grid. Density is restrained: enough to feel
// present in the gutters, never so much it turns into noise.
const AMBIENT_STARS: Array<{ x: number; y: number; r: number; delay: number; dur: number }> = [
  { x: 6, y: 12, r: 1.1, delay: 0.0, dur: 3.6 },
  { x: 17, y: 34, r: 0.8, delay: 1.1, dur: 4.4 },
  { x: 9, y: 62, r: 1.0, delay: 0.5, dur: 3.2 },
  { x: 22, y: 82, r: 0.9, delay: 2.0, dur: 4.0 },
  { x: 31, y: 18, r: 1.2, delay: 0.3, dur: 3.8 },
  { x: 38, y: 48, r: 0.7, delay: 1.6, dur: 4.6 },
  { x: 27, y: 68, r: 0.9, delay: 2.4, dur: 3.4 },
  { x: 44, y: 88, r: 1.0, delay: 0.9, dur: 4.2 },
  { x: 52, y: 26, r: 0.8, delay: 1.8, dur: 3.6 },
  { x: 61, y: 54, r: 1.1, delay: 0.2, dur: 4.0 },
  { x: 56, y: 74, r: 0.8, delay: 2.6, dur: 3.0 },
  { x: 69, y: 14, r: 1.0, delay: 1.3, dur: 4.4 },
  { x: 74, y: 40, r: 0.9, delay: 0.7, dur: 3.8 },
  { x: 66, y: 90, r: 0.7, delay: 2.2, dur: 4.2 },
  { x: 83, y: 22, r: 1.2, delay: 0.4, dur: 3.4 },
  { x: 88, y: 58, r: 0.9, delay: 1.5, dur: 4.0 },
  { x: 79, y: 76, r: 0.8, delay: 2.8, dur: 3.6 },
  { x: 94, y: 36, r: 1.0, delay: 1.0, dur: 4.6 },
  { x: 97, y: 70, r: 0.8, delay: 0.6, dur: 3.2 },
  { x: 48, y: 8, r: 0.9, delay: 2.1, dur: 4.2 },
];

/** Reads the resolved canvas theme. `data-theme="light"` → light cream canvas;
 *  absent (system) or `"dark"` → dark Nova canvas. A MutationObserver keeps it
 *  live when the user toggles theme without a navigation. SSR-safe initialiser
 *  (the component is client-only anyway via the mounted guard). */
function useIsLightTheme(): boolean {
  const [light, setLight] = useState<boolean>(
    () => typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "light",
  );
  useEffect(() => {
    const read = () => setLight(document.documentElement.getAttribute("data-theme") === "light");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return light;
}

/** Full-column sky (fills `.cd-page`). Renders nothing until mounted so the
 *  client owns the wall-clock read (no SSR/CSR time mismatch). Theme- and
 *  moon-aware — see the module header. */
export function CelestialAmbientNova({ moon }: { moon?: MoonPhase | null }) {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(new Date().getHours());
    const id = setInterval(() => setHour(new Date().getHours()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const isLight = useIsLightTheme();
  if (hour === null) return null;

  const tod = timeOfDay(hour);
  // Stars belong to the dark canvas only, and only from dusk on.
  const showStars = !isLight && (tod === "night" || tod === "dusk");

  // Fullness 0 (Amavasai) → 1 (Pournami). Null moon (no panchangam) sits mid so
  // the sky still looks right. Drives the night wash + star brightness lift,
  // matching HeroSkyBackdrop's `nightLift` language.
  const fraction = moon?.fraction ?? 0.5;
  const nightAlpha = 0.13 + 0.13 * fraction; // Amavasai 0.13 → Pournami 0.26

  // Top-anchored radial crown of light — a bounded band (not the whole column)
  // so the colour stays a gentle glow near the header and never washes over the
  // content further down the scroll. On the light canvas we never go indigo:
  // a single soft daytime-gold crown at every hour (cream page, no stars).
  const darkCrown: Record<TimeOfDay, string> = {
    dawn: "radial-gradient(120% 100% at 50% 0%, rgba(255,196,140,0.16) 0%, rgba(255,196,140,0) 62%)",
    day: "radial-gradient(120% 100% at 50% 0%, rgba(212,175,95,0.10) 0%, rgba(212,175,95,0) 60%)",
    dusk: "radial-gradient(120% 100% at 50% 0%, rgba(120,90,160,0.18) 0%, rgba(120,90,160,0) 64%)",
    night: `radial-gradient(120% 100% at 50% 0%, rgba(120,124,200,${nightAlpha}) 0%, rgba(70,72,140,0) 66%)`,
  };
  const lightCrown = "radial-gradient(120% 100% at 50% 0%, rgba(201,151,28,0.13) 0%, rgba(201,151,28,0) 62%)";
  const crown = isLight ? lightCrown : darkCrown[tod];

  // Star brightness rides fullness at night; dusk stays a low, even glimmer.
  const starOpacity = tod === "night" ? 0.45 + 0.4 * fraction : 0.4;
  const glowPx = 3 + 3 * fraction;
  const glowAlpha = 0.4 + 0.3 * fraction;

  return (
    <div
      className="nova-sky"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        opacity: AMBIENT_SKY_OPACITY,
        transition: "opacity 600ms ease",
        overflow: "hidden",
      }}
    >
      {/* Crown of light — bounded top band, pinned to the column top. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "min(52vh, 460px)",
          background: crown,
        }}
      />
      {/* Star field — sprinkled the full scroll height, round div dots. */}
      {showStars && (
        <div className="nova-sky__stars" style={{ position: "absolute", inset: 0 }}>
          {AMBIENT_STARS.map((s) => {
            const px = 1.4 + s.r * 1.1;
            return (
              <span
                key={`${s.x}-${s.y}`}
                className="nova-celestial__star"
                style={{
                  position: "absolute",
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: `${px}px`,
                  height: `${px}px`,
                  borderRadius: "50%",
                  background: "#f3ecdd",
                  boxShadow: `0 0 ${glowPx}px rgba(243,236,221,${glowAlpha})`,
                  opacity: starOpacity,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.dur}s`,
                }}
              />
            );
          })}
        </div>
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
