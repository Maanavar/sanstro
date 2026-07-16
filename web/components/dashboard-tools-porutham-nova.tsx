"use client";

import { useState } from "react";

import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { MIN_BIRTH_DATE, maxBirthDateIso } from "@/lib/birth-date";
import { t } from "@/lib/i18n";
import { verdictPhrase } from "@/lib/verdict-lexicon";
import type { Lang } from "@/lib/i18n";
import type { ChartCalculateResponseData, ChartDoshamInsight, DirectPoruthamData, KutaResult } from "@/lib/types";

import { RasiChart } from "./dashboard-charts";
import { CompatibilityIntelligencePanel } from "./compatibility-intelligence-panel";
import { Field } from "./dashboard-ui";
import { PlaceCombobox } from "./place-combobox";
import { NovaSelect } from "./nova-select";
import { PoruthamShareLinkButton } from "./porutham-share-link-button";

/**
 * Nova rebuild of PoruthamPanel (see docs/DASHBOARD_UI_REVAMP_PLAN.md §6.12,
 * Tools tab Phase). Reuses PoruthamPanel's exact fetch/validation/PDF logic
 * (POST /api/v1/public/compare, POST /api/v1/public/compare/pdf) — only the
 * JSX/styling is fresh, since the Classic file's own `W` token map (--panel-
 * earth/-tan/-cream/-hover/-brand) is the same reverted 5-token set every
 * other deferred panel this session found unsafe to reuse verbatim. Result
 * layout follows the `tools-porutham` mockup screen: verdict hero (gauge +
 * names + narrative), then a two-column body (10-porutham table | cross-
 * checks + next-steps + disclaimer) instead of Classic's single-column list.
 *
 * Also ports Classic's Compatibility Intelligence upsell/report (the 8-level
 * deep report gated to MARRIAGE + a real family-vault Person 2) and its
 * dedicated PDF branch — the first pass here dropped that feature entirely,
 * making Nova's tool noticeably shallower than Classic's for anyone with a
 * family vault (reported 2026-07-09).
 */

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
  birthTimeLocal: "12:00",
  birthPlace: "",
  birthLatitude: "",
  birthLongitude: "",
  birthTimezone: "Asia/Kolkata",
};

const novaFieldStyle: React.CSSProperties = {
  borderRadius: "10px",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-strong)",
  fontSize: "0.875rem",
  padding: "8px 10px",
  fontFamily: "inherit",
};

type PublicCompareResponse = { success: boolean; data: { chartA: ChartCalculateResponseData; chartB: ChartCalculateResponseData; porutham: DirectPoruthamData } };

const COMPAT_CONTEXTS = ["GENERAL", "MARRIAGE", "FRIENDSHIP", "BUSINESS", "FAMILY"] as const;
type CompatContext = (typeof COMPAT_CONTEXTS)[number];

function contextLabel(ctx: CompatContext, lang: Lang): string {
  if (ctx === "GENERAL") return lang === "ta" ? "பொதுவான" : "General";
  if (ctx === "MARRIAGE") return lang === "ta" ? "திருமணம்" : "Marriage";
  if (ctx === "FRIENDSHIP") return lang === "ta" ? "நட்பு" : "Friendship";
  if (ctx === "BUSINESS") return lang === "ta" ? "தொழில்" : "Business";
  return lang === "ta" ? "குடும்பம்" : "Family";
}

