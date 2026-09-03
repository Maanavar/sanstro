import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Vinaadi",
  description: "How Vinaadi collects, uses, and protects your personal data.",
  alternates: { canonical: "https://vinaadi.com/privacy" },
  robots: { index: true, follow: false },
  openGraph: {
    title: "Privacy Policy - Vinaadi",
    description: "How Vinaadi collects, uses, and protects your personal data.",
    url: "https://vinaadi.com/privacy",
    images: [
      {
        url: "/brand/vinaadi-og-image.png",
        width: 1792,
        height: 612,
        alt: "Vinaadi - Your Cosmic Copilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy - Vinaadi",
    description: "How Vinaadi collects, uses, and protects your personal data.",
    images: ["/brand/vinaadi-og-image.png"],
  },
};


export default function PrivacyPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">Legal</p>
            <h1 className="cl-trust-h1">Privacy Policy</h1>
            <p className="cl-trust-sub">Last updated: September 2026</p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-trust-prose">

            <h2>Beta notice</h2>
            <p>
              Vinaadi is currently in open beta. Features are evolving and this
              policy may be updated as the product matures. We will post the
              updated date below whenever it changes. By using the beta you help
              us improve — see our <Link href="/beta" className="cl-trust-link">beta page</Link> for
              what this means.
            </p>

            <h2>What we collect</h2>
            <p>
              Vinaadi collects only the information required to provide your
              astrology assistant service: your email address (for account
              authentication), and your birth details (date, time, and place of
              birth) that you choose to enter. Family member profiles you
              create are stored under your account.
            </p>

            <h2>How we use your data</h2>
            <p>
              Your birth details are used exclusively to calculate Thirukanitham-based
              astrological readings — daily guidance scores, dasa periods, transit
              positions, panchangam timings, porutham results, and jadhagam charts.
              We do not sell, share, or transfer your personal data to third parties
              for marketing purposes.
            </p>

            <h2>Ask Vinaadi and processing outside India</h2>
            <p>
              When you use <strong>Ask Vinaadi</strong>, your question and a derived
              summary of your chart are sent to Anthropic PBC (United States), which
              generates the answer on our behalf as a data processor. That summary
              contains your age, marital status, employment type, and calculated
              astrological positions — your rasi, nakshatra, and current dasa and
              transit periods.
            </p>
            <p>
              It does <strong>not</strong> contain your name, your email address, or
              your date, time or place of birth. Anthropic processes it only to
              produce your answer. If you do not use Ask Vinaadi, none of your data
              is sent there.
            </p>

            <h2>Data storage and security</h2>
            <p>
              Your data is stored on secured servers. Your birth details are
              <strong> encrypted at rest</strong>, transmitted over HTTPS, and access
              to them is restricted to the systems that generate your readings.
              Birth profiles and reading history are retained for the life of your
              account.
            </p>

            <h2>Your rights and data deletion</h2>
            <p>
              You may request access to, correction of, or deletion of your
              personal data at any time. To delete your account and all associated
              data — birth profiles, charts, family member profiles, and reading
              history — email <a href="mailto:privacy@vinaadi.com" className="cl-trust-link">privacy@vinaadi.com</a> or
              use the contact option in your dashboard settings. We action deletion
              requests promptly and confirm once complete.
            </p>

            <h2>Cookies and analytics</h2>
            <p>
              Vinaadi uses a session cookie for authentication. For product
              analytics we use PostHog, configured in a privacy-respecting way: it
              stores a first-party identifier in your browser&apos;s local storage
              (not a tracking cookie), is hosted in the EU, and honours your
              browser&apos;s &quot;Do Not Track&quot; setting. We only record a
              small set of named events — such as a page view, generating a chart,
              or submitting feedback — to understand aggregate usage. We never send
              your birth details, name, email, or the content you type to
              analytics, and we do not use advertising trackers or behavioural
              profiling cookies.
            </p>

            <h2>Astrology disclaimer</h2>
            <p>
              Vinaadi provides Jothida-based guidance. Astrology is a traditional
              belief system, not a science. Nothing in Vinaadi constitutes medical,
              legal, or financial advice. For decisions in those areas, consult a
              qualified professional.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy questions or data deletion requests, contact us at{" "}
              <a href="mailto:privacy@vinaadi.com" className="cl-trust-link">privacy@vinaadi.com</a> or
              through the dashboard in your account settings.
            </p>

            <div className="cl-trust-links">
              <Link href="/terms" className="cl-trust-link">Terms of Service →</Link>
              <Link href="/trust/methodology" className="cl-trust-link">Our Methodology →</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
