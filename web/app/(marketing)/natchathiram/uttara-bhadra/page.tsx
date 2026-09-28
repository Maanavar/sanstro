import type { Metadata } from "next";
import { natchathiramMetadata } from "@/lib/natchathiram-metadata";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { UTTIRATATHI } from "@/lib/natchathiram-data";

export async function generateMetadata(): Promise<Metadata> {
  return natchathiramMetadata(UTTIRATATHI);
}

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
