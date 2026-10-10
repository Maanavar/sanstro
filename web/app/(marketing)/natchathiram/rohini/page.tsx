import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { natchathiramJsonLd, natchathiramMetadata } from "@/lib/natchathiram-metadata";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { ROHINI } from "@/lib/natchathiram-data";

export async function generateMetadata(): Promise<Metadata> {
  return natchathiramMetadata(ROHINI);
}

export default function RohiniPage() {
  const { faqTa, article } = natchathiramJsonLd(ROHINI);
  return (
    <>
      <JsonLd ta={faqTa} />
      <JsonLd en={article.en} ta={article.ta} />
      <NatchathiramPageContent data={ROHINI} />
    </>
  );
}
