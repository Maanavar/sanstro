import { CategoryPage } from "../CategoryPage";
import { localizedCategoryMetadata } from "../calendar-category-api";

// The curated year's page; other years are served by `[event]`.
export const generateMetadata = () => localizedCategoryMetadata("muslim-festivals", 2026);

export default function MuslimFestivalsPage() {
  return <CategoryPage kind="muslim-festivals" year={2026} />;
}
