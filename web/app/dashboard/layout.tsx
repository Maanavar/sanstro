import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
// Loaded here (not just app/dashboard/page.tsx) so the standalone routes under
// /dashboard/* (reports, goals, chart-generate, daily-score, porutham, wrapped)
// also get .cd-shell's real Classic/Nova color system instead of falling through
// to globals.css's unrelated "Clarity" .cd-shell block (same class name, a
// different, always-light, unscoped legacy component-styling layer).
import "./dashboard.css";
import "./dashboard-nova.css";

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

// Nova look only — scoped to the dashboard route so marketing pages never load
// these fonts. `display: "contents"` keeps the wrapper out of layout entirely;
// it exists only to host the two CSS variables the fonts export.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-nova-display",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-nova-prose",
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`cd-font-host ${cormorantGaramond.variable} ${sourceSerif4.variable}`}>
      {children}
    </div>
  );
}
