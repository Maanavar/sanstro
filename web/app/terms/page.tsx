import type { Metadata } from "next";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export const metadata: Metadata = {
  title: "Terms of Service — Vinaadi",
  description: "Terms governing use of the Vinaadi Tamil astrology assistant.",
  alternates: { canonical: "https://vinaadi.com/terms" },
  robots: { index: true, follow: false },
  openGraph: {
    title: "Terms of Service - Vinaadi",
    description: "Terms governing use of the Vinaadi Tamil astrology assistant.",
    url: "https://vinaadi.com/terms",
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
    title: "Terms of Service - Vinaadi",
    description: "Terms governing use of the Vinaadi Tamil astrology assistant.",
    images: ["/brand/vinaadi-og-image.png"],
  },
};


export default function TermsPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">Legal</p>
            <h1 className="cl-trust-h1">Terms of Service</h1>
            <p className="cl-trust-sub">Last updated: June 2026</p>
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-trust-prose">

            <h2>Acceptance of terms</h2>
            <p>
              By creating an account and using Vinaadi, you agree to these terms.
              If you do not agree, please do not use the service.
            </p>

            <h2>Service description</h2>
            <p>
              Vinaadi is a Tamil astrology assistant that provides Thirukanitham-based
              daily guidance, porutham compatibility analysis, jadhagam (birth chart)
              generation, panchangam planning, and related astrological tools. The
              service is for personal planning and reflection purposes.
            </p>

            <h2>Nature of guidance</h2>
            <p>
              Vinaadi provides Jothida-based interpretations rooted in Tamil
              astrological tradition. Astrology is a belief system and cultural
              practice, not a predictive science. Vinaadi&apos;s readings are
              intended to support reflection and planning — not to replace
              professional medical, legal, financial, or psychological advice.
              Users should exercise their own judgment in all consequential decisions.
            </p>

            <h2>Account and data</h2>
            <p>
              You are responsible for maintaining the security of your account
              credentials. Birth profiles you create belong to you. Vinaadi does
              not sell or share your personal data. See our{" "}
              <Link href="/privacy" className="cl-inline-link">Privacy Policy</Link>{" "}
              for full details.
            </p>

            <h2>Acceptable use</h2>
            <p>
              You may use Vinaadi for personal, non-commercial astrology planning.
              You may not attempt to reverse-engineer, scrape, or abuse the service.
              You may not use Vinaadi to generate content intended to mislead or
              harm others.
            </p>

            <h2>Open beta, free access &amp; future plans</h2>
            <p>
              Vinaadi is currently in open beta. All features are provided free of
              charge during this period while we refine the product. Features may
              change, and we reserve the right to modify, pause, or discontinue the
              service with reasonable notice. When we introduce paid subscription
              plans for the full version, we will give existing users advance notice
              before any feature becomes paid, and your existing data and readings
              will carry over. See our <Link href="/beta" className="cl-inline-link">beta page</Link> for
              details.
            </p>

            <h2>Beta feedback &amp; reviewer recognition</h2>
            <p>
              Feedback and reviews you submit may be used to improve the service
              and, where you have indicated, may be quoted or featured. As a
              thank-you, our most helpful reviewers may, at our sole discretion,
              receive extended free access. This is a discretionary recognition,
              not a guaranteed reward or contractual entitlement, and may be changed
              or withdrawn at any time.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              Vinaadi is provided as-is. We are not liable for decisions made
              based on astrological guidance. The service makes no guarantees
              about the accuracy, completeness, or fitness of astrological
              readings for any specific purpose.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these terms may be directed through your account
              settings or the contact information provided in the dashboard.
            </p>

            <div className="cl-trust-links">
              <Link href="/privacy" className="cl-trust-link">Privacy Policy →</Link>
              <Link href="/trust/methodology" className="cl-trust-link">Our Methodology →</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
