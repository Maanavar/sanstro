"use client";

import { useEffect, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, MuhurtaFactor, MuhurtaSlot, MuhurtaResponseData } from "@/lib/types";
import { formatClockLabel, formatDateLabel, todayIso, addDays } from "@/lib/format";
import { convertMuhurtaTime } from "@/lib/timezone";
import { NovaSelect } from "./nova-select";
import { PlaceCombobox } from "./place-combobox";
import type { CityEntry } from "@/lib/tn-cities";
import { Card } from "./ui";
import { Field, FieldShell, Input } from "./ui/field";

/**
 * Nova re-skin of dashboard-muhurta-picker.tsx's DashboardMuhurtaPicker —
 * embedded inside Plan's "Best Dates & Muhurta" sub-tab (deferred,
 * Classic-styled, when Plan Nova first shipped — Phase 10,
 * docs/DASHBOARD_UI_REVAMP_PLAN.md §6.9). Grepped every var(--...)
 * reference first: its own `W` token map is the same reverted 5-token set
 * as every other deferred panel this pass — fresh Nova-token rebuild, not a
 * gap-fix. Same data/API call, same behavior (including the
 * scroll-into-view sync when Step 1's "Get Muhurta" click prefills a
 * date), only the JSX/styling is rebuilt.
 */

/**
 * Grouped so the page-cited activities read as a set without merging them.
 *
 * The three Samskara rows and the seven Treasure rows are **separate backend
 * activities** even where a user might expect one — the chapters give them
 * different star lists, different tithi rules and, for the two land rows,
 * different rule *shapes* entirely (taking possession has a 14-star list and no
 * weekday rule; buying land has a weekday rule and no stars). The grouping here
 * is purely visual; nothing downstream collapses them.
 *
 * Ids must match `app.services.muhurta_service.MUHURTA_ACTIVITIES`.
 */
// At 29 activities a single "page-cited" heading stopped being navigable, so the
// cited ones are split by life area. The split is presentational only — the
// backend has one flat activity space and nothing downstream reads these groups.
const GROUP = {
  FAMILY:   { en: "Family ceremonies · Kalaprakasika", ta: "குடும்ப நிகழ்வுகள் · கலப்பிரகாசிகை" },
  LEARNING: { en: "Learning · Kalaprakasika",          ta: "கல்வி · கலப்பிரகாசிகை" },
  WEALTH:   { en: "Wealth & property · Kalaprakasika", ta: "செல்வம் & சொத்து · கலப்பிரகாசிகை" },
  HOME:     { en: "Home & harvest · Kalaprakasika",    ta: "இல்லம் & அறுவடை · கலப்பிரகாசிகை" },
  FIELD:    { en: "Field & sowing · Kalaprakasika",    ta: "வயல் & விதைப்பு · கலப்பிரகாசிகை" },
  GENERAL:  { en: "General almanac",                   ta: "பொது பஞ்சாங்கம்" },
} as const;

type GroupKey = keyof typeof GROUP;

