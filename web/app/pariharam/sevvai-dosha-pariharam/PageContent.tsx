"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { PARIHARAM_SEVVAI, PARIHARAM_SEVVAI_FAQ, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { SlokamBlock, FaithNote, FaqSection } from "@/components/devotional";
import { ContextualSignupCta } from "@/components/contextual-signup-cta";
import { GuideVerifyNote } from "@/components/guide-traditional-notes";
import { getGuideVerifyNote } from "@/lib/guide-detail-content";

export function SevvaiDoshaPariharamContent() {
  const [lang] = useLang();
  const d = PARIHARAM_SEVVAI;
  const verifyNote = getGuideVerifyNote({ kind: "pariharam" });

  const steps = [
    { t: d.step1_t, b: d.step1_b },
    { t: d.step2_t, b: d.step2_b },
    { t: d.step3_t, b: d.step3_b },
    { t: d.step4_t, b: d.step4_b },
    { t: d.step5_t, b: d.step5_b },
  ];

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
            <TopicSymbolPanel topic="pariharam" />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.why_h2, lang)}</h2>
            <p>{mt(d.why_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.remedy_h2, lang)}</h2>
            <p style={{ marginBottom: "0.5rem" }}>{mt(d.remedy_intro, lang)}</p>
            <ol className="cl-steps">
              <style>{`
                .cl-steps { list-style: none; counter-reset: step; padding: 0; margin: 1.5rem 0 0; display: grid; gap: 14px; }
                .cl-steps li {
                  counter-increment: step; position: relative;
                  padding: 16px 18px 16px 56px; border-radius: 14px;
                  background: var(--cl-surface); border: 1px solid var(--cl-border);
                }
                .cl-steps li::before {
                  content: counter(step); position: absolute; left: 16px; top: 16px;
                  width: 28px; height: 28px; border-radius: 999px;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 0.85rem; font-weight: 700; color: #fff;
                  background: var(--cl-accent, #b4622d);
                }
                .cl-steps__t { font-weight: 700; color: var(--cl-ink); margin: 0 0 4px; }
                .cl-steps__b { font-size: 0.92rem; color: var(--cl-muted); line-height: 1.55; margin: 0; }
              `}</style>
              {steps.map((s, i) => (
                <li key={i}>
                  <p className="cl-steps__t">{mt(s.t, lang)}</p>
                  <p className="cl-steps__b">{mt(s.b, lang)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.temple_h2, lang)}</h2>
            <p>{mt(d.temple_body, lang)}</p>
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

        <ContextualSignupCta variant="sevvai-dosham" />

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div style={{ marginBottom: "2.5rem" }}>
              <FaqSection items={PARIHARAM_SEVVAI_FAQ} />
            </div>

            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/dosham/sevvai-dosham" className="cl-pub-related-link">
                  {lang === "en" ? "Sevvai Dosham — what it means →" : "செவ்வாய் தோஷம் — என்ன பொருள் →"}
                </Link>
                <Link href="/pariharam/thirumana-thadai" className="cl-pub-related-link">
                  {lang === "en" ? "Pariharam for marriage delay →" : "திருமணத் தடைக்கான பரிகாரம் →"}
                </Link>
                <Link href="/temples/vaitheeswaran-koil" className="cl-pub-related-link">
                  {lang === "en" ? "Vaitheeswaran Koil — healing temple →" : "வைத்தீஸ்வரன் கோயில் →"}
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
