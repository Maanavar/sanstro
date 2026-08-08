"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TEMPLE_THIRUMANANJERI, TEMPLE_THIRUMANANJERI_FAQ, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { SlokamBlock, FaithNote, FaqSection } from "@/components/devotional";
import { ContextualSignupCta } from "@/components/contextual-signup-cta";
import { GuideVerifyNote } from "@/components/guide-traditional-notes";
import { getGuideVerifyNote } from "@/lib/guide-detail-content";

export function ThirumananjeriContent() {
  const [lang] = useLang();
  const d = TEMPLE_THIRUMANANJERI;
  const verifyNote = getGuideVerifyNote({ kind: "temple" });

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
            <TopicSymbolPanel topic="temple" />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.about_h2, lang)}</h2>
            <p>{mt(d.about_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.power_h2, lang)}</h2>
            <p>{mt(d.power_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.when_h2, lang)}</h2>
            <p>{mt(d.when_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <SlokamBlock
              label={mt(d.slokam_label, lang)}
              text={mt(d.slokam_text, lang)}
              meaning={mt(d.slokam_meaning, lang)}
            />
            <FaithNote />
          </div>
        </section>

        <ContextualSignupCta variant="temple" />

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div style={{ marginBottom: "2.5rem" }}>
              <FaqSection items={TEMPLE_THIRUMANANJERI_FAQ} />
            </div>

            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/pariharam/thirumana-thadai" className="cl-pub-related-link">
                  {lang === "en" ? "Pariharam for marriage delay →" : "திருமணத் தடைக்கான பரிகாரம் →"}
                </Link>
                <Link href="/pariharam/sevvai-dosha-pariharam" className="cl-pub-related-link">
                  {lang === "en" ? "Sevvai Dosham Pariharam →" : "செவ்வாய் தோஷ பரிகாரம் →"}
                </Link>
                <Link href="/temples/alangudi" className="cl-pub-related-link">
                  {lang === "en" ? "Alangudi — Jupiter temple →" : "ஆலங்குடி — குரு கோயில் →"}
                </Link>
              </div>
            </div>

            <GuideVerifyNote note={verifyNote} lang={lang} />
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
