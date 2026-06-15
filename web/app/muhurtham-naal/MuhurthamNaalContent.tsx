"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import {
  fetchPublicMuhurthamNaals,
  type MuhurthamNaalItem,
} from "@/lib/muhurtham-naal";
import { readErrorMessage } from "@/lib/api";

const YEAR = 2026;

const MONTHS: { value: number; en: string; ta: string }[] = [
  { value: 0, en: "All months", ta: "எல்லா மாதங்கள்" },
  { value: 1, en: "January", ta: "ஜனவரி" },
  { value: 2, en: "February", ta: "பிப்ரவரி" },
  { value: 3, en: "March", ta: "மார்ச்" },
  { value: 4, en: "April", ta: "ஏப்ரல்" },
  { value: 5, en: "May", ta: "மே" },
  { value: 6, en: "June", ta: "ஜூன்" },
  { value: 7, en: "July", ta: "ஜூலை" },
  { value: 8, en: "August", ta: "ஆகஸ்ட்" },
  { value: 9, en: "September", ta: "செப்டம்பர்" },
  { value: 10, en: "October", ta: "அக்டோபர்" },
  { value: 11, en: "November", ta: "நவம்பர்" },
  { value: 12, en: "December", ta: "டிசம்பர்" },
];

const PIRAI_OPTIONS = [
  { value: "", en: "All", ta: "அனைத்தும்" },
  { value: "VALARPIRAI", en: "Valarpirai (waxing)", ta: "வளர்பிறை" },
  { value: "THEIPIRAI", en: "Theipirai (waning)", ta: "தேய்பிறை" },
];

function formatGregorian(iso: string, lang: "en" | "ta"): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MuhurthamNaalContent() {
  const [lang] = useLang();
  const [all, setAll] = useState<MuhurthamNaalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [month, setMonth] = useState(0);
  const [pirai, setPirai] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublicMuhurthamNaals(YEAR)
      .then((res) => {
        if (!active) return;
        setAll(res.naals);
        setError(null);
      })
      .catch((e) => {
        if (active) setError(readErrorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return all.filter((n) => {
      if (month !== 0 && new Date(n.date + "T00:00:00").getMonth() + 1 !== month) return false;
      if (pirai && n.pirai.en.toUpperCase().indexOf(pirai === "VALARPIRAI" ? "VALAR" : "THEI") === -1) return false;
      return true;
    });
  }, [all, month, pirai]);

  const t = (en: string, ta: string) => (lang === "en" ? en : ta);

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        {/* HERO */}
        <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
          <div className="cl-container cl-pub-hero__inner">
            <div className="cl-pub-hero__copy">
              <p className="cl-eyebrow">{t("2026 Almanac", "2026 பஞ்சாங்கம்")}</p>
              <h1 className="cl-pub-h1" style={{ maxWidth: "24ch" }}>
                {t("2026 Tamil Muhurtham Naal (Wedding Dates)", "2026 திருமண முகூர்த்த நாட்கள்")}
              </h1>
              <p className="cl-pub-lead">
                {t(
                  "The full published almanac list of auspicious wedding dates for 2026 — with weekday, Tamil date, pirai, nakshatra and nalla neram for each day.",
                  "2026-ஆம் ஆண்டுக்கான திருமண சுப முகூர்த்த நாட்களின் முழுப் பட்டியல் — ஒவ்வொரு நாளுக்கும் கிழமை, தமிழ் தேதி, பிறை, நட்சத்திரம், நல்ல நேரத்துடன்.",
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Filters + list */}
        <section style={{ paddingBottom: "48px" }}>
          <div className="cl-container">
            <div className="cl-filter-bar">
              <label className="cl-filter-field">
                <span>{t("Month", "மாதம்")}</span>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="cl-select">
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {t(m.en, m.ta)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="cl-filter-field">
                <span>{t("Pirai (moon phase)", "பிறை")}</span>
                <select value={pirai} onChange={(e) => setPirai(e.target.value)} className="cl-select">
                  {PIRAI_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {t(p.en, p.ta)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="cl-filter-count">
                {t(`${filtered.length} dates`, `${filtered.length} நாட்கள்`)}
              </div>
            </div>

            {loading && <p>{t("Loading muhurtham dates…", "முகூர்த்த நாட்கள் ஏற்றப்படுகிறது…")}</p>}
            {error && (
              <p style={{ color: "#b00020" }}>
                {t("Could not load dates: ", "நாட்களை ஏற்ற முடியவில்லை: ")}
                {error}
              </p>
            )}

            {!loading && !error && (
              <div style={{ overflowX: "auto" }}>
                <table className="cl-cal-table">
                  <thead>
                    <tr>
                      <th>{t("Date", "தேதி")}</th>
                      <th>{t("Weekday", "கிழமை")}</th>
                      <th>{t("Tamil date", "தமிழ் தேதி")}</th>
                      <th>{t("Pirai", "பிறை")}</th>
                      <th>{t("Nakshatra", "நட்சத்திரம்")}</th>
                      <th>{t("Nalla neram", "நல்ல நேரம்")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((n) => (
                      <tr key={n.date}>
                        <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                          {formatGregorian(n.date, lang)}
                        </td>
                        <td>
                          {n.weekday.en} <span className="cl-cal-ta">· {n.weekday.ta}</span>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {n.tamilMonth.en} {n.tamilDay}{" "}
                          <span className="cl-cal-ta">({n.tamilMonth.ta} {n.tamilDay})</span>
                        </td>
                        <td>
                          {n.pirai.en} <span className="cl-cal-ta">· {n.pirai.ta}</span>
                        </td>
                        <td>
                          {n.nakshatra.en} <span className="cl-cal-ta">({n.nakshatra.ta})</span>
                        </td>
                        <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                          {n.nallaNeram.map((w) => `${w.start}–${w.end}`).join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p style={{ padding: "16px 0" }}>{t("No dates for this filter.", "இந்த வடிகட்டலுக்கு நாட்கள் இல்லை.")}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA — personalised matching */}
        <section className="cl-cta-strip">
          <div className="cl-container cl-cta-strip__inner">
            <div>
              <h2 className="cl-cta-strip__title">
                {t(
                  "Which of these dates best suit your star?",
                  "இவற்றில் உங்கள் நட்சத்திரத்துக்கு ஏற்றது எது?",
                )}
              </h2>
              <p className="cl-cta-strip__body">
                {t(
                  "Sign in and we'll rank these almanac dates for your birth chart using Tara Bala (star strength) and Chandrashtama checks.",
                  "உள்நுழைந்தால், தாரா பலம் (நட்சத்திர பலம்) மற்றும் சந்திராஷ்டமம் ஆகியவற்றை வைத்து உங்கள் ஜாதகத்துக்கு ஏற்ற நாட்களை வரிசைப்படுத்துகிறோம்.",
                )}
              </p>
            </div>
            <Link href="/dashboard" className="cl-btn cl-btn--solid">
              {t("Match to my chart →", "என் ஜாதகத்துக்கு பொருத்து →")}
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
