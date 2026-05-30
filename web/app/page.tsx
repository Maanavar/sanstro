import Link from "next/link";
import Image from "next/image";

/* ─────────────────────────────────────────────────────────────
   Static sample data powering the "Today's reading" preview card
───────────────────────────────────────────────────────────── */
const SAMPLE = {
  dayLabel: "Tuesday, 26 May",
  personName: "Senthil's day",
  score: 64,
  summary: "A balanced day under Moon Dasa · Moon Bhukti. Saturn refines home and inner stability.",
  bestWindow: { start: "11:53", end: "12:41" },
  holdWindow: { start: "3:28", end: "5:03" },
  lagna: "Mesham Lagna",
  nakshatra: "Moolam",
  rasi: "Dhanusu",
};

/* Sun arc: 6 a → 6 p mapped to [0..100]. Progress dot at ~12:10 */
const ARC_HOURS = ["6a", "9a", "12p", "3p", "6p"];

export default function HomePage() {
  return (
    <div className="clarity-shell">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="cl-nav">
        <div className="cl-nav__inner">
          <Link href="/" className="cl-nav__brand" aria-label="Vinaadi home">
            <Image
              src="/brand/vinaadi-symbol-icon.png"
              alt=""
              aria-hidden
              width={512}
              height={512}
              className="cl-nav__symbol"
              priority
            />
            <span className="cl-nav__wordmark">Vinaadi</span>
          </Link>

          <nav className="cl-nav__links" aria-label="Primary navigation">
            <a href="#how-it-works" className="cl-nav__link">How it works</a>
            <a href="#family" className="cl-nav__link">Family</a>
            <a href="#pricing" className="cl-nav__link">Pricing</a>
            <Link href="/login" className="cl-nav__signin">Sign in</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="cl-hero">
          <div className="cl-hero__inner">

            {/* Left copy */}
            <div className="cl-hero__copy">
              <p className="cl-eyebrow">Daily Jyotish · For Calm Planning</p>
              <h1 className="cl-hero__h1">
                One quiet<br />reading.<br />
                <em>Every morning.</em>
              </h1>
              <p className="cl-hero__body">
                Vinaadi turns Thirukanitham — your chart, dasa, transit and
                panchangam — into a single, balanced answer for today, and for
                the people you plan with.
              </p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">
                  Open dashboard →
                </Link>
                <a href="#sample" className="cl-btn cl-btn--ghost">
                  See a sample reading
                </a>
              </div>
            </div>

            {/* Right: Today's reading preview card */}
            <div className="cl-hero__card-wrap" id="sample">
              <span className="cl-sticker">Today's Reading</span>

              <div className="cl-reading-card">
                {/* Card header */}
                <div className="cl-card-head">
                  <div>
                    <p className="cl-card-date">{SAMPLE.dayLabel}</p>
                    <h2 className="cl-card-title">{SAMPLE.personName}</h2>
                  </div>
                  {/* Score dial */}
                  <div className="cl-dial" aria-label={`Score ${SAMPLE.score}`}>
                    <svg
                      className="cl-dial__svg"
                      viewBox="0 0 80 80"
                      width="80"
                      height="80"
                      aria-hidden="true"
                    >
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="var(--cl-border)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="var(--cl-ink)"
                        strokeWidth="6"
                        strokeDasharray={`${(SAMPLE.score / 100) * 213.6} 213.6`}
                        strokeLinecap="round"
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    <div className="cl-dial__num">{SAMPLE.score}</div>
                  </div>
                </div>

                {/* Summary */}
                <p className="cl-card-summary">{SAMPLE.summary}</p>

                {/* Day timeline — arc sky + horizon bar with window segments */}
                <div className="cl-arc-wrap" aria-hidden="true">
                  <svg
                    viewBox="0 0 320 110"
                    className="cl-arc__svg"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/*
                      LAYOUT
                      ──────
                      Horizon bar  y=82, x: 20→300  (280px = 12 hours)
                      px/hour = 280/12 = 23.333

                      Arc: quadratic bezier sunrise(20,82) → peak(160,18) → sunset(300,82)
                        Path: M20,82 Q160,18 300,82   ← control point IS the peak

                      Sun dot rides the arc at t where x≈164 (12:10)
                        t=(x-Lx)/(Rx-Lx) linearly ≈ 0.514
                        y = (1-t)²·82 + 2t(1-t)·18 + t²·82
                          = 82 - 2t(1-t)·64  at t=0.514
                          = 82 - 2·0.514·0.486·64 ≈ 82 - 32 = 50

                      Window x-positions (px/hr = 23.333):
                        Best 11:53 = 5.883h → x=20+5.883×23.333=157  width=(0.8h×23.333)=19
                        Hold 15:28 = 9.467h → x=20+9.467×23.333=241  width=(1.583h×23.333)=37
                    */}

                    {/* ── Sky arc (thin, warm grey) ── */}
                    <path
                      d="M20,82 Q160,18 300,82"
                      fill="none"
                      stroke="#D4C8AE"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />

                    {/* ── Horizon track (full grey pill) ── */}
                    <rect x="20" y="79" width="280" height="5" rx="2.5" fill="#E4DBC8" />

                    {/* ── Best window segment — sage green ── */}
                    <rect x="157" y="78" width="19" height="7" rx="3.5" fill="#5C7654" />

                    {/* ── Hold window segment — rust ── */}
                    <rect x="241" y="78" width="37" height="7" rx="3.5" fill="#A8482F" />

                    {/* ── Tick marks at 6a, 9a, 12p, 3p, 6p ── */}
                    {[20, 90, 160, 230, 300].map((x) => (
                      <line key={x} x1={x} y1="86" x2={x} y2="93" stroke="#A89D89" strokeWidth="1.5" strokeLinecap="round" />
                    ))}

                    {/* ── Sun dot riding the arc at ~12:10 (t≈0.514, y≈50) ── */}
                    <circle cx="164" cy="50" r="6" fill="#B85A2C" />

                  </svg>

                  {/* Hour labels aligned to tick positions */}
                  <div className="cl-arc-labels">
                    {ARC_HOURS.map((h) => (
                      <span key={h} className="cl-arc-label">{h}</span>
                    ))}
                  </div>
                </div>

                {/* Best / Hold chips */}
                <div className="cl-window-row">
                  <div className="cl-window cl-window--best">
                    <p className="cl-window__label">Best Window</p>
                    <p className="cl-window__time">
                      {SAMPLE.bestWindow.start} – {SAMPLE.bestWindow.end}
                    </p>
                  </div>
                  <div className="cl-window cl-window--hold">
                    <p className="cl-window__label">Hold</p>
                    <p className="cl-window__time">
                      {SAMPLE.holdWindow.start} – {SAMPLE.holdWindow.end}
                    </p>
                  </div>
                </div>

                {/* Footer meta */}
                <div className="cl-card-foot">
                  <span className="cl-card-foot__meta">
                    {SAMPLE.lagna} · {SAMPLE.nakshatra} ☉ {SAMPLE.rasi}
                  </span>
                  <span className="cl-card-foot__badge">D1 · D9 ready</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Three pillars ─────────────────────────────────── */}
        <section className="cl-pillars" id="how-it-works">
          <div className="cl-container">
            <div className="cl-pillar-grid">
              <div className="cl-pillar">
                <h3 className="cl-pillar__title">Calm</h3>
                <p className="cl-pillar__body">No fear-language. Just signal.</p>
              </div>
              <div className="cl-pillar">
                <h3 className="cl-pillar__title">Whole-family</h3>
                <p className="cl-pillar__body">Shared vault, decisions in one place.</p>
              </div>
              <div className="cl-pillar">
                <h3 className="cl-pillar__title">Thirukanitham</h3>
                <p className="cl-pillar__body">Tamil calendar, exact panchangam.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Balance & Connections ─────────────────────────── */}
        <section className="cl-balance" id="family">
          <div className="cl-container cl-balance__inner">

            <div className="cl-balance__copy">
              <p className="cl-eyebrow">Balance &amp; Connections</p>
              <h2 className="cl-section-h2">
                Every reading weighs your whole sky.
              </h2>
              <p className="cl-section-body">
                Dasha periods, Gochar transits, Moon nakshatra and Panchangam
                timing are blended into one daily score — then shown side by
                side with your family's scores so you plan together, not in
                isolation.
              </p>
              <ul className="cl-check-list">
                {[
                  "Lahiri ayanamsa · Drik ephemeris precision",
                  "Vimshottari Dasha with sub-period interpretation",
                  "Family vault with shared best-window view",
                  "Sevvai Dosham, Kala Sarpa, and Yoga clarity",
                ].map((item) => (
                  <li key={item} className="cl-check-list__item">
                    <span className="cl-check-list__dot" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard" className="cl-btn cl-btn--solid cl-balance-cta">
                Open dashboard →
              </Link>
            </div>

            {/* Score comparison widget */}
            <div className="cl-score-panel">
              <p className="cl-score-panel__label">Your family today</p>
              {[
                { name: "Arjun Kumar", score: 64, band: "mid" },
                { name: "Priya", score: 81, band: "high" },
                { name: "Arjun", score: 47, band: "low" },
              ].map((m) => (
                <div key={m.name} className="cl-score-row">
                  <span className="cl-score-row__name">{m.name}</span>
                  <div className="cl-score-bar-wrap">
                    <div
                      className={`cl-score-bar cl-score-bar--${m.band}`}
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                  <span className={`cl-score-num cl-score-num--${m.band}`}>{m.score}</span>
                </div>
              ))}
              <p className="cl-score-panel__foot">
                Best combined window: 11:53 – 12:41
              </p>
            </div>
          </div>
        </section>

        {/* ── Commitment strip ──────────────────────────────── */}
        <section className="cl-commit">
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

        {/* ── Pricing placeholder ───────────────────────────── */}
        <section className="cl-pricing" id="pricing">
          <div className="cl-container cl-pricing__inner">
            <p className="cl-eyebrow">Pricing</p>
            <h2 className="cl-section-h2 cl-pricing__title">
              Free while we're in beta.
            </h2>
            <p className="cl-section-body cl-pricing__body">
              Full access — chart, daily guidance, family vault — at no cost
              during the early-access period.
            </p>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">
              Get started free →
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="cl-footer">
        <div className="cl-container cl-footer__inner">
          <div className="cl-footer__brand">
            <span className="cl-footer__wordmark">Vinaadi</span>
            <p className="cl-footer__tagline">
              Thirukanitham-based Tamil astrology for daily life and family planning.
            </p>
          </div>
          <div className="cl-footer__links">
            <div className="cl-footer__col">
              <p className="cl-footer__col-head">Product</p>
              <Link href="/dashboard" className="cl-footer__link">Dashboard</Link>
              <a href="#how-it-works" className="cl-footer__link">How it works</a>
            </div>
            <div className="cl-footer__col">
              <p className="cl-footer__col-head">Legal</p>
              <a href="#" className="cl-footer__link">Privacy policy</a>
              <a href="#" className="cl-footer__link">Terms of service</a>
            </div>
          </div>
        </div>
        <div className="cl-footer__bottom">
          <div className="cl-container cl-footer__bottom-inner">
            <p className="cl-footer__disclaimer">
              Vinaadi provides Jyotish-based guidance. Astrology is a traditional
              belief system, not a science. For medical, legal, or financial
              decisions, consult a qualified professional.
            </p>
            <p className="cl-footer__copy">© {new Date().getFullYear()} Vinaadi</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
