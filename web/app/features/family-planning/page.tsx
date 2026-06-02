import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Family Planning — Vinaadi Tamil Astrology Assistant",
  description:
    "Plan for yourself and the people you share life with. Vinaadi's family vault lets you compare daily readings, find shared timing windows, and use porutham together.",
  alternates: { canonical: "https://vinaadi.com/features/family-planning" },
};


export default function FamilyPlanningPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">Feature · Family Planning</p>
              <h1 className="cl-pub-h1">
                Plan for yourself, or for the people you share life with.
              </h1>
              <p className="cl-pub-lead">
                Most astrology products stop at individual readings. Vinaadi is
                built for the way Tamil families actually use astrology — together.
                Add family members, compare readings, and find the timing that
                works for everyone.
              </p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">Set up family vault →</Link>
                <Link href="/features/daily-guidance" className="cl-btn cl-btn--ghost">How daily guidance works</Link>
              </div>
            </div>

            <div className="cl-pub-preview">
              <p className="cl-pub-preview__label">Family Today · Sample</p>
              <p className="cl-pub-preview__title">Best combined window: 11:53 – 12:41</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                {[
                  { name: "Arjun", score: 64, band: "mid" },
                  { name: "Priya", score: 81, band: "high" },
                  { name: "Kavitha", score: 47, band: "low" },
                ].map((m) => (
                  <div key={m.name} className="cl-score-row">
                    <span className="cl-score-row__name">{m.name}</span>
                    <div className="cl-score-bar-wrap">
                      <div className={`cl-score-bar cl-score-bar--${m.band}`} style={{ width: `${m.score}%` }} />
                    </div>
                    <span className={`cl-score-num cl-score-num--${m.band}`}>{m.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="cl-pub-body">
          <div className="cl-container">

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">The family vault</h2>
              <div className="cl-pub-two-col">
                <div className="cl-pub-section__body">
                  <p>
                    The family vault is a shared workspace where you can add multiple
                    birth profiles — for yourself, your partner, children, parents, or
                    any family members you plan with. Each profile gets its own full
                    Thirukanitham-based reading.
                  </p>
                  <p>
                    On the dashboard, you can see everyone&apos;s daily score at a
                    glance, the best combined window for the household, and individual
                    readings when you need them.
                  </p>
                </div>
                <ul className="cl-pub-detail-list">
                  {[
                    { title: "Multiple birth profiles", body: "Add profiles for each family member. Each gets a full chart, dasha, transit, and panchangam reading." },
                    { title: "Shared timing view", body: "See everyone's daily score side by side and find the window that works for the whole group." },
                    { title: "Porutham integration", body: "Check compatibility between any two family members directly from the vault." },
                    { title: "Individual deep-dives", body: "Switch to any family member's reading for the full detail — chart, dasha, transits, best windows." },
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
              <h2 className="cl-pub-section__head">Why family planning matters in Tamil astrology</h2>
              <div className="cl-pub-section__body">
                <p>
                  Tamil Jyotish has always been a family practice. Muhurtha
                  (auspicious timing selection) for marriages, housewarmings, naming
                  ceremonies, and business launches traditionally requires reading
                  multiple family members&apos; charts together — not just one person&apos;s.
                </p>
                <p>
                  Vinaadi brings this multi-member approach into a modern daily
                  planning tool. You don&apos;t have to manually compare charts or
                  remember who is in which dasha period. The assistant does it for you.
                </p>
              </div>
            </div>

            <div className="cl-pub-section">
              <h2 className="cl-pub-section__head">Frequently asked questions</h2>
              <div className="cl-pub-faq">
                {[
                  { q: "How many family members can I add?", a: "Vinaadi supports multiple family profiles. The exact limit may vary during early access, but the intent is to support a full household." },
                  { q: "Can I check porutham between family members?", a: "Yes. The Porutham tool inside the dashboard can match any two members of your family vault for full 10-porutham compatibility." },
                  { q: "Is each family member's data private?", a: "Family profiles are stored under your account. They are not visible to other users. See the privacy policy for full details." },
                  { q: "What if a family member's birth time is uncertain?", a: "Vinaadi has a birth time rectification tool. A rough birth time still gives useful rasi, dasha, and transit readings even if lagna accuracy is lower." },
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
                <Link href="/tools/marriage-porutham-calculator" className="cl-pub-related-link">Porutham Calculator →</Link>
                <Link href="/features/timing-and-decisions" className="cl-pub-related-link">Timing and Decisions →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Plan together</h2>
              <p className="cl-cta-strip__body">Add family members and find your shared best window.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
