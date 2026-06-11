"use client";

import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { NATCHATHIRAM_DETAIL, mt } from "@/lib/marketing-i18n";
import { NATCHATHIRAM_LIST, type NatchathiramEntry } from "@/lib/natchathiram-data";
import { NATCHATHIRAM_EN, NATCHATHIRAM_EN_FACTS, JYOTISH_TERM_EN, type NatchathiramEnSections } from "@/lib/natchathiram-data-en";
import { normalizeTamilAstroText, romanNakshathiramLabel, romanNakshathiramName, tamilizeAstroEnglish } from "@/lib/tamil-astro";
import { NatchathiramFactVisual, RasiGlyph } from "@/components/astro-symbols";

interface Props {
  data: NatchathiramEntry;
}

// Resolve a Tamil nakshatra name to its English equivalent for chip display
function toEnName(taName: string): string {
  const found = NATCHATHIRAM_LIST.find((n) => n.name_ta === taName);
  return romanNakshathiramName(found ? found.name_en : taName);
}

export function NatchathiramPageContent({ data }: Props) {
  const [lang] = useLang();
  const d = NATCHATHIRAM_DETAIL;
  const { sections } = data;
  const englishName = romanNakshathiramName(data.name_en);
  const englishLabel = romanNakshathiramLabel(data.name_en);

  const enData = NATCHATHIRAM_EN[data.slug];
  function paras(key: keyof NatchathiramEnSections): string[] {
    if (lang === "en" && enData?.[key]?.length) return enData[key].map(tamilizeAstroEnglish);
    return sections[key].paras.map(normalizeTamilAstroText);
  }

  const available = NATCHATHIRAM_LIST.filter((n) => n.available);
  const currentIndex = available.findIndex((n) => n.number === data.number);
  const prev = currentIndex > 0 ? available[currentIndex - 1] : null;
  const next = currentIndex < available.length - 1 ? available[currentIndex + 1] : null;

  const enFacts = NATCHATHIRAM_EN_FACTS[data.slug];
  function termEn(ta: string): string { return JYOTISH_TERM_EN[ta] ?? ta; }

  const factRows = [
    { labelKey: "fact_rasi"   as const, value: lang === "en" ? data.rasi_en  : data.rasi_ta },
    { labelKey: "fact_planet" as const, value: lang === "en" ? termEn(data.ruling_planet_ta) : data.ruling_planet_ta },
    { labelKey: "fact_deity"  as const, value: lang === "en" ? (enFacts?.deity  ?? data.deity_ta)  : data.deity_ta },
    { labelKey: "fact_gana"   as const, value: lang === "en" ? termEn(data.gana_ta) : data.gana_ta },
    { labelKey: "fact_symbol" as const, value: lang === "en" ? (enFacts?.symbol ?? data.symbol_ta) : data.symbol_ta },
    { labelKey: "fact_dasha"  as const, value: lang === "en" ? termEn(data.born_dasa_ta) : data.born_dasa_ta },
  ];

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* ── Hero ── */}
        <section className="cl-pub-hero">
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{mt(d.eyebrow_prefix, lang)} · {data.number}/27</p>
              <h1 className="cl-pub-h1 cl-natch-detail-title">
                {lang === "ta" ? (
                  <>
                    <span className="cl-natch-detail-title__ta">{data.name_ta} நட்சத்திரம்</span>
                    <span className="cl-natch-detail-title__en">{englishLabel}</span>
                  </>
                ) : (
                  <>{englishLabel}</>
                )}
              </h1>
              <p className="cl-pub-lead">
                {lang === "ta"
                  ? `${data.name_ta} நட்சத்திரத்தில் பிறந்தவர்களின் குண நலன்கள், தொழில், குடும்பம், தசை பலன்கள் மற்றும் ஆன்மீக வழிகாட்டுதல்.`
                  : `${mt(d.lead, lang)} — ${englishLabel}.`}
              </p>
              {data.slug === "ashwini" && (
                <div style={{ marginTop: "1rem" }}>
                  <Link href={`/natchathiram/${data.slug}/visual`} className="cl-btn cl-btn--ghost"
                    style={{ fontSize: "0.82rem", padding: "0.45rem 1.1rem" }}>
                    &#9654; View Visual Profile
                  </Link>
                </div>
              )}
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{mt(d.fig_label_suffix, lang)} · {data.rasi_en}</p>
              <NatchathiramFactVisual data={data} />
            </div>
          </div>
        </section>

        {/* ── Facts card ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div className="cl-natch-facts">
              {factRows.map((item, index) => (
                <div key={item.labelKey} className="cl-natch-fact">
                  {index === 0 && (
                    <span className="cl-natch-fact__glyph">
                      <RasiGlyph rasi={data.rasi_en} label={data.rasi_en} size="sm" />
                    </span>
                  )}
                  <p className="cl-natch-fact__label">{mt(d[item.labelKey], lang)}</p>
                  <p className="cl-natch-fact__value">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Personality ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.sec_personality, lang)}</h2>
            {paras("personality").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Career ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.sec_career, lang)}</h2>
            {paras("career").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Modern context ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">
              {mt(d.sec_modern_pre, lang)} {lang === "en" ? englishName : data.name_ta}
            </h2>
            <p style={{ fontSize: "0.82rem", fontStyle: "italic", opacity: 0.6, marginBottom: "1rem" }}>
              {mt(d.modern_note, lang)}
            </p>
            {paras("modern").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Family ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.sec_family, lang)}</h2>
            {paras("family").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Dasha ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.sec_dasha, lang)}</h2>
            <p style={{ fontSize: "0.82rem", opacity: 0.6, marginBottom: "1rem" }}>
              {mt(d.dasha_note_pre, lang)}{" "}
              <Link href="/tools/jadhagam-generator" style={{ color: "var(--cl-accent)" }}>
                {mt(d.dasha_note_link, lang)}
              </Link>{" "}
              {mt(d.dasha_note_post, lang)}
            </p>
            {paras("dasha").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Compatible nakshatras ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.compat_h2, lang)}</h2>
            <p>
              {mt(d.compat_desc_pre, lang)}{" "}
              <strong>{lang === "en" ? englishName : data.name_ta}:</strong>
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
                  {lang === "en" ? toEnName(n) : n}
                </span>
              ))}
            </div>
            <p style={{ fontSize: "0.82rem", opacity: 0.65 }}>
              {mt(d.compat_link, lang)}{" "}
              <Link href="/tools/marriage-porutham-calculator" style={{ color: "var(--cl-accent)" }}>
                {mt(d.porutham_cta, lang)}
              </Link>
            </p>
          </div>
        </section>

        {/* ── Spiritual ── */}
        <section className="cl-band">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.sec_spiritual, lang)}</h2>
            {paras("spiritual").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── Summary ── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{mt(d.sec_summary, lang)}</h2>
            {paras("summary").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cl-band">
          <div className="cl-container" style={{ textAlign: "center" }}>
            <h2 className="cl-section-h2">{mt(d.cta_h2, lang)}</h2>
            <p>{mt(d.cta_body, lang)}</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.5rem" }}>
              <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--primary">
                {mt(d.cta_btn_primary, lang)}
              </Link>
              <Link href="/natchathiram" className="cl-btn cl-btn--ghost">
                {mt(d.cta_btn_ghost, lang)}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Prev / Next navigation ── */}
        {(prev || next) && (
          <nav aria-label="Nakshathiram navigation" className="cl-band cl-band--alt">
            <div className="cl-container">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderTop: "1px solid var(--cl-border)", paddingTop: "1.5rem" }}>
                {prev ? (
                  <Link href={`/natchathiram/${prev.slug}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--cl-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {mt(d.nav_prev, lang)}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--cl-ink)", fontSize: "1rem" }}>
                      {lang === "en" ? romanNakshathiramName(prev.name_en) : prev.name_ta}
                    </span>
                    {lang === "ta" && <span style={{ fontSize: "0.85rem", color: "var(--cl-muted)" }}>{romanNakshathiramLabel(prev.name_en)}</span>}
                  </Link>
                ) : <div />}
                {next ? (
                  <Link href={`/natchathiram/${next.slug}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: "3px", textAlign: "right" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--cl-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {mt(d.nav_next, lang)}
                    </span>
                    <span style={{ fontWeight: 600, color: "var(--cl-ink)", fontSize: "1rem" }}>
                      {lang === "en" ? romanNakshathiramName(next.name_en) : next.name_ta}
                    </span>
                    {lang === "ta" && <span style={{ fontSize: "0.85rem", color: "var(--cl-muted)" }}>{romanNakshathiramLabel(next.name_en)}</span>}
                  </Link>
                ) : <div />}
              </div>
            </div>
          </nav>
        )}

        {/* ── Related ── */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-pub-related-links">
                <Link href="/learn/what-is-thirukanitham" className="cl-pub-related-link">
                  {mt(d.rel_thirukanitham, lang)}
                </Link>
                <Link href="/learn/what-is-porutham" className="cl-pub-related-link">
                  {mt(d.rel_porutham, lang)}
                </Link>
                <Link href="/learn/what-is-chandrashtama" className="cl-pub-related-link">
                  {mt(d.rel_chandrashtama, lang)}
                </Link>
                <Link href="/natchathiram" className="cl-pub-related-link">
                  {mt(d.rel_all, lang)}
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
