"use client";

import { useState } from "react";
import { LocalizedLink as Link } from "@/components/localized-link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { RASI_LIST } from "@vinaadi/shared";

function chandrashtamaRasi(birthRasiNum: number) {
  return ((birthRasiNum + 6) % 12) + 1;
}

// Chandra gochara: the Moon's transit result in each sign counted from the
// janma rasi. Classical rule (Phaladeepika): favourable in 1, 3, 6, 7, 10, 11;
// adverse in 2, 4, 5, 8, 9, 12. `favourable` must equal the backend's
// GOCHARA_FAVOURABLE_FROM_MOON["MOON"] (app/calculations/gochara_scores.py) —
// tests/test_public_moon_gochara_table.py fails if the two drift. This table
// used to call the 5th and 9th good: those are trikona houses in a natal chart,
// which says nothing about the transiting Moon there (FSA-04, 2026-10-21).
// Chandrashtama is the 8th row of this same table — the Moon in the 8th RASI
// from the janma rasi (D11). One table serves both; do not split them into two
// tools, and do not count the 8th in nakshatras (that is Tarabalam's Mitra tara,
// a favourable position). Owner ruling 2026-10-21.
const HOUSE_LABELS: Record<number, { favourable: boolean; ta: string; en: string }> = {
  1:  { favourable: true,  ta: "ஜன்ம ராசியில் சந்திரன் — சாதகம்: மன நிம்மதி, உடல் நலம்.", en: "Moon in your janma rasi — favourable: ease of mind and good health." },
  2:  { favourable: false, ta: "2ஆம் இடம் — பாதகம்: செலவுகள்; பண விஷயங்களில் கவனம் தேவை.", en: "2nd — adverse: expenses; go carefully with money." },
  3:  { favourable: true,  ta: "3ஆம் இடம் — சாதகம்: முயற்சிகள் வெற்றி பெறும்; சிறு பயணங்களுக்கு நல்லது.", en: "3rd — favourable: effort succeeds; good for short travel." },
  4:  { favourable: false, ta: "4ஆம் இடம் — பாதகம்: வீட்டிலும் மனதிலும் சஞ்சலம்; பெரிய முடிவுகளைத் தள்ளிவைக்கவும்.", en: "4th — adverse: unease at home and in the mind; defer big decisions." },
  5:  { favourable: false, ta: "5ஆம் இடம் — பாதகம்: திட்டங்களில் தடைகள்; ஊக முதலீடுகளைத் தவிர்க்கவும்.", en: "5th — adverse: plans meet obstacles; avoid speculation." },
  6:  { favourable: true,  ta: "6ஆம் இடம் — சாதகம்: உடல் நலம் மேம்படும்; எதிர்ப்புகளை வெல்வீர்கள்.", en: "6th — favourable: health improves; you overcome opposition." },
  7:  { favourable: true,  ta: "7ஆம் இடம் — சாதகம்: கூட்டாளிகளின் ஆதரவு, இனிய உறவுகள்.", en: "7th — favourable: support from partners and good company." },
  8:  { favourable: false, ta: "8ஆம் இடம் — சந்திராஷ்டம இடம்: புதிய முயற்சிகளைத் தவிர்க்கவும்.", en: "8th — the Chandrashtama position: avoid new ventures." },
  9:  { favourable: false, ta: "9ஆம் இடம் — பாதகம்: தடைகள், மனக்கவலை; முக்கிய தொடக்கங்களைத் தள்ளிவைக்கவும்.", en: "9th — adverse: obstacles and anxiety; postpone important beginnings." },
  10: { favourable: true,  ta: "10ஆம் இடம் — சாதகம்: தொழிலில் முன்னேற்றம்.", en: "10th — favourable: work goes well." },
  11: { favourable: true,  ta: "11ஆம் இடம் — சாதகம்: லாபம்; விருப்பங்கள் நிறைவேறும்.", en: "11th — favourable: gains; wishes fulfilled." },
  12: { favourable: false, ta: "12ஆம் இடம் — பாதகம்: செலவுகள், சோர்வு; பொது ஈடுபாடுகளைத் தவிர்க்கவும்.", en: "12th — adverse: expenses and fatigue; avoid public commitments." },
};

