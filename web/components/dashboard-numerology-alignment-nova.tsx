"use client";

import { useCallback, useEffect, useState } from "react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import {
  getFavourableNumbers,
  getFortuneAlignment,
  type FavourableNumbersResponse,
  type FortuneAlignmentResponse,
  type NumberAlignment,
  type NumberReading,
} from "@vinaadi/shared/api/numerology";

import {
  AlignmentRow,
  NumberReadingCard,
  NumerologyError,
  NumerologyLoading,
  NumerologyUnavailable,
  ReadingsWithheldNote,
  TraditionNote,
  VerdictScaleStrip,
  coreNumberGloss,
  coreNumberLabel,
  isNumerologyUnavailable,
  verdictLabel,
  verdictTone,
  type CoreNumberKind,
} from "./dashboard-numerology-shared";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import { Field, Input } from "./ui/field";
import { Kicker } from "./ui/kicker";

/**
 * Fortune Alignment + Favourable Numbers (NUM-30 … NUM-33).
 *
 * The differentiator: these read the native's numbers against the native's own
 * jadhagam. A standalone numerology app can tell you 8 is Saturn; only a chart
 * can tell you whether Saturn is this chart's yogakaraka or its maraka, and that
 * is what the score is a function of. Hence the graha and its functional role
 * lead every row, and the number rides along.
 *
 * ## The organising principle: fixed vs. changeable
 *
 * The panel is three cards, and the first two split the four core numbers on the
 * only distinction a reader can act on:
 *
 *   1. **Fixed at birth** — psychic and destiny. Both are functions of the date
 *      of birth; the chart is a function of date + time + place. The numbers are
 *      therefore derived from a strict *subset* of the chart's own inputs, so
 *      scoring them against it surfaces nothing the chart did not already hold,
 *      and nothing here can ever be acted on. Context, presented as context.
 *   2. **Your name** — the only input a living person can change, and the only
 *      one feeding `nameChangeAdvised`, the single output in this feature that
 *      proposes doing anything. It gets its own card and its own frame.
 *   3. **Favourable numbers** — the chart's own ranking of 1-9, which is the
 *      reference the name section is judged against.
 *
 * This replaced a single card built around a blended `overallScore`. See the
 * block comment above `NameOutcome` for the failure that motivated the split.
 *
 * Every interpretive string on this response (`reasonEn/Ta`,
 * `recommendationEn/Ta`) arrives null while the Tamil corpus is unreviewed.
 * Nothing in this file substitutes for them.
 */

type Props = {
  lang: Lang;
  chartId: string;
};

type Phase = "loading" | "ready" | "error" | "unavailable";

/**
 * The four core numbers, split on the only line that matters to a reader: what
 * they can do something about.
 *
 * `psychic` and `destiny` are functions of the date of birth, and the chart is a
 * function of date + time + place — so the numbers are derived from a strict
 * *subset* of the chart's own inputs. Scoring them against it introduces no
 * information the chart did not already hold, and both sides were fixed at
 * birth, so no reading of them can ever produce an action. They are context.
 *
 * `name` and `namesake` are the only inputs in this entire feature a living
 * person can change, which makes the name question the whole practical payload
 * of numerology for an adult — and `nameChangeAdvised`, which only the name
 * feeds, the only output that proposes doing anything.
 */
const FIXED_KINDS: CoreNumberKind[] = ["psychic", "destiny"];
const NAME_KINDS: CoreNumberKind[] = ["name", "namesake"];

