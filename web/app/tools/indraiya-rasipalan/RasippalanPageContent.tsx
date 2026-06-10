"use client";

import Link from "next/link";
import { RasippalanTool } from "./RasippalanTool";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";

const RASIPALAN_CONCEPTS = [
  {
    en: { title: "How does rasipalan work?", body: "Every day the Moon occupies one of the 12 rasis. The house the Moon forms from your janma rasi (natal Moon sign) determines the day's energy for you. House 11 is the best; house 8 is Chandrashtamam — the most challenging." },
    ta: { title: "ராசிபலன் எவ்வாறு செயல்படுகிறது?", body: "ஒவ்வொரு நாளும் சந்திரன் 12 ராசிகளில் ஒன்றில் இருக்கிறது. உங்கள் ஜன்ம ராசியிலிருந்து சந்திரன் எந்த இடத்தில் உள்ளது என்பது அன்றைய சக்தியை தீர்மானிக்கிறது. 11ஆம் இடம் சிறந்தது; 8ஆம் இடம் சந்திராஷ்டமம் — மிகவும் சவாலான காலம்." },
  },
  {
    en: { title: "What is Chandrashtamam?", body: "Chandrashtamam occurs when the Moon is in the 8th rasi from your natal Moon sign. It lasts roughly 2.5 days. Classical Tamil astrology recommends avoiding new ventures, surgeries, and major financial decisions during this period." },
    ta: { title: "சந்திராஷ்டமம் என்றால் என்ன?", body: "சந்திரன் உங்கள் ஜன்ம ராசியிலிருந்து 8ஆம் ராசியில் இருக்கும்போது சந்திராஷ்டமம் நிகழ்கிறது. இது சுமார் 2.5 நாட்கள் நீடிக்கும். இந்த காலத்தில் புதிய தொடக்கங்கள், அறுவை சிகிச்சை, முக்கிய பண முடிவுகளை தவிர்க்க வேண்டும்." },
  },
  {
    en: { title: "How often does the Moon change rasi?", body: "The Moon moves to a new rasi approximately every 2.5 days, completing the full zodiac in about 27–28 days. This is why daily rasipalan changes frequently, unlike sun-sign horoscopes which shift monthly." },
    ta: { title: "சந்திரன் எவ்வளவு அடிக்கடி ராசி மாறுகிறது?", body: "சந்திரன் சுமார் 2.5 நாட்களுக்கு ஒருமுறை புதிய ராசியில் நுழைகிறது; 27–28 நாட்களில் முழு ராசி சக்கரத்தையும் முடிக்கிறது. இதனால் தினசரி ராசிபலன் அடிக்கடி மாறுகிறது." },
  },
  {
    en: { title: "Thirukanitham accuracy", body: "Vinaadi uses Thirukanitham (Swiss Ephemeris–based) calculations for the Moon's precise longitude. This is more accurate than Vakya almanac values, especially for dates far from the almanac's base epoch." },
    ta: { title: "திருகணிதம் துல்லியம்", body: "Vinaadi சந்திரனின் துல்லியமான நீளாம்சத்திற்கு திருகணிதம் (Swiss Ephemeris அடிப்படை) கணக்கீடுகளை பயன்படுத்துகிறது. இது வாக்கிய அட்டவணை மதிப்புகளை விட மிகவும் துல்லியமானது." },
  },
];

export function RasippalanPageContent() {
  const [lang] = useLang();

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO */}
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">
              {lang === "en" ? "Free Daily Rasi Tool" : "இலவச தினசரி ராசி கருவி"}
            </p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "24ch" }}>
              {lang === "en"
                ? "Indraiya Rasipalan — Today's Horoscope for All 12 Rasis"
                : "இன்றைய ராசிபலன் — 12 ராசிகளுக்கும் இன்றைய பலன்"}
            </h1>
            <p className="cl-pub-lead">
              {lang === "en"
                ? "Based on today's Moon position, get the classical Tamil daily prediction for every rasi. Select your Janma Rasi to see your personalised reading. Thirukanitham-accurate. No account required."
                : "இன்றைய சந்திர நிலை அடிப்படையில், ஒவ்வொரு ராசிக்கும் திருகணிதம் கணக்கீட்டில் தினசரி பலன் பெறுங்கள். உங்கள் ஜன்ம ராசியை தேர்வு செய்யுங்கள். கணக்கு தேவையில்லை."}
            </p>
          </div>
        </section>

        {/* Tool */}
        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container">
            <RasippalanTool />
          </div>
        </section>

        {/* BAND — reference concepts */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-band__head">
              <p className="cl-eyebrow">
                {lang === "en" ? "Reference" : "குறிப்பு"}
              </p>
              <h2 className="cl-section-h2">
                {lang === "en"
                  ? "How Moon transit rasipalan works"
                  : "சந்திர கோசார ராசிபலன் எவ்வாறு செயல்படுகிறது"}
              </h2>
            </div>
            <div className="cl-pub-two-col">
              <div className="cl-pub-section__body">
                <p>
                  {lang === "en"
                    ? "Daily rasipalan in Tamil Jyothidam is based on the Moon's transit through the 12 rasis. The Moon's house from your natal Moon sign (janma rasi) determines the energy of the day — from gains and fortune in house 11 and 9, to challenges during Chandrashtamam (house 8). Vinaadi uses Thirukanitham for precise Moon longitudes."
                    : "தமிழ் ஜோதிடத்தில் தினசரி ராசிபலன் சந்திரனின் 12 ராசிகள் வழியான கோசாரத்தை அடிப்படையாக கொண்டது. உங்கள் ஜன்ம ராசியிலிருந்து சந்திரனின் இடம் அன்றைய சக்தியை தீர்மானிக்கிறது — 11, 9ஆம் இடங்களில் லாபம் மற்றும் அதிர்ஷ்டம் முதல், சந்திராஷ்டமத்தில் (8ஆம் இடம்) சவால்கள் வரை. Vinaadi திருகணிதம் மூலம் துல்லியமான சந்திர நீளாம்சம் கணக்கிடுகிறது."}
                </p>
              </div>
              <ul className="cl-pub-detail-list">
                {RASIPALAN_CONCEPTS.map((item) => {
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
                <Link href="/tools/jadhagam-generator" className="cl-pub-related-link">
                  {lang === "en" ? "Jadhagam Generator →" : "ஜாதகம் உருவாக்கு →"}
                </Link>
                <Link href="/learn/what-is-chandrashtama" className="cl-pub-related-link">
                  {lang === "en" ? "What is Chandrashtama? →" : "சந்திராஷ்டமம் என்ன? →"}
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
                  ? "Get daily guidance tailored to your birth chart"
                  : "உங்கள் ஜாதகத்திற்கு பொருந்திய தினசரி வழிகாட்டுதல் பெறுங்கள்"}
              </h2>
              <p className="cl-cta-strip__body">
                {lang === "en"
                  ? "Create a free account for chart-personalised daily guidance — dasha period, transits, and panchangam all woven together."
                  : "ஜாதக-தனிப்பட்ட தினசரி வழிகாட்டுதலுக்கு — தசை, கோசாரம், பஞ்சாங்கம் ஒன்றாக இணைந்து — இலவச கணக்கை உருவாக்கவும்."}
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
