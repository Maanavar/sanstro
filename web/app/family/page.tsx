"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { FAMILY_PAGE, mt } from "@/lib/marketing-i18n";

const MEMBER_SAMPLES = [
  { name: "Amma",   score: 78, band: "high", rasi: "Rishabam" },
  { name: "Appa",   score: 52, band: "mid",  rasi: "Mithuna"  },
  { name: "Kavitha",score: 61, band: "mid",  rasi: "Kadagam"  },
];

export default function FamilyPage() {
  const [lang] = useLang();
  const d = FAMILY_PAGE;

  const BENEFITS = [
    { icon: "◈", title: mt(d.benefit1_title, lang), body: mt(d.benefit1_body, lang) },
    { icon: "◎", title: mt(d.benefit2_title, lang), body: mt(d.benefit2_body, lang) },
    { icon: "⊕", title: mt(d.benefit3_title, lang), body: mt(d.benefit3_body, lang) },
    { icon: "✦", title: mt(d.benefit4_title, lang), body: mt(d.benefit4_body, lang) },
  ];

  const STEPS = [
    mt(d.step1, lang),
    mt(d.step2, lang),
    mt(d.step3, lang),
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
                <Link href="/features/family-planning" className="cl-btn cl-btn--ghost">
                  {lang === "en" ? "See all family features" : "குடும்ப அம்சங்கள் பாருங்கள்"}
                </Link>
              </div>
            </div>

            {/* Profile selector mockup */}
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">
                {lang === "en" ? "Family Vault · Sample" : "குடும்ப வால்ட் · மாதிரி"}
              </p>
              <p className="cl-hero-figure__title">
                {lang === "en" ? "Today's scores for your family" : "இன்று குடும்பத்தின் மதிப்பெண்கள்"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                {MEMBER_SAMPLES.map((m) => (
                  <div key={m.name} className="cl-score-row" style={{ width: "100%" }}>
                    <span className="cl-score-row__name" style={{ minWidth: 70 }}>{m.name}</span>
                    <div className="cl-score-bar-wrap" style={{ flex: 1 }}>
                      <div
                        className={`cl-score-bar cl-score-bar--${m.band}`}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontSize: "0.82rem", color: "var(--text-secondary)", minWidth: 28, textAlign: "right" }}>
                      {m.score}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 14, fontSize: "0.75rem", color: "var(--text-secondary)", textAlign: "center" }}>
                {lang === "en" ? "Tap any member to open their chart →" : "உறுப்பினரை தட்டி அவர்கள் ஜாதகம் திறக்கவும் →"}
              </p>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="cl-section" id="benefits">
          <div className="cl-container">
            <h2 className="cl-section-h2">
              {lang === "en" ? "Everything in one place" : "அனைத்தும் ஒரே இடத்தில்"}
            </h2>
            <div className="cl-feature-grid">
              {BENEFITS.map((b) => (
                <div key={b.title} className="cl-feature-card">
                  <span className="cl-feature-icon">{b.icon}</span>
                  <h3 className="cl-feature-title">{b.title}</h3>
                  <p className="cl-feature-body">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="cl-section cl-section--alt" id="how-it-works">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.how_h2, lang)}</h2>
            <ol className="cl-steps">
              {STEPS.map((step, i) => (
                <li key={i} className="cl-step">
                  <span className="cl-step__num">{i + 1}</span>
                  <p className="cl-step__body">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="cl-section">
          <div className="cl-container">
            <div className="cl-cta-banner">
              <h2 className="cl-cta-banner__h2">{mt(d.cta_banner_h, lang)}</h2>
              <p className="cl-cta-banner__body">{mt(d.cta_banner_b, lang)}</p>
              <Link href="/dashboard" className="cl-btn cl-btn--solid">
                {mt(d.cta_start, lang)}
              </Link>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
