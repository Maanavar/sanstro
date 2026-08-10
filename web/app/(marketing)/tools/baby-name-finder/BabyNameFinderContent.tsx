"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { PlaceCombobox } from "@/components/place-combobox";
import { useLang } from "@/components/lang-toggle";
import { useBirthProfileForm } from "@/hooks/useBirthProfileForm";
import { readErrorMessage } from "@/lib/api";
import { VERDICT_LABEL, plainSummaryText } from "@/lib/numerology-labels";
import type { CityEntry } from "@/lib/tn-cities";
import {
  getPublicBabyNamesPreview,
  type AlignmentVerdict,
  type BabyNameCandidate,
  type BabyNameGender,
  type BabyNameMode,
  type BabyNamesResponse,
} from "@vinaadi/shared/api/numerology";
import {
  CONFIDENCE_CHIP,
  DRAFT_BANNER,
  GENDER_LABEL,
  MEANINGS_WITHHELD,
  MUST_IT_BEGIN_A,
  MUST_IT_BEGIN_Q,
  ADVISE_AGAINST_ACTION,
  ADVISE_AGAINST_CHIP,
  BETTER_SPELLINGS_HEADING,
  FAMILY_NAME_HELP,
  FAMILY_NAME_LABEL,
  FULL_NAME_TERM,
  GROUP_ADVICE,
  GROUP_HEADING,
  ORDER_EXPLAINER,
  RELATION_CHIP,
  RELATION_TONE,
  WITHIN_GROUP_ORDER,
  fullNameGapNote,
  groupByRelation,
  spellingOperations,
  SCOPE_LABEL,
  SCOPE_ORDER,
  SCOPE_REVIEW_NOTE,
  SCOPE_SUMMARY,
  aksharaSubLine,
  contextLine,
  emptyMessage,
  pick,
  relationNote,
  relaxationSentence,
  scopeExplainer,
} from "@/lib/baby-name-copy";

/**
 * Public Baby Name Finder (NUM-50/51/52) — birth details in, ranked names out.
 *
 * ## Why a birth-detail form and not a nakshatra/pada picker
 *
 * The first version of this page (2026-07-30) asked visitors to already know
 * their child's nakshatra and pada, which almost nobody does by name. It also
 * meant this page could never show Fortune Alignment — no chart, no lagna.
 *
 * This version calls `getPublicBabyNamesPreview`, which mirrors
 * `/public/chart-preview` (the same ephemeral, no-login chart computation
 * Jadhagam Generator already uses): the chart is computed once, in memory,
 * to read the Moon's nakshatra-pada AND this native's own lagna/strengths,
 * then discarded. Nothing is saved. That is also why every candidate here
 * DOES carry `alignment` now — an ephemeral chart still has a real lagna.
 *
 * The signed-in dashboard has the identical flow as its own Tools-tab card
 * (`dashboard-tools-baby-names-nova.tsx`, not nested inside Numerology —
 * the person this is for has no saved profile to attach it to).
 *
 * ## Still draft content
 *
 * Two things behind this are unreviewed, independent of how the chart was
 * computed: the nakshatra-pada canon (0/108 astrologer-verified) and the
 * name corpus (assistant-drafted, zero rows reviewed). `usable` reads
 * `false` for every result today — the banner below is unconditional for
 * that reason, not gated on a technicality that would rarely show it.
 */

/* `VERDICT_LABEL` was a private copy of the dashboard's map, kept because
   `dashboard-numerology-shared.tsx` cannot be imported here — it pulls
   dashboard primitives and its inline styles read `var(--color-*)`, which
   exist only under `[data-ui="nova"] .cd-shell`. Both surfaces now share
   `@/lib/numerology-labels`, which carries strings and nothing else. */

function isNotLaunched(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return message.startsWith("404:");
}

function NotLaunched({ ta }: { ta: boolean }) {
  return (
    <p className="cl-num-note">
      {ta
        ? "இந்தக் கருவி இன்னும் திறக்கப்படவில்லை. விரைவில் இங்கேயே கிடைக்கும்."
        : "This tool isn't switched on yet. It will appear here once it goes live."}
    </p>
  );
}

function ErrorLine({ message }: { message: string }) {
  return <p className="cl-num-error">{message}</p>;
}

type BirthForm = {
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
};

const EMPTY_FORM: BirthForm = {
  displayName: "",
  birthDateLocal: "",
  birthTimeLocal: "",
  birthPlace: "",
  birthLatitude: "",
  birthLongitude: "",
  birthTimezone: "Asia/Kolkata",
};

