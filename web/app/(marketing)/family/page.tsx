import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { getServerLang } from "@/lib/server-lang";
import { FAMILY_PAGE, mt } from "@/lib/marketing-i18n";

const MEMBER_SAMPLES = [
  { name: "Amma",    score: 78, band: "high", rasi: "Rishabam" },
  { name: "Appa",    score: 52, band: "mid",  rasi: "Mithuna"  },
  { name: "Kavitha", score: 61, band: "mid",  rasi: "Kadagam"  },
];

// F7 part two - a Server Component; see lib/server-lang.ts.
export default async function FamilyPage() {
  const lang = await getServerLang();
  const d = FAMILY_PAGE;

  const BENEFITS = [
    { eyebrow: lang === "en" ? "Vault" : "சேகரிப்பு",      title: mt(d.benefit1_title, lang), body: mt(d.benefit1_body, lang) },
    { eyebrow: lang === "en" ? "Daily" : "தினசரி",          title: mt(d.benefit2_title, lang), body: mt(d.benefit2_body, lang) },
    { eyebrow: lang === "en" ? "Match" : "பொருத்தம்",       title: mt(d.benefit3_title, lang), body: mt(d.benefit3_body, lang) },
    { eyebrow: lang === "en" ? "Private" : "தனியுரிமை",     title: mt(d.benefit4_title, lang), body: mt(d.benefit4_body, lang) },
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

        {/* ── HERO ── */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{mt(d.eyebrow, lang)}</p>
              <h1 className="cl-pub-h1">{mt(d.h1, lang)}</h1>
              <p className="cl-pub-lead">{mt(d.lead, lang)}</p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">
                  {mt(d.cta_start, lang)}
                </Link>
                <Link href="/features/family-planning" className="cl-btn cl-btn--ghost">
                  {lang === "en" ? "See all features" : "அம்சங்கள் பாருங்கள்"}
                </Link>
              </div>
            </div>

            {/* Family score mockup */}
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">
                {lang === "en" ? "Family Vault · Sample" : "குடும்ப வால்ட் · மாதிரி"}
              </p>
              <p className="cl-hero-figure__title">
                {lang === "en" ? "Today's scores for your family" : "இன்று குடும்பத்தின் மதிப்பெண்கள்"}
              </p>
              <div className="cl-hero-figure__rows">
                {MEMBER_SAMPLES.map((m) => (
                  <div key={m.name} className="cl-hero-figure__row">
                    <b>{m.name}</b>
                    <div className="cl-score-bar-wrap" style={{ flex: 1 }}>
                      <div
                        className={`cl-score-bar cl-score-bar--${m.band}`}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                    <span className="cl-score-row__score">{m.score}</span>
                  </div>
                ))}
              </div>
              <p className="cl-hero-figure__note" style={{ textAlign: "center", marginTop: 8 }}>
                {lang === "en" ? "Tap any member to open their chart →" : "உறுப்பினரை தட்டி அவர்கள் ஜாதகம் திறக்கவும் →"}
              </p>
            </div>
          </div>
        </section>

        {/* ── BENEFITS ── */}
        <section className="cl-feature-hub" id="benefits">
          <div className="cl-container">
            <div className="cl-feature-hub__head">
              <h2 className="cl-section-h2">
                {lang === "en" ? "Everything in one place" : "அனைத்தும் ஒரே இடத்தில்"}
              </h2>
            </div>
            <div className="cl-feature-hub-grid">
              {BENEFITS.map((b) => (
                <div key={b.title} className="cl-fhub-card">
                  <p className="cl-fhub-card__eyebrow">{b.eyebrow}</p>
                  <h3 className="cl-fhub-card__title">{b.title}</h3>
                  <p className="cl-fhub-card__body">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="cl-band cl-band--alt" id="how-it-works">
          <div className="cl-container">
            <div className="cl-band__head">
              <h2 className="cl-section-h2">{mt(d.how_h2, lang)}</h2>
            </div>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
              {STEPS.map((step, i) => (
                <li key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <span style={{
                    flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
                    background: "var(--cl-accent)", color: "#fffaf0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.9rem",
                  }}>{i + 1}</span>
                  <p style={{ margin: 0, paddingTop: 6, color: "var(--cl-ink-2)", lineHeight: 1.65 }}>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── CTA STRIP ── */}
        <section className="cl-cta-strip">
          <div className="cl-container">
            <div className="cl-cta-strip__inner">
              <div>
                <h2 className="cl-cta-strip__title">{mt(d.cta_banner_h, lang)}</h2>
                <p className="cl-cta-strip__body">{mt(d.cta_banner_b, lang)}</p>
              </div>
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
