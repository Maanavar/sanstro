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
  BUDHA_ADITYA_YOGA:   { ta: "Budha-Aditya Yoga",    en: "Budha-Aditya Yoga" },
  VIPAREETHA_RAJA_YOGA:{ ta: "Vipareetha Raja Yoga", en: "Vipareetha Raja Yoga" },
  PARIVARTANA_YOGA:    { ta: "Parivartana Yoga",     en: "Parivartana Yoga" },
  CHANDRA_MANGALA_YOGA:{ ta: "Chandra-Mangala Yoga", en: "Chandra-Mangala Yoga" },
  SAKATA_YOGA:         { ta: "Sakata Yoga",          en: "Sakata Yoga" },
  KEMADRUMA_YOGA:      { ta: "Kemadruma Yoga",       en: "Kemadruma Yoga" },
  CHANDALA_YOGA:       { ta: "Guru-Chandala Yoga",   en: "Guru-Chandala Yoga" },
  AMALA_YOGA:          { ta: "Amala Yoga",           en: "Amala Yoga" },
  ADHI_YOGA:           { ta: "Adhi Yoga",            en: "Adhi Yoga" },
  DARIDRA_YOGA:        { ta: "Daridra Yoga",         en: "Daridra Yoga" },
  LAKSHMI_YOGA:        { ta: "Lakshmi Yoga",         en: "Lakshmi Yoga" },
  VASUMATI_YOGA:       { ta: "Vasumati Yoga",        en: "Vasumati Yoga" },
  SEVVAI_DOSHAM:    { ta: "Sevvai Dosham",      en: "Sevvai Dosham" },
  RAHU_KETU_DOSHAM: { ta: "Rahu-Ketu Dosham",  en: "Rahu-Ketu Dosham" },
  PITRU_DOSHAM:     { ta: "Pitru Dosham",       en: "Pitru Dosham" },
  KALATHRA_DOSHAM:  { ta: "Kalathra Dosham",    en: "Kalathra Dosham" },
  PUTRA_SARPA_DOSHAM: { ta: "Putra Sarpa Dosham", en: "Putra Sarpa Dosham" },
  BADHAKA_DOSHAM:   { ta: "Badhaka Dosham",     en: "Badhaka Dosham" },
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
  // Badhaka
  badhaka_active:        { ta: "லக்னப்படி பாதக அதிபதி உங்கள் லக்னம்/சந்திரன்/லக்னாதிபதியை அல்லது தற்போதைய தசையை பாதிக்கிறது", en: "The badhaka lord (by your lagna) is touching your Lagna, Moon, lagna-lord, or current Dasha — the obstruction significator is active" },
  badhaka_lord_strong:   { ta: "பாதக அதிபதி வலுவாக உள்ளார் — தடைகள் வேகமாக கடக்கப்படும்", en: "The badhaka lord is strong — obstacles tend to clear faster" },
  // Kalathra (marriage / 7th house)
  seventh_afflicted:     { ta: "7-ம் அதிபதி அல்லது திருமண காரகன் பாதிக்கப்பட்டுள்ளார்", en: "The 7th lord or the marriage significator is afflicted" },
  seventh_lord_in_house_6:  { ta: "7-ம் அதிபதி 6-ம் வீட்டில் (சிக்கல்/சேவை இடம்) உள்ளார்", en: "The 7th lord is in the 6th house (conflict/service house)" },
  seventh_lord_in_house_8:  { ta: "7-ம் அதிபதி 8-ம் வீட்டில் (மாற்றம்/தடை இடம்) உள்ளார்", en: "The 7th lord is in the 8th house (disruption/transformation house)" },
  seventh_lord_in_house_12: { ta: "7-ம் அதிபதி 12-ம் வீட்டில் (இழப்பு/வெளியேற்ற இடம்) உள்ளார்", en: "The 7th lord is in the 12th house (loss/separation house)" },
  seventh_lord_own_sign:    { ta: "7-ம் அதிபதி சொந்த ராசியில் — தோஷம் கணிசமாக குறைகிறது", en: "The 7th lord is in its own sign — the dosham is significantly reduced" },
  seventh_lord_exalted:     { ta: "7-ம் அதிபதி உச்சத்தில் — தோஷம் மிகவும் மென்மையாகிறது", en: "The 7th lord is exalted — the dosham is greatly softened" },
  seventh_lord_strong_d9:   { ta: "7-ம் அதிபதி நவாம்சத்தில் வலுவாக உள்ளார் — பாதுகாப்பு", en: "The 7th lord is strong in the Navamsa (D9) — protective" },
  d9_seventh_lord_strong:   { ta: "நவாம்ச 7-ம் அதிபதி வலுவாக உள்ளார் — திருமண வலிமை", en: "The Navamsa 7th lord is strong — supports marriage stability" },
  // Putra Sarpa (5th house / progeny)
  fifth_afflicted:       { ta: "5-ம் வீடு/அதிபதி ராகு-கேது அல்லது பாதக கிரகங்களால் பாதிக்கப்பட்டுள்ளது", en: "The 5th house or its lord is afflicted by the nodes or malefics (progeny/creativity house)" },
  strong_fifth_lord:     { ta: "5-ம் அதிபதி வலுவாக உள்ளார் — தாக்கம் குறைகிறது", en: "The 5th lord is strong — impact is reduced" },
  jupiter_kendra:        { ta: "குரு கேந்திரத்தில் — சந்தான காரகன் பாதுகாக்கிறார்", en: "Jupiter is in a kendra — the progeny significator protects" },
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
  BADHAKA_DOSHAM: {
    ta: "ஒவ்வொரு லக்னத்திற்கும் ஒரு குறிப்பிட்ட 'பாதக ஸ்தானம்' உண்டு — சர (சங்கடம) லக்னங்களுக்கு 11-ம் வீடு, ஸ்திர லக்னங்களுக்கு 9-ம் வீடு, த்விசுபாவ லக்னங்களுக்கு 7-ம் வீடு. அந்த வீட்டின் அதிபதியே 'பாதக அதிபதி'. இந்த அதிபதி உங்கள் லக்னம்/சந்திரன்/லக்னாதிபதியை அல்லது தற்போதைய தசையை பாதிக்கும்போது, காரியங்கள் முடியும் தருணத்தில் தடைகள், தாமதங்கள், கடைசி-நிமிட இடையூறுகள் வரலாம். இது 'விதி' அல்ல — ஒரு தடை-வடிவம் மட்டுமே; பாதக அதிபதி வலுவாக இருந்தால் தடைகள் விரைவில் கடக்கப்படும்.",
    en: "Every lagna has one specific 'obstruction house' — the 11th for movable signs, the 9th for fixed signs, the 7th for dual signs. The lord of that house is the 'badhaka lord'. When this lord touches your Lagna, Moon, lagna-lord, or runs as your current Dasha, projects can meet blocks, delays, or last-minute hurdles right at the finish line. It is not a fixed fate — only an obstruction pattern; when the badhaka lord is strong, the blocks tend to clear quickly.",
  },
  KALATHRA_DOSHAM: {
    ta: "திருமண வாழ்க்கையை குறிக்கும் 7-ம் வீடு அல்லது அதன் அதிபதி பாதிக்கப்படும்போது (7-ம் அதிபதி 6/8/12-ல் இருப்பது, பாதக கிரக சேர்க்கை/பார்வை) உருவாகும் துணை-சார்ந்த உணர்திறன் சுட்டி. திருமணத்தில் தாமதம், சரிசெய்தல் சவால்கள், அல்லது துணையின் உடல்நலம்/மனநிலை குறித்த கவனம் தேவைப்படலாம் என்று மரபு சொல்கிறது. நிவர்த்தி காரணங்கள் இருந்தால் தாக்கம் பெரிதும் குறையும்.",
    en: "A partnership-sensitivity indicator formed when the 7th house (marriage) or its lord is afflicted — e.g. the 7th lord placed in the 6th, 8th, or 12th, or under malefic aspect/conjunction. Tradition reads it as a need for extra care around marriage timing, adjustment, or a partner's wellbeing. Cancellation factors (a strong, own-sign, or exalted 7th lord) substantially reduce the impact.",
  },
  PUTRA_SARPA_DOSHAM: {
    ta: "சந்தானம் மற்றும் படைப்பாற்றலை குறிக்கும் 5-ம் வீடு அல்லது அதன் அதிபதி ராகு/கேது அல்லது பாதக கிரகங்களால் பாதிக்கப்படும்போது உருவாகும் சுட்டி. குழந்தைப்பேறில் தாமதம் அல்லது கூடுதல் கவனம், அல்லது படைப்புத் திட்டங்களில் தடைகள் வரலாம் என்று மரபு கூறுகிறது. வலுவான 5-ம் அதிபதி அல்லது கேந்திரத்தில் குரு இருந்தால் இது பெரிதும் தணியும்.",
    en: "An indicator formed when the 5th house (children, creativity) or its lord is afflicted by Rahu/Ketu or malefics. Tradition reads it as possible delay or extra attention around progeny, or blocks in creative ventures. A strong 5th lord, or Jupiter in a kendra, greatly softens it.",
  },
};

