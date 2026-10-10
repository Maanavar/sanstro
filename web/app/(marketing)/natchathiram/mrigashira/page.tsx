import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { natchathiramJsonLd, natchathiramMetadata } from "@/lib/natchathiram-metadata";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { MRIGASHIRA } from "@/lib/natchathiram-data";

export async function generateMetadata(): Promise<Metadata> {
  return natchathiramMetadata(MRIGASHIRA);
}

export default function MrigashiraPage() {
  const { faqTa, article } = natchathiramJsonLd(MRIGASHIRA);
  return (
    <>
      <JsonLd ta={faqTa} />
      <JsonLd en={article.en} ta={article.ta} />
      <NatchathiramPageContent data={MRIGASHIRA} />
    </>
  );
}
