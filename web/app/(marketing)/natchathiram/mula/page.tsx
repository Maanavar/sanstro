import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { natchathiramJsonLd, natchathiramMetadata } from "@/lib/natchathiram-metadata";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { MULA } from "@/lib/natchathiram-data";

export async function generateMetadata(): Promise<Metadata> {
  return natchathiramMetadata(MULA);
}

export default function MulaPage() {
  const { faqTa, article } = natchathiramJsonLd(MULA);
  return (
    <>
      <JsonLd ta={faqTa} />
      <JsonLd en={article.en} ta={article.ta} />
      <NatchathiramPageContent data={MULA} />
    </>
  );
}
