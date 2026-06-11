"use client";

import { useState, useMemo } from "react";
import { useLang } from "@/components/lang-toggle";
import { romanNakshathiramName } from "@/lib/tamil-astro";

// ========== DATA ==========

const NAKSHATRAS = [
  { id: 0, en: "Ashwini",           ta: "அசுவினி" },
  { id: 1, en: "Bharani",           ta: "பரணி" },
  { id: 2, en: "Krittika",          ta: "கார்த்திகை" },
  { id: 3, en: "Rohini",            ta: "ரோகிணி" },
  { id: 4, en: "Mrigashira",        ta: "மிருகசீரிடம்" },
  { id: 5, en: "Ardra",             ta: "திருவாதிரை" },
  { id: 6, en: "Punarvasu",         ta: "புனர்பூசம்" },
  { id: 7, en: "Pushya",            ta: "பூசம்" },
  { id: 8, en: "Ashlesha",          ta: "ஆயில்யம்" },
  { id: 9, en: "Magha",             ta: "மகம்" },
  { id: 10, en: "Purva Phalguni",   ta: "பூரம்" },
  { id: 11, en: "Uttara Phalguni",  ta: "உத்திரம்" },
  { id: 12, en: "Hasta",            ta: "ஹஸ்தம்" },
  { id: 13, en: "Chitra",           ta: "சித்திரை" },
  { id: 14, en: "Swati",            ta: "சுவாதி" },
  { id: 15, en: "Vishakha",         ta: "விசாகம்" },
  { id: 16, en: "Anuradha",         ta: "அனுஷம்" },
  { id: 17, en: "Jyeshtha",         ta: "கேட்டை" },
  { id: 18, en: "Mula",             ta: "மூலம்" },
  { id: 19, en: "Purva Ashadha",    ta: "பூராடம்" },
  { id: 20, en: "Uttara Ashadha",   ta: "உத்திராடம்" },
  { id: 21, en: "Shravana",         ta: "திருவோணம்" },
  { id: 22, en: "Dhanishta",        ta: "அவிட்டம்" },
  { id: 23, en: "Shatabhisha",      ta: "சதயம்" },
  { id: 24, en: "Purva Bhadrapada", ta: "பூரட்டாதி" },
  { id: 25, en: "Uttara Bhadrapada",ta: "உத்திரட்டாதி" },
  { id: 26, en: "Revati",           ta: "ரேவதி" },
];

// Gana: 0=Deva, 1=Manushya, 2=Rakshasa
const GANA = [0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
const GANA_NAMES = ["தேவ", "மனுஷ்ய", "ராக்ஷஸ"];
const GANA_NAMES_EN = ["Deva", "Manushya", "Rakshasa"];

// Yoni: 0=Horse … 13=Lion
const YONI = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];
const YONI_NAMES_TA = ["குதிரை","யானை","ஆடு","பாம்பு","நாய்","பூனை","எலி","பசு","எருமை","புலி","மான்","குரங்கு","கீரி","சிங்கம்"];
const YONI_NAMES_EN = ["Horse","Elephant","Goat","Serpent","Dog","Cat","Rat","Cow","Buffalo","Tiger","Deer","Monkey","Mongoose","Lion"];
// Sworn-enemy yoni pairs (index pairs)
const YONI_ENEMIES: [number, number][] = [[0,8],[1,13],[2,11],[3,12],[4,10],[5,6],[7,9]];

// Rajju: 0=Paada 1=Kati 2=Nabhi 3=Kantha 4=Siro (repeating serpentine pattern within each 9)
const RAJJU_PATTERN = [0,1,2,3,4,3,2,1,0];
const RAJJU = NAKSHATRAS.map((_,i) => RAJJU_PATTERN[i % 9]);
const RAJJU_NAMES_TA = ["பாத ரஜ்ஜு","கடி ரஜ்ஜு","நாபி ரஜ்ஜு","கண்ட ரஜ்ஜு","சிரோ ரஜ்ஜு"];
const RAJJU_NAMES_EN = ["Paada","Kati","Nabhi","Kantha","Siro"];
const RAJJU_SEVERITY_TA = ["அலைச்சல்/பிரிவு","வறுமை","சந்ததி நஷ்டம்","மனைவிக்கு ஆபத்து","கணவனுக்கு ஆபத்து"];

