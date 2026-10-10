import { CalendarCategoryContent } from "../CalendarCategoryContent";
import { JsonLd } from "@/lib/json-ld";
import { categoryItemListLd } from "../calendar-jsonld";
import {
  fetchCalendarCategories,
  fetchCalendarCategory,
  localizedCategoryMetadata,
} from "../calendar-category-api";

const SLUG = "christian-festivals-2026" as const;

export const generateMetadata = () => localizedCategoryMetadata(SLUG);

export default async function ChristianFestivalsPage() {
  const [data, categories] = await Promise.all([
    fetchCalendarCategory(SLUG),
    fetchCalendarCategories(),
  ]);


  return (
    <>
      {data && <JsonLd en={categoryItemListLd(data, "en")} ta={categoryItemListLd(data, "ta")} />}
      <CalendarCategoryContent data={data} categories={categories} />
    </>
  );
}
