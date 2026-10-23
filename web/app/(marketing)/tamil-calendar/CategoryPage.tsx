import { notFound } from "next/navigation";
import { CalendarCategoryContent } from "./CalendarCategoryContent";
import { JsonLd } from "@/lib/json-ld";
import { categoryItemListLd } from "./calendar-jsonld";
import { fetchCalendarCategories, fetchCalendarCategory, type CalendarCategoryKind } from "./calendar-category-api";

/** One festival / holiday category page: the curated 2026 routes and every
 *  other year's (through `[event]`) render through here. A page the backend
 *  does not publish is a 404, not an indexable "being updated" page. */
export async function CategoryPage({ kind, year }: { kind: CalendarCategoryKind; year: number }) {
  const [data, categories] = await Promise.all([fetchCalendarCategory(kind, year), fetchCalendarCategories(year)]);
  if (data === "missing") notFound();

  return (
    <>
      {data && <JsonLd en={categoryItemListLd(data, "en")} ta={categoryItemListLd(data, "ta")} />}
      <CalendarCategoryContent data={data} categories={categories} />
    </>
  );
}
