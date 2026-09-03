type Lang = "en" | "ta";

export function formatTimeLang(iso: string, lang: Lang): string {
  try {
    if (/^\d{2}:\d{2}/.test(iso)) return iso.slice(0, 5);
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const locale = lang === "ta" ? "ta-IN" : "en-IN";
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return iso;
  }
}

export function formatDateLang(date: Date, lang: Lang): string {
  const locale = lang === "ta" ? "ta-IN" : "en-IN";
  return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}