export function BabyNameFinderContent() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const { applyPlaceSelection } = useBirthProfileForm();
  const genderLabelId = useId();

  const [form, setForm] = useState<BirthForm>(EMPTY_FORM);
  const [gender, setGender] = useState<BabyNameGender | undefined>(undefined);
  // Defaults to the strict rule. Widening is always the parent's decision —
  // the tool must never quietly reach past the paadham on their behalf.
  const [mode, setMode] = useState<BabyNameMode>("pada_first");
  // One surname for the family, scored against every name on the page. TN now
  // uses first-name/last-name alongside the traditional initial + given name.
  const [familyName, setFamilyName] = useState("");

  const [result, setResult] = useState<BabyNamesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  const canSearch = Boolean(form.birthDateLocal && form.birthLatitude && form.birthLongitude);

  const onPlaceChange = (city: CityEntry | null, raw: string) => {
    setForm((prev) => applyPlaceSelection(prev, city, raw));
  };

  const hasSearched = useRef(false);

  const run = () => {
    if (!canSearch) return;
    hasSearched.current = true;
    setLoading(true);
    setError("");
    setUnavailable(false);
    getPublicBabyNamesPreview({
      birth: {
        displayName: form.displayName.trim() || undefined,
        birthDateLocal: form.birthDateLocal,
        birthTimeLocal: form.birthTimeLocal || undefined,
        birthPlace: form.birthPlace.trim() || undefined,
        birthLatitude: Number.parseFloat(form.birthLatitude),
        birthLongitude: Number.parseFloat(form.birthLongitude),
        birthTimezone: form.birthTimezone,
      },
      gender,
      mode,
      familyName: familyName.trim() || undefined,
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

  // Re-run when a filter changes, once a search has actually been made. The
  // filters used to only write state, leaving the displayed result stale until
  // the button was pressed again — which made every one of them read as dead.
  // Birth details deliberately do NOT re-run: those are typed a key at a time.
  useEffect(() => {
    if (!hasSearched.current) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, mode]);
  // `familyName` is deliberately NOT a re-run trigger: it is typed a
  // character at a time, same reasoning as the birth-detail fields.

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "32px" }}>
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">
                {ta ? "பெயர் தேர்வு — வரைவு" : "Baby names — draft preview"}
              </p>
              <h1 className="cl-pub-h1" style={{ maxWidth: "24ch" }}>
                {ta ? "பிறப்பு விவரங்களிலிருந்து பெயர் தேடல்" : "Baby name finder, from birth details"}
              </h1>
              <p className="cl-pub-lead">
                {ta
                  ? "பிறந்த தேதி, நேரம், இடத்தை உள்ளிடவும் — கணக்கு வேண்டாம், சேமிக்கப்பட்ட சுயவிவரமும் வேண்டாம். குழந்தையின் ஜென்ம நட்சத்திரப் பாதம் குறிக்கும் தொடக்க எழுத்தில் தொடங்கும் பெயர்கள் காட்டப்படும், அந்த ஜாதகத்தோடு பொருந்தும் விதத்தில் வரிசைப்படுத்தப்படும். அந்த எழுத்தில்தான் தொடங்க வேண்டுமா என்பதும், விரும்பினால் நட்சத்திரம்/ராசி வரை — அல்லது எழுத்து விதியே இல்லாமல் — எப்படித் தேடலாம் என்பதும் விளக்கப்படும்."
                  : "Enter a date, time and place of birth — no account, no saved profile. We work out the opening letter your child's birth natchathiram and paadham call for, then show names that begin with it, ordered by how each name's number sits with that exact chart. We also explain whether the name has to start with that letter, and let you search wider — the whole natchathiram, the rasi, or no letter rule at all."}
              </p>
            </div>
          </div>
        </section>

        <section className="cl-num-band">
          <div className="cl-container">
            <div className="cl-num-card">
              <div className="cl-num-card__form">
                <p className="cl-num-card__intro">
                  {ta
                    ? "பிறந்த தேதி, இடம் தேவை. நேரம் தெரிந்தால் இணக்கம் மிகச் சரியாக இருக்கும்."
                    : "Date and place of birth are required. Time sharpens the alignment ranking if you have it."}
                </p>

                <div className="cl-num-form" data-cols="birth">
                  <label className="cl-num-field">
                    <span className="cl-num-field__label">{ta ? "பெயர் (விருப்பம்)" : "Name (optional)"}</span>
                    <input
                      className="cl-num-input"
                      value={form.displayName}
                      onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                      placeholder={ta ? "எ.கா. பிரியாவின் குழந்தை" : "e.g. Baby of Priya"}
                      autoComplete="off"
                    />
                  </label>
                  <label className="cl-num-field">
                    <span className="cl-num-field__label">{ta ? "பிறந்த தேதி" : "Date of birth"}</span>
                    <input
                      type="date"
                      className="cl-num-input"
                      value={form.birthDateLocal}
                      onChange={(e) => setForm((prev) => ({ ...prev, birthDateLocal: e.target.value }))}
                    />
                  </label>
                  <label className="cl-num-field">
                    <span className="cl-num-field__label">{ta ? "பிறந்த நேரம்" : "Time of birth"}</span>
                    <input
                      type="time"
                      className="cl-num-input"
                      value={form.birthTimeLocal}
                      onChange={(e) => setForm((prev) => ({ ...prev, birthTimeLocal: e.target.value }))}
                    />
                  </label>
                  {/* Spans two tracks — a "City, State, Country" string needs
                      more room than the date and time fields beside it. */}
                  <label className="cl-num-field" data-span="2">
                    <span className="cl-num-field__label">{ta ? "பிறந்த இடம்" : "Place of birth"}</span>
                    {/* `cl-num-input` opts this combobox out of its own inline
                        dashboard styling. Without it the field rendered with
                        10px corners, a 1.5px tan border and no 44px floor
                        while the three fields above it were square-cornered
                        44px-tall inputs on `--cl-surface-2` — one row of four
                        fields drawn in two different visual languages. */}
                    <PlaceCombobox
                      className="cl-num-input"
                      value={form.birthPlace}
                      onChange={onPlaceChange}
                      placeholder={ta ? "நகரத்தைத் தட்டச்சு செய்யவும்…" : "Type a city…"}
                    />
                  </label>
                </div>

                {/* One surname for the family, applied to every name below —
                    ours and any the parent is weighing. Never affects which
                    names match the paadham: the opening letter belongs to the
                    given name, and a surname can neither satisfy nor violate
                    that rule.

                    Sits here, with the other text inputs and above the two chip
                    rows, for two reasons. It is where the dashboard twin puts
                    it (`dashboard-tools-baby-names-nova.tsx` — fields, then
                    Segmented controls), and standing between gender and scope
                    it split the pair of chip rows that read as one filter
                    block, while being glued to the gender buttons by the
                    margin it does not have. `--standalone` supplies the
                    separation and the width that `.cl-num-form`'s grid and
                    `.cl-num-group`'s margin give every other control here. */}
                <label className="cl-num-field cl-num-field--standalone">
                  <span className="cl-num-field__label">{pick(FAMILY_NAME_LABEL, ta)}</span>
                  <input
                    className="cl-num-input"
                    type="text"
                    value={familyName}
                    maxLength={120}
                    autoComplete="off"
                    placeholder={ta ? "எ.கா. செந்தில்குமார்" : "e.g. Senthilkumar"}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                  <span className="cl-num-field__help">{pick(FAMILY_NAME_HELP, ta)}</span>
                </label>

                {/* Labelled like every other control. Unlabelled, these three
                    buttons sat 4px under "Place of birth" and read as options
                    belonging to that field rather than as the baby's gender. */}
                <div className="cl-num-group">
                  <span className="cl-num-field__label" id={genderLabelId}>
                    {ta ? "குழந்தையின் பாலினம்" : "Baby's gender"}
                  </span>
                  <div className="cl-num-kinds" role="group" aria-labelledby={genderLabelId}>
                    {([undefined, "m", "f"] as const).map((g) => (
                      <button
                        key={g ?? "any"}
                        type="button"
                        onClick={() => setGender(g)}
                        aria-pressed={gender === g}
                        className="cl-num-tab cl-num-tab--sm"
                        data-active={gender === g ? "true" : undefined}
                      >
                        {g ? (ta ? GENDER_LABEL[g].ta : GENDER_LABEL[g].en) : ta ? "பொது" : "Any"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* The scope ladder is the ONLY widening control now, and it
                    sits in the open form: it is the question a parent actually
                    arrives with — "does the name have to start with that
                    letter?" — and burying it implied the strict rule was the
                    only rule.

                    Two script-evidence checkboxes used to sit under a "More
                    options" disclosure here and were cut on 2026-08-02.
                    Measured over all 108 paadhams x 3 genders x 4 scopes:
                    at this page's default scope "close matches" changed the
                    result in 3 of 324 searches and the Tamil-collapse box in
                    10 of 324, and at "any letter" scope BOTH were inert in all
                    324. Worse, `allow_ambiguous` is ANDed with `not
                    collapse_gated` in `find_names`, so on the 177 collapse-row
                    searches the first box could not do anything unless the
                    second was also ticked — an invisible dependency between
                    two controls. The API params survive (mobile and the
                    service tests still pass them); only the UI is gone. The
                    collapse question is NU-8a, an unresolved practitioner
                    question, which is not a parent's call to make. */}
                <ScopePicker
                  mode={mode}
                  onChange={setMode}
                  rasiName={result ? (ta ? result.targetRasiTa : result.targetRasiEn) : null}
                  ta={ta}
                />

                <button
                  type="button"
                  className="cl-num-submit"
                  onClick={run}
                  disabled={loading || !canSearch}
                >
                  {loading
                    ? ta
                      ? "தேடுகிறது…"
                      : "Searching…"
                    : ta
                      ? "பெயர்களைத் தேடு"
                      : "Find names"}
                </button>

                {unavailable ? <NotLaunched ta={ta} /> : null}
                {error ? <ErrorLine message={error} /> : null}
              </div>

              {result ? <ResultBlock result={result} ta={ta} /> : null}
            </div>
          </div>
        </section>

        <section className="cl-num-section">
          <div className="cl-container">
            <p className="cl-num-eyebrow">{ta ? "குறிப்பு" : "Reference"}</p>
            <h2 className="cl-num-h2" style={{ marginBottom: "20px" }}>
              {ta ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}
            </h2>
            <div className="cl-num-faq">
              <details className="cl-num-faq__item" open>
                <summary className="cl-num-faq__q">
                  {ta ? "பாத எழுத்துப் பெயர் என்றால் என்ன?" : "What is a paadham letter name?"}
                </summary>
                <p className="cl-num-faq__a">
                  {ta
                    ? "27 நட்சத்திரங்களும் தலா 4 பாதங்களாகப் பிரிக்கப்படுகின்றன — மொத்தம் 108 பாதங்கள். ஒவ்வொரு பாதத்திற்கும் பஞ்சாங்க மரபில் ஒரு தொடக்க எழுத்து ஒதுக்கப்பட்டுள்ளது. குழந்தை பிறந்த நேரத்தில் சந்திரன் நின்ற பாதம் எதுவோ, அதன் எழுத்தில் தொடங்கும் பெயர் சாதகமானதாகக் கருதப்படுகிறது. இது எண் கணிதம் சாராதது."
                    : "Each of the 27 natchathirams is divided into four paadhams — 108 in all — and almanac practice assigns every paadham an opening letter. Whichever paadham the Moon stood in at the moment of birth, a name beginning with that paadham's letter is held to be auspicious. This part has nothing to do with numerology."}
                </p>
              </details>
              <details className="cl-num-faq__item">
                <summary className="cl-num-faq__q">
                  {ta
                    ? "எங்கள் ஜோதிடர் வேறு எழுத்தில் பெயர் சொல்லிவிட்டார் — அது தவறா?"
                    : "Our astrologer gave a name starting with a different letter. Is it wrong?"}
                </summary>
                <p className="cl-num-faq__a">
                  {ta
                    ? "இல்லை. பாத எழுத்து மரபு தரும் தொடக்கப் புள்ளி; அது ஒன்றே விதி அல்ல. ஒரு ஜோதிட-எண் கணிதர் ஜாதகம், லக்னம், தசை, பெயரின் எண் ஆகிய அனைத்தையும் சேர்த்துப் பார்த்து, பாத எழுத்து சுட்டாத ஒரு பெயரைத் தேர்ந்தெடுக்கலாம் — இது பரவலான, நெடுங்கால வழக்கம். பல குடும்பங்கள் சடங்குக்கு நட்சத்திரப் பெயரையும், அன்றாட வழக்குக்கு வேறொரு பெயரையும் வைத்துக்கொள்கின்றன. உங்கள் ஜோதிடர் பார்த்த விதத்தில் இங்கும் தேட, மேலே உள்ள “தொடக்க எழுத்தின் வரம்பு” என்பதை நட்சத்திரம், ராசி, அல்லது “எந்த எழுத்தும்” என மாற்றிக்கொள்ளுங்கள்."
                    : "No. The paadham letter is the tradition's starting point, not its only rule. An astrologer-numerologist weighing the whole chart — lagnam, dasa, and the name's own number — may well settle on a name the paadham letter would never have reached, and that is a normal, long-standing practice. Many families keep the star name for the ceremony and a different everyday name alongside it. To search the way your astrologer did, change “Opening-letter scope” above to your natchathiram, your rasi, or “Any letter”."}
                </p>
              </details>
              <details className="cl-num-faq__item">
                <summary className="cl-num-faq__q">
                  {ta ? "பிறந்த நேரம் தெரியாவிட்டால்?" : "What if I don't know the exact birth time?"}
                </summary>
                <p className="cl-num-faq__a">
                  {ta
                    ? "நேரம் இல்லாமலும் தேடலாம். ஆனால் வரிசைப்படுத்துவது குறைவான துல்லியமாக இருக்கும் — லக்னம் துல்லியமான நேரத்தைச் சார்ந்தது. எந்தப் பெயர்கள் பட்டியலில் வரும் என்பதைத் தீர்மானிக்கும் பாத எழுத்து, பெரும்பாலும் பிறந்த தேதியும் இடமும் மட்டுமே போதுமானது."
                    : "You can still search. The ordering will be less precise — the lagnam depends on an accurate time — but the paadham letter, which is what decides which names appear at all, is usually settled by date and place alone."}
                </p>
              </details>
              <details className="cl-num-faq__item">
                <summary className="cl-num-faq__q">
                  {ta ? "இந்தக் கருவி ஏன் 'வரைவு' எனக் குறிப்பிடுகிறது?" : "Why does this say “draft”?"}
                </summary>
                <p className="cl-num-faq__a">
                  {ta
                    ? "108 பாத எழுத்து அட்டவணை இன்னும் ஜோதிடரால் சரிபார்க்கப்படவில்லை, மேலும் இந்தப் பெயர் பட்டியல் இந்த அம்சத்தை உருவாக்கிச் சோதிக்கவே தொகுக்கப்பட்டது — தமிழ் அறிஞர் ஒருவர் இதுவரை பார்க்கவில்லை. இரண்டும் மதிப்பாய்வு முடியும் வரை, முடிவுகளை ஆலோசனைக்கான தொடக்கமாக மட்டுமே கொள்ளுங்கள்."
                    : "The 108-row paadham letter table has not yet been checked by an astrologer, and this name list was compiled to build and test the feature — no native-speaker pass yet. Treat the results as a starting point for discussion until both clear review."}
                </p>
              </details>
              <details className="cl-num-faq__item">
                <summary className="cl-num-faq__q">
                  {ta ? "எண் கணிதம் பெயரை முடிவு செய்கிறதா?" : "Does numerology decide the name?"}
                </summary>
                <p className="cl-num-faq__a">
                  {ta
                    ? "இல்லை. எந்த வரம்பைத் தேர்ந்தெடுத்தாலும், எந்தப் பெயர்கள் பட்டியலில் வரலாம் என்பதைத் தீர்மானிப்பது எழுத்து விதிதான்; எண் கணிதம் அந்தப் பட்டியலுக்குள் மட்டுமே வரிசைப்படுத்துகிறது. வரம்பை விரிவாக்கினாலும் உங்கள் பாத எழுத்தில் தொடங்கும் பெயர்களே முதலில் வரும் — ஒரு எண் ஒருபோதும் ஒரு கிரகத்தை மீறாது."
                    : "No. Whatever scope you pick, the letter rule decides which names can appear; the numerology only orders the list it produced. Even at the widest scope, names opening with your own paadham letter are still ranked first — a number never overrides a graha."}
                </p>
              </details>
            </div>
            <div className="cl-num-related">
              <p className="cl-num-related__title">{ta ? "தொடர்புடையவை" : "Related"}</p>
              <div className="cl-num-related__links">
                <Link href="/tools/numerology-calculator" className="cl-num-chip">
                  {ta ? "எண் கணிதக் கருவி →" : "Numerology Calculator →"}
                </Link>
                <Link href="/tools/jadhagam-generator" className="cl-num-chip">
                  {ta ? "ஜாதகம் உருவாக்கு →" : "Jadhagam Generator →"}
                </Link>
                <Link href="/natchathiram" className="cl-num-chip">
                  {ta ? "நட்சத்திரங்கள் →" : "Natchathirams →"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="cl-num-cta">
          <div className="cl-container cl-num-cta__inner">
            <div>
              <h2 className="cl-num-cta__title">
                {ta ? "இந்தத் தேடலைச் சேமித்து மீண்டும் பாருங்கள்" : "Save this search and come back to it"}
              </h2>
              <p className="cl-num-cta__body">
                {ta
                  ? "உள்நுழைந்தால் இந்தச் சேட்டைக் குழந்தையின் சொந்த ஜாதகமாகச் சேமித்து, மற்ற எண் கணிதக் கருவிகளுடன் பயன்படுத்தலாம்."
                  : "Sign in to save this as a real chart and use it with the rest of the numerology and jadhagam tools."}
              </p>
            </div>
            <div className="cl-num-cta__action">
              <Link href="/login" className="cl-num-cta__btn">
                {ta ? "இலவசமாகத் தொடங்குங்கள் →" : "Get started free →"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

/**
 * How far past this paadham's own letter to look, with the reasoning attached.
 *
 * Each rung carries a one-line summary under the buttons and a full paragraph
 * behind "Why this option?". A widening offered without its reasoning is
 * either a trap or a shrug — see `web/lib/baby-name-copy.ts`.
 */
function ScopePicker({
  mode,
  onChange,
  rasiName,
  ta,
}: {
  mode: BabyNameMode;
  onChange: (next: BabyNameMode) => void;
  rasiName: string | null;
  ta: boolean;
}) {
  const labelId = useId();
  return (
    <div className="cl-num-group">
      <span className="cl-num-field__label" id={labelId}>
        {ta ? "தொடக்க எழுத்தின் வரம்பு" : "Opening-letter scope"}
      </span>
      <div className="cl-num-kinds" role="group" aria-labelledby={labelId}>
        {SCOPE_ORDER.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={mode === option}
            className="cl-num-tab cl-num-tab--sm"
            data-active={mode === option ? "true" : undefined}
          >
            {pick(SCOPE_LABEL[option], ta)}
          </button>
        ))}
      </div>
      <p className="cl-num-note" style={{ margin: 0 }}>
        {pick(SCOPE_SUMMARY[mode], ta)}
      </p>
      <details className="cl-num-details">
        <summary>{ta ? "இந்த வரம்பு ஏன்?" : "Why this option?"}</summary>
        <div className="cl-num-details__body">
          <p style={{ margin: 0 }}>{scopeExplainer(mode, rasiName, ta)}</p>
        </div>
      </details>
    </div>
  );
}

function ResultBlock({ result, ta }: { result: BabyNamesResponse; ta: boolean }) {
  const nakshatraLabel = ta ? result.targetNakshatraTa : result.targetNakshatraEn;

  const widened = relaxationSentence(result.relaxationsApplied, ta);

  /*
   * Structure note — `.cl-num-results` is a TWO-COLUMN GRID (globals.css), and
   * every direct child of it becomes a cell. An earlier version wrapped this
   * whole block in it, so the draft banner, the window strip, the opening
   * letter and the card list each landed in a different cell: the page split
   * down the middle with a column of dead space. Only `.cl-num-reading` cards
   * may be direct children of it.
   */
  return (
    <>
      {/* The opening letter is the tradition's actual answer, so it leads and
          it is the one tinted band on the page — shown whether or not the list
          below has anything in it. The context line lives inside the band for
          the same reason: it identifies the result, so it is part of it. */}
      <div className="cl-num-akshara">
        <span className="cl-num-akshara__letter" aria-hidden="true">
          {result.targetAksharaTa}
        </span>
        <span className="cl-num-akshara__body">
          <span className="cl-num-akshara__eyebrow">
            {ta ? "தொடக்க எழுத்து" : "Opening letter"}
          </span>
          <span className="cl-num-akshara__context">
            {contextLine(
              nakshatraLabel,
              result.targetPada,
              ta ? result.lagnaRasiTa : result.lagnaRasiEn,
              ta,
            )}
          </span>
          <strong className="cl-num-akshara__lede">
            {ta
              ? `பெயர் ${result.targetAksharaTa} என்ற எழுத்தில் தொடங்க வேண்டும்`
              : `Names should begin with ${result.targetAksharaTa} (${result.targetAksharaEn})`}
          </strong>
          <span className="cl-num-akshara__sub">
            {aksharaSubLine(nakshatraLabel, result.targetPada, ta)}
          </span>
        </span>
      </div>

      {/* The question every parent arrives with, directly under the letter
          that prompts it. Collapsed, but the QUESTION is the visible summary —
          so a parent whose astrologer chose a different letter sees that the
          tool has an answer for them, instead of reading the strict list as a
          verdict on the name they were given. */}
      <details className="cl-num-details" style={{ marginTop: "12px" }}>
        <summary>{pick(MUST_IT_BEGIN_Q, ta)}</summary>
        <div className="cl-num-details__body">
          <p style={{ margin: 0 }}>{pick(MUST_IT_BEGIN_A, ta)}</p>
          <p className="cl-num-note" style={{ margin: "8px 0 0" }}>
            {pick(SCOPE_REVIEW_NOTE, ta)}
          </p>
        </div>
      </details>

      <div className="cl-num-babynames__notes">
        {/* Unconditional — usable/canonVerified read false for every result
            today, and that is the state to design for, not an error. */}
        <p className="cl-num-note" role="note" style={{ margin: 0 }}>
          {pick(DRAFT_BANNER, ta)}
        </p>
        {result.candidates.length > 0 ? (
          <p className="cl-num-note" style={{ margin: 0 }}>
            {pick(ORDER_EXPLAINER, ta)}
          </p>
        ) : null}
        {widened ? (
          <p className="cl-num-note" style={{ margin: 0 }}>
            {widened}
          </p>
        ) : null}
        {result.candidates.length === 0 ? (
          <p className="cl-num-note" style={{ margin: 0 }}>
            {emptyMessage(result.emptyReasonCode, result.targetAksharaTa, result.targetAksharaEn, ta)}
          </p>
        ) : null}
      </div>

      {/* Grouped by letter rule, in doctrine D2 order.
       *
       * A flat list asserts one ranking by merit, and this list is not one: a
       * name opening this paadham's own letter outranks a better-scoring name
       * that does not, because the akshara decides who is eligible and the
       * number only orders within that. A parent read the dashboard's flat
       * version twice and twice asked why a 59 sat above an 85. The heading
       * is the answer, and it has to be structural — no paragraph above a
       * list survives the list.
       *
       * The heading sits OUTSIDE `.cl-num-results`, which is a two-column
       * grid whose every DIRECT child becomes a cell — the whole result was
       * once wrapped in it and half the page turned to dead space. Only
       * `.cl-num-reading` cards may be direct children, so each group gets
       * its own grid. */}
      {result.candidates.length > 0
        ? groupByRelation(result.candidates).map((group) => (
            <div className="cl-num-namegroup" key={group.relation}>
              <div className="cl-num-namegroup__head">
                <h3 className="cl-num-namegroup__title">
                  {pick(GROUP_HEADING[group.relation], ta)}
                  {group.relation === "on_paadham"
                    ? ` · ${ta ? result.targetAksharaTa : result.targetAksharaEn}`
                    : null}
                </h3>
                <span className="cl-num-namegroup__count">
                  {group.items.length}
                  {ta ? " பெயர்" : group.items.length === 1 ? " name" : " names"}
                  {" · "}
                  {pick(WITHIN_GROUP_ORDER, ta)}
                </span>
              </div>
              <p className="cl-num-namegroup__advice">{pick(GROUP_ADVICE[group.relation], ta)}</p>
              <div className="cl-num-results">
                {group.items.map((c, i) => (
                  <NameCard
                    key={`${c.latinSpelling}-${i}`}
                    candidate={c}
                    rasiName={ta ? result.targetRasiTa : result.targetRasiEn}
                    ta={ta}
                  />
                ))}
              </div>
            </div>
          ))
        : null}

      <div className="cl-num-babynames__foot">
        {!result.readingsAvailable ? (
          <p className="cl-num-note" style={{ margin: 0 }}>
            {pick(MEANINGS_WITHHELD, ta)}
          </p>
        ) : null}
        <p className="cl-num-tradition" style={{ margin: 0 }}>
          {ta ? result.traditionTa : result.traditionEn}
        </p>
      </div>
    </>
  );
}

function NameCard({
  candidate,
  rasiName,
  ta,
}: {
  candidate: BabyNameCandidate;
  rasiName: string | null;
  ta: boolean;
}) {
  const verdict = candidate.alignment ? VERDICT_LABEL[candidate.alignment.verdict] : null;
  // Null for an on-paadham name. Once the scope widens, a name from a
  // neighbouring star sits on the same page as one the paadham actually calls
  // for; without this line the two are indistinguishable and the tool would
  // be passing off a name it reached for as one the tradition chose.
  const relation = relationNote(candidate, rasiName, ta);
  return (
    <div className="cl-num-reading">
      <span className="cl-num-reading__tags">
        <span className={`cl-num-reading__relation cl-num-reading__relation--${RELATION_TONE[candidate.relation]}`}>
          {pick(RELATION_CHIP[candidate.relation], ta)}
        </span>
        {/* The one negative call this tool makes — from
            `should_advise_name_change`, the same guard Fortune Alignment uses.
            A benefic lordship can never trip it, so "8 is unlucky" cannot
            reach a parent through this. */}
        {candidate.adviseAgainst ? (
          <span className="cl-num-reading__relation cl-num-reading__relation--warn">
            {pick(ADVISE_AGAINST_CHIP, ta)}
          </span>
        ) : null}
      </span>
      <div className="cl-num-reading__head">
        {/* Latin spelling, matching both dashboard surfaces since 2026-08-04 —
            one script per list, and the one every row has. The Chaldean number
            below is scored from this exact string, so the old `__rootnote`
            repeat of it under the digit went with the change. */}
        <span className="cl-num-reading__label">{candidate.latinSpelling}</span>
        <span className="cl-num-reading__source">
          {pick(CONFIDENCE_CHIP[candidate.confidence], ta)}
        </span>
      </div>
      {relation ? (
        <p className="cl-num-note" style={{ margin: 0 }}>
          {relation}
        </p>
      ) : null}
      <div className="cl-num-reading__figure">
        <span className="cl-num-reading__digit">{candidate.reading.root}</span>
        <span className="cl-num-reading__side">
          <span className="cl-num-reading__graha">
            {ta ? candidate.reading.grahaTa : candidate.reading.grahaEn}
            {candidate.gender ? ` · ${pick(GENDER_LABEL[candidate.gender], ta)}` : ""}
          </span>
        </span>
      </div>
      {candidate.alignment && verdict ? (
        <p className="cl-num-babynames__verdict">
          <span>{ta ? verdict.ta : verdict.en}</span>
          <span className="cl-num-babynames__score">{Math.round(candidate.alignment.score)}</span>
        </p>
      ) : null}
      {/* Why that verdict, in one sentence. This page showed a bare "Out of
          step" and a bare 38 with nothing joining them to the chart — the
          complaint that started this whole pass, fixed on the dashboard and
          left standing here. Shares `plainSummaryText` with the dashboard so
          the two cannot word the same finding differently. */}
      {candidate.alignment ? (
        <p className="cl-num-reading__why">
          {plainSummaryText(candidate.alignment, "child", ta ? "ta" : "en")}
        </p>
      ) : null}
      {/* Action only — `plainSummaryText` above already named the graha and
          its role, and repeating them here read as the card saying the same
          thing twice. */}
      {candidate.adviseAgainst ? (
        <p className="cl-num-note" style={{ margin: 0 }}>
          {pick(ADVISE_AGAINST_ACTION, ta)}
        </p>
      ) : null}
      {/* …and the spellings that would clear it. Until this existed, the line
          above was a promise with nothing behind it. */}
      {candidate.betterSpellings.length > 0 ? (
        <div className="cl-num-better">
          <span className="cl-num-better__head">{pick(BETTER_SPELLINGS_HEADING, ta)}</span>
          {candidate.betterSpellings.map((s) => (
            <span className="cl-num-better__row" key={s.spelling}>
              <span className="cl-num-better__name">{s.spelling}</span>
              <span className="cl-num-better__num">
                {s.reading.root} · {ta ? s.reading.grahaTa : s.reading.grahaEn}
              </span>
              <span className="cl-num-better__score">
                {Math.round(s.alignment.score)} <span className="cl-num-better__gain">+{s.improvement}</span>
              </span>
              <span className="cl-num-better__ops">{spellingOperations(s.operations, ta)}</span>
            </span>
          ))}
        </div>
      ) : null}
      {candidate.meaningEn || candidate.meaningTa ? (
        <p className="cl-num-reading__nocompound">{ta ? candidate.meaningTa : candidate.meaningEn}</p>
      ) : null}
      {/* The other real question: what this reads as on the documents. Kept
          below and quieter than the called name's figure — the called name is
          the one the paadham rule governs and the one the child is addressed
          by, and two full readings at equal weight is the adjacent-scores
          fusion this card has hit before. */}
      {candidate.fullNameSpelling && candidate.fullNameReading ? (
        <p className="cl-num-reading__fullname">
          <span className="cl-num-reading__fullname-label">{pick(FULL_NAME_TERM, ta)}</span>
          <span className="cl-num-reading__fullname-name">{candidate.fullNameSpelling}</span>
          <span className="cl-num-reading__fullname-num">{candidate.fullNameReading.root}</span>
          <span>
            {ta ? candidate.fullNameReading.grahaTa : candidate.fullNameReading.grahaEn}
          </span>
          {candidate.fullNameAlignment ? (
            <span className="cl-num-reading__fullname-score">
              {Math.round(candidate.fullNameAlignment.score)}
            </span>
          ) : null}
        </p>
      ) : null}
      {candidate.alignment && candidate.fullNameAlignment
        ? (() => {
            const note = fullNameGapNote(
              candidate.alignment.score,
              candidate.fullNameAlignment.score,
              ta,
            );
            /* Not `.cl-num-note`: at 0.85rem that set this footnote LARGER
               than the full-name line it captions (0.8rem) and larger than
               the called name's own explanation (0.82rem), with a zero margin
               gluing it to the line above — the opposite of the "quieter than
               the called name" intent stated a few lines up. */
            return note ? <p className="cl-num-reading__fullname-note">{note}</p> : null;
          })()
        : null}
      {/*
       * `candidate.warnings` is NOT rendered, deliberately.
       *
       * It is matcher provenance written for a developer — every card on this
       * page was repeating "Row 21-3 is unverified draft canon (tier B); not
       * fit for a user-facing recommendation", three times over, in a boxed
       * caveat. That is the same fact the draft banner states once, in the
       * register a parent reads, and restating it per card made the results
       * look broken rather than provisional. Same class of leak as
       * `emptyReason`; see `web/lib/baby-name-copy.ts`.
       */}
    </div>
  );
}