// Vedhai opposition pairs
const VEDHAI_PAIRS: [number,number][] = [[0,17],[1,16],[2,15],[3,14],[5,21],[6,20],[7,19],[8,18],[9,26],[10,25],[11,24],[12,23],[13,22]];

// Nadi: 0=Aadhi 1=Madhya 2=Anthya
const NADI = NAKSHATRAS.map((_,i) => Math.floor((i % 9) / 3));
const NADI_NAMES_TA = ["ஆதி நாடி","மத்திய நாடி","அந்திய நாடி"];

// Rasi assignment (0-11 = Mesha…Meena)
const RASI = [0,0,1,1,2,2,3,3,3,4,4,5,5,6,6,7,7,7,8,8,9,9,10,10,11,11,11];
const RASI_NAMES_TA = ["மேஷம்","ரிஷபம்","மிதுனம்","கடகம்","சிம்மம்","கன்னி","துலாம்","விருச்சிகம்","தனுசு","மகரம்","கும்பம்","மீனம்"];
const RASI_NAMES_EN = ["Mesha","Rishaba","Mithuna","Kataka","Simha","Kanni","Thula","Vrischika","Dhanus","Makara","Kumbha","Meena"];

// Rasi lords: 0=Mars 1=Venus 2=Mercury 3=Moon 4=Sun 5=Jupiter 6=Saturn
const RASI_LORD = [0,1,2,3,4,2,1,0,5,6,6,5];
const LORD_TA = ["செவ்வாய்","சுக்கிரன்","புதன்","சந்திரன்","சூரியன்","குரு","சனி"];
const PLANET_FRIENDS: Record<number,number[]> = {0:[4,3,5],1:[2,6],2:[4,1],3:[4,2],4:[3,0,5],5:[4,3,0],6:[2,1]};
const PLANET_ENEMIES: Record<number,number[]> = {0:[],1:[4,3],2:[3],3:[],4:[1,6],5:[2,1],6:[4,3,0]};

// Vasya rasi pairs
const VASYA_MAP: Record<number,number[]> = {0:[4,7],1:[3,6],2:[5],3:[7,8],4:[6],5:[2,11],6:[9],7:[3],8:[11],9:[0],10:[0],11:[9]};

// ========== CALCULATIONS ==========

