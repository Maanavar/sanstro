import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { MAGHA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: MAGHA.meta.title,
  description: MAGHA.meta.description,
  keywords: MAGHA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/magha" },
  openGraph: {
    title: MAGHA.meta.title,
    description: MAGHA.meta.description,
    url: "https://vinaadi.com/natchathiram/magha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: MAGHA.meta.title,
    description: MAGHA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: MAGHA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: MAGHA.meta.title,
  description: MAGHA.meta.description,
  url: "https://vinaadi.com/natchathiram/magha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function MaghaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={MAGHA} />
    </>
  );
}
