import { notFound } from "next/navigation";
import { MUHURTHAM_NAAL_YEARS } from "@/lib/muhurtham-naal";
import { MuhurthamNaalContent } from "../MuhurthamNaalContent";
import { jsonLdForMuhurthamYear, metadataForMuhurthamYear } from "../page";

type PageProps = {
  params: Promise<{ year: string }>;
};

function parseYear(value: string): number | null {
  const year = Number(value);
  return MUHURTHAM_NAAL_YEARS.includes(year as (typeof MUHURTHAM_NAAL_YEARS)[number]) ? year : null;
}

export function generateStaticParams() {
  return MUHURTHAM_NAAL_YEARS.map((year) => ({ year: String(year) }));
}

export async function generateMetadata({ params }: PageProps) {
  const { year: yearParam } = await params;
  const year = parseYear(yearParam);
  if (!year) return {};
  return metadataForMuhurthamYear(year, `/muhurtham-naal/${year}`);
}

export default async function MuhurthamNaalYearPage({ params }: PageProps) {
  const { year: yearParam } = await params;
  const year = parseYear(yearParam);
  if (!year) notFound();
  const jsonLd = jsonLdForMuhurthamYear(year, `/muhurtham-naal/${year}`);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MuhurthamNaalContent year={year} />
    </>
  );
}
