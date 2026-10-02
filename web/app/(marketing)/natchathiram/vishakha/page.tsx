import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { natchathiramJsonLd, natchathiramMetadata } from "@/lib/natchathiram-metadata";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { VISHAKHA } from "@/lib/natchathiram-data";

export async function generateMetadata(): Promise<Metadata> {
  return natchathiramMetadata(VISHAKHA);
}

export default function VishakhaPage() {
  const { faqTa, article } = natchathiramJsonLd(VISHAKHA);
  return (
    <>
      <JsonLd ta={faqTa} />
      <JsonLd en={article.en} ta={article.ta} />
      <NatchathiramPageContent data={VISHAKHA} />
    </>
  );
}
