"use client";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import {
  getNameCorrection,
  type LetterValue,
  type NameCorrectionResponse,
  type NameVariant,
  type NoChangeReason,
  type NumberReading,
  type SpellingOperation,
} from "@vinaadi/shared/api/numerology";

import {
  CalculationDetails,
  CompoundLine,
  CompoundSourceNote,
  LetterBreakdown,
  NumerologyError,
  NumerologyLoading,
  NumerologyUnavailable,
  ReadingsWithheldNote,
  WhyThisRating,
  formatReductionChain,
  grahaLabel,
  isNumerologyUnavailable,
  verdictLabel,
  verdictPlain,
  verdictTone,
} from "./dashboard-numerology-shared";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import { Field, Input, Select } from "./ui/field";
import { Kicker } from "./ui/kicker";

/**
 * Name correction (NUM-53/54/57, Phase 5) — the screen the engine never had.
 *
 * ## Why this exists now
 *
 * The engine has been built and tested since 2026-07-27 and reached no user,
 * because `numerology_correction_service` withheld every alternative on the
 * corpus-wide `CONTENT_REVIEWED` flag. Doctrine §9.4 makes the legal-consequence
 * warning mandatory alongside any recommendation, and that warning was gated
 * with the interpretive corpus even though it is a fixed statement about Indian
 * paperwork rather than a reading of anyone. That gate was split on 2026-07-29
 * (`numerology_correction.LEGAL_WARNING_REVIEWED`), so the alternatives — which
 * are spellings, Chaldean totals and alignment scores, all number-shaped — now
 * ship while the interpretive corpus stays dark.
 *
 * The rule in `dashboard-numerology-shared.tsx` binds every string here
 * unchanged: **render tokens, never author meaning.** Operation names, letter
 * values and score arithmetic are facts about the calculation. What a 7 means
 * for someone's life is not, and is not written here.
 *
 * ## The three empty states, which are three different findings
 *
 * `alternatives: []` means one of three things and a UI that renders them
 * identically is lying about two of them:
 *
 * - `noChangeReason: "benefic_lordship"` — **a result, and the best one this
 *   product can give.** The graha behind this name is functionally benefic in
 *   this native's own chart. A standalone numerology app is structurally unable
 *   to reach this answer; it can only ever sell a correction. It gets the
 *   loudest treatment on this screen.
 * - `noChangeReason: "not_misaligned"` / `"no_better_spelling"` — nothing is
 *   wrong, or the search ran and found nothing better. Distinct from each other:
 *   the first never searched, the second searched and came back empty.
 * - `alternativesWithheldReason` — the engine *did* find corrections and this
 *   layer removed them. Says "not available yet". Must never read as "your name
 *   is fine", which is the opposite finding.
 *
 * ## Why the letter diff is the centre of the screen
 *
 * A correction is a claim that moving specific letters moves a number. "Rajesh
 * → Raajesh, 67 → 72" asks the reader to take both halves on faith. The letter
 * strip shows which characters changed and what each is worth, so the arithmetic
 * is checkable rather than asserted — and a name change is the one output in
 * this feature that proposes doing something expensive and irreversible.
 *
 * The diff runs over `letterValues`, **not the spelling strings**. `score_text`
 * drops spaces and other ignorable characters and uppercases what remains, so
 * character indices into the raw spelling do not line up with what is rendered.
 * Diffing the sequence actually on screen cannot drift from it.
 */

type Props = {
  lang: Lang;
  chartId: string;
  /** Offered so a corrected spelling can go straight into the NUM-58 shortlist
   *  instead of being retyped from the screen. */
  onSaveSpelling?: (spelling: string) => void;
};

