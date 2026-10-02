import type { Lang } from "./lang-core";

// Festival and observance names, in Tamil.
//
// The backend sends a festival as one English string (`PanchangamFestival.name`)
// and never a key, so the English text is the only handle a page has. Rendering
// it prints English at a Tamil reader, the same leak `rasiName` is for a rasi
// (CLAUDE.md, "Display boundary"). `tFestival` is the localiser for it.
//
// Two tables, kept apart on purpose:
//   CURATED - the Tamil the backend already holds for its curated calendar rows
//             (`app/data/calendar_categories_2026.py`, `name_ta`). Copied, not
//             re-typed; `festival-names.test.ts` fails if a row drifts.
//   DRAFT   - names the backend emits with no Tamil of its own (the recurring
//             vratas, the fixed holidays). Written here from the forms
//             `panchangam_events_service.py` already prints. NOT read by a Tamil
//             reader; the backend's own observance table carries the same caveat.
//
// `festival-names.test.ts` also fails when the backend can emit a name that
// neither table has, so a new festival cannot reach a Tamil page as English.

const CURATED: Record<string, string> = {
  "Arudra Darisanam": "ஆருத்ரா தரிசனம்",
  "Kerpotta Nivarthi": "கெர்போட்ட நிவர்த்தி",
  "Bhogi": "போகிப் பண்டிகை",
  "Thai Pongal": "தைப் பொங்கல்",
  "Mattu Pongal": "மாட்டுப் பொங்கல்",
  "Thiruvalluvar Day": "திருவள்ளுவர் தினம்",
  "Kaanum Pongal": "காணும் பொங்கல்",
  "Uzhavar Thirunal": "உழவர் திருநாள்",
  "Thai Amavasai": "தை அமாவாசை",
  "Ratha Saptami": "ரத ஸப்தமி",
  "Thai Poosam": "தைப்பூசம்",
  "Maha Sivarathiri": "மஹாசிவராத்திரி",
  "Maasi Magam": "மாசி மகம்",
  "Holi": "ஹோலி பண்டிகை",
  "Karadayan Nombu": "காரடையான் நோன்பு",
  "Ugadi (Telugu New Year)": "தெலுங்கு வருடப் பிறப்பு",
  "Ram Navami": "ராமநவமி",
  "Panguni Uthiram": "பங்குனி உத்திரம்",
  "Tamil New Year (Puthandu) / Ambedkar Jayanti": "தமிழ் வருடப்பிறப்பு",
  "Akshaya Tritiya": "அட்சய திரிதியை",
  "Sankara Jayanthi": "சங்கர ஜெயந்தி",
  "Meenakshi Thirukalyanam": "மீனாட்சி திருக்கல்யாணம்",
  "Kallazhagar Ethir Sevai": "கள்ளழகர் எதிர்சேவை",
  "Kallazhagar Vaigai Ezhuntharulal": "ஸ்ரீகள்ளழகர் வைகை எழுந்தருளல்",
  "Agni Nakshatram Begins": "அக்னி நட்சத்திரம் துவக்கம்",
  "Agni Nakshatram Ends": "அக்னி நட்சத்திரம் முடிவு",
  "Vaigasi Visakam": "வைகாசி விசாகம்",
  "Aani Uthira Darisanam": "ஆனி உத்திர தரிசனம்",
  "Sankaran Kovil Thapasu": "சங்கரன்கோவில் தபசு",
  "Aadi Perukku": "ஆடிப்பெருக்கு விழா",
  "Thiru Aadi Pooram": "திருஆடிப்பூரம்",
  "Garuda Panchami": "கெருட பஞ்சமி",
  "Varalakshmi Vratham": "ஸ்ரீவரலட்சுமி விரதம்",
  "Onam": "ஓணம் பண்டிகை",
  "Avani Avittam": "ஆவணி அவிட்டம்",
  "Gayathri Japam": "ஸ்ரீகாயத்ரி ஜெபம்",
  "Maha Sankatahara Chathurthi": "ஸ்ரீமஹா சங்கடஹர சதுர்த்தி",
  "Krishna Jayanthi": "கோகுலாஷ்டமி",
  "Vinayagar Chaturthi": "ஸ்ரீவிநாயகர் சதுர்த்தி",
  "Mahalaya Paksha Begins": "மஹாளய பட்சாரம்பம்",
  "Mahalaya Amavasai": "மஹாளய அமாவாஸ்யை",
  "Navarathiri Begins": "நவராத்திரி துவக்கம்",
  "Saraswathi Poojai": "சரஸ்வதி பூஜை",
  "Ayudha Pooja": "ஆயுத பூஜை",
  "Vijayadasami": "விஜயா தசமி",
  "Deepavali": "தீபாவளி பண்டிகை",
  "Kanda Sashti Begins": "கந்த ஷஷ்டி துவக்கம்",
  "Soorasamharam": "சூரசம்ஹாரம்",
  "Karthigai Deepam": "திருக்கார்த்திகை",
  "Pancharatra Deepam": "பாஞ்சராத்திரதீபம்",
  "Vaikuntha Ekadashi / Mokshada": "வைகுண்ட ஏகாதசி",
  "Kerpotta Begins": "கெர்போட்ட ஆரம்பம்",
  "New Year's Day": "ஆங்கிலப் புத்தாண்டு",
  "Presentation of Our Lady": "தேவமாதா பரிசுத்தரான திருநாள்",
  "Ash Wednesday": "ஆஷ் வெனஸ்டே",
  "Palm Sunday": "பாம் சண்டே",
  "Maundy Thursday": "பெரிய வியாழன்",
  "Good Friday": "புனித வெள்ளி",
  "Easter Sunday": "ஈஸ்டர் சண்டே",
  "Visitation of Our Lady": "தேவமாதா காட்சியருளிய நாள்",
  "Nativity of Our Lady": "தேவமாதா பிறந்த நாள்",
  "Christmas": "கிறிஸ்துமஸ் பண்டிகை",
  "Ramzan Begins": "ரம்ஜான் முதல் தேதி",
  "Eid ul-Fitr (Ramazan)": "ரம்ஜான் பண்டிகை",
  "Bakrid (Eid al-Adha)": "பக்ரீத் பண்டிகை",
  "Hijri New Year": "ஹிஜிரி வருடப் பிறப்பு",
  "Muharram": "மொஹரம் பண்டிகை",
  "Milad-un-Nabi": "மீலாது நபி",
  "Pongal": "பொங்கல்",
  "Republic Day": "குடியரசு தினம்",
  "Mahavir Jayanti": "மஹாவீர் ஜெயந்தி",
  "Annual Closing of Accounts": "வங்கி கணக்கு முடிக்கும் நாள்",
  "Tamil New Year's Day": "தமிழ் வருடப் பிறப்பு",
  "Dr. B. R. Ambedkar's Birthday": "டாக்டர் அம்பேத்கர் பிறந்த நாள்",
  "May Day": "மே தினம்",
  "Bakrid Festival": "பக்ரீத் பண்டிகை",
  "Muharram Festival": "முஹர்ரம் பண்டிகை",
  "Independence Day": "சுதந்திர தினம்",
  "Gandhi Jayanthi": "காந்தி ஜெயந்தி",
  "Vijaya Dasami": "சரஸ்வதி பூஜை / விஜயதசமி",
  "Christmas Day": "கிறிஸ்துமஸ் பண்டிகை",
};

