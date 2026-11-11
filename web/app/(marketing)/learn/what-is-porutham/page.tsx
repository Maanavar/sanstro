import { withTamilTwin } from "@/lib/localized-metadata";
import { JsonLd } from "@/lib/json-ld";
import type { Metadata } from "next";
import { PoruthamLearnPageContent } from "./PageContent";

const EN_METADATA: Metadata = {
  title: "What is Porutham? — Tamil Marriage Compatibility Explained",
  description:
    "Porutham is the Tamil system for checking marriage compatibility using birth stars. Learn about the 10 porutham factors, why Rajju and Vedhai outweigh the score, and how Sevvai dosham is assessed.",
  keywords: [
    "what is porutham",
    "porutham meaning Tamil",
    "Tamil marriage compatibility",
    "10 porutham explained",
    "birth star porutham",
    "rajju dosha",
    "nadi dosha meaning",
    "sevvai dosham",
    "thirumana porutham",
    "Tamil horoscope matching",
  ],
  alternates: { canonical: "https://vinaadi.com/learn/what-is-porutham" },
  openGraph: {
    title: "What is Porutham? — Tamil Marriage Compatibility Explained",
    description:
      "Learn the 10 porutham factors, how marriage compatibility is checked using birth stars, and why Rajju and Vedhai are the critical checks in Tamil astrology.",
    url: "https://vinaadi.com/learn/what-is-porutham",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "What is Porutham? — Tamil Marriage Compatibility Explained",
    description: "The 10 porutham factors, Rajju dosha, Nadi dosha, and Sevvai dosham explained clearly.",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/learn/what-is-porutham");
}

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is porutham in Tamil astrology?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Porutham means compatibility in Tamil. It is the traditional system of checking marriage compatibility by comparing the birth stars of two people across 10 dimensions, including day-to-day harmony, temperament, progeny, and prosperity.",
      },
    },
    {
      "@type": "Question",
      name: "What are the 10 poruthams?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The 10 poruthams are: Dinam (daily harmony), Ganam (temperament), Mahendram (progeny and support), Stree Deergham (prosperity), Yoni (physical compatibility), Rajju (a key marriage compatibility), Vedha (obstacles), Rasi (moon sign compatibility), Graha Maitri/Rasiyathipathi (planetary friendship), and Vasya (mutual attraction). The maximum total score is 10 points in the Tamil Thirukanitham system — one point per porutham.",
      },
    },
    {
      "@type": "Question",
      name: "What is Rajju dosha and how does Vinaadi treat it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rajju dosha occurs when both partners' birth stars fall in the same Rajju group. Rajju is one of the ten poruthams and an important one: when it does not match, Vinaadi marks the result as needing care whatever the total score, and suggests reading both full charts before deciding.",
      },
    },
    {
      "@type": "Question",
      name: "What is Nadi dosha and can it be cancelled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nadi dosha occurs when both partners share the same Nadi category (Adi, Madhya, or Antya). Nadi comes from North Indian matching and is not one of the Tamil ten poruthams, so Vinaadi shows it only as a side note that does not change the score; tradition links it to the health of children. It is cancelled when both have the same birth star in different padas, or the same moon sign with different birth stars. A different moon sign alone does not cancel it. Vinaadi checks these conditions automatically.",
      },
    },
    {
      "@type": "Question",
      name: "How many poruthams are needed for a good marriage match?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional Tamil practice considers 7 or more out of 10 poruthams as a good match. However, the qualitative factors — Rajju, Vedhai, and Sevvai dosham — matter more than the raw count. A high score with a missing Rajju or Vedhai still requires careful consideration.",
      },
    },
  ],
};

export default function WhatIsPoruthamPage() {
  return (
    <>
      <JsonLd en={FAQ_JSONLD} />
      <PoruthamLearnPageContent />
    </>
  );
}
