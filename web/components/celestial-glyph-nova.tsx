"use client";

import type { CSSProperties } from "react";
import type { MoonPhase } from "@/lib/lunar";

/**
 * Nova hero "celestial glyph" — the animated sun / moon that sits beside the
 * greeting on the Today tab. Not decoration: the moon is drawn from *today's*
 * tithi + paksha (see moonPhaseFromTithi), so the shape and size read the real
 * sky — a thin crescent on Prathamai, a full silver disc on Pournami, a small
 * dark disc on Amavasai.
 *
 * All motion here is ambient (slow ray spin, corona/glow breath, star twinkle)
 * and lives in CSS classes under [data-ui="nova"], so the dashboard's global
 * `prefers-reduced-motion` guard collapses every loop to a correct static frame
 * — the base opacity/rotation of each element is already a finished-looking
 * picture, the animation only adds life on top.
 */

type Variant = "sun" | "moon";

/** Builds the SVG path for the lit portion of the moon at a given phase.
 *  Center (cx,cy), disc radius r. `fraction` 0 (new) … 1 (full); `waxing`
 *  lights the right limb, waning the left. The terminator is a half-ellipse
 *  whose x-radius shrinks to 0 at the half-moon and grows back to r at the
 *  new/full extremes (rx = r·|1 − 2·fraction|). */
function litMoonPath(cx: number, cy: number, r: number, fraction: number, waxing: boolean): string {
  const rx = r * Math.abs(1 - 2 * fraction);
  const gibbous = fraction > 0.5;
  const outerSweep = waxing ? 1 : 0;
  const termSweep = waxing ? (gibbous ? 1 : 0) : gibbous ? 0 : 1;
  const top = `${cx},${cy - r}`;
  const bottom = `${cx},${cy + r}`;
  return `M ${top} A ${r},${r} 0 0,${outerSweep} ${bottom} A ${rx},${r} 0 0,${termSweep} ${top} Z`;
}

// A handful of fixed star positions (percent of tile) for the night sky. Fixed
// rather than random so hydration is stable and the composition stays balanced.
const STARS: Array<{ x: number; y: number; r: number; delay: number }> = [
  { x: 18, y: 22, r: 0.9, delay: 0 },
  { x: 78, y: 16, r: 1.2, delay: 0.6 },
  { x: 30, y: 74, r: 0.8, delay: 1.4 },
  { x: 86, y: 62, r: 1.0, delay: 0.9 },
  { x: 62, y: 84, r: 0.7, delay: 2.1 },
];

