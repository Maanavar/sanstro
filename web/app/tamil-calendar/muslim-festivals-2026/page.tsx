import { CalendarCategoryContent } from "../CalendarCategoryContent";
import {
  fetchCalendarCategories,
  fetchCalendarCategory,
  metadataForCategory,
} from "../calendar-category-api";

const SLUG = "muslim-festivals-2026" as const;

export const metadata = metadataForCategory(SLUG);

export default async function MuslimFestivalsPage() {
  const [data, categories] = await Promise.all([
    fetchCalendarCategory(SLUG),
    fetchCalendarCategories(),
  ]);

  const itemListJsonld = data
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: data.title.en,
        numberOfItems: data.count,
        itemListElement: data.events.map((event, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${event.name.en} - ${event.date}`,
          url: `https://vinaadi.com/panchangam/${event.date}`,
        })),
      }
    : null;

  return (
    <>
      {itemListJsonld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonld) }} />}
      <CalendarCategoryContent data={data} categories={categories} />
    </>
  );
}
