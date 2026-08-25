"use client";

import Link from "next/link";

import { useLang } from "@/components/lang-toggle";
import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

/**
 * T10 — the index over `GLOSSARY`, linked from every `GlossaryTerm`'s
 * "See all terms".
 *
 * A CLIENT COMPONENT, and that is the whole reason this file exists apart from
 * `page.tsx`. The page needs `metadata`, which only a server component may
 * export; it needs the active language, which lives in `LangContext` (root
 * layout, client-side). Rendering it server-side without the language is what
 * made the first version print English *and* Tamil for every heading and every
 * definition — and the owner has twice rejected exactly that, most recently on
 * 2026-07-22 after a ten-spot sweep, with the rule stated as absolute: never
 * render both languages for the same label anywhere on the dashboard, in
 * either mode, with no carve-out for reference or proper-noun content. A
 * glossary is the most tempting place in the product to make that exception
 * and still not an exception: an English reader wants 42 English definitions,
 * not 42 English definitions interleaved with 42 Tamil ones.
 */

// Display names for each key. `Record<GlossaryKey, …>` on purpose: adding a
// glossary entry without a label here is a type error, not a blank heading.
const TERM_LABELS: Record<GlossaryKey, { en: string; ta: string }> = {
  dasha: { en: "Dasha", ta: "தசை" },
  bhukti: { en: "Bhukti", ta: "புக்தி" },
  rasi: { en: "Rasi", ta: "ராசி" },
  nakshatra: { en: "Nakshatra", ta: "நட்சத்திரம்" },
  gochar: { en: "Gochar", ta: "கோசாரம்" },
  shadbala: { en: "Shadbala", ta: "ஷட்பலம்" },
  sthanaBala: { en: "Sthana Bala", ta: "ஸ்தான பலம்" },
  digBala: { en: "Dig Bala", ta: "திக் பலம்" },
  kalaBala: { en: "Kala Bala", ta: "கால பலம்" },
  chestaBala: { en: "Chesta Bala", ta: "சேஷ்டா பலம்" },
  naisargikaBala: { en: "Naisargika Bala", ta: "நைசர்கிக பலம்" },
  drikBala: { en: "Drik Bala", ta: "திருக் பலம்" },
  varga: { en: "Varga", ta: "வர்க்கம்" },
  navamsa: { en: "Navamsa", ta: "நவாம்சம்" },
  atmakaraka: { en: "Atmakaraka", ta: "ஆத்மகாரகன்" },
  karakamsa: { en: "Karakamsa", ta: "காரகாம்சம்" },
  yoginiDasha: { en: "Yogini Dasha", ta: "யோகினி தசை" },
  ashtottariDasha: { en: "Ashtottari Dasha", ta: "அஷ்டோத்தரி தசை" },
  kalachakraDasha: { en: "Kalachakra Dasha", ta: "காலசக்கர தசை" },
  charaDasha: { en: "Chara Dasha", ta: "சர தசை" },
  panchangam: { en: "Panchangam", ta: "பஞ்சாங்கம்" },
  tithi: { en: "Tithi", ta: "திதி" },
  karana: { en: "Karana", ta: "கரணம்" },
  vara: { en: "Vara", ta: "வாரம்" },
  yogam: { en: "Yogam", ta: "யோகம்" },
  paksham: { en: "Paksham", ta: "பக்ஷம்" },
  rahuKalam: { en: "Rahu Kalam", ta: "ராகு காலம்" },
  yamagandam: { en: "Yamagandam", ta: "யமகண்டம்" },
  kuligai: { en: "Kuligai", ta: "குளிகை" },
  nallaNeram: { en: "Nalla Neram", ta: "நல்ல நேரம்" },
  abhijit: { en: "Abhijit", ta: "அபிஜித்" },
  hora: { en: "Horai", ta: "ஓரை" },
  chandrashtama: { en: "Chandrashtama", ta: "சந்திராஷ்டமம்" },
  karinaal: { en: "Karinaal", ta: "கரிநாள்" },
  soolam: { en: "Soolam", ta: "சூலம்" },
  parigaram: { en: "Parigaram", ta: "பரிகாரம்" },
  amirdhadhi: { en: "Amirdhadhi", ta: "அமிர்தாதி" },
  muhurtham: { en: "Muhurtham", ta: "முகூர்த்தம்" },
  lagnam: { en: "Lagnam", ta: "லக்னம்" },
  pada: { en: "Pada", ta: "பாதம்" },
  peyarchi: { en: "Peyarchi", ta: "பெயர்ச்சி" },
  sadeSati: { en: "Sade Sati", ta: "ஏழரை சனி" },
  // New Tamil, pending native review.
  house: { en: "House", ta: "வீடு" },
  // New Tamil, pending native review.
  yoga: { en: "Yoga", ta: "யோகம்" },
  pournami: { en: "Pournami", ta: "பௌர்ணமி" },
  chathurthi: { en: "Chathurthi", ta: "சதுர்த்தி" },
  sashti: { en: "Sashti", ta: "சஷ்டி" },
  ekadashi: { en: "Ekadashi", ta: "ஏகாதசி" },
  pradosham: { en: "Pradosham", ta: "பிரதோஷம்" },
  vratham: { en: "Vratham", ta: "விரதம்" },
};

