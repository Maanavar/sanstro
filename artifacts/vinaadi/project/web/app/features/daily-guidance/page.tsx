import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Daily Guidance — Vinaadi",
  description:
    "Every morning, Vinaadi reads your chart, dasha, transits, and panchangam together and gives you one balanced daily reading — best window, caution window, and clear reasoning.",
  alternates: { canonical: "https://vinaadi.com/features/daily-guidance" },
  openGraph: {
    title: "Daily Guidance — Vinaadi Tamil Astrology Assistant",
    description:
      "One daily Tamil jyotish reading combining Thirukanitham chart, Vimshottari dasha, gochar transits, and panchangam into a single practical guide.",
  },
};


export default function DailyGuidancePage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Feature · Daily Guidance</p>
              <h1 className="cl-pub-h1">
                One quiet reading.<br /><em>Every morning.</em>
              </h1>
              <p className="cl-pub-lead">
                Vinaadi reads your Thirukanitham chart, your current dasha period,
                today&apos;s gochar transits, and the panchangam — and gives you one
                balanced answer. Not four separate reports. One reading.
              </p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">Start reading →</Link>
                <Link href="/trust/methodology" className="cl-btn cl-btn--ghost">How it&apos;s calculated</Link>
              </div>
            </div>

            <div className="cl-pub-preview">
              <p className="cl-pub-preview__label">Sample Reading · Today</p>
              <p className="cl-pub-preview__title">Score 64 — Measured</p>
              <p className="cl-pub-preview__body">
                Moon Dasa · Moon Bhukti. Saturn transiting your 7th stabilises
                home and partnerships. Best window 11:53–12:41 for important
                communications. Hold 15:28–17:03.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
                {["Moon Dasa · Moon Bhukti", "Saturn in Kumbam", "Ekadasi · Kettai"].map((chip) => (
                  <span key={chip} className="cl-daily-card__chip">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="cl-pub-body">
          <div className="cl-container">

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">What goes into a daily reading</h2>
              <div className="cl-pub-two-col">
                <div className="cl-pub-section__body">
                  <p>
                    The daily guidance reading integrates four sources of astrological
                    information — each contributing a different layer to the overall
                    picture of the day.
                  </p>
                  <p>
                    The result is a single score (0–100), a best window, a caution
                    window, and a brief interpretation in plain language. Every signal
                    is named, so you can see exactly why the day scores the way it does.
                  </p>
                </div>
                <ul className="cl-pub-detail-list">
                  {[
                    { title: "Vimshottari Dasha", body: "Your current dasha and bhukti period — the 120-year planetary cycle that defines the dominant influence over any span of life." },
                    { title: "Gochar transits", body: "Today's planet positions relative to your natal chart. Saturn, Jupiter, Rahu, Ketu, Sun, Moon — each tracked against your lagna and rasi." },
                    { title: "Tamil Panchangam", body: "Tithi, Vara, Nakshatra, Yoga, Karana — the five daily almanac elements that define the quality of each day in the Tamil calendar." },
                    { title: "Moon nakshatra", body: "The transiting Moon nakshatra and its relationship to your birth nakshatra — including Chandrashtama tracking when the Moon crosses the 8th nakshatra from your janma nakshatra." },
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
              <h2 className="cl-pub-section__head">Best windows and caution windows</h2>
              <div className="cl-pub-section__body">
                <p>
                  Vinaadi calculates specific time windows for each day — not vague
                  &ldquo;morning&rdquo; or &ldquo;evening&rdquo; guidance, but actual clock times based on
                  panchangam Rahu Kalam, Yamagandam, Amrit Kalam, and Abhijit Muhurta
                  combined with your personal chart timing.
                </p>
                <p>
                  The best window is the period most supported by the day&apos;s
                  panchangam and your chart signals. The caution window is the period
                  to approach carefully — not to fear, but to be aware of.
                </p>
              </div>
            </div>

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">Why this is more than a one-time tool</h2>
              <div className="cl-pub-section__body">
                <p>
                  The daily reading changes every day because the transits, panchangam,
                  and dasha context change every day. Dasha periods shift over months
                  and years. Transits move over weeks and months. The panchangam shifts
                  daily. Vinaadi integrates all of these together so you always have a
                  current reading — not a static snapshot.
                </p>
                <p>
                  This is what separates Vinaadi from a birth chart generator. A chart
                  tells you the structure of your birth moment. Daily guidance tells you
                  how that structure interacts with today&apos;s sky.
                </p>
              </div>
            </div>

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">Frequently asked questions</h2>
              <div className="cl-pub-faq">
                {[
                  { q: "What is Chandrashtama, and how does Vinaadi handle it?", a: "Chandrashtama is the period when the transiting Moon passes through the 8th sign from your natal Moon rasi. It is associated with increased caution in Tamil astrology. Vinaadi identifies Chandrashtama days, names them clearly, and includes them in the daily score — without amplifying anxiety or using fear language." },
                  { q: "Which dasha system does Vinaadi use?", a: "Vimshottari Dasha — the 120-year planetary period system tied to the birth nakshatra. Vinaadi tracks the main period (dasha), sub-period (bhukti), and sub-sub-period (antara)." },
                  { q: "Does the daily score account for my birth time accuracy?", a: "Yes. If your birth time is uncertain, Vinaadi has a birth time rectification tool to help refine it. A more accurate birth time improves lagna calculation and dasha start precision." },
                  { q: "Can I see readings for past or future days?", a: "Yes. The dashboard includes a 7-day strip and the ability to navigate to any date to see the reading for that day." },
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
                <Link href="/features/family-planning" className="cl-pub-related-link">Family Planning →</Link>
                <Link href="/features/timing-and-decisions" className="cl-pub-related-link">Timing and Decisions →</Link>
                <Link href="/learn/what-is-chandrashtama" className="cl-pub-related-link">What is Chandrashtama? →</Link>
                <Link href="/trust/methodology" className="cl-pub-related-link">Our Methodology →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Start with today&apos;s reading</h2>
              <p className="cl-cta-strip__body">Free during early access. Chart, daily guidance, family vault.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
