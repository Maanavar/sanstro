import type { Metadata } from "next";
import { JsonLd } from "@/lib/json-ld";
import { natchathiramJsonLd, natchathiramMetadata } from "@/lib/natchathiram-metadata";
import { NatchathiramPageContent } from "@/components/natchathiram-page";
import { UTTARA_PHALGUNI } from "@/lib/natchathiram-data";

export async function generateMetadata(): Promise<Metadata> {
  return natchathiramMetadata(UTTARA_PHALGUNI);
}

export default function UttaraPhalguniPage() {
  const { faqTa, article } = natchathiramJsonLd(UTTARA_PHALGUNI);
  return (
    <>
      <JsonLd ta={faqTa} />
      <JsonLd en={article.en} ta={article.ta} />
      <NatchathiramPageContent data={UTTARA_PHALGUNI} />
    </>
  );
}
