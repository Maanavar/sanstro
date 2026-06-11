"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { TRUST_ABOUT, mt } from "@/lib/marketing-i18n";

export default function AboutPage() {
  const [lang] = useLang();
  const d = TRUST_ABOUT;

  const BELIEFS = [
    { label: lang === "en" ? "Precise"       : "துல்லியமான",   desc: lang === "en" ? "Thirukanitham, Lahiri ayanamsa, Drik ephemeris"              : "திருக்கணிதம், லாகிரி அயனாம்சம், திரிக் கோளக்கணிதம்" },
    { label: lang === "en" ? "Calm"           : "அமைதியான",    desc: lang === "en" ? "No doom language; every verdict shows its reasoning"          : "பயமுறுத்தும் மொழி இல்லை; ஒவ்வொரு தீர்ப்பும் காரணம் காட்டுகிறது" },
    { label: lang === "en" ? "Family-aware"   : "குடும்ப உணர்வு", desc: lang === "en" ? "Built for the way Tamil families actually plan"           : "தமிழ் குடும்பங்கள் உண்மையில் ஆலோசித்து முடிவு எடுக்கும் முறைக்கே இது அமைக்கப்பட்டது" },
    { label: lang === "en" ? "Honest"         : "நேர்மையான",   desc: lang === "en" ? "Jyotish is tradition, not science — we say so"               : "ஜோதிடம் பாரம்பரியம்; அறிவியல் அல்ல என்பதை நாங்கள் தெளிவாகச் சொல்கிறோம்" },
  ];

  const TOC = [
    { href: "#problem",      label: lang === "en" ? "The problem we solve"  : "நாங்கள் தீர்க்கும் பிரச்சினை" },
    { href: "#what-vinaadi-is", label: lang === "en" ? "What Vinaadi is"    : "விநாடி என்ன" },
    { href: "#how-different", label: lang === "en" ? "How it's different"   : "எவ்வாறு வேறுபட்டது" },
    { href: "#what-not",     label: lang === "en" ? "What it is not"        : "எது அல்ல" },
    { href: "#early-access", label: lang === "en" ? "Early access"          : "ஆரம்ப அணுகல்" },
  ];

  const DIFFERENCES = [
    { title: lang === "en" ? "Thirukanitham precision."       : "திருக்கணிதத் துல்லியம்.",          body: lang === "en" ? "Every calculation uses the Tamil standard — Lahiri ayanamsa, Drik ephemeris, traditional South Indian chart format."                                                    : "ஒவ்வொரு கணக்கீடும் தமிழ் ஜோதிடத்தில் பயன்படுத்தப்படும் தரநிலையையே பின்பற்றுகிறது: லாகிரி அயனாம்சம், திரிக் கோளக்கணிதம், தென்னிந்திய ஜாதக வடிவம்." },
    { title: lang === "en" ? "Assistant-first, not tool-first." : "முதலில் வழிகாட்டல்.", body: lang === "en" ? "The daily reading integrates chart, dasha, transits, and panchangam together. Tools are available when needed but do not define the experience."                              : "தினசரி வாசிப்பில் ஜாதகம், தசை, கிரகநகர்வு, பஞ்சாங்கம் அனைத்தும் ஒன்றாக சேர்கின்றன. கருவிகள் இருக்கின்றன; ஆனால் அனுபவத்தை அவை மட்டுமே நிர்ணயிக்கவில்லை." },
    { title: lang === "en" ? "Family-aware."                   : "குடும்பம் மையம்.",                body: lang === "en" ? "Most astrology products stop at individual readings. Vinaadi is designed for the way Tamil families actually use astrology — together."                                        : "பல ஜோதிட சேவைகள் ஒருவரின் வாசிப்பில் முடிந்து விடுகின்றன. விநாடி குடும்பமாக சேர்ந்து பார்க்கவும், ஆலோசிக்கவும், முடிவு எடுக்கவும் வடிவமைக்கப்பட்டுள்ளது." },
    { title: lang === "en" ? "Calm language."                  : "அமைதியான சொல் நடை.",                 body: lang === "en" ? "No doom language. No fear-based predictions. Every signal includes reasoning. Users understand what the reading is based on."                                              : "பயமுறுத்தும் சொற்கள் இல்லை. அச்சத்தை தூண்டும் கணிப்புகள் இல்லை. ஒவ்வொரு சுட்டிக்கும் காரணம் காட்டப்படும்; வாசிப்பு எதின் அடிப்படையில் வருகிறது என்பதையும் பயனர் புரிந்து கொள்ள முடியும்." },
    { title: lang === "en" ? "Transparent reasoning."          : "வெளிப்படையான காரணம்.",           body: lang === "en" ? "Vinaadi shows you why a day scores the way it does. Dasha period quality, transit influences, panchangam quality — all visible."                                           : "ஒரு நாள் ஏன் அப்படிப் படிக்கப்படுகிறது என்பதை விநாடி மறைக்காது. தசை தரம், கிரகநகர்வு தாக்கம், பஞ்சாங்க நிலை ஆகியவை தெளிவாகக் காட்டப்படும்." },
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
              <TopicSymbolPanel topic="about" />
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
                  : "பெரும்பாலான ஜோதிட ஆப்கள் தினசரி சூரிய ராசி பலன், பொதுவான கணிப்பு, அல்லது பொழுதுபோக்கு வாசிப்பைச் சுற்றியே நிற்கின்றன. திருக்கணிதம் துல்லியமான ஜாதகம் வேண்டிய தமிழ் ஜோதிட பயனருக்கும், உண்மையான ஜோதிடச் சுட்டிகளை வைத்து குடும்பமாக முடிவு எடுக்க விரும்புபவர்களுக்கும் அவை வடிவமைக்கப்படவில்லை."}</p>
                <p>{lang === "en"
                  ? "There is also a trust problem. Many existing tools use fear-amplifying language — warning of 'dangerous' periods, predicting bad outcomes, or presenting astrological signals as fixed fate. That is not how traditional Tamil Jyotish is meant to be used."
                  : "மேலும் நம்பகத்தன்மை பிரச்சினையும் இருக்கிறது. பல கருவிகள் பயத்தை தூண்டும் மொழியில் 'ஆபத்து', 'கெட்ட காலம்' என்று பேசுகின்றன. பாரம்பரிய தமிழ் ஜோதிடம் அப்படிப் பயன்படுத்தப்பட வேண்டியதல்ல."}</p>

                <h2 id="what-vinaadi-is">{lang === "en" ? "What Vinaadi is" : "விநாடி என்ன"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is an assistant. It reads your chart, tracks your dasha, monitors transits, computes a daily panchangam, and gives you one quiet reading every morning — a score, a best window, a caution window, and a brief interpretation in plain language."
                  : "விநாடி ஒரு உதவியாளர். உங்கள் ஜாதகத்தைப் படிக்கிறது, தசை முன்னேற்றத்தை கவனிக்கிறது, கிரகநகர்வை பார்க்கிறது, தின பஞ்சாங்கத்தை கணக்கிடுகிறது, ஒவ்வொரு காலையும் ஒரு அமைதியான வாசிப்பைத் தருகிறது: ஒரு மதிப்பெண், நல்ல நேரம், கவன நேரம், எளிய விளக்கம்."}</p>
                <p>{lang === "en"
                  ? "When you need a specific tool — porutham matching, jadhagam generation, birth time rectification, or panchangam — those tools are part of the same assistant."
                  : "பொருத்தம் பார்க்கவும், ஜாதகம் உருவாக்கவும், பிறந்த நேரத்தைத் திருத்தவும், பஞ்சாங்கத்தைப் பார்க்கவும் வேண்டுமென்றால், அவையும் இதே உதவியாளருக்குள் இருக்கின்றன."}</p>
                <p>{lang === "en"
                  ? "When you have family members to plan with, their readings sit alongside yours. The shared timing windows help you make decisions together."
                  : "குடும்பத்தினருடன் திட்டமிட வேண்டுமெனில், அவர்களின் வாசிப்புகளும் உங்களுடையதோடு சேர்ந்து தெரியும். எல்லோருக்கும் ஏற்ற நேரத்தை ஒன்றாகத் தேர்வு செய்யலாம்."}</p>

                <h2 id="how-different">{lang === "en" ? "How Vinaadi is different" : "விநாடி எவ்வாறு வேறுபட்டது"}</h2>
                <ul>
                  {DIFFERENCES.map((item) => (
                    <li key={item.title}><strong>{item.title}</strong> {item.body}</li>
                  ))}
                </ul>

                <h2 id="what-not">{lang === "en" ? "What Vinaadi is not" : "விநாடி எது அல்ல"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is not a replacement for a trained Jyotish practitioner for complex life decisions. It is not medical, legal, or financial advice. It is a planning assistant that uses Tamil astrological tradition to help people think about time, timing, and context — with clarity rather than anxiety."
                  : "விநாடி சிக்கலான வாழ்க்கை முடிவுகளுக்கு பயிற்சி பெற்ற ஜோதிடருக்குப் பதிலாக வருவதில்லை. இது மருத்துவ, சட்ட, நிதி ஆலோசனையும் அல்ல. நேரம், சூழல், முடிவு ஆகியவற்றை அமைதியாக சிந்திக்க உதவும் திட்டமிடல் துணை மட்டுமே."}</p>
                <div className="cl-callout">
                  <p>{lang === "en" ? "A planning assistant for time, timing, and context — with clarity rather than anxiety." : "நேரம், சூழல், முடிவு ஆகியவற்றை தெளிவாகச் சிந்திக்க உதவும் அமைதியான திட்டமிடல் துணை."}</p>
                </div>

                <h2 id="early-access">{lang === "en" ? "Early access" : "ஆரம்ப அணுகல்"}</h2>
                <p>{lang === "en"
                  ? "Vinaadi is currently in early access. The core experience — daily guidance, porutham, jadhagam, family vault — is available now. We are building toward a fuller assistant experience including richer guidance narratives, deeper chart exploration, and expanded family planning tools."
                  : "விநாடி இப்போது ஆரம்ப அணுகலில் உள்ளது. தினசரி வழிகாட்டுதல், பொருத்தம், ஜாதகம், குடும்ப சேகரிப்பு ஆகிய முக்கிய அம்சங்கள் பயன்படுத்தத் தயாராக உள்ளன. அடுத்தடுத்து மேலும் ஆழமான ஜாதகப் புரிதல், வளமான விளக்கங்கள், குடும்பத் திட்டமிடல் கருவிகள் சேர்க்கப்படுகின்றன."}</p>

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
              <p className="cl-cta-strip__body">{lang === "en" ? "Free during early access. Full chart, daily guidance, family vault." : "ஆரம்ப அணுகல் காலத்தில் இலவசம். முழு ஜாதகம், தினசரி வழிகாட்டுதல், குடும்ப சேகரிப்பு அனைத்தும் திறந்திருக்கிறது."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
