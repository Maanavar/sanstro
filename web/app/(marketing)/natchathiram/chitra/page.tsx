import type { Metadata } from "next";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { CHITRA } from "@/lib/natchathiram-data";

export const metadata: Metadata = {
  title: CHITRA.meta.title,
  description: CHITRA.meta.description,
  keywords: CHITRA.meta.keywords,
  alternates: { canonical: "https://vinaadi.com/natchathiram/chitra" },
  openGraph: {
    title: CHITRA.meta.title,
    description: CHITRA.meta.description,
    url: "https://vinaadi.com/natchathiram/chitra",
    type: "article",
    images: [{ url: "/brand/vinaadi-og-image.png", width: 1200, height: 630, alt: "Vinaadi — Tamil Astrology" }],
  },
  twitter: {
    card: "summary_large_image",
    title: CHITRA.meta.title,
    description: CHITRA.meta.description,
    images: ["/brand/vinaadi-og-image.png"],
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CHITRA.faq.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: CHITRA.meta.title,
  description: CHITRA.meta.description,
  url: "https://vinaadi.com/natchathiram/chitra",
  publisher: { "@type": "Organization", name: "Vinaadi" },
};

export default function ChitraPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <NatchathiramPageContent data={CHITRA} />
    </>
  );
}
