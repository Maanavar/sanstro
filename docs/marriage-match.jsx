import { useState, useMemo } from "react";

// ========== DATA DEFINITIONS ==========

const NAKSHATRAS = [
  { id: 0, en: "Ashwini", ta: "அசுவினி" },
  { id: 1, en: "Bharani", ta: "பரணி" },
  { id: 2, en: "Krittika", ta: "கார்த்திகை" },
  { id: 3, en: "Rohini", ta: "ரோகிணி" },
  { id: 4, en: "Mrigashira", ta: "மிருகசீரிடம்" },
  { id: 5, en: "Ardra", ta: "திருவாதிரை" },
  { id: 6, en: "Punarvasu", ta: "புனர்பூசம்" },
  { id: 7, en: "Pushya", ta: "பூசம்" },
  { id: 8, en: "Ashlesha", ta: "ஆயில்யம்" },
  { id: 9, en: "Magha", ta: "மகம்" },
  { id: 10, en: "Purva Phalguni", ta: "பூரம்" },
  { id: 11, en: "Uttara Phalguni", ta: "உத்திரம்" },
  { id: 12, en: "Hasta", ta: "ஹஸ்தம்" },
  { id: 13, en: "Chitra", ta: "சித்திரை" },
  { id: 14, en: "Swati", ta: "சுவாதி" },
  { id: 15, en: "Vishakha", ta: "விசாகம்" },
  { id: 16, en: "Anuradha", ta: "அனுஷம்" },
  { id: 17, en: "Jyeshtha", ta: "கேட்டை" },
  { id: 18, en: "Mula", ta: "மூலம்" },
  { id: 19, en: "Purva Ashadha", ta: "பூராடம்" },
  { id: 20, en: "Uttara Ashadha", ta: "உத்திராடம்" },
  { id: 21, en: "Shravana", ta: "திருவோணம்" },
  { id: 22, en: "Dhanishta", ta: "அவிட்டம்" },
  { id: 23, en: "Shatabhisha", ta: "சதயம்" },
  { id: 24, en: "Purva Bhadrapada", ta: "பூரட்டாதி" },
  { id: 25, en: "Uttara Bhadrapada", ta: "உத்திரட்டாதி" },
  { id: 26, en: "Revati", ta: "ரேவதி" },
];

// Gana classification: 0=Deva, 1=Manushya, 2=Rakshasa
// Standard: Deva=Ashwini,Mrigashira,Punarvasu,Pushya,Hasta,Swati,Anuradha,Shravana,Revati
// Manushya=Bharani,Rohini,Ardra,P.Phalguni,U.Phalguni,P.Ashadha,U.Ashadha,P.Bhadrapada,U.Bhadrapada
// Rakshasa=Krittika,Ashlesha,Magha,Chitra,Vishakha,Jyeshtha,Mula,Dhanishta,Shatabhisha
const GANA = [0,1,2,1,0,1,0,0,2,2,1,1,0,2,0,2,0,2,2,1,1,0,2,2,1,1,0];
const GANA_NAMES = { 0: "தேவ", 1: "மனுஷ்ய", 2: "ராக்ஷஸ" };
const GANA_EN = { 0: "Deva", 1: "Manushya", 2: "Rakshasa" };

// Yoni classification - animal index for each nakshatra
// Animals: 0=Horse, 1=Elephant, 2=Goat, 3=Serpent, 4=Dog, 5=Cat, 6=Rat, 7=Cow, 8=Buffalo, 9=Tiger, 10=Deer, 11=Monkey, 12=Mongoose, 13=Lion
const YONI = [0,1,2,3,3,4,5,2,5,6,6,7,8,9,8,9,10,10,4,11,12,11,13,0,13,7,1];

const YONI_NAMES = {
  0: "குதிரை", 1: "யானை", 2: "ஆடு", 3: "பாம்பு", 4: "நாய்",
  5: "பூனை", 6: "எலி", 7: "பசு", 8: "எருமை", 9: "புலி",
  10: "மான்", 11: "குரங்கு", 12: "கீரி", 13: "சிங்கம்"
};

const YONI_EN = {
  0: "Horse", 1: "Elephant", 2: "Goat", 3: "Serpent", 4: "Dog",
  5: "Cat", 6: "Rat", 7: "Cow", 8: "Buffalo", 9: "Tiger",
  10: "Deer", 11: "Monkey", 12: "Mongoose", 13: "Lion"
};

// Yoni enemy pairs (sworn enemies score 0, enemies score 1)
const YONI_ENEMIES = [
  [0, 8],   // Horse - Buffalo
  [1, 13],  // Elephant - Lion
  [2, 11],  // Goat - Monkey
  [3, 12],  // Serpent - Mongoose
  [4, 10],  // Dog - Deer
  [5, 6],   // Cat - Rat
  [7, 9],   // Cow - Tiger
];

