"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import { EASE_NOVA } from "@/lib/motion";

/**
 * Post-login "celestial curtain" — a short, self-contained welcome that plays
 * over the login page the moment auth succeeds, then hands off to the dashboard.
 *
 * It speaks the same "celestial reveal" language as the Nova dashboard: the deep
 * indigo night sky + silver/gold palette of `CelestialGlyphNova`, the `EASE_NOVA`
 * settle, the twinkling-star ambience. The centrepiece is a jyotisha wheel that
 * draws itself — an outer ring of 27 nakshatra dots, a main ring that strokes in,
 * the 12 rasi glyphs fading in around it, and a luminary (sun by day, moon by
 * night) blooming at the hub — settling a few degrees into alignment.
 *
 * Deliberately kept on the *login* route (not persisted across navigation): when
 * it finishes it calls `onDone`, which does the actual `router.push`. That means
 * there is no way for a full-screen overlay to get stranded on top of the app.
 *
 * Fully reduced-motion-safe (collapses to a calm static frame + quick fade) and
 * skippable at any time (tap / Escape / Enter / Space).
 */

const RASI_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const NAKSHATRA_COUNT = 27;

// Fixed star field (percent of viewport) — fixed, not random, so it composes
// the same every time and never fights hydration.
const STARS: Array<{ x: number; y: number; r: number; delay: number }> = [
  { x: 12, y: 18, r: 1.4, delay: 0.0 },
  { x: 24, y: 68, r: 1.0, delay: 0.9 },
  { x: 9, y: 44, r: 1.1, delay: 1.6 },
  { x: 33, y: 30, r: 0.9, delay: 0.4 },
  { x: 18, y: 82, r: 1.2, delay: 2.1 },
  { x: 44, y: 12, r: 1.0, delay: 1.2 },
  { x: 68, y: 16, r: 1.3, delay: 0.6 },
  { x: 82, y: 26, r: 1.0, delay: 1.9 },
  { x: 90, y: 52, r: 1.2, delay: 0.3 },
  { x: 76, y: 74, r: 0.9, delay: 1.5 },
  { x: 88, y: 84, r: 1.1, delay: 2.4 },
  { x: 60, y: 88, r: 1.0, delay: 0.8 },
  { x: 52, y: 62, r: 0.8, delay: 2.0 },
  { x: 66, y: 44, r: 0.9, delay: 1.1 },
  { x: 38, y: 90, r: 1.0, delay: 0.5 },
  { x: 95, y: 12, r: 0.9, delay: 1.7 },
];

const CX = 110;
const CY = 110;

/** Whole days since the account's last dashboard visit, read from the same
 *  `vinaadi-streak` localStorage entry `useStreak` maintains. Same-device only —
 *  returns null on a fresh device / cleared storage, which safely collapses to
 *  the ordinary "Welcome back". Reliable here because the login page never mounts
 *  `useStreak`, so this still holds the *previous* visit, not today. */
function daysSinceLastVisit(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("vinaadi-streak");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lastVisit?: string };
    if (!parsed.lastVisit) return null;
    const last = new Date(`${parsed.lastVisit}T00:00:00`);
    if (Number.isNaN(last.getTime())) return null;
    const diff = Math.floor((Date.now() - last.getTime()) / 86_400_000);
    return diff >= 0 ? diff : null;
  } catch {
    return null;
  }
}

/** Absence (in days) past which a returning user is welcomed back warmly rather
 *  than routinely — the transits really have moved on by a month. */
const LONG_ABSENCE_DAYS = 30;

