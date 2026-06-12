import type { Metadata } from "next";
import { FriendshipTool } from "./FriendshipTool";

export const metadata: Metadata = {
  title: "Friends & Compatibility — Free Tamil Nakshatra Friendship Report | Vinaadi",
  description:
    "Discover your friendship style with anyone. Enter two birth details for a positive, nakshatra-based friendship compatibility report — communication, trust, energy balance, and growth. Free, no account needed.",
  keywords: [
    "friendship compatibility",
    "nakshatra friendship",
    "Tamil compatibility tool",
    "rasi friendship",
    "birth star friendship match",
    "free compatibility calculator",
  ],
  alternates: { canonical: "https://vinaadi.com/tools/friendship-compatibility" },
  openGraph: {
    title: "Friends & Compatibility — Tamil Nakshatra Friendship Report",
    description:
      "A positive, nakshatra-based friendship compatibility report between two people. Free, no account needed.",
    url: "https://vinaadi.com/tools/friendship-compatibility",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Friends & Compatibility — Tamil Nakshatra Friendship Report",
    description: "Discover your friendship style — communication, trust, energy balance, and growth. Free.",
  },
};

export default function FriendshipCompatibilityPage() {
  return <FriendshipTool />;
}
