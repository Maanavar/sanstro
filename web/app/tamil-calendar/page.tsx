import type { Metadata } from "next";
import { TamilCalendarContent, type EventSummary } from "./TamilCalendarContent";
import { fetchCalendarCategories, type CalendarCategorySummary } from "./calendar-category-api";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const YEAR = 2026;

interface EventsList {
  year: number;
  source: string;
  events: EventSummary[];
}

async function fetchEvents(): Promise<EventsList | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/public/panchangam-events?year=${YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as EventsList;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Tamil Calendar 2026 - Pournami, Amavasai, Pradosham, Ekadhasi Dates | Vinaadi",
  description:
    "Full 2026 Tamil calendar of special days - Pournami (full moon), Amavasai (new moon), Pradosham, Ekadhasi, Sankatahara Chathurthi, Karthigai, Sashti, Sivarathiri and Karinaal - with every date, weekday and Tamil date.",
  keywords: [
    "tamil calendar 2026",
    "pournami 2026",
    "amavasai 2026",
    "pradosham 2026",
    "ekadhasi 2026",
    "sankatahara chathurthi 2026",
    "karthigai 2026",
    "tamil festival dates 2026",
  ],
  alternates: { canonical: "https://vinaadi.com/tamil-calendar" },
  openGraph: {
    title: "Tamil Calendar 2026 - All Special Days & Dates",
    description: "Pournami, Amavasai, Pradosham, Ekadhasi and every special Tamil-calendar day for 2026, with dates and Tamil months.",
    url: "https://vinaadi.com/tamil-calendar",
    type: "website",
  },
};

export default async function TamilCalendarHub() {
  const [data, categories] = await Promise.all([fetchEvents(), fetchCalendarCategories()]);
  const events = data?.events ?? [];

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tamil Calendar 2026 - Special Days",
    url: "https://vinaadi.com/tamil-calendar",
    hasPart: [...categories.map((category: CalendarCategorySummary) => ({
      "@type": "WebPage",
      name: category.title.en,
      url: `https://vinaadi.com/tamil-calendar/${category.slug}`,
    })), ...events.map((event) => ({
      "@type": "WebPage",
      name: `${event.name.en} 2026`,
      url: `https://vinaadi.com/tamil-calendar/${event.slug}`,
    }))],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <TamilCalendarContent events={events} categories={categories} />
    </>
  );
}
