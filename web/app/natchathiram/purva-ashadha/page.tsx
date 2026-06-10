import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { PURVA_ASHADHA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: PURVA_ASHADHA.meta.title,
  description: PURVA_ASHADHA.meta.description,
  keywords: PURVA_ASHADHA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/purva-ashadha" },
  openGraph: {
    title: PURVA_ASHADHA.meta.title,
    description: PURVA_ASHADHA.meta.description,
    url: "https://vinaadi.com/natchathiram/purva-ashadha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: PURVA_ASHADHA.meta.title,
    description: PURVA_ASHADHA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PURVA_ASHADHA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PURVA_ASHADHA.meta.title,
  description: PURVA_ASHADHA.meta.description,
  url: "https://vinaadi.com/natchathiram/purva-ashadha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function PurvaAshadhaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={PURVA_ASHADHA} />
    </>
  );
}