/** Point on a circle, measuring degrees clockwise from the top (12 o'clock). */
function pt(r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

export function LoginWelcomeNova({
  onDone,
  firstTime = false,
  grand = false,
  milestoneLabel,
}: {
  onDone: () => void;
  /** True when the account has no birth chart yet (heading to setup) — a genuine
   *  first arrival, not a return. Shifts the greeting so we don't tell a brand-new
   *  user "Welcome back" / "Casting today's sky" when we have no sky to cast. */
  firstTime?: boolean;
  /** UXD-21 — reserve the biggest animation for the biggest moments. A grand
   *  arrival (a genuine first login, or a milestone) layers a radiant ray-burst +
   *  aurora shimmer over the wheel and holds a beat longer; routine returns keep
   *  the calmer standard reveal so the grand one stands out. */
  grand?: boolean;
  /** Optional caption shown under the greeting on grand arrivals, e.g. "Your
   *  first chart" or "30-day streak". */
  milestoneLabel?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const [leaving, setLeaving] = useState(false);

  // Three arrivals, one wheel: a first-timer with no chart, a routine return, and
  // a return after a long absence. `daysAway` is read once on mount.
  const [daysAway] = useState<number | null>(() => daysSinceLastVisit());
  const longAbsence = !firstTime && daysAway != null && daysAway >= LONG_ABSENCE_DAYS;

  const enGreeting = firstTime
    ? "Welcome"
    : longAbsence
      ? "Good to see you again"
      : "Welcome back";
  const subtitle = firstTime
    ? "Let’s map your birth sky…"
    : longAbsence
      ? "It’s been a while — the sky has moved on."
      : "Casting today’s sky…";

  // Day sky → sun at the hub, night sky → moon. A tiny, free personalisation.
  const isNight = (() => {
    const h = new Date().getHours();
    return h < 6 || h >= 18;
  })();

  const accent = isNight ? "#c9caff" : "#ffd68c";
  const glyphFill = isNight ? "#e9eaff" : "#ffedcb";
  const ringStroke = isNight ? "rgba(201,202,255,0.78)" : "rgba(255,214,140,0.82)";

  const doneRef = useRef(false);
  const exitingRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const beginExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setLeaving(true);
    window.setTimeout(finish, reduce ? 320 : 520);
  }, [finish, reduce]);

  // Auto-advance after the wheel has settled. A grand arrival lingers a beat
  // longer so the extra flourish has room to breathe.
  useEffect(() => {
    const hold = reduce ? 480 : grand ? 2650 : 2050;
    const t = window.setTimeout(beginExit, hold);
    return () => window.clearTimeout(t);
  }, [beginExit, reduce, grand]);

  // Skip on key press.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        beginExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beginExit]);

  const d = (s: number) => (reduce ? 0 : s); // duration helper
  const delay = (s: number) => (reduce ? 0 : s);

  // Stagger parents. Children below carry their own hidden/show variants.
  const dotsParent: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.014, delayChildren: delay(0.18) } },
  };
  const dotItem: Variants = {
    hidden: { opacity: 0, scale: 0 },
    show: { opacity: 0.72, scale: 1, transition: { duration: d(0.4), ease: EASE_NOVA } },
  };
  const glyphsParent: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: delay(0.55) } },
  };
  const glyphItem: Variants = {
    hidden: { opacity: 0, scale: 0.4 },
    show: { opacity: 1, scale: 1, transition: { duration: d(0.5), ease: EASE_NOVA } },
  };

  return (
    <motion.div
      role="status"
      aria-label="Signing you in"
      onClick={beginExit}
      initial={{ opacity: 0 }}
      // The backdrop stays opaque through the exit on purpose: the curtain sits
      // over the still-mounted login page, so fading it out here would flash the
      // login form before navigation. Only the inner content (below) dissolves;
      // the dark sky keeps covering login until router.push swaps in the
      // dashboard. So the hand-off reads sky → dashboard, never sky → login.
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE_NOVA }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        background:
          "radial-gradient(130% 100% at 50% 16%, #241f42 0%, #17132c 58%, #0d0a1c 100%)",
        color: "#f4f1ff",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes lwn-twinkle { 0%,100%{opacity:.25} 50%{opacity:1} }
        @keyframes lwn-spin { to { transform: rotate(360deg); } }
        @keyframes lwn-breathe { 0%,100%{opacity:.45; transform:scale(1)} 50%{opacity:.8; transform:scale(1.08)} }
        .lwn-star { position:absolute; border-radius:50%; background:#f3ecff;
          box-shadow:0 0 6px rgba(233,234,255,.8); animation: lwn-twinkle 3.4s ease-in-out infinite; }
        .lwn-spin { transform-box: fill-box; transform-origin: center; animation: lwn-spin 140s linear infinite; }
        .lwn-breathe { transform-box: fill-box; transform-origin: center; animation: lwn-breathe 5.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lwn-star, .lwn-spin, .lwn-breathe { animation: none !important; }
        }
      `}</style>

      {/* Everything that lifts + dissolves on exit. */}
      <motion.div
        animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.05 : 1 }}
        transition={{ duration: leaving ? d(0.5) : 0.4, ease: EASE_NOVA }}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        {/* Twinkling star field */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {STARS.map((s) => (
            <motion.span
              key={`${s.x}-${s.y}`}
              className="lwn-star"
              initial={{ opacity: 0 }}
              animate={{ opacity: leaving ? 0 : 1 }}
              transition={{ duration: d(0.6), delay: leaving ? 0 : delay(0.1 + s.delay * 0.05) }}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.r * 2,
                height: s.r * 2,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>

        {/* The jyotisha wheel — settles a few degrees into alignment as it draws. */}
        <motion.div
          initial={{ rotate: reduce ? 0 : -14, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: d(1.2), ease: EASE_NOVA }}
          style={{ position: "relative", lineHeight: 0 }}
        >
          <svg
            width="min(58vw, 320px)"
            height="min(58vw, 320px)"
            viewBox="0 0 220 220"
            aria-hidden
            style={{ overflow: "visible", maxWidth: 320 }}
          >
            <defs>
              <radialGradient id="lwn-hub-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="lwn-lum" cx="42%" cy="38%" r="70%">
                {isNight ? (
                  <>
                    <stop offset="0%" stopColor="#fdfbff" />
                    <stop offset="70%" stopColor="#e7e2f4" />
                    <stop offset="100%" stopColor="#c7c1e0" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#fff6dc" />
                    <stop offset="55%" stopColor="#ffd873" />
                    <stop offset="100%" stopColor="#ff9f43" />
                  </>
                )}
              </radialGradient>
            </defs>

            {/* Soft glow behind the hub, breathing. */}
            <circle cx={CX} cy={CY} r={64} fill="url(#lwn-hub-glow)" className="lwn-breathe" />

            {/* Grand arrivals only — a radiant ray-burst blooms from the hub so the
                biggest moments read as bigger (UXD-21). Reduced-motion drops it. */}
            {grand && !reduce && (
              <motion.g
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.85, 0.42], scale: [0.6, 1.14, 1] }}
                transition={{ duration: 1.7, delay: 0.75, ease: EASE_NOVA, times: [0, 0.6, 1] }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const [x1, y1] = pt(24, i * 15);
                  const [x2, y2] = pt(i % 2 ? 106 : 94, i * 15);
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth={i % 2 ? 0.7 : 1.2} strokeLinecap="round" opacity={0.5} />
                  );
                })}
              </motion.g>
            )}

            {/* Outer ring of 27 nakshatra dots — slowly, endlessly turning. */}
            <motion.g className="lwn-spin" variants={dotsParent} initial="hidden" animate="show">
              {Array.from({ length: NAKSHATRA_COUNT }, (_, i) => {
                const [x, y] = pt(101, (360 / NAKSHATRA_COUNT) * i);
                return (
                  <motion.circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={1.7}
                    fill={accent}
                    variants={dotItem}
                  />
                );
              })}
            </motion.g>

            {/* Faint spokes + inner ring, fading in with the main ring. */}
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: d(0.6), delay: delay(0.5) }}
            >
              {Array.from({ length: 12 }, (_, i) => {
                const [x1, y1] = pt(55, i * 30);
                const [x2, y2] = pt(90, i * 30);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={ringStroke}
                    strokeWidth={0.75}
                    opacity={0.22}
                  />
                );
              })}
              <circle cx={CX} cy={CY} r={54} fill="none" stroke={ringStroke} strokeWidth={0.75} opacity={0.3} />
            </motion.g>

            {/* Main ring — draws itself. */}
            <motion.circle
              cx={CX}
              cy={CY}
              r={90}
              fill="none"
              stroke={ringStroke}
              strokeWidth={1.4}
              initial={{ pathLength: reduce ? 1 : 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ duration: d(0.95), delay: delay(0.25), ease: EASE_NOVA }}
            />

            {/* The 12 rasi glyphs, arriving one by one around the ring. */}
            <motion.g variants={glyphsParent} initial="hidden" animate="show">
              {RASI_GLYPHS.map((g, i) => {
                const [x, y] = pt(73, i * 30);
                return (
                  <motion.text
                    key={g}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={15}
                    fill={glyphFill}
                    variants={glyphItem}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  >
                    {g}
                  </motion.text>
                );
              })}
            </motion.g>

            {/* Luminary at the hub — blooms into place. */}
            <motion.g
              initial={{ scale: reduce ? 1 : 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: d(0.6), delay: delay(0.7), ease: EASE_NOVA }}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            >
              {isNight ? (
                <>
                  <circle cx={CX} cy={CY} r={15} fill="url(#lwn-lum)" />
                  {/* crescent bite */}
                  <circle cx={CX + 6} cy={CY - 3} r={13} fill="#17132c" opacity={0.9} />
                </>
              ) : (
                <>
                  {Array.from({ length: 12 }, (_, i) => {
                    const [x1, y1] = pt(19, i * 30);
                    const [x2, y2] = pt(26, i * 30);
                    return (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffdf95" strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
                    );
                  })}
                  <circle cx={CX} cy={CY} r={13} fill="url(#lwn-lum)" />
                </>
              )}
            </motion.g>
          </svg>
        </motion.div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: d(0.6), delay: delay(1.05), ease: EASE_NOVA }}
          style={{ textAlign: "center", position: "relative", padding: "0 20px" }}
        >
          <div
            style={{
              fontFamily: "var(--font-tamil), var(--font-display), serif",
              fontSize: "clamp(2rem, 7vw, 3rem)",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              textShadow: "0 2px 24px rgba(0,0,0,0.35)",
            }}
          >
            வணக்கம்
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: "var(--font-display), Georgia, serif",
              fontSize: "clamp(1rem, 3.4vw, 1.35rem)",
              fontWeight: 500,
              color: "#efeaff",
            }}
          >
            {enGreeting}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: "0.82rem",
              letterSpacing: "0.04em",
              color: "rgba(233,234,255,0.62)",
            }}
          >
            {subtitle}
          </div>
          {grand && milestoneLabel && (
            <motion.div
              initial={{ opacity: 0, scale: reduce ? 1 : 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: d(0.5), delay: delay(1.3), ease: EASE_NOVA }}
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 999,
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
                color: glyphFill,
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${ringStroke}`,
                boxShadow: `0 2px 18px ${accent}55`,
              }}
            >
              ✦ {milestoneLabel}
            </motion.div>
          )}
        </motion.div>

        {/* Skip hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: leaving ? 0 : 0.5 }}
          transition={{ duration: d(0.5), delay: delay(1.4) }}
          style={{
            position: "absolute",
            bottom: 28,
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            color: "rgba(233,234,255,0.55)",
          }}
        >
          Tap to continue
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
