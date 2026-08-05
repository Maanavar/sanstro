"use client";

import { useCallback, useEffect, useState } from "react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import {
  getChartBabyNames,
  type BabyNameGender,
  type BabyNameMode,
  type BabyNamesResponse,
} from "@vinaadi/shared/api/numerology";
import {
  ADVISE_AGAINST_CHIP,
  BETTER_SPELLINGS_HEADING,
  BETTER_SPELLINGS_INTRO,
  CONFIDENCE_CHIP,
  CONFIDENCE_TONE,
  DRAFT_BANNER,
  GROUP_ADVICE,
  GROUP_HEADING,
  ORDER_EXPLAINER,
  WITHIN_GROUP_ORDER,
  adviseAgainstNote,
  aksharaSubLine,
  contextLine,
  emptyMessage,
  fullNameGapNote,
  groupByRelation,
  pick,
  spellingOperations,
  relaxationSentence,
} from "@/lib/baby-name-copy";

import {
  BabyNamePaadhamHeader,
  BabyNameRowSummary,
  BetterSpellingsBlock,
  FullNameReadingLine,
  NumberReadingCard,
  NumerologyError,
  NumerologyLoading,
  NumerologyUnavailable,
  ReadingsWithheldNote,
  TraditionNote,
  grahaLabel,
  isNumerologyUnavailable,
  natureLabel,
  oneLineWhy,
} from "./dashboard-numerology-shared";
import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import { Kicker } from "./ui/kicker";
import { Segmented } from "./ui/segmented";

/**
 * The Baby Names view (NUM-50/51/52) — chart-aware pada matching, ranked by
 * Fortune Alignment within each pada-confidence tier.
 *
 * ## Two draft dependencies, both surfaced permanently
 *
 * Unlike every other view in `dashboard-numerology-panel-nova.tsx`, this one
 * cannot rely on `readingsAvailable` alone to say "not ready" — the pada
 * canon (`app.data.nakshatra_pada_akshara`, 0/108 verified) and the name
 * corpus (`app.data.tamil_name_corpus`, assistant-drafted, 0 rows reviewed)
 * are BOTH unreviewed, and `response.usable` reflects that. Because every row
 * in the canon carries `verified=False` today, `usable` reads `false` for
 * every response this view can currently receive — that is the expected
 * state to design for, not an error, so the draft banner below is
 * unconditional rather than gated on `usable`.
 *
 * Behind `numerology_baby_naming`, a second flag on top of `numerology_engine`
 * — see that flag's comment in `app/services/feature_flags.py`.
 */

type Props = {
  lang: Lang;
  chartId: string;
};

type GenderFilter = "any" | BabyNameGender;

