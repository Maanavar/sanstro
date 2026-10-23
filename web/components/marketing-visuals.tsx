"use client";

import { useLang } from "@/components/lang-context";
import { formatClockHour, formatClockLabel } from "@/lib/format";

type VisualProps = {
  className?: string;
  lang?: "en" | "ta";
};

/** The accessible name of each illustration, in both languages. `<svg role="img">`
 *  is announced by its label, and no text probe sees an attribute. */
const LABELS = {
  chart: { en: "South Indian birth chart visual", ta: "தென்னிந்திய ஜாதகக் கட்டத்தின் படம்" },
  timing: { en: "Daily timing windows visual", ta: "தினசரி நேரச் சாளரங்களின் படம்" },
  wheel: { en: "Five limbs of panchangam visual", ta: "பஞ்சாங்கத்தின் ஐந்து அங்கங்களின் படம்" },
  porutham: { en: "Porutham compatibility visual", ta: "பொருத்த இணக்கத்தின் படம்" },
  family: { en: "Family daily planning visual", ta: "குடும்பத் தினசரித் திட்டமிடலின் படம்" },
  nakshatra: { en: "Nakshathiram constellation visual", ta: "நட்சத்திரக் கூட்டத்தின் படம்" },
  numerology: { en: "How letters become a Chaldean number", ta: "எழுத்துகள் கல்தேய எண்ணாக மாறும் விதம்" },
  transit: { en: "Moon transit through twelve rasis visual", ta: "பன்னிரு ராசிகளில் சந்திரப் பெயர்ச்சியின் படம்" },
} as const;

/** The language a visual draws itself in: an explicit prop, else the page's. */
function useVisualLang(lang?: "en" | "ta"): "en" | "ta" {
  const [ctx] = useLang();
  return lang ?? ctx;
}

function useLabel(key: keyof typeof LABELS, lang?: "en" | "ta"): string {
  return LABELS[key][useVisualLang(lang)];
}

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function SouthIndianChartVisual({ className, lang }: VisualProps) {
  const label = useLabel("chart", lang);
  const shown = useVisualLang(lang);
  const labels = shown === "ta"
    ? { center: "D1", lagna: "லக்", moon: "சந்", saturn: "சனி", guru: "குரு", sub: "திருக்கணிதம்" }
    : { center: "D1", lagna: "Lagna", moon: "Moon", saturn: "Saturn", guru: "Guru", sub: "Thirukanitham" };

  return (
    <div className={cx("mk-visual mk-visual--chart", className)}>
      <svg viewBox="0 0 320 320" role="img" aria-label={label}>
        <rect className="mk-paper" x="14" y="14" width="292" height="292" rx="18" />
        <g className="mk-grid">
          <path d="M87 14v292M160 14v292M233 14v292M14 87h292M14 160h292M14 233h292" />
          <rect x="87" y="87" width="146" height="146" rx="8" />
        </g>
        <rect className="mk-accent-cell" x="87" y="14" width="73" height="73" rx="8" />
        <circle className="mk-planet mk-planet--sun" cx="198" cy="51" r="8" />
        <circle className="mk-planet mk-planet--moon" cx="268" cy="124" r="7" />
        <circle className="mk-planet mk-planet--guru" cx="51" cy="198" r="7" />
        <circle className="mk-planet mk-planet--saturn" cx="198" cy="268" r="7" />
        <text className="mk-label mk-label--strong" x="124" y="42">{labels.lagna}</text>
        <text className="mk-label" x="252" y="113">{labels.moon}</text>
        <text className="mk-label" x="28" y="188">{labels.guru}</text>
        <text className="mk-label" x="180" y="291">{labels.saturn}</text>
        <text className="mk-center-title" x="160" y="153" textAnchor="middle">{labels.center}</text>
        <text className="mk-center-sub" x="160" y="176" textAnchor="middle">{labels.sub}</text>
      </svg>
    </div>
  );
}

