"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { TRUST_METHOD, mt } from "@/lib/marketing-i18n";

export default function MethodologyPage() {
  const [lang] = useLang();
  const d = TRUST_METHOD;

  const CALC_STACK = [
    { label: "Thirukanitham",      desc: lang === "en" ? "True astronomical positions — the Tamil standard"      : "உண்மையான வானியல் நிலைகள் — தமிழ் தரநிலை" },
    { label: "Lahiri ayanamsa",    desc: lang === "en" ? "Government-recognised sidereal zodiac offset"           : "அரசாங்கம் அங்கீகரித்த நட்சத்திர ராசிக்கட்ட இடைவெளி" },
    { label: "Drik ephemeris",     desc: lang === "en" ? "High-precision planetary data"                         : "உயர் துல்லியமான கிரக தரவு" },
    { label: "Vimshottari dasha",  desc: lang === "en" ? "120-year planetary period cycle"                       : "120 ஆண்டு கிரக காலசுழற்சி" },
    { label: "Transit + panchangam", desc: lang === "en" ? "Daily transits and five-part almanac"                : "தினசரி கிரகநகர்வு மற்றும் ஐந்து கூறு பஞ்சாங்கம்" },
  ];

  const TOC = [
    { href: "#thirukanitham", label: lang === "en" ? "Thirukanitham"           : "திருக்கணிதம்" },
    { href: "#lahiri",        label: lang === "en" ? "Lahiri ayanamsa"         : "லாகிரி அயனாம்சம்" },
    { href: "#drik",          label: lang === "en" ? "Drik ephemeris"          : "திரிக் கோளக்கணிதம்" },
    { href: "#dasha",         label: lang === "en" ? "Vimshottari Dasha"       : "விம்சோத்தரி தசை" },
    { href: "#gochar",        label: lang === "en" ? "Transits"                 : "கிரகநகர்வு" },
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
              <TopicSymbolPanel topic="method" />
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
                  : "விநாடி திருக்கணிதத்தை அடிப்படையாகக் கொண்டது. பிறந்த தருணத்திலும் எந்த நாளிலும் வான்பொருட்கள் எங்கு இருக்கின்றன என்பதைத் துல்லியமாகக் கணக்கிடும் தமிழ் மரபு இதுதான்."}</p>
                <p>{lang === "en"
                  ? "Unlike generalized astrology apps that use approximate planetary data, Vinaadi uses Thirukanitham-based computation to produce birth charts, panchangam, and transit readings anchored to the exact Tamil astrological standard."
                  : "தோராயமான கிரகத் தரவை நம்பும் பல ஜோதிட ஆப்களிலிருந்து வேறுபட்டு, விநாடி திருக்கணிதக் கணக்கீட்டின் அடிப்படையில் ஜாதகம், பஞ்சாங்கம், கிரகநகர்வு வாசிப்பு ஆகிய அனைத்தையும் தமிழ் தரநிலைக்கேற்ப உருவாக்குகிறது."}</p>

                <h2 id="lahiri">{lang === "en" ? "Lahiri ayanamsa" : "லாகிரி அயனாம்சம்"}</h2>
                <p>{lang === "en"
                  ? "Tamil Jyotish uses the sidereal zodiac — the fixed star positions — rather than the tropical zodiac used in Western astrology. The difference between sidereal and tropical positions is called the ayanamsa. Vinaadi uses the Lahiri ayanamsa, the government-recognized standard in India."
                  : "தமிழ் ஜோதிடம் மேற்கத்திய வெப்பமண்டல ராசிக்கட்டத்தை அல்ல, நிலையான நட்சத்திர நிலைகளை அடிப்படையாகக் கொண்ட நட்சத்திர ராசிக்கட்டத்தையே பயன்படுத்துகிறது. இந்த இரண்டு முறைகளுக்கிடையிலான வேறுபாடே அயனாம்சம். இந்தியாவில் அரசாங்கம் அங்கீகரித்த லாகிரி அயனாம்சத்தையே விநாடி பயன்படுத்துகிறது."}</p>

                <h2 id="drik">{lang === "en" ? "Drik ephemeris precision" : "திரிக் கோளக்கணித துல்லியம்"}</h2>
                <p>{lang === "en"
                  ? "Planet positions are computed using the Drik (visual) ephemeris — the same astronomical data used in modern panchang publications. This provides the highest precision available for Tamil astrological calculation."
                  : "கிரக நிலைகள் திரிக் கோளக்கணிதத் தரவை வைத்து கணக்கிடப்படுகின்றன. நவீன பஞ்சாங்க வெளியீடுகளில் பயன்படுத்தப்படும் அதே வானியல் ஆதாரம் இதுவே. அதனால் தமிழ் ஜோதிடக் கணக்கில் உயர்ந்த துல்லியம் கிடைக்கிறது."}</p>

                <h2 id="dasha">{lang === "en" ? "Vimshottari Dasha system" : "விம்சோத்தரி தசை முறை"}</h2>
                <p>{lang === "en"
                  ? "Daily guidance integrates the Vimshottari Dasha system — a 120-year planetary period cycle tied to the birth star. Dasha periods define the dominant planetary influence over each phase of life, and the sub-period (bhukti) adds granularity to daily and weekly guidance."
                  : "தினசரி வழிகாட்டுதலில் விம்சோத்தரி தசை முறை இணைக்கப்பட்டுள்ளது. பிறப்பு நட்சத்திரத்தை அடிப்படையாகக் கொண்ட 120 ஆண்டு கிரகச் சுழற்சி இது. வாழ்க்கையின் ஒவ்வொரு கட்டத்திலும் எந்த கிரகத்தின் ஆதிக்கம் வேலை செய்கிறது என்பதை தசை காட்டும்; புக்தி அதனை இன்னும் நுணுக்கமாக விளக்குகிறது."}</p>

                <h2 id="gochar">{lang === "en" ? "Transits" : "கிரகநகர்வு"}</h2>
                <p>{lang === "en"
                  ? "Transits are the planets' current movements relative to your birth chart. Vinaadi combines major transits — especially Saturn, Jupiter, Rahu, and Ketu — with dasha periods to judge the tone of each day. Key effects like Chandrashtama and Ashtama Shani are tracked clearly, without fear language."
                  : "உங்கள் பிறப்பு ஜாதகத்துடன் ஒப்பிடும்போது கிரகங்கள் இப்போது எங்கு நகர்கின்றன என்பதையே கிரகநகர்வு என்று சொல்கிறோம். சனி, குரு, ராகு, கேது போன்ற முக்கிய நகர்வுகளை விநாடி தசையுடன் சேர்த்து பார்த்து நாளின் தரத்தை மதிப்பிடுகிறது. சந்திராஷ்டமம், அஷ்டம சனி போன்ற சுட்டிகளும் பயமுறுத்தாமல் தெளிவாகக் காட்டப்படுகின்றன."}</p>

                <h2 id="panchangam">{lang === "en" ? "Panchangam" : "பஞ்சாங்கம்"}</h2>
                <p>{lang === "en"
                  ? "The Tamil panchangam is a five-part daily almanac covering: Tithi (lunar day), Vara (weekday), the Moon's star, Yoga (sun-moon combination), and Karana (half-tithi). Vinaadi computes a precise panchangam for each day and uses it as one of the signals in the daily guidance calculation. Rahu Kalam, Yamagandam, and auspicious timings (Amrit Kalam) are surfaced as best-window and hold-window guidance."
                  : "தமிழ் பஞ்சாங்கம் தினமும் சொல்லும் ஐந்து கூறுகள் இவை: திதி, வாரம், நட்சத்திரம், யோகம், கரணம். விநாடி ஒவ்வொரு நாளுக்கும் இதைத் துல்லியமாகக் கணக்கிட்டு தினசரி வழிகாட்டுதலின் ஒரு முக்கியச் சுட்டியாகப் பயன்படுத்துகிறது. ராகு காலம், யமகண்டம், அமிர்த காலம் போன்ற நேரங்களும் வாசிப்பில் தெளிவாகத் தெரியும்."}</p>

                <h2 id="daily-score">{lang === "en" ? "Multi-signal daily score" : "பல சமிக்ஞை தினசரி மதிப்பெண்"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi's daily score combines: current dasha and bhukti period quality, transit influences on your birth chart, panchangam quality for the day, the Moon's star position, and Ashtakavarga contributions where applicable."
                  : "விநாடியின் தினசரி மதிப்பெண் பல சுட்டிகளை ஒன்றாகப் பார்க்கிறது: நடப்பு தசை, புக்தி தரம், ஜாதகத்தின் மீது படும் கிரகநகர்வு தாக்கம், நாளுக்கான பஞ்சாங்க நிலை, சந்திர நட்சத்திரம், தேவையான இடங்களில் அஷ்டகவர்க பங்களிப்பு."}</p>

                <h2 id="porutham">{lang === "en" ? "Porutham (marriage compatibility)" : "பொருத்தம் (திருமண பொருத்தம்)"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi calculates the traditional 10 Porutham system used in Tamil marriage matching — Dinam, Ganam, Mahendram, Stree Deergham, Yoni, Rajju, Vedha, Rasi, Rasiyathipathi, and Nadi — each computed from the birth star and rasi. Rajju dosha and Sevvai dosham are assessed using the Thirukanitham standard."
                  : "தமிழ் திருமணப் பொருத்தத்தில் பயன்படும் பாரம்பரிய பத்து பொருத்தங்களையும் விநாடி கணக்கிடுகிறது: தினம், கணம், மகேந்திரம், ஸ்திரீ தீர்க்கம், யோனி, ரஜ்ஜு, வேதம், ராசி, ராசியதிபதி, நாடி. இவை அனைத்தும் பிறப்பு நட்சத்திரம், ராசி ஆகியவற்றின் அடிப்படையில் கணக்கிடப்படுகின்றன. ரஜ்ஜு குறைவும் செவ்வாய் தோஷமும் திருக்கணிதத் தரநிலையிலேயே மதிப்பிடப்படுகின்றன."}</p>

                <h2 id="jadhagam">{lang === "en" ? "Birth chart (Jadhagam)" : "பிறப்பு ஜாதகம்"}</h2>
                <p>{lang === "en"
                  ? "Jadhagam generation uses the South Indian square-chart format. The D1 (Rasi chart) and D9 (Navamsa chart) are computed using Lahiri ayanamsa and Drik ephemeris. Planet lordships, conjunctions, and aspects follow classical Parashari principles as applied in Tamil Jyotish."
                  : "ஜாதகம் தென்னிந்திய சதுரக் கட்ட வடிவத்தில் உருவாக்கப்படுகிறது. D1 ராசி கட்டமும் D9 நவாம்ச கட்டமும் லாகிரி அயனாம்சம், திரிக் கோளக்கணிதம் ஆகியவற்றின் அடிப்படையில் கணக்கிடப்படுகின்றன. கிரக ஆட்சி, சேர்க்கை, பார்வை ஆகியவை தமிழ் ஜோதிடத்தில் பயன்படும் பாராசரி முறையிலேயே பார்க்கப்படுகின்றன."}</p>

                <h2 id="philosophy">{lang === "en" ? "Interpretation philosophy" : "விளக்கம் தத்துவம்"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is designed to help users interpret astrology thoughtfully, not fearfully. Every verdict includes the reasoning behind it. We deliberately avoid language that amplifies anxiety, exaggerates threats, or presents astrological periods as fixed outcomes."
                  : "விநாடி பயமுறுத்தாமல், சிந்தித்துப் புரிந்து கொள்ள உதவுவதற்காக வடிவமைக்கப்பட்டுள்ளது. ஒவ்வொரு முடிவுக்கும் அதன் காரணம் காட்டப்படும். கவலையை தூண்டும், அச்சத்தை பெருக்கும், ஜோதிடக் காலத்தை இறுதி தீர்ப்பாகச் சொல்வதுபோன்ற மொழியை நாங்கள் திட்டமிட்டு தவிர்க்கிறோம்."}</p>
                <p>{lang === "en"
                  ? "A dasha period is a window, not a verdict. It describes the quality of energy available to you — which planetary influences are amplified, which life domains are active, where effort will find the most traction. What you do with that window is yours to determine. A challenging dasha navigated with awareness can produce more growth than an easy one spent passively. A favourable dasha that receives no directed effort can pass without producing what it was capable of."
                  : "ஒரு தசைக் காலம் தீர்ப்பல்ல — ஒரு ஜன்னல். உங்களுக்குக் கிடைக்கும் ஆற்றலின் தரத்தை அது விவரிக்கிறது: எந்த கிரக தாக்கங்கள் பெருக்கப்படுகின்றன, எந்த வாழ்க்கை துறைகள் செயலில் உள்ளன, முயற்சி எங்கே மிகவும் பலன் தரும். அந்த ஜன்னலை வைத்து நீங்கள் என்ன செய்கிறீர்கள் என்பதை நீங்களே தீர்மானிக்கிறீர்கள். விழிப்புணர்வுடன் கடந்த ஒரு சவாலான தசை, அலட்சியமாக கழிந்த ஒரு எளிதான தசையை விட அதிக வளர்ச்சியைத் தரலாம்."}</p>
                <p>{lang === "en"
                  ? "Tamil Jyotish has always understood that the inner world and the outer world mirror each other. What you hold in mind consistently — what you fear, what you pursue, what you attend to — shapes the field in which planetary energies act. Vinaadi reads the field. Your intention directs it. The two work together: good timing plus focused effort produces outcomes that neither would produce alone."
                  : "தமிழ் ஜோதிடம் எப்போதும் உள்ளுலகும் புறவுலகும் ஒன்றை ஒன்று பிரதிபலிக்கும் என்பதை அறிந்திருந்தது. நீங்கள் தொடர்ந்து மனதில் வைத்திருப்பது — என்ன பயப்படுகிறீர்கள், என்ன தேடுகிறீர்கள், எதில் கவனம் செலுத்துகிறீர்கள் — கிரக ஆற்றல்கள் செயல்படும் தளத்தை வடிவமைக்கிறது. விநாடி அந்த தளத்தை வாசிக்கிறது. உங்கள் நோக்கம் அதை வழிநடத்துகிறது. இரண்டும் சேர்ந்து செயல்படும்போதே — சரியான நேரமும் கவனமான முயற்சியும் — ஒவ்வொன்றும் தனியாக உருவாக்க முடியாத பலன்கள் கிடைக்கும்."}</p>
                <div className="cl-callout">
                  <p>{lang === "en" ? "Jyotish is a tradition to plan calmly with — not a fixed fate to fear." : "ஜோதிடம் அமைதியாக திட்டமிட ஒரு பாரம்பரியம் — பயப்படும் நிலையான விதி அல்ல."}</p>
                </div>
                <div className="cl-callout">
                  <p>{lang === "en" ? "A dasha window amplifies what you direct into it. Vinaadi shows you the window. The direction is yours." : "தசை ஜன்னல் நீங்கள் அதில் செலுத்துவதை பெருக்குகிறது. ஜன்னலை விநாடி காட்டுகிறது. திசையை நீங்கள் தீர்மானிக்கிறீர்கள்."}</p>
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
              <p className="cl-cta-strip__body">{lang === "en" ? "See the method applied to your own chart, free during early access." : "ஆரம்ப அணுகல் காலத்தில் இலவசமாக, இந்த முறை உங்கள் சொந்த ஜாதகத்தில் எப்படி வேலை செய்கிறது என்பதைப் பாருங்கள்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
