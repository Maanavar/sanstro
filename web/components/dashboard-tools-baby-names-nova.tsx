"use client";

import { useEffect, useRef, useState } from "react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import { useBirthProfileForm } from "@/hooks/useBirthProfileForm";
import type { CityEntry } from "@/lib/tn-cities";
import {
  getPublicBabyNamesPreview,
  type BabyNameGender,
  type BabyNameMode,
  type BabyNamesResponse,
} from "@vinaadi/shared/api/numerology";
import {
  ADVISE_AGAINST_CHIP,
  CONFIDENCE_CHIP,
  CONFIDENCE_TONE,
  DRAFT_BANNER,
  GROUP_ADVICE,
  GROUP_HEADING,
  MUST_IT_BEGIN_A,
  MUST_IT_BEGIN_Q,
  ORDER_EXPLAINER,
  SCOPE_LABEL,
  SCOPE_ORDER,
  SCOPE_REVIEW_NOTE,
  SCOPE_SUMMARY,
  SHORTLIST_HEADING,
  SHORTLIST_INTRO,
  WITHIN_GROUP_ORDER,
  YOUR_PICK_ALSO_RECOMMENDED,
  YOUR_PICK_CHIP,
  adviseAgainstNote,
  aksharaSubLine,
  contextLine,
  emptyMessage,
  groupByRelation,
  pick,
  relationNote,
  relaxationSentence,
  scopeExplainer,
  shortlistPlaceholder,
} from "@/lib/baby-name-copy";

import {
  BabyNamePaadhamHeader,
  BabyNameRowSummary,
  NumberReadingCard,
  NumerologyError,
  NumerologyLoading,
  ReadingsWithheldNote,
  TraditionNote,
  grahaLabel,
  natureLabel,
  oneLineWhy,
} from "./dashboard-numerology-shared";
import { PlaceCombobox } from "./place-combobox";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import { Field, Input } from "./ui/field";
import { Segmented } from "./ui/segmented";

/**
 * Baby Name Finder — its own Tools-tab tool (`activeTool === "babynames"`),
 * not a view inside the Numerology tool.
 *
 * ## Why a standalone tool and not a 4th Numerology view
 *
 * Numerology's other views (Alignment, Cycle, Names) all read an EXISTING
 * saved chart, hence that tool's "Reading for" family-member picker. Baby
 * naming's whole premise is the opposite: the person it is for — a baby who
 * has not been named yet — does not have a saved profile, and in practice
 * never will before this tool is used. Requiring "create a profile, then
 * find Baby Names inside Numerology" is backwards for that user. This
 * mirrors Jadhagam Generator exactly: its own card, its own birth-detail
 * form, no dependency on anything already saved.
 *
 * Calls `getPublicBabyNamesPreview`, the SAME public, unauthenticated,
 * ephemeral-chart endpoint `/tools/baby-name-finder` (the public marketing
 * page) uses — the only difference is which chrome wraps it. Nothing here
 * is persisted: the chart is computed once, in memory, for this one search.
 *
 * ## Still draft content
 *
 * Being reachable does not mean reviewed. `usable`/`canonVerified` read
 * `false` for every result today, because the nakshatra-pada canon is 0/108
 * astrologer-verified and the name corpus is assistant-drafted with zero
 * rows reviewed — see `numerology_baby_naming`'s comment in
 * `app/services/feature_flags.py`. The banner below is unconditional for
 * exactly the reason `dashboard-numerology-baby-names-nova.tsx` documented:
 * one that only shows on a technicality never shows in practice.
 */

type Props = { lang: Lang };

type GenderFilter = "any" | BabyNameGender;

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

//: How many of a parent's own candidate names can be checked in one search —
//: mirrors `MAX_USER_NAMES` in `app/services/numerology_naming_service.py`.
const MAX_USER_NAMES = 5;
const EMPTY_USER_NAMES: string[] = Array.from({ length: MAX_USER_NAMES }, () => "");

