import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { calendarHubLd } from "./calendar-jsonld";
import { withTamilTwin } from "@/lib/localized-metadata";
import { TAMIL_CALENDAR_TA } from "@/lib/marketing-seo-ta";
import { TamilCalendarContent, type EventSummary } from "./TamilCalendarContent";
import { fetchCalendarCategories, type CalendarCategorySummary } from "./calendar-category-api";
import { backendUrl } from "@/lib/backend-url";

const YEAR = 2026;

interface EventsList {
  year: number;
  source: string;
  events: EventSummary[];
}

async function fetchEvents(): Promise<EventsList | null> {
  try {
    const res = await fetch(`${backendUrl()}/api/v1/public/panchangam-events?year=${YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as EventsList;
  } catch {
    return null;
  }
}

const EN_METADATA: Metadata = {
  title: "Tamil Calendar 2026 - Pournami, Amavasai, Pradosham, Ekadhasi Dates",
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

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/tamil-calendar", TAMIL_CALENDAR_TA);
}

export default async function TamilCalendarHub() {
  const [data, categories] = await Promise.all([fetchEvents(), fetchCalendarCategories()]);
  const events = data?.events ?? [];


  return (
    <>
      <JsonLd
        en={calendarHubLd(categories, events, "en", "Tamil Calendar 2026 - Special Days")}
        ta={calendarHubLd(categories, events, "ta", TAMIL_CALENDAR_TA.title)}
      />
      <TamilCalendarContent events={events} categories={categories} />
    </>
  );
}
