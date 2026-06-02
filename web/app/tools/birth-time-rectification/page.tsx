import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Birth Time Rectification — Vinaadi Tamil Astrology",
  description:
    "Refine an uncertain birth time using life events and the Thirukanitham calculation method. More accurate birth time means more accurate lagna, dasha, and daily guidance.",
  alternates: { canonical: "https://vinaadi.com/tools/birth-time-rectification" },
};


export default function BirthTimeRectificationPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Tool · Birth Time Rectification</p>
              <h1 className="cl-pub-h1">
                Your birth time matters more than you think.
              </h1>
              <p className="cl-pub-lead">
                An uncertain birth time produces an uncertain lagna, an uncertain
                dasha sequence, and less accurate daily guidance. Vinaadi&apos;s
                rectification tool uses life events to refine your birth time
                and improve the precision of your chart.
              </p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">Rectify birth time →</Link>
                <Link href="/learn/why-birth-time-matters" className="cl-btn cl-btn--ghost">Why birth time matters</Link>
              </div>
            </div>

            <div className="cl-pub-preview">
              <p className="cl-pub-preview__label">Rectification · How it works</p>
              <p className="cl-pub-preview__title">Life events narrow the window</p>
              <p className="cl-pub-preview__body">
                Enter key life events — marriage, major career changes, relocations,
                health events. Vinaadi computes which birth time produces dasha
                periods that best match those events.
              </p>
            </div>
          </div>
        </section>

        <section className="cl-pub-body">
          <div className="cl-container">

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">Why birth time accuracy matters</h2>
              <div className="cl-pub-section__body">
                <p>
                  In Tamil Jyotish, the lagna (ascendant) is the most important
                  single point in the birth chart. It changes approximately every
                  2 hours as the Earth rotates. An error of even 30 minutes in
                  birth time can place the lagna in the wrong sign — completely
                  changing which planets rule which houses, and therefore how
                  the chart is interpreted.
                </p>
                <p>
                  The Vimshottari dasha sequence is also calculated from the birth
                  nakshatra, which can be affected by birth time if the Moon is near
                  a nakshatra boundary at the time of birth. An accurate birth time
                  is the foundation of accurate guidance.
                </p>
              </div>
            </div>

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">How Vinaadi&apos;s rectification approach works</h2>
              <div className="cl-pub-two-col">
                <div className="cl-pub-section__body">
                  <p>
                    Vinaadi&apos;s rectification is dasha-event based. You provide
                    key life events with approximate dates. Vinaadi tests a range
                    of birth times around your recorded time and identifies which
                    birth time produces a dasha sequence that best correlates with
                    your life events.
                  </p>
                  <p>
                    This is not an automated algorithm that claims to know your
                    exact birth time. It is a tool that narrows the uncertainty
                    using real-world correlation — and helps you arrive at a more
                    reliable birth time than an approximate hospital record alone.
                  </p>
                </div>
                <ul className="cl-pub-detail-list">
                  {[
                    { title: "Step 1: Enter approximate birth time", body: "Provide the birth time you know — from hospital records, family recollection, or other sources." },
                    { title: "Step 2: Add key life events", body: "Marriage, major career events, relocations, health events, losses — anything significant with an approximate date." },
                    { title: "Step 3: Vinaadi tests the range", body: "The tool calculates which birth time within a ±30 to ±60 minute window produces dasha periods matching your events most closely." },
                    { title: "Step 4: Review and accept", body: "You see the candidate birth times and their correlation with your events. You choose the one that fits best." },
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
              <h2 className="cl-pub-section__head">Realistic expectations</h2>
              <div className="cl-pub-section__body">
                <p>
                  Rectification can meaningfully improve birth time accuracy when
                  a reasonable range of significant life events is available. It
                  is not a magic solution — if no reliable life events are known,
                  or if the birth time error is very large (more than an hour),
                  the results may be inconclusive.
                </p>
                <p>
                  Vinaadi presents the rectification as a narrowing tool, not an
                  exact answer. The outcome is a refined birth time with more
                  confidence than the original record, along with an explanation
                  of which events supported which candidate time.
                </p>
              </div>
            </div>

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">Frequently asked questions</h2>
              <div className="cl-pub-faq">
                {[
                  { q: "What if I don't know my birth time at all?", a: "Without any birth time, lagna calculation is not possible. Vinaadi can still generate a partial chart (rasi positions are date-based for most planets) and give limited daily guidance based on rasi and nakshatra. Rectification requires at least an approximate time range to test against." },
                  { q: "What kinds of life events work best for rectification?", a: "Events with clear astrological significance work best: marriages, significant career changes, relocations, major health events, deaths of close family members, and births of children. Events with a clear emotional or life-impact quality tend to correlate strongly with dasha transitions." },
                  { q: "How accurate does the rectified time become?", a: "Typically, rectification can narrow uncertainty to within 15–30 minutes for a well-documented life. This is usually sufficient to confirm or correct the lagna sign and improve dasha accuracy." },
                  { q: "Is the rectification feature available in early access?", a: "Yes. Birth time rectification is available in the dashboard for all users during early access." },
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
                <Link href="/learn/why-birth-time-matters" className="cl-pub-related-link">Why birth time matters →</Link>
                <Link href="/tools/jadhagam-generator" className="cl-pub-related-link">Jadhagam Generator →</Link>
                <Link href="/features/chart-guidance" className="cl-pub-related-link">Chart Guidance →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Improve your birth time</h2>
              <p className="cl-cta-strip__body">More accurate birth time means more accurate guidance.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
