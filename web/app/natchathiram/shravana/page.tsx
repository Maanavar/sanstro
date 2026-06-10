import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { THIRUVONAM } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: THIRUVONAM.meta.title,
  description: THIRUVONAM.meta.description,
  keywords: THIRUVONAM.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/shravana" },
  openGraph: {
    title: THIRUVONAM.meta.title,
    description: THIRUVONAM.meta.description,
    url: "https://vinaadi.com/natchathiram/shravana",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: THIRUVONAM.meta.title,
    description: THIRUVONAM.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: THIRUVONAM.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: THIRUVONAM.meta.title,
  description: THIRUVONAM.meta.description,
  url: "https://vinaadi.com/natchathiram/shravana",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function ShravanaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={THIRUVONAM} />
    </>
  );
}
