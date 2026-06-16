import type { Metadata } from "next";
import { TEMPLE_THIRUNALLAR_FAQ } from "@/lib/marketing-i18n";
import { ThirunallarContent } from "./PageContent";

export const metadata: Metadata = {
  title: "Thirunallar Saniswaran Temple — Power, Sani Peyarchi & Worship | Vinaadi",
  description:
    "Thirunallar near Karaikal is the foremost Navagraha temple for Saturn (Saniswaran). Learn what it is known for, why devotees visit during Sani peyarchi and Ezharai Sani, how to worship, and the Sani slokam.",
  keywords: [
    "thirunallar temple",
    "saniswaran temple",
    "thirunallar saturn temple",
    "sani peyarchi temple",
    "ezharai sani remedy",
    "dharbaranyeswarar",
    "navagraha temple saturn",
    "திருநள்ளாறு",
    "சனீஸ்வரன் கோயில்",
  ],
  alternates: { canonical: "https://vinaadi.com/temples/thirunallar" },
  openGraph: {
    title: "Thirunallar Saniswaran Temple — Power, Sani Peyarchi & Worship",
    description:
      "The foremost temple for Saturn-related relief — what it is known for, when and how to worship, and the Sani slokam.",
    url: "https://vinaadi.com/temples/thirunallar",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thirunallar Saniswaran Temple",
    description: "The foremost temple for Saturn relief — power, worship and slokam.",
  },
};

const PLACE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Place",
  name: "Thirunallar Saniswaran Temple (Dharbaranyeswarar Temple)",
  description:
    "The foremost Navagraha temple dedicated to Saniswaran (Saturn), with Lord Shiva worshipped as Dharbaranyeswarar.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Thirunallar",
    addressRegion: "Puducherry (near Karaikal)",
    addressCountry: "IN",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TEMPLE_THIRUNALLAR_FAQ.map((f) => ({
    "@type": "Question",
    name: f.q.en,
    acceptedAnswer: { "@type": "Answer", text: f.a.en },
  })),
};

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Thirunallar Saniswaran Temple — Power, Sani Peyarchi & Worship",
  about: "Thirunallar Saniswaran (Saturn) temple",
  inLanguage: ["en", "ta"],
  publisher: { "@type": "Organization", name: "Vinaadi", url: "https://vinaadi.com" },
  mainEntityOfPage: "https://vinaadi.com/temples/thirunallar",
};

export default function ThirunallarPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PLACE_JSONLD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
      <ThirunallarContent />
    </>
  );
}
