"use client";

import type { CSSProperties } from "react";
import type { NatchathiramEntry } from "@/lib/natchathiram-data";
import { romanNakshathiramName, romanNakshathiramLabel } from "@/lib/tamil-astro";
import { ZodiacBadge } from "@/components/zodiac-badge";
import { NakshatraBadge } from "@/components/nakshatra-badge";

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

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function rasiFor(name?: string) {
  if (!name) return RASI_GLYPHS.Aries;
  return RASI_GLYPHS[name] ?? RASI_GLYPHS.Aries;
}

// Western rasi name -> canonical number 1..12. RASI_GLYPHS is already declared
// in zodiac order (Aries=1 … Pisces=12), so its key order gives the number.
// The public natchathiram surfaces pass western names (data.rasi_en), unlike
// the dashboard which uses the Mesham-style romanisation resolved elsewhere.
const RASI_NUMBER_BY_EN: Record<string, number> = Object.keys(RASI_GLYPHS).reduce(
  (acc, name, idx) => { acc[name.toLowerCase()] = idx + 1; return acc; },
  {} as Record<string, number>,
);

// sm/md/lg pixel sizes for the real artwork badges, chosen to sit within the
// existing .as-rasi / .as-nak container boxes (incl. their mobile overrides).
const RASI_PX = { sm: 34, md: 48, lg: 70 } as const;
const NAK_PX = { sm: 40, md: 52, lg: 124 } as const;
// The wrapper keeps its .as-rasi/.as-nak sizing + layout classes (so the
// responsive selectors still match) but drops the placeholder pill fill/shadow;
// the artwork brings its own dark gem surface.
const BADGE_WRAP_RESET: CSSProperties = { background: "none", boxShadow: "none", borderRadius: 0 };

export function RasiGlyph({ rasi, label, size = "md" }: { rasi?: string; label?: string; size?: "sm" | "md" | "lg" }) {
  const num = rasi ? RASI_NUMBER_BY_EN[rasi.trim().toLowerCase()] ?? null : null;

  // Fallback to the classical Unicode glyph if the name doesn't resolve.
  if (num == null) {
    const item = rasiFor(rasi);
    return (
      <span className={cx("as-rasi", `as-rasi--${item.tone}`, `as-rasi--${size}`)} aria-label={label ?? rasi ?? "Rasi"}>
        {item.glyph}
      </span>
    );
  }

  return (
    <span className={cx("as-rasi", `as-rasi--${size}`)} style={BADGE_WRAP_RESET} aria-label={label ?? rasi ?? "Rasi"}>
      <ZodiacBadge rasi={num} size={RASI_PX[size]} glyph={RASI_GLYPHS[rasi ?? ""]?.glyph} />
    </span>
  );
}

export function NakshatraSigil({ number, name, size = "md" }: { number: number; name?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cx("as-nak", `as-nak--${size}`)}
      style={BADGE_WRAP_RESET}
      aria-label={name ? `${romanNakshathiramName(name)} nakshathiram` : `Nakshathiram ${number}`}
    >
      <NakshatraBadge nakshatra={number} size={NAK_PX[size]} />
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

export function TopicSymbolPanel({ topic }: { topic: "method" | "thirukanitham" | "jadhagam" | "birth-time" | "porutham" | "chandrashtama" | "about" | "dosham" | "yogam" | "pariharam" | "temple" }) {
  const config = {
    method: { title: "Calculation Stack", sub: "ephemeris, ayanamsa, panchangam", marks: ["♈", "☉", "☽", "27"] },
    thirukanitham: { title: "Precise Sky", sub: "drik positions, not guesswork", marks: ["☉", "☽", "♃", "♄"] },
    jadhagam: { title: "Chart Map", sub: "lagna, rasi, houses and dasa", marks: ["D1", "♋", "☽", "9"] },
    "birth-time": { title: "Minutes Matter", sub: "lagna can shift with time", marks: ["00", "♋", "D1", "↻"] },
    porutham: { title: "Matching Lens", sub: "birth star, rasi and dosha checks", marks: ["10", "♎", "27", "⚬"] },
    chandrashtama: { title: "8th Moon", sub: "awareness window, not fear", marks: ["☽", "8", "♏", "!"] },
    about: { title: "Vinaadi", sub: "Tamil astrology, made readable", marks: ["27", "D1", "☽", "♈"] },
    dosham: { title: "Dosham", sub: "afflictions, strength and balance", marks: ["♂", "☊", "♄", "7"] },
    yogam: { title: "Yogam", sub: "combinations, dignity and rise", marks: ["♃", "☽", "★", "10"] },
    pariharam: { title: "Pariharam", sub: "devotion, slokam and steadiness", marks: ["ॐ", "🪔", "108", "♀"] },
    temple: { title: "Sacred Sthalam", sub: "deity, blessing and faith", marks: ["🛕", "♄", "ॐ", "9"] },
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
