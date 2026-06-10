import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { SWATI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: SWATI.meta.title,
  description: SWATI.meta.description,
  keywords: SWATI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/swati" },
  openGraph: {
    title: SWATI.meta.title,
    description: SWATI.meta.description,
    url: "https://vinaadi.com/natchathiram/swati",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: SWATI.meta.title,
    description: SWATI.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SWATI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: SWATI.meta.title,
  description: SWATI.meta.description,
  url: "https://vinaadi.com/natchathiram/swati",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function SwatiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={SWATI} />
    </>
  );
}
