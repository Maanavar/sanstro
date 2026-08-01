"use client";

import { useState } from "react";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { NumerologyChainVisual } from "@/components/marketing-visuals";
import { useLang } from "@/components/lang-toggle";
import { PersonalYearMeaningCard } from "@/components/PersonalYearMeaningCard";
import { TOOL_NUMEROLOGY, mt, type Lang } from "@/lib/marketing-i18n";
import { readErrorMessage } from "@/lib/api";
import { todayIso } from "@/lib/format";
import {
  analyzeNumerologyNumber,
  getNumerologyProfile,
  getPublicPersonalYear,
  type CompoundTone,
  type NumberReading,
  type NumerologyObjectKind,
  type NumerologyProfileResponse,
  type ObjectNumberResponse,
  type PersonalCycleResponse,
} from "@vinaadi/shared/api/numerology";

/**
 * The free, unauthenticated numerology calculators (Phase 2 + Phase 4 public
 * routes). Three of them, and what separates them from the signed-in surface is
 * exactly what they *cannot* see:
 *
 * - **Profile** — the four core numbers from a date of birth and optional names.
 * - **Object number** — mobile, vehicle or house.
 * - **Personal year** — year / month / day, from a date of birth alone.
 *
 * None of these needs a birth time or a birth place, which is the only reason
 * they can be public at all. It is also their ceiling: without a chart there is
 * no lagna, no lordship and no functional nature, so none of these can say
 * whether a number's graha is benefic *for this person*. The signed-in Fortune
 * Alignment can, and the page says so rather than implying the free tool is the
 * whole instrument.
 *
 * Every result below leads with what the number *is made of* before it shows
 * the arithmetic, because "Compound 25 · Reduction 25 → 7" is a derivation, not
 * an explanation. What none of it does is interpret a number: that corpus is
 * withheld pending Tamil native review, and authoring it here would route
 * around the gate the backend enforces.
 *
 * ## The 2026-07-29 revamp — body to footer; nav and hero deliberately untouched
 *
 * The page was correct and read as a form followed by three prose bands. Four
 * things changed, and each is a claim about the content rather than a coat of
 * paint:
 *
 * 1. **The form and its results are one object.** They were a card and then a
 *    stack of rows, so a reader could scroll the answer out of sight of the
 *    question that produced it. The inputs are now the head of a single ruled
 *    card and the numbers are its cells — what was typed and what came back
 *    stay in one frame.
 * 2. **The working is the point, so it is shown as working.** Each scored
 *    character renders as a tile carrying its own Chaldean value, straight from
 *    `letterValues` — never recomputed here. That table is *data*, not an
 *    `A=1..Z=26 mod 9` formula (no letter carries 9), so a client-side copy
 *    would be a second table to get wrong.
 * 3. **The ceiling became checkable.** A paragraph saying a free tool cannot
 *    judge a graha is an assertion. A two-column ledger naming the exact three
 *    lines that need a birth time is something the reader can audit *before*
 *    being asked to sign up, which is the only honest place to put that CTA.
 * 4. **Square corners, hairline rules, mono labels.** The rounded-card
 *    treatment read as a generic SaaS form. An almanac reads as a reference
 *    document, which is what this is.
 *
 * `numerology_engine` flipped ON 2026-07-28. `NotLaunched` below is kept as a
 * defensive render for the 404 case (flag off in another environment, or
 * flipped back), not as the expected path anymore.
 */

type Tool = "profile" | "object" | "year";

const D = TOOL_NUMEROLOGY;

/** `ta` is what the sub-components carry; the copy table is keyed by `Lang`. */
function langOf(ta: boolean): Lang {
  return ta ? "ta" : "en";
}

function useUnavailable() {
  const [unavailable, setUnavailable] = useState(false);
  return { unavailable, setUnavailable };
}

function isNotLaunched(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return message.startsWith("404:");
}

