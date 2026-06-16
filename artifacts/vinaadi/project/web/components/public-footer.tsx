import Link from "next/link";

export function PublicFooter() {
  return (
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
            <p className="cl-footer__col-head">Features</p>
            <Link href="/features/daily-guidance" className="cl-footer__link">Daily Guidance</Link>
            <Link href="/features/family-planning" className="cl-footer__link">Family Planning</Link>
            <Link href="/features/chart-guidance" className="cl-footer__link">Chart Guidance</Link>
            <Link href="/features/timing-and-decisions" className="cl-footer__link">Timing &amp; Decisions</Link>
          </div>
          <div className="cl-footer__col">
            <p className="cl-footer__col-head">Tools</p>
            <Link href="/tools/marriage-porutham-calculator" className="cl-footer__link">Porutham Calculator</Link>
            <Link href="/tools/jadhagam-generator" className="cl-footer__link">Jadhagam Generator</Link>
            <Link href="/tools/daily-panchangam-planner" className="cl-footer__link">Panchangam Planner</Link>
            <Link href="/tools/birth-time-rectification" className="cl-footer__link">Birth Time Rectification</Link>
          </div>
          <div className="cl-footer__col">
            <p className="cl-footer__col-head">Learn</p>
            <Link href="/learn/what-is-porutham" className="cl-footer__link">What is Porutham?</Link>
            <Link href="/learn/what-is-thirukanitham" className="cl-footer__link">What is Thirukanitham?</Link>
            <Link href="/learn/what-is-chandrashtama" className="cl-footer__link">What is Chandrashtama?</Link>
            <Link href="/learn/how-to-read-a-jadhagam" className="cl-footer__link">How to read a Jadhagam</Link>
            <Link href="/learn/why-birth-time-matters" className="cl-footer__link">Why birth time matters</Link>
          </div>
          <div className="cl-footer__col">
            <p className="cl-footer__col-head">Company</p>
            <Link href="/trust/about-vinaadi" className="cl-footer__link">About Vinaadi</Link>
            <Link href="/trust/methodology" className="cl-footer__link">Methodology</Link>
            <Link href="/privacy" className="cl-footer__link">Privacy policy</Link>
            <Link href="/terms" className="cl-footer__link">Terms of service</Link>
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
  );
}
