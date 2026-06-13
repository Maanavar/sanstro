import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "What is Chandrashtama? Moon in the 8th — Vinaadi",
  description:
    "Chandrashtama is the period when the Moon transits the 8th house from your natal Moon rasi. Learn what it means, how it's calculated, and how to approach it calmly.",
  alternates: { canonical: "https://vinaadi.com/learn/what-is-chandrashtama" },
};


export default function WhatIsChandrashtamaPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">Learn · Tamil Astrology</p>
            <h1 className="cl-trust-h1">What is Chandrashtama?</h1>
            <p className="cl-trust-lead">
              Chandrashtama is the period when the transiting Moon passes through
              the 8th sign from your natal Moon rasi. It is a recurring astrological
              condition that can be understood — and planned around — calmly.
            </p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-learn-prose">

            <h2>What Chandrashtama means</h2>
            <p>
              The word Chandrashtama combines &ldquo;Chandra&rdquo; (Moon) and &ldquo;Ashtama&rdquo;
              (eighth). It refers to the Moon transiting the 8th sign from the
              natal Moon rasi — the sign the Moon occupied at the time of birth.
            </p>
            <p>
              In Tamil and Vedic Jyotish, the 8th house from the Moon is associated
              with challenges, obstacles, increased mental fatigue, and a period
              where caution is advisable for important new actions. The Moon moves
              through all 12 signs roughly once per month, spending approximately
              2.5 days in each sign. This means Chandrashtama occurs for approximately
              2–3 days every month.
            </p>

            <h2>How it is calculated</h2>
            <p>
              To determine Chandrashtama for any day, Vinaadi:
            </p>
            <ul>
              <li>Identifies your natal Moon rasi from your birth chart (calculated with Thirukanitham / Lahiri ayanamsa)</li>
              <li>Counts 8 signs forward from your natal Moon rasi</li>
              <li>Checks whether the transiting Moon on that day is in that 8th sign</li>
            </ul>
            <p>
              For example, if your natal Moon is in Rishabam (Taurus), the 8th
              sign from Rishabam is Dhanus (Sagittarius). On any day when the
              transiting Moon is in Dhanus, you are in Chandrashtama.
            </p>

            <h2>What Chandrashtama is and is not</h2>
            <p>
              Chandrashtama is a regularly occurring transit condition — not a rare
              or catastrophic event. It happens for 2–3 days every month for
              everyone. It is not a signal that something bad will happen. It is a
              signal that the day has a slightly different quality — one where
              increased care in new decisions, emotional sensitivity, and physical
              conservation may be advisable.
            </p>
            <p>
              Traditional Tamil astrological practice treats Chandrashtama days as
              unsuitable for starting important new ventures, making irreversible
              decisions, or beginning long journeys. Routine activity, rest, and
              existing commitments continue normally.
            </p>

            <h2>How Vinaadi handles Chandrashtama</h2>
            <p>
              Vinaadi tracks Chandrashtama for each user based on their natal Moon
              rasi. On Chandrashtama days, the daily score reflects the added
              caution, the caution window is expanded or shifted, and the
              interpretation notes the Chandrashtama period clearly.
            </p>
            <p>
              We deliberately avoid amplifying Chandrashtama with fear language.
              The interpretation uses calm, practical framing — it is a day to
              approach with a bit more care, not a day to fear.
            </p>

            <h2>The difference between Chandrashtama and a &ldquo;bad day&rdquo;</h2>
            <p>
              Many astrology apps label Chandrashtama days as simply &ldquo;bad&rdquo; or
              use alarming language around them. This is not consistent with the
              traditional Tamil Jyotish understanding.
            </p>
            <p>
              Chandrashtama modifies the day&apos;s quality. Whether the day is
              overall positive or challenging still depends on the full combination
              of factors — dasha period quality, other transit influences, and the
              day&apos;s panchangam. A strong dasha period can offset a Chandrashtama
              period significantly. Vinaadi reads all of these together and gives
              a balanced score, not a fear trigger.
            </p>

            <div className="cl-trust-links">
              <Link href="/features/daily-guidance" className="cl-trust-link">How daily guidance works →</Link>
              <Link href="/tools/daily-panchangam-planner" className="cl-trust-link">Daily Panchangam Planner →</Link>
              <Link href="/trust/methodology" className="cl-trust-link">Our methodology →</Link>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Track your Chandrashtama days</h2>
              <p className="cl-cta-strip__body">Vinaadi identifies and interprets Chandrashtama in your daily reading.</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">Open dashboard →</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
