"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { YOGAM_INDEX, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { GuideCardGrid, type GuideCard } from "@/components/guide-cards";
import { ContextualSignupCta } from "@/components/contextual-signup-cta";

export function YogamIndexContent() {
  const [lang] = useLang();
  const d = YOGAM_INDEX;

  const yogams: GuideCard[] = [
    {
      title: lang === "en" ? "Gaja Kesari Yogam" : "கஜகேசரி யோகம்",
      sub: lang === "en" ? "Moon-Jupiter combination" : "சந்திரன்-குரு சேர்க்கை",
      href: "/yogam/gaja-kesari-yogam",
    },
    {
      title: lang === "en" ? "Dhana Yogam" : "தன யோகம்",
      sub: lang === "en" ? "Wealth-giving combinations" : "செல்வம் தரும் சேர்க்கைகள்",
      href: "/yogam/dhana-yogam",
    },
    {
      title: lang === "en" ? "Budha-Aditya Yogam" : "புத-ஆதித்ய யோகம்",
      sub: lang === "en" ? "Sun-Mercury intelligence yoga" : "சூரியன்-புதன் அறிவு யோகம்",
      href: "/yogam/budha-aditya-yogam",
    },
    {
      title: lang === "en" ? "Neecha Bhanga Raja Yogam" : "நீச பங்க ராஜ யோகம்",
      sub: lang === "en" ? "Debilitation turned into strength" : "நீசம் பலமாக மாறுதல்",
      href: "/yogam/neecha-bhanga-raja-yogam",
    },
    {
      title: lang === "en" ? "Raja Yogam" : "ராஜ யோகம்",
      sub: lang === "en" ? "Power, status, and rise" : "அதிகாரம், அந்தஸ்து, உயர்வு",
      href: "/yogam/raja-yogam",
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
            <TopicSymbolPanel topic="yogam" />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.list_h2, lang)}</h2>
            <GuideCardGrid cards={yogams} />
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
              <Link href="/dosham" className="cl-btn cl-btn--ghost">
                {lang === "en" ? "Explore Doshams ->" : "தோஷங்களை அறிய ->"}
              </Link>
            </div>
          </div>
        </section>

        <ContextualSignupCta variant="yogam" />
      </main>
      <PublicFooter />
    </div>
  );
}
