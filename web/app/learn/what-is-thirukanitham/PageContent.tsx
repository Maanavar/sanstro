"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { LEARN_THIRUK, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";

export function ThirukanithamPageContent() {
  const [lang] = useLang();
  const d = LEARN_THIRUK;

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{mt(d.eyebrow, lang)}</p>
              <h1 className="cl-pub-h1">{mt(d.h1, lang)}</h1>
              <p className="cl-pub-lead">{mt(d.lead, lang)}</p>
            </div>
            <TopicSymbolPanel topic="thirukanitham" />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.meaning_h2, lang)}</h2>
            <p>{mt(d.meaning_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.drik_h2, lang)}</h2>
            <p>{mt(d.drik_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.ayanamsa_h2, lang)}</h2>
            <p>{mt(d.ayanamsa_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.matters_h2, lang)}</h2>
            <p>{mt(d.matters_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.how_h2, lang)}</h2>
            <p>{mt(d.how_body, lang)}</p>
            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/trust/methodology"            className="cl-pub-related-link">{lang === "en" ? "Our Methodology →"           : "எங்கள் கணக்கீட்டு முறை →"}</Link>
                <Link href="/tools/jadhagam-generator"     className="cl-pub-related-link">{lang === "en" ? "Jadhagam Generator →"        : "ஜாதகம் உருவாக்கு →"}</Link>
                <Link href="/learn/what-is-porutham"       className="cl-pub-related-link">{lang === "en" ? "What is Porutham? →"         : "பொருத்தம் என்றால் என்ன? →"}</Link>
                <Link href="/learn/why-birth-time-matters" className="cl-pub-related-link">{lang === "en" ? "Why birth time matters →"    : "பிறந்த நேரம் ஏன் முக்கியம் →"}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