// Rajju classification - serpentine pattern within groups of 9
// 0=Paada, 1=Kati, 2=Nabhi, 3=Kantha, 4=Siro
const RAJJU_PATTERN = [0, 1, 2, 3, 4, 3, 2, 1, 0];
const RAJJU = NAKSHATRAS.map((_, i) => RAJJU_PATTERN[i % 9]);
const RAJJU_NAMES = { 0: "பாத ரஜ்ஜு", 1: "கடி ரஜ்ஜு", 2: "நாபி ரஜ்ஜு", 3: "கண்ட ரஜ்ஜு", 4: "சிரோ ரஜ்ஜு" };
const RAJJU_EN = { 0: "Paada", 1: "Kati", 2: "Nabhi", 3: "Kantha", 4: "Siro" };

// Vedhai (opposition) pairs - these nakshatra pairs are hostile
const VEDHAI_PAIRS = [
  [0, 17],  // Ashwini - Jyeshtha
  [1, 16],  // Bharani - Anuradha
  [2, 15],  // Krittika - Vishakha
  [3, 14],  // Rohini - Swati
  [5, 21],  // Ardra - Shravana
  [6, 20],  // Punarvasu - Uttara Ashadha
  [7, 19],  // Pushya - Purva Ashadha
  [8, 18],  // Ashlesha - Mula
  [9, 26],  // Magha - Revati
  [10, 25], // Purva Phalguni - Uttara Bhadrapada
  [11, 24], // Uttara Phalguni - Purva Bhadrapada
  [12, 23], // Hasta - Shatabhisha
  [13, 22], // Chitra - Dhanishta
];

// Nadi classification: 0=Aadhi, 1=Madhya, 2=Anthya (groups of 3 within each 9)
const NADI = NAKSHATRAS.map((_, i) => Math.floor((i % 9) / 3));
const NADI_NAMES = { 0: "ஆதி நாடி", 1: "மத்திய நாடி", 2: "அந்திய நாடி" };
const NADI_EN = { 0: "Aadhi", 1: "Madhya", 2: "Anthya" };

// Primary Rasi assignment for each nakshatra (0-11 for Mesha to Meena)
const RASI = [0,0,1,1,2,2,3,3,3,4,4,5,5,6,6,7,7,7,8,8,9,9,10,10,11,11,11];
const RASI_NAMES = {
  0:"மேஷம்",1:"ரிஷபம்",2:"மிதுனம்",3:"கடகம்",4:"சிம்மம்",5:"கன்னி",
  6:"துலாம்",7:"விருச்சிகம்",8:"தனுசு",9:"மகரம்",10:"கும்பம்",11:"மீனம்"
};
const RASI_EN = {
  0:"Mesha",1:"Rishaba",2:"Mithuna",3:"Kataka",4:"Simha",5:"Kanni",
  6:"Thula",7:"Vrischika",8:"Dhanus",9:"Makara",10:"Kumbha",11:"Meena"
};

// Rasi lords: 0=Mars,1=Venus,2=Mercury,3=Moon,4=Sun,5=Mercury,6=Venus,7=Mars,8=Jupiter,9=Saturn,10=Saturn,11=Jupiter
const RASI_LORD = [0,1,2,3,4,2,1,0,5,6,6,5];
const LORD_NAMES = { 0:"செவ்வாய்",1:"சுக்கிரன்",2:"புதன்",3:"சந்திரன்",4:"சூரியன்",5:"குரு",6:"சனி" };

// Planet friendships for Rasiyathipathi porutham (Parashari natural friendship)
// 0=Mars,1=Venus,2=Mercury,3=Moon,4=Sun,5=Jupiter,6=Saturn
const PLANET_FRIENDS = {
  0: [4, 3, 5],       // Mars friends: Sun, Moon, Jupiter
  1: [2, 6],          // Venus friends: Mercury, Saturn
  2: [4, 1],          // Mercury friends: Sun, Venus
  3: [4, 2],          // Moon friends: Sun, Mercury
  4: [3, 0, 5],       // Sun friends: Moon, Mars, Jupiter
  5: [4, 3, 0],       // Jupiter friends: Sun, Moon, Mars
  6: [2, 1],          // Saturn friends: Mercury, Venus
};
const PLANET_ENEMIES = {
  0: [],              // Mars enemies: (none universally agreed, some say Mercury)
  1: [4, 3],          // Venus enemies: Sun, Moon
  2: [3],             // Mercury enemies: Moon
  3: [],              // Moon enemies: (none universally agreed)
  4: [1, 6],          // Sun enemies: Venus, Saturn
  5: [2, 1],          // Jupiter enemies: Mercury, Venus
  6: [4, 3, 0],       // Saturn enemies: Sun, Moon, Mars
};
const PLANET_NEUTRAL = {
  0: [1, 2, 6],       // Mars neutral: Venus, Mercury, Saturn
  1: [0, 5],          // Venus neutral: Mars, Jupiter
  2: [0, 5, 6],       // Mercury neutral: Mars, Jupiter, Saturn
  3: [0, 5, 1, 6],    // Moon neutral: Mars, Jupiter, Venus, Saturn
  4: [2],             // Sun neutral: Mercury
  5: [6],             // Jupiter neutral: Saturn
  6: [5],             // Saturn neutral: Jupiter
};