// Yogas that need only a short "what is this" line (the cards still show the
// chart-specific "why", strength and live "what it can do now" sections).
const YOGA_WHAT_EXTRA: Record<string, { ta: string; en: string }> = {
  BUDHA_ADITYA_YOGA: {
    ta: "சூரியனும் புதனும் ஒரே வீட்டில் சேரும்போது உருவாகும் யோகம். கூர்மையான அறிவு, தொடர்பு திறன், எழுத்து/பேச்சு/கணக்கு ஆகியவற்றில் சிறப்பு என்பவற்றுடன் தொடர்புடையது.",
    en: "Formed when the Sun and Mercury are together in one house. Linked to sharp intelligence, communication skill, and aptitude for writing, speaking, and analysis.",
  },
  VIPAREETHA_RAJA_YOGA: {
    ta: "துஸ்தான (6/8/12) அதிபதிகள் தங்களுக்குள் தொடர்பு கொள்ளும்போது உருவாகும் யோகம். கடினமான சூழல்களிலிருந்து எதிர்பாராத வெற்றி கிடைக்கலாம் — 'நெருக்கடி வழியாக வளர்ச்சி'.",
    en: "Formed when the lords of the dusthanas (6/8/12) connect with each other. Can bring unexpected rise out of difficult circumstances — 'growth through adversity'.",
  },
  PARIVARTANA_YOGA: {
    ta: "இரு கிரகங்கள் ஒன்றின் ராசியில் மற்றொன்று இருக்கும் பரிவர்த்தனை (இடமாற்றம்) கொள்ளும்போது உருவாகும் யோகம். அந்த இரு வீடுகளின் காரியங்கள் ஒன்றையொன்று வலுப்படுத்தும்.",
    en: "Formed when two planets sit in each other's signs (mutual exchange). The matters of those two houses reinforce each other.",
  },
  CHANDRA_MANGALA_YOGA: {
    ta: "சந்திரனும் செவ்வாயும் இணையும்போது உருவாகும் யோகம். முயற்சி, வருமான ஆற்றல், தொழில் முனைவு ஆகியவற்றுடன் தொடர்புடையது; உணர்ச்சியை செயலாக மாற்றும் திறன்.",
    en: "Formed when the Moon and Mars combine. Linked to drive, earning energy, and entrepreneurial push — the ability to turn emotion into action.",
  },
  SAKATA_YOGA: {
    ta: "சந்திரன் குருவிலிருந்து 6/8-ம் வீட்டில் இருக்கும்போது உருவாகும் அமைப்பு. வாழ்க்கையில் ஏற்ற-இறக்கங்கள் சக்கரம் போல் வரலாம்; நிலையான ஒழுக்கம் உதவும்.",
    en: "Formed when the Moon is in the 6th or 8th from Jupiter. Fortunes can rise and fall in cycles, like a wheel; steady discipline helps most.",
  },
  KEMADRUMA_YOGA: {
    ta: "சந்திரனுக்கு இரு பக்கங்களிலும் (2/12) கிரகங்கள் இல்லாதபோது உருவாகும் அமைப்பு. சில காலங்களில் தனிமை அல்லது ஆதரவின்மை உணரலாம்; உறவுகளையும் வழக்கங்களையும் கட்டியெழுப்புவது நல்லது.",
    en: "Formed when the Moon has no planets on either side (2nd/12th from it). Some phases may feel unsupported or solitary; building relationships and routines helps.",
  },
  CHANDALA_YOGA: {
    ta: "குருவும் ராகுவும் இணையும்போது உருவாகும் அமைப்பு (குரு-சண்டாள). நம்பிக்கை, வழிகாட்டுதல், கல்வி ஆகியவற்றில் குழப்பம் வரலாம்; சரியான குருவை தேர்வது முக்கியம்.",
    en: "Formed when Jupiter and Rahu conjoin (Guru-Chandala). Can bring confusion around belief, guidance, or learning; choosing the right mentor matters.",
  },
  AMALA_YOGA: {
    ta: "லக்னம்/சந்திரனிலிருந்து 10-ம் வீட்டில் சுபக்கிரகம் இருக்கும்போது உருவாகும் யோகம். தூய புகழ், நல்ல பெயர், மரியாதைக்குரிய தொழில் என்பவற்றுடன் தொடர்புடையது.",
    en: "Formed when a benefic occupies the 10th from the Lagna or Moon. Linked to a clean reputation, good name, and respected work.",
  },
  ADHI_YOGA: {
    ta: "சந்திரனிலிருந்து 6, 7, 8-ம் வீடுகளில் சுபக்கிரகங்கள் இருக்கும்போது உருவாகும் யோகம். தலைமை, செல்வாக்கு, நிலையான முன்னேற்றம் ஆகியவற்றுடன் தொடர்புடையது.",
    en: "Formed when benefics occupy the 6th, 7th, and 8th from the Moon. Linked to leadership, influence, and steady advancement.",
  },
  DARIDRA_YOGA: {
    ta: "11-ம் அதிபதி (வருமான வீடு) துஸ்தானத்தில் அல்லது பாதக சேர்க்கையில் பலவீனமாக இருக்கும்போது உருவாகும் அமைப்பு. வருமான-செலவு சமநிலையில் கூடுதல் கவனம் தேவைப்படலாம்.",
    en: "Formed when the 11th lord (income house) is weak — in a dusthana or with malefics. Extra care with the income-versus-expense balance may be needed.",
  },
  LAKSHMI_YOGA: {
    ta: "9-ம் அதிபதியும் லக்னாதிபதியும் வலுவாக இருக்கும்போது உருவாகும் சுப யோகம். அதிர்ஷ்டம், செழிப்பு, நன்மதிப்பு ஆகியவற்றுடன் தொடர்புடையது.",
    en: "An auspicious yoga formed when the 9th lord and the lagna lord are both strong. Linked to fortune, prosperity, and goodwill.",
  },
  VASUMATI_YOGA: {
    ta: "சந்திரனிலிருந்து உபசய வீடுகளில் (3/6/10/11) சுபக்கிரகங்கள் இருக்கும்போது உருவாகும் யோகம். சுயமாக சம்பாதித்து செல்வம் சேர்க்கும் திறனுடன் தொடர்புடையது.",
    en: "Formed when benefics occupy the upachaya houses (3/6/10/11) from the Moon. Linked to the capacity to build self-earned wealth.",
  },
};

