"use client";

import React, { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ChartYogaInsight, ChartDoshamInsight } from "@/lib/types";

// ── Display name maps ────────────────────────────────────────────────────────

const YOGA_DISPLAY: Record<string, { ta: string; en: string }> = {
  GAJA_KESARI_YOGA: { ta: "Gaja Kesari Yoga", en: "Gaja Kesari Yoga" },
  GAJA_KESARI:      { ta: "Gaja Kesari Yoga", en: "Gaja Kesari Yoga" },
  RAJA_YOGA:        { ta: "Raja Yoga",         en: "Raja Yoga" },
  DHANA_YOGA:       { ta: "Dhana Yoga",        en: "Dhana Yoga" },
  NEECHA_BHANGA_RAJA_YOGA: { ta: "Neecha Bhanga Raja Yoga", en: "Neecha Bhanga Raja Yoga" },
  KALASARPA:        { ta: "Kala Sarpa Yoga",   en: "Kala Sarpa Yoga" },
  SEVVAI_DOSHAM:    { ta: "Sevvai Dosham",      en: "Sevvai Dosham" },
  RAHU_KETU_DOSHAM: { ta: "Rahu-Ketu Dosham",  en: "Rahu-Ketu Dosham" },
  PITRU_DOSHAM:     { ta: "Pitru Dosham",       en: "Pitru Dosham" },
};

// ── Human-readable marker labels ─────────────────────────────────────────────
// Used only for bullet lists — write them as complete short sentences

