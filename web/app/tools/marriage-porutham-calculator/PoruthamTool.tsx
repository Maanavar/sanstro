"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/lang-toggle";
import { romanNakshathiramName } from "@/lib/tamil-astro";
import { readErrorMessage } from "@/lib/api";
import { getPorutham, getPoruthamGrid } from "@vinaadi/shared/api/porutham";
import type { PublicPoruthamGridItem, PublicPoruthamStarData } from "@vinaadi/shared";

// ========== DISPLAY-ONLY REFERENCE DATA ==========
// These tables are fixed classical nakshatra attributes (which gana/yoni/nadi/rajju
// group a star belongs to, and which rasi its padas fall in) used only to label the
// UI and to pick which rasi-pada to send the backend. They are verified byte-for-byte
// identical to the backend's own tables (app/calculations/porutham.py) as of the
// 2026-07 wiring audit. All PASS/FAIL compatibility judgments come from the API —
// no porutham scoring rule is duplicated here.

const NAKSHATRAS = [
  { id: 0, en: "Aswini",           ta: "அசுவினி" },
  { id: 1, en: "Bharani",          ta: "பரணி" },
  { id: 2, en: "Karthigai",        ta: "கார்த்திகை" },
  { id: 3, en: "Rohini",           ta: "ரோகிணி" },
  { id: 4, en: "Mirugaseeridam",   ta: "மிருகசீரிடம்" },
  { id: 5, en: "Thiruvathirai",    ta: "திருவாதிரை" },
  { id: 6, en: "Punarpoosam",      ta: "புனர்பூசம்" },
  { id: 7, en: "Poosam",           ta: "பூசம்" },
  { id: 8, en: "Ayilyam",          ta: "ஆயில்யம்" },
  { id: 9, en: "Magam",            ta: "மகம்" },
  { id: 10, en: "Pooram",          ta: "பூரம்" },
  { id: 11, en: "Uthiram",         ta: "உத்திரம்" },
  { id: 12, en: "Hastham",         ta: "ஹஸ்தம்" },
  { id: 13, en: "Chithirai",       ta: "சித்திரை" },
  { id: 14, en: "Swathi",          ta: "சுவாதி" },
  { id: 15, en: "Visakam",         ta: "விசாகம்" },
  { id: 16, en: "Anusham",         ta: "அனுஷம்" },
  { id: 17, en: "Kettai",          ta: "கேட்டை" },
  { id: 18, en: "Moolam",          ta: "மூலம்" },
  { id: 19, en: "Pooradam",        ta: "பூராடம்" },
  { id: 20, en: "Uthiradam",       ta: "உத்திராடம்" },
  { id: 21, en: "Thiruvonam",      ta: "திருவோணம்" },
  { id: 22, en: "Avittam",         ta: "அவிட்டம்" },
  { id: 23, en: "Sadayam",         ta: "சதயம்" },
  { id: 24, en: "Poorattathi",     ta: "பூரட்டாதி" },
  { id: 25, en: "Uthirattathi",    ta: "உத்திரட்டாதி" },
  { id: 26, en: "Revathi",         ta: "ரேவதி" },
];

