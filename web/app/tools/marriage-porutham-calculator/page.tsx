import type { Metadata } from "next";
import Link from "next/link";
import { PoruthamTool } from "./PoruthamTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Tamil Porutham Calculator for Marriage Matching — Vinaadi",
  description:
    "Free Tamil marriage compatibility calculator — full 10-porutham analysis with Rajju, Vedha, Nadi, and Sevvai dosham. Thirukanitham-precise, no account required.",
  alternates: { canonical: "https://vinaadi.com/tools/marriage-porutham-calculator" },
  openGraph: {
    title: "Tamil Porutham Calculator for Marriage Matching — Vinaadi",
    description:
      "10-porutham compatibility with Rajju, Vedha, Nadi, and Sevvai dosham analysis using the Thirukanitham method.",
  },
};

export default function PoruthamCalculatorPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">Tool · Marriage Porutham</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "22ch" }}>
              Tamil Porutham Calculator for Marriage Matching
            </h1>
            <p className="cl-pub-lead">
              Full 10-porutham compatibility analysis using the Thirukanitham
              method. Rajju dosha, Vedha, Nadi, Sevvai — all checked,
              all explained. Free, no account required.
            </p>
          </div>
        </section>

        {/* Live calculator */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <PoruthamTool />
          </div>
        </section>

        {/* Info section */}
        <section className="cl-pub-body" style={{ paddingTop: 0 }}>
          <div className="cl-container">
            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">What Vinaadi checks</h2>
              <div className="cl-pub-section__body">
                <p>
                  Vinaadi checks all 10 traditional Tamil poruthams plus Rajju
                  dosha, Vedha dosha, and Nadi dosha — the three most critical
                  compatibility factors in Tamil marriage matching.
                </p>
                <p>
                  The result uses birth nakshatra and rasi derived from a
                  Thirukanitham-precise chart calculation for each person —
                  the same standard used by traditional Tamil Jyotish practitioners.
                </p>
              </div>
            </div>

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">The 10 Poruthams</h2>
              <div className="cl-pub-faq">
                {[
                  { q: "Dinam", a: "Day-to-day harmony and health. Based on nakshatra count from boy to girl." },
                  { q: "Ganam", a: "Temperament compatibility. Based on Gana (Deva/Manushya/Rakshasa) of each nakshatra." },
                  { q: "Mahendram", a: "Long-term prosperity and longevity of the marriage." },
                  { q: "Stree Deergham", a: "Long and prosperous life for the bride." },
                  { q: "Yoni", a: "Physical and intimate compatibility. Based on animal symbol of each nakshatra." },
                  { q: "Rajju ⚠", a: "Critical dosha. Matching Rajju group indicates risk to longevity of the marriage. Most important single check." },
                  { q: "Vedha", a: "Certain nakshatra pairs oppose each other. Vedha indicates obstacles." },
                  { q: "Rasi", a: "Overall compatibility between Moon signs." },
                  { q: "Rasiyathipathi (Graha Maitri)", a: "Compatibility between rasi lords of both partners." },
                  { q: "Nadi ⚠", a: "Critical dosha. Same Nadi category (Adi/Madhya/Antya) is associated with health concerns for progeny." },
                ].map((item) => (
                  <div key={item.q} className="cl-pub-faq-item">
                    <p className="cl-pub-faq-item__q">{item.q}</p>
                    <p className="cl-pub-faq-item__a">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="cl-pub-related">
              <p className="cl-pub-related__title">Related</p>
              <div className="cl-pub-related-links">
                <Link href="/learn/what-is-porutham" className="cl-pub-related-link">What is Porutham? →</Link>
                <Link href="/features/family-planning" className="cl-pub-related-link">Family Planning →</Link>
                <Link href="/tools/jadhagam-generator" className="cl-pub-related-link">Jadhagam Generator →</Link>
                <Link href="/trust/methodology" className="cl-pub-related-link">Our Methodology →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Save results and plan together</h2>
              <p className="cl-cta-strip__body">Create a free account to save porutham results, add family members, and get daily guidance.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Get started free →</Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
