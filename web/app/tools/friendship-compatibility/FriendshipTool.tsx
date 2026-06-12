"use client";

import { useState } from "react";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { PlaceCombobox } from "@/components/place-combobox";
import { apiFetchJson } from "@/lib/api";
import type { CityEntry } from "@/lib/tn-cities";
import { FriendshipResultCard, type FriendshipReport } from "@/components/friendship-result-card";

type Lang = "ta" | "en";

interface PersonForm {
  name: string;
  date: string;
  time: string;
  place: string;
  lat: string;
  lng: string;
  tz: string;
}

const emptyPerson = (): PersonForm => ({ name: "", date: "", time: "", place: "", lat: "", lng: "", tz: "Asia/Kolkata" });

export function FriendshipTool() {
  const lang: Lang = "ta";
  const [p1, setP1] = useState<PersonForm>(emptyPerson());
  const [p2, setP2] = useState<PersonForm>(emptyPerson());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FriendshipReport | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  function setPerson(which: 1 | 2, patch: Partial<PersonForm>) {
    (which === 1 ? setP1 : setP2)((prev) => ({ ...prev, ...patch }));
  }

  function onPlace(which: 1 | 2, city: CityEntry | null, raw: string) {
    if (city) setPerson(which, { place: city.name, lat: city.lat, lng: city.lng, tz: city.timezone });
    else setPerson(which, { place: raw });
  }

  function validate(): string | null {
    for (const [p, n] of [[p1, lang === "ta" ? "நபர் 1" : "Person 1"], [p2, lang === "ta" ? "நபர் 2" : "Person 2"]] as const) {
      if (!p.name.trim()) return `${n}: ${lang === "ta" ? "பெயர் தேவை" : "name required"}`;
      if (!p.date) return `${n}: ${lang === "ta" ? "பிறந்த தேதி தேவை" : "birth date required"}`;
      if (!p.lat || !p.lng) return `${n}: ${lang === "ta" ? "ஊரைத் தேர்ந்தெடுக்கவும்" : "select a place"}`;
    }
    return null;
  }

  async function submit() {
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const body = (p: PersonForm) => ({
        displayName: p.name.trim(),
        birthDateLocal: p.date,
        birthTimeLocal: p.time || null,
        birthLatitude: parseFloat(p.lat),
        birthLongitude: parseFloat(p.lng),
        birthTimezone: p.tz,
        birthPlace: p.place,
      });
      const result = await apiFetchJson<FriendshipReport>("/api/v1/public/friendship-compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personA: body(p1), personB: body(p2) }),
      });
      setReport(result);
      setOpenSection(result.sections[0]?.key ?? null);
    } catch {
      setError(lang === "ta" ? "முடிவைப் பெற முடியவில்லை. விவரங்களைச் சரிபார்க்கவும்." : "Couldn't generate the report. Please check the details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">Friends & Compatibility · நட்பு பொருத்தம்</p>
            <h1 className="cl-pub-h1" style={{ maxWidth: "20ch" }}>
              {lang === "ta" ? "உங்கள் நட்பு பாணியைக் கண்டறியுங்கள்" : "Find your friendship style"}
            </h1>
            <p className="cl-pub-lead" style={{ maxWidth: "54ch" }}>
              {lang === "ta"
                ? "இரு நபர்களின் பிறப்பு விவரங்களை உள்ளிட்டு, நட்சத்திர அடிப்படையிலான நட்பு பொருத்தத்தைப் பாருங்கள் — எப்போதும் நேர்மறையாக."
                : "Enter two people's birth details for a nakshatra-based friendship report — always positively framed."}
            </p>
          </div>
        </section>

        <section style={{ paddingBottom: "64px" }}>
          <div className="cl-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {([1, 2] as const).map((which) => {
                const p = which === 1 ? p1 : p2;
                return (
                  <div key={which} style={{ background: "var(--cl-surface, #fff)", border: "1px solid var(--cl-border, #E4DBC8)", borderRadius: "16px", padding: "18px 20px" }}>
                    <p style={{ margin: "0 0 12px", fontWeight: 700, color: "var(--cl-ink, #3D352B)" }}>
                      {lang === "ta" ? `நபர் ${which}` : `Person ${which}`}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <Field label={lang === "ta" ? "பெயர்" : "Name"}>
                        <input value={p.name} onChange={(e) => setPerson(which, { name: e.target.value })} style={inputStyle} placeholder={lang === "ta" ? "பெயர்" : "Name"} />
                      </Field>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <Field label={lang === "ta" ? "பிறந்த தேதி" : "Birth date"}>
                          <input type="date" value={p.date} onChange={(e) => setPerson(which, { date: e.target.value })} style={inputStyle} />
                        </Field>
                        <Field label={lang === "ta" ? "நேரம் (விருப்பம்)" : "Time (optional)"}>
                          <input type="time" value={p.time} onChange={(e) => setPerson(which, { time: e.target.value })} style={inputStyle} />
                        </Field>
                      </div>
                      <Field label={lang === "ta" ? "ஊர்" : "Place"}>
                        <PlaceCombobox value={p.place} onChange={(city, raw) => onPlace(which, city, raw)} />
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <p style={{ color: "#A8482F", fontSize: "0.9rem" }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading}
                style={{ padding: "13px 34px", borderRadius: "999px", border: "none", background: "var(--cl-ink, #1A1612)", color: "var(--cl-bg, #FBF7EF)", fontWeight: 700, fontSize: "1rem", cursor: loading ? "wait" : "pointer" }}
              >
                {loading ? (lang === "ta" ? "கணக்கிடுகிறது…" : "Calculating…") : (lang === "ta" ? "எங்கள் நட்பு பாணியைக் கண்டறி" : "Find Our Friendship Style")}
              </button>
            </div>

            {report && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "8px" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#B85A2C" }}>
                    {report.scoreRange}
                  </p>
                  <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display, serif)", fontSize: "clamp(2rem, 5vw, 3rem)", color: "var(--cl-ink, #1A1612)" }}>
                    {lang === "ta" ? report.band.ta : report.band.en}
                  </h2>
                  <p style={{ margin: "0 auto", maxWidth: "52ch", color: "var(--cl-ink-2, #5a4f42)", lineHeight: 1.6 }}>
                    {lang === "ta" ? report.headline.ta : report.headline.en}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {report.sections.map((s) => (
                    <div key={s.key} style={{ border: "1px solid var(--cl-border, #E4DBC8)", borderRadius: "12px", overflow: "hidden", background: "var(--cl-surface, #fff)" }}>
                      <button
                        type="button"
                        onClick={() => setOpenSection((cur) => (cur === s.key ? null : s.key))}
                        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "transparent", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", color: "var(--cl-ink, #1A1612)", fontFamily: "inherit" }}
                      >
                        <span>{lang === "ta" ? s.title.ta : s.title.en}</span>
                        <span>{openSection === s.key ? "−" : "+"}</span>
                      </button>
                      {openSection === s.key && (
                        <p style={{ margin: 0, padding: "0 18px 16px", color: "var(--cl-ink-2, #5a4f42)", lineHeight: 1.6, fontSize: "0.92rem" }}>
                          {lang === "ta" ? s.text.ta : s.text.en}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "center", paddingTop: "8px" }}>
                  <FriendshipResultCard report={report} lang={lang} />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: "10px",
  border: "1.5px solid #E4DBC8", background: "#fff", color: "#3D352B", fontSize: "0.875rem", fontFamily: "inherit", outline: "none",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
      <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7A6F5E" }}>{label}</span>
      {children}
    </label>
  );
}
