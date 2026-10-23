import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { calendarHubLd } from "./calendar-jsonld";
import { withTamilTwin } from "@/lib/localized-metadata";
import { tamilCalendarTa } from "@/lib/marketing-seo-ta";
import { TamilCalendarContent, type EventSummary } from "./TamilCalendarContent";
import { fetchCalendarCategories } from "./calendar-category-api";
import { backendUrl } from "@/lib/backend-url";
import { calendarYearNow, promotedCalendarYears } from "@/lib/tamil-calendar-years";

interface EventsList {
  year: number;
  source: string;
  events: EventSummary[];
}

async function fetchEvents(year: number): Promise<EventsList | null> {
  try {
    const res = await fetch(`${backendUrl()}/api/v1/public/panchangam-events?year=${year}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as EventsList;
  } catch {
    return null;
  }
}

function enMetadata(year: number): Metadata {
  return {
    title: `Tamil Calendar ${year} - Pournami, Amavasai, Pradosham, Ekadhasi Dates`,
    description:
      `Full ${year} Tamil calendar of special days - Pournami (full moon), Amavasai (new moon), Pradosham, Ekadhasi, Sankatahara Chathurthi, Karthigai, Sashti, Sivarathiri and Karinaal - with every date, weekday and Tamil date.`,
    keywords: [
      `tamil calendar ${year}`,
      `pournami ${year}`,
      `amavasai ${year}`,
      `pradosham ${year}`,
      `ekadhasi ${year}`,
      `sankatahara chathurthi ${year}`,
      `karthigai ${year}`,
      `tamil festival dates ${year}`,
    ],
    alternates: { canonical: "https://vinaadi.com/tamil-calendar" },
    openGraph: {
      title: `Tamil Calendar ${year} - All Special Days & Dates`,
      description: `Pournami, Amavasai, Pradosham, Ekadhasi and every special Tamil-calendar day for ${year}, with dates and Tamil months.`,
      url: "https://vinaadi.com/tamil-calendar",
      type: "website",
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const year = calendarYearNow();
  return withTamilTwin(enMetadata(year), "/tamil-calendar", tamilCalendarTa(year));
}

// The hub is always this year (in India). Its fetches revalidate hourly, so on
// 1 January it turns over within the hour without a redeploy.
export default async function TamilCalendarHub() {
  const year = calendarYearNow();
  const nextYear = promotedCalendarYears().find((y) => y > year) ?? null;
  // Categories are curated per year (2026 only today, FCA-07); a year without
  // them gets none rather than last year's.
  const [data, categories] = await Promise.all([fetchEvents(year), fetchCalendarCategories(year)]);
  const events = data?.events ?? [];

  return (
    <>
      <JsonLd
        en={calendarHubLd(categories, events, "en", `Tamil Calendar ${year} - Special Days`, year)}
        ta={calendarHubLd(categories, events, "ta", tamilCalendarTa(year).title, year)}
      />
      <TamilCalendarContent events={events} categories={categories} year={year} nextYear={nextYear} />
    </>
  );
}
