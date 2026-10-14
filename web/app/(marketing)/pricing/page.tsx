import type { Metadata } from "next";
import { LocalizedLink as Link } from "@/components/localized-link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { PricingPlans } from "@/components/pricing-plans";
import { GooglePlayBadge } from "@/components/store-badges";
import { JsonLd, faqPageFromPairs } from "@/lib/json-ld";
import { withTamilTwin } from "@/lib/localized-metadata";
import { getServerLang } from "@/lib/server-lang";
import { OPEN_BETA, PPU_REPORT_PRODUCTS, SUBSCRIPTION_PLANS, TIER_LIMITS } from "@vinaadi/shared/constants";

const EN_METADATA: Metadata = {
  title: "Pricing",
  description: "Compare Vinaadi guest, free, and premium access. See plan pricing, included features, and how subscriptions fit alongside report purchases.",
  alternates: { canonical: "https://vinaadi.com/pricing" },
};

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/pricing");
}

const oneOffReports = [
  PPU_REPORT_PRODUCTS.SNAPSHOT_1PAGE,
  PPU_REPORT_PRODUCTS.STANDARD_3PAGE,
  PPU_REPORT_PRODUCTS.DETAILED_5PAGE,
  PPU_REPORT_PRODUCTS.PORTRAIT_10PAGE,
];

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

type Lang = "en" | "ta";

/** The comparison table. Every cell in both languages, so the two cannot drift. */
function featureRows(L: (en: string, ta: string) => string) {
  const r = TIER_LIMITS.registered;
  const p = TIER_LIMITS.premium;
  const g = TIER_LIMITS.guest;
  return [
    {
      label: L("Today access", "இன்றைய அணுகல்"),
      guest: L("Rasi palan + public panchangam", "ராசி பலன் + பொது பஞ்சாங்கம்"),
      registered: L("Chart-personalised daily guidance", "ஜாதகம் சார்ந்த தினசரி வழிகாட்டுதல்"),
      premium: L("Full personalised daily guidance", "முழுமையான தனிப்பயன் தினசரி வழிகாட்டுதல்"),
    },
    {
      label: L("Birth profiles", "பிறப்பு சுயவிவரங்கள்"),
      guest: L("No saved profiles", "சேமிக்கப்பட்ட சுயவிவரங்கள் இல்லை"),
      registered: L(`${r.birthProfilesMax} saved profiles`, `${r.birthProfilesMax} சேமிக்கப்பட்ட சுயவிவரங்கள்`),
      premium: L("Unlimited saved profiles", "வரம்பற்ற சுயவிவரங்களைச் சேமிக்கலாம்"),
    },
    {
      label: L("Family vault", "குடும்ப Vault"),
      guest: L("Add with a free account", "இலவசக் கணக்குடன் சேர்க்கலாம்"),
      registered: L(`${r.familyVaultProfilesMax} family profile`, `${r.familyVaultProfilesMax} குடும்பச் சுயவிவரம்`),
      premium: L(`${p.familyVaultProfilesMax} family profiles`, `${p.familyVaultProfilesMax} குடும்பச் சுயவிவரங்கள்`),
    },
    {
      label: L("Dasha access", "தசா அணுகல்"),
      guest: L("Free account unlocks this", "இலவசக் கணக்கு இதைத் திறக்கும்"),
      registered: L("Current period only", "நடப்புக் காலம் மட்டும்"),
      premium: L("Full timeline + sub-periods", "முழுக் காலவரிசை + உப தசைகள்"),
    },
    {
      label: "Ask Vinaadi",
      guest: L(`${g.askVinaadiDailyLimit} questions per day`, `நாளொன்றுக்கு ${g.askVinaadiDailyLimit} கேள்விகள்`),
      registered: L(`${r.askVinaadiDailyLimit} questions per day`, `நாளொன்றுக்கு ${r.askVinaadiDailyLimit} கேள்விகள்`),
      premium: L(`${p.askVinaadiMonthlyLimit} questions per month`, `மாதத்திற்கு ${p.askVinaadiMonthlyLimit} கேள்விகள்`),
    },
    {
      label: L("Advanced reports", "மேம்பட்ட அறிக்கைகள்"),
      guest: L("Sample preview", "மாதிரிக் காட்சி"),
      registered: L("Pay per report", "அறிக்கைக்கு ஏற்பக் கட்டணம்"),
      premium: L(`${p.detailedReportsMonthlyIncluded} detailed reports / month`, `மாதம் ${p.detailedReportsMonthlyIncluded} விரிவான அறிக்கைகள்`),
    },
    {
      label: L("Varshaphala + Vargas", "வருஷபலன் + வர்கங்கள்"),
      guest: L("Unlocks with Premium", "பிரீமியத்தில் திறக்கும்"),
      registered: L("Unlocks with Premium", "பிரீமியத்தில் திறக்கும்"),
      premium: L("Included", "உள்ளடங்கும்"),
    },
    {
      label: L("Journal + streaks", "நாட்குறிப்பு + தொடர்நாட்கள்"),
      guest: L("Free with any account", "எந்தக் கணக்குடனும் இலவசம்"),
      registered: L("Included", "உள்ளடங்கும்"),
      premium: L("Included", "உள்ளடங்கும்"),
    },
  ];
}

