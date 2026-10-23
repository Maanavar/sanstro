import type { Ld } from "@/lib/json-ld";
import { taUrl } from "@/lib/ta-routes";
import { SITE_URL } from "@vinaadi/shared/constants";
import type { CalendarCategoryDetail, CalendarCategorySummary } from "./calendar-category-api";
import type { EventSummary } from "./TamilCalendarContent";
import type { EventDetail } from "./[event]/TamilCalendarEventContent";

// Structured data for the Tamil calendar pages, one language per call (GRW-06).
// Every name below comes from the backend's bilingual fields; the only Tamil
// written here is the glue in the FAQ questions, which is short and marked draft
// in docs/GROWTH_READINESS_REVIEW_2026-09-26.md until a Tamil reader has seen it.

type Lang = "en" | "ta";

const dateLong = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const dateShort = (iso: string, lang: Lang) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const site = (path: string, lang: Lang) => (lang === "ta" ? taUrl(`${SITE_URL}${path}`) : `${SITE_URL}${path}`);

/** ItemList for one curated category page (Hindu / Muslim / Christian / TN government). */
export function categoryItemListLd(data: CalendarCategoryDetail, lang: Lang): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: data.title[lang],
    numberOfItems: data.count,
    itemListElement: data.events.map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${event.name[lang]} - ${event.date}`,
      url: site(`/panchangam/${event.date}`, lang),
    })),
  };
}

/** CollectionPage for the `/tamil-calendar` hub. */
export function calendarHubLd(
  categories: readonly CalendarCategorySummary[],
  events: readonly EventSummary[],
  lang: Lang,
  hubName: string,
  year: number,
): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: hubName,
    url: site("/tamil-calendar", lang),
    hasPart: [
      ...categories.map((category) => ({
        "@type": "WebPage",
        name: category.title[lang],
        url: site(`/tamil-calendar/${category.slug}`, lang),
      })),
      ...events.map((event) => ({
        "@type": "WebPage",
        name: `${event.name[lang]} ${year}`,
        url: site(`/tamil-calendar/${event.slug}`, lang),
      })),
    ],
  };
}

/** The three-question FAQ for one recurring event ("Pournami 2027"). */
export function eventFaqLd(data: EventDetail, lang: Lang): Ld {
  const name = data.name[lang];
  const year = data.year;
  const next = data.nextDate ? dateLong(data.nextDate, lang) : null;
  const q =
    lang === "ta"
      ? [
          {
            q: `${year}-ல் அடுத்த ${name} எப்போது?`,
            a: next
              ? `அடுத்த ${name} ${next} அன்று.`
              : `${year}-க்கான ${name} தேதிகள் அனைத்தும் முடிந்துவிட்டன; முழுப் பட்டியலை மேலே காணலாம்.`,
          },
          { q: `${year}-ல் ${name} எத்தனை நாட்கள் உள்ளன?`, a: `${year}-ல் ${data.count} ${name} நாட்கள் உள்ளன.` },
          { q: `${name} என்றால் என்ன?`, a: `${data.summary.ta} ${data.significance.ta}` },
        ]
      : [
          {
            q: `When is the next ${name} in ${year}?`,
            a: next
              ? `The next ${name} is on ${next}.`
              : `All ${name} dates for ${year} have passed; see the full list above.`,
          },
          { q: `How many ${name} days are there in ${year}?`, a: `There are ${data.count} ${name} dates in ${year}.` },
          { q: `What is ${name} (${data.name.ta})?`, a: `${data.summary.en} ${data.significance.en}` },
        ];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: q.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** The dated ItemList for one recurring event. */
export function eventItemListLd(data: EventDetail, lang: Lang): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: lang === "ta" ? `${data.name.ta} ${data.year} தேதிகள்` : `${data.name.en} ${data.year} Dates`,
    numberOfItems: data.count,
    itemListElement: data.dates.map((date, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${data.name[lang]} - ${dateShort(date.date, lang)}`,
    })),
  };
}