// Gana: 0=Deva, 1=Manushya, 2=Rakshasa
const GANA = [0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
const GANA_NAMES = ["தேவ", "மனுஷ்ய", "ராக்ஷஸ"];
const GANA_NAMES_EN = ["Deva", "Manushya", "Rakshasa"];

// Yoni: 0=Horse … 13=Lion
const YONI = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
const YONI_NAMES_TA = ["குதிரை","யானை","ஆடு","பாம்பு","நாய்","பூனை","எலி","பசு","எருமை","புலி","மான்","குரங்கு","கீரி","சிங்கம்"];
const YONI_NAMES_EN = ["Horse","Elephant","Goat","Serpent","Dog","Cat","Rat","Cow","Buffalo","Tiger","Deer","Monkey","Mongoose","Lion"];

// Rajju: 0=Paada 1=Kati 2=Nabhi 3=Kantha 4=Siro (repeating serpentine pattern within each 9)
const RAJJU_PATTERN = [0,1,2,3,4,3,2,1,0];
const RAJJU = NAKSHATRAS.map((_,i) => RAJJU_PATTERN[i % 9]);
const RAJJU_NAMES_TA = ["பாத ரஜ்ஜு","கடி ரஜ்ஜு","நாபி ரஜ்ஜு","கண்ட ரஜ்ஜு","சிரோ ரஜ்ஜு"];
const RAJJU_NAMES_EN = ["Paada","Kati","Nabhi","Kantha","Siro"];

// Nadi: 0=Aadhi 1=Madhya 2=Anthya
const NADI_CYCLE = [0, 1, 2, 2, 1, 0];
const NADI = NAKSHATRAS.map((_,i) => NADI_CYCLE[i % 6]);
const NADI_NAMES_TA = ["ஆதி நாடி","மத்திய நாடி","அந்திய நாடி"];
const NADI_NAMES_EN = ["Aadhi","Madhya","Anthya"];

// Rasi assignment (0-11 = Mesha…Meena). 9 nakshatras straddle a rasi boundary (a 30°
// rasi never divides evenly into 13°20' nakshatras); the value below is the majority-
// pada rasi (later half on an exact 50/50 split) — this is also what the backend
// resolves to by default (nakshatra_to_rasi(nak, pada=3)) when no pada is specified.
const RASI = [0,0,1,1,2,2,2,3,3,4,4,5,5,6,6,6,7,7,8,8,9,9,10,10,10,11,11];
const RASI_NAMES_TA = ["மேஷம்","ரிஷபம்","மிதுனம்","கடகம்","சிம்மம்","கன்னி","துலாம்","விருச்சிகம்","தனுசு","மகரம்","கும்பம்","மீனம்"];
const RASI_NAMES_EN = ["Mesha","Rishaba","Mithuna","Kataka","Simha","Kanni","Thula","Vrischika","Dhanus","Makara","Kumbha","Meena"];

// Nakshatras whose 4 padas fall across two rasis. Users can specify which pada group
// they belong to; "early" maps to backend pada=1, "late" to pada=4 (either always
// lands in the correct half regardless of exactly where the 2/2 vs 1/3 split falls).
const SPLIT_NAK: Record<number, { early: [string, string, number]; late: [string, string, number] }> = {
  2:  { early: ["பாதம் 1 · மேஷம்",     "Pada 1 · Mesha",       0], late: ["பாதம் 2–4 · ரிஷபம்",   "Padas 2–4 · Rishaba",   1] },
  4:  { early: ["பாதம் 1–2 · ரிஷபம்",  "Padas 1–2 · Rishaba",  1], late: ["பாதம் 3–4 · மிதுனம்",  "Padas 3–4 · Mithuna",   2] },
  6:  { early: ["பாதம் 1–3 · மிதுனம்", "Padas 1–3 · Mithuna",  2], late: ["பாதம் 4 · கடகம்",      "Pada 4 · Kataka",       3] },
  11: { early: ["பாதம் 1 · சிம்மம்",   "Pada 1 · Simha",       4], late: ["பாதம் 2–4 · கன்னி",    "Padas 2–4 · Kanni",     5] },
  13: { early: ["பாதம் 1–2 · கன்னி",   "Padas 1–2 · Kanni",    5], late: ["பாதம் 3–4 · துலாம்",   "Padas 3–4 · Thula",     6] },
  15: { early: ["பாதம் 1–3 · துலாம்",  "Padas 1–3 · Thula",    6], late: ["பாதம் 4 · விருச்சிகம்", "Pada 4 · Vrischika",   7] },
  20: { early: ["பாதம் 1 · தனுசு",     "Pada 1 · Dhanus",      8], late: ["பாதம் 2–4 · மகரம்",    "Padas 2–4 · Makara",    9] },
  22: { early: ["பாதம் 1–2 · மகரம்",   "Padas 1–2 · Makara",   9], late: ["பாதம் 3–4 · கும்பம்",  "Padas 3–4 · Kumbha",   10] },
  24: { early: ["பாதம் 1–3 · கும்பம்", "Padas 1–3 · Kumbha",  10], late: ["பாதம் 4 · மீனம்",      "Pada 4 · Meena",       11] },
};

function getEffRasi(starIdx: number, split: "early" | "late" | null): number {
  const s = SPLIT_NAK[starIdx];
  if (s && split !== null) return s[split][2];
  return RASI[starIdx];
}

function splitToPada(split: "early" | "late" | null): number | undefined {
  if (split === "early") return 1;
  if (split === "late") return 4;
  return undefined;
}

// ========== VERDICT LABEL/COLOR HELPERS (presentational only — thresholds mirror
// the backend's own EXCELLENT/GOOD/AVERAGE/CAUTION cutoffs in app/calculations/porutham.py) ==========

const LABEL_TEXT: Record<string, [string, string]> = {
  EXCELLENT: ["மிக நல்ல பொருத்தம்", "Excellent"],
  GOOD:      ["நல்ல பொருத்தம்", "Good"],
  AVERAGE:   ["சராசரி பொருத்தம்", "Average"],
  CAUTION:   ["குறைவான பொருத்தம்", "Below Average"],
};

function verdictLabel(apiLabel: string, criticalFail: boolean, ta: boolean): string {
  if (criticalFail) return ta ? "தோஷம் — தவிர்க்கவும்" : "Dosham - Avoid";
  const entry = LABEL_TEXT[apiLabel] ?? LABEL_TEXT.CAUTION;
  return entry[ta ? 0 : 1];
}

function scoreColor(score: number, criticalFail: boolean): string {
  if (criticalFail || score < 5) return "var(--cl-caution)";
  if (score >= 9) return "var(--cl-sage)";
  if (score >= 7) return "#4a7041";
  return "var(--cl-accent)";
}
function scoreBg(score: number, criticalFail: boolean): string {
  if (criticalFail || score < 5) return "var(--cl-caution-soft)";
  if (score >= 7) return "var(--cl-sage-soft)";
  return "var(--cl-accent-soft)";
}

const BASE_STAR_BTN: React.CSSProperties = {
  padding: "8px 6px", border: "1px solid var(--cl-border)",
  borderRadius: "8px", background: "var(--cl-surface)",
  cursor: "pointer", fontSize: "12px", textAlign: "center",
  lineHeight: 1.3, transition: "all 0.15s", fontFamily: "inherit",
};

// ========== COMPONENT ==========

export function PoruthamTool() {
  const [lang] = useLang();
  const ta = lang === "ta";
  const starNameEn = (index: number) => romanNakshathiramName(NAKSHATRAS[index].en);

  const [girlStar, setGirlStar] = useState<number | null>(null);
  const [boyStar,  setBoyStar]  = useState<number | null>(null);
  const [girlSplit, setGirlSplit] = useState<"early" | "late" | null>(null);
  const [boySplit,  setBoySplit]  = useState<"early" | "late" | null>(null);
  const [view, setView] = useState<"selector" | "grid">("selector");

  const [gridData, setGridData] = useState<PublicPoruthamGridItem[] | null>(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState("");

  const [detailData, setDetailData] = useState<PublicPoruthamStarData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const girlEffRasi = girlStar !== null ? getEffRasi(girlStar, girlSplit) : undefined;
  const boyEffRasi  = boyStar  !== null ? getEffRasi(boyStar,  boySplit)  : undefined;

  const starEffRasi = (star: number) =>
    star === girlStar ? (girlEffRasi ?? RASI[star]) : (boyEffRasi ?? RASI[star]);

  // Fetch all 27 boy-star comparisons in one call whenever the girl star (or her
  // pada choice) changes — powers both the inline score grid and the "Full Grid" tab.
  useEffect(() => {
    if (girlStar === null) { setGridData(null); setGridError(""); return; }
    let cancelled = false;
    setGridLoading(true);
    setGridError("");
    getPoruthamGrid({ girlNakshatraNumber: girlStar + 1, girlPada: splitToPada(girlSplit) })
      .then((res) => { if (!cancelled) setGridData(res.results); })
      .catch((err) => { if (!cancelled) setGridError(readErrorMessage(err)); })
      .finally(() => { if (!cancelled) setGridLoading(false); });
    return () => { cancelled = true; };
  }, [girlStar, girlSplit]);

  // Fetch the full 10-kuta breakdown for the selected pair.
  useEffect(() => {
    if (girlStar === null || boyStar === null) { setDetailData(null); setDetailError(""); return; }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    getPorutham({
      girlNakshatraNumber: girlStar + 1,
      boyNakshatraNumber: boyStar + 1,
      girlPada: splitToPada(girlSplit),
      boyPada: splitToPada(boySplit),
    })
      .then((res) => { if (!cancelled) setDetailData(res.data); })
      .catch((err) => { if (!cancelled) setDetailError(readErrorMessage(err)); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [girlStar, boyStar, girlSplit, boySplit]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--cl-border)" }}>
        {([
          { key: "selector", ta: "நட்சத்திரம் தேர்வு", en: "Select Stars" },
          { key: "grid",     ta: "முழு அட்டவணை",      en: "Full Grid" },
        ] as const).map(tab => (
          <button key={tab.key}
            onClick={() => { setView(tab.key); if (tab.key === "grid") setBoyStar(null); }}
            style={{
              flex: 1, padding: "10px 8px", border: "none",
              borderBottom: view === tab.key ? "3px solid var(--cl-accent)" : "3px solid transparent",
              background: "transparent",
              color: view === tab.key ? "var(--cl-accent)" : "var(--cl-muted)",
              fontWeight: view === tab.key ? 700 : 400,
              cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
            }}>
            <div>{ta ? tab.ta : tab.en}</div>
          </button>
        ))}
      </div>

      {/* ── SELECTOR VIEW ── */}
      {view === "selector" && (
        <>
          {/* Girl star picker */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 700, color: "var(--cl-accent)" }}>
              ♀ {ta ? "பெண் நட்சத்திரம்" : "Girl's Birth Star"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", gap: "6px" }}>
              {NAKSHATRAS.map((n, i) => (
                <button key={i}
                  onClick={() => { setGirlStar(i); setBoyStar(null); setGirlSplit(null); setBoySplit(null); }}
                  style={{
                    ...BASE_STAR_BTN,
                    border: girlStar === i ? "2px solid var(--cl-accent)" : "1px solid var(--cl-border)",
                    background: girlStar === i ? "var(--cl-accent-soft)" : "var(--cl-surface)",
                  }}>
                  <div style={{ fontWeight: 600, color: girlStar === i ? "var(--cl-accent)" : "var(--cl-ink)" }}>{ta ? n.ta : n.en}</div>
                  {ta && <div style={{ fontSize: "10px", color: "var(--cl-muted)" }}>{starNameEn(i)}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Pada sub-selector — shown for any nakshatra whose padas straddle two rasis */}
          {girlStar !== null && SPLIT_NAK[girlStar] && (
            <div style={{ padding: "12px 14px", background: "var(--cl-bg-2)", border: "1px solid var(--cl-accent)", borderRadius: "10px", fontSize: "12px" }}>
              <div style={{ fontWeight: 700, color: "var(--cl-accent)", marginBottom: "8px" }}>
                {ta
                  ? `${NAKSHATRAS[girlStar].ta} இரண்டு ராசிகளில் பிரிகிறது — எந்த பாதம்?`
                  : `${starNameEn(girlStar)} spans two rasis — which pada group?`}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["early", "late"] as const).map(k => {
                  const opt = SPLIT_NAK[girlStar][k];
                  return (
                    <button key={k} type="button"
                      onClick={() => setGirlSplit(prev => prev === k ? null : k)}
                      style={{
                        padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                        border: `1.5px solid ${girlSplit === k ? "var(--cl-accent)" : "var(--cl-border)"}`,
                        background: girlSplit === k ? "var(--cl-accent-soft)" : "var(--cl-surface)",
                        color: girlSplit === k ? "var(--cl-accent)" : "var(--cl-ink)",
                      }}>
                      {ta ? opt[0] : opt[1]}
                    </button>
                  );
                })}
              </div>
              {girlSplit === null && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--cl-muted)" }}>
                  {ta
                    ? `பாதம் தேர்வு செய்யாவிட்டால் ${RASI_NAMES_TA[RASI[girlStar]]} எனக் கணக்கிடப்படும்.`
                    : `If not selected, ${RASI_NAMES_EN[RASI[girlStar]]} is used by default for Rasi, Rasiyathipathi, and Vasya poruthams.`}
                </div>
              )}
            </div>
          )}

          {/* Boy star results */}
          {girlStar !== null && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "0.78rem", fontWeight: 700, color: "var(--cl-sage)" }}>
                ♂ {ta ? `${NAKSHATRAS[girlStar].ta} பெண்ணுக்கு — ஆண் நட்சத்திர பொருத்தம்` : `Compatibility for ${starNameEn(girlStar)} girl`}
              </p>

              {/* Legend */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px", fontSize: "11px", color: "var(--cl-muted)" }}>
                {[
                  { bg: "var(--cl-sage-soft)", label: ta ? "7–10 நல்லது" : "7–10 Good+" },
                  { bg: "var(--cl-accent-soft)", label: ta ? "5–6 சராசரி" : "5–6 Average" },
                  { bg: "var(--cl-caution-soft)", label: ta ? "0–4 / தோஷம்" : "0–4 / Dosham" },
                ].map(l => (
                  <span key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: l.bg, border: "1px solid var(--cl-border)" }} />
                    {l.label}
                  </span>
                ))}
              </div>

              {gridError && <p style={{ margin: "0 0 10px", color: "var(--cl-caution)", fontSize: "0.78rem" }}>{gridError}</p>}
              {gridLoading && !gridData && (
                <p style={{ margin: "0 0 10px", color: "var(--cl-muted)", fontSize: "0.78rem" }}>
                  {ta ? "கணக்கிடுகிறது…" : "Calculating…"}
                </p>
              )}

              {gridData && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", gap: "6px", opacity: gridLoading ? 0.6 : 1 }}>
                  {gridData.map((c) => {
                    const id = c.boyNakshatra - 1;
                    const criticalFail = c.rajjuDosha || c.vedhaDosha;
                    return (
                      <button key={id}
                        onClick={() => { setBoyStar(id); setBoySplit(null); }}
                        style={{
                          ...BASE_STAR_BTN,
                          position: "relative",
                          border: boyStar === id
                            ? "2px solid var(--cl-sage)"
                            : criticalFail
                            ? "2px solid var(--cl-caution)"
                            : c.nadiCaution
                            ? "1px solid var(--cl-accent)"
                            : "1px solid var(--cl-border)",
                          background: scoreBg(c.totalScore, criticalFail),
                        }}>
                        {(criticalFail || c.nadiCaution) && (
                          <div style={{ position: "absolute", top: 2, left: 6, fontSize: 11 }}>⚠</div>
                        )}
                        <div style={{ position: "absolute", top: 4, right: 6, fontSize: 15, fontWeight: 800, color: scoreColor(c.totalScore, criticalFail) }}>
                          {c.totalScore}
                        </div>
                        <div style={{ fontWeight: 600, color: criticalFail ? "var(--cl-caution)" : "var(--cl-ink)" }}>
                          {ta ? NAKSHATRAS[id].ta : starNameEn(id)}
                        </div>
                        {ta && <div style={{ fontSize: 10, color: "var(--cl-muted)" }}>{starNameEn(id)}</div>}
                        <div style={{ fontSize: 9, color: scoreColor(c.totalScore, criticalFail), fontWeight: 600, marginTop: 2 }}>
                          {c.totalScore}/10 · {verdictLabel(c.label, criticalFail, ta)}
                        </div>
                        {c.nadiCaution && !criticalFail && (
                          <div style={{ fontSize: 9, color: "var(--cl-accent)", fontWeight: 600, marginTop: 2 }}>
                            {ta ? "நாடி கவனம்" : "Nadi caution"}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Boy pada sub-selector — shown for any nakshatra whose padas straddle two rasis */}
          {boyStar !== null && SPLIT_NAK[boyStar] && (
            <div style={{ padding: "12px 14px", background: "var(--cl-bg-2)", border: "1px solid var(--cl-sage)", borderRadius: "10px", fontSize: "12px" }}>
              <div style={{ fontWeight: 700, color: "var(--cl-sage)", marginBottom: "8px" }}>
                {ta
                  ? `♂ ${NAKSHATRAS[boyStar].ta} இரண்டு ராசிகளில் பிரிகிறது — எந்த பாதம்?`
                  : `♂ ${starNameEn(boyStar)} spans two rasis — which pada group?`}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["early", "late"] as const).map(k => {
                  const opt = SPLIT_NAK[boyStar][k];
                  return (
                    <button key={k} type="button"
                      onClick={() => setBoySplit(prev => prev === k ? null : k)}
                      style={{
                        padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                        cursor: "pointer", fontFamily: "inherit",
                        border: `1.5px solid ${boySplit === k ? "var(--cl-sage)" : "var(--cl-border)"}`,
                        background: boySplit === k ? "var(--cl-sage-soft)" : "var(--cl-surface)",
                        color: boySplit === k ? "var(--cl-sage)" : "var(--cl-ink)",
                      }}>
                      {ta ? opt[0] : opt[1]}
                    </button>
                  );
                })}
              </div>
              {boySplit === null && (
                <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--cl-muted)" }}>
                  {ta
                    ? `பாதம் தேர்வு செய்யாவிட்டால் ${RASI_NAMES_TA[RASI[boyStar]]} எனக் கணக்கிடப்படும்.`
                    : `If not selected, ${RASI_NAMES_EN[RASI[boyStar]]} is used by default for Rasi, Rasiyathipathi, and Vasya poruthams.`}
                </div>
              )}
            </div>
          )}

          {/* Detail breakdown */}
          {boyStar !== null && girlStar !== null && (
            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px" }}>

              {detailError && <p style={{ margin: 0, color: "var(--cl-caution)", fontSize: "0.8rem" }}>{detailError}</p>}
              {detailLoading && !detailData && (
                <p style={{ margin: 0, color: "var(--cl-muted)", fontSize: "0.8rem" }}>
                  {ta ? "விரிவான பொருத்தம் கணக்கிடுகிறது…" : "Calculating detailed compatibility…"}
                </p>
              )}

              {detailData && (
                <div style={{ opacity: detailLoading ? 0.6 : 1 }}>
                  {/* Pair header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                      <span style={{ color: "var(--cl-accent)" }}>♀ {ta ? NAKSHATRAS[girlStar].ta : starNameEn(girlStar)}</span>
                      <span style={{ margin: "0 8px", color: "var(--cl-muted)" }}>×</span>
                      <span style={{ color: "var(--cl-sage)" }}>♂ {ta ? NAKSHATRAS[boyStar].ta : starNameEn(boyStar)}</span>
                    </div>
                    <div style={{
                      background: scoreBg(detailData.totalScore, detailData.rajjuDosha || detailData.vedhaDosha),
                      color: scoreColor(detailData.totalScore, detailData.rajjuDosha || detailData.vedhaDosha),
                      padding: "5px 14px", borderRadius: "999px", fontWeight: 700, fontSize: "13px",
                    }}>
                      {detailData.totalScore}/10 — {verdictLabel(detailData.label, detailData.rajjuDosha || detailData.vedhaDosha, ta)}
                    </div>
                  </div>

                  {/* Overall verdict — text already includes Rajju/Vedha dosha explanations when present */}
                  <div style={{
                    background: (detailData.rajjuDosha || detailData.vedhaDosha) ? "var(--cl-caution-soft)" : "var(--cl-bg-2)",
                    border: `1px solid ${(detailData.rajjuDosha || detailData.vedhaDosha) ? "var(--cl-caution)" : "var(--cl-border-2)"}`,
                    borderLeft: `4px solid ${(detailData.rajjuDosha || detailData.vedhaDosha) ? "var(--cl-caution)" : "var(--cl-accent)"}`,
                    borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px",
                    color: (detailData.rajjuDosha || detailData.vedhaDosha) ? "var(--cl-caution)" : "var(--cl-ink-2)", lineHeight: 1.6,
                  }}>
                    {ta ? detailData.summary.ta : detailData.summary.en}
                  </div>

                  {detailData.nadiDosha.hasNadiDosha && (
                    <div style={{ background: "var(--cl-bg-2)", border: "1px solid var(--cl-border-2)", borderLeft: "4px solid var(--cl-accent)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "var(--cl-ink-2)", lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--cl-accent)" }}>
                        {ta ? "நாடி தோஷம்" : "Nadi Dosha"}
                      </div>
                      {ta ? detailData.nadiDosha.noteTa : detailData.nadiDosha.noteEn}
                    </div>
                  )}

                  {/* Star info cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "8px", marginBottom: "14px", fontSize: "11px", color: "var(--cl-ink-2)" }}>
                    {([
                      { star: girlStar, color: "var(--cl-accent)", sym: "♀" },
                      { star: boyStar,  color: "var(--cl-sage)",   sym: "♂" },
                    ] as const).map(({ star, color, sym }) => (
                      <div key={sym} style={{ background: "var(--cl-bg)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--cl-border)" }}>
                        <div style={{ fontWeight: 700, color, marginBottom: 4 }}>{sym} {starNameEn(star)}</div>
                        <div>{ta?"ராசி":"Rasi"}: {ta ? RASI_NAMES_TA[starEffRasi(star)] : RASI_NAMES_EN[starEffRasi(star)]}</div>
                        <div>{ta?"கணம்":"Gana"}: {ta ? GANA_NAMES[GANA[star]] : GANA_NAMES_EN[GANA[star]]}</div>
                        <div>{ta?"யோனி":"Yoni"}: {ta ? YONI_NAMES_TA[YONI[star]] : YONI_NAMES_EN[YONI[star]]}</div>
                        <div>{ta?"நாடி":"Nadi"}: {ta ? NADI_NAMES_TA[NADI[star]] : NADI_NAMES_EN[NADI[star]]}</div>
                        <div>{ta?"ரஜ்ஜு":"Rajju"}: {ta ? RAJJU_NAMES_TA[RAJJU[star]] : RAJJU_NAMES_EN[RAJJU[star]]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Porutham table — pass/fail comes directly from the API response */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "var(--cl-bg-2)" }}>
                          <th style={{ padding: "7px 8px", textAlign: "left", borderBottom: "2px solid var(--cl-border-2)", fontSize: 11, color: "var(--cl-muted)" }}>#</th>
                          <th style={{ padding: "7px 8px", textAlign: "left", borderBottom: "2px solid var(--cl-border-2)" }}>{ta?"பொருத்தம்":"Porutham"}</th>
                          <th style={{ padding: "7px 8px", textAlign: "center", borderBottom: "2px solid var(--cl-border-2)" }}>{ta?"நிலை":"Status"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.kutas.map((k, i) => {
                          const pass = k.score >= k.maxScore;
                          const isCritical = k.name === "Rajju" || k.name === "Vedha";
                          const criticalRow = isCritical && !pass;
                          return (
                            <tr key={i} style={{ background: criticalRow ? "var(--cl-caution-soft)" : i % 2 === 0 ? "var(--cl-surface)" : "var(--cl-bg)" }}>
                              <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--cl-border)", color: "var(--cl-muted)", fontSize: 11 }}>{i+1}</td>
                              <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--cl-border)" }}>
                                <div style={{ fontWeight: 600, color: "var(--cl-ink)", display: "flex", alignItems: "center", gap: 4 }}>
                                  {ta ? k.nameTa : k.name}
                                  {isCritical && (
                                    <span style={{ fontSize: 8, background: "var(--cl-caution)", color: "var(--cl-surface)", padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>
                                      {ta?"முக்கியம்":"Critical"}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: "7px 8px", textAlign: "center", borderBottom: "1px solid var(--cl-border)", fontSize: 15, fontWeight: 700, color: pass ? "var(--cl-sage)" : "var(--cl-caution)" }}>
                                {pass ? "✓" : "✗"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* How to read the numbers */}
                  <div style={{ marginTop: "12px", padding: "10px 14px", background: "var(--cl-bg-2)", borderRadius: "8px", borderLeft: "3px solid var(--cl-border-2)", fontSize: "11px", color: "var(--cl-muted)", lineHeight: 1.7 }}>
                    <div>
                      <strong style={{ color: "var(--cl-ink-2)" }}>{ta ? "மொத்த மதிப்பெண் (x/10):" : "Overall score (x/10):"}</strong>{" "}
                      {ta
                        ? "10 பொருத்தங்களில் எத்தனை பொருந்துகின்றன என்பதே மதிப்பெண் — அதிகமானால் நல்லது. ரஜ்ஜு அல்லது வேதை பொருந்தாவிட்டால், மதிப்பெண் எதுவாயினும் தோஷமாகவே கருதப்படும்."
                        : "How many of the 10 poruthams pass — higher is better. If Rajju or Vedhai fails, it counts as a dosham no matter how high the score is."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── GRID VIEW ── */}
      {view === "grid" && (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
            {ta ? "பெண் நட்சத்திரம் தேர்வு செய்யுங்கள். ஒவ்வொரு ஆண் நட்சத்திரத்திற்கும் 10 பொருத்த மதிப்பெண் காட்டப்படும்." : "Select the girl's birth star to see compatibility scores with all 27 boy birth stars."}
          </p>

          {girlStar === null ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", gap: "6px" }}>
              {NAKSHATRAS.map((n, i) => (
                <button key={i} onClick={() => setGirlStar(i)}
                  style={{ ...BASE_STAR_BTN }}>
                  <div style={{ fontWeight: 600, color: "var(--cl-ink)" }}>{ta ? n.ta : starNameEn(i)}</div>
                  {ta && <div style={{ fontSize: 10, color: "var(--cl-muted)" }}>{starNameEn(i)}</div>}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                <div style={{ background: "var(--cl-accent-soft)", padding: "5px 14px", borderRadius: "999px", fontWeight: 600, fontSize: "13px", color: "var(--cl-accent)" }}>
                  ♀ {ta ? NAKSHATRAS[girlStar].ta : starNameEn(girlStar)}
                </div>
                <button
                  onClick={() => { setGirlStar(null); setBoyStar(null); }}
                  style={{ padding: "4px 12px", border: "1px solid var(--cl-border)", borderRadius: "999px", background: "var(--cl-bg)", cursor: "pointer", fontSize: "11px", color: "var(--cl-muted)", fontFamily: "inherit" }}>
                  {ta ? "மாற்று ↻" : "Change ↻"}
                </button>
              </div>

              {gridError && <p style={{ margin: "0 0 10px", color: "var(--cl-caution)", fontSize: "0.78rem" }}>{gridError}</p>}
              {gridLoading && !gridData && (
                <p style={{ margin: 0, color: "var(--cl-muted)", fontSize: "0.78rem" }}>
                  {ta ? "கணக்கிடுகிறது…" : "Calculating…"}
                </p>
              )}

              {/* Grouped results */}
              {gridData && [
                { label: ta?"மிக நல்ல பொருத்தம் (9–10)":"Excellent Match (9–10)", items: gridData.filter(c => !(c.rajjuDosha || c.vedhaDosha) && c.totalScore >= 9) },
                { label: ta?"நல்ல பொருத்தம் (7–8)":"Good Match (7–8)",           items: gridData.filter(c => !(c.rajjuDosha || c.vedhaDosha) && c.totalScore >= 7 && c.totalScore < 9) },
                { label: ta?"சராசரி (5–6)":"Average (5–6)",                      items: gridData.filter(c => !(c.rajjuDosha || c.vedhaDosha) && c.totalScore >= 5 && c.totalScore < 7) },
                { label: ta?"குறைவு (0–4)":"Below Average (0–4)",                items: gridData.filter(c => !(c.rajjuDosha || c.vedhaDosha) && c.totalScore < 5) },
                { label: ta?"⚠ தோஷம் — தவிர்க்கவும்":"⚠ Dosham - Avoid",       items: gridData.filter(c => c.rajjuDosha || c.vedhaDosha) },
              ].map(group => {
                if (group.items.length === 0) return null;
                const best = group.items[0];
                const bestCritical = best.rajjuDosha || best.vedhaDosha;
                const accent = bestCritical ? "var(--cl-caution)" : best.totalScore >= 7 ? "var(--cl-sage)" : best.totalScore >= 5 ? "var(--cl-accent)" : "var(--cl-caution)";
                return (
                  <div key={group.label} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: accent, marginBottom: "6px", paddingBottom: "4px", borderBottom: `2px solid color-mix(in srgb, ${accent} 20%, transparent)` }}>
                      {group.label} <span style={{ fontWeight: 400, fontSize: 11, color: "var(--cl-muted)" }}>({group.items.length})</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "6px" }}>
                      {group.items.sort((a,b) => b.totalScore - a.totalScore).map(c => {
                        const id = c.boyNakshatra - 1;
                        const criticalFail = c.rajjuDosha || c.vedhaDosha;
                        return (
                          <button key={id}
                            onClick={() => { setBoyStar(id); setView("selector"); }}
                            style={{
                              ...BASE_STAR_BTN,
                              border: criticalFail
                                ? "2px solid var(--cl-caution)"
                                : c.nadiCaution
                                ? "1px solid var(--cl-accent)"
                                : "1px solid var(--cl-border)",
                              background: scoreBg(c.totalScore, criticalFail),
                              display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", padding: "8px 10px",
                            }}>
                            <div>
                              <div style={{ fontWeight: 600, color: criticalFail ? "var(--cl-caution)" : "var(--cl-ink)", fontSize: 12 }}>
                                {(criticalFail || c.nadiCaution) && "⚠ "}♂ {ta ? NAKSHATRAS[id].ta : starNameEn(id)}
                              </div>
                              {ta && <div style={{ fontSize: 10, color: "var(--cl-muted)" }}>{starNameEn(id)}</div>}
                              {criticalFail && (
                                <div style={{ fontSize: 9, color: "var(--cl-caution)", marginTop: 2 }}>
                                  {[c.rajjuDosha && (ta ? "ரஜ்ஜு தோஷம்" : "Rajju Dosha"), c.vedhaDosha && (ta ? "வேதை தோஷம்" : "Vedha Dosha")].filter(Boolean).join(", ")}
                                </div>
                              )}
                              {c.nadiCaution && !criticalFail && (
                                <div style={{ fontSize: 9, color: "var(--cl-accent)", marginTop: 2 }}>
                                  {ta ? "நாடி கவனம்" : "Nadi caution"}
                                </div>
                              )}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: scoreColor(c.totalScore, criticalFail), marginLeft: 6 }}>{c.totalScore}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer note */}
      <div style={{ padding: "12px 14px", background: "var(--cl-bg-2)", borderRadius: "8px", fontSize: "11px", color: "var(--cl-muted)", lineHeight: 1.7, borderLeft: "3px solid var(--cl-border-2)" }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--cl-ink-2)" }}>
          {ta ? "பொருத்த படிநிலை | Thirukanitham" : "Porutham Hierarchy | Thirukanitham"}
        </div>
        <div style={{ marginBottom: 6 }}>
          <strong>{ta?"முக்கிய பொருத்தங்கள் (Must-Pass):":"Critical Checks (Must-Pass):"}</strong>{" "}
          {ta
            ? "ரஜ்ஜு மற்றும் வேதை இரண்டும் கட்டாயம் பொருந்த வேண்டும். \"ரஜ்ஜு இல்லையேல் பொருத்தம் இல்லை\" என்பது நியதி."
            : "Rajju and Vedhai must both pass. \"Without Rajju there is no compatibility\" is the foundational rule."}
        </div>
        <div style={{ marginBottom: 6 }}>
          <strong>{ta?"குறிப்பு:":"Note:"}</strong>{" "}
          {ta
            ? "முழுமையான ஜாதக பொருத்தத்திற்கு பாதம், தசா புக்தி, தோஷ பரிகாரம் ஆகியவற்றையும் ஆராய வேண்டும்."
            : "A full horoscope match also examines pada, dasha bhukti, Sevvai dosham, Nadi cancellation, navamsa, and dosha parihara. This public tool is only a quick birth-star preview."}
        </div>
        <div>
          <strong>{ta?"திருக்கணித முறை:":"Thirukanitham method:"}</strong>{" "}
          {ta
            ? "இந்த கருவி 10 பொருத்தங்களை அடிப்படையாகக் கொண்ட திருக்கணித முறையில் வேலை செய்கிறது. டாஷ்போர்டு அதே திருக்கணித முறையில் முழு ஜாதக தரவுடன் — பாதம், தசா புக்தி, செவ்வாய் தோஷம், நாடி ரத்து விதிகள் — முழுமையான பகுப்பாய்வு செய்கிறது."
            : "This tool uses Thirukanitham's 10-porutham system. The dashboard applies the same Thirukanitham method with full chart data — pada, dasha bhukti, Sevvai dosham, and Nadi cancellation rules — for a complete analysis."}
        </div>
      </div>

      {/* Save CTA */}
      <div className="cl-mobile-card-split" style={{ background: "rgba(184,90,44,0.05)", border: "1px solid rgba(184,90,44,0.2)", borderRadius: "14px", padding: "18px 22px" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--cl-ink)", fontSize: "0.92rem" }}>
            {ta ? "ஜாதகம் கொண்டு துல்லியமான பொருத்தம் பாருங்கள்" : "Get precise compatibility from birth data"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
            {ta ? "இலவச கணக்கு — ஜாதகம் சேமிக்கவும், பல பொருத்தங்களை ஒப்பிடவும், தினசரி வழிகாட்டுதல் பெறவும்." : "Free account — save horoscopes, compare multiple matches, get daily guidance."}
          </p>
        </div>
        <a href="/dashboard" className="cl-mobile-cta" style={{ display: "inline-flex", alignItems: "center", padding: "9px 22px", background: "var(--cl-ink)", color: "var(--cl-bg)", borderRadius: "999px", fontWeight: 600, fontSize: "0.88rem", textDecoration: "none" }}>
          {ta ? "இலவசமாக தொடங்கு →" : "Get started free →"}
        </a>
      </div>

    </div>
  );
}