/* ── Vocabulary ───────────────────────────────────────────────────────────
 *
 * `SpellingOperation` is the reviewable artefact of this whole feature — seven
 * named orthographic moves an astrologer can accept or reject, rather than
 * ninety generated strings nobody can audit. So the operation is rendered in
 * words on every row: "the algorithm ranked it first" is not a reason to change
 * a legal name; "the second 'a' was lengthened" is.
 *
 * Exhaustive `Record` on purpose — an eighth operation is a doctrine change and
 * should fail the type check here, not render a raw enum key to a user.
 */
const OPERATION_LABEL: Record<SpellingOperation, { en: string; ta: string }> = {
  lengthen_vowel: { en: "a vowel lengthened", ta: "ஓர் உயிரெழுத்து நீட்டப்பட்டது" },
  shorten_vowel: { en: "a vowel shortened", ta: "ஓர் உயிரெழுத்து குறுக்கப்பட்டது" },
  double_consonant: { en: "a consonant doubled", ta: "ஓர் மெய்யெழுத்து இரட்டிக்கப்பட்டது" },
  add_aspirate: { en: "an 'h' added", ta: "ஒரு 'h' சேர்க்கப்பட்டது" },
  drop_aspirate: { en: "an 'h' removed", ta: "ஒரு 'h' நீக்கப்பட்டது" },
  append_vowel: { en: "a vowel added at the end", ta: "இறுதியில் ஓர் உயிரெழுத்து சேர்க்கப்பட்டது" },
  swap_final_glide: { en: "the final letter swapped", ta: "இறுதி எழுத்து மாற்றப்பட்டது" },
};

export function operationLabel(op: SpellingOperation, lang: Lang): string {
  const spec = OPERATION_LABEL[op];
  if (!spec) return op.replaceAll("_", " ");
  return lang === "ta" ? spec.ta : spec.en;
}

/**
 * The three no-change findings, said apart.
 *
 * `benefic_lordship` is deliberately the only one phrased as a positive
 * finding rather than an absence — it *is* one. The other two are honest
 * reports of a search, and conflating them with it would overclaim.
 */
const NO_CHANGE_COPY: Record<NoChangeReason, { en: string; ta: string }> = {
  benefic_lordship: {
    en: "The planet behind this name's number holds a supportive role in your own chart. There is nothing here to correct.",
    ta: "இந்தப் பெயரின் எண்ணுக்குரிய கிரகம் உங்கள் சொந்த ஜாதகத்தில் ஆதரவான பங்கு வகிக்கிறது. திருத்த வேண்டியது எதுவும் இல்லை.",
  },
  not_misaligned: {
    en: "This name is not out of step with your chart, so no correction was searched for.",
    ta: "இந்தப் பெயர் உங்கள் ஜாதகத்திற்கு எதிராக இல்லை, எனவே திருத்தம் எதுவும் தேடப்படவில்லை.",
  },
  no_better_spelling: {
    en: "Every spelling within two edits was examined and none scored better than the one you already use.",
    ta: "இரண்டு மாற்றங்களுக்குள் வரும் ஒவ்வொரு எழுத்துக்கூட்டலும் பரிசோதிக்கப்பட்டது — நீங்கள் ஏற்கனவே பயன்படுத்துவதைவிட எதுவும் சிறப்பாக இல்லை.",
  },
};

/* ── The letter diff ─────────────────────────────────────────────────────── */

type DiffMark = { letter: LetterValue; changed: boolean };

/**
 * Marks which scored letters differ, by trimming the common prefix and suffix.
 *
 * Correct for this input by construction, not by luck: the engine applies at
 * most two *localised* orthographic edits (`MAX_EDITS`), so the changed
 * characters form one contiguous region and prefix/suffix trimming finds
 * exactly it. This is not a general-purpose diff and should not be reused as
 * one — two edits at opposite ends of a name would mark everything between them
 * as changed. That over-marks; it never under-marks, which is the safe
 * direction for a highlight whose job is "look here".
 *
 * Nothing about the arithmetic depends on this. The totals come off the wire.
 */
