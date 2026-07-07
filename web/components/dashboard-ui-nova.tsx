"use client";

import type { ReactNode } from "react";

/**
 * Nova-only shared primitives. Kept separate from `dashboard-ui.tsx` so the
 * widely-used Classic primitive library never grows variant branching —
 * these are imported only from screens rendered under [data-ui="nova"].
 */

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
