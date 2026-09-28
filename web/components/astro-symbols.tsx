"use client";

import type { CSSProperties } from "react";
import type { NatchathiramEntry } from "@/lib/natchathiram-data";
import { romanNakshathiramName, romanNakshathiramLabel } from "@/lib/tamil-astro";
import { ZodiacBadge } from "@/components/zodiac-badge";
import { useLang } from "@/components/lang-context";
import { rasiDisplayName } from "@/lib/chart-utils";
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
  const [lang] = useLang();
  const num = rasi ? RASI_NUMBER_BY_EN[rasi.trim().toLowerCase()] ?? null : null;
  // A caller's `label` wins; without one the accessible name is the rasi in the
  // reader's language, from the key, never the English name string.
  const accessibleName = label ?? (num != null ? rasiDisplayName(num, lang) : (rasi ?? (lang === "ta" ? "ராசி" : "Rasi")));

  // Fallback to the classical Unicode glyph if the name doesn't resolve.
  if (num == null) {
    const item = rasiFor(rasi);
    return (
      <span className={cx("as-rasi", `as-rasi--${item.tone}`, `as-rasi--${size}`)} aria-label={accessibleName}>
        {item.glyph}
      </span>
    );
  }

  return (
    <span className={cx("as-rasi", `as-rasi--${size}`)} style={BADGE_WRAP_RESET} aria-label={accessibleName}>
      <ZodiacBadge rasi={num} size={RASI_PX[size]} glyph={RASI_GLYPHS[rasi ?? ""]?.glyph} />
    </span>
  );
}

export function NakshatraSigil({ number, name, nameTa, size = "md" }: { number: number; name?: string; nameTa?: string; size?: "sm" | "md" | "lg" }) {
  const [lang] = useLang();
  const label =
    lang === "ta"
      ? nameTa ? `${nameTa} நட்சத்திரம்` : `நட்சத்திரம் ${number}`
      : name ? `${romanNakshathiramName(name)} nakshathiram` : `Nakshathiram ${number}`;
  return (
    <span
      className={cx("as-nak", `as-nak--${size}`)}
      style={BADGE_WRAP_RESET}
      aria-label={label}
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

// F7 part two — takes the five fields it renders, not the whole entry. This is
// a client component called from a Server Component, so its props are
// serialised into the RSC payload of all 27 `/natchathiram/*` routes; asking
// for `NatchathiramEntry` sent every one of them the entry's `sections` blob —
// paragraphs of Tamil prose already present in the rendered HTML — a second
// time. A prop type is a transfer cost once it crosses that boundary.
export type NatchathiramFacts = Pick<
  NatchathiramEntry,
  "number" | "name_en" | "name_ta" | "rasi_en" | "rasi_ta"
>;

export function NatchathiramFactVisual({ data }: { data: NatchathiramFacts }) {
  const [lang] = useLang();
  const ta = lang === "ta";
  const englishName = romanNakshathiramName(data.name_en);
  const rasi = ta ? data.rasi_ta : data.rasi_en;

  // One language: the reader's. The card used to print the English name over the
  // Tamil one (and the reverse) whichever language the page was in.
  return (
    <div className="as-profile">
      <div className="as-profile__main">
        <NakshatraSigil number={data.number} name={englishName} nameTa={data.name_ta} size="lg" />
        <div>
          <p className="as-card__eyebrow">{ta ? "பிறந்த நட்சத்திரம்" : "Birth Star"}</p>
          <h3 className="as-profile__title">{ta ? `${data.name_ta} நட்சத்திரம்` : romanNakshathiramLabel(englishName)}</h3>
        </div>
      </div>
      <div className="as-profile__rasi">
        <RasiGlyph rasi={data.rasi_en} label={rasi} size="lg" />
        <div>
          <p className="as-card__eyebrow">{ta ? "ராசி" : "Rasi"}</p>
          <p className="as-profile__value">{rasi}</p>
        </div>
      </div>
    </div>
  );
}

export function TopicSymbolPanel({ topic }: { topic: "method" | "thirukanitham" | "jadhagam" | "birth-time" | "porutham" | "chandrashtama" | "about" | "dosham" | "yogam" | "pariharam" | "temple" }) {
  const [lang] = useLang();
  const config = {
    method: { title: ["Calculation Stack", "கணிதத் தொகுப்பு"], sub: ["ephemeris, ayanamsa, panchangam", "கிரக நிலை, அயனாம்சம், பஞ்சாங்கம்"], marks: ["♈", "☉", "☽", "27"] },
    thirukanitham: { title: ["Precise Sky", "துல்லியமான வானம்"], sub: ["drik positions, not guesswork", "கண்ணால் காணும் கணிப்பு, ஊகம் அல்ல"], marks: ["☉", "☽", "♃", "♄"] },
    jadhagam: { title: ["Chart Map", "ஜாதகக் கட்ட வரைபடம்"], sub: ["lagna, rasi, houses and dasa", "லக்னம், ராசி, பாவங்கள், தசை"], marks: ["D1", "♋", "☽", "9"] },
    "birth-time": { title: ["Minutes Matter", "நிமிடங்களும் முக்கியம்"], sub: ["lagna can shift with time", "நேரம் மாறினால் லக்னம் மாறலாம்"], marks: ["00", "♋", "D1", "↻"] },
    porutham: { title: ["Matching Lens", "பொருத்தப் பார்வை"], sub: ["birth star, rasi and dosha checks", "நட்சத்திரம், ராசி, தோஷப் பரிசோதனை"], marks: ["10", "♎", "27", "⚬"] },
    chandrashtama: { title: ["8th Moon", "எட்டாம் சந்திரன்"], sub: ["awareness window, not fear", "அச்சம் அல்ல, விழிப்புணர்வுக் காலம்"], marks: ["☽", "8", "♏", "!"] },
    about: { title: ["Vinaadi", "Vinaadi"], sub: ["Tamil astrology, made readable", "தமிழ் ஜோதிடம், எளிமையாகப் படிக்க"], marks: ["27", "D1", "☽", "♈"] },
    dosham: { title: ["Dosham", "தோஷம்"], sub: ["afflictions, strength and balance", "பாதிப்புகள், வலிமை, சமநிலை"], marks: ["♂", "☊", "♄", "7"] },
    yogam: { title: ["Yogam", "யோகம்"], sub: ["combinations, dignity and rise", "சேர்க்கைகள், மேன்மை, உயர்வு"], marks: ["♃", "☽", "★", "10"] },
    pariharam: { title: ["Pariharam", "பரிகாரம்"], sub: ["devotion, slokam and steadiness", "பக்தி, ஸ்லோகம், மன உறுதி"], marks: ["ॐ", "🪔", "108", "♀"] },
    temple: { title: ["Sacred Sthalam", "புனிதத் தலம்"], sub: ["deity, blessing and faith", "தெய்வம், அருள், நம்பிக்கை"], marks: ["🛕", "♄", "ॐ", "9"] },
  }[topic];
  const i = lang === "ta" ? 1 : 0;
  const title = config.title[i];
  const sub = config.sub[i];

  return (
    <div className="as-topic">
      <div className="as-topic__sky">
        {config.marks.map((mark, index) => (
          <span key={`${mark}-${index}`} className={`as-topic__mark as-topic__mark--${index}`}>{mark}</span>
        ))}
      </div>
      <p className="as-card__eyebrow">{sub}</p>
      <h3 className="as-topic__title">{title}</h3>
    </div>
  );
}
