"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { FEAT_DAILY, mt } from "@/lib/marketing-i18n";
import { PanchangamWheelVisual, SouthIndianChartVisual, TimingArcVisual } from "@/components/marketing-visuals";

export default function DailyGuidancePage() {
  const [lang] = useLang();
  const d = FEAT_DAILY;

  const SIGNALS = [
    { title: mt(d.sig1_title, lang), body: mt(d.sig1_body, lang) },
    { title: mt(d.sig2_title, lang), body: mt(d.sig2_body, lang) },
    { title: mt(d.sig3_title, lang), body: mt(d.sig3_body, lang) },
    { title: mt(d.sig4_title, lang), body: mt(d.sig4_body, lang) },
  ];

  const FAQS = [
    { q: mt(d.faq1_q, lang), a: mt(d.faq1_a, lang) },
    { q: mt(d.faq2_q, lang), a: mt(d.faq2_a, lang) },
    { q: mt(d.faq3_q, lang), a: mt(d.faq3_a, lang) },
    { q: mt(d.faq4_q, lang), a: mt(d.faq4_a, lang) },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="clarity-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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
                <Link href="/trust/methodology" className="cl-btn cl-btn--ghost">{mt(d.cta_method, lang)}</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "Sample Reading · Today" : "மாதிரி வாசிப்பு · இன்று"}</p>
              <TimingArcVisual />
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
              <p className="cl-hero-figure__title">{lang === "en" ? "Score 64 — Measured" : "மதிப்பெண் 64 — சீரான நாள்"}</p>
              <p className="cl-hero-figure__note">
                {lang === "en"
                  ? "Moon Dasa · Moon Bhukti. Saturn transiting your 7th stabilises home and partnerships."
                  : "சந்திர தசை · சந்திர புக்தி. சனி 7வது பாவம் கடப்பது வீடு மற்றும் கூட்டாண்மையை நிலைப்படுத்துகிறது."}
              </p>
              <div className="cl-daily-card__signals" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(lang === "en"
                  ? ["Moon Dasa · Moon Bhukti", "Saturn in Kumbam", "Ekadasi · Kettai"]
                  : ["சந்திர தசை · சந்திர புக்தி", "சனி கும்பத்தில்", "ஏகாதசி · கேட்டை"]
                ).map((chip) => (
                  <span key={chip} className="cl-daily-card__chip">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BAND 1 — Four signals */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{mt(d.signals_h2, lang)}</p>
              <h2 className="cl-section-h2">{lang === "en" ? "What goes into a daily reading" : "தினசரி வாசிப்பில் என்ன செல்கிறது"}</h2>
            </div>
            <div className="mk-feature-pair">
              <PanchangamWheelVisual />
              <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{lang === "en"
                  ? "The daily guidance reading integrates four sources of astrological information — each contributing a different layer to the overall picture of the day."
                  : "தினசரி வழிகாட்டுதல் வாசிப்பு நான்கு ஜோதிட தகவல் மூலங்களை ஒருங்கிணைக்கிறது — ஒவ்வொன்றும் நாளின் ஒட்டுமொத்த படத்தில் வேறுபட்ட அடுக்கை பங்களிக்கிறது."}</p>
                <p>{lang === "en"
                  ? "The result is a single score (0–100), a best window, a caution window, and a brief interpretation in plain language."
                  : "முடிவு ஒரே மதிப்பெண் (0-100), சிறந்த நேரம், எச்சரிக்கை நேரம், எளிய மொழியில் சுருக்கமான விளக்கம்."}</p>
              </div>
              <ul className="cl-pub-detail-list">
                {SIGNALS.map((item) => (
                  <li key={item.title} className="cl-pub-detail-item">
                    <p className="cl-pub-detail-item__title">{item.title}</p>
                    <p className="cl-pub-detail-item__body">{item.body}</p>
                  </li>
                ))}
              </ul>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 2 — Best windows */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Clock times, not vague hours" : "குறிப்பிட்ட நேரங்கள், தெளிவற்றவை அல்ல"}</p>
              <h2 className="cl-section-h2">{mt(d.windows_h2, lang)}</h2>
            </div>
            <div className="mk-feature-pair">
              <SouthIndianChartVisual lang={lang} />
              <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{mt(d.windows_body, lang)}</p>
              </div>
              <div className="cl-callout">
                <p>{lang === "en" ? "Not to fear, but to be aware of." : "பயப்பட வேண்டியதில்லை, ஆனால் கவனிக்க வேண்டியது."}</p>
              </div>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 3 — Why it stays current */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Why it stays current" : "ஏன் புதுப்பிக்கப்படுகிறது"}</p>
              <h2 className="cl-section-h2">{mt(d.current_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{mt(d.current_body, lang)}</p>
              </div>
              <div className="cl-callout">
                <p>{lang === "en"
                  ? "A chart tells you the structure of your birth moment. Daily guidance tells you how that structure interacts with today's sky."
                  : "ஜாதகம் உங்கள் பிறப்பு தருணத்தின் அமைப்பை கூறுகிறது. தினசரி வழிகாட்டுதல் அந்த அமைப்பு இன்றைய வானத்துடன் எவ்வாறு தொடர்பு கொள்கிறது என்று கூறுகிறது."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 4 — FAQ */}
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
                <Link href="/features/family-planning"       className="cl-pub-related-link">{lang === "en" ? "Family Planning →"          : "குடும்ப திட்டமிடல் →"}</Link>
                <Link href="/features/timing-and-decisions"  className="cl-pub-related-link">{lang === "en" ? "Timing and Decisions →"     : "நேரம் & முடிவுகள் →"}</Link>
                <Link href="/learn/what-is-chandrashtama"    className="cl-pub-related-link">{lang === "en" ? "What is Chandrashtama? →"   : "சந்திராஷ்டமம் என்றால் என்ன? →"}</Link>
                <Link href="/trust/methodology"              className="cl-pub-related-link">{lang === "en" ? "Our Methodology →"           : "எங்கள் கணக்கீட்டு முறை →"}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Start with today's reading" : "இன்றைய வாசிப்புடன் தொடங்குங்கள்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "Free during early access. Chart, daily guidance, family vault." : "ஆரம்ப அணுகல் காலத்தில் இலவசம். ஜாதகம், தினசரி வழிகாட்டுதல், குடும்ப சேகரிப்பு."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Open dashboard →" : "டேஷ்போர்டு திற →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
