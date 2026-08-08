"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { LEARN_CHANDRA, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";

export function ChandrashtamaPageContent() {
  const [lang] = useLang();
  const d = LEARN_CHANDRA;

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
            <TopicSymbolPanel topic="chandrashtama" />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.what_h2, lang)}</h2>
            <p>{mt(d.what_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.calm_h2, lang)}</h2>
            <p>{mt(d.calm_body, lang)}</p>
            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/features/daily-guidance"      className="cl-pub-related-link">{lang === "en" ? "Daily Guidance →"           : "தினசரி வழிகாட்டுதல் →"}</Link>
                <Link href="/learn/what-is-thirukanitham" className="cl-pub-related-link">{lang === "en" ? "What is Thirukanitham? →"   : "திருக்கணிதம் என்றால் என்ன? →"}</Link>
                <Link href="/trust/methodology"           className="cl-pub-related-link">{lang === "en" ? "Our Methodology →"            : "எங்கள் கணக்கீட்டு முறை →"}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
