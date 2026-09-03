import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { PricingPlans } from "@/components/pricing-plans";
import { GooglePlayBadge } from "@/components/store-badges";
import { PPU_REPORT_PRODUCTS, SUBSCRIPTION_PLANS, TIER_LIMITS } from "@vinaadi/shared/constants";

export const metadata: Metadata = {
  title: "Pricing | Vinaadi",
  description: "Compare Vinaadi guest, free, and premium access. See plan pricing, included features, and how subscriptions fit alongside report purchases.",
  alternates: { canonical: "https://vinaadi.com/pricing" },
};

const featureRows = [
  {
    label: "Today access",
    guest: "Rasi palan + public panchangam",
    registered: "Chart-personalised daily guidance",
    premium: "Full personalised daily guidance",
  },
  {
    label: "Birth profiles",
    guest: "No saved profiles",
    registered: `${TIER_LIMITS.registered.birthProfilesMax} saved profiles`,
    premium: "Unlimited saved profiles",
  },
  {
    label: "Family vault",
    guest: "Add with a free account",
    registered: `${TIER_LIMITS.registered.familyVaultProfilesMax} family profile`,
    premium: `${TIER_LIMITS.premium.familyVaultProfilesMax} family profiles`,
  },
  {
    label: "Dasha access",
    guest: "Free account unlocks this",
    registered: "Current period only",
    premium: "Full timeline + sub-periods",
  },
  {
    label: "Ask Vinaadi",
    guest: `${TIER_LIMITS.guest.askVinaadiDailyLimit} questions per day`,
    registered: `${TIER_LIMITS.registered.askVinaadiDailyLimit} questions per day`,
    premium: `${TIER_LIMITS.premium.askVinaadiMonthlyLimit} questions per month`,
  },
  {
    label: "Advanced reports",
    guest: "Sample preview",
    registered: "Pay per report",
    premium: `${TIER_LIMITS.premium.detailedReportsMonthlyIncluded} detailed reports / month`,
  },
  {
    label: "Varshaphala + Vargas",
    guest: "Unlocks with Premium",
    registered: "Unlocks with Premium",
    premium: "Included",
  },
  {
    label: "Journal + streaks",
    guest: "Free with any account",
    registered: "Included",
    premium: "Included",
  },
] as const;

const oneOffReports = [
  PPU_REPORT_PRODUCTS.SNAPSHOT_1PAGE,
  PPU_REPORT_PRODUCTS.STANDARD_3PAGE,
  PPU_REPORT_PRODUCTS.DETAILED_5PAGE,
  PPU_REPORT_PRODUCTS.PORTRAIT_10PAGE,
];