const ACTIVITIES: Array<{ id: string; en: string; ta: string; group: GroupKey }> = [
  // Ch. XIII / XIV. The engine's oldest and deepest table, and the only activity
  // it still scores by its own branch rather than the registry. It was absent
  // from this list entirely — the public calculator and the mobile picker both
  // offered it, so the signed-in surface was the one place a user could not
  // elect a wedding date.
  { id: "MARRIAGE", en: "Wedding / Marriage", ta: "திருமணம்", group: "FAMILY" },
  // Ch. III / IV — the infant samskaras.
  { id: "NAMING_CEREMONY", en: "Baby Naming / Namakarana", ta: "பெயர் சூட்டு விழா / நாமகரணம்", group: "FAMILY" },
  { id: "MILK_FEEDING", en: "First feeding on milk", ta: "பால் ஊட்டத் தொடங்குதல்", group: "FAMILY" },
  { id: "ANNAPRASANA", en: "Annaprasana / First Feeding", ta: "அன்னப்பிராசனம் / சோறூட்டு", group: "FAMILY" },
  { id: "EAR_BORING", en: "Ear Boring / Karnavedha", ta: "காதுகுத்து / கர்ணவேதம்", group: "FAMILY" },
  // Ch. V, VII, XVII, XVIII — the later life-stage samskaras, and the birth chamber.
  { id: "TONSURE", en: "Tonsure / Choulam", ta: "மொட்டை / சூடாகர்மம்", group: "FAMILY" },
  { id: "UPANAYANAM", en: "Upanayanam / Thread ceremony", ta: "உபநயனம் / பூணூல் விழா", group: "FAMILY" },
  { id: "SEEMANTHAM", en: "Seemantham / Valaikappu", ta: "சீமந்தம் / வளைகாப்பு", group: "FAMILY" },
  // Ch. XVIII elects the ARRANGING of the birth chamber, never the birth itself.
  { id: "LYING_IN_CHAMBER", en: "Arranging the lying-in chamber", ta: "பேறுகால அறை ஏற்பாடு", group: "FAMILY" },
  // Ch. VI, VIII, X, XI, XII.
  { id: "VIDYARAMBHAM", en: "Vidyarambham / First letters", ta: "வித்யாரம்பம் / எழுத்தறிவித்தல்", group: "LEARNING" },
  { id: "EDUCATION_START", en: "Starting education", ta: "கல்வியைத் தொடங்குதல்", group: "LEARNING" },
  { id: "MANTRA_INITIATION", en: "Mantra initiation / Upadesam", ta: "மந்திர உபதேசம்", group: "LEARNING" },
  { id: "VEDA_STUDY", en: "Beginning Veda study", ta: "வேத அத்யயனம் தொடங்குதல்", group: "LEARNING" },
  { id: "SNAANA", en: "Samavarthanam bath / Snaana", ta: "சமாவர்த்தன ஸ்நானம்", group: "LEARNING" },
  // Ch. XXI — "To Lay Up Treasure", plus Ch. XXIV's wearing rule.
  { id: "GOLD", en: "Gold & precious metals", ta: "தங்கம் / விலைமதிப்புள்ள உலோகம்", group: "WEALTH" },
  { id: "GEMS", en: "Gems & jewels", ta: "ரத்தினம் / நகை", group: "WEALTH" },
  { id: "NEW_ORNAMENT", en: "Wearing a new gold ornament", ta: "புது தங்க நகை அணிதல்", group: "WEALTH" },
  { id: "TREASURE_STORE", en: "Laying up treasure", ta: "செல்வம் சேமிப்பு", group: "WEALTH" },
  { id: "LAND_POSSESSION", en: "Taking possession of land", ta: "நிலம் கைவசப்படுத்தல்", group: "WEALTH" },
  { id: "LAND_PURCHASE", en: "Buying land", ta: "நிலம் வாங்குதல்", group: "WEALTH" },
  { id: "CATTLE_PURCHASE", en: "Buying cattle", ta: "கால்நடை வாங்குதல்", group: "WEALTH" },
  // Ch. XXIII, and Ch. XX / XXI on grain.
  { id: "NEW_CLOTHES", en: "Wearing new clothes", ta: "புத்தாடை அணிதல்", group: "HOME" },
  { id: "GRAIN", en: "Storing grain", ta: "தானியம் சேமிப்பு", group: "HOME" },
  { id: "HARVEST", en: "Starting the harvest", ta: "அறுவடை தொடங்குதல்", group: "HOME" },
  { id: "HARVEST_INGATHERING", en: "Bringing the crop in", ta: "விளைச்சலைச் சேர்த்தல்", group: "HOME" },
  { id: "GRAIN_EXPENDITURE", en: "Drawing down the grain store", ta: "தானியத்தைச் செலவிடுதல்", group: "HOME" },
  // Ch. XIX and XXII — the crop cycle from first footstep to first mouthful.
  { id: "AGRICULTURE_START", en: "Starting work on the land", ta: "வேளாண் பணியைத் தொடங்குதல்", group: "FIELD" },
  { id: "TILLAGE", en: "Ploughing the field", ta: "நிலத்தை உழுதல்", group: "FIELD" },
  { id: "SOWING", en: "Sowing seed", ta: "விதைத்தல்", group: "FIELD" },
  { id: "NEW_GRAIN_MEAL", en: "First meal of the new grain", ta: "புதிய தானியத்தை உண்ணுதல்", group: "FIELD" },
  // Generic almanac only — no primary-text table yet.
  { id: "JOB_START", en: "Job start / New role", ta: "வேலை தொடக்கம் / புதிய பதவி", group: "GENERAL" },
  { id: "EXAM", en: "Exam / Course start", ta: "தேர்வு / படிப்பு தொடக்கம்", group: "GENERAL" },
  { id: "TRAVEL", en: "Travel / Journey start", ta: "பயண தொடக்கம்", group: "GENERAL" },
  { id: "INVESTMENT", en: "Investment / Financial agreement", ta: "முதலீடு / நிதி ஒப்பந்தம்", group: "GENERAL" },
  { id: "MEDICAL", en: "Medical procedure / Surgery", ta: "மருத்துவ சிகிச்சை / அறுவை", group: "GENERAL" },
  { id: "PURCHASE", en: "Property or major purchase", ta: "சொத்து / பெரிய கொள்முதல்", group: "GENERAL" },
  { id: "SPIRITUAL", en: "Grihapravesh / Religious event", ta: "இல்லப்பிரவேசம் / மத நிகழ்வு", group: "GENERAL" },
];

