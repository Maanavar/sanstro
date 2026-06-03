import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "How to Read a Jadhagam — Tamil Birth Chart Guide — Vinaadi",
  description:
    "A beginner's guide to reading a Tamil jadhagam (birth chart): the South Indian square layout, lagna, houses, planets, rasi, nakshatra, and dasha periods explained simply.",
  alternates: { canonical: "https://vinaadi.com/learn/how-to-read-a-jadhagam" },
  openGraph: {
    title: "How to Read a Jadhagam - Vinaadi",
    description:
      "A beginner's guide to reading a Tamil jadhagam (birth chart): the South Indian square layout, lagna, houses, planets, rasi, nakshatra, and dasha periods explained simply.",
    url: "https://vinaadi.com/learn/how-to-read-a-jadhagam",
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
    title: "How to Read a Jadhagam - Vinaadi",
    description:
      "A beginner's guide to reading a Tamil jadhagam (birth chart): the South Indian square layout, lagna, houses, planets, rasi, nakshatra, and dasha periods explained simply.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};


export default function HowToReadJadhagamPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        {/* HERO */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Learn · Tamil Astrology</p>
              <h1 className="cl-pub-h1">How to read a Jadhagam</h1>
              <p className="cl-pub-lead">A jadhagam (ஜாதகம்) is a Tamil birth chart — a map of the sky at the moment you were born. This guide explains the South Indian square layout and the key elements, so you can begin to read your own chart.</p>
              <div className="cl-hero__actions">
                <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--solid">Generate your jadhagam →</Link>
                <Link href="/features/chart-guidance" className="cl-btn cl-btn--ghost">Chart guidance</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">South Indian Layout</p>
              <div className="cl-hero-figure__art">
                <svg viewBox="0 0 220 220" role="img" aria-label="South Indian square chart with twelve houses">
                  <rect x="1" y="1" width="218" height="218" rx="5" fill="var(--cl-surface)" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <g className="clf-grid-line">
                    <line x1="55" y1="1" x2="55" y2="219" /><line x1="110" y1="1" x2="110" y2="219" /><line x1="165" y1="1" x2="165" y2="219" />
                    <line x1="1" y1="55" x2="219" y2="55" /><line x1="1" y1="110" x2="219" y2="110" /><line x1="1" y1="165" x2="219" y2="165" />
                  </g>
                  <rect x="55" y="55" width="110" height="110" fill="var(--cl-surface-2)" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <rect x="55" y="0" width="55" height="55" className="clf-cell-lag" />
                  <text x="62" y="16" className="clf-cell-label clf-accent-fill">Lagna</text>
                  <text x="110" y="106" textAnchor="middle" fontFamily="var(--cl-font-display)" fontSize="13" fill="var(--cl-ink)">Rasi</text>
                  <text x="110" y="124" textAnchor="middle" className="clf-cell-label">D1</text>
                </svg>
              </div>
              <p className="cl-hero-figure__title">Twelve fixed houses, signs anchored</p>
              <p className="cl-hero-figure__note">In the South Indian chart, the signs are in fixed boxes and the planets are placed inside them.</p>
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
                  <a href="#south-indian-chart">South Indian chart</a>
                  <a href="#lagna">Finding the lagna</a>
                  <a href="#twelve-houses">The twelve houses</a>
                  <a href="#planets">Planets and placements</a>
                  <a href="#rasi-nakshatra">Rasi and nakshatra</a>
                  <a href="#dasha">Dasha periods</a>
                  <a href="#reading-together">Reading it all together</a>
                </nav>
              </aside>
              <div className="cl-article__body cl-learn-prose">

                <h2 id="south-indian-chart">The South Indian square chart</h2>
                <p>Tamil astrology uses the South Indian style of chart — a 4×4 grid with the outer twelve boxes representing the twelve rasis (signs) and the centre four boxes left empty (used for labels). Unlike the North Indian chart, the signs are fixed in position: Mesham (Aries) is always top-left-second, and the signs proceed clockwise. The planets are then placed into whichever box corresponds to their sign.</p>

                <h2 id="lagna">Finding the lagna</h2>
                <p>The <strong>lagna</strong> (ascendant) is the most important starting point. It is the rasi that was rising on the eastern horizon at the moment of birth. In the chart, the lagna box is usually marked &ldquo;La&rdquo; or &ldquo;Lagnam.&rdquo; The lagna determines how the twelve houses are counted — the lagna is the 1st house, and you count clockwise from there.</p>
                <div className="cl-callout"><p>Find the lagna first. Everything else in the chart is read in relation to it.</p></div>

                <h2 id="twelve-houses">The twelve houses</h2>
                <p>Each house governs different areas of life. Counting from the lagna: the 1st is self and body; the 2nd is wealth and family; the 4th is home and mother; the 5th is children and education; the 7th is marriage and partnership; the 9th is fortune and dharma; the 10th is career; and the 8th and 12th are the houses of transformation and loss that traditionally require care.</p>

                <h2 id="planets">Planets and their placements</h2>
                <p>Nine planets (Navagraha) are placed in the chart: Sun (Su), Moon (Ch), Mars (Se), Mercury (Bu), Jupiter (Gu), Venus (Su/Sk), Saturn (Sa), and the lunar nodes Rahu (Ra) and Ketu (Ke). Where each planet sits — which house and sign — and which other planets it is with or aspects, forms the basis of interpretation.</p>

                <h2 id="rasi-nakshatra">Rasi and nakshatra</h2>
                <p>Your <strong>rasi</strong> is your Moon sign — the sign the Moon occupied at birth. Your <strong>nakshatra</strong> (janma nakshatra) is the lunar mansion the Moon was in, one of 27. These two are central to Tamil astrology: the rasi anchors many daily calculations, and the nakshatra determines your Vimshottari dasha sequence and is the basis of porutham matching.</p>

                <h2 id="dasha">Dasha periods</h2>
                <p>The <strong>Vimshottari dasha</strong> is a 120-year cycle of planetary periods, determined by your birth nakshatra. At any point in life you are in a main period (dasha), a sub-period (bhukti), and a sub-sub-period (antara). Knowing your current dasha lord is essential — it colours the interpretation of everything else in the chart at that time.</p>

                <h2 id="reading-together">Reading it all together</h2>
                <p>A chart is not read as isolated facts but as a whole. The lagna sets the frame; the planets and houses describe the themes; the current dasha tells you which themes are active now; and the daily transits show how today&apos;s sky touches your natal chart. This is exactly what Vinaadi does for you automatically — but understanding the pieces helps you read your own chart with more confidence.</p>

                <div className="cl-trust-links">
                  <Link href="/tools/jadhagam-generator" className="cl-trust-link">Generate your jadhagam →</Link>
                  <Link href="/learn/why-birth-time-matters" className="cl-trust-link">Why birth time matters →</Link>
                  <Link href="/features/chart-guidance" className="cl-trust-link">Chart guidance feature →</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Generate and read your own chart</h2>
              <p className="cl-cta-strip__body">A full South Indian jadhagam with plain-language guidance.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
