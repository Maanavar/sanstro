import type { Metadata } from "next";
import { LocalizedLink as Link } from "@/components/localized-link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { withTamilTwin } from "@/lib/localized-metadata";
import { getServerLang } from "@/lib/server-lang";

const EN_METADATA: Metadata = {
  title: "Privacy Policy",
  description: "How Vinaadi collects, uses, and protects your personal data.",
  alternates: { canonical: "https://vinaadi.com/privacy" },
  robots: { index: true, follow: false },
  openGraph: {
    title: "Privacy Policy",
    description: "How Vinaadi collects, uses, and protects your personal data.",
    url: "https://vinaadi.com/privacy",
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
    title: "Privacy Policy",
    description: "How Vinaadi collects, uses, and protects your personal data.",
    images: ["/brand/vinaadi-og-image.jpg"],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/privacy");
}

export default async function PrivacyPage() {
  const ta = (await getServerLang()) === "ta";

  return (
    <div className="clarity-shell">
      <PublicNav />

      <main>
        <section className="cl-trust-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">{ta ? "சட்டம்" : "Legal"}</p>
            <h1 className="cl-trust-h1">{ta ? "தனியுரிமைக் கொள்கை" : "Privacy Policy"}</h1>
            <p className="cl-trust-sub">{ta ? "கடைசியாகப் புதுப்பித்தது: செப்டம்பர் 2026" : "Last updated: September 2026"}</p>
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

            <h2>{ta ? "பீட்டா அறிவிப்பு" : "Beta notice"}</h2>
            {ta ? (
              <p>
                Vinaadi தற்போது திறந்த பீட்டாவில் உள்ளது. வசதிகள் வளர்ந்து வருகின்றன; தயாரிப்பு முதிர்ச்சி அடையும்போது இந்தக் கொள்கை புதுப்பிக்கப்படலாம்.
                மாற்றம் வரும்போதெல்லாம் புதுப்பித்த தேதியை மேலே வெளியிடுவோம். பீட்டாவைப் பயன்படுத்துவதன் மூலம் நீங்கள் எங்களை மேம்படுத்த உதவுகிறீர்கள் —
                இதன் பொருள் என்ன என்பதற்கு எங்கள் <Link href="/beta" className="cl-trust-link">பீட்டா பக்கத்தைப்</Link> பாருங்கள்.
              </p>
            ) : (
              <p>
                Vinaadi is currently in open beta. Features are evolving and this
                policy may be updated as the product matures. We will post the
                updated date below whenever it changes. By using the beta you help
                us improve — see our <Link href="/beta" className="cl-trust-link">beta page</Link> for
                what this means.
              </p>
            )}

            <h2>{ta ? "நாங்கள் சேகரிப்பவை" : "What we collect"}</h2>
            <p>
              {ta
                ? "உங்கள் ஜோதிட உதவியாளர் சேவையை வழங்கத் தேவையான தகவல்களை மட்டுமே Vinaadi சேகரிக்கிறது: உங்கள் மின்னஞ்சல் முகவரி (கணக்கு அங்கீகாரத்திற்கு), மற்றும் நீங்களாக உள்ளிடும் பிறப்பு விவரங்கள் (பிறந்த தேதி, நேரம், இடம்). நீங்கள் உருவாக்கும் குடும்ப உறுப்பினர் சுயவிவரங்கள் உங்கள் கணக்கின் கீழ் சேமிக்கப்படும்."
                : "Vinaadi collects only the information required to provide your astrology assistant service: your email address (for account authentication), and your birth details (date, time, and place of birth) that you choose to enter. Family member profiles you create are stored under your account."}
            </p>

            <h2>{ta ? "உங்கள் தகவலை நாங்கள் பயன்படுத்தும் விதம்" : "How we use your data"}</h2>
            <p>
              {ta
                ? "உங்கள் பிறப்பு விவரங்கள் திருக்கணித அடிப்படையிலான ஜோதிடப் பலன்களைக் கணிக்க மட்டுமே பயன்படுத்தப்படுகின்றன — தினசரி வழிகாட்டுதல் மதிப்பெண்கள், தசா காலங்கள், கிரகப் பெயர்ச்சி நிலைகள், பஞ்சாங்க நேரங்கள், பொருத்த முடிவுகள், ஜாதகக் கட்டங்கள். உங்கள் தனிப்பட்ட தகவலை சந்தைப்படுத்தல் நோக்கத்திற்காக மூன்றாம் தரப்பினருக்கு விற்கவோ, பகிரவோ, மாற்றவோ மாட்டோம்."
                : "Your birth details are used exclusively to calculate Thirukanitham-based astrological readings — daily guidance scores, dasa periods, transit positions, panchangam timings, porutham results, and jadhagam charts. We do not sell, share, or transfer your personal data to third parties for marketing purposes."}
            </p>

            <h2>{ta ? "Ask Vinaadi மற்றும் இந்தியாவுக்கு வெளியே செயலாக்கம்" : "Ask Vinaadi and processing outside India"}</h2>
            {ta ? (
              <>
                <p>
                  நீங்கள் <strong>Ask Vinaadi</strong>-ஐப் பயன்படுத்தும்போது, உங்கள் கேள்வியும் உங்கள் ஜாதகத்திலிருந்து பெறப்பட்ட சுருக்கமும் Anthropic PBC (அமெரிக்கா)
                  நிறுவனத்துக்கு அனுப்பப்படுகின்றன; அது தரவுச் செயலியாக எங்கள் சார்பில் பதிலை உருவாக்குகிறது. அந்தச் சுருக்கத்தில் உங்கள் வயது, திருமண நிலை,
                  வேலை வகை, கணிக்கப்பட்ட ஜோதிட நிலைகள் — உங்கள் ராசி, நட்சத்திரம், நடப்பு தசை மற்றும் கிரகப் பெயர்ச்சிக் காலங்கள் — இடம்பெறும்.
                </p>
                <p>
                  அதில் உங்கள் பெயர், மின்னஞ்சல் முகவரி, பிறந்த தேதி, நேரம், இடம் ஆகியவை <strong>இடம்பெறாது</strong>. உங்கள் பதிலை உருவாக்க மட்டுமே Anthropic அதைச்
                  செயலாக்குகிறது. நீங்கள் Ask Vinaadi-ஐப் பயன்படுத்தாவிட்டால், உங்கள் தகவல் எதுவும் அங்கு அனுப்பப்படாது.
                </p>
              </>
            ) : (
              <>
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
              </>
            )}

            <h2>{ta ? "தரவு சேமிப்பும் பாதுகாப்பும்" : "Data storage and security"}</h2>
            {ta ? (
              <p>
                உங்கள் தரவு பாதுகாப்பான சேவையகங்களில் சேமிக்கப்படுகிறது. உங்கள் பிறப்பு விவரங்கள் <strong>சேமிப்பில் குறியாக்கம்</strong> செய்யப்பட்டு, HTTPS
                வழியாக அனுப்பப்படுகின்றன; அவற்றை அணுகும் உரிமை உங்கள் பலன்களை உருவாக்கும் அமைப்புகளுக்கு மட்டுமே. பிறப்புச் சுயவிவரங்களும் பலன் வரலாறும்
                உங்கள் கணக்கு இருக்கும் வரை வைத்திருக்கப்படும்.
              </p>
            ) : (
              <p>
                Your data is stored on secured servers. Your birth details are
                <strong> encrypted at rest</strong>, transmitted over HTTPS, and access
                to them is restricted to the systems that generate your readings.
                Birth profiles and reading history are retained for the life of your
                account.
              </p>
            )}

            <h2>{ta ? "உங்கள் உரிமைகளும் தரவு நீக்கமும்" : "Your rights and data deletion"}</h2>
            {ta ? (
              <p>
                உங்கள் தனிப்பட்ட தரவை அணுக, திருத்த அல்லது நீக்கக் கோர எப்போது வேண்டுமானாலும் உங்களுக்கு உரிமை உண்டு. உங்கள் கணக்கையும் தொடர்புடைய அனைத்துத் தரவையும் —
                பிறப்புச் சுயவிவரங்கள், ஜாதகங்கள், குடும்ப உறுப்பினர் சுயவிவரங்கள், பலன் வரலாறு — நீக்க <a href="mailto:privacy@vinaadi.com" className="cl-trust-link">privacy@vinaadi.com</a> முகவரிக்கு
                மின்னஞ்சல் அனுப்பவும், அல்லது டாஷ்போர்டு அமைப்புகளில் உள்ள தொடர்பு வசதியைப் பயன்படுத்தவும். நீக்கக் கோரிக்கைகளை விரைந்து நிறைவேற்றி, முடிந்ததும் உறுதிப்படுத்துவோம்.
              </p>
            ) : (
              <p>
                You may request access to, correction of, or deletion of your
                personal data at any time. To delete your account and all associated
                data — birth profiles, charts, family member profiles, and reading
                history — email <a href="mailto:privacy@vinaadi.com" className="cl-trust-link">privacy@vinaadi.com</a> or
                use the contact option in your dashboard settings. We action deletion
                requests promptly and confirm once complete.
              </p>
            )}

            <h2>{ta ? "குக்கீகளும் பகுப்பாய்வும்" : "Cookies and analytics"}</h2>
            {ta ? (
              <p>
                அங்கீகாரத்திற்கு Vinaadi ஒரு அமர்வுக் குக்கீயைப் பயன்படுத்துகிறது. தயாரிப்புப் பகுப்பாய்விற்கு PostHog-ஐத் தனியுரிமையை மதிக்கும் வகையில் அமைத்துப் பயன்படுத்துகிறோம்:
                அது உங்கள் உலாவியின் உள்ளூர் சேமிப்பில் (local storage) முதல்தரப்பு அடையாளங்காட்டியைச் சேமிக்கிறது (கண்காணிப்புக் குக்கீ அல்ல), ஐரோப்பிய ஒன்றியத்தில் இயங்குகிறது,
                உங்கள் உலாவியின் &quot;Do Not Track&quot; அமைப்பை மதிக்கிறது. மொத்தப் பயன்பாட்டைப் புரிந்துகொள்ள, பக்கப் பார்வை, ஜாதகம் உருவாக்குதல், கருத்துச் சமர்ப்பித்தல் போன்ற
                சில குறிப்பிட்ட நிகழ்வுகளை மட்டுமே பதிவு செய்கிறோம். உங்கள் பிறப்பு விவரங்கள், பெயர், மின்னஞ்சல், நீங்கள் தட்டச்சு செய்யும் உள்ளடக்கம் எதையும் பகுப்பாய்விற்கு
                அனுப்பமாட்டோம்; விளம்பரக் கண்காணிப்பான்களையோ நடத்தை அடிப்படையிலான சுயவிவரக் குக்கீகளையோ பயன்படுத்துவதில்லை.
              </p>
            ) : (
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
            )}

            <h2>{ta ? "ஜோதிட மறுப்பு" : "Astrology disclaimer"}</h2>
            <p>
              {ta
                ? "Vinaadi ஜோதிட அடிப்படையிலான வழிகாட்டுதலை வழங்குகிறது. ஜோதிடம் ஒரு பாரம்பரிய நம்பிக்கை முறை, அறிவியல் அல்ல. Vinaadi-யில் உள்ள எதுவும் மருத்துவ, சட்ட, நிதி ஆலோசனை ஆகாது. அந்தத் துறைகளில் முடிவெடுக்கத் தகுதிபெற்ற நிபுணரை அணுகுங்கள்."
                : "Vinaadi provides Jothida-based guidance. Astrology is a traditional belief system, not a science. Nothing in Vinaadi constitutes medical, legal, or financial advice. For decisions in those areas, consult a qualified professional."}
            </p>

            <h2>{ta ? "தொடர்பு" : "Contact"}</h2>
            {ta ? (
              <p>
                தனியுரிமை தொடர்பான கேள்விகளுக்கும் தரவு நீக்கக் கோரிக்கைகளுக்கும்{" "}
                <a href="mailto:privacy@vinaadi.com" className="cl-trust-link">privacy@vinaadi.com</a> முகவரியில், அல்லது உங்கள் கணக்கு அமைப்புகளில் உள்ள டாஷ்போர்டு வழியாகத் தொடர்பு கொள்ளுங்கள்.
              </p>
            ) : (
              <p>
                For privacy questions or data deletion requests, contact us at{" "}
                <a href="mailto:privacy@vinaadi.com" className="cl-trust-link">privacy@vinaadi.com</a> or
                through the dashboard in your account settings.
              </p>
            )}

            <div className="cl-trust-links">
              <Link href="/terms" className="cl-trust-link">{ta ? "பயன்பாட்டு விதிகள் →" : "Terms of Service →"}</Link>
              <Link href="/trust/methodology" className="cl-trust-link">{ta ? "எங்கள் வழிமுறை →" : "Our Methodology →"}</Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