function getWhat(name: string, isYoga: boolean, lang: Lang, fallback?: { ta?: string; en?: string }): string {
  const key = name.toUpperCase();
  const entry = isYoga
    ? (YOGA_WHAT[key] ?? YOGA_WHAT[key.replace("GAJA_KESARI", "GAJA_KESARI_YOGA")] ?? YOGA_WHAT_EXTRA[key])
    : DOSHAM_WHAT[key];
  if (entry) return lang === "ta" ? entry.ta : entry.en;
  // Fall back to the engine-authored description so nothing renders generic filler.
  const fb = lang === "ta" ? fallback?.ta : fallback?.en;
  if (fb && fb.trim()) return fb;
  return lang === "ta" ? "பாரம்பரிய ஜோதிட சுட்டி." : "A traditional astrology indicator.";
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

// ── Outcomes, Remedies, and Enhancement advice ──────────────────────────────

const YOGA_OUTCOMES: Record<string, { ta: string; en: string }> = {
  GAJA_KESARI_YOGA: {
    ta: "இந்த யோகம் உள்ளவர்களுக்கு தொழில்முறை மரியாதை, நல்ல நினைவாற்றல், மக்கள் தொடர்பு திறன், சமூக அங்கீகாரம் ஆகியவை சாத்தியம். கல்வி, ஆலோசனை, பொது சேவை, கற்பித்தல் துறைகளில் சிறப்பாக செயல்படலாம்.",
    en: "People with this yoga may experience professional respect, strong memory, good public relations skills, and social recognition. They can excel in education, counseling, public service, and teaching roles.",
  },
  RAJA_YOGA: {
    ta: "தொழில்முறை வளர்ச்சி, பொறுப்புகள் அதிகரிப்பு, சமூக அங்கீகாரம் ஆகியவை சாத்தியம். பெரிய நிறுவனங்களில் உயர் பதவிகள், தலைமைத்துவ வாய்ப்புகள், அரசு/அரசியல் துறைகளில் செல்வாக்கு இருக்கலாம்.",
    en: "Career advancement, increased responsibilities, and social recognition are possible. Senior positions in large organizations, leadership opportunities, and influence in government or public sectors are indicated.",
  },
  DHANA_YOGA: {
    ta: "திட்டமிட்ட முயற்சியால் வருமான வளர்ச்சி சாத்தியம். சேமிப்பு வழக்கங்கள் படிப்படியாக பலன் தரும். தொழில் முனைவோர் வாய்ப்புகள் சாதகமாக இருக்கலாம். உழைப்பால் செல்வம் கட்டுவது சாத்தியம் — திடீர் பணம் வராது.",
    en: "Income growth through planned effort is possible. Consistent saving habits will yield results over time. Entrepreneurial opportunities may be favorable. Building wealth through sustained effort is indicated — not sudden windfalls.",
  },
  NEECHA_BHANGA_RAJA_YOGA: {
    ta: "ஆரம்பத்தில் கடினங்களை சந்தித்த பகுதிகளில் பின்னர் வலிமை தெரியும். பிரச்சினைகளை திறமையாக கையாண்டு அவற்றை வலிமையாக மாற்றுவதில் இவர்களுக்கு இயல்பான திறன் இருக்கலாம். அனுபவங்களிலிருந்து கற்று முன்னேறுவார்கள்.",
    en: "Areas where early difficulties were faced can later become strengths. There may be a natural ability to handle challenges and convert them into advantages. These individuals often learn powerfully from experience.",
  },
  KALASARPA: {
    ta: "வாழ்க்கையின் குறிப்பிட்ட திசைகளில் தீவிர கவனம் மற்றும் சாதனை சாத்தியம். ஒரு இலக்கில் கவனம் செலுத்தும் குணம் இவர்களுக்கு உண்டு. ஆன்மீக வளர்ச்சி, கலைத்துறை, ஆராய்ச்சி போன்றவற்றில் அசாதாரண செயல்திறன் இருக்கலாம்.",
    en: "Intense focus and achievement in specific life directions is possible. These individuals often have the ability to concentrate deeply on one goal. Exceptional performance in spiritual development, arts, or research may emerge.",
  },
};

const YOGA_REMEDIES: Record<string, { ta: string; en: string }> = {
  GAJA_KESARI_YOGA: {
    ta: "வியாழக்கிழமை குரு வழிபாடு, மஞ்சள் வஸ்திரம் அணிவது, குரு மந்திரம் ஜபிப்பது (ஓம் குரவே நமஹ), தட்சிணாமூர்த்தி வழிபாடு, கல்வி நிறுவனங்களில் தானம் செய்வது.",
    en: "Jupiter worship on Thursdays, wearing yellow cloth, chanting Jupiter mantra (Om Gurave Namah), Dakshinamurti worship, donating to educational institutions.",
  },
  RAJA_YOGA: {
    ta: "ஏகாதசி விரதம், குரு-சூரிய வழிபாடு, சித்திரை மாதம் திருவண்ணாமலை அல்லது திருவிடைமருதூர் வழிபாடு, மக்களுக்கு உதவுவது, நேர்மையான நடத்தை.",
    en: "Ekadasi fasting, Sun and Jupiter worship, visiting Tiruvannamalai or Tiruvidaraimarudur in Chithirai month, service to the community, maintaining integrity in all dealings.",
  },
  DHANA_YOGA: {
    ta: "வெள்ளிக்கிழமை லட்சுமி வழிபாடு, சுக்கிர மந்திரம் (ஓம் சுக்ராய நமஹ), திருப்பதி அல்லது திருவரங்கம் வழிபாடு, உணவு தானம், நிதி ஒழுக்கம் கடைப்பிடிப்பது.",
    en: "Lakshmi worship on Fridays, Venus mantra (Om Shukraya Namah), visits to Tirupati or Srirangam, food donations, maintaining financial discipline.",
  },
  NEECHA_BHANGA_RAJA_YOGA: {
    ta: "நீச கிரகத்திற்கான குறிப்பிட்ட பரிகாரம் செய்வது (எ.கா. சூரியன் நீசம் = ஆதித்யஹ்ருதயம் பாராயணம்), அந்த கிரகம் ஆட்சி செலுத்தும் திரு ஸ்தலத்தை தரிசித்தல், கிரகத்தின் நிறத்தில் வஸ்திரம் அணிவது.",
    en: "Perform the specific remedy for the debilitated planet (e.g., if Sun is debilitated — recite Aditya Hridayam), visit the temple associated with that planet, wear the planet's associated color.",
  },
  KALASARPA: {
    ta: "திருநாகேஸ்வரம் அல்லது காளஹஸ்தியில் கால சர்ப்ப தோஷ பரிகாரம், நாக வழிபாடு, ஆடி மற்றும் கார்த்திகை மாதங்களில் சர்ப்ப சாந்தி, ஆண்டு தோறும் ஒரு முறை ஆன்மீக பூஜை.",
    en: "Kala Sarpa Dosha parihara at Thirunageswaram or Kalahasti, Naga worship, Sarpa Shanti in Aadi and Karthigai months, annual spiritual puja.",
  },
};

const YOGA_HOW_TO: Record<string, { ta: string; en: string }> = {
  GAJA_KESARI_YOGA: {
    ta: "யோகத்தை பலப்படுத்த: குரு தசை காலத்தில் முக்கிய முடிவுகள் எடுங்கள், வியாழக்கிழமை விரதம், ஆசிரியர்கள்/வழிகாட்டிகளை மரியாதையுடன் நடத்துங்கள், நிலையான கல்வி தொடருங்கள். ஒரு தகுதியான மாணவரின் கல்வி அல்லது ஆசிரியர் மேம்பாட்டிற்கு நன்கொடை செய்வது இந்த யோகத்தின் அருளை மேலும் செயல்படுத்தும்.",
    en: "To strengthen this yoga: make major decisions during Jupiter Dasha, observe Thursday fasts, treat teachers and mentors with respect, continue lifelong learning. Sponsoring a deserving student's education or donating to a teacher welfare fund brings this yoga's blessings into action.",
  },
  RAJA_YOGA: {
    ta: "யோகத்தை பலப்படுத்த: நேர்மையான செயல்கள், ஆட்சி கிரகங்களின் தசை காலத்தில் பெரிய நடவடிக்கை எடுங்கள், பொறுப்பான பாத்திரங்களை ஏற்றுக்கொள்ளுங்கள். சமுதாய சேவை: பசிப்பவருக்கு உணவளியுங்கள், இளைஞர்களுக்கு வழிகாட்டுங்கள், அல்லது சமூக நல அமைப்பில் தொண்டு செய்யுங்கள்.",
    en: "To strengthen: act with integrity, take major steps during the ruling planets' Dasha, accept leadership responsibilities. For seva: feed the hungry, mentor youth, or volunteer at a community shelter — leadership yoga grows through acts of service.",
  },
  DHANA_YOGA: {
    ta: "யோகத்தை பலப்படுத்த: சேமிப்பு ஒழுக்கம், நிதி திட்டமிடல் பழக்கங்கள் வளர்த்துக்கொள்ளுங்கள், 2-ம் மற்றும் 11-ம் அதிபதிகளின் தசையில் கவனம் செலுத்துங்கள், அன்னதானம் செய்யுங்கள்.",
    en: "To strengthen: maintain savings discipline, review financial habits regularly, pay attention during the 2nd and 11th lord's Dasha periods, donate food regularly. Consult a financial professional for investment decisions.",
  },
  NEECHA_BHANGA_RAJA_YOGA: {
    ta: "யோகத்தை பலப்படுத்த: பலவீனமான கிரகம் ஆட்சி செலுத்தும் விஷயங்களில் கவனமாக உழையுங்கள், தோல்விகளை பாடங்களாக எடுங்கள், நீச கிரகம் சம்பந்தப்பட்ட ஜீவிதத்துறைகளில் தொடர்ந்து முயற்சி செய்யுங்கள். நீச கிரகம் அந்த கிரக சேவையில் — செவ்வாயெனில் இரத்த தானம், புதனெனில் மாணவர் கல்வி உதவி — இந்த யோகம் விழிப்போடு அனுஷ்டித்த போது மிகவும் வலுப்படும்.",
    en: "To strengthen: work carefully in areas governed by the debilitated planet, treat failures as lessons, keep trying in life domains connected to that planet. Serve in the domain of the debilitated planet — if Mars, donate blood or help accident victims; if Mercury, sponsor a student's education. This yoga strengthens most when practiced with conscious effort.",
  },
  KALASARPA: {
    ta: "யோகத்தை பயனுள்ளதாக்க: ஒரு குறிப்பிட்ட இலக்கில் ஆழமாக கவனம் செலுத்துங்கள், நிலையான ஒழுக்கம் வளருங்கள், ஆன்மீக பயிற்சி (தியானம், யோகம்) மிகவும் உதவும். சமூக ஒப்பீட்டை தவிர்த்து, சொந்த பாதையில் கவனம் செலுத்துங்கள்.",
    en: "To make this work for you: focus deeply on one specific goal, build consistent discipline, spiritual practice (meditation, yoga) helps greatly. Avoid comparing yourself to others — focus on your own path.",
  },
};

const DOSHAM_OUTCOMES: Record<string, { ta: string; en: string }> = {
  SEVVAI_DOSHAM: {
    ta: "திருமண வாழ்க்கையில் உணர்வு ரீதியான கடுமை, சுதந்திரத்திற்கான ஆசை, சில நேரங்களில் சண்டை-சச்சரவு, துணையுடன் ஒத்துழைக்கும் சவால் ஆகியவை சாத்தியம். செவ்வாய் பலமாக இருந்தால் இவை ஆற்றலாக மாறும்.",
    en: "Emotional intensity in married life, desire for independence, occasional conflicts, and challenges in adjustment with partner are possible. When Mars is strong, these become energetic drive and assertiveness.",
  },
  RAHU_KETU_DOSHAM: {
    ta: "திருமண விஷயங்களில் காலதாமதம், அசாதாரண உறவுகள், கர்ம-சார்ந்த பந்தங்கள் சாத்தியம். உணர்வு ரீதியான நிலையின்மை சில காலங்களில் வரலாம். ஆன்மீக கற்றலும் இந்த அமைப்பின் ஒரு பக்கமாக இருக்கலாம்.",
    en: "Delays in marriage matters, unconventional relationships, karma-driven bonds are possible. Emotional instability may arise in certain periods. Spiritual learning is often an aspect of this configuration.",
  },
  PITRU_DOSHAM: {
    ta: "குடும்ப பொறுப்புகள் அதிகமாக உணரப்படலாம், மூதாதையர் வழிபாட்டில் கவனம் தேவைப்படலாம், குடும்ப ஒற்றுமையில் சில சவால்கள் வரலாம். பெரியவர்களுக்கு உதவுவது தேவையாக உணரப்படலாம்.",
    en: "Family responsibilities may feel heavier, attention to ancestral worship may be needed, some challenges in family harmony may arise. The need to support elders may be strongly felt.",
  },
  KALASARPA: {
    ta: "வாழ்க்கையின் சில துறைகளில் தீவிரமான அனுபவங்கள் வரலாம். ஒருமுகப்படுத்திய கவனம் மற்றும் உழைப்பு சாதனைகளை தரலாம். ஆனால் சில காலங்களில் தனிமை அல்லது வட்டமிட்டு திரும்பும் சவால்கள் உணரப்படலாம்.",
    en: "Intense experiences in certain life domains may arise. Focused attention and effort can yield achievements. However, some phases may feel isolating or marked by recurring challenges.",
  },
  BADHAKA_DOSHAM: {
    ta: "முக்கியமான காரியங்கள் முடியும் தருணத்தில் எதிர்பாராத தடைகள், தாமதங்கள், அனுமதி/ஒப்புதல் சிக்கல்கள் வரலாம். ஒரு பணி தொடர்ந்து பின்தள்ளப்படுவது போல் உணரலாம். ஆனால் பாதக அதிபதியின் தசை/அந்தர் முடிந்ததும் தடைகள் விலகும்; இதை திட்டமிடல் மற்றும் பொறுமையால் கையாளலாம்.",
    en: "Right as important matters are about to close, unexpected blocks, delays, or approval/paperwork hurdles can appear — a task may feel repeatedly pushed back. The blocks tend to lift once the badhaka lord's dasha/bhukti passes; careful planning and patience handle it well.",
  },
  KALATHRA_DOSHAM: {
    ta: "திருமணத்தில் தாமதம், துணையை தேர்வதில் கூடுதல் கவனம், அல்லது திருமணத்திற்குப் பிறகு சரிசெய்தல்/தொடர்பு சவால்கள் சாத்தியம். துணையின் உடல்நலம் குறித்த கவனமும் மரபில் குறிப்பிடப்படுகிறது. முழு பொருத்தம் பார்த்து, நிவர்த்தி இருந்தால் இவை பெரிதும் குறையும்.",
    en: "Possible delay in marriage, a need for extra care in choosing a partner, or adjustment/communication challenges after marriage. Tradition also notes attention to a partner's health. With full compatibility matching and cancellation factors present, these reduce considerably.",
  },
  PUTRA_SARPA_DOSHAM: {
    ta: "குழந்தைப்பேறில் தாமதம் அல்லது மருத்துவ கவனம் தேவைப்படலாம்; படைப்புத் திறன், கல்வி, முதலீடு சம்பந்தப்பட்ட திட்டங்களில் தடைகள் வரலாம். வலுவான 5-ம் அதிபதி அல்லது குரு ஆதரவு இருந்தால் இவை மென்மையாகும்.",
    en: "Possible delay or medical attention around having children; creative, educational, or speculative ventures may meet blocks. A strong 5th lord or Jupiter's support softens these.",
  },
};

const DOSHAM_REMEDIES: Record<string, { ta: string; en: string }> = {
  SEVVAI_DOSHAM: {
    ta: "செவ்வாய்க்கிழமை திருவிடைமருதூர் அல்லது வைத்தீஸ்வரன் கோயில் வழிபாடு, முருகன் வழிபாடு, கரும்மாரியம்மன் வேண்டல், திருவெள்ளிக்கேணி வழிபாடு. ஒரே போன்ற செவ்வாய் நிலை உள்ள துணையை தேர்ந்தெடுப்பது பொருத்தத்தை சீர்படுத்தும்.",
    en: "Tuesday worship at Vaitheeswaran Koil or Thiruvidaimarudur, Murugan worship, Karumariamman vow, Thiruvellikeni visit. Choosing a partner with a similar Sevvai position can balance the compatibility.",
  },
  RAHU_KETU_DOSHAM: {
    ta: "திருநாகேஸ்வரம் ராகு பரிகாரம், கல்மண்டபம் (Kala Bhairava) வழிபாடு, ஆடி மாதம் நாக பஞ்சமி விரதம், திருவண்ணாமலை அல்லது திருக்கோவிலூர் வழிபாடு. குரு ஆதரவு வலுப்படுத்த வியாழக்கிழமை வழிபாடு.",
    en: "Rahu parihara at Thirunageswaram, Kala Bhairava worship, Naga Panchami fasting in Aadi month, visits to Tiruvannamalai or Tirukovilur. Thursday Jupiter worship to strengthen Jupiter's protective counter-influence.",
  },
  PITRU_DOSHAM: {
    ta: "அமாவாசை நாளில் பித்ரு தர்ப்பணம், காகங்களுக்கு உணவிடுவது, திரு காட்டுப்பள்ளி அல்லது காசியில் பித்ரு ஸ்ராத்தம், பெரியவர்களை மரியாதையுடன் நடத்துவது, குடும்ப கோவில் வழிபாடு தொடர்வது.",
    en: "Pitru tarpan on Amavasya, feeding crows, Pitru Sradham at Tirukattupalli or Kashi, treating elders with respect, continuing family temple worship.",
  },
  KALASARPA: {
    ta: "காளஹஸ்தி அல்லது திருநாகேஸ்வரத்தில் ஆண்டு கால சர்ப்ப பூஜை, நாக பஞ்சமி விரதம், ஆடி மாதம் திருமஞ்சனம், ஆன்மீக பயிற்சி (தியானம், யோகா), அமைதியான சூழலில் தொடர்ந்த சாதனை.",
    en: "Annual Kala Sarpa puja at Kalahasti or Thirunageswaram, Naga Panchami fasting, Aadi month Thirumanjanam, spiritual practice (meditation, yoga), sustained achievement in a calm environment.",
  },
  BADHAKA_DOSHAM: {
    ta: "பாதக அதிபதி கிரகத்திற்குரிய வழிபாடு (உங்கள் லக்னப்படி மாறுபடும்), விநாயகர் வழிபாடு தடை நீக்கத்திற்கு, செவ்வாய்/சனி பாதக அதிபதியெனில் அந்த கிரக பரிகாரம், முக்கிய காரியங்களுக்கு முன் கணபதி ஹோமம்.",
    en: "Worship of the planet that is your badhaka lord (varies by your lagna), Ganesha worship for clearing obstacles, the specific planetary remedy if Mars/Saturn is the badhaka lord, and a Ganapati homam before major undertakings.",
  },
  KALATHRA_DOSHAM: {
    ta: "வியாழக்கிழமை குரு வழிபாடு (7-ம் வீட்டை வலுப்படுத்த), சுக்கிர வழிபாடு, திருமணத்திற்கு முன் முழு பத்து பொருத்தம் + நவாம்சம் பார்த்தல், துணையின் உடல்நலம் குறித்து கவனம், ஸ்வயம்வர பார்வதி மந்திரம்.",
    en: "Thursday Jupiter worship (to strengthen the 7th house), Venus worship, a full ten-porutham + Navamsa check before marriage, attention to the partner's health, and the Swayamvara Parvati mantra.",
  },
  PUTRA_SARPA_DOSHAM: {
    ta: "சந்தான கோபால மந்திரம், திருநாகேஸ்வரம்/மன்னார்குடி வழிபாடு, நாக பிரதிஷ்டை பரிகாரம், வியாழக்கிழமை குரு வழிபாடு, மருத்துவ ஆலோசனையுடன் ஆன்மீக பரிகாரத்தையும் சேர்த்து செய்தல்.",
    en: "Santana Gopala mantra, worship at Thirunageswaram/Mannargudi, Naga pratishtha parihara, Thursday Jupiter worship, and combining medical guidance with the spiritual remedy.",
  },
};

const DOSHAM_HOW_TO: Record<string, { ta: string; en: string }> = {
  SEVVAI_DOSHAM: {
    ta: "தீவிரத்தை குறைக்க: திருமண பொருத்தம் முழுமையாக பார்க்கவும், நிவர்த்தி காரணங்கள் இருக்கின்றனவா சரிபார்க்கவும், வாழ்க்கையில் செவ்வாயின் ஆற்றலை விளையாட்டு/உடற்பயிற்சி/சாதனை வழியாக வெளிப்படுத்தவும்.",
    en: "To reduce impact: do thorough marriage compatibility matching, check for cancellation factors, channel Mars energy through sports/exercise/achievement in life rather than conflict.",
  },
  RAHU_KETU_DOSHAM: {
    ta: "தீவிரத்தை குறைக்க: குரு, 7-ம் அதிபதி, சுக்கிரன் நிலைகளை பரிசோதியுங்கள் (இவை வலுவாக இருந்தால் தாக்கம் குறையும்). துணையுடன் திறந்த மனதில் பேசுங்கள், ஆன்மீக பயிற்சி தொடருங்கள்.",
    en: "To reduce impact: examine Jupiter, 7th lord, and Venus positions (if strong, impact reduces). Communicate openly with your partner, continue spiritual practice.",
  },
  PITRU_DOSHAM: {
    ta: "தீவிரத்தை குறைக்க: குடும்ப பெரியவர்களை மரியாதையுடன் நடத்துங்கள், தவறான குடும்ப விஷயங்களை சரிசெய்யுங்கள், கோவில் வழிபாட்டை தொடருங்கள், கோபம்/வாத்தோட்டம் தவிர்த்து ஒற்றுமையை வளருங்கள்.",
    en: "To reduce impact: treat family elders respectfully, resolve unresolved family matters, continue temple worship, avoid arguments and build family harmony.",
  },
  KALASARPA: {
    ta: "தீவிரத்தை குறைக்க: ஒரு குறிப்பிட்ட இலக்கில் கவனம் செலுத்துங்கள், ஆன்மீக அஸ்திவாரம் வலுப்படுத்துங்கள், சுய அறிவு வளருங்கள், இந்த அமைப்பை ஒரு சக்திமிக்க கருவியாக கையாளுங்கள்.",
    en: "To reduce impact: focus on one specific life goal, strengthen spiritual grounding, develop self-knowledge, treat this configuration as a powerful tool rather than a burden.",
  },
  BADHAKA_DOSHAM: {
    ta: "தாக்கத்தை குறைக்க: முக்கிய காரியங்களுக்கு கூடுதல் நேரம்/மாற்றுத் திட்டம் வைத்துக்கொள்ளுங்கள், கடைசி நிமிட அவசரத்தை தவிர்த்து முன்கூட்டியே முடியுங்கள், பாதக அதிபதியின் தசை/அந்தர் காலத்தில் புதிய பெரிய துவக்கங்களை தவிர்த்து தொடர்ந்துவரும் வேலைகளில் கவனம் செலுத்துங்கள்.",
    en: "To reduce impact: build buffer time and a plan-B into important matters, finish early instead of relying on last-minute pushes, and during the badhaka lord's dasha/bhukti favour continuing work over launching big new ventures.",
  },
  KALATHRA_DOSHAM: {
    ta: "தாக்கத்தை குறைக்க: திருமணத்திற்கு முன் முழு பொருத்தம் + நவாம்சம் பார்க்கவும், நிவர்த்தி காரணங்களை சரிபார்க்கவும், துணையுடன் திறந்த தொடர்பு வளர்க்கவும், அவசர திருமண முடிவுகளை தவிர்க்கவும்.",
    en: "To reduce impact: do full compatibility + Navamsa matching before marriage, check for cancellation factors, build open communication with the partner, and avoid rushed marriage decisions.",
  },
  PUTRA_SARPA_DOSHAM: {
    ta: "தாக்கத்தை குறைக்க: மருத்துவ ஆலோசனையை ஆன்மீக பரிகாரத்துடன் இணைக்கவும், 5-ம் அதிபதி/குரு தசை காலத்தை கவனிக்கவும், படைப்புத் திட்டங்களில் பொறுமை வளர்க்கவும், அழுத்தத்தை குறைக்கவும்.",
    en: "To reduce impact: combine medical guidance with the spiritual remedy, watch the 5th-lord/Jupiter dasha windows, build patience in creative ventures, and keep stress low.",
  },
};

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
    strong:  { ta: "தனயோகம் வலுவாக உள்ளது. வருமான ஒழுக்கம் மற்றும் சேமிப்பில் கவனம் செலுத்துவது இந்த காலத்தில் நிதி முன்னேற்றத்தை ஆதரிக்கலாம்.", en: "Dhana Yoga is strong. Attention to income discipline and savings may support financial progress in this phase." },
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
  BADHAKA_DOSHAM: {
    active:    { ta: "பாதக தோஷம் செயல்பாட்டில் உள்ளது. தற்போது முக்கிய காரியங்களில் தடைகள்/தாமதங்கள் சாத்தியம் — முன்கூட்டிய திட்டமிடல், மாற்றுத் திட்டம், பொறுமை இந்த காலத்தில் மிகவும் உதவும்.", en: "Badhaka Dosham is active. Important matters may meet blocks or delays right now — early planning, a back-up plan, and patience help most in this phase." },
    cancelled: { ta: "பாதக தோஷம் நிவர்த்தி காரணங்களால் (வலுவான பாதக அதிபதி) குறைக்கப்பட்டுள்ளது. தடைகள் வந்தாலும் விரைவில் கடக்கப்படும்.", en: "Badhaka Dosham is reduced by mitigation (a strong badhaka lord). Even when blocks appear, they tend to clear quickly." },
    candidate: { ta: "பாதக சாத்திய சுட்டி மட்டும்; முழு ஜாதக உறுதிப்பாடு தேவை.", en: "Badhaka is a candidate signal only; confirm in full chart context." },
    absent:    { ta: "பாதக தோஷம் தற்போது செயல்பாட்டில் இல்லை.", en: "Badhaka Dosham is not currently active." },
  },
  KALATHRA_DOSHAM: {
    active:    { ta: "களத்திர (7-ம் வீடு) தோஷம் செயல்பாட்டில் உள்ளது. திருமண முடிவுகளில் முழு பொருத்தம் + நவாம்சம் பார்த்து, அவசரப்படாமல் முடிவெடுங்கள். துணையின் உடல்நலத்திலும் கவனம் நல்லது.", en: "Kalathra (7th-house) Dosham is active. For marriage decisions, do full compatibility + Navamsa matching and avoid rushing. Attention to the partner's health is also wise." },
    cancelled: { ta: "களத்திர தோஷம் நிவர்த்தி காரணங்களால் (வலுவான/உச்ச 7-ம் அதிபதி) குறைக்கப்பட்டுள்ளது. நடைமுறை தொடர்பும் புரிதலும் முக்கியம்.", en: "Kalathra Dosham is reduced by mitigation (a strong/exalted 7th lord). Practical communication and understanding matter most." },
    candidate: { ta: "களத்திர சாத்திய சுட்டி மட்டும்; 7-ம் அதிபதி, சுக்கிரன், நவாம்சம் சரிபார்க்கவும்.", en: "Kalathra is a candidate signal only; verify the 7th lord, Venus, and Navamsa." },
    absent:    { ta: "களத்திர தோஷம் இல்லை. 7-ம் வீடு/அதிபதி பாதிக்கப்படவில்லை.", en: "Kalathra Dosham is absent. The 7th house/lord is not afflicted in this chart." },
  },
  PUTRA_SARPA_DOSHAM: {
    active:    { ta: "புத்ர சர்ப்ப (5-ம் வீடு) தோஷம் செயல்பாட்டில் உள்ளது. குழந்தைப்பேறு/படைப்புத் திட்டங்களில் கூடுதல் கவனம் தேவைப்படலாம்; மருத்துவ ஆலோசனையை பரிகாரத்துடன் சேருங்கள்.", en: "Putra Sarpa (5th-house) Dosham is active. Progeny or creative ventures may need extra care; combine medical guidance with the remedy." },
    cancelled: { ta: "புத்ர சர்ப்ப தோஷம் நிவர்த்தி காரணங்களால் (வலுவான 5-ம் அதிபதி/குரு) குறைக்கப்பட்டுள்ளது.", en: "Putra Sarpa Dosham is reduced by mitigation (a strong 5th lord/Jupiter)." },
    candidate: { ta: "புத்ர சர்ப்ப சாத்திய சுட்டி மட்டும்; முழு ஜாதக உறுதிப்பாடு தேவை.", en: "Putra Sarpa is a candidate signal only; confirm in full chart context." },
    absent:    { ta: "புத்ர சர்ப்ப தோஷம் இல்லை.", en: "Putra Sarpa Dosham is not present." },
  },
};

