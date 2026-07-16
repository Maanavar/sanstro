import type { Metadata } from "next";
import { Fraunces, Source_Serif_4 } from "next/font/google";
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

// SHD-01 — one display serif across both surfaces. The dashboard's Nova display
// font is now Fraunces (the same serif that carries the marketing brand and
// reads better at UI sizes than Cormorant's hairlines), keeping the exported
// `--font-nova-display` variable name so nothing downstream changes. This drops
// Cormorant Garamond, taking the product from six loaded families toward four.
const frauncesNova = Fraunces({
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
    <div className={`cd-font-host ${frauncesNova.variable} ${sourceSerif4.variable}`}>
      {children}
    </div>
  );
}
