"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

import { DUR, EASE_NOVA, useCountUp } from "@/lib/motion";
import { scoreColor } from "@/lib/format";

/**
 * Nova-only shared primitives. Kept separate from `dashboard-ui.tsx` so the
 * widely-used Classic primitive library never grows variant branching —
 * these are imported only from screens rendered under [data-ui="nova"].
 */

/** Explicit outcome state for transient async status messages (DASH-08).
 *  Tone is carried as data, never inferred by sniffing the message text —
 *  wording-independent, so it works identically in Tamil. */
export type StatusMessage = { text: string; tone: "success" | "error" };

/**
 * Screen-reader-announced status line (DASH-08). The aria-live region is
 * always mounted (empty when idle) so assistive tech reliably announces
 * content changes; tone drives color via tokens, not message wording.
 */
export function StatusLive({ status, style }: { status: StatusMessage | null; style?: CSSProperties }) {
  return (
    <p
      role="status"
      aria-live="polite"
      style={{
        margin: 0,
        fontSize: "11.5px",
        color: status?.tone === "error" ? "var(--color-low)" : "var(--color-high)",
        ...style,
      }}
    >
      {status?.text ?? ""}
    </p>
  );
}

type NovaClampedTextProps = {
  children: string;
  lines?: number;
  maxWidth?: string;
  style?: CSSProperties;
  /** Trigger copy. Bilingual strings live in the caller's catalog; the defaults
   *  keep this primitive usable without one. */
  moreLabel?: string;
  lessLabel?: string;
};

/**
 * Multi-line clamp with an explicit "Read more" trigger.
 *
 * Hero review 2026-09-04, finding 14. This used to reveal on hover and pin on
 * click, with no visual affordance at all — the hero's briefing truncated mid
 * sentence ("…Ardhashtama Sani — a years-long phase, no…"), cutting off exactly
 * as the most consequential fact in the paragraph arrived, and nothing on
 * screen said the rest existed. A hover-only reveal is also nothing on touch
 * until you happen to tap the paragraph.
 *
 * The second half of the finding: `role="button"` was on the prose itself, so a
 * screen reader announced the entire briefing as one button label. The
 * paragraph is a paragraph again; the button is the button, and it owns the
 * `aria-expanded` / `aria-controls` pair.
 *
 * Expansion is inline rather than a popover — the popover overlaid whatever sat
 * under the hero and vanished on mouse-out mid-read.
 */
export function NovaClampedText({
  children,
  lines = 3,
  maxWidth,
  style,
  moreLabel = "Read more",
  lessLabel = "Show less",
}: NovaClampedTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const textId = useId();

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Measured against the clamped box, so the check has to run while clamped.
    if (expanded) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [children, lines, expanded]);

  const clamped = !expanded;

  return (
    <div style={{ maxWidth, display: "flex", flexDirection: "column", gap: "var(--space-1)", alignItems: "flex-start" }}>
      <div
        ref={textRef}
        id={textId}
        style={{
          ...style,
          ...(clamped
            ? {
              display: "-webkit-box",
              WebkitLineClamp: lines,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }
            : null),
        }}
      >
        {children}
      </div>
      {(overflowing || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={textId}
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "var(--space-1)",
            padding: 0, border: "none", background: "none", fontFamily: "inherit",
            fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-accent-strong)",
            cursor: "pointer",
          }}
        >
          {expanded ? lessLabel : moreLabel}
          {/* Both call sites are the Today hero (2026-09-04), where this is the
              lede's one continuation link — an arrow reads as "there is more of
              this" where a chevron read as a disclosure caret. The collapse
              direction still gets a chevron, since that is what it is. */}
          {expanded ? (
            <ChevronDown
              size={14}
              strokeWidth={2.5}
              aria-hidden="true"
              style={{ transform: "rotate(180deg)", transition: "transform 140ms ease" }}
            />
          ) : (
            <ArrowRight size={14} strokeWidth={2.5} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}

type NovaRevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Extra delay (seconds) — pass an index-based value to stagger a list. */
  delay?: number;
};

/**
 * Fades + rises its children into place the first time they scroll into view
 * (framer `whileInView`, fired once). Renders inert when the user prefers
 * reduced motion. Use for content below the fold — timelines, long lists —
 * where a scroll-triggered reveal reads better than an on-mount animation.
 */
export function NovaReveal({ children, className, style, delay = 0 }: NovaRevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.42, ease: EASE_NOVA, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fades its children in on mount — the settle half of a skeleton→content
 * crossfade. Mount an async panel's real content inside this once its loading
 * placeholder is gone (the placeholder unmounts, the content mounts and eases
 * in) so data doesn't hard-cut into place. Renders inert under reduced motion.
 * Unlike `NovaReveal`, this fires on mount, not on scroll — use it for
 * above-the-fold content that resolves after a fetch.
 */
export function NovaFadeIn({ children, className, style }: Omit<NovaRevealProps, "delay">) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUR.base, ease: EASE_NOVA }}
    >
      {children}
    </motion.div>
  );
}

