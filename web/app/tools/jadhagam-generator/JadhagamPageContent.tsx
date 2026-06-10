"use client";

import Link from "next/link";
import { JadhagamTool } from "./JadhagamTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TOOL_JADHAGAM, mt } from "@/lib/marketing-i18n";

export function JadhagamPageContent() {
  const [lang] = useLang();
  const d = TOOL_JADHAGAM;

  const WHAT_ITEMS = [
    { title: mt(d.w1_title, lang), body: mt(d.w1_body, lang) },
    { title: mt(d.w2_title, lang), body: mt(d.w2_body, lang) },
    { title: mt(d.w3_title, lang), body: mt(d.w3_body, lang) },
    { title: mt(d.w4_title, lang), body: mt(d.w4_body, lang) },
  ];

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO */}
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">{mt(d.eyebrow, lang)}</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "20ch" }}>{mt(d.h1, lang)}</h1>
            <p className="cl-pub-lead">{mt(d.lead, lang)}</p>
          </div>
        </section>

        {/* Live calculator */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <JadhagamTool />
          </div>
        </section>

        {/* BAND — What's included */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "What's included" : "என்ன உள்ளடக்கியுள்ளது"}</p>
              <h2 className="cl-section-h2">{mt(d.what_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{lang === "en"
                  ? "Every chart is computed using the Thirukanitham method — the precise Tamil astronomical calculation standard with Lahiri ayanamsa and Drik ephemeris data."
                  : "ஒவ்வொரு ஜாதகமும் திருக்கணிதம் முறையில் — லாகிரி அயனாம்சம் மற்றும் திரிக் கோளக்கணித தரவுடன் துல்லியமான தமிழ் வானியல் கணக்கீட்டு தரநிலை — கணக்கிடப்படுகிறது."}</p>
              </div>
              <ul className="cl-pub-detail-list">
                {WHAT_ITEMS.map((item) => (
                  <li key={item.title} className="cl-pub-detail-item">
                    <p className="cl-pub-detail-item__title">{item.title}</p>
                    <p className="cl-pub-detail-item__body">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/features/chart-guidance"        className="cl-pub-related-link">{lang === "en" ? "Chart Guidance →"           : "ஜாதக விளக்கம் →"}</Link>
                <Link href="/learn/how-to-read-a-jadhagam"  className="cl-pub-related-link">{lang === "en" ? "How to read a Jadhagam →"   : "ஜாதகம் படிப்பது எப்படி →"}</Link>
                <Link href="/learn/why-birth-time-matters"   className="cl-pub-related-link">{lang === "en" ? "Why birth time matters →"    : "பிறந்த நேரம் ஏன் முக்கியம் →"}</Link>
                <Link href="/tools/birth-time-rectification" className="cl-pub-related-link">{lang === "en" ? "Birth Time Rectification →"  : "பிறப்பு நேர திருத்தம் →"}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Save your chart and get daily guidance" : "ஜாதகம் சேமிக்கவும், தினசரி வழிகாட்டுதல் பெறவும்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "Create a free account to save, track dasha over time, and get a reading every morning." : "சேமிக்க, தசையை காலப்போக்கில் கண்காணிக்க, ஒவ்வொரு காலையும் வாசிப்பு பெற இலவச கணக்கை உருவாக்கவும்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
