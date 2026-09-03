import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideDetailPage } from "@/components/guide-detail-page";
import { DOSHAM_DETAILS, DRAFT_GUIDE_SLUGS, getGuideDetail, guideJsonLd } from "@/lib/guide-detail-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Draft, not-yet-reviewed slugs (DRAFT_GUIDE_SLUGS) are excluded here so this
// public, search-indexed route never surfaces unreviewed astrology content —
// see DRAFT_GUIDE_SLUGS's own doc comment. The signed-in dashboard's "Full
// dosham guide" card reads DOSHAM_DETAILS directly and is unaffected.
export function generateStaticParams() {
  return Object.keys(DOSHAM_DETAILS)
    .filter((slug) => !DRAFT_GUIDE_SLUGS.has(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (DRAFT_GUIDE_SLUGS.has(slug)) return {};
  const content = getGuideDetail("dosham", slug);
  if (!content) return {};

  return {
    title: `${content.title.en} - Meaning, Chart Check & Pariharam | Vinaadi`,
    description: content.lead.en,
    alternates: { canonical: `https://vinaadi.com/dosham/${slug}` },
    openGraph: {
      title: `${content.title.en} | Vinaadi`,
      description: content.lead.en,
      url: `https://vinaadi.com/dosham/${slug}`,
      type: "article",
    },
  };
}

export default async function DoshamDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (DRAFT_GUIDE_SLUGS.has(slug)) notFound();
  const content = getGuideDetail("dosham", slug);
  if (!content) notFound();

  const jsonLd = guideJsonLd(content, `https://vinaadi.com/dosham/${slug}`);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideDetailPage content={content} />
    </>
  );
}
