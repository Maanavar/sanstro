import Link from "next/link";
import Image from "next/image";

const highlights = [
  "Daily guidance with calm, non-fearful language",
  "Personal chart, Dasha, transit, and Panchangam in one workspace",
  "Family vaults with shared windows and decision support",
];

const features = [
  {
    icon: "◎",
    title: "Thirukanitham accuracy",
    body: "Lahiri ayanamsa, Drik-based ephemeris, inclusive house counting — the same precision used by traditional Tamil astrologers.",
  },
  {
    icon: "☽",
    title: "Daily & transit guidance",
    body: "Vimshottari Dasha, Gochar positions, and Panchangam timing windows delivered every day in plain language.",
  },
  {
    icon: "⊕",
    title: "Family vault",
    body: "Group family members' charts in one shared workspace. See everyone's fortune score and combined best windows at a glance.",
  },
  {
    icon: "✦",
    title: "Yoga & Dosham clarity",
    body: "Sevvai Dosham, Kala Sarpa, and Yogas explained transparently — with the reasoning shown, not just a verdict.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── Site header ──────────────────────────────────────── */}
      <header className="site-header">
        <div className="site-header__inner">
          <Link href="/" className="site-header__brand">
            <Image
              src="/brand/vinaadi-wordmark-color-transparent.png"
              alt="Vinaadi"
              width={1764}
              height={619}
              className="site-header__wordmark"
              priority
            />
          </Link>
          <nav className="site-header__nav" aria-label="Primary navigation">
            <Link href="#what-you-get" className="site-header__link">Features</Link>
            <Link href="/dashboard" className="button button--solid site-header__cta">
              Open dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="landing">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero__glow" aria-hidden="true" />
          <div className="hero__inner">
            <div className="hero__copy">
              <p className="eyebrow">Thirukanitham · Tamil astrology</p>
              <h1>Calm astrology for today, and for the people you plan with.</h1>
              <p className="lede">
                Thirukanitham-based daily guidance, chart context, and family fortune
                views in one responsive workspace.
              </p>
              <div className="hero__actions">
                <Link className="button button--solid" href="/dashboard">
                  Open dashboard
                </Link>
                <a className="button button--ghost" href="#what-you-get">
                  See what ships
                </a>
              </div>
            </div>

            <aside className="hero__aside">
              <p className="hero__asideLabel">What's included</p>
              <ul className="hero__list">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="hero__asideFootnote">
                Built to keep the reading calm, practical, and easy to scan on mobile.
              </p>
            </aside>
          </div>
        </section>

        {/* ── Feature grid ─────────────────────────────────────── */}
        <section id="what-you-get" className="features-section">
          <div className="container">
            <p className="section-kicker">Workspace preview</p>
            <h2 className="section-title" style={{ marginBottom: "12px" }}>
              One interface for personal and family planning.
            </h2>
            <p className="section-description" style={{ marginBottom: "40px" }}>
              The dashboard combines onboarding, chart output, daily guidance, transit
              cues, and family aggregate fortune without burying the user in chrome.
            </p>
            <div className="features-grid">
              {features.map((f) => (
                <div key={f.title} className="feature-card">
                  <span className="feature-card__icon">{f.icon}</span>
                  <h3 className="feature-card__title">{f.title}</h3>
                  <p className="feature-card__body">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA strip ────────────────────────────────────────── */}
        <section className="cta-strip">
          <div className="container cta-strip__inner">
            <div>
              <h2 className="cta-strip__title">Ready to start?</h2>
              <p className="cta-strip__sub">Your chart, daily guidance, and family vault — all in one place.</p>
            </div>
            <Link href="/dashboard" className="button button--solid">
              Open dashboard →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Site footer ──────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div className="site-footer__brand">
            <Image
              src="/brand/vinaadi-wordmark-color-transparent.png"
              alt="Vinaadi"
              width={1764}
              height={619}
              className="site-footer__wordmark"
            />
            <p className="site-footer__tagline">
              Thirukanitham-based Tamil astrology for daily life and family planning.
            </p>
          </div>

          <div className="site-footer__links">
            <div className="site-footer__col">
              <p className="site-footer__col-heading">Product</p>
              <Link href="/dashboard" className="site-footer__link">Dashboard</Link>
              <Link href="#what-you-get" className="site-footer__link">Features</Link>
            </div>
            <div className="site-footer__col">
              <p className="site-footer__col-heading">Legal</p>
              <a href="#" className="site-footer__link">Privacy policy</a>
              <a href="#" className="site-footer__link">Terms of service</a>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <div className="container site-footer__bottom-inner">
            <p className="site-footer__disclaimer">
              Vinaadi provides Jyotish-based guidance. Astrology is a traditional belief system, not a science.
              For medical, legal, or financial decisions, consult a qualified professional.
            </p>
            <p className="site-footer__copy">
              © {new Date().getFullYear()} Vinaadi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
