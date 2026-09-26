import Link from "next/link";
import { MuhurtaTool } from "./MuhurtaTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { getServerLang } from "@/lib/server-lang";
import { TimingArcVisual } from "@/components/marketing-visuals";

const MUHURTA_CONCEPTS = [
  {
    en: { title: "Tithi (திதி)", body: "The lunar day — one of the five parts of the Panchangam. Shukla Paksha (waxing) tithis 2, 3, 5, 6, 7, 10, 11, 12, and 13 are favourable for auspicious events." },
    ta: { title: "திதி", body: "சந்திர நாள் — பஞ்சாங்கத்தின் ஐந்து கூறுகளில் ஒன்று. சுக்ல பட்சத்தில் வரும் 2, 3, 5, 6, 7, 10, 11, 12, 13 திதிகள் சுப நிகழ்வுகளுக்கு ஏற்றவை." },
  },
  {
    en: { title: "Moon Star (நட்சத்திரம்)", body: "The Moon's star for the day. Auspicious stars include Rohini, Hastham, Anusham, Revathi, Punarpoosam, and others from the Thirukanitham list." },
    ta: { title: "நட்சத்திரம்", body: "அன்றைய சந்திர நட்சத்திரம். ரோகிணி, ஹஸ்தம், அனுஷம், ரேவதி, புனர்பூசம் போன்ற சுப நட்சத்திரங்கள் திருக்கணிதப் பட்டியலில் முக்கியமாகக் கருதப்படுகின்றன." },
  },
  {
    en: { title: "Vara (வாரம்)", body: "The weekday carries its own quality. Monday, Wednesday, Thursday, and Friday are generally auspicious. Tuesday and Saturday need care; Sunday is neutral." },
    ta: { title: "வாரம்", body: "வாரத்தின் நாளும் தனிப்பட்ட குணம் கொண்டது. திங்கள், புதன், வியாழன், வெள்ளி பொதுவாக நல்லது. செவ்வாய், சனி கவனம் தேவை; ஞாயிறு நடுநிலை." },
  },
  {
    en: { title: "Rahu Kalam", body: "A daily caution period governed by Rahu and usually avoided for muhurtham. It falls at a different time each day based on sunrise." },
    ta: { title: "ராகு காலம்", body: "ராகுவுடன் தொடர்புடைய தினசரி கவன நேரம். முகூர்த்தம் பார்க்கும்போது இதை பொதுவாகத் தவிர்க்கிறார்கள். சூரியோதயத்தை அடிப்படையாக வைத்து இது தினமும் மாறும்." },
  },
  {
    en: { title: "Abhijit Muhurtham", body: "A highly auspicious daily window around local noon, usually about 48 minutes long. Tradition treats Wednesday as the main exception." },
    ta: { title: "அபிஜித் முகூர்த்தம்", body: "உள்ளூர் நண்பகலைச் சுற்றியுள்ள மிகவும் சுபமான தினசரி நேரம் இது; பொதுவாக சுமார் 48 நிமிடங்கள் இருக்கும். மரபு படி புதன்கிழமையில் இதைத் தவிர்க்கும் பழக்கம் உள்ளது." },
  },
];

