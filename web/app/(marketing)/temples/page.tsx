import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { TempleIndexContent } from "./IndexContent";

const EN_METADATA: Metadata = {
  title: "Famous Temples & Their Power — Navagraha, Rahu-Ketu & More",
  description:
    "A guide to the temples sought for specific blessings — the nine Navagraha temples for planetary peace, Thirunallar for Saturn, Rahu-Ketu sthalams, Vaitheeswaran Koil for health. What each temple is known for and which difficulty it addresses.",
  keywords: [
    "navagraha temples",
    "famous temples tamil nadu",
    "thirunallar temple",
    "rahu ketu temple",
    "vaitheeswaran koil",
    "temple for dosham",
    "navagraha temple list",
    "கோயில்கள்",
    "நவகிரக கோயில்கள்",
  ],
  alternates: { canonical: "https://vinaadi.com/temples" },
  openGraph: {
    title: "Famous Temples & Their Power — Navagraha, Rahu-Ketu & More",
    description:
      "What each temple is known for, the deity worshipped, and which difficulty it traditionally addresses.",
    url: "https://vinaadi.com/temples",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/temples");
}

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Famous Temples & Their Power",
  url: "https://vinaadi.com/temples",
  description: "A guide to temples sought for specific blessings, organised by the planet or difficulty they address.",
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://vinaadi.com" },
      { "@type": "ListItem", position: 2, name: "Temples", item: "https://vinaadi.com/temples" },
    ],
  },
};

export default function TemplesIndexPage() {
  return (
    <>
      <JsonLd en={JSONLD} />
      <TempleIndexContent />
    </>
  );
}