export function TimingArcVisual({ className, lang }: VisualProps) {
  const label = useLabel("timing", lang);
  const shown = useVisualLang(lang);
  const hour = (h: string) => formatClockHour(`${h}:00`, shown);
  return (
    <div className={cx("mk-visual mk-visual--timing", className)}>
      <svg viewBox="0 0 360 240" role="img" aria-label={label}>
        <path className="mk-orbit mk-orbit--wide" d="M38 160C72 70 288 70 322 160" />
        <path className="mk-orbit" d="M70 160C98 104 262 104 290 160" />
        <path className="mk-arc-base" d="M42 170h276" />
        <path className="mk-arc-good" d="M142 170h62" />
        <path className="mk-arc-warn" d="M238 170h42" />
        <circle className="mk-sun-dot" cx="180" cy="96" r="14" />
        <g className="mk-ticks">
          <path d="M42 170v16M111 170v12M180 170v16M249 170v12M318 170v16" />
        </g>
        <text className="mk-label" x="30" y="207">{hour("06")}</text>
        <text className="mk-label" x="94" y="207">{hour("09")}</text>
        <text className="mk-label mk-label--strong" x="156" y="207">{hour("12")}</text>
        <text className="mk-label" x="232" y="207">{hour("15")}</text>
        <text className="mk-label" x="298" y="207">{hour("18")}</text>
        <text className="mk-center-sub" x="151" y="52">{shown === "ta" ? "நல்ல நேரம்" : "best window"}</text>
      </svg>
    </div>
  );
}

export function PanchangamWheelVisual({ className, lang }: VisualProps) {
  const label = useLabel("wheel", lang);
  const shown = useVisualLang(lang);
  const limbs = shown === "ta" ? ["திதி", "நட்சத்திரம்", "யோகம்", "கரணம்", "வாரம்"] : ["Tithi", "Birth Star", "Yoga", "Karana", "Vara"];

  return (
    <div className={cx("mk-visual mk-visual--wheel", className)}>
      <svg viewBox="0 0 320 320" role="img" aria-label={label}>
        <circle className="mk-ring mk-ring--outer" cx="160" cy="160" r="124" />
        <circle className="mk-ring" cx="160" cy="160" r="82" />
        <circle className="mk-sun-dot" cx="160" cy="160" r="22" />
        {limbs.map((limb, index) => {
          const angle = -90 + index * 72;
          const x = 160 + Math.cos((angle * Math.PI) / 180) * 105;
          const y = 160 + Math.sin((angle * Math.PI) / 180) * 105;
          return (
            <g key={limb}>
              <line className="mk-spoke" x1="160" y1="160" x2={x} y2={y} />
              <circle className="mk-node" cx={x} cy={y} r="18" />
              <text className="mk-label mk-label--strong" x={x} y={y + 36} textAnchor="middle">{limb}</text>
            </g>
          );
        })}
        <text className="mk-center-title" x="160" y="155" textAnchor="middle">5</text>
        <text className="mk-center-sub" x="160" y="178" textAnchor="middle">{shown === "ta" ? "அங்கங்கள்" : "limbs"}</text>
      </svg>
    </div>
  );
}

export function PoruthamRingsVisual({ className, lang }: VisualProps) {
  const label = useLabel("porutham", lang);
  const shown = useVisualLang(lang);
  const checks = [92, 76, 64, 88, 52, 70, 84, 58, 80, 68];

  return (
    <div className={cx("mk-visual mk-visual--porutham", className)}>
      <svg viewBox="0 0 340 260" role="img" aria-label={label}>
        <circle className="mk-ring mk-ring--outer" cx="122" cy="118" r="74" />
        <circle className="mk-ring mk-ring--outer" cx="218" cy="118" r="74" />
        <path className="mk-link-glow" d="M122 118C150 78 190 78 218 118C190 158 150 158 122 118Z" />
        <circle className="mk-sun-dot" cx="170" cy="118" r="18" />
        <text className="mk-center-title" x="170" y="124" textAnchor="middle">8/10</text>
        {checks.map((value, index) => {
          const x = 54 + index * 26;
          const height = 12 + value * 0.32;
          return (
            <g key={index}>
              <rect className="mk-mini-track" x={x} y="214" width="12" height="28" rx="6" />
              <rect className="mk-mini-fill" x={x} y={242 - height} width="12" height={height} rx="6" />
            </g>
          );
        })}
        <text className="mk-center-sub" x="170" y="36" textAnchor="middle">{shown === "ta" ? "10 பொருத்தங்கள்" : "10 poruthams"}</text>
      </svg>
    </div>
  );
}

