import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { getServerLang } from "@/lib/server-lang";
import { tLang, type Lang } from "@/lib/i18n";
import type { CalendarCategorySummary } from "./calendar-category-api";

interface BiText {
  ta: string;
  en: string;
}

export interface EventSummary {
  key: string;
  slug: string;
  name: BiText;
  tagline: BiText;
  category: string;
  count: number;
  nextDate: string | null;
}

interface TamilCalendarContentProps {
  events: EventSummary[];
  categories: CalendarCategorySummary[];
}

function pick(en: string, ta: string, lang: Lang) {
  return lang === "ta" ? ta : en;
}

function formatDate(iso: string, lang: Lang): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// F7 part two - a Server Component; see lib/server-lang.ts.
export async function TamilCalendarContent({ events, categories }: TamilCalendarContentProps) {
  const lang = await getServerLang();

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "24px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">
              {pick("Tamil Calendar", "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf", lang)}
            </p>
            <h1 className="cl-pub-h1">
              {pick(
                "Tamil Calendar 2026 - Special Days & Dates",
                "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf 2026 - \u0bb5\u0bbf\u0b9a\u0bc7\u0b9f \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd",
                lang,
              )}
            </h1>
            <p className="cl-pub-lead">
              {pick(
                "Every Pournami, Amavasai, Pradosham, Ekadhasi and more for 2026 - with the next upcoming date, weekday and Tamil date.",
                "2026-\u0b95\u0bcd\u0b95\u0bbe\u0ba9 \u0baa\u0bcc\u0bb0\u0bcd\u0ba3\u0bae\u0bbf, \u0b85\u0bae\u0bbe\u0bb5\u0bbe\u0b9a\u0bc8, \u0baa\u0bbf\u0bb0\u0ba4\u0bcb\u0bb7\u0bae\u0bcd, \u0b8f\u0b95\u0bbe\u0ba4\u0b9a\u0bbf \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0bae\u0bb1\u0bcd\u0bb1 \u0bb5\u0bbf\u0b9a\u0bc7\u0b9f \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bbf\u0ba9\u0bcd \u0baa\u0b9f\u0bcd\u0b9f\u0bbf\u0baf\u0bb2\u0bcd.",
                lang,
              )}
            </p>
          </div>
        </section>

        <section style={{ paddingBottom: "56px" }}>
          <div className="cl-container">
            {categories.length > 0 && (
              <div style={{ marginBottom: "34px" }}>
                <h2 className="cl-section-h2" style={{ marginTop: 0 }}>
                  {pick("Festival & holiday categories", "பண்டிகை மற்றும் விடுமுறை வகைகள்", lang)}
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/tamil-calendar/${category.slug}`}
                      style={{
                        display: "block",
                        padding: "16px 18px",
                        borderRadius: "14px",
                        border: "1.5px solid var(--cl-border)",
                        background: "var(--cl-surface)",
                        textDecoration: "none",
                        color: "var(--cl-ink)",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "1.02rem" }}>{tLang(category.categoryLabel, lang)}</div>
                      <div style={{ fontSize: "0.82rem", color: "var(--cl-muted-2)", margin: "6px 0 10px", lineHeight: 1.35 }}>
                        {tLang(category.description, lang)}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--cl-ink-2)" }}>
                        <strong>{category.count}</strong>{" "}
                        {pick("dates in 2026", "தேதிகள் - 2026", lang)}
                        {category.nextDate && (
                          <>
                            {" "}
                            &middot; {pick("next:", "அடுத்தது:", lang)} <strong>{formatDate(category.nextDate, lang)}</strong>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {events.length === 0 ? (
              <p>
                {pick(
                  "Calendar is being updated. Please check back soon.",
                  "\u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf \u0baa\u0bc1\u0ba4\u0bc1\u0baa\u0bcd\u0baa\u0bbf\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1. \u0bb5\u0bbf\u0bb0\u0bc8\u0bb5\u0bbf\u0bb2\u0bcd \u0bae\u0bc0\u0ba3\u0bcd\u0b9f\u0bc1\u0bae\u0bcd \u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd.",
                  lang,
                )}
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "16px",
                }}
              >
                {events.map((event) => (
                  <Link
                    key={event.slug}
                    href={`/tamil-calendar/${event.slug}`}
                    style={{
                      display: "block",
                      padding: "18px 20px",
                      borderRadius: "14px",
                      border: event.category === "INAUSPICIOUS" ? "1.5px solid var(--cl-inauspicious-border)" : "1.5px solid var(--cl-border)",
                      background: event.category === "INAUSPICIOUS" ? "var(--cl-inauspicious-bg)" : "var(--cl-surface)",
                      textDecoration: "none",
                      color: "var(--cl-ink)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{tLang(event.name, lang)}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--cl-muted-2)", margin: "6px 0 10px" }}>
                      {tLang(event.tagline, lang)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--cl-ink-2)" }}>
                      <strong>{event.count}</strong>{" "}
                      {pick("dates in 2026", "\u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd - 2026", lang)}
                      {event.nextDate && (
                        <>
                          {" "}
                          &middot; {pick("next:", "\u0b85\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0ba4\u0bc1:", lang)} <strong>{formatDate(event.nextDate, lang)}</strong>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
