import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  // Used as the browser tab label and, importantly, as the header stamped onto
  // browser-printed / "Save as PDF" output. Keep it brand-first (no "Dashboard")
  // so printed pages read as a Vinaadi document rather than an app screen.
  title: "Vinaadi AI — Tamil Astrology",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
