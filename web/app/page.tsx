import Link from "next/link";

const highlights = [
  "Daily guidance with calm, non-fearful language",
  "Personal chart, Dasha, transit, and Panchangam in one workspace",
  "Family vaults with shared windows and decision support",
];

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <div className="hero__inner">
          <div className="hero__copy">
            <p className="eyebrow">Jothidam.AI</p>
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
            <p className="hero__asideLabel">MVP 1 coverage</p>
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

      <section id="what-you-get" className="intro">
        <div className="container intro__grid">
          <div>
            <p className="section-kicker">Workspace preview</p>
            <h2>One interface for personal and family planning.</h2>
          </div>
          <p className="intro__lead">
            The dashboard combines onboarding, chart output, daily guidance, transit
            cues, and family aggregate fortune without burying the user in chrome.
          </p>
        </div>
      </section>
    </main>
  );
}