const MARKER_LABELS: Record<string, { ta: string; en: string }> = {
  // Sevvai trigger
  from_lagna:  { ta: "செவ்வாய் லக்னத்திலிருந்து தோஷ வீட்டில் உள்ளது", en: "Mars is in a dosha house counted from your Lagna" },
  from_moon:   { ta: "செவ்வாய் சந்திரனிலிருந்து தோஷ வீட்டில் உள்ளது", en: "Mars is in a dosha house counted from your Moon sign" },
  from_venus:  { ta: "செவ்வாய் சுக்கிரனிலிருந்து தோஷ வீட்டில் உள்ளது", en: "Mars is in a dosha house counted from your Venus" },
  female_high_attention_house: { ta: "பெண் ஜாதகம்: இந்த வீட்டில் செவ்வாய் கூடுதல் கவனம் தேவை", en: "Female chart: this house position of Mars needs extra attention" },
  male_high_attention_house:   { ta: "ஆண் ஜாதகம்: இந்த வீட்டில் செவ்வாய் கூடுதல் கவனம் தேவை", en: "Male chart: this house position of Mars needs extra attention" },
  // Sevvai nivarthi / cancellation
  mars_own_sign:                   { ta: "செவ்வாய் சொந்த ராசியில் — தோஷம் பெரும்பாலும் நீர்த்துப்போகும்", en: "Mars is in its own sign — dosham intensity is significantly reduced" },
  mars_exaltation:                  { ta: "செவ்வாய் உச்ச ராசியில் — தோஷம் மிகவும் குறையும்", en: "Mars is exalted — dosham is greatly softened" },
  mars_yogakaraka_lagna:            { ta: "இந்த லக்னத்திற்கு செவ்வாய் யோககாரகன் — தோஷம் ரத்தாகிறது", en: "Mars is a Yogakaraka planet for your Lagna — dosham is cancelled" },
  mars_lagna_lord_mitigation:       { ta: "செவ்வாய் லக்னாதிபதி — லக்னாதிபதி விதியால் தோஷம் குறைகிறது", en: "Mars rules your Lagna — lagna-lord rule reduces dosham" },
  house_sign_nivarthi:              { ta: "செவ்வாயின் ராசி இந்த வீட்டிற்கான நிவர்த்தி ராசி — தோஷம் குறைகிறது", en: "Mars occupies the nivarthi rasi for that house — dosham is reduced" },
  jupiter_aspect_on_mars:           { ta: "குரு செவ்வாயை பார்க்கிறார் — நலமான தோஷ குறைப்பு", en: "Jupiter aspects Mars — a strong protective influence" },
  jupiter_conjunct_mars:            { ta: "குரு செவ்வாயுடன் சேர்ந்திருக்கிறார் — மிகவும் வலுவான நிவர்த்தி", en: "Jupiter is conjunct Mars in the same house — very strong cancellation" },
  benefic_association_mars:         { ta: "சுபக்கிரகம் செவ்வாயுடன் இணைந்துள்ளது — தோஷம் மெலிகிறது", en: "A benefic planet is with Mars — dosham is weakened" },
  mars_dispositor_kendra_trikona:   { ta: "செவ்வாயின் வீட்டு அதிபதி கேந்திர/திரிகோணத்தில் — குறைந்த தாக்கம்", en: "Mars sign-lord is in a kendra or trikona — reduced impact" },
  benefic_strong_seventh_lord:      { ta: "வலுவான சுப 7-ம் அதிபதி பாதுகாப்பு தருகிறார்", en: "A strong benefic 7th lord provides protection" },
  both_partners_have_sevvai:        { ta: "இருவருக்கும் ஒப்பான செவ்வாய் நிலை — ஒத்திசைவு சீர்படுகிறது", en: "Both partners have comparable Sevvai — compatibility balances out" },
  // Rahu-Ketu triggers
  rahu_in_marriage_house:  { ta: "ராகு திருமண-உணர்வு வீட்டில் (1/2/7/8) உள்ளது", en: "Rahu is in a marriage-sensitive house (1, 2, 7, or 8)" },
  ketu_in_marriage_house:  { ta: "கேது திருமண-உணர்வு வீட்டில் (1/2/7/8) உள்ளது", en: "Ketu is in a marriage-sensitive house (1, 2, 7, or 8)" },
  rahu_in_sarpa_house:     { ta: "ராகு சர்ப்ப/நாக வீட்டில் (5/9) உள்ளது", en: "Rahu is in a Sarpa/Naga house (5th or 9th)" },
  ketu_in_sarpa_house:     { ta: "கேது சர்ப்ப/நாக வீட்டில் (5/9) உள்ளது", en: "Ketu is in a Sarpa/Naga house (5th or 9th)" },
  node_with_seventh_lord:  { ta: "ராகு/கேது 7-ம் அதிபதியுடன் சேர்ந்திருக்கிறது — திருமண சுட்டி பாதிக்கப்படுகிறது", en: "Rahu/Ketu is with the 7th lord — marriage significator is affected" },
  node_with_venus:         { ta: "ராகு/கேது சுக்கிரனுடன் சேர்ந்திருக்கிறது — உறவு பண்பு பாதிக்கப்படுகிறது", en: "Rahu/Ketu is with Venus — relationship quality is affected" },
  node_afflicts_moon:      { ta: "ராகு/கேது சந்திரனுடன் சேர்ந்திருக்கிறது — உணர்ச்சி நிலை பாதிக்கப்படுகிறது", en: "Rahu/Ketu is with the Moon — emotional stability is affected" },
  rahu_ketu_upachaya:      { ta: "ராகு/கேது உபச்சய வீட்டில் (3/6/10/11) — நேரடி தோஷம் குறைவு", en: "Rahu/Ketu is in an upachaya house (3/6/10/11) — less direct impact" },
  // Rahu-Ketu nivarthi
  jupiter_kendra_trikona_support: { ta: "குரு கேந்திர/திரிகோணத்தில் — ராகு/கேது தாக்கம் குறைகிறது", en: "Jupiter is in a kendra or trikona — Rahu/Ketu impact is reduced" },
  strong_seventh_lord:             { ta: "வலுவான 7-ம் அதிபதி திருமண ஆண்மையை காக்கிறார்", en: "Strong 7th lord protects marriage significations" },
  strong_venus:                    { ta: "வலுவான சுக்கிரன் பாதுகாக்கிறார் — உறவு தரம் நல்லது", en: "Strong Venus protects relationship quality" },
  // Pitru
  sun_with_node:       { ta: "சூரியன் ராகு/கேதுவுடன் சேர்ந்திருக்கிறது — பித்ரு சுட்டி முக்கியம்", en: "Sun is with Rahu/Ketu — Pitru significator is linked to nodes" },
  node_in_ninth:       { ta: "ராகு/கேது 9-ம் வீட்டில் — பித்ரு/தர்ம வீடு பாதிக்கப்படுகிறது", en: "Rahu/Ketu is in the 9th house — Pitru/Dharma house is affected" },
  saturn_in_ninth:     { ta: "சனி 9-ம் வீட்டில் — பித்ரு சுட்டியில் கூடுதல் சுமை", en: "Saturn is in the 9th house — adds weight to Pitru indications" },
  ninth_lord_dusthana: { ta: "9-ம் அதிபதி 6/8/12-ல் — பித்ரு தலைவர் சிரமத்தில் உள்ளார்", en: "9th lord is in a dusthana (6/8/12) — Pitru lord is under strain" },
  sun_strong:          { ta: "சூரியன் வலுவாக உள்ளார் — பித்ரு தாக்கம் குறைகிறது", en: "Sun is strong — Pitru impact is reduced" },
  // Yoga conditions
  jupiter_in_kendra_from_moon:              { ta: "சந்திரனிலிருந்து குரு கேந்திரத்தில் உள்ளார்", en: "Jupiter is in a kendra from the Moon" },
  second_eleventh_conjunction:              { ta: "2-ம் மற்றும் 11-ம் அதிபதிகள் ஒரே வீட்டில்", en: "2nd and 11th lords are in the same house" },
  second_eleventh_exchange:                 { ta: "2-ம் மற்றும் 11-ம் அதிபதிகள் பரிவர்த்தனை", en: "2nd and 11th lords are in mutual exchange" },
  both_lords_in_strong_houses:              { ta: "2-ம் மற்றும் 11-ம் அதிபதிகள் இருவரும் வலுவான வீட்டில்", en: "Both 2nd and 11th lords are in strong houses" },
  planet_debilitated:                       { ta: "கிரகம் நீசத்தில் உள்ளது", en: "The planet is in debilitation" },
  debilitation_sign_lord_in_kendra:         { ta: "நீச ராசி அதிபதி கேந்திரத்தில்", en: "The debilitation sign's lord is in a kendra" },
  exalter_of_debilitation_sign_in_kendra:   { ta: "நீச ராசியை உச்சப்படுத்தும் கிரகம் கேந்திரத்தில்", en: "The planet that exalts in this sign is in a kendra" },
  exaltation_sign_lord_aspects_debilitated: { ta: "உச்ச ராசி அதிபதி நீசக் கிரகத்தை பார்க்கிறார்", en: "The exaltation sign's lord aspects the debilitated planet" },
  all_planets_between_rahu_and_ketu:        { ta: "அனைத்து 7 கிரகங்களும் ராகு-கேது வில்லுக்குள் — கால சர்ப்ப அமைப்பு", en: "All 7 planets are within the Rahu–Ketu arc — Kala Sarpa pattern" },
  all_planets_between_ketu_and_rahu:        { ta: "அனைத்து 7 கிரகங்களும் கேது-ராகு வில்லுக்குள் — கால சர்ப்ப அமைப்பு", en: "All 7 planets are within the Ketu–Rahu arc — Kala Sarpa pattern" },
};

