import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Chart Guidance — Vinaadi Tamil Astrology Assistant",
  description:
    "Understand your Thirukanitham jadhagam — lagna, planets, dasha lord, yogas, and doshas — in the context of your current dasha and today's transits.",
  alternates: { canonical: "https://vinaadi.com/features/chart-guidance" },
  openGraph: {
    title: "Chart Guidance - Vinaadi Tamil Astrology Assistant",
    description:
      "Understand your Thirukanitham jadhagam - lagna, planets, dasha lord, yogas, and doshas in the context of your current dasha and today's transits.",
    url: "https://vinaadi.com/features/chart-guidance",
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
    title: "Chart Guidance - Vinaadi Tamil Astrology Assistant",
    description:
      "Understand your Thirukanitham jadhagam - lagna, planets, dasha lord, yogas, and doshas in the context of your current dasha and today's transits.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};


export default function ChartGuidancePage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        {/* HERO */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Feature · Chart Guidance</p>
              <h1 className="cl-pub-h1">Your jadhagam, explained.</h1>
              <p className="cl-pub-lead">
                A birth chart is more useful when it is interpreted in context —
                not just as a static set of placements, but as a map that interacts
                with your current dasha period and today&apos;s transits.
                Vinaadi does this for you, in plain language.
              </p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">View your chart →</Link>
                <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--ghost">Generate jadhagam</Link>
              </div>
            </div>

            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">Chart Summary · Sample</p>
              <div className="cl-hero-figure__art">
                <svg viewBox="0 0 240 240" role="img" aria-label="South Indian square chart">
                  <rect x="1" y="1" width="238" height="238" rx="6" fill="var(--cl-surface-2)" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <g className="clf-grid-line">
                    <line x1="60" y1="1" x2="60" y2="239" /><line x1="120" y1="1" x2="120" y2="239" /><line x1="180" y1="1" x2="180" y2="239" />
                    <line x1="1" y1="60" x2="239" y2="60" /><line x1="1" y1="120" x2="239" y2="120" /><line x1="1" y1="180" x2="239" y2="180" />
                  </g>
                  <rect x="60" y="60" width="120" height="120" fill="var(--cl-surface)" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <text x="120" y="116" textAnchor="middle" fontFamily="var(--cl-font-display)" fontSize="15" fill="var(--cl-ink)">Rasi</text>
                  <text x="120" y="134" textAnchor="middle" className="clf-cell-label" letterSpacing="1">D1 · SOUTH INDIAN</text>
                  <rect x="60" y="0" width="60" height="60" className="clf-cell-lag" />
                  <text x="66" y="15" className="clf-cell-label clf-accent-fill">Lag</text>
                  <text x="113" y="53" textAnchor="end" className="clf-cell-label clf-ink">Su</text>
                  <circle cx="210" cy="150" r="3" className="clf-accent-fill" />
                  <text x="186" y="214" className="clf-cell-label clf-ink">Ch · Kettai</text>
                  <text x="6" y="135" className="clf-cell-label clf-ink">Sa</text>
                </svg>
              </div>
              <p className="cl-hero-figure__title">Kadagam Lagna · Moon Dasa</p>
              <p className="cl-hero-figure__note">Moon as lagna lord is in Viruchigam (5th house) — Kettai nakshatra. Current Moon dasa activates the 5th house themes. Saturn transiting Kumbam aspects lagna from the 8th.</p>
            </div>
          </div>
        </section>

        {/* BAND 1 — What chart guidance covers */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">Overview</p>
              <h2 className="cl-section-h2">What chart guidance covers</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>Vinaadi&apos;s chart guidance is not just a display of planet positions. It explains what your chart means in the context of where you are now — your current dasha period, the active bhukti lord, and how transiting planets interact with your natal placements.</p>
                <p>This is the difference between reading a map and understanding where you are on that map.</p>
              </div>
              <ul className="cl-pub-detail-list">
                {[
                  { title: "Lagna and house lords", body: "Your ascendant sign, the lord of each house, and which houses are activated by your current dasha." },
                  { title: "Planet placements and strengths", body: "Which planets are well-placed, which are in difficult positions, and how that interacts with your dasha sequence." },
                  { title: "Yogas and doshas", body: "Key yogas (auspicious combinations) and doshas — Sevvai, Kala Sarpa, Kemadruma — explained transparently without exaggeration." },
                  { title: "D9 Navamsa", body: "The divisional chart that gives deeper insight into relationships, dharma, and the second half of life." },
                ].map((item) => (
                  <li key={item.title} className="cl-pub-detail-item">
                    <p className="cl-pub-detail-item__title">{item.title}</p>
                    <p className="cl-pub-detail-item__body">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* BAND 2 — The assistant model (with callout) */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">The assistant model</p>
              <h2 className="cl-section-h2">Chart guidance is not just a chart generator</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>Many tools will display your birth chart. Vinaadi goes further — it connects your natal placements to the current moment. Your dasha lord activates specific houses and planets. Saturn in transit may be aspecting your natal Moon. The Moon may be in Chandrashtama. Vinaadi reads all of these together and translates them into practical guidance.</p>
              </div>
              <div className="cl-callout">
                <p>The chart is the foundation, but the reading is what changes every day.</p>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 3 — FAQ + related */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">Questions</p>
              <h2 className="cl-section-h2">Frequently asked questions</h2>
            </div>
            <div className="cl-pub-faq" style={{ maxWidth: "860px" }}>
              {[
                { q: "Which chart format does Vinaadi use?", a: "South Indian square-chart format — the traditional Tamil Jyotish layout. D1 Rasi chart and D9 Navamsa are both generated." },
                { q: "What ayanamsa is used?", a: "Lahiri ayanamsa — the government-recognised sidereal standard used by traditional Tamil and North Indian Jyotish practitioners." },
                { q: "Does Vinaadi explain yogas and doshas in detail?", a: "Yes. Key yogas and doshas are identified and explained — with their basis and what they mean in your current dasha context. We do not use fear language or amplify negative placements." },
                { q: "Can I print or export my jadhagam?", a: "Chart export is on the roadmap. You can view the full chart in the dashboard. Print support is coming." },
              ].map((item) => (
                <div key={item.q} className="cl-pub-faq-item">
                  <p className="cl-pub-faq-item__q">{item.q}</p>
                  <p className="cl-pub-faq-item__a">{item.a}</p>
                </div>
              ))}
            </div>
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">Related</p>
              <div className="cl-pub-related-links">
                <Link href="/tools/jadhagam-generator" className="cl-pub-related-link">Jadhagam Generator →</Link>
                <Link href="/learn/how-to-read-a-jadhagam" className="cl-pub-related-link">How to read a Jadhagam →</Link>
                <Link href="/learn/why-birth-time-matters" className="cl-pub-related-link">Why birth time matters →</Link>
                <Link href="/trust/methodology" className="cl-pub-related-link">Our Methodology →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Understand your chart in context</h2>
              <p className="cl-cta-strip__body">Add your birth details and see what your jadhagam means today.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
