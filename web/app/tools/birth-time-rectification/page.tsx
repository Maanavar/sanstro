"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TOOL_BTR, mt } from "@/lib/marketing-i18n";

export default function BirthTimeRectificationPage() {
  const [lang] = useLang();
  const d = TOOL_BTR;

  const STEPS = [
    { title: lang === "en" ? "Step 1: Enter approximate birth time" : "படி 1: தோராயமான பிறந்த நேரம் உள்ளிடவும்", body: lang === "en" ? "Provide the birth time you know — from hospital records, family recollection, or other sources." : "நீங்கள் அறிந்த பிறந்த நேரத்தை கொடுங்கள் — மருத்துவமனை பதிவுகள், குடும்பத்தினர் நினைவில், அல்லது பிற மூலங்களிலிருந்து." },
    { title: lang === "en" ? "Step 2: Add key life events" : "படி 2: முக்கிய வாழ்க்கை நிகழ்வுகளை சேர்க்கவும்", body: lang === "en" ? "Marriage, major career events, relocations, health events, losses — anything significant with an approximate date." : "திருமணம், முக்கிய தொழில் நிகழ்வுகள், இடமாற்றங்கள், உடல்நல நிகழ்வுகள், இழப்புகள் — தோராயமான தேதியுடன் எந்த முக்கியமான நிகழ்வும்." },
    { title: lang === "en" ? "Step 3: Vinaadi tests the range" : "படி 3: விநாடி வரம்பை சோதிக்கிறது", body: lang === "en" ? "The tool calculates which birth time within a ±30 to ±60 minute window produces dasha periods matching your events most closely." : "கருவி ±30 முதல் ±60 நிமிட சாளரத்திற்குள் எந்த பிறந்த நேரம் உங்கள் நிகழ்வுகளுடன் மிகவும் நெருக்கமாக பொருந்தும் தசை காலங்களை உருவாக்குகிறது என்று கணக்கிடுகிறது." },
    { title: lang === "en" ? "Step 4: Review and accept" : "படி 4: மதிப்பாய்வு செய்து ஏற்றுக்கொள்ளுங்கள்", body: lang === "en" ? "You see the candidate birth times and their correlation with your events. You choose the one that fits best." : "வேட்பாளர் பிறந்த நேரங்களையும் உங்கள் நிகழ்வுகளுடன் அவற்றின் தொடர்பையும் பாருங்கள். சிறந்தது என்று நினைப்பதை தேர்ந்தெடுங்கள்." },
  ];

  const FAQS = [
    { q: lang === "en" ? "What if I don't know my birth time at all?" : "பிறந்த நேரமே தெரியாவிட்டால்?", a: lang === "en" ? "Without any birth time, lagna calculation is not possible. Vinaadi can still generate a partial chart and give limited daily guidance based on rasi and birth star. Rectification requires at least an approximate time range to test against." : "பிறந்த நேரமே தெரியாவிட்டால் லக்னத்தை கணக்கிட முடியாது. இருந்தாலும், ராசி மற்றும் பிறப்பு நட்சத்திரத்தை அடிப்படையாக வைத்து விநாடி ஒரு பகுதி ஜாதகத்தையும் வரையறுக்கப்பட்ட தினசரி வழிகாட்டுதலையும் தர முடியும். நேரத்தைச் சுருக்கிப் பார்க்க, குறைந்தபட்சம் ஒரு தோராயமான நேர வரம்பாவது தேவை." },
    { q: lang === "en" ? "What kinds of life events work best for rectification?" : "எந்த வாழ்க்கை நிகழ்வுகள் திருத்தத்திற்கு சிறப்பாக வேலை செய்கின்றன?", a: lang === "en" ? "Events with clear astrological significance work best: marriages, significant career changes, relocations, major health events, deaths of close family members, and births of children." : "தெளிவான ஜோதிட முக்கியத்துவம் உள்ள நிகழ்வுகள் சிறப்பாக வேலை செய்கின்றன: திருமணங்கள், முக்கியமான தொழில் மாற்றங்கள், இடமாற்றங்கள், முக்கிய உடல்நல நிகழ்வுகள், நெருங்கிய குடும்பத்தினரின் மரணங்கள், குழந்தைகளின் பிறப்புகள்." },
    { q: lang === "en" ? "How accurate does the rectified time become?" : "திருத்தப்பட்ட நேரம் எவ்வளவு துல்லியமாகிறது?", a: lang === "en" ? "Typically, rectification can narrow uncertainty to within 15–30 minutes for a well-documented life. This is usually sufficient to confirm or correct the lagna sign and improve dasha accuracy." : "வழக்கமாக, நன்கு ஆவணப்படுத்தப்பட்ட வாழ்க்கைக்கு திருத்தம் 15-30 நிமிடங்களுக்குள் நிச்சயமற்ற தன்மையை குறைக்க முடியும். இது பொதுவாக லக்னம் ராசியை உறுதிப்படுத்த அல்லது திருத்த, தசை துல்லியத்தை மேம்படுத்த போதுமானது." },
    { q: lang === "en" ? "Is the rectification feature available in early access?" : "ஆரம்ப அணுகல் காலத்தில் திருத்தம் அம்சம் கிடைக்குமா?", a: lang === "en" ? "Yes. Birth time rectification is available in the dashboard for all users during early access." : "ஆம். ஆரம்ப அணுகல் காலத்தில் அனைத்து பயனர்களுக்கும் டேஷ்போர்டில் பிறந்த நேர திருத்தம் கிடைக்கும்." },
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
                <Link href="/dashboard" className="cl-btn cl-btn--solid">{mt(d.cta_start, lang)}</Link>
                <Link href="/learn/why-birth-time-matters" className="cl-btn cl-btn--ghost">{lang === "en" ? "Why birth time matters" : "பிறந்த நேரம் ஏன் முக்கியம்"}</Link>
              </div>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "Rectification · How it works" : "திருத்தம் · எப்படி வேலை செய்கிறது"}</p>
              <div className="cl-hero-figure__art">
                <svg viewBox="0 0 240 120" role="img" aria-label="Candidate birth times narrowing around events">
                  <line x1="16" y1="64" x2="224" y2="64" stroke="var(--cl-border-2)" strokeWidth="1.4" />
                  <g stroke="var(--cl-muted-2)" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="40" y1="59" x2="40" y2="69" /><line x1="120" y1="59" x2="120" y2="69" /><line x1="200" y1="59" x2="200" y2="69" />
                  </g>
                  <rect x="96" y="44" width="48" height="40" rx="6" fill="var(--cl-accent-soft, #F0D9C4)" stroke="var(--cl-accent)" strokeWidth="1.4" />
                  <circle cx="120" cy="64" r="5" className="clf-accent-fill" />
                  <text x="120" y="100" textAnchor="middle" className="clf-cell-label clf-accent-fill">{lang === "en" ? "best fit" : "சிறந்த பொருத்தம்"}</text>
                  <circle cx="64" cy="64" r="3.5" fill="var(--cl-muted)" />
                  <circle cx="176" cy="64" r="3.5" fill="var(--cl-muted)" />
                  <text x="40" y="40" textAnchor="middle" className="clf-cell-label clf-muted">−30m</text>
                  <text x="200" y="40" textAnchor="middle" className="clf-cell-label clf-muted">+30m</text>
                </svg>
              </div>
              <p className="cl-hero-figure__title">{lang === "en" ? "Life events narrow the window" : "வாழ்க்கை நிகழ்வுகள் சாளரத்தை குறைக்கின்றன"}</p>
              <p className="cl-hero-figure__note">{lang === "en" ? "Enter key life events — marriage, major career changes, relocations, health events. Vinaadi computes which birth time produces dasha periods that best match those events." : "முக்கிய வாழ்க்கை நிகழ்வுகளை உள்ளிடவும் — திருமணம், முக்கிய தொழில் மாற்றங்கள், இடமாற்றங்கள், உடல்நல நிகழ்வுகள். விநாடி எந்த பிறந்த நேரம் அந்த நிகழ்வுகளுடன் சிறந்தது என்று தசை காலங்களை உருவாக்குகிறது என்று கணக்கிடுகிறது."}</p>
            </div>
          </div>
        </section>

        {/* BAND 1 — Why it matters */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "The foundation" : "அடித்தளம்"}</p>
              <h2 className="cl-section-h2">{lang === "en" ? "Why birth time accuracy matters" : "பிறந்த நேர துல்லியம் ஏன் முக்கியம்"}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{lang === "en"
                  ? "In Tamil Jyotish, the lagna (ascendant) is the most important single point in the birth chart. It changes approximately every 2 hours. An error of even 30 minutes can place the lagna in the wrong sign."
                  : "தமிழ் ஜோதிடத்தில், லக்னம் பிறப்பு ஜாதகத்தின் மிக முக்கியமான ஒற்றை குறியிடம். இது சுமார் ஒவ்வொரு 2 மணி நேரத்திற்கும் மாறுகிறது. 30 நிமிடப் பிழை கூட லக்னத்தை வேறு ராசியில் கொண்டு செல்லக்கூடும்."}</p>
              </div>
              <div className="cl-callout">
                <p>{lang === "en" ? "An accurate birth time is the foundation of accurate guidance." : "துல்லியமான பிறந்த நேரம் துல்லியமான வழிகாட்டுதலின் அடித்தளம்."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 2 — The method */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "The method" : "முறை"}</p>
              <h2 className="cl-section-h2">{lang === "en" ? "How Vinaadi's rectification approach works" : "விநாடியின் திருத்தம் அணுகுமுறை எப்படி வேலை செய்கிறது"}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{lang === "en"
                  ? "Vinaadi's rectification is dasha-event based. You provide key life events with approximate dates. Vinaadi tests a range of birth times and identifies which produces a dasha sequence that best correlates with your life events."
                  : "விநாடியின் திருத்த முறை தசை-நிகழ்வு அடிப்படையில் வேலை செய்கிறது. தோராயமான தேதிகளுடன் முக்கிய வாழ்க்கை நிகழ்வுகளை நீங்கள் தருகிறீர்கள். பிறகு பல பிறப்பு நேரங்களைச் சோதித்து, உங்கள் வாழ்க்கை நிகழ்வுகளுடன் மிகவும் நெருக்கமாக பொருந்தும் தசை வரிசை எது என்று விநாடி கண்டறிகிறது."}</p>
              </div>
              <ul className="cl-pub-detail-list">
                {STEPS.map((item) => (
                  <li key={item.title} className="cl-pub-detail-item">
                    <p className="cl-pub-detail-item__title">{item.title}</p>
                    <p className="cl-pub-detail-item__body">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* BAND 3 — Realistic expectations */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Honest limits" : "நேர்மையான வரம்புகள்"}</p>
              <h2 className="cl-section-h2">{lang === "en" ? "Realistic expectations" : "யதார்த்தமான எதிர்பார்ப்புகள்"}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{lang === "en"
                  ? "Rectification can meaningfully improve birth time accuracy when a reasonable range of significant life events is available. It is not a magic solution."
                  : "குறிப்பிடத்தக்க வாழ்க்கை நிகழ்வுகளின் நியாயமான வரம்பு கிடைக்கும்போது திருத்தம் பிறந்த நேர துல்லியத்தை அர்த்தமுள்ள முறையில் மேம்படுத்த முடியும். இது ஒரு மந்திர தீர்வு அல்ல."}</p>
              </div>
              <div className="cl-callout">
                <p>{lang === "en" ? "A narrowing tool, not an exact answer." : "குறைக்கும் கருவி, சரியான பதில் அல்ல."}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 4 — FAQ */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Questions" : "கேள்விகள்"}</p>
              <h2 className="cl-section-h2">{lang === "en" ? "Frequently asked questions" : "அடிக்கடி கேட்கப்படும் கேள்விகள்"}</h2>
            </div>
            <div className="cl-pub-faq" style={{ maxWidth: "880px" }}>
              {FAQS.map((item) => (
                <div key={item.q} className="cl-pub-faq-item">
                  <p className="cl-pub-faq-item__q">{item.q}</p>
                  <p className="cl-pub-faq-item__a">{item.a}</p>
                </div>
              ))}
            </div>
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/learn/why-birth-time-matters" className="cl-pub-related-link">{lang === "en" ? "Why birth time matters →" : "பிறந்த நேரம் ஏன் முக்கியம் →"}</Link>
                <Link href="/tools/jadhagam-generator"     className="cl-pub-related-link">{lang === "en" ? "Jadhagam Generator →"    : "ஜாதகம் உருவாக்கு →"}</Link>
                <Link href="/features/chart-guidance"      className="cl-pub-related-link">{lang === "en" ? "Chart Guidance →"         : "ஜாதக விளக்கம் →"}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Improve your birth time" : "உங்கள் பிறந்த நேரத்தை மேம்படுத்துங்கள்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "More accurate birth time means more accurate guidance." : "பிறப்பு நேரம் துல்லியமாக இருக்கும் போது, வழிகாட்டுதலும் அதே அளவு துல்லியமாகும்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Open dashboard →" : "டேஷ்போர்டு திற →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
