import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "What is Porutham? Tamil Marriage Compatibility Explained — Vinaadi",
  description:
    "Porutham is the Tamil system of marriage compatibility matching using birth nakshatras and rasis. Learn about the 10 poruthams, Rajju, Vedha, Nadi, and Sevvai dosham.",
  alternates: { canonical: "https://vinaadi.com/learn/what-is-porutham" },
  openGraph: {
    title: "What is Porutham? Tamil Marriage Compatibility Explained",
    description: "A clear explanation of the 10-porutham system used in Tamil astrology for marriage matching.",
  },
};


export default function WhatIsPoruthamPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">Learn · Tamil Astrology</p>
            <h1 className="cl-trust-h1">What is Porutham?</h1>
            <p className="cl-trust-lead">
              Porutham is the Tamil astrological system for assessing marriage
              compatibility. It is based on the birth nakshatras and rasis of both
              individuals and checks ten specific compatibility factors.
            </p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-learn-prose">

            <h2>The meaning of Porutham</h2>
            <p>
              The word &ldquo;porutham&rdquo; (பொருத்தம்) means &ldquo;compatibility&rdquo; or
              &ldquo;suitability&rdquo; in Tamil. In the context of astrology, it refers to
              a systematic evaluation of whether two individuals&apos; astrological
              profiles are compatible for marriage. This system has been used in
              Tamil culture for centuries as one of the primary methods of evaluating
              prospective marriages.
            </p>

            <h2>How porutham is determined</h2>
            <p>
              Porutham is calculated primarily from the birth nakshatra (janma
              nakshatra) of each individual. The nakshatra is determined by the
              position of the Moon at the time of birth, calculated using the
              Thirukanitham method with Lahiri ayanamsa. The rasi (Moon sign) is
              also used for certain poruthams.
            </p>
            <p>
              There are 27 nakshatras in the Tamil/Vedic zodiac, each spanning
              13°20&apos; of the ecliptic. The nakshatra is the single most important
              factor in porutham calculation.
            </p>

            <h2>The 10 poruthams</h2>
            <p>
              The traditional Tamil porutham system checks ten compatibility factors.
              Each is evaluated independently, and the overall compatibility is
              assessed based on how many match and whether any critical doshas
              are present.
            </p>
            <ul>
              <li><strong>Dinam</strong> — Day-to-day harmony and health in the relationship. Based on nakshatra count.</li>
              <li><strong>Ganam</strong> — Temperament compatibility. Based on the Gana (Deva, Manushya, or Rakshasa) of each nakshatra.</li>
              <li><strong>Mahendram</strong> — Long-term prosperity and longevity of the marriage.</li>
              <li><strong>Stree Deergham</strong> — Long and prosperous life for the bride.</li>
              <li><strong>Yoni</strong> — Physical and intimate compatibility. Based on the animal symbol of each nakshatra.</li>
              <li><strong>Rajju</strong> — Critical dosha. Matching Rajju categories (Kanda, Kati, Greeva, Siro, Pada) indicate serious risk to the marriage.</li>
              <li><strong>Vedha</strong> — Certain nakshatra pairs oppose each other. Vedha indicates obstacles in the relationship.</li>
              <li><strong>Rasi</strong> — Overall compatibility between the Moon signs of both individuals.</li>
              <li><strong>Rasiyathipathi</strong> — Compatibility between the lords of each partner&apos;s rasi.</li>
              <li><strong>Nadi</strong> — Critical dosha. Same Nadi category (Adi, Madhya, Antya) for both partners is associated with health concerns for progeny.</li>
            </ul>

            <h2>Rajju and Nadi — the most important doshas</h2>
            <p>
              Among the 10 poruthams, <strong>Rajju</strong> and <strong>Nadi</strong>
              are considered the most critical. A Rajju dosha — where both partners
              fall in the same Rajju group — is traditionally considered a serious
              obstacle to the longevity of the marriage and the well-being of the
              partners. A Nadi dosha — where both partners share the same Nadi —
              is associated with health concerns for children.
            </p>
            <p>
              These two doshas are checked as high priority. The traditional view
              recognises some exceptions and remedies, but a match with both Rajju
              and Nadi dosha requires careful consideration by experienced practitioners.
            </p>

            <h2>Sevvai dosham (Manglik status)</h2>
            <p>
              In addition to the 10 poruthams, Tamil marriage matching also checks
              for <strong>Sevvai dosham</strong> (also called Manglik, from the planet
              Sevvai/Mars). Sevvai dosha is present when Mars is placed in the 1st,
              2nd, 4th, 7th, 8th, or 12th house from the lagna, Moon, or Venus in
              the natal chart.
            </p>
            <p>
              The traditional view is that Sevvai dosha should be matched — either
              both partners have it, or both are free of it. Mismatches require remedial
              consideration. Vinaadi checks Sevvai dosham using the Thirukanitham method.
            </p>

            <h2>How many poruthams are needed?</h2>
            <p>
              There is no single universal answer. Traditional Tamil families generally
              consider a match acceptable if at least 6–7 of the 10 poruthams match,
              provided that Rajju dosha is absent (or acceptable under recognised
              exceptions). A match with fewer than 5 poruthams or with Rajju dosha
              is typically reconsidered.
            </p>
            <p>
              However, the count alone is not sufficient — the quality of the
              matched poruthams and the status of doshas matters more than hitting
              a specific number.
            </p>

            <div className="cl-trust-links">
              <Link href="/tools/marriage-porutham-calculator" className="cl-trust-link">Check porutham with Vinaadi →</Link>
              <Link href="/features/family-planning" className="cl-trust-link">Family planning feature →</Link>
              <Link href="/trust/methodology" className="cl-trust-link">Our methodology →</Link>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Check porutham with Vinaadi</h2>
              <p className="cl-cta-strip__body">Full 10-porutham analysis using the Thirukanitham method.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
