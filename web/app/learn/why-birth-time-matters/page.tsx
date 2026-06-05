"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { LEARN_BIRTH, mt } from "@/lib/marketing-i18n";

export default function WhyBirthTimeMattersPage() {
  const [lang] = useLang();
  const d = LEARN_BIRTH;

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
            <h2 className="cl-section-h2">{mt(d.lagna_h2, lang)}</h2>
            <p>{mt(d.lagna_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.dasha_h2, lang)}</h2>
            <p>{mt(d.dasha_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.uncertain_h2, lang)}</h2>
            <p>{mt(d.uncertain_body, lang)}</p>
            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/tools/birth-time-rectification" className="cl-pub-related-link">{lang === "en" ? "Birth Time Rectification →"  : "பிறப்பு நேர திருத்தம் →"}</Link>
                <Link href="/tools/jadhagam-generator"       className="cl-pub-related-link">{lang === "en" ? "Jadhagam Generator →"        : "ஜாதகம் உருவாக்கு →"}</Link>
                <Link href="/learn/how-to-read-a-jadhagam"   className="cl-pub-related-link">{lang === "en" ? "How to read a Jadhagam →"   : "ஜாதகம் படிப்பது எப்படி →"}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
