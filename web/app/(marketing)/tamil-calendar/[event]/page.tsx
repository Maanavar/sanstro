import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { eventFaqLd, eventItemListLd } from "../calendar-jsonld";
import { withTamilTwin } from "@/lib/localized-metadata";
import { calendarEventTa, tamilCalendarTa } from "@/lib/marketing-seo-ta";
import {
  TamilCalendarEventContent,
  type EventDetail,
  type EventSummary,
} from "./TamilCalendarEventContent";
import { backendUrl } from "@/lib/backend-url";
import {
  TAMIL_CALENDAR_EVENT_KEYS,
  calendarYearNow,
  eventSlug,
  parseEventSlug,
  promotedCalendarYears,
} from "@/lib/tamil-calendar-years";
import { notFound } from "next/navigation";

interface EventsList {
  year: number;
  source: string;
  events: EventSummary[];
}

async function fetchEvent(slug: string, year: number): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${backendUrl()}/api/v1/public/panchangam-events/${slug}?year=${year}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as EventDetail;
  } catch {
    return null;
  }
}

async function fetchEvents(year: number): Promise<EventSummary[]> {
  try {
    const res = await fetch(`${backendUrl()}/api/v1/public/panchangam-events?year=${year}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return ((await res.json()) as EventsList).events ?? [];
  } catch {
    return [];
  }
}

// This year and next are built ahead; last year renders on first visit
// (dynamicParams), and any other year is a 404 from the page itself.
export function generateStaticParams() {
  return promotedCalendarYears().flatMap((year) =>
    TAMIL_CALENDAR_EVENT_KEYS.map((key) => ({ event: eventSlug(key, year) })),
  );
}

function fmtShort(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Props = { params: Promise<{ event: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { event } = await params;
  const parsed = parseEventSlug(event);
  const year = parsed?.year ?? calendarYearNow();
  const data = parsed ? await fetchEvent(event, year) : null;
  // A backend hiccup must not hand the crawler the homepage's canonical: this
  // branch is what Google indexes if the fetch fails while it visits.
  if (!data) {
    return withTamilTwin(
      { title: `Tamil Calendar ${year}`, alternates: { canonical: `https://vinaadi.com/tamil-calendar/${event}` } },
      `/tamil-calendar/${event}`,
      { title: `தமிழ் நாட்காட்டி ${year}`, description: tamilCalendarTa(year).description },
    );
  }

  const next = data.nextDate ? `Next: ${fmtShort(data.nextDate)}.` : "";
  const title = `${data.name.en} ${data.year} Dates (${data.name.ta}) - All ${data.count} Dates`;
  const description = `${data.name.en} (${data.name.ta}) ${data.year}: all ${data.count} dates with weekday and Tamil date. ${data.summary.en} ${next}`.slice(0, 300);

  return withTamilTwin(
    {
      title,
      description,
      keywords: data.keywords,
      alternates: { canonical: `https://vinaadi.com/tamil-calendar/${data.slug}` },
      openGraph: {
        title: `${data.name.en} ${data.year} - All Dates`,
        description: data.summary.en,
        url: `https://vinaadi.com/tamil-calendar/${data.slug}`,
        type: "website",
      },
    },
    `/tamil-calendar/${data.slug}`,
    calendarEventTa(data.name.ta, data.year, data.count, data.summary.ta),
  );
}

export default async function EventPage({ params }: Props) {
  const { event } = await params;
  const parsed = parseEventSlug(event);
  if (!parsed) notFound();
  const [data, allEvents] = await Promise.all([fetchEvent(event, parsed.year), fetchEvents(parsed.year)]);
  const currentYear = calendarYearNow();

  return (
    <>
      {data && <JsonLd en={eventFaqLd(data, "en")} ta={eventFaqLd(data, "ta")} />}
      {data && <JsonLd en={eventItemListLd(data, "en")} ta={eventItemListLd(data, "ta")} />}
      <TamilCalendarEventContent
        data={data}
        allEvents={allEvents}
        year={parsed.year}
        currentYear={currentYear}
        nextYear={promotedCalendarYears().find((y) => y > currentYear) ?? null}
        eventKey={parsed.key}
      />
    </>
  );
}
