"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { PARIHARAM_INDEX, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { GuideCardGrid, type GuideCard } from "@/components/guide-cards";
import { ContextualSignupCta } from "@/components/contextual-signup-cta";

export function PariharamIndexContent() {
  const [lang] = useLang();
  const d = PARIHARAM_INDEX;

  const cards: GuideCard[] = [
    { title: lang === "en" ? "Delayed marriage (Thirumana thadai)" : "திருமணத் தடை", sub: lang === "en" ? "7th house, Venus, Jupiter remedies" : "7-ஆம் பாவம், சுக்கிரன், குரு பரிகாரம்", href: "/pariharam/thirumana-thadai" },
    { title: lang === "en" ? "Rahu–Ketu Pariharam" : "ராகு–கேது பரிகாரம்", sub: lang === "en" ? "Serpent dosham relief" : "சர்ப்ப தோஷ நிவாரணம்", href: "/pariharam/rahu-ketu-pariharam" },
    { title: lang === "en" ? "Sevvai Dosham Pariharam" : "செவ்வாய் தோஷ பரிகாரம்", sub: lang === "en" ? "Mars affliction remedies" : "செவ்வாய் தோஷ பரிகாரம்", href: "/pariharam/sevvai-dosha-pariharam" },
    { title: lang === "en" ? "Naga Dosham Pariharam" : "நாக தோஷ பரிகாரம்", sub: lang === "en" ? "Childbirth & serpent dosham" : "சந்தான & சர்ப்ப தோஷம்", href: "/pariharam/naga-dosha-pariharam" },
    { title: lang === "en" ? "Kadan (debt) Pariharam" : "கடன் பரிகாரம்", sub: lang === "en" ? "Relief from debt & money strain" : "கடன் & பண நெருக்கடி நிவாரணம்", href: "/pariharam/kadan-pariharam" },
    { title: lang === "en" ? "Puthra (childbirth) Pariharam" : "புத்திர பரிகாரம்", sub: lang === "en" ? "Blessings for children" : "சந்தான பாக்கியம்", href: "/pariharam/puthra-pariharam" },
    { title: lang === "en" ? "Health (Ayul) Pariharam" : "ஆயுள் / ஆரோக்கிய பரிகாரம்", sub: lang === "en" ? "Health & longevity remedies" : "ஆரோக்கியம் & ஆயுள் பரிகாரம்", href: "/pariharam/ayul-pariharam" },
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
            <h2 className="cl-section-h2">{mt(d.byproblem_h2, lang)}</h2>
            <GuideCardGrid cards={cards} />
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.what_h2, lang)}</h2>
            <p>{mt(d.what_p1, lang)}</p>
            <p>{mt(d.what_p2, lang)}</p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--primary">
                {mt(d.cta, lang)}
              </Link>
            </div>
          </div>
        </section>

        <ContextualSignupCta variant="pariharam" />
      </main>
      <PublicFooter />
    </div>
  );
}
