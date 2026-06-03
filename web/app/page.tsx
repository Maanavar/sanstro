import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Vinaadi — Tamil Astrology Assistant for Daily Guidance & Planning",
  description:
    "Your Tamil astrology assistant for daily guidance, timing, family planning, and clarity. Powered by Thirukanitham — precise, calm, and built for real decisions.",
  openGraph: {
    title: "Vinaadi — Tamil Astrology Assistant for Daily Guidance & Planning",
    description:
      "Thirukanitham-based Tamil astrology for daily guidance, porutham, jadhagam, and family planning.",
    url: "https://vinaadi.com",
    images: [
      {
        url: "/brand/vinaadi-wordmark-color.png",
        width: 1792,
        height: 612,
        alt: "Vinaadi - Your Cosmic Copilot",
      },
    ],
  },
  alternates: {
    canonical: "https://vinaadi.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vinaadi — Tamil Astrology Assistant for Daily Guidance & Planning",
    description:
      "Thirukanitham-based Tamil astrology for daily guidance, porutham, jadhagam, and family planning.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};

/* ── Static sample data powering the preview card ── */
const SAMPLE = {
  dayLabel: "Tuesday, 26 May",
  score: 64,
  summary: "Moon Dasa · Moon Bhukti. Saturn refines home and inner stability. A measured day — good for steady work, cautious for new ventures.",
  bestWindow: { start: "11:53", end: "12:41" },
  holdWindow: { start: "15:28", end: "17:03" },
  lagna: "Kadagam",
  nakshatra: "Kettai",
  rasi: "Viruchigam",
  dasha: "Moon Dasa · Moon Bhukti",
  transit: "Saturn in Kumbam · Jupiter in Mesham",
  panchangam: "Ekadasi · Kettai · Vishkambha",
};

const ARC_HOURS = ["6a", "9a", "12p", "3p", "6p"];

export default function HomePage() {
  return (
    <div className="clarity-shell">

      <PublicNav />

      <main>

        {/* ══════════════════════════════════════════════
            SECTION 1 — Hero: Assistant story
        ══════════════════════════════════════════════ */}
        <section className="cl-hero" id="top">
          <div className="cl-hero__inner">

            <div className="cl-hero__copy">
              <p className="cl-eyebrow">Tamil Astrology Assistant</p>
              <h1 className="cl-hero__h1">
                One calm guide for your chart, your day, and the people you plan with.
              </h1>
              <p className="cl-hero__body">
                Vinaadi turns Thirukanitham-based astrology into daily guidance,
                timing windows, family planning, and tools you can actually use —
                every morning, in plain language.
              </p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">
                  Start with today&apos;s guidance →
                </Link>
                <a href="#how-it-works" className="cl-btn cl-btn--ghost">
                  See how it works
                </a>
              </div>
            </div>

            {/* Today's reading preview card */}
            <div className="cl-hero__card-wrap" id="sample">
              <span className="cl-sticker">Today&apos;s Reading</span>

              <div className="cl-reading-card">
                <div className="cl-card-head">
                  <div>
                    <p className="cl-card-date">{SAMPLE.dayLabel}</p>
                    <h2 className="cl-card-title">Your day</h2>
                  </div>
                  <div className="cl-dial" aria-label={`Day score ${SAMPLE.score}`}>
                    <svg className="cl-dial__svg" viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--cl-border)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none" stroke="var(--cl-ink)" strokeWidth="6"
                        strokeDasharray={`${(SAMPLE.score / 100) * 213.6} 213.6`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="cl-dial__num">{SAMPLE.score}</div>
                  </div>
                </div>

                <p className="cl-card-summary">{SAMPLE.summary}</p>

                <div className="cl-arc-wrap" aria-hidden="true">
                  <svg viewBox="0 0 320 110" className="cl-arc__svg" preserveAspectRatio="xMidYMid meet">
                    <path d="M20,82 Q160,18 300,82" fill="none" stroke="#D4C8AE" strokeWidth="1.5" strokeLinecap="round" />
                    <rect x="20" y="79" width="280" height="5" rx="2.5" fill="#E4DBC8" />
                    <rect x="157" y="78" width="19" height="7" rx="3.5" fill="#5C7654" />
                    <rect x="241" y="78" width="37" height="7" rx="3.5" fill="#A8482F" />
                    {[20, 90, 160, 230, 300].map((x) => (
                      <line key={x} x1={x} y1="86" x2={x} y2="93" stroke="#A89D89" strokeWidth="1.5" strokeLinecap="round" />
                    ))}
                    <circle cx="164" cy="50" r="6" fill="#B85A2C" />
                  </svg>
                  <div className="cl-arc-labels">
                    {ARC_HOURS.map((h) => (
                      <span key={h} className="cl-arc-label">{h}</span>
                    ))}
                  </div>
                </div>

                <div className="cl-window-row">
                  <div className="cl-window cl-window--best">
                    <p className="cl-window__label">Best Window</p>
                    <p className="cl-window__time">{SAMPLE.bestWindow.start} – {SAMPLE.bestWindow.end}</p>
                  </div>
                  <div className="cl-window cl-window--hold">
                    <p className="cl-window__label">Hold</p>
                    <p className="cl-window__time">{SAMPLE.holdWindow.start} – {SAMPLE.holdWindow.end}</p>
                  </div>
                </div>

                <div className="cl-card-foot">
                  <span className="cl-card-foot__meta">{SAMPLE.lagna} · {SAMPLE.nakshatra} · {SAMPLE.rasi}</span>
                  <span className="cl-card-foot__badge">D1 · D9 ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 2 — What Vinaadi Helps You Do
        ══════════════════════════════════════════════ */}
        <section className="cl-helps">
          <div className="cl-container">
            <div className="cl-helps__head">
              <p className="cl-eyebrow">What Vinaadi does</p>
              <h2 className="cl-section-h2">Guidance for the moments people actually need help with</h2>
            </div>
            <div className="cl-helps-grid">
              {[
                { icon: "◎", title: "Understand today", body: "One daily score combining your chart, dasha period, transits, and panchangam. Clear reasoning, no guesswork." },
                { icon: "⊕", title: "Plan important actions", body: "Best and caution windows calculated from your natal chart and the day's signals — practical, not vague." },
                { icon: "☽", title: "Read family timing together", body: "See your reading alongside the people you plan with. Shared best-window view for family decisions." },
                { icon: "◈", title: "Understand chart patterns", body: "Your lagna, dasha lord, transiting planets, yogas, and doshas — explained in plain language, not jargon." },
                { icon: "✦", title: "Check compatibility when needed", body: "Porutham matching with all 10 poruthams, Rajju dosha, Sevvai dosham, and Nadi dosha — full Tamil standard." },
                { icon: "⊛", title: "Use tools when you need them", body: "Jadhagam generation, panchangam planner, birth time rectification — part of the assistant, not separate apps." },
              ].map((item) => (
                <div key={item.title} className="cl-helps-card">
                  <span className="cl-helps-card__icon">{item.icon}</span>
                  <h3 className="cl-helps-card__title">{item.title}</h3>
                  <p className="cl-helps-card__body">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 3 — Daily Guidance Story
        ══════════════════════════════════════════════ */}
        <section className="cl-daily" id="how-it-works">
          <div className="cl-container cl-daily__inner">
            <div className="cl-daily__copy">
              <p className="cl-eyebrow">Daily Guidance</p>
              <h2 className="cl-section-h2">Every day starts with one quiet reading</h2>
              <p className="cl-section-body">
                Vinaadi reads your chart, dasha, transits, and panchangam together —
                and gives you one balanced answer for the day. Not four separate
                reports. One reading.
              </p>
              <ul className="cl-daily__signal-list">
                {[
                  "Dasha and bhukti period quality — how your current planetary cycle frames the day",
                  "Gochar transits — what Saturn, Jupiter, Rahu, Ketu, and others are doing to your natal chart",
                  "Panchangam quality — Tithi, Vara, Nakshatra, Yoga, Karana for the day",
                  "Best window and caution window — specific times, not vague ranges",
                  "Chandrashtama tracking when relevant — named clearly, not dramatised",
                ].map((s) => (
                  <li key={s} className="cl-daily__signal">
                    <span className="cl-daily__signal-dot" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
              <Link href="/features/daily-guidance" className="cl-btn cl-btn--ghost">
                How daily guidance works →
              </Link>
            </div>

            {/* Daily guidance sample card */}
            <div className="cl-daily-card">
              <div className="cl-daily-card__head">
                <p className="cl-daily-card__label">Daily Reading · Sample</p>
                <span className="cl-daily-card__score">{SAMPLE.score}</span>
              </div>
              <div className="cl-daily-card__windows">
                <div className="cl-daily-card__win cl-daily-card__win--best">
                  <p className="cl-daily-card__win-label">Best Window</p>
                  <p className="cl-daily-card__win-time">{SAMPLE.bestWindow.start} – {SAMPLE.bestWindow.end}</p>
                </div>
                <div className="cl-daily-card__win cl-daily-card__win--hold">
                  <p className="cl-daily-card__win-label">Caution</p>
                  <p className="cl-daily-card__win-time">{SAMPLE.holdWindow.start} – {SAMPLE.holdWindow.end}</p>
                </div>
              </div>
              <p className="cl-daily-card__summary">{SAMPLE.summary}</p>
              <div className="cl-daily-card__signals">
                {[SAMPLE.dasha, SAMPLE.transit, SAMPLE.panchangam].map((chip) => (
                  <span key={chip} className="cl-daily-card__chip">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 4 — Family Planning Story
        ══════════════════════════════════════════════ */}
        <section className="cl-balance" id="family">
          <div className="cl-container cl-balance__inner">
            <div className="cl-balance__copy">
              <p className="cl-eyebrow">Family Planning</p>
              <h2 className="cl-section-h2">
                Plan for yourself, or for the people you share life with.
              </h2>
              <p className="cl-section-body">
                Most astrology products stop at individual readings. Vinaadi is
                built for the way Tamil families actually use astrology — together.
                Add family members, see everyone&apos;s reading side by side, and
                find the windows that work for the whole household.
              </p>
              <ul className="cl-check-list">
                {[
                  "Family vault with individual birth profiles for each member",
                  "Shared best-window view — plan important events for everyone",
                  "Porutham compatibility when making family decisions",
                  "Dasha comparisons across family members",
                ].map((item) => (
                  <li key={item} className="cl-check-list__item">
                    <span className="cl-check-list__dot" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/features/family-planning" className="cl-btn cl-btn--ghost cl-balance-cta">
                Family planning feature →
              </Link>
            </div>

            <div className="cl-score-panel">
              <p className="cl-score-panel__label">Your family today</p>
              {[
                { name: "Arjun", score: 64, band: "mid" },
                { name: "Priya", score: 81, band: "high" },
                { name: "Kavitha", score: 47, band: "low" },
              ].map((m, idx) => (
                <div key={`${m.name}-${idx}`} className="cl-score-row">
                  <span className="cl-score-row__name">{m.name}</span>
                  <div className="cl-score-bar-wrap">
                    <div className={`cl-score-bar cl-score-bar--${m.band}`} style={{ width: `${m.score}%` }} />
                  </div>
                  <span className={`cl-score-num cl-score-num--${m.band}`}>{m.score}</span>
                </div>
              ))}
              <p className="cl-score-panel__foot">Best combined window: 11:53 – 12:41</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 5 — Tools Inside the Assistant
        ══════════════════════════════════════════════ */}
        <section className="cl-tools-preview">
          <div className="cl-container">
            <div className="cl-tools-preview__head">
              <p className="cl-eyebrow">Tools</p>
              <h2 className="cl-section-h2">When you need a tool, it&apos;s already part of the guide</h2>
            </div>
            <p className="cl-tools-preview__sub">
              Vinaadi includes powerful tools — not as separate apps, but as
              extensions of the same assistant. Use them when you need them.
            </p>
            <div className="cl-tools-grid">
              {[
                {
                  icon: "⊕",
                  name: "Marriage Porutham",
                  desc: "Full 10-porutham compatibility analysis using the Tamil standard — Rajju, Vedha, Nadi, Sevvai dosham, and all kuta checks.",
                  href: "/tools/marriage-porutham-calculator",
                  cta: "Porutham calculator →",
                },
                {
                  icon: "◈",
                  name: "Jadhagam Generator",
                  desc: "South Indian birth chart in Thirukanitham format — D1 Rasi chart and D9 Navamsa, with Lahiri ayanamsa precision.",
                  href: "/tools/jadhagam-generator",
                  cta: "Generate jadhagam →",
                },
                {
                  icon: "☽",
                  name: "Daily Panchangam Planner",
                  desc: "Tithi, Vara, Nakshatra, Yoga, Karana — plus Rahu Kalam, Yamagandam, and auspicious timings for any day.",
                  href: "/tools/daily-panchangam-planner",
                  cta: "Panchangam planner →",
                },
                {
                  icon: "◎",
                  name: "Birth Time Rectification",
                  desc: "Refine an uncertain birth time using life events and the Thirukanitham calculation method for more accurate readings.",
                  href: "/tools/birth-time-rectification",
                  cta: "Rectification tool →",
                },
              ].map((tool) => (
                <Link key={tool.name} href={tool.href} className="cl-tool-card">
                  <span className="cl-tool-card__icon">{tool.icon}</span>
                  <h3 className="cl-tool-card__name">{tool.name}</h3>
                  <p className="cl-tool-card__desc">{tool.desc}</p>
                  <span className="cl-tool-card__link">{tool.cta}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 6 — How It Works
        ══════════════════════════════════════════════ */}
        <section className="cl-how">
          <div className="cl-container">
            <div className="cl-how__head">
              <p className="cl-eyebrow">How it works</p>
              <h2 className="cl-section-h2">Traditional inputs. Clear output. Modern guidance.</h2>
            </div>
            <div className="cl-how-steps">
              {[
                {
                  num: "01",
                  title: "Add your birth details",
                  body: "Date, time, and place of birth. Vinaadi uses this to compute your precise Thirukanitham jadhagam — lagna, nakshatras, rasi, dasha period.",
                },
                {
                  num: "02",
                  title: "Vinaadi reads chart, dasha, transits, and panchangam together",
                  body: "Every day, the assistant combines your natal chart analysis with current dasha period, gochar transits, and the day&apos;s panchangam into one reading.",
                },
                {
                  num: "03",
                  title: "Get one balanced answer",
                  body: "A daily score, a best window, a caution window, and a brief interpretation. For decisions, tools, or family context — it&apos;s all in the same place.",
                },
              ].map((step) => (
                <div key={step.num} className="cl-how-step">
                  <span className="cl-how-step__num">{step.num}</span>
                  <h3 className="cl-how-step__title">{step.title}</h3>
                  <p className="cl-how-step__body">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 7 — Method and Trust
        ══════════════════════════════════════════════ */}
        <section className="cl-method">
          <div className="cl-container cl-method__inner">
            <div className="cl-method__copy">
              <p className="cl-eyebrow">Method &amp; Trust</p>
              <h2 className="cl-section-h2">Built on method, not vague astrology language</h2>
              <p className="cl-section-body">
                Vinaadi is designed to be transparent about how it works.
                Every reading shows the reasoning behind it. Every signal
                is sourced from a specific astrological input.
              </p>
              <div className="cl-method-items">
                {[
                  { title: "Thirukanitham", body: "The Tamil astronomical calculation standard — precise planet positions, traditional South Indian methodology." },
                  { title: "Lahiri ayanamsa", body: "India's government-recognized sidereal ayanamsa standard. The same used by traditional Tamil Jyotish practitioners." },
                  { title: "Drik ephemeris precision", body: "High-accuracy astronomical data — the same source used in modern Tamil panchang publications." },
                  { title: "Multi-signal daily score", body: "Dasha + transit + panchangam + Moon nakshatra combined into one reading. Not a single-factor verdict." },
                  { title: "Calm interpretation", body: "No fear language. No doom predictions. Vinaadi frames astrology as a planning tool, not a fatalistic oracle." },
                ].map((item) => (
                  <div key={item.title} className="cl-method-item">
                    <h3 className="cl-method-item__title">{item.title}</h3>
                    <p className="cl-method-item__body">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="cl-method-panel">
              <p className="cl-method-panel__title">
                Vinaadi is designed to help users interpret astrology thoughtfully, not fearfully.
              </p>
              <p className="cl-method-panel__body">
                Jyotish is a traditional belief system with deep roots in Tamil
                culture. We approach it with respect for that tradition while
                communicating clearly and calmly. Every verdict includes the
                reasoning. Your data is never sold or shared.
              </p>
              <Link href="/trust/methodology" className="cl-method-panel__link">
                Full methodology →
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 8 — Feature Links Hub
        ══════════════════════════════════════════════ */}
        <section className="cl-feature-hub">
          <div className="cl-container">
            <div className="cl-feature-hub__head">
              <p className="cl-eyebrow">Features</p>
              <h2 className="cl-section-h2">Explore the ways Vinaadi can guide you</h2>
            </div>
            <div className="cl-feature-hub-grid">
              {[
                {
                  eyebrow: "Feature",
                  title: "Daily Guidance",
                  body: "One daily reading combining chart, dasha, transits, and panchangam. Your best window, caution window, and day tone.",
                  href: "/features/daily-guidance",
                },
                {
                  eyebrow: "Feature",
                  title: "Family Planning",
                  body: "Add family members, compare readings, and find the timing windows that work for the whole household.",
                  href: "/features/family-planning",
                },
                {
                  eyebrow: "Feature",
                  title: "Chart Guidance",
                  body: "Understand your jadhagam — lagna, planets, yogas, doshas, and what they mean in the context of your current dasha.",
                  href: "/features/chart-guidance",
                },
                {
                  eyebrow: "Feature",
                  title: "Timing and Decisions",
                  body: "Plan important actions — ceremonies, travel, business, health — with astrological timing grounded in Thirukanitham.",
                  href: "/features/timing-and-decisions",
                },
                {
                  eyebrow: "Tool",
                  title: "Porutham Calculator",
                  body: "Full 10-porutham marriage matching using the Tamil standard. Rajju, Vedha, Nadi, Sevvai — clearly explained.",
                  href: "/tools/marriage-porutham-calculator",
                },
                {
                  eyebrow: "Method",
                  title: "Our Methodology",
                  body: "How Vinaadi calculates — Thirukanitham, Lahiri ayanamsa, Drik ephemeris, multi-signal daily score.",
                  href: "/trust/methodology",
                },
              ].map((card) => (
                <Link key={card.title} href={card.href} className="cl-fhub-card">
                  <p className="cl-fhub-card__eyebrow">{card.eyebrow}</p>
                  <h3 className="cl-fhub-card__title">{card.title}</h3>
                  <p className="cl-fhub-card__body">{card.body}</p>
                  <span className="cl-fhub-card__arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 9 — Learn Links
        ══════════════════════════════════════════════ */}
        <section className="cl-learn-strip">
          <div className="cl-container">
            <div className="cl-learn-strip__head">
              <p className="cl-eyebrow">Learn</p>
              <h2 className="cl-section-h2">Learn the ideas behind the guidance</h2>
            </div>
            <div className="cl-learn-links">
              {[
                { label: "What is Porutham?", href: "/learn/what-is-porutham" },
                { label: "What is Thirukanitham?", href: "/learn/what-is-thirukanitham" },
                { label: "What is Chandrashtama?", href: "/learn/what-is-chandrashtama" },
                { label: "How to read a Jadhagam", href: "/learn/how-to-read-a-jadhagam" },
                { label: "Why birth time matters", href: "/learn/why-birth-time-matters" },
              ].map((pill) => (
                <Link key={pill.href} href={pill.href} className="cl-learn-pill">
                  {pill.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 10 — Commitment strip
        ══════════════════════════════════════════════ */}
        <section className="cl-commit" id="commitment">
          <div className="cl-container cl-commit__inner">
            <p className="cl-eyebrow cl-commit-eyebrow">Our commitment</p>
            <h2 className="cl-section-h2 cl-commit-title">
              <em>Calm language</em>, no fear.
            </h2>
            <div className="cl-commit-grid">
              {[
                { icon: "✓", text: "No doom language or guaranteed bad predictions" },
                { icon: "✓", text: "Every verdict shows the reasoning behind it" },
                { icon: "✓", text: "Your data stays on our servers — never sold" },
                { icon: "✓", text: "Jyotish is tradition, not science — we say so clearly" },
              ].map((item) => (
                <div key={item.text} className="cl-commit-item">
                  <span className="cl-commit-item__icon">{item.icon}</span>
                  <p className="cl-commit-item__text">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 11 — Final CTA
        ══════════════════════════════════════════════ */}
        <section className="cl-pricing" id="pricing">
          <div className="cl-container cl-pricing__inner">
            <p className="cl-eyebrow">Early access</p>
            <h2 className="cl-section-h2 cl-pricing__title">
              Start with one reading. Stay for the clarity.
            </h2>
            <p className="cl-section-body cl-pricing__body">
              Full access — chart, daily guidance, family vault, all tools —
              at no cost during early access.
            </p>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">
              Get started free →
            </Link>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}
