import type { Metadata } from "next";
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

function fmt(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
  if (!data) return { title: "Tamil Calendar 2026 | Vinaadi" };

  const next = data.nextDate ? `Next: ${fmtShort(data.nextDate)}.` : "";
  const title = `${data.name.en} 2026 Dates (${data.name.ta}) - All ${data.count} Dates | Vinaadi`;
  const description = `${data.name.en} (${data.name.ta}) 2026: all ${data.count} dates with weekday and Tamil date. ${data.summary.en} ${next}`.slice(0, 300);

  return {
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
  };
}

export default async function EventPage({ params }: Props) {
  const { event } = await params;
  const [data, allEvents] = await Promise.all([fetchEvent(event), fetchEvents()]);

  const faqJsonld = data
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `When is the next ${data.name.en} in 2026?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: data.nextDate
                ? `The next ${data.name.en} is on ${fmt(data.nextDate)}.`
                : `All ${data.name.en} dates for 2026 have passed; see the full list above.`,
            },
          },
          {
            "@type": "Question",
            name: `How many ${data.name.en} days are there in 2026?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `There are ${data.count} ${data.name.en} dates in 2026.`,
            },
          },
          {
            "@type": "Question",
            name: `What is ${data.name.en} (${data.name.ta})?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `${data.summary.en} ${data.significance.en}`,
            },
          },
        ],
      }
    : null;

  const itemListJsonld = data
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${data.name.en} 2026 Dates`,
        numberOfItems: data.count,
        itemListElement: data.dates.map((date, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${data.name.en} - ${fmtShort(date.date)}`,
        })),
      }
    : null;

  return (
    <>
      {faqJsonld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonld) }} />}
      {itemListJsonld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonld) }} />}
      <TamilCalendarEventContent data={data} allEvents={allEvents} />
    </>
  );
}