function markerLabel(marker: string, lang: Lang): string {
  const entry = MARKER_LABELS[marker];
  if (!entry) return marker.replaceAll("_", " ");
  return lang === "ta" ? entry.ta : entry.en;
}

function displayName(name: string, lang: Lang): string {
  const key = name.toUpperCase();
  const entry = YOGA_DISPLAY[key] ?? YOGA_DISPLAY[key.replace("GAJA_KESARI", "GAJA_KESARI_YOGA")];
  if (!entry) return name;
  return lang === "ta" ? entry.ta : entry.en;
}

// ── What is this yoga/dosham — plain explanation ─────────────────────────────

const YOGA_WHAT: Record<string, { ta: string; en: string }> = {
  GAJA_KESARI_YOGA: {
    ta: "குரு (Jupiter) சந்திரனிலிருந்து கேந்திர வீட்டில் (1/4/7/10) இருக்கும்போது உருவாகும் யோகம். மனத் தெளிவு, பொது அங்கீகாரம், நல்ல நினைவாற்றல் என்பவற்றுடன் தொடர்புடையது.",
    en: "Formed when Jupiter is in a kendra (1/4/7/10) from your Moon. Traditionally linked to mental clarity, public respect, and strong memory.",
  },
  RAJA_YOGA: {
    ta: "ஒரு திரிகோண அதிபதியும் ஒரு கேந்திர அதிபதியும் சேரும்போது அல்லது ஒருவரை ஒருவர் பார்க்கும்போது உருவாகும் யோகம். முன்னேற்றம், பொறுப்பு, மற்றும் சாதனை ஆகியவற்றுடன் தொடர்புடையது.",
    en: "Formed when a trikona lord (1/5/9) and a kendra lord (1/4/7/10) are conjunct or aspect each other. Traditionally linked to growth, responsibility, and achievement.",
  },
  DHANA_YOGA: {
    ta: "2-ம் மற்றும் 11-ம் அதிபதிகள் சேரும்போது அல்லது பரிவர்த்தனை செய்யும்போது உருவாகும் யோகம். திட்டமிட்ட முயற்சியால் வருமானம் வளரும் என்று சுட்டும்.",
    en: "Formed when the 2nd and 11th lords are conjunct or in exchange. Suggests income and savings can grow through planned effort.",
  },
  NEECHA_BHANGA_RAJA_YOGA: {
    ta: "ஒரு கிரகம் நீசத்தில் இருந்தாலும், அதை மீட்கும் நிலைகள் (நீச ராசி அதிபதி கேந்திரத்தில் இருப்பது போன்றவை) சேரும்போது உருவாகும் யோகம். ஆரம்ப சவால்கள் பின்னர் வலிமையாக மாறலாம்.",
    en: "Formed when a debilitated planet has cancellation factors (like the sign lord in kendra). Initial challenges can convert into strength over time.",
  },
  KALASARPA: {
    ta: "அனைத்து 7 கிரகங்களும் ராகு–கேது அச்சின் ஒரே பக்கத்தில் இருக்கும்போது ஏற்படும் அமைப்பு. வாழ்க்கை குறிப்பிட்ட இடங்களில் மட்டுமே கவனம் செலுத்தும்; சில காலங்களில் அழுத்தமாக உணரலாம்.",
    en: "All 7 classical planets are on one side of the Rahu–Ketu axis. Life energy can feel focused or concentrated; some phases feel more intense than others.",
  },
};

const DOSHAM_WHAT: Record<string, { ta: string; en: string }> = {
  SEVVAI_DOSHAM: {
    ta: "செவ்வாய் (Mars) லக்னம், சந்திரன், அல்லது சுக்கிரனிலிருந்து 2, 4, 7, 8, அல்லது 12-ம் வீட்டில் இருக்கும்போது உருவாகும் பாரம்பரிய திருமண பொருத்த சுட்டி. இது ஒரு சாத்தியமான தாக்கம் மட்டுமே — நிவர்த்தி காரணங்கள் இருந்தால் தீவிரம் மிகவும் குறையும்.",
    en: "A traditional marriage-compatibility sensitivity indicator formed when Mars is in the 2nd, 4th, 7th, 8th, or 12th from your Lagna, Moon, or Venus. It is a tendency signal only — cancellation factors can significantly reduce its intensity.",
  },
  RAHU_KETU_DOSHAM: {
    ta: "ராகு அல்லது கேது திருமண வீடுகளில் (1/2/7/8) இருக்கும்போது அல்லது திருமண சுட்டிகளை பாதிக்கும்போது ஏற்படும் சூழல்-சார்ந்த சுட்டி. வலுவான குரு, 7-ம் அதிபதி, சுக்கிரன் இருந்தால் தாக்கம் குறையும்.",
    en: "A context-based sensitivity indicator formed when Rahu or Ketu is in marriage houses (1/2/7/8) or affects marriage significators. Strong Jupiter, 7th lord, or Venus can significantly reduce impact.",
  },
  PITRU_DOSHAM: {
    ta: "சூரியன் ராகு/கேதுவுடன் சேர்வது, 9-ம் வீட்டில் நோட்கள் இருப்பது போன்ற நிலைகளால் உருவாகும் மரபு-கர்ம சுட்டி. குடும்ப உறவுகளிலும் பொறுப்புகளிலும் கூடுதல் கவனம் தேவைப்படலாம்.",
    en: "A lineage-karma sensitivity indicator formed when Sun is with Rahu/Ketu, or nodes occupy the 9th house. Family responsibilities and ancestral duties may feel more prominent.",
  },
  KALASARPA: {
    ta: "அனைத்து 7 கிரகங்களும் ராகு–கேது அச்சின் ஒரே பக்கத்தில் இருக்கும்போது உருவாகும் கட்டமைப்பு. ஒரு யோகம் மற்றும் ஒரு சவாலாக இரண்டும் செயல்படலாம் — சில காலங்களில் வாழ்க்கை கேந்திரீகரிக்கப்பட்டதாக உணரலாம்.",
    en: "A structural pattern formed when all 7 planets are on one side of the Rahu–Ketu axis. Functions as both a yoga and a challenge — life can feel concentrated in certain phases.",
  },
};

