"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { FEAT_CHART, mt } from "@/lib/marketing-i18n";
import { SouthIndianChartVisual } from "@/components/marketing-visuals";

export default function ChartGuidancePage() {
  const [lang] = useLang();
  const d = FEAT_CHART;

  const CHART_ITEMS = [
    { title: mt(d.c1_title, lang), body: mt(d.c1_body, lang) },
    { title: mt(d.c2_title, lang), body: mt(d.c2_body, lang) },
    { title: mt(d.c3_title, lang), body: mt(d.c3_body, lang) },
    { title: mt(d.c4_title, lang), body: mt(d.c4_body, lang) },
  ];

  const FAQS = [
    { q: mt(d.faq1_q, lang), a: mt(d.faq1_a, lang) },
    { q: mt(d.faq2_q, lang), a: mt(d.faq2_a, lang) },
    { q: mt(d.faq3_q, lang), a: mt(d.faq3_a, lang) },
    { q: mt(d.faq4_q, lang), a: mt(d.faq4_a, lang) },
  ];

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{mt(d.eyebrow, lang)}</p>
              <h1 className="cl-pub-h1">{mt(d.h1, lang)}</h1>
              <p className="cl-pub-lead">{mt(d.lead, lang)}</p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">{mt(d.cta_start, lang)}</Link>
                <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--ghost">{lang === "en" ? "Generate jadhagam" : "ஜாதகம் உருவாக்கு"}</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "Chart Summary · Sample" : "ஜாதக சுருக்கம் · மாதிரி"}</p>
              <SouthIndianChartVisual lang={lang} />
              <div className="cl-hero-figure__art">
                <svg viewBox="0 0 240 240" role="img" aria-label="South Indian square chart">
                  <rect x="1" y="1" width="238" height="238" rx="6" fill="var(--cl-surface-2)" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <g className="clf-grid-line">
                    <line x1="60" y1="1" x2="60" y2="239" /><line x1="120" y1="1" x2="120" y2="239" /><line x1="180" y1="1" x2="180" y2="239" />
                    <line x1="1" y1="60" x2="239" y2="60" /><line x1="1" y1="120" x2="239" y2="120" /><line x1="1" y1="180" x2="239" y2="180" />
                  </g>
                  <rect x="60" y="60" width="120" height="120" fill="var(--cl-surface)" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <text x="120" y="116" textAnchor="middle" fontFamily="var(--cl-font-display)" fontSize="15" fill="var(--cl-ink)">{lang === "en" ? "Rasi" : "ராசி"}</text>
                  <text x="120" y="134" textAnchor="middle" className="clf-cell-label" letterSpacing="1">{lang === "en" ? "D1 · SOUTH INDIAN" : "D1 · தென் இந்திய"}</text>
                  <rect x="60" y="0" width="60" height="60" className="clf-cell-lag" />
                  <text x="66" y="15" className="clf-cell-label clf-accent-fill">{lang === "en" ? "Lag" : "லக்"}</text>
                  <text x="113" y="53" textAnchor="end" className="clf-cell-label clf-ink">{lang === "en" ? "Su" : "சூ"}</text>
                  <circle cx="210" cy="150" r="3" className="clf-accent-fill" />
                  <text x="186" y="214" className="clf-cell-label clf-ink">{lang === "en" ? "Ch · Kettai" : "ச · கேட்டை"}</text>
                  <text x="6" y="135" className="clf-cell-label clf-ink">{lang === "en" ? "Sa" : "சனி"}</text>
                </svg>
              </div>
              <p className="cl-hero-figure__title">{lang === "en" ? "Kadagam Lagna · Moon Dasa" : "கடகம் லக்னம் · சந்திர தசை"}</p>
              <p className="cl-hero-figure__note">
                {lang === "en"
                  ? "Moon as lagna lord is in Viruchigam (5th house) — Kettai birth star. The current Moon dasa activates 5th-house themes."
                  : "லக்ன நாதன் சந்திரன் விருச்சிகத்தில் (5வது பாவம்) — கேட்டை நட்சத்திரம். நடப்பு சந்திர தசை 5வது பாவ கருப்பொருள்களை செயல்படுத்துகிறது."}
              </p>
            </div>
          </div>
        </section>

        {/* BAND 1 — Chart coverage */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Overview" : "கண்ணோட்டம்"}</p>
              <h2 className="cl-section-h2">{mt(d.chart_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{lang === "en"
                  ? "Vinaadi's chart guidance is not just a display of planet positions. It explains what your chart means in the context of where you are now."
                  : "விநாடியின் ஜாதக விளக்கம் வெறும் கிரக நிலைகளின் காட்சி மட்டுமல்ல. நீங்கள் இப்போது எங்கே இருக்கிறீர்கள் என்ற சூழலில் உங்கள் ஜாதகம் என்ன அர்த்தம் என்று விளக்குகிறது."}</p>
              </div>
              <ul className="cl-pub-detail-list">
                {CHART_ITEMS.map((item) => (
                  <li key={item.title} className="cl-pub-detail-item">
                    <p className="cl-pub-detail-item__title">{item.title}</p>
                    <p className="cl-pub-detail-item__body">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* BAND 2 — Assistant model */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "The assistant model" : "உதவியாளர் மாதிரி"}</p>
              <h2 className="cl-section-h2">{mt(d.assistant_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{mt(d.assistant_body, lang)}</p>
              </div>
              <div className="cl-callout">
                <p>{lang === "en" ? "The chart is the foundation, but the reading is what changes every day." : "ஜாதகம் அடித்தளம், ஆனால் வாசிப்பு ஒவ்வொரு நாளும் மாறுகிறது."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 3 — FAQ */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Questions" : "கேள்விகள்"}</p>
              <h2 className="cl-section-h2">{mt(d.faq_h2, lang)}</h2>
            </div>
            <div className="cl-pub-faq" style={{ maxWidth: "860px" }}>
              {FAQS.map((item) => (
                <div key={item.q} className="cl-pub-faq-item">
                  <p className="cl-pub-faq-item__q">{item.q}</p>
                  <p className="cl-pub-faq-item__a">{item.a}</p>
                </div>
              ))}
            </div>
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/tools/jadhagam-generator"     className="cl-pub-related-link">{lang === "en" ? "Jadhagam Generator →"        : "ஜாதகம் உருவாக்கு →"}</Link>
                <Link href="/learn/how-to-read-a-jadhagam" className="cl-pub-related-link">{lang === "en" ? "How to read a Jadhagam →"   : "ஜாதகம் படிப்பது எப்படி →"}</Link>
                <Link href="/learn/why-birth-time-matters" className="cl-pub-related-link">{lang === "en" ? "Why birth time matters →"    : "பிறந்த நேரம் ஏன் முக்கியம் →"}</Link>
                <Link href="/trust/methodology"            className="cl-pub-related-link">{lang === "en" ? "Our Methodology →"            : "எங்கள் கணக்கீட்டு முறை →"}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Understand your chart in context" : "சூழலில் உங்கள் ஜாதகத்தை புரிந்துகொள்ளுங்கள்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "Add your birth details and see what your jadhagam means today." : "பிறப்பு விவரங்களை சேர்க்கவும், இன்று உங்கள் ஜாதகம் என்ன அர்த்தம் என்று பாருங்கள்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Open dashboard →" : "டேஷ்போர்டு திற →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