function calcDina(g: number, b: number) {
  const count = ((b - g + 27) % 27) + 1;
  const rem = count % 9;
  return { match: [0,2,4,6,8].includes(rem), detail: `எண்: ${count}`, detailEn: `Count: ${count}` };
}
function calcGana(g: number, b: number) {
  const gg = GANA[g], bg = GANA[b];
  if (gg === bg) return { match: true, detail: `${GANA_NAMES[gg]} + ${GANA_NAMES[bg]}`, detailEn: `${GANA_NAMES_EN[gg]} + ${GANA_NAMES_EN[bg]}` };
  const pair = [gg,bg].sort().join(",");
  const ok = pair === "0,1";
  return { match: ok, detail: `${GANA_NAMES[gg]} + ${GANA_NAMES[bg]}`, detailEn: `${GANA_NAMES_EN[gg]} + ${GANA_NAMES_EN[bg]}` };
}
function calcMahendra(g: number, b: number) {
  const count = ((b - g + 27) % 27) + 1;
  return { match: [4,7,10,13,16,19,22,25].includes(count), detail: `எண்: ${count}`, detailEn: `Count: ${count}` };
}
function calcStreeDheerga(g: number, b: number) {
  const count = ((b - g + 27) % 27) + 1;
  return { match: count > 9, detail: `எண்: ${count}`, detailEn: `Count: ${count}` };
}
function calcYoni(g: number, b: number) {
  const gy = YONI[g], by = YONI[b];
  if (gy === by) return { match: true, detail: `${YONI_NAMES_TA[gy]} யோனி`, detailEn: `${YONI_NAMES_EN[gy]} Yoni` };
  const enemy = YONI_ENEMIES.some(([a,c]) => (a===gy&&c===by)||(c===gy&&a===by));
  return { match: !enemy, detail: `${YONI_NAMES_TA[gy]} ↔ ${YONI_NAMES_TA[by]}`, detailEn: `${YONI_NAMES_EN[gy]} ↔ ${YONI_NAMES_EN[by]}` };
}
function calcRasi(g: number, b: number) {
  const gr = RASI[g], br = RASI[b];
  const fromG = ((br - gr + 12) % 12) + 1;
  const fromB = ((gr - br + 12) % 12) + 1;
  const shashtashtaka = [6,8,12].includes(fromG) || [6,8,12].includes(fromB);
  return {
    match: !shashtashtaka,
    detail: `${RASI_NAMES_TA[gr]} → ${RASI_NAMES_TA[br]} (${fromG}வது)`,
    detailEn: `${RASI_NAMES_EN[gr]} → ${RASI_NAMES_EN[br]} (${fromG}th)`,
    isShashtashtaka: shashtashtaka,
  };
}
function calcRasiyathipathi(g: number, b: number) {
  const gl = RASI_LORD[RASI[g]], bl = RASI_LORD[RASI[b]];
  if (gl === bl) return { match: true, detail: `${LORD_TA[gl]} (ஒரே)`, detailEn: `${LORD_TA[gl]} (same)` };
  const gFriend = PLANET_FRIENDS[gl]?.includes(bl);
  const bFriend = PLANET_FRIENDS[bl]?.includes(gl);
  const gEnemy  = PLANET_ENEMIES[gl]?.includes(bl);
  const bEnemy  = PLANET_ENEMIES[bl]?.includes(gl);
  if (gEnemy || bEnemy) return { match: false, detail: `${LORD_TA[gl]} + ${LORD_TA[bl]} — பகை`, detailEn: `${LORD_TA[gl]} + ${LORD_TA[bl]} — Enemy` };
  return { match: true, detail: `${LORD_TA[gl]} + ${LORD_TA[bl]} — ${gFriend||bFriend?"நட்பு":"சமம்"}`, detailEn: `${LORD_TA[gl]} + ${LORD_TA[bl]} — ${gFriend||bFriend?"Friendly":"Neutral"}` };
}
function calcVasya(g: number, b: number) {
  const gr = RASI[g], br = RASI[b];
  if (gr === br) return { match: true, detail: "ஒரே ராசி", detailEn: "Same Rasi" };
  const match = (VASYA_MAP[gr]||[]).includes(br) || (VASYA_MAP[br]||[]).includes(gr);
  return { match, detail: `${RASI_NAMES_TA[gr]} ↔ ${RASI_NAMES_TA[br]}`, detailEn: `${RASI_NAMES_EN[gr]} ↔ ${RASI_NAMES_EN[br]}` };
}
function calcRajju(g: number, b: number) {
  const gr = RAJJU[g], br = RAJJU[b];
  const same = gr === br;
  const eka  = g === b;
  if (!same) return { match: true, isCritical: true, detail: `${RAJJU_NAMES_TA[gr]} + ${RAJJU_NAMES_TA[br]} ✓`, detailEn: `${RAJJU_NAMES_EN[gr]} + ${RAJJU_NAMES_EN[br]} ✓` };
  if (eka)  return { match: true, isCritical: true, detail: "ஏக நட்சத்திரம் — விதிவிலக்கு ✓", detailEn: "Same Birth Star - exception ✓" };
  return { match: false, isCritical: true, detail: `${RAJJU_NAMES_TA[gr]} — ${RAJJU_SEVERITY_TA[gr]}`, detailEn: `${RAJJU_NAMES_EN[gr]} — ${RAJJU_SEVERITY_TA[gr]}` };
}
function calcVedhai(g: number, b: number) {
  const isVedhai = VEDHAI_PAIRS.some(([a,c]) => (a===g&&c===b)||(c===g&&a===b));
  return { match: !isVedhai, isCritical: true, detail: isVedhai ? "வேதை ஜோடி ⚠" : "வேதை இல்லை ✓", detailEn: isVedhai ? "Vedhai pair ⚠" : "No Vedhai ✓" };
}