function getYogaPowerContext(name: string, strength: string, dashaActivated: boolean, lang: Lang): string {
  const key = name.toUpperCase().replace("GAJA_KESARI", "GAJA_KESARI_YOGA");
  const entry = YOGA_POWER_CONTEXT[key];
  if (!entry) {
    return lang === "ta"
      ? "இந்த யோகத்தின் தாக்கம் உங்கள் தற்போதைய தசை மற்றும் கிரகநகர்வு நிலையைப் பொறுத்து மாறுபடும்."
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
      ? "இந்த தோஷத்தின் தாக்கம் தற்போதைய தசை மற்றும் கிரகநகர்வு நிலையைப் பொறுத்து மாறுபடும்."
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
    ? yoga.strength === "STRONG" ? "#5C7654"
    : yoga.strength === "PARTIAL" ? "#B85A2C"
    : "var(--color-faint)"
    : "#D4C8AE";

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

  const cardBg = yoga.isPresent
    ? yoga.strength === "STRONG" ? "#DCE4D2"
    : yoga.strength === "PARTIAL" ? "#F0D9C4"
    : "#FAF5EA"
    : "#FAF5EA";
  const cardBorder = yoga.isPresent
    ? yoga.strength === "STRONG" ? "rgba(92,118,84,0.35)"
    : yoga.strength === "PARTIAL" ? "rgba(184,90,44,0.35)"
    : "#D4C8AE"
    : "#E4DBC8";

  return (
    <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${cardBorder}`, background: "#FFFFFF", overflow: "hidden", fontFamily: "var(--font-body)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: "var(--space-4) var(--space-5)", background: cardBg, border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2_5)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1 }}>
          <span style={{ fontSize: "0.875rem", color }}>{yoga.isPresent ? "★" : "○"}</span>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: yoga.isPresent ? "#1A1612" : "var(--color-faint)" }}>
            {displayName(yoga.name, lang)}
          </span>
          {yoga.isPresent && yoga.dashaActivated && (
            <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#B85A2C", border: "1px solid rgba(184,90,44,0.4)", borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2)" }}>
              {t("yoga_dasha_activated", lang)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", flexShrink: 0 }}>
          {yoga.isPresent ? (
            <span
              title={lang === "ta" ? "ஜாதக பலம் (நேட்டல் சார்ட்)" : "Natal chart strength — how strong this yoga is in your birth chart"}
              style={{ fontSize: "0.625rem", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2_5)" }}
            >
              {strengthBand(yoga.strength, yoga.isPresent, lang)}
            </span>
          ) : (
            <span style={{ fontSize: "0.625rem", color: "var(--color-faint)" }}>{t("yoga_absent", lang)}</span>
          )}
          {yoga.isPresent && typeof yoga.activationScore === "number" && (
            <span
              title={lang === "ta" ? "இன்றைய செயல்பாட்டு மதிப்பெண் (தசை + கிரகநகர்வு)" : "Today's activation score — how strongly Dasha and transits are triggering this yoga now"}
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                padding: "var(--space-0_5) var(--space-2)",
                borderRadius: "var(--radius-pill)",
                background: yoga.isCurrentlyActive ? "rgba(92,118,84,0.18)" : "var(--color-surface-soft)",
                color: yoga.isCurrentlyActive ? "var(--color-score-high)" : "var(--color-faint)",
                border: `1px solid ${yoga.isCurrentlyActive ? "rgba(92,118,84,0.4)" : "var(--color-border)"}`,
                flexShrink: 0,
              }}
            >
              {`${yoga.activationScore}/100`}
            </span>
          )}
          <span style={{ color: "var(--color-faint)" }} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" width="12" height="12" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>

          <div>
            <p className="cd-kicker" style={{ letterSpacing: "0.08em" }}>
              {lang === "ta" ? "இது என்ன" : "What This Is"}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
              {getWhat(yoga.name, true, lang, { ta: yoga.descriptionTa, en: yoga.descriptionEn })}
            </p>
          </div>

          <div>
            <p className="cd-kicker" style={{ letterSpacing: "0.08em" }}>
              {lang === "ta" ? "உங்கள் ஜாதகத்தில் ஏன்" : "Why Your Chart Has This"}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
              {whyText}
            </p>
            {yoga.isPresent && yoga.conditionsMet.length > 0 && (
              <ul style={{ margin: "var(--space-2) 0 0", padding: "0 0 0 var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-0_75)" }}>
                {yoga.conditionsMet.map((c, i) => (
                  <li key={i} style={{ fontSize: "0.75rem", color: "#5a4f42", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>
                ))}
              </ul>
            )}
            {Array.isArray(yoga.cancellationFactors) && yoga.cancellationFactors.length > 0 && (
              <div style={{ marginTop: "var(--space-3)" }}>
                <p
                  style={{
                    margin: "0 0 var(--space-1)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "var(--color-faint)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {lang === "ta" ? "நிவர்த்தி காரணங்கள்" : "Cancellation factors"}
                </p>
                {yoga.cancellationFactors.map((factor) => (
                  <p
                    key={factor}
                    style={{
                      margin: "var(--space-0_75) 0",
                      fontSize: "0.875rem",
                      color: "var(--color-muted)",
                    }}
                  >
                    {"· "}
                    {markerLabel(factor, lang)}
                  </p>
                ))}
              </div>
            )}
          </div>

          {yoga.isPresent && (() => {
            const key = yoga.name.toUpperCase().replace("GAJA_KESARI", "GAJA_KESARI_YOGA");
            const outcomes = YOGA_OUTCOMES[key];
            const howTo = YOGA_HOW_TO[key];
            const remedies = YOGA_REMEDIES[key];
            return (
              <>
                {outcomes && (
                  <div>
                    <p className="cd-kicker" style={{ color: "#5C7654", letterSpacing: "0.08em" }}>
                      {lang === "ta" ? "வாழ்க்கையில் என்ன தரும்" : "What This Brings"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
                      {lang === "ta" ? outcomes.ta : outcomes.en}
                    </p>
                  </div>
                )}
                {howTo && (
                  <div>
                    <p className="cd-kicker" style={{ color: "#5C7654", letterSpacing: "0.08em" }}>
                      {lang === "ta" ? "யோகத்தை பலப்படுத்துவது எப்படி" : "How to Strengthen This Yoga"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
                      {lang === "ta" ? howTo.ta : howTo.en}
                    </p>
                  </div>
                )}
                {remedies && (
                  <div style={{ padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-md)", background: "#EEF6EA", border: "1px solid rgba(92,118,84,0.2)" }}>
                    <p className="cd-kicker" style={{ color: "#5C7654", letterSpacing: "0.08em" }}>
                      {lang === "ta" ? "பரிகாரங்கள்" : "Remedies"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#1A1612", lineHeight: 1.55 }}>
                      {lang === "ta" ? remedies.ta : remedies.en}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
          {yoga.isPresent && powerText && (
            <div style={{ padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-md)", background: cardBg, border: `1px solid ${cardBorder}` }}>
              <p className="cd-kicker" style={{ color, letterSpacing: "0.08em" }}>
                {lang === "ta" ? "இப்போது என்ன செய்யலாம்" : "What It Can Do Now"}
              </p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#1A1612", lineHeight: 1.55 }}>
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

// Doshams carry no numeric field from the engine, so derive a 0–100 severity
// from the same signals the yoga badge uses (strength band + dasha activation +
// cancellation). This gives doshams a score on par with yogas so the UI is
// consistent ("some have scores, some don't" → all do now).
function doshamSeverityScore(dosham: ChartDoshamInsight): number | null {
  if (!dosham.isPresent) return null;
  let base = dosham.strength === "STRONG" ? 80 : dosham.strength === "PARTIAL" ? 55 : 35;
  if (dosham.dashaActivated) base += 10;
  if (dosham.isCancelled) base = Math.round(base * 0.35); // mitigated → much lower
  return Math.max(0, Math.min(100, base));
}

function DoshamCard({ dosham, lang }: { dosham: ChartDoshamInsight; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const isActiveAndPresent = dosham.isPresent && !dosham.isCancelled;
  const isCancelledAndPresent = dosham.isPresent && dosham.isCancelled;
  const color = isActiveAndPresent ? "#A8482F" : isCancelledAndPresent ? "#5C7654" : "var(--color-faint)";
  const severityScore = doshamSeverityScore(dosham);

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

  const cardBg = isActiveAndPresent ? "#F2D8CC" : isCancelledAndPresent ? "#DCE4D2" : "#FAF5EA";
  const cardBorder = isActiveAndPresent ? "rgba(168,72,47,0.35)" : isCancelledAndPresent ? "rgba(92,118,84,0.35)" : "#E4DBC8";

  return (
    <div style={{ borderRadius: "var(--radius-md)", border: `1px solid ${cardBorder}`, background: "#FFFFFF", overflow: "hidden", fontFamily: "var(--font-body)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", padding: "var(--space-4) var(--space-5)", background: cardBg, border: "none", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-2_5)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1 }}>
          <span style={{ color }} aria-hidden="true">
            {isActiveAndPresent
              ? <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 3L21 20H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 9V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
              : dosham.isCancelled
              ? <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/></svg>
            }
          </span>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: dosham.isPresent ? "#1A1612" : "var(--color-faint)" }}>
            {displayName(dosham.name, lang)}
          </span>
          {dosham.isPresent && dosham.dashaActivated && (
            <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#B85A2C", border: "1px solid rgba(184,90,44,0.4)", borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2)" }}>
              {t("yoga_dasha_activated", lang)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1_5)", flexShrink: 0 }}>
          <span style={{ fontSize: "0.625rem", fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}55`, borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2_5)" }}>
            {statusLabel}
          </span>
          {severityScore !== null && (
            <span
              title={lang === "ta" ? "தீவிரம் — ஜாதக பலம் + தசை செயல்பாடு ஆகியவற்றின் அடிப்படையில்" : "Severity — based on natal strength + current Dasha activation"}
              style={{ fontSize: "0.625rem", fontWeight: 700, padding: "var(--space-0_5) var(--space-2)", borderRadius: "var(--radius-pill)", background: `${color}14`, color, border: `1px solid ${color}40`, flexShrink: 0 }}
            >
              {severityScore}/100
            </span>
          )}
          <span style={{ color: "var(--color-faint)" }} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" width="12" height="12" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: `1px solid ${cardBorder}`, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>

          <div>
            <p className="cd-kicker" style={{ letterSpacing: "0.08em" }}>
              {lang === "ta" ? "இது என்ன" : "What This Is"}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
              {getWhat(dosham.name, false, lang, {
                ta: dosham.explanationWhatTa || dosham.descriptionTa,
                en: dosham.explanationWhatEn || dosham.descriptionEn,
              })}
            </p>
          </div>

          <div>
            <p className="cd-kicker" style={{ letterSpacing: "0.08em" }}>
              {lang === "ta" ? "உங்கள் ஜாதகத்தில் ஏன்" : "Why Your Chart Has This"}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>{whyText}</p>

            {triggerBullets.length > 0 && (
              <div style={{ marginTop: "var(--space-2_5)" }}>
                <p className="cd-kicker" style={{ color: "#A8482F", letterSpacing: "0.08em" }}>
                  {lang === "ta" ? "கிரக நிலைகள்" : "Planet Positions"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-0_75)" }}>
                  {triggerBullets.map((c, i) => (
                    <li key={i} style={{ fontSize: "0.75rem", color: "#5a4f42", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>
                  ))}
                </ul>
              </div>
            )}

            {dosham.cancellationFactors.length > 0 && (
              <div style={{ marginTop: "var(--space-2_5)" }}>
                <p className="cd-kicker" style={{ color: "#5C7654", letterSpacing: "0.08em" }}>
                  {lang === "ta" ? "பாதுகாப்பு காரணங்கள்" : "Protective Factors"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-0_75)" }}>
                  {dosham.cancellationFactors.map((c, i) => (
                    <li key={i} style={{ fontSize: "0.75rem", color: "#5a4f42", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>
                  ))}
                </ul>
              </div>
            )}

            {attentionBullets.length > 0 && (
              <div style={{ marginTop: "var(--space-2_5)" }}>
                <p className="cd-kicker" style={{ color: "#B85A2C", letterSpacing: "0.08em" }}>
                  {lang === "ta" ? "கவன குறிப்பு" : "Attention Note"}
                </p>
                <ul style={{ margin: 0, padding: "0 0 0 var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-0_75)" }}>
                  {attentionBullets.map((c, i) => (
                    <li key={i} style={{ fontSize: "0.75rem", color: "#5a4f42", lineHeight: 1.45 }}>{markerLabel(c, lang)}</li>
                  ))}
                </ul>
              </div>
            )}

            {(() => {
              const key = dosham.name.toUpperCase();
              const outcomes = DOSHAM_OUTCOMES[key];
              const howTo = DOSHAM_HOW_TO[key];
              const remedies = DOSHAM_REMEDIES[key];
              return (
                <>
                  {outcomes && dosham.isPresent && (
                    <div style={{ marginTop: "var(--space-2_5)" }}>
                      <p className="cd-kicker" style={{ color: "#A8482F", letterSpacing: "0.08em" }}>
                        {lang === "ta" ? "வாழ்க்கையில் என்ன ஆகலாம்" : "How This May Affect You"}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
                        {lang === "ta" ? outcomes.ta : outcomes.en}
                      </p>
                    </div>
                  )}
                  {howTo && dosham.isPresent && (
                    <div style={{ marginTop: "var(--space-2_5)" }}>
                      <p className="cd-kicker" style={{ color: "#5C7654", letterSpacing: "0.08em" }}>
                        {lang === "ta" ? "தாக்கத்தை குறைப்பது எப்படி" : "How to Reduce Impact"}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#3D352B", lineHeight: 1.55 }}>
                        {lang === "ta" ? howTo.ta : howTo.en}
                      </p>
                    </div>
                  )}
                  {remedies && dosham.isPresent && (
                    <div style={{ marginTop: "var(--space-2_5)", padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-md)", background: "#F8E4D2", border: "1px solid rgba(168,72,47,0.2)" }}>
                      <p className="cd-kicker" style={{ color: "#A8482F", letterSpacing: "0.08em" }}>
                        {lang === "ta" ? "பரிகாரங்கள்" : "Remedies"}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#1A1612", lineHeight: 1.55 }}>
                        {lang === "ta" ? remedies.ta : remedies.en}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}

            {dosham.missingData && dosham.missingData.length > 0 && (
              <p style={{ margin: "var(--space-2_5) 0 0", fontSize: "0.75rem", color: "var(--color-score-mid)", fontStyle: "italic", lineHeight: 1.5 }}>
                {lang === "ta"
                  ? "குறிப்பு: பிறந்த நேரம் இல்லாததால் இந்த மதிப்பீடு தோராயமானது."
                  : "Note: this assessment is estimated because exact birth time is unavailable."}
              </p>
            )}
          </div>

          <div style={{ padding: "var(--space-3) var(--space-3_5)", borderRadius: "var(--radius-md)", background: cardBg, border: `1px solid ${cardBorder}` }}>
            <p className="cd-kicker" style={{ color, letterSpacing: "0.08em" }}>
              {lang === "ta" ? "இப்போது என்ன பொருள்" : "What This Means For You Now"}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#1A1612", lineHeight: 1.55 }}>{powerText}</p>
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
      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-faint)", fontFamily: "var(--font-body)" }}>
        {t("yogas_empty", lang)}
      </p>
    );
  }

  const presentYogas = yogas.filter((y) => y.isPresent);
  const absentYogas  = yogas.filter((y) => !y.isPresent);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-7)", fontFamily: "var(--font-body)" }}>
      {yogas.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)", marginBottom: "var(--space-3)" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 500, color: "#1A1612" }}>
              {t("yogas_title", lang)}
            </p>
            {presentYogas.length > 0 && (
              <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "#5C7654", background: "#DCE4D2", border: "1px solid rgba(92,118,84,0.35)", borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2)" }}>
                {presentYogas.length} {t("yoga_present", lang)}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {presentYogas.map((y, i) => <YogaCard key={`present-${y.name}-${i}`} yoga={y} lang={lang} />)}
            {absentYogas.map((y, i)  => <YogaCard key={`absent-${y.name}-${i}`}  yoga={y} lang={lang} />)}
          </div>
        </div>
      )}

      {doshams.length > 0 && (
        <div>
          <p style={{ margin: "0 0 var(--space-3)", fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 500, color: "#1A1612" }}>
            {t("doshams_title", lang)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {doshams.map((d) => <DoshamCard key={d.name} dosham={d} lang={lang} />)}
          </div>
        </div>
      )}
    </div>
  );
}