export default function ChandrashtamaPage() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const [selected, setSelected] = useState<number | null>(null);

  const chandraNum = selected !== null ? chandrashtamaRasi(selected) : null;
  const chandraRasi = chandraNum !== null ? RASI_LIST.find((r) => r.number === chandraNum) : null;
  const birthRasi = selected !== null ? RASI_LIST.find((r) => r.number === selected) : null;

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* Hero */}
        <section className="cl-pub-hero">
          <div className="cl-container">
            <p className="cl-eyebrow">{ta ? "கருவி · சந்திராஷ்டமம்" : "Tool · Chandrashtama"}</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "28ch" }}>
              {ta
                ? "சந்திராஷ்டம ராசி கணக்கீடு"
                : "Chandrashtama Rasi Calculator"}
            </h1>
            <p className="cl-pub-lead" style={{ maxWidth: "52ch" }}>
              {ta
                ? "உங்கள் ஜன்ம ராசியிலிருந்து 8ஆம் ராசி கண்டறியுங்கள் — சந்திரன் அங்கு வரும்போது எச்சரிக்கையாக இருக்க வேண்டும்."
                : "Find the 8th rasi from your birth Moon sign — that is your Chandrashtama period when the Moon transits there."}
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section style={{ paddingBlock: "40px 56px" }}>
          <div className="cl-container" style={{ maxWidth: "740px" }}>

            {/* Rasi picker */}
            <p style={{ fontWeight: 700, marginBottom: "12px" }}>
              {ta ? "உங்கள் ஜன்ம ராசியை (மாத ராசி) தேர்ந்தெடுக்கவும்:" : "Select your Janma Rasi (birth Moon sign):"}
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))",
              gap: "8px",
              marginBottom: "32px",
            }}>
              {RASI_LIST.map((r) => (
                <button
                  key={r.number}
                  type="button"
                  onClick={() => setSelected(r.number)}
                  style={{
                    padding: "10px 6px",
                    borderRadius: "10px",
                    border: selected === r.number
                      ? "2px solid var(--chart-amber)"
                      : "1px solid var(--color-border)",
                    background: selected === r.number
                      ? "var(--panel-warm-tint)"
                      : "var(--color-surface)",
                    cursor: "pointer",
                    fontWeight: selected === r.number ? 700 : 400,
                    fontSize: "0.82rem",
                    color: "var(--color-text)",
                    textAlign: "center",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: "2px" }}>
                    {r.number}
                  </div>
                  {ta ? r.name.ta : r.name.en}
                </button>
              ))}
            </div>

            {/* Result */}
            {chandraRasi && birthRasi && chandraNum !== null && (
              <div style={{
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                overflow: "hidden",
              }}>
                {/* Chandrashtama rasi highlight */}
                <div style={{
                  padding: "24px",
                  background: "var(--panel-earth-dark)",
                  color: "var(--panel-hover)",
                  display: "flex", alignItems: "center", gap: "20px",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>{chandraNum}</div>
                    <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "2px" }}>
                      {ta ? "ஆம் ராசி" : "th rasi"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.65, marginBottom: "4px" }}>
                      {ta
                        ? `${ta ? birthRasi.name.ta : birthRasi.name.en} ஜன்ம ராசிக்கு சந்திராஷ்டம ராசி`
                        : `Chandrashtama rasi for ${birthRasi.name.en} janma rasi`}
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                      {ta ? chandraRasi.name.ta : chandraRasi.name.en}
                    </div>
                  </div>
                </div>

                {/* Meaning */}
                <div style={{ padding: "20px 24px", background: "var(--color-surface)" }}>
                  <p style={{ margin: "0 0 8px", fontWeight: 600, fontSize: "0.9rem" }}>
                    {ta ? "இது என்னவென்று பொருள்:" : "What this means:"}
                  </p>
                  <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.65 }}>
                    {ta
                      ? `சந்திரன் ${ta ? chandraRasi.name.ta : chandraRasi.name.en} ராசியில் நுழையும்போது (சுமார் 2.5 நாட்கள்), உங்களுக்கு சந்திராஷ்டம காலம். புதிய தொடக்கங்கள், அறுவை சிகிச்சைகள், முக்கிய பண முடிவுகளைத் தவிர்க்கவும். விநாடி உங்கள் டாஷ்போர்டில் இந்தக் காலங்களைத் தினமும் காட்டும்.`
                      : `When the Moon transits ${chandraRasi.name.en} (roughly 2.5 days every ~27 days), that is your Chandrashtama period. Classical Tamil astrology recommends avoiding new ventures, surgeries, and major financial decisions during this window. Vinaadi shows you these periods automatically in your daily dashboard.`}
                  </p>
                </div>

                {/* Moon house table */}
                <div style={{ padding: "0 24px 20px", background: "var(--color-surface)", borderTop: "1px solid var(--color-border)" }}>
                  <p style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "4px", marginTop: "16px" }}>
                    {ta ? "சந்திர கோச்சாரம் — ஜன்ம ராசியிலிருந்து 12 இடங்களின் பலன்:" : "Chandra gochara — the Moon's result in each sign from your janma rasi:"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 10px" }}>
                    {ta
                      ? "மூலம்: பலதீபிகை — 1, 3, 6, 7, 10, 11 சாதகம்; 2, 4, 5, 8, 9, 12 பாதகம்."
                      : "Source: Phaladeepika — favourable in 1, 3, 6, 7, 10, 11; adverse in 2, 4, 5, 8, 9, 12."}
                  </p>
                  {Array.from({ length: 12 }, (_, i) => {
                    const house = i + 1;
                    const rasi = RASI_LIST[((selected! - 1 + i) % 12)];
                    const isChandra = house === 8;
                    return (
                      <div
                        key={house}
                        style={{
                          display: "flex", gap: "12px", alignItems: "flex-start",
                          padding: "8px 0",
                          borderBottom: house < 12 ? "1px solid var(--color-border)" : "none",
                          background: isChandra ? "var(--panel-warm-tint)" : "transparent",
                          borderRadius: isChandra ? "8px" : undefined,
                          paddingInline: isChandra ? "8px" : undefined,
                        }}
                      >
                        <span style={{
                          fontFamily: "monospace", fontSize: "0.75rem",
                          color: isChandra ? "var(--chart-amber)" : "var(--text-secondary)",
                          fontWeight: isChandra ? 700 : 400,
                          minWidth: "24px",
                        }}>
                          {house}
                        </span>
                        <span style={{ fontSize: "0.82rem", fontWeight: isChandra ? 700 : 400, minWidth: "80px", color: "var(--color-text)" }}>
                          {ta ? rasi.name.ta : rasi.name.en}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: isChandra ? "var(--panel-earth)" : "var(--text-secondary)", lineHeight: 1.5 }}>
                          {ta ? HOUSE_LABELS[house].ta : HOUSE_LABELS[house].en}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sign-up CTA */}
            <div style={{
              marginTop: "32px",
              padding: "24px",
              borderRadius: "14px",
              background: "var(--cl-bg-2)",
              border: "1px solid var(--panel-tan)",
              textAlign: "center",
            }}>
              <p style={{ fontWeight: 700, margin: "0 0 6px" }}>
                {ta
                  ? "உங்கள் சந்திராஷ்டம நாட்களைத் தினமும் தானாக அறிய:"
                  : "Get your Chandrashtama dates tracked automatically:"}
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", margin: "0 0 16px" }}>
                {ta
                  ? "விநாடியில் பிறப்பு விவரங்களை ஒருமுறை கொடுங்கள் — உங்கள் ஜன்ம ராசியைத் தானாகக் கணக்கிட்டு, தினமும் சந்திராஷ்டம எச்சரிக்கையைக் காட்டும்."
                  : "Enter your birth details once and Vinaadi auto-calculates your Janma Rasi and shows Chandrashtama warnings in your daily feed."}
              </p>
              <Link
                href="/login"
                style={{
                  display: "inline-block", padding: "10px 24px",
                  borderRadius: "999px", background: "var(--panel-earth-dark)",
                  color: "var(--panel-hover)", fontWeight: 600, fontSize: "0.88rem",
                  textDecoration: "none",
                }}
              >
                {ta ? "இலவசமாக தொடங்கு →" : "Get started free →"}
              </Link>
            </div>
          </div>
        </section>

        {/* Learn more */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">
              {ta ? "சந்திராஷ்டமம் பற்றி மேலும்" : "Learn more about Chandrashtama"}
            </h2>
            <div className="cl-pub-related-links" style={{ marginTop: "16px" }}>
              <Link href="/learn/what-is-chandrashtama" className="cl-pub-related-link">
                {ta ? "சந்திராஷ்டமம் என்றால் என்ன? →" : "What is Chandrashtama? →"}
              </Link>
              <Link href="/tools/indraiya-rasipalan" className="cl-pub-related-link">
                {ta ? "இன்றைய ராசிபலன் →" : "Today's Rasipalan →"}
              </Link>
              <Link href="/tools/daily-panchangam-planner" className="cl-pub-related-link">
                {ta ? "தினசரி பஞ்சாங்கம் →" : "Daily Panchangam →"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
