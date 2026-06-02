import type { Metadata } from "next";
import Link from "next/link";
import { PanchangamTool } from "./PanchangamTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Daily Tamil Panchangam Planner — Vinaadi",
  description:
    "Free Tamil panchangam for today — Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Yamagandam, Nalla Neram, and auspicious timings for any date and location.",
  alternates: { canonical: "https://vinaadi.com/tools/daily-panchangam-planner" },
};

export default function PanchangamPlannerPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">Tool · Panchangam Planner</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "20ch" }}>
              Daily Tamil Panchangam for Planning
            </h1>
            <p className="cl-pub-lead">
              Thirukanitham-precise Tamil panchangam for any date and location —
              Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Yamagandam, and
              Nalla Neram. Free, no account required.
            </p>
          </div>
        </section>

        {/* Live tool */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <PanchangamTool />
          </div>
        </section>

        {/* Info section */}
        <section className="cl-pub-body" style={{ paddingTop: 0 }}>
          <div className="cl-container">
            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">The five limbs of the panchangam</h2>
              <div className="cl-pub-two-col">
                <div className="cl-pub-section__body">
                  <p>
                    Panchangam (பஞ்சாங்கம்) means &ldquo;five limbs&rdquo; — the five daily
                    elements that define the quality of each day in the Tamil calendar.
                    Vinaadi computes a precise panchangam from Thirukanitham
                    astronomical data for any date and location.
                  </p>
                </div>
                <ul className="cl-pub-detail-list">
                  {[
                    { title: "Tithi", body: "The 30 lunar day phases. Each has a distinct quality for different types of actions." },
                    { title: "Vara", body: "The weekday and its planetary lord — Sunday (Sun), Monday (Moon), etc." },
                    { title: "Nakshatra", body: "The Moon's nakshatra for the day — affects activities started on that day." },
                    { title: "Yoga", body: "Sun-Moon combination — 27 yogas, some auspicious, some inauspicious." },
                    { title: "Karana", body: "Half-tithi periods — 11 karanas for finer daily timing." },
                  ].map((item) => (
                    <li key={item.title} className="cl-pub-detail-item">
                      <p className="cl-pub-detail-item__title">{item.title}</p>
                      <p className="cl-pub-detail-item__body">{item.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="cl-pub-related">
              <p className="cl-pub-related__title">Related</p>
              <div className="cl-pub-related-links">
                <Link href="/features/daily-guidance" className="cl-pub-related-link">Daily Guidance →</Link>
                <Link href="/features/timing-and-decisions" className="cl-pub-related-link">Timing and Decisions →</Link>
                <Link href="/learn/what-is-chandrashtama" className="cl-pub-related-link">What is Chandrashtama? →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Get panchangam connected to your chart</h2>
              <p className="cl-cta-strip__body">Create a free account for daily guidance that combines your chart, dasha, and panchangam together.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Get started free →</Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
