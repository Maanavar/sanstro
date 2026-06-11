import type { Metadata } from "next";
import { NatchathiramIndexContent } from "./NatchathiramIndexContent";

export const metadata: Metadata = {
  title: "27 Nakshathirams (நட்சத்திரங்கள்) — Personality, Career & Dasha Guide | Vinaadi",
  description:
    "Complete guide to all 27 birth stars in Tamil Vedic astrology — personality traits, career strengths, family life, dasha timelines, and spiritual guidance. Based on Thirukanitham.",
  keywords: [
    "27 nakshathirams",
    "nakshathiram characteristics",
    "birth star astrology",
    "nakshathiram personality traits",
    "Tamil nakshathiram guide",
    "nakshathiram career astrology",
    "27 நட்சத்திரங்கள்",
    "நட்சத்திரம் பலன்கள்",
    "Vinaadi natchathiram",
  ],
  alternates: { canonical: "https://vinaadi.com/natchathiram" },
  openGraph: {
    title: "27 Nakshathirams — Birth Star Profiles | Vinaadi",
    description:
      "Personality traits, career paths, dasha timelines and spiritual guidance for all 27 birth stars. Based on Thirukanitham Vedic astrology.",
    url: "https://vinaadi.com/natchathiram",
    type: "website",
  },
};

export default function NatchathiramIndexPage() {
  return <NatchathiramIndexContent />;
}