export function CelestialGlyphNova({
  variant,
  moon,
  size = 60,
  ariaLabel,
  special = false,
}: {
  variant: Variant;
  /** Required when variant === "moon" — drives shape + size from the real phase. */
  moon?: MoonPhase | null;
  size?: number;
  ariaLabel?: string;
  /** On a special tithi day (Pournami / Amavasai) play a one-time gold shimmer
   *  across the tile — a restrained "signature draw" on the reveal. */
  special?: boolean;
}) {
  // Fixed per variant (not useId()) so gradient/clip ids never collide when
  // several celestial elements (hero glyph, mini chip moon, ambient) coexist,
  // while staying identical between server and client. This component is
  // SSR'd via next/dynamic with a Suspense loading fallback; useId() breaks
  // here because the boundary can suspend on the client (chunk still
  // downloading at hydration time) without having suspended during SSR,
  // which shifts useId()'s Suspense-fork path and produces different ids.
  const gid = `celestial-${variant}`;
  const isNight = variant === "moon";

  // Sky tile: warm dawn-gold by day, deep indigo by night. Full-moon nights get
  // a cooler, brighter cast so Pournami visibly reads different from Amavasai.
  const fraction = moon?.fraction ?? 0;
  const nightTop = fraction > 0.85 ? "#2b2b52" : "#221d3a";
  const sky = isNight
    ? `radial-gradient(120% 100% at 50% 0%, ${nightTop} 0%, #16122a 100%)`
    : "radial-gradient(120% 100% at 50% 0%, #ffe6b0 0%, #ffcf8a 55%, #f6b271 100%)";

  return (
    <span
      role="img"
      aria-label={ariaLabel ?? (isNight ? "Moon tonight" : "Sun today")}
      style={{
        flex: "none",
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: sky,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: isNight
          ? "inset 0 0 0 1px rgba(255,255,255,0.06)"
          : "inset 0 0 0 1px rgba(120,70,20,0.12)",
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          {isNight ? (
            <radialGradient id={`${gid}-disc`} cx="38%" cy="34%" r="75%">
              <stop offset="0%" stopColor="#fdfbff" />
              <stop offset="70%" stopColor="#e7e2f4" />
              <stop offset="100%" stopColor="#c7c1e0" />
            </radialGradient>
          ) : (
            <radialGradient id={`${gid}-disc`} cx="42%" cy="38%" r="70%">
              <stop offset="0%" stopColor="#fff6dc" />
              <stop offset="55%" stopColor="#ffd873" />
              <stop offset="100%" stopColor="#ff9f43" />
            </radialGradient>
          )}
          <radialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isNight ? "#cfd0ff" : "#ffd27a"} stopOpacity="0.7" />
            <stop offset="100%" stopColor={isNight ? "#cfd0ff" : "#ffd27a"} stopOpacity="0" />
          </radialGradient>
        </defs>

        {isNight ? (
          <MoonBody gid={gid} fraction={fraction} waxing={moon?.waxing ?? true} />
        ) : (
          <SunBody gid={gid} />
        )}
      </svg>
      {/* One-time gold shimmer on Pournami / Amavasai. Ends transparent so the
          reduced-motion guard freezes it to an invisible still. */}
      {special && <span aria-hidden="true" className="nova-celestial__shimmer" />}
    </span>
  );
}

function SunBody({ gid }: { gid: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <>
      {/* Corona — breathes slowly. */}
      <circle cx="50" cy="50" r="42" fill={`url(#${gid}-glow)`} className="nova-celestial__glow" opacity={0.65} />
      {/* Rays — spin very slowly. transform-origin handled in CSS (fill-box). */}
      <g className="nova-celestial__rays">
        {rays.map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="50"
            x2="50"
            y2="10"
            stroke="#ffdf95"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.85"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
      </g>
      {/* Core disc — drawn over ray roots so they read as a corona, not spokes. */}
      <circle cx="50" cy="50" r="20" fill={`url(#${gid}-disc)`} />
    </>
  );
}

export function MoonBody({
  gid,
  fraction,
  waxing,
  tone = "dark",
}: {
  gid: string;
  fraction: number;
  waxing: boolean;
  /** Ground this art will sit on. "dark" = the indigo sky tile / navy canvas it
   *  was drawn for. "light" = the cream-greige Nova-light hero, where the cream
   *  twinkle specks (#f3ecdd) are invisible — they switch to the deep bronze
   *  gold that Nova-light already uses for accent text, so the twinkle loop
   *  still reads as motion rather than silently disappearing. */
  tone?: "dark" | "light";
}) {
  // Disc grows with fullness: a small dark Amavasai, a large silver Pournami.
  const r = 20 + 8 * fraction; // 20 (new) … 28 (full)
  const speckFill = tone === "light" ? "#8A6410" : "#f3ecdd";
  const speckOpacity = tone === "light" ? 0.5 : 0.75;
  const lit = litMoonPath(50, 50, r, fraction, waxing);
  // Earthshine: near new moon the lit sliver is almost nothing, so the disc can
  // read as an empty hole. Lift the rim + a faint outer ring so an Amavasai moon
  // still reads as a round dark body. 1 at new … 0 by the first slim crescent.
  const earthshine = Math.max(0, 1 - fraction / 0.18);
  return (
    <>
      <defs>
        <clipPath id={`${gid}-lit-clip`}>
          <path d={lit} />
        </clipPath>
      </defs>
      {/* Halo — brighter and wider the fuller the moon; breathes slowly. */}
      <circle
        cx="50"
        cy="50"
        r={r + 14}
        fill={`url(#${gid}-glow)`}
        className="nova-celestial__glow"
        opacity={0.25 + 0.5 * fraction}
      />
      {/* Twinkling stars behind the moon. */}
      {STARS.map((s) => (
        <circle
          key={`${s.x}-${s.y}`}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={speckFill}
          className="nova-celestial__star"
          opacity={speckOpacity}
          style={{ animationDelay: `${s.delay}s` }}
        />
      ))}
      {/* Earthshine ring — only near new moon, so Amavasai reads as a body. */}
      {earthshine > 0 && (
        <circle cx="50" cy="50" r={r + 2.5} fill="none" stroke="#c4bce6" strokeWidth={1.2} opacity={0.3 * earthshine} />
      )}
      {/* Dark side of the disc, faintly visible so a crescent still reads round. */}
      <circle cx="50" cy="50" r={r} fill="#3a3556" opacity={0.55} />
      {/* Rim, strengthened near new moon where the lit edge all but vanishes. */}
      {earthshine > 0 && (
        <circle cx="50" cy="50" r={r} fill="none" stroke="#8f88b5" strokeWidth={0.9} opacity={0.5 * earthshine} />
      )}
      {/* Lit portion — the real phase shape. */}
      <path d={lit} fill={`url(#${gid}-disc)`} />
      {/* Two faint maria so the lit face isn't a flat plate. Clipped to the lit
          shape so they never bleed onto the dark side of a crescent. */}
      <g clipPath={`url(#${gid}-lit-clip)`}>
        <circle cx={50 - r * 0.28} cy={50 - r * 0.18} r={r * 0.16} fill="#c7c1e0" opacity={0.35} />
        <circle cx={50 + r * 0.22} cy={50 + r * 0.26} r={r * 0.11} fill="#c7c1e0" opacity={0.28} />
      </g>
    </>
  );
}

/**
 * Tiny inline phase-moon — no sky tile, glow or stars — for sitting next to
 * text (e.g. the hero's waxing/waning chip) so the *real* moon shape shows even
 * in daylight, where the full glyph would be a sun. Same terminator math as the
 * big glyph.
 *
 * Drawn deliberately flatter than `MoonBody`: at chip size the terminator is
 * only a few pixels wide, so a soft radial-gradient face, a translucent dark
 * limb and a disc that grew with fullness all blurred together and every day
 * from roughly Ashtami to Pournami read as one full white dot — the phase was
 * being computed correctly and then thrown away at paint time. Fixed radius +
 * a solid body + a flat lit face keeps the *shape* the only thing that varies,
 * which is the one thing this glyph exists to say.
 */
export function MiniMoonGlyph({
  phase,
  size = 18,
}: {
  phase: MoonPhase;
  size?: number;
}) {
  const r = 17; // constant — same ball every day, only the shading moves
  const lit = litMoonPath(20, 20, r, phase.fraction, phase.waxing);
  // At Amavasai the lit path is a near-empty sliver, so the disc would read as
  // "nothing". Strengthen the rim the newer the moon so it still reads as a
  // round dark body. 1 at new … 0 by the first slim crescent.
  const earthshine = Math.max(0, 1 - phase.fraction / 0.12);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ display: "block", flex: "none" }}>
      <circle cx="20" cy="20" r={r} fill="var(--moon-body, #221d3a)" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="var(--moon-rim, #7d76a6)"
        strokeWidth={1.2}
        strokeOpacity={0.55 + 0.35 * earthshine}
      />
      <path d={lit} fill="var(--moon-lit, #f4f1ff)" />
    </svg>
  );
}