export function NumerologyBabyNamesSection({ lang, chartId }: Props) {
  const isTamil = lang === "ta";

  const [gender, setGender] = useState<GenderFilter>("any");
  const [mode, setMode] = useState<BabyNameMode>("pada_first");

  const [data, setData] = useState<BabyNamesResponse | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "unavailable">("loading");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!chartId) return;
    setPhase("loading");
    getChartBabyNames(chartId, {
      gender: gender === "any" ? undefined : gender,
      mode,
    })
      .then((res) => {
        setData(res);
        setPhase("ready");
      })
      .catch((err: unknown) => {
        if (isNumerologyUnavailable(err)) {
          setPhase("unavailable");
          return;
        }
        setError(readErrorMessage(err));
        setPhase("error");
      });
  }, [chartId, gender, mode]);

  useEffect(() => {
    load();
  }, [load]);

  if (phase === "unavailable") return <NumerologyUnavailable lang={lang} />;

  return (
    <Card style={{ gap: "var(--space-4)" }}>
      <div>
        <Kicker as="div">{isTamil ? "பெயர் தேடல் — வரைவு" : "Baby names — draft"}</Kicker>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {isTamil
            ? "பிறந்த நேரத்தில் சந்திரன் நின்ற நட்சத்திரப் பாதம் குறிக்கும் தொடக்க எழுத்தில் தொடங்கும் பெயர்கள் மட்டுமே காட்டப்படுகின்றன; அவற்றுக்குள் மட்டுமே எண் கணிதம் வரிசைப்படுத்துகிறது. ஒரு எண் எந்த நிலையிலும் பாத எழுத்தை மீறாது."
            : "Only names beginning with the letter the birth paadham calls for — the paadham the Moon stood in — are shown at all; the numerology then orders that list. A number never overrides the paadham letter."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <Segmented
          ariaLabel={isTamil ? "பாலினம்" : "Gender"}
          value={gender}
          onChange={setGender}
          options={[
            { key: "any", label: isTamil ? "பொது" : "Any" },
            { key: "m", label: isTamil ? "ஆண்" : "Boy" },
            { key: "f", label: isTamil ? "பெண்" : "Girl" },
          ]}
        />
        <details className="num-calc-details">
          <summary style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", cursor: "pointer" }}>
            {isTamil ? "மேலும் விருப்பங்கள்" : "More options"}
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingTop: "var(--space-2)" }}>
            <Segmented
              ariaLabel={isTamil ? "பொருத்த முறை" : "Matching mode"}
              value={mode}
              onChange={setMode}
              options={[
                {
                  key: "pada_first",
                  label: isTamil ? "இந்தப் பாதம் மட்டும்" : "This paadham only",
                },
                {
                  key: "pada_weighted",
                  label: isTamil ? "மற்ற பாதங்களும்" : "Allow other paadhams",
                },
              ]}
            />
            {/* Two script-evidence checkboxes stood here until 2026-08-02.
                Cut as dead controls — see the note in
                `web/app/tools/baby-name-finder/BabyNameFinderContent.tsx`. */}
          </div>
        </details>
      </div>

      {phase === "loading" ? <NumerologyLoading lang={lang} /> : null}
      {phase === "error" ? <NumerologyError lang={lang} message={error} /> : null}

      {data && phase === "ready" ? (
        <>
          {/* Same header the public /tools/baby-name-finder page uses. */}
          <BabyNamePaadhamHeader
            lang={lang}
            contextLine={contextLine(
              isTamil ? data.targetNakshatraTa : data.targetNakshatraEn,
              data.targetPada,
              isTamil ? data.lagnaRasiTa : data.lagnaRasiEn,
              isTamil,
            )}
            aksharaTa={data.targetAksharaTa}
            aksharaEn={data.targetAksharaEn}
            subLine={aksharaSubLine(
              isTamil ? data.targetNakshatraTa : data.targetNakshatraEn,
              data.targetPada,
              isTamil,
            )}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
              padding: "var(--space-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "var(--text-xs)",
              color: "var(--color-muted)",
              lineHeight: 1.55,
            }}
          >
            {/* Unconditional, per the file header — usable reads false for
                every response today, and that is the state to design for. */}
            <p style={{ margin: 0 }}>{pick(DRAFT_BANNER, isTamil)}</p>
            {data.candidates.length > 0 ? (
              <p style={{ margin: 0 }}>{pick(ORDER_EXPLAINER, isTamil)}</p>
            ) : null}
            {relaxationSentence(data.relaxationsApplied, isTamil) ? (
              <p style={{ margin: 0 }}>{relaxationSentence(data.relaxationsApplied, isTamil)}</p>
            ) : null}
            {data.candidates.length === 0 ? (
              <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
                {emptyMessage(data.emptyReasonCode, data.targetAksharaTa, data.targetAksharaEn, isTamil)}
              </p>
            ) : null}
          </div>

          {data.candidates.length === 0 ? null : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {groupByRelation(data.candidates).map((group) => (
                <div
                  key={group.relation}
                  style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
                >
                  {/* Heading per letter rule, in doctrine D2 order — the
                      ordering explanation, made structural. Kept identical to
                      `dashboard-tools-baby-names-nova.tsx`; these two surfaces
                      have drifted apart before. */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "var(--text-xs)",
                          fontWeight: 700,
                          color: "var(--color-text-strong)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {pick(GROUP_HEADING[group.relation], isTamil)}
                        {group.relation === "on_paadham"
                          ? ` · ${isTamil ? data.targetAksharaTa : data.targetAksharaEn}`
                          : null}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
                        {group.items.length}
                        {isTamil ? " பெயர்" : group.items.length === 1 ? " name" : " names"}
                        {" · "}
                        {pick(WITHIN_GROUP_ORDER, isTamil)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {pick(GROUP_ADVICE[group.relation], isTamil)}
                    </p>
                  </div>

                  {group.items.map((c, i) => (
                <NumberReadingCard
                  key={`${c.latinSpelling}-${i}`}
                  reading={c.reading}
                  // Latin spelling as the headline, one script for the whole
                  // list — see the note in `dashboard-tools-baby-names-nova.tsx`.
                  // It is also the exact string scored, so "Scored from" goes.
                  label={c.latinSpelling}
                  lang={lang}
                  alignment={c.alignment}
                  // This chart is the CHILD's, not the reader's; Cheiro's
                  // compound register beside a 0-100 chart score read as a
                  // contradicting second verdict; and one collapsed row per
                  // name replaces a full derivation per name.
                  subject="child"
                  showCompound={false}
                  collapsedSummary={
                    <BabyNameRowSummary
                      name={c.latinSpelling}
                      lang={lang}
                      score={c.alignment ? Math.round(c.alignment.score) : null}
                      oneLine={c.alignment ? oneLineWhy(c.alignment, lang) : null}
                      chips={
                        c.adviseAgainst ? (
                          <Chip tone="mid">{pick(ADVISE_AGAINST_CHIP, isTamil)}</Chip>
                        ) : null
                      }
                    />
                  }
                  hint={
                    [
                      c.meaningEn || c.meaningTa ? (isTamil ? c.meaningTa : c.meaningEn) : null,
                      c.adviseAgainst && c.alignment
                        ? adviseAgainstNote(
                            c.latinSpelling,
                            grahaLabel(c.alignment, lang),
                            natureLabel(c.alignment.functionalNature, lang),
                            isTamil,
                          )
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" ") || null
                  }
                  // Kept in step with `dashboard-tools-baby-names-nova.tsx`.
                  // This view has no family-name input of its own yet, so the
                  // fields are simply absent and this renders nothing.
                  footer={
                    <>
                      <BetterSpellingsBlock
                        spellings={c.betterSpellings}
                        lang={lang}
                        heading={pick(BETTER_SPELLINGS_HEADING, isTamil)}
                        intro={pick(BETTER_SPELLINGS_INTRO, isTamil)}
                        describeOperations={(ops) => spellingOperations(ops, isTamil)}
                      />
                      {c.fullNameSpelling && c.fullNameReading ? (
                        <FullNameReadingLine
                        spelling={c.fullNameSpelling}
                        reading={c.fullNameReading}
                        alignment={c.fullNameAlignment}
                        lang={lang}
                        note={
                          c.alignment && c.fullNameAlignment
                            ? fullNameGapNote(c.alignment.score, c.fullNameAlignment.score, isTamil)
                            : null
                        }
                        />
                      ) : null}
                    </>
                  }
                  scoredFromBadge={
                    <Chip tone={CONFIDENCE_TONE[c.confidence]}>
                      {pick(CONFIDENCE_CHIP[c.confidence], isTamil)}
                    </Chip>
                  }
                />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Every candidate's meaning is routed through the same
              `reviewed_prose` gate as the rest of numerology, so with the flag
              off each card shows a name, a number and a graha and NO meaning.
              Saying nothing about that is most of why the results read as
              empty — the absence has to account for itself. */}
          <ReadingsWithheldNote lang={lang} readingsAvailable={data.readingsAvailable} />

          <TraditionNote lang={lang} traditionEn={data.traditionEn} traditionTa={data.traditionTa} />
        </>
      ) : null}
    </Card>
  );
}
