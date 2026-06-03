import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Why Birth Time Matters in Astrology — Vinaadi",
  description:
    "Your birth time determines your lagna, house placements, and dasha start. Learn why an accurate birth time matters and how birth time rectification can help.",
  alternates: { canonical: "https://vinaadi.com/learn/why-birth-time-matters" },
  openGraph: {
    title: "Why Birth Time Matters in Astrology - Vinaadi",
    description:
      "Your birth time determines your lagna, house placements, and dasha start. Learn why an accurate birth time matters and how birth time rectification can help.",
    url: "https://vinaadi.com/learn/why-birth-time-matters",
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
    title: "Why Birth Time Matters in Astrology - Vinaadi",
    description:
      "Your birth time determines your lagna, house placements, and dasha start. Learn why an accurate birth time matters and how birth time rectification can help.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};


export default function WhyBirthTimePage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        {/* HERO */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Learn · Tamil Astrology</p>
              <h1 className="cl-pub-h1">Why birth time matters</h1>
              <p className="cl-pub-lead">Of the three birth details — date, time, and place — the time is the most sensitive. It determines your lagna, your house placements, and the precise start of your dasha periods. A small error can shift the whole chart.</p>
              <div className="cl-hero__actions">
                <Link href="/tools/birth-time-rectification" className="cl-btn cl-btn--solid">Rectify your birth time →</Link>
                <Link href="/learn/how-to-read-a-jadhagam" className="cl-btn cl-btn--ghost">How to read a jadhagam</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">Lagna shifts with time</p>
              <div className="cl-hero-figure__art">
                <svg viewBox="0 0 220 130" role="img" aria-label="The ascendant changes roughly every two hours">
                  <line x1="16" y1="92" x2="204" y2="92" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <g stroke="var(--cl-muted-2)" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="16" y1="86" x2="16" y2="98" /><line x1="78" y1="86" x2="78" y2="98" />
                    <line x1="140" y1="86" x2="140" y2="98" /><line x1="202" y1="86" x2="202" y2="98" />
                  </g>
                  <path d="M16 92 Q110 8 204 92" fill="none" stroke="var(--cl-accent)" strokeWidth="1.6" />
                  <circle cx="78" cy="48" r="6" className="clf-accent-fill" />
                  <text x="78" y="112" textAnchor="middle" className="clf-cell-label clf-muted">~2 hrs</text>
                  <text x="110" y="120" textAnchor="middle" className="clf-cell-label clf-muted">one lagna ≈ 2 hours</text>
                </svg>
              </div>
              <p className="cl-hero-figure__title">The ascendant changes ~every 2 hours</p>
              <p className="cl-hero-figure__note">A birth time off by an hour or two can change your lagna entirely — and with it, the whole house framework.</p>
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
                  <a href="#lagna-depends">Lagna depends on time</a>
                  <a href="#house-placements">House placements shift</a>
                  <a href="#dasha">Dasha start point</a>
                  <a href="#no-exact-time">If you don&apos;t know your time</a>
                  <a href="#rectification">Birth time rectification</a>
                  <a href="#how-accurate">How accurate is enough?</a>
                </nav>
              </aside>
              <div className="cl-article__body cl-learn-prose">

                <h2 id="lagna-depends">The lagna depends on the time</h2>
                <p>The lagna (ascendant) is the sign rising on the eastern horizon at your moment of birth. Because the Earth rotates once every 24 hours, the rising sign changes roughly every two hours. This means a birth time that is off by an hour or two can place your lagna in an entirely different sign — which changes how all twelve houses are counted and interpreted.</p>
                <div className="cl-callout"><p>Change the lagna, and you change the meaning of every house in the chart.</p></div>

                <h2 id="house-placements">House placements shift</h2>
                <p>Since the houses are counted from the lagna, an incorrect lagna shifts every planet into a different house. A planet that appears to be in your 10th house of career with one birth time might fall in the 9th or 11th with another. Because house placement is central to interpretation, this has a real effect on the reading.</p>

                <h2 id="dasha">Dasha periods start at a precise point</h2>
                <p>Your Vimshottari dasha sequence is calculated from the exact position of the Moon within its nakshatra at birth. While the Moon moves more slowly than the lagna, the precise degree still determines the exact start and end dates of your dasha periods. A more accurate birth time produces more accurate dasha timing.</p>

                <h2 id="no-exact-time">What if you don&apos;t know your exact time?</h2>
                <p>Many people have only an approximate birth time, or none recorded at all. This is common and not a barrier to useful astrology. Even with an approximate time, your rasi (Moon sign), nakshatra, and broad dasha periods are often reliable, because the Moon moves relatively slowly. The main uncertainty is the lagna and the fine timing of dasha changes.</p>

                <h2 id="rectification">Birth time rectification</h2>
                <p><strong>Rectification</strong> is the process of refining an uncertain birth time by comparing known life events against the chart. By examining when significant events occurred — and which dasha periods and transits would explain them — a more accurate birth time can be estimated. Vinaadi includes a birth time rectification tool that uses the Thirukanitham method to help narrow down your time.</p>

                <h2 id="how-accurate">How accurate is accurate enough?</h2>
                <p>For most practical guidance, a birth time accurate to within a few minutes gives a reliable lagna and dasha timing. If your recorded time is to the nearest 15 minutes, that is usually sufficient for confident readings. If it is only known to the nearest hour or worse, rectification is worthwhile — especially if you rely on house-based interpretation and precise timing windows.</p>

                <div className="cl-trust-links">
                  <Link href="/tools/birth-time-rectification" className="cl-trust-link">Birth time rectification tool →</Link>
                  <Link href="/learn/how-to-read-a-jadhagam" className="cl-trust-link">How to read a jadhagam →</Link>
                  <Link href="/learn/what-is-thirukanitham" className="cl-trust-link">What is Thirukanitham? →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Refine your birth time</h2>
              <p className="cl-cta-strip__body">Use Vinaadi&apos;s rectification tool with life events to improve accuracy.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