interface PoruthamResult {
  name: string; nameEn: string;
  match: boolean;
  isCritical?: boolean;
  detail: string; detailEn: string;
  isShashtashtaka?: boolean;
}
interface CompatibilityResult {
  poruthams: PoruthamResult[];
  score: number;
  criticalFail: boolean;
  nadiCaution: boolean;
  criticalWarnings: string[];
  rajjuFail: boolean; vedhaiFail: boolean; rasiFail: boolean;
}

function calcAll(g: number, b: number): CompatibilityResult {
  const poruthams: PoruthamResult[] = [
    { name: "நாள்",           nameEn: "Dina",             ...calcDina(g,b) },
    { name: "கணம்",          nameEn: "Gana",             ...calcGana(g,b) },
    { name: "மகேந்திரம்",    nameEn: "Mahendra",         ...calcMahendra(g,b) },
    { name: "ஸ்திரீ தீர்க்கம்", nameEn: "Stree Dheerga", ...calcStreeDheerga(g,b) },
    { name: "யோனி",          nameEn: "Yoni",             ...calcYoni(g,b) },
    { name: "ராசி",           nameEn: "Rasi",             ...calcRasi(g,b) },
    { name: "ராசியதிபதி",    nameEn: "Rasiyathipathi",   ...calcRasiyathipathi(g,b) },
    { name: "வஷ்யம்",        nameEn: "Vasya",            ...calcVasya(g,b) },
    { name: "ரஜ்ஜு",         nameEn: "Rajju",            ...calcRajju(g,b) },
    { name: "வேதை",          nameEn: "Vedhai",           ...calcVedhai(g,b) },
  ];
  const score = poruthams.filter(p => p.match).length;
  const rajjuFail  = !poruthams[8].match;
  const vedhaiFail = !poruthams[9].match;
  const rasiFail   = !!(poruthams[5] as PoruthamResult & {isShashtashtaka?: boolean}).isShashtashtaka;
  const nadiCaution = NADI[g] === NADI[b];
  const criticalFail = rajjuFail || vedhaiFail;
  const criticalWarnings: string[] = [];
  if (rajjuFail)  criticalWarnings.push("ரஜ்ஜு தோஷம்");
  if (vedhaiFail) criticalWarnings.push("வேதை தோஷம்");
  if (rasiFail)   criticalWarnings.push("ஆறு-எட்டு தோஷம்");
  if (nadiCaution) criticalWarnings.push("Nadi caution");
  return { poruthams, score, criticalFail, nadiCaution, criticalWarnings, rajjuFail, vedhaiFail, rasiFail };
}

// ========== STYLE HELPERS ==========

