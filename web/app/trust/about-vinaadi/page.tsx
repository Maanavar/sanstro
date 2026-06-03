import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "About Vinaadi — A Calm Tamil Astrology Assistant",
  description:
    "Vinaadi brings the Tamil Jyotish tradition into a modern, calm planning assistant — precise Thirukanitham calculation, family-aware, and built without fear language.",
  alternates: { canonical: "https://vinaadi.com/trust/about-vinaadi" },
  openGraph: {
    title: "About Vinaadi — Tamil Astrology Assistant",
    description:
      "Thirukanitham-based Tamil astrology for daily guidance, family planning, and calm interpretation.",
    url: "https://vinaadi.com/trust/about-vinaadi",
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
    title: "About Vinaadi — A Calm Tamil Astrology Assistant",
    description:
      "Thirukanitham-based Tamil astrology for daily guidance, family planning, and calm interpretation.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};


export default function AboutPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        {/* HERO */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">About</p>
              <h1 className="cl-pub-h1">What Vinaadi is trying to do</h1>
              <p className="cl-pub-lead">Tamil astrology has been a practical guide for daily life and family decisions for thousands of years. Vinaadi brings that tradition into a modern tool — precise, calm, and built for the way people actually think through their days.</p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">Get started free →</Link>
                <Link href="/trust/methodology" className="cl-btn cl-btn--ghost">Our methodology</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">What we believe</p>
              <div className="cl-hero-figure__rows">
                <div className="cl-hero-figure__row"><b>Precise</b><span>Thirukanitham, Lahiri ayanamsa, Drik ephemeris</span></div>
                <div className="cl-hero-figure__row"><b>Calm</b><span>No doom language; every verdict shows its reasoning</span></div>
                <div className="cl-hero-figure__row"><b>Family-aware</b><span>Built for the way Tamil families actually plan</span></div>
                <div className="cl-hero-figure__row"><b>Honest</b><span>Jyotish is tradition, not science — we say so</span></div>
              </div>
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
                  <a href="#problem">The problem we solve</a>
                  <a href="#what-vinaadi-is">What Vinaadi is</a>
                  <a href="#how-different">How it&apos;s different</a>
                  <a href="#what-not">What it is not</a>
                  <a href="#early-access">Early access</a>
                </nav>
              </aside>
              <div className="cl-article__body cl-trust-prose">

                <h2 id="problem">The problem Vinaadi solves</h2>
                <p>Most astrology apps are built around passive consumption — daily sun-sign horoscopes, generic forecasts, or entertainment content. They are not designed for the Tamil Jyotish practitioner who needs Thirukanitham-accurate birth charts, or the family that wants to plan shared decisions using real astrological signals.</p>
                <p>There is also a trust problem. Many existing tools use fear-amplifying language — warning of &ldquo;dangerous&rdquo; periods, predicting bad outcomes, or presenting astrological signals as fixed fate. That is not how traditional Tamil Jyotish is meant to be used.</p>

                <h2 id="what-vinaadi-is">What Vinaadi is</h2>
                <p>Vinaadi is an assistant. It reads your chart, tracks your dasha, monitors transits, computes a daily panchangam, and gives you one quiet reading every morning — a score, a best window, a caution window, and a brief interpretation in plain language.</p>
                <p>When you need a specific tool — porutham matching for a marriage, jadhagam generation, birth time rectification, or a panchangam calendar — those tools are part of the same assistant. They are not disconnected calculators.</p>
                <p>When you have family members to plan with, their readings sit alongside yours. The shared timing windows help you make decisions together rather than in isolation.</p>

                <h2 id="how-different">How Vinaadi is different</h2>
                <ul>
                  <li><strong>Thirukanitham precision.</strong> Every calculation uses the Tamil standard — Lahiri ayanamsa, Drik ephemeris, traditional South Indian chart format.</li>
                  <li><strong>Assistant-first, not tool-first.</strong> The daily reading integrates chart, dasha, transits, and panchangam together. Tools are available when needed but do not define the experience.</li>
                  <li><strong>Family-aware.</strong> Most astrology products stop at individual readings. Vinaadi is designed for the way Tamil families actually use astrology — together.</li>
                  <li><strong>Calm language.</strong> No doom language. No fear-based predictions. Every signal includes reasoning. Users understand what the reading is based on.</li>
                  <li><strong>Transparent reasoning.</strong> Vinaadi shows you why a day scores the way it does. Dasha period quality, transit influences, panchangam quality — all visible.</li>
                </ul>

                <h2 id="what-not">What Vinaadi is not</h2>
                <p>Vinaadi is not a replacement for a trained Jyotish practitioner for complex life decisions. It is not medical, legal, or financial advice. It is a planning assistant that uses Tamil astrological tradition to help people think about time, timing, and context — with clarity rather than anxiety.</p>
                <div className="cl-callout"><p>A planning assistant for time, timing, and context — with clarity rather than anxiety.</p></div>

                <h2 id="early-access">Early access</h2>
                <p>Vinaadi is currently in early access. The core experience — daily guidance, porutham, jadhagam, family vault — is available now. We are building toward a fuller assistant experience including richer guidance narratives, deeper chart exploration, and expanded family planning tools.</p>

                <div className="cl-trust-links">
                  <Link href="/trust/methodology" className="cl-trust-link">Our methodology →</Link>
                  <Link href="/features/daily-guidance" className="cl-trust-link">How daily guidance works →</Link>
                  <Link href="/dashboard" className="cl-trust-link">Open dashboard →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Start with today&apos;s reading</h2>
              <p className="cl-cta-strip__body">Free during early access. Full chart, daily guidance, family vault.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Get started free →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
