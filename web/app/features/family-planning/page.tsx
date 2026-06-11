"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { FEAT_FAMILY, mt } from "@/lib/marketing-i18n";
import { FamilyOrbitVisual } from "@/components/marketing-visuals";

export default function FamilyPlanningPage() {
  const [lang] = useLang();
  const d = FEAT_FAMILY;

  const VAULT_ITEMS = [
    { title: mt(d.vault1, lang), body: lang === "en" ? "Each gets a full chart, dasha, transit, and panchangam reading." : "ஒவ்வொருவருக்கும் முழுமையான ஜாதகம், தசை, கிரகநகர்வு, பஞ்சாங்க வாசிப்பு." },
    { title: mt(d.vault2_title, lang), body: mt(d.vault2, lang) },
    { title: mt(d.vault3_title, lang), body: mt(d.vault3, lang) },
    { title: mt(d.vault4_title, lang), body: mt(d.vault4, lang) },
  ];

  const FAQS = [
    { q: mt(d.faq1_q, lang), a: mt(d.faq1_a, lang) },
    { q: mt(d.faq2_q, lang), a: mt(d.faq2_a, lang) },
    { q: mt(d.faq3_q, lang), a: mt(d.faq3_a, lang) },
    { q: mt(d.faq4_q, lang), a: mt(d.faq4_a, lang) },
  ];

  const FAMILY_MEMBERS = [
    { name: "Arjun", score: 64, band: "mid" },
    { name: "Priya", score: 81, band: "high" },
    { name: "Kavitha", score: 47, band: "low" },
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
                <Link href="/features/daily-guidance" className="cl-btn cl-btn--ghost">{mt(d.cta_how, lang)}</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "Family Today · Sample" : "இன்று குடும்பம் · மாதிரி"}</p>
              <p className="cl-hero-figure__title">{lang === "en" ? "Best combined window: 11:53 – 12:41" : "சிறந்த கூட்டு நேரம்: 11:53 – 12:41"}</p>
              <FamilyOrbitVisual />
              <div className="cl-hero-figure__art" style={{ flexDirection: "column", gap: "10px", width: "100%" }}>
                {FAMILY_MEMBERS.map((m) => (
                  <div key={m.name} className="cl-score-row" style={{ width: "100%" }}>
                    <span className="cl-score-row__name">{m.name}</span>
                    <div className="cl-score-bar-wrap">
                      <div className={`cl-score-bar cl-score-bar--${m.band}`} style={{ width: `${m.score}%` }} />
                    </div>
                    <span className={`cl-score-num cl-score-num--${m.band}`}>{m.score}</span>
                  </div>
                ))}
              </div>
              <p className="cl-hero-figure__note">
                {lang === "en"
                  ? "Everyone's day at a glance — and the one window that works best for the whole household."
                  : "எல்லோரின் நாளையும் ஒரே பார்வையில் — முழு வீட்டிற்கும் சிறந்த நேரம்."}
              </p>
            </div>
          </div>
        </section>

        {/* BAND 1 — Family vault */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "A shared workspace" : "பகிரப்பட்ட பணியிடம்"}</p>
              <h2 className="cl-section-h2">{mt(d.vault_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{mt(d.vault_body, lang)}</p>
              </div>
              <ul className="cl-pub-detail-list">
                {VAULT_ITEMS.map((item) => (
                  <li key={item.title} className="cl-pub-detail-item">
                    <p className="cl-pub-detail-item__title">{item.title}</p>
                    <p className="cl-pub-detail-item__body">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* BAND 2 — Why family */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "A family tradition" : "குடும்ப பாரம்பரியம்"}</p>
              <h2 className="cl-section-h2">{mt(d.why_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{mt(d.why_body, lang)}</p>
              </div>
              <div className="cl-callout">
                <p>{lang === "en" ? "Reading charts together — the way Tamil families have always planned." : "ஜாதகங்களை சேர்ந்து படிப்பது — தமிழ் குடும்பங்கள் எப்போதும் திட்டமிட்ட விதம்."}</p>
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
                <Link href="/features/daily-guidance"               className="cl-pub-related-link">{lang === "en" ? "Daily Guidance →"           : "தினசரி வழிகாட்டுதல் →"}</Link>
                <Link href="/tools/marriage-porutham-calculator"    className="cl-pub-related-link">{lang === "en" ? "Porutham Calculator →"       : "பொருத்தம் கணக்கிடல் →"}</Link>
                <Link href="/features/timing-and-decisions"         className="cl-pub-related-link">{lang === "en" ? "Timing and Decisions →"      : "நேரம் & முடிவுகள் →"}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Plan together" : "சேர்ந்து திட்டமிடுங்கள்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "Add family members and find your shared best window." : "குடும்பத்தினரை சேர்க்கவும், பொதுவான சிறந்த நேரத்தை கண்டறியுங்கள்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Open dashboard →" : "டேஷ்போர்டு திற →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
