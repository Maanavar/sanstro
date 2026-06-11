"use client";

import Link from "next/link";
import { PoruthamTool } from "./PoruthamTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TOOL_PORUTHAM, mt } from "@/lib/marketing-i18n";
import { PoruthamRingsVisual } from "@/components/marketing-visuals";

export function PoruthamPageContent() {
  const [lang] = useLang();
  const d = TOOL_PORUTHAM;

  const TEN_PORUTHAMS = [
    { q: lang === "en" ? "Dinam"                        : "தினம்",          a: lang === "en" ? "Day-to-day harmony and health. Based on the birth-star count from boy to girl."                                                     : "தினசரி நல்லிணக்கமும் உடல்நல ஆதரவும். ஆண் நட்சத்திரத்திலிருந்து பெண் நட்சத்திரம் வரை எண்ணும் முறையை அடிப்படையாகக் கொண்டது." },
    { q: lang === "en" ? "Ganam"                        : "கணம்",           a: lang === "en" ? "Temperament compatibility. Based on the gana (Deva/Manushya/Rakshasa) of each birth star."                                       : "குணநிலை பொருத்தம். ஒவ்வொரு நட்சத்திரத்திற்குமான கணம் (தேவ/மனுஷ்ய/ராக்ஷஸ) அடிப்படையாகும்." },
    { q: lang === "en" ? "Mahendram"                    : "மகேந்திரம்",     a: lang === "en" ? "Long-term prosperity and longevity of the marriage."                                                                                : "திருமணத்தின் நீண்டகால செழிப்பு மற்றும் ஆயுள்." },
    { q: lang === "en" ? "Stree Deergham"               : "ஸ்திரீ தீர்க்கம்", a: lang === "en" ? "Long and prosperous life for the bride."                                                                                          : "மணப்பெண்ணுக்கு நீண்ட மற்றும் செழிப்பான வாழ்க்கை." },
    { q: lang === "en" ? "Yoni"                         : "யோனி",           a: lang === "en" ? "Physical and intimate compatibility. Based on the animal symbol of each birth star."                                                : "உடல் மற்றும் நெருக்கமான பொருத்தம். ஒவ்வொரு நட்சத்திரத்திற்குரிய விலங்கு சின்னத்தை அடிப்படையாகக் கொண்டது." },
    { q: lang === "en" ? "Rajju ⚠"                     : "ரஜ்ஜு ⚠",        a: lang === "en" ? "Critical dosha. The same Rajju group signals serious concern for marital stability and longevity."                                      : "மிக முக்கியமான தோஷம். ஒரே ரஜ்ஜு குழுவில் இருவரும் இருந்தால் திருமணத்தின் நிலைத்தன்மை மற்றும் ஆயுள் குறித்து தீவிரமாக கவனிக்க வேண்டும்." },
    { q: lang === "en" ? "Vedha"                        : "வேதம்",          a: lang === "en" ? "Certain birth-star pairs oppose each other. Vedha points to friction and obstacles."                                                  : "சில நட்சத்திர ஜோடிகள் ஒன்றுக்கொன்று ஒத்துவராதவை. வேதம் இருந்தால் தடையும் உரசலும் அதிகமாக இருக்கலாம்." },
    { q: lang === "en" ? "Rasi"                         : "ராசி",           a: lang === "en" ? "Overall compatibility between Moon signs."                                                                                          : "சந்திர ராசிகளுக்கு இடையிலான ஒட்டுமொத்த பொருத்தம்." },
    { q: lang === "en" ? "Rasiyathipathi (Graha Maitri)": "ராஸ்யதிபதி",    a: lang === "en" ? "Compatibility between rasi lords of both partners."                                                                                 : "இரு துணைவர்களின் ராசி நாதர்களுக்கு இடையிலான பொருத்தம்." },
    { q: lang === "en" ? "Nadi ⚠"                      : "நாடி ⚠",         a: lang === "en" ? "Critical dosha. The same Nadi category (Adi/Madhya/Antya) is traditionally linked with concerns around children and health."      : "முக்கியமான தோஷம். ஒரே நாடி பிரிவில் (ஆதி/மத்திய/அந்த்ய) இருந்தால் குழந்தை மற்றும் உடல்நல விஷயங்களில் கவனம் தேவைப்படலாம் என்று மரபு கருதுகிறது." },
  ];

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO */}
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{mt(d.eyebrow, lang)}</p>
              <h1 className="cl-pub-h1" style={{ maxWidth: "22ch" }}>{mt(d.h1, lang)}</h1>
              <p className="cl-pub-lead">{mt(d.lead, lang)}</p>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{lang === "en" ? "Compatibility Map" : "பொருத்த வரைபடம்"}</p>
              <PoruthamRingsVisual />
              <p className="cl-hero-figure__title">{lang === "en" ? "10 checks, one readable result" : "10 பொருத்தங்கள், ஒரு தெளிவான முடிவு"}</p>
              <p className="cl-hero-figure__note">{lang === "en" ? "A clear visual way to compare two charts without turning the page into a spreadsheet." : "இரண்டு ஜாதகங்களின் பொருத்தத்தை சலிப்பான அட்டவணை போல அல்லாமல் தெளிவாகக் காட்டும் காட்சி இது."}</p>
            </div>
          </div>
        </section>

        {/* Live calculator */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <PoruthamTool />
          </div>
        </section>

        {/* BAND 1 — What Vinaadi checks */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Overview" : "கண்ணோட்டம்"}</p>
              <h2 className="cl-section-h2">{mt(d.checks_h2, lang)}</h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>{mt(d.checks_body, lang)}</p>
              </div>
              <div className="cl-callout">
                <p>{mt(d.rajju_body, lang)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 2 — The 10 Poruthams */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">{lang === "en" ? "Reference" : "குறிப்பு"}</p>
              <h2 className="cl-section-h2">{mt(d.ten_h2, lang)}</h2>
            </div>
            <div className="cl-pub-faq" style={{ maxWidth: "880px" }}>
              {TEN_PORUTHAMS.map((item) => (
                <div key={item.q} className="cl-pub-faq-item">
                  <p className="cl-pub-faq-item__q">{item.q}</p>
                  <p className="cl-pub-faq-item__a">{item.a}</p>
                </div>
              ))}
            </div>
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/learn/what-is-porutham"         className="cl-pub-related-link">{lang === "en" ? "What is Porutham? →"   : "பொருத்தம் என்றால் என்ன? →"}</Link>
                <Link href="/features/family-planning"       className="cl-pub-related-link">{lang === "en" ? "Family Planning →"     : "குடும்ப திட்டமிடல் →"}</Link>
                <Link href="/tools/jadhagam-generator"       className="cl-pub-related-link">{lang === "en" ? "Jadhagam Generator →"  : "ஜாதகம் உருவாக்கு →"}</Link>
                <Link href="/trust/methodology"              className="cl-pub-related-link">{lang === "en" ? "Our Methodology →"      : "எங்கள் கணக்கீட்டு முறை →"}</Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">{lang === "en" ? "Save results and plan together" : "முடிவுகளை சேமிக்கவும், சேர்ந்து திட்டமிடவும்"}</h2>
              <p className="cl-cta-strip__body">{lang === "en" ? "Create a free account for the full chart-grade porutham report: 36-point score, Nadi judgement, Sevvai dosham, D9, dasha context, saved family members, and daily guidance." : "முழு ஜாதக அடிப்படையிலான பொருத்த அறிக்கைக்கு இலவச கணக்கை உருவாக்குங்கள்: 36 மதிப்பெண், நாடி தீர்வு, செவ்வாய் தோஷம், நவாம்சம், தசை சூழல், குடும்ப உறுப்பினர் சேமிப்பு, தினசரி வழிகாட்டுதல்."}</p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">{lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
