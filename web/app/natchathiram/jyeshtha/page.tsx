import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { JYESHTHA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: JYESHTHA.meta.title,
  description: JYESHTHA.meta.description,
  keywords: JYESHTHA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/jyeshtha" },
  openGraph: {
    title: JYESHTHA.meta.title,
    description: JYESHTHA.meta.description,
    url: "https://vinaadi.com/natchathiram/jyeshtha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: JYESHTHA.meta.title,
    description: JYESHTHA.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: JYESHTHA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: JYESHTHA.meta.title,
  description: JYESHTHA.meta.description,
  url: "https://vinaadi.com/natchathiram/jyeshtha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function JyeshthaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={JYESHTHA} />
    </>
  );
}
