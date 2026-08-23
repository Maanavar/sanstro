import Link from "next/link";
import type { Metadata } from "next";

import { GLOSSARY, type GlossaryKey } from "@/lib/glossary";

export const metadata: Metadata = {
  title: "Glossary | Vinaadi AI",
};

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
};

export default function DashboardGlossaryPage() {
  const entries = (Object.keys(GLOSSARY) as GlossaryKey[]).map((key) => ({
    key,
    label: TERM_LABELS[key],
    definition: GLOSSARY[key],
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
          Back to dashboard / டேஷ்போர்டுக்குத் திரும்பு
        </Link>
        <header style={{ maxWidth: "760px", marginBottom: "var(--space-5)" }}>
          <p style={{ margin: "0 0 var(--space-2)", color: "var(--color-muted)", fontSize: "var(--text-sm)", fontWeight: 700 }}>
            Dashboard help / டேஷ்போர்டு உதவி
          </p>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.05 }}>
            Glossary / சொற்களஞ்சியம்
          </h1>
          <p style={{ margin: "var(--space-3) 0 0", color: "var(--color-muted)", fontSize: "var(--text-base)", lineHeight: 1.6 }}>
            Plain-language meanings for the traditional words used across Today, Calendar, charts, dashas and timing.
            {" / "}
            Today, Calendar, ஜாதகம், தசை மற்றும் நேரக் கணக்குகளில் வரும் பாரம்பரிய சொற்களின் எளிய விளக்கங்கள்.
          </p>
        </header>
        <section
          aria-label="Glossary terms"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "var(--space-3)",
          }}
        >
          {entries.map((entry) => (
            <article
              key={entry.key}
              id={entry.key}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                padding: "var(--space-4)",
              }}
            >
              <h2 style={{ margin: 0, color: "var(--color-accent-strong)", fontSize: "var(--text-md)", fontWeight: 700 }}>
                {entry.label.en} / {entry.label.ta}
              </h2>
              <p style={{ margin: "var(--space-2) 0 0", color: "var(--color-text)", fontSize: "var(--text-sm)", lineHeight: 1.55 }}>
                {entry.definition.en}
              </p>
              <p lang="ta" style={{ margin: "var(--space-2) 0 0", color: "var(--color-muted)", fontSize: "var(--text-sm)", lineHeight: 1.7 }}>
                {entry.definition.ta}
              </p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