export function markChangedLetters(
  original: readonly LetterValue[],
  variant: readonly LetterValue[],
): DiffMark[] {
  let prefix = 0;
  while (
    prefix < original.length &&
    prefix < variant.length &&
    original[prefix].char === variant[prefix].char
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < original.length - prefix &&
    suffix < variant.length - prefix &&
    original[original.length - 1 - suffix].char === variant[variant.length - 1 - suffix].char
  ) {
    suffix += 1;
  }

  const changedEnd = variant.length - suffix;
  return variant.map((letter, index) => ({
    letter,
    changed: index >= prefix && index < changedEnd,
  }));
}

function LetterDiff({
  original,
  variant,
  lang,
}: {
  original: NumberReading;
  variant: NumberReading;
  lang: Lang;
}) {
  const originalLetters = original.letterValues ?? [];
  const variantLetters = variant.letterValues ?? [];
  if (!variantLetters.length) return null;
  const marks = markChangedLetters(originalLetters, variantLetters);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
        {lang === "ta" ? "என்ன மாறியது, ஒவ்வொரு எழுத்தும் எவ்வளவு" : "What moved, and what each letter is worth"}
      </div>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "var(--space-1)" }}>
        {marks.map(({ letter, changed }, index) => (
          <span
            key={`${letter.char}-${index}`}
            style={{
              display: "inline-flex",
              flexDirection: "row",
              alignItems: "baseline",
              gap: "3px",
              padding: "2px 6px",
              borderRadius: "var(--radius-xs)",
              background: changed ? "var(--color-accent-muted)" : "var(--color-surface-soft)",
              border: `1px solid ${changed ? "var(--color-accent-strong)" : "var(--color-border)"}`,
              fontSize: "var(--text-xs)",
              lineHeight: 1.4,
            }}
          >
            <span
              style={{
                color: changed ? "var(--color-text-strong)" : "var(--color-text)",
                fontWeight: changed ? 700 : 600,
              }}
            >
              {letter.char}
            </span>
            <span style={{ color: "var(--color-faint)", fontVariantNumeric: "tabular-nums" }}>
              {letter.value}
            </span>
          </span>
        ))}
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text)",
            alignSelf: "center",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          = {variant.total}
        </span>
      </div>
    </div>
  );
}

/* ── The screen ──────────────────────────────────────────────────────────── */

