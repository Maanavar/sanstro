import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";
import { PublicNav } from "@/components/public-nav";
import { getServerLang } from "@/lib/server-lang";
import { tLang, type Lang } from "@/lib/i18n";

interface BiText {
  ta: string;
  en: string;
}

export interface EventSummary {
  key: string;
  slug: string;
  name: BiText;
  category: string;
  count: number;
  nextDate: string | null;
}

interface EventDate {
  date: string;
  weekday: BiText;
  tamilDate: BiText;
  tamilMonth: BiText;
  tamilDay: number;
}

export interface EventDetail {
  year: number;
  source: string;
  key: string;
  slug: string;
  name: BiText;
  tagline: BiText;
  category: string;
  summary: BiText;
  significance: BiText;
  keywords: string[];
  count: number;
  nextDate: string | null;
  dates: EventDate[];
}

interface TamilCalendarEventContentProps {
  data: EventDetail | null;
  allEvents: EventSummary[];
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

// F7 part two - a Server Component; see lib/server-lang.ts.
export async function TamilCalendarEventContent({ data, allEvents }: TamilCalendarEventContentProps) {
  const lang = await getServerLang();

  if (!data) {
    return (
      <div className="clarity-shell">
        <PublicNav />
        <main>
          <section className="cl-pub-hero">
            <div className="cl-container">
              <h1 className="cl-pub-h1">
                {pick("Tamil Calendar 2026", "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf 2026", lang)}
              </h1>
              <p className="cl-pub-lead">
                {pick(
                  "This page is being updated.",
                  "\u0b87\u0ba8\u0bcd\u0ba4 \u0baa\u0b95\u0bcd\u0b95\u0bae\u0bcd \u0baa\u0bc1\u0ba4\u0bc1\u0baa\u0bcd\u0baa\u0bbf\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1.",
                  lang,
                )}{" "}
                <Link href="/tamil-calendar">
                  {pick("See all special days", "\u0b85\u0ba9\u0bc8\u0ba4\u0bcd\u0ba4\u0bc1 \u0bb5\u0bbf\u0b9a\u0bc7\u0b9f \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd", lang)}
                </Link>
              </p>
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const isCaution = data.category === "INAUSPICIOUS";
  const accent = isCaution ? "var(--planet-saturn)" : "var(--panel-brand)";
  const navEvents = allEvents.length > 0 ? allEvents : [{
    slug: data.slug,
    name: data.name,
    category: data.category,
    key: data.key,
    count: data.count,
    nextDate: data.nextDate,
  }];
  const currentIdx = navEvents.findIndex((event) => event.slug === data.slug);
  const prevEvent = currentIdx > 0 ? navEvents[currentIdx - 1] : null;
  const nextEvent = currentIdx >= 0 && currentIdx < navEvents.length - 1 ? navEvents[currentIdx + 1] : null;
  const eventName = tLang(data.name, lang);

  const faq = [
    {
      q: pick(`When is the next ${eventName} in 2026?`, `2026-\u0bb2\u0bcd \u0b85\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4 ${eventName} \u0b8e\u0baa\u0bcd\u0baa\u0bcb\u0ba4\u0bc1?`, lang),
      a: data.nextDate
        ? pick(
            `The next ${eventName} is on ${formatLong(data.nextDate, lang)}.`,
            `\u0b85\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4 ${eventName}: ${formatLong(data.nextDate, lang)}.`,
            lang,
          )
        : pick(
            `All ${eventName} dates for 2026 have passed; see the full list above.`,
            `2026-\u0b95\u0bcd\u0b95\u0bbe\u0ba9 ${eventName} \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd \u0bae\u0bc1\u0b9f\u0bbf\u0ba8\u0bcd\u0ba4\u0bc1\u0bb5\u0bbf\u0b9f\u0bcd\u0b9f\u0ba9; \u0bae\u0bc1\u0bb4\u0bc1 \u0baa\u0b9f\u0bcd\u0b9f\u0bbf\u0baf\u0bb2\u0bc8 \u0bae\u0bc7\u0bb2\u0bc7 \u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd.`,
            lang,
          ),
    },
    {
      q: pick(`How many ${eventName} days are there in 2026?`, `2026-\u0bb2\u0bcd ${eventName} \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd \u0b8e\u0ba4\u0bcd\u0ba4\u0ba9\u0bc8?`, lang),
      a: pick(
        `There are ${data.count} ${eventName} dates in 2026.`,
        `2026-\u0bb2\u0bcd ${data.count} ${eventName} \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd \u0b89\u0bb3\u0bcd\u0bb3\u0ba9.`,
        lang,
      ),
    },
    {
      q: pick(`What is ${eventName}?`, `${eventName} \u0b8e\u0ba9\u0bcd\u0bb1\u0bbe\u0bb2\u0bcd \u0b8e\u0ba9\u0bcd\u0ba9?`, lang),
      a: `${tLang(data.summary, lang)} ${tLang(data.significance, lang)}`,
    },
  ];

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>
        <section className="cl-pub-hero" style={{ paddingBottom: "16px" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">
              <Link href="/tamil-calendar" style={{ color: "inherit" }}>
                {pick("Tamil Calendar 2026", "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf 2026", lang)}
              </Link>{" "}
              &middot; {eventName}
            </p>
            <h1 className="cl-pub-h1">
              {pick(`${eventName} 2026 Dates`, `${eventName} 2026 \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd`, lang)}
            </h1>
            <p className="cl-pub-lead" style={{ marginBottom: "12px" }}>
              {tLang(data.summary, lang)}
            </p>

            {data.nextDate && (
              <div
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  background: isCaution ? "var(--cl-brand-tint)" : "var(--cl-neutral-tint)",
                  border: `1.5px solid ${isCaution ? "var(--cl-brand-edge)" : "var(--cl-border-2)"}`,
                }}
              >
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cl-muted)" }}>
                  {pick(`Next ${eventName}`, `\u0b85\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4 ${eventName}`, lang)}
                </div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: accent }}>{formatLong(data.nextDate, lang)}</div>
              </div>
            )}
          </div>
        </section>