// Reference labels for the classical 10 poruthams — standard Tamil astrology
// terminology, matched to the mockup's own "Governs" column text verbatim
// (not chart-specific, same class of presentation-only addition as Phase 7's
// Ganam/Yoni labels). Matched by substring so minor backend name variants
// (e.g. "Vedha" vs "Vethai") still resolve; unmatched rows just show no
// governs text rather than a guess.
const KUTA_GOVERNS: { match: string; critical?: boolean; en: string; ta: string }[] = [
  // match strings are substrings of the backend kuta names (compute_porutham:
  // "Dinam", "Ganam", "Mahendra", "Stree Dirgha", "Yoni", "Rasi",
  // "Graha Maitri", "Vasya", "Rajju", "Vedha") — the earlier "sthree"/
  // "deergh"/"rasi athipathi"/"vasiyam" spellings matched none of them, so
  // those three rows silently showed no governs text (2026-07 porutham audit).
  { match: "dinam", en: "Health & daily wellbeing", ta: "ஆரோக்கியம்" },
  { match: "ganam", en: "Temperament match", ta: "குணநலன் பொருத்தம்" },
  { match: "mahendra", en: "Progeny & lineage", ta: "சந்ததி" },
  { match: "stree", en: "The bride's prosperity", ta: "மனைவியின் செழுமை" },
  { match: "dirgha", en: "The bride's prosperity", ta: "மனைவியின் செழுமை" },
  { match: "yoni", en: "Physical harmony", ta: "உடல் இணக்கம்" },
  { match: "maitri", en: "Friendship of sign lords", ta: "ராசி அதிபதி நட்பு" },
  { match: "athipathi", en: "Friendship of sign lords", ta: "ராசி அதிபதி நட்பு" },
  { match: "rasi", en: "Growth of the family", ta: "குடும்ப வளர்ச்சி" },
  { match: "vasya", en: "Mutual attraction", ta: "பரஸ்பர ஈர்ப்பு" },
  { match: "vasiyam", en: "Mutual attraction", ta: "பரஸ்பர ஈர்ப்பு" },
  { match: "rajju", critical: true, en: "Longevity of the bond", ta: "பந்த ஆயுள்" },
  { match: "vethai", critical: true, en: "Freedom from affliction", ta: "பாதிப்பு இன்மை" },
  { match: "vedha", critical: true, en: "Freedom from affliction", ta: "பாதிப்பு இன்மை" },
];

function kutaGoverns(kuta: KutaResult) {
  const key = kuta.name.toLowerCase();
  return KUTA_GOVERNS.find((g) => key.includes(g.match));
}

// Cross-check doshams — all four are computed by the same chart-calculate
// pass that produces `chart.doshams` (app/calculations/yogas.py calls all
// four detect_* functions together), so no new backend work is needed here.
// "Dasa sandhi" and "Papasamyam" were dropped: grep-confirmed neither concept
// exists anywhere in app/calculations, so those two cards were permanent
// "not yet available" stubs — replaced with doshams that actually compute.
// KALATHRA_DOSHAM (7th-lord affliction, category "MARRIAGE") is the closest
// existing calculation to what's colloquially called "Mangalya dosham" —
// there's no separately-named Mangalya calculation in this codebase, so it's
// labelled "Mangalya (Kalathra)" rather than claimed as a distinct formula.
const CROSS_CHECK_DOSHAMS: { name: string; labelEn: string; labelTa: string }[] = [
  { name: "SEVVAI_DOSHAM", labelEn: "Sevvai dosham", labelTa: "செவ்வாய் தோஷம்" },
  { name: "RAHU_KETU_DOSHAM", labelEn: "Rahu-Ketu dosham", labelTa: "ராகு-கேது தோஷம்" },
  { name: "KALATHRA_DOSHAM", labelEn: "Mangalya (Kalathra) dosham", labelTa: "மாங்கல்ய (களத்திர) தோஷம்" },
  { name: "PITRU_DOSHAM", labelEn: "Pitru dosham", labelTa: "பித்ரு தோஷம்" },
];

function doshamPresent(doshams: ChartDoshamInsight[], name: string): boolean {
  return doshams.some((d) => d.name === name && d.isPresent);
}

export type PoruthamFamilyMember = {
  memberId: string;
  displayName: string;
  birthDateLocal?: string;
  birthTimeLocal?: string;
  birthPlace?: string;
  birthLatitude?: number | null;
  birthLongitude?: number | null;
  birthTimezone?: string;
};

