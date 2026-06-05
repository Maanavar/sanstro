"use client";

import Link from "next/link";
import { useLang } from "@/components/lang-toggle";
import { HOME, mt } from "@/lib/marketing-i18n";

function makeSample(lang: "en" | "ta") {
  const en = lang === "en";
  return {
    dayLabel:   en ? "Tuesday, 26 May"      : "செவ்வாய், 26 மே",
    score: 64,
    summary:    en
      ? "Moon Dasa · Moon Bhukti. Saturn refines home and inner stability. A measured day — good for steady work, cautious for new ventures."
      : "சந்திர தசை · சந்திர புக்தி. சனி வீடு மற்றும் உள் நிலைத்தன்மையை செம்மைப்படுத்துகிறது. சீரான நாள் — நிலையான வேலைக்கு நல்லது, புதிய முயற்சிகளுக்கு கவனம் தேவை.",
    bestWindow: { start: "11:53", end: "12:41" },
    holdWindow: { start: "15:28", end: "17:03" },
    lagna:      en ? "Kadagam"   : "கடகம்",
    nakshatra:  en ? "Kettai"    : "கேட்டை",
    rasi:       en ? "Viruchigam": "விருச்சிகம்",
    dasha:      en ? "Moon Dasa · Moon Bhukti"              : "சந்திர தசை · சந்திர புக்தி",
    transit:    en ? "Saturn in Kumbam · Jupiter in Mesham" : "சனி கும்பத்தில் · குரு மேஷத்தில்",
    panchangam: en ? "Ekadasi · Kettai · Vishkambha"        : "ஏகாதசி · கேட்டை · விஷ்கம்பம்",
  };
}

const ARC_HOURS = ["6a", "9a", "12p", "3p", "6p"];