const SCORE_COLOR = (score: number) => (score >= 75 ? "var(--color-high)" : score >= 55 ? "var(--color-mid)" : "var(--color-faint)");

const VERDICT_COLOR: Record<MuhurtaFactor["verdict"], string> = {
  BONUS: "var(--color-high)",
  PENALTY: "var(--color-mid)",
  VETO: "var(--color-low)",
  NEUTRAL: "var(--color-faint)",
  // Deliberately the same muted ink as NEUTRAL, never a warning colour: an
  // unsourced factor is a gap in our reference tables, not a defect in the day.
  UNSOURCED: "var(--color-faint)",
};

const VERDICT_LABEL: Record<MuhurtaFactor["verdict"], { en: string; ta: string }> = {
  BONUS: { en: "Supports", ta: "ஆதரவு" },
  PENALTY: { en: "Against", ta: "எதிர்" },
  VETO: { en: "Rules out", ta: "நீக்கம்" },
  NEUTRAL: { en: "Neutral", ta: "நடுநிலை" },
  UNSOURCED: { en: "Not yet sourced", ta: "ஆதாரம் இல்லை" },
};

/** The factor list — what the engine checked, what it decided, and on whose authority.
 *
 * Rendered in the engine's own evaluation order rather than sorted by weight:
 * the order is the method, and re-sorting it would present a heavier generic
 * almanac factor as though it outranked a cited doctrinal one. */
