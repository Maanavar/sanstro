import type { Metadata } from "next";
import { PoruthamLearnPageContent } from "./PageContent";

export const metadata: Metadata = {
  title: "What is Porutham? — Tamil Marriage Compatibility Explained | Vinaadi",
  description:
    "Porutham is the Tamil system for checking marriage compatibility using birth stars. Learn about the 10 porutham factors, why Rajju dosha and Nadi dosha outweigh the score, and how Sevvai dosham is assessed.",
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
      "Learn the 10 porutham factors, how marriage compatibility is checked using birth stars, and why Rajju and Nadi doshas are critical checks in Tamil astrology.",
    url: "https://vinaadi.com/learn/what-is-porutham",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "What is Porutham? — Tamil Marriage Compatibility Explained",
    description: "The 10 porutham factors, Rajju dosha, Nadi dosha, and Sevvai dosham explained clearly.",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is porutham in Tamil astrology?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Porutham means compatibility in Tamil. It is the traditional system of checking marriage compatibility by comparing the birth stars of two people across 10 dimensions, including harmony, temperament, longevity, progeny, and prosperity.",
      },
    },
    {
      "@type": "Question",
      name: "What are the 10 poruthams?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The 10 poruthams are: Dinam (daily harmony), Ganam (temperament), Mahendram (longevity and support), Stree Deergham (prosperity), Yoni (physical compatibility), Rajju (life-force compatibility), Vedha (obstacles), Rasi (moon sign compatibility), Rasiyathipathi/Graha Maitri (planetary friendship), and Nadi (hereditary health). The maximum total score is 36 points.",
      },
    },
    {
      "@type": "Question",
      name: "What is Rajju dosha and why is it a dealbreaker?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rajju dosha occurs when both partners share the same Rajju category based on their birth stars. Traditional Tamil jyotish treats Rajju dosha as a critical dealbreaker regardless of the total porutham score. It is associated with longevity concerns for the spouse.",
      },
    },
    {
      "@type": "Question",
      name: "What is Nadi dosha and can it be cancelled?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nadi dosha occurs when both partners share the same Nadi category (Adi, Madhya, or Antya). It is associated with health concerns for offspring. Certain conditions, such as different moon signs or different birth stars despite the same Nadi, can cancel the dosha. Vinaadi checks these cancellations automatically.",
      },
    },
    {
      "@type": "Question",
      name: "How many poruthams are needed for a good marriage match?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Traditional Tamil practice considers 7 or more out of 10 poruthams as a good match. However, the qualitative factors — Rajju dosha, Nadi dosha, and Sevvai dosham — matter more than the raw count. A high score with Rajju dosha or Nadi dosha still requires careful consideration.",
      },
    },
  ],
};

export default function WhatIsPoruthamPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <PoruthamLearnPageContent />
    </>
  );
}
