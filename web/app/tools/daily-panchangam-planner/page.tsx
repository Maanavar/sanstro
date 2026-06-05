"use client";

import Link from "next/link";
import { PanchangamTool } from "./PanchangamTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TOOL_PANCH, mt } from "@/lib/marketing-i18n";

export default function PanchangamPlannerPage() {
  const [lang] = useLang();
  const d = TOOL_PANCH;

  const FIVE_ELEMENTS = [
    { title: mt(d.e1_title, lang), body: mt(d.e1_body, lang) },
    { title: mt(d.e2_title, lang), body: mt(d.e2_body, lang) },
    { title: mt(d.e3_title, lang), body: mt(d.e3_body, lang) },
    { title: mt(d.e4_title, lang), body: mt(d.e4_body, lang) },
    { title: mt(d.e5_title, lang), body: mt(d.e5_body, lang) },
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

        {/* Live tool */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <PanchangamTool />
          </div>
        </section>

        {/* BAND — Five limbs */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Reference" : "குறிப்பு"}</p>
              <h2 className="cl-section-h2">{mt(d.five_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{lang === "en"
                  ? "Panchangam (பஞ்சாங்கம்) means \"five limbs\" — the five daily elements that define the quality of each day in the Tamil calendar."
                  : "பஞ்சாங்கம் என்றால் \"ஐந்து உறுப்புகள்\" — தமிழ் நாட்காட்டியில் ஒவ்வொரு நாளின் தன்மையை வரையறுக்கும் ஐந்து தினசரி கூறுகள்."}</p>
              </div>
              <ul className="cl-pub-detail-list">
                {FIVE_ELEMENTS.map((item) => (
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
                <Link href="/features/daily-guidance"       className="cl-pub-related-link">{lang === "en" ? "Daily Guidance →"           : "தினசரி வழிகாட்டுதல் →"}</Link>
                <Link href="/features/timing-and-decisions" className="cl-pub-related-link">{lang === "en" ? "Timing and Decisions →"     : "நேரம் & முடிவுகள் →"}</Link>
                <Link href="/learn/what-is-chandrashtama"   className="cl-pub-related-link">{lang === "en" ? "What is Chandrashtama? →"   : "சந்திராஷ்டமம் என்றால் என்ன? →"}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Get panchangam connected to your chart" : "உங்கள் ஜாதகத்துடன் இணைந்த பஞ்சாங்கம் பெறுங்கள்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "Create a free account for daily guidance that combines your chart, dasha, and panchangam together." : "உங்கள் ஜாதகம், தசை, பஞ்சாங்கம் ஒன்றாக இணைந்த தினசரி வழிகாட்டுதலுக்கு இலவச கணக்கை உருவாக்கவும்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
