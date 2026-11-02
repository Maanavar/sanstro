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
            <p className="cl-trust-sub">{ta ? "கடைசியாகப் புதுப்பித்தது: நவம்பர் 2026" : "Last updated: November 2026"}</p>
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

            <h2 id="collect">{ta ? "நாங்கள் சேகரிப்பவை" : "What we collect"}</h2>
            {ta ? (
              <ul>
                <li><strong>மின்னஞ்சல் முகவரி</strong> — உள்நுழையவும், கணக்கு மற்றும் கட்டணச் செய்திகளை அனுப்பவும்.</li>
                <li><strong>உங்கள் பிறப்பு விவரங்கள்</strong> — பிறந்த தேதி, நேரம், இடம்; திருமண நிலை, வேலை வகை போன்ற நீங்கள் தரும் விவரங்கள்.</li>
                <li><strong>குடும்ப உறுப்பினர்களின் விவரங்கள்</strong> — நீங்கள் சேர்க்கும் ஒவ்வொருவரின் பெயர், உறவு, பிறப்பு விவரங்கள்.</li>
                <li><strong>Ask Vinaadi-இடம் நீங்கள் கேட்கும் கேள்விகளும் அதன் பதில்களும்.</strong></li>
                <li><strong>குறிப்பேடு, அமைப்புகள், நினைவூட்டல் தேர்வுகள்.</strong></li>
                <li><strong>கட்டணப் பதிவுகள்</strong> — ஆர்டர், தொகை, நிலை, ரசீது. அட்டை, UPI விவரங்களை Razorpay வைத்திருக்கிறது; நாங்கள் அல்ல.</li>
                <li><strong>பாதுகாப்புப் பதிவுகள்</strong> — உள்நுழைவு மற்றும் ஒப்புதல் பதிவுகளுடன் IP முகவரி.</li>
              </ul>
            ) : (
              <ul>
                <li><strong>Email address</strong>, to sign you in and send account and payment messages.</li>
                <li><strong>Your birth details</strong>: date, time and place of birth, and details you add such as marital status and employment type.</li>
                <li><strong>Family members&apos; details</strong>: the name, relationship and birth details of each person you add.</li>
                <li><strong>Questions you ask Ask Vinaadi</strong>, and its answers.</li>
                <li><strong>Your journal, settings and reminder choices.</strong></li>
                <li><strong>Payment records</strong>: order, amount, status and receipt. Card and UPI details are held by Razorpay, not by us.</li>
                <li><strong>Security records</strong>: IP address with sign-ins and with each consent answer.</li>
              </ul>
            )}

            <h2 id="purposes">{ta ? "நோக்கங்களும் உங்கள் ஒப்புதலும்" : "Purposes and your consent"}</h2>
            {ta ? (
              <>
                <p>ஒவ்வொரு பயன்பாட்டுக்கும் தனி ஒப்புதல் உண்டு. முதலாவது மட்டுமே அவசியம்; மற்றவை நீங்கள் இயக்கும் வரை அணைந்திருக்கும்.</p>
                <ol>
                  <li><strong>சேவை (அவசியம்).</strong> உங்கள் ஜாதகம், தினசரி வழிகாட்டுதல், தசை, பெயர்ச்சி, பஞ்சாங்கம், பொருத்தம் ஆகியவற்றைக் கணித்துக் காட்டுதல்; உங்கள் கணக்கையும் கட்டணங்களையும் நடத்துதல். பயனர் எண்ணிக்கை, தொடர்ச்சி, வருவாய் போன்ற மொத்தக் கணக்குகளை எங்கள் சொந்தத் தரவுத்தளத்திலிருந்து கணக்கிடுவதும் இதில் அடங்கும்.</li>
                  <li><strong>புதுப்பிப்புகளும் ஜோதிட அறிவிப்புகளும் (விருப்பத்திற்குரியது).</strong> காலை நல்ல நேரம், தசை மாற்றம், பிறந்த நட்சத்திர நாள், புதிய வசதிகள் பற்றிய குறிப்புகள். இது இல்லாமல் சரிபார்ப்பு, கடவுச்சொல் மீட்டமைப்பு, ரசீது போன்ற சேவைக்குத் தேவையான செய்திகள் மட்டுமே வரும்.</li>
                  <li><strong>தயாரிப்புப் பகுப்பாய்வு (விருப்பத்திற்குரியது).</strong> Vinaadi-ஐ மேம்படுத்த, நீங்கள் அதைப் பயன்படுத்தும் விதத்தை உங்கள் கணக்குடன் இணைத்தல். இது இல்லாமல் வருகைகள் அடையாளமின்றி மட்டுமே எண்ணப்படும்.</li>
                  <li><strong>Ask Vinaadi-ஐ மேம்படுத்துதல் (விருப்பத்திற்குரியது).</strong> பதில்களை மேம்படுத்த, உங்கள் கேள்விகளையும் பதில்களையும் எங்கள் குழு படிக்கலாம்.</li>
                </ol>
                <p>
                  <strong>ஒப்புதலைத் திரும்பப் பெறுதல்.</strong> விருப்பத்திற்குரிய ஒவ்வொன்றையும் டாஷ்போர்டு அமைப்புகள் → தனியுரிமை &amp; சட்டம் பகுதியில் ஒரே தட்டலில் அணைக்கலாம்; அடுத்த கோரிக்கையிலிருந்தே அது நடைமுறைக்கு வரும்.
                  சேவை ஒப்புதலைத் திரும்பப் பெறுவது என்பது கணக்கை நீக்குவதாகும் (கீழே பார்க்கவும்).
                </p>
              </>
            ) : (
              <>
                <p>Each use has its own consent. Only the first is required; the others stay off until you switch them on.</p>
                <ol>
                  <li><strong>Service (required).</strong> Calculating and showing your charts, daily guidance, dasa, transits, panchangam and porutham; running your account and payments. This includes counting totals such as active users, retention and revenue from our own database.</li>
                  <li><strong>Updates and astro alerts (optional).</strong> Morning nalla neram, dasa changes, your birth-star day and notes on new features. Without it you receive only messages the service needs, such as verification, password reset and receipts.</li>
                  <li><strong>Product analytics (optional).</strong> Linking how you use Vinaadi to your account so we can improve it. Without it, visits are counted anonymously.</li>
                  <li><strong>Help improve Ask Vinaadi (optional).</strong> Our team may read your questions and answers to make the answers better.</li>
                </ol>
                <p>
                  <strong>Withdrawing consent.</strong> Switch any optional purpose off with one tap in your
                  dashboard under Settings → Privacy &amp; Legal; it applies from your next request.
                  Withdrawing the service consent means deleting your account (see below).
                </p>
              </>
            )}
            <p>
              {ta
                ? "உங்கள் தனிப்பட்ட தகவலை விற்கவோ, சந்தைப்படுத்தலுக்காக மூன்றாம் தரப்பினருடன் பகிரவோ மாட்டோம்."
                : "We do not sell your personal data or share it with third parties for their marketing."}
            </p>

            <h2 id="children">{ta ? "18 வயதுக்குக் குறைவானவர்கள்" : "Under-18s"}</h2>
            <p>
              {ta
                ? "கணக்கு வைத்திருப்பவர் 18 வயது அல்லது அதற்கு மேற்பட்டவராக இருக்க வேண்டும். குழந்தைகள் பெற்றோர் சேர்க்கும் குடும்ப உறுப்பினர்களாக மட்டுமே இடம்பெறுவர். 18 வயதுக்குக் குறைவான உறுப்பினர் எந்தச் சந்தைப்படுத்தல் செய்தியிலும் சேர்க்கப்படமாட்டார்."
                : "Account holders must be 18 or older. Children appear only as family members a parent adds. A family member under 18 is never included in any marketing message."}
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
                உங்கள் தரவு பாதுகாப்பான சேவையகங்களில் சேமிக்கப்பட்டு, HTTPS வழியாக அனுப்பப்படுகிறது. உங்கள் பிறப்பு விவரங்களை
                உங்கள் பலன்களை உருவாக்கும் அமைப்புகள் மட்டுமே அணுக முடியும். பிறப்புச் சுயவிவரங்களும் பலன் வரலாறும்
                உங்கள் கணக்கு இருக்கும் வரை வைத்திருக்கப்படும்.
              </p>
            ) : (
              <p>
                Your data is stored on secured servers and transmitted over HTTPS.
                Access to your birth details is restricted to the systems that
                generate your readings.
                Birth profiles and reading history are retained for the life of your
                account.
              </p>
            )}

            <h2 id="rights">{ta ? "உங்கள் உரிமைகளும் தரவு நீக்கமும்" : "Your rights and data deletion"}</h2>
            {ta ? (
              <ul>
                <li><strong>அணுகல்.</strong> அமைப்புகள் → தனியுரிமை &amp; சட்டம் → &quot;என் தரவைப் பதிவிறக்கு&quot; நாங்கள் வைத்திருக்கும் அனைத்தையும் ஒரு கோப்பாகத் தரும்.</li>
                <li><strong>திருத்தம்.</strong> உங்கள் விவரங்களையும் குடும்ப உறுப்பினர்களையும் டாஷ்போர்டிலேயே திருத்தலாம்.</li>
                <li><strong>நீக்கம்.</strong> அமைப்புகள் → ஆபத்துப் பகுதியில் உங்கள் கணக்கை நீக்கலாம்: பிறப்பு விவரங்கள், ஜாதகங்கள், குடும்பம், குறிப்பேடு, கேள்விகள் அழிக்கப்படும். சட்டப்படி வைத்திருக்க வேண்டிய கட்டணப் பதிவுகள் உங்களுடன் இணைப்பின்றி மட்டுமே இருக்கும்.</li>
                <li><strong>பரிந்துரை.</strong> உங்களால் இயலாதபோது உங்கள் உரிமைகளைப் பயன்படுத்த ஒருவரைப் பரிந்துரைக்க எங்களுக்கு எழுதலாம்.</li>
              </ul>
            ) : (
              <ul>
                <li><strong>Access.</strong> Settings → Privacy &amp; Legal → &quot;Download my data&quot; gives you everything we hold as one file.</li>
                <li><strong>Correction.</strong> Edit your details and your family members in the dashboard.</li>
                <li><strong>Erasure.</strong> Delete your account under Settings → Danger zone: birth details, charts, family, journal and questions are erased. Payment records the law requires us to keep stay, no longer linked to you.</li>
                <li><strong>Nomination.</strong> Write to us to nominate someone to exercise these rights if you cannot.</li>
              </ul>
            )}

            <h2 id="grievance">{ta ? "குறைதீர்ப்பும் புகாரும்" : "Grievances and complaints"}</h2>
            {ta ? (
              <p>
                குறை அல்லது கோரிக்கை இருந்தால் <a href="mailto:privacy@vinaadi.com" className="cl-trust-link">privacy@vinaadi.com</a> முகவரிக்கு எழுதுங்கள். எங்கள் பதிலில் திருப்தி இல்லையெனில்,
                இந்தியத் தரவுப் பாதுகாப்பு வாரியத்திடம் (Data Protection Board of India) புகார் அளிக்கலாம்.
              </p>
            ) : (
              <p>
                For a grievance or a request about your data, write to{" "}
                <a href="mailto:privacy@vinaadi.com" className="cl-trust-link">privacy@vinaadi.com</a>. If you are not
                satisfied with our answer, you may complain to the Data Protection Board of India.
              </p>
            )}

            <h2>{ta ? "குக்கீகளும் பகுப்பாய்வும்" : "Cookies and analytics"}</h2>
            {ta ? (
              <p>
                அங்கீகாரத்திற்கு Vinaadi ஒரு அமர்வுக் குக்கீயைப் பயன்படுத்துகிறது. தயாரிப்புப் பகுப்பாய்விற்கு PostHog-ஐத் தனியுரிமையை மதிக்கும் வகையில் அமைத்துப் பயன்படுத்துகிறோம்; &quot;தயாரிப்புப் பகுப்பாய்வு&quot; ஒப்புதல் தந்தால் மட்டுமே நிகழ்வுகள் உங்கள் கணக்குடன் இணைக்கப்படும், இல்லையெனில் அடையாளமின்றி இருக்கும்:
                அது உங்கள் உலாவியின் உள்ளூர் சேமிப்பில் (local storage) முதல்தரப்பு அடையாளங்காட்டியைச் சேமிக்கிறது (கண்காணிப்புக் குக்கீ அல்ல), ஐரோப்பிய ஒன்றியத்தில் இயங்குகிறது,
                உங்கள் உலாவியின் &quot;Do Not Track&quot; அமைப்பை மதிக்கிறது. மொத்தப் பயன்பாட்டைப் புரிந்துகொள்ள, பக்கப் பார்வை, ஜாதகம் உருவாக்குதல், கருத்துச் சமர்ப்பித்தல் போன்ற
                சில குறிப்பிட்ட நிகழ்வுகளை மட்டுமே பதிவு செய்கிறோம். உங்கள் பிறப்பு விவரங்கள், பெயர், மின்னஞ்சல், நீங்கள் தட்டச்சு செய்யும் உள்ளடக்கம் எதையும் பகுப்பாய்விற்கு
                அனுப்பமாட்டோம்; விளம்பரக் கண்காணிப்பான்களையோ நடத்தை அடிப்படையிலான சுயவிவரக் குக்கீகளையோ பயன்படுத்துவதில்லை.
              </p>
            ) : (
              <p>
                Vinaadi uses a session cookie for authentication. For product
                analytics we use PostHog, configured in a privacy-respecting way.
                Events are linked to your account only if you allow product
                analytics; otherwise they stay anonymous. PostHog
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
