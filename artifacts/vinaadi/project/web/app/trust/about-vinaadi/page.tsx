import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "About Vinaadi — Tamil Astrology Assistant",
  description:
    "Vinaadi is a Tamil astrology assistant built on Thirukanitham precision — daily guidance, porutham, jadhagam, and family planning for real decisions.",
  alternates: { canonical: "https://vinaadi.com/trust/about-vinaadi" },
  openGraph: {
    title: "About Vinaadi — Tamil Astrology Assistant",
    description:
      "Thirukanitham-based Tamil astrology for daily guidance, family planning, and calm interpretation.",
  },
};


export default function AboutPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">About</p>
            <h1 className="cl-trust-h1">What Vinaadi is trying to do</h1>
            <p className="cl-trust-lead">
              Tamil astrology has been a practical guide for daily life and family
              decisions for thousands of years. Vinaadi brings that tradition into
              a modern tool — precise, calm, and built for the way people actually
              think through their days.
            </p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-trust-prose">

            <h2>The problem Vinaadi solves</h2>
            <p>
              Most astrology apps are built around passive consumption — daily
              sun-sign horoscopes, generic forecasts, or entertainment content.
              They are not designed for the Tamil Jyotish practitioner who needs
              Thirukanitham-accurate birth charts, or the family that wants to
              plan shared decisions using real astrological signals.
            </p>
            <p>
              There is also a trust problem. Many existing tools use fear-amplifying
              language — warning of &ldquo;dangerous&rdquo; periods, predicting
              bad outcomes, or presenting astrological signals as fixed fate. That
              is not how traditional Tamil Jyotish is meant to be used.
            </p>

            <h2>What Vinaadi is</h2>
            <p>
              Vinaadi is an assistant. It reads your chart, tracks your dasha,
              monitors transits, computes a daily panchangam, and gives you one
              quiet reading every morning — a score, a best window, a caution
              window, and a brief interpretation in plain language.
            </p>
            <p>
              When you need a specific tool — porutham matching for a marriage,
              jadhagam generation, birth time rectification, or a panchangam
              calendar — those tools are part of the same assistant. They are not
              disconnected calculators.
            </p>
            <p>
              When you have family members to plan with, their readings sit
              alongside yours. The shared timing windows help you make decisions
              together rather than in isolation.
            </p>

            <h2>How Vinaadi is different</h2>
            <ul>
              <li>
                <strong>Thirukanitham precision.</strong> Every calculation uses
                the Tamil standard — Lahiri ayanamsa, Drik ephemeris, traditional
                South Indian chart format.
              </li>
              <li>
                <strong>Assistant-first, not tool-first.</strong> The daily
                reading integrates chart, dasha, transits, and panchangam together.
                Tools are available when needed but do not define the experience.
              </li>
              <li>
                <strong>Family-aware.</strong> Most astrology products stop at
                individual readings. Vinaadi is designed for the way Tamil families
                actually use astrology — together.
              </li>
              <li>
                <strong>Calm language.</strong> No doom language. No fear-based
                predictions. Every signal includes reasoning. Users understand
                what the reading is based on.
              </li>
              <li>
                <strong>Transparent reasoning.</strong> Vinaadi shows you why a
                day scores the way it does. Dasha period quality, transit
                influences, panchangam quality — all visible.
              </li>
            </ul>

            <h2>What Vinaadi is not</h2>
            <p>
              Vinaadi is not a replacement for a trained Jyotish practitioner
              for complex life decisions. It is not medical, legal, or financial
              advice. It is a planning assistant that uses Tamil astrological
              tradition to help people think about time, timing, and context — with
              clarity rather than anxiety.
            </p>

            <h2>Early access</h2>
            <p>
              Vinaadi is currently in early access. The core experience — daily
              guidance, porutham, jadhagam, family vault — is available now.
              We are building toward a fuller assistant experience including
              richer guidance narratives, deeper chart exploration, and expanded
              family planning tools.
            </p>

            <div className="cl-trust-links">
              <Link href="/trust/methodology" className="cl-trust-link">Our methodology →</Link>
              <Link href="/features/daily-guidance" className="cl-trust-link">How daily guidance works →</Link>
              <Link href="/dashboard" className="cl-trust-link">Open dashboard →</Link>
            </div>
          </div>
        </section>

        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">Start with today&apos;s reading</h2>
              <p className="cl-cta-strip__body">
                Free during early access. Full chart, daily guidance, family vault.
              </p>
            </div>
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
