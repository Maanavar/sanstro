"use client";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { readErrorMessage } from "@/lib/api";
import { addDays, formatClockLabel, formatDateLabel, todayIso } from "@/lib/format";
import {
  getNumerologyLuckyDates,
  getNumerologyMarriageDates,
  type DateNumerology,
  type LuckyDate,
  type LuckyDatesResponse,
  type MarriageDatesResponse,
  type NumerologyNaalMatch,
} from "@vinaadi/shared/api/numerology";
import type { BiText } from "@vinaadi/shared/types";

import {
  NumerologyError,
  NumerologyLoading,
  NumerologyUnavailable,
  ReadingsWithheldNote,
  TraditionNote,
  isNumerologyUnavailable,
} from "./dashboard-numerology-shared";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Chip } from "./ui/chip";
import { Field, Input, Select } from "./ui/field";
import { Kicker } from "./ui/kicker";
import { Segmented } from "./ui/segmented";

/**
 * Lucky dates (NUM-42/44) and marriage dates (NUM-43).
 *
 * These are the two surfaces where the "a number never overrides a graha" rule
 * is visible rather than merely asserted, so the layout is built around showing
 * it:
 *
 * - The **astrology score is rendered first and unmodified**. `slot.score` and
 *   `match.matchScore` are the muhurta and almanac engines' own verdicts; this
 *   layer never overwrites them, and the difference against `adjustedScore` is
 *   exactly what the numerology moved. Both are shown so the move is auditable.
 * - `adjustment` is bounded to ±8, and **`clampedByAstrology` means a positive
 *   adjustment was withheld** because the panchangam flagged the date.
 *   Numerology may lower a flagged date; it can never lift one. That gets its
 *   own line, because a silently-dropped lift is indistinguishable from no lift.
 * - The naal list never reorders across the recommended boundary — numerology
 *   sorts *within* the almanac's recommended set and *within* the rest.
 *
 * The bilingual prose on these rows (`panchangamSupport`, `dashaSupport`,
 * `cautions`, `reasons`, tara names) belongs to the muhurta and muhurtham-naal
 * engines, whose copy is reviewed and already live elsewhere in the app. This
 * layer only passes it through. The numerology's own `noteEn`/`noteTa` are the
 * withheld ones, and they arrive null.
 */

type Props = {
  lang: Lang;
  chartId: string;
};

type DatesView = "activity" | "marriage";

/** Same seven the muhurta picker offers. Marriage has its own almanac surface. */
const ACTIVITIES: Array<{ id: string; en: string; ta: string }> = [
  { id: "JOB_START", en: "Job start / New role", ta: "வேலை தொடக்கம் / புதிய பதவி" },
  { id: "EXAM", en: "Exam / Course start", ta: "தேர்வு / படிப்பு தொடக்கம்" },
  { id: "TRAVEL", en: "Travel / Journey start", ta: "பயண தொடக்கம்" },
  { id: "INVESTMENT", en: "Investment / Financial agreement", ta: "முதலீடு / நிதி ஒப்பந்தம்" },
  { id: "MEDICAL", en: "Medical procedure / Surgery", ta: "மருத்துவ சிகிச்சை / அறுவை" },
  { id: "PURCHASE", en: "Property or major purchase", ta: "சொத்து / பெரிய கொள்முதல்" },
  { id: "SPIRITUAL", en: "Grihapravesh / Religious event", ta: "இல்லப்பிரவேசம் / மத நிகழ்வு" },
];

function bi(text: BiText, lang: Lang): string {
  return lang === "ta" ? text.ta : text.en;
}

export function NumerologyDatesSection({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [view, setView] = useState<DatesView>("activity");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Segmented
        ariaLabel={isTamil ? "தேதி பார்வைகள்" : "Date views"}
        value={view}
        onChange={setView}
        options={[
          { key: "activity", label: isTamil ? "செயல் தேதிகள்" : "Activity dates" },
          { key: "marriage", label: isTamil ? "திருமண நாட்கள்" : "Marriage naals" },
        ]}
      />
      {view === "activity" ? (
        <LuckyDatesPanel lang={lang} chartId={chartId} />
      ) : (
        <MarriageDatesPanel lang={lang} chartId={chartId} />
      )}
    </div>
  );
}

/* ── Activity dates ──────────────────────────────────────────────────────── */

function LuckyDatesPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [activity, setActivity] = useState(ACTIVITIES[0].id);
  const [dateFrom, setDateFrom] = useState(todayIso());
  const [dateTo, setDateTo] = useState(addDays(todayIso(), 30));
  const [data, setData] = useState<LuckyDatesResponse | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error" | "unavailable">("idle");
  const [error, setError] = useState("");

  const run = () => {
    setPhase("loading");
    getNumerologyLuckyDates(chartId, activity, dateFrom, dateTo)
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
  };

  if (phase === "unavailable") return <NumerologyUnavailable lang={lang} />;

  return (
    <Card style={{ gap: "var(--space-4)" }}>
      <div>
        <Kicker as="div">{isTamil ? "செயலுக்கான தேதிகள்" : "Dates for an activity"}</Kicker>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {isTamil
            ? "முகூர்த்த எஞ்சின் தந்த அதே நேரங்கள் — எதுவும் சேர்க்கப்படவில்லை, நீக்கப்படவில்லை. எண் கணிதம் வரிசையை மட்டுமே மாற்றுகிறது."
            : "The same slots the muhurta engine returned — nothing added, nothing removed. Numerology only reorders them."}
        </p>
      </div>

      <div className="nova-grid-3" style={{ gap: "var(--space-3)" }}>
        <Field label={isTamil ? "பயன்பாடு" : "Activity"}>
          <Select value={activity} onChange={(e) => setActivity(e.target.value)}>
            {ACTIVITIES.map((a) => (
              <option key={a.id} value={a.id}>
                {isTamil ? a.ta : a.en}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={isTamil ? "முதல்" : "From"}>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </Field>
        <Field label={isTamil ? "வரை" : "To"}>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </Field>
      </div>

      <div>
        <Button variant="primary" onClick={run} disabled={phase === "loading" || !chartId}>
          {phase === "loading" ? (isTamil ? "தேடுகிறது…" : "Searching…") : isTamil ? "தேதிகளைக் காட்டு" : "Find dates"}
        </Button>
      </div>

      {phase === "loading" ? <NumerologyLoading lang={lang} /> : null}
      {phase === "error" ? <NumerologyError lang={lang} message={error} /> : null}

      {data && phase === "ready" ? (
        <>
          <FavourableNumbersStrip lang={lang} numbers={data.favourableNumbers} />

          {data.dates.length === 0 ? (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
              {isTamil ? "இந்த வரம்பில் முகூர்த்த நேரம் எதுவும் இல்லை." : "The muhurta engine found no slots in this range."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.dates.map((row, idx) => (
                <LuckyDateRow key={`${row.slot.date}-${idx}`} row={row} lang={lang} />
              ))}
            </div>
          )}

          <ReadingsWithheldNote lang={lang} readingsAvailable={data.readingsAvailable} />
          <TraditionNote lang={lang} traditionEn={data.traditionEn} traditionTa={data.traditionTa} />
        </>
      ) : null}
    </Card>
  );
}

function LuckyDateRow({ row, lang }: { row: LuckyDate; lang: Lang }) {
  const isTamil = lang === "ta";
  const { slot, numerology, adjustedScore } = row;

  return (
    <Card variant="soft" compact style={{ gap: "var(--space-2)" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>
          {formatDateLabel(slot.date)}
        </span>
        {slot.tamilDate ? (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-accent)" }}>{bi(slot.tamilDate, lang)}</span>
        ) : null}
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
          {formatClockLabel(slot.timeStart)} – {formatClockLabel(slot.timeEnd)}
        </span>
      </div>

      {/* Astrology first and unaltered; the numerology-adjusted figure sits
          beside it as a second number, never in place of it. */}
      <div style={{ display: "flex", flexDirection: "row", gap: "var(--space-5)", flexWrap: "wrap" }}>
        <ScorePair
          label={isTamil ? "முகூர்த்த மதிப்பெண்" : "Muhurta score"}
          value={Math.round(slot.score)}
          emphasis
        />
        <ScorePair
          label={isTamil ? "வரிசைப்படுத்தப் பயன்பட்டது" : "Used for ranking"}
          value={Math.round(adjustedScore)}
        />
      </div>

      {/* The muhurta engine's own reviewed copy, passed straight through. */}
      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.55 }}>
        {bi(slot.panchangamSupport, lang)}
      </div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {bi(slot.dashaSupport, lang)}
      </div>
      {slot.cautions.length > 0 ? (
        <ul style={{ margin: 0, paddingInlineStart: "1.1em", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
          {slot.cautions.map((c, i) => (
            <li key={i}>{bi(c, lang)}</li>
          ))}
        </ul>
      ) : null}

      <NumerologyDelta numerology={numerology} lang={lang} />
    </Card>
  );
}

/* ── Marriage naals ──────────────────────────────────────────────────────── */

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2];

function MarriageDatesPanel({ lang, chartId }: Props) {
  const isTamil = lang === "ta";
  const [year, setYear] = useState(CURRENT_YEAR + 1);
  const [recommendedOnly, setRecommendedOnly] = useState(true);
  const [data, setData] = useState<MarriageDatesResponse | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error" | "unavailable">("idle");
  const [error, setError] = useState("");

  const run = () => {
    setPhase("loading");
    getNumerologyMarriageDates(chartId, year, recommendedOnly)
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
  };

  if (phase === "unavailable") return <NumerologyUnavailable lang={lang} />;

  return (
    <Card style={{ gap: "var(--space-4)" }}>
      <div>
        <Kicker as="div">{isTamil ? "திருமண முகூர்த்த நாட்கள்" : "Marriage muhurtham naals"}</Kicker>
        <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
          {isTamil
            ? "பஞ்சாங்க முகூர்த்த நாட்கள். தார பலம் மற்றும் சந்திராஷ்டமம் பஞ்சாங்கத்தினுடையது — எண் கணிதம் பரிந்துரைக்கப்பட்ட நாட்களுக்குள்ளும், மற்றவற்றுக்குள்ளும் மட்டுமே வரிசைப்படுத்தும், இரண்டையும் கடந்து அல்ல."
            : "The almanac's own muhurtham sheet. Tara Bala and chandrashtama are the almanac's call — numerology reorders within the recommended set and within the rest, never across that line."}
        </p>
      </div>

      <div className="nova-grid-3" style={{ gap: "var(--space-3)", alignItems: "end" }}>
        <Field label={isTamil ? "ஆண்டு" : "Year"}>
          <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
        <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
          <input
            type="checkbox"
            checked={recommendedOnly}
            onChange={(e) => setRecommendedOnly(e.target.checked)}
          />
          {isTamil ? "பரிந்துரைக்கப்பட்டவை மட்டும்" : "Recommended only"}
        </label>
        <div>
          <Button variant="primary" onClick={run} disabled={phase === "loading" || !chartId}>
            {phase === "loading" ? (isTamil ? "ஏற்றுகிறது…" : "Loading…") : isTamil ? "நாட்களைக் காட்டு" : "Show naals"}
          </Button>
        </div>
      </div>

      {phase === "loading" ? <NumerologyLoading lang={lang} /> : null}
      {phase === "error" ? <NumerologyError lang={lang} message={error} /> : null}

      {data && phase === "ready" ? (
        <>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", lineHeight: 1.6 }}>
            {isTamil ? "ஜென்ம நட்சத்திரம்" : "Janma nakshatra"} · {bi(data.context.janmaNakshatra, lang)}
            {" · "}
            {isTamil
              ? `${data.context.totalCount}-இல் ${data.context.recommendedCount} பரிந்துரைக்கப்பட்டவை`
              : `${data.context.recommendedCount} recommended of ${data.context.totalCount}`}
            {" · "}
            {data.context.source}
          </div>

          <FavourableNumbersStrip lang={lang} numbers={data.favourableNumbers} />

          {data.matches.length === 0 ? (
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
              {isTamil ? "இந்த ஆண்டுக்கு நாட்கள் எதுவும் இல்லை." : "No naals for this year."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {data.matches.map((row) => (
                <MarriageNaalRow key={row.match.naal.date} row={row} lang={lang} />
              ))}
            </div>
          )}

          <ReadingsWithheldNote lang={lang} readingsAvailable={data.readingsAvailable} />
          <TraditionNote lang={lang} traditionEn={data.traditionEn} traditionTa={data.traditionTa} />
        </>
      ) : null}
    </Card>
  );
}

function MarriageNaalRow({ row, lang }: { row: NumerologyNaalMatch; lang: Lang }) {
  const isTamil = lang === "ta";
  const { match, numerology, adjustedScore } = row;
  const { naal } = match;

  return (
    <Card variant="soft" compact style={{ gap: "var(--space-2)" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)" }}>
          {formatDateLabel(naal.date)}
        </span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{bi(naal.weekday, lang)}</span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-accent)" }}>
          {bi(naal.tamilMonth, lang)} {naal.tamilDay}
        </span>
        {/* The almanac's verdict, not ours — and it leads. */}
        {match.isRecommended ? (
          <Chip tone="high">{isTamil ? "பரிந்துரை" : "Recommended"}</Chip>
        ) : (
          <Chip tone="neutral">{isTamil ? "பரிந்துரை இல்லை" : "Not recommended"}</Chip>
        )}
        {match.isChandrashtama ? <Chip tone="low">{isTamil ? "சந்திராஷ்டமம்" : "Chandrashtama"}</Chip> : null}
      </div>

      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
        {bi(naal.nakshatra, lang)} · {bi(naal.pirai, lang)} ·{" "}
        {isTamil ? "தாரை" : "Tara"} {match.taraNumber} {bi(match.taraName, lang)}
      </div>

      {naal.nallaNeram.length > 0 ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
          {isTamil ? "நல்ல நேரம்" : "Nalla neram"} ·{" "}
          {naal.nallaNeram.map((w) => `${w.start}–${w.end} ${w.period}`).join(", ")}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "row", gap: "var(--space-5)", flexWrap: "wrap" }}>
        <ScorePair label={isTamil ? "பொருத்த மதிப்பெண்" : "Match score"} value={Math.round(match.matchScore)} emphasis />
        <ScorePair label={isTamil ? "வரிசைப்படுத்தப் பயன்பட்டது" : "Used for ranking"} value={Math.round(adjustedScore)} />
      </div>

      {match.reasons.length > 0 ? (
        <ul style={{ margin: 0, paddingInlineStart: "1.1em", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
          {match.reasons.map((r, i) => (
            <li key={i}>{bi(r, lang)}</li>
          ))}
        </ul>
      ) : null}

      <NumerologyDelta numerology={numerology} lang={lang} />
    </Card>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

function ScorePair({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{label}</span>
      <span
        style={{
          fontSize: emphasis ? "var(--text-lg)" : "var(--text-base)",
          fontWeight: emphasis ? 700 : 600,
          fontVariantNumeric: "tabular-nums",
          color: emphasis ? "var(--color-text-strong)" : "var(--color-text)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * What the numerology contributed to this row, stated as a signed number rather
 * than folded invisibly into a score. `clampedByAstrology` is the interesting
 * case and gets a sentence: the engine had a lift to give and the panchangam's
 * flag on the date took it away.
 */
function NumerologyDelta({ numerology, lang }: { numerology: DateNumerology; lang: Lang }) {
  const isTamil = lang === "ta";
  const sign = numerology.adjustment > 0 ? "+" : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-2)" }}>
      <div style={{ display: "flex", flexDirection: "row", gap: "var(--space-3)", flexWrap: "wrap", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
        <span>
          {isTamil ? "தேதி எண்" : "Date number"} · {numerology.reading.root}{" "}
          ({isTamil ? numerology.reading.grahaTa : numerology.reading.grahaEn})
        </span>
        {numerology.personalDay ? (
          <span>
            {isTamil ? "தனிப்பட்ட நாள்" : "Personal day"} · {numerology.personalDay.root}
          </span>
        ) : null}
        {numerology.favourabilityRank !== null ? (
          <span>
            {isTamil ? "உங்கள் வரிசையில்" : "Your rank"} · {numerology.favourabilityRank}/9
          </span>
        ) : null}
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {isTamil ? "எண் சரிசெய்தல்" : "Numerology adjustment"} · {sign}
          {numerology.adjustment}
        </span>
      </div>

      {numerology.clampedByAstrology ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
          {isTamil
            ? "பஞ்சாங்கம் இந்த நாளைக் குறித்திருப்பதால் எண் கணிதத்தின் உயர்வு தடுக்கப்பட்டது. எண் ஒரு நாளைத் தாழ்த்தலாம், உயர்த்த முடியாது."
            : "The panchangam flagged this date, so the numerology's lift was withheld. A number may lower a flagged date; it can never lift one."}
        </div>
      ) : null}
    </div>
  );
}

function FavourableNumbersStrip({ lang, numbers }: { lang: Lang; numbers: number[] }) {
  if (numbers.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
        {lang === "ta" ? "இந்த ஜாதகத்திற்கான சாதக எண்கள்" : "Favourable numbers for this chart"}
      </span>
      {numbers.slice(0, 4).map((n) => (
        <Chip key={n} tone="accent">
          {n}
        </Chip>
      ))}
    </div>
  );
}
