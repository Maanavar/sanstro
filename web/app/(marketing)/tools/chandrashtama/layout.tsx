import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/page-metadata";

// The page is a client component, which cannot export metadata; without this
// layout it inherited the homepage's title and canonical (GRW-02).
export const metadata = pageMetadata({
  path: "/tools/chandrashtama",
  title: "Chandrashtama Calculator — Find Your Chandrashtamam Rasi",
  description:
    "Pick your janma rasi to see which rasi the Moon must transit for your chandrashtamam, and how each Moon position from your rasi reads for the day.",
  keywords: ["chandrashtama calculator", "chandrashtamam", "chandrashtama days", "Moon 8th house transit"],
});

export default function ChandrashtamaLayout({ children }: { children: ReactNode }) {
  return children;
}
