"use client";

// Small drawn pieces for the Story view (plan §6). Every colour is a Nova
// token; the only motion is a one-shot draw-in or rise whose *base* state is
// the finished frame, so the global reduced-motion guard (which collapses
// animation-duration) always leaves the complete picture on screen.

import { useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, CircleDot } from "lucide-react";

import { GRAHA_ABBR, GRAHA_ABBR_EN, rasiLabel } from "@/lib/chart-utils";
import { scoreColor } from "@/lib/format";
import { tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

import type { AspectLine, HouseTone } from "./reading-selectors";

// ── Tone: colour + icon + word, never colour alone (WCAG 1.4.1) ────────────

export type Tone = "good" | "care" | "steady";

export const TONE_TOKENS: Record<Tone, { fg: string; bg: string; bd: string }> = {
  good: { fg: "var(--color-high)", bg: "var(--color-high-bg)", bd: "var(--color-high-border)" },
  care: { fg: "var(--color-low)", bg: "var(--color-low-bg)", bd: "var(--color-low-border)" },
  steady: { fg: "var(--color-mid)", bg: "var(--color-mid-bg)", bd: "var(--color-mid-border)" },
};

const TONE_ICON = { good: CheckCircle2, care: AlertTriangle, steady: CircleDot } as const;

export function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const c = TONE_TOKENS[tone];
  const Icon = TONE_ICON[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-1)",
        fontSize: "var(--text-xs)",
        fontWeight: 700,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        borderRadius: "var(--radius-pill)",
        padding: "var(--space-0_5) var(--space-2)",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={12} strokeWidth={2.25} aria-hidden />
      {children}
    </span>
  );
}

// ── Strength meter: four segments, the same bands as §5's verdict words ─────

export function strengthSegments(score: number): number {
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 35) return 2;
  return 1;
}

export function StrengthMeter({ score }: { score: number }) {
  const filled = strengthSegments(score);
  const color = scoreColor(score);
  return (
    <span aria-hidden style={{ display: "inline-flex", gap: "3px" }}>
      {[1, 2, 3, 4].map((segment) => (
        <span
          key={segment}
          style={{
            width: "12px",
            height: "5px",
            borderRadius: "var(--radius-pill)",
            background: segment <= filled ? color : "var(--color-border)",
          }}
        />
      ))}
    </span>
  );
}

// ── Paral dots: the 0-8 Bhinnashtakavarga scale drawn as the dots it counts ─

export function ParalDots({ bindus, tone }: { bindus: number; tone: Tone }) {
  const color = TONE_TOKENS[tone].fg;
  return (
    <span aria-hidden style={{ display: "inline-flex", gap: "3px", alignItems: "center" }}>
      {Array.from({ length: 8 }, (_, index) => (
        <span
          key={index}
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: index < bindus ? color : "transparent",
            border: `1.5px solid ${index < bindus ? color : "var(--color-border-strong)"}`,
          }}
        />
      ))}
    </span>
  );
}

// ── Period bar: elapsed share of a dasa period with a "today" playhead ─────

export function PeriodBar({ progress, tone, label }: { progress: number; tone: Tone; label: string }) {
  const pct = Math.round(progress * 100);
  const color = TONE_TOKENS[tone].fg;
  return (
    <span
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      style={{ position: "relative", display: "block", height: "8px", borderRadius: "var(--radius-pill)", background: "var(--color-border)" }}
    >
      <span
        className="cr-grow"
        style={{ position: "absolute", inset: 0, width: `${pct}%`, borderRadius: "var(--radius-pill)", background: color }}
      />
      <span
        className="cr-playhead"
        style={{
          position: "absolute",
          top: "50%",
          left: `${pct}%`,
          width: "14px",
          height: "14px",
          marginLeft: "-7px",
          marginTop: "-7px",
          borderRadius: "50%",
          background: "var(--color-surface)",
          border: `3px solid ${color}`,
        }}
      />
    </span>
  );
}

// ── Disclosure: content is not rendered at all until asked for ─────────────
// (So the visible-word gate counts what a reader actually sees, and closed
// detail costs nothing in the DOM.)

export function Disclosure({
  label,
  openLabel,
  children,
}: {
  label: string;
  openLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-1)",
          padding: 0,
          border: "none",
          background: "transparent",
          color: "var(--color-accent-strong)",
          fontFamily: "inherit",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {open ? openLabel ?? label : label}
        <ChevronDown size={14} aria-hidden style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 140ms var(--ease-nova)" }} />
      </button>
      {open && <div className="cr-rise">{children}</div>}
    </div>
  );
}

// ── South Indian chart map ─────────────────────────────────────────────────
// The fixed-sign square a Tamil reader already knows (same cell layout as
// RasiChart in dashboard-charts.tsx). Cells are real buttons; aspect lines are
// an SVG layer on top that ignores the pointer.

const GRID: { rasi: number; col: number; row: number }[] = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1, col: 1, row: 0 }, { rasi: 2, col: 2, row: 0 }, { rasi: 3, col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 }, { rasi: 4, col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 }, { rasi: 5, col: 3, row: 2 },
  { rasi: 9, col: 0, row: 3 }, { rasi: 8, col: 1, row: 3 }, { rasi: 7, col: 2, row: 3 }, { rasi: 6, col: 3, row: 3 },
];
const CELL_OF = new Map(GRID.map((cell) => [cell.rasi, cell]));

