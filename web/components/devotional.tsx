"use client";

import { useLang } from "@/components/lang-toggle";
import { FAITH_NOTE, FAQ_HEADING, mt } from "@/lib/marketing-i18n";

type Bi = { en: string; ta: string };

export function FaqSection({ items }: { items: { q: Bi; a: Bi }[] }) {
  const [lang] = useLang();
  return (
    <div className="cl-faq">
      <style>{`
        .cl-faq__h2 { margin-bottom: 1.25rem; }
        .cl-faq__item { border-top: 1px solid var(--cl-border); padding: 18px 0; }
        .cl-faq__item:last-child { border-bottom: 1px solid var(--cl-border); }
        .cl-faq__q { font-size: 1.02rem; font-weight: 700; color: var(--cl-ink); margin: 0 0 8px; line-height: 1.35; }
        .cl-faq__a { font-size: 0.95rem; color: var(--cl-muted); line-height: 1.65; margin: 0; }
      `}</style>
      <h2 className="cl-section-h2 cl-faq__h2">{mt(FAQ_HEADING, lang)}</h2>
      {items.map((it, i) => (
        <div className="cl-faq__item" key={i}>
          <p className="cl-faq__q">{mt(it.q, lang)}</p>
          <p className="cl-faq__a">{mt(it.a, lang)}</p>
        </div>
      ))}
    </div>
  );
}

export function SlokamBlock({ label, text, meaning }: { label: string; text: string; meaning: string }) {
  return (
    <div className="cl-slokam">
      <style>{`
        .cl-slokam {
          margin: 1.5rem 0; padding: 20px 22px; border-radius: 16px;
          background: var(--cl-bg-2, rgba(0,0,0,0.03));
          border: 1px solid var(--cl-border);
          border-left: 4px solid var(--cl-accent, #b4622d);
        }
        .cl-slokam__label {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--cl-muted); margin: 0 0 10px;
        }
        .cl-slokam__text {
          font-size: 1.08rem; line-height: 1.7; font-weight: 600; color: var(--cl-ink);
          white-space: pre-line; margin: 0 0 12px;
        }
        .cl-slokam__meaning { font-size: 0.92rem; line-height: 1.6; color: var(--cl-muted); margin: 0; font-style: italic; }
      `}</style>
      <p className="cl-slokam__label">{label}</p>
      <p className="cl-slokam__text">{text}</p>
      <p className="cl-slokam__meaning">{meaning}</p>
    </div>
  );
}

export function FaithNote() {
  const [lang] = useLang();
  return (
    <p
      style={{
        marginTop: "2rem",
        fontSize: "0.82rem",
        lineHeight: 1.6,
        color: "var(--cl-muted)",
        fontStyle: "italic",
        opacity: 0.85,
      }}
    >
      {mt(FAITH_NOTE, lang)}
    </p>
  );
}
