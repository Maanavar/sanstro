"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { DOSHAM_NAGA, DOSHAM_NAGA_FAQ, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { SlokamBlock, FaithNote, FaqSection } from "@/components/devotional";
import { ContextualSignupCta } from "@/components/contextual-signup-cta";
import { GuideVerifyNote } from "@/components/guide-traditional-notes";
import { getGuideVerifyNote } from "@/lib/guide-detail-content";

export function NagaDoshamContent() {
  const [lang] = useLang();
  const d = DOSHAM_NAGA;
  const verifyNote = getGuideVerifyNote({ kind: "dosham" });

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
            <TopicSymbolPanel topic="dosham" />
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
            <h2 className="cl-section-h2">{mt(d.brings_h2, lang)}</h2>
            <p style={{ marginBottom: "1.5rem" }}>{mt(d.brings_intro, lang)}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              {d.brings_categories.map((cat, i) => (
                <div key={i} style={{
                  background: "var(--cl-surface)",
                  border: "1px solid var(--cl-border)",
                  borderRadius: "14px",
                  padding: "20px",
                }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--cl-accent, #b4622d)", margin: "0 0 12px" }}>
                    {mt(cat.heading, lang)}
                  </h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
                    {cat.items.map((item, j) => (
                      <li key={j} style={{ fontSize: "0.9rem", color: "var(--cl-muted)", lineHeight: 1.55, paddingLeft: "1.1em", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, top: "0.1em", color: "var(--cl-accent, #b4622d)" }}>·</span>
                        {mt(item, lang)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.calc_h2, lang)}</h2>
            <p>{mt(d.calc_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.howtoread_h2, lang)}</h2>
            <p style={{ marginBottom: "1.25rem" }}>{mt(d.howtoread_intro, lang)}</p>
            <ol className="cl-steps">
              <style>{`
                .cl-steps { list-style: none; counter-reset: step; padding: 0; margin: 0; display: grid; gap: 14px; }
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
              {d.howtoread_steps.map((step, i) => (
                <li key={i}>
                  <p className="cl-steps__t">{mt(step.h, lang)}</p>
                  <p className="cl-steps__b">{mt(step.b, lang)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.cancel_h2, lang)}</h2>
            <p>{mt(d.cancel_body, lang)}</p>
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.pariharam_h2, lang)}</h2>
            <p>{mt(d.pariharam_body, lang)}</p>
            <SlokamBlock
              label={mt(d.slokam_label, lang)}
              text={mt(d.slokam_text, lang)}
              meaning={mt(d.slokam_meaning, lang)}
            />
            <FaithNote />
          </div>
        </section>

        <ContextualSignupCta variant="dosham" />

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <FaqSection items={DOSHAM_NAGA_FAQ} />

            <div className="cl-pub-related" style={{ marginTop: "2rem" }}>
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/dosham/kala-sarpa-dosham" className="cl-pub-related-link">{lang === "en" ? "Kala Sarpa Dosham →" : "கால சர்ப்ப தோஷம் →"}</Link>
                <Link href="/dosham/pithru-dosham" className="cl-pub-related-link">{lang === "en" ? "Pithru Dosham →" : "பித்ரு தோஷம் →"}</Link>
                <Link href="/temples" className="cl-pub-related-link">{lang === "en" ? "Navagraha temples →" : "நவகிரக கோயில்கள் →"}</Link>
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