function scoreColor(score: number, criticalFail: boolean): string {
  if (criticalFail || score <= 2) return "var(--cl-caution)";
  if (score >= 8) return "var(--cl-sage)";
  if (score >= 6) return "#4a7041";
  if (score >= 5) return "var(--cl-accent)";
  return "var(--cl-caution)";
}
function scoreBg(score: number, criticalFail: boolean): string {
  if (criticalFail || score <= 2) return "var(--cl-caution-soft)";
  if (score >= 8) return "var(--cl-sage-soft)";
  if (score >= 6) return "var(--cl-sage-soft)";
  if (score >= 5) return "var(--cl-accent-soft)";
  return "var(--cl-caution-soft)";
}
function scoreLabelTa(score: number, criticalFail: boolean): string {
  if (criticalFail) return "தோஷம் — தவிர்க்கவும்";
  if (score >= 8)  return "மிக நல்ல பொருத்தம்";
  if (score >= 6)  return "நல்ல பொருத்தம்";
  if (score >= 5)  return "சராசரி பொருத்தம்";
  if (score >= 3)  return "குறைவான பொருத்தம்";
  return "பொருத்தம் இல்லை";
}
function scoreLabelEn(score: number, criticalFail: boolean): string {
  if (criticalFail) return "Dosham - Avoid";
  if (score >= 8)  return "Excellent";
  if (score >= 6)  return "Good";
  if (score >= 5)  return "Average";
  if (score >= 3)  return "Below Average";
  return "Not Compatible";
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
  const [view, setView] = useState<"selector" | "grid">("selector");

  const compatibility = useMemo(() => {
    if (girlStar === null) return null;
    return NAKSHATRAS.map((_, i) => ({ id: i, ...calcAll(girlStar, i) }));
  }, [girlStar]);

  const detail = useMemo(() => {
    if (girlStar === null || boyStar === null) return null;
    return calcAll(girlStar, boyStar);
  }, [girlStar, boyStar]);

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
                  onClick={() => { setGirlStar(i); setBoyStar(null); }}
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

          {/* Boy star results */}
          {girlStar !== null && compatibility && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: "0.78rem", fontWeight: 700, color: "var(--cl-sage)" }}>
                ♂ {ta ? `${NAKSHATRAS[girlStar].ta} பெண்ணுக்கு — ஆண் நட்சத்திர பொருத்தம்` : `Compatibility for ${starNameEn(girlStar)} girl`}
              </p>

              {/* Legend */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px", fontSize: "11px", color: "var(--cl-muted)" }}>
                {[
                  { bg: "var(--cl-sage-soft)", label: ta ? "8–10 மிக நல்லது" : "8–10 Excellent" },
                  { bg: "var(--cl-accent-soft)", label: ta ? "5–7 சராசரி" : "5–7 Average" },
                  { bg: "var(--cl-caution-soft)", label: ta ? "0–4 / தோஷம்" : "0–4 / Dosham" },
                ].map(l => (
                  <span key={l.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: l.bg, border: "1px solid var(--cl-border)" }} />
                    {l.label}
                  </span>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))", gap: "6px" }}>
                {compatibility.map((c) => (
                  <button key={c.id}
                    onClick={() => setBoyStar(c.id)}
                    style={{
                      ...BASE_STAR_BTN,
                      position: "relative",
                      border: boyStar === c.id
                        ? "2px solid var(--cl-sage)"
                        : c.criticalFail
                        ? "2px solid var(--cl-caution)"
                        : c.nadiCaution
                        ? "1px solid var(--cl-accent)"
                        : "1px solid var(--cl-border)",
                      background: scoreBg(c.score, c.criticalFail),
                    }}>
                    {(c.criticalFail || c.nadiCaution) && (
                      <div style={{ position: "absolute", top: 2, left: 6, fontSize: 11 }}>⚠</div>
                    )}
                    <div style={{ position: "absolute", top: 4, right: 6, fontSize: 15, fontWeight: 800, color: scoreColor(c.score, c.criticalFail) }}>
                      {c.score}
                    </div>
                    <div style={{ fontWeight: 600, color: c.criticalFail ? "var(--cl-caution)" : "var(--cl-ink)" }}>
                      {ta ? NAKSHATRAS[c.id].ta : starNameEn(c.id)}
                    </div>
                    {ta && <div style={{ fontSize: 10, color: "var(--cl-muted)" }}>{starNameEn(c.id)}</div>}
                    <div style={{ fontSize: 9, color: scoreColor(c.score, c.criticalFail), fontWeight: 600, marginTop: 2 }}>
                      {c.score}/10 · {ta ? scoreLabelTa(c.score, c.criticalFail) : scoreLabelEn(c.score, c.criticalFail)}
                    </div>
                    {c.nadiCaution && !c.criticalFail && (
                      <div style={{ fontSize: 9, color: "var(--cl-accent)", fontWeight: 600, marginTop: 2 }}>
                        {ta ? "நாடி கவனம்" : "Nadi caution"}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Detail breakdown */}
          {detail && boyStar !== null && girlStar !== null && (
            <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "14px", padding: "18px" }}>

              {/* Pair header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                  <span style={{ color: "var(--cl-accent)" }}>♀ {ta ? NAKSHATRAS[girlStar].ta : starNameEn(girlStar)}</span>
                  <span style={{ margin: "0 8px", color: "var(--cl-muted)" }}>×</span>
                  <span style={{ color: "var(--cl-sage)" }}>♂ {ta ? NAKSHATRAS[boyStar].ta : starNameEn(boyStar)}</span>
                </div>
                <div style={{ background: scoreBg(detail.score, detail.criticalFail), color: scoreColor(detail.score, detail.criticalFail), padding: "5px 14px", borderRadius: "999px", fontWeight: 700, fontSize: "13px" }}>
                  {detail.score}/10 — {ta ? scoreLabelTa(detail.score, detail.criticalFail) : scoreLabelEn(detail.score, detail.criticalFail)}
                </div>
              </div>

              {/* Critical warning */}
              {detail.criticalFail && (
                <div style={{ background: "var(--cl-caution-soft)", border: "1px solid var(--cl-caution)", borderLeft: "4px solid var(--cl-caution)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "var(--cl-caution)", lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    ⚠ {ta ? "முக்கிய தோஷம் — \"ரஜ்ஜு இல்லையேல் பொருத்தம் இல்லை\"" : "Critical Dosham - not recommended"}
                  </div>
                  {detail.rajjuFail  && <div>• <strong>{ta?"ரஜ்ஜு தோஷம்":"Rajju Dosham"}</strong> — {ta?"இருவரும் ஒரே ரஜ்ஜு குழு. இது மிக முக்கியமான பொருத்தம்; இல்லாமல் திருமணம் பரிந்துரைக்கப்படாது.":"Both share the same Rajju group — the most critical single check."}</div>}
                  {detail.vedhaiFail && <div>• <strong>{ta?"வேதை தோஷம்":"Vedhai Dosham"}</strong> — {ta?"இந்த ஜோடி பகை நட்சத்திர ஜோடி.":"These birth stars are opposing pairs."}</div>}
                  {detail.rasiFail   && <div>• <strong>{ta?"ஆறு-எட்டு":"6/8 Rasi"}</strong> — {ta?"ஷஷ்டாஷ்டக தோஷம்.":"Shashtashtaka — 6th/8th rasi opposition."}</div>}
                </div>
              )}

              {detail.nadiCaution && (
                <div style={{ background: "var(--cl-bg-2)", border: "1px solid var(--cl-border-2)", borderLeft: "4px solid var(--cl-accent)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "12px", color: "var(--cl-ink-2)", lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--cl-accent)" }}>
                    {ta ? "நாடி கவனம்" : "Nadi caution"}
                  </div>
                  {ta
                    ? "இருவருக்கும் ஒரே நாடி வருகிறது. இது விரைவான நட்சத்திர அடிப்படையிலான எச்சரிக்கை மட்டும்; பாதம், ராசி, முழு ஜாதகம் பார்த்த பிறகே இறுதி முடிவு சொல்ல வேண்டும்."
                    : "Both birth stars fall in the same Nadi group. Treat this as a quick star-based caution only; cancellation and final judgement need pada, rasi, and the full horoscope reading in the dashboard."}
                </div>
              )}

              {/* Star info cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px", fontSize: "11px", color: "var(--cl-ink-2)" }}>
                {([
                  { star: girlStar, color: "var(--cl-accent)", sym: "♀" },
                  { star: boyStar,  color: "var(--cl-sage)",   sym: "♂" },
                ] as const).map(({ star, color, sym }) => (
                  <div key={sym} style={{ background: "var(--cl-bg)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--cl-border)" }}>
                    <div style={{ fontWeight: 700, color, marginBottom: 4 }}>{sym} {starNameEn(star)}</div>
                    <div>{ta?"ராசி":"Rasi"}: {ta ? RASI_NAMES_TA[RASI[star]] : RASI_NAMES_EN[RASI[star]]}</div>
                    <div>{ta?"கணம்":"Gana"}: {ta ? GANA_NAMES[GANA[star]] : GANA_NAMES_EN[GANA[star]]}</div>
                    <div>{ta?"யோனி":"Yoni"}: {ta ? YONI_NAMES_TA[YONI[star]] : YONI_NAMES_EN[YONI[star]]}</div>
                    <div>{ta?"நாடி":"Nadi"}: {NADI_NAMES_TA[NADI[star]]}</div>
                    <div>{ta?"ரஜ்ஜு":"Rajju"}: {ta ? RAJJU_NAMES_TA[RAJJU[star]] : RAJJU_NAMES_EN[RAJJU[star]]}</div>
                  </div>
                ))}
              </div>

              {/* Porutham table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--cl-bg-2)" }}>
                      <th style={{ padding: "7px 8px", textAlign: "left", borderBottom: "2px solid var(--cl-border-2)", fontSize: 11, color: "var(--cl-muted)" }}>#</th>
                      <th style={{ padding: "7px 8px", textAlign: "left", borderBottom: "2px solid var(--cl-border-2)" }}>{ta?"பொருத்தம்":"Porutham"}</th>
                      <th style={{ padding: "7px 8px", textAlign: "center", borderBottom: "2px solid var(--cl-border-2)" }}>{ta?"நிலை":"Status"}</th>
                      <th style={{ padding: "7px 8px", textAlign: "left", borderBottom: "2px solid var(--cl-border-2)" }}>{ta?"விவரம்":"Detail"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.poruthams.map((p, i) => {
                      const criticalRow = p.isCritical && !p.match;
                      return (
                        <tr key={i} style={{ background: criticalRow ? "var(--cl-caution-soft)" : i % 2 === 0 ? "var(--cl-surface)" : "var(--cl-bg)" }}>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--cl-border)", color: "var(--cl-muted)", fontSize: 11 }}>{i+1}</td>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--cl-border)" }}>
                            <div style={{ fontWeight: 600, color: "var(--cl-ink)", display: "flex", alignItems: "center", gap: 4 }}>
                              {ta ? p.name : p.nameEn}
                              {p.isCritical && (
                                <span style={{ fontSize: 8, background: "var(--cl-caution)", color: "var(--cl-surface)", padding: "1px 4px", borderRadius: 3, fontWeight: 700 }}>
                                  {ta?"முக்கியம்":"Critical"}
                                </span>
                              )}
                            </div>
                            {ta && <div style={{ fontSize: 10, color: "var(--cl-muted)" }}>{p.nameEn}</div>}
                          </td>
                          <td style={{ padding: "7px 8px", textAlign: "center", borderBottom: "1px solid var(--cl-border)", fontSize: 15, fontWeight: 700, color: p.match ? "var(--cl-sage)" : "var(--cl-caution)" }}>
                            {p.match ? "✓" : "✗"}
                          </td>
                          <td style={{ padding: "7px 8px", borderBottom: "1px solid var(--cl-border)", fontSize: 11, color: criticalRow ? "var(--cl-caution)" : "var(--cl-ink-2)", fontWeight: criticalRow ? 600 : 400 }}>
                            {ta ? p.detail : p.detailEn}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
          ) : compatibility && (
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

              {/* Grouped results */}
              {[
                { label: ta?"மிக நல்ல பொருத்தம் (8–10)":"Excellent Match (8–10)", items: compatibility.filter(c => !c.criticalFail && c.score >= 8) },
                { label: ta?"நல்ல பொருத்தம் (6–7)":"Good Match (6–7)",           items: compatibility.filter(c => !c.criticalFail && c.score >= 6 && c.score < 8) },
                { label: ta?"சராசரி (5)":"Average (5)",                           items: compatibility.filter(c => !c.criticalFail && c.score === 5) },
                { label: ta?"குறைவு (0–4)":"Below Average (0–4)",                 items: compatibility.filter(c => !c.criticalFail && c.score < 5) },
                { label: ta?"⚠ தோஷம் — தவிர்க்கவும்":"⚠ Dosham - Avoid",        items: compatibility.filter(c => c.criticalFail) },
              ].map(group => {
                if (group.items.length === 0) return null;
                const best = group.items[0];
                const accent = best.criticalFail ? "var(--cl-caution)" : best.score >= 6 ? "var(--cl-sage)" : best.score >= 5 ? "var(--cl-accent)" : "var(--cl-caution)";
                return (
                  <div key={group.label} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: accent, marginBottom: "6px", paddingBottom: "4px", borderBottom: `2px solid color-mix(in srgb, ${accent} 20%, transparent)` }}>
                      {group.label} <span style={{ fontWeight: 400, fontSize: 11, color: "var(--cl-muted)" }}>({group.items.length})</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "6px" }}>
                      {group.items.sort((a,b) => b.score - a.score).map(c => (
                        <button key={c.id}
                          onClick={() => { setBoyStar(c.id); setView("selector"); }}
                          style={{
                            ...BASE_STAR_BTN,
                            border: c.criticalFail
                              ? "2px solid var(--cl-caution)"
                              : c.nadiCaution
                              ? "1px solid var(--cl-accent)"
                              : "1px solid var(--cl-border)",
                            background: scoreBg(c.score, c.criticalFail),
                            display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left", padding: "8px 10px",
                          }}>
                          <div>
                            <div style={{ fontWeight: 600, color: c.criticalFail ? "var(--cl-caution)" : "var(--cl-ink)", fontSize: 12 }}>
                              {(c.criticalFail || c.nadiCaution) && "⚠ "}♂ {ta ? NAKSHATRAS[c.id].ta : starNameEn(c.id)}
                            </div>
                            {ta && <div style={{ fontSize: 10, color: "var(--cl-muted)" }}>{starNameEn(c.id)}</div>}
                            {c.criticalFail && (
                              <div style={{ fontSize: 9, color: "var(--cl-caution)", marginTop: 2 }}>{c.criticalWarnings.join(", ")}</div>
                            )}
                            {c.nadiCaution && !c.criticalFail && (
                              <div style={{ fontSize: 9, color: "var(--cl-accent)", marginTop: 2 }}>
                                {ta ? "நாடி கவனம்" : "Nadi caution"}
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: scoreColor(c.score, c.criticalFail), marginLeft: 6 }}>{c.score}</div>
                        </button>
                      ))}
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
          <strong>{ta?"ஆறு-எட்டு (6/8 ராசி):":"6/8 Rasi (Shashtashtaka):"}</strong>{" "}
          {ta
            ? "பெண் ராசியிலிருந்து ஆண் ராசி 6வது அல்லது 8வது இடத்தில் இருந்தால் தோஷம்."
            : "When the boy's rasi falls in the 6th or 8th position from the girl's rasi, it indicates Shashtashtaka dosham."}
        </div>
        <div>
          <strong>{ta?"குறிப்பு:":"Note:"}</strong>{" "}
          {ta
            ? "முழுமையான ஜாதக பொருத்தத்திற்கு பாதம், தசா புக்தி, தோஷ பரிகாரம் ஆகியவற்றையும் ஆராய வேண்டும்."
            : "A full horoscope match also examines pada, dasha bhukti, Sevvai dosham, Nadi cancellation, navamsa, and dosha parihara. This public tool is only a quick birth-star preview."}
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
