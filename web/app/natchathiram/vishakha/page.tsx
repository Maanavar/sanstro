import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { VISHAKHA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: VISHAKHA.meta.title,
  description: VISHAKHA.meta.description,
  keywords: VISHAKHA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/vishakha" },
  openGraph: {
    title: VISHAKHA.meta.title,
    description: VISHAKHA.meta.description,
    url: "https://vinaadi.com/natchathiram/vishakha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: VISHAKHA.meta.title,
    description: VISHAKHA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: VISHAKHA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: VISHAKHA.meta.title,
  description: VISHAKHA.meta.description,
  url: "https://vinaadi.com/natchathiram/vishakha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function VishakhaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={VISHAKHA} />
    </>
  );
}
