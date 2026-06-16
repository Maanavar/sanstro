import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "What is Thirukanitham? Tamil Astrology Calculation Method — Vinaadi",
  description:
    "Thirukanitham is the Tamil tradition of precise astronomical calculation for Jyotish. Learn why it matters for birth charts, panchangam, dasha, and daily guidance.",
  alternates: { canonical: "https://vinaadi.com/learn/what-is-thirukanitham" },
  openGraph: {
    title: "What is Thirukanitham? Tamil Astrology Calculation Method",
    description: "Thirukanitham explained — the precise Tamil astronomical standard for Jyotish calculation.",
  },
};


export default function WhatIsThirukanithamPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">Learn · Tamil Astrology</p>
            <h1 className="cl-trust-h1">What is Thirukanitham?</h1>
            <p className="cl-trust-lead">
              Thirukanitham (திருக்கணிதம்) is the Tamil tradition of precise
              astronomical calculation for Jyotish. It is the foundation of
              accurate Tamil birth charts, panchangam, and astrological guidance.
            </p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-learn-prose">

            <h2>The meaning of Thirukanitham</h2>
            <p>
              The word Thirukanitham combines &ldquo;Thiru&rdquo; (திரு) — a reverential prefix
              meaning sacred or excellent — and &ldquo;Kanitham&rdquo; (கணிதம்) — meaning
              mathematics or calculation. Together, Thirukanitham means &ldquo;the
              precise method of calculation&rdquo; — the astronomical basis for Tamil
              Jyotish practice.
            </p>
            <p>
              In practical terms, Thirukanitham refers to the system of astronomical
              tables and formulae used to compute planetary positions with high
              accuracy for a given date, time, and location. It is the calculation
              standard underlying traditional Tamil birth chart (jadhagam) generation
              and panchangam (almanac) publication.
            </p>

            <h2>Thirukanitham vs. Vakya</h2>
            <p>
              There are two main calculation traditions in Tamil Jyotish:
              <strong> Thirukanitham</strong> and <strong>Vakya</strong>.
            </p>
            <p>
              Vakya is an older system based on memorised astronomical cycles
              (vaakya) passed down in texts. It was the dominant method before
              modern computational tools became available, and it uses approximate
              cycles rather than precise per-day calculation.
            </p>
            <p>
              Thirukanitham uses precise astronomical calculation for each date —
              similar to modern ephemeris-based computation. This produces more
              accurate planet positions, especially for planets like Saturn and
              Jupiter whose cycles are longer and whose approximated positions in
              Vakya can be off by degrees over time.
            </p>
            <p>
              Vinaadi uses Thirukanitham — the precise calculation method. This
              means planet positions, nakshatra placements, and dasha start dates
              are computed accurately for each individual birth moment, rather than
              approximated from cycle tables.
            </p>

            <h2>Why Thirukanitham precision matters</h2>
            <p>
              The nakshatra is one of the most important elements in Tamil Jyotish.
              A planet near a nakshatra boundary — placed at the last or first
              degrees of a nakshatra — can be assigned to the wrong nakshatra in
              an approximate system. This affects porutham calculation, dasha
              sequence start dates, and daily guidance quality.
            </p>
            <p>
              Similarly, the lagna (ascendant) changes approximately every 2 hours.
              Precise calculation of the lagna requires accurate sidereal planet
              positions, which only a Thirukanitham-standard calculation can provide.
            </p>

            <h2>Thirukanitham and Lahiri ayanamsa</h2>
            <p>
              Tamil Jyotish uses the sidereal zodiac — planet positions measured
              against the fixed stars rather than the Sun&apos;s equinoctial position.
              The adjustment between the tropical and sidereal zodiac is called
              the <strong>ayanamsa</strong>.
            </p>
            <p>
              Vinaadi uses the <strong>Lahiri ayanamsa</strong>, which is the
              government-recognised standard in India and the basis for the Indian
              National Calendar. This is the same ayanamsa used by traditional
              Tamil Jyotish practitioners who follow the Thirukanitham method.
            </p>

            <h2>Thirukanitham and the Tamil panchangam</h2>
            <p>
              The Tamil daily almanac (panchangam) — which covers Tithi, Vara,
              Nakshatra, Yoga, and Karana — is computed using Thirukanitham
              astronomical calculation. Published Tamil panchagams from reputable
              sources use this method for their daily predictions and auspicious
              timing guidance.
            </p>
            <p>
              Vinaadi computes the daily panchangam from Thirukanitham planet
              positions, ensuring that the daily guidance, best windows, and
              caution windows are based on the same standard as traditional Tamil
              almanac publications.
            </p>

            <div className="cl-trust-links">
              <Link href="/trust/methodology" className="cl-trust-link">Our full methodology →</Link>
              <Link href="/features/daily-guidance" className="cl-trust-link">How daily guidance works →</Link>
              <Link href="/tools/jadhagam-generator" className="cl-trust-link">Generate your jadhagam →</Link>
            </div>
          </div>
        </section>

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
