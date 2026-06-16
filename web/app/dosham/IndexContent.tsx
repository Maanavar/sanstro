"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { DOSHAM_INDEX, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { GuideCardGrid, type GuideCard } from "@/components/guide-cards";
import { ContextualSignupCta } from "@/components/contextual-signup-cta";

export function DoshamIndexContent() {
  const [lang] = useLang();
  const d = DOSHAM_INDEX;

  const doshams: GuideCard[] = [
    {
      title: lang === "en" ? "Sevvai (Mangal) Dosham" : "செவ்வாய் தோஷம்",
      sub: lang === "en" ? "Mars in marriage houses" : "திருமண பாவங்களில் செவ்வாய்",
      href: "/dosham/sevvai-dosham",
    },
    {
      title: lang === "en" ? "Naga / Sarpa Dosham" : "நாக / சர்ப்ப தோஷம்",
      sub: lang === "en" ? "Rahu-Ketu serpent affliction" : "ராகு-கேது சர்ப்ப தோஷம்",
      href: "/dosham/naga-sarpa-dosham",
    },
    {
      title: lang === "en" ? "Kala Sarpa Dosham" : "கால சர்ப்ப தோஷம்",
      sub: lang === "en" ? "All planets between Rahu and Ketu" : "ராகு-கேதுவுக்குள் கிரகங்கள்",
      href: "/dosham/kala-sarpa-dosham",
    },
    {
      title: lang === "en" ? "Pithru Dosham" : "பித்ரு தோஷம்",
      sub: lang === "en" ? "Ancestral karma and blessings" : "முன்னோர் கர்மம் மற்றும் ஆசீர்வாதம்",
      href: "/dosham/pithru-dosham",
    },
    {
      title: lang === "en" ? "Kalathra Dosham" : "களத்திர தோஷம்",
      sub: lang === "en" ? "7th house and spouse affliction" : "7-ஆம் பாவம் மற்றும் துணை தோஷம்",
      href: "/dosham/kalathra-dosham",
    },
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
            <TopicSymbolPanel topic="dosham" />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.list_h2, lang)}</h2>
            <GuideCardGrid cards={doshams} />
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.what_h2, lang)}</h2>
            <p>{mt(d.what_p1, lang)}</p>
            <p>{mt(d.what_p2, lang)}</p>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--primary">
                {mt(d.cta, lang)}
              </Link>
              <Link href="/yogam" className="cl-btn cl-btn--ghost">
                {lang === "en" ? "Explore Yogams ->" : "யோகங்களை அறிய ->"}
              </Link>
            </div>
          </div>
        </section>

        <ContextualSignupCta variant="dosham" />
      </main>
      <PublicFooter />
    </div>
  );
}
