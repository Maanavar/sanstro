"use client";

import { getScoreBand } from "@/lib/format";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export function ScoreGauge({ score, size = 160 }: ScoreGaugeProps) {
  const band = getScoreBand(score);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 270° (from 135° to 405°), leaving a 90° gap at the bottom
  const arcLength = circumference * 0.75;
  const filled = arcLength * (score / 100);
  const gap = arcLength - filled;

  const trackColor = "rgba(255,255,255,0.08)";
  const fillColor =
    band.tone === "high" ? "#4ade80"
    : band.tone === "low" ? "#f87171"
    : "#e5b84d";

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="score-gauge" style={{ width: size, height: size }}>
      <svg
        className="score-gauge__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        style={{ transform: "rotate(135deg)" }}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={10}
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeLinecap="round"
        />
        {/* Fill */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={10}
          strokeDasharray={`${filled} ${gap + (circumference - arcLength)}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${fillColor}88)` }}
        />
      </svg>
      <div className="score-gauge__label">
        <span className="score-gauge__number" style={{ color: fillColor }}>
          {score}
        </span>
        <span className="score-gauge__band">{band.label}</span>
      </div>
    </div>
  );
}