export function DashboardBabyNamesTool({ lang }: Props) {
  const isTamil = lang === "ta";
  const { applyPlaceSelection } = useBirthProfileForm();

  const [form, setForm] = useState<BirthForm>(EMPTY_FORM);
  const [userNames, setUserNames] = useState<string[]>(EMPTY_USER_NAMES);
  const [gender, setGender] = useState<GenderFilter>("any");
  const [mode, setMode] = useState<BabyNameMode>("pada_first");

  const [result, setResult] = useState<BabyNamesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      gender: gender === "any" ? undefined : gender,
      mode,
      userNames: userNames.map((n) => n.trim()).filter(Boolean),
    })
      .then(setResult)
      .catch((err: unknown) => setError(readErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  // Re-run when a filter changes, but only once a search has actually been
  // made. Before this, the filters only wrote state and the displayed result
  // stayed stale until "Find names" was pressed a second time — which nothing
  // on screen asked for, so every one of these controls read as broken. Birth
  // details deliberately do NOT re-run: those are typed a character at a time.
  useEffect(() => {
    if (!hasSearched.current) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, mode]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div>
        <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {isTamil
            ? "பிறந்த விவரங்களை உள்ளிடவும் — சேமிக்கப்பட்ட சுயவிவரம் தேவையில்லை. குழந்தையின் ஜென்ம நட்சத்திரப் பாதம் குறிக்கும் தொடக்க எழுத்தில் தொடங்கும் பெயர்கள் காட்டப்படும்; அவை ஜாதகப் பொருத்தத்தை வைத்து வரிசைப்படுத்தப்படும். பாதம், நட்சத்திரம், ராசி, அல்லது எழுத்து வரம்பே இல்லாமல் — எவ்வளவு தூரம் தேட வேண்டும் என்பதை நீங்களே தேர்ந்தெடுக்கலாம்."
            : "Enter birth details — no saved profile needed. Names beginning with the letter your child's birth natchathiram and paadham call for are shown, ordered by how each name's number sits with this chart. You choose how far to look: this paadham, the whole natchathiram, the rasi, or no letter rule at all."}
        </p>
      </div>

      <Card style={{ gap: "var(--space-4)" }}>
        <div className="nova-grid-2" style={{ gap: "var(--space-3)" }}>
          <Field label={isTamil ? "பெயர் (விருப்பம்)" : "Name (optional)"}>
            <Input
              value={form.displayName}
              onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder={isTamil ? "எ.கா. பிரியாவின் குழந்தை" : "e.g. Baby of Priya"}
              autoComplete="off"
            />
          </Field>
          <Field label={isTamil ? "பிறந்த தேதி" : "Date of birth"}>
            <Input
              type="date"
              value={form.birthDateLocal}
              onChange={(e) => setForm((prev) => ({ ...prev, birthDateLocal: e.target.value }))}
            />
          </Field>
          <Field label={isTamil ? "பிறந்த நேரம்" : "Time of birth"} helper={isTamil ? "தெரியாவிட்டால் விட்டுவிடலாம்" : "Leave blank if unknown"}>
            <Input
              type="time"
              value={form.birthTimeLocal}
              onChange={(e) => setForm((prev) => ({ ...prev, birthTimeLocal: e.target.value }))}
            />
          </Field>
          <Field label={isTamil ? "பிறந்த இடம்" : "Place of birth"}>
            <PlaceCombobox
              value={form.birthPlace}
              onChange={onPlaceChange}
              placeholder={isTamil ? "நகரத்தைத் தட்டச்சு செய்யவும்…" : "Type a city…"}
            />
          </Field>
        </div>

        {/* A parent's own shortlist — checked against the SAME paadham rule
            and chart fit as the recommendations below, and shown at its true
            place in that list (never a separate one). English spelling only. */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <div>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-strong)", fontWeight: 600 }}>
              {pick(SHORTLIST_HEADING, isTamil)}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
              {pick(SHORTLIST_INTRO, isTamil)}
            </p>
          </div>
          <div className="nova-grid-2" style={{ gap: "var(--space-2)" }}>
            {userNames.map((name, i) => (
              <Input
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                value={name}
                onChange={(e) =>
                  setUserNames((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
                placeholder={shortlistPlaceholder(i, isTamil)}
                autoComplete="off"
                maxLength={120}
              />
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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
          {/* Scope sits in the open form, NOT under "More options". It answers
              the question a parent actually arrives with — "does the name have
              to start with that letter?" — and while it was buried, the strict
              rule read as the only rule. The two toggles below it are
              script-evidence plumbing and stay collapsed. */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <Segmented
              ariaLabel={isTamil ? "தொடக்க எழுத்தின் வரம்பு" : "Opening-letter scope"}
              value={mode}
              onChange={setMode}
              options={SCOPE_ORDER.map((option) => ({
                key: option,
                label: pick(SCOPE_LABEL[option], isTamil),
              }))}
            />
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.55 }}>
              {pick(SCOPE_SUMMARY[mode], isTamil)}
            </p>
            <details className="num-calc-details">
              <summary style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", cursor: "pointer" }}>
                {isTamil ? "இந்த வரம்பு ஏன்?" : "Why this option?"}
              </summary>
              <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.6 }}>
                {scopeExplainer(
                  mode,
                  result ? (isTamil ? result.targetRasiTa : result.targetRasiEn) : null,
                  isTamil,
                )}
              </p>
            </details>
          </div>
          {/* A "More options" disclosure with two script-evidence checkboxes
              stood here until 2026-08-02. Cut as dead controls — see the note
              in `web/app/tools/baby-name-finder/BabyNameFinderContent.tsx`
              for the measurement. The scope ladder above is the widening
              control; it moves results in every search. */}
        </div>

        <div>
          <Button variant="primary" onClick={run} disabled={loading || !canSearch}>
            {loading ? (isTamil ? "தேடுகிறது…" : "Searching…") : isTamil ? "பெயர்களைத் தேடு" : "Find names"}
          </Button>
        </div>

        {error ? <NumerologyError lang={lang} message={error} /> : null}
      </Card>

      {loading ? <NumerologyLoading lang={lang} /> : null}

      {result ? (
        <Card style={{ gap: "var(--space-4)" }}>
          {/* The opening letter leads: it is the answer this tradition gives,
              and it is the only thing that makes an empty list intelligible.
              Same header, and the same order, as the public
              /tools/baby-name-finder page — answer first, caveats under it. */}
          <BabyNamePaadhamHeader
            lang={lang}
            contextLine={contextLine(
              isTamil ? result.targetNakshatraTa : result.targetNakshatraEn,
              result.targetPada,
              isTamil ? result.lagnaRasiTa : result.lagnaRasiEn,
              isTamil,
            )}
            aksharaTa={result.targetAksharaTa}
            aksharaEn={result.targetAksharaEn}
            subLine={aksharaSubLine(
              isTamil ? result.targetNakshatraTa : result.targetNakshatraEn,
              result.targetPada,
              isTamil,
            )}
          />

          {/* The question every parent arrives with, directly under the letter
              that prompts it. The QUESTION is the visible summary, so someone
              whose astrologer chose a different letter can see the tool has an
              answer instead of reading the strict list as a verdict on the
              name they were given. */}
          <details className="num-calc-details">
            <summary style={{ fontSize: "var(--text-sm)", color: "var(--color-text-strong)", cursor: "pointer" }}>
              {pick(MUST_IT_BEGIN_Q, isTamil)}
            </summary>
            <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.6 }}>
              {pick(MUST_IT_BEGIN_A, isTamil)}
            </p>
            <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.55 }}>
              {pick(SCOPE_REVIEW_NOTE, isTamil)}
            </p>
          </details>

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
            {/* Unconditional, per the file header — usable/canonVerified read
                false for every result today, and that is the state to design
                for, not an error. */}
            <p style={{ margin: 0 }}>{pick(DRAFT_BANNER, isTamil)}</p>
            {result.candidates.length > 0 ? (
              <p style={{ margin: 0 }}>{pick(ORDER_EXPLAINER, isTamil)}</p>
            ) : null}
            {relaxationSentence(result.relaxationsApplied, isTamil) ? (
              <p style={{ margin: 0 }}>{relaxationSentence(result.relaxationsApplied, isTamil)}</p>
            ) : null}
            {result.candidates.length === 0 ? (
              <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>
                {emptyMessage(
                  result.emptyReasonCode,
                  result.targetAksharaTa,
                  result.targetAksharaEn,
                  isTamil,
                )}
              </p>
            ) : null}
          </div>

          {result.candidates.length === 0 ? null : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              {groupByRelation(result.candidates).map((group) => (
                <div
                  key={group.relation}
                  style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
                >
                  {/* The heading IS the ordering explanation. A flat numbered
                      list asserted one ranking by merit and was twice read as
                      broken when a 59 that opens this paadham's letter sat
                      above an 85 that does not. Under separate headings the
                      question does not arise. */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: "var(--space-2)",
                        flexWrap: "wrap",
                      }}
                    >
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
                          ? ` · ${result.targetAksharaTa}`
                          : null}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
                        {group.items.length}
                        {isTamil ? " பெயர்" : group.items.length === 1 ? " name" : " names"}
                        {" · "}
                        {pick(WITHIN_GROUP_ORDER, isTamil)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "var(--text-xs)",
                        color: "var(--color-muted)",
                        lineHeight: 1.55,
                      }}
                    >
                      {pick(GROUP_ADVICE[group.relation], isTamil)}
                    </p>
                  </div>

                  {group.items.map((c, i) => {
                    const meaning =
                      c.meaningEn || c.meaningTa ? (isTamil ? c.meaningTa : c.meaningEn) : null;
                    // A shortlist name has no Tamil spelling on file
                    // (English-only input) — fall back to the English
                    // spelling as the card's headline rather than showing a
                    // blank label, and drop the redundant "Scored from" line.
                    const displayLabel = c.tamilForm || c.latinSpelling;
                    const scoredFromText = c.tamilForm ? c.latinSpelling : null;
                    const isYourPick = c.source === "user" || c.source === "both";
                    // Which paadham this letter DOES open — still worth
                    // saying per card, because the group heading names the
                    // rule but not the specific star. Null on-paadham.
                    const relation = relationNote(
                      c,
                      isTamil ? result.targetRasiTa : result.targetRasiEn,
                      isTamil,
                    );
                    // The one negative call this tool makes, and only where
                    // the chart actually supports it — see
                    // `should_advise_name_change`.
                    const setAside =
                      c.adviseAgainst && c.alignment
                        ? adviseAgainstNote(
                            grahaLabel(c.alignment, lang),
                            natureLabel(c.alignment.functionalNature, lang),
                            isTamil,
                          )
                        : null;
                    return (
                      <NumberReadingCard
                        key={`${c.latinSpelling}-${i}`}
                        reading={c.reading}
                        label={displayLabel}
                        lang={lang}
                        scoredFrom={scoredFromText}
                        alignment={c.alignment}
                        // The chart behind this search is the CHILD's, not the
                        // reader's — every "your chart" on this card named the
                        // wrong person until 2026-08-02.
                        subject="child"
                        // Cheiro's register is about a number in a 1935 book
                        // and cannot move this score; beside a 0-100 chart
                        // rating it read as a second, contradicting verdict.
                        showCompound={false}
                        // One row per name; the derivation opens on click.
                        collapsedSummary={
                          <BabyNameRowSummary
                            name={displayLabel}
                            lang={lang}
                            score={c.alignment ? Math.round(c.alignment.score) : null}
                            oneLine={c.alignment ? oneLineWhy(c.alignment, lang) : null}
                            chips={
                              <>
                                {isYourPick ? (
                                  <Chip tone="high">
                                    {pick(
                                      c.source === "both"
                                        ? YOUR_PICK_ALSO_RECOMMENDED
                                        : YOUR_PICK_CHIP,
                                      isTamil,
                                    )}
                                  </Chip>
                                ) : null}
                                {c.adviseAgainst ? (
                                  <Chip tone="mid">{pick(ADVISE_AGAINST_CHIP, isTamil)}</Chip>
                                ) : null}
                              </>
                            }
                          />
                        }
                        hint={[relation, meaning, setAside].filter(Boolean).join(" ") || null}
                        scoredFromBadge={
                          <Chip tone={CONFIDENCE_TONE[c.confidence]}>
                            {pick(CONFIDENCE_CHIP[c.confidence], isTamil)}
                          </Chip>
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* With the prose flag off, every card shows a name, a number and a
              graha and no meaning at all. The absence has to account for
              itself or the result just reads as thin. */}
          <ReadingsWithheldNote lang={lang} readingsAvailable={result.readingsAvailable} />

          <TraditionNote lang={lang} traditionEn={result.traditionEn} traditionTa={result.traditionTa} />
        </Card>
      ) : null}
    </div>
  );
}
