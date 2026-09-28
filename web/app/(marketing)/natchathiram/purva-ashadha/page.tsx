import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { natchathiramJsonLd, natchathiramMetadata } from "@/lib/natchathiram-metadata";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { PURVA_ASHADHA } from "@/lib/natchathiram-data";

export async function generateMetadata(): Promise<Metadata> {
  return natchathiramMetadata(PURVA_ASHADHA);
}

export default function PurvaAshadhaPage() {
  const { faqTa, article } = natchathiramJsonLd(PURVA_ASHADHA);
  return (
    <>
      <JsonLd ta={faqTa} />
      <JsonLd en={article.en} ta={article.ta} />
      <NatchathiramPageContent data={PURVA_ASHADHA} />
    </>
  );
}
