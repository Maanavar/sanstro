import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { UTTARA_PHALGUNI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: UTTARA_PHALGUNI.meta.title,
  description: UTTARA_PHALGUNI.meta.description,
  keywords: UTTARA_PHALGUNI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/uttara-phalguni" },
  openGraph: {
    title: UTTARA_PHALGUNI.meta.title,
    description: UTTARA_PHALGUNI.meta.description,
    url: "https://vinaadi.com/natchathiram/uttara-phalguni",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: UTTARA_PHALGUNI.meta.title,
    description: UTTARA_PHALGUNI.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: UTTARA_PHALGUNI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: UTTARA_PHALGUNI.meta.title,
  description: UTTARA_PHALGUNI.meta.description,
  url: "https://vinaadi.com/natchathiram/uttara-phalguni",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function UttaraPhalguniPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={UTTARA_PHALGUNI} />
    </>
  );
}