export function NumerologyCalculatorContent() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const d = D;
  const [tool, setTool] = useState<Tool>("profile");

  const FAQ = [
    { q: mt(d.faq1_q, lang), a: mt(d.faq1_a, lang) },
    { q: mt(d.faq2_q, lang), a: mt(d.faq2_a, lang) },
    { q: mt(d.faq3_q, lang), a: mt(d.faq3_a, lang) },
    { q: mt(d.faq4_q, lang), a: mt(d.faq4_a, lang) },
    { q: mt(d.faq5_q, lang), a: mt(d.faq5_a, lang) },
    { q: mt(d.faq6_q, lang), a: mt(d.faq6_a, lang) },
  ];

  const NUMBERS = [
    { t: mt(d.n1_title, lang), b: mt(d.n1_body, lang) },
    { t: mt(d.n2_title, lang), b: mt(d.n2_body, lang) },
    { t: mt(d.n3_title, lang), b: mt(d.n3_body, lang) },
    { t: mt(d.n4_title, lang), b: mt(d.n4_body, lang) },
  ];

  /* The ledger behind BAND 2. Three rows this page answers and three it cannot
     — and the three it cannot are exactly the three the signup CTA is for. */
  const LIMITS: Array<{ row: string; val: string; free: boolean }> = [
    { row: mt(d.limit_r1, lang), val: mt(d.limit_yes, lang), free: true },
    { row: mt(d.limit_r2, lang), val: mt(d.limit_yes, lang), free: true },
    { row: mt(d.limit_r3, lang), val: mt(d.limit_yes, lang), free: true },
    { row: mt(d.limit_r4, lang), val: mt(d.limit_needs_time, lang), free: false },
    { row: mt(d.limit_r5, lang), val: mt(d.limit_needs_chart, lang), free: false },
    { row: mt(d.limit_r6, lang), val: mt(d.limit_needs_chart, lang), free: false },
  ];

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO — unchanged. */}
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{mt(d.eyebrow, lang)}</p>
              <h1 className="cl-pub-h1" style={{ maxWidth: "24ch" }}>
                {mt(d.h1, lang)}
              </h1>
              <p className="cl-pub-lead">{mt(d.lead, lang)}</p>
            </div>
            <div className="cl-hero-figure">
              <p className="cl-hero-figure__label">{mt(d.figure_label, lang)}</p>
              <NumerologyChainVisual lang={lang} />
              <p className="cl-hero-figure__title">{mt(d.figure_title, lang)}</p>
              <p className="cl-hero-figure__note">{mt(d.figure_note, lang)}</p>
            </div>
          </div>
        </section>

        {/* ── The calculators ─────────────────────────────────────────────── */}
        <section className="cl-num-band">
          <div className="cl-container">
            <div className="cl-num-tabs">
              {(
                [
                  ["profile", ta ? "உங்கள் எண்கள்" : "Your numbers"],
                  ["object", ta ? "மொபைல் / வாகனம் / வீடு" : "Mobile / vehicle / house"],
                  ["year", ta ? "தனிப்பட்ட ஆண்டு" : "Personal year"],
                ] as Array<[Tool, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTool(id)}
                  aria-pressed={tool === id}
                  className="cl-num-tab"
                  data-active={tool === id ? "true" : undefined}
                >
                  {label}
                </button>
              ))}
            </div>

            {tool === "profile" ? <ProfileTool ta={ta} /> : null}
            {tool === "object" ? <ObjectTool ta={ta} /> : null}
            {tool === "year" ? <PersonalYearTool ta={ta} /> : null}
          </div>
        </section>

        {/* ── BAND 1 — the four numbers, and why they differ ──────────────── */}
        <section className="cl-num-section">
          <div className="cl-container">
            <div className="cl-num-head">
              <div>
                <p className="cl-num-eyebrow">{ta ? "கண்ணோட்டம்" : "Overview"}</p>
                <h2 className="cl-num-h2">{mt(d.numbers_h2, lang)}</h2>
              </div>
              <p className="cl-num-head__aside">{mt(d.numbers_aside, lang)}</p>
            </div>
            <div className="cl-num-quad">
              {NUMBERS.map((n, i) => (
                <div key={n.t} className="cl-num-quad__cell">
                  <span className="cl-num-quad__index">{String(i + 1).padStart(2, "0")}</span>
                  <p className="cl-num-quad__title">{n.t}</p>
                  <p className="cl-num-quad__body">{n.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BAND 2 — the honest ceiling, stated up front rather than after
             signup, and itemised so it can be checked rather than believed. ── */}
        <section className="cl-num-section cl-num-section--alt">
          <div className="cl-container cl-num-limit">
            <div>
              <p className="cl-num-eyebrow">{ta ? "எல்லை" : "The limit"}</p>
              <h2 className="cl-num-h2" style={{ maxWidth: "22ch" }}>
                {mt(d.ceiling_h2, lang)}
              </h2>
              <p className="cl-num-limit__body">{mt(d.ceiling_body, lang)}</p>
              <blockquote className="cl-num-quote">{mt(d.ceiling_callout, lang)}</blockquote>
            </div>
            <div className="cl-num-ledger">
              <div className="cl-num-ledger__head">
                <span>{mt(d.limit_col_here, lang)}</span>
                <span>{mt(d.limit_col_chart, lang)}</span>
              </div>
              {LIMITS.map((l) => (
                <div
                  key={l.row}
                  className="cl-num-ledger__row"
                  data-free={l.free ? "true" : "false"}
                >
                  <span className="cl-num-ledger__label">{l.row}</span>
                  <span className="cl-num-ledger__value">{l.val}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BAND 3 — FAQ. Same answers the metadata has always fed crawlers.
             Native <details> rather than React state: keyboard, screen reader
             and find-in-page work without any of it being re-implemented, and
             the answers stay in the DOM, so the page.tsx FAQPage JSON-LD still
             mirrors visible text rather than standing in for it. The first is
             open so the affordance is demonstrated, not just advertised. ── */}
        <section className="cl-num-section">
          <div className="cl-container">
            <p className="cl-num-eyebrow">{ta ? "குறிப்பு" : "Reference"}</p>
            <h2 className="cl-num-h2" style={{ marginBottom: "34px" }}>
              {mt(d.faq_h2, lang)}
            </h2>
            <div className="cl-num-faq">
              {FAQ.map((item, i) => (
                <details key={item.q} className="cl-num-faq__item" open={i === 0}>
                  <summary className="cl-num-faq__q">{item.q}</summary>
                  <p className="cl-num-faq__a">{item.a}</p>
                </details>
              ))}
            </div>
            <div className="cl-num-related">
              <p className="cl-num-related__title">{mt(d.related_h2, lang)}</p>
              <div className="cl-num-related__links">
                <Link href="/tools/jadhagam-generator" className="cl-num-chip">
                  {ta ? "ஜாதகம் உருவாக்கு →" : "Jadhagam Generator →"}
                </Link>
                <Link href="/tools/marriage-porutham-calculator" className="cl-num-chip">
                  {ta ? "பொருத்தம் பார் →" : "Porutham Calculator →"}
                </Link>
                <Link href="/natchathirams" className="cl-num-chip">
                  {ta ? "நட்சத்திரங்கள் →" : "Natchathirams →"}
                </Link>
                <Link href="/trust/methodology" className="cl-num-chip">
                  {ta ? "எங்கள் கணக்கீட்டு முறை →" : "Our Methodology →"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <section className="cl-num-cta">
          <div className="cl-container cl-num-cta__inner">
            <div>
              <h2 className="cl-num-cta__title">{mt(d.cta_h2, lang)}</h2>
              <p className="cl-num-cta__body">{mt(d.cta_body, lang)}</p>
            </div>
            <div className="cl-num-cta__action">
              <Link href="/signup" className="cl-num-cta__btn">
                {ta ? "இலவசமாகத் தொடங்குங்கள் →" : "Get started free →"}
              </Link>
              <span className="cl-num-cta__note">{mt(d.cta_note, lang)}</span>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

/* ── Shared presentation ─────────────────────────────────────────────────── */

/*
 * `--cl-muted`, not `--text-secondary`.
 *
 * The public shell is `.clarity-shell`, which defines the `--cl-*` palette and
 * nothing else. globals.css aliases `--color-muted: var(--text-secondary)`, but
 * `--text-secondary` is defined nowhere in the tree — so on a public page that
 * declaration is invalid at computed-value time and `color` silently falls back
 * to `inherit`. Every "secondary" line on this page used to render at full
 * heading ink, which is what flattened it. `.cd-shell` gets away with the same
 * aliases only because it re-declares them with real hex.
 */
function NotLaunched({ ta }: { ta: boolean }) {
  return (
    <p className="cl-num-note">
      {ta
        ? "இந்தக் கருவி இன்னும் திறக்கப்படவில்லை. விரைவில் இங்கேயே கிடைக்கும்."
        : "This calculator isn't switched on yet. It will appear here once it goes live."}
    </p>
  );
}

function ErrorLine({ message }: { message: string }) {
  return <p className="cl-num-error">{message}</p>;
}

/** The ruled line under the card: whose tradition this arithmetic belongs to. */
function TraditionStrip({ text, ta }: { text?: string | null; ta: boolean }) {
  return <p className="cl-num-tradition">{text || mt(D.tradition_strip, langOf(ta))}</p>;
}

/**
 * The ceiling, restated where it is actually felt — beside a result that looks
 * like a verdict but is not one.
 *
 * Lifted out of `ProfileTool`, where it was the only place it rendered. All
 * three tools produce something that reads as a rating: the profile's tone
 * chips, and the object and personal-year tools' too, since `ReadingBlock` is
 * shared. *"Is this mobile number good for me?"* is exactly the chart question,
 * so a visitor who asks it here and gets only a Chaldean total has been shown a
 * calculation and left holding the question.
 *
 * Signed-in, this is the section that now explains itself in five steps. That
 * is what the link is promising, so it is what the copy says.
 */
function ChartBridge({ ta }: { ta: boolean }) {
  const lang = langOf(ta);
  return (
    <div className="cl-num-bridge">
      <div>
        <p className="cl-num-bridge__title">{mt(D.bridge_title, lang)}</p>
        <p className="cl-num-bridge__body">{mt(D.bridge_body, lang)}</p>
      </div>
      <Link href="/signup" className="cl-num-bridge__link">
        {mt(D.bridge_link, lang)}
      </Link>
    </div>
  );
}

/**
 * Cheiro's register for a compound, said in our own words.
 *
 * `compoundTone` crosses the wire as a token so each client renders it in
 * reviewed vocabulary. These strings describe *the classical source* — "Cheiro
 * reads this as cautionary" is a fact about a 1935 book — and never the reader,
 * which is the line the withheld corpus sits on the other side of.
 *
 * Keyed by `CompoundTone` rather than `string` so the compiler proves the map
 * is exhaustive. With a `string` key a fourth tone added server-side type-checks
 * fine and then reads `.en` off `undefined` at runtime — on a public page, in
 * the one component whose whole job is to keep an alarming classical title from
 * appearing without its register.
 */
const TONE_LABEL: Record<CompoundTone, { en: string; ta: string }> = {
  favourable: { en: "Favourable", ta: "சாதகம்" },
  mixed: { en: "Mixed", ta: "கலப்பு" },
  cautionary: { en: "Cautionary", ta: "எச்சரிக்கை" },
};

/**
 * One number and its derivation, as a cell in the results grid.
 *
 * `source` says what the number was built from and leads, because the only
 * thing separating a psychic number from a destiny number is the input. The
 * arithmetic follows behind a disclosure — a first-time reader meeting
 * "Compound 25 · Reduction 25 → 7" has been shown the working and told nothing.
 *
 * The letter tiles render `reading.letterValues` verbatim. They are what makes
 * `total` checkable rather than asserted, and they are never recomputed
 * client-side: the Chaldean table is data, not a formula.
 *
 * Doctrine D6 is enforced here exactly as on the signed-in surface, including
 * the case where `compound` is null: a total past 52 with nothing landing in
 * 10–52 on the way down (60 → 6) reports `compound: null,
 * compoundBeyondSeries: 60`, and saying nothing there would read as "this name
 * has no compound" when in fact 60 *is* the compound and simply is not encoded.
 *
 * ## The compound is a peer of the root here
 *
 * It used to print as `Compound · 31` inside the closed *How this was worked
 * out* disclosure, in a list with "Adds up to · 31" and "Reduced to a single
 * digit · 31 → 4". That is the presentation of a discarded intermediate — while
 * the engine's own docstring opens by saying the compound **outranks** the root
 * and that stopping at a single digit is the tell of a bad implementation. The
 * page was doing visually what the engine refuses to do numerically, and a
 * visitor's fair summary of the result ("this is just adding digits up") was
 * accurate.
 *
 * `compoundTitle` / `compoundTone` arrive on the wire ungated, because they
 * cite Cheiro rather than assert anything about the reader; `compoundReadingEn`
 * / `Ta` — our sentences about what the number means for a person — stay null
 * until the Tamil corpus clears review, and are rendered here only if present
 * so that review flips them on without another frontend change.
 */
function ReadingBlock({
  reading,
  label,
  ta,
  source,
  scoredFrom,
}: {
  reading: NumberReading;
  label: string;
  ta: boolean;
  source?: string;
  scoredFrom?: string | null;
}) {
  const beyond = reading.compoundBeyondSeries;
  const chain = reading.reductionChain.length ? reading.reductionChain : [reading.root];
  const ourReading = ta ? reading.compoundReadingTa : reading.compoundReadingEn;
  return (
    <div className="cl-num-reading">
      <div className="cl-num-reading__head">
        <span className="cl-num-reading__label">{label}</span>
        {source ? <span className="cl-num-reading__source">{source}</span> : null}
      </div>

      {reading.compound !== null && beyond === null ? (
        <div className="cl-num-compound">
          <div className="cl-num-compound__head">
            <span className="cl-num-compound__digit">{reading.compound}</span>
            {reading.compoundTitle ? (
              <span className="cl-num-compound__title">{reading.compoundTitle}</span>
            ) : null}
            {/* Never the title alone — several of Cheiro's are alarming standing
                by themselves, and printing one without its register hands the
                reader his fatalism and withholds our reframing of it. */}
            {reading.compoundTone ? (
              <span className="cl-num-compound__tone" data-tone={reading.compoundTone}>
                {ta
                  ? TONE_LABEL[reading.compoundTone].ta
                  : TONE_LABEL[reading.compoundTone].en}
              </span>
            ) : null}
          </div>
          <div className="cl-num-compound__meta">
            {ta ? "கூட்டு எண் · சீரோவின் வரிசை" : "Compound number · Cheiro's series"}
            {reading.compoundEchoes !== null && reading.compoundEchoes !== undefined
              ? ta
                ? ` · ${reading.compoundEchoes}-ஐ மீண்டும் சொல்கிறது`
                : ` · repeats ${reading.compoundEchoes}`
              : null}
          </div>
          {/* Whose judgement the chip is. A tone with nothing attributing it
              reads as a verdict on the visitor, and this page structurally
              cannot deliver one — no birth time means no lagna, no lordship,
              and so no way to know whether this number's graha is benefic for
              this person. Naming the limit is the honest version, and it is
              what the bridge below is offered against. */}
          {reading.compoundTone ? (
            <p className="cl-num-compound__whose">{mt(D.tone_whose, langOf(ta))}</p>
          ) : null}
          {ourReading ? <p className="cl-num-compound__reading">{ourReading}</p> : null}
        </div>
      ) : null}

      <div className="cl-num-reading__figure">
        <span className="cl-num-reading__digit">{reading.root}</span>
        <span className="cl-num-reading__side">
          <span className="cl-num-reading__rootnote">{ta ? "மூல எண்" : "Root"}</span>
          <span className="cl-num-reading__graha">{ta ? reading.grahaTa : reading.grahaEn}</span>
          {/* Doctrine D3 — the spelling that produced a name reading stays visible. */}
          {scoredFrom ? (
            <span className="cl-num-reading__scored">
              {ta ? "கணக்கிடப்பட்டது" : "Scored from"} <strong>{scoredFrom}</strong>
            </span>
          ) : null}
        </span>
      </div>

      {/* The other reason a compound can be absent, and the one visitors ask
          about most: not "withheld" or "borrowed", just never generated in
          the first place. Cheiro's compound series only covers two-digit
          totals (10-52); a total that lands on a single digit on the first
          pass has no two-digit step to name, so there is no title or tone to
          show — this is the normal case for roughly 1 in 3 totals, not a
          missing reading. */}
      {reading.compound === null && beyond === null ? (
        <p className="cl-num-reading__nocompound">
          {ta
            ? `இது ${reading.total} ஆகக் கூடி நேரடியாக ஒற்றை இலக்கமாக (${reading.root}) உள்ளது. கல்தேய கூட்டு எண்கள் இரட்டை இலக்கத் தொகைகளுக்கு (10–52) மட்டுமே பெயர் பெற்றவை, எனவே இங்கே ஒரு கூட்டு எண் இல்லை — இது குறையல்ல.`
            : `This adds up to ${reading.total}, already a single digit (${reading.root}). Chaldean compound numbers are only named for two-digit totals (10-52), so there is no compound to show here — that is expected, not a missing reading.`}
        </p>
      ) : null}

      {/* Doctrine D6 — a caveat, so it is never folded away. */}
      {beyond !== null ? (
        <p className="cl-num-reading__caveat">
          {reading.compound !== null
            ? ta
              ? `இதன் எழுத்துக்கள் ${beyond} ஆகக் கூடுகின்றன. கல்தேய முறையில் இரட்டை இலக்கத் தொகைகளுக்கான பொருள் 52 வரை மட்டுமே எழுதப்பட்டுள்ளது; எனவே ${reading.compound} என்பது வேறோர் எண்ணிடமிருந்து எடுத்த மாற்று.`
              : `The letters add up to ${beyond}. Chaldean practice only writes down meanings for two-digit totals up to 52, so the ${reading.compound} is a stand-in borrowed from a different number.`
            : ta
              ? `இதன் எழுத்துக்கள் ${beyond} ஆகக் கூடுகின்றன. கல்தேய முறையில் இரட்டை இலக்கத் தொகைகளுக்கான பொருள் 52 வரை மட்டுமே எழுதப்பட்டுள்ளது; எனவே ${beyond}-க்கு அத்தகைய பொருள் எதுவும் இல்லை.`
              : `The letters add up to ${beyond}. Chaldean practice only writes down meanings for two-digit totals up to 52, so there is none for ${beyond}.`}
        </p>
      ) : null}

      <details className="cl-num-details">
        <summary>{mt(D.workings, langOf(ta))}</summary>
        <div className="cl-num-details__body">
          {reading.letterValues.length > 0 ? (
            <div className="cl-num-letters">
              {reading.letterValues.map((lv, index) => (
                <span key={`${lv.char}-${index}`} className="cl-num-letter">
                  <span className="cl-num-letter__char">{lv.char}</span>
                  <span className="cl-num-letter__value">{lv.value}</span>
                </span>
              ))}
            </div>
          ) : null}
          {/* No `compound` row: it is rendered above at the root's weight, and
              repeating it here as a step would put it back among the discards. */}
          <dl className="cl-num-steps">
            <dt>{ta ? "கூட்டுத்தொகை" : "adds up to"}</dt>
            <dd>{reading.total}</dd>
            <dt>{ta ? "சுருக்கியது" : "reduced"}</dt>
            <dd>
              {chain.length > 1
                ? chain.join(" → ")
                : ta
                  ? "ஏற்கெனவே ஒற்றை இலக்கம்"
                  : "already a single digit"}
            </dd>
            {reading.ignoredCharacters.length > 0 ? (
              <>
                <dt>{ta ? "சேர்க்கப்படாதவை" : "not scored"}</dt>
                <dd>{reading.ignoredCharacters.map((ch) => (ch === " " ? "␣" : ch)).join(" ")}</dd>
              </>
            ) : null}
            {/* Shown wherever a compound title is — the citation travels with it. */}
            {reading.compoundSource ? (
              <>
                <dt>{ta ? "ஆதாரம்" : "source"}</dt>
                <dd>{reading.compoundSource}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </details>
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────────────────── */

function ProfileTool({ ta }: { ta: boolean }) {
  const [birthDate, setBirthDate] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [calledName, setCalledName] = useState("");
  const [result, setResult] = useState<NumerologyProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { unavailable, setUnavailable } = useUnavailable();

  const run = () => {
    if (!birthDate) return;
    setLoading(true);
    setError("");
    setUnavailable(false);
    getNumerologyProfile({
      birthDate,
      documentName: documentName.trim() || undefined,
      calledName: calledName.trim() || undefined,
    })
      .then(setResult)
      .catch((err: unknown) => {
        if (isNotLaunched(err)) {
          setUnavailable(true);
          return;
        }
        setError(readErrorMessage(err));
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <div className="cl-num-card">
        <div className="cl-num-card__form">
          <p className="cl-num-card__intro">
            {ta
              ? "ஆன்ம எண்ணும் விதி எண்ணும் பிறந்த தேதியிலிருந்து வருகின்றன. பெயர் எண்கள் ஆங்கில எழுத்துக்கூட்டலிலிருந்து — இரு பெயர்களும் விருப்பம்."
              : "The psychic and destiny numbers come from the date of birth. The name numbers come from the Latin spelling — both name fields are optional."}
          </p>

          <div className="cl-num-form" data-cols="3">
            <label className="cl-num-field">
              <span className="cl-num-field__label">{ta ? "பிறந்த தேதி" : "Date of birth"}</span>
              <input
                type="date"
                className="cl-num-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>
            <label className="cl-num-field">
              <span className="cl-num-field__label">{ta ? "ஆவணப் பெயர்" : "Name on documents"}</span>
              <input
                className="cl-num-input"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder={ta ? "ஆதார்/பாஸ்போர்ட்டில் உள்ளபடி" : "As printed on your Aadhaar"}
                autoComplete="off"
              />
            </label>
            <label className="cl-num-field">
              <span className="cl-num-field__label">{ta ? "அழைக்கும் பெயர்" : "Name you go by"}</span>
              <input
                className="cl-num-input"
                value={calledName}
                onChange={(e) => setCalledName(e.target.value)}
                placeholder={ta ? "விருப்பம்" : "Optional"}
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="cl-num-submit"
              onClick={run}
              disabled={loading || !birthDate}
            >
              {loading
                ? ta
                  ? "கணக்கிடுகிறது…"
                  : "Calculating…"
                : ta
                  ? "எண்களைக் காட்டு"
                  : "Show my numbers"}
            </button>
          </div>

          {unavailable ? <NotLaunched ta={ta} /> : null}
          {error ? <ErrorLine message={error} /> : null}
        </div>

        {result ? (
          <>
            <div className="cl-num-results">
              <ReadingBlock
                reading={result.psychic}
                label={ta ? "ஆன்ம எண்" : "Psychic number"}
                source={
                  ta ? "பிறந்த மாதத்தின் தேதியிலிருந்து" : "from the day of the month you were born"
                }
                ta={ta}
              />
              <ReadingBlock
                reading={result.destiny}
                label={ta ? "விதி எண்" : "Destiny number"}
                source={ta ? "முழுப் பிறந்த தேதியிலிருந்து" : "from your full date of birth"}
                ta={ta}
              />
              {result.name ? (
                <ReadingBlock
                  reading={result.name}
                  label={ta ? "பெயர் எண்" : "Name number"}
                  source={
                    ta
                      ? "ஆவணங்களில் உள்ள எழுத்துக்கூட்டலிலிருந்து"
                      : "from the spelling on your documents"
                  }
                  ta={ta}
                  scoredFrom={result.scoredName}
                />
              ) : null}
              {result.namesake ? (
                <ReadingBlock
                  reading={result.namesake}
                  label={ta ? "அழைக்கும் பெயர் எண்" : "Called-name number"}
                  source={
                    ta ? "மக்கள் உங்களை அழைக்கும் பெயரிலிருந்து" : "from the name people actually call you"
                  }
                  ta={ta}
                  scoredFrom={result.scoredNamesake}
                />
              ) : null}
            </div>

            <ChartBridge ta={ta} />
          </>
        ) : null}
      </div>
      <TraditionStrip text={result ? (ta ? result.traditionTa : result.traditionEn) : null} ta={ta} />
    </>
  );
}

/* ── Object number ───────────────────────────────────────────────────────── */

const OBJECT_KINDS: Array<{ id: NumerologyObjectKind; en: string; ta: string }> = [
  { id: "mobile", en: "Mobile number", ta: "மொபைல் எண்" },
  { id: "vehicle", en: "Vehicle number", ta: "வாகன எண்" },
  { id: "house", en: "House number", ta: "வீட்டு எண்" },
];

function ObjectTool({ ta }: { ta: boolean }) {
  const [kind, setKind] = useState<NumerologyObjectKind>("mobile");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ObjectNumberResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { unavailable, setUnavailable } = useUnavailable();

  const run = () => {
    if (!value.trim()) return;
    setLoading(true);
    setError("");
    setUnavailable(false);
    analyzeNumerologyNumber({ value: value.trim(), kind })
      .then(setResult)
      .catch((err: unknown) => {
        if (isNotLaunched(err)) {
          setUnavailable(true);
          return;
        }
        setError(readErrorMessage(err));
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <div className="cl-num-card">
        <div className="cl-num-card__form">
          <p className="cl-num-card__intro">
            {ta
              ? "ஒரு மொபைல், வாகனம் அல்லது வீட்டு எண்ணின் கல்தேய மதிப்பு. மொபைல் எண்ணுக்குக் கடைசி நான்கு இலக்கங்களும் தனியாகக் காட்டப்படும்."
              : "The Chaldean value of a mobile, vehicle or house number. For a mobile, the last four digits are read separately as well."}
          </p>

          <div className="cl-num-kinds">
            {OBJECT_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                aria-pressed={kind === k.id}
                className="cl-num-tab cl-num-tab--sm"
                data-active={kind === k.id ? "true" : undefined}
              >
                {ta ? k.ta : k.en}
              </button>
            ))}
          </div>

          <div className="cl-num-form" data-cols="1">
            <label className="cl-num-field">
              <span className="cl-num-field__label">
                {ta ? "கணக்கிட வேண்டிய எண்" : "Number to score"}
              </span>
              <input
                className="cl-num-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  kind === "mobile" ? "98xxx xxxxx" : kind === "vehicle" ? "TN 01 AB 1234" : "12/4"
                }
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="cl-num-submit"
              onClick={run}
              disabled={loading || !value.trim()}
            >
              {loading
                ? ta
                  ? "கணக்கிடுகிறது…"
                  : "Calculating…"
                : ta
                  ? "இந்த எண்ணைக் கணக்கிடு"
                  : "Score this number"}
            </button>
          </div>

          {unavailable ? <NotLaunched ta={ta} /> : null}
          {error ? <ErrorLine message={error} /> : null}
        </div>

        {result ? (
          <>
            <div className="cl-num-results">
              {/* `scored` is what survived normalisation — a mobile strips spaces
                  and separators, so the string read is not always the one typed. */}
              <ReadingBlock
                reading={result.reading}
                label={ta ? "மொத்த எண்" : "Whole number"}
                source={ta ? "எண்ணின் ஒவ்வொரு இலக்கத்திலிருந்தும்" : "from every digit in the number"}
                ta={ta}
                scoredFrom={result.scored}
              />
              {result.secondary ? (
                <ReadingBlock
                  reading={result.secondary}
                  label={result.secondaryLabel ?? (ta ? "இரண்டாம் எண்" : "Secondary")}
                  source={ta ? "மொபைல் எண்ணின் கடைசி இலக்கங்கள்" : "the tail digits of the mobile number"}
                  ta={ta}
                />
              ) : null}
            </div>
            <ChartBridge ta={ta} />
          </>
        ) : null}
      </div>
      <TraditionStrip text={result ? (ta ? result.traditionTa : result.traditionEn) : null} ta={ta} />
    </>
  );
}

/* ── Personal year ───────────────────────────────────────────────────────── */

/* The calendar month/day the server actually keyed month/day to — read off
 * `onDate` (the server's own echo) rather than the local input state, so the
 * arithmetic shown can never describe a different date than the numbers
 * beside it while a new date is in flight. */
function monthOf(isoDate: string): number {
  return Number(isoDate.slice(5, 7));
}
function dayOf(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

function PersonalYearTool({ ta }: { ta: boolean }) {
  const [birthDate, setBirthDate] = useState("");
  const [onDate, setOnDate] = useState(todayIso());
  const [result, setResult] = useState<PersonalCycleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { unavailable, setUnavailable } = useUnavailable();

  const run = () => {
    if (!birthDate) return;
    setLoading(true);
    setError("");
    setUnavailable(false);
    getPublicPersonalYear({ birthDate, onDate: onDate || undefined })
      .then(setResult)
      .catch((err: unknown) => {
        if (isNotLaunched(err)) {
          setUnavailable(true);
          return;
        }
        setError(readErrorMessage(err));
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <div className="cl-num-card">
        <div className="cl-num-card__form">
          <p className="cl-num-card__intro">
            {ta
              ? "தனிப்பட்ட ஆண்டு, மாதம், நாள் எண்கள். ஆண்டு எப்போது மாறுகிறது என்பது ஒரு கோட்பாட்டு முடிவு — அதனால் அது பொருந்தும் காலவரம்பும் சேர்த்துக் காட்டப்படுகிறது."
              : "Personal year, month and day. When the year turns is a doctrinal choice, so the window it applies to is shown with it."}
          </p>

          <div className="cl-num-form" data-cols="2">
            <label className="cl-num-field">
              <span className="cl-num-field__label">{ta ? "பிறந்த தேதி" : "Date of birth"}</span>
              <input
                type="date"
                className="cl-num-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </label>
            <label className="cl-num-field">
              <span className="cl-num-field__label">{ta ? "எந்த தேதிக்கு" : "On date"}</span>
              <input
                type="date"
                className="cl-num-input"
                value={onDate}
                onChange={(e) => setOnDate(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="cl-num-submit"
              onClick={run}
              disabled={loading || !birthDate}
            >
              {loading
                ? ta
                  ? "கணக்கிடுகிறது…"
                  : "Calculating…"
                : ta
                  ? "சுழற்சியைக் காட்டு"
                  : "Show my cycle"}
            </button>
          </div>

          {unavailable ? <NotLaunched ta={ta} /> : null}
          {error ? <ErrorLine message={error} /> : null}
        </div>

        {result ? (
          <>
            <p className="cl-num-window">
              {ta ? "இந்த ஆண்டு நடப்பது" : "This year runs"} · {result.year.cycleStart} →{" "}
              {result.year.cycleEnd}
            </p>
            <div className="cl-num-results">
              <ReadingBlock
                reading={result.year.reading}
                label={ta ? "தனிப்பட்ட ஆண்டு" : "Personal year"}
                source={
                  ta
                    ? `பிறந்த நாள் + மாதம் + ஆண்டு (${result.year.governingYear}) இலக்கங்களின் கூட்டுத்தொகை = ${result.year.reading.total}`
                    : `digit sum of birth day + birth month + governing year (${result.year.governingYear}) = ${result.year.reading.total}`
                }
                ta={ta}
              />
              {result.year.meaning && (
                <PersonalYearMeaningCard
                  meaning={result.year.meaning}
                  label={ta ? "இந்த ஆண்டின் கருப்பொருள்" : "What this year is about"}
                  ta={ta}
                />
              )}
              <ReadingBlock
                reading={result.month.reading}
                label={ta ? "தனிப்பட்ட மாதம்" : "Personal month"}
                source={
                  ta
                    ? `ஆண்டு எண் ${result.year.reading.root} + நாட்காட்டி மாதம் ${monthOf(result.onDate)} = ${result.month.reading.total}`
                    : `year number ${result.year.reading.root} + calendar month ${monthOf(result.onDate)} = ${result.month.reading.total}`
                }
                ta={ta}
              />
              {result.month.meaning && (
                <PersonalYearMeaningCard
                  meaning={result.month.meaning}
                  ta={ta}
                />
              )}
              <ReadingBlock
                reading={result.day.reading}
                label={ta ? "தனிப்பட்ட நாள்" : "Personal day"}
                source={
                  ta
                    ? `தனிப்பட்ட மாத எண் ${result.month.reading.root} (இது நாட்காட்டி மாதம் அல்ல) + தேதி ${dayOf(result.onDate)} = ${result.day.reading.total}`
                    : `personal month number ${result.month.reading.root} (not the calendar month) + day of month ${dayOf(result.onDate)} = ${result.day.reading.total}`
                }
                ta={ta}
              />
              {result.day.meaning && (
                <PersonalYearMeaningCard
                  meaning={result.day.meaning}
                  ta={ta}
                />
              )}
            </div>
            <ChartBridge ta={ta} />
          </>
        ) : null}
      </div>
      <TraditionStrip text={result ? (ta ? result.traditionTa : result.traditionEn) : null} ta={ta} />
    </>
  );
}