export function NumerologyAlignmentSection({ lang, chartId }: Props) {
  const isTamil = lang === "ta";

  const [ranked, setRanked] = useState<FavourableNumbersResponse | null>(null);
  const [rankedPhase, setRankedPhase] = useState<Phase>("loading");
  const [rankedError, setRankedError] = useState("");

  const [alignment, setAlignment] = useState<FortuneAlignmentResponse | null>(null);
  const [alignPhase, setAlignPhase] = useState<Phase>("loading");
  const [alignError, setAlignError] = useState("");

  const [documentName, setDocumentName] = useState("");
  const [calledName, setCalledName] = useState("");

  // Ranked numbers need no input beyond the chart, so they load unprompted.
  useEffect(() => {
    if (!chartId) return;
    let cancelled = false;
    setRankedPhase("loading");
    getFavourableNumbers(chartId)
      .then((res) => {
        if (cancelled) return;
        setRanked(res);
        setRankedPhase("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isNumerologyUnavailable(err)) {
          setRankedPhase("unavailable");
          return;
        }
        setRankedError(readErrorMessage(err));
        setRankedPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [chartId]);

  const runAlignment = useCallback(
    (payload: { documentName?: string; calledName?: string }) => {
      if (!chartId) return;
      setAlignPhase("loading");
      getFortuneAlignment(chartId, payload)
        .then((res) => {
          setAlignment(res);
          setAlignPhase("ready");
        })
        .catch((err: unknown) => {
          if (isNumerologyUnavailable(err)) {
            setAlignPhase("unavailable");
            return;
          }
          setAlignError(readErrorMessage(err));
          setAlignPhase("error");
        });
    },
    [chartId],
  );

  // The body is optional — with no names the psychic and destiny numbers still
  // align, because both come from the birth date on the chart.
  useEffect(() => {
    runAlignment({});
  }, [runAlignment]);

  const onSubmitNames = () => {
    const trimmedDoc = documentName.trim();
    const trimmedCalled = calledName.trim();
    runAlignment({
      documentName: trimmedDoc || undefined,
      calledName: trimmedCalled || undefined,
    });
  };

  if (rankedPhase === "unavailable" || alignPhase === "unavailable") {
    return <NumerologyUnavailable lang={lang} />;
  }

  const coreReading = (kind: CoreNumberKind): NumberReading | null => {
    if (!alignment) return null;
    return alignment.readings[kind];
  };

  const coreAlignment = (kind: CoreNumberKind): NumberAlignment | null => {
    if (!alignment) return null;
    return alignment[kind];
  };

  const scoredFrom = (kind: CoreNumberKind): string | null => {
    if (!alignment) return null;
    if (kind === "name") return alignment.readings.scoredName;
    if (kind === "namesake") return alignment.readings.scoredNamesake;
    return null;
  };

  const renderCore = (kind: CoreNumberKind) => {
    const reading = coreReading(kind);
    const align = coreAlignment(kind);
    if (!reading || !align) return null;
    return (
      <NumberReadingCard
        key={kind}
        reading={reading}
        label={coreNumberLabel(kind, lang)}
        lang={lang}
        scoredFrom={scoredFrom(kind)}
        alignment={align}
        hint={coreNumberGloss(kind, lang)}
        // The ladder the card's fifth step names its band from. Off the
        // response, never a client-side copy of the cutoffs.
        scale={alignment?.verdictScale}
        trailing={<Chip tone={verdictTone(align.verdict)}>{verdictLabel(align.verdict, lang)}</Chip>}
      />
    );
  };

  const hasAnyName = alignment?.name !== null || alignment?.namesake !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* ── Fixed at birth ────────────────────────────────────────────── */}
      <Card style={{ gap: "var(--space-4)" }}>
        <div>
          <Kicker as="div">{isTamil ? "பிறப்பில் நிர்ணயமானவை" : "Fixed at birth"}</Kicker>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
            {isTamil
              ? "இவ்விரு எண்களும் உங்கள் பிறந்த தேதியிலிருந்து வருகின்றன, ஒவ்வொன்றும் உங்கள் சொந்த ஜாதகத்திற்கு எதிராகப் படிக்கப்படுகிறது. இவை மாறாதவை — செய்வதற்கு இங்கே ஏதுமில்லை. உங்கள் பெயர் எதற்கு எதிராகப் படிக்கப்படுகிறதோ அந்தப் பின்னணி இவை."
              : "These two come from your date of birth, each read against your own jadhagam. They never change, so there is nothing here to act on — they are the backdrop your name is read against."}
          </p>
        </div>

        {alignPhase === "loading" ? <NumerologyLoading lang={lang} /> : null}
        {alignPhase === "error" ? <NumerologyError lang={lang} message={alignError} /> : null}

        {alignment && alignPhase === "ready" ? (
          <div className="nova-grid-2" style={{ gap: "var(--space-3)" }}>
            {FIXED_KINDS.map((kind) => renderCore(kind))}
          </div>
        ) : null}
      </Card>

      {/* ── Your name ─────────────────────────────────────────────────── */}
      <Card style={{ gap: "var(--space-4)" }}>
        <div>
          <Kicker as="div">{isTamil ? "உங்கள் பெயர்" : "Your name"}</Kicker>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
            {isTamil
              ? "இதுவே நீங்கள் மாற்றக்கூடிய ஒரே உள்ளீடு — அதனால் இதற்குத் தனி இடம். மேலே உள்ளவற்றைப் போலவே இதுவும் மதிப்பிடப்படுகிறது: எழுத்துக்கள் ஓர் எண்ணைத் தருகின்றன, அந்த எண்ணுக்கு ஒரு கிரகம் உண்டு, அந்தக் கிரகம் உங்கள் ஜாதகத்தில் வகிக்கும் பொறுப்பே மதிப்பெண்ணை முடிவு செய்கிறது."
              : "This is the only input you can change, which is why it stands on its own. It is scored exactly as above: the letters make a number, the number has a graha, and what sets the score is the job that graha holds in your chart."}
          </p>
        </div>

        {alignment && alignPhase === "ready" ? (
          <>
            {hasAnyName ? (
              <div className="nova-grid-2" style={{ gap: "var(--space-3)" }}>
                {NAME_KINDS.map((kind) => renderCore(kind))}
              </div>
            ) : (
              <Card variant="dashed" compact style={{ gap: "var(--space-1)" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                  {isTamil ? "இன்னும் பெயர் தரப்படவில்லை" : "No name entered yet"}
                </div>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                  {isTamil
                    ? "கீழே ஒரு பெயரைச் சேர்த்தால் அது இந்த ஜாதகத்துடன் எப்படிப் பொருந்துகிறது என்பது இங்கே தெரியும். மேலே உள்ளவை எதுவும் மாறாது — இந்தப் பகுதி மட்டுமே நிரம்பும்."
                    : "Add a name below to see how it sits with this chart. Nothing above changes when you do — only this section fills in."}
                </p>
              </Card>
            )}

            <NameOutcome
              lang={lang}
              hasName={alignment.readings.name !== null}
              nameChangeAdvised={alignment.nameChangeAdvised}
            />
          </>
        ) : null}

        {/* Names are optional and go in the POST body, never a query string, so
            they stay out of access logs. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }}>
          <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
            {isTamil ? "பெயர்களைச் சேர்க்கவும் (விருப்பம்)" : "Add your names (optional)"}
          </div>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.55 }}>
            {isTamil
              ? "ஆவணங்களில் உள்ள ஆங்கில எழுத்துக்கூட்டல் மட்டுமே கணக்கிடப்படும் — கல்தேய மதிப்புகள் லத்தீன் எழுத்துக்களுக்கானவை."
              : "Only the Latin/document spelling is scored — Chaldean values are defined over the Latin alphabet, so a Tamil-script name is refused rather than silently mis-scored."}
          </p>
          <div className="nova-grid-2" style={{ gap: "var(--space-3)" }}>
            <Field label={isTamil ? "ஆவணப் பெயர்" : "Name on documents"}>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder={isTamil ? "ஆதார்/பாஸ்போர்ட்டில் உள்ளபடி" : "As on Aadhaar / passport"}
                autoComplete="off"
              />
            </Field>
            <Field label={isTamil ? "அழைக்கும் பெயர்" : "Name you go by"}>
              <Input
                value={calledName}
                onChange={(e) => setCalledName(e.target.value)}
                placeholder={isTamil ? "தினசரி பயன்படுத்தும் பெயர்" : "The one used day to day"}
                autoComplete="off"
              />
            </Field>
          </div>
          <div>
            <Button variant="primary" onClick={onSubmitNames} disabled={alignPhase === "loading"}>
              {isTamil ? "மீண்டும் கணக்கிடு" : "Recalculate"}
            </Button>
          </div>
        </div>

        {alignment && alignPhase === "ready" ? (
          <>
            <ReadingsWithheldNote lang={lang} readingsAvailable={alignment.readingsAvailable} />
            <div style={{ display: "flex", flexDirection: "row", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
              <TraditionNote lang={lang} traditionEn={alignment.traditionEn} traditionTa={alignment.traditionTa} />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
                {isTamil ? "கணக்கீட்டுப் பதிப்பு" : "Calculation"} · {alignment.calculationVersion}
              </span>
            </div>
          </>
        ) : null}
      </Card>

      {/* ── Favourable numbers ────────────────────────────────────────── */}
      <Card style={{ gap: "var(--space-3)" }}>
        <div>
          <Kicker as="div">{isTamil ? "சாதகமான எண்கள்" : "Favourable numbers"}</Kicker>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
            {isTamil
              ? "ஒன்பது எண்களும் உங்கள் ஜாதகத்திற்கேற்ப வரிசைப்படுத்தப்பட்டவை. வரிசையை முடிவு செய்வது ஒவ்வொரு எண்ணின் கிரகம் உங்கள் ஜாதகத்தில் என்ன செய்கிறது என்பதே — அந்த எண்ணின் பொதுவான புகழ் அல்ல."
              : "All nine numbers ranked for your chart. What sets the order is the job each number's graha holds in your chart — not the number's general reputation."}
          </p>
        </div>

        {rankedPhase === "loading" ? <NumerologyLoading lang={lang} /> : null}
        {rankedPhase === "error" ? <NumerologyError lang={lang} message={rankedError} /> : null}

        {ranked && rankedPhase === "ready" ? (
          <>
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {ranked.favourableNumbers.slice(0, 3).map((n) => (
                <Chip key={n} tone="high">
                  {n}
                </Chip>
              ))}
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", alignSelf: "center" }}>
                {isTamil ? "மேல் மூன்று" : "Top three"}
              </span>
            </div>

            {/* The legend, once for the list rather than nine times inside it.
                Nine rows each carrying a five-step derivation would be a wall;
                what the rows actually lack is the scale their scores are read
                against, and that is one shared fact, not nine. */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-sm)",
                background: "var(--color-surface-soft)",
              }}
            >
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                {isTamil
                  ? "ஒவ்வொரு மதிப்பெண்ணும் இரண்டிலிருந்து வருகிறது: அந்த எண்ணின் கிரகம் உங்கள் ஜாதகத்தில் எந்த இடங்களை ஆள்கிறது என்பது, பிறகு அந்தக் கிரகத்தின் பலம். இடங்கள் தொடக்க மதிப்பை நிர்ணயிக்கின்றன; பலம் அதைச் சிறிது மட்டுமே நகர்த்தும்."
                  : "Each score comes from two things: which houses that number's graha rules in your chart, then how strong that graha is. The houses set the starting value; strength only nudges it."}
              </p>
              <VerdictScaleStrip
                scale={ranked.verdictScale}
                score={ranked.numbers[0]?.score ?? 50}
                lang={lang}
              />
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
                {isTamil ? "அளவுகோல் — குறி உங்கள் சிறந்த எண்ணைக் காட்டுகிறது" : "The scale — the marker is your best-ranked number"}
              </span>
            </div>

            <div>
              {ranked.numbers.map((a, idx) => (
                <AlignmentRow key={a.number} alignment={a} lang={lang} rank={idx + 1} />
              ))}
            </div>

            <ReadingsWithheldNote lang={lang} readingsAvailable={ranked.readingsAvailable} />
            <TraditionNote lang={lang} traditionEn={ranked.traditionEn} traditionTa={ranked.traditionTa} />
          </>
        ) : null}
      </Card>
    </div>
  );
}

/*
 * Why there is no longer a headline `overallScore` on this panel.
 *
 * `align_profile` still computes one and the response still carries it — this is
 * a presentation decision, and any client wanting the blend can still read it.
 * It is not rendered here because it answers no question a reader has:
 *
 *   - As a description of what is fixed, it is polluted by a name the reader
 *     could change tomorrow.
 *   - As a decision about the name, it is diluted by two numbers nobody can
 *     change — which outweigh the name 0.55 to 0.35.
 *
 * The failure was observed, not theorised. A real chart scored the document name
 * 38 (Venus, maraka lord here — genuinely out of step) and the headline still
 * read 67 "Aligned", because two unchangeable numbers averaged the one real
 * finding into reassurance. A score that can bury its own only actionable input
 * is worse than no score.
 *
 * The same defect, in its sharper form, was live in the backend and is fixed in
 * this change: `name_harmony_from_alignment` shipped `overall_score` under a
 * label reading "name harmony", beside a `verdict` taken from the name itself —
 * two different numbers under one name. See `numerology_compatibility.py`.
 *
 * If a headline is ever wanted again, it belongs *inside* one of the two
 * sections, never across them.
 */

/**
 * `nameChangeAdvised` gets its own block because **both outcomes are the
 * reading**, and the false one is the answer a standalone numerology app cannot
 * produce: "the graha behind your name is functionally benefic *in your chart*,
 * so there is nothing to correct." That deserves to be as visible as the other
 * branch — a numerology product that can only ever say "change your name" is
 * selling anxiety.
 *
 * The true branch stops at the finding. Corrected spellings are withheld
 * wholesale while the corpus is dark: doctrine §9.4 requires the legal-
 * consequence warning alongside any recommendation, and that warning has not
 * cleared Tamil review. Offering alternatives without it is what the gate
 * exists to prevent.
 *
 * What that branch must NOT do is report the gate itself. It previously said the
 * warning "has not cleared Tamil review, and a recommendation is not shown
 * without it" — an accurate description of our release process and of no use
 * whatsoever to a parent deciding about a child's name. The gate withholds
 * *corrected spellings*; it does not withhold the two things a reader actually
 * needs at this moment, both of which are ours to say plainly:
 *
 *   1. one number is not a verdict, and a whole chart is read by a person;
 *   2. what a document name change actually costs administratively.
 *
 * (2) is safe under this file's own rule — it is a fact about Indian paperwork,
 * identical for every user, so it cannot be the withheld per-person corpus
 * leaking. The backend holds the same sentence in `_recommendation_en`, where
 * the prose gate keeps it dark; stating it here restores the caution without
 * touching the recommendation the gate exists to hold back.
 */
function NameOutcome({
  lang,
  hasName,
  nameChangeAdvised,
}: {
  lang: Lang;
  hasName: boolean;
  nameChangeAdvised: boolean;
}) {
  const isTamil = lang === "ta";
  if (!hasName) return null;

  if (!nameChangeAdvised) {
    return (
      <Card variant="high" compact style={{ gap: "var(--space-1)" }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
          {isTamil ? "உங்கள் பெயர் உங்கள் ஜாதகத்திற்குப் பொருந்துகிறது" : "Your name already suits your chart"}
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {isTamil
            ? "இந்தப் பெயரின் எண்ணுக்குரிய கிரகம் உங்கள் ஜாதகத்தில் ஆதரவான பங்கு வகிக்கிறது. திருத்த வேண்டியது எதுவும் இல்லை."
            : "The planet behind this name's number holds a supportive role in your chart. There is nothing here to correct."}
        </p>
      </Card>
    );
  }

  return (
    <Card variant="mid" compact style={{ gap: "var(--space-1)" }}>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
        {isTamil ? "இந்தப் பெயரை மாற்ற வேண்டுமா?" : "Should you change this name?"}
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {isTamil
          ? "இந்த ஒரு கண்டுபிடிப்பை மட்டும் வைத்து அல்ல. பெயர் எண் என்பது பல கூறுகளில் ஒன்று மட்டுமே — முழு ஜாதகத்தையும் படிக்கக்கூடிய ஜோதிடரிடம் இதைப் பேசுவதே சரியான இடம். மாற்று எழுத்துக்கூட்டல்களை நாங்கள் இன்னும் பரிந்துரைக்கவில்லை."
          : "Not on this one finding. A name number is one input among several, and an astrologer reading the whole chart is the right place to weigh it. We do not suggest alternative spellings yet."}
      </p>
      {/* The practical cost, stated whether or not anyone recommends a change.
          It is what makes this a decision rather than a score. */}
      <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {isTamil
          ? "நடைமுறையில்: ஆவணங்களில் பெயரை மாற்றினால் ஆதார், வங்கி KYC, கடவுச்சீட்டு மற்றும் அவற்றைச் சார்ந்த ஒவ்வொரு சான்றிதழையும் மீண்டும் புதுப்பிக்க வேண்டியிருக்கும்."
          : "In practice: changing a name on documents means redoing Aadhaar, bank KYC, passport and every certificate that follows from them."}
      </p>
    </Card>
  );
}
