import type { Metadata } from "next";
import { LocalizedLink as Link } from "@/components/localized-link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { withTamilTwin } from "@/lib/localized-metadata";
import { getServerLang } from "@/lib/server-lang";

const EN_METADATA: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the Vinaadi Tamil astrology assistant.",
  alternates: { canonical: "https://vinaadi.com/terms" },
  robots: { index: true, follow: false },
  openGraph: {
    title: "Terms of Service",
    description: "Terms governing use of the Vinaadi Tamil astrology assistant.",
    url: "https://vinaadi.com/terms",
    images: [
      {
        url: "/brand/vinaadi-og-image.jpg",
        width: 1792,
        height: 612,
        alt: "Vinaadi - Your Cosmic Copilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service",
    description: "Terms governing use of the Vinaadi Tamil astrology assistant.",
    images: ["/brand/vinaadi-og-image.jpg"],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/terms");
}

export default async function TermsPage() {
  const ta = (await getServerLang()) === "ta";

  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">{ta ? "சட்டம்" : "Legal"}</p>
            <h1 className="cl-trust-h1">{ta ? "பயன்பாட்டு விதிகள்" : "Terms of Service"}</h1>
            <p className="cl-trust-sub">{ta ? "கடைசியாகப் புதுப்பித்தது: ஜூன் 2026" : "Last updated: June 2026"}</p>
            {ta && (
              // A translation of a legal text is a convenience, not the text.
              <p role="note" className="cl-trust-sub">
                இது வசதிக்கான தமிழ் மொழிபெயர்ப்பு. முரண்பாடு இருந்தால் ஆங்கிலப் பதிப்பே செல்லுபடியாகும் (மேலே உள்ள மொழி மாற்றியில் English-ஐத் தேர்ந்தெடுக்கவும்).
              </p>
            )}
          </div>
        </section>

        <section className="cl-trust-body">
          <div className="cl-container cl-trust-prose">

            <h2>{ta ? "விதிகளை ஏற்றல்" : "Acceptance of terms"}</h2>
            <p>
              {ta
                ? "கணக்கை உருவாக்கி Vinaadi-யைப் பயன்படுத்துவதன் மூலம் இந்த விதிகளுக்கு நீங்கள் ஒப்புக்கொள்கிறீர்கள். ஒப்புக்கொள்ளவில்லை என்றால், தயவுசெய்து சேவையைப் பயன்படுத்த வேண்டாம்."
                : "By creating an account and using Vinaadi, you agree to these terms. If you do not agree, please do not use the service."}
            </p>

            <h2>{ta ? "சேவை விவரம்" : "Service description"}</h2>
            <p>
              {ta
                ? "Vinaadi ஒரு தமிழ் ஜோதிட உதவியாளர்; திருக்கணித அடிப்படையிலான தினசரி வழிகாட்டுதல், பொருத்தப் பகுப்பாய்வு, ஜாதகம் (பிறப்புக் கட்டம்) உருவாக்கம், பஞ்சாங்கத் திட்டமிடல், தொடர்புடைய ஜோதிடக் கருவிகளை வழங்குகிறது. இந்தச் சேவை தனிப்பட்ட திட்டமிடலுக்கும் சிந்தனைக்குமானது."
                : "Vinaadi is a Tamil astrology assistant that provides Thirukanitham-based daily guidance, porutham compatibility analysis, jadhagam (birth chart) generation, panchangam planning, and related astrological tools. The service is for personal planning and reflection purposes."}
            </p>

            <h2>{ta ? "வழிகாட்டுதலின் தன்மை" : "Nature of guidance"}</h2>
            <p>
              {ta
                ? "Vinaadi தமிழ் ஜோதிடப் பாரம்பரியத்தில் வேரூன்றிய ஜோதிட விளக்கங்களை வழங்குகிறது. ஜோதிடம் ஒரு நம்பிக்கை முறையும் பண்பாட்டு நடைமுறையும்; முன்கணிக்கும் அறிவியல் அல்ல. Vinaadi-யின் பலன்கள் சிந்தனைக்கும் திட்டமிடலுக்கும் துணையாக இருக்க உருவாக்கப்பட்டவை — மருத்துவ, சட்ட, நிதி, உளவியல் ஆலோசனைக்கு மாற்றாக அல்ல. விளைவுகள் மிக்க அனைத்து முடிவுகளிலும் பயனர்கள் தங்கள் சொந்த விவேகத்தைப் பயன்படுத்த வேண்டும்."
                : "Vinaadi provides Jothida-based interpretations rooted in Tamil astrological tradition. Astrology is a belief system and cultural practice, not a predictive science. Vinaadi's readings are intended to support reflection and planning — not to replace professional medical, legal, financial, or psychological advice. Users should exercise their own judgment in all consequential decisions."}
            </p>

            <h2>{ta ? "கணக்கும் தரவும்" : "Account and data"}</h2>
            {ta ? (
              <p>
                உங்கள் கணக்கின் சான்றுகளைப் பாதுகாப்பது உங்கள் பொறுப்பு. நீங்கள் உருவாக்கும் பிறப்புச் சுயவிவரங்கள் உங்களுக்கே உரியவை. Vinaadi உங்கள் தனிப்பட்ட தரவை விற்கவோ பகிரவோ மாட்டாது.
                முழு விவரங்களுக்கு எங்கள் <Link href="/privacy" className="cl-inline-link">தனியுரிமைக் கொள்கையைப்</Link> பாருங்கள்.
              </p>
            ) : (
              <p>
                You are responsible for maintaining the security of your account
                credentials. Birth profiles you create belong to you. Vinaadi does
                not sell or share your personal data. See our{" "}
                <Link href="/privacy" className="cl-inline-link">Privacy Policy</Link>{" "}
                for full details.
              </p>
            )}

            <h2>{ta ? "ஏற்கத்தக்க பயன்பாடு" : "Acceptable use"}</h2>
            <p>
              {ta
                ? "தனிப்பட்ட, வணிகமற்ற ஜோதிடத் திட்டமிடலுக்கு Vinaadi-யைப் பயன்படுத்தலாம். சேவையை மறுபொறியியல் செய்யவோ, தரவைத் திரட்டவோ (scrape), தவறாகப் பயன்படுத்தவோ முயலக்கூடாது. பிறரை ஏமாற்ற அல்லது பாதிக்கும் நோக்கத்திலான உள்ளடக்கத்தை உருவாக்க Vinaadi-யைப் பயன்படுத்தக்கூடாது."
                : "You may use Vinaadi for personal, non-commercial astrology planning. You may not attempt to reverse-engineer, scrape, or abuse the service. You may not use Vinaadi to generate content intended to mislead or harm others."}
            </p>

            <h2>{ta ? "திறந்த பீட்டா, இலவச அணுகல் மற்றும் எதிர்காலத் திட்டங்கள்" : "Open beta, free access & future plans"}</h2>
            {ta ? (
              <p>
                Vinaadi தற்போது திறந்த பீட்டாவில் உள்ளது. தயாரிப்பைச் செம்மைப்படுத்தும் இந்தக் காலத்தில் அனைத்து வசதிகளும் கட்டணமின்றி வழங்கப்படுகின்றன. வசதிகள் மாறலாம்;
                நியாயமான முன்னறிவிப்புடன் சேவையை மாற்றவோ, நிறுத்தி வைக்கவோ, நிறுத்தவோ எங்களுக்கு உரிமை உண்டு. முழுப் பதிப்பிற்கான கட்டணச் சந்தாத் திட்டங்களை அறிமுகப்படுத்தும்போது,
                எந்த வசதியும் கட்டணத்துக்கு மாறும் முன் ஏற்கெனவே உள்ள பயனர்களுக்கு முன்கூட்டியே அறிவிப்போம்; உங்கள் தற்போதைய தரவும் பலன்களும் தொடர்ந்து இருக்கும். விவரங்களுக்கு எங்கள்{" "}
                <Link href="/beta" className="cl-inline-link">பீட்டா பக்கத்தைப்</Link> பாருங்கள்.
              </p>
            ) : (
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
            )}

            <h2>{ta ? "பீட்டா கருத்துகளும் மதிப்பாய்வாளர் பாராட்டும்" : "Beta feedback & reviewer recognition"}</h2>
            <p>
              {ta
                ? "நீங்கள் சமர்ப்பிக்கும் கருத்துகளும் மதிப்புரைகளும் சேவையை மேம்படுத்தப் பயன்படுத்தப்படலாம்; நீங்கள் குறிப்பிட்டிருந்தால் மேற்கோளாகக் காட்டவோ சிறப்பிக்கவோ படலாம். நன்றியின் அடையாளமாக, மிகவும் உதவிய மதிப்பாய்வாளர்களுக்கு எங்கள் முழு விருப்பத்தின்படி நீட்டிக்கப்பட்ட இலவச அணுகல் வழங்கப்படலாம். இது விருப்புரிமைப் பாராட்டு மட்டுமே; உறுதியான வெகுமதியோ ஒப்பந்த உரிமையோ அல்ல; எப்போது வேண்டுமானாலும் மாற்றப்படலாம் அல்லது திரும்பப் பெறப்படலாம்."
                : "Feedback and reviews you submit may be used to improve the service and, where you have indicated, may be quoted or featured. As a thank-you, our most helpful reviewers may, at our sole discretion, receive extended free access. This is a discretionary recognition, not a guaranteed reward or contractual entitlement, and may be changed or withdrawn at any time."}
            </p>

            <h2>{ta ? "பொறுப்பு வரம்பு" : "Limitation of liability"}</h2>
            <p>
              {ta
                ? "Vinaadi உள்ளபடியே (as-is) வழங்கப்படுகிறது. ஜோதிட வழிகாட்டுதலின் அடிப்படையில் எடுக்கப்படும் முடிவுகளுக்கு நாங்கள் பொறுப்பல்ல. ஜோதிடப் பலன்களின் துல்லியம், முழுமை, குறிப்பிட்ட நோக்கத்துக்கான பொருத்தம் ஆகியவற்றுக்கு இந்தச் சேவை எந்த உத்தரவாதமும் அளிக்காது."
                : "Vinaadi is provided as-is. We are not liable for decisions made based on astrological guidance. The service makes no guarantees about the accuracy, completeness, or fitness of astrological readings for any specific purpose."}
            </p>

            <h2>{ta ? "தொடர்பு" : "Contact"}</h2>
            <p>
              {ta
                ? "இந்த விதிகள் பற்றிய கேள்விகளை உங்கள் கணக்கு அமைப்புகள் வழியாக அல்லது டாஷ்போர்டில் வழங்கப்பட்டுள்ள தொடர்பு விவரங்கள் மூலம் தெரிவிக்கலாம்."
                : "Questions about these terms may be directed through your account settings or the contact information provided in the dashboard."}
            </p>

            <div className="cl-trust-links">
              <Link href="/privacy" className="cl-trust-link">{ta ? "தனியுரிமைக் கொள்கை →" : "Privacy Policy →"}</Link>
              <Link href="/trust/methodology" className="cl-trust-link">{ta ? "எங்கள் வழிமுறை →" : "Our Methodology →"}</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