// Vasya Rasi pairs
const VASYA_MAP = {
  0: [4, 7],    // Mesha: Simha, Vrischika
  1: [3, 6],    // Rishaba: Kataka, Thula (Libra?)
  2: [5],       // Mithuna: Kanni
  3: [7, 8],    // Kataka: Vrischika, Dhanus
  4: [6],       // Simha: Thula (actually Simha vasya is different by source)
  5: [2, 11],   // Kanni: Mithuna, Meena
  6: [9],       // Thula: Makara
  7: [3],       // Vrischika: Kataka
  8: [11],      // Dhanus: Meena
  9: [0],       // Makara: Mesha
  10: [0],      // Kumbha: Mesha (varies by source)
  11: [9],      // Meena: Makara
};

// ========== PORUTHAM CALCULATION FUNCTIONS ==========

function calcDinaPorutham(girlStar, boyStar) {
  // Count from girl's star to boy's star
  const count = ((boyStar - girlStar + 27) % 27) + 1;
  const remainder = count % 9;
  // Remainders 2,4,6,8,0(=9) are good
  const good = [0, 2, 4, 6, 8].includes(remainder);
  return { match: good, detail: `எண்ணிக்கை: ${count}, மீதி: ${remainder === 0 ? 9 : remainder}` };
}

function calcGanaPorutham(girlStar, boyStar) {
  const gGana = GANA[girlStar];
  const bGana = GANA[boyStar];
  // Same gana = best, Deva-Manushya = ok, Deva-Rakshasa or Manushya-Rakshasa = not good
  if (gGana === bGana) return { match: true, detail: `இருவரும் ${GANA_NAMES[gGana]} கணம்` };
  const pair = [gGana, bGana].sort().join(",");
  if (pair === "0,1") return { match: true, detail: `${GANA_NAMES[gGana]} + ${GANA_NAMES[bGana]} - பொருத்தம்` };
  return { match: false, detail: `${GANA_NAMES[gGana]} + ${GANA_NAMES[bGana]} - பொருத்தமில்லை` };
}

function calcMahendraPorutham(girlStar, boyStar) {
  const count = ((boyStar - girlStar + 27) % 27) + 1;
  // Counts 4,7,10,13,16,19,22,25 from girl to boy
  const good = [4, 7, 10, 13, 16, 19, 22, 25].includes(count);
  return { match: good, detail: `எண்ணிக்கை: ${count}` };
}

function calcStreeDheergaPorutham(girlStar, boyStar) {
  // Count from girl's star to boy's star; should be > 13 (some say > 9)
  const count = ((boyStar - girlStar + 27) % 27) + 1;
  const good = count > 13;
  const ok = count > 9;
  return { match: good || ok, detail: `எண்ணிக்கை: ${count} ${good ? "(நல்லது)" : ok ? "(ஓரளவு)" : "(குறைவு)"}` };
}

function calcYoniPorutham(girlStar, boyStar) {
  const gYoni = YONI[girlStar];
  const bYoni = YONI[boyStar];
  if (gYoni === bYoni) return { match: true, detail: `இருவரும் ${YONI_NAMES[gYoni]} யோனி - சிறப்பு` };
  const isEnemy = YONI_ENEMIES.some(([a, b]) =>
    (a === gYoni && b === bYoni) || (b === gYoni && a === bYoni)
  );
  if (isEnemy) return { match: false, detail: `${YONI_NAMES[gYoni]} ↔ ${YONI_NAMES[bYoni]} - பகை யோனி` };
  return { match: true, detail: `${YONI_NAMES[gYoni]} + ${YONI_NAMES[bYoni]} - நட்பு/நடுநிலை` };
}

function calcRasiPorutham(girlStar, boyStar) {
  const gRasi = RASI[girlStar];
  const bRasi = RASI[boyStar];
  const countFromGirl = ((bRasi - gRasi + 12) % 12) + 1;
  const countFromBoy = ((gRasi - bRasi + 12) % 12) + 1;
  // 6th and 8th positions (ஆறு-எட்டு / Shashtashtaka) are BAD from either direction
  // 12th is also unfavorable. All others are acceptable.
  const badCounts = [6, 8, 12];
  const isShashtashtaka = badCounts.includes(countFromGirl) || badCounts.includes(countFromBoy);
  const match = !isShashtashtaka;
  const label = isShashtashtaka
    ? `${RASI_NAMES[gRasi]} → ${RASI_NAMES[bRasi]} (${countFromGirl}வது) — ஆறு-எட்டு தோஷம்!`
    : `${RASI_NAMES[gRasi]} → ${RASI_NAMES[bRasi]} (${countFromGirl}வது)`;
  return { match, detail: label, isShashtashtaka };
}

