import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { ANURADHA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: ANURADHA.meta.title,
  description: ANURADHA.meta.description,
  keywords: ANURADHA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/anuradha" },
  openGraph: {
    title: ANURADHA.meta.title,
    description: ANURADHA.meta.description,
    url: "https://vinaadi.com/natchathiram/anuradha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: ANURADHA.meta.title,
    description: ANURADHA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ANURADHA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: ANURADHA.meta.title,
  description: ANURADHA.meta.description,
  url: "https://vinaadi.com/natchathiram/anuradha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function AnuradhaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={ANURADHA} />
    </>
  );
}
