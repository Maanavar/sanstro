"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { TEMPLE_INDEX, mt } from "@/lib/marketing-i18n";
import { TopicSymbolPanel } from "@/components/astro-symbols";
import { GuideCardGrid, type GuideCard } from "@/components/guide-cards";
import { ContextualSignupCta } from "@/components/contextual-signup-cta";

export function TempleIndexContent() {
  const [lang] = useLang();
  const d = TEMPLE_INDEX;

  const navagraha: GuideCard[] = [
    {
      title: lang === "en" ? "Thirunallar (Saturn / Sani)" : "திருநள்ளாறு (சனி)",
      sub: lang === "en" ? "Relief from Saturn and Sani peyarchi" : "சனி மற்றும் சனி பெயர்ச்சி நிவாரணம்",
      href: "/temples/thirunallar",
    },
    {
      title: lang === "en" ? "Suryanar Koil (Sun)" : "சூரியனார் கோயில் (சூரியன்)",
      sub: lang === "en" ? "Sun - health and authority" : "சூரியன் - ஆரோக்கியம் மற்றும் அதிகாரம்",
      href: "/temples/suryanar-koil",
    },
    {
      title: lang === "en" ? "Thingalur (Moon / Chandran)" : "திங்களூர் (சந்திரன்)",
      sub: lang === "en" ? "Moon - mind and emotions" : "சந்திரன் - மனம் மற்றும் உணர்வு",
      href: "/temples/thingalur",
    },
    {
      title: lang === "en" ? "Vaitheeswaran Koil (Mars / Sevvai)" : "வைத்தீஸ்வரன் கோயில் (செவ்வாய்)",
      sub: lang === "en" ? "Mars - health and Sevvai dosham" : "செவ்வாய் - ஆரோக்கியம் மற்றும் தோஷம்",
      href: "/temples/vaitheeswaran-koil",
    },
    {
      title: lang === "en" ? "Thiruvenkadu (Mercury / Budhan)" : "திருவெண்காடு (புதன்)",
      sub: lang === "en" ? "Mercury - speech and learning" : "புதன் - பேச்சு மற்றும் கல்வி",
      href: "/temples/thiruvenkadu",
    },
    {
      title: lang === "en" ? "Alangudi (Jupiter / Guru)" : "ஆலங்குடி (குரு)",
      sub: lang === "en" ? "Jupiter - wisdom and marriage" : "குரு - ஞானம் மற்றும் திருமணம்",
      href: "/temples/alangudi",
    },
    {
      title: lang === "en" ? "Kanjanur (Venus / Sukran)" : "காஞ்சனூர் (சுக்கிரன்)",
      sub: lang === "en" ? "Venus - comfort and relationships" : "சுக்கிரன் - சுகம் மற்றும் உறவுகள்",
      href: "/temples/kanjanur",
    },
    {
      title: lang === "en" ? "Thirunageswaram (Rahu)" : "திருநாகேஸ்வரம் (ராகு)",
      sub: lang === "en" ? "Rahu - Naga dosham relief" : "ராகு - நாக தோஷ நிவாரணம்",
      href: "/temples/thirunageswaram",
    },
    {
      title: lang === "en" ? "Keezhaperumpallam (Ketu)" : "கீழப்பெரும்பள்ளம் (கேது)",
      sub: lang === "en" ? "Ketu - moksha and detachment" : "கேது - மோட்சம் மற்றும் விடுதல்",
      href: "/temples/keezhaperumpallam",
    },
  ];

  const other: GuideCard[] = [
    {
      title: lang === "en" ? "Thirumananjeri" : "திருமணஞ்சேரி",
      sub: lang === "en" ? "Blessing for timely marriage" : "திருமண வரம்",
      href: "/temples/thirumananjeri",
    },
    {
      title: lang === "en" ? "Pancha Bhoota Sthalams" : "பஞ்ச பூத ஸ்தலங்கள்",
      sub: lang === "en" ? "Five element temples of Shiva" : "சிவனின் ஐந்து பூத தலங்கள்",
      href: "/temples/pancha-bhoota-sthalams",
    },
    {
      title: lang === "en" ? "Arupadai Veedu (Murugan)" : "அறுபடை வீடு (முருகன்)",
      sub: lang === "en" ? "Six abodes of Lord Murugan" : "முருகனின் ஆறு படை வீடுகள்",
      href: "/temples/arupadai-veedu",
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
            <TopicSymbolPanel topic="temple" />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.navagraha_h2, lang)}</h2>
            <p style={{ opacity: 0.75, marginBottom: "1.5rem" }}>{mt(d.navagraha_desc, lang)}</p>
            <GuideCardGrid cards={navagraha} />
          </div>
        </section>

        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.other_h2, lang)}</h2>
            <GuideCardGrid cards={other} />
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.what_h2, lang)}</h2>
            <p>{mt(d.what_p1, lang)}</p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--primary">
                {mt(d.cta, lang)}
              </Link>
            </div>
          </div>
        </section>

        <ContextualSignupCta variant="temple" />
      </main>
      <PublicFooter />
    </div>
  );
}
