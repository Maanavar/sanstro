import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Timing and Decisions — Vinaadi Tamil Astrology Assistant",
  description:
    "Plan important actions with astrological timing. Vinaadi identifies best windows, caution windows, and the chart-based signals behind each recommendation.",
  alternates: { canonical: "https://vinaadi.com/features/timing-and-decisions" },
};


export default function TimingAndDecisionsPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Feature · Timing &amp; Decisions</p>
              <h1 className="cl-pub-h1">
                The right time is part of the decision.
              </h1>
              <p className="cl-pub-lead">
                Tamil astrology has always been a planning tradition, not just a
                reading tradition. Muhurtha — the selection of auspicious timing —
                is one of its oldest and most practical applications.
                Vinaadi brings this to everyday decisions, not just ceremonies.
              </p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">See today&apos;s windows →</Link>
                <Link href="/features/daily-guidance" className="cl-btn cl-btn--ghost">How daily guidance works</Link>
              </div>
            </div>

            <div className="cl-pub-preview">
              <p className="cl-pub-preview__label">Today&apos;s Windows · Sample</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                <div className="cl-daily-card__win cl-daily-card__win--best">
                  <p className="cl-daily-card__win-label">Best Window</p>
                  <p className="cl-daily-card__win-time">11:53 – 12:41</p>
                </div>
                <div className="cl-daily-card__win cl-daily-card__win--hold">
                  <p className="cl-daily-card__win-label">Caution</p>
                  <p className="cl-daily-card__win-time">15:28 – 17:03</p>
                </div>
              </div>
              <p className="cl-pub-preview__body" style={{ marginTop: "12px" }}>
                Based on Amrit Kalam, panchangam quality, dasha lord strength, and Moon nakshatra.
              </p>
            </div>
          </div>
        </section>

        <section className="cl-pub-body">
          <div className="cl-container">

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">What timing guidance covers</h2>
              <div className="cl-pub-two-col">
                <div className="cl-pub-section__body">
                  <p>
                    Vinaadi calculates specific time windows every day based on a
                    combination of panchangam elements and your personal chart signals.
                    The best window is the period with the strongest astrological
                    support for initiating actions. The caution window is the period
                    where the panchangam signals work against important decisions.
                  </p>
                  <p>
                    These windows are calculated from real inputs — not generated
                    generically. Two people with different birth charts will have
                    different timing windows on the same day.
                  </p>
                </div>
                <ul className="cl-pub-detail-list">
                  {[
                    { title: "Panchangam windows", body: "Rahu Kalam, Yamagandam, Gulika Kalam are marked as caution periods. Amrit Kalam and Abhijit Muhurta are best-window candidates." },
                    { title: "Dasha period quality", body: "The current dasha and bhukti lord's strength in your natal chart affects the overall day tone and window quality." },
                    { title: "Moon nakshatra timing", body: "Certain nakshatras favour different types of actions. Vinaadi tracks the Moon's daily nakshatra passage and its implications." },
                    { title: "Transit aspects to natal chart", body: "If Saturn or Rahu transits a sensitive house for you, that modifies the timing recommendations for that period." },
                  ].map((item) => (
                    <li key={item.title} className="cl-pub-detail-item">
                      <p className="cl-pub-detail-item__title">{item.title}</p>
                      <p className="cl-pub-detail-item__body">{item.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">What kinds of decisions benefit from timing</h2>
              <div className="cl-pub-section__body">
                <p>
                  Traditional Tamil muhurtha covers a wide range of life events —
                  marriages, housewarmings, business launches, journeys, medical
                  procedures, and important communications. Vinaadi&apos;s daily
                  windows are practical guidance for this same range of everyday
                  and significant decisions.
                </p>
                <p>
                  Vinaadi does not claim that a &ldquo;bad window&rdquo; guarantees a
                  bad outcome. It provides the astrological context — and lets you
                  decide how to use it. The goal is clarity and calm awareness, not
                  fear-based avoidance.
                </p>
              </div>
            </div>

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">Frequently asked questions</h2>
              <div className="cl-pub-faq">
                {[
                  { q: "Are the timing windows the same for everyone?", a: "No. While the panchangam elements (Rahu Kalam, Yamagandam) are the same for a given location, the dasha and transit modifiers are personal. Two people can have different best windows on the same day." },
                  { q: "How precise are the time windows?", a: "Windows are calculated to the minute based on Thirukanitham planetary positions and panchangam. They reflect the actual ephemeris, not approximate ranges." },
                  { q: "Does Vinaadi support muhurtha selection for ceremonies?", a: "The current daily window guidance is the foundation. More specific muhurtha selection for ceremonies like marriages and housewarmings is on the roadmap." },
                  { q: "Can I see timing windows for future dates?", a: "Yes. The dashboard allows you to navigate to future dates to see the windows in advance for planning purposes." },
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
                <Link href="/features/daily-guidance" className="cl-pub-related-link">Daily Guidance →</Link>
                <Link href="/tools/daily-panchangam-planner" className="cl-pub-related-link">Panchangam Planner →</Link>
                <Link href="/features/family-planning" className="cl-pub-related-link">Family Planning →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Plan your next important action</h2>
              <p className="cl-cta-strip__body">See today&apos;s best and caution windows for your chart.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
