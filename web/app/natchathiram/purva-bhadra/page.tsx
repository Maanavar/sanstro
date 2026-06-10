import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { POORATTATHI } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: POORATTATHI.meta.title,
  description: POORATTATHI.meta.description,
  keywords: POORATTATHI.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/purva-bhadra" },
  openGraph: {
    title: POORATTATHI.meta.title,
    description: POORATTATHI.meta.description,
    url: "https://vinaadi.com/natchathiram/purva-bhadra",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: POORATTATHI.meta.title,
    description: POORATTATHI.meta.description,
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: POORATTATHI.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: POORATTATHI.meta.title,
  description: POORATTATHI.meta.description,
  url: "https://vinaadi.com/natchathiram/purva-bhadra",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function PurvaBhadraPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={POORATTATHI} />
    </>
  );
}