// Strong enough to tell apart on the dark theme's near-black surface (the
// first pass at 12-14% read as three shades of the same grey); the word and
// the legend still carry the meaning, so colour is never alone.
export const HOUSE_TONE_FILL: Record<HouseTone, string> = {
  pillar: "color-mix(in srgb, var(--color-accent-strong) 30%, var(--color-surface))",
  growth: "color-mix(in srgb, var(--color-high) 28%, var(--color-surface))",
  care: "color-mix(in srgb, var(--color-low) 26%, var(--color-surface))",
  other: "var(--color-surface)",
};

export function SouthGrid({
  lang,
  lagnaRasi,
  planets,
  tintFor,
  selectedRasi,
  onSelectRasi,
  highlightGraha,
  lines = [],
  center,
  ariaLabel,
}: {
  lang: Lang;
  lagnaRasi: number;
  planets: { graha: string; rasi: number }[];
  tintFor?: (rasi: number) => HouseTone;
  selectedRasi?: number | null;
  onSelectRasi?: (rasi: number) => void;
  highlightGraha?: string | null;
  lines?: AspectLine[];
  center?: ReactNode;
  ariaLabel: string;
}) {
  const abbr = lang === "ta" ? GRAHA_ABBR : GRAHA_ABBR_EN;
  const byRasi = new Map<number, string[]>();
  for (const planet of planets) byRasi.set(planet.rasi, [...(byRasi.get(planet.rasi) ?? []), planet.graha]);
  const houseOf = (rasi: number) => ((rasi - lagnaRasi + 12) % 12) + 1;
  const centre = (rasi: number) => {
    const cell = CELL_OF.get(rasi)!;
    return { x: cell.col * 100 + 50, y: cell.row * 100 + 50 };
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{ position: "relative", width: "100%", maxWidth: "360px", aspectRatio: "1 / 1", margin: "0 auto" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          gap: "2px",
          padding: "2px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-border-strong)",
        }}
      >
        {GRID.map(({ rasi, col, row }) => {
          const house = houseOf(rasi);
          const occupants = byRasi.get(rasi) ?? [];
          const selected = selectedRasi === rasi;
          const tone = tintFor ? tintFor(house) : "other";
          const names = occupants.map((g) => tPlanetLord(g, lang)).join(", ");
          const label =
            lang === "ta"
              ? `${rasiLabel(rasi, lang)}, ${house}-ஆம் வீடு${names ? `: ${names}` : ""}`
              : `${rasiLabel(rasi, lang)}, house ${house}${names ? `: ${names}` : ""}`;
          return (
            <button
              key={rasi}
              type="button"
              aria-label={label}
              aria-pressed={onSelectRasi ? selected : undefined}
              onClick={onSelectRasi ? () => onSelectRasi(rasi) : undefined}
              disabled={!onSelectRasi}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                minWidth: 0,
                padding: "var(--space-1)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                outline: selected ? "2px solid var(--color-text-strong)" : "none",
                outlineOffset: "-2px",
                background: HOUSE_TONE_FILL[tone],
                color: "var(--color-text)",
                fontFamily: "inherit",
                cursor: onSelectRasi ? "pointer" : "default",
                textAlign: "left",
              }}
            >
              {/* --color-text, not --color-faint: on the 26–30% tints faint
                  measured 3.9:1 at 10 px (axe, chart-reading-a11y.spec.ts). */}
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text)", lineHeight: 1.1 }}>
                {house}
                {rasi === lagnaRasi ? (lang === "ta" ? " · ல" : " · La") : ""}
              </span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: "2px 4px" }}>
                {occupants.map((graha) => (
                  <span
                    key={graha}
                    style={{
                      fontSize: "var(--text-xs)",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: highlightGraha === graha ? "var(--color-accent-strong)" : "var(--color-text-strong)",
                      textDecoration: highlightGraha === graha ? "underline" : "none",
                      textUnderlineOffset: "2px",
                    }}
                  >
                    {abbr[graha] ?? graha.slice(0, 2)}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
        <div
          style={{
            gridColumn: "2 / 4",
            gridRow: "2 / 4",
            display: "grid",
            placeItems: "center",
            padding: "var(--space-2)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface-soft)",
            textAlign: "center",
          }}
        >
          {center}
        </div>
      </div>

      {lines.length > 0 && (
        <svg
          viewBox="0 0 400 400"
          aria-hidden
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
        >
          <defs>
            <marker id="cr-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--color-accent-strong)" />
            </marker>
          </defs>
          {lines.map((line, index) => {
            const a = centre(line.fromRasi);
            const b = centre(line.toRasi);
            // Stop short of the target centre so the arrowhead sits in the cell.
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const end = { x: b.x - (dx / len) * 22, y: b.y - (dy / len) * 22 };
            const start = { x: a.x + (dx / len) * 18, y: a.y + (dy / len) * 18 };
            const outgoing = line.from === highlightGraha;
            return (
              <line
                key={`${line.from}-${line.to}-${index}`}
                // Outgoing lines draw in; incoming ones are dashed, and a dash
                // pattern and a draw-in both own stroke-dasharray.
                className={outgoing ? "cr-draw" : undefined}
                pathLength={1}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="var(--color-accent-strong)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={outgoing ? undefined : "0.04 0.03"}
                markerEnd="url(#cr-arrow)"
                markerStart={line.mutual ? "url(#cr-arrow)" : undefined}
                style={{ animationDelay: `${index * 70}ms` }}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
