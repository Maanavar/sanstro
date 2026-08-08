"use client";

import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { useLang } from "@/components/lang-toggle";
import { tLang, type Lang } from "@/lib/i18n";
import type { CalendarCategoryDetail, CalendarCategorySummary } from "./calendar-category-api";

interface CalendarCategoryContentProps {
  data: CalendarCategoryDetail | null;
  categories: CalendarCategorySummary[];
}

function pick(en: string, ta: string, lang: Lang) {
  return lang === "ta" ? ta : en;
}

function formatLong(iso: string, lang: Lang): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShort(iso: string, lang: Lang): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function tagLabel(tag: string, lang: Lang): string {
  const labels: Record<string, { en: string; ta: string }> = {
    hindu: { en: "Hindu", ta: "இந்து" },
    muslim: { en: "Muslim", ta: "முஸ்லிம்" },
    christian: { en: "Christian", ta: "கிறிஸ்தவம்" },
    tamilnadu_govt: { en: "TN holiday", ta: "தமிழ்நாடு விடுமுறை" },
    indian_govt: { en: "India holiday", ta: "இந்திய அரசு விடுமுறை" },
  };
  const label = labels[tag];
  return label ? pick(label.en, label.ta, lang) : tag.replaceAll("_", " ");
}

export function CalendarCategoryContent({ data, categories }: CalendarCategoryContentProps) {
  const [lang] = useLang();

  if (!data) {
    return (
      <div className="clarity-shell">
        <PublicNav />
        <main>
          <section className="cl-pub-hero">
            <div className="cl-container">
              <p className="cl-eyebrow">{pick("Tamil Calendar", "தமிழ் நாட்காட்டி", lang)}</p>
              <h1 className="cl-pub-h1">{pick("Calendar page is being updated", "நாட்காட்டி பக்கம் புதுப்பிக்கப்படுகிறது", lang)}</h1>
              <p className="cl-pub-lead">
                <Link href="/tamil-calendar">{pick("See all Tamil calendar dates", "அனைத்து தமிழ் நாட்காட்டி தேதிகள்", lang)}</Link>
              </p>
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const activeCategories = categories.length > 0 ? categories : [data];
  const nextDate = data.nextDate ? formatLong(data.nextDate, lang) : null;

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "20px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">
              <Link href="/tamil-calendar" style={{ color: "inherit" }}>
                {pick("Tamil Calendar 2026", "தமிழ் நாட்காட்டி 2026", lang)}
              </Link>{" "}
              &middot; {tLang(data.categoryLabel, lang)}
            </p>
            <h1 className="cl-pub-h1">{tLang(data.title, lang)}</h1>
            <p className="cl-pub-lead" style={{ marginBottom: "14px" }}>{tLang(data.description, lang)}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", fontSize: "0.88rem", color: "var(--cl-muted)" }}>
              <span>
                <strong style={{ color: "var(--cl-ink)" }}>{data.count}</strong>{" "}
                {pick("dates listed", "தேதிகள்", lang)}
              </span>
              {nextDate && (
                <span>
                  {pick("Next:", "அடுத்தது:", lang)} <strong style={{ color: "var(--cl-ink)" }}>{nextDate}</strong>
                </span>
              )}
            </div>
          </div>
        </section>

        {activeCategories.length > 1 && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              background: "var(--cl-surface)",
              borderBottom: "1px solid var(--cl-border)",
              boxShadow: "0 2px 8px var(--shadow-sticky-subtle)",
            }}
          >
            <div className="cl-container" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 0", overflowX: "auto" }}>
              <span style={{ flexShrink: 0, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cl-muted)" }}>
                {pick("Categories:", "வகைகள்:", lang)}
              </span>
              {activeCategories.map((category) => {
                const active = category.slug === data.slug;
                return (
                  <Link
                    key={category.slug}
                    href={`/tamil-calendar/${category.slug}`}
                    style={{
                      flexShrink: 0,
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "0.82rem",
                      fontWeight: active ? 700 : 600,
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                      border: `1.5px solid ${active ? "var(--chart-d1-active)" : "var(--cl-border)"}`,
                      background: active ? "var(--chart-d1-active)" : "var(--cl-bg)",
                      color: active ? "var(--cl-surface)" : "var(--cl-ink)",
                    }}
                  >
                    {tLang(category.categoryLabel, lang)}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <section style={{ paddingBottom: "48px" }}>
          <div className="cl-container">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid var(--cl-border)" }}>
                    <th style={{ padding: "10px 8px" }}>#</th>
                    <th style={{ padding: "10px 8px" }}>{pick("Date", "தேதி", lang)}</th>
                    <th style={{ padding: "10px 8px" }}>{pick("Weekday", "கிழமை", lang)}</th>
                    <th style={{ padding: "10px 8px" }}>{pick("Festival / holiday", "பண்டிகை / விடுமுறை", lang)}</th>
                    <th style={{ padding: "10px 8px" }}>{pick("Type", "வகை", lang)}</th>
                    <th style={{ padding: "10px 8px" }}>{pick("Panchangam", "பஞ்சாங்கம்", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((event, index) => (
                    <tr key={`${event.date}-${event.name.en}`} style={{ borderBottom: "1px solid var(--cl-border)" }}>
                      <td style={{ padding: "10px 8px", color: "var(--cl-muted)" }}>{index + 1}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 700, whiteSpace: "nowrap" }}>{formatShort(event.date, lang)}</td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{tLang(event.weekday, lang)}</td>
                      <td style={{ padding: "10px 8px", minWidth: "220px" }}>
                        <div style={{ fontWeight: 700, color: "var(--cl-ink)" }}>{tLang(event.name, lang)}</div>
                        {event.note && (
                          <div style={{ marginTop: "3px", fontSize: "0.8rem", color: "var(--cl-muted)", lineHeight: 1.35 }}>
                            {tLang(event.note, lang)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", minWidth: "160px" }}>
                          {event.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                minHeight: "24px",
                                padding: "3px 8px",
                                borderRadius: "999px",
                                background: "var(--cl-neutral-mid)",
                                border: "1px solid var(--cl-neutral-ring)",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "var(--cl-neutral-ink)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {tagLabel(tag, lang)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                        <Link href={`/panchangam/${event.date}`} style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                          {pick("View day", "நாள் பார்க்க", lang)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ marginTop: "18px", color: "var(--cl-muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>
              {tLang(data.source, lang)}
            </p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
