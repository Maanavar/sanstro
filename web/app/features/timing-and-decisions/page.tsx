"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { FEAT_TIMING, mt } from "@/lib/marketing-i18n";

export default function TimingAndDecisionsPage() {
  const [lang] = useLang();
  const d = FEAT_TIMING;

  const WHAT_ITEMS = [
    mt(d.what1, lang), mt(d.what2, lang), mt(d.what3, lang), mt(d.what4, lang),
  ];

  const DECISION_ITEMS = [
    mt(d.dec1, lang), mt(d.dec2, lang), mt(d.dec3, lang),
    mt(d.dec4, lang), mt(d.dec5, lang), mt(d.dec6, lang),
  ];

  const FAQS = [
    { q: mt(d.faq1_q, lang), a: mt(d.faq1_a, lang) },
    { q: mt(d.faq2_q, lang), a: mt(d.faq2_a, lang) },
    { q: mt(d.faq3_q, lang), a: mt(d.faq3_a, lang) },
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
                <Link href="/features/daily-guidance" className="cl-btn cl-btn--ghost">{lang === "en" ? "How daily guidance works" : "தினசரி வழிகாட்டுதல் எப்படி வேலை செய்கிறது"}</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "Today's Windows · Sample" : "இன்றைய நேரங்கள் · மாதிரி"}</p>
              <div className="cl-hero-figure__art" style={{ gap: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%" }}>
                <div className="cl-daily-card__win cl-daily-card__win--best">
                  <p className="cl-daily-card__win-label">{lang === "en" ? "Best Window" : "சிறந்த நேரம்"}</p>
                  <p className="cl-daily-card__win-time">11:53 – 12:41</p>
                </div>
                <div className="cl-daily-card__win cl-daily-card__win--hold">
                  <p className="cl-daily-card__win-label">{lang === "en" ? "Caution" : "எச்சரிக்கை"}</p>
                  <p className="cl-daily-card__win-time">15:28 – 17:03</p>
                </div>
              </div>
              <p className="cl-hero-figure__note">
                {lang === "en"
                  ? "Based on Amrit Kalam, panchangam quality, dasha lord strength, and Moon nakshatra."
                  : "அமிர்த காலம், பஞ்சாங்க தரம், தசை நாதன் வலிமை, சந்திர நட்சத்திரம் அடிப்படையில்."}
              </p>
            </div>
          </div>
        </section>

        {/* BAND 1 — Muhurtha */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "An ancient tradition" : "ஒரு பழங்கால பாரம்பரியம்"}</p>
              <h2 className="cl-section-h2">{mt(d.muhurtha_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{mt(d.muhurtha_body, lang)}</p>
              </div>
              <ul className="cl-pub-detail-list">
                {WHAT_ITEMS.map((item) => (
                  <li key={item} className="cl-pub-detail-item">
                    <p className="cl-pub-detail-item__body">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* BAND 2 — Decisions */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Everyday and significant" : "தினசரி மற்றும் முக்கியமான"}</p>
              <h2 className="cl-section-h2">{mt(d.decisions_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{mt(d.decisions_body, lang)}</p>
                <ul className="cl-pub-detail-list" style={{ marginTop: "1rem" }}>
                  {DECISION_ITEMS.map((item) => (
                    <li key={item} className="cl-pub-detail-item">
                      <p className="cl-pub-detail-item__body">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="cl-callout">
                <p>{lang === "en" ? "Clarity and calm awareness, not fear-based avoidance." : "தெளிவு மற்றும் அமைதியான விழிப்புணர்வு, பயம் சார்ந்த தவிர்ப்பு அல்ல."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 3 — FAQ */}
        <section className="cl-band cl-band--alt">
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
                <Link href="/features/daily-guidance"       className="cl-pub-related-link">{lang === "en" ? "Daily Guidance →"        : "தினசரி வழிகாட்டுதல் →"}</Link>
                <Link href="/tools/daily-panchangam-planner" className="cl-pub-related-link">{lang === "en" ? "Panchangam Planner →"   : "பஞ்சாங்க திட்டமிடல் →"}</Link>
                <Link href="/features/family-planning"      className="cl-pub-related-link">{lang === "en" ? "Family Planning →"       : "குடும்ப திட்டமிடல் →"}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Plan your next important action" : "அடுத்த முக்கியமான செயலை திட்டமிடுங்கள்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "See today's best and caution windows for your chart." : "உங்கள் ஜாதகத்திற்கான இன்றைய சிறந்த மற்றும் எச்சரிக்கை நேரங்களை பாருங்கள்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Open dashboard →" : "டேஷ்போர்டு திற →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
