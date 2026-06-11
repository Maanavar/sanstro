"use client";

import { useState, useEffect } from "react";
import { readErrorMessage } from "@/lib/api";
import { useLang } from "@/components/lang-toggle";
import { tNakshatra, type Lang } from "@/lib/i18n";
import type { PanchangamDailyResponseData } from "@/lib/types";

// ── Static data ───────────────────────────────────────────────────────────────

const RASI_LIST: { number: number; en: string; ta: string; symbol: string }[] = [
  { number: 1,  en: "Mesham",     ta: "மேஷம்",      symbol: "♈" },
  { number: 2,  en: "Rishabam",   ta: "ரிஷபம்",     symbol: "♉" },
  { number: 3,  en: "Mithunam",   ta: "மிதுனம்",    symbol: "♊" },
  { number: 4,  en: "Kadagam",    ta: "கடகம்",       symbol: "♋" },
  { number: 5,  en: "Simmam",     ta: "சிம்மம்",    symbol: "♌" },
  { number: 6,  en: "Kanni",      ta: "கன்னி",       symbol: "♍" },
  { number: 7,  en: "Thulam",     ta: "துலாம்",      symbol: "♎" },
  { number: 8,  en: "Viruchigam", ta: "விருச்சிகம்", symbol: "♏" },
  { number: 9,  en: "Dhanusu",    ta: "தனுசு",       symbol: "♐" },
  { number: 10, en: "Magaram",    ta: "மகரம்",       symbol: "♑" },
  { number: 11, en: "Kumbam",     ta: "கும்பம்",     symbol: "♒" },
  { number: 12, en: "Meenam",     ta: "மீனம்",       symbol: "♓" },
];

type Tone = "positive" | "neutral" | "caution" | "warn";

interface HousePrediction {
  en: { title: string; body: string; luckyColor: string; pariharam: string };
  ta: { title: string; body: string; luckyColor: string; pariharam: string };
  tone: Tone;
  luckyNumbers: number[];
  colorHex: string;
}

