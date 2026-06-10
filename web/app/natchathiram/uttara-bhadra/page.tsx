import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { UTTIRATATHI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: UTTIRATATHI.meta.title,
  description: UTTIRATATHI.meta.description,
  keywords: UTTIRATATHI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/uttara-bhadra" },
  openGraph: {
    title: UTTIRATATHI.meta.title,
    description: UTTIRATATHI.meta.description,
    url: "https://vinaadi.com/natchathiram/uttara-bhadra",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: UTTIRATATHI.meta.title,
    description: UTTIRATATHI.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: UTTIRATATHI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: UTTIRATATHI.meta.title,
  description: UTTIRATATHI.meta.description,
  url: "https://vinaadi.com/natchathiram/uttara-bhadra",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function UttaraBhadraPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={UTTIRATATHI} />
    </>
  );
}