const faqs = [
  {
    q: "What is Thirukanitham?",
    a: "It is the Tamil astronomical calculation tradition Vinaadi uses for panchangam, timing windows, and sidereal chart work.",
  },
  {
    q: "Is this the same as Western astrology?",
    a: "No. Vinaadi follows Tamil jyothidam with sidereal zodiac logic, dashas, panchangam, and nakshatra-based timing.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Premium is managed in the Play Store and follows the platform's cancellation rules — cancel any time and keep access until the period ends.",
  },
  {
    q: "Does this app use a lot of data?",
    a: "No. There is no video and no large downloads — Vinaadi is built to load quickly and work smoothly even on a slow or limited connection.",
  },
] as const;

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const pillLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "44px",
  padding: "0 18px",
  borderRadius: "999px",
  textDecoration: "none",
  fontWeight: 700,
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function PricingPage() {
  return (
    <div className="clarity-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">Pricing</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "18ch" }}>
              Clear access levels for guests, free members, and premium families.
            </h1>
            <p className="cl-pub-lead" style={{ maxWidth: "66ch" }}>
              Vinaadi keeps the public experience open, then adds chart depth, family tools, and premium timing features as you move deeper into the product.
            </p>
          </div>
        </section>

        <section style={{ paddingBottom: "72px" }}>
          <div className="cl-container" style={{ display: "grid", gap: "24px" }}>
            <PricingPlans />

            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--cl-border)" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--cl-ink)" }}>Feature comparison</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
                  <caption style={srOnly}>Feature availability across the Guest, Registered, and Premium plans.</caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature</th>
                      <th scope="col" style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Guest</th>
                      <th scope="col" style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Registered</th>
                      <th scope="col" style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureRows.map((row) => (
                      <tr key={row.label}>
                        <th scope="row" style={{ textAlign: "left", padding: "16px 24px", borderTop: "1px solid var(--cl-border)", fontWeight: 700, color: "var(--cl-ink)" }}>{row.label}</th>
                        <td style={{ padding: "16px 24px", borderTop: "1px solid var(--cl-border)", color: "var(--cl-muted)" }}>{row.guest}</td>
                        <td style={{ padding: "16px 24px", borderTop: "1px solid var(--cl-border)", color: "var(--cl-muted)" }}>{row.registered}</td>
                        <td style={{ padding: "16px 24px", borderTop: "1px solid var(--cl-border)", color: "var(--cl-ink)" }}>{row.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: "1.2rem", color: "var(--cl-ink)" }}>Billing and currencies</h2>
                <p style={{ margin: "0 0 10px", color: "var(--cl-muted)", lineHeight: 1.65 }}>
                  Premium is ₹{SUBSCRIPTION_PLANS.monthly.priceINR}/month or ₹{SUBSCRIPTION_PLANS.annual.priceINR}/year, and every subscription starts with a {SUBSCRIPTION_PLANS.monthly.trialDays}-day free trial. Cancel any time — there is no lock-in.
                </p>
                <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.65 }}>
                  Subscriptions are billed in Indian Rupees today. Support for more currencies — USD, SGD, MYR, and GBP — is on the way for members living outside India.
                </p>
              </div>

              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: "1.2rem", color: "var(--cl-ink)" }}>One-time report options</h2>
                <div style={{ display: "grid", gap: "10px" }}>
                  {oneOffReports.map((report) => (
                    <div key={report.rcProductId} style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)" }}>
                      <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--cl-ink)" }}>{report.label.en} — ₹{report.priceINR}</p>
                      <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.55 }}>{report.description.en}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: "1.2rem", color: "var(--cl-ink)" }}>FAQ</h2>
                <div style={{ display: "grid", gap: "8px" }}>
                  {faqs.map((item) => (
                    <details key={item.q} style={{ borderBottom: "1px solid var(--cl-border)", paddingBottom: "8px" }}>
                      <summary style={{ cursor: "pointer", listStyle: "none", padding: "8px 0", fontWeight: 700, color: "var(--cl-ink)" }}>
                        {item.q}
                      </summary>
                      <p style={{ margin: "4px 0 8px", color: "var(--cl-muted)", lineHeight: 1.65 }}>{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>

              <div style={{ background: "linear-gradient(180deg, var(--cl-ink) 0%, var(--cl-ink-2) 100%)", borderRadius: "16px", padding: "24px", color: "var(--cl-bg)" }}>
                <h2 style={{ margin: "0 0 10px", fontSize: "1.25rem" }}>Start with free access, upgrade when the chart depth matters.</h2>
                <p style={{ margin: "0 0 18px", lineHeight: 1.7, opacity: 0.82 }}>Guests can explore public rasi palan and panchangam. A free account unlocks saved charts. Premium opens the full timing stack.</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link href="/login" style={{ ...pillLink, background: "var(--cl-bg)", color: "var(--cl-ink)" }}>Create free account</Link>
                  <Link href="/tools/indraiya-rasipalan" style={{ ...pillLink, border: "1px solid color-mix(in srgb, var(--cl-bg) 28%, transparent)", color: "var(--cl-bg)" }}>Try guest mode</Link>
                </div>
              </div>
            </div>

            {/* ── Get Premium: download the app ── */}
            <div style={{ background: "linear-gradient(135deg, var(--cl-ink) 0%, var(--cl-ink-2) 60%, var(--cl-ink-2) 100%)", borderRadius: "20px", padding: "40px 32px", marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "32px", alignItems: "center", color: "var(--cl-bg)" }}>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cl-accent-soft)" }}>Ready for Premium?</p>
                <h2 style={{ margin: "0 0 12px", fontSize: "clamp(1.4rem, 2.8vw, 2rem)", lineHeight: 1.2 }}>Subscribe in the Vinaadi app.</h2>
                <p style={{ margin: "0 0 6px", opacity: 0.8, lineHeight: 1.65, fontSize: "0.9375rem" }}>
                  Premium is managed through Google Play. Download the app to start your <strong>{SUBSCRIPTION_PLANS.monthly.trialDays}-day free trial</strong> — cancel any time.
                </p>
                <p style={{ margin: 0, opacity: 0.6, fontSize: "0.8125rem", lineHeight: 1.55 }}>
                  Already subscribed on mobile? Log in here — your premium access syncs automatically.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <GooglePlayBadge />
                <Link
                  href="/login"
                  style={{ ...pillLink, border: "1px solid color-mix(in srgb, var(--cl-bg) 28%, transparent)", color: "var(--cl-bg)", fontWeight: 600, fontSize: "0.875rem" }}
                >
                  Already subscribed? Log in →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
