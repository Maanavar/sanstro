import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { HomeContent } from "@/components/home-content";

export const metadata: Metadata = {
  title: "Vinaadi — Tamil Astrology Assistant for Daily Guidance & Planning",
  description:
    "Your Tamil astrology assistant for daily guidance, timing, family planning, and clarity. Powered by Thirukanitham — precise, calm, and built for real decisions.",
  openGraph: {
    title: "Vinaadi — Tamil Astrology Assistant for Daily Guidance & Planning",
    description:
      "Thirukanitham-based Tamil astrology for daily guidance, porutham, jadhagam, and family planning.",
    url: "https://vinaadi.com",
    images: [{ url: "/brand/vinaadi-wordmark-color.png", width: 1792, height: 612, alt: "Vinaadi - Your Cosmic Copilot" }],
  },
  alternates: { canonical: "https://vinaadi.com" },
  twitter: {
    card: "summary_large_image",
    title: "Vinaadi — Tamil Astrology Assistant for Daily Guidance & Planning",
    description: "Thirukanitham-based Tamil astrology for daily guidance, porutham, jadhagam, and family planning.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};

export default function HomePage() {
  return (
    <div className="clarity-shell">
      <PublicNav />
      <HomeContent />
      <PublicFooter />
    </div>
  );
}