function getWhat(name: string, isYoga: boolean, lang: Lang): string {
  const key = name.toUpperCase();
  const map = isYoga ? YOGA_WHAT : DOSHAM_WHAT;
  const entry = map[key] ?? map[key.replace("GAJA_KESARI", "GAJA_KESARI_YOGA")];
  if (!entry) return lang === "ta" ? "பாரம்பரிய ஜோதிட சுட்டி." : "A traditional astrology indicator.";
  return lang === "ta" ? entry.ta : entry.en;
}

// ── "Why you have this" — builds from actual chart conditions ─────────────────

function buildWhyText(
  conditionsMet: string[],
  cancellationFactors: string[],
  isPresent: boolean,
  isCancelled: boolean,
  dashaActivated: boolean,
  lang: Lang,
): string {
  if (!isPresent) {
    return lang === "ta"
      ? "உங்கள் ஜாதகத்தில் இந்த யோகம்/தோஷத்திற்கான தூண்டல் நிலைகள் இல்லை."
      : "Your chart does not have the planetary positions needed to trigger this yoga/dosham.";
  }

  // Filter out annotation-only markers from the "why" sentence
  const triggerMarkers = conditionsMet.filter(
    (c) => !["female_high_attention_house", "male_high_attention_house", "rahu_ketu_upachaya"].includes(c),
  );
  const attentionMarkers = conditionsMet.filter((c) =>
    ["female_high_attention_house", "male_high_attention_house"].includes(c),
  );

  const parts: string[] = [];

  if (triggerMarkers.length > 0) {
    const triggerList = triggerMarkers
      .slice(0, 3)
      .map((c) => markerLabel(c, lang))
      .join("; ");
    parts.push(lang === "ta" ? `தூண்டல் காரணங்கள்: ${triggerList}.` : `Triggered because: ${triggerList}.`);
  }

  if (cancellationFactors.length > 0) {
    const cancelList = cancellationFactors
      .slice(0, 3)
      .map((c) => markerLabel(c, lang))
      .join("; ");
    parts.push(
      lang === "ta"
        ? `நிவர்த்தி/பாதுகாப்பு: ${cancelList}.`
        : `Protective factors present: ${cancelList}.`,
    );
  }

  if (isCancelled) {
    parts.push(
      lang === "ta"
        ? "ஆகவே, தாக்கம் கணிசமாக குறைக்கப்பட்டுள்ளது."
        : "As a result, the impact is significantly reduced.",
    );
  }

  if (attentionMarkers.length > 0) {
    parts.push(
      lang === "ta"
        ? "உங்கள் பாலின அடிப்படையில் இந்த வீட்டு நிலை கூடுதல் கவனம் பெறுகிறது."
        : "Based on your gender, this house placement carries extra traditional attention.",
    );
  }

  if (dashaActivated) {
    parts.push(
      lang === "ta"
        ? "தற்போதைய தசை இந்த கிரக சுட்டியை செயல்படுத்துகிறது — இந்த காலத்தில் இதன் தாக்கம் அதிகமாக உணரப்படலாம்."
        : "Your current Dasha period activates this planetary indicator — its influence may be more noticeable now.",
    );
  }

  return parts.join(" ") || (lang === "ta" ? "ஜாதக கிரக நிலைகளால் இந்த சுட்டி உருவாகிறது." : "Chart planetary positions create this indicator.");
}

// ── "How powerful & what it can do now" ──────────────────────────────────────