// New Tamil, pending native review.
const COPY = {
  back: { en: "Back to dashboard", ta: "டேஷ்போர்டுக்குத் திரும்பு" },
  kicker: { en: "Dashboard help", ta: "டேஷ்போர்டு உதவி" },
  title: { en: "Glossary", ta: "சொற்களஞ்சியம்" },
  intro: {
    en: "Plain-language meanings for the traditional words used across Today, Calendar, charts, dashas and timing.",
    // The tab names here must be the TAMIL ones. This line points the reader at
    // places in the product, and in Tamil mode those tabs are labelled இன்று and
    // நாட்காட்டி — naming them "Today, Calendar" sent a Tamil reader looking for
    // two words that appear nowhere in the UI they are looking at.
    ta: "இன்று, நாட்காட்டி, ஜாதகம், தசை மற்றும் நேரக் கணக்குகளில் வரும் பாரம்பரிய சொற்களின் எளிய விளக்கங்கள்.",
  },
  termsLabel: { en: "Glossary terms", ta: "சொற்கள்" },
} as const;

export function GlossaryIndex() {
  const [lang] = useLang();
  const pick = <T,>(entry: { en: T; ta: T }): T => (lang === "ta" ? entry.ta : entry.en);

  const entries = (Object.keys(GLOSSARY) as GlossaryKey[]).map((key) => ({
    key,
    label: pick(TERM_LABELS[key]),
    definition: pick(GLOSSARY[key]),
  }));

  return (
    <div className="cd-shell" data-ui="nova">
      <div className="cd-page" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-8)" }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            marginBottom: "var(--space-4)",
            color: "var(--color-accent-secondary)",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {pick(COPY.back)}
        </Link>
        <header style={{ maxWidth: "760px", marginBottom: "var(--space-5)" }}>
          <p style={{ margin: "0 0 var(--space-2)", color: "var(--color-muted)", fontSize: "var(--text-sm)", fontWeight: 700 }}>
            {pick(COPY.kicker)}
          </p>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.05 }}>
            {pick(COPY.title)}
          </h1>
          <p style={{ margin: "var(--space-3) 0 0", color: "var(--color-muted)", fontSize: "var(--text-base)", lineHeight: 1.6 }}>
            {pick(COPY.intro)}
          </p>
        </header>
        <section
          aria-label={pick(COPY.termsLabel)}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          {entries.map((entry) => (
            <article
              // `id` is the deep-link target: /dashboard/glossary#tithi. The
              // class carries the `:target` ring that says which of 42
              // identical cards the link meant — see dashboard-nova.css.
              key={entry.key}
              id={entry.key}
              className="cd-glossary-card"
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                padding: "var(--space-4)",
              }}
            >
              <h2 style={{ margin: 0, color: "var(--color-accent-strong)", fontSize: "var(--text-md)", fontWeight: 700 }}>
                {entry.label}
              </h2>
              <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text)", fontSize: "var(--text-sm)", lineHeight: 1.55 }}>
                {entry.definition}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
