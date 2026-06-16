"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { ContextualSignupCta } from "@/components/contextual-signup-cta";
import { SlokamBlock, FaithNote, FaqSection } from "@/components/devotional";
import { GuideVerifyNote } from "@/components/guide-traditional-notes";
import { getGuideVerifyNote, type GuideDetail } from "@/lib/guide-detail-content";

function text(value: { en: string; ta: string }, lang: string) {
  return lang === "ta" ? value.ta : value.en;
}

export function GuideDetailPage({ content }: { content: GuideDetail }) {
  const [lang] = useLang();
  const topic =
    content.kind === "yogam" ? "yogam" : content.kind === "temple" ? "temple" : content.topic;
  const verifyNote = getGuideVerifyNote(content);

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{text(content.eyebrow, lang)}</p>
              <h1 className="cl-pub-h1">{text(content.title, lang)}</h1>
              <p className="cl-pub-lead">{text(content.lead, lang)}</p>
            </div>
            <TopicSymbolPanel topic={topic} />
          </div>
        </section>

        {content.quickFacts && content.quickFacts.length > 0 && (
          <section className="cl-band cl-band--alt">
            <div className="cl-container">
              <dl className="cl-quick-facts">
                {content.quickFacts.map((fact) => (
                  <div key={fact.label.en} className="cl-quick-fact">
                    <dt>{text(fact.label, lang)}</dt>
                    <dd>{text(fact.value, lang)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {content.sections.map((section, index) => (
          <section
            key={section.heading.en}
            className={`cl-band${
              (content.quickFacts ? index : index + 1) % 2 === 0 ? "" : " cl-band--alt"
            }`}
          >
            <div className="cl-container cl-guide-detail">
              <h2 className="cl-section-h2">{text(section.heading, lang)}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph.en}>{text(paragraph, lang)}</p>
              ))}
            </div>
          </section>
        ))}

        {content.bringCards && content.bringCards.length > 0 && (
          <section className="cl-band">
            <div className="cl-container cl-guide-detail">
              <h2 className="cl-section-h2">{lang === "en" ? "What it can bring" : "எதை கொண்டுவரலாம்"}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginTop: "1.5rem" }}>
                {content.bringCards.map((cat, i) => (
                  <div key={i} style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "20px" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--cl-accent, #b4622d)", margin: "0 0 12px" }}>
                      {text(cat.heading, lang)}
                    </h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "8px" }}>
                      {cat.items.map((item, j) => (
                        <li key={j} style={{ fontSize: "0.9rem", color: "var(--cl-muted)", lineHeight: 1.55, paddingLeft: "1.1em", position: "relative" }}>
                          <span style={{ position: "absolute", left: 0, top: "0.1em", color: "var(--cl-accent, #b4622d)" }}>·</span>
                          {text(item, lang)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {content.remedies && (
          <section className="cl-band cl-band--alt">
            <div className="cl-container cl-guide-detail">
              <h2 className="cl-section-h2">{text(content.remedies.heading, lang)}</h2>
              <p style={{ marginBottom: "1.25rem" }}>{text(content.remedies.intro, lang)}</p>
              <ol className="cl-steps">
                <style>{`
                  .cl-steps { list-style: none; counter-reset: step; padding: 0; margin: 0; display: grid; gap: 14px; }
                  .cl-steps li { counter-increment: step; position: relative; padding: 16px 18px 16px 56px; border-radius: 14px; background: var(--cl-surface); border: 1px solid var(--cl-border); }
                  .cl-steps li::before { content: counter(step); position: absolute; left: 16px; top: 16px; width: 28px; height: 28px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: #fff; background: var(--cl-accent, #b4622d); }
                  .cl-steps__b { font-size: 0.92rem; color: var(--cl-muted); line-height: 1.55; margin: 0; }
                `}</style>
                {content.remedies.items.map((item, i) => (
                  <li key={i}><p className="cl-steps__b">{text(item, lang)}</p></li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {content.slokam && (
          <section className="cl-band">
            <div className="cl-container cl-guide-detail">
              <SlokamBlock
                label={text(content.slokam.label, lang)}
                text={text(content.slokam.text, lang)}
                meaning={text(content.slokam.meaning, lang)}
              />
              <FaithNote />
            </div>
          </section>
        )}

        <ContextualSignupCta variant={content.ctaVariant} />

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            {content.faq && content.faq.length > 0 && (
              <div style={{ marginBottom: "2.5rem" }}>
                <FaqSection items={content.faq} />
              </div>
            )}

            <div className="cl-pub-related" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
              <p className="cl-pub-related__title">{lang === "en" ? "Related" : "தொடர்புடையவை"}</p>
              <div className="cl-pub-related-links">
                {content.related.map((item) => (
                  <Link key={item.href} href={item.href} className="cl-pub-related-link">
                    {text(item.label, lang)} →
                  </Link>
                ))}
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
