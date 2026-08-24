"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";
import { t, tKarana, tNakshatra, tTithi, tWeekday, tYoga } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, MuhurtaFactor, MuhurtaSlot, MuhurtaResponseData, PanchangamDailyResponseData } from "@/lib/types";
import { addDays, formatClockLabel, formatDateLabel, tamilMonthOnly, todayIso } from "@/lib/format";
import { convertMuhurtaTime } from "@/lib/timezone";
import { NovaSelect } from "./nova-select";
import { PlaceCombobox } from "./place-combobox";
import type { CityEntry } from "./place-combobox";
import { Card } from "./ui";
import { Field, FieldShell, Input } from "./ui/field";
import { ModalShell } from "./modal-shell";

export type PanchangamOverlayLocation = Pick<MuhurtaResponseData["activityLocation"], "latitude" | "longitude" | "timezone">;

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
    <div style={{ minWidth: 0 }}>
      <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", color: "var(--color-faint)", letterSpacing: "0.05em" }}>
        {lang === "ta" ? "எவை பரிசீலிக்கப்பட்டன" : "What was weighed"}
      </span>
      <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "grid", gap: "10px" }}>
        {factors.map((f, i) => (
          <li key={`${f.factor}-${i}`} style={{ padding: "10px 12px", border: `1px solid color-mix(in srgb, ${VERDICT_COLOR[f.verdict]} 34%, transparent)`, background: "var(--color-surface-soft)", borderRadius: "var(--radius-sm)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: VERDICT_COLOR[f.verdict], textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                {lang === "ta" ? VERDICT_LABEL[f.verdict].ta : VERDICT_LABEL[f.verdict].en}
              </span>
              {f.contribution !== 0 && (
                <span style={{ padding: "2px 6px", borderRadius: "999px", fontSize: "var(--text-xs)", color: "var(--color-text)", background: "var(--color-surface)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {f.contribution > 0 ? "+" : ""}{f.contribution}
                </span>
              )}
              {f.sourced && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-accent)", fontWeight: 600 }}>
                  {lang === "ta" ? "மூல நூல்" : "Primary text"}
                </span>
              )}
            </div>
            <p style={{ fontSize: "var(--text-base)", lineHeight: 1.5, color: "var(--color-text)", margin: "5px 0 0" }}>
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
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-mid-text)", margin: "2px 0 0" }}>
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

function NovaMuhurtaCard({
  slot,
  lang,
  sourceTz,
  compareCity,
  onOpenPanchangam,
}: {
  slot: MuhurtaSlot;
  lang: Lang;
  sourceTz: string;
  compareCity: CityEntry | null;
  onOpenPanchangam: (date: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = SCORE_COLOR(slot.score);
  const compare = compareCity && compareCity.timezone !== sourceTz
    ? convertMuhurtaTime(slot.date, slot.timeStart, sourceTz, compareCity.timezone)
    : null;

  return (
    <Card compact style={{ marginBottom: "10px" }}>
      <div className="muhurta-slot-summary" style={{ cursor: "pointer" }} onClick={() => setExpanded((v) => !v)}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          {/* One decimal, not an integer. The backend already maps the score
              into 0-100 and rounds to 1dp; rounding again to a whole number
              here re-collapses the compressed top of the range and puts back
              a third of the ties this list exists to break. */}
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: scoreColor }}>{Math.min(100, slot.score).toFixed(1)}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{t("muhurta_score", lang)}</div>
        </div>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); onOpenPanchangam(slot.date); }}
            aria-label={`${t("label_panchangam", lang)} · ${formatMuhurtaDate(slot.date, lang)}`}
            style={{
              padding: 0, border: 0, background: "transparent", color: "var(--color-text-accent)",
              cursor: "pointer", font: "inherit", fontWeight: 700, fontSize: "var(--text-base)",
              textAlign: "left", textDecoration: "underline", textUnderlineOffset: "3px",
            }}
          >
            {formatMuhurtaDate(slot.date, lang)}
          </button>
          {slot.tamilDate && (
            <div style={{ fontSize: "var(--text-base)", color: "var(--color-text-accent)", fontWeight: 600 }}>{lang === "ta" ? slot.tamilDate.ta : slot.tamilDate.en}</div>
          )}
          <div style={{ fontSize: "var(--text-base)", color: "var(--color-muted)" }}>{formatClockLabel(slot.timeStart)} - {formatClockLabel(slot.timeEnd)}</div>
          {slot.traditionalMonthNotices && slot.traditionalMonthNotices.length > 0 && (
            <div style={{ marginTop: "8px", padding: "6px 8px", border: "1px solid var(--color-mid-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-soft)", color: "var(--color-text)", fontSize: "var(--text-sm)", lineHeight: 1.45 }}>
              {slot.traditionalMonthNotices.map((notice, index) => (
                <div key={`${notice.month.en}-${index}`}>
                  <strong>{lang === "ta" ? notice.month.ta : notice.month.en}: </strong>
                  {lang === "ta" ? notice.message.ta : notice.message.en}
                </div>
              ))}
            </div>
          )}
          {compare && (
            <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-accent)", marginTop: "2px" }}>
              {compareCity!.name.split(",")[0]}: {compare.time12h} {compare.tzAbbr}
              {compare.dayOffset !== 0 && (lang === "ta" ? (compare.dayOffset > 0 ? " (மறுநாள்)" : " (முந்தைய நாள்)") : (compare.dayOffset > 0 ? " (next day)" : " (previous day)"))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", fontSize: "var(--text-base)", color: "var(--color-muted)", minWidth: 0 }}>
          <span>{lang === "ta" ? slot.panchangamSupport.ta : slot.panchangamSupport.en}</span>
          <span style={{ color: "var(--color-faint)", fontSize: "var(--text-sm)", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="muhurta-slot-details" style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--color-border)" }}>
          {slot.dashaSupport && <div className="muhurta-slot-dasha" style={{ paddingRight: "var(--space-4)", borderRight: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", color: "var(--color-faint)", letterSpacing: "0.05em" }}>
              {lang === "ta" ? "தசை ஆதரவு" : "Dasha support"}
            </span>
            <p style={{ fontSize: "var(--text-base)", lineHeight: 1.5, margin: "5px 0 0", color: "var(--color-text)" }}>{lang === "ta" ? slot.dashaSupport.ta : slot.dashaSupport.en}</p>
          </div>}

          {/* `factors` is a superset of `cautions` — every caution is a PENALTY
              factor in it. Rendering both would print each caution twice, so the
              factor list replaces it wherever the API sends one, and the cautions
              list stays as the fallback for a response that predates it. */}
          {slot.traditionalMonthNotices && slot.traditionalMonthNotices.length > 0 && (
            <div style={{ marginTop: "12px", padding: "10px 12px", border: "1px solid var(--color-mid-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-soft)" }}>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-mid-text)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {lang === "ta" ? "பொதுவான குடும்ப வழக்கம்" : "General family custom"}
              </p>
              {slot.traditionalMonthNotices.map((notice, index) => (
                <p key={`${notice.month.en}-${index}`} style={{ margin: "5px 0 0", fontSize: "var(--text-base)", lineHeight: 1.5, color: "var(--color-text)" }}>
                  <strong>{lang === "ta" ? notice.month.ta : notice.month.en}: </strong>
                  {lang === "ta" ? notice.message.ta : notice.message.en}
                </p>
              ))}
            </div>
          )}

          {slot.factors && slot.factors.length > 0 ? (
            <FactorList factors={slot.factors} lang={lang} />
          ) : slot.cautions.length > 0 ? (
            <div>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, textTransform: "uppercase", color: "var(--color-mid-text)", letterSpacing: "0.05em" }}>
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

/** Compact, read-only Panchangam inspector for a date already shown by Muhurta.
 * It intentionally uses the activity location, rather than the profile location,
 * so the calendar facts and the chosen muhurta are always about the same place. */
export function MuhurtaPanchangamOverlay({
  date,
  location,
  lang,
  onClose,
}: {
  date: string;
  location: PanchangamOverlayLocation;
  lang: Lang;
  onClose: () => void;
}) {
  const [data, setData] = useState<PanchangamDailyResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    setLoading(true);
    const params = new URLSearchParams({
      date,
      lat: String(location.latitude),
      lng: String(location.longitude),
      timezone: location.timezone,
    });
    apiFetchJson<ApiEnvelope<PanchangamDailyResponseData>>(`/api/v1/panchangam/daily?${params.toString()}`, { signal: controller.signal })
      .then((response) => setData(response.data))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date, location.latitude, location.longitude, location.timezone]);

  const timing = (slot: { start: string; end: string }) => `${formatClockLabel(slot.start)} – ${formatClockLabel(slot.end)}`;
  const limbUntil = (value: string) => formatClockLabel(value);

  return (
    <ModalShell
      label={`${t("label_panchangam", lang)} · ${formatMuhurtaDate(date, lang)}`}
      onClose={onClose}
      panelStyle={{
        width: "min(680px, 100%)", maxHeight: "min(760px, calc(100vh - 32px))", overflowY: "auto",
        background: "var(--color-surface)", border: "1px solid var(--color-border-strong)",
        borderRadius: "var(--radius-lg)", boxShadow: "0 24px 72px rgba(0,0,0,0.34)",
      }}
    >
      <div style={{ padding: "var(--space-5)", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-accent)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{t("label_panchangam", lang)}</p>
          <h2 style={{ margin: "4px 0 0", color: "var(--color-text)", fontSize: "var(--text-lg)" }}>{formatMuhurtaDate(date, lang)}</h2>
          <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{location.timezone}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("btn_cancel", lang)}
          style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", cursor: "pointer", fontSize: "1.15rem", lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {loading && <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "var(--text-base)" }}>{t("cal_monthly_loading", lang)}</p>}
        {error && !loading && <p role="alert" style={{ margin: 0, color: "var(--color-low)", fontSize: "var(--text-base)" }}>{error}</p>}
        {data && !loading && (
          <>
            <div>
              <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-text)", fontWeight: 650 }}>
                {tWeekday(data.vara.weekday, lang)} · {data.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} {data.tithi.number}
              </p>
              {data.tamilDate && <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-accent)" }}>{lang === "ta" ? data.tamilDate.ta : data.tamilDate.en}</p>}
              <p style={{ margin: "6px 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                {t("label_sunrise", lang)} {formatClockLabel(data.sunrise)} · {t("label_sunset", lang)} {formatClockLabel(data.sunset)}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", borderTop: "1px solid var(--color-border)", borderLeft: "1px solid var(--color-border)" }}>
              {[
                [t("label_tithi2", lang), `${tTithi(data.tithi.name, lang)} · ${limbUntil(data.tithi.endsAt)}`],
                [t("label_nakshatra2", lang), `${tNakshatra(data.nakshatra.name, lang)} · ${limbUntil(data.nakshatra.endsAt)}`],
                [t("label_yogam", lang), `${tYoga(data.yoga.name, lang)} · ${limbUntil(data.yoga.endsAt)}`],
                [t("label_karanam", lang), `${tKarana(data.karana.name, lang)} · ${limbUntil(data.karana.endsAt)}`],
              ].map(([label, value]) => (
                <div key={label} style={{ minHeight: "82px", padding: "var(--space-3)", borderRight: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
                  <p style={{ margin: 0, color: "var(--color-faint)", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                  <p style={{ margin: "6px 0 0", color: "var(--color-text)", fontSize: "var(--text-sm)", lineHeight: 1.45 }}>{value}</p>
                </div>
              ))}
            </div>

            {(data.kalam.nallaNeram?.length ?? 0) > 0 && (
              <div>
                <p style={{ margin: "0 0 6px", color: "var(--color-text-accent)", fontSize: "var(--text-sm)", fontWeight: 700 }}>{t("label_nalla_neram", lang)}</p>
                <p style={{ margin: 0, color: "var(--color-text)", fontSize: "var(--text-base)" }}>{data.kalam.nallaNeram.map(timing).join(" · ")}</p>
              </div>
            )}

            <div>
              <p style={{ margin: "0 0 8px", color: "var(--color-low)", fontSize: "var(--text-sm)", fontWeight: 700 }}>{t("muhurta_cautions", lang)}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: "var(--space-2)" }}>
                {[
                  [t("label_rahu_kalam", lang), timing(data.kalam.rahuKalam)],
                  [t("label_yamagandam", lang), timing(data.kalam.yamagandam)],
                  [t("label_kuligai", lang), timing(data.kalam.kuligai)],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: "var(--space-3)", background: "var(--color-surface-soft)", borderRadius: "var(--radius-sm)" }}>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", fontWeight: 700 }}>{label}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ModalShell>
  );
}

interface Props {
  lang: Lang;
  chartId: string | null;
  initialActivity?: string;
  initialDateFrom?: string;
}

const DEFAULT_SEARCH_RANGE_DAYS = 30;
// The API evaluates at most 60 days per request. Longer selections are split
// client-side and their top results are merged, so the picker itself has no
// forward-date ceiling.
const API_SEARCH_CHUNK_DAYS = 60;

/** One contiguous run of result dates inside a single Tamil solar month. */
type TamilMonthGroup = {
  key: string;
  en: string;
  ta: string;
  firstDate: string;
  lastDate: string;
  slots: MuhurtaSlot[];
};

/**
 * A **run**, not a bucket. A search longer than a Tamil year revisits the same
 * month name, and those two stretches are different months of different years —
 * merging them by name would put dates a year apart under one heading. Walking
 * the slots in date order and starting a new group whenever the month name
 * changes keeps them separate without needing a Tamil-year field the API does
 * not send.
 *
 * Slots whose `tamilDate` is missing collect into their own unnamed run rather
 * than disappearing from a filtered list.
 */
export function groupSlotsByTamilMonth(slots: MuhurtaSlot[]): TamilMonthGroup[] {
  const groups: TamilMonthGroup[] = [];
  [...slots]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((slot) => {
      const en = slot.tamilDate ? tamilMonthOnly(slot.tamilDate.en) : "";
      const ta = slot.tamilDate ? tamilMonthOnly(slot.tamilDate.ta) : "";
      const previous = groups[groups.length - 1];
      if (previous && previous.en === en) {
        previous.slots.push(slot);
        previous.lastDate = slot.date;
        return;
      }
      groups.push({ key: `${en}#${groups.length}`, en, ta, firstDate: slot.date, lastDate: slot.date, slots: [slot] });
    });
  return groups;
}

/** Ranked highest-first, which is how the flat list has always read. Grouping
 *  changes which dates sit together, never how they are ordered within a month. */
function byScoreDesc(slots: MuhurtaSlot[]): MuhurtaSlot[] {
  return [...slots].sort((a, b) => b.score - a.score);
}

export function NovaMuhurtaPicker({ lang, chartId, initialActivity, initialDateFrom }: Props) {
  const today = todayIso();
  const [activity, setActivity] = useState(initialActivity ?? "");
  const [pakshaFilter, setPakshaFilter] = useState<"" | "SHUKLA" | "KRISHNA">("");
  const [dateFrom, setDateFrom] = useState(initialDateFrom ?? today);
  const [dateTo, setDateTo] = useState(addDays(initialDateFrom ?? today, DEFAULT_SEARCH_RANGE_DAYS));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MuhurtaResponseData | null>(null);
  // Display-only, applied after the search returns — a Tamil month is not a
  // parameter the API accepts, and re-querying per month would re-run the whole
  // chart-personalised evaluation for dates already scored.
  const [tamilMonthKey, setTamilMonthKey] = useState("");
  const [groupByTamilMonth, setGroupByTamilMonth] = useState(false);
  const [checkDate, setCheckDate] = useState(initialDateFrom ?? today);
  const [assessment, setAssessment] = useState<MuhurtaSlot | null>(null);
  const [assessmentLocation, setAssessmentLocation] = useState<PanchangamOverlayLocation | null>(null);
  const [checkingDate, setCheckingDate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panchangamRequest, setPanchangamRequest] = useState<{ date: string; location: PanchangamOverlayLocation } | null>(null);
  const [compareCityQuery, setCompareCityQuery] = useState("");
  const [compareCity, setCompareCity] = useState<CityEntry | null>(null);
  // Where the activity happens, which is not always where the person was born.
  // Sunrise drives the Gowri grid, the kalams, the horas and Nalla Neram, so a
  // Chennai-born user acting in Coimbatore was reading a table ~20 minutes off.
  // Null means "use the chart's own daily location", which the backend defaults to.
  const [activityCityQuery, setActivityCityQuery] = useState("");
  const [activityCity, setActivityCity] = useState<CityEntry | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchElapsed = useElapsedSeconds(loading);
  const checkDateElapsed = useElapsedSeconds(checkingDate);

  useEffect(() => {
    if (initialActivity) setActivity(initialActivity);
  }, [initialActivity]);
  useEffect(() => {
    if (initialDateFrom) {
      setDateFrom(initialDateFrom);
      setDateTo(initialDateFrom);
      setCheckDate(initialDateFrom);
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [initialDateFrom]);

  /** lat/lon/tz must travel together or the backend 422s; place is display only. */
  function withActivityLocation(params: URLSearchParams): URLSearchParams {
    if (activityCity) {
      params.set("lat", activityCity.lat);
      params.set("lon", activityCity.lng);
      params.set("tz", activityCity.timezone);
      params.set("place", activityCity.name);
    }
    return params;
  }

  function handleDateFromChange(nextDateFrom: string) {
    setDateFrom(nextDateFrom);
    setDateTo(addDays(nextDateFrom, DEFAULT_SEARCH_RANGE_DAYS));
  }

  function handleDateToChange(nextDateTo: string) {
    setDateTo(nextDateTo < dateFrom ? dateFrom : nextDateTo);
  }

  function searchDateRanges() {
    const ranges: Array<{ from: string; to: string }> = [];
    let rangeStart = dateFrom;
    while (rangeStart <= dateTo) {
      const rangeEnd = addDays(rangeStart, API_SEARCH_CHUNK_DAYS);
      ranges.push({ from: rangeStart, to: rangeEnd < dateTo ? rangeEnd : dateTo });
      rangeStart = addDays(rangeEnd, 1);
    }
    return ranges;
  }

  async function handleSearch() {
    if (!chartId || !activity) return;
    setLoading(true);
    setError(null);
    setResult(null);
    // The month keys are positional within the previous result set, so carrying
    // a selection across searches would silently filter to the wrong month.
    setTamilMonthKey("");
    // A range search replaces the one-date inspection, so its result does not
    // remain above the newly requested list.
    setAssessment(null);
    setAssessmentLocation(null);
    try {
      const chunks = await Promise.all(searchDateRanges().map(async ({ from, to }) => {
        const params = withActivityLocation(new URLSearchParams({ activity, dateFrom: from, dateTo: to }));
        if (pakshaFilter) params.set("paksha", pakshaFilter);
        return apiFetchJson<ApiEnvelope<MuhurtaResponseData>>(`/api/v1/charts/${chartId}/muhurta?${params}`);
      }));
      const firstResult = chunks[0]?.data;
      if (firstResult) {
        setResult({
          ...firstResult,
          dateFrom,
          dateTo,
          // Keep each API segment's best dates. Reducing a long search back to
          // five global winners could hide every viable date in a later Tamil
          // month, making an informational month custom look like an exclusion.
          slots: chunks.flatMap((chunk) => chunk.data.slots).sort((a, b) => b.score - a.score),
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg || (lang === "ta" ? "நெட்வொர்க் பிழை - மீண்டும் முயற்சிக்கவும்." : "Network error - please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckDate() {
    if (!chartId || !activity) return;
    setCheckingDate(true);
    setError(null);
    setAssessment(null);
    setAssessmentLocation(null);
    try {
      const params = withActivityLocation(
        new URLSearchParams({ activity, dateFrom: checkDate, dateTo: checkDate, includeExcluded: "true" }),
      );
      const json = await apiFetchJson<ApiEnvelope<MuhurtaResponseData>>(`/api/v1/charts/${chartId}/muhurta?${params}`);
      setAssessment(json.data.slots[0] ?? null);
      setAssessmentLocation(json.data.activityLocation);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg || (lang === "ta" ? "நெட்வொர்க் பிழை - மீண்டும் முயற்சிக்கவும்." : "Network error - please try again."));
    } finally {
      setCheckingDate(false);
    }
  }

  const selectedActivity = ACTIVITIES.find((a) => a.id === activity);
  const openPanchangam = (date: string, location: PanchangamOverlayLocation) => setPanchangamRequest({ date, location });

  const tamilMonthGroups = useMemo(() => groupSlotsByTamilMonth(result?.slots ?? []), [result]);
  const tamilMonthLabel = (group: TamilMonthGroup) => {
    const base = (lang === "ta" ? group.ta : group.en) || (lang === "ta" ? "தமிழ் மாதம் இல்லை" : "No Tamil date");
    // Two runs of one month name are a year apart; without the Gregorian year
    // the two options in the dropdown would be indistinguishable.
    const repeated = tamilMonthGroups.filter((other) => other.en === group.en).length > 1;
    if (!repeated) return base;
    const years = [...new Set([group.firstDate.slice(0, 4), group.lastDate.slice(0, 4)])].join("/");
    return `${base} ${years}`;
  };
  // An unknown key (a stale selection, or none) falls back to the whole list
  // rather than rendering an empty result the user cannot explain.
  const selectedMonthGroup = tamilMonthGroups.find((group) => group.key === tamilMonthKey) ?? null;
  const visibleGroups = selectedMonthGroup ? [selectedMonthGroup] : tamilMonthGroups;
  const visibleSlots = byScoreDesc(visibleGroups.flatMap((group) => group.slots));
  // A single-month result has nothing to filter or split, so the whole control
  // row stays out of the way.
  const showTamilMonthControls = tamilMonthGroups.length > 1;
  const groupedView = showTamilMonthControls && groupByTamilMonth && !selectedMonthGroup;

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
          <Input type="date" value={dateFrom} min={today} onChange={(e) => handleDateFromChange(e.target.value)} />
        </Field>

        <Field label={t("muhurta_date_to", lang)} style={{ flex: "1 1 130px" }}>
          <Input type="date" value={dateTo} min={dateFrom} onChange={(e) => handleDateToChange(e.target.value)} />
        </Field>

        <FieldShell label={lang === "ta" ? "பிறை" : "Lunar fortnight"} style={{ flex: "1 1 160px" }}>
          <NovaSelect
            value={pakshaFilter}
            onChange={(value) => setPakshaFilter(value as "" | "SHUKLA" | "KRISHNA")}
            ariaLabel={lang === "ta" ? "பிறை" : "Lunar fortnight"}
            options={[
              { value: "", label: lang === "ta" ? "அனைத்துப் பிறைகளும்" : "Any fortnight" },
              { value: "SHUKLA", label: lang === "ta" ? "வளர்பிறை" : "Valarpirai (waxing)" },
              { value: "KRISHNA", label: lang === "ta" ? "தேய்பிறை" : "Theipirai (waning)" },
            ]}
          />
        </FieldShell>

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
          {loading ? `${t("muhurta_searching", lang)} ${searchElapsed}s` : t("muhurta_search", lang)}
        </button>
      </div>

      {(() => {
        // Sits with the inputs, not with the results, because it changes what is
        // calculated rather than how it is displayed — the opposite of the
        // compare-city field further down, which only re-clocks the answer.
        const label = lang === "ta" ? "இச்செயல் நடைபெறும் இடம் (விருப்பத்தேர்வு)" : "Where will this take place? (optional)";
        return (
          <FieldShell label={label} style={{ marginBottom: "14px", maxWidth: "560px" }}>
            <PlaceCombobox
              value={activityCityQuery}
              lang={lang}
              onChange={(city, raw) => { setActivityCityQuery(raw); setActivityCity(city); }}
              placeholder={lang === "ta" ? "இயல்புநிலை: உங்கள் சுயவிவரத்தில் உள்ள இடம்" : "Defaults to your profile's location"}
              aria-label={label}
            />
            {activityCity && (
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                {lang === "ta"
                  ? "சூரிய உதய நேரம் இடத்திற்கேற்ப மாறுவதால், நல்ல நேரம், ராகு காலம் மற்றும் ஹோரை ஆகியவை இவ்விடத்தின் அடிப்படையில் கணக்கிடப்படும்."
                  : "Sunrise time varies by place, so Nalla Neram, Rahu Kalam and the horas are all calculated for this location."}
              </p>
            )}
          </FieldShell>
        );
      })()}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "flex-end", marginBottom: "14px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
        <Field label={t("muhurta_check_date", lang)} style={{ flex: "0 1 220px" }}>
          <Input type="date" value={checkDate} min={today} onChange={(e) => setCheckDate(e.target.value)} />
        </Field>
        <button
          type="button"
          disabled={!chartId || !activity || checkingDate}
          onClick={handleCheckDate}
          style={{
            padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)", background: "var(--color-surface-soft)",
            color: !chartId || !activity || checkingDate ? "var(--color-faint)" : "var(--color-text-accent)",
            fontWeight: 600, fontSize: "var(--text-base)", cursor: !chartId || !activity || checkingDate ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}
        >
          {checkingDate ? `${t("muhurta_searching", lang)} ${checkDateElapsed}s` : t("muhurta_check_date", lang)}
        </button>
      </div>

      {assessment && (
        <Card compact style={{ marginBottom: "14px", borderColor: assessment.recommended ? "var(--color-border)" : "var(--color-low)" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}>
            <button
              type="button"
              onClick={() => { setAssessment(null); setAssessmentLocation(null); }}
              aria-label={lang === "ta" ? "விளக்கத்தை மூடு" : "Close date explanation"}
              style={{ padding: "4px 8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "transparent", color: "var(--color-text)", cursor: "pointer", font: "inherit", fontSize: "var(--text-sm)", fontWeight: 700 }}
            >
              {lang === "ta" ? "மூடு" : "Close"}
            </button>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text)" }}>
            {t("muhurta_day_suitability", lang)} · {assessmentLocation ? (
              <button
                type="button"
                onClick={() => openPanchangam(assessment.date, assessmentLocation)}
                aria-label={`${t("label_panchangam", lang)} · ${formatMuhurtaDate(assessment.date, lang)}`}
                style={{ padding: 0, border: 0, background: "transparent", color: "var(--color-text-accent)", cursor: "pointer", font: "inherit", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                {formatMuhurtaDate(assessment.date, lang)}
              </button>
            ) : formatMuhurtaDate(assessment.date, lang)}
          </p>
          {!assessment.recommended && (
            <p style={{ margin: "0 0 8px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-low)" }}>
              {t("muhurta_day_not_recommended", lang)}
            </p>
          )}
          <p style={{ margin: "0 0 8px", fontSize: "var(--text-base)", color: SCORE_COLOR(assessment.score), fontWeight: 700 }}>
            {assessment.score.toFixed(1)} · {t("muhurta_score", lang)}
          </p>
          {assessment.traditionalMonthNotices && assessment.traditionalMonthNotices.length > 0 && (
            <div style={{ margin: "0 0 12px", padding: "10px 12px", border: "1px solid var(--color-mid-border)", borderRadius: "var(--radius-sm)", background: "var(--color-surface-soft)" }}>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-mid-text)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {lang === "ta" ? "பொதுவான குடும்ப வழக்கம்" : "General family custom"}
              </p>
              {assessment.traditionalMonthNotices.map((notice, index) => (
                <p key={`${notice.month.en}-${index}`} style={{ margin: "5px 0 0", fontSize: "var(--text-base)", lineHeight: 1.5, color: "var(--color-text)" }}>
                  <strong>{lang === "ta" ? notice.month.ta : notice.month.en}: </strong>
                  {lang === "ta" ? notice.message.ta : notice.message.en}
                </p>
              ))}
            </div>
          )}
          {assessment.factors && assessment.factors.length > 0 && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--color-faint)", letterSpacing: "0.05em" }}>
                {t("muhurta_view_all_reasons", lang)}
              </p>
              <FactorList factors={assessment.factors} lang={lang} />
            </div>
          )}
        </Card>
      )}

      {!result && !loading && !error && <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", textAlign: "center", padding: "var(--space-4) 0" }}>{t("muhurta_empty", lang)}</p>}

      {error && <p role="alert" style={{ fontSize: "var(--text-base)", color: "var(--color-low)", padding: "var(--space-2) 0" }}>{error}</p>}

      {result && result.slots.length > 0 && (
        <div>
          <p style={{ fontSize: "var(--text-base)", fontWeight: 600, marginBottom: "10px", color: "var(--color-text)" }}>
            {t("muhurta_results", lang)} {selectedActivity && <span style={{ color: "var(--color-muted)", fontWeight: 400 }}>· {lang === "ta" ? selectedActivity.ta : selectedActivity.en}</span>}
            {selectedMonthGroup && <span style={{ color: "var(--color-text-accent)", fontWeight: 600 }}> · {tamilMonthLabel(selectedMonthGroup)}</span>}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "var(--space-2)", marginBottom: "14px", padding: "10px 12px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}>
            <span style={{ color: "var(--color-faint)", fontSize: "var(--text-xs)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{lang === "ta" ? "இடம்" : "Results calculated for"}</span>
            <strong style={{ color: "var(--color-text)", fontSize: "var(--text-base)" }}>{result.activityLocation.place}</strong>
            <span style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>· {result.timezone}</span>
          </div>

          {(() => {
            // `PlaceCombobox` deliberately does not spread arbitrary input props
            // (see its own note), so the `style={fieldStyle}` this call site used
            // to pass never reached the input — it has always rendered on the
            // combobox's own --pcbx-* Nova defaults. Dropped rather than ported.
            const compareLabel = lang === "ta" ? "மற்றொரு ஊருடன் ஒப்பிடவும் (விருப்பம்)" : "Compare with another city (optional)";
            return (
              <FieldShell label={compareLabel} style={{ marginBottom: "16px", maxWidth: "560px" }}>
                <PlaceCombobox
                  value={compareCityQuery}
                  lang={lang}
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

          {showTamilMonthControls && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", marginBottom: "14px" }}>
              <FieldShell label={lang === "ta" ? "தமிழ் மாதம்" : "Tamil month"} style={{ flex: "0 1 240px" }}>
                <NovaSelect
                  value={tamilMonthKey}
                  onChange={setTamilMonthKey}
                  ariaLabel={lang === "ta" ? "தமிழ் மாதம்" : "Tamil month"}
                  options={[
                    { value: "", label: lang === "ta" ? `எல்லா மாதங்களும் · ${result.slots.length}` : `All months · ${result.slots.length}` },
                    ...tamilMonthGroups.map((group) => ({
                      value: group.key,
                      label: `${tamilMonthLabel(group)} · ${group.slots.length}`,
                    })),
                  ]}
                />
              </FieldShell>

              <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-base)", color: selectedMonthGroup ? "var(--color-faint)" : "var(--color-muted)", cursor: selectedMonthGroup ? "default" : "pointer" }}>
                <input
                  type="checkbox"
                  checked={groupedView}
                  disabled={selectedMonthGroup !== null}
                  onChange={(e) => setGroupByTamilMonth(e.target.checked)}
                />
                {lang === "ta" ? "தமிழ் மாதவாரியாகப் பிரித்துக் காட்டு" : "List by Tamil month"}
              </label>

              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", marginLeft: "auto" }}>
                {lang === "ta" ? `${visibleSlots.length} தேதிகள்` : `${visibleSlots.length} dates`}
              </span>
            </div>
          )}

          {groupedView
            ? visibleGroups.map((group) => (
                <div key={group.key} style={{ marginBottom: "18px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "var(--space-2)", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-accent)" }}>{tamilMonthLabel(group)}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                      {formatMuhurtaDate(group.firstDate, lang)}
                      {group.lastDate !== group.firstDate && ` – ${formatMuhurtaDate(group.lastDate, lang)}`}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", marginLeft: "auto" }}>
                      {lang === "ta" ? `${group.slots.length} தேதிகள்` : `${group.slots.length} dates`}
                    </span>
                  </div>
                  {byScoreDesc(group.slots).map((slot, i) => (
                    <NovaMuhurtaCard
                      key={`${slot.date}-${i}`}
                      slot={slot}
                      lang={lang}
                      sourceTz={result.timezone}
                      compareCity={compareCity}
                      onOpenPanchangam={(date) => openPanchangam(date, result.activityLocation)}
                    />
                  ))}
                </div>
              ))
            : visibleSlots.map((slot, i) => (
                <NovaMuhurtaCard
                  key={`${slot.date}-${i}`}
                  slot={slot}
                  lang={lang}
                  sourceTz={result.timezone}
                  compareCity={compareCity}
                  onOpenPanchangam={(date) => openPanchangam(date, result.activityLocation)}
                />
              ))}
        </div>
      )}

      {result && result.slots.length === 0 && (
        <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", textAlign: "center", padding: "var(--space-4) 0" }}>
          {lang === "ta" ? "இந்த வரம்பில் சுப நேரம் இல்லை. தேதி வரம்பை விரிவாக்கவும்." : "No auspicious slots found in this range. Try a wider date range."}
        </p>
      )}

      {panchangamRequest && (
        <MuhurtaPanchangamOverlay
          date={panchangamRequest.date}
          location={panchangamRequest.location}
          lang={lang}
          onClose={() => setPanchangamRequest(null)}
        />
      )}
    </div>
  );
}
