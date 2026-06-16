import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "How to Read a South Indian Jadhagam (Birth Chart) — Vinaadi",
  description:
    "A beginner's guide to reading a South Indian Tamil birth chart — lagna, houses, planets, nakshatras, and what they mean in Tamil Jyotish.",
  alternates: { canonical: "https://vinaadi.com/learn/how-to-read-a-jadhagam" },
};


export default function HowToReadJadhagamPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">Learn · Tamil Astrology</p>
            <h1 className="cl-trust-h1">How to read a South Indian Jadhagam</h1>
            <p className="cl-trust-lead">
              A jadhagam (birth chart) is a map of the sky at the moment of birth.
              This guide explains the South Indian chart format and what each element means.
            </p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-learn-prose">

            <h2>The South Indian square chart format</h2>
            <p>
              Tamil Jyotish uses the South Indian square chart format — a fixed
              grid of 12 squares arranged so that the 12 signs of the zodiac always
              appear in the same positions. Unlike North Indian charts, where the
              houses rotate based on the lagna, in the South Indian format the signs
              are fixed and the lagna moves.
            </p>
            <p>
              The arrangement (starting top-left and going clockwise): Mesha (Aries),
              Rishabam (Taurus), Mithunam (Gemini), Kadagam (Cancer), Simmam (Leo),
              Kanni (Virgo), Tulam (Libra), Viruchigam (Scorpio), Dhanus (Sagittarius),
              Makaram (Capricorn), Kumbam (Aquarius), Meenam (Pisces). The lagna
              sign is marked &ldquo;Lag&rdquo; or &ldquo;As&rdquo; in its corresponding box.
            </p>

            <h2>What is the Lagna (Ascendant)?</h2>
            <p>
              The lagna is the zodiac sign rising on the eastern horizon at the
              moment of birth. It changes approximately every 2 hours, making birth
              time accuracy important. The lagna is the first house and determines
              the house rulerships for the entire chart.
            </p>
            <p>
              In the South Indian chart, the lagna sign is marked, and all other
              planets are placed in their respective sign boxes. House numbers are
              counted from the lagna sign — the lagna box is house 1, the next
              clockwise is house 2, and so on.
            </p>

            <h2>The 9 planets in Tamil Jyotish</h2>
            <p>
              Tamil Jyotish recognises nine planets (Navagrahas):
            </p>
            <ul>
              <li><strong>Suryan (Sun)</strong> — Soul, authority, father, health</li>
              <li><strong>Chandran (Moon)</strong> — Mind, emotions, mother, comfort</li>
              <li><strong>Sevvai (Mars)</strong> — Energy, courage, siblings, land</li>
              <li><strong>Budhan (Mercury)</strong> — Intelligence, communication, business</li>
              <li><strong>Guru (Jupiter)</strong> — Wisdom, expansion, children, spirituality</li>
              <li><strong>Sukran (Venus)</strong> — Relationships, beauty, luxury, vehicles</li>
              <li><strong>Sani (Saturn)</strong> — Discipline, delays, longevity, karma</li>
              <li><strong>Rahu</strong> — North lunar node. Amplification, illusion, foreign matters</li>
              <li><strong>Ketu</strong> — South lunar node. Liberation, separation, spirituality</li>
            </ul>

            <h2>Houses and what they signify</h2>
            <p>
              Each of the 12 houses signifies specific areas of life:
            </p>
            <ul>
              <li><strong>1st (Lagna)</strong> — Self, body, personality, general life direction</li>
              <li><strong>2nd</strong> — Wealth, speech, family, food</li>
              <li><strong>3rd</strong> — Siblings, courage, short journeys, communication</li>
              <li><strong>4th</strong> — Home, mother, property, happiness</li>
              <li><strong>5th</strong> — Intelligence, children, past life merit, creativity</li>
              <li><strong>6th</strong> — Enemies, debt, health challenges, service</li>
              <li><strong>7th</strong> — Marriage, partnerships, foreign travel</li>
              <li><strong>8th</strong> — Longevity, obstacles, occult, inheritance</li>
              <li><strong>9th</strong> — Father, dharma, luck, higher education, spiritual guidance</li>
              <li><strong>10th</strong> — Career, status, action in the world</li>
              <li><strong>11th</strong> — Gains, income, elder siblings, social connections</li>
              <li><strong>12th</strong> — Expenditure, losses, foreign lands, liberation</li>
            </ul>

            <h2>What is the nakshatra?</h2>
            <p>
              Each planet is placed not just in a rasi (sign) but in a specific
              nakshatra — one of the 27 lunar mansions that divide the zodiac into
              13°20&apos; segments. The Moon&apos;s nakshatra at birth is called the janma
              nakshatra and is particularly important — it determines the Vimshottari
              dasha starting point and is central to porutham calculation.
            </p>

            <h2>What is the dasha sequence?</h2>
            <p>
              The dasha sequence is a planetary period system calculated from the
              birth nakshatra. The Vimshottari system covers 120 years and assigns
              specific periods to each planet (Sun: 6 years, Moon: 10, Mars: 7,
              Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17, Ketu: 7, Venus: 20).
              The sequence and starting point depend on the exact position of the
              Moon at birth.
            </p>
            <p>
              The current dasha and bhukti (sub-period) are among the most
              important factors in daily reading interpretation.
            </p>

            <div className="cl-trust-links">
              <Link href="/tools/jadhagam-generator" className="cl-trust-link">Generate your jadhagam →</Link>
              <Link href="/features/chart-guidance" className="cl-trust-link">Chart guidance feature →</Link>
              <Link href="/learn/why-birth-time-matters" className="cl-trust-link">Why birth time matters →</Link>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Generate your jadhagam</h2>
              <p className="cl-cta-strip__body">Thirukanitham-precise South Indian birth chart with full chart guidance.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
