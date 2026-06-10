import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { UTTARA_ASHADHA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: UTTARA_ASHADHA.meta.title,
  description: UTTARA_ASHADHA.meta.description,
  keywords: UTTARA_ASHADHA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/uttara-ashadha" },
  openGraph: {
    title: UTTARA_ASHADHA.meta.title,
    description: UTTARA_ASHADHA.meta.description,
    url: "https://vinaadi.com/natchathiram/uttara-ashadha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: UTTARA_ASHADHA.meta.title,
    description: UTTARA_ASHADHA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: UTTARA_ASHADHA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: UTTARA_ASHADHA.meta.title,
  description: UTTARA_ASHADHA.meta.description,
  url: "https://vinaadi.com/natchathiram/uttara-ashadha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function UttaraAshadhaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={UTTARA_ASHADHA} />
    </>
  );
}