const YOGA_POWER_CONTEXT: Record<string, { strong: { ta: string; en: string }; partial: { ta: string; en: string }; weak: { ta: string; en: string } }> = {
  GAJA_KESARI_YOGA: {
    strong:  { ta: "இந்த யோகம் இப்போது முழு பலத்தில் உள்ளது. முடிவெடுக்கும் திறன், சமூக அங்கீகாரம், தொழில்முறை தொடர்புகள் ஆகியவற்றில் ஆதரவு காலமாக இருக்கலாம். தசை இணைந்தால் புதிய வாய்ப்புகள் வரலாம்.", en: "This yoga is at full strength now. Periods of strong mental clarity, social recognition, and professional networking are possible. If your Dasha also aligns, new opportunities may open." },
    partial: { ta: "யோகம் ஓரளவு செயல்பாட்டில் உள்ளது. தொழில்முறை விஷயங்களில் மிதமான ஆதரவு எதிர்பார்க்கலாம்; பெரிய முடிவுகள் எடுக்க சிறந்த தசை காலத்தை காத்திருங்கள்.", en: "The yoga is partially active. Moderate support in professional matters is possible; wait for a matching Dasha period for major decisions." },
    weak:    { ta: "யோகம் தற்போது குறைந்த பலத்தில் உள்ளது. தினசரி ஒழுக்கம் மற்றும் தொழில்முறை நம்பகத்தன்மையில் கவனம் செலுத்துங்கள்.", en: "The yoga is at low strength currently. Focus on daily discipline and professional reliability." },
  },
  RAJA_YOGA: {
    strong:  { ta: "ராஜயோகம் இப்போது வலுவாக உள்ளது. தசை ஆதரிக்கும்போது பொறுப்பு, அங்கீகாரம், வளர்ச்சி ஆகியவை அதிகரிக்கலாம். முக்கியமான தொழில்முறை படிகளுக்கு இது ஒரு நல்ல காலம்.", en: "Raja Yoga is strong now. When Dasha aligns, responsibility, recognition, and career growth can increase. A favorable phase for important professional moves." },
    partial: { ta: "ராஜயோகம் ஓரளவு செயல்பாட்டில் உள்ளது. தொழில்முறை முன்னேற்றம் மெதுவாக இருக்கலாம்; நிலையான முயற்சியை தொடருங்கள்.", en: "Raja Yoga is partially active. Professional progress may be gradual; maintain consistent effort." },
    weak:    { ta: "ராஜயோகம் தற்போது மிகவும் குறைந்த பலத்தில் உள்ளது. அடிப்படை வலிமையை கட்டியெழுப்புவதில் கவனம் செலுத்துங்கள்.", en: "Raja Yoga is at low strength. Focus on building foundational skills and reliability." },
  },
  DHANA_YOGA: {
    strong:  { ta: "தனயோகம் வலுவாக உள்ளது. வருமான ஒழுக்கம், சேமிப்பு, மற்றும் முதலீட்டில் கவனம் செலுத்துவது இந்த காலத்தில் நல்ல பலன் தரலாம்.", en: "Dhana Yoga is strong. Attention to income discipline, savings, and investments can yield good returns in this phase." },
    partial: { ta: "தனயோகம் மிதமாக செயல்படுகிறது. திட்டமிட்ட செலவு மற்றும் சேமிப்பு பழக்கங்கள் படிப்படியாக உதவும்.", en: "Dhana Yoga is moderately active. Planned spending and saving habits will gradually help." },
    weak:    { ta: "தனயோகம் குறைந்த பலத்தில் உள்ளது. தினசரி நிதி நிர்வாகத்தில் ஒழுக்கம் இப்போது மிக முக்கியம்.", en: "Dhana Yoga is at low strength. Daily financial discipline matters most right now." },
  },
  NEECHA_BHANGA_RAJA_YOGA: {
    strong:  { ta: "நீசபங்க ராஜயோகம் வலுவாக உள்ளது. ஆரம்பத்தில் சிரமங்களை சந்தித்த பகுதிகள் இப்போது மேம்படும் திறன் பெறுகின்றன.", en: "Neecha Bhanga is strong. Areas where you faced early difficulty now have the potential to turn into strengths." },
    partial: { ta: "நீசபங்க ஓரளவு செயல்பாட்டில் உள்ளது. பலவீனங்கள் படிப்படியாக சரியாகலாம்; அவசரப்படவேண்டாம்.", en: "Neecha Bhanga is partially active. Weaknesses may improve gradually; avoid rushing the process." },
    weak:    { ta: "நீசபங்க ஆதரவு குறைவாக உள்ளது. சுய வளர்ச்சி மற்றும் திறன் மேம்பாட்டில் கவனம் செலுத்துங்கள்.", en: "Neecha Bhanga is at low strength. Focus on skill-building and self-improvement." },
  },
  KALASARPA: {
    strong:  { ta: "கால சர்ப்ப அமைப்பு வலுவாக உள்ளது. வாழ்க்கையின் குறிப்பிட்ட தேவைகள் அதிகமாக உணரப்படலாம்; ஒழுக்கமான அணுகுமுறை மற்றும் ஆன்மீக அஸ்திவாரம் இந்த காலத்தில் மிகவும் உதவும்.", en: "Kala Sarpa pattern is strongly present. Life demands may feel concentrated; disciplined routine and spiritual grounding help most in this phase." },
    partial: { ta: "கால சர்ப்ப ஓரளவு செயல்பாட்டில் உள்ளது. சில காலங்கள் அழுத்தமாக உணரலாம்; நடைமுறை பராமரிப்பு உதவும்.", en: "Kala Sarpa is partially active. Some phases may feel intense; practical self-care helps." },
    weak:    { ta: "கால சர்ப்ப தாக்கம் குறைவாக உள்ளது.", en: "Kala Sarpa impact is currently mild." },
  },
};

