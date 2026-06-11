"use client";

import type { NatchathiramEntry } from "@/lib/natchathiram-data";
import { romanNakshathiramName, romanNakshathiramLabel } from "@/lib/tamil-astro";

const RASI_GLYPHS: Record<string, { glyph: string; tone: string }> = {
  Aries: { glyph: "♈", tone: "fire" },
  Taurus: { glyph: "♉", tone: "earth" },
  Gemini: { glyph: "♊", tone: "air" },
  Cancer: { glyph: "♋", tone: "water" },
  Leo: { glyph: "♌", tone: "fire" },
  Virgo: { glyph: "♍", tone: "earth" },
  Libra: { glyph: "♎", tone: "air" },
  Scorpio: { glyph: "♏", tone: "water" },
  Sagittarius: { glyph: "♐", tone: "fire" },
  Capricorn: { glyph: "♑", tone: "earth" },
  Aquarius: { glyph: "♒", tone: "air" },
  Pisces: { glyph: "♓", tone: "water" },
};

const NAKSHATRA_POINTS: Array<[number, number]> = [
  [36, 80], [66, 54], [96, 74], [128, 42], [160, 70], [194, 48], [224, 84],
  [250, 54], [282, 80], [58, 142], [88, 172], [120, 142], [152, 180], [184, 142],
  [216, 174], [250, 142], [38, 218], [72, 202], [106, 226], [138, 204], [172, 226],
  [206, 204], [240, 226], [274, 204], [112, 106], [160, 116], [210, 106],
];

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function rasiFor(name?: string) {
  if (!name) return RASI_GLYPHS.Aries;
  return RASI_GLYPHS[name] ?? RASI_GLYPHS.Aries;
}

export function RasiGlyph({ rasi, label, size = "md" }: { rasi?: string; label?: string; size?: "sm" | "md" | "lg" }) {
  const item = rasiFor(rasi);

  return (
    <span className={cx("as-rasi", `as-rasi--${item.tone}`, `as-rasi--${size}`)} aria-label={label ?? rasi ?? "Rasi"}>
      {item.glyph}
    </span>
  );
}

export function NakshatraSigil({ number, name, size = "md" }: { number: number; name?: string; size?: "sm" | "md" | "lg" }) {
  const index = Math.max(0, Math.min(number - 1, NAKSHATRA_POINTS.length - 1));
  const [x, y] = NAKSHATRA_POINTS[index];
  const prev = NAKSHATRA_POINTS[Math.max(0, index - 1)];
  const next = NAKSHATRA_POINTS[Math.min(NAKSHATRA_POINTS.length - 1, index + 1)];

  return (
    <span className={cx("as-nak", `as-nak--${size}`)} aria-label={name ? `${romanNakshathiramName(name)} nakshathiram` : `Nakshathiram ${number}`}>
      <svg viewBox="0 0 320 260" aria-hidden="true">
        <path className="as-nak__orbit" d="M36 80C92 28 144 28 194 48C238 66 272 82 282 80" />
        <path className="as-nak__orbit as-nak__orbit--low" d="M38 218C96 180 150 184 206 204C238 216 260 218 274 204" />
        {prev && <path className="as-nak__link" d={`M${prev[0]} ${prev[1]}L${x} ${y}L${next[0]} ${next[1]}`} />}
        {NAKSHATRA_POINTS.map(([sx, sy], i) => (
          <circle key={`${sx}-${sy}`} className={i === index ? "as-nak__star as-nak__star--active" : "as-nak__star"} cx={sx} cy={sy} r={i === index ? 8 : 3.5} />
        ))}
        <text className="as-nak__num" x={x} y={y + 28} textAnchor="middle">{number}</text>
      </svg>
    </span>
  );
}

export function NakshatraSymbolCard({ data, compact = false }: { data: NatchathiramEntry; compact?: boolean }) {
  const englishName = romanNakshathiramName(data.name_en);

  return (
    <div className={cx("as-card", compact && "as-card--compact")}>
      <div className="as-card__visual">
        <NakshatraSigil number={data.number} name={englishName} size={compact ? "sm" : "lg"} />
      </div>
      <div className="as-card__body">
        <p className="as-card__eyebrow">Nakshathiram {data.number}/27</p>
        <h3 className="as-card__title">{englishName}</h3>
        <p className="as-card__sub">{data.name_ta}</p>
      </div>
      <RasiGlyph rasi={data.rasi_en} label={data.rasi_en} size={compact ? "sm" : "md"} />
    </div>
  );
}

export function NatchathiramFactVisual({ data }: { data: NatchathiramEntry }) {
  const englishName = romanNakshathiramName(data.name_en);

  return (
    <div className="as-profile">
      <div className="as-profile__main">
        <NakshatraSigil number={data.number} name={englishName} size="lg" />
        <div>
          <p className="as-card__eyebrow">Birth Star</p>
          <h3 className="as-profile__title">{romanNakshathiramLabel(englishName)}</h3>
          <p className="as-profile__sub">{data.name_ta}</p>
        </div>
      </div>
      <div className="as-profile__rasi">
        <RasiGlyph rasi={data.rasi_en} label={data.rasi_en} size="lg" />
        <div>
          <p className="as-card__eyebrow">Rasi</p>
          <p className="as-profile__value">{data.rasi_en}</p>
          <p className="as-profile__sub">{data.rasi_ta}</p>
        </div>
      </div>
    </div>
  );
}

export function TopicSymbolPanel({ topic }: { topic: "method" | "thirukanitham" | "jadhagam" | "birth-time" | "porutham" | "chandrashtama" | "about" }) {
  const config = {
    method: { title: "Calculation Stack", sub: "ephemeris, ayanamsa, panchangam", marks: ["♈", "☉", "☽", "27"] },
    thirukanitham: { title: "Precise Sky", sub: "drik positions, not guesswork", marks: ["☉", "☽", "♃", "♄"] },
    jadhagam: { title: "Chart Map", sub: "lagna, rasi, houses and dasha", marks: ["D1", "♋", "☽", "9"] },
    "birth-time": { title: "Minutes Matter", sub: "lagna can shift with time", marks: ["00", "♋", "D1", "↻"] },
    porutham: { title: "Matching Lens", sub: "birth star, rasi and dosha checks", marks: ["10", "♎", "27", "⚬"] },
    chandrashtama: { title: "8th Moon", sub: "awareness window, not fear", marks: ["☽", "8", "♏", "!"] },
    about: { title: "Vinaadi", sub: "Tamil astrology, made readable", marks: ["27", "D1", "☽", "♈"] },
  }[topic];

  return (
    <div className="as-topic">
      <div className="as-topic__sky">
        {config.marks.map((mark, index) => (
          <span key={`${mark}-${index}`} className={`as-topic__mark as-topic__mark--${index}`}>{mark}</span>
        ))}
      </div>
      <p className="as-card__eyebrow">{config.sub}</p>
      <h3 className="as-topic__title">{config.title}</h3>
    </div>
  );
}