/**
 * Large, tile-free real-phase moon for use as a hero/card *backdrop* —
 * `CelestialGlyphNova`'s glow/stars/halo/disc art with the surrounding sky-tile
 * background and box-shadow stripped out, so the caller can float it directly
 * over their own gradient (see `HeroSkyBackdrop` in celestial-ambient-nova.tsx)
 * instead of sitting inside a rounded square. Same phase math as the small
 * chip glyphs — this is the real tithi's moon, just scaled up as atmosphere.
 */
export function HeroMoonGlyph({
  moon,
  size = 160,
  opacity = 1,
  tone = "dark",
  className,
  style,
}: {
  moon: MoonPhase | null;
  size?: number;
  opacity?: number;
  /** See MoonBody. The halo is the piece that actually breaks on light: its
   *  pale periwinkle (#cfd0ff) is lighter than the cream-greige hero it floats
   *  on, so the `nova-celestial__glow` breathe loop animates something the eye
   *  cannot see. Light swaps it for the deep violet Nova-light already uses as
   *  --color-accent-secondary, which reads on cream at the same alpha. */
  tone?: "dark" | "light";
  className?: string;
  style?: CSSProperties;
}) {
  // Fixed, not useId() — see CelestialGlyphNova above for why.
  const gid = "celestial-hero-moon";
  const fraction = moon?.fraction ?? 0;
  const waxing = moon?.waxing ?? true;
  const glow = tone === "light" ? "#7c5aa6" : "#cfd0ff";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
      style={{ display: "block", opacity, ...style }}
    >
      <defs>
        <radialGradient id={`${gid}-disc`} cx="38%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#fdfbff" />
          <stop offset="70%" stopColor="#e7e2f4" />
          <stop offset="100%" stopColor="#c7c1e0" />
        </radialGradient>
        <radialGradient id={`${gid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.7" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <MoonBody gid={gid} fraction={fraction} waxing={waxing} tone={tone} />
    </svg>
  );
}
