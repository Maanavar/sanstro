/**
 * Vinaadi brand illustrations — pure SVG, no external assets needed.
 * All use the Vinaadi palette (saffron, gold, maroon, deep-indigo).
 *
 * Components:
 *   RasiWheelIllustration  — 12-segment rasi donut wheel (for chart empty states)
 *   SkyIllustration        — night sky with crescent moon + stars (for Insights empty state)
 *   LotusIllustration      — 8-petal lotus mandala (for onboarding / premium screens)
 */

import React from "react";
import { type ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";

// ─── Palette (duplicated to keep this file self-contained) ────────────────────
const PAL = {
  saffron:      "#D4611A",
  ochre:        "#A8430E",
  amber:        "#F5A855",
  maroon:       "#8B1A3C",
  gold:         "#C9971C",
  goldLight:    "#FDF3D9",
  parchment:    "#FAF7F2",
  surface:      "#FFFFFF",
  deepIndigo:   "#0D0F1A",
  indigoSurf:   "#161929",
  skyBlue:      "#1A5EA8",
  green:        "#2D7A3A",
  textTertiary: "#A89080",
} as const;

// Tamil rasi abbreviations (one char each)
const RASI_ABBR = ["மே", "ரி", "மி", "க", "சி", "க", "து", "வி", "த", "ம", "கு", "மீ"];
// Alternate fill colors for donut segments
const SEG_FILLS = [PAL.saffron, PAL.goldLight, PAL.amber, PAL.goldLight];

function makeRasiArc(
  i: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  gap = 1.5,
): string {
  const start = ((i * 30) - 90 + gap / 2) * (Math.PI / 180);
  const end   = (((i + 1) * 30) - 90 - gap / 2) * (Math.PI / 180);
  const ox1 = (cx + outerR * Math.cos(start)).toFixed(3);
  const oy1 = (cy + outerR * Math.sin(start)).toFixed(3);
  const ox2 = (cx + outerR * Math.cos(end)).toFixed(3);
  const oy2 = (cy + outerR * Math.sin(end)).toFixed(3);
  const ix1 = (cx + innerR * Math.cos(end)).toFixed(3);
  const iy1 = (cy + innerR * Math.sin(end)).toFixed(3);
  const ix2 = (cx + innerR * Math.cos(start)).toFixed(3);
  const iy2 = (cy + innerR * Math.sin(start)).toFixed(3);
  return `M${ox1} ${oy1} A${outerR} ${outerR} 0 0 1 ${ox2} ${oy2} L${ix1} ${iy1} A${innerR} ${innerR} 0 0 0 ${ix2} ${iy2} Z`;
}

function labelPos(i: number, cx: number, cy: number, r: number) {
  const angle = ((i * 30 + 15) - 90) * (Math.PI / 180);
  return {
    x: (cx + r * Math.cos(angle)).toFixed(2),
    y: (cy + r * Math.sin(angle)).toFixed(2),
  };
}

// ─── 1. RasiWheelIllustration ─────────────────────────────────────────────────
interface IllustrationProps {
  size?: number;
  style?: ViewStyle;
}

export function RasiWheelIllustration({ size = 200, style }: IllustrationProps) {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.26;
  const labelR = (outerR + innerR) / 2;
  const fontSize = size * 0.055;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
      <Defs>
        <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={PAL.goldLight} stopOpacity={1} />
          <Stop offset="100%" stopColor={PAL.parchment} stopOpacity={1} />
        </RadialGradient>
      </Defs>

      {/* Center fill */}
      <Circle cx={cx} cy={cy} r={innerR - 2} fill="url(#centerGlow)" />

      {/* 12 rasi segments */}
      {Array.from({ length: 12 }, (_, i) => {
        const fill = i % 2 === 0 ? PAL.saffron : PAL.goldLight;
        const stroke = PAL.gold;
        const pos = labelPos(i, cx, cy, labelR);
        return (
          <React.Fragment key={i}>
            <Path
              d={makeRasiArc(i, cx, cy, outerR, innerR)}
              fill={fill}
              stroke={stroke}
              strokeWidth={0.5}
            />
            <SvgText
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontWeight="600"
              fill={i % 2 === 0 ? "#FFF" : PAL.ochre}
            >
              {RASI_ABBR[i]}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Outer ring stroke */}
      <Circle cx={cx} cy={cy} r={outerR + 1} fill="none" stroke={PAL.gold} strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={innerR - 2} fill="none" stroke={PAL.gold} strokeWidth={1} />

      {/* Center symbol — sun dot */}
      <Circle cx={cx} cy={cy} r={size * 0.05} fill={PAL.saffron} />
      <Circle cx={cx} cy={cy} r={size * 0.025} fill={PAL.surface} />
    </Svg>
  );
}

// ─── 2. SkyIllustration ───────────────────────────────────────────────────────
// Night sky: deep-indigo bg, crescent moon, 7 stars, 3 horizon bands
// Used for Insights empty state and goal completion.

const STARS = [
  { cx: 42, cy: 28, r: 2.5 },
  { cx: 118, cy: 18, r: 2 },
  { cx: 158, cy: 45, r: 3 },
  { cx: 72, cy: 55, r: 1.5 },
  { cx: 136, cy: 70, r: 2 },
  { cx: 28, cy: 72, r: 1.5 },
  { cx: 175, cy: 30, r: 1.8 },
];

export function SkyIllustration({ size = 200, style }: IllustrationProps) {
  const vbW = 200, vbH = 140;
  const scale = size / vbW;

  return (
    <Svg
      width={size}
      height={size * (vbH / vbW)}
      viewBox={`0 0 ${vbW} ${vbH}`}
      style={style}
    >
      {/* Sky background */}
      <Path
        d={`M0 0 H${vbW} V${vbH} H0 Z`}
        fill={PAL.deepIndigo}
      />

      {/* Stars */}
      {STARS.map((s, i) => (
        <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={PAL.amber} opacity={0.9} />
      ))}

      {/* Crescent moon — two overlapping circles */}
      <Circle cx={92} cy={38} r={22} fill={PAL.amber} />
      <Circle cx={100} cy={32} r={20} fill={PAL.deepIndigo} />

      {/* Horizon bands (rolling hills silhouette) */}
      <Ellipse cx={55}  cy={138} rx={72}  ry={28} fill={PAL.indigoSurf} />
      <Ellipse cx={155} cy={142} rx={65}  ry={26} fill={PAL.indigoSurf} />
      <Ellipse cx={100} cy={148} rx={110} ry={22} fill="#1A2540" />

      {/* Horizon glow */}
      <Ellipse cx={100} cy={112} rx={60} ry={10} fill={PAL.saffron} opacity={0.18} />
    </Svg>
  );
}

// ─── 3. LotusIllustration ─────────────────────────────────────────────────────
// 8-petal lotus mandala in saffron/gold.
// Used for onboarding success, premium upsell, and spiritual content sections.

function petalPath(cx: number, cy: number, angle: number, len: number, width: number): string {
  const rad = angle * (Math.PI / 180);
  const perp = (angle + 90) * (Math.PI / 180);
  const tipX = cx + len * Math.cos(rad);
  const tipY = cy + len * Math.sin(rad);
  const lx = cx + width * Math.cos(perp);
  const ly = cy + width * Math.sin(perp);
  const rx = cx - width * Math.cos(perp);
  const ry = cy - width * Math.sin(perp);
  // Bezier petal: base-left → tip ← base-right
  const cpDist = len * 0.55;
  const cp1x = lx + cpDist * Math.cos(rad);
  const cp1y = ly + cpDist * Math.sin(rad);
  const cp2x = rx + cpDist * Math.cos(rad);
  const cp2y = ry + cpDist * Math.sin(rad);
  return `M${lx.toFixed(2)} ${ly.toFixed(2)} C${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${tipX.toFixed(2)} ${tipY.toFixed(2)} ${tipX.toFixed(2)} ${tipY.toFixed(2)} C${tipX.toFixed(2)} ${tipY.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${rx.toFixed(2)} ${ry.toFixed(2)} Z`;
}

export function LotusIllustration({ size = 200, style }: IllustrationProps) {
  const cx = size / 2, cy = size / 2;
  const outerLen = size * 0.36;
  const outerW   = size * 0.12;
  const innerLen = size * 0.22;
  const innerW   = size * 0.07;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
      {/* Outer 8 petals */}
      {Array.from({ length: 8 }, (_, i) => (
        <Path
          key={`out-${i}`}
          d={petalPath(cx, cy, i * 45 - 90, outerLen, outerW)}
          fill={PAL.saffron}
          opacity={0.85}
          stroke={PAL.ochre}
          strokeWidth={0.8}
        />
      ))}

      {/* Inner 8 petals (rotated 22.5°) */}
      {Array.from({ length: 8 }, (_, i) => (
        <Path
          key={`in-${i}`}
          d={petalPath(cx, cy, i * 45 - 67.5, innerLen, innerW)}
          fill={PAL.gold}
          opacity={0.9}
          stroke={PAL.amber}
          strokeWidth={0.5}
        />
      ))}

      {/* Center circles */}
      <Circle cx={cx} cy={cy} r={size * 0.09}  fill={PAL.amber} />
      <Circle cx={cx} cy={cy} r={size * 0.055} fill={PAL.gold} />
      <Circle cx={cx} cy={cy} r={size * 0.025} fill={PAL.saffron} />

      {/* Subtle radial lines */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * 22.5) * (Math.PI / 180);
        const r1 = size * 0.1, r2 = size * 0.42;
        return (
          <Line
            key={`rl-${i}`}
            x1={(cx + r1 * Math.cos(a)).toFixed(2)}
            y1={(cy + r1 * Math.sin(a)).toFixed(2)}
            x2={(cx + r2 * Math.cos(a)).toFixed(2)}
            y2={(cy + r2 * Math.sin(a)).toFixed(2)}
            stroke={PAL.gold}
            strokeWidth={0.3}
            opacity={0.4}
          />
        );
      })}
    </Svg>
  );
}
