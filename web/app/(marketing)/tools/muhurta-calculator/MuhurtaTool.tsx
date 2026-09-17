"use client";

import { useState } from "react";
import { getPersonalizedMuhurta } from "@vinaadi/shared/api";
import { getApiError, readErrorMessage } from "@/lib/api";
import { useLang } from "@/components/lang-toggle";
import { PlaceCombobox, type CityEntry } from "@/components/place-combobox";
import { romanNakshathiramName } from "@/lib/tamil-astro";
import Link from "next/link";

// B-006: was `CITY_OPTIONS.find(...)` over a static array; that array is gone
// (live search via PlaceCombobox replaced it), so the default is now a plain
// constant carrying the same coordinates Chennai always had in that array.
const DEFAULT_CITY: CityEntry = { name: "Chennai, Tamil Nadu, India", lat: "13.0667", lng: "80.2833", timezone: "Asia/Kolkata" };

// Values must match `app.api.public_tools._PUBLIC_MUHURTA_ACTIVITIES`, which is
// kept in step with the signed-in picker on purpose — the same question must
// not get a different answer depending on whether you are signed in.
//
// The Samskara and Treasure entries are the page-cited ones (Kalaprakasika
// Ch. III, IV and XXI). They stay separate values because their rules differ;
// see `app/data/muhurta_activity_registry.py`.
const EVENT_TYPES = [
  { value: "MARRIAGE",        en: "Wedding / Marriage",           ta: "திருமணம்" },
  { value: "NAMING_CEREMONY", en: "Baby Naming / Namakarana",     ta: "பெயர் சூட்டு விழா / நாமகரணம்" },
  { value: "MILK_FEEDING",    en: "First Feeding on Milk",        ta: "பால் ஊட்டத் தொடங்குதல்" },
  { value: "ANNAPRASANA",     en: "Annaprasana / First Feeding",  ta: "அன்னப்பிராசனம் / சோறூட்டு" },
  { value: "EAR_BORING",      en: "Ear Boring / Karnavedha",      ta: "காதுகுத்து / கர்ணவேதம்" },
  { value: "GOLD",            en: "Gold & Precious Metals",       ta: "தங்கம் / விலைமதிப்புள்ள உலோகம்" },
  { value: "GEMS",            en: "Gems & Jewels",                ta: "ரத்தினம் / நகை" },
  { value: "TREASURE_STORE",  en: "Laying Up Treasure",           ta: "செல்வம் சேமிப்பு" },
  { value: "GRAIN",           en: "Storing Grain",                ta: "தானியம் சேமிப்பு" },
  { value: "LAND_POSSESSION", en: "Taking Possession of Land",    ta: "நிலம் கைவசப்படுத்தல்" },
  { value: "LAND_PURCHASE",   en: "Buying Land",                  ta: "நிலம் வாங்குதல்" },
  { value: "CATTLE_PURCHASE", en: "Buying Cattle",                ta: "கால்நடை வாங்குதல்" },
  // Ch. V, VII, XVII, XVIII — the later life-stage samskaras.
  { value: "TONSURE",         en: "Tonsure / Choulam",            ta: "மொட்டை / சூடாகர்மம்" },
  { value: "UPANAYANAM",      en: "Upanayanam / Thread Ceremony", ta: "உபநயனம் / பூணூல் விழா" },
  { value: "SEEMANTHAM",      en: "Seemantham / Valaikappu",      ta: "சீமந்தம் / வளைகாப்பு" },
  { value: "LYING_IN_CHAMBER", en: "Arranging the Lying-in Chamber", ta: "பேறுகால அறை ஏற்பாடு" },
  // Ch. VI, VIII, X, XI, XII — the student's arc, start to finish.
  { value: "VIDYARAMBHAM",    en: "Vidyarambham / First Letters", ta: "வித்யாரம்பம் / எழுத்தறிவித்தல்" },
  { value: "EDUCATION_START", en: "Starting Education",           ta: "கல்வியைத் தொடங்குதல்" },
  { value: "MANTRA_INITIATION", en: "Mantra Initiation / Upadesam", ta: "மந்திர உபதேசம்" },
  { value: "VEDA_STUDY",      en: "Beginning Veda Study",         ta: "வேத அத்யயனம் தொடங்குதல்" },
  { value: "SNAANA",          en: "Samavarthanam Bath / Snaana",  ta: "சமாவர்த்தன ஸ்நானம்" },
  // Ch. XXIII, XXIV — wearing something new.
  { value: "NEW_CLOTHES",     en: "Wearing New Clothes",          ta: "புத்தாடை அணிதல்" },
  { value: "NEW_ORNAMENT",    en: "Wearing a New Gold Ornament",  ta: "புது தங்க நகை அணிதல்" },
  // Ch. XX — harvest and the grain store.
  { value: "HARVEST",         en: "Starting the Harvest",         ta: "அறுவடை தொடங்குதல்" },
  { value: "HARVEST_INGATHERING", en: "Bringing the Crop In",     ta: "விளைச்சலைச் சேர்த்தல்" },
  { value: "GRAIN_EXPENDITURE", en: "Drawing Down the Grain Store", ta: "தானியத்தைச் செலவிடுதல்" },
  // Ch. XIX, XXII — the crop cycle from first footstep to first mouthful.
  { value: "AGRICULTURE_START", en: "Starting Work on the Land",  ta: "வேளாண் பணியைத் தொடங்குதல்" },
  { value: "TILLAGE",         en: "Ploughing the Field",          ta: "நிலத்தை உழுதல்" },
  { value: "SOWING",          en: "Sowing Seed",                  ta: "விதைத்தல்" },
  { value: "NEW_GRAIN_MEAL",  en: "First Meal of the New Grain",  ta: "புதிய தானியத்தை உண்ணுதல்" },
  { value: "JOB_START",       en: "Job / Career Start",           ta: "வேலை / தொழில் தொடக்கம்" },
  { value: "INVESTMENT",      en: "Business / Investment",        ta: "வியாபாரம் / முதலீடு" },
  { value: "PURCHASE",        en: "Purchase / Property",          ta: "வாங்குதல் / சொத்து" },
  { value: "TRAVEL",          en: "Travel",                       ta: "பயணம்" },
  { value: "EXAM",            en: "Exam / Education",             ta: "தேர்வு / கல்வி" },
  { value: "MEDICAL",         en: "Medical / Surgery",            ta: "மருத்துவம் / அறுவை சிகிச்சை" },
  { value: "SPIRITUAL",       en: "Spiritual / Puja",             ta: "ஆன்மீகம் / பூஜை" },
];