// F7 part two - a Server Component; see lib/server-lang.ts.
export async function MuhurtaPageContent() {
  const lang = await getServerLang();

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO */}
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
            <p className="cl-eyebrow">
              {lang === "en" ? "Free Muhurtham Tool" : "இலவச முகூர்த்த கருவி"}
            </p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "22ch" }}>
              {lang === "en"
                ? "Find Auspicious Muhurtham for Your Event"
                : "உங்கள் நிகழ்வுக்கு சுப முகூர்த்தம் காண்க"}
            </h1>
            <p className="cl-pub-lead">
              {lang === "en"
                ? "Enter your event, dates, place and birth details to get the best auspicious time windows, scored on Thirukanitham Panchangam and your own chart. For a wedding, both the bride's and the groom's charts are checked. No account required."
                : "நிகழ்வு, தேதி வரம்பு, இடம், பிறப்பு விவரங்கள் ஆகியவற்றை உள்ளிடுங்கள். திருக்கணித பஞ்சாங்கத்தையும் உங்கள் ஜாதகத்தையும் வைத்து சிறந்த சுப நேரங்களைக் காணலாம். திருமணத்திற்கு மணமகள், மணமகன் இருவரின் ஜாதகமும் சரிபார்க்கப்படும். கணக்கு தேவையில்லை."}
            </p>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "Window Finder" : "நேர சாளரம்"}</p>
              <TimingArcVisual />
              <p className="cl-hero-figure__title">{lang === "en" ? "Good windows and caution periods at a glance" : "சிறந்த நேரமும் கவன நேரமும் ஒரே பார்வையில்"}</p>
            </div>
          </div>
        </section>

        {/* Tool */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <MuhurtaTool />
          </div>
        </section>

        {/* BAND — Muhurta concepts */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">
                {lang === "en" ? "Reference" : "குறிப்பு"}
              </p>
              <h2 className="cl-section-h2">
                {lang === "en"
                  ? "How Panchangam-based muhurtham works"
                  : "பஞ்சாங்கத்தை வைத்து முகூர்த்தம் எப்படி தேர்வு செய்யப்படுகிறது"}
              </h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>
                  {lang === "en"
                    ? "A muhurtham is selected by examining five elements of the Panchangam — tithi, the Moon's star, vara (weekday), yoga, and karana — along with caution periods like Rahu Kalam. Vinaadi uses astronomically precise Thirukanitham calculations."
                    : "முகூர்த்தம் தேர்வு செய்யும்போது பஞ்சாங்கத்தின் ஐந்து கூறுகளான திதி, நட்சத்திரம், வாரம், யோகம், கரணம் ஆகியவற்றோடு ராகு காலம் போன்ற கவன நேரங்களையும் சேர்த்து பார்க்கிறோம். விநாடி இதற்கெல்லாம் வானியல் துல்லியமுள்ள திருக்கணிதக் கணக்கீடுகளைப் பயன்படுத்துகிறது."}
                </p>
              </div>
              <ul className="cl-pub-detail-list">
                {MUHURTA_CONCEPTS.map((item) => {
                  const c = lang === "en" ? item.en : item.ta;
                  return (
                    <li key={c.title} className="cl-pub-detail-item">
                      <p className="cl-pub-detail-item__title">{c.title}</p>
                      <p className="cl-pub-detail-item__body">{c.body}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">
                {lang === "en" ? "Related tools" : "தொடர்புடைய கருவிகள்"}
              </p>
              <div className="cl-pub-related-links">
                <Link href="/tools/daily-panchangam-planner" className="cl-pub-related-link">
                  {lang === "en" ? "Daily Panchangam →" : "தினசரி பஞ்சாங்கம் →"}
                </Link>
                <Link href="/features/timing-and-decisions" className="cl-pub-related-link">
                  {lang === "en" ? "Timing and Decisions →" : "நேரம் & முடிவுகள் →"}
                </Link>
                <Link href="/tools/jadhagam-generator" className="cl-pub-related-link">
                  {lang === "en" ? "Jadhagam Generator →" : "ஜாதகம் உருவாக்கு →"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA strip.
            This used to sell chart personalisation — dasa, hora, Chandrashtama —
            as what an account adds. The tool above already does all of that from
            the birth details typed into it, so the promise was of something the
            reader had just been given. What an account actually adds is keeping
            the charts, and the surfaces built on a saved one. */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">
                {lang === "en"
                  ? "Save your charts and compare dates"
                  : "ஜாதகங்களைச் சேமித்து, நாட்களை ஒப்பிடுங்கள்"}
              </h2>
              <p className="cl-cta-strip__body">
                {lang === "en"
                  ? "A free account keeps your chart, so you can return to a shortlist, compare dates on the calendar, and see the published muhurtham days ranked for you — or for you and your partner together."
                  : "இலவச கணக்கில் உங்கள் ஜாதகம் சேமிக்கப்படும் — தேர்ந்தெடுத்த நாட்களுக்குத் திரும்பலாம், நாட்காட்டியில் ஒப்பிடலாம், வெளியிடப்பட்ட முகூர்த்த நாட்களை உங்களுக்கோ உங்கள் இணையருடன் சேர்த்து இருவருக்குமோ வரிசைப்படுத்திப் பார்க்கலாம்."}
              </p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">
              {lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
