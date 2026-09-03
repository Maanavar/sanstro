import type { Metadata } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
export const CALENDAR_CATEGORY_YEAR = 2026;

export const CALENDAR_CATEGORY_SLUGS = [
  "hindu-festivals-2026",
  "muslim-festivals-2026",
  "christian-festivals-2026",
  "tamil-nadu-government-holidays-2026",
] as const;

export type CalendarCategorySlug = (typeof CALENDAR_CATEGORY_SLUGS)[number];

export interface BiText {
  ta: string;
  en: string;
}

export interface CalendarCategorySummary {
  slug: string;
  year: number;
  title: BiText;
  description: BiText;
  categoryLabel: BiText;
  source: BiText;
  count: number;
  nextDate: string | null;
}

export interface CalendarCategoryEvent {
  date: string;
  weekday: BiText;
  name: BiText;
  tags: string[];
  note: BiText | null;
}

export interface CalendarCategoryDetail extends CalendarCategorySummary {
  events: CalendarCategoryEvent[];
}

export const CATEGORY_META: Record<CalendarCategorySlug, { title: string; description: string; keywords: string[] }> = {
  "hindu-festivals-2026": {
    title: "Hindu Festivals 2026 - Tamil Calendar Dates | Vinaadi",
    description: "Complete Hindu festival dates for 2026 with Tamil names, weekday, notes and panchangam links.",
    keywords: ["hindu festivals 2026", "tamil festival dates 2026", "pongal 2026", "deepavali 2026"],
  },
  "muslim-festivals-2026": {
    title: "Muslim Festivals 2026 - Ramzan, Bakrid, Muharram Dates | Vinaadi",
    description: "Muslim festival dates for 2026 including Ramzan, Bakrid, Muharram, Hijri New Year and Milad-un-Nabi.",
    keywords: ["muslim festivals 2026", "ramzan 2026", "bakrid 2026", "milad un nabi 2026"],
  },
  "christian-festivals-2026": {
    title: "Christian Festivals 2026 - Easter, Good Friday, Christmas | Vinaadi",
    description: "Christian festival and observance dates for 2026 including Lent, Holy Week, Easter and Christmas.",
    keywords: ["christian festivals 2026", "good friday 2026", "easter 2026", "christmas 2026"],
  },
  "tamil-nadu-government-holidays-2026": {
    title: "Tamil Nadu Government Holidays 2026 - Public Holiday List | Vinaadi",
    description: "Tamil Nadu government public holidays for 2026 with dates, weekdays, Tamil names and panchangam links.",
    keywords: ["tamil nadu government holidays 2026", "tn public holidays 2026", "bank holidays tamil nadu 2026"],
  },
};

export function metadataForCategory(slug: CalendarCategorySlug): Metadata {
  const meta = CATEGORY_META[slug];
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: `https://vinaadi.com/tamil-calendar/${slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://vinaadi.com/tamil-calendar/${slug}`,
      type: "website",
    },
  };
}

export async function fetchCalendarCategory(slug: CalendarCategorySlug): Promise<CalendarCategoryDetail | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/public/calendar-categories/${slug}?year=${CALENDAR_CATEGORY_YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as CalendarCategoryDetail;
  } catch {
    return null;
  }
}

export async function fetchCalendarCategories(): Promise<CalendarCategorySummary[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/public/calendar-categories?year=${CALENDAR_CATEGORY_YEAR}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { categories?: CalendarCategorySummary[] };
    return body.categories ?? [];
  } catch {
    return [];
  }
}