// During the open beta nobody is billed, so the billing FAQ answers the question
// a beta visitor actually has; the Play Store cancellation answer returns with
// payments.
function faqs(L: (en: string, ta: string) => string) {
  const billingFaq = OPEN_BETA
    ? {
        q: L("Do I pay anything during the beta?", "பீட்டா காலத்தில் ஏதேனும் கட்டணம் உண்டா?"),
        a: L(
          "No. Every feature is free while Vinaadi is in open beta. The prices on this page are what the plans will cost after launch, and we will give notice before anything changes.",
          "இல்லை. Vinaadi திறந்த பீட்டாவில் இருக்கும் வரை அனைத்து வசதிகளும் இலவசம். இந்தப் பக்கத்தில் உள்ள விலைகள் அறிமுகத்திற்குப் பிறகான கட்டணங்கள்; எதையும் மாற்றும் முன் முன்கூட்டியே தெரிவிப்போம்.",
        ),
      }
    : {
        q: L("Can I cancel?", "ரத்து செய்யலாமா?"),
        a: L(
          "Yes. Premium is managed in the Play Store and follows the platform's cancellation rules — cancel any time and keep access until the period ends.",
          "ஆம். பிரீமியம் Play Store மூலம் நிர்வகிக்கப்படுகிறது; அதன் ரத்து விதிகளைப் பின்பற்றும் — எப்போது வேண்டுமானாலும் ரத்து செய்யலாம், காலம் முடியும் வரை அணுகல் தொடரும்.",
        ),
      };
  return [
    {
      q: L("What is Thirukanitham?", "திருக்கணிதம் என்றால் என்ன?"),
      a: L(
        "It is the Tamil astronomical calculation tradition Vinaadi uses for panchangam, timing windows, and sidereal chart work.",
        "பஞ்சாங்கம், நேரக் கணிப்புகள், நிரயன ஜாதகக் கணிப்புகளுக்கு Vinaadi பயன்படுத்தும் தமிழ் வானியல் கணிதப் பாரம்பரியம் இது.",
      ),
    },
    {
      q: L("Is this the same as Western astrology?", "இது மேற்கத்திய ஜோதிடம் போன்றதா?"),
      a: L(
        "No. Vinaadi follows Tamil jyothidam with sidereal zodiac logic, dashas, panchangam, and nakshatra-based timing.",
        "இல்லை. Vinaadi தமிழ் ஜோதிடத்தைப் பின்பற்றுகிறது — நிரயன ராசி முறை, தசைகள், பஞ்சாங்கம், நட்சத்திர அடிப்படையிலான நேரக் கணிப்பு.",
      ),
    },
    billingFaq,
    {
      q: L("Does this app use a lot of data?", "இந்த ஆப் அதிக டேட்டா பயன்படுத்துமா?"),
      a: L(
        "No. There is no video and no large downloads — Vinaadi is built to load quickly and work smoothly even on a slow or limited connection.",
        "இல்லை. வீடியோ இல்லை, பெரிய பதிவிறக்கங்களும் இல்லை — மெதுவான அல்லது குறைந்த இணைப்பிலும் விரைவாகவும் சீராகவும் இயங்கும்படி Vinaadi உருவாக்கப்பட்டுள்ளது.",
      ),
    },
  ];
}

