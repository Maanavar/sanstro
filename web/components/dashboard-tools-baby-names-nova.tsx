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
  CONFIDENCE_CHIP,
  CONFIDENCE_TONE,
  DRAFT_BANNER,
  MUST_IT_BEGIN_A,
  MUST_IT_BEGIN_Q,
  RELATION_CHIP,
  RELATION_TONE,
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

import {
  BabyNamePaadhamHeader,
  NumberReadingCard,
  NumerologyError,
  NumerologyLoading,
  ReadingsWithheldNote,
  TraditionNote,
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

export function DashboardBabyNamesTool({ lang }: Props) {
  const isTamil = lang === "ta";
  const { applyPlaceSelection } = useBirthProfileForm();

  const [form, setForm] = useState<BirthForm>(EMPTY_FORM);
  const [gender, setGender] = useState<GenderFilter>("any");
  const [mode, setMode] = useState<BabyNameMode>("pada_first");
  const [allowAmbiguous, setAllowAmbiguous] = useState(false);
  const [allowTamilCollapse, setAllowTamilCollapse] = useState(false);

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
      allowAmbiguous,
      allowTamilCollapse,
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
  }, [gender, mode, allowAmbiguous, allowTamilCollapse]);

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

          <details className="num-calc-details">
            <summary style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", cursor: "pointer" }}>
              {isTamil ? "மேலும் விருப்பங்கள்" : "More options"}
            </summary>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingTop: "var(--space-2)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                <input type="checkbox" checked={allowAmbiguous} onChange={(e) => setAllowAmbiguous(e.target.checked)} />
                {isTamil
                  ? "ஏறத்தாழப் பொருந்தும் பெயர்களையும் காட்டு"
                  : "Also show close matches"}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                <input type="checkbox" checked={allowTamilCollapse} onChange={(e) => setAllowTamilCollapse(e.target.checked)} />
                {isTamil
                  ? "ஒரே தமிழ் எழுத்து பல ஒலிகளைக் குறிக்கும்போது, ஒரு எழுத்து முறையில் மட்டும் பொருந்தும் பெயர்களையும் சேர்"
                  : "Where one Tamil letter stands for several sounds, also include names only one spelling confirms"}
              </label>
            </div>
          </details>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {result.candidates.map((c, i) => {
                // Null for an on-paadham name. Once the scope widens, a name
                // from a neighbouring star sits on the same page as one the
                // paadham actually calls for — without this the two are
                // indistinguishable, and the tool would be passing off a name
                // it reached for as one the tradition chose.
                const relation = relationNote(
                  c,
                  isTamil ? result.targetRasiTa : result.targetRasiEn,
                  isTamil,
                );
                const meaning =
                  c.meaningEn || c.meaningTa ? (isTamil ? c.meaningTa : c.meaningEn) : null;
                return (
                  <NumberReadingCard
                    key={`${c.tamilForm}-${i}`}
                    reading={c.reading}
                    label={c.tamilForm}
                    lang={lang}
                    scoredFrom={c.latinSpelling}
                    alignment={c.alignment}
                    hint={[relation, meaning].filter(Boolean).join(" ") || null}
                    trailing={
                      <span style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Chip tone={RELATION_TONE[c.relation]}>
                          {pick(RELATION_CHIP[c.relation], isTamil)}
                        </Chip>
                        <Chip tone={CONFIDENCE_TONE[c.confidence]}>
                          {pick(CONFIDENCE_CHIP[c.confidence], isTamil)}
                        </Chip>
                      </span>
                    }
                  />
                );
              })}
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
