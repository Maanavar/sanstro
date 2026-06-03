import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "What is Thirukanitham? Tamil Astronomical Astrology — Vinaadi",
  description:
    "Thirukanitham is the Tamil astronomical calculation system for astrology, based on the true (drik) positions of the planets. Learn how it differs from Vakya astrology.",
  alternates: { canonical: "https://vinaadi.com/learn/what-is-thirukanitham" },
  openGraph: {
    title: "What is Thirukanitham? Tamil Astrology Calculation Method",
    description: "Thirukanitham explained — the precise Tamil astronomical standard for Jyotish calculation.",
    url: "https://vinaadi.com/learn/what-is-thirukanitham",
    images: [
      {
        url: "/brand/vinaadi-wordmark-color.png",
        width: 1792,
        height: 612,
        alt: "Vinaadi - Your Cosmic Copilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "What is Thirukanitham? Tamil Astronomical Astrology — Vinaadi",
    description:
      "Thirukanitham is the Tamil astronomical calculation system for astrology, based on the true (drik) positions of the planets. Learn how it differs from Vakya astrology.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};


export default function WhatIsThirukanithamPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        {/* HERO */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Learn · Tamil Astrology</p>
              <h1 className="cl-pub-h1">What is Thirukanitham?</h1>
              <p className="cl-pub-lead">Thirukanitham (திருகணிதம்) is the Tamil astronomical calculation system used in astrology. It is based on the true, observed positions of the planets — the &ldquo;drik&rdquo; or sight-based method — rather than older tabular approximations.</p>
              <div className="cl-hero__actions">
                <Link href="/trust/methodology" className="cl-btn cl-btn--solid">Our methodology →</Link>
                <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--ghost">Generate jadhagam</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">Drik vs Vakya</p>
              <div className="cl-hero-figure__art">
                <svg viewBox="0 0 240 120" role="img" aria-label="True planetary position versus approximation">
                  <line x1="20" y1="60" x2="220" y2="60" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <g stroke="var(--cl-muted-2)" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="20" y1="55" x2="20" y2="65" /><line x1="120" y1="55" x2="120" y2="65" /><line x1="220" y1="55" x2="220" y2="65" />
                  </g>
                  <circle cx="158" cy="60" r="7" className="clf-accent-fill" />
                  <text x="158" y="44" textAnchor="middle" className="clf-cell-label clf-accent-fill">drik (true)</text>
                  <circle cx="132" cy="60" r="6" fill="none" stroke="var(--cl-accent)" strokeWidth="1.6" strokeDasharray="2 3" />
                  <text x="120" y="88" textAnchor="middle" className="clf-cell-label clf-muted">vakya (approx.)</text>
                </svg>
              </div>
              <p className="cl-hero-figure__title">Calculated from the real sky</p>
              <p className="cl-hero-figure__note">Vinaadi uses Thirukanitham with Lahiri ayanamsa and a high-precision ephemeris — the true positions, not table-based estimates.</p>
            </div>
          </div>
        </section>

        {/* ARTICLE BAND */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-article">
              <aside className="cl-article__toc">
                <p className="cl-article__toc-label">On this page</p>
                <nav className="cl-article__toc-list">
                  <a href="#meaning">The meaning</a>
                  <a href="#drik-vakya">Drik versus Vakya</a>
                  <a href="#ayanamsa">The role of ayanamsa</a>
                  <a href="#why-matters">Why it matters</a>
                  <a href="#how-vinaadi">How Vinaadi uses it</a>
                </nav>
              </aside>
              <div className="cl-article__body cl-learn-prose">

                <h2 id="meaning">The meaning of Thirukanitham</h2>
                <p>The word combines &ldquo;thiru&rdquo; (sacred/true) and &ldquo;kanitham&rdquo; (calculation/mathematics). Thirukanitham therefore means the &ldquo;true calculation&rdquo; method — astrology based on accurate astronomical computation of where the planets genuinely are in the sky at any given moment.</p>

                <h2 id="drik-vakya">Drik versus Vakya</h2>
                <p>Historically, Tamil astrology used two main calculation traditions. The <strong>Vakya</strong> system relies on memorised verse-based tables (vakyas) that approximate planetary positions — convenient before modern computation, but increasingly divergent from the true sky over centuries. The <strong>Drik</strong> (Thirukanitham) system calculates the actual observed positions using astronomical mathematics.</p>
                <div className="cl-callout"><p>Drik means &ldquo;sight&rdquo; — the position you would actually observe in the sky, not a position remembered from a table.</p></div>
                <p>Today, most serious Tamil Jyotish practitioners use the Thirukanitham (drik) method because it reflects the real positions of the planets. The difference between the two systems can be significant — sometimes a full nakshatra or more — which directly affects chart interpretation.</p>

                <h2 id="ayanamsa">The role of ayanamsa</h2>
                <p>Thirukanitham uses the sidereal zodiac, which is fixed relative to the stars. To convert from the tropical zodiac (fixed to the equinoxes) to the sidereal zodiac, an offset called the <strong>ayanamsa</strong> is applied. Vinaadi uses the <strong>Lahiri ayanamsa</strong> — the standard adopted by the Government of India and used by the majority of traditional Tamil and North Indian practitioners.</p>

                <h2 id="why-matters">Why it matters for your chart</h2>
                <p>Because Thirukanitham calculates the true planetary positions, your jadhagam, nakshatra, dasha periods, and transit timings are all based on the actual sky rather than approximations. This matters most at the boundaries — when a planet or the Moon is near the edge of a sign or nakshatra, the difference between drik and vakya can change which house or nakshatra it falls in.</p>

                <h2 id="how-vinaadi">How Vinaadi uses Thirukanitham</h2>
                <p>Every calculation in Vinaadi — your jadhagam, daily readings, panchangam, porutham, and timing windows — is computed using the Thirukanitham method with Lahiri ayanamsa and a high-precision ephemeris. This is the same standard used in modern Tamil panchang publications, ensuring your readings reflect the real astronomical positions.</p>

                <div className="cl-trust-links">
                  <Link href="/trust/methodology" className="cl-trust-link">Read our methodology →</Link>
                  <Link href="/learn/how-to-read-a-jadhagam" className="cl-trust-link">How to read a jadhagam →</Link>
                  <Link href="/learn/why-birth-time-matters" className="cl-trust-link">Why birth time matters →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">See Thirukanitham precision in action</h2>
              <p className="cl-cta-strip__body">Generate your jadhagam and daily guidance using the precise Tamil standard.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
