import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { eventFaqLd, eventItemListLd } from "../calendar-jsonld";
import { withTamilTwin } from "@/lib/localized-metadata";
import { TAMIL_CALENDAR_TA, calendarEventTa } from "@/lib/marketing-seo-ta";
import {
  TamilCalendarEventContent,
  type EventDetail,
  type EventSummary,
} from "./TamilCalendarEventContent";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const YEAR = 2026;

const EVENT_KEYS = [
  "pournami",
  "amavasai",
  "pradosham",
  "ekadhasi",
  "sankatahara-chathurthi",
  "chathurthi",
  "sashti",
  "ashtami",
  "navami",
  "karthigai",
  "thiruvonam",
  "maadha-sivarathiri",
  "chandra-darisanam",
  "karinaal",
] as const;

interface EventsList {
  year: number;
  source: string;
  events: EventSummary[];
}

async function fetchEvent(slug: string): Promise<EventDetail | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/public/panchangam-events/${slug}?year=${YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as EventDetail;
  } catch {
    return null;
  }
}

async function fetchEvents(): Promise<EventSummary[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/public/panchangam-events?year=${YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return ((await res.json()) as EventsList).events ?? [];
  } catch {
    return [];
  }
}

export function generateStaticParams() {
  return EVENT_KEYS.map((key) => ({ event: `${key}-${YEAR}` }));
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
  const data = await fetchEvent(event);
  // A backend hiccup must not hand the crawler the homepage's canonical: this
  // branch is what Google indexes if the fetch fails while it visits.
  if (!data) {
    return withTamilTwin(
      { title: "Tamil Calendar 2026", alternates: { canonical: `https://vinaadi.com/tamil-calendar/${event}` } },
      `/tamil-calendar/${event}`,
      { title: "தமிழ் நாட்காட்டி 2026", description: TAMIL_CALENDAR_TA.description },
    );
  }

  const next = data.nextDate ? `Next: ${fmtShort(data.nextDate)}.` : "";
  const title = `${data.name.en} 2026 Dates (${data.name.ta}) - All ${data.count} Dates`;
  const description = `${data.name.en} (${data.name.ta}) 2026: all ${data.count} dates with weekday and Tamil date. ${data.summary.en} ${next}`.slice(0, 300);

  return withTamilTwin(
    {
      title,
      description,
      keywords: data.keywords,
      alternates: { canonical: `https://vinaadi.com/tamil-calendar/${data.slug}` },
      openGraph: {
        title: `${data.name.en} 2026 - All Dates`,
        description: data.summary.en,
        url: `https://vinaadi.com/tamil-calendar/${data.slug}`,
        type: "website",
      },
    },
    `/tamil-calendar/${data.slug}`,
    calendarEventTa(data.name.ta, data.count, data.summary.ta),
  );
}

export default async function EventPage({ params }: Props) {
  const { event } = await params;
  const [data, allEvents] = await Promise.all([fetchEvent(event), fetchEvents()]);

  return (
    <>
      {data && <JsonLd en={eventFaqLd(data, "en")} ta={eventFaqLd(data, "ta")} />}
      {data && <JsonLd en={eventItemListLd(data, "en")} ta={eventItemListLd(data, "ta")} />}
      <TamilCalendarEventContent data={data} allEvents={allEvents} />
    </>
  );
}
