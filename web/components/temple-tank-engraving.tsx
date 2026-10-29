import { useId, type ReactNode } from "react";
import type { SkyPhase } from "@/lib/sky-phase";

/**
 * The temple tank as a bronze line engraving: the light theme's rendering of
 * the moonlit photograph (IMG-01, 2026-10-28).
 *
 * A night photograph cannot sit on cream: its subject is darkness, so it fogs
 * at low opacity and reads as a pasted-in slab at full opacity. Ink on paper is
 * what a light page already is, so the same scene is drawn, not photographed —
 * the frontispiece of a printed almanac. The composition registers with the
 * photo (moon/sun over the main peak, gopuram on the right, mandapams along the
 * tank, empty sky in the left third for copy), so header and closing layouts
 * hold in both themes.
 *
 * The hour still picks the scene (owner ruling 1, 2026-10-14): the sun by day,
 * rising behind the hills at dawn and setting at dusk, the moon, stars and lit
 * mandapam lamps at night. `phase` is null until mount — the server cannot know
 * the reader's clock — and the sky is left empty rather than guessed.
 *
 * Everything is `currentColor` with opacity; there is no opaque "paper" fill,
 * because the light page ground is a gradient and any flat fill would show as a
 * patch. Foreground buildings hide what is behind them through a mask instead.
 */

