"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLang } from "@/components/lang-toggle";
import { apiFetchJson } from "@/lib/api";
import { formatClockLabel } from "@/lib/format";
import { tNakshatra, tTithi, tYoga } from "@/lib/i18n";
import { limbNow } from "@/lib/panchangam-limb";
import type { PanchangamDailyResponseData } from "@/lib/types";
import { HOME, LEARN_VEDIC_WESTERN, mt } from "@/lib/marketing-i18n";
import { MarketingIcon, type MarketingIconName } from "@/components/marketing-icons";
import { useGuestStore, RASI_LIST } from "@/hooks/useGuestStore";
import { getFeatureFlag, initAnalytics, track } from "@/lib/analytics";

function makeSample(lang: "en" | "ta", rasiOverride?: { en: string; ta: string } | null) {
  const en = lang === "en";
  return {
    score: 64,
    summary:    en
      ? "Moon Dasa · Moon Bhukti. Saturn refines home and inner stability. A measured day — good for steady work, cautious for new ventures."
      : "சந்திர தசை · சந்திர புக்தி. சனி வீடும் உள்ளமைதியும் உறுதியாக நிற்கச் செய்கிறது. இன்று சீரான நாள்; தொடர்ச்சியாக செய்யும் வேலைகளுக்கு ஏற்றது, புதிய முயற்சிகளில் சற்று கவனம் நல்லது.",
    bestWindow: { start: "11:53", end: "12:41" },
    holdWindow: { start: "15:28", end: "17:03" },
    lagna:      en ? "Kadagam"   : "கடகம்",
    nakshatra:  en ? "Kettai"    : "கேட்டை",
    rasi:       rasiOverride ? (en ? rasiOverride.en : rasiOverride.ta) : (en ? "Viruchigam" : "விருச்சிகம்"),
    dasha:      en ? "Moon Dasa · Moon Bhukti"              : "சந்திர தசை · சந்திர புக்தி",
    transit:    en ? "Saturn in Kumbam · Jupiter in Mesham" : "சனி கும்பத்தில் · குரு மேஷத்தில்",
    panchangam: en ? "Ekadasi · Kettai · Vishkambha"        : "ஏகாதசி · கேட்டை · விஷ்கம்பம்",
  };
}

const ARC_HOURS = ["6 am", "9 am", "12 pm", "3 pm", "6 pm"];

// iOS app is not yet published — set the real store URL when it goes live to
// re-render the App Store badge (null hides it; id0000000000 was a dead link).
const APP_STORE_URL: string | null = null;