export default async function PricingPage() {
  const lang: Lang = await getServerLang();
  const L = (en: string, ta: string) => (lang === "ta" ? ta : en);
  const rows = featureRows(L);
  const faqList = faqs(L);
  // The FAQ printed below is the FAQ marked up, in each language.
  const faqEn = faqs((en) => en);
  const faqTa = faqs((_en, ta) => ta);
  const trialDays = SUBSCRIPTION_PLANS.monthly.trialDays;

  return (
    <div className="clarity-shell">
      <JsonLd en={faqPageFromPairs(faqEn)} ta={faqPageFromPairs(faqTa)} />
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">{L("Pricing", "விலை")}</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "18ch" }}>
              {L(
                "Clear access levels for guests, free members, and premium families.",
                "விருந்தினர்கள், இலவச உறுப்பினர்கள், பிரீமியம் குடும்பங்களுக்கான தெளிவான அணுகல் நிலைகள்.",
              )}
            </h1>
            <p className="cl-pub-lead" style={{ maxWidth: "66ch" }}>
              {L(
                "Vinaadi keeps the public experience open, then adds chart depth, family tools, and premium timing features as you move deeper into the product.",
                "Vinaadi பொது அனுபவத்தைத் திறந்தே வைத்திருக்கிறது; நீங்கள் ஆழமாகச் செல்லச் செல்ல ஜாதக ஆழம், குடும்பக் கருவிகள், பிரீமியம் நேரக் கணிப்பு வசதிகள் சேர்கின்றன.",
              )}
            </p>
            {OPEN_BETA && (
              <p
                role="note"
                style={{ maxWidth: "66ch", margin: "18px 0 0", padding: "14px 18px", borderRadius: "12px", background: "var(--cl-brand-tint)", border: "1px solid var(--cl-border)", color: "var(--cl-ink)", lineHeight: 1.6 }}
              >
                {lang === "ta" ? (
                  <>
                    <strong>திறந்த பீட்டா — இப்போது அனைத்தும் இலவசம்.</strong> Vinaadi-யைச் செம்மைப்படுத்தும் காலத்தில் இலவசக் கணக்கு அனைத்துப் பிரீமியம் வசதிகளையும் தரும். கீழே உள்ள விலைகள் அறிமுகத்திற்குப் பிறகான கட்டணங்கள்; எதையும் மாற்றும் முன் <Link href="/beta">முன்கூட்டியே தெரிவிப்போம்</Link>.
                  </>
                ) : (
                  <>
                    <strong>Open beta — everything is free right now.</strong> A free account gets every Premium feature while we refine Vinaadi. The prices below are what the plans will cost after launch; <Link href="/beta">we will give notice</Link> before anything changes.
                  </>
                )}
              </p>
            )}
          </div>
        </section>

        <section style={{ paddingBottom: "72px" }}>
          <div className="cl-container" style={{ display: "grid", gap: "24px" }}>
            <PricingPlans />

            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--cl-border)" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--cl-ink)" }}>{L("Feature comparison", "வசதி ஒப்பீடு")}</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
                  <caption style={srOnly}>
                    {L(
                      "Feature availability across the Guest, Registered, and Premium plans.",
                      "விருந்தினர், பதிவுசெய்தவர், பிரீமியம் திட்டங்களில் வசதிகளின் கிடைப்பு.",
                    )}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{L("Feature", "வசதி")}</th>
                      <th scope="col" style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{L("Guest", "விருந்தினர்")}</th>
                      <th scope="col" style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{L("Registered", "பதிவுசெய்தவர்")}</th>
                      <th scope="col" style={{ textAlign: "left", padding: "14px 24px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{L("Premium", "பிரீமியம்")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
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
                <h2 style={{ margin: "0 0 12px", fontSize: "1.2rem", color: "var(--cl-ink)" }}>{L("Billing and currencies", "கட்டணமும் நாணயங்களும்")}</h2>
                <p style={{ margin: "0 0 10px", color: "var(--cl-muted)", lineHeight: 1.65 }}>
                  {L(
                    `Premium is ₹${SUBSCRIPTION_PLANS.monthly.priceINR}/month or ₹${SUBSCRIPTION_PLANS.annual.priceINR}/year, and every subscription starts with a ${trialDays}-day free trial. Cancel any time — there is no lock-in.`,
                    `பிரீமியம் மாதத்திற்கு ₹${SUBSCRIPTION_PLANS.monthly.priceINR} அல்லது ஆண்டுக்கு ₹${SUBSCRIPTION_PLANS.annual.priceINR}; ஒவ்வொரு சந்தாவும் ${trialDays} நாள் இலவச சோதனையுடன் தொடங்கும். எப்போது வேண்டுமானாலும் ரத்து செய்யலாம் — கட்டுப்பாடு எதுவும் இல்லை.`,
                  )}
                </p>
                <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.65 }}>
                  {L(
                    "Subscriptions are billed in Indian Rupees today. Support for more currencies — USD, SGD, MYR, and GBP — is on the way for members living outside India.",
                    "சந்தா தற்போது இந்திய ரூபாயில் வசூலிக்கப்படுகிறது. இந்தியாவுக்கு வெளியே வசிக்கும் உறுப்பினர்களுக்காக USD, SGD, MYR, GBP உள்ளிட்ட நாணயங்களுக்கான ஆதரவு விரைவில் வரும்.",
                  )}
                </p>
              </div>

              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: "1.2rem", color: "var(--cl-ink)" }}>{L("One-time report options", "ஒருமுறை வாங்கும் அறிக்கைகள்")}</h2>
                <div style={{ display: "grid", gap: "10px" }}>
                  {oneOffReports.map((report) => (
                    <div key={report.rcProductId} style={{ padding: "12px 14px", borderRadius: "12px", background: "var(--cl-bg-2)", border: "1px solid var(--cl-border)" }}>
                      <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--cl-ink)" }}>{report.label[lang]} — ₹{report.priceINR}</p>
                      <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.55 }}>{report.description[lang]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "16px", padding: "24px" }}>
                <h2 style={{ margin: "0 0 12px", fontSize: "1.2rem", color: "var(--cl-ink)" }}>{L("FAQ", "கேள்விகள்")}</h2>
                <div style={{ display: "grid", gap: "8px" }}>
                  {faqList.map((item) => (
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
                <h2 style={{ margin: "0 0 10px", fontSize: "1.25rem" }}>
                  {OPEN_BETA
                    ? L("Create a free account — every feature is unlocked during the beta.", "இலவசக் கணக்கை உருவாக்குங்கள் — பீட்டா காலத்தில் அனைத்து வசதிகளும் திறந்திருக்கும்.")
                    : L("Start with free access, upgrade when the chart depth matters.", "இலவசமாகத் தொடங்குங்கள்; ஜாதக ஆழம் தேவைப்படும்போது மேம்படுத்துங்கள்.")}
                </h2>
                <p style={{ margin: "0 0 18px", lineHeight: 1.7, opacity: 0.82 }}>
                  {OPEN_BETA
                    ? L(
                        "Guests can explore public rasi palan and panchangam. A free account opens saved charts, family timing, and the full dasha and timing stack while the beta runs.",
                        "விருந்தினர்கள் பொது ராசி பலன், பஞ்சாங்கம் பார்க்கலாம். பீட்டா நடக்கும் வரை இலவசக் கணக்கு சேமித்த ஜாதகங்கள், குடும்ப நேரக் கணிப்பு, முழு தசா மற்றும் நேரக் கணிப்பு வசதிகளைத் திறக்கும்.",
                      )
                    : L(
                        "Guests can explore public rasi palan and panchangam. A free account unlocks saved charts. Premium opens the full timing stack.",
                        "விருந்தினர்கள் பொது ராசி பலன், பஞ்சாங்கம் பார்க்கலாம். இலவசக் கணக்கு சேமித்த ஜாதகங்களைத் திறக்கும். பிரீமியம் முழு நேரக் கணிப்பு வசதிகளைத் திறக்கும்.",
                      )}
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link href="/login" style={{ ...pillLink, background: "var(--cl-bg)", color: "var(--cl-ink)" }}>{L("Create free account", "இலவசக் கணக்கை உருவாக்குங்கள்")}</Link>
                  <Link href="/tools/indraiya-rasipalan" style={{ ...pillLink, border: "1px solid color-mix(in srgb, var(--cl-bg) 28%, transparent)", color: "var(--cl-bg)" }}>{L("Try guest mode", "விருந்தினராக முயலுங்கள்")}</Link>
                </div>
              </div>
            </div>

            {/* ── Get Premium: download the app ── (after the beta; there is
                nothing to buy while it runs, and no store listing may exist yet) */}
            {!OPEN_BETA && (
            <div style={{ background: "linear-gradient(135deg, var(--cl-ink) 0%, var(--cl-ink-2) 60%, var(--cl-ink-2) 100%)", borderRadius: "20px", padding: "40px 32px", marginTop: "8px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "32px", alignItems: "center", color: "var(--cl-bg)" }}>
              <div>
                <p style={{ margin: "0 0 8px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cl-accent-soft)" }}>{L("Ready for Premium?", "பிரீமியத்துக்குத் தயாரா?")}</p>
                <h2 style={{ margin: "0 0 12px", fontSize: "clamp(1.4rem, 2.8vw, 2rem)", lineHeight: 1.2 }}>{L("Subscribe in the Vinaadi app.", "Vinaadi ஆப்பில் சந்தா செலுத்துங்கள்.")}</h2>
                <p style={{ margin: "0 0 6px", opacity: 0.8, lineHeight: 1.65, fontSize: "0.9375rem" }}>
                  {lang === "ta" ? (
                    <>பிரீமியம் Google Play மூலம் நிர்வகிக்கப்படுகிறது. ஆப்பைப் பதிவிறக்கி உங்கள் <strong>{trialDays} நாள் இலவச சோதனையைத்</strong> தொடங்குங்கள் — எப்போது வேண்டுமானாலும் ரத்து செய்யலாம்.</>
                  ) : (
                    <>Premium is managed through Google Play. Download the app to start your <strong>{trialDays}-day free trial</strong> — cancel any time.</>
                  )}
                </p>
                <p style={{ margin: 0, opacity: 0.6, fontSize: "0.8125rem", lineHeight: 1.55 }}>
                  {L(
                    "Already subscribed on mobile? Log in here — your premium access syncs automatically.",
                    "ஏற்கெனவே மொபைலில் சந்தா செலுத்தியுள்ளீர்களா? இங்கே உள்நுழையுங்கள் — உங்கள் பிரீமியம் அணுகல் தானாக ஒத்திசையும்.",
                  )}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <GooglePlayBadge />
                <Link
                  href="/login"
                  style={{ ...pillLink, border: "1px solid color-mix(in srgb, var(--cl-bg) 28%, transparent)", color: "var(--cl-bg)", fontWeight: 600, fontSize: "0.875rem" }}
                >
                  {L("Already subscribed? Log in →", "ஏற்கெனவே சந்தாதாரரா? உள்நுழையுங்கள் →")}
                </Link>
              </div>
            </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
