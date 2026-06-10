"use client";

import Link from "next/link";
import { MuhurtaTool } from "./MuhurtaTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";

const MUHURTA_CONCEPTS = [
  {
    en: { title: "Tithi (திதி)", body: "The lunar day — one of the five limbs of the Panchangam. Shukla Paksha (waxing) tithis 2, 3, 5, 6, 7, 10, 11, 12, 13 are favourable for auspicious events." },
    ta: { title: "திதி", body: "சந்திர நாள் — பஞ்சாங்கத்தின் ஐந்து உறுப்புகளில் ஒன்று. சுக்ல பட்சம் 2, 3, 5, 6, 7, 10, 11, 12, 13 திதிகள் சுப நிகழ்வுகளுக்கு ஏற்றவை." },
  },
  {
    en: { title: "Nakshatra (நட்சத்திரம்)", body: "The Moon's asterism on the day. Auspicious nakshatras include Rohini, Hastham, Anuradha, Revathi, Punarvasu, and others from the Thirukanitham list." },
    ta: { title: "நட்சத்திரம்", body: "அன்றைய சந்திர நட்சத்திரம். ரோகிணி, ஹஸ்தம், அனுஷம், ரேவதி, புனர்பூசம் உள்ளிட்ட சுப நட்சத்திரங்கள் திருகணிதம் பட்டியலில் உள்ளன." },
  },
  {
    en: { title: "Vara (வாரம்)", body: "The weekday carries its own quality. Monday, Wednesday, Thursday, and Friday are generally auspicious. Tuesday and Saturday need care; Sunday is neutral." },
    ta: { title: "வாரம்", body: "வாரத்தின் நாளும் தனிப்பட்ட குணம் கொண்டது. திங்கள், புதன், வியாழன், வெள்ளி பொதுவாக நல்லது. செவ்வாய், சனி கவனம் தேவை; ஞாயிறு நடுநிலை." },
  },
  {
    en: { title: "Rahu Kalam", body: "A daily inauspicious period governed by Rahu — avoided for muhurta. Occurs at a different time each day of the week based on sunrise." },
    ta: { title: "ராகு காலம்", body: "ராகுவால் நிர்வகிக்கப்படும் தினசரி அசுப நேரம் — முகூர்த்தத்தில் தவிர்க்கப்படும். வாரத்தின் நாளின் படி சூரியோதயம் அடிப்படையில் மாறும்." },
  },
  {
    en: { title: "Abhijit Muhurta", body: "The most auspicious daily window — the midday period, roughly 48 minutes around local noon. Avoided only on Wednesdays per tradition." },
    ta: { title: "அபிஜித் முகூர்த்தம்", body: "மிகவும் சுபமான தினசரி சாளரம் — நண்பகல் நேரத்தில் சுமார் 48 நிமிடங்கள். மரபு படி புதனில் மட்டும் தவிர்க்கப்படும்." },
  },
];

export function MuhurtaPageContent() {
  const [lang] = useLang();

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO */}
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">
              {lang === "en" ? "Free Muhurta Tool" : "இலவச முகூர்த்த கருவி"}
            </p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "22ch" }}>
              {lang === "en"
                ? "Find Auspicious Muhurta for Your Event"
                : "உங்கள் நிகழ்வுக்கு சுப முகூர்த்தம் காண்க"}
            </h1>
            <p className="cl-pub-lead">
              {lang === "en"
                ? "Enter your event type, date range, and location — get the top 3 auspicious time windows based on Panchangam (Thirukanitham). No account required."
                : "நிகழ்வு வகை, தேதி வரம்பு, இடம் உள்ளிடுங்கள் — பஞ்சாங்கம் (திருகணிதம்) அடிப்படையில் சிறந்த 3 சுப நேர சாளரங்கள் பெறுங்கள். கணக்கு தேவையில்லை."}
            </p>
          </div>
        </section>

        {/* Tool */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <MuhurtaTool />
          </div>
        </section>

        {/* BAND — Muhurta concepts */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">
                {lang === "en" ? "Reference" : "குறிப்பு"}
              </p>
              <h2 className="cl-section-h2">
                {lang === "en"
                  ? "How Panchangam-based Muhurta works"
                  : "பஞ்சாங்கம் அடிப்படையில் முகூர்த்தம் எவ்வாறு செயல்படுகிறது"}
              </h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>
                  {lang === "en"
                    ? "A muhurta is selected by examining five elements of the Panchangam — tithi, nakshatra, vara (weekday), yoga, and karana — plus inauspicious periods like Rahu Kalam. Vinaadi uses Thirukanitham (astronomically precise) calculations."
                    : "முகூர்த்தம் பஞ்சாங்கத்தின் ஐந்து கூறுகளை — திதி, நட்சத்திரம், வாரம், யோகம், கரணம் — மற்றும் ராகு காலம் போன்ற அசுப நேரங்களை ஆராய்ந்து தேர்வு செய்யப்படுகிறது. Vinaadi திருகணிதம் (வானியல் துல்லியமான) கணக்கீடுகளை பயன்படுத்துகிறது."}
                </p>
              </div>
              <ul className="cl-pub-detail-list">
                {MUHURTA_CONCEPTS.map((item) => {
                  const c = lang === "en" ? item.en : item.ta;
                  return (
                    <li key={c.title} className="cl-pub-detail-item">
                      <p className="cl-pub-detail-item__title">{c.title}</p>
                      <p className="cl-pub-detail-item__body">{c.body}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">
                {lang === "en" ? "Related tools" : "தொடர்புடைய கருவிகள்"}
              </p>
              <div className="cl-pub-related-links">
                <Link href="/tools/daily-panchangam-planner" className="cl-pub-related-link">
                  {lang === "en" ? "Daily Panchangam →" : "தினசரி பஞ்சாங்கம் →"}
                </Link>
                <Link href="/features/timing-and-decisions" className="cl-pub-related-link">
                  {lang === "en" ? "Timing and Decisions →" : "நேரம் & முடிவுகள் →"}
                </Link>
                <Link href="/tools/jadhagam-generator" className="cl-pub-related-link">
                  {lang === "en" ? "Jadhagam Generator →" : "ஜாதகம் உருவாக்கு →"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">
                {lang === "en"
                  ? "Get muhurta matched to your birth chart"
                  : "உங்கள் ஜாதகத்துடன் பொருந்திய முகூர்த்தம் பெறுங்கள்"}
              </h2>
              <p className="cl-cta-strip__body">
                {lang === "en"
                  ? "Create a free account for chart-personalised muhurta that includes dasha support, hora windows, and Chandrashtama checks."
                  : "ஜாதக-தனிப்பட்ட முகூர்த்தத்திற்கு — தசை ஆதரவு, ஹோரை, சந்திராஷ்டமம் சேர்த்து — இலவச கணக்கை உருவாக்கவும்."}
              </p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">
              {lang === "en" ? "Get started free →" : "இலவசமாக தொடங்குங்கள் →"}
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