const DOSHAM_POWER_CONTEXT: Record<string, {
  active: { ta: string; en: string };
  cancelled: { ta: string; en: string };
  candidate: { ta: string; en: string };
  absent: { ta: string; en: string };
}> = {
  SEVVAI_DOSHAM: {
    active:    { ta: "செவ்வாய் தோஷம் செயல்பாட்டில் உள்ளது. திருமண பொருத்தம் பார்க்கும்போது இரு ஜாதகங்களும் முழுமையாக ஒப்பிடப்பட வேண்டும். தசை காலத்தில் உறவு தொடர்பு மற்றும் ஒத்துழைப்பில் கூடுதல் கவனம் வேண்டும்.", en: "Sevvai Dosham is active. For marriage matching, both charts must be fully compared. During relevant Dasha periods, extra care in relationship communication and adjustment is needed." },
    cancelled: { ta: "செவ்வாய் தோஷம் நிவர்த்தி காரணங்களால் கணிசமாக குறைக்கப்பட்டுள்ளது. திருமண பொருத்தத்தில் இதை 'தோஷம் இல்லை' என்று சொல்ல முடியாது, ஆனால் நிவர்த்தி இருப்பதால் தாக்கம் மென்மையாக இருக்கும். மீதமுள்ள தரவு (சுக்கிரன், நவாம்சம்) கிடைத்தால் முழு முடிவு தரலாம்.", en: "Sevvai Dosham is significantly reduced by cancellation factors. For marriage matching, this should not be called 'dosham free', but the protective factors mean the practical impact is mild. A full verdict requires Venus position and Navamsa." },
    candidate: { ta: "செவ்வாய் தோஷ சாத்தியம் உள்ளது. முழு ஜாதக சூழல் மற்றும் பொருத்தப் பார்வை இல்லாமல் இறுதி முடிவு தர வேண்டாம்.", en: "Sevvai Dosham is a candidate signal. Do not finalize a verdict without full chart comparison and marriage matching context." },
    absent:    { ta: "செவ்வாய் தோஷம் இல்லை. லக்னம், சந்திரன், சுக்கிரன் ஆகிய மூன்றிலிருந்தும் செவ்வாய் தோஷ வீட்டில் இல்லை.", en: "Sevvai Dosham is absent. Mars is not in a dosha house from Lagna, Moon, or Venus in this chart." },
  },
  RAHU_KETU_DOSHAM: {
    active:    { ta: "ராகு/கேது திருமண சுட்டிகளை பாதிக்கும் வீடுகளில் உள்ளன. கூடுதல் சுட்டிகள் (7-ம் அதிபதி, சுக்கிரன் நிலை, நவாம்சம்) சரிபார்க்காமல் தீர்மானிக்க வேண்டாம். குரு ஆதரவு இருந்தால் தாக்கம் குறையும்.", en: "Rahu/Ketu is in positions that affect marriage significators. Do not finalize without checking 7th lord, Venus, and Navamsa. If Jupiter support is present, impact reduces considerably." },
    cancelled: { ta: "ராகு/கேது தோஷம் நிவர்த்தி காரணங்களால் குறைக்கப்பட்டுள்ளது. தற்போதைய கிரக நிலைகள் ஆதரிக்கின்றன; திருமண விஷயங்களில் நடைமுறை தொடர்பும் புரிதலும் முக்கியம்.", en: "Rahu-Ketu dosham is reduced by protective factors. Current planetary positions support; practical communication and understanding matter most in marriage decisions." },
    candidate: { ta: "ராகு/கேது சாத்திய சுட்டி மட்டும். நேரடி தோஷம் உறுதி செய்ய 7-ம் அதிபதி, சுக்கிரன், நவாம்சம் சரிபார்க்க வேண்டும்.", en: "Rahu-Ketu is a candidate signal only. Verify 7th lord, Venus, and Navamsa before confirming a direct dosham verdict." },
    absent:    { ta: "ராகு/கேது திருமண வீடுகளில் இல்லை. திருமண சுட்டிகளில் நேரடி தாக்கம் இல்லை.", en: "Rahu-Ketu is not in marriage houses. No direct impact on marriage significators in this chart." },
  },
  PITRU_DOSHAM: {
    active:    { ta: "பித்ரு தோஷம் செயல்பாட்டில் உள்ளது. குடும்ப பொறுப்புகள் அல்லது மூதாதையர் கடமைகள் அதிகமாக உணரப்படலாம். பெரியவர்களுக்கு மரியாதை மற்றும் குடும்ப ஒத்துழைப்பு முக்கியம்.", en: "Pitru Dosham is active. Family responsibilities or ancestral duties may feel heavier. Respect for elders and family cooperation are important." },
    cancelled: { ta: "பித்ரு தோஷம் நிவர்த்தி காரணங்களால் குறைக்கப்பட்டுள்ளது. குடும்ப உறவுகளில் கவனம் செலுத்துங்கள்.", en: "Pitru Dosham is reduced by protective factors. Maintain attention to family relationships." },
    candidate: { ta: "பித்ரு தோஷ சாத்தியம் மட்டும். முழு ஜாதகச் சூழலில் உறுதி செய்யவும்.", en: "Pitru Dosham is a candidate signal only. Confirm in full chart context." },
    absent:    { ta: "பித்ரு தோஷம் இல்லை.", en: "Pitru Dosham is not present." },
  },
  KALASARPA: {
    active:    { ta: "கால சர்ப்ப கட்டமைப்பு உங்கள் ஜாதகத்தில் உள்ளது. வாழ்க்கை சில காலங்களில் கடினமாக உணரலாம், ஆனால் ஒழுக்கம், தொழில்முறை ஸ்திரத்தன்மை, ஆன்மீக ஆர்வம் ஆகியவை நல்ல பலன் தரும்.", en: "Kala Sarpa pattern is present. Life may feel concentrated or intense in certain phases, but discipline, professional consistency, and spiritual interest yield strong results." },
    cancelled: { ta: "கால சர்ப்ப கட்டமைப்பு நிவர்த்தி காரணங்களுடன் உள்ளது.", en: "Kala Sarpa pattern is present with mitigating factors." },
    candidate: { ta: "கால சர்ப்ப சாத்தியம் மட்டும்; முழு ஜாதக உறுதிப்பாடு தேவை.", en: "Kala Sarpa is a candidate signal; full chart confirmation needed." },
    absent:    { ta: "கால சர்ப்ப கட்டமைப்பு இல்லை.", en: "Kala Sarpa pattern is not present." },
  },
};

