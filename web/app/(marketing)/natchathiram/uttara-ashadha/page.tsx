import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { natchathiramJsonLd, natchathiramMetadata } from "@/lib/natchathiram-metadata";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { UTTARA_ASHADHA } from "@/lib/natchathiram-data";

export async function generateMetadata(): Promise<Metadata> {
  return natchathiramMetadata(UTTARA_ASHADHA);
}

export default function UttaraAshadhaPage() {
  const { faqTa, article } = natchathiramJsonLd(UTTARA_ASHADHA);
  return (
    <>
      <JsonLd ta={faqTa} />
      <JsonLd en={article.en} ta={article.ta} />
      <NatchathiramPageContent data={UTTARA_ASHADHA} />
    </>
  );
}
