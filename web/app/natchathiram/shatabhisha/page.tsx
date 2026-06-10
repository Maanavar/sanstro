import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { SATHAYAM } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: SATHAYAM.meta.title,
  description: SATHAYAM.meta.description,
  keywords: SATHAYAM.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/shatabhisha" },
  openGraph: {
    title: SATHAYAM.meta.title,
    description: SATHAYAM.meta.description,
    url: "https://vinaadi.com/natchathiram/shatabhisha",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: SATHAYAM.meta.title,
    description: SATHAYAM.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SATHAYAM.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: SATHAYAM.meta.title,
  description: SATHAYAM.meta.description,
  url: "https://vinaadi.com/natchathiram/shatabhisha",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function ShatabhishaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={SATHAYAM} />
    </>
  );
}
