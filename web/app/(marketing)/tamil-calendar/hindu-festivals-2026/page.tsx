import { CategoryPage } from "../CategoryPage";
import { localizedCategoryMetadata } from "../calendar-category-api";

// The curated year's page; other years are served by `[event]`.
export const generateMetadata = () => localizedCategoryMetadata("hindu-festivals", 2026);

export default function HinduFestivalsPage() {
  return <CategoryPage kind="hindu-festivals" year={2026} />;
}
