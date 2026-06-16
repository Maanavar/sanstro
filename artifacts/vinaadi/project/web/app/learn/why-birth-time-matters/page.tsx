import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Why Birth Time Matters in Tamil Astrology — Vinaadi",
  description:
    "Birth time determines your lagna (ascendant) and dasha start point — the two most important factors in Tamil Jyotish chart reading and daily guidance accuracy.",
  alternates: { canonical: "https://vinaadi.com/learn/why-birth-time-matters" },
};


export default function WhyBirthTimePage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">Learn · Tamil Astrology</p>
            <h1 className="cl-trust-h1">Why birth time matters</h1>
            <p className="cl-trust-lead">
              Birth time determines two of the most important elements in Tamil
              Jyotish — the lagna (ascendant) and the dasha starting point.
              Without an accurate birth time, chart interpretation and daily
              guidance both become less reliable.
            </p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-learn-prose">

            <h2>What birth time affects</h2>
            <p>
              In Tamil Jyotish, birth time affects three key calculations:
            </p>
            <ul>
              <li><strong>Lagna (Ascendant)</strong> — The zodiac sign rising on the eastern horizon at the birth moment. It changes every ~2 hours and determines all house positions.</li>
              <li><strong>Moon nakshatra precision</strong> — When the Moon is near a nakshatra boundary, even a 30-minute error in birth time can shift the nakshatra assignment.</li>
              <li><strong>Vimshottari dasha starting point</strong> — The dasha sequence is calculated from the Moon&apos;s exact nakshatra position. Nakshatra errors cause the entire dasha sequence to be off.</li>
            </ul>

            <h2>The lagna changes every 2 hours</h2>
            <p>
              The lagna is perhaps the single most important point in a Tamil birth
              chart. It determines which planet rules the 1st house, which planets
              are in which houses, and therefore the entire interpretive framework
              of the chart.
            </p>
            <p>
              Because the lagna changes sign approximately every 2 hours, a birth
              time error of even 30–90 minutes can put the lagna in the wrong sign.
              This changes:
            </p>
            <ul>
              <li>Which planet is the lagna lord</li>
              <li>Which house each planet occupies</li>
              <li>Which houses each planet rules</li>
              <li>How yogas and doshas are assessed</li>
            </ul>

            <h2>How dasha accuracy depends on birth time</h2>
            <p>
              The Vimshottari dasha system uses the Moon&apos;s position in its nakshatra
              at birth to determine how much of the first dasha period was remaining
              at birth. The more precisely the Moon&apos;s nakshatra degree is known,
              the more accurately the dasha periods can be dated.
            </p>
            <p>
              When the Moon is near a nakshatra boundary, even small birth time
              errors can shift it into the adjacent nakshatra — changing which planet
              rules the current dasha and when major transitions occur. For Vinaadi&apos;s
              daily guidance, this affects which dasha lord is active and the quality
              interpretation of the current period.
            </p>

            <h2>What to do if you don&apos;t have an exact birth time</h2>
            <p>
              Many people have only an approximate birth time — a hospital record
              that says &ldquo;around 7 in the morning&rdquo;, or a family recollection that
              may be off by an hour. This is common.
            </p>
            <p>
              Vinaadi&apos;s approach for uncertain birth times:
            </p>
            <ul>
              <li><strong>Use the best available time</strong> — Even an approximate time gives meaningful rasi and nakshatra data for most planets, porutham analysis, and transit-level daily guidance.</li>
              <li><strong>Use rectification</strong> — Vinaadi&apos;s birth time rectification tool uses key life events to narrow the uncertainty and produce a more reliable birth time.</li>
              <li><strong>Understand the limitation</strong> — Vinaadi indicates when birth time confidence may affect lagna reliability, so users can interpret results accordingly.</li>
            </ul>

            <h2>How Vinaadi handles birth time uncertainty</h2>
            <p>
              Vinaadi does not hide birth time uncertainty. If your lagna is in a
              sign that the birth time only marginally supports, the chart guidance
              includes appropriate context. The daily reading is still useful for
              transit-level guidance even when lagna precision is lower.
            </p>
            <p>
              For the best results, we recommend entering the most accurate birth
              time available and, if uncertain, using the rectification tool with
              key life events.
            </p>

            <div className="cl-trust-links">
              <Link href="/tools/birth-time-rectification" className="cl-trust-link">Birth time rectification tool →</Link>
              <Link href="/tools/jadhagam-generator" className="cl-trust-link">Generate your jadhagam →</Link>
              <Link href="/learn/how-to-read-a-jadhagam" className="cl-trust-link">How to read a jadhagam →</Link>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Refine your birth time</h2>
              <p className="cl-cta-strip__body">Use Vinaadi&apos;s rectification tool with life events to improve accuracy.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