function getYogaPowerContext(name: string, strength: string, dashaActivated: boolean, lang: Lang): string {
  const key = name.toUpperCase().replace("GAJA_KESARI", "GAJA_KESARI_YOGA");
  const entry = YOGA_POWER_CONTEXT[key];
  if (!entry) {
    return lang === "ta"
      ? "இந்த யோகத்தின் தாக்கம் உங்கள் தற்போதைய தசை மற்றும் கோசார நிலையை பொறுத்து மாறுபடும்."
      : "The impact of this yoga varies with your current Dasha and transit positions.";
  }
  const band = strength === "STRONG" ? "strong" : strength === "PARTIAL" ? "partial" : "weak";
  const base = lang === "ta" ? entry[band].ta : entry[band].en;
  if (!dashaActivated) {
    const suffix = lang === "ta"
      ? " தற்போதைய தசை இந்த யோகத்தை நேரடியாக செயல்படுத்தவில்லை — அடுத்த ஆதரவு தசையில் வலுவாக வெளிப்படலாம்."
      : " Your current Dasha does not directly activate this yoga — it may express more strongly in the next supporting Dasha.";
    return base + suffix;
  }
  return base;
}

function getDoshamPowerContext(dosham: ChartDoshamInsight, lang: Lang): string {
  const key = dosham.name.toUpperCase();
  const entry = DOSHAM_POWER_CONTEXT[key];
  const label = dosham.label.toUpperCase();

  let variant: "active" | "cancelled" | "candidate" | "absent" = "absent";
  if (!dosham.isPresent) variant = "absent";
  else if (dosham.isCancelled || label.includes("WITH_NIVARTHI")) variant = "cancelled";
  else if (label.includes("CANDIDATE") || label === "SARPA_NAGA_DOSHAM_CANDIDATE") variant = "candidate";
  else variant = "active";

  if (!entry) {
    return lang === "ta"
      ? "இந்த தோஷத்தின் தாக்கம் தற்போதைய தசை மற்றும் கோசார நிலையை பொறுத்து மாறுபடும்."
      : "The impact varies with your current Dasha and transit positions.";
  }

  const base = lang === "ta" ? entry[variant].ta : entry[variant].en;

  if (dosham.dashaActivated && variant === "active") {
    const suffix = lang === "ta"
      ? " தற்போதைய தசை இந்த கிரகத்தை நேரடியாக செயல்படுத்துகிறது — இப்போது இதன் உணர்வு அதிகமாக இருக்கலாம்."
      : " Your current Dasha directly activates this planet — the effect may feel stronger right now.";
    return base + suffix;
  }

  return base;
}

// ── Strength display ──────────────────────────────────────────────────────────

function strengthBand(strength: string, present: boolean, lang: Lang): string {
  if (!present) return lang === "ta" ? "செயல்பாட்டில் இல்லை" : "Not active";
  if (strength === "STRONG") return lang === "ta" ? "வலுவான" : "Strong";
  if (strength === "PARTIAL") return lang === "ta" ? "மிதமான" : "Moderate";
  return lang === "ta" ? "மென்மையான" : "Mild";
}

// ── Yoga Card ─────────────────────────────────────────────────────────────────

