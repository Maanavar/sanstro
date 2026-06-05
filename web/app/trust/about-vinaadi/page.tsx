"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TRUST_ABOUT, mt } from "@/lib/marketing-i18n";

export default function AboutPage() {
  const [lang] = useLang();
  const d = TRUST_ABOUT;

  const BELIEFS = [
    { label: lang === "en" ? "Precise"       : "துல்லியமான",   desc: lang === "en" ? "Thirukanitham, Lahiri ayanamsa, Drik ephemeris"              : "திருக்கணிதம், லாகிரி அயனாம்சம், திரிக் கோளக்கணிதம்" },
    { label: lang === "en" ? "Calm"           : "அமைதியான",    desc: lang === "en" ? "No doom language; every verdict shows its reasoning"          : "பயமுறுத்தும் மொழி இல்லை; ஒவ்வொரு தீர்ப்பும் காரணம் காட்டுகிறது" },
    { label: lang === "en" ? "Family-aware"   : "குடும்ப உணர்வு", desc: lang === "en" ? "Built for the way Tamil families actually plan"           : "தமிழ் குடும்பங்கள் உண்மையில் திட்டமிடும் விதத்திற்காக கட்டப்பட்டது" },
    { label: lang === "en" ? "Honest"         : "நேர்மையான",   desc: lang === "en" ? "Jyotish is tradition, not science — we say so"               : "ஜோதிடம் பாரம்பரியம், அறிவியல் அல்ல — நாங்கள் தெளிவாக சொல்கிறோம்" },
  ];

  const TOC = [
    { href: "#problem",      label: lang === "en" ? "The problem we solve"  : "நாங்கள் தீர்க்கும் பிரச்சினை" },
    { href: "#what-vinaadi-is", label: lang === "en" ? "What Vinaadi is"    : "விநாடி என்னது" },
    { href: "#how-different", label: lang === "en" ? "How it's different"   : "எவ்வாறு வேறுபட்டது" },
    { href: "#what-not",     label: lang === "en" ? "What it is not"        : "என்னது அல்ல" },
    { href: "#early-access", label: lang === "en" ? "Early access"          : "ஆரம்ப அணுகல்" },
  ];

  const DIFFERENCES = [
    { title: lang === "en" ? "Thirukanitham precision."       : "திருக்கணிதம் துல்லியம்.",          body: lang === "en" ? "Every calculation uses the Tamil standard — Lahiri ayanamsa, Drik ephemeris, traditional South Indian chart format."                                                    : "ஒவ்வொரு கணக்கீடும் தமிழ் தரநிலையை பயன்படுத்துகிறது — லாகிரி அயனாம்சம், திரிக் கோளக்கணிதம், பாரம்பரிய தென்னிந்திய ஜாதக வடிவம்." },
    { title: lang === "en" ? "Assistant-first, not tool-first." : "உதவியாளர் முதல், கருவி அல்ல.", body: lang === "en" ? "The daily reading integrates chart, dasha, transits, and panchangam together. Tools are available when needed but do not define the experience."                              : "தினசரி வாசிப்பு ஜாதகம், தசை, கோசாரம், பஞ்சாங்கம் ஒன்றாக இணைக்கிறது. கருவிகள் தேவைப்படும்போது கிடைக்கும் ஆனால் அனுபவத்தை வரையறுக்காது." },
    { title: lang === "en" ? "Family-aware."                   : "குடும்ப உணர்வு.",                body: lang === "en" ? "Most astrology products stop at individual readings. Vinaadi is designed for the way Tamil families actually use astrology — together."                                        : "பெரும்பாலான ஜோதிட தயாரிப்புகள் தனிப்பட்ட வாசிப்பில் நிறுத்திக்கொள்கின்றன. விநாடி தமிழ் குடும்பங்கள் உண்மையில் ஜோதிடத்தை பயன்படுத்தும் விதத்திற்காக — சேர்ந்து — வடிவமைக்கப்பட்டுள்ளது." },
    { title: lang === "en" ? "Calm language."                  : "அமைதியான மொழி.",                 body: lang === "en" ? "No doom language. No fear-based predictions. Every signal includes reasoning. Users understand what the reading is based on."                                              : "பயமுறுத்தும் மொழி இல்லை. பயம் சார்ந்த கணிப்புகள் இல்லை. ஒவ்வொரு சமிக்ஞையும் காரணத்தை உள்ளடக்கும். பயனர்கள் வாசிப்பு எதன் அடிப்படையிலானது என்று புரிந்துகொள்கிறார்கள்." },
    { title: lang === "en" ? "Transparent reasoning."          : "வெளிப்படையான காரணம்.",           body: lang === "en" ? "Vinaadi shows you why a day scores the way it does. Dasha period quality, transit influences, panchangam quality — all visible."                                           : "விநாடி ஒரு நாள் ஏன் அந்த மதிப்பெண் பெறுகிறது என்று காட்டுகிறது. தசை தரம், கோசார தாக்கங்கள், பஞ்சாங்க தரம் — அனைத்தும் தெரியும்." },
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
                <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}</Link>
                <Link href="/trust/methodology" className="cl-btn cl-btn--ghost">{lang === "en" ? "Our methodology" : "எங்கள் கணக்கீட்டு முறை"}</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "What we believe" : "நாங்கள் நம்புவது"}</p>
              <div className="cl-hero-figure__rows">
                {BELIEFS.map((row) => (
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

                <h2 id="problem">{lang === "en" ? "The problem Vinaadi solves" : "விநாடி தீர்க்கும் பிரச்சினை"}</h2>
                <p>{lang === "en"
                  ? "Most astrology apps are built around passive consumption — daily sun-sign horoscopes, generic forecasts, or entertainment content. They are not designed for the Tamil Jyotish practitioner who needs Thirukanitham-accurate birth charts, or the family that wants to plan shared decisions using real astrological signals."
                  : "பெரும்பாலான ஜோதிட ஆப்கள் செயலற்ற நுகர்வை சுற்றி கட்டப்பட்டுள்ளன — தினசரி சூரிய ராசி ஜோதிட பலன்கள், பொதுவான கணிப்புகள், அல்லது பொழுதுபோக்கு உள்ளடக்கம். திருக்கணிதம் துல்லியமான ஜன்ம ஜாதகங்கள் தேவைப்படும் தமிழ் ஜோதிட பயிற்சியாளருக்காக, அல்லது உண்மையான ஜோதிட சமிக்ஞைகளைப் பயன்படுத்தி பகிரப்பட்ட முடிவுகளை திட்டமிட விரும்பும் குடும்பத்திற்காக அவை வடிவமைக்கப்படவில்லை."}</p>
                <p>{lang === "en"
                  ? "There is also a trust problem. Many existing tools use fear-amplifying language — warning of 'dangerous' periods, predicting bad outcomes, or presenting astrological signals as fixed fate. That is not how traditional Tamil Jyotish is meant to be used."
                  : "நம்பிக்கை பிரச்சினையும் உள்ளது. பல தற்போதுள்ள கருவிகள் பயம் அதிகரிக்கும் மொழியை பயன்படுத்துகின்றன — 'ஆபத்தான' காலங்களை எச்சரிக்கை செய்வது, மோசமான முடிவுகளை கணிப்பது, அல்லது ஜோதிட சமிக்ஞைகளை நிலையான விதியாக வழங்குவது. அதுவே பாரம்பரிய தமிழ் ஜோதிடம் பயன்படுத்தப்பட வேண்டிய விதமல்ல."}</p>

                <h2 id="what-vinaadi-is">{lang === "en" ? "What Vinaadi is" : "விநாடி என்னது"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is an assistant. It reads your chart, tracks your dasha, monitors transits, computes a daily panchangam, and gives you one quiet reading every morning — a score, a best window, a caution window, and a brief interpretation in plain language."
                  : "விநாடி ஒரு உதவியாளர். உங்கள் ஜாதகத்தை படிக்கிறது, தசையை கண்காணிக்கிறது, கோசாரங்களை கவனிக்கிறது, தினசரி பஞ்சாங்கம் கணக்கிடுகிறது, ஒவ்வொரு காலையும் ஒரு அமைதியான வாசிப்பை தருகிறது — ஒரு மதிப்பெண், சிறந்த நேரம், எச்சரிக்கை நேரம், எளிய மொழியில் சுருக்கமான விளக்கம்."}</p>
                <p>{lang === "en"
                  ? "When you need a specific tool — porutham matching, jadhagam generation, birth time rectification, or panchangam — those tools are part of the same assistant."
                  : "குறிப்பிட்ட கருவி தேவைப்படும்போது — பொருத்தம் பார்ப்பது, ஜாதகம் உருவாக்குவது, பிறந்த நேர திருத்தம், பஞ்சாங்கம் — அந்த கருவிகள் அதே உதவியாளரின் ஒரு பகுதி."}</p>
                <p>{lang === "en"
                  ? "When you have family members to plan with, their readings sit alongside yours. The shared timing windows help you make decisions together."
                  : "திட்டமிட குடும்பத்தினர் இருக்கும்போது, அவர்களின் வாசிப்புகள் உங்களுடன் அமர்கின்றன. பகிரப்பட்ட நேர சாளரங்கள் உங்களுக்கு சேர்ந்து முடிவுகள் எடுக்க உதவுகின்றன."}</p>

                <h2 id="how-different">{lang === "en" ? "How Vinaadi is different" : "விநாடி எவ்வாறு வேறுபட்டது"}</h2>
                <ul>
                  {DIFFERENCES.map((item) => (
                    <li key={item.title}><strong>{item.title}</strong> {item.body}</li>
                  ))}
                </ul>

                <h2 id="what-not">{lang === "en" ? "What Vinaadi is not" : "விநாடி என்னது அல்ல"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is not a replacement for a trained Jyotish practitioner for complex life decisions. It is not medical, legal, or financial advice. It is a planning assistant that uses Tamil astrological tradition to help people think about time, timing, and context — with clarity rather than anxiety."
                  : "விநாடி சிக்கலான வாழ்க்கை முடிவுகளுக்கு பயிற்சி பெற்ற ஜோதிட பயிற்சியாளரை மாற்றுவதில்லை. இது மருத்துவ, சட்ட அல்லது நிதி ஆலோசனை அல்ல. இது நேரம், நேர நிர்ணயம், சூழல் பற்றி சிந்திக்க மக்களுக்கு உதவும் திட்டமிடல் உதவியாளர் — கவலைக்கு பதிலாக தெளிவுடன்."}</p>
                <div className="cl-callout">
                  <p>{lang === "en" ? "A planning assistant for time, timing, and context — with clarity rather than anxiety." : "நேரம், நேர நிர்ணயம், சூழலுக்கான திட்டமிடல் உதவியாளர் — கவலைக்கு பதிலாக தெளிவுடன்."}</p>
                </div>

                <h2 id="early-access">{lang === "en" ? "Early access" : "ஆரம்ப அணுகல்"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is currently in early access. The core experience — daily guidance, porutham, jadhagam, family vault — is available now. We are building toward a fuller assistant experience including richer guidance narratives, deeper chart exploration, and expanded family planning tools."
                  : "விநாடி தற்போது ஆரம்ப அணுகல் நிலையில் உள்ளது. முக்கிய அனுபவம் — தினசரி வழிகாட்டுதல், பொருத்தம், ஜாதகம், குடும்ப சேகரிப்பு — இப்போது கிடைக்கும். நாங்கள் இன்னும் நிறைவான உதவியாளர் அனுபவத்தை நோக்கி கட்டுகிறோம், செழுமையான வழிகாட்டுதல் விவரங்கள், ஆழமான ஜாதக ஆய்வு, விரிவான குடும்ப திட்டமிடல் கருவிகள் உட்பட."}</p>

                <div className="cl-trust-links">
                  <Link href="/trust/methodology"       className="cl-trust-link">{lang === "en" ? "Our methodology →"            : "எங்கள் கணக்கீட்டு முறை →"}</Link>
                  <Link href="/features/daily-guidance" className="cl-trust-link">{lang === "en" ? "How daily guidance works →"   : "தினசரி வழிகாட்டுதல் எப்படி →"}</Link>
                  <Link href="/dashboard"               className="cl-trust-link">{lang === "en" ? "Open dashboard →"             : "டேஷ்போர்டு திற →"}</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Start with today's reading" : "இன்றைய வாசிப்புடன் தொடங்குங்கள்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "Free during early access. Full chart, daily guidance, family vault." : "ஆரம்ப அணுகல் காலத்தில் இலவசம். முழுமையான ஜாதகம், தினசரி வழிகாட்டுதல், குடும்ப சேகரிப்பு."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