        {navEvents.length > 1 && (
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
                {pick("Jump to:", "\u0bae\u0bbe\u0bb1\u0bc1\u0b95:", lang)}
              </span>
              {navEvents.map((event) => {
                const isActive = event.slug === data.slug;
                const caution = event.category === "INAUSPICIOUS";
                return (
                  <Link
                    key={event.slug}
                    href={`/tamil-calendar/${event.slug}`}
                    style={{
                      flexShrink: 0,
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontSize: "0.82rem",
                      fontWeight: isActive ? 700 : 600,
                      whiteSpace: "nowrap",
                      textDecoration: "none",
                      border: `1.5px solid ${isActive ? accent : (caution ? "var(--cl-brand-edge)" : "var(--cl-border)")}`,
                      background: isActive ? accent : (caution ? "var(--member-alert-bg)" : "var(--cl-bg)"),
                      color: isActive ? "var(--cl-surface)" : "var(--cl-ink)",
                    }}
                  >
                    {tLang(event.name, lang)}
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
                    <th style={{ padding: "8px" }}>#</th>
                    <th style={{ padding: "8px" }}>{pick("Date", "\u0ba4\u0bc7\u0ba4\u0bbf", lang)}</th>
                    <th style={{ padding: "8px" }}>{pick("Weekday", "\u0b95\u0bbf\u0bb4\u0bae\u0bc8", lang)}</th>
                    <th style={{ padding: "8px" }}>{pick("Tamil date", "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd \u0ba4\u0bc7\u0ba4\u0bbf", lang)}</th>
                    <th style={{ padding: "8px" }}>{pick("Panchangam", "\u0baa\u0b9e\u0bcd\u0b9a\u0bbe\u0b99\u0bcd\u0b95\u0bae\u0bcd", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dates.map((date, index) => (
                    <tr key={date.date} style={{ borderBottom: "1px solid var(--cl-border)" }}>
                      <td style={{ padding: "8px", color: "var(--cl-muted)" }}>{index + 1}</td>
                      <td style={{ padding: "8px", fontWeight: 600, whiteSpace: "nowrap" }}>{formatShort(date.date, lang)}</td>
                      <td style={{ padding: "8px" }}>{tLang(date.weekday, lang)}</td>
                      <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{tLang(date.tamilDate, lang)}</td>
                      <td style={{ padding: "8px" }}>
                        <Link href={`/panchangam/${date.date}`} style={{ fontSize: "0.85rem" }}>
                          {pick("View panchangam", "\u0baa\u0b9e\u0bcd\u0b9a\u0bbe\u0b99\u0bcd\u0b95\u0bae\u0bcd \u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95", lang)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <h2 className="cl-section-h2">{pick(`About ${eventName}`, `${eventName} \u0baa\u0bb1\u0bcd\u0bb1\u0bbf`, lang)}</h2>
            <p>{tLang(data.summary, lang)}</p>
            <p>{tLang(data.significance, lang)}</p>

            <h2 className="cl-section-h2" style={{ marginTop: "2rem" }}>
              {pick("Frequently asked questions", "\u0b85\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0b9f\u0bbf \u0b95\u0bc7\u0b9f\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0bae\u0bcd \u0b95\u0bc7\u0bb3\u0bcd\u0bb5\u0bbf\u0b95\u0bb3\u0bcd", lang)}
            </h2>
            <div style={{ maxWidth: "760px" }}>
              {faq.map((item, index) => (
                <details key={item.q} className="cl-faq-item" open={index === 0}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>

            <div className="cl-pub-related-links" style={{ marginTop: "1.5rem" }}>
              {prevEvent && (
                <Link href={`/tamil-calendar/${prevEvent.slug}`} className="cl-pub-related-link">
                  &larr; {tLang(prevEvent.name, lang)} 2026
                </Link>
              )}
              {nextEvent && (
                <Link href={`/tamil-calendar/${nextEvent.slug}`} className="cl-pub-related-link">
                  {tLang(nextEvent.name, lang)} 2026 &rarr;
                </Link>
              )}
              <Link href="/tamil-calendar" className="cl-pub-related-link">
                {pick("All Tamil calendar 2026 days", "\u0b85\u0ba9\u0bc8\u0ba4\u0bcd\u0ba4\u0bc1 \u0ba4\u0bae\u0bbf\u0bb4\u0bcd \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf 2026 \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd", lang)}
              </Link>
              <Link href="/muhurtham-naal" className="cl-pub-related-link">
                {pick("Wedding muhurtham dates", "\u0ba4\u0bbf\u0bb0\u0bc1\u0bae\u0ba3 \u0bae\u0bc1\u0b95\u0bc2\u0bb0\u0bcd\u0ba4\u0bcd\u0ba4 \u0ba8\u0bbe\u0b9f\u0bcd\u0b95\u0bb3\u0bcd", lang)}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
