import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { NATCHATHIRAM_LIST } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: "27 நட்சத்திரங்கள் — குண நலன்கள், தொழில், பலன்கள் | Vinaadi",
  description:
    "27 நட்சத்திரங்களின் முழு வழிகாட்டுதல் — குண நலன்கள், தொழில் வாய்ப்புகள், குடும்ப வாழ்க்கை, தசை பலன்கள் மற்றும் ஆன்மீக வழிபாடு. திருக்கணிதம் அடிப்படையில் விவரிக்கப்பட்டுள்ளது.",
  keywords: [
    "27 நட்சத்திரங்கள்",
    "27 nakshatras in Tamil",
    "nakshatra characteristics Tamil",
    "நட்சத்திரம் பலன்கள்",
    "nakshatra personality",
    "Tamil nakshatra guide",
    "நட்சத்திரம் தொழில்",
    "nakshatra career astrology",
    "Vinaadi natchathiram",
  ],
  alternates: { canonical: "https://vinaadi.com/natchathiram" },
  openGraph: {
    title: "27 நட்சத்திரங்கள் — குண நலன்கள், தொழில், பலன்கள்",
    description:
      "27 நட்சத்திரங்களின் விரிவான வழிகாட்டுதல் — குண நலன்கள், இன்றைய தொழில்கள், குடும்பம், தசை பலன்கள்.",
    url: "https://vinaadi.com/natchathiram",
    type: "website",
  },
};

export default function NatchathiramIndexPage() {
  const available = NATCHATHIRAM_LIST.filter((n) => n.available);
  const upcoming = NATCHATHIRAM_LIST.filter((n) => !n.available);

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* ── Hero ── */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">திருக்கணிதம் — Vedic Astrology</p>
              <h1 className="cl-pub-h1">27 நட்சத்திரங்கள்</h1>
              <p className="cl-pub-lead">
                நீங்கள் பிறந்த நட்சத்திரம் உங்கள் குணம், தொழில், குடும்பம்,
                தசை காலங்கள் மற்றும் ஆன்மீக பாதை பற்றி என்ன சொல்கிறது?
                ஒவ்வொரு நட்சத்திரத்தின் விரிவான வழிகாட்டுதல் இங்கே.
              </p>
            </div>
          </div>
        </section>

        {/* ── Available nakshatras ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">கிடைக்கும் நட்சத்திர வழிகாட்டுதல்கள்</h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.25rem",
              marginTop: "1.5rem",
            }}>
              {available.map((n) => (
                <Link
                  key={n.slug}
                  href={`/natchathiram/${n.slug}`}
                  style={{
                    display: "block",
                    padding: "1.25rem 1.5rem",
                    border: "1px solid var(--cl-accent, #6366f1)",
                    borderRadius: "0.75rem",
                    textDecoration: "none",
                    transition: "box-shadow 0.15s",
                  }}
                  className="cl-natch-card"
                >
                  <span style={{
                    display: "inline-block",
                    background: "var(--cl-accent, #6366f1)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "2rem",
                    height: "2rem",
                    lineHeight: "2rem",
                    textAlign: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                  }}>
                    {n.number}
                  </span>
                  <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>{n.name_ta}</p>
                  <p style={{ margin: "0.1rem 0 0", opacity: 0.55, fontSize: "0.85rem" }}>{n.name_en}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Upcoming ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">விரைவில் வருகிறது</h2>
            <p style={{ opacity: 0.65, marginBottom: "1.5rem" }}>
              மீதமுள்ள நட்சத்திர வழிகாட்டுதல்கள் விரைவில் சேர்க்கப்படும்.
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "0.75rem",
            }}>
              {upcoming.map((n) => (
                <div
                  key={n.slug}
                  style={{
                    padding: "0.75rem 1rem",
                    border: "1px solid var(--cl-border, #e5e7eb)",
                    borderRadius: "0.5rem",
                    opacity: 0.5,
                  }}
                >
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.6 }}>{n.number}.</span>
                  <p style={{ margin: "0.1rem 0 0", fontWeight: 600 }}>{n.name_ta}</p>
                  <p style={{ margin: 0, fontSize: "0.78rem", opacity: 0.7 }}>{n.name_en}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What is nakshatra ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">நட்சத்திரம் என்றால் என்ன?</h2>
            <p>
              இந்திய வேத ஜோதிட முறையில் சந்திரன் 27 நட்சத்திரங்களில் ஒவ்வொரு நாளும் ஒரு நட்சத்திரத்தில் உலவும். நீங்கள் பிறந்த நேரத்தில் சந்திரன் எந்த நட்சத்திரத்தில் இருந்தது என்பதே உங்கள் ஜன்ம நட்சத்திரம். இது உங்கள் ஆழமான மன இயல்பை, குணத்தை, வாழ்க்கை போக்கை மற்றும் பிறவி கர்மங்களை குறிக்கும்.
            </p>
            <p>
              நட்சத்திரம் மற்றும் லக்னம் சேர்ந்து உங்கள் ஜாதகத்தின் அடிப்படையை உருவாக்குகின்றன. இந்தப் பக்கங்களில் கொடுக்கப்பட்டுள்ள பலன்கள் பொதுவான குண நலன்கள் — உங்கள் தனிப்பட்ட ஜாதகம் கூடுதல் துல்லியமான பலன்களை தரும்.
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--primary">
                உங்கள் நட்சத்திரம் அறிந்துகொள்ளவும்
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
