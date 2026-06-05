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
            <p className="cl-trust-sub">Last updated: June 2026</p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-trust-prose">

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
              astrological readings — daily guidance scores, dasha periods, transit
              positions, panchangam timings, porutham results, and jadhagam charts.
              We do not sell, share, or transfer your personal data to third parties
              for marketing purposes.
            </p>

            <h2>Data storage</h2>
            <p>
              Your data is stored on secured servers. Birth profiles and reading
              history are retained for the life of your account. You may delete
              your account and all associated data at any time by contacting us.
            </p>

            <h2>Cookies and analytics</h2>
            <p>
              Vinaadi uses session cookies for authentication. We may use
              privacy-respecting analytics to understand aggregate usage patterns.
              We do not use advertising trackers or behavioural profiling cookies.
            </p>

            <h2>Astrology disclaimer</h2>
            <p>
              Vinaadi provides Jyotish-based guidance. Astrology is a traditional
              belief system, not a science. Nothing in Vinaadi constitutes medical,
              legal, or financial advice. For decisions in those areas, consult a
              qualified professional.
            </p>

            <h2>Contact</h2>
            <p>
              For privacy questions or data deletion requests, please contact us
              through the dashboard or email listed in your account settings.
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
