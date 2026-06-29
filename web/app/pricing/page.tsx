import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
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
    guest: "Not included",
    registered: `${TIER_LIMITS.registered.familyVaultProfilesMax} family profile`,
    premium: `${TIER_LIMITS.premium.familyVaultProfilesMax} family profiles`,
  },
  {
    label: "Dasha access",
    guest: "Not included",
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
    guest: "Upgrade prompt",
    registered: "Pay per report",
    premium: `${TIER_LIMITS.premium.detailedReportsMonthlyIncluded} detailed reports / month`,
  },
  {
    label: "Varshaphala + Vargas",
    guest: "Not included",
    registered: "Not included",
    premium: "Included",
  },
  {
    label: "Journal + streaks",
    guest: "Not included",
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

export default function PricingPage() {
  return (
    <div className="clarity-shell">
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cl-muted)", fontWeight: 700 }}>Guest</p>
                <h2 style={{ margin: "0 0 8px", fontSize: "1.5rem", color: "var(--cl-ink)" }}>Free to explore</h2>
                <p style={{ margin: "0 0 12px", color: "var(--cl-muted)", lineHeight: 1.6 }}>See today&apos;s public value before creating an account.</p>
                <p style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "var(--cl-ink)" }}>INR 0</p>
              </div>

              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--cl-muted)", fontWeight: 700 }}>Registered</p>
                <h2 style={{ margin: "0 0 8px", fontSize: "1.5rem", color: "var(--cl-ink)" }}>Free account</h2>
                <p style={{ margin: "0 0 12px", color: "var(--cl-muted)", lineHeight: 1.6 }}>Unlock saved charts, journal tracking, and current dasha context.</p>
                <p style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "var(--cl-ink)" }}>INR 0</p>
              </div>

              <div style={{ background: "linear-gradient(180deg, #FFF4E6 0%, #FFF9F1 100%)", border: "1px solid #E7C39F", borderRadius: "16px", padding: "24px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A4B1F", fontWeight: 700 }}>Premium</p>
                <h2 style={{ margin: "0 0 8px", fontSize: "1.5rem", color: "#2E2118" }}>Full depth</h2>
                <p style={{ margin: "0 0 12px", color: "#6C4B32", lineHeight: 1.6 }}>For families who want unlimited chart work, richer timing tools, and deeper reports.</p>
                <p style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "#2E2118" }}>INR {SUBSCRIPTION_PLANS.monthly.priceINR}<span style={{ fontSize: "1rem", fontWeight: 600 }}> / month</span></p>
                <p style={{ margin: "8px 0 0", color: "#6C4B32", fontSize: "0.95rem" }}>or INR {SUBSCRIPTION_PLANS.annual.priceINR} / year with {SUBSCRIPTION_PLANS.annual.savingsPercent}% savings</p>
              </div>
            </div>

            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--cl-border)" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--cl-ink)" }}>Feature comparison</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature</th>
                      <th style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Guest</th>
                      <th style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Registered</th>
                      <th style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureRows.map((row) => (
                      <tr key={row.label}>
                        <td style={{ padding: "16px 24px", borderTop: "1px solid var(--cl-border)", fontWeight: 700, color: "var(--cl-ink)" }}>{row.label}</td>
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
                  Premium pricing is currently anchored to the mobile subscription catalog: INR {SUBSCRIPTION_PLANS.monthly.priceINR}/month or INR {SUBSCRIPTION_PLANS.annual.priceINR}/year after a {SUBSCRIPTION_PLANS.monthly.trialDays}-day trial.
                </p>
                <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.65 }}>
                  The web app does not yet process checkout directly in this repo. For diaspora members, billing will depend on your storefront or future web checkout currency support for INR, USD, SGD, MYR, and GBP.
                </p>
              </div>

              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: "1.2rem", color: "var(--cl-ink)" }}>One-time report options</h2>
                <div style={{ display: "grid", gap: "10px" }}>
                  {oneOffReports.map((report) => (
                    <div key={report.rcProductId} style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)" }}>
                      <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--cl-ink)" }}>{report.label.en} - INR {report.priceINR}</p>
                      <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.55 }}>{report.description.en}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: "1.2rem", color: "var(--cl-ink)" }}>FAQ</h2>
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--cl-ink)" }}>What is Thirukanitham?</p>
                    <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.65 }}>It is the Tamil astronomical calculation tradition Vinaadi uses for panchangam, timing windows, and sidereal chart work.</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--cl-ink)" }}>Is this the same as Western astrology?</p>
                    <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.65 }}>No. Vinaadi follows Tamil jyothidam with sidereal zodiac logic, dashas, panchangam, and nakshatra-based timing.</p>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--cl-ink)" }}>Can I cancel?</p>
                    <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.65 }}>Yes. Mobile subscriptions are managed in the App Store or Play Store and follow the platform&apos;s cancellation rules.</p>
                  </div>
                </div>
              </div>

              <div style={{ background: "linear-gradient(180deg, #2E2118 0%, #433126 100%)", borderRadius: "16px", padding: "24px", color: "#FFF7ED" }}>
                <h2 style={{ margin: "0 0 10px", fontSize: "1.25rem" }}>Start with free access, upgrade when the chart depth matters.</h2>
                <p style={{ margin: "0 0 18px", lineHeight: 1.7, color: "rgba(255,247,237,0.82)" }}>Guests can explore public rasi palan and panchangam. A free account unlocks saved charts. Premium opens the full timing stack.</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link href="/login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "44px", padding: "0 18px", borderRadius: "999px", background: "#FFF7ED", color: "#2E2118", textDecoration: "none", fontWeight: 700 }}>Create free account</Link>
                  <Link href="/tools/indraiya-rasipalan" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: "1px solid rgba(255,247,237,0.28)", color: "#FFF7ED", textDecoration: "none", fontWeight: 700 }}>Try guest mode</Link>
                </div>
              </div>
            </div>


          {/* ── Get Premium: Download the app ── */}
          <div style={{ background: "linear-gradient(135deg, #1A1208 0%, #2E2118 60%, #3D2B1A 100%)", borderRadius: "20px", padding: "40px 32px", marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "32px", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 8px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#C8944A" }}>Ready for Premium?</p>
              <h2 style={{ margin: "0 0 12px", fontSize: "clamp(1.4rem, 2.8vw, 2rem)", color: "#FFF7ED", lineHeight: 1.2 }}>Subscribe via the Vinaadi app.</h2>
              <p style={{ margin: "0 0 6px", color: "rgba(255,247,237,0.75)", lineHeight: 1.65, fontSize: "0.9375rem" }}>
                Premium subscriptions are managed through the iOS App Store and Google Play Store.
                Download the app to start your <strong style={{ color: "#FFF7ED" }}>7-day free trial</strong> — cancel any time.
              </p>
              <p style={{ margin: 0, color: "rgba(255,247,237,0.5)", fontSize: "0.8125rem", lineHeight: 1.55 }}>
                Already subscribed on mobile? Log in here — your premium access syncs automatically.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* iOS App Store badge — listing pending, disabled until live */}
              <div
                aria-disabled="true"
                title="App Store listing coming soon"
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: "rgba(255,247,237,0.35)", borderRadius: "12px",
                  padding: "12px 20px",
                  border: "1px solid rgba(255,247,237,0.15)",
                  opacity: 0.55, cursor: "default",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#1A1208" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: "0.625rem", color: "#6C4B32", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Download on the</p>
                  <p style={{ margin: 0, fontSize: "1rem", color: "#2E2118", fontWeight: 800, lineHeight: 1.2 }}>App Store</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.625rem", color: "#6C4B32", fontWeight: 500 }}>Coming soon</p>
                </div>
              </div>
              {/* Google Play badge */}
              <a
                href="https://play.google.com/store/apps/details?id=ai.vinaadi.app"
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: "#FFF7ED", borderRadius: "12px",
                  padding: "12px 20px", textDecoration: "none",
                  border: "1px solid rgba(255,247,237,0.15)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3.18 23.76C2.48 23.36 2 22.6 2 21.7V2.3C2 1.4 2.48.64 3.18.24L13.88 12 3.18 23.76z" fill="#EA4335"/>
                  <path d="M17.67 15.54L5.4 22.78l9.3-9.3 2.97 2.06z" fill="#FBBC05"/>
                  <path d="M21.14 10.53c.55.3.86.84.86 1.47s-.31 1.17-.86 1.47l-3.47 2.07-3.23-3.23 3.23-3.23 3.47 2.45z" fill="#4285F4"/>
                  <path d="M5.4 1.22L17.67 8.46l-2.97 2.07-9.3-9.31z" fill="#34A853"/>
                </svg>
                <div>
                  <p style={{ margin: 0, fontSize: "0.625rem", color: "#6C4B32", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Get it on</p>
                  <p style={{ margin: 0, fontSize: "1rem", color: "#2E2118", fontWeight: 800, lineHeight: 1.2 }}>Google Play</p>
                </div>
              </a>
              <Link
                href="/login"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minHeight: "44px", padding: "0 18px", borderRadius: "999px",
                  border: "1px solid rgba(255,247,237,0.28)", color: "#FFF7ED",
                  textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
                }}
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