const HOUSE_PREDICTIONS: Record<number, HousePrediction> = {
  1: {
    en: { title: "Mixed day", body: "Moon transits your natal sign — mental restlessness and introspection. Avoid impulsive new starts; short travel is possible.", luckyColor: "White / Silver", pariharam: "Offer water to the Moon at dusk (pour water facing west while reciting Chandra's name). Light a white lamp at home." },
    ta: { title: "கலப்பான நாள்", body: "சந்திரன் உங்கள் பிறப்பு ராசியில் உள்ளது. மன அமைதியின்மை, உள்ளார்ந்த சிந்தனை அதிகமாக இருக்கும். அவசர முடிவுகளைத் தவிர்க்கவும்; குறுகிய பயணம் சாத்தியம்.", luckyColor: "வெள்ளை / வெள்ளி", pariharam: "மாலையில் மேற்கு திசை நோக்கி சந்திரனுக்கு நீர் அர்க்கியம் செலுத்துங்கள். வீட்டில் வெள்ளை நிற விளக்கு ஏற்றுங்கள்." },
    tone: "neutral",
    luckyNumbers: [2, 7],
    colorHex: "#E8E8E8",
  },
  2: {
    en: { title: "Financial focus", body: "Family and money matters surface. Watch your speech — careless words create friction. Minor monetary tensions are possible.", luckyColor: "Yellow / Gold", pariharam: "Donate food or groceries to a family in need. Recite Sri Suktam or Lakshmi Ashtakam in the morning." },
    ta: { title: "பண விஷயங்கள்", body: "குடும்பம் மற்றும் பண விஷயங்கள் முன்னிலையில் உள்ளன. வாக்கு விஷயத்தில் கவனமாக இருங்கள். சிறிய பண பிரச்சினைகள் சாத்தியம்.", luckyColor: "மஞ்சள் / தங்க நிறம்", pariharam: "ஒரு குடும்பத்திற்கு உணவு அல்லது மளிகை தானம் செய்யுங்கள். காலையில் ஸ்ரீ சூக்தம் அல்லது லக்ஷ்மி அஷ்டகம் படியுங்கள்." },
    tone: "neutral",
    luckyNumbers: [6, 8],
    colorHex: "#F5C842",
  },
  3: {
    en: { title: "Courage and effort", body: "Strong energy for initiative, short travel, and communication. Sibling support is available. Take on challenges with confidence.", luckyColor: "Red / Coral", pariharam: "Visit a Murugan (Subrahmanya) temple. Offer red flowers or a garland and pray for strength and courage." },
    ta: { title: "தைரியம் மற்றும் முயற்சி", body: "முயற்சி, குறுகிய பயணம், தொடர்பாடல் ஆகியவற்றிற்கு நல்ல சக்தி. சகோதர ஆதரவு உண்டு. நம்பிக்கையுடன் சவால்களை எதிர்கொள்ளுங்கள்.", luckyColor: "சிவப்பு / கோரல்", pariharam: "முருகன் (சுப்பிரமணிய) கோவிலுக்கு செல்லுங்கள். சிவப்பு மலர் அல்லது மாலை சமர்ப்பித்து வேண்டிக் கொள்ளுங்கள்." },
    tone: "positive",
    luckyNumbers: [3, 9],
    colorHex: "#E05C3A",
  },
  4: {
    en: { title: "Home and comfort", body: "Focus on home, property, and mother's wellbeing. A peaceful and comforting period — good for domestic matters and rest.", luckyColor: "Cream / Light Green", pariharam: "Offer milk abhishekam to a Shivalinga. Serve or seek blessings from your mother today." },
    ta: { title: "வீடு மற்றும் சுகம்", body: "வீடு, சொத்து, தாயின் நலன் ஆகியவை கவனம் பெறும். அமைதியான, சுகமான காலம். குடும்ப விஷயங்களுக்கு ஏற்றது.", luckyColor: "வெண்மை / இளம் பச்சை", pariharam: "சிவலிங்கத்திற்கு பால் அபிஷேகம் செய்யுங்கள். இன்று தாயை சேவியுங்கள் அல்லது அவர் ஆசீர்வாதம் பெறுங்கள்." },
    tone: "positive",
    luckyNumbers: [2, 4],
    colorHex: "#C8E6B8",
  },
  5: {
    en: { title: "Intellect and joy", body: "Sharp intelligence and creativity. Good for children, romance, learning, and speculative ideas. Intuition is heightened.", luckyColor: "Yellow / Orange", pariharam: "Visit a Vinayaka (Ganesh) temple. Offer modakam or kozhukattai and pray for wisdom and clarity." },
    ta: { title: "புத்தி மற்றும் மகிழ்ச்சி", body: "புத்தி கூர்மையாகவும் படைப்பாற்றல் மிகுந்தும் உள்ளது. பிள்ளைகள், காதல், கற்றல் ஆகியவற்றிற்கு நல்லது. உள்ளுணர்வு அதிகரிக்கும்.", luckyColor: "மஞ்சள் / ஆரஞ்சு", pariharam: "விநாயகர் கோவிலுக்கு செல்லுங்கள். கொழுக்கட்டை நைவேத்தியம் செய்து புத்தி வளத்திற்காக வேண்டிக் கொள்ளுங்கள்." },
    tone: "positive",
    luckyNumbers: [5, 9],
    colorHex: "#F5A623",
  },
  6: {
    en: { title: "Health and service", body: "Minor health issues or debts may surface. Handle conflicts carefully. Focus on service, routines, and self-care.", luckyColor: "Green", pariharam: "Feed dogs and birds in the morning. Visit a Durga Devi or Kali temple and offer neem leaves or flowers." },
    ta: { title: "உடல் நலம் மற்றும் சேவை", body: "சிறிய உடல்நலக்குறைவு அல்லது கடன் வரலாம். மோதல்களை கவனமாக கையாளுங்கள். சேவை, வழக்கமான பணிகள், சுய பராமரிப்பில் கவனம் செலுத்துங்கள்.", luckyColor: "பச்சை", pariharam: "காலையில் நாய்கள் மற்றும் பறவைகளுக்கு உணவிடுங்கள். துர்கை அல்லது காளி கோவிலுக்கு சென்று வேம்பு இலை அல்லது மலர் சமர்ப்பியுங்கள்." },
    tone: "caution",
    luckyNumbers: [5, 6],
    colorHex: "#4CAF50",
  },
  7: {
    en: { title: "Relationships", body: "Partnerships and social interactions are highlighted. Good for meeting people, collaborating, and spouse-related matters.", luckyColor: "White / Pink", pariharam: "Recite Lalita Sahasranama or offer white or pink flowers to Devi. Perform an act of kindness toward your spouse or partner." },
    ta: { title: "உறவுகள்", body: "கூட்டாண்மை, சமூக தொடர்புகள் முன்னிலையில் உள்ளன. புதியவர்களை சந்திக்கவும், ஒத்துழைக்கவும் ஏற்ற நேரம். துணையர் விஷயங்கள் கவனம் பெறும்.", luckyColor: "வெள்ளை / இளஞ்சிவப்பு", pariharam: "லலிதா சஹஸ்ரநாமம் படியுங்கள் அல்லது தேவிக்கு வெள்ளை / இளஞ்சிவப்பு மலர் சமர்ப்பியுங்கள். துணையரிடம் அன்பான செயல் செய்யுங்கள்." },
    tone: "neutral",
    luckyNumbers: [6, 7],
    colorHex: "#F4A8C0",
  },
  8: {
    en: { title: "Chandrashtamam", body: "Moon is in the 8th house from your rasi. Avoid new ventures, major decisions, surgery, and financial risk. Rest and introspect.", luckyColor: "White / Grey (avoid bright colours)", pariharam: "Perform milk abhishekam on a Shivalinga and offer bilva leaves. Recite Maha Mrityunjaya mantra 108 times for protection." },
    ta: { title: "சந்திராஷ்டமம்", body: "சந்திரன் உங்கள் ராசியிலிருந்து 8ஆம் இடத்தில் உள்ளது. புதிய தொடக்கங்கள், முக்கிய முடிவுகள், அறுவை சிகிச்சை, பண ஆபத்துகளை தவிர்க்கவும். ஓய்வும் தியானமும் நலம்.", luckyColor: "வெள்ளை / சாம்பல் (பளபளப்பான நிறங்களை தவிர்க்கவும்)", pariharam: "சிவலிங்கத்திற்கு பால் அபிஷேகம் செய்து வில்வம் சமர்ப்பியுங்கள். மகா மிருத்யுஞ்சய மந்திரம் 108 முறை ஜபியுங்கள்." },
    tone: "warn",
    luckyNumbers: [8],
    colorHex: "#9E9E9E",
  },
  9: {
    en: { title: "Fortune and blessings", body: "Auspicious period. Luck, dharma, father's blessings, and long journeys are favoured. Spiritual activities bring rewards.", luckyColor: "Yellow / Saffron", pariharam: "Visit your kula deivam or father's favourite deity. Donate to a temple or offer yellow flowers to Guru Bhagavan." },
    ta: { title: "அதிர்ஷ்டம் மற்றும் ஆசீர்வாதம்", body: "சுப காலம். அதிர்ஷ்டம், தர்மம், தந்தையின் ஆசீர்வாதம், நீண்ட பயணம் ஆகியவை சாதகமாக உள்ளன. ஆன்மிக நடவடிக்கைகளில் பலன் கிடைக்கும்.", luckyColor: "மஞ்சள் / காவி", pariharam: "குலதெய்வம் அல்லது தந்தையின் விரும்பிய கோவிலுக்கு செல்லுங்கள். கோவிலுக்கு தானம் செய்யுங்கள் அல்லது குரு பகவானுக்கு மஞ்சள் மலர் சமர்ப்பியுங்கள்." },
    tone: "positive",
    luckyNumbers: [1, 3],
    colorHex: "#F5C518",
  },
  10: {
    en: { title: "Career and recognition", body: "Good for professional activities, public visibility, and leadership. Take action on career goals — momentum is available.", luckyColor: "Red / Copper / Orange", pariharam: "Recite Surya Ashtakam or offer water to the rising Sun (Surya Arghyam). Visit a Sun temple or Murugan temple." },
    ta: { title: "தொழில் மற்றும் அங்கீகாரம்", body: "தொழில் நடவடிக்கைகள், பொது தெரிவு, தலைமை ஏற்பதற்கு நல்லது. தொழில் இலக்குகளில் நடவடிக்கை எடுங்கள் — வேகம் கிடைக்கும்.", luckyColor: "சிவப்பு / செம்பு / ஆரஞ்சு", pariharam: "சூரிய அஷ்டகம் படியுங்கள் அல்லது காலையில் உதிக்கும் சூரியனுக்கு அர்க்கியம் செலுத்துங்கள். சூரியன் அல்லது முருகன் கோவிலுக்கு செல்லுங்கள்." },
    tone: "positive",
    luckyNumbers: [1, 9],
    colorHex: "#E07020",
  },
  11: {
    en: { title: "Gains and success", body: "Excellent day. Gains, fulfilled desires, income, and friendships are favoured. Best window in the lunar cycle — act on opportunities.", luckyColor: "Blue / Indigo", pariharam: "Donate to a charity or help someone in genuine need. Visit a Ganapati temple and pray for continued blessings." },
    ta: { title: "லாபம் மற்றும் வெற்றி", body: "மிகவும் நல்ல நாள். லாபம், ஆசை நிறைவேற்றம், வருமானம், நட்பு சாதகமாக உள்ளன. சந்திர சுழற்சியின் சிறந்த காலம் — வாய்ப்புகளை பயன்படுத்துங்கள்.", luckyColor: "நீலம் / இண்டிகோ", pariharam: "ஒரு தர்ம நிறுவனத்திற்கு தானம் செய்யுங்கள் அல்லது உண்மையில் தேவைப்படுபவருக்கு உதவுங்கள். விநாயகர் கோவிலுக்கு சென்று தொடர்ந்த ஆசீர்வாதத்திற்காக வேண்டிக் கொள்ளுங்கள்." },
    tone: "positive",
    luckyNumbers: [3, 6, 9],
    colorHex: "#3F5FA8",
  },
  12: {
    en: { title: "Expenses and rest", body: "Expenditure and losses are possible. Retreat from the world — good for spiritual practice, solitude, and overseas connections.", luckyColor: "Yellow / White (spiritual tones)", pariharam: "Light a sesame oil lamp in the evening. Donate to the poor or a dharmasala. Recite Vishnu Sahasranama for peace." },
    ta: { title: "செலவு மற்றும் ஓய்வு", body: "செலவுகள் மற்றும் நஷ்டம் சாத்தியம். உலகிலிருந்து விலகி ஓய்வெடுங்கள். ஆன்மிக சாதனை, தனிமை, வெளிநாட்டு தொடர்புகளுக்கு ஏற்றது.", luckyColor: "மஞ்சள் / வெள்ளை (ஆன்மிக நிறங்கள்)", pariharam: "மாலையில் நல்லெண்ணெய் விளக்கு ஏற்றுங்கள். ஏழைகளுக்கு அல்லது தர்மசாலைக்கு தானம் செய்யுங்கள். மன அமைதிக்கு விஷ்ணு சஹஸ்ரநாமம் படியுங்கள்." },
    tone: "caution",
    luckyNumbers: [3, 7],
    colorHex: "#F5F0D8",
  },
};

