import type { Metadata } from "next";
import { withTamilTwin } from "@/lib/localized-metadata";
import { calendarCategoryTa } from "@/lib/marketing-seo-ta";
import { backendUrl } from "@/lib/backend-url";
import { servedCalendarYears } from "@/lib/tamil-calendar-years";

/**
 * Festival / holiday category pages, `{kind}-{year}` (`hindu-festivals-2027`).
 *
 * Mirrors `app/services/calendar_category_service.py`: every kind has a page in
 * the curated year; Hindu (the engine's festivals) and Christian (computed from
 * Easter) have one in every year; Muslim (moon sighting) and the Tamil Nadu
 * government list exist only where a published list does. The backend answers
 * 404 for a kind it has no list for, and the page follows it.
 */
export const CURATED_CATEGORY_YEAR = 2026;

export const CALENDAR_CATEGORY_KINDS = [
  "hindu-festivals",
  "muslim-festivals",
  "christian-festivals",
  "tamil-nadu-government-holidays",
] as const;

export type CalendarCategoryKind = (typeof CALENDAR_CATEGORY_KINDS)[number];

/** Kinds with a page in every year, not only the curated one. */
const COMPUTED_KINDS: readonly CalendarCategoryKind[] = ["hindu-festivals", "christian-festivals"];

export function categoryKindsFor(year: number): readonly CalendarCategoryKind[] {
  return year === CURATED_CATEGORY_YEAR ? CALENDAR_CATEGORY_KINDS : COMPUTED_KINDS;
}

export function categorySlug(kind: CalendarCategoryKind, year: number): string {
  return `${kind}-${year}`;
}

/** `hindu-festivals-2027` -> `{ kind, year }`; null for anything the web does not serve. */
export function parseCategorySlug(
  slug: string,
  now: Date = new Date(),
): { kind: CalendarCategoryKind; year: number } | null {
  const match = /^([a-z-]+)-(\d{4})$/.exec(slug);
  if (!match) return null;
  const kind = CALENDAR_CATEGORY_KINDS.find((k) => k === match[1]);
  const year = Number(match[2]);
  if (!kind || !categoryKindsFor(year).includes(kind)) return null;
  // The curated year's pages are static routes and stay up; any other year
  // follows the event pages' window (last, this and next year).
  if (year !== CURATED_CATEGORY_YEAR && !servedCalendarYears(now).includes(year)) return null;
  return { kind, year };
}

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

const CATEGORY_META: Record<CalendarCategoryKind, (year: number) => { title: string; description: string; keywords: string[] }> = {
  "hindu-festivals": (year) => ({
    title: `Hindu Festivals ${year} - Tamil Calendar Dates`,
    description: `Complete Hindu festival dates for ${year} with Tamil names, weekday, notes and panchangam links.`,
    keywords: [`hindu festivals ${year}`, `tamil festival dates ${year}`, `pongal ${year}`, `deepavali ${year}`],
  }),
  "muslim-festivals": (year) => ({
    title: `Muslim Festivals ${year} - Ramzan, Bakrid, Muharram Dates`,
    description: `Muslim festival dates for ${year} including Ramzan, Bakrid, Muharram, Hijri New Year and Milad-un-Nabi.`,
    keywords: [`muslim festivals ${year}`, `ramzan ${year}`, `bakrid ${year}`, `milad un nabi ${year}`],
  }),
  "christian-festivals": (year) => ({
    title: `Christian Festivals ${year} - Easter, Good Friday, Christmas`,
    description: `Christian festival and observance dates for ${year} including Lent, Holy Week, Easter and Christmas.`,
    keywords: [`christian festivals ${year}`, `good friday ${year}`, `easter ${year}`, `christmas ${year}`],
  }),
  "tamil-nadu-government-holidays": (year) => ({
    title: `Tamil Nadu Government Holidays ${year} - Public Holiday List`,
    description: `Tamil Nadu government public holidays for ${year} with dates, weekdays, Tamil names and panchangam links.`,
    keywords: [`tamil nadu government holidays ${year}`, `tn public holidays ${year}`, `bank holidays tamil nadu ${year}`],
  }),
};

export function metadataForCategory(kind: CalendarCategoryKind, year: number): Metadata {
  const meta = CATEGORY_META[kind](year);
  const url = `https://vinaadi.com/tamil-calendar/${categorySlug(kind, year)}`;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: url },
    openGraph: { title: meta.title, description: meta.description, url, type: "website" },
  };
}

/** `metadataForCategory` with its Tamil twin (GRW-06). */
export async function localizedCategoryMetadata(kind: CalendarCategoryKind, year: number): Promise<Metadata> {
  return withTamilTwin(
    metadataForCategory(kind, year),
    `/tamil-calendar/${categorySlug(kind, year)}`,
    calendarCategoryTa(kind, year),
  );
}

/** The page's data; `"missing"` when the backend publishes no such page (a
 *  404 for the page too), null when it could not be reached (the page shows
 *  "being updated" rather than vanishing from the index). */
export async function fetchCalendarCategory(
  kind: CalendarCategoryKind,
  year: number,
): Promise<CalendarCategoryDetail | "missing" | null> {
  try {
    const slug = categorySlug(kind, year);
    const res = await fetch(`${backendUrl()}/api/v1/public/calendar-categories/${slug}?year=${year}`, {
      next: { revalidate: 3600 },
    });
    if (res.status === 404) return "missing";
    if (!res.ok) return null;
    return (await res.json()) as CalendarCategoryDetail;
  } catch {
    return null;
  }
}

/** The category pages the backend publishes for `year`; empty when it has none. */
export async function fetchCalendarCategories(year: number): Promise<CalendarCategorySummary[]> {
  try {
    const res = await fetch(`${backendUrl()}/api/v1/public/calendar-categories?year=${year}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { categories?: CalendarCategorySummary[] };
    return body.categories ?? [];
  } catch {
    return [];
  }
}