function YogaCard({ yoga, lang }: { yoga: ChartYogaInsight; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const color = yoga.isPresent
    ? yoga.strength === "STRONG" ? "#4ade80"
    : yoga.strength === "PARTIAL" ? "#fbbf24"
    : "rgba(255,255,255,0.4)"
    : "rgba(255,255,255,0.25)";

  const whyText = buildWhyText(
    yoga.conditionsMet,
    yoga.cancellationFactors,
    yoga.isPresent,
    false,
    yoga.dashaActivated,
    lang,
  );

  const powerText = yoga.isPresent
    ? getYogaPowerContext(yoga.name, yoga.strength, yoga.dashaActivated, lang)
    : null;

  return (
    <div style={{ borderRadius: "10px", border: `1px solid ${color}33`, background: yoga.isPresent ? `${color}09` : "rgba(255,255,255,0.02)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ fontSize: "0.75rem", color }}>{yoga.isPresent ? "★" : "○"}</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: yoga.isPresent ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
            {displayName(yoga.name, lang)}
          </span>
          {yoga.isPresent && yoga.dashaActivated && (
            <span style={{ fontSize: "0.56rem", fontWeight: 700, color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: "3px", padding: "1px 5px" }}>
              {t("yoga_dasha_activated", lang)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {yoga.isPresent && (
            <span style={{ fontSize: "0.6rem", fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: "3px", padding: "1px 5px" }}>
              {strengthBand(yoga.strength, yoga.isPresent, lang)}
            </span>
          )}
          {!yoga.isPresent && (
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)" }}>{t("yoga_absent", lang)}</span>
          )}
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "10px", paddingTop: "12px" }}>

          {/* Block 1 — What is this */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {lang === "ta" ? "இது என்ன" : "What This Is"}
            </p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
              {getWhat(yoga.name, true, lang)}
            </p>
          </div>

          {/* Block 2 — Why your chart has it */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {lang === "ta" ? "உங்கள் ஜாதகத்தில் ஏன்" : "Why Your Chart Has This"}
            </p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
              {whyText}
            </p>
            {/* Bullet list of planet positions — only if present */}
            {yoga.isPresent && yoga.conditionsMet.length > 0 && (
              <ul style={{ margin: "6px 0 0", padding: "0 0 0 16px" }}>
                {yoga.conditionsMet.map((c, i) => (
                  <li key={i} style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>
                    {markerLabel(c, lang)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Block 3 — How powerful & what it can do now */}
          {yoga.isPresent && powerText && (
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "0.6rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {lang === "ta" ? "இப்போது என்ன செய்யலாம்" : "What It Can Do Now"}
              </p>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
                {powerText}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── Dosham Card ───────────────────────────────────────────────────────────────

function DoshamCard({ dosham, lang }: { dosham: ChartDoshamInsight; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const isActiveAndPresent = dosham.isPresent && !dosham.isCancelled;
  const color = isActiveAndPresent ? "#f87171" : dosham.isCancelled ? "#4ade80" : "rgba(255,255,255,0.25)";

  const statusLabel =
    !dosham.isPresent
      ? (lang === "ta" ? "இல்லை" : "Absent")
      : dosham.isCancelled
      ? (lang === "ta" ? "நிவர்த்தி" : "Mitigated")
      : (lang === "ta" ? "கவனம்" : "Active");

  const whyText = buildWhyText(
    dosham.conditionsMet,
    dosham.cancellationFactors,
    dosham.isPresent,
    dosham.isCancelled,
    dosham.dashaActivated,
    lang,
  );

  const powerText = getDoshamPowerContext(dosham, lang);

  // Separate trigger and protective bullets cleanly
  const annotationMarkers = new Set(["female_high_attention_house", "male_high_attention_house", "rahu_ketu_upachaya"]);
  const triggerBullets = dosham.conditionsMet.filter((c) => !annotationMarkers.has(c));
  const attentionBullets = dosham.conditionsMet.filter((c) => annotationMarkers.has(c));

  return (
    <div style={{ borderRadius: "10px", border: `1px solid ${color}33`, background: isActiveAndPresent ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.02)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <span style={{ fontSize: "0.75rem", color }}>
            {isActiveAndPresent ? "!" : dosham.isCancelled ? "✓" : "○"}
          </span>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: dosham.isPresent ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.35)" }}>
            {displayName(dosham.name, lang)}
          </span>
          {dosham.isPresent && dosham.dashaActivated && (
            <span style={{ fontSize: "0.56rem", fontWeight: 700, color: "#fbbf24", border: "1px solid #fbbf24", borderRadius: "3px", padding: "1px 5px" }}>
              {t("yoga_dasha_activated", lang)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: "3px", padding: "1px 5px" }}>
            {statusLabel}
          </span>
          <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "10px", paddingTop: "12px" }}>

          {/* Block 1 — What is this dosham */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {lang === "ta" ? "இது என்ன" : "What This Is"}
            </p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
              {getWhat(dosham.name, false, lang)}
            </p>
          </div>

          {/* Block 2 — Why your chart has it + planet bullets */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {lang === "ta" ? "உங்கள் ஜாதகத்தில் ஏன்" : "Why Your Chart Has This"}
            </p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
              {whyText}
            </p>

            {/* Trigger planet positions */}
            {triggerBullets.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.58rem", fontWeight: 700, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {lang === "ta" ? "கிரக நிலைகள்" : "Planet Positions"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                  {triggerBullets.map((c, i) => (
                    <li key={i} style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
                      {markerLabel(c, lang)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Protective factors */}
            {dosham.cancellationFactors.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.58rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {lang === "ta" ? "பாதுகாப்பு காரணங்கள்" : "Protective Factors"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                  {dosham.cancellationFactors.map((c, i) => (
                    <li key={i} style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
                      {markerLabel(c, lang)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Attention notes */}
            {attentionBullets.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <p style={{ margin: "0 0 3px", fontSize: "0.58rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {lang === "ta" ? "கவன குறிப்பு" : "Attention Note"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                  {attentionBullets.map((c, i) => (
                    <li key={i} style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
                      {markerLabel(c, lang)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing data note */}
            {dosham.missingData && dosham.missingData.length > 0 && (
              <p style={{ margin: "8px 0 0", fontSize: "0.65rem", color: "rgba(255,200,100,0.7)", lineHeight: 1.4 }}>
                {lang === "ta"
                  ? `குறிப்பு: ${dosham.missingData.join(", ")} தரவு இல்லாததால் முழு முடிவு தரமுடியாது.`
                  : `Note: A complete verdict requires ${dosham.missingData.join(", ")} data which is not yet available.`}
              </p>
            )}
          </div>

          {/* Block 3 — How powerful & what it means for you now */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "0.6rem", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {lang === "ta" ? "இப்போது என்ன பொருள்" : "What This Means For You Now"}
            </p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>
              {powerText}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

type Props = {
  lang: Lang;
  yogas: ChartYogaInsight[];
  doshams: ChartDoshamInsight[];
};

export function YogaDoshamPanel({ lang, yogas, doshams }: Props) {
  if (yogas.length === 0 && doshams.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
        {t("yogas_empty", lang)}
      </p>
    );
  }

  const presentYogas = yogas.filter((y) => y.isPresent);
  const absentYogas  = yogas.filter((y) => !y.isPresent);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {yogas.length > 0 && (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {t("yogas_title", lang)}
            {presentYogas.length > 0 && (
              <span style={{ marginLeft: "8px", fontSize: "0.58rem", fontWeight: 700, color: "#4ade80", border: "1px solid #4ade80", borderRadius: "3px", padding: "1px 5px" }}>
                {presentYogas.length} {t("yoga_present", lang)}
              </span>
            )}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {presentYogas.map((y, i) => <YogaCard key={`present-${y.name}-${i}`} yoga={y} lang={lang} />)}
            {absentYogas.map((y, i)  => <YogaCard key={`absent-${y.name}-${i}`}  yoga={y} lang={lang} />)}
          </div>
        </div>
      )}

      {doshams.length > 0 && (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {t("doshams_title", lang)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {doshams.map((d) => <DoshamCard key={d.name} dosham={d} lang={lang} />)}
          </div>
        </div>
      )}
    </div>
  );
}