export function FamilyOrbitVisual({ className, lang }: VisualProps) {
  const label = useLabel("family", lang);
  const shown = useVisualLang(lang);
  const members = [
    { key: "Arjun", name: shown === "ta" ? "அர்ஜுன்" : "Arjun", x: 72, y: 154, score: 64 },
    { key: "Priya", name: shown === "ta" ? "பிரியா" : "Priya", x: 174, y: 78, score: 81 },
    { key: "Kavitha", name: shown === "ta" ? "கவிதா" : "Kavitha", x: 266, y: 168, score: 47 },
  ];

  return (
    <div className={cx("mk-visual mk-visual--family", className)}>
      <svg viewBox="0 0 340 260" role="img" aria-label={label}>
        <path className="mk-orbit" d="M72 154C102 64 226 44 266 168" />
        <path className="mk-orbit mk-orbit--wide" d="M72 154C130 214 224 218 266 168" />
        <circle className="mk-sun-dot" cx="170" cy="136" r="24" />
        <text className="mk-center-title" x="170" y="142" textAnchor="middle">{formatClockLabel("11:53", shown)}</text>
        {members.map((member) => (
          <g key={member.key}>
            <circle className="mk-node" cx={member.x} cy={member.y} r="22" />
            <text className="mk-label mk-label--strong" x={member.x} y={member.y + 4} textAnchor="middle">{member.score}</text>
            <text className="mk-label" x={member.x} y={member.y + 40} textAnchor="middle">{member.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function NakshatraMapVisual({ className, lang }: VisualProps) {
  const label = useLabel("nakshatra", lang);
  const shown = useVisualLang(lang);
  const stars = [
    [38, 80], [74, 55], [110, 96], [148, 48], [188, 84], [228, 58], [276, 98],
    [68, 170], [116, 146], [162, 184], [220, 152], [282, 178],
  ];

  return (
    <div className={cx("mk-visual mk-visual--stars", className)}>
      <svg viewBox="0 0 320 240" role="img" aria-label={label}>
        <path className="mk-orbit" d="M38 80L74 55L110 96L148 48L188 84L228 58L276 98" />
        <path className="mk-orbit mk-orbit--wide" d="M68 170L116 146L162 184L220 152L282 178" />
        {stars.map(([x, y], index) => (
          <circle key={`${x}-${y}`} className={index % 3 === 0 ? "mk-star mk-star--bright" : "mk-star"} cx={x} cy={y} r={index % 3 === 0 ? 5 : 3.5} />
        ))}
        <circle className="mk-ring" cx="160" cy="120" r="88" />
        <text className="mk-center-title" x="160" y="118" textAnchor="middle">27</text>
        <text className="mk-center-sub" x="160" y="141" textAnchor="middle">{shown === "ta" ? "நட்சத்திரங்கள்" : "nakshathirams"}</text>
      </svg>
    </div>
  );
}

/**
 * How a name becomes a number — the one step that makes the whole calculator
 * legible, drawn instead of explained.
 *
 * The worked example is the word NAME itself, and the values are real: the
 * Chaldean groups in app/calculations/numerology.py put N in group 5, A in 1,
 * M in 4 and E in 5, totalling 15, which lands inside Cheiro's encoded 10–52
 * series and reduces to 6 — Venus. Verified against that table rather than
 * eyeballed, because a marketing visual teaching a wrong letter value would be
 * a domain error on the most-read surface we have.
 */
export function NumerologyChainVisual({ className, lang }: VisualProps) {
  const label = useLabel("numerology", lang);
  const shown = useVisualLang(lang);
  const letters: Array<[string, number]> = [
    ["N", 5],
    ["A", 1],
    ["M", 4],
    ["E", 5],
  ];
  const labels =
    shown === "ta"
      ? { total: "மொத்தம்", compound: "கூட்டு எண்", root: "ஒற்றை இலக்கம்", graha: "சுக்கிரன்" }
      : { total: "adds up to", compound: "compound", root: "single digit", graha: "Venus" };

  return (
    <div className={cx("mk-visual mk-visual--numerology", className)}>
      <svg viewBox="0 0 340 300" role="img" aria-label={label}>
        {letters.map(([letter, value], index) => {
          const x = 46 + index * 66;
          return (
            <g key={letter}>
              <rect className="mk-paper" x={x} y="26" width="52" height="56" rx="10" />
              <text className="mk-center-title" x={x + 26} y="58" textAnchor="middle">
                {letter}
              </text>
              <text className="mk-label mk-label--strong" x={x + 26} y="74" textAnchor="middle">
                {value}
              </text>
            </g>
          );
        })}

        <path className="mk-spoke" d="M170 90v22" />
        <text className="mk-center-sub" x="170" y="106" textAnchor="middle">
          {labels.total}
        </text>

        <rect className="mk-accent-cell" x="134" y="118" width="72" height="40" rx="12" />
        <text className="mk-center-title" x="170" y="146" textAnchor="middle">
          15
        </text>
        <text className="mk-center-sub" x="170" y="172" textAnchor="middle">
          {labels.compound}
        </text>

        <path className="mk-spoke" d="M170 180v24" />

        {/* Ringed light disc rather than a filled accent dot: the numeral is
            the point, and dark ink on burnt orange is not readable. */}
        <circle className="mk-ring mk-ring--outer" cx="170" cy="232" r="30" />
        <circle className="mk-paper" cx="170" cy="232" r="24" />
        <text className="mk-center-title" x="170" y="241" textAnchor="middle">
          6
        </text>
        <text className="mk-center-sub" x="170" y="278" textAnchor="middle">
          {labels.root} · {labels.graha}
        </text>
      </svg>
    </div>
  );
}

export function RasiTransitVisual({ className, lang }: VisualProps) {
  const label = useLabel("transit", lang);
  const shown = useVisualLang(lang);
  // Mesham .. Meenam, two letters each: the first syllables of the Tamil names.
  const signs = shown === "ta"
    ? ["மே", "ரி", "மி", "கட", "சி", "கன்", "து", "வி", "த", "ம", "கு", "மீ"]
    : ["Me", "Ri", "Mi", "Ka", "Si", "Ka", "Tu", "Vi", "Dh", "Ma", "Ku", "Mi"];

  return (
    <div className={cx("mk-visual mk-visual--rasi", className)}>
      <svg viewBox="0 0 320 320" role="img" aria-label={label}>
        <circle className="mk-ring mk-ring--outer" cx="160" cy="160" r="122" />
        <circle className="mk-ring" cx="160" cy="160" r="76" />
        {signs.map((sign, index) => {
          const angle = -90 + index * 30;
          const x = 160 + Math.cos((angle * Math.PI) / 180) * 104;
          const y = 160 + Math.sin((angle * Math.PI) / 180) * 104;
          return (
            <g key={`${sign}-${index}`}>
              <circle className={index === 7 ? "mk-node mk-node--warn" : "mk-node"} cx={x} cy={y} r="14" />
              <text className="mk-label" x={x} y={y + 4} textAnchor="middle">{sign}</text>
            </g>
          );
        })}
        <path className="mk-arc-good" d="M104 76A104 104 0 0 1 238 88" />
        <circle className="mk-sun-dot" cx="160" cy="160" r="18" />
        <text className="mk-center-sub" x="160" y="202" textAnchor="middle">{shown === "ta" ? "சந்திரப் பெயர்ச்சி" : "Moon transit"}</text>
      </svg>
    </div>
  );
}
