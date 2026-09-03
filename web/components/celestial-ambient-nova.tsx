"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import type { MoonPhase } from "@/lib/lunar";
import { HeroMoonGlyph } from "./celestial-glyph-nova";

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
 *    can't read, so light shows a soft daytime-gold crown and re-pigments the
 *    specks as warm gold dust motes (same twinkle loop, legible ground).
 *    Moon-aware too — a fuller moon lifts the night wash + star
 *    brightness, so Pournami reads luminous and Amavasai reads as a deep, dim
 *    new-moon night (mirrors HeroSkyBackdrop's `nightLift`).
 *
 *  • `HeroSkyBackdrop` — a full-bleed sky *inside* the Today greeting hero,
 *    aware of both time of day and the real moon phase (fuller moon → brighter,
 *    cooler night). Content in the hero stacks above it. At dusk/night it also
 *    floats a large real-phase moon (`HeroMoonGlyph`, the same tithi math as the
 *    hero's small waxing/waning chip, just scaled up) into the top-right corner,
 *    and at every hour a faint gold `RasiChakraBackdrop` wheel bleeds off the
 *    same corner underneath it — both are pure atmosphere, so they're kept
 *    extremely low-opacity and never gate on data the way the moon does.
 *
 *  • `RasiChakraBackdrop` / `DeepDiveOrbitGlyph` — small reusable decorative
 *    glyphs (hairline gold wheel; tilted "rings + orbiting bodies" motif) for
 *    dressing up card corners elsewhere on the dashboard (e.g. the Today tab's
 *    "Why this prediction?" deep-dive card). Purely ornamental — no chart data
 *    is threaded into their geometry, unlike the moon.
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
  // Dark canvas: stars, and only from dusk on. Light canvas: the same speck
  // field and the same twinkle loop, but read as warm dust motes in daylight —
  // so it runs at every hour instead. Dropping it on light (the original
  // behaviour) left the light theme with no ambient motion anywhere on the page.
  const showStars = isLight || tod === "night" || tod === "dusk";

  // Fullness 0 (Amavasai) → 1 (Pournami). Null moon (no panchangam) sits mid so
  // the sky still looks right. Drives the night wash + star brightness lift,
  // matching HeroSkyBackdrop's `nightLift` language.
  const fraction = moon?.fraction ?? 0.5;
  const nightAlpha = 0.13 + 0.13 * fraction; // Amavasai 0.13 → Pournami 0.26

  // Top-anchored radial crown of light — a bounded band (not the whole column)
  // so the colour stays a gentle glow near the header and never washes over the
  // content further down the scroll. On the light canvas we never go indigo:
  // a single soft daytime-gold crown at every hour.
  const darkCrown: Record<TimeOfDay, string> = {
    dawn: "radial-gradient(120% 100% at 50% 0%, rgba(255,196,140,0.16) 0%, rgba(255,196,140,0) 62%)",
    day: "radial-gradient(120% 100% at 50% 0%, rgba(212,175,95,0.10) 0%, rgba(212,175,95,0) 60%)",
    dusk: "radial-gradient(120% 100% at 50% 0%, rgba(120,90,160,0.18) 0%, rgba(120,90,160,0) 64%)",
    night: `radial-gradient(120% 100% at 50% 0%, rgba(120,124,200,${nightAlpha}) 0%, rgba(70,72,140,0) 66%)`,
  };
  const lightCrown = "radial-gradient(120% 100% at 50% 0%, rgba(201,151,28,0.13) 0%, rgba(201,151,28,0) 62%)";
  const crown = isLight ? lightCrown : darkCrown[tod];

  // Star brightness rides fullness at night; dusk stays a low, even glimmer.
  // Light's motes ignore the moon (a daylight page has no phase to express) and
  // sit at one restrained alpha — they are texture in the page gutters, not a
  // sky. No halo either: a glow around a dark speck on cream reads as a smudge.
  const starOpacity = isLight ? 0.34 : tod === "night" ? 0.45 + 0.4 * fraction : 0.4;
  const glowPx = 3 + 3 * fraction;
  const glowAlpha = 0.4 + 0.3 * fraction;
  const starFill = isLight ? "#8A6410" : "#f3ecdd";
  const starShadow = isLight ? "none" : `0 0 ${glowPx}px rgba(243,236,221,${glowAlpha})`;

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
                  background: starFill,
                  boxShadow: starShadow,
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

// Established "Nova gold" — the same rgb triple already used for hairline
// gold borders elsewhere in this file's stylesheet (dashboard-nova.css'
// `.cd-shell .cd-footer` border). Kept as a literal here (not a --color-*
// token) because these glyphs, like the star field above, are fixed sky
// furniture rather than theme-reactive UI chrome.
// Used by the pieces of sky furniture that are the same on both canvases (the
// orbit glyph's ring/glow, drawn over its own opaque art). The pieces that sit
// directly on the page or hero ground instead read --nova-chakra-ink /
// --nova-speck from the stylesheet: this highlight gold is *lighter* than
// Nova-light's cream-greige, so anything hairline drawn in it vanishes there.
const NOVA_GOLD = "212, 175, 95";

const CHAKRA_SPOKES = Array.from({ length: 12 }, (_, i) => i * 30);

/**
 * Faint hairline zodiac wheel — two rings + 12 spokes, gold-on-transparent,
 * no signs or labels drawn on it (the real 12-rasi artwork lives in
 * `zodiac-images.ts`; this is pure atmosphere, not a chart). Meant to bleed
 * off a card corner at very low opacity, oversized. `spin` drives the same
 * 240s hairline drift `.nova-wheel-spin` gives the deep-dive orbit glyph —
 * slow enough to read as "time turning", not an obviously moving graphic.
 */
export function RasiChakraBackdrop({
  size = 420,
  opacity = 0.07,
  spin = true,
  className,
  style,
}: {
  size?: number;
  opacity?: number;
  spin?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  // Themed in CSS (--nova-chakra-ink, both palette blocks) rather than by
  // reading data-theme in JS: this component has no mounted guard, so a JS read
  // would render dark on the server and light on the client and trip hydration.
  // CSS resolves per-theme at paint with no such split.
  // Fallback is the dark value, so the wheel still paints if this ever renders
  // outside .cd-shell (where the token is defined) instead of falling back to
  // an invalid value and painting black.
  const gold = `rgba(${NOVA_GOLD}, 0.9)`;
  const chakraInk = `var(--nova-chakra-ink, ${gold})`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={className}
      style={{ display: "block", opacity, ...style }}
    >
      <g className={spin ? "nova-wheel-spin" : undefined}>
        <circle cx="100" cy="100" r="96" fill="none" stroke={chakraInk} strokeWidth="1" />
        <circle cx="100" cy="100" r="62" fill="none" stroke={chakraInk} strokeWidth="1" />
        <circle cx="100" cy="100" r="5" fill={chakraInk} />
        {CHAKRA_SPOKES.map((deg) => (
          <g key={deg} transform={`rotate(${deg} 100 100)`}>
            <line x1="100" y1="4" x2="100" y2="38" stroke={chakraInk} strokeWidth="1" />
            <circle cx="100" cy="4" r="2.2" fill={chakraInk} />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * Ringed-planet-and-moons illustration — a dedicated piece of art (not a
 * background wash) sized for its own column beside the Today tab's "Why this
 * prediction?" tiles. A gas-giant sphere (directional gold-lit gradient,
 * echoing the terminator lighting the moon glyphs use) inside a single tilted
 * gold ring that passes both behind and in front of the globe, with a smaller
 * companion moon on its own orbit. Built entirely from gradients/shapes rather
 * than a literal Saturn icon, so it never implies a specific graha is being
 * read — it's atmosphere for "three influences orbiting one reading", not a
 * chart.
 */
export function DeepDiveOrbitGlyph({
  size = 190,
  opacity = 1,
  className,
  style,
}: {
  size?: number;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const gid = "deepdive-orbit";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={className}
      style={{ display: "block", opacity, overflow: "visible", ...style }}
    >
      <defs>
        <radialGradient id={`${gid}-planet`} cx="34%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f3ead2" />
          <stop offset="38%" stopColor="#a99bd6" />
          <stop offset="100%" stopColor="#241f42" />
        </radialGradient>
        <radialGradient id={`${gid}-moon`} cx="36%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#efe6f7" />
          <stop offset="100%" stopColor="#4b4372" />
        </radialGradient>
        <radialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`rgba(${NOVA_GOLD}, 0.35)`} />
          <stop offset="100%" stopColor={`rgba(${NOVA_GOLD}, 0)`} />
        </radialGradient>
        {/* Near (front) half of the ring's own tilted plane. Referenced by an
            ellipse that carries the same rotate() as the ring, so this rect is
            evaluated in the ring's local frame: y ≥ centre keeps the lower
            (viewer-facing) half, i.e. the arc that should cross in front of
            the globe. */}
        <clipPath id={`${gid}-front`} clipPathUnits="userSpaceOnUse">
          <rect x="-40" y="110" width="288" height="160" />
        </clipPath>
      </defs>

      {/* Ambient glow behind the whole composition. */}
      <circle cx="104" cy="104" r="96" fill={`url(#${gid}-glow)`} className="nova-celestial__glow" />

      {/* Rear arc of the ring, drawn *behind* the planet at a dimmer gold —
          the opaque sphere painted next blots out the stretch that passes
          behind the globe. */}
      <ellipse cx="104" cy="110" rx="90" ry="29" fill="none" stroke={`rgba(${NOVA_GOLD}, 0.5)`} strokeWidth="2.5" transform="rotate(-15 104 110)" />

      {/* The planet. */}
      <circle cx="104" cy="100" r="46" fill={`url(#${gid}-planet)`} />
      <circle cx="104" cy="100" r="46" fill="none" stroke={`rgba(${NOVA_GOLD}, 0.4)`} strokeWidth="0.75" />

      {/* Near arc of the same ring, drawn *over* the planet at full gold and
          clipped to the front half of the ring plane — this is the piece the
          old single-ellipse version dropped, which made the ring read as a
          lone arc floating off one side. Rear-dim + near-bright also gives the
          ring front-to-back depth. The rotation lives on the wrapping <g> (not
          the ellipse) so the userSpaceOnUse clip rect is unambiguously
          evaluated in the ring's rotated frame. */}
      <g transform="rotate(-15 104 110)">
        <ellipse cx="104" cy="110" rx="90" ry="29" fill="none" stroke={`rgba(${NOVA_GOLD}, 0.95)`} strokeWidth="2.5" clipPath={`url(#${gid}-front)`} />
      </g>

      {/* Companion moon. */}
      <circle cx="42" cy="150" r="17" fill={`url(#${gid}-moon)`} />
      <circle cx="42" cy="150" r="17" fill="none" stroke={`rgba(${NOVA_GOLD}, 0.35)`} strokeWidth="0.75" />

      {/* Twinkling star specks. */}
      <circle cx="168" cy="52" r="2.6" fill="var(--nova-speck, #f3ecdd)" className="nova-celestial__star" style={{ animationDelay: "0.3s" }} />
      <circle cx="24" cy="70" r="2" fill="var(--nova-speck, #f3ecdd)" className="nova-celestial__star" style={{ animationDelay: "1.1s" }} />
      <circle cx="150" cy="170" r="2.2" fill="var(--nova-speck, #f3ecdd)" className="nova-celestial__star" style={{ animationDelay: "1.9s" }} />
      {/* Small sparkle accent, top of frame. */}
      <path d="M178 20 L180 27 L187 29 L180 31 L178 38 L176 31 L169 29 L176 27 Z" fill={`rgba(${NOVA_GOLD}, 0.85)`} />
    </svg>
  );
}

/** Full-bleed sky inside the Today greeting hero. Theme-aware for the same
 *  reason CelestialAmbientNova is: every colour below was authored against the
 *  navy canvas, and on Nova-light's cream-greige hero (surface-soft #EAE3D6 →
 *  surface-3) each one is *lighter* than its own ground — the layer rendered,
 *  animated, and was invisible. Light gets its own warm palette rather than
 *  being switched off, so the hero keeps its ambient motion in both themes. */
export function HeroSkyBackdrop({ moon }: { moon: MoonPhase | null }) {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(new Date().getHours());
    const id = setInterval(() => setHour(new Date().getHours()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const isLight = useIsLightTheme();
  if (hour === null) return null;

  const tod = timeOfDay(hour);
  const isNight = tod === "night" || tod === "dusk";
  const fraction = moon?.fraction ?? 0;

  // Warmer by day, indigo by night; a fuller moon lifts the night brightness so
  // Pournami and Amavasai read differently even here.
  const nightLift = 0.08 + 0.14 * fraction;
  const darkSky: Record<TimeOfDay, string> = {
    dawn: "radial-gradient(120% 130% at 82% -20%, rgba(255,200,140,0.20), rgba(255,200,140,0) 60%)",
    day: "radial-gradient(120% 130% at 82% -20%, rgba(255,214,130,0.16), rgba(255,214,130,0) 60%)",
    dusk: "radial-gradient(120% 130% at 82% -20%, rgba(150,120,190,0.22), rgba(120,90,160,0) 62%)",
    night: `radial-gradient(120% 130% at 82% -20%, rgba(150,152,220,${nightLift}), rgba(70,72,140,0) 62%)`,
  };
  // Light-canvas twins: the same four moments, but keyed to hues *darker* than
  // the cream ground so the wash is visible as a tint instead of vanishing into
  // it. Same corner, same falloff — only the pigment changes.
  const lightNightLift = 0.12 + 0.10 * fraction;
  const lightSky: Record<TimeOfDay, string> = {
    dawn: "radial-gradient(120% 130% at 82% -20%, rgba(214,124,44,0.20), rgba(214,124,44,0) 60%)",
    day: "radial-gradient(120% 130% at 82% -20%, rgba(201,151,28,0.18), rgba(201,151,28,0) 60%)",
    dusk: "radial-gradient(120% 130% at 82% -20%, rgba(146,94,52,0.20), rgba(124,90,166,0) 62%)",
    night: `radial-gradient(120% 130% at 82% -20%, rgba(96,82,152,${lightNightLift}), rgba(96,82,152,0) 62%)`,
  };
  const sky = isLight ? lightSky[tod] : darkSky[tod];
  const tone = isLight ? "light" : "dark";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        background: sky,
        overflow: "hidden",
      }}
    >
      {/* Faint gold chakra, every hour — the hero's otherwise-empty daytime
          corner gets the same quiet mandala texture the night sky gets from
          its stars. Bled off the top-right corner, well behind everything.
          This slow 240s spin is the hero's one always-on ambient motion, so on
          light it takes the deep bronze gold and roughly double the alpha: the
          highlight gold at 0.055 was a hairline lighter than cream, i.e. the
          whole animation was running invisibly. */}
      <RasiChakraBackdrop
        size={380}
        opacity={isLight ? 0.1 : 0.055}
        className="nova-hero-glyph"
        style={{ position: "absolute", top: "-120px", right: "-90px" }}
      />
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
              /* Cream specks are invisible on the cream hero — light reads them
                 as warm gold motes instead, keeping the twinkle loop legible. */
              fill="var(--nova-speck, #f3ecdd)"
              className="nova-celestial__star"
              opacity={isLight ? 0.45 : 0.6}
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
        </svg>
      )}
      {/* Real moon, dusk/night only — the same tithi the hero's small
          waxing/waning chip already reads, scaled up as atmosphere. */}
      {isNight && (
        <HeroMoonGlyph
          moon={moon}
          size={150}
          tone={tone}
          opacity={tod === "night" ? 0.85 : 0.55}
          className="nova-hero-glyph"
          style={{ position: "absolute", top: "-34px", right: "-18px" }}
        />
      )}
    </div>
  );
}