interface MuhurtaSlot {
  date: string;
  timeStart: string;
  timeEnd: string;
  score: number;
  panchangamSupport: { en: string; ta: string };
  dashaSupport?: { en: string; ta: string } | null;
  horaSupport?: { en: string; ta: string } | null;
  factors?: Array<{ verdict: string; contribution: number; reason: { en: string; ta: string } }>;
  // Retained while the old public-only result renderer is phased out below.
  timeWindow: string;
  tithi: string;
  nakshatra: string;
  quality: "excellent" | "good" | "fair";
  reason: string;
  reasonTa: string;
  cautions: string[];
  cautionsTa: string[];
}

function todayStr(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr: string, lang: "en" | "ta"): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(value: string): string {
  const [hourText, minute = "00"] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? "am" : "pm"}`;
}

function compactCityName(name: string): string {
  return name
    .replace(", Tamil Nadu, India", "")
    .replace(", Karnataka, India", "")
    .replace(", Maharashtra, India", "")
    .replace(", Texas, USA", "");
}

const QUALITY_CONFIG = {
  excellent: {
    en: "Excellent",
    ta: "மிகவும் சிறந்தது",
    color: "var(--cl-muhurta-green)",
    bg: "var(--cl-muhurta-green-bg)",
  },
  good: {
    en: "Good",
    ta: "நல்லது",
    color: "var(--cl-muhurta-caution)",
    bg: "var(--cl-muhurta-caution-bg)",
  },
  fair: {
    en: "Fair",
    ta: "சாதாரணம்",
    color: "var(--cl-ink-2)",
    bg: "var(--cl-surface)",
  },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--cl-border)",
  borderRadius: "8px",
  padding: "9px 12px",
  background: "var(--cl-bg)",
  color: "var(--cl-ink)",
  fontSize: "0.88rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--cl-ink-2)",
};

// ── Whose chart(s) the muhurta is for ────────────────────────────────────────
//
// A wedding has two subjects, and this tool asked for one. Chandrashtama and
// Tara Bala are per-person gates in Tamil practice, so a date clean for the
// groom and Naidhana for the bride is not a wedding muhurtham — it just looked
// like one, because only one of them was ever checked.
//
// Two charts is therefore the DEFAULT for a wedding, and one chart is an
// explicit choice the reader can make (a bride whose match is not yet fixed,
// someone checking a date on a family member's behalf). It is offered rather
// than assumed in either direction.
//
// The role is not decoration. Kalaprakasika Ch. XIV p.79 states its Jupiter
// gochara rule from the BRIDE's Janma-Rasi, so it can only be applied at all
// once the reader has said which chart is hers — including in one-person mode,
// which is why the role selector appears there too.
type PersonDraft = { date: string; time: string; city: CityEntry };
type SubjectRole = "BRIDE" | "GROOM" | "PERSON";

const WEDDING_EVENT = "MARRIAGE";

const emptyPerson = (): PersonDraft => ({ date: "", time: "", city: DEFAULT_CITY });

const ROLE_COPY: Record<SubjectRole, { en: string; ta: string }> = {
  BRIDE: { en: "Bride", ta: "மணமகள்" },
  GROOM: { en: "Groom", ta: "மணமகன்" },
  PERSON: { en: "Prefer not to say", ta: "குறிப்பிட விரும்பவில்லை" },
};

const radioRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const radioChipStyle = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  border: `1.5px solid ${active ? "var(--cl-muhurta-green)" : "var(--cl-border)"}`,
  background: active ? "var(--cl-muhurta-green-bg)" : "var(--cl-bg)",
  color: "var(--cl-ink)",
  borderRadius: "999px",
  padding: "7px 14px",
  fontSize: "0.82rem",
  fontWeight: active ? 700 : 600,
  cursor: "pointer",
});

/**
 * One person's birth details.
 *
 * Every control stays nested inside its own `<label>`. That is what gives these
 * hand-rolled inputs an accessible name at all — see the `[M]` entry for this
 * file in `web/lib/field-style-guard.test.ts`, which exempts the marketing
 * tools from the shared field kit precisely because they already do this.
 * With two identical blocks on screen the legend is load-bearing too: "Birth
 * date" appears twice, and only the fieldset says which one.
 */
function BirthDetailsBlock({
  lang,
  legend,
  value,
  onChange,
}: {
  lang: "en" | "ta";
  legend: string | null;
  value: PersonDraft;
  onChange: (next: PersonDraft) => void;
}) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0, display: "grid", gap: "12px", minWidth: 0 }}>
      {legend !== null && (
        <legend style={{ padding: 0, fontSize: "0.82rem", fontWeight: 700, color: "var(--cl-ink)" }}>
          {legend}
        </legend>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "12px" }}>
        <label style={labelStyle}>
          {lang === "en" ? "Birth date" : "பிறந்த தேதி"}
          <input
            type="date"
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
            style={inputStyle}
            required
          />
        </label>
        <label style={labelStyle}>
          {lang === "en" ? "Birth time" : "பிறந்த நேரம்"}
          <input
            type="time"
            value={value.time}
            onChange={(e) => onChange({ ...value, time: e.target.value })}
            style={inputStyle}
            required
          />
        </label>
      </div>
      <label style={labelStyle}>
        {lang === "en" ? "Birth city" : "பிறந்த ஊர்"}
        <PlaceCombobox
          value={value.city.name}
          lang={lang}
          onChange={(selected, raw) => onChange({ ...value, city: selected ?? { ...value.city, name: raw } })}
        />
      </label>
    </fieldset>
  );
}

export function MuhurtaTool() {
  const [lang] = useLang();
  const [eventType, setEventType] = useState("MARRIAGE");
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(addDaysStr(todayStr(), 14));
  const [city, setCity] = useState<CityEntry>(DEFAULT_CITY);
  const [personA, setPersonA] = useState<PersonDraft>(emptyPerson);
  const [personB, setPersonB] = useState<PersonDraft>(emptyPerson);
  // Two charts is the default for a wedding; one is an explicit choice.
  const [checkBoth, setCheckBoth] = useState(true);
  // Only consulted in one-person wedding mode — in couple mode person A is the
  // bride by construction, which is what the two legends on screen say.
  const [soloRole, setSoloRole] = useState<SubjectRole>("PERSON");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<MuhurtaSlot[] | null>(null);

  const isWedding = eventType === WEDDING_EVENT;
  const couple = isWedding && checkBoth;
  const subjectRole: SubjectRole = couple ? "BRIDE" : isWedding ? soloRole : "PERSON";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSlots(null);
    const toBirth = (person: PersonDraft) => ({
      birthDateLocal: person.date,
      birthTimeLocal: `${person.time}:00`,
      birthLatitude: Number(person.city.lat),
      birthLongitude: Number(person.city.lng),
      birthTimezone: person.city.timezone,
      birthPlace: person.city.name,
    });
    try {
      const response = await getPersonalizedMuhurta({
        birth: toBirth(personA),
        // Omitted rather than sent empty. The backend treats a present
        // `partner` as a request for couple mode, so a blank one would ask for
        // a wedding to be scored against a chart nobody entered.
        ...(couple ? { partner: toBirth(personB) } : {}),
        subjectRole,
        eventType,
        dateFrom,
        dateTo,
        lat: Number(city.lat),
        lng: Number(city.lng),
        timezone: city.timezone,
        place: city.name,
      });
      setSlots(response.data.slots as unknown as MuhurtaSlot[]);
    } catch (err) {
      // The backend's own message, not a blanket "network error". With two
      // birth blocks on screen a 422 names which chart failed ("Groom: …"), and
      // swallowing that leaves the reader guessing which half to correct. Any
      // other status gets the bilingual envelope message instead — a raw
      // "500: /public/muhurta/personalized: …" helps nobody.
      const apiError = getApiError(err);
      setError(
        apiError?.status === 422
          ? readErrorMessage(err)
          : apiError
            ? apiError.message[lang]
            : lang === "en" ? "Network error — please try again." : "நெட்வொர்க் பிழை — மீண்டும் முயற்சிக்கவும்.",
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedEvent = EVENT_TYPES.find((e) => e.value === eventType) ?? EVENT_TYPES[0];
  const slotStarName = (value: string) => romanNakshathiramName(value);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--cl-surface)",
          border: "1.5px solid var(--cl-border)",
          borderRadius: "12px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Event type */}
        <label style={labelStyle}>
          {lang === "en" ? "Event type" : "நிகழ்வு வகை"}
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            style={inputStyle}
          >
            {EVENT_TYPES.map((et) => (
              <option key={et.value} value={et.value}>
                {lang === "en" ? et.en : et.ta}
              </option>
            ))}
          </select>
        </label>

        <div style={{ padding: "14px", background: "var(--cl-brand-tint)", borderRadius: "8px", display: "grid", gap: "14px" }}>
          <strong style={{ fontSize: "0.9rem", color: "var(--cl-ink)" }}>
            {lang === "en" ? "Whose timing is this for?" : "யாருக்கான முகூர்த்தம்?"}
          </strong>

          {isWedding && (
            <fieldset style={{ border: 0, margin: 0, padding: 0, display: "grid", gap: "8px" }}>
              <legend style={{ padding: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--cl-ink-2)" }}>
                {lang === "en" ? "Check the dates against" : "எந்த ஜாதகத்தை வைத்துச் சரிபார்க்க வேண்டும்?"}
              </legend>
              <div style={radioRowStyle}>
                {([true, false] as const).map((both) => (
                  <label key={String(both)} style={radioChipStyle(checkBoth === both)}>
                    <input
                      type="radio"
                      name="muhurta-subject-count"
                      checked={checkBoth === both}
                      onChange={() => setCheckBoth(both)}
                      style={{ accentColor: "var(--cl-muhurta-green)", margin: 0 }}
                    />
                    {both
                      ? (lang === "en" ? "Bride and groom" : "மணமகள் & மணமகன்")
                      : (lang === "en" ? "One person only" : "ஒருவருக்கு மட்டும்")}
                  </label>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--cl-ink-2)", lineHeight: 1.5 }}>
                {couple
                  ? (lang === "en"
                    ? "Both charts are checked. Chandrashtama or an adverse Tara Bala on either side rules the day out — a wedding date is only as good as its harder half."
                    : "இரு ஜாதகங்களும் சரிபார்க்கப்படும். இருவரில் ஒருவருக்குச் சந்திராஷ்டமம் அல்லது கெட்ட தாரா பலம் இருந்தால் அந்நாள் நீக்கப்படும் — இருவரில் பலவீனமான நிலையே முகூர்த்தத்தை முடிவு செய்யும்.")
                  : (lang === "en"
                    ? "Only this chart is checked. For a wedding, the other person's Chandrashtama and Tara Bala are not weighed at all."
                    : "இந்த ஜாதகம் மட்டுமே சரிபார்க்கப்படும். திருமணத்திற்கு மற்றவரின் சந்திராஷ்டமமும் தாரா பலமும் இதில் கணக்கிடப்படாது.")}
              </p>
            </fieldset>
          )}

          <BirthDetailsBlock
            lang={lang}
            legend={couple ? `${ROLE_COPY.BRIDE.ta} · ${ROLE_COPY.BRIDE.en}` : null}
            value={personA}
            onChange={setPersonA}
          />

          {couple && (
            <BirthDetailsBlock
              lang={lang}
              legend={`${ROLE_COPY.GROOM.ta} · ${ROLE_COPY.GROOM.en}`}
              value={personB}
              onChange={setPersonB}
            />
          )}

          {isWedding && !couple && (
            <fieldset style={{ border: 0, margin: 0, padding: 0, display: "grid", gap: "8px" }}>
              <legend style={{ padding: 0, fontSize: "0.78rem", fontWeight: 600, color: "var(--cl-ink-2)" }}>
                {lang === "en" ? "This chart is the" : "இந்த ஜாதகம் யாருடையது?"}
              </legend>
              <div style={radioRowStyle}>
                {(["BRIDE", "GROOM", "PERSON"] as const).map((role) => (
                  <label key={role} style={radioChipStyle(soloRole === role)}>
                    <input
                      type="radio"
                      name="muhurta-solo-role"
                      checked={soloRole === role}
                      onChange={() => setSoloRole(role)}
                      style={{ accentColor: "var(--cl-muhurta-green)", margin: 0 }}
                    />
                    {lang === "en" ? ROLE_COPY[role].en : ROLE_COPY[role].ta}
                  </label>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--cl-ink-2)", lineHeight: 1.5 }}>
                {lang === "en"
                  ? "Kalaprakasika Ch. XIV counts Jupiter's transit from the bride's birth sign, so that rule can only be applied when you say which chart is hers."
                  : "கலப்பிரகாசிகை அத். XIV, குரு பகவானின் சஞ்சாரத்தை மணமகளின் ஜென்ம ராசியிலிருந்து கணக்கிடுகிறது — எனவே அந்த விதி, ஜாதகம் யாருடையது எனச் சொன்னால் மட்டுமே பயன்படும்."}
              </p>
            </fieldset>
          )}

          <span style={{ fontSize: "0.76rem", color: "var(--cl-ink-2)" }}>
            {lang === "en"
              ? "Used only for this calculation; it is not saved."
              : "இந்தக் கணக்கீட்டிற்கு மட்டும் பயன்படுத்தப்படும்; சேமிக்கப்படாது."}
          </span>
        </div>

        {/* Date range */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "12px" }}>
          <label style={labelStyle}>
            {lang === "en" ? "From date" : "தொடக்க நாள்"}
            <input
              type="date"
              value={dateFrom}
              min={todayStr()}
              onChange={(e) => {
                setDateFrom(e.target.value);
                if (dateTo < e.target.value) setDateTo(addDaysStr(e.target.value, 7));
              }}
              style={inputStyle}
              required
            />
          </label>
          <label style={labelStyle}>
            {lang === "en" ? "To date (max 30 days)" : "இறுதி நாள் (அதிகபட்சம் 30 நாட்கள்)"}
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={addDaysStr(dateFrom, 30)}
              onChange={(e) => setDateTo(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
        </div>

        {/* Location */}
        <label style={labelStyle}>
          {lang === "en" ? "Location" : "இடம்"}
          <PlaceCombobox
            value={city.name}
            lang={lang}
            onChange={(selected, raw) => setCity(selected ?? { ...city, name: raw })}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "var(--cl-border)" : "var(--cl-muhurta-green)",
            color: loading ? "var(--cl-ink-2)" : "var(--cl-surface)",
            border: "none",
            borderRadius: "8px",
            padding: "11px 20px",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading
            ? (lang === "en" ? "Finding auspicious slots…" : "சுப நேரங்கள் தேடுகிறோம்…")
            : (lang === "en" ? "Find auspicious muhurtham →" : "சுப முகூர்த்தம் காண்க →")}
        </button>
      </form>

      {error && (
        <p style={{
          marginTop: "16px",
          color: "var(--cl-error)",
          fontSize: "0.85rem",
          background: "var(--cl-error-tint)",
          border: "1px solid var(--cl-error-ring)",
          borderRadius: "8px",
          padding: "10px 14px",
        }}>
          {error}
        </p>
      )}

      {slots !== null && (
        <div style={{ marginTop: "28px" }}>
          {slots.length === 0 ? (
            <p style={{ color: "var(--cl-ink-2)", fontSize: "0.9rem", textAlign: "center" }}>
              {lang === "en"
                ? "No strong muhurtham found in this range. Try extending the date range."
                : "இந்த வரம்பில் சிறந்த முகூர்த்தம் இல்லை. தேதி வரம்பை நீட்டிக்கவும்."}
            </p>
          ) : (
            <>
              <p style={{ fontSize: "0.78rem", color: "var(--cl-ink-2)", marginBottom: "16px" }}>
                {lang === "en"
                  ? `Top ${slots.length} auspicious slots for ${selectedEvent.en} — ${compactCityName(city.name)}`
                  : `${selectedEvent.ta} — ${compactCityName(city.name)} — சிறந்த ${slots.length} சுப நேரங்கள்`}
                {couple && (lang === "en"
                  ? " · checked against both charts"
                  : " · இரு ஜாதகங்களையும் வைத்துச் சரிபார்க்கப்பட்டது")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {slots.map((slot, i) => {
                  if (Number.isFinite(slot.score)) {
                    // Every factor, not just the priced ones. This used to drop
                    // `contribution === 0`, which is fine while each factor is
                    // scored or absent — and wrong the moment a couple is on
                    // screen, because the stood-down half of each pair carries
                    // exactly zero *by design* and is the reading the reader
                    // most needs to see. A panel called "What was weighed" that
                    // hides half of what was weighed is worse than no panel.
                    const weighedFactors = slot.factors ?? [];
                    return (
                      <div key={slot.date} style={{ border: "1.5px solid var(--cl-border)", borderLeft: "4px solid var(--cl-muhurta-green)", borderRadius: "10px", background: "var(--cl-surface)", padding: "16px 20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "baseline", marginBottom: "8px" }}>
                          <strong>{i + 1}. {formatDateDisplay(slot.date, lang)}</strong>
                          <span style={{ color: "var(--cl-muhurta-green)", fontWeight: 700 }}>{slot.score.toFixed(1)} / 100</span>
                        </div>
                        <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--cl-ink)" }}>{lang === "en" ? "Recommended window:" : "பரிந்துரைக்கப்படும் நேரம்:"} {formatTime(slot.timeStart)} – {formatTime(slot.timeEnd)}</p>
                        <p style={{ margin: "0 0 6px", color: "var(--cl-ink-2)" }}>{lang === "en" ? slot.panchangamSupport.en : slot.panchangamSupport.ta}</p>
                        {slot.dashaSupport && <p style={{ margin: "0 0 6px", color: "var(--cl-ink-2)" }}><strong>{lang === "en" ? "Dasha support: " : "தசை ஆதரவு: "}</strong>{lang === "en" ? slot.dashaSupport.en : slot.dashaSupport.ta}</p>}
                        {slot.horaSupport && <p style={{ margin: 0, color: "var(--cl-ink-2)" }}><strong>{lang === "en" ? "Hora: " : "ஹோரை: "}</strong>{lang === "en" ? slot.horaSupport.en : slot.horaSupport.ta}</p>}
                        {weighedFactors.length > 0 && (
                          <details style={{ marginTop: "10px", color: "var(--cl-ink-2)" }}>
                            <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                              {lang === "en" ? "What was weighed" : "பரிசீலிக்கப்பட்டவை"}
                            </summary>
                            <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "grid", gap: "6px" }}>
                              {weighedFactors.map((factor, factorIndex) => (
                                <li
                                  key={factorIndex}
                                  style={{ display: "flex", gap: "10px", alignItems: "baseline", fontSize: "0.82rem" }}
                                >
                                  {/*
                                    The points sit beside the sentence that earned
                                    them. Without them a zero-scored line and a
                                    priced one read identically, and couple mode
                                    puts one of each on screen for every factor.
                                  */}
                                  <span
                                    aria-hidden
                                    style={{
                                      flex: "none",
                                      minWidth: "3.2em",
                                      textAlign: "right",
                                      fontVariantNumeric: "tabular-nums",
                                      fontWeight: 700,
                                      color: factor.contribution > 0
                                        ? "var(--cl-muhurta-green)"
                                        : factor.contribution < 0
                                          ? "var(--cl-caution-ink)"
                                          : "var(--cl-ink-2)",
                                    }}
                                  >
                                    {factor.contribution === 0
                                      ? "—"
                                      : `${factor.contribution > 0 ? "+" : ""}${factor.contribution}`}
                                  </span>
                                  <span>
                                    {/* Spoken, not implied by colour alone. */}
                                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
                                      {factor.contribution === 0
                                        ? (lang === "en" ? "No points. " : "மதிப்பெண் இல்லை. ")
                                        : `${factor.contribution > 0 ? "+" : ""}${factor.contribution} ${lang === "en" ? "points. " : "மதிப்பெண். "}`}
                                    </span>
                                    {lang === "en" ? factor.reason.en : factor.reason.ta}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    );
                  }
                  const qc = QUALITY_CONFIG[slot.quality] ?? QUALITY_CONFIG.fair;
                  return (
                    <div
                      key={slot.date}
                      style={{
                        border: `1.5px solid var(--cl-border)`,
                        borderLeft: `4px solid ${qc.color}`,
                        borderRadius: "10px",
                        background: qc.bg,
                        padding: "16px 20px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                          {i + 1}. {formatDateDisplay(slot.date, lang)}
                        </span>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: qc.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}>
                          {lang === "en" ? qc.en : qc.ta}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--cl-ink)", marginBottom: "4px" }}>
                        {lang === "en" ? "Time window:" : "நேர சாளரம்:"} {slot.timeWindow}
                      </p>
                      <p style={{ fontSize: "0.82rem", color: "var(--cl-ink-2)", marginBottom: "6px" }}>
                        {lang === "en"
                          ? `${slot.tithi} tithi · ${slotStarName(slot.nakshatra)} moon star`
                          : `${slot.tithi} திதி · ${slot.nakshatra} நட்சத்திரம்`}
                      </p>
                      <p style={{ fontSize: "0.82rem", color: "var(--cl-ink)", marginBottom: slot.cautions.length ? "6px" : 0 }}>
                        {lang === "en" ? slot.reason : slot.reasonTa}
                      </p>
                      {slot.cautions.length > 0 && (
                        <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "0.78rem", color: "var(--cl-caution-ink)" }}>
                          {(lang === "en" ? slot.cautions : slot.cautionsTa).map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div style={{
                marginTop: "24px",
                background: "var(--cl-surface)",
                border: "1.5px solid var(--cl-border)",
                borderRadius: "10px",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}>
                <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  {lang === "en"
                    ? "Get muhurtham matched to your birth chart"
                    : "உங்கள் ஜாதகத்துடன் பொருந்திய முகூர்த்தம் பெறுங்கள்"}
                </p>
                <p style={{ fontSize: "0.82rem", color: "var(--cl-ink-2)" }}>
                  {/*
                    This used to say the results were "based on Panchangam alone" and
                    offered birth-chart personalisation as the thing an account adds.
                    That stopped being true when this tool moved onto the personalised
                    endpoint — it already weighs Tara Bala, Chandra Bala, dasha and hora
                    — and couple mode makes the gap plainer still. What an account
                    actually adds is persistence and the surfaces built on a saved chart.
                  */}
                  {lang === "en"
                    ? "These details are used once and not saved. A free Vinaadi account keeps the charts, so you can return to a shortlist, compare dates on the calendar, and see the published almanac muhurtham days ranked for your star — or for both of you."
                    : "இந்தத் தகவல்கள் ஒருமுறை மட்டுமே பயன்படுத்தப்படும்; சேமிக்கப்படாது. இலவச விநாடி கணக்கில் ஜாதகங்கள் சேமிக்கப்படும் — தேர்ந்தெடுத்த நாட்களுக்குத் திரும்பலாம், நாட்காட்டியில் ஒப்பிடலாம், வெளியிடப்பட்ட முகூர்த்த நாட்களை உங்கள் நட்சத்திரத்துக்கோ இருவருக்குமோ ஏற்ப வரிசைப்படுத்திப் பார்க்கலாம்."}
                </p>
                <Link
                  href="/dashboard"
                  style={{
                    display: "inline-block",
                    background: "var(--cl-muhurta-green)",
                    color: "var(--cl-surface)",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    alignSelf: "flex-start",
                  }}
                >
                  {lang === "en" ? "Create free account →" : "இலவச கணக்கை உருவாக்கவும் →"}
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