/** FNV-1a → base36. Short, stable, and identical on server and client. */
function stableSlug(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

type NovaScoreDialProps = {
  score: number;
  max?: number;
  size?: number;
  label?: string;
  /** Optional semantic override for the ring + number. By default the dial
   *  uses the canonical score band colour. */
  color?: string;
};

export function NovaScoreDial({ score, max = 100, size = 118, label, color }: NovaScoreDialProps) {
  const scoreTone = color ?? scoreColor(score);
  const arcColor = scoreTone;
  const numberColor = scoreTone;
  const reduce = useReducedMotion();
  // Signature moment: the number counts up while the ring sweeps to fill.
  const displayScore = useCountUp(score);
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / max));
  const filled = pct * circ;
  const strokeWidth = size * 0.068;
  // Keyed by the defs' own inputs, NOT useId(). Multiple dials render on a page
  // (Life Areas, Family) and duplicate def ids would cross-reference the wrong
  // gradient/filter — but useId() is not SSR-stable here: this component is
  // SSR'd inside next/dynamic panels whose Suspense boundary can suspend on the
  // client (chunk still downloading at hydration time) without having suspended
  // during SSR, which shifts the Suspense-fork path useId() encodes and yields a
  // different id than the HTML carries. Same note in celestial-glyph-nova.tsx
  // and place-combobox.tsx.
  //
  // `size` and `arcColor` are the only things the gradient and the filter read,
  // so keying on them is exactly what "no wrong cross-reference" requires: two
  // dials that share a key emit byte-identical defs, and url(#…) resolving to
  // the first is the same paint; a caution ring beside a neutral one differs in
  // arcColor and so gets its own ids.
  const defsKey = stableSlug(`${size}:${arcColor}`);
  const gradId = `nova-dial-grad-${defsKey}`;
  const glowId = `nova-dial-glow-${defsKey}`;
  // The arc runs from its band colour into a lightened tip so the progress
  // reads as lit, not painted — the sheen the flat single-stroke ring lacked.
  // color-mix keeps it token-driven (works with the var() the callers pass).
  const tipColor = `color-mix(in srgb, ${arcColor}, #ffffff 34%)`;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={size} y2={size}>
            <stop offset="0%" stopColor={arcColor} />
            <stop offset="100%" stopColor={tipColor} />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation={size * 0.03} floodColor={arcColor} floodOpacity="0.5" />
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        {/* Rotation lives on the <g> so framer only animates the arc's
            strokeDashoffset (draw-on) without fighting a transform prop. */}
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <motion.circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - filled }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE_NOVA }}
            filter={`url(#${glowId})`}
          />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.32, fontWeight: 600, color: numberColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(displayScore)}
        </span>
        {label ? (
          <span style={{ fontSize: size * 0.085, color: "var(--color-faint)", marginTop: 2 }}>{label}</span>
        ) : (
          <span style={{ fontSize: size * 0.085, color: "var(--color-faint)", marginTop: 2 }}>/ {max}</span>
        )}
      </div>
    </div>
  );
}

type NovaProgressBarProps = {
  value: number;
  max?: number;
  tone?: "accent" | "high" | "mid" | "low";
};

const TONE_VAR: Record<NonNullable<NovaProgressBarProps["tone"]>, string> = {
  accent: "var(--color-accent)",
  high: "var(--color-high)",
  mid: "var(--color-mid)",
  low: "var(--color-low)",
};

export function NovaProgressBar({ value, max = 100, tone = "accent" }: NovaProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      style={{
        height: 5,
        borderRadius: 3,
        background: "color-mix(in srgb, var(--color-text-strong) 12%, transparent)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 3,
          background: TONE_VAR[tone],
          transition: "width 200ms ease",
        }}
      />
    </div>
  );
}

type NovaTableColumn<Row> = {
  key: string;
  header: string;
  render?: (row: Row) => React.ReactNode;
  align?: "left" | "right" | "center";
};

type NovaTableProps<Row extends Record<string, React.ReactNode>> = {
  columns: NovaTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
};

type NovaStarRowProps = {
  /** 0–5, half-steps honoured (e.g. a 0–100 score passed as score/20). */
  value: number;
  size?: number;
  /** Filled-star color — defaults to the gold accent. */
  color?: string;
};

/**
 * Five-star glance rating (homepage redesign 2026-07-18). Purely a re-encoding
 * of an existing score onto a 5-step scale — callers must derive `value` from
 * real data (score/20, alignment buckets), never invent precision. Presented
 * to assistive tech as one label, not five glyphs.
 */
export function NovaStarRow({ value, size = 13, color = "var(--color-accent-strong)" }: NovaStarRowProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (clamped >= i + 1) return { opacity: 1, color };
    if (clamped >= i + 0.5) return { opacity: 0.45, color };
    return { opacity: 0.18, color: "var(--color-text-strong)" };
  });
  return (
    <span
      role="img"
      aria-label={`${clamped.toFixed(1)} / 5`}
      style={{ display: "inline-flex", gap: "2px", fontSize: `${size}px`, lineHeight: 1 }}
    >
      {stars.map((s, i) => (
        <span key={i} aria-hidden="true" style={{ color: s.color, opacity: s.opacity }}>★</span>
      ))}
    </span>
  );
}

export function NovaTable<Row extends Record<string, React.ReactNode>>({ columns, rows, rowKey }: NovaTableProps<Row>) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align ?? "left",
                  fontSize: "0.65625rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-accent)",
                  fontWeight: 700,
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--color-border-strong)",
                  whiteSpace: "nowrap",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)} style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-text-strong) 7%, transparent)" }}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align ?? "left",
                    padding: "10px 12px",
                    color: "var(--color-text)",
                  }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
