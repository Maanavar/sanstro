import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "What is Chandrashtama? The Moon's 8th Transit Explained — Vinaadi",
  description:
    "Chandrashtama is the period when the transiting Moon passes through the 8th sign from your birth Moon. Learn what it means, how often it occurs, and how to approach it calmly.",
  alternates: { canonical: "https://vinaadi.com/learn/what-is-chandrashtama" },
  openGraph: {
    title: "What is Chandrashtama? - Vinaadi",
    description:
      "Chandrashtama is the period when the transiting Moon passes through the 8th sign from your birth Moon. Learn what it means, how often it occurs, and how to approach it calmly.",
    url: "https://vinaadi.com/learn/what-is-chandrashtama",
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
    title: "What is Chandrashtama? - Vinaadi",
    description:
      "Chandrashtama is the period when the transiting Moon passes through the 8th sign from your birth Moon. Learn what it means, how often it occurs, and how to approach it calmly.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};


export default function WhatIsChandrashtamaPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        {/* HERO */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Learn · Tamil Astrology</p>
              <h1 className="cl-pub-h1">What is Chandrashtama?</h1>
              <p className="cl-pub-lead">Chandrashtama is the period when the transiting Moon passes through the 8th sign counted from your birth Moon sign. In Tamil astrology it is treated as a time for extra care — not fear.</p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">Track your Chandrashtama →</Link>
                <Link href="/features/daily-guidance" className="cl-btn cl-btn--ghost">Daily guidance</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">The 8th from Janma Rasi</p>
              <div className="cl-hero-figure__art">
                <svg viewBox="0 0 200 200" role="img" aria-label="Moon in the 8th sign from birth sign">
                  <circle cx="100" cy="100" r="78" fill="none" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <circle cx="100" cy="22" r="8" className="clf-sage-fill" />
                  <text x="100" y="14" textAnchor="middle" className="clf-cell-label">janma (1)</text>
                  <g stroke="var(--cl-muted-2)" strokeWidth="1.2" strokeLinecap="round">
                    <line x1="100" y1="100" x2="100" y2="22" />
                  </g>
                  <circle cx="44" cy="155" r="9" className="clf-accent-fill" />
                  <text x="40" y="178" textAnchor="middle" className="clf-cell-label clf-accent-fill">moon · 8th</text>
                  <path d="M100 100 L44 155" stroke="var(--cl-accent)" strokeWidth="1.4" strokeDasharray="3 3" />
                </svg>
              </div>
              <p className="cl-hero-figure__title">Roughly 2¼ days, ~once a month</p>
              <p className="cl-hero-figure__note">Vinaadi names Chandrashtama days clearly and folds them into the daily score — without dramatising them.</p>
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
                  <a href="#how-often">How often it occurs</a>
                  <a href="#traditionally">What it signifies</a>
                  <a href="#vinaadi">How Vinaadi handles it</a>
                  <a href="#calm">A calm approach</a>
                </nav>
              </aside>
              <div className="cl-article__body cl-learn-prose">

                <h2 id="meaning">The meaning of Chandrashtama</h2>
                <p>&ldquo;Chandra&rdquo; means Moon, and &ldquo;ashtama&rdquo; means eighth. Chandrashtama refers to the time when the transiting Moon is in the 8th rasi (sign) counted from your janma rasi — the Moon sign at your birth. The 8th house in astrology is traditionally associated with transformation, obstacles, and matters that require caution.</p>

                <h2 id="how-often">How often it occurs</h2>
                <p>The Moon travels through all 12 signs roughly every 27–28 days, spending about 2¼ days in each sign. This means Chandrashtama occurs approximately once a month, for about two to two-and-a-quarter days each time. It is a regular, predictable cycle — not a rare or catastrophic event.</p>
                <div className="cl-callout"><p>It is a regular monthly rhythm — not a rare catastrophe. Knowing when it falls is simply useful planning information.</p></div>

                <h2 id="traditionally">What it traditionally signifies</h2>
                <p>During Chandrashtama, the traditional guidance is to avoid initiating major new ventures, important journeys, large financial commitments, or significant ceremonies. It is considered a period better suited to routine activities, completion of existing work, rest, and reflection rather than bold new beginnings.</p>
                <p>Importantly, Chandrashtama does not predict disaster. It is a period of lowered support for new initiation — a time to be measured, not anxious.</p>

                <h2 id="vinaadi">How Vinaadi handles Chandrashtama</h2>
                <p>Vinaadi automatically tracks your Chandrashtama based on your birth Moon sign. When a Chandrashtama period is active, it is clearly named in your daily reading and factored into the daily score. We deliberately avoid fear-based language. The reading will tell you the period is active and suggest a measured approach — without amplifying anxiety or making dramatic predictions.</p>

                <h2 id="calm">A calm approach</h2>
                <p>The healthiest way to use Chandrashtama is as planning information, not as a source of worry. If you know a Chandrashtama period is coming, you can simply schedule major decisions around it where practical. If something important must happen during it, that is not a guarantee of a bad outcome — it is simply a period to proceed with extra awareness.</p>

                <div className="cl-trust-links">
                  <Link href="/features/daily-guidance" className="cl-trust-link">Daily guidance feature →</Link>
                  <Link href="/features/timing-and-decisions" className="cl-trust-link">Timing and decisions →</Link>
                  <Link href="/trust/methodology" className="cl-trust-link">Our methodology →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Know when your Chandrashtama falls</h2>
              <p className="cl-cta-strip__body">Tracked automatically and explained calmly in your daily reading.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
