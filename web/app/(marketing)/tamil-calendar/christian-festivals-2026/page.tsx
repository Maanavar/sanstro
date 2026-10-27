import { CategoryPage } from "../CategoryPage";
import { localizedCategoryMetadata } from "../calendar-category-api";

// The curated year's page; other years are served by `[event]`.
export const generateMetadata = () => localizedCategoryMetadata("christian-festivals", 2026);

export default function ChristianFestivalsPage() {
  return <CategoryPage kind="christian-festivals" year={2026} />;
}