export function HomeContent() {
  const [lang] = useLang();
  const SAMPLE = makeSample(lang);

  const HELPS = [
    { icon: "◎", title: mt(HOME.help1_title, lang), body: mt(HOME.help1_body, lang) },
    { icon: "⊕", title: mt(HOME.help2_title, lang), body: mt(HOME.help2_body, lang) },
    { icon: "☽", title: mt(HOME.help3_title, lang), body: mt(HOME.help3_body, lang) },
    { icon: "◈", title: mt(HOME.help4_title, lang), body: mt(HOME.help4_body, lang) },
    { icon: "✦", title: mt(HOME.help5_title, lang), body: mt(HOME.help5_body, lang) },
    { icon: "⊛", title: mt(HOME.help6_title, lang), body: mt(HOME.help6_body, lang) },
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

  const TOOLS = [
    { icon: "⊕", name: mt(HOME.tool1_name, lang), desc: mt(HOME.tool1_desc, lang), href: "/tools/marriage-porutham-calculator", cta: mt(HOME.tool1_cta, lang) },
    { icon: "◈", name: mt(HOME.tool2_name, lang), desc: mt(HOME.tool2_desc, lang), href: "/tools/jadhagam-generator",           cta: mt(HOME.tool2_cta, lang) },
    { icon: "☽", name: mt(HOME.tool3_name, lang), desc: mt(HOME.tool3_desc, lang), href: "/tools/daily-panchangam-planner",     cta: mt(HOME.tool3_cta, lang) },
    { icon: "◎", name: mt(HOME.tool4_name, lang), desc: mt(HOME.tool4_desc, lang), href: "/tools/birth-time-rectification",     cta: mt(HOME.tool4_cta, lang) },
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

  const HUB_CARDS = [
    { eyebrow: mt(HOME.hub1_eye, lang), title: mt(HOME.hub1_title, lang), body: mt(HOME.hub1_body, lang), href: "/features/daily-guidance" },
    { eyebrow: mt(HOME.hub2_eye, lang), title: mt(HOME.hub2_title, lang), body: mt(HOME.hub2_body, lang), href: "/features/family-planning" },
    { eyebrow: mt(HOME.hub3_eye, lang), title: mt(HOME.hub3_title, lang), body: mt(HOME.hub3_body, lang), href: "/features/chart-guidance" },
    { eyebrow: mt(HOME.hub4_eye, lang), title: mt(HOME.hub4_title, lang), body: mt(HOME.hub4_body, lang), href: "/features/timing-and-decisions" },
    { eyebrow: mt(HOME.hub5_eye, lang), title: mt(HOME.hub5_title, lang), body: mt(HOME.hub5_body, lang), href: "/tools/marriage-porutham-calculator" },
    { eyebrow: mt(HOME.hub6_eye, lang), title: mt(HOME.hub6_title, lang), body: mt(HOME.hub6_body, lang), href: "/trust/methodology" },
  ];

  const LEARN_PILLS = [
    { label: mt(HOME.learn1, lang), href: "/learn/what-is-porutham" },
    { label: mt(HOME.learn2, lang), href: "/learn/what-is-thirukanitham" },
    { label: mt(HOME.learn3, lang), href: "/learn/what-is-chandrashtama" },
    { label: mt(HOME.learn4, lang), href: "/learn/how-to-read-a-jadhagam" },
    { label: mt(HOME.learn5, lang), href: "/learn/why-birth-time-matters" },
  ];

  const COMMIT_ITEMS = [
    mt(HOME.commit1, lang),
    mt(HOME.commit2, lang),
    mt(HOME.commit3, lang),
    mt(HOME.commit4, lang),
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
            <h1 className="cl-hero__h1">{mt(HOME.hero_h1, lang)}</h1>
            <p className="cl-hero__body">{mt(HOME.hero_body, lang)}</p>
            <div className="cl-hero__actions">
              <Link href="/dashboard" className="cl-btn cl-btn--solid">{mt(HOME.hero_cta_start, lang)}</Link>
              <a href="#how-it-works" className="cl-btn cl-btn--ghost">{mt(HOME.hero_cta_how, lang)}</a>
            </div>
          </div>

          <div className="cl-hero__card-wrap" id="sample">
            <span className="cl-sticker">{mt(HOME.card_today, lang)}</span>
            <div className="cl-reading-card">
              <div className="cl-card-head">
                <div>
                  <p className="cl-card-date">{SAMPLE.dayLabel}</p>
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
                  <path d="M20,82 Q160,18 300,82" fill="none" stroke="#D4C8AE" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="20" y="79" width="280" height="5" rx="2.5" fill="#E4DBC8" />
                  <rect x="157" y="78" width="19" height="7" rx="3.5" fill="#5C7654" />
                  <rect x="241" y="78" width="37" height="7" rx="3.5" fill="#A8482F" />
                  {[20, 90, 160, 230, 300].map((x) => (
                    <line key={x} x1={x} y1="86" x2={x} y2="93" stroke="#A89D89" strokeWidth="1.5" strokeLinecap="round" />
                  ))}
                  <circle cx="164" cy="50" r="6" fill="#B85A2C" />
                </svg>
                <div className="cl-arc-labels">
                  {ARC_HOURS.map((h) => <span key={h} className="cl-arc-label">{h}</span>)}
                </div>
              </div>
              <div className="cl-window-row">
                <div className="cl-window cl-window--best">
                  <p className="cl-window__label">{mt(HOME.card_best, lang)}</p>
                  <p className="cl-window__time">{SAMPLE.bestWindow.start} – {SAMPLE.bestWindow.end}</p>
                </div>
                <div className="cl-window cl-window--hold">
                  <p className="cl-window__label">{mt(HOME.card_hold, lang)}</p>
                  <p className="cl-window__time">{SAMPLE.holdWindow.start} – {SAMPLE.holdWindow.end}</p>
                </div>
              </div>
              <div className="cl-card-foot">
                <span className="cl-card-foot__meta">{SAMPLE.lagna} · {SAMPLE.nakshatra} · {SAMPLE.rasi}</span>
                <span className="cl-card-foot__badge">{mt(HOME.card_d1_ready, lang)}</span>
              </div>
            </div>
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
                <span className="cl-helps-card__icon">{item.icon}</span>
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
                <p className="cl-daily-card__win-time">{SAMPLE.bestWindow.start} – {SAMPLE.bestWindow.end}</p>
              </div>
              <div className="cl-daily-card__win cl-daily-card__win--hold">
                <p className="cl-daily-card__win-label">{mt(HOME.card_caution, lang)}</p>
                <p className="cl-daily-card__win-time">{SAMPLE.holdWindow.start} – {SAMPLE.holdWindow.end}</p>
              </div>
            </div>
            <p className="cl-daily-card__summary">{SAMPLE.summary}</p>
            <div className="cl-daily-card__signals">
              {[SAMPLE.dasha, SAMPLE.transit, SAMPLE.panchangam].map((chip) => (
                <span key={chip} className="cl-daily-card__chip">{chip}</span>
              ))}
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
            <p className="cl-score-panel__foot">{mt(HOME.family_panel_foot, lang)} 11:53 – 12:41</p>
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
                <span className="cl-tool-card__icon">{tool.icon}</span>
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

      {/* SECTION 8 — Feature Hub */}
      <section className="cl-feature-hub">
        <div className="cl-container">
          <div className="cl-feature-hub__head">
            <p className="cl-eyebrow">{mt(HOME.hub_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.hub_h2, lang)}</h2>
          </div>
          <div className="cl-feature-hub-grid">
            {HUB_CARDS.map((card) => (
              <Link key={card.title} href={card.href} className="cl-fhub-card">
                <p className="cl-fhub-card__eyebrow">{card.eyebrow}</p>
                <h3 className="cl-fhub-card__title">{card.title}</h3>
                <p className="cl-fhub-card__body">{card.body}</p>
                <span className="cl-fhub-card__arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — Learn strip */}
      <section className="cl-learn-strip">
        <div className="cl-container">
          <div className="cl-learn-strip__head">
            <p className="cl-eyebrow">{mt(HOME.learn_eyebrow, lang)}</p>
            <h2 className="cl-section-h2">{mt(HOME.learn_h2, lang)}</h2>
          </div>
          <div className="cl-learn-links">
            {LEARN_PILLS.map((pill) => (
              <Link key={pill.href} href={pill.href} className="cl-learn-pill">{pill.label}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10 — Commitment */}
      <section className="cl-commit" id="commitment">
        <div className="cl-container cl-commit__inner">
          <p className="cl-eyebrow cl-commit-eyebrow">{mt(HOME.commit_eyebrow, lang)}</p>
          <h2 className="cl-section-h2 cl-commit-title">
            <em>{mt(HOME.commit_h2, lang)}</em>
          </h2>
          <div className="cl-commit-grid">
            {COMMIT_ITEMS.map((text) => (
              <div key={text} className="cl-commit-item">
                <span className="cl-commit-item__icon">✓</span>
                <p className="cl-commit-item__text">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 11 — CTA */}
      <section className="cl-pricing" id="pricing">
        <div className="cl-container cl-pricing__inner">
          <p className="cl-eyebrow">{mt(HOME.cta_eyebrow, lang)}</p>
          <h2 className="cl-section-h2 cl-pricing__title">{mt(HOME.cta_h2, lang)}</h2>
          <p className="cl-section-body cl-pricing__body">{mt(HOME.cta_body, lang)}</p>
          <Link href="/dashboard" className="cl-btn cl-btn--solid">{mt(HOME.cta_btn, lang)}</Link>
        </div>
      </section>
    </main>
  );
}
