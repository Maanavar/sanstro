"use client";

// Small presentational atoms shared by both reading views (FTR-05). Moved
// verbatim from dashboard-chart-explanation.tsx.

import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import type { ChartExplanationPlanet } from "@/lib/types";

import { tx } from "./reading-helpers";

/**
 * Why this planet scores what it scores, as an addable column.
 *
 * A bare 0-100 with no derivation is what turns every disagreement into "your
 * engine is broken": a reader seeing an exalted, vargottama Jupiter in the
 * fifties has no way to find the rasi-sandhi and house terms that put it there.
 * The rows come from the engine and sum to `strengthScore` exactly (the `clamp`
 * row carries rounding and the 10/95 limit), so the total is shown and can be
 * checked against the chip above it.
 *
 * Collapsed by default — this is the answer to "why", not the headline.
 */
export function ScoreBreakdown({ planet, lang }: { planet: ChartExplanationPlanet; lang: Lang }) {
  const rows = planet.scoreBreakdown ?? [];
  if (rows.length === 0) return null;
  const total = Math.round(rows.reduce((sum, row) => sum + row.points, 0));
  return (
    <details style={{ marginTop: "var(--space-1_5)" }}>
      <summary
        style={{
          cursor: "pointer",
          fontSize: "var(--text-xs)",
          color: "var(--color-muted)",
          listStyle: "revert",
        }}
      >
        {lang === "ta" ? "இந்த மதிப்பெண் ஏன்?" : "Why this score?"}
      </summary>
      <dl style={{ margin: "var(--space-2) 0 0", display: "grid", gap: "var(--space-1)" }}>
        {rows.map((row, index) => (
          <div
            key={`${row.key}-${index}`}
            style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", alignItems: "baseline" }}
          >
            <dt style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.4 }}>
              {tx(row.label, lang)}
              {row.detail ? (
                <span style={{ color: "var(--color-faint)" }}> · {tx(row.detail, lang)}</span>
              ) : null}
            </dt>
            <dd
              style={{
                margin: 0,
                fontSize: "var(--text-xs)",
                fontVariantNumeric: "tabular-nums",
                fontWeight: 600,
                whiteSpace: "nowrap",
                color: row.points >= 0 ? "var(--color-high)" : "var(--color-low)",
              }}
            >
              {row.points >= 0 ? "+" : ""}
              {row.points.toFixed(1)}
            </dd>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "var(--space-2)",
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--space-1)",
          }}
        >
          <dt style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text)" }}>
            {lang === "ta" ? "மொத்தம்" : "Total"}
          </dt>
          <dd
            style={{
              margin: 0,
              fontSize: "var(--text-xs)",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: "var(--color-text)",
            }}
          >
            {total}
          </dd>
        </div>
      </dl>
    </details>
  );
}

export function Chip({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: "24px",
        padding: "var(--space-0_5) var(--space-2)",
        borderRadius: "var(--radius-pill)",
        border: `1px solid ${color ? `${color}44` : "var(--color-border)"}`,
        color: color ?? "var(--color-muted)",
        background: color ? `${color}12` : "var(--color-surface-soft)",
        fontSize: "var(--text-sm)",
        fontWeight: 600,
        lineHeight: 1.25,
      }}
    >
      {children}
    </span>
  );
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      style={{
        width: "14px",
        height: "14px",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 140ms var(--ease-nova)",
      }}
    >
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(96px, 0.8fr) minmax(0, 2fr)",
        gap: "var(--space-2)",
        alignItems: "baseline",
        paddingBottom: "var(--space-2)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", lineHeight: 1.35 }}>{label}</span>
      <span style={{ fontSize: "var(--text-base)", color: "var(--color-text-strong)", fontWeight: 500, lineHeight: 1.45 }}>{value}</span>
    </div>
  );
}
