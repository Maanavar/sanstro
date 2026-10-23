import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideDetailPage } from "@/components/guide-detail-page";
import { TEMPLE_DETAILS, getGuideDetail, guideJsonLd } from "@/lib/guide-detail-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(TEMPLE_DETAILS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = getGuideDetail("temple", slug);
  if (!content) return {};

  return withTamilTwin({
    title: `${content.title.en} - Deity, Blessing & Chart Connection`,
    description: content.lead.en,
    alternates: { canonical: `https://vinaadi.com/temples/${slug}` },
    openGraph: {
      title: `${content.title.en}`,
      description: content.lead.en,
      url: `https://vinaadi.com/temples/${slug}`,
      type: "article",
    },
  }, `/temples/${slug}`);
}

export default async function TempleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const content = getGuideDetail("temple", slug);
  if (!content) notFound();

  const url = `https://vinaadi.com/temples/${slug}`;

  return (
    <>
      <JsonLd en={guideJsonLd(content, url, "en")} ta={guideJsonLd(content, url, "ta")} />
      <GuideDetailPage content={content} />
    </>
  );
}
