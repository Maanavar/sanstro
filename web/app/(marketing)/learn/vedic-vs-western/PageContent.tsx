import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { getServerLang } from "@/lib/server-lang";
import { LEARN_VEDIC_WESTERN, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";

export async function VedicVsWesternPageContent() {
  const lang = await getServerLang();
  const d = LEARN_VEDIC_WESTERN;

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{mt(d.eyebrow, lang)}</p>
              <h1 className="cl-pub-h1">{mt(d.h1, lang)}</h1>
              <p className="cl-pub-lead">{mt(d.lead, lang)}</p>
            </div>
            <TopicSymbolPanel topic="thirukanitham" />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.zodiac_h2, lang)}</h2>
            <p>{mt(d.zodiac_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.lagna_h2, lang)}</h2>
            <p>{mt(d.lagna_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.stars_h2, lang)}</h2>
            <p>{mt(d.stars_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.dasha_h2, lang)}</h2>
            <p>{mt(d.dasha_body, lang)}</p>
            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/learn/how-to-read-a-jadhagam" className="cl-pub-related-link">{lang === "en" ? "How to read a Jadhagam →" : "ஜாதகம் படிப்பது எப்படி →"}</Link>
                <Link href="/learn/what-is-thirukanitham" className="cl-pub-related-link">{lang === "en" ? "What is Thirukanitham? →" : "திருக்கணிதம் என்றால் என்ன? →"}</Link>
                <Link href="/learn/why-birth-time-matters" className="cl-pub-related-link">{lang === "en" ? "Why birth time matters →" : "பிறந்த நேரம் ஏன் முக்கியம் →"}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