const DRAFT: Record<string, string> = {
  "May Day (Labour Day)": "மே தினம்",
  "Christmas Eve": "கிறிஸ்துமஸ் ஈவ்",
  "Annual Closing of Bank Accounts": "வங்கி கணக்கு முடிக்கும் நாள்",
  "Buddha Purnima": "புத்த பௌர்ணமி",
  "Guru Nanak's Birthday": "குருநானக் ஜெயந்தி",
  "Thai Pongal / Makar Sankranti": "தைப் பொங்கல் / மகர சங்கராந்தி",
  "Tamil New Year (Puthandu)": "தமிழ் வருடப் பிறப்பு",
  "Puthandu (Tamil New Year)": "தமிழ் வருடப் பிறப்பு",
  "Ramzan begins": "ரம்ஜான் முதல் தேதி",
  "Eid ul-Adha (Bakrid)": "பக்ரீத் பண்டிகை",
  "Thiruvonam Vratam": "திருவோண விரதம்",
  "Rohini Vratam": "ரோகிணி விரதம்",
  "Karthigai Vratam": "கார்த்திகை விரதம்",
  "Sani Pradhosam": "சனி பிரதோஷம்",
  "Pradhosam": "பிரதோஷம்",
  "Vaikunta Ekadashi": "வைகுண்ட ஏகாதசி",
  "Angarki Sankatahara Chaturthi": "அங்காரக சங்கடஹர சதுர்த்தி",
  "Sankatahara Chaturthi": "சங்கடஹர சதுர்த்தி",
  "Chathurthi": "சதுர்த்தி",
  "Sashti": "சஷ்டி",
  "Skanda Sashti": "கந்த சஷ்டி",
  "Theipirai Ashtami": "தேய்பிறை அஷ்டமி",
  "Sivarathiri": "சிவராத்திரி",
  "Chitra Pournami": "சித்ரா பௌர்ணமி",
  "Ekadashi (Shukla)": "ஏகாதசி (வளர்பிறை)",
  "Ekadashi (Krishna)": "ஏகாதசி (தேய்பிறை)",
};

// "Ramzan Begins" is curated; the yearly gazetted list spells it "Ramzan begins".
export const FESTIVAL_NAME_TA: Readonly<Record<string, string>> = { ...CURATED, ...DRAFT };
export const FESTIVAL_NAME_TA_CURATED: Readonly<Record<string, string>> = CURATED;

const TAMIL_SCRIPT = /[\u0B80-\u0BFF]/u;

/**
 * A festival name in the reader's language. English is returned untouched. In
 * Tamil, a name the backend already sends in Tamil (the world observance days)
 * passes through; a known English name is translated; an unknown one falls back
 * to the English name rather than dropping a festival from the day.
 */
export function tFestival(name: string, lang: Lang): string {
  if (lang !== "ta") return name;
  if (TAMIL_SCRIPT.test(name)) return name;
  return FESTIVAL_NAME_TA[name] ?? name;
}

const CATEGORY_TA: Record<string, string> = {
  hindu: "இந்துப் பண்டிகை",
  muslim: "முஸ்லிம் பண்டிகை",
  christian: "கிறிஸ்தவ பண்டிகை",
  indian_govt: "மத்திய அரசு விடுமுறை",
  tamilnadu_govt: "தமிழ்நாடு அரசு விடுமுறை",
  govt: "அரசு விடுமுறை",
  observance: "சிறப்பு நாள்",
};

/** The small category line under a festival ("hindu" -> "Hindu" / "இந்துப் பண்டிகை"). */
export function tFestivalCategory(category: string, lang: Lang): string {
  if (lang === "ta") return CATEGORY_TA[category] ?? category.replace(/_/g, " ");
  return category.replace(/_/g, " ");
}