export function HomeContent() {
  const [lang] = useLang();
  const { selectedRasi, setRasi } = useGuestStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chartsGenerated, setChartsGenerated] = useState<number | null>(null);
  const [countError, setCountError] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  // MKT-10 — default to the control label ("A") instead of a generic "start"
  // placeholder, so only the (minority) variant-B bucket ever sees the label
  // swap after the flag resolves, not every visitor.
  const [ctaVariant, setCtaVariant] = useState<"A" | "B">("A");
  const [panchangam, setPanchangam] = useState<PanchangamDailyResponseData | null>(null);

  useEffect(() => {
    fetch("/api/backend/api/v1/stats/public", { credentials: "include" })
      .then((r) => r.json())
      .then((j: { charts_generated?: number }) => {
        if (typeof j.charts_generated === "number") setChartsGenerated(j.charts_generated);
        else setCountError(true);
      })
      .catch(() => { setCountError(true); /* numberless fallback shown */ });
  }, []);

  // MKT-11 — count-up to the real figure once it arrives (respecting reduced
  // motion), so the counter animates in rather than snapping / showing a dash.
  useEffect(() => {
    if (chartsGenerated == null) return;
    const target = chartsGenerated;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplayCount(target);
      return;
    }
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayCount(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chartsGenerated]);

  // MKT-04 — the hero "Today's Reading · Sample" card shows today's real
  // panchangam (Chennai default) instead of a hardcoded stale date. Score /
  // windows / dasha stay illustrative (a guest has no chart), but the date and
  // tithi/nakshatra/yoga are the true values for the visitor's day.
  useEffect(() => {
    const iso = new Date().toISOString().slice(0, 10);
    const qs = new URLSearchParams({ date: iso, lat: "13.0827", lng: "80.2707", timezone: "Asia/Kolkata" }).toString();
    fetch(`/api/backend/api/v1/public/panchangam?${qs}`)
      .then((r) => r.json())
      .then((j: { data?: PanchangamDailyResponseData }) => setPanchangam(j.data ?? null))
      .catch(() => { /* fail silently — sample falls back to today's date only */ });
  }, []);

  useEffect(() => {
    initAnalytics();
    const flag = getFeatureFlag("cta_primary");
    if (flag === "variant_b") setCtaVariant("B");
  }, []);
  const SAMPLE = makeSample(lang, selectedRasi);
  const bestWindowLabel = `${formatClockLabel(SAMPLE.bestWindow.start)} - ${formatClockLabel(SAMPLE.bestWindow.end)}`;
  const holdWindowLabel = `${formatClockLabel(SAMPLE.holdWindow.start)} - ${formatClockLabel(SAMPLE.holdWindow.end)}`;

  // Real, current date for the sample card (suppressHydrationWarning guards the
  // rare server/client timezone day-flip). Panchangam facts fill in once fetched.
  const todayLabel = new Intl.DateTimeFormat(lang === "ta" ? "ta-IN" : "en-GB", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date());
  // This card always shows *today*, so it must show the limbs actually running,
  // not the ones the day is named after. Printing the sunrise value flat is how
  // the hero came to read "Swathi" all day on 2026-08-19, when Swathi held 15
  // minutes of it and Visakam held the rest. A visitor's first impression of the
  // product's accuracy is this strip.
  const nowIso = new Date().toISOString();
  const heroLimbs = panchangam
    ? {
        nakshatra: limbNow(panchangam.nakshatra, { isToday: true, nowIso }),
        tithi: limbNow(panchangam.tithi, { isToday: true, nowIso }),
        yoga: limbNow(panchangam.yoga, { isToday: true, nowIso }),
      }
    : null;
  const sampleNakshatra = heroLimbs ? tNakshatra(heroLimbs.nakshatra.activeName, lang) : SAMPLE.nakshatra;
  const samplePanchangam = heroLimbs
    ? `${tTithi(heroLimbs.tithi.activeName, lang)} · ${tNakshatra(heroLimbs.nakshatra.activeName, lang)} · ${tYoga(heroLimbs.yoga.activeName, lang)}`
    : SAMPLE.panchangam;

  const HELPS: { icon: MarketingIconName; title: string; body: string }[] = [
    { icon: "sun",      title: mt(HOME.help1_title, lang), body: mt(HOME.help1_body, lang) },
    { icon: "calendar", title: mt(HOME.help2_title, lang), body: mt(HOME.help2_body, lang) },
    { icon: "users",    title: mt(HOME.help3_title, lang), body: mt(HOME.help3_body, lang) },
    { icon: "grid",     title: mt(HOME.help4_title, lang), body: mt(HOME.help4_body, lang) },
    { icon: "rings",    title: mt(HOME.help5_title, lang), body: mt(HOME.help5_body, lang) },
    { icon: "sliders",  title: mt(HOME.help6_title, lang), body: mt(HOME.help6_body, lang) },
  ];

  const DAILY_SIGS = [
    mt(HOME.daily_sig1, lang),
    mt(HOME.daily_sig2, lang),
    mt(HOME.daily_sig3, lang),
    mt(HOME.daily_sig4, lang),
    mt(HOME.daily_sig5, lang),
  ];

  const FAMILY_ITEMS = [
    mt(HOME.family_item1, lang),
    mt(HOME.family_item2, lang),
    mt(HOME.family_item3, lang),
    mt(HOME.family_item4, lang),
  ];

  const TOOLS: { icon: MarketingIconName; name: string; desc: string; href: string; cta: string }[] = [
    { icon: "rings",  name: mt(HOME.tool1_name, lang), desc: mt(HOME.tool1_desc, lang), href: "/tools/marriage-porutham-calculator", cta: mt(HOME.tool1_cta, lang) },
    { icon: "grid",   name: mt(HOME.tool2_name, lang), desc: mt(HOME.tool2_desc, lang), href: "/tools/jadhagam-generator",           cta: mt(HOME.tool2_cta, lang) },
    { icon: "moon",   name: mt(HOME.tool3_name, lang), desc: mt(HOME.tool3_desc, lang), href: "/tools/daily-panchangam-planner",     cta: mt(HOME.tool3_cta, lang) },
    { icon: "target", name: mt(HOME.tool4_name, lang), desc: mt(HOME.tool4_desc, lang), href: "/tools/birth-time-rectification",     cta: mt(HOME.tool4_cta, lang) },
  ];

  const HOW_STEPS = [
    { num: mt(HOME.step1_num, lang), title: mt(HOME.step1_title, lang), body: mt(HOME.step1_body, lang) },
    { num: mt(HOME.step2_num, lang), title: mt(HOME.step2_title, lang), body: mt(HOME.step2_body, lang) },
    { num: mt(HOME.step3_num, lang), title: mt(HOME.step3_title, lang), body: mt(HOME.step3_body, lang) },
  ];

  const METHOD_ITEMS = [
    { title: mt(HOME.meth1_title, lang), body: mt(HOME.meth1_body, lang) },
    { title: mt(HOME.meth2_title, lang), body: mt(HOME.meth2_body, lang) },
    { title: mt(HOME.meth3_title, lang), body: mt(HOME.meth3_body, lang) },
    { title: mt(HOME.meth4_title, lang), body: mt(HOME.meth4_body, lang) },
    { title: mt(HOME.meth5_title, lang), body: mt(HOME.meth5_body, lang) },
  ];

  const FAMILY_MEMBERS = [
    { name: "Arjun", score: 64, band: "mid" },
    { name: "Priya", score: 81, band: "high" },
    { name: "Kavitha", score: 47, band: "low" },
  ];

  return (
    <main>
      {/* SECTION 1 — Hero */}
      <section className="cl-hero" id="top">
        <div className="cl-hero__inner">
          <div className="cl-hero__copy">
            <p className="cl-eyebrow">{mt(HOME.hero_eyebrow, lang)}</p>
            <p className="cl-hero__tagline">{mt(HOME.hero_tagline, lang)}</p>
            <h1 className="cl-hero__h1">{mt(HOME.hero_h1, lang)}</h1>
            <p className="cl-hero__body">{mt(HOME.hero_body, lang)}</p>
            <div className="cl-hero__actions">
              <Link
                href="/dashboard"
                className="cl-btn cl-btn--solid"
                onClick={() => track("cta_clicked", { variant: ctaVariant })}
              >
                {ctaVariant === "B"
                  ? mt(HOME.hero_cta_variant_b, lang)
                  : mt(HOME.hero_cta_variant_a, lang)}
              </Link>
              <a href="#how-it-works" className="cl-btn cl-btn--ghost">{mt(HOME.hero_cta_how, lang)}</a>
            </div>
            {/* Guest rasi picker */}
            <div className="cl-guest-rasi">
              {!pickerOpen && !selectedRasi && (
                <p className="cl-hero__guest-note">
                  <button
                    type="button"
                    className="cl-guest-rasi__trigger"
                    onClick={() => setPickerOpen(true)}
                  >
                    {lang === "en"
                      ? "No account needed — Pick your Rasi to personalise →"
                      : "கணக்கு தேவையில்லை — உங்கள் ராசி தேர்வு செய்யுங்கள் →"}
                  </button>
                </p>
              )}
              {selectedRasi && !pickerOpen && (
                <p className="cl-hero__guest-note">
                  <span className="cl-guest-rasi__badge">
                    {lang === "ta" ? selectedRasi.ta : selectedRasi.en}
                  </span>
                  {" "}
                  <Link href="/tools/indraiya-rasipalan" className="cl-guest-rasi__cta">
                    {lang === "en" ? "See today's Rasi palan ->" : "இன்றைய ராசிபலன் பாருங்கள் ->"}
                  </Link>
                  {" · "}
                  <button
                    type="button"
                    className="cl-guest-rasi__change"
                    onClick={() => setPickerOpen(true)}
                  >
                    {lang === "en" ? "Change" : "மாற்று"}
                  </button>
                </p>
              )}
              {pickerOpen && (
                <div className="cl-rasi-picker">
                  <p className="cl-rasi-picker__label">
                    {lang === "en" ? "Select your birth Rasi" : "உங்கள் ஜன்ம ராசி தேர்க"}
                  </p>
                  <div className="cl-rasi-picker__grid">
                    {RASI_LIST.map((rasi) => (
                      <button
                        key={rasi.id}
                        type="button"
                        className="cl-rasi-picker__chip"
                        data-active={selectedRasi?.id === rasi.id}
                        onClick={() => {
                          setRasi(rasi.id);
                          setPickerOpen(false);
                        }}
                      >
                        {lang === "ta" ? rasi.ta : rasi.en}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="cl-rasi-picker__cancel"
                    onClick={() => setPickerOpen(false)}
                  >
                    {lang === "en" ? "Cancel" : "ரத்து செய்"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="cl-hero__card-wrap" id="sample">
            <span className="cl-sticker">{mt(HOME.card_today, lang)}</span>
            <div className="cl-reading-card">
              <div className="cl-card-head">
                <div>
                  <p className="cl-card-date" suppressHydrationWarning>{todayLabel}</p>
                  <h2 className="cl-card-title">{mt(HOME.card_your_day, lang)}</h2>
                </div>
                <div className="cl-dial" aria-label={`Day score ${SAMPLE.score}`}>
                  <svg className="cl-dial__svg" viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--cl-border)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--cl-ink)" strokeWidth="6"
                      strokeDasharray={`${(SAMPLE.score / 100) * 213.6} 213.6`}
                      strokeLinecap="round" transform="rotate(-90 40 40)" />
                  </svg>
                  <div className="cl-dial__num">{SAMPLE.score}</div>
                </div>
              </div>
              <p className="cl-card-summary">{SAMPLE.summary}</p>
              <div className="cl-arc-wrap" aria-hidden="true">
                <svg viewBox="0 0 320 110" className="cl-arc__svg" preserveAspectRatio="xMidYMid meet">
                  <path d="M20,82 Q160,18 300,82" fill="none" stroke="var(--panel-tan)" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="20" y="79" width="280" height="5" rx="2.5" fill="var(--panel-tan-light)" />
                  <rect x="157" y="78" width="19" height="7" rx="3.5" fill="var(--chart-d9-active)" />
                  <rect x="241" y="78" width="37" height="7" rx="3.5" fill="var(--planet-saturn)" />
                  {[20, 90, 160, 230, 300].map((x) => (
                    <line key={x} x1={x} y1="86" x2={x} y2="93" stroke="#A89D89" strokeWidth="1.5" strokeLinecap="round" />
                  ))}
                  <circle cx="164" cy="50" r="6" fill="var(--panel-brand)" />
                </svg>
                <div className="cl-arc-labels">
                  {ARC_HOURS.map((h) => <span key={h} className="cl-arc-label">{h}</span>)}
                </div>
              </div>
              <div className="cl-window-row">
                <div className="cl-window cl-window--best">
                  <p className="cl-window__label">{mt(HOME.card_best, lang)}</p>
                  <p className="cl-window__time">{bestWindowLabel}</p>
                </div>
                <div className="cl-window cl-window--hold">
                  <p className="cl-window__label">{mt(HOME.card_hold, lang)}</p>
                  <p className="cl-window__time">{holdWindowLabel}</p>
                </div>
              </div>
              <div className="cl-card-foot">
                <span className="cl-card-foot__meta">{SAMPLE.lagna} · {sampleNakshatra} · {SAMPLE.rasi}</span>
                <span className="cl-card-foot__badge">{mt(HOME.card_d1_ready, lang)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1b — Social Proof */}
      <section className="cl-social-proof">
        <div className="cl-container">
          {/* Chart counter (MKT-11) — count-up on arrival; a numberless
              sentence (never a lonely dash) if the stat fails to load. */}
          <div className="cl-social-proof__counter">
            {chartsGenerated != null ? (
              <>
                <span className="cl-social-proof__number">{displayCount.toLocaleString()}</span>
                <span className="cl-social-proof__label">{mt(HOME.social_counter_suffix, lang)}</span>
              </>
            ) : countError ? (
              <span className="cl-social-proof__label">
                {lang === "en"
                  ? "Jadhagams generated for Tamil families worldwide"
                  : "தமிழ் குடும்பங்களுக்கு ஜாதகங்கள் உருவாக்கப்படுகின்றன"}
              </span>
            ) : (
              <span className="cl-social-proof__number" aria-hidden="true" style={{ opacity: 0 }}>0000</span>
            )}
          </div>
          <Link href="/learn/vedic-vs-western" className="cl-social-proof__learn">
            {mt(LEARN_VEDIC_WESTERN.start_here, lang)}
          </Link>

          {/* Verifiable trust proofs replace hand-written testimonials — the
              rigor-seeking segment reads stock quotes as growth-hack theatre
              (#22). Each claim is something the product actually does and the
              user can check. */}
          <div className="cl-testimonials">
            {[
              {
                claim: lang === "en"
                  ? "Every date is Drik Ganita — the same Thirukanitham your temple panchangam uses."
                  : "ஒவ்வொரு தேதியும் திருகணிதம் (Drik Ganita) — உங்கள் கோயில் பஞ்சாங்கம் பயன்படுத்தும் அதே முறை.",
                tag: lang === "en" ? "Method, not marketing" : "முறை, விளம்பரம் அல்ல",
                href: "/trust/methodology",
              },
              {
                claim: lang === "en"
                  ? "Lahiri ayanamsa, South-Indian whole-sign houses, Vimshottari dasha — shown, not hidden."
                  : "லஹிரி அயனாம்சம், தென்னிந்திய முழு-ராசி வீடுகள், விம்சோத்தரி தசை — மறைக்காமல் காட்டுகிறோம்.",
                tag: lang === "en" ? "Transparent by default" : "வெளிப்படையானது",
                href: "/trust/methodology",
              },
              {
                claim: lang === "en"
                  ? "Your birth details are encrypted and yours to delete anytime."
                  : "உங்கள் பிறப்பு விவரங்கள் மறையாக்கம் — எப்போது வேண்டுமானாலும் நீக்கலாம்.",
                tag: lang === "en" ? "Your data, your control" : "உங்கள் தரவு, உங்கள் கட்டுப்பாடு",
                href: "/privacy",
              },
            ].map((p, i) => (
              <a key={i} href={p.href} className="cl-testimonial" style={{ textDecoration: "none", display: "block" }}>
                <p className="cl-testimonial__quote">{p.claim}</p>
                <footer className="cl-testimonial__name">{p.tag} →</footer>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — What Vinaadi does */}
      <section className="cl-helps">
        <div className="cl-container">
          <div className="cl-helps__head">
            <p className="cl-eyebrow">{mt(HOME.helps_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.helps_h2, lang)}</h2>
          </div>
          <div className="cl-helps-grid">
            {HELPS.map((item) => (
              <div key={item.title} className="cl-helps-card">
                <span className="cl-helps-card__icon"><MarketingIcon name={item.icon} size={26} /></span>
                <h3 className="cl-helps-card__title">{item.title}</h3>
                <p className="cl-helps-card__body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Daily Guidance */}
      <section className="cl-daily" id="how-it-works">
        <div className="cl-container cl-daily__inner">
          <div className="cl-daily__copy">
            <p className="cl-eyebrow">{mt(HOME.daily_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.daily_h2, lang)}</h2>
            <p className="cl-section-body">{mt(HOME.daily_body, lang)}</p>
            <ul className="cl-daily__signal-list">
              {DAILY_SIGS.map((s) => (
                <li key={s} className="cl-daily__signal">
                  <span className="cl-daily__signal-dot" aria-hidden="true" />
                  {s}
                </li>
              ))}
            </ul>
            <Link href="/features/daily-guidance" className="cl-btn cl-btn--ghost">{mt(HOME.daily_link, lang)}</Link>
          </div>
          <div className="cl-daily-card">
            <div className="cl-daily-card__head">
              <p className="cl-daily-card__label">{mt(HOME.card_reading, lang)}</p>
              <span className="cl-daily-card__score">{SAMPLE.score}</span>
            </div>
            <div className="cl-daily-card__windows">
              <div className="cl-daily-card__win cl-daily-card__win--best">
                <p className="cl-daily-card__win-label">{mt(HOME.card_best, lang)}</p>
                <p className="cl-daily-card__win-time">{bestWindowLabel}</p>
              </div>
              <div className="cl-daily-card__win cl-daily-card__win--hold">
                <p className="cl-daily-card__win-label">{mt(HOME.card_caution, lang)}</p>
                <p className="cl-daily-card__win-time">{holdWindowLabel}</p>
              </div>
            </div>
            <p className="cl-daily-card__summary">{SAMPLE.summary}</p>
            <div className="cl-daily-card__signals">
              {/* Meaning before the named terms — the chips are proper nouns and
                  read as nothing at all without this line. */}
              <p className="cl-daily-card__signals-note">{mt(HOME.card_signals_note, lang)}</p>
              <div className="cl-daily-card__chips">
                {[SAMPLE.dasha, SAMPLE.transit, samplePanchangam].map((chip) => (
                  <span key={chip} className="cl-daily-card__chip">{chip}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Family Planning */}
      <section className="cl-balance" id="family">
        <div className="cl-container cl-balance__inner">
          <div className="cl-balance__copy">
            <p className="cl-eyebrow">{mt(HOME.family_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.family_h2, lang)}</h2>
            <p className="cl-section-body">{mt(HOME.family_body, lang)}</p>
            <ul className="cl-check-list">
              {FAMILY_ITEMS.map((item) => (
                <li key={item} className="cl-check-list__item">
                  <span className="cl-check-list__dot" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/features/family-planning" className="cl-btn cl-btn--ghost cl-balance-cta">{mt(HOME.family_link, lang)}</Link>
          </div>
          <div className="cl-score-panel">
            <p className="cl-score-panel__label">{mt(HOME.family_panel_label, lang)}</p>
            {FAMILY_MEMBERS.map((m, idx) => (
              <div key={`${m.name}-${idx}`} className="cl-score-row">
                <span className="cl-score-row__name">{m.name}</span>
                <div className="cl-score-bar-wrap">
                  <div className={`cl-score-bar cl-score-bar--${m.band}`} style={{ width: `${m.score}%` }} />
                </div>
                <span className={`cl-score-num cl-score-num--${m.band}`}>{m.score}</span>
              </div>
            ))}
            <p className="cl-score-panel__foot">{mt(HOME.family_panel_foot, lang)} {bestWindowLabel}</p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Tools */}
      <section className="cl-tools-preview">
        <div className="cl-container">
          <div className="cl-tools-preview__head">
            <p className="cl-eyebrow">{mt(HOME.tools_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.tools_h2, lang)}</h2>
          </div>
          <p className="cl-tools-preview__sub">{mt(HOME.tools_sub, lang)}</p>
          <div className="cl-tools-grid">
            {TOOLS.map((tool) => (
              <Link key={tool.name} href={tool.href} className="cl-tool-card">
                <span className="cl-tool-card__icon"><MarketingIcon name={tool.icon} size={24} /></span>
                <h3 className="cl-tool-card__name">{tool.name}</h3>
                <p className="cl-tool-card__desc">{tool.desc}</p>
                <span className="cl-tool-card__link">{tool.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 — How it works */}
      <section className="cl-how">
        <div className="cl-container">
          <div className="cl-how__head">
            <p className="cl-eyebrow">{mt(HOME.how_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.how_h2, lang)}</h2>
          </div>
          <div className="cl-how-steps">
            {HOW_STEPS.map((step) => (
              <div key={step.num} className="cl-how-step">
                <span className="cl-how-step__num">{step.num}</span>
                <h3 className="cl-how-step__title">{step.title}</h3>
                <p className="cl-how-step__body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — Method & Trust */}
      <section className="cl-method">
        <div className="cl-container cl-method__inner">
          <div className="cl-method__copy">
            <p className="cl-eyebrow">{mt(HOME.method_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.method_h2, lang)}</h2>
            <p className="cl-section-body">{mt(HOME.method_body, lang)}</p>
            <div className="cl-method-items">
              {METHOD_ITEMS.map((item) => (
                <div key={item.title} className="cl-method-item">
                  <h3 className="cl-method-item__title">{item.title}</h3>
                  <p className="cl-method-item__body">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="cl-method-panel">
            <p className="cl-method-panel__title">{mt(HOME.method_panel_title, lang)}</p>
            <p className="cl-method-panel__body">{mt(HOME.method_panel_body, lang)}</p>
            <Link href="/trust/methodology" className="cl-method-panel__link">{mt(HOME.method_link, lang)}</Link>
          </div>
        </div>
      </section>

      {/* SECTION 8 — CTA */}
      <section className="cl-pricing" id="get-started">
        <div className="cl-container cl-pricing__inner">
          <p className="cl-eyebrow">{mt(HOME.cta_eyebrow, lang)}</p>
          <h2 className="cl-section-h2 cl-pricing__title">{mt(HOME.cta_h2, lang)}</h2>
          <p className="cl-section-body cl-pricing__body">{mt(HOME.cta_body, lang)}</p>
          <Link href="/dashboard" className="cl-btn cl-btn--solid">{mt(HOME.cta_btn, lang)}</Link>
        </div>
      </section>

      {/* SECTION 9 — Stay connected (merged email capture + app download) */}
      <section className="cl-connect" id="connect">
        <div className="cl-container">
          <div className="cl-connect__head">
            <p className="cl-eyebrow">{mt(HOME.connect_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.connect_h2, lang)}</h2>
            <p className="cl-section-body">{mt(HOME.connect_body, lang)}</p>
          </div>
          <div className="cl-connect-grid">
            <div className="cl-connect-card cl-connect-card--email">
              <span className="cl-connect-card__icon"><MarketingIcon name="mail" size={22} /></span>
              <h3 className="cl-connect-card__title">{mt(HOME.connect_email_title, lang)}</h3>
              <p className="cl-connect-card__body">{mt(HOME.connect_email_body, lang)}</p>
              <NewsletterForm lang={lang} />
            </div>
            <div className="cl-connect-card cl-connect-card--app">
              <span className="cl-connect-card__icon"><MarketingIcon name="phone" size={22} /></span>
              <h3 className="cl-connect-card__title">{mt(HOME.connect_app_title, lang)}</h3>
              <p className="cl-connect-card__body">{mt(HOME.connect_app_body, lang)}</p>
              <div className="cl-connect-badges">
                <a
                  href="https://play.google.com/store/apps/details?id=ai.vinaadi.app"
                  className="cl-store-badge"
                  aria-label="Get Vinaadi on Google Play"
                  onClick={() => track("app_dl_clicked", { store: "play" })}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3.18 23.76C2.48 23.36 2 22.6 2 21.7V2.3C2 1.4 2.48.64 3.18.24L13.88 12 3.18 23.76z" fill="#EA4335"/>
                    <path d="M17.67 15.54L5.4 22.78l9.3-9.3 2.97 2.06z" fill="#FBBC05"/>
                    <path d="M21.14 10.53c.55.3.86.84.86 1.47s-.31 1.17-.86 1.47l-3.47 2.07-3.23-3.23 3.23-3.23 3.47 2.45z" fill="#4285F4"/>
                    <path d="M5.4 1.22L17.67 8.46l-2.97 2.07-9.3-9.31z" fill="#34A853"/>
                  </svg>
                  <div>
                    <p className="cl-store-badge__meta">
                      {lang === "en" ? "Get it on" : "பதிவிறக்கம்"}
                    </p>
                    <p className="cl-store-badge__name">Google Play</p>
                  </div>
                </a>
                {APP_STORE_URL && (
                  <a
                    href={APP_STORE_URL}
                    className="cl-store-badge"
                    aria-label="Download Vinaadi on the App Store"
                    onClick={() => track("app_dl_clicked", { store: "appstore" })}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#2E2118" aria-hidden="true">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div>
                      <p className="cl-store-badge__meta">
                        {lang === "en" ? "Download on the" : "பதிவிறக்கம்"}
                      </p>
                      <p className="cl-store-badge__name">App Store</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function NewsletterForm({ lang }: { lang: "en" | "ta" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const ta = lang === "ta";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      // Must go through apiFetchJson: it prefixes /api/backend (the only Next
      // route handler) and sets the CSRF + request-ID headers the mutating
      // backend path expects. A bare fetch("/api/v1/...") 404s at the Next layer.
      await apiFetchJson("/newsletter", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), source: "web_home" }),
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="cl-connect-form__confirm">
        {ta ? "பதிவு செய்தமைக்கு நன்றி!" : "You're subscribed — thank you!"}
      </p>
    );
  }

  return (
    <form className="cl-connect-form" onSubmit={handleSubmit}>
      <label
        htmlFor="newsletter-email"
        style={{ width: "100%", fontSize: "0.82rem", fontWeight: 600, color: "var(--cl-bg)" }}
      >
        {ta ? "மின்னஞ்சல் முகவரி" : "Email address"}
      </label>
      <input
        id="newsletter-email"
        type="email"
        className="cl-connect-form__input"
        placeholder={ta ? "மின்னஞ்சல் உள்ளிடுக" : "Your email address"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "loading"}
      />
      <button
        type="submit"
        className="cl-btn cl-btn--solid cl-connect-form__btn"
        disabled={status === "loading"}
      >
        {status === "loading"
          ? (ta ? "பதிவு…" : "Subscribing…")
          : (ta ? "பதிவு செய்" : "Subscribe")}
      </button>
      {status === "error" && (
        <p className="cl-connect-form__error">
          {ta ? "பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்." : "Something went wrong. Please try again."}
        </p>
      )}
    </form>
  );
}
