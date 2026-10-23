import { CategoryPage } from "../CategoryPage";
import { localizedCategoryMetadata } from "../calendar-category-api";

// The curated year's page; other years are served by `[event]`.
export const generateMetadata = () => localizedCategoryMetadata("tamil-nadu-government-holidays", 2026);

export default function TamilNaduGovernmentHolidaysPage() {
  return <CategoryPage kind="tamil-nadu-government-holidays" year={2026} />;
}