export function NumerologyCorrectionSection({ lang, chartId, onSaveSpelling }: Props) {
  const isTamil = lang === "ta";
  const [name, setName] = useState("");
  const [maxEdits, setMaxEdits] = useState<1 | 2>(2);
  const [data, setData] = useState<NameCorrectionResponse | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error" | "unavailable">("idle");
  const [error, setError] = useState("");

  const run = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPhase("loading");
    setError("");
    getNameCorrection(chartId, { name: trimmed, maxEdits })
      .then((res) => {
        setData(res);
        setPhase("ready");
      })
      .catch((err: unknown) => {
        if (isNumerologyUnavailable(err)) {
          setPhase("unavailable");
          return;
        }
        // A 422 here is doctrine D3 — the Chaldean table is Latin-only and the
        // name arrived in another script. The server's own message names the
        // offending character, which is more use than anything written here.
        setError(readErrorMessage(err));
        setPhase("error");
      });
  };

  if (phase === "unavailable") return <NumerologyUnavailable lang={lang} />;

  return (
    <Card style={{ gap: "var(--space-4)" }}>
      <div>
        <Kicker as="div">{isTamil ? "பெயர்த் திருத்தம்" : "Name correction"}</Kicker>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55, maxWidth: "62ch" }}>
          {isTamil
            ? "உங்கள் பெயரின் எழுத்துக்கூட்டல் உங்கள் ஜாதகத்துடன் எப்படிப் பொருந்துகிறது என்பதைப் பாருங்கள். மாற்றம் தேவைப்பட்டால் மட்டுமே மாற்று எழுத்துக்கூட்டல்கள் காட்டப்படும் — ஏற்கனவே பொருந்தினால், அதுவே பதில்."
            : "See how a spelling sits against your own chart. Alternatives are offered only when the chart actually warrants a change — if your name already suits it, that is the answer."}
        </p>
      </div>

      <div className="nova-grid-2" style={{ gap: "var(--space-3)", alignItems: "end" }}>
        <Field
          label={isTamil ? "ஆவணங்களில் உள்ள பெயர்" : "The name on your documents"}
          helper={isTamil ? "ஆங்கில எழுத்துக்கள் மட்டும்" : "Latin letters only"}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isTamil ? "எ.கா. Rajesh Kumar" : "e.g. Rajesh Kumar"}
            autoComplete="off"
          />
        </Field>
        <Field
          label={isTamil ? "அனுமதிக்கும் மாற்றங்கள்" : "Edits allowed"}
          helper={
            isTamil
              ? "இரண்டுக்கு மேல் அது வேறொரு பெயர்"
              : "Past two it is a different name, not a correction"
          }
        >
          <Select value={String(maxEdits)} onChange={(e) => setMaxEdits(Number(e.target.value) as 1 | 2)}>
            <option value="1">{isTamil ? "ஒரு மாற்றம்" : "One edit"}</option>
            <option value="2">{isTamil ? "இரண்டு மாற்றங்கள்" : "Up to two edits"}</option>
          </Select>
        </Field>
      </div>

      <div>
        <Button variant="primary" onClick={run} disabled={phase === "loading" || !name.trim() || !chartId}>
          {phase === "loading"
            ? isTamil ? "பரிசோதிக்கிறது…" : "Checking…"
            : isTamil ? "இந்தப் பெயரைப் பரிசோதி" : "Check this name"}
        </Button>
      </div>

      {phase === "loading" ? <NumerologyLoading lang={lang} /> : null}
      {phase === "error" ? <NumerologyError lang={lang} message={error} /> : null}

      {data && phase === "ready" ? <CorrectionResult data={data} lang={lang} onSaveSpelling={onSaveSpelling} /> : null}
    </Card>
  );
}

/**
 * The rendered result, split out and exported so it can be tested against a
 * fixture response without standing up a fetch mock.
 *
 * That matters more here than it usually would: the thing worth testing is the
 * branch between three empty states that mean opposite things, and a test that
 * has to mock a network call to reach that branch tends not to get written.
 */
