"use client";

import { scoreBandColor, scoreColorAlpha } from "@/lib/format";
import { NovaScoreDial } from "../dashboard-ui-nova";

/**
 * <Score> — one score model, three zooms (audit A-3, §8.4). Today's ring, Life
 * Areas' tier chips, and the forecast trend line are the SAME 0–100 number
 * rendered at different zooms, never four independent scales. The colour always
 * comes from the canonical `scoreBandColor()` — a score's colour maps 1:1 to
 * its verdict by construction, so callers can't accidentally hand-pick an
 * off-band hue.
 *
 * - `ring`  — the answer, big (delegates to the existing NovaScoreDial, which
 *             already handles the count-up + reduced-motion; we just guarantee
 *             the band colour so no call site forgets it).
 * - `chip`  — the bucketed zoom (a small band-tinted pill).
 * - `trend` — the over-time zoom (a sparkline of a score series).
 */

type RingProps = {
  variant: "ring";
  score: number;
  max?: number;
  size?: number;
  label?: string;
};

type ChipProps = {
  variant: "chip";
  score: number;
  /** Optional trailing text (e.g. "/100", or a tier word the caller localises). */
  suffix?: string;
  className?: string;
};

type TrendProps = {
  variant: "trend";
  /** The score series over time, oldest → newest. Coloured by the latest point. */
  series: number[];
  width?: number;
  height?: number;
  ariaLabel?: string;
};

type ScoreProps = RingProps | ChipProps | TrendProps;

export function Score(props: ScoreProps) {
  if (props.variant === "ring") {
    const { score, max = 100, size = 118, label } = props;
    return <NovaScoreDial score={score} max={max} size={size} label={label} color={scoreBandColor(score)} />;
  }

  if (props.variant === "chip") {
    const { score, suffix, className } = props;
    const color = scoreBandColor(score);
    return (
      <span
        className={["ui-score-chip", className].filter(Boolean).join(" ")}
        style={{ color, background: scoreColorAlpha(color, 14), border: `1px solid ${scoreColorAlpha(color, 32)}` }}
      >
        {Math.round(score)}
        {suffix ? <span style={{ opacity: 0.75, fontWeight: 600 }}>{suffix}</span> : null}
      </span>
    );
  }

  // trend
  const { series, width = 72, height = 24, ariaLabel } = props;
  if (series.length < 2) {
    return <span aria-label={ariaLabel} />;
  }
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const stepX = width / (series.length - 1);
  const pad = 2;
  const points = series
    .map((v, i) => {
      const x = i * stepX;
      const y = pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = scoreBandColor(series[series.length - 1]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: "block", overflow: "visible" }}
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={pad + (1 - (series[series.length - 1] - min) / span) * (height - pad * 2)} r={2.6} fill={color} />
    </svg>
  );
}