function calcRasiyathipathiPorutham(girlStar, boyStar) {
  const gLord = RASI_LORD[RASI[girlStar]];
  const bLord = RASI_LORD[RASI[boyStar]];
  if (gLord === bLord) return { match: true, detail: `ஒரே அதிபதி: ${LORD_NAMES[gLord]}` };

  // Check mutual relationship (both directions matter)
  const gToBFriend = PLANET_FRIENDS[gLord]?.includes(bLord);
  const bToGFriend = PLANET_FRIENDS[bLord]?.includes(gLord);
  const gToBEnemy = PLANET_ENEMIES[gLord]?.includes(bLord);
  const bToGEnemy = PLANET_ENEMIES[bLord]?.includes(gLord);

  // Both friends = best
  if (gToBFriend && bToGFriend) return { match: true, detail: `${LORD_NAMES[gLord]} ↔ ${LORD_NAMES[bLord]} — இருவரும் நட்பு` };
  // One friend, one neutral = ok
  if ((gToBFriend || bToGFriend) && !gToBEnemy && !bToGEnemy) return { match: true, detail: `${LORD_NAMES[gLord]} + ${LORD_NAMES[bLord]} — நட்பு/சமம்` };
  // Both neutral = partial ok
  if (!gToBFriend && !bToGFriend && !gToBEnemy && !bToGEnemy) return { match: true, detail: `${LORD_NAMES[gLord]} + ${LORD_NAMES[bLord]} — சமம்` };
  // Any enemy involvement = fail
  return { match: false, detail: `${LORD_NAMES[gLord]} + ${LORD_NAMES[bLord]} — பகை` };
}

function calcVasyaPorutham(girlStar, boyStar) {
  const gRasi = RASI[girlStar];
  const bRasi = RASI[boyStar];
  if (gRasi === bRasi) return { match: true, detail: `ஒரே ராசி - வஷ்யம் உண்டு` };
  const gVasya = VASYA_MAP[gRasi] || [];
  const bVasya = VASYA_MAP[bRasi] || [];
  const match = gVasya.includes(bRasi) || bVasya.includes(gRasi);
  return { match, detail: `${RASI_NAMES[gRasi]} ↔ ${RASI_NAMES[bRasi]}` };
}

function calcRajjuPorutham(girlStar, boyStar) {
  const gRajju = RAJJU[girlStar];
  const bRajju = RAJJU[boyStar];
  const sameRajju = gRajju === bRajju;
  const ekaNakshatra = girlStar === boyStar;
  const RAJJU_SEVERITY = {
    0: "பாத ரஜ்ஜு — அலைச்சல்/பிரிவு",
    1: "கடி ரஜ்ஜு — வறுமை",
    2: "நாபி ரஜ்ஜு — சந்ததி நஷ்டம்",
    3: "கண்ட ரஜ்ஜு — மனைவிக்கு ஆபத்து",
    4: "சிரோ ரஜ்ஜு — கணவனுக்கு ஆபத்து"
  };
  if (!sameRajju) {
    return { match: true, detail: `${RAJJU_EN[gRajju]} + ${RAJJU_EN[bRajju]} — வேறு ரஜ்ஜு ✓`, isCritical: true };
  }
  if (ekaNakshatra) {
    return { match: true, detail: `ஏக நட்சத்திரம் (ஒரே நட்சத்திரம்) — ரஜ்ஜு விதிவிலக்கு ✓`, isCritical: true };
  }
  return { match: false, detail: `இருவரும் ${RAJJU_NAMES[gRajju]} — ${RAJJU_SEVERITY[gRajju]}`, isCritical: true };
}

function calcVedhaiPorutham(girlStar, boyStar) {
  const isVedhai = VEDHAI_PAIRS.some(([a, b]) =>
    (a === girlStar && b === boyStar) || (b === girlStar && a === boyStar)
  );
  return {
    match: !isVedhai,
    detail: isVedhai ? "வேதை ஜோடி — தவிர்க்கவும்!" : "வேதை இல்லை ✓",
    isCritical: true
  };
}

function calcAllPorutham(girlStar, boyStar) {
  const poruthams = [
    { name: "நாள்", nameEn: "Dina", ...calcDinaPorutham(girlStar, boyStar) },
    { name: "கணம்", nameEn: "Gana", ...calcGanaPorutham(girlStar, boyStar) },
    { name: "மகேந்திரம்", nameEn: "Mahendra", ...calcMahendraPorutham(girlStar, boyStar) },
    { name: "ஸ்திரீ தீர்க்கம்", nameEn: "Stree Dheerga", ...calcStreeDheergaPorutham(girlStar, boyStar) },
    { name: "யோனி", nameEn: "Yoni", ...calcYoniPorutham(girlStar, boyStar) },
    { name: "ராசி", nameEn: "Rasi", ...calcRasiPorutham(girlStar, boyStar) },
    { name: "ராசியதிபதி", nameEn: "Rasiyathipathi", ...calcRasiyathipathiPorutham(girlStar, boyStar) },
    { name: "வஷ்யம்", nameEn: "Vasya", ...calcVasyaPorutham(girlStar, boyStar) },
    { name: "ரஜ்ஜு", nameEn: "Rajju", ...calcRajjuPorutham(girlStar, boyStar) },
    { name: "வேதை", nameEn: "Vedhai", ...calcVedhaiPorutham(girlStar, boyStar) },
  ];
  const rawScore = poruthams.filter(p => p.match).length;

  // Critical failure: Rajju and Vedhai are must-pass in Thirukanitham
  const rajjuFail = !poruthams[8].match; // Rajju
  const vedhaiFail = !poruthams[9].match; // Vedhai
  const rasiFail = poruthams[5].isShashtashtaka; // 6-8 Rasi
  const criticalFail = rajjuFail || vedhaiFail;
  const criticalWarnings = [];
  if (rajjuFail) criticalWarnings.push("ரஜ்ஜு தோஷம்");
  if (vedhaiFail) criticalWarnings.push("வேதை தோஷம்");
  if (rasiFail) criticalWarnings.push("ஆறு-எட்டு தோஷம்");

  return { poruthams, rawScore, score: rawScore, criticalFail, criticalWarnings, rajjuFail, vedhaiFail, rasiFail };
}