export function CorrectionResult({
  data,
  lang,
  onSaveSpelling,
}: {
  data: NameCorrectionResponse;
  lang: Lang;
  onSaveSpelling?: (spelling: string) => void;
}) {
  const isTamil = lang === "ta";
  const warning = isTamil ? data.legalWarningTa : data.legalWarningEn;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* The name as it stands. Always shown — it is the baseline every
          alternative below is a delta against, and on the no-change branches it
          is the entire result. */}
      <Card variant="soft" compact style={{ gap: "var(--space-2)" }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {isTamil ? "தற்போதைய எழுத்துக்கூட்டல்" : "As you spell it now"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-strong)" }}>
            {data.original}
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--color-text-strong)",
            }}
          >
            {data.originalReading.root}
          </span>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
            {grahaLabel(data.originalAlignment, lang)}
          </span>
          <Chip tone={verdictTone(data.originalAlignment.verdict)}>
            {verdictLabel(data.originalAlignment.verdict, lang)}
          </Chip>
          <span style={{ marginLeft: "auto", fontSize: "var(--text-sm)", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--color-text-strong)" }}>
            {Math.round(data.originalAlignment.score)} / 100
          </span>
        </div>

        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {verdictPlain(data.originalAlignment.verdict, lang)}
        </div>

        <CompoundLine reading={data.originalReading} lang={lang} />
        <LetterBreakdown reading={data.originalReading} lang={lang} />
        <WhyThisRating alignment={data.originalAlignment} lang={lang} />

        <CalculationDetails lang={lang}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
            {isTamil ? "சுருக்கம்" : "Reduction"} · {formatReductionChain(data.originalReading)}
          </div>
          <CompoundSourceNote reading={data.originalReading} lang={lang} />
        </CalculationDetails>
      </Card>

      {/* Branch 1 — a finding, not an empty state. */}
      {data.noChangeReason ? <NoChangeCard reason={data.noChangeReason} lang={lang} /> : null}

      {/* Branch 2 — the engine found corrections and this layer removed them.
          Kept structurally distinct from branch 1: those are opposite findings
          and a client that renders one as the other tells the user the wrong
          thing about their own name. */}
      {data.alternativesWithheldReason ? <WithheldCard lang={lang} /> : null}

      {/* Branch 3 — corrections, each with its derivation. */}
      {data.alternatives.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
              {isTamil ? "மாற்று எழுத்துக்கூட்டல்கள்" : "Spellings that score higher"}
            </span>
            {/* Three of ninety examined reads very differently to three of six —
                so the denominator is shown, not just the shortlist. */}
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {isTamil
                ? `பரிசோதிக்கப்பட்ட ${data.variantsConsidered} எழுத்துக்கூட்டல்களில் ${data.alternatives.length}`
                : `${data.alternatives.length} of ${data.variantsConsidered} spellings examined`}
            </span>
          </div>

          {data.alternatives.map((variant) => (
            <VariantRow
              key={variant.spelling}
              variant={variant}
              original={data.originalReading}
              originalScore={data.originalAlignment.score}
              lang={lang}
              onSaveSpelling={onSaveSpelling}
            />
          ))}

          {/* Doctrine §9.4. Outside every disclosure, deliberately — this is the
              one harm in the numerology feature that is administrative and real
              rather than interpretive, and a caveat a reader has to opt into is
              not a caveat. The response model refuses to serialise alternatives
              without it, so reaching here with `warning` null is impossible;
              the guard is a rolling-deploy fallback, not an expected branch. */}
          {warning ? <LegalWarningCard warning={warning} lang={lang} /> : null}
        </div>
      ) : null}

      {/* Still true here, and worth saying even though this screen is now
          readable without the corpus: the per-number interpretive sentences
          (`reasonEn`/`reasonTa`) are withheld on every alignment above. The two
          gates are independent — corrections ship, readings do not — and a
          reader who notices the missing sentences deserves the same account of
          why that every sibling view gives them. */}
      <ReadingsWithheldNote lang={lang} readingsAvailable={data.readingsAvailable} />
    </div>
  );
}

/**
 * "No change needed", rendered as the result it is.
 *
 * `benefic_lordship` gets the `high` card because it is the answer the whole
 * chart bridge exists to make possible — a number read against this native's
 * own lagna rather than against a table. A numerology product that can only
 * ever say "change your name" is selling anxiety; this is the branch that
 * proves this one is not.
 */
