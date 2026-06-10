"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import type { NatchathiramEntry } from "@/lib/natchathiram-data";

interface Props {
  data: NatchathiramEntry;
}

export function NatchathiramPageContent({ data }: Props) {
  const { sections } = data;

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* ── Hero ── */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">27 நட்சத்திரங்கள் — {data.number}/27</p>
              <h1 className="cl-pub-h1">
                {data.name_ta} நட்சத்திரம்
                <span style={{ display: "block", fontSize: "0.55em", fontWeight: 400, opacity: 0.7, marginTop: "0.25rem" }}>
                  {data.name_en} Nakshatra
                </span>
              </h1>
              <p className="cl-pub-lead">
                {data.name_ta} நட்சத்திரத்தில் பிறந்தவர்களின் குண நலன்கள், தொழில்,
                குடும்பம், தசை பலன்கள் மற்றும் ஆன்மீக வழிகாட்டுதல்.
              </p>
            </div>
          </div>
        </section>

        {/* ── Facts card ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
              marginTop: "0.5rem",
            }}>
              {[
                { label: "ராசி", value: data.rasi_ta },
                { label: "அதிபதி கிரகம்", value: data.ruling_planet_ta },
                { label: "தெய்வம்", value: data.deity_ta },
                { label: "கணம்", value: data.gana_ta },
                { label: "சின்னம்", value: data.symbol_ta },
                { label: "பிறப்பு தசை", value: data.born_dasa_ta },
              ].map((item) => (
                <div key={item.label} style={{
                  background: "var(--cl-surface, #fafafa)",
                  border: "1px solid var(--cl-border, #e5e7eb)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem 1rem",
                }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.55, margin: 0 }}>
                    {item.label}
                  </p>
                  <p style={{ margin: "0.25rem 0 0", fontWeight: 600 }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Personality ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{sections.personality.h2}</h2>
            {sections.personality.paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Career ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{sections.career.h2}</h2>
            {sections.career.paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Modern context ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{sections.modern.h2}</h2>
            <p style={{ fontSize: "0.82rem", fontStyle: "italic", opacity: 0.6, marginBottom: "1rem" }}>
              100 ஆண்டுகளுக்கு முன் கணினி இல்லை. 20 ஆண்டுகளுக்கு முன் analytics இல்லை. 5 ஆண்டுகளுக்கு முன் AI agents இல்லை.
              இன்றைய தலைமுறைக்கு பாரம்பரிய குண நலன்கள் எப்படி வெளிப்படுகின்றன என்று பாருங்கள்.
            </p>
            {sections.modern.paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Family ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{sections.family.h2}</h2>
            {sections.family.paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Dasha ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{sections.dasha.h2}</h2>
            <p style={{ fontSize: "0.82rem", opacity: 0.6, marginBottom: "1rem" }}>
              குறிப்பு: தசை காலங்கள் பாதம் மற்றும் டிகிரியை பொறுத்து மாறும். தனிப்பட்ட ஜாதகத்தில் துல்லியமான தசை காலங்களை அறிய{" "}
              <Link href="/tools/jadhagam-generator" style={{ color: "var(--cl-accent)" }}>ஜாதகம் உருவாக்கவும்</Link>.
            </p>
            {sections.dasha.paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Compatible nakshatras ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">சாதகமான நட்சத்திரங்கள்</h2>
            <p>
              {data.name_ta} நட்சத்திரக்காரர்களுக்கு பொதுவாக சாதகமாக அமையும் நட்சத்திரங்கள்:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", margin: "1rem 0" }}>
              {data.compatible_nakshatras.map((n) => (
                <span key={n} style={{
                  background: "var(--cl-accent, #6366f1)",
                  color: "#fff",
                  borderRadius: "2rem",
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}>
                  {n}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "0.82rem", opacity: 0.65 }}>
              திருமணப் பொருத்தம் பார்க்க{" "}
              <Link href="/tools/marriage-porutham-calculator" style={{ color: "var(--cl-accent)" }}>
                பொருத்தம் கணிப்பான்
              </Link>{" "}
              பயன்படுத்தவும்.
            </p>
          </div>
        </section>

        {/* ── Spiritual ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{sections.spiritual.h2}</h2>
            {sections.spiritual.paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Summary ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{sections.summary.h2}</h2>
            {sections.summary.paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cl-band">
          <div className="cl-container" style={{ textAlign: "center" }}>
            <h2 className="cl-section-h2">உங்கள் ஜாதகம் பாருங்கள்</h2>
            <p>
              {data.name_ta} நட்சத்திரத்தின் பொதுப் பலன்கள் இங்கே தரப்பட்டுள்ளன.
              உங்கள் லக்னம், கிரக நிலைகள் மற்றும் தனிப்பட்ட தசை காலங்களுக்கு உங்கள் ஜாதகத்தை உருவாக்கவும்.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.5rem" }}>
              <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--primary">
                இலவச ஜாதகம் உருவாக்கவும்
              </Link>
              <Link href="/natchathiram" className="cl-btn cl-btn--ghost">
                அனைத்து நட்சத்திரங்கள்
              </Link>
            </div>
          </div>
        </section>

        {/* ── Related ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">மேலும் அறிக</p>
              <div className="cl-pub-related-links">
                <Link href="/learn/what-is-thirukanitham" className="cl-pub-related-link">
                  திருக்கணிதம் என்றால் என்ன?
                </Link>
                <Link href="/learn/what-is-porutham" className="cl-pub-related-link">
                  பொருத்தம் என்றால் என்ன?
                </Link>
                <Link href="/learn/what-is-chandrashtama" className="cl-pub-related-link">
                  சந்திராஷ்டமம் என்றால் என்ன?
                </Link>
                <Link href="/natchathiram" className="cl-pub-related-link">
                  27 நட்சத்திரங்கள் முழு பட்டியல்
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
