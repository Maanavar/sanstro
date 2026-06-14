import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideDetailPage } from "@/components/guide-detail-page";
import { PARIHARAM_DETAILS, getGuideDetail, guideJsonLd } from "@/lib/guide-detail-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(PARIHARAM_DETAILS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = getGuideDetail("pariharam", slug);
  if (!content) return {};

  return {
    title: `${content.title.en} - Reason, Chart Connection & Remedies | Vinaadi`,
    description: content.lead.en,
    alternates: { canonical: `https://vinaadi.com/pariharam/${slug}` },
    openGraph: {
      title: `${content.title.en} | Vinaadi`,
      description: content.lead.en,
      url: `https://vinaadi.com/pariharam/${slug}`,
      type: "article",
    },
  };
}

export default async function PariharamDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const content = getGuideDetail("pariharam", slug);
  if (!content) notFound();

  const jsonLd = guideJsonLd(content, `https://vinaadi.com/pariharam/${slug}`);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideDetailPage content={content} />
    </>
  );
}