function NoChangeCard({ reason, lang }: { reason: NoChangeReason; lang: Lang }) {
  const isTamil = lang === "ta";
  const copy = NO_CHANGE_COPY[reason];
  const strongest = reason === "benefic_lordship";
  return (
    <Card variant={strongest ? "high" : "soft"} compact style={{ gap: "var(--space-1)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {strongest
          ? isTamil ? "உங்கள் பெயர் ஏற்கனவே பொருந்துகிறது" : "This name already suits your chart"
          : isTamil ? "மாற்றம் பரிந்துரைக்கப்படவில்லை" : "No change is being suggested"}
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {isTamil ? copy?.ta : copy?.en}
      </p>
    </Card>
  );
}

/**
 * The engine found corrections and they were removed.
 *
 * States what it is — "not available yet" — and never borrows the language of
 * the no-change branch. It also does not report our release process back to the
 * user, which an earlier version of the alignment panel's equivalent card did:
 * "the warning has not cleared Tamil review" is an accurate description of how
 * we work and of no use to someone deciding about a name.
 */
function WithheldCard({ lang }: { lang: Lang }) {
  const isTamil = lang === "ta";
  return (
    <Card variant="mid" compact style={{ gap: "var(--space-1)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {isTamil ? "மாற்று எழுத்துக்கூட்டல்கள் இப்போது காட்டப்படவில்லை" : "Alternative spellings are not available yet"}
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {isTamil
          ? "இந்தப் பெயருக்கான திருத்தங்களை எஞ்சின் கண்டறிந்தது, ஆனால் அவை இன்னும் காட்டப்படவில்லை. இது 'உங்கள் பெயர் சரியாக உள்ளது' என்பது அல்ல — மேலே உள்ள பகுப்பாய்வே தற்போதைய முடிவு."
          : "The engine did find corrections for this name, and they are not being shown yet. This is not the same as “your name is fine” — the analysis above is the finding you have."}
      </p>
    </Card>
  );
}

function LegalWarningCard({ warning, lang }: { warning: string; lang: Lang }) {
  const isTamil = lang === "ta";
  return (
    <Card variant="mid" compact style={{ gap: "var(--space-1)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {isTamil ? "மாற்றுவதற்கு முன் படியுங்கள்" : "Read this before changing anything"}
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.6 }}>
        {warning}
      </p>
    </Card>
  );
}

/**
 * One corrected spelling, with everything needed to weigh it.
 *
 * `improvement` is alignment points gained and is always positive — worse
 * spellings are never offered — so it is rendered as the headline number.
 * `delta` is the change in the raw Chaldean total and is signed; it is the
 * arithmetic, not the verdict, so it sits in the detail line. Showing only one
 * of the two makes a correction look either arbitrary or purely numerical.
 */
function VariantRow({
  variant,
  original,
  originalScore,
  lang,
  onSaveSpelling,
}: {
  variant: NameVariant;
  original: NumberReading;
  originalScore: number;
  lang: Lang;
  onSaveSpelling?: (spelling: string) => void;
}) {
  const isTamil = lang === "ta";
  const signedDelta = variant.delta > 0 ? `+${variant.delta}` : `${variant.delta}`;

  return (
    <Card variant="soft" compact style={{ gap: "var(--space-2)" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-strong)" }}>
          {variant.spelling}
        </span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-lg)",
            fontWeight: 600,
            color: "var(--color-text-strong)",
          }}
        >
          {variant.reading.root}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
          {grahaLabel(variant.alignment, lang)}
        </span>
        <Chip tone={verdictTone(variant.alignment.verdict)}>
          {verdictLabel(variant.alignment.verdict, lang)}
        </Chip>
      </div>

      {/* The move, in one line: where it started, where it lands, what it gained. */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap", fontVariantNumeric: "tabular-nums" }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
          {Math.round(originalScore)}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }} aria-hidden="true">
          →
        </span>
        <span style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--color-text-strong)" }}>
          {Math.round(variant.alignment.score)}
        </span>
        <Chip tone="high">{`+${variant.improvement}`}</Chip>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
          {isTamil ? "இணக்க மதிப்பெண்" : "alignment points"}
        </span>
      </div>

      {/* The derivation. Never omitted — it is the reviewable artefact. */}
      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {isTamil ? "மாற்றம்" : "The change"} ·{" "}
        {variant.operations.map((op) => operationLabel(op, lang)).join(isTamil ? ", " : ", ")}
        {" · "}
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {isTamil ? "கல்தேயத் தொகை" : "Chaldean total"} {signedDelta}
        </span>
      </div>

      <LetterDiff original={original} variant={variant.reading} lang={lang} />
      <CompoundLine reading={variant.reading} lang={lang} />
      <WhyThisRating alignment={variant.alignment} lang={lang} />

      {onSaveSpelling ? (
        <div>
          <Button variant="ghost" onClick={() => onSaveSpelling(variant.spelling)}>
            {isTamil ? "பட்டியலில் சேமி" : "Save to shortlist"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
