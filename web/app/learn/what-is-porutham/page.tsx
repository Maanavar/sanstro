"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { LEARN_PORUTHAM, mt } from "@/lib/marketing-i18n";

export default function WhatIsPoruthamPage() {
  const [lang] = useLang();
  const d = LEARN_PORUTHAM;

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
            <h2 className="cl-section-h2">{mt(d.how_h2, lang)}</h2>
            <p>{mt(d.how_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.critical_h2, lang)}</h2>
            <p>{mt(d.critical_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.sevvai_h2, lang)}</h2>
            <p>{mt(d.sevvai_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.count_h2, lang)}</h2>
            <p>{mt(d.count_body, lang)}</p>
            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/tools/marriage-porutham-calculator" className="cl-pub-related-link">{lang === "en" ? "Porutham Calculator →"    : "பொருத்தம் கணக்கிடல் →"}</Link>
                <Link href="/features/family-planning"           className="cl-pub-related-link">{lang === "en" ? "Family Planning →"        : "குடும்ப திட்டமிடல் →"}</Link>
                <Link href="/learn/what-is-thirukanitham"        className="cl-pub-related-link">{lang === "en" ? "What is Thirukanitham? →" : "திருக்கணிதம் என்றால் என்ன? →"}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