function FactorList({ factors, lang }: { factors: MuhurtaFactor[]; lang: Lang }) {
  return (
    <div>
      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", color: "var(--color-faint)", letterSpacing: "0.05em" }}>
        {lang === "ta" ? "எவை பரிசீலிக்கப்பட்டன" : "What was weighed"}
      </span>
      <ul style={{ margin: "6px 0 0 0", padding: 0, listStyle: "none" }}>
        {factors.map((f, i) => (
          <li key={`${f.factor}-${i}`} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: VERDICT_COLOR[f.verdict], textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {lang === "ta" ? VERDICT_LABEL[f.verdict].ta : VERDICT_LABEL[f.verdict].en}
              </span>
              {f.contribution !== 0 && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", fontVariantNumeric: "tabular-nums" }}>
                  {f.contribution > 0 ? "+" : ""}{f.contribution}
                </span>
              )}
              {f.sourced && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-accent)", fontWeight: 600 }}>
                  {lang === "ta" ? "மூல நூல்" : "Primary text"}
                </span>
              )}
            </div>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text)", margin: "2px 0 0" }}>
              {lang === "ta" ? f.reason.ta : f.reason.en}
            </p>
            {f.citation && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", margin: "2px 0 0" }}>
                {[f.citation.tradition, f.citation.chapter && `Ch. ${f.citation.chapter}`, f.citation.page && `p. ${f.citation.page}`]
                  .filter(Boolean)
                  .join(" · ")}
                {f.citation.passage && (
                  <span style={{ display: "block", fontStyle: "italic", marginTop: "2px" }}>&ldquo;{f.citation.passage}&rdquo;</span>
                )}
              </p>
            )}
            {f.conflict && (
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-mid)", margin: "2px 0 0" }}>
                {lang === "ta" ? "முரண்பாடு: " : "Unresolved in the source: "}{f.conflict}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatMuhurtaDate(value: string, lang: Lang): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return formatDateLabel(value);
  return parsed.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function NovaMuhurtaCard({ slot, lang, sourceTz, compareCity }: { slot: MuhurtaSlot; lang: Lang; sourceTz: string; compareCity: CityEntry | null }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = SCORE_COLOR(slot.score);
  const compare = compareCity && compareCity.timezone !== sourceTz
    ? convertMuhurtaTime(slot.date, slot.timeStart, sourceTz, compareCity.timezone)
    : null;

  return (
    <Card compact style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", cursor: "pointer", flexWrap: "wrap" }} onClick={() => setExpanded((v) => !v)}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          {/* One decimal, not an integer. The backend already maps the score
              into 0-100 and rounds to 1dp; rounding again to a whole number
              here re-collapses the compressed top of the range and puts back
              a third of the ties this list exists to break. */}
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: scoreColor }}>{Math.min(100, slot.score).toFixed(1)}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{t("muhurta_score", lang)}</div>
        </div>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <div style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--color-text)" }}>{formatMuhurtaDate(slot.date, lang)}</div>
          {slot.tamilDate && (
            <div style={{ fontSize: "var(--text-base)", color: "var(--color-text-accent)", fontWeight: 600 }}>{lang === "ta" ? slot.tamilDate.ta : slot.tamilDate.en}</div>
          )}
          <div style={{ fontSize: "var(--text-base)", color: "var(--color-muted)" }}>{formatClockLabel(slot.timeStart)} - {formatClockLabel(slot.timeEnd)}</div>
          {compare && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-accent)", marginTop: "2px" }}>
              {compareCity!.name.split(",")[0]}: {compare.time12h} {compare.tzAbbr}
              {compare.dayOffset !== 0 && (lang === "ta" ? (compare.dayOffset > 0 ? " (மறுநாள்)" : " (முந்தைய நாள்)") : (compare.dayOffset > 0 ? " (next day)" : " (previous day)"))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-2)", fontSize: "var(--text-base)", color: "var(--color-muted)", maxWidth: "200px", textAlign: "right" }}>
          <span>{lang === "ta" ? slot.panchangamSupport.ta : slot.panchangamSupport.en}</span>
          <span style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", color: "var(--color-faint)", letterSpacing: "0.05em" }}>
              {lang === "ta" ? "தசை ஆதரவு" : "Dasha support"}
            </span>
            <p style={{ fontSize: "var(--text-base)", marginTop: "2px", color: "var(--color-text)" }}>{lang === "ta" ? slot.dashaSupport.ta : slot.dashaSupport.en}</p>
          </div>

          {/* `factors` is a superset of `cautions` — every caution is a PENALTY
              factor in it. Rendering both would print each caution twice, so the
              factor list replaces it wherever the API sends one, and the cautions
              list stays as the fallback for a response that predates it. */}
          {slot.factors && slot.factors.length > 0 ? (
            <FactorList factors={slot.factors} lang={lang} />
          ) : slot.cautions.length > 0 ? (
            <div>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", color: "var(--color-mid)", letterSpacing: "0.05em" }}>
                {t("muhurta_cautions", lang)}
              </span>
              <ul style={{ margin: "4px 0 0 0", paddingLeft: "var(--space-4)" }}>
                {slot.cautions.map((c, i) => (
                  <li key={i} style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", marginBottom: "2px" }}>{lang === "ta" ? c.ta : c.en}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

interface Props {
  lang: Lang;
  chartId: string | null;
  initialActivity?: string;
  initialDateFrom?: string;
}

export function NovaMuhurtaPicker({ lang, chartId, initialActivity, initialDateFrom }: Props) {
  const today = todayIso();
  const [activity, setActivity] = useState(initialActivity ?? "");
  const [dateFrom, setDateFrom] = useState(initialDateFrom ?? today);
  const [dateTo, setDateTo] = useState(addDays(initialDateFrom ?? today, 30));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MuhurtaResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareCityQuery, setCompareCityQuery] = useState("");
  const [compareCity, setCompareCity] = useState<CityEntry | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialActivity) setActivity(initialActivity);
  }, [initialActivity]);
  useEffect(() => {
    if (initialDateFrom) {
      setDateFrom(initialDateFrom);
      setDateTo(initialDateFrom);
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialDateFrom]);

  async function handleSearch() {
    if (!chartId || !activity) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ activity, dateFrom, dateTo });
      const json = await apiFetchJson<ApiEnvelope<MuhurtaResponseData>>(`/api/v1/charts/${chartId}/muhurta?${params}`);
      setResult(json.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg || (lang === "ta" ? "நெட்வொர்க் பிழை - மீண்டும் முயற்சிக்கவும்." : "Network error - please try again."));
    } finally {
      setLoading(false);
    }
  }

  const selectedActivity = ACTIVITIES.find((a) => a.id === activity);

  return (
    <div ref={rootRef} style={{ padding: "var(--space-4) var(--space-5)", borderRadius: "var(--radius-md)", background: "var(--color-surface)", border: "1px solid var(--color-border)", fontFamily: "var(--font-body)" }}>
      <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--color-text-accent)" }}>{t("muhurta_title", lang)}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "14px", alignItems: "flex-end" }}>
        <FieldShell label={t("muhurta_activity", lang)} style={{ flex: "1 1 180px" }}>
          <NovaSelect
            value={activity}
            onChange={setActivity}
            placeholder={lang === "ta" ? "-- பயன்பாடு தேர்ந்தெடுக்கவும் --" : "-- Select an activity --"}
            ariaLabel={t("muhurta_activity", lang)}
            options={ACTIVITIES.map((a) => ({
              value: a.id,
              label: lang === "ta" ? a.ta : a.en,
              group: lang === "ta" ? GROUP[a.group].ta : GROUP[a.group].en,
            }))}
          />
        </FieldShell>

        <Field label={t("muhurta_date_from", lang)} style={{ flex: "1 1 130px" }}>
          <Input type="date" value={dateFrom} min={today} onChange={(e) => setDateFrom(e.target.value)} />
        </Field>

        <Field label={t("muhurta_date_to", lang)} style={{ flex: "1 1 130px" }}>
          <Input type="date" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)} />
        </Field>

        <button
          type="button"
          disabled={!chartId || !activity || loading}
          onClick={handleSearch}
          style={{
            flex: "0 0 auto",
            padding: "var(--space-2) var(--space-5)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-accent)",
            background: !chartId || !activity || loading ? "var(--color-surface-soft)" : "var(--color-accent)",
            color: !chartId || !activity || loading ? "var(--color-faint)" : "var(--color-on-accent)",
            fontWeight: 700,
            fontSize: "var(--text-base)",
            cursor: !chartId || !activity || loading ? "not-allowed" : "pointer",
            alignSelf: "flex-end",
            fontFamily: "inherit",
          }}
        >
          {loading ? t("muhurta_searching", lang) : t("muhurta_search", lang)}
        </button>
      </div>

      {!result && !loading && !error && <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", textAlign: "center", padding: "var(--space-4) 0" }}>{t("muhurta_empty", lang)}</p>}

      {error && <p role="alert" style={{ fontSize: "var(--text-base)", color: "var(--color-low)", padding: "var(--space-2) 0" }}>{error}</p>}

      {result && result.slots.length > 0 && (
        <div>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "10px", color: "var(--color-text)" }}>
            {t("muhurta_results", lang)} {selectedActivity && <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>· {lang === "ta" ? selectedActivity.ta : selectedActivity.en}</span>}
          </p>

          {(() => {
            // `PlaceCombobox` deliberately does not spread arbitrary input props
            // (see its own note), so the `style={fieldStyle}` this call site used
            // to pass never reached the input — it has always rendered on the
            // combobox's own --pcbx-* Nova defaults. Dropped rather than ported.
            const compareLabel = lang === "ta" ? "மற்றொரு ஊருடன் ஒப்பிடவும் (விருப்பம்)" : "Compare with another city (optional)";
            return (
              <FieldShell label={compareLabel} style={{ marginBottom: "12px" }}>
                <PlaceCombobox
                  value={compareCityQuery}
                  onChange={(city, raw) => { setCompareCityQuery(raw); setCompareCity(city); }}
                  placeholder={lang === "ta" ? "எ.கா. மெல்போர்ன், ஆஸ்திரேலியா" : "e.g. Melbourne, Australia"}
                  aria-label={compareLabel}
                />
                {compareCity && compareCity.timezone === result.timezone && (
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                    {lang === "ta" ? "இது உங்கள் நேரமண்டலமே." : "That's the same timezone as this reading."}
                  </p>
                )}
              </FieldShell>
            );
          })()}

          {result.slots.map((slot, i) => <NovaMuhurtaCard key={`${slot.date}-${i}`} slot={slot} lang={lang} sourceTz={result.timezone} compareCity={compareCity} />)}
        </div>
      )}

      {result && result.slots.length === 0 && (
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", textAlign: "center", padding: "var(--space-4) 0" }}>
          {lang === "ta" ? "இந்த வரம்பில் சுப நேரம் இல்லை. தேதி வரம்பை விரிவாக்கவும்." : "No auspicious slots found in this range. Try a wider date range."}
        </p>
      )}
    </div>
  );
}
