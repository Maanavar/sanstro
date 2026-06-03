import type { Metadata } from "next";
import Link from "next/link";
import { JadhagamTool } from "./JadhagamTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "South Indian Tamil Birth Chart Generator — Vinaadi Jadhagam",
  description:
    "Generate a Thirukanitham-precise South Indian birth chart (jadhagam) free online. D1 Rasi chart, D9 Navamsa, Lahiri ayanamsa, planet positions, and dasha sequence.",
  alternates: { canonical: "https://vinaadi.com/tools/jadhagam-generator" },
  openGraph: {
    title: "South Indian Tamil Birth Chart Generator — Vinaadi Jadhagam",
    description:
      "Thirukanitham jadhagam generation — D1 Rasi, D9 Navamsa, Lahiri ayanamsa, planet positions, dasha sequence.",
    url: "https://vinaadi.com/tools/jadhagam-generator",
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
    title: "South Indian Tamil Birth Chart Generator — Vinaadi Jadhagam",
    description:
      "Thirukanitham jadhagam generation — D1 Rasi, D9 Navamsa, Lahiri ayanamsa, planet positions, dasha sequence.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};

export default function JadhagamGeneratorPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        {/* HERO */}
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">Tool · Jadhagam Generator</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "20ch" }}>
              Generate a South Indian Tamil Birth Chart
            </h1>
            <p className="cl-pub-lead">
              Thirukanitham-precise jadhagam — Lahiri ayanamsa, Drik ephemeris.
              D1 Rasi chart, D9 Navamsa, full planet positions, nakshatra, and
              dasha sequence. Free, no account required.
            </p>
          </div>
        </section>

        {/* Live calculator */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <JadhagamTool />
          </div>
        </section>

        {/* BAND — What this chart includes */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">What&apos;s included</p>
              <h2 className="cl-section-h2">What this chart includes</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>Every chart is computed using the Thirukanitham method — the precise Tamil astronomical calculation standard with Lahiri ayanamsa and Drik ephemeris data. The same method used by traditional Tamil Jyotish practitioners.</p>
              </div>
              <ul className="cl-pub-detail-list">
                {[
                  { title: "D1 Rasi chart", body: "Primary natal chart — all planets in South Indian square format." },
                  { title: "D9 Navamsa chart", body: "Divisional chart for relationships, dharma, and second half of life." },
                  { title: "Planet positions", body: "Precise rasi, nakshatra, pada, and degree for all 9 grahas." },
                  { title: "Vimshottari Dasha", body: "Current dasha and bhukti period from birth nakshatra." },
                ].map((item) => (
                  <li key={item.title} className="cl-pub-detail-item">
                    <p className="cl-pub-detail-item__title">{item.title}</p>
                    <p className="cl-pub-detail-item__body">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">Related</p>
              <div className="cl-pub-related-links">
                <Link href="/features/chart-guidance" className="cl-pub-related-link">Chart Guidance →</Link>
                <Link href="/learn/how-to-read-a-jadhagam" className="cl-pub-related-link">How to read a Jadhagam →</Link>
                <Link href="/learn/why-birth-time-matters" className="cl-pub-related-link">Why birth time matters →</Link>
                <Link href="/tools/birth-time-rectification" className="cl-pub-related-link">Birth Time Rectification →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Save your chart and get daily guidance</h2>
              <p className="cl-cta-strip__body">Create a free account to save, track dasha over time, and get a reading every morning.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Get started free →</Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
