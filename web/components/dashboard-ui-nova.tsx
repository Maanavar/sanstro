"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Nova-only shared primitives. Kept separate from `dashboard-ui.tsx` so the
 * widely-used Classic primitive library never grows variant branching —
 * these are imported only from screens rendered under [data-ui="nova"].
 */

type NovaClampedTextProps = {
  children: string;
  lines?: number;
  maxWidth?: string;
  style?: CSSProperties;
};

/**
 * Multi-line clamp that reveals the full text in a popover on hover, and
 * toggles it (pinned open) on click/tap so it also works on touch — same
 * click/tap-to-reveal convention as GlossaryTerm, applied to a paragraph
 * instead of a single term. Only becomes interactive if the text actually
 * overflows the clamp.
 */
export function NovaClampedText({ children, lines = 3, maxWidth, style }: NovaClampedTextProps) {
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const open = overflowing && (hovering || pinned);

  useEffect(() => {
    const el = textRef.current;
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [children, lines]);

  useEffect(() => {
    if (!pinned) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(false);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", maxWidth }}
      onMouseEnter={() => overflowing && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        ref={textRef}
        role="button"
        tabIndex={overflowing ? 0 : -1}
        aria-expanded={pinned}
        onClick={() => overflowing && setPinned((v) => !v)}
        onKeyDown={(e) => {
          if (overflowing && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setPinned((v) => !v);
          }
        }}
        style={{
          ...style,
          display: "-webkit-box",
          WebkitLineClamp: lines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          cursor: overflowing ? "pointer" : "default",
        }}
      >
        {children}
      </div>
      {open && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 40,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            padding: "12px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border-strong)",
            background: "var(--color-surface)",
            boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
            whiteSpace: "pre-wrap",
            ...style,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

type NovaScoreDialProps = {
  score: number;
  max?: number;
  size?: number;
  label?: string;
  /** When set, the ring + number take this colour so the dial reads good/okay/
   *  caution at a glance (UX #64). Defaults to the neutral accent. */
  color?: string;
};

export function NovaScoreDial({ score, max = 100, size = 118, label, color }: NovaScoreDialProps) {
  const arcColor = color ?? "var(--color-accent)";
  const numberColor = color ?? "var(--color-accent-strong)";
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / max));
  const filled = pct * circ;
  const strokeWidth = size * 0.068;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
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
        <span style={{ fontFamily: "var(--font-display)", fontSize: size * 0.32, fontWeight: 600, color: numberColor, lineHeight: 1 }}>
          {Math.round(score)}
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
        background: "rgba(243, 236, 221, 0.12)",
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
                  color: "var(--color-accent)",
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
            <tr key={rowKey(row, i)} style={{ borderBottom: "1px solid rgba(243, 236, 221, 0.07)" }}>
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
