import { withTamilTwin } from "@/lib/localized-metadata";
import type { Metadata } from "next";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { HomeContent } from "@/components/home-content";

const EN_METADATA: Metadata = {
  // Absolute: the title already leads with the brand, and the root template
  // would append " | Vinaadi" a second time.
  title: { absolute: "Vinaadi — Thirukanitham-Precise Tamil Astrology for Daily Guidance" },
  description:
    "Your Tamil astrology assistant for daily guidance, timing, family planning, and clarity. Powered by Thirukanitham — precise, calm, and built for real decisions.",
  openGraph: {
    title: "Vinaadi — Thirukanitham-Precise Tamil Astrology for Daily Guidance",
    description:
      "Thirukanitham-based Tamil astrology for daily guidance, porutham, jadhagam, and family planning.",
    url: "https://vinaadi.com",
    images: [{ url: "/brand/vinaadi-wordmark-color.png", width: 1792, height: 612, alt: "Vinaadi — Thirukanitham-Precise Tamil Astrology" }],
  },
  alternates: { canonical: "https://vinaadi.com" },
  twitter: {
    card: "summary_large_image",
    title: "Vinaadi — Thirukanitham-Precise Tamil Astrology for Daily Guidance",
    description: "Thirukanitham-based Tamil astrology for daily guidance, porutham, jadhagam, and family planning.",
    images: ["/brand/vinaadi-wordmark-color.png"],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return withTamilTwin(EN_METADATA, "/");
}

export default function HomePage() {
  return (
    <div className="clarity-shell">
      <PublicNav />
      <HomeContent />
      <PublicFooter />
    </div>
  );
}