type Pt = [number, number];

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Catmull-Rom through the points, as cubic Béziers. */
function smooth(points: Pt[]): string {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d += ` C${r1(p1[0] + (p2[0] - p0[0]) / 6)} ${r1(p1[1] + (p2[1] - p0[1]) / 6)} ${r1(p2[0] - (p3[0] - p1[0]) / 6)} ${r1(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* ── Composition (1200 × 400, the photograph's 3:1) ─────────────────────── */

/** `band` drops the empty upper sky but keeps the day sun's rays and glow whole. */
export const ENGRAVING_VIEWBOX = { full: "0 0 1200 400", band: "0 90 1200 310" } as const;

const COPING = 318;   // top of the tank wall
const WATER = 334;    // waterline
const GX = 1062;      // gopuram axis

const BACK_RIDGE: Pt[] = [[0, 270], [90, 263], [190, 252], [280, 243], [360, 236], [430, 230], [490, 222], [546, 208], [580, 214], [628, 196], [672, 182], [700, 192], [736, 206], [790, 220], [850, 228], [920, 230], [1000, 238], [1080, 246], [1200, 254]];
/** Engraved tone on the far range; each row's dashes start at a different offset so no columns form. */
const HATCH_ROWS = Array.from({ length: 22 }, (_, i) => 186 + i * 5);
/** Spurs falling from the summit: the lines an engraver cuts to give a hill its mass. */
const SPURS = "M672 182c-8 18 -26 30 -40 44M672 182c6 20 2 38 -6 52M700 192c4 16 16 28 30 36M628 196c-10 14 -26 22 -44 30M546 208c-8 12 -22 20 -38 26M736 206c10 10 24 18 40 22";
const FRONT_RIDGE: Pt[] = [[0, 288], [80, 282], [160, 278], [240, 272], [300, 275], [360, 268], [420, 272], [500, 279], [600, 283], [700, 281], [800, 274], [880, 278], [960, 273], [1040, 281], [1200, 286]];

/** [x, scale, lean] — the palm line follows the photo's. */
const PALMS: [number, number, number][] = [
  [16, 1.05, -3], [46, 0.9, 2], [70, 1.15, -1], [156, 0.85, 3], [208, 1, -2], [238, 0.9, 2],
  [296, 0.8, -1], [324, 1.1, 2], [360, 0.9, -3], [386, 1, 1], [452, 0.85, -2], [626, 1.1, 2],
  [806, 0.9, -2], [834, 1.05, 1], [884, 0.95, -1], [908, 0.85, 3], [948, 1.1, -2], [986, 1, 2], [1180, 1.2, -3],
];

/** Where the gopuram stands in the plate; the sky-only scene plants palms there instead. */
const PALMS_IN_TEMPLE_GAP: [number, number, number][] = [[1036, 0.9, 2], [1072, 1.05, -2], [1112, 0.85, 1], [1146, 0.95, -1]];

/** [x, scale] — open pavilions on the tank's edge, each with its ghat. */
const MANDAPAMS: [number, number][] = [[105, 1.1], [273, 0.95], [474, 1.05], [588, 0.85], [729, 1.15], [858, 0.8]];

/** Where the sun or moon stands in each phase; dawn and dusk sit low enough for the hills to cut them. */
export const CELESTIAL: Record<SkyPhase, { cx: number; cy: number; r: number }> = {
  night: { cx: 726, cy: 150, r: 19 },
  day: { cx: 726, cy: 140, r: 20 },
  dawn: { cx: 800, cy: 228, r: 24 },
  // West of the peak, but clear of the left third where the closing's copy sits.
  dusk: { cx: 480, cy: 234, r: 24 },
};

const GLOW = 2.4;
/** Low-sun rays: [inner gap, long, short] beyond the disc's radius. */
const LOW_RAYS = [8, 34, 20] as const;
const HIGH_RAYS = [7, 19, 13] as const;

/** How far the drawn sky reaches from the body's centre: glow or rays, whichever is longer. */
export function skyReach(phase: SkyPhase): number {
  const { r } = CELESTIAL[phase];
  const rays = phase === "day" ? r + HIGH_RAYS[1] : phase === "night" ? r + 20 : r + LOW_RAYS[1];
  return Math.max(r * GLOW, rays);
}

function palm(x: number, s: number, lean: number): string {
  const y = COPING - 4;
  const cx = x + lean * s;
  const cy = y - 44 * s;
  const trunk = `M${x} ${y}C${r1(x + lean * 0.3 * s)} ${r1(y - 15 * s)} ${r1(x + lean * 0.8 * s)} ${r1(y - 30 * s)} ${r1(cx)} ${r1(cy)}`;
  const fronds: number[][] = [
    [-6, -6, -14, -5, -21, 3], [-4, -9, -12, -12, -19, -9], [-1, -8, -3, -14, -7, -17],
    [2, -8, 6, -13, 11, -15], [5, -9, 13, -11, 19, -7], [6, -5, 15, -4, 21, 4], [-2, -2, -7, 2, -10, 9], [2, -2, 7, 2, 10, 9],
  ];
  return trunk + fronds.map(([a, b, c, d, e, f]) => `M${r1(cx)} ${r1(cy)}c${r1(a * s)} ${r1(b * s)} ${r1(c * s)} ${r1(d * s)} ${r1(e * s)} ${r1(f * s)}`).join("");
}

/** Broadleaf canopy behind the tank: a lumpy treeline, deterministic. */
function canopy(): string {
  const widths = [14, 20, 12, 17, 24, 15, 19, 11, 22, 16, 13, 21];
  const base = (x: number) => r1(305 + 3 * Math.sin(x / 41) + 2 * Math.sin(x / 17));
  let x = 0;
  let d = `M0 ${COPING}L0 ${base(0)}`;
  for (let i = 0; x < 1200; i++) {
    const w = widths[i % widths.length];
    const x2 = Math.min(1200, x + w);
    const ry = r1((x2 - x) * 0.5 * (0.75 + 0.25 * ((i * 7) % 5) / 4));
    d += `A${r1((x2 - x) / 2)} ${ry} 0 0 1 ${x2} ${base(x2)}`;
    x = x2;
  }
  return `${d}L1200 ${COPING}Z`;
}

function mandapamOutline(x: number, s: number): string {
  const p = (dx: number, dy: number) => `${r1(x + dx * s)} ${r1(COPING + dy * s)}`;
  return `M${p(-18, 0)}L${p(-18, -4)}L${p(-15, -4)}L${p(-15, -21)}C${p(-15, -30)} ${p(-6, -36)} ${p(0, -41)}C${p(6, -36)} ${p(15, -30)} ${p(15, -21)}L${p(15, -4)}L${p(18, -4)}L${p(18, 0)}Z`;
}

function mandapamDetail(x: number, s: number): string {
  const p = (dx: number, dy: number) => `${r1(x + dx * s)} ${r1(COPING + dy * s)}`;
  return [
    `M${p(-18, -4)}H${r1(x + 18 * s)}`,
    ...[-11, -4, 4, 11].map((dx) => `M${p(dx, -4)}V${r1(COPING - 18 * s)}`),
    `M${p(-15, -18)}H${r1(x + 15 * s)}M${p(-15, -21)}H${r1(x + 15 * s)}`,
    `M${p(0, -41)}V${r1(COPING - 47 * s)}`,
  ].join("");
}

/** The ghat in front of a mandapam: steps widening as they go down. */
function ghat(x: number, s: number): { outline: string; steps: string } {
  const top = 13 * s;
  const bottom = 22 * s;
  const outline = `M${r1(x - top)} ${COPING + 2}L${r1(x + top)} ${COPING + 2}L${r1(x + bottom)} ${WATER}L${r1(x - bottom)} ${WATER}Z`;
  let steps = `M${r1(x - top)} ${COPING + 2}L${r1(x - bottom)} ${WATER}M${r1(x + top)} ${COPING + 2}L${r1(x + bottom)} ${WATER}`;
  for (let y = COPING + 5; y < WATER; y += 3) {
    const hw = top + ((y - COPING - 2) / (WATER - COPING - 2)) * (bottom - top);
    steps += `M${r1(x - hw)} ${y}H${r1(x + hw)}`;
  }
  return { outline, steps };
}

/* Gopuram: a stone base with its doorway, nine tiers tapering to half the
   base's width, the barrel vault (shala) and five kalasams. */
const TIERS = 9;
const TIER_H = 10.5;
const BASE_TOP = 282;
const halfWidth = (k: number) => 40 - k * (20 / TIERS);
const SHALA_Y = BASE_TOP - TIERS * TIER_H; // 187.5

function gopuramOutline(): string {
  const top = halfWidth(TIERS);
  return [
    `M${GX - 42} ${COPING}L${GX - 42} ${BASE_TOP}L${r1(GX - 40)} ${BASE_TOP}`,
    `L${r1(GX - top - 2)} ${SHALA_Y}L${r1(GX - top + 2)} ${SHALA_Y - 8}`,
    `C${GX - 22} ${SHALA_Y - 17} ${GX + 22} ${SHALA_Y - 17} ${r1(GX + top - 2)} ${SHALA_Y - 8}`,
    `L${r1(GX + top + 2)} ${SHALA_Y}L${GX + 40} ${BASE_TOP}L${GX + 42} ${BASE_TOP}L${GX + 42} ${COPING}Z`,
  ].join("");
}

function gopuramDetail(): string {
  let d = "";
  // Base: mouldings, pilasters, the doorway.
  d += `M${GX - 42} ${BASE_TOP + 4}H${GX + 42}M${GX - 42} ${COPING - 6}H${GX + 42}`;
  for (const dx of [-34, -24, 24, 34]) d += `M${GX + dx} ${BASE_TOP + 4}V${COPING - 6}`;
  d += `M${GX - 9} ${COPING}V${COPING - 20}Q${GX - 9} ${COPING - 30} ${GX} ${COPING - 31}Q${GX + 9} ${COPING - 30} ${GX + 9} ${COPING - 20}V${COPING}`;
  // Tiers: a cornice at each step, niches between, the sloped flanks.
  for (let k = 0; k <= TIERS; k++) {
    const y = BASE_TOP - k * TIER_H;
    const hw = halfWidth(k);
    d += `M${r1(GX - hw - 2)} ${y}H${r1(GX + hw + 2)}`;
    if (k === TIERS) break;
    d += `M${r1(GX - hw)} ${y - 2.5}H${r1(GX + hw)}`;
    for (const j of [-2, -1, 1, 2]) {
      const nx = r1(GX + (j * hw) / 3);
      d += `M${nx} ${y - 4}V${y - 9}`;
    }
    d += `M${GX - 3} ${y - 8}Q${GX} ${y - 12} ${GX + 3} ${y - 8}`;
  }
  d += `M${GX - 40} ${BASE_TOP}L${r1(GX - halfWidth(TIERS) - 2)} ${SHALA_Y}M${GX + 40} ${BASE_TOP}L${r1(GX + halfWidth(TIERS) + 2)} ${SHALA_Y}`;
  // Shala horns and the kalasams.
  const top = halfWidth(TIERS);
  d += `M${r1(GX - top + 2)} ${SHALA_Y - 8}c-4 -2 -6 -6 -4 -10M${r1(GX + top - 2)} ${SHALA_Y - 8}c4 -2 6 -6 4 -10`;
  for (const dx of [-14, -7, 0, 7, 14]) d += `M${GX + dx} ${SHALA_Y - 14}V${SHALA_Y - 21}M${GX + dx} ${SHALA_Y - 24.5}V${SHALA_Y - 28}`;
  return d;
}

/* Prakaram walls either side of the gopuram, with a stepped coping. */
function prakaram(): string {
  let d = `M1000 300H${GX - 42}M1000 304H${GX - 42}M${GX + 42} 300H1200M${GX + 42} 304H1200`;
  for (let x = 1004; x < GX - 46; x += 12) d += `M${x} 300q3 -5 6 0`;
  for (let x = GX + 48; x < 1196; x += 12) d += `M${x} 300q3 -5 6 0`;
  return d;
}

/* Water: ripple rows widening toward the viewer. */
const WATER_ROWS = [340, 345, 351, 358, 366, 375, 386, 398];
const RIPPLE = [46, 9, 14, 22, 70, 12, 8, 30];

/** A broken column of light on the water under (x), narrowing as it nears. */
function glitter(x: number, widths: number[]): string {
  return WATER_ROWS.map((y, i) => {
    const w = widths[i % widths.length];
    const off = ((i * 5) % 7) - 3;
    return `M${r1(x - w / 2 + off)} ${y + 1}h${w}`;
  }).join("");
}

/** The gopuram upside down in the water, in broken strokes. */
function gopuramReflection(): string {
  let d = "";
  for (let y = WATER + 5, k = 0; y < 378; y += 5, k += 1) {
    const hw = halfWidth(Math.min(TIERS, k)) * 0.9;
    const gap = 4 + ((y * 7) % 11);
    d += `M${r1(GX - hw)} ${y}H${r1(GX - gap)}M${r1(GX + gap + 2)} ${y}H${r1(GX + hw * 0.7)}`;
  }
  return d;
}

function rays(cx: number, cy: number, from: number, to: number, inner: number, long: number, short: number, step: number): string {
  let d = "";
  for (let a = from, i = 0; a <= to; a += step, i++) {
    const rad = (a * Math.PI) / 180;
    const len = i % 2 ? short : long;
    d += `M${r1(cx + inner * Math.cos(rad))} ${r1(cy + inner * Math.sin(rad))}L${r1(cx + len * Math.cos(rad))} ${r1(cy + len * Math.sin(rad))}`;
  }
  return d;
}

const bird = (x: number, y: number, s = 1) => `M${r1(x - 6 * s)} ${y}q${r1(3 * s)} ${r1(-3.5 * s)} ${r1(6 * s)} 0q${r1(3 * s)} ${r1(-3.5 * s)} ${r1(6 * s)} 0`;
const star = (x: number, y: number, s: number) => `M${x} ${r1(y - 5 * s)}L${r1(x + s)} ${r1(y - s)}L${r1(x + 5 * s)} ${y}L${r1(x + s)} ${r1(y + s)}L${x} ${r1(y + 5 * s)}L${r1(x - s)} ${r1(y + s)}L${r1(x - 5 * s)} ${y}L${r1(x - s)} ${r1(y - s)}Z`;
const STARS: [number, number, number][] = [[118, 70, 1.1], [212, 124, 0.7], [334, 58, 0.9], [428, 142, 0.6], [526, 92, 1.3], [612, 48, 0.7], [866, 82, 1], [962, 132, 0.6], [1046, 52, 0.8], [1132, 108, 1.2], [272, 186, 0.6], [930, 182, 0.5]];

function Sky({ phase, skyClip }: { phase: SkyPhase; skyClip: string }): ReactNode {
  const { cx, cy, r } = CELESTIAL[phase];
  const glow = <circle cx={cx} cy={cy} r={r * GLOW} fill={`url(#${skyClip}-glow)`} stroke="none" />;
  if (phase === "night") {
    return (
      <g className="tte-sky" data-phase="night">
        {glow}
        {STARS.map(([x, y, s]) => s >= 1
          ? <path key={`${x}`} d={star(x, y, s)} fill="currentColor" stroke="none" />
          : <circle key={`${x}`} cx={x} cy={y} r={s * 1.6} fill="currentColor" stroke="none" fillOpacity={0.7} />)}
        <circle cx={cx} cy={cy} r={r + 9} strokeOpacity={0.35} />
        <circle cx={cx} cy={cy} r={r + 20} strokeOpacity={0.3} strokeDasharray="1 5" />
        <circle cx={cx} cy={cy} r={r} fill="currentColor" fillOpacity={0.1} strokeWidth={1.25} />
        <path d={`M${cx - 7} ${cy - 5}a3 3 0 1 0 0.1 0M${cx + 6} ${cy + 4}a4 4 0 1 0 0.1 0M${cx + 3} ${cy - 9}a2 2 0 1 0 0.1 0`} strokeOpacity={0.5} />
        <path d="M566 162c40 -4 80 -2 120 2M760 166c46 -4 96 -2 148 2M612 176c50 -3 100 -2 150 1" strokeOpacity={0.4} />
        <path d={glitter(cx, [22, 16, 26, 12, 20, 9, 14, 6])} strokeWidth={1.25} strokeOpacity={0.7} />
      </g>
    );
  }
  if (phase === "day") {
    return (
      <g className="tte-sky" data-phase="day">
        {glow}
        <circle cx={cx} cy={cy} r={r} fill="currentColor" fillOpacity={0.12} strokeWidth={1.25} />
        <path d={rays(cx, cy, 0, 345, r + HIGH_RAYS[0], r + HIGH_RAYS[1], r + HIGH_RAYS[2], 15)} strokeOpacity={0.75} />
        <path d={bird(470, 122) + bird(494, 110, 0.8) + bird(512, 128, 0.7)} strokeOpacity={0.7} />
        <path d={glitter(cx, [18, 12, 20, 9, 14, 6, 10, 4])} strokeOpacity={0.55} />
      </g>
    );
  }
  // Dawn and dusk: the disc low behind the hills, rays fanning upward, mist or homing birds.
  return (
    <g className="tte-sky" data-phase={phase}>
      {glow}
      <g clipPath={`url(#${skyClip})`}>
        <circle cx={cx} cy={cy} r={r} fill="currentColor" fillOpacity={0.12} strokeWidth={1.25} />
        <path d={rays(cx, cy, 190, 350, r + LOW_RAYS[0], r + LOW_RAYS[1], r + LOW_RAYS[2], 10)} strokeOpacity={0.6} />
      </g>
      {phase === "dawn"
        ? <path d="M520 256h220M780 254h260M600 262h300M940 262h140M560 270h180M820 268h220" strokeOpacity={0.35} strokeDasharray="18 6 4 6" />
        : <path d={bird(586, 172) + bird(610, 162, 0.8) + bird(632, 176, 0.7) + bird(656, 166, 0.6)} strokeOpacity={0.7} />}
      <path d="M400 200c50 -3 100 -2 150 1M560 192c60 -3 120 -2 180 1M860 206c60 -3 120 -2 170 1" strokeOpacity={0.35} />
      <path d={glitter(cx, [26, 18, 30, 14, 22, 10, 16, 8])} strokeWidth={1.25} strokeOpacity={0.6} />
    </g>
  );
}

/**
 * `scene="sky"` leaves the gopuram out: the header's right edge is where the
 * view switch sits, and a control standing on the gopuram's crown reads as a
 * collision. The page opens on the sky and ends on the full plate.
 */
export function TempleTankEngraving({ phase, crop = "full", scene = "plate", className }: {
  phase: SkyPhase | null;
  crop?: keyof typeof ENGRAVING_VIEWBOX;
  scene?: "plate" | "sky";
  className?: string;
}) {
  const temple = scene === "plate";
  const palms = temple ? PALMS : [...PALMS, ...PALMS_IN_TEMPLE_GAP];
  const id = useId().replace(/:/g, "");
  const knockout = `${id}-knockout`;
  const skyClip = `${id}-sky`;
  const night = phase === "night";
  const back = smooth(BACK_RIDGE);
  const front = smooth(FRONT_RIDGE);

  return (
    <svg
      className={["nova-cal-engraving", className].filter(Boolean).join(" ")}
      viewBox={ENGRAVING_VIEWBOX[crop]}
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        {/* Everything above the far ridge: the low sun sets behind the hills. */}
        <clipPath id={skyClip}><path d={`${back}L1200 0L0 0Z`} /></clipPath>
        <clipPath id={`${id}-hills`}><path d={`${back}L1200 ${COPING}L0 ${COPING}Z`} /></clipPath>
        <radialGradient id={`${skyClip}-glow`}>
          <stop offset="0" stopColor="currentColor" stopOpacity={night ? 0.16 : 0.2} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0} />
        </radialGradient>
        {/* Foreground masonry hides the treeline, palms and wall courses behind it. */}
        <mask id={knockout} maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="400">
          <rect width="1200" height="400" fill="white" />
          <g fill="black" stroke="black" strokeWidth={3}>
            {temple && <path d={gopuramOutline()} />}
            {MANDAPAMS.map(([x, s]) => <path key={x} d={mandapamOutline(x, s)} />)}
            {MANDAPAMS.map(([x, s]) => <path key={x} d={ghat(x, s).outline} />)}
          </g>
        </mask>
      </defs>

      {phase && <Sky phase={phase} skyClip={skyClip} />}

      <g mask={`url(#${knockout})`}>
        {/* Far range: a tonal wash with engraved horizontal hatching. */}
        <path d={`${back}L1200 ${COPING}L0 ${COPING}Z`} fill="currentColor" fillOpacity={0.05} stroke="none" />
        <g clipPath={`url(#${id}-hills)`} strokeOpacity={0.3} strokeDasharray="60 4 22 3">
          {HATCH_ROWS.map((y, i) => <path key={y} d={`M0 ${y}H1200`} strokeDashoffset={(i * 29) % 89} />)}
        </g>
        <path d={SPURS} strokeOpacity={0.45} />
        <path d={back} strokeWidth={1.25} />
        <path d={`${front}L1200 ${COPING}L0 ${COPING}Z`} fill="currentColor" fillOpacity={0.05} stroke="none" />
        <path d={front} strokeOpacity={0.45} />
        <path d={canopy()} fill="currentColor" fillOpacity={0.09} strokeOpacity={0.7} />
        <path d={palms.map(([x, s, l]) => palm(x, s, l)).join("")} strokeOpacity={0.9} />
        {temple && <path d={prakaram()} strokeOpacity={0.8} />}
        {/* Tank wall: coping, two masonry courses, waterline. */}
        <path d={`M0 ${COPING}H1200M0 ${COPING + 3}H1200`} />
        <path d={`M0 ${COPING + 8}H1200M0 ${COPING + 12}H1200`} strokeOpacity={0.4} strokeDasharray="16 2" />
      </g>
      <path d={`M0 ${WATER}H1200`} strokeOpacity={0.8} />

      {/* Foreground: the gopuram and the mandapams with their ghats. */}
      {temple && <path className="tte-gopuram" d={gopuramOutline()} fill="currentColor" fillOpacity={0.08} strokeWidth={1.25} />}
      {temple && <path d={gopuramDetail()} strokeOpacity={0.75} />}
      {MANDAPAMS.map(([x, s]) => (
        <g key={x}>
          <path d={mandapamOutline(x, s)} fill="currentColor" fillOpacity={0.06} />
          <path d={mandapamDetail(x, s)} strokeOpacity={0.8} />
          <path d={ghat(x, s).steps} strokeOpacity={0.55} />
          <circle cx={x} cy={r1(COPING - 47 * s - 2)} r={1.6 * s} />
        </g>
      ))}

      {/* Water: ripples, the gopuram's reflection, and the lamps at night. */}
      <g strokeOpacity={0.45}>
        {WATER_ROWS.map((y, i) => (
          <path key={y} d={`M0 ${y}H1200`} strokeDasharray={RIPPLE.map((n) => r1(n * (1 + i * 0.22))).join(" ")} strokeDashoffset={i * 37} />
        ))}
      </g>
      {temple && <path d={gopuramReflection()} strokeOpacity={0.22} />}
      {night && (
        <g className="tte-lamps" fill="currentColor" stroke="none">
          {MANDAPAMS.map(([x, s]) => <circle key={x} cx={x} cy={r1(COPING - 10 * s)} r={1.8} />)}
          {temple && <circle cx={GX} cy={COPING - 12} r={2.2} />}
          <path d={[...MANDAPAMS.map(([x]) => x), ...(temple ? [GX] : [])].map((x) => `M${x} ${WATER + 5}v5M${x} ${WATER + 14}v4M${x} ${WATER + 22}v3M${x} ${WATER + 30}v2`).join("")} stroke="currentColor" strokeOpacity={0.6} fill="none" />
        </g>
      )}
    </svg>
  );
}