// ========== COMPONENT ==========

export default function NakshatraPorutham() {
  const [girlStar, setGirlStar] = useState(null);
  const [boyStar, setBoyStar] = useState(null);
  const [view, setView] = useState("selector"); // selector, detail, grid

  const compatibility = useMemo(() => {
    if (girlStar === null) return null;
    return NAKSHATRAS.map((n, i) => ({
      ...n,
      ...calcAllPorutham(girlStar, i)
    }));
  }, [girlStar]);

  const selectedDetail = useMemo(() => {
    if (girlStar === null || boyStar === null) return null;
    return calcAllPorutham(girlStar, boyStar);
  }, [girlStar, boyStar]);

  const getScoreColor = (score, criticalFail = false) => {
    if (criticalFail) return "#b71c1c";
    if (score >= 8) return "#1a7a3a";
    if (score >= 6) return "#2e7d32";
    if (score >= 5) return "#e65100";
    if (score >= 3) return "#c62828";
    return "#b71c1c";
  };

  const getScoreBg = (score, criticalFail = false) => {
    if (criticalFail) return "#ffebee";
    if (score >= 8) return "#e8f5e9";
    if (score >= 6) return "#f1f8e9";
    if (score >= 5) return "#fff3e0";
    if (score >= 3) return "#fce4ec";
    return "#ffebee";
  };

  const getScoreLabel = (score, criticalFail = false, warnings = []) => {
    if (criticalFail) return `⚠ ${warnings.join(" + ")} — பொருத்தம் கூடாது`;
    if (score >= 8) return "மிக நல்ல பொருத்தம்";
    if (score >= 6) return "நல்ல பொருத்தம்";
    if (score >= 5) return "சராசரி பொருத்தம்";
    if (score >= 3) return "குறைவான பொருத்தம்";
    return "பொருத்தம் இல்லை";
  };

  const getScoreLabelEn = (score, criticalFail = false) => {
    if (criticalFail) return "⚠ Not Recommended";
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 5) return "Average";
    if (score >= 3) return "Below Average";
    return "Not Compatible";
  };

  // Effective tier for grouping/display — critical failure overrides raw score
  const getEffectiveTier = (score, criticalFail) => {
    if (criticalFail) return "critical";
    if (score >= 8) return "excellent";
    if (score >= 6) return "good";
    if (score >= 5) return "average";
    return "poor";
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      maxWidth: 900,
      margin: "0 auto",
      padding: "20px 16px",
      color: "#1a1a2e",
      background: "linear-gradient(180deg, #fdf6ee 0%, #fff 40%)",
      minHeight: "100vh"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28, padding: "16px 0" }}>
        <div style={{ fontSize: 13, letterSpacing: 2, color: "#8b5e3c", textTransform: "uppercase", marginBottom: 6 }}>
          திருக்கணிதம் | Thirukanitham
        </div>
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          margin: "0 0 4px",
          color: "#5b1a3a",
          lineHeight: 1.2
        }}>
          நட்சத்திர பொருத்தம்
        </h1>
        <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
          Nakshatra Marriage Compatibility — 10 Porutham Analysis
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e8ddd0" }}>
        {[
          { key: "selector", label: "நட்சத்திரம் தேர்வு", labelEn: "Select Star" },
          { key: "grid", label: "முழு அட்டவணை", labelEn: "Full Grid" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setView(tab.key); if(tab.key==="grid") { setBoyStar(null); } }}
            style={{
              flex: 1,
              padding: "10px 8px",
              border: "none",
              borderBottom: view === tab.key ? "3px solid #8b1a4a" : "3px solid transparent",
              background: "transparent",
              color: view === tab.key ? "#8b1a4a" : "#888",
              fontWeight: view === tab.key ? 700 : 400,
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s"
            }}
          >
            <div>{tab.label}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{tab.labelEn}</div>
          </button>
        ))}
      </div>

      {/* SELECTOR VIEW */}
      {view === "selector" && (
        <div>
          {/* Girl's Star Selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#8b1a4a",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <span style={{ fontSize: 16 }}>♀</span> பெண் நட்சத்திரம் (Girl's Star)
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 6
            }}>
              {NAKSHATRAS.map((n, i) => (
                <button
                  key={i}
                  onClick={() => { setGirlStar(i); setBoyStar(null); }}
                  style={{
                    padding: "8px 6px",
                    border: girlStar === i ? "2px solid #8b1a4a" : "1px solid #ddd",
                    borderRadius: 8,
                    background: girlStar === i ? "#fce4ec" : "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "center",
                    transition: "all 0.15s",
                    lineHeight: 1.3
                  }}
                >
                  <div style={{ fontWeight: 600, color: girlStar === i ? "#8b1a4a" : "#333" }}>{n.ta}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{n.en}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Results for selected girl star */}
          {girlStar !== null && compatibility && (
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#1a4a8b",
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <span style={{ fontSize: 16 }}>♂</span>
                {NAKSHATRAS[girlStar].ta} பெண்ணுக்கு — ஆண் நட்சத்திர பொருத்தம்
              </div>

              {/* Summary bar */}
              <div style={{
                display: "flex",
                gap: 8,
                marginBottom: 12,
                flexWrap: "wrap",
                fontSize: 11,
                color: "#555"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#e8f5e9", border: "1px solid #1a7a3a" }}></span>
                  8-10 மிக நல்லது
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#f1f8e9", border: "1px solid #2e7d32" }}></span>
                  6-7 நல்லது
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#fff3e0", border: "1px solid #e65100" }}></span>
                  5 சராசரி
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#ffebee", border: "1px solid #c62828" }}></span>
                  0-4 குறைவு
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#ffebee", border: "2px solid #b71c1c" }}></span>
                  ⚠ ரஜ்ஜு/வேதை தோஷம்
                </span>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 6
              }}>
                {compatibility.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { setBoyStar(i); }}
                    style={{
                      padding: "8px 6px",
                      border: boyStar === i ? "2px solid #1a4a8b" : c.criticalFail ? "2px solid #b71c1c" : "1px solid #ddd",
                      borderRadius: 8,
                      background: getScoreBg(c.rawScore, c.criticalFail),
                      cursor: "pointer",
                      fontSize: 12,
                      textAlign: "center",
                      transition: "all 0.15s",
                      lineHeight: 1.3,
                      position: "relative"
                    }}
                  >
                    {c.criticalFail && (
                      <div style={{
                        position: "absolute",
                        top: 2,
                        left: 6,
                        fontSize: 12,
                      }}>⚠</div>
                    )}
                    <div style={{
                      position: "absolute",
                      top: 4,
                      right: 6,
                      fontSize: 15,
                      fontWeight: 800,
                      color: getScoreColor(c.rawScore, c.criticalFail)
                    }}>
                      {c.rawScore}
                    </div>
                    <div style={{ fontWeight: 600, color: c.criticalFail ? "#b71c1c" : "#333" }}>{c.ta}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{c.en}</div>
                    <div style={{
                      fontSize: 9,
                      color: getScoreColor(c.rawScore, c.criticalFail),
                      fontWeight: 600,
                      marginTop: 2
                    }}>
                      {c.rawScore}/10 {getScoreLabelEn(c.rawScore, c.criticalFail)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Breakdown */}
          {selectedDetail && boyStar !== null && (
            <div style={{
              marginTop: 20,
              padding: 16,
              background: "#fff",
              border: "1px solid #e0d5c8",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 8
              }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#8b1a4a" }}>
                    ♀ {NAKSHATRAS[girlStar].ta}
                  </span>
                  <span style={{ margin: "0 8px", color: "#aaa" }}>×</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a4a8b" }}>
                    ♂ {NAKSHATRAS[boyStar].ta}
                  </span>
                </div>
                <div style={{
                  background: getScoreBg(selectedDetail.rawScore, selectedDetail.criticalFail),
                  color: getScoreColor(selectedDetail.rawScore, selectedDetail.criticalFail),
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 13
                }}>
                  {selectedDetail.rawScore}/10 — {getScoreLabel(selectedDetail.rawScore, selectedDetail.criticalFail, selectedDetail.criticalWarnings)}
                </div>
              </div>

              {/* Critical Warning Banner */}
              {selectedDetail.criticalFail && (
                <div style={{
                  background: "#fff0f0",
                  border: "1px solid #e53935",
                  borderLeft: "4px solid #b71c1c",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 14,
                  fontSize: 12,
                  color: "#b71c1c",
                  lineHeight: 1.6
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    ⚠ முக்கிய தோஷம் — "ரஜ்ஜு இல்லையேல் பொருத்தம் இல்லை"
                  </div>
                  <div>
                    {selectedDetail.rajjuFail && <div>• <strong>ரஜ்ஜு தோஷம்:</strong> இருவரும் ஒரே ரஜ்ஜு — இது மிக முக்கியமான பொருத்தம். இது இல்லாமல் மற்ற பொருத்தங்கள் எத்தனை இருந்தாலும் திருமணம் பரிந்துரைக்கப்படாது.</div>}
                    {selectedDetail.vedhaiFail && <div>• <strong>வேதை தோஷம்:</strong> இந்த நட்சத்திர ஜோடி பகை ஜோடி — திருமணம் தவிர்க்கவும்.</div>}
                    {selectedDetail.rasiFail && <div>• <strong>ஆறு-எட்டு:</strong> ராசிகள் 6/8 நிலையில் உள்ளன — ஷஷ்டாஷ்டக தோஷம்.</div>}
                  </div>
                </div>
              )}

              {/* Star info row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginBottom: 16,
                fontSize: 11,
                color: "#555"
              }}>
                <div style={{ background: "#fdf6f8", padding: 8, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: "#8b1a4a", marginBottom: 4 }}>♀ {NAKSHATRAS[girlStar].en}</div>
                  <div>ராசி: {RASI_NAMES[RASI[girlStar]]} | கணம்: {GANA_NAMES[GANA[girlStar]]}</div>
                  <div>யோனி: {YONI_NAMES[YONI[girlStar]]} | நாடி: {NADI_NAMES[NADI[girlStar]]}</div>
                  <div>ரஜ்ஜு: {RAJJU_NAMES[RAJJU[girlStar]]}</div>
                </div>
                <div style={{ background: "#f6f8fd", padding: 8, borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: "#1a4a8b", marginBottom: 4 }}>♂ {NAKSHATRAS[boyStar].en}</div>
                  <div>ராசி: {RASI_NAMES[RASI[boyStar]]} | கணம்: {GANA_NAMES[GANA[boyStar]]}</div>
                  <div>யோனி: {YONI_NAMES[YONI[boyStar]]} | நாடி: {NADI_NAMES[NADI[boyStar]]}</div>
                  <div>ரஜ்ஜு: {RAJJU_NAMES[RAJJU[boyStar]]}</div>
                </div>
              </div>

              {/* Porutham Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f5f0e8" }}>
                      <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #d4c4a8" }}>#</th>
                      <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #d4c4a8" }}>பொருத்தம்</th>
                      <th style={{ padding: "8px", textAlign: "center", borderBottom: "2px solid #d4c4a8" }}>நிலை</th>
                      <th style={{ padding: "8px", textAlign: "left", borderBottom: "2px solid #d4c4a8" }}>விவரம்</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDetail.poruthams.map((p, i) => {
                      const isCriticalRow = p.isCritical;
                      const criticalFailRow = isCriticalRow && !p.match;
                      return (
                      <tr key={i} style={{
                        background: criticalFailRow ? "#fff0f0" : i % 2 === 0 ? "#fff" : "#faf8f5"
                      }}>
                        <td style={{ padding: "7px 8px", borderBottom: "1px solid #eee", color: "#999", fontSize: 11 }}>{i + 1}</td>
                        <td style={{ padding: "7px 8px", borderBottom: "1px solid #eee" }}>
                          <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                            {p.name}
                            {isCriticalRow && (
                              <span style={{
                                fontSize: 8,
                                background: "#b71c1c",
                                color: "#fff",
                                padding: "1px 4px",
                                borderRadius: 3,
                                fontWeight: 700,
                                verticalAlign: "middle"
                              }}>முக்கியம்</span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: "#888" }}>{p.nameEn}</div>
                        </td>
                        <td style={{
                          padding: "7px 8px",
                          textAlign: "center",
                          borderBottom: "1px solid #eee",
                          fontSize: 16,
                          fontWeight: 700,
                          color: p.match ? "#2e7d32" : "#c62828"
                        }}>
                          {p.match ? "✓" : "✗"}
                        </td>
                        <td style={{
                          padding: "7px 8px",
                          borderBottom: "1px solid #eee",
                          fontSize: 11,
                          color: criticalFailRow ? "#b71c1c" : "#555",
                          fontWeight: criticalFailRow ? 600 : 400
                        }}>
                          {p.detail}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {view === "grid" && (
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
            பெண் நட்சத்திரத்தை தேர்வு செய்யுங்கள். ஒவ்வொரு ஆண் நட்சத்திரத்திற்கும் 10 பொருத்த மதிப்பெண் காட்டப்படும்.
          </div>
          {girlStar === null && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 6
            }}>
              {NAKSHATRAS.map((n, i) => (
                <button
                  key={i}
                  onClick={() => setGirlStar(i)}
                  style={{
                    padding: "8px 6px",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{n.ta}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{n.en}</div>
                </button>
              ))}
            </div>
          )}

          {girlStar !== null && compatibility && (
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
                flexWrap: "wrap"
              }}>
                <div style={{
                  background: "#fce4ec",
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#8b1a4a"
                }}>
                  ♀ {NAKSHATRAS[girlStar].ta} ({NAKSHATRAS[girlStar].en})
                </div>
                <button
                  onClick={() => { setGirlStar(null); setBoyStar(null); }}
                  style={{
                    padding: "5px 12px",
                    border: "1px solid #ccc",
                    borderRadius: 16,
                    background: "#f5f5f5",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "#666"
                  }}
                >
                  மாற்று ↻
                </button>
              </div>

              {/* Sorted groups — critical failures separated out */}
              {(() => {
                const criticalItems = compatibility.filter(c => c.criticalFail);
                const safeItems = compatibility.filter(c => !c.criticalFail);
                const groups = [
                  { label: "மிக நல்ல பொருத்தம் (8–10)", labelEn: "Excellent Match", items: safeItems.filter(c => c.rawScore >= 8), accent: "#1a7a3a" },
                  { label: "நல்ல பொருத்தம் (6–7)", labelEn: "Good Match", items: safeItems.filter(c => c.rawScore >= 6 && c.rawScore < 8), accent: "#2e7d32" },
                  { label: "சராசரி (5)", labelEn: "Average", items: safeItems.filter(c => c.rawScore === 5), accent: "#e65100" },
                  { label: "குறைவு (0–4)", labelEn: "Below Average", items: safeItems.filter(c => c.rawScore < 5), accent: "#c62828" },
                  { label: "⚠ ரஜ்ஜு / வேதை தோஷம் — பொருத்தம் கூடாது", labelEn: "Critical Dosham — Not Recommended", items: criticalItems, accent: "#b71c1c" },
                ];
                return groups.map(group => {
                  if (group.items.length === 0) return null;
                  return (
                    <div key={group.label} style={{ marginBottom: 16 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: group.accent,
                        marginBottom: 6,
                        padding: "4px 0",
                        borderBottom: `2px solid ${group.accent}20`
                      }}>
                        {group.label} <span style={{ fontWeight: 400, fontSize: 11 }}>— {group.labelEn} ({group.items.length} stars)</span>
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: 6
                      }}>
                        {group.items.sort((a, b) => b.rawScore - a.rawScore).map(c => (
                          <button
                            key={c.id}
                            onClick={() => { setBoyStar(c.id); setView("selector"); }}
                            style={{
                              padding: "8px",
                              border: c.criticalFail ? "2px solid #b71c1c" : "1px solid #e0e0e0",
                              borderRadius: 8,
                              background: getScoreBg(c.rawScore, c.criticalFail),
                              cursor: "pointer",
                              fontSize: 12,
                              textAlign: "left",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: c.criticalFail ? "#b71c1c" : "#333" }}>
                                {c.criticalFail && "⚠ "}♂ {c.ta}
                              </div>
                              <div style={{ fontSize: 10, color: "#888" }}>{c.en}</div>
                              {c.criticalFail && (
                                <div style={{ fontSize: 9, color: "#b71c1c", marginTop: 2 }}>
                                  {c.criticalWarnings.join(", ")}
                                </div>
                              )}
                            </div>
                            <div style={{
                              fontWeight: 800,
                              fontSize: 18,
                              color: getScoreColor(c.rawScore, c.criticalFail),
                              marginLeft: 8
                            }}>
                              {c.rawScore}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: 28,
        padding: "12px 14px",
        background: "#fdf6ee",
        borderRadius: 8,
        fontSize: 11,
        color: "#8b7355",
        lineHeight: 1.6,
        borderLeft: "3px solid #d4a853"
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>பொருத்த படிநிலை | Porutham Hierarchy</div>
        <div style={{ marginBottom: 6 }}>
          <strong>முக்கிய பொருத்தங்கள் (Must-Pass):</strong> ரஜ்ஜு மற்றும் வேதை இரண்டும் கட்டாயம் பொருந்த வேண்டும்.
          இவை இல்லாமல் மற்ற 8 பொருத்தங்கள் அனைத்தும் இருந்தாலும் திருமணம் பரிந்துரைக்கப்படாது.
          "ரஜ்ஜு இல்லையேல் பொருத்தம் இல்லை" என்பது நியதி.
        </div>
        <div style={{ marginBottom: 6 }}>
          <strong>ஆறு-எட்டு (6/8 ராசி):</strong> பெண் ராசியிலிருந்து ஆண் ராசி 6வது அல்லது 8வது இடத்தில் (அல்லது மாறாக) இருந்தால்
          ஷஷ்டாஷ்டக தோஷம் — இதுவும் தவிர்க்கப்பட வேண்டும்.
        </div>
        <div>
          <strong>குறிப்பு:</strong> ராசி, ராசியதிபதி, வஷ்யம், ஸ்திரீ தீர்க்கம் ஆகியவை பாதம் (Pada) சார்ந்தவை — இங்கு முதன்மை ராசி பயன்படுத்தப்படுகிறது.
          முழுமையான ஜாதக பொருத்தத்திற்கு பாதம், தசா புக்தி, தோஷ பரிகாரம் ஆகியவற்றையும் ஆராய வேண்டும்.
        </div>
      </div>
    </div>
  );
}