export function NovaPoruthamPanel({
  lang,
  familyVaultId,
  familyMembers = [],
  onGoToMuhurta,
  onOpenAskVinaadi,
}: {
  lang: Lang;
  familyVaultId?: string;
  familyMembers?: PoruthamFamilyMember[];
  onGoToMuhurta?: () => void;
  onOpenAskVinaadi?: () => void;
}) {
  const [formA, setFormA] = useState<BirthForm>(EMPTY_FORM);
  const [formB, setFormB] = useState<BirthForm>(EMPTY_FORM);
  const [compatCtx, setCompatCtx] = useState<CompatContext>("MARRIAGE");
  const [selectedVaultMemberIdB, setSelectedVaultMemberIdB] = useState<string | null>(null);
  const [showCiReport, setShowCiReport] = useState(false);
  const [chartA, setChartA] = useState<ChartCalculateResponseData | null>(null);
  const [chartB, setChartB] = useState<ChartCalculateResponseData | null>(null);
  const [porutham, setPorutham] = useState<DirectPoruthamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function handleCompare() {
    const valid = (f: BirthForm) => f.displayName && f.birthDateLocal && f.birthPlace && f.birthLatitude && f.birthLongitude && f.birthTimezone;
    if (!valid(formA) || !valid(formB)) {
      setError(lang === "ta" ? "இரு நபர்களின் அனைத்து தகவல்களையும் நிரப்பவும்." : "Please fill all fields for both persons.");
      return;
    }
    setError("");
    setLoading(true);
    setPorutham(null); setChartA(null); setChartB(null);
    try {
      const result = await apiFetchJson<PublicCompareResponse>("/api/v1/public/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personA: { displayName: formA.displayName, birthDateLocal: formA.birthDateLocal, birthTimeLocal: formA.birthTimeLocal || null, birthPlace: formA.birthPlace, birthLatitude: parseFloat(formA.birthLatitude), birthLongitude: parseFloat(formA.birthLongitude), birthTimezone: formA.birthTimezone },
          personB: { displayName: formB.displayName, birthDateLocal: formB.birthDateLocal, birthTimeLocal: formB.birthTimeLocal || null, birthPlace: formB.birthPlace, birthLatitude: parseFloat(formB.birthLatitude), birthLongitude: parseFloat(formB.birthLongitude), birthTimezone: formB.birthTimezone },
          compatibilityContext: compatCtx,
        }),
      });
      setChartA(result.data.chartA);
      setChartB(result.data.chartB);
      setPorutham(result.data.porutham);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!chartA || !chartB || !porutham || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      if (showCiReport && selectedVaultMemberIdB && familyVaultId) {
        const params = new URLSearchParams({ familyVaultId, lang });
        const response = await fetch(
          `/api/backend/api/v1/relationships/${selectedVaultMemberIdB}/compatibility-intelligence/direct/pdf?${params.toString()}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
            body: JSON.stringify({
              personA: { displayName: formA.displayName, birthDateLocal: formA.birthDateLocal, birthTimeLocal: formA.birthTimeLocal || null, birthPlace: formA.birthPlace, birthLatitude: parseFloat(formA.birthLatitude), birthLongitude: parseFloat(formA.birthLongitude), birthTimezone: formA.birthTimezone },
            }),
          }
        );
        if (!response.ok) throw new Error(`${response.status}: PDF export failed`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compatibility_intelligence_${formA.displayName}_${formB.displayName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const response = await fetch(`/api/backend/api/v1/public/compare/pdf?lang=${lang}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
          body: JSON.stringify({
            personA: { displayName: formA.displayName, birthDateLocal: formA.birthDateLocal, birthTimeLocal: formA.birthTimeLocal || null, birthPlace: formA.birthPlace, birthLatitude: parseFloat(formA.birthLatitude), birthLongitude: parseFloat(formA.birthLongitude), birthTimezone: formA.birthTimezone },
            personB: { displayName: formB.displayName, birthDateLocal: formB.birthDateLocal, birthTimeLocal: formB.birthTimeLocal || null, birthPlace: formB.birthPlace, birthLatitude: parseFloat(formB.birthLatitude), birthLongitude: parseFloat(formB.birthLongitude), birthTimezone: formB.birthTimezone },
            compatibilityContext: compatCtx,
          }),
        });
        if (!response.ok) throw new Error(`${response.status}: PDF export failed`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `porutham_${chartA.birthProfile.displayName}_${chartB.birthProfile.displayName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setError(lang === "ta" ? "PDF பதிவிறக்கம் தோல்வியடைந்தது." : "PDF download failed.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  function loadMember(which: "A" | "B", memberId: string) {
    const m = familyMembers.find((fm) => fm.memberId === memberId);
    if (!m) return;
    const patch: BirthForm = {
      displayName: m.displayName,
      birthDateLocal: m.birthDateLocal ?? "",
      birthTimeLocal: m.birthTimeLocal ?? "12:00",
      birthPlace: m.birthPlace ?? "",
      birthLatitude: m.birthLatitude != null ? String(m.birthLatitude) : "",
      birthLongitude: m.birthLongitude != null ? String(m.birthLongitude) : "",
      birthTimezone: m.birthTimezone ?? "Asia/Kolkata",
    };
    if (which === "A") {
      setFormA(patch);
    } else {
      setFormB(patch);
      const isVaultMember = !m.memberId.startsWith("owner:");
      setSelectedVaultMemberIdB(isVaultMember ? m.memberId : null);
      setShowCiReport(false);
    }
  }

  const pct = porutham ? porutham.totalScore / Math.max(1, porutham.maxScore) : 0;
  // A Rajju/Vedha veto is inauspicious regardless of the numeric score — the
  // dial and verdict chip must not read green just because 9/10 kutas passed.
  const criticalFail = porutham ? porutham.rajjuDosha || porutham.vedhaDosha : false;
  const scoreTone = criticalFail ? "var(--color-low)" : pct >= 0.7 ? "var(--color-high)" : pct >= 0.45 ? "var(--color-mid)" : "var(--color-low)";
  const scoreToneBand = criticalFail ? "low" : pct >= 0.7 ? "high" : pct >= 0.45 ? "mid" : "low";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Context selector */}
      <div style={{ padding: "14px 16px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", marginRight: "4px" }}>
            {lang === "ta" ? "வகை" : "Context"}
          </span>
          {COMPAT_CONTEXTS.map((ctx) => (
            <button key={ctx} type="button" onClick={() => setCompatCtx(ctx)}
              style={{
                padding: "5px 14px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                border: compatCtx === ctx ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: compatCtx === ctx ? "var(--color-accent-muted)" : "var(--color-surface-soft)",
                color: compatCtx === ctx ? "var(--color-accent-strong)" : "var(--color-muted)",
              }}>
              {contextLabel(ctx, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Two person forms */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {([["A", formA, setFormA, "var(--color-accent-strong)"], ["B", formB, setFormB, "var(--color-accent-secondary)"]] as const).map(([which, form, setForm, accent]) => (
          <div key={which} style={{ flex: 1, minWidth: "260px", padding: "20px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
            {familyMembers.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {lang === "ta" ? "குடும்பத்தினரை ஏற்றவும்" : "Load from family"}
                </label>
                <NovaSelect
                  value=""
                  onChange={(v) => loadMember(which, v)}
                  placeholder={lang === "ta" ? "-- தேர்ந்தெடுக்கவும் --" : "-- Select member --"}
                  ariaLabel={lang === "ta" ? "குடும்பத்தினரை ஏற்றவும்" : "Load from family"}
                  options={familyMembers.map((m) => ({ value: m.memberId, label: m.displayName }))}
                />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: accent }}>
                {/* /public/compare carries no gender, so the engine always
                    counts Person 1 as the boy and Person 2 as the girl for the
                    direction-sensitive poruthams (Dinam, Mahendra, Stree
                    Dirgham) — say so in the MARRIAGE context instead of the
                    neutral "Person 1/2" that invites entering the bride first. */}
                {which === "A"
                  ? (compatCtx === "MARRIAGE"
                      ? (lang === "ta" ? "♂ மணமகன் — நபர் 1" : "♂ Groom — Person 1")
                      : (lang === "ta" ? "நபர் 1" : "Person 1"))
                  : (compatCtx === "MARRIAGE"
                      ? (lang === "ta" ? "♀ மணமகள் — நபர் 2" : "♀ Bride — Person 2")
                      : (lang === "ta" ? "நபர் 2" : "Person 2"))}
              </p>
              <Field label={lang === "ta" ? "பெயர்" : "Name"}>
                <input style={novaFieldStyle} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder={lang === "ta" ? "பெயர் உள்ளிடவும்" : "Enter name"} />
              </Field>
              <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth Date"}>
                <input style={novaFieldStyle} type="date" value={form.birthDateLocal} min={MIN_BIRTH_DATE} max={maxBirthDateIso()} onChange={(e) => setForm({ ...form, birthDateLocal: e.target.value })} />
              </Field>
              <Field label={lang === "ta" ? "பிறந்த நேரம்" : "Birth Time"}>
                <input style={novaFieldStyle} type="time" value={form.birthTimeLocal} onChange={(e) => setForm({ ...form, birthTimeLocal: e.target.value })} />
              </Field>
              <Field label={t("field_birth_place", lang)} helper={t("field_place_helper", lang)}>
                <PlaceCombobox
                  value={form.birthPlace}
                  onChange={(city, raw) => setForm({ ...form, birthPlace: raw, ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}) })}
                />
              </Field>
              <Field label={t("field_timezone", lang)}>
                <input style={novaFieldStyle} value={form.birthTimezone} onChange={(e) => setForm({ ...form, birthTimezone: e.target.value })} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))", gap: "8px" }}>
                <Field label={t("field_latitude", lang)}>
                  <input style={novaFieldStyle} inputMode="decimal" value={form.birthLatitude} onChange={(e) => setForm({ ...form, birthLatitude: e.target.value })} />
                </Field>
                <Field label={t("field_longitude", lang)}>
                  <input style={novaFieldStyle} inputMode="decimal" value={form.birthLongitude} onChange={(e) => setForm({ ...form, birthLongitude: e.target.value })} />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ margin: 0, color: "var(--color-low)", fontSize: "0.8rem" }}>{error}</p>}

      <button type="button" onClick={() => void handleCompare()} disabled={loading}
        style={{
          alignSelf: "flex-start", padding: "10px 24px", borderRadius: "10px",
          border: "1px solid var(--color-accent)",
          background: loading ? "var(--color-surface-soft)" : "var(--color-accent)",
          color: loading ? "var(--color-muted)" : "var(--color-on-accent)",
          cursor: loading ? "wait" : "pointer", fontWeight: 700, fontSize: "0.8rem", fontFamily: "inherit",
        }}>
        {loading ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…") : (lang === "ta" ? "பொருத்தம் காண்க" : "Check Compatibility")}
      </button>

      {/* Results — mirrors the tools-porutham mockup: verdict hero, then a
          two-column body (10-porutham table | cross-checks/next-steps) */}
      {porutham && chartA && chartB && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{
            position: "relative", overflow: "hidden",
            background: "linear-gradient(135deg, var(--color-surface-soft), var(--color-surface-3))",
            border: "1px solid var(--color-border-strong)", borderRadius: "16px", padding: "26px 28px",
          }}>
            <div style={{ display: "flex", gap: "26px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ position: "relative", width: "116px", height: "116px", borderRadius: "50%", background: `conic-gradient(${scoreTone} ${pct * 360}deg, var(--color-border) 0)`, display: "grid", placeItems: "center" }}>
                  <div style={{ width: "92px", height: "92px", borderRadius: "50%", background: "var(--color-surface-3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1px solid ${scoreTone}` }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 700, lineHeight: 1, color: scoreTone }}>{porutham.totalScore}</div>
                    <div style={{ fontSize: "9px", color: "var(--color-faint)", letterSpacing: "0.08em", marginTop: "1px" }}>/ {porutham.maxScore} {lang === "ta" ? "பொருத்தம்" : "PORUTHAMS"}</div>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: scoreTone, background: `${scoreTone}22`, border: `1px solid ${scoreTone}55`, borderRadius: "999px", padding: "4px 12px" }}>
                  {/* Same verdict wording as the marketing calculator: shared
                      lexicon phrase, and the marriage-critical override text
                      verbatim from PoruthamTool.tsx's verdictLabel. */}
                  {criticalFail && compatCtx === "MARRIAGE"
                    ? (lang === "ta" ? "தோஷம் — தவிர்க்கவும்" : "Dosham - Avoid")
                    : (verdictPhrase("porutham", porutham.label, lang) ?? porutham.label)}
                </span>
              </div>
              <div style={{ flex: "1", minWidth: "260px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
                    {lang === "ta" ? "பொருத்தம் முடிவு" : "Porutham Result"}
                  </span>
                  {(porutham.rajjuDosha || porutham.vedhaDosha) && (
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-low)", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "999px", padding: "2px 10px" }}>
                      ⚠ {porutham.rajjuDosha ? (lang === "ta" ? "ராஜ்ஜு தோஷம்" : "Rajju Dosha") : (lang === "ta" ? "வேத தோஷம்" : "Vedha Dosha")}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "13px", fontWeight: 700 }}>{chartA.birthProfile.displayName.charAt(0).toUpperCase()}</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-strong)" }}>{chartA.birthProfile.displayName}</div>
                  </div>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", color: "var(--color-text-accent)" }}>×</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--color-high)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "13px", fontWeight: 700 }}>{chartB.birthProfile.displayName.charAt(0).toUpperCase()}</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-strong)" }}>{chartB.birthProfile.displayName}</div>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-nova-prose), Georgia, serif", fontSize: "14.5px", lineHeight: 1.6, color: "var(--color-text)", maxWidth: "620px" }}>
                  {lang === "ta" ? porutham.summary.ta : porutham.summary.en}
                </div>
                {porutham.contextNote && (
                  <div style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>
                    {lang === "ta" ? porutham.contextNote.ta : porutham.contextNote.en}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="nova-grid-detail">
            {/* LEFT: 10 porutham table */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
                  {lang === "ta" ? "தமிழ் 10 பொருத்தங்கள்" : "The ten poruthams"}
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-faint)" }}>✓ {lang === "ta" ? "பொருத்தம்" : "match"} · ✕ {lang === "ta" ? "இல்லை" : "no match"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                {porutham.kutas.map((k) => {
                  const pass = k.passed ?? k.score > 0;
                  const governs = kutaGoverns(k);
                  return (
                    <div key={k.name} style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "9px",
                      background: governs?.critical ? "var(--color-high-bg)" : "var(--color-surface-soft)",
                      border: governs?.critical ? "1px solid var(--color-high-border)" : "1px solid var(--color-border)",
                    }}>
                      <div style={{ minWidth: "150px" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{lang === "ta" ? k.nameTa : k.name}</span>
                        {governs?.critical && (
                          <span style={{ marginLeft: "6px", fontSize: "9px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-high)", borderRadius: "4px", padding: "1px 6px" }}>
                            {lang === "ta" ? "முக்கியம்" : "CRITICAL"}
                          </span>
                        )}
                      </div>
                      {governs && <span style={{ flex: 1, fontSize: "0.75rem", color: "var(--color-muted)" }}>{lang === "ta" ? governs.ta : governs.en}</span>}
                      {!governs && <span style={{ flex: 1 }} />}
                      <span style={{
                        fontSize: "0.7rem", fontWeight: 700, padding: "3px 9px", borderRadius: "999px",
                        color: pass ? "var(--color-high)" : "var(--color-low)",
                        background: pass ? "var(--color-high-bg)" : "var(--color-low-bg)",
                        border: pass ? "1px solid var(--color-high-border)" : "1px solid var(--color-low-border)",
                      }}>
                        {pass ? (lang === "ta" ? "✓ பொருத்தம்" : "✓ match") : (lang === "ta" ? "✗ இல்லை" : "✗ no match")}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--color-faint)", fontStyle: "italic", borderTop: "1px solid var(--color-border)", paddingTop: "10px" }}>
                {/* The engine is strict pass/fail (1 point per porutham, no
                    half scores) — the earlier "partial matches score half"
                    copy misdescribed the calculation (2026-07 audit). */}
                {lang === "ta"
                  ? "ஒவ்வொரு பொருத்தமும் பொருந்தும்/பொருந்தாது என்ற நேரடிச் சோதனை — தலா ஒரு மதிப்பெண். இது குடும்பங்களுக்கிடையேயான உரையாடலுக்கான வழிகாட்டி — கட்டாய நிபந்தனை அல்ல."
                  : "Each porutham is a strict pass/fail check — one point each. A porutham is guidance for conversation between families — not a gate."}
              </p>
            </div>

            {/* RIGHT rail */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-accent)", fontWeight: 700 }}>
                  {lang === "ta" ? "குறுக்கு சோதனைகள்" : "Cross-checks"}
                </span>
                {CROSS_CHECK_DOSHAMS.map(({ name, labelEn, labelTa }) => {
                  const a = doshamPresent(chartA.doshams, name);
                  const b = doshamPresent(chartB.doshams, name);
                  const balanced = a === b;
                  return (
                    <div key={name} style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: balanced ? "var(--color-high-bg)" : "var(--color-mid-bg)", border: balanced ? "1px solid var(--color-high-border)" : "1px solid var(--color-mid-border)", borderRadius: "10px", padding: "11px 13px" }}>
                      <span style={{ flex: "none", width: "20px", height: "20px", borderRadius: "50%", background: balanced ? "var(--color-high-bg)" : "var(--color-mid-bg)", display: "grid", placeItems: "center", fontSize: "11px", color: balanced ? "var(--color-high)" : "var(--color-mid)" }}>{balanced ? "✓" : "~"}</span>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-strong)" }}>
                          {lang === "ta" ? labelTa : labelEn} — {balanced ? (lang === "ta" ? "சமநிலை" : "balanced") : (lang === "ta" ? "ஒரே பக்கம்" : "one-sided")}
                        </div>
                        <div style={{ fontSize: "11px", lineHeight: 1.5, color: "var(--color-muted)", marginTop: "2px" }}>
                          {a && b
                            ? (lang === "ta" ? "இரு ஜாதகங்களிலும் உள்ளது; ஒன்றுக்கொன்று பதிலளிக்கின்றன." : "Both charts carry it; they answer each other.")
                            : !a && !b
                            ? (lang === "ta" ? "இரு ஜாதகங்களிலும் இல்லை." : "Present in neither chart.")
                            : (lang === "ta" ? "ஒரு ஜாதகத்தில் மட்டும் உள்ளது — ஜோதிடருடன் கலந்தாலோசிக்கவும்." : "Present in only one chart — worth an astrologer's reading.")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "linear-gradient(120deg, var(--color-accent-muted), transparent)", border: "1px solid var(--color-border-strong)", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-strong)", fontWeight: 700 }}>
                  {lang === "ta" ? "தொடர்ந்தால்" : "If you go ahead"}
                </span>
                <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.6, color: "var(--color-text)" }}>
                  {lang === "ta"
                    ? "அடுத்த படி ஒரு முகூர்த்தம் — இரு ஜாதகங்களிலிருந்தும் திருமண நேரங்களை மதிப்பிட முகூர்த்தம் கண்டறியும் கருவியைப் பயன்படுத்தலாம்."
                    : "Next step is a muhurta — score wedding windows from both charts together in Plan's Best Dates & Muhurta."}
                </p>
                {onGoToMuhurta && (
                  <button type="button" onClick={onGoToMuhurta} style={{ textAlign: "center", background: "var(--color-accent)", color: "var(--color-on-accent)", border: "none", borderRadius: "9px", padding: "9px 0", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {lang === "ta" ? "திருமண முகூர்த்தம் காண்க →" : "Find wedding muhurtas →"}
                  </button>
                )}
                {onOpenAskVinaadi && (
                  <button type="button" onClick={onOpenAskVinaadi} style={{ textAlign: "center", border: "1px solid var(--color-border-strong)", color: "var(--color-accent-strong)", background: "none", borderRadius: "9px", padding: "9px 0", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {lang === "ta" ? "இந்த பொருத்தம் பற்றி கேளுங்கள் ✦" : "Ask Vinaadi about this match ✦"}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => void handleDownloadPdf()} disabled={downloadingPdf}
                  style={{ padding: "8px 18px", borderRadius: "9px", border: "1px solid var(--color-border-strong)", background: "none", color: downloadingPdf ? "var(--color-faint)" : "var(--color-accent-strong)", cursor: downloadingPdf ? "wait" : "pointer", fontWeight: 600, fontSize: "12.5px", fontFamily: "inherit" }}>
                  {downloadingPdf
                    ? (lang === "ta" ? "PDF பதிவிறக்குகிறது…" : "Downloading PDF…")
                    : showCiReport
                      ? `⤓ ${lang === "ta" ? "முழு அறிக்கை PDF" : "Full Report PDF"}`
                      : `⤓ ${lang === "ta" ? "PDF பதிவிறக்கம்" : "PDF"}`}
                </button>
                <PoruthamShareLinkButton lang={lang} formA={formA} formB={formB} compatibilityContext={compatCtx} />
              </div>

              <p style={{ margin: 0, fontSize: "11px", color: "var(--color-faint)", lineHeight: 1.55, background: "rgba(243,236,221,0.03)", border: "1px dashed var(--color-border-strong)", borderRadius: "12px", padding: "11px 14px" }}>
                {lang === "ta"
                  ? "இந்த முடிவுகள் இரு தற்காலிக ஜாதகங்களிலிருந்து கணக்கிடப்பட்டவை — உங்கள் கணக்கில் சேமிக்கப்படவில்லை. இறுதி முடிவுக்கு உங்கள் குடும்ப ஜோதிடரிடம் PDF-ஐ பகிரவும்."
                  : "These results are computed from the two preview charts and are not saved to your account. Share the PDF with your family astrologer for the final word."}
              </p>
            </div>
          </div>

          {/* Side-by-side charts — kept from Classic as real confirmation of the underlying calculation, not shown in the mockup's own captured state */}
          <div className="nova-grid-2">
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-accent-strong)" }}>{chartA.birthProfile.displayName}</p>
              <RasiChart chart={chartA} label={t("label_d1", lang)} lang={lang} showExplain={false} />
            </div>
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-high)" }}>{chartB.birthProfile.displayName}</p>
              <RasiChart chart={chartB} label={t("label_d1", lang)} lang={lang} showExplain={false} />
            </div>
          </div>

          {/* Compatibility Intelligence upsell / report — ported from Classic
              PoruthamPanel: the 8-level deep report (7th house, Navamsa, dasha
              timing, Sevvai dosham, emotional match, 0-100 score) is what makes
              Classic's tool "deeper" than this one was. Gated the same way
              Classic gates it: MARRIAGE context + a real family-vault member
              loaded as Person 2 (not the "owner:"-prefixed self entry). */}
          {compatCtx === "MARRIAGE" && familyVaultId && selectedVaultMemberIdB && (
            <div>
              {!showCiReport ? (
                <div style={{
                  background: "linear-gradient(120deg, var(--color-high-bg), transparent)",
                  border: "1px solid var(--color-high-border)", borderRadius: "14px", padding: "18px 20px",
                  display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap",
                }}>
                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "14px", color: "var(--color-text-strong)" }}>
                      {lang === "ta" ? "இணக்க நுண்ணறிவு அறிக்கை" : "Full Compatibility Intelligence Report"}
                    </p>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {lang === "ta"
                        ? "7ஆம் இடம் · நவாம்சம் · தசை இணக்கம் · செவ்வாய் தோஷம் · உணர்வு இணக்கம் · ஒட்டுமொத்த மதிப்பெண் (0–100) உள்ளிட்ட 8 அடுக்கு ஆழமான பகுப்பாய்வு"
                        : "8-level deep analysis: 7th house · Navamsa · Dasha timing · Sevvai Dosham · Emotional · Overall score 0–100"}
                    </p>
                  </div>
                  <button type="button" onClick={() => setShowCiReport(true)} style={{
                    padding: "9px 20px", background: "var(--color-accent)", color: "var(--color-on-accent)",
                    border: "none", borderRadius: "999px", fontFamily: "inherit", fontSize: "12.5px", fontWeight: 700,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                    {lang === "ta" ? "முழு அறிக்கை காண்க →" : "View Full Report →"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "var(--color-text-strong)" }}>
                      {lang === "ta" ? "இணக்க நுண்ணறிவு அறிக்கை" : "Compatibility Intelligence Report"}
                    </p>
                    <button type="button" onClick={() => setShowCiReport(false)} style={{ fontSize: "12px", color: "var(--color-muted)", background: "none", border: "1px solid var(--color-border)", borderRadius: "999px", padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}>
                      {lang === "ta" ? "மறை" : "Hide"}
                    </button>
                  </div>
                  <CompatibilityIntelligencePanel
                    familyVaultId={familyVaultId}
                    memberId={selectedVaultMemberIdB}
                    personABirth={{
                      displayName: formA.displayName,
                      birthDateLocal: formA.birthDateLocal,
                      birthTimeLocal: formA.birthTimeLocal || null,
                      birthPlace: formA.birthPlace,
                      birthLatitude: parseFloat(formA.birthLatitude),
                      birthLongitude: parseFloat(formA.birthLongitude),
                      birthTimezone: formA.birthTimezone,
                    }}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
