import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Our Methodology — Vinaadi",
  description:
    "How Vinaadi uses Thirukanitham, Lahiri ayanamsa, and multi-signal Tamil astrology logic to generate daily guidance, porutham, and chart readings.",
  alternates: { canonical: "https://vinaadi.com/trust/methodology" },
  openGraph: {
    title: "Our Methodology — Vinaadi",
    description:
      "Thirukanitham precision, Lahiri ayanamsa, and calm interpretation — the calculation and reasoning basis behind every Vinaadi reading.",
  },
};


export default function MethodologyPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">Method &amp; Trust</p>
            <h1 className="cl-trust-h1">Built on method, not vague astrology language</h1>
            <p className="cl-trust-lead">
              Every reading Vinaadi produces is grounded in precise Tamil
              astrological calculation. Here is exactly how it works.
            </p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-trust-prose">

            <h2>Thirukanitham — the precise Tamil calendar</h2>
            <p>
              Vinaadi is built on the <strong>Thirukanitham</strong> system — the
              Tamil tradition of astronomical calculation that determines the
              precise positions of celestial bodies at the moment of birth and for
              any given day. Thirukanitham means &ldquo;the method of calculation&rdquo;
              in Tamil, and it forms the foundation of traditional South Indian
              Jyotish practice.
            </p>
            <p>
              Unlike generalized astrology apps that use approximate planetary data,
              Vinaadi uses Thirukanitham-based computation to produce birth charts
              (jadhagam), panchangam, and transit readings that are anchored to the
              exact Tamil astrological standard.
            </p>

            <h2>Lahiri ayanamsa</h2>
            <p>
              Tamil Jyotish uses the <strong>sidereal zodiac</strong> — the fixed
              star positions — rather than the tropical zodiac used in Western
              astrology. The difference between sidereal and tropical positions is
              called the <em>ayanamsa</em>.
            </p>
            <p>
              Vinaadi uses the <strong>Lahiri ayanamsa</strong>, which is the
              government-recognized standard in India and the basis for the Indian
              National Calendar. This ensures that planet positions, lagna
              (ascendant), nakshatras, and rasi placements match what a traditionally
              trained Tamil Jyotish practitioner would compute.
            </p>

            <h2>Drik ephemeris precision</h2>
            <p>
              Planet positions are computed using the <strong>Drik (visual)
              ephemeris</strong> — the same astronomical data used in modern
              panchang publications. This provides the highest precision available
              for Tamil astrological calculation.
            </p>

            <h2>Vimshottari Dasha system</h2>
            <p>
              Daily guidance integrates the <strong>Vimshottari Dasha</strong>
              system — a 120-year planetary period cycle tied to the birth nakshatra.
              Dasha periods define the dominant planetary influence over each phase
              of life, and the sub-period (bhukti) and sub-sub-period (antara)
              layers add granularity to daily and weekly guidance.
            </p>
            <p>
              Vinaadi reads the current dasha, bhukti, and antara together and
              interprets their combined influence alongside transit and panchangam
              signals to produce a daily score and reading.
            </p>

            <h2>Gochar (transits)</h2>
            <p>
              <strong>Gochar</strong> refers to the current positions of planets
              in transit relative to your natal chart. Vinaadi integrates transit
              positions — especially Saturn, Jupiter, Rahu, and Ketu — with dasha
              periods to determine the quality of each day and period.
            </p>
            <p>
              Key transit effects like <strong>Chandrashtama</strong> (Moon transiting
              the 8th house from natal Moon) and <strong>Ashtama Shani</strong>
              (Saturn in the 8th from natal Moon) are tracked and communicated
              clearly, without fear language.
            </p>

            <h2>Panchangam</h2>
            <p>
              The <strong>Tamil panchangam</strong> is a five-part daily almanac
              covering: Tithi (lunar day), Vara (weekday deity), Nakshatra (Moon
              nakshatra), Yoga (sun-moon combination), and Karana (half-tithi).
              Vinaadi computes a precise panchangam for each day and uses it as
              one of the signals in the daily guidance calculation.
            </p>
            <p>
              Specific panchangam elements — like Rahu Kalam, Yamagandam, and
              auspicious timings (Amrit Kalam) — are surfaced as best-window and
              hold-window guidance.
            </p>

            <h2>Multi-signal daily score</h2>
            <p>
              Vinaadi&apos;s daily score is not a single-factor calculation. It
              combines:
            </p>
            <ul>
              <li>Current dasha and bhukti period quality</li>
              <li>Gochar transit influences on natal chart</li>
              <li>Panchangam quality for the day</li>
              <li>Moon nakshatra position</li>
              <li>Ashtakavarga benefic/malefic contributions where applicable</li>
            </ul>
            <p>
              The result is a score and a set of time windows — best window and
              caution window — designed to help with practical daily planning.
            </p>

            <h2>Porutham (marriage compatibility)</h2>
            <p>
              Vinaadi calculates the traditional <strong>10 Porutham</strong>
              system used in Tamil marriage matching. The ten poruthams — Dinam,
              Ganam, Mahendram, Stree Deergham, Yoni, Rajju, Vedha, Rasi,
              Rasiyathipathi, and Nadi — are each computed from the birth nakshatra
              and rasi of the two individuals.
            </p>
            <p>
              Rajju dosha and Vedha combinations are assessed carefully.
              Sevvai dosham (Manglik status) is also checked using the Thirukanitham
              standard.
            </p>

            <h2>Birth chart (Jadhagam)</h2>
            <p>
              Jadhagam generation uses the South Indian square-chart format.
              The D1 (Rasi chart) and D9 (Navamsa chart) are computed using
              Lahiri ayanamsa and Drik ephemeris, with house cusps determined
              by the Equal House system consistent with traditional South Indian
              practice. Planet lordships, conjunctions, and aspects follow
              classical Parashari principles as applied in Tamil Jyotish.
            </p>

            <h2>Interpretation philosophy</h2>
            <p>
              Vinaadi is designed to help users interpret astrology thoughtfully,
              not fearfully. Every verdict includes the reasoning behind it. We
              deliberately avoid language that amplifies anxiety, exaggerates
              threats, or presents astrological periods as fixed outcomes.
            </p>
            <p>
              Jyotish is a traditional belief system with deep cultural roots in
              Tamil life. Vinaadi approaches it with respect for that tradition
              while communicating in a way that supports calm, practical planning
              rather than fatalism.
            </p>

            <div className="cl-trust-links">
              <Link href="/learn/what-is-thirukanitham" className="cl-trust-link">What is Thirukanitham? →</Link>
              <Link href="/features/daily-guidance" className="cl-trust-link">How daily guidance works →</Link>
              <Link href="/tools/marriage-porutham-calculator" className="cl-trust-link">Porutham calculator →</Link>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Start with one reading</h2>
              <p className="cl-cta-strip__body">
                See Thirukanitham-based guidance applied to your own chart.
              </p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">
              Open dashboard →
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
