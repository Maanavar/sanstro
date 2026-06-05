"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { LEARN_JAD, mt } from "@/lib/marketing-i18n";

export default function HowToReadAJadhagamPage() {
  const [lang] = useLang();
  const d = LEARN_JAD;

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
            <h2 className="cl-section-h2">{mt(d.structure_h2, lang)}</h2>
            <p>{mt(d.structure_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.lagna_h2, lang)}</h2>
            <p>{mt(d.lagna_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.dasha_h2, lang)}</h2>
            <p>{mt(d.dasha_body, lang)}</p>
            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/tools/jadhagam-generator"     className="cl-pub-related-link">{lang === "en" ? "Jadhagam Generator →"        : "ஜாதகம் உருவாக்கு →"}</Link>
                <Link href="/features/chart-guidance"      className="cl-pub-related-link">{lang === "en" ? "Chart Guidance →"             : "ஜாதக விளக்கம் →"}</Link>
                <Link href="/learn/why-birth-time-matters" className="cl-pub-related-link">{lang === "en" ? "Why birth time matters →"    : "பிறந்த நேரம் ஏன் முக்கியம் →"}</Link>
                <Link href="/learn/what-is-thirukanitham"  className="cl-pub-related-link">{lang === "en" ? "What is Thirukanitham? →"   : "திருக்கணிதம் என்றால் என்ன? →"}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
