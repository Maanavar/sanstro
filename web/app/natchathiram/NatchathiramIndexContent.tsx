"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { NATCHATHIRAM_INDEX, mt } from "@/lib/marketing-i18n";
import { NATCHATHIRAM_LIST } from "@/lib/natchathiram-data";
import { romanNakshathiramName, tamilizeAstroEnglish } from "@/lib/tamil-astro";
import { NakshatraMapVisual } from "@/components/marketing-visuals";
import { NakshatraSigil } from "@/components/astro-symbols";

export function NatchathiramIndexContent() {
  const [lang] = useLang();
  const d = NATCHATHIRAM_INDEX;
  const text = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);
  const visualHref = (slug: string) => `/natchathiram/${slug}/visual`;

  const available = NATCHATHIRAM_LIST.filter((n) => n.available);
  const upcoming = NATCHATHIRAM_LIST.filter((n) => !n.available);

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* ── Hero ── */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{text(mt(d.eyebrow, lang))}</p>
              <h1 className="cl-pub-h1">
                {lang === "ta" ? "27 நட்சத்திரங்கள்" : "27 Nakshathirams"}
              </h1>
              {lang === "en" && (
                <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--cl-muted)", marginBottom: "1rem", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                  {text(mt(d.h1_sub, lang))}
                </p>
              )}
              <p className="cl-pub-lead">{text(mt(d.lead, lang))}</p>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{text(mt(d.figure_label, lang))}</p>
              <NakshatraMapVisual />
              <p className="cl-hero-figure__title">{text(mt(d.figure_title, lang))}</p>
            </div>
          </div>
        </section>

        {/* ── Available nakshatras ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{text(mt(d.available_h2, lang))}</h2>
            <div className="cl-natch-grid">
              {available.map((n) => (
                <Link
                  key={n.slug}
                  href={visualHref(n.slug)}
                  className="cl-natch-card cl-natch-tile"
                  style={{ position: "relative" }}
                >
                  <span className="cl-natch-tile__num">{n.number}</span>
                  <span className="cl-natch-tile__sigil">
                    <NakshatraSigil number={n.number} name={romanNakshathiramName(n.name_en)} size="md" />
                  </span>
                  <span className="cl-natch-tile__body">
                    <span className="cl-natch-tile__ta">{n.name_ta}</span>
                    <span className="cl-natch-tile__en">{romanNakshathiramName(n.name_en)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Upcoming ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{text(mt(d.upcoming_h2, lang))}</h2>
            <p style={{ opacity: 0.65, marginBottom: "1.5rem" }}>
              {text(mt(d.upcoming_desc, lang))}
            </p>
            <div className="cl-natch-grid cl-natch-grid--small">
              {upcoming.map((n) => (
                <div key={n.slug} className="cl-natch-tile cl-natch-tile--muted">
                  <span className="cl-natch-tile__num">{n.number}</span>
                  <span className="cl-natch-tile__sigil">
                    <NakshatraSigil number={n.number} name={romanNakshathiramName(n.name_en)} size="sm" />
                  </span>
                  <span className="cl-natch-tile__body">
                    <span className="cl-natch-tile__status">
                      {lang === "en" ? "Coming soon" : "விரைவில்"}
                    </span>
                    <span className="cl-natch-tile__ta">{n.name_ta}</span>
                    <span className="cl-natch-tile__en">{romanNakshathiramName(n.name_en)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What is nakshatra ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{text(mt(d.what_h2, lang))}</h2>
            <p>{text(mt(d.what_p1, lang))}</p>
            <p>{text(mt(d.what_p2, lang))}</p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--primary">
                {text(mt(d.what_cta, lang))}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
