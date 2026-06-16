import type { Metadata } from "next";

import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { BetaPageContent } from "@/components/beta-page-content";

export const metadata: Metadata = {
  title: "Open Beta — Vinaadi",
  description:
    "Vinaadi is in open beta — every feature is free while we refine it. Here's what that means for you, what's coming next, and how your feedback shapes the final version.",
  alternates: { canonical: "https://vinaadi.com/beta" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Open Beta — Vinaadi",
    description:
      "Every feature free while we refine Vinaadi. See what's coming and how your feedback shapes v1.",
    url: "https://vinaadi.com/beta",
    images: [
      {
        url: "/brand/vinaadi-og-image.png",
        width: 1792,
        height: 612,
        alt: "Vinaadi - Your Cosmic Copilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Beta — Vinaadi",
    description: "Every feature free while we refine Vinaadi. Your feedback shapes v1.",
    images: ["/brand/vinaadi-og-image.png"],
  },
};

export default function BetaPage() {
  return (
    <div className="clarity-shell">
      <PublicNav />
      <BetaPageContent />
      <PublicFooter />
    </div>
  );
}