const TONE_COLORS: Record<Tone, { bg: string; border: string; text: string; badge: string }> = {
  positive: { bg: "rgba(92,118,84,0.08)", border: "rgba(92,118,84,0.3)", text: "#5C7654", badge: "rgba(92,118,84,0.15)" },
  neutral:  { bg: "rgba(120,100,60,0.06)", border: "rgba(120,100,60,0.2)", text: "#786432", badge: "rgba(120,100,60,0.12)" },
  caution:  { bg: "rgba(168,72,47,0.07)", border: "rgba(168,72,47,0.25)", text: "#A8482F", badge: "rgba(168,72,47,0.14)" },
  warn:     { bg: "rgba(168,72,47,0.12)", border: "rgba(168,72,47,0.4)",  text: "#A8482F", badge: "rgba(168,72,47,0.2)" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function moonHouseFromRasi(moonRasi: number, janmaRasi: number): number {
  return ((moonRasi - janmaRasi + 12) % 12) + 1;
}

function rasiName(number: number, lang: Lang): string {
  return RASI_LIST.find((r) => r.number === number)?.[lang] ?? String(number);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RasiSelectorGrid({
  selectedRasi,
  onSelect,
  lang,
}: {
  selectedRasi: number | null;
  onSelect: (n: number) => void;
  lang: Lang;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
      {RASI_LIST.map((r) => {
        const isSelected = r.number === selectedRasi;
        return (
          <button
            key={r.number}
            type="button"
            onClick={() => onSelect(r.number)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              padding: "10px 6px",
              borderRadius: "10px",
              border: isSelected ? "2px solid var(--cl-accent)" : "1.5px solid var(--cl-border)",
              background: isSelected ? "rgba(184,90,44,0.08)" : "var(--cl-bg-2)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{r.symbol}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isSelected ? "#B85A2C" : "var(--cl-ink)" }}>
              {lang === "ta" ? r.ta : r.en}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RasiCard({
  rasiNumber,
  moonRasiNumber,
  lang,
  isSelected,
  onClick,
}: {
  rasiNumber: number;
  moonRasiNumber: number;
  lang: Lang;
  isSelected: boolean;
  onClick: () => void;
}) {
  const house = moonHouseFromRasi(moonRasiNumber, rasiNumber);
  const pred = HOUSE_PREDICTIONS[house];
  const colors = TONE_COLORS[pred.tone];
  const rasi = RASI_LIST.find((r) => r.number === rasiNumber)!;
  const content = lang === "ta" ? pred.ta : pred.en;

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? colors.bg : "var(--cl-surface)",
        border: isSelected ? `2px solid ${colors.border}` : "1.5px solid var(--cl-border)",
        borderRadius: "12px",
        padding: "14px 16px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <span style={{ fontSize: "1rem" }}>{rasi.symbol}</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--cl-ink)" }}>
          {lang === "ta" ? rasi.ta : rasi.en}
        </span>
        <span style={{
          marginLeft: "auto",
          fontSize: "0.62rem", fontWeight: 700,
          padding: "2px 7px", borderRadius: "999px",
          background: colors.badge, color: colors.text,
        }}>
          {lang === "ta" ? `${house}ஆம் இடம்` : `House ${house}`}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: colors.text }}>
        {content.title}
      </p>
      {isSelected && (
        <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "var(--cl-ink-2)", lineHeight: 1.55 }}>
          {content.body}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RasippalanTool() {
  const [lang] = useLang();
  const en = lang === "en";

  const [date, setDate] = useState(today());
  const [data, setData] = useState<PanchangamDailyResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRasi, setSelectedRasi] = useState<number | null>(null);

  async function fetchMoonRasi(d = date) {
    setError("");
    setLoading(true);
    setData(null);
    try {
      const params = new URLSearchParams({ date: d, lat: "13.0827", lng: "80.2707", timezone: "Asia/Kolkata" });
      const res = await fetch(`/api/backend/api/v1/public/panchangam?${params.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(j.detail ?? `Error ${res.status}`);
      }
      const json = await res.json() as { success: boolean; data: PanchangamDailyResponseData };
      setData(json.data);
    } catch (err) {
      setError(readErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMoonRasi();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moonRasiNumber = data?.chandrashtamamToday.moonRasiNumber ?? null;
  const moonRasiLabel = moonRasiNumber ? rasiName(moonRasiNumber, lang) : null;
  const nakshatraLabel = data ? tNakshatra(data.nakshatra.name, lang) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Date picker */}
      <div style={{
        background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
        borderRadius: "16px", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: "14px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "12px", alignItems: "end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.78rem", fontWeight: 600, color: "var(--cl-ink-2)" }}>
            {en ? "Date" : "தேதி"}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%", border: "1.5px solid var(--cl-border)", borderRadius: "8px",
                padding: "9px 12px", background: "var(--cl-bg)", color: "var(--cl-ink)",
                fontSize: "0.88rem", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => void fetchMoonRasi()}
            disabled={loading}
            style={{
              minHeight: "39px", padding: "9px 24px",
              background: loading ? "var(--cl-border)" : "var(--cl-ink)",
              color: "var(--cl-bg)", border: "none", borderRadius: "999px",
              fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
            }}
          >
            {loading ? (en ? "Loading…" : "ஏற்றுகிறது…") : (en ? "Get Rasipalan" : "ராசிபலன் பெறு")}
          </button>
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#A8482F", background: "rgba(168,72,47,0.08)", border: "1px solid rgba(168,72,47,0.25)", borderRadius: "8px", padding: "10px 14px" }}>
            {error}
          </p>
        )}
      </div>

      {/* Moon status banner */}
      {data && moonRasiNumber && (
        <div style={{
          background: "rgba(184,90,44,0.06)", border: "1px solid rgba(184,90,44,0.2)",
          borderRadius: "14px", padding: "16px 20px",
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px",
        }}>
          <span style={{ fontSize: "1.4rem" }}>🌙</span>
          <div>
            <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
              {en ? "Moon's position today" : "இன்று சந்திரன் நிலை"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "1rem", fontWeight: 700, color: "var(--cl-ink)" }}>
              {moonRasiLabel}
              {nakshatraLabel && (
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--cl-muted)", marginLeft: "8px" }}>
                  · {nakshatraLabel}
                </span>
              )}
            </p>
          </div>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--cl-muted)", marginLeft: "auto" }}>
            {en ? "Select your rasi below" : "கீழே உங்கள் ராசியை தேர்வு செய்யுங்கள்"}
          </p>
        </div>
      )}

      {/* Rasi selector */}
      {data && moonRasiNumber && (
        <div style={{
          background: "var(--cl-surface)", border: "1px solid var(--cl-border)",
          borderRadius: "16px", padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: "14px",
        }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
            {en ? "Select your birth sign" : "உங்கள் பிறப்பு ராசியைத் தேர்வு செய்யுங்கள்"}
          </p>
          <RasiSelectorGrid selectedRasi={selectedRasi} onSelect={setSelectedRasi} lang={lang} />
        </div>
      )}

      {/* Selected rasi — full prediction */}
      {data && moonRasiNumber && selectedRasi && (() => {
        const house = moonHouseFromRasi(moonRasiNumber, selectedRasi);
        const pred = HOUSE_PREDICTIONS[house];
        const colors = TONE_COLORS[pred.tone];
        const content = lang === "ta" ? pred.ta : pred.en;
        const rasi = RASI_LIST.find((r) => r.number === selectedRasi)!;
        return (
          <div style={{
            background: colors.bg, border: `2px solid ${colors.border}`,
            borderRadius: "16px", padding: "22px 26px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>{rasi.symbol}</span>
              <div>
                <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text }}>
                  {lang === "ta" ? rasi.ta : rasi.en} · {en ? `Moon in House ${house}` : `சந்திரன் ${house}ஆம் இடம்`}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "1.1rem", fontWeight: 700, color: colors.text }}>
                  {content.title}
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--cl-ink-2)", lineHeight: 1.65 }}>
              {content.body}
            </p>

            {/* Lucky number · color · pariharam */}
            <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Lucky row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {/* Lucky numbers */}
                <div style={{ flex: "1 1 auto", background: "rgba(255,255,255,0.55)", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text, marginBottom: "5px" }}>
                    {en ? "Lucky Numbers" : "அதிர்ஷ்ட எண்கள்"}
                  </p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {pred.luckyNumbers.map((n) => (
                      <span key={n} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "50%", background: colors.badge, color: colors.text, fontWeight: 700, fontSize: "0.88rem" }}>
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Lucky color */}
                <div style={{ flex: "1 1 auto", background: "rgba(255,255,255,0.55)", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text, marginBottom: "5px" }}>
                    {en ? "Lucky Colour" : "அதிர்ஷ்ட நிறம்"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "20px", height: "20px", borderRadius: "50%", background: pred.colorHex, border: "1.5px solid rgba(0,0,0,0.12)", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--cl-ink)" }}>{content.luckyColor}</span>
                  </div>
                </div>
              </div>

              {/* Pariharam */}
              <div style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "12px 14px" }}>
                <p style={{ margin: "0 0 5px", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.text }}>
                  {en ? "Pariharam (Today's Remedy)" : "பரிகாரம் (இன்றைய தினம்)"}
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--cl-ink-2)", lineHeight: 1.6 }}>
                  {content.pariharam}
                </p>
              </div>

            </div>
          </div>
        );
      })()}

      {/* All 12 rasis grid */}
      {data && moonRasiNumber && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cl-muted)" }}>
            {en ? "All 12 Rasis" : "12 ராசிகள் அனைத்தும்"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
            {RASI_LIST.map((r) => (
              <RasiCard
                key={r.number}
                rasiNumber={r.number}
                moonRasiNumber={moonRasiNumber}
                lang={lang}
                isSelected={r.number === selectedRasi}
                onClick={() => setSelectedRasi(r.number)}
              />
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {data && (
        <div className="cl-mobile-card-split" style={{
          background: "rgba(184,90,44,0.05)", border: "1px solid rgba(184,90,44,0.2)",
          borderRadius: "14px", padding: "18px 22px",
        }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--cl-ink)", fontSize: "0.92rem" }}>
              {en ? "Get rasipalan matched to your personal chart" : "உங்கள் ஜாதகத்துடன் பொருந்திய ராசிபலன் பெறுங்கள்"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--cl-muted)" }}>
              {en
                ? "Free account — daily guidance combining your dasha, natal chart, and panchangam."
                : "இலவச கணக்கு — தசை, ஜாதகம், பஞ்சாங்கம் ஒன்றாக இணைந்த தினசரி வழிகாட்டுதல்."}
            </p>
          </div>
          <a href="/dashboard" className="cl-mobile-cta" style={{
            display: "inline-flex", alignItems: "center", padding: "9px 22px",
            background: "var(--cl-ink)", color: "var(--cl-bg)", borderRadius: "999px",
            fontWeight: 600, fontSize: "0.88rem", textDecoration: "none",
          }}>
            {en ? "Get started free →" : "இலவசமாக தொடங்கு →"}
          </a>
        </div>
      )}
    </div>
  );
}
