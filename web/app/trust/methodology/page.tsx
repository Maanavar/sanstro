"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TRUST_METHOD, mt } from "@/lib/marketing-i18n";

export default function MethodologyPage() {
  const [lang] = useLang();
  const d = TRUST_METHOD;

  const CALC_STACK = [
    { label: "Thirukanitham",      desc: lang === "en" ? "True astronomical positions — the Tamil standard"      : "உண்மையான வானியல் நிலைகள் — தமிழ் தரநிலை" },
    { label: "Lahiri ayanamsa",    desc: lang === "en" ? "Government-recognised sidereal zodiac offset"           : "அரசாங்கம் அங்கீகரித்த நட்சத்திர ராசிக்கட்ட இடைவெளி" },
    { label: "Drik ephemeris",     desc: lang === "en" ? "High-precision planetary data"                         : "உயர் துல்லியமான கிரக தரவு" },
    { label: "Vimshottari dasha",  desc: lang === "en" ? "120-year planetary period cycle"                       : "120 ஆண்டு கிரக காலசுழற்சி" },
    { label: "Gochar + panchangam", desc: lang === "en" ? "Daily transits and five-part almanac"                 : "தினசரி கோசாரம் மற்றும் ஐந்துபகுதி பஞ்சாங்கம்" },
  ];

  const TOC = [
    { href: "#thirukanitham", label: lang === "en" ? "Thirukanitham"           : "திருக்கணிதம்" },
    { href: "#lahiri",        label: lang === "en" ? "Lahiri ayanamsa"         : "லாகிரி அயனாம்சம்" },
    { href: "#drik",          label: lang === "en" ? "Drik ephemeris"          : "திரிக் கோளக்கணிதம்" },
    { href: "#dasha",         label: lang === "en" ? "Vimshottari Dasha"       : "விம்சோத்தரி தசை" },
    { href: "#gochar",        label: lang === "en" ? "Gochar (transits)"       : "கோசாரம்" },
    { href: "#panchangam",    label: lang === "en" ? "Panchangam"              : "பஞ்சாங்கம்" },
    { href: "#daily-score",   label: lang === "en" ? "Multi-signal score"      : "பல சமிக்ஞை மதிப்பெண்" },
    { href: "#porutham",      label: lang === "en" ? "Porutham"                : "பொருத்தம்" },
    { href: "#jadhagam",      label: lang === "en" ? "Jadhagam"               : "ஜாதகம்" },
    { href: "#philosophy",    label: lang === "en" ? "Interpretation philosophy" : "விளக்கம் தத்துவம்" },
  ];

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{mt(d.eyebrow, lang)}</p>
              <h1 className="cl-pub-h1">{mt(d.h1, lang)}</h1>
              <p className="cl-pub-lead">{mt(d.lead, lang)}</p>
              <div className="cl-hero__actions">
                <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Start a reading →" : "வாசிப்பை தொடங்கு →"}</Link>
                <Link href="/trust/about-vinaadi" className="cl-btn cl-btn--ghost">{lang === "en" ? "About Vinaadi" : "விநாடி பற்றி"}</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "The calculation stack" : "கணக்கீட்டு தொகுப்பு"}</p>
              <div className="cl-hero-figure__rows">
                {CALC_STACK.map((row) => (
                  <div key={row.label} className="cl-hero-figure__row">
                    <b>{row.label}</b>
                    <span>{row.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ARTICLE */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-article">
              <aside className="cl-article__toc">
                <p className="cl-article__toc-label">{lang === "en" ? "On this page" : "இந்த பக்கத்தில்"}</p>
                <nav className="cl-article__toc-list">
                  {TOC.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
                </nav>
              </aside>
              <div className="cl-article__body cl-trust-prose">

                <h2 id="thirukanitham">{lang === "en" ? "Thirukanitham — the precise Tamil calendar" : "திருக்கணிதம் — துல்லியமான தமிழ் நாட்காட்டி"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is built on the Thirukanitham system — the Tamil tradition of astronomical calculation that determines the precise positions of celestial bodies at the moment of birth and for any given day."
                  : "விநாடி திருக்கணிதம் முறையில் கட்டப்பட்டுள்ளது — பிறப்பின் தருணத்தில் மற்றும் எந்த நாளுக்கும் வானியல் பொருட்களின் துல்லியமான நிலைகளை தீர்மானிக்கும் தமிழ் வானியல் கணக்கீட்டு பாரம்பரியம்."}</p>
                <p>{lang === "en"
                  ? "Unlike generalized astrology apps that use approximate planetary data, Vinaadi uses Thirukanitham-based computation to produce birth charts, panchangam, and transit readings anchored to the exact Tamil astrological standard."
                  : "தோராயமான கிரக தரவை பயன்படுத்தும் பொதுவான ஜோதிட ஆப்களுக்கு மாறாக, விநாடி திருக்கணிதம் அடிப்படையிலான கணக்கீட்டை பயன்படுத்தி சரியான தமிழ் ஜோதிட தரநிலையில் நிலைநிறுத்தப்பட்ட ஜன்ம ஜாதகங்கள், பஞ்சாங்கம், கோசார வாசிப்புகளை உருவாக்குகிறது."}</p>

                <h2 id="lahiri">{lang === "en" ? "Lahiri ayanamsa" : "லாகிரி அயனாம்சம்"}</h2>
                <p>{lang === "en"
                  ? "Tamil Jyotish uses the sidereal zodiac — the fixed star positions — rather than the tropical zodiac used in Western astrology. The difference between sidereal and tropical positions is called the ayanamsa. Vinaadi uses the Lahiri ayanamsa, the government-recognized standard in India."
                  : "தமிழ் ஜோதிடம் மேற்கத்திய ஜோதிடத்தில் பயன்படுத்தப்படும் வெப்பமண்டல ராசிக்கட்டத்தை விட நட்சத்திர ராசிக்கட்டத்தை — நிலையான நட்சத்திர நிலைகளை — பயன்படுத்துகிறது. நட்சத்திர மற்றும் வெப்பமண்டல நிலைகளுக்கு இடையிலான வேறுபாடு அயனாம்சம் என்று அழைக்கப்படுகிறது. விநாடி இந்தியாவில் அரசாங்கம் அங்கீகரித்த தரநிலையான லாகிரி அயனாம்சத்தை பயன்படுத்துகிறது."}</p>

                <h2 id="drik">{lang === "en" ? "Drik ephemeris precision" : "திரிக் கோளக்கணித துல்லியம்"}</h2>
                <p>{lang === "en"
                  ? "Planet positions are computed using the Drik (visual) ephemeris — the same astronomical data used in modern panchang publications. This provides the highest precision available for Tamil astrological calculation."
                  : "கிரக நிலைகள் திரிக் (காட்சி) கோளக்கணிதத்தை பயன்படுத்தி கணக்கிடப்படுகின்றன — நவீன பஞ்சாங்க வெளியீடுகளில் பயன்படுத்தப்படும் அதே வானியல் தரவு. இது தமிழ் ஜோதிட கணக்கீட்டிற்கு கிடைக்கும் மிகவும் உயர் துல்லியத்தை வழங்குகிறது."}</p>

                <h2 id="dasha">{lang === "en" ? "Vimshottari Dasha system" : "விம்சோத்தரி தசை முறை"}</h2>
                <p>{lang === "en"
                  ? "Daily guidance integrates the Vimshottari Dasha system — a 120-year planetary period cycle tied to the birth nakshatra. Dasha periods define the dominant planetary influence over each phase of life, and the sub-period (bhukti) adds granularity to daily and weekly guidance."
                  : "தினசரி வழிகாட்டுதல் விம்சோத்தரி தசை முறையை ஒருங்கிணைக்கிறது — ஜன்ம நட்சத்திரத்துடன் இணைக்கப்பட்ட 120 ஆண்டு கிரக காலசுழற்சி. தசை காலங்கள் வாழ்க்கையின் ஒவ்வொரு கட்டத்திலும் ஆதிக்கம் செலுத்தும் கிரக தாக்கத்தை வரையறுக்கின்றன, புக்தி தினசரி மற்றும் வாராந்திர வழிகாட்டுதலுக்கு நுண்ணிய பகுப்பை சேர்க்கிறது."}</p>

                <h2 id="gochar">{lang === "en" ? "Gochar (transits)" : "கோசாரம் (கிரக நகர்வுகள்)"}</h2>
                <p>{lang === "en"
                  ? "Gochar refers to the current positions of planets in transit relative to your natal chart. Vinaadi integrates transit positions — especially Saturn, Jupiter, Rahu, and Ketu — with dasha periods to determine the quality of each day. Key transit effects like Chandrashtama and Ashtama Shani are tracked clearly, without fear language."
                  : "கோசாரம் என்பது உங்கள் ஜன்ம ஜாதகத்திற்கு தொடர்பாக கிரகங்களின் நடப்பு நகர்வு நிலைகளை குறிக்கிறது. விநாடி — குறிப்பாக சனி, குரு, ராகு, கேது — கோசார நிலைகளை தசை காலங்களுடன் ஒருங்கிணைத்து ஒவ்வொரு நாளின் தரத்தை தீர்மானிக்கிறது. சந்திராஷ்டமம் போன்ற முக்கிய கோசார விளைவுகள் பயமுறுத்தும் மொழியின்றி தெளிவாக கண்காணிக்கப்படுகின்றன."}</p>

                <h2 id="panchangam">{lang === "en" ? "Panchangam" : "பஞ்சாங்கம்"}</h2>
                <p>{lang === "en"
                  ? "The Tamil panchangam is a five-part daily almanac covering: Tithi (lunar day), Vara (weekday), Nakshatra (Moon nakshatra), Yoga (sun-moon combination), and Karana (half-tithi). Vinaadi computes a precise panchangam for each day and uses it as one of the signals in the daily guidance calculation. Rahu Kalam, Yamagandam, and auspicious timings (Amrit Kalam) are surfaced as best-window and hold-window guidance."
                  : "தமிழ் பஞ்சாங்கம் ஐந்துபகுதி தினசரி நாட்காட்டி: திதி (சந்திர நாள்), வாரம் (வாரநாள்), நட்சத்திரம் (சந்திர நட்சத்திரம்), யோகம் (சூரியன்-சந்திரன் சேர்க்கை), கரணம் (அரை-திதி). விநாடி ஒவ்வொரு நாளுக்கும் துல்லியமான பஞ்சாங்கம் கணக்கிட்டு தினசரி வழிகாட்டுதல் கணக்கீட்டில் ஒரு சமிக்ஞையாக பயன்படுத்துகிறது."}</p>

                <h2 id="daily-score">{lang === "en" ? "Multi-signal daily score" : "பல சமிக்ஞை தினசரி மதிப்பெண்"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi's daily score combines: current dasha and bhukti period quality, gochar transit influences on natal chart, panchangam quality for the day, Moon nakshatra position, and Ashtakavarga contributions where applicable."
                  : "விநாடியின் தினசரி மதிப்பெண் இணைக்கிறது: நடப்பு தசை மற்றும் புக்தி தரம், ஜன்ம ஜாதகத்தில் கோசார கிரக தாக்கங்கள், நாளுக்கான பஞ்சாங்க தரம், சந்திர நட்சத்திர நிலை, பொருந்தும் இடங்களில் அஷ்டகவர்க பங்களிப்புகள்."}</p>

                <h2 id="porutham">{lang === "en" ? "Porutham (marriage compatibility)" : "பொருத்தம் (திருமண பொருத்தம்)"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi calculates the traditional 10 Porutham system used in Tamil marriage matching — Dinam, Ganam, Mahendram, Stree Deergham, Yoni, Rajju, Vedha, Rasi, Rasiyathipathi, and Nadi — each computed from the birth nakshatra and rasi. Rajju dosha and Sevvai dosham are assessed using the Thirukanitham standard."
                  : "விநாடி தமிழ் திருமண பொருத்தத்தில் பயன்படுத்தப்படும் பாரம்பரிய 10 பொருத்தம் முறையை கணக்கிடுகிறது — தினம், கணம், மகேந்திரம், ஸ்திரீ தீர்க்கம், யோனி, ரஜ்ஜு, வேதம், ராசி, ராஸ்யதிபதி, நாடி — ஒவ்வொன்றும் ஜன்ம நட்சத்திரம் மற்றும் ராசியிலிருந்து கணக்கிடப்படுகிறது. ரஜ்ஜு தோஷம் மற்றும் செவ்வாய் தோஷம் திருக்கணிதம் தரநிலையில் மதிப்பிடப்படுகின்றன."}</p>

                <h2 id="jadhagam">{lang === "en" ? "Birth chart (Jadhagam)" : "ஜன்ம ஜாதகம்"}</h2>
                <p>{lang === "en"
                  ? "Jadhagam generation uses the South Indian square-chart format. The D1 (Rasi chart) and D9 (Navamsa chart) are computed using Lahiri ayanamsa and Drik ephemeris. Planet lordships, conjunctions, and aspects follow classical Parashari principles as applied in Tamil Jyotish."
                  : "ஜாதகம் உருவாக்கம் தென்னிந்திய சதுர-கட்ட வடிவத்தை பயன்படுத்துகிறது. D1 (ராசி கட்டம்) மற்றும் D9 (நவாம்ச கட்டம்) லாகிரி அயனாம்சம் மற்றும் திரிக் கோளக்கணிதத்தை பயன்படுத்தி கணக்கிடப்படுகின்றன. கிரக ஆட்சி, சேர்க்கை, பார்வைகள் தமிழ் ஜோதிடத்தில் பயன்படுத்தப்படும் பாராசரி கொள்கைகளை பின்பற்றுகின்றன."}</p>

                <h2 id="philosophy">{lang === "en" ? "Interpretation philosophy" : "விளக்கம் தத்துவம்"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is designed to help users interpret astrology thoughtfully, not fearfully. Every verdict includes the reasoning behind it. We deliberately avoid language that amplifies anxiety, exaggerates threats, or presents astrological periods as fixed outcomes."
                  : "விநாடி பயனர்களுக்கு பயமின்றி, சிந்தனையுடன் ஜோதிடத்தை புரிந்துகொள்ள உதவ வடிவமைக்கப்பட்டுள்ளது. ஒவ்வொரு தீர்ப்பும் அதன் பின்னால் உள்ள காரணத்தை உள்ளடக்கும். கவலையை அதிகரிக்கும், அச்சுறுத்தல்களை மிகைப்படுத்தும், ஜோதிட காலங்களை நிலையான முடிவுகளாக வழங்கும் மொழியை நாங்கள் வேண்டுமென்றே தவிர்க்கிறோம்."}</p>
                <div className="cl-callout">
                  <p>{lang === "en" ? "Jyotish is a tradition to plan calmly with — not a fixed fate to fear." : "ஜோதிடம் அமைதியாக திட்டமிட ஒரு பாரம்பரியம் — பயப்படும் நிலையான விதி அல்ல."}</p>
                </div>

                <div className="cl-trust-links">
                  <Link href="/learn/what-is-thirukanitham"          className="cl-trust-link">{lang === "en" ? "What is Thirukanitham? →"   : "திருக்கணிதம் என்றால் என்ன? →"}</Link>
                  <Link href="/features/daily-guidance"               className="cl-trust-link">{lang === "en" ? "How daily guidance works →" : "தினசரி வழிகாட்டுதல் எப்படி →"}</Link>
                  <Link href="/tools/marriage-porutham-calculator"    className="cl-trust-link">{lang === "en" ? "Porutham calculator →"      : "பொருத்தம் கணக்கிடல் →"}</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Start with one reading" : "ஒரு வாசிப்புடன் தொடங்குங்கள்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "See the method applied to your own chart, free during early access." : "ஆரம்ப அணுகல் காலத்தில் இலவசமாக உங்கள் சொந்த ஜாதகத்தில் முறை பயன்படுத்தப்படுவதை பாருங்கள்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
