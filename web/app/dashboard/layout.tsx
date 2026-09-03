import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { QueryProvider } from "@/components/query-provider";
// Loaded here (not just in the (workspace) group) so the standalone routes under
// /dashboard/* (reports, goals, chart-generate, daily-score, porutham, wrapped)
// also get .cd-shell's Nova color system.
//
// This used to warn that globals.css defined a rival, always-light .cd-shell
// block and that load order was the only thing keeping it from winning. That
// block is gone (F5): 45 of its 47 rules were already shadowed by
// dashboard-nova.css's higher-specificity [data-ui="nova"] selectors, and no
// marketing file ever rendered .cd-shell, so it styled nothing that this file
// did not already style. The remaining pair (shell scrollbars) moved into
// dashboard-nova.css. There is now exactly one .cd-shell system.
// Hoisted out of globals.css by F4: the component rules only signed-in routes
// render (.cd-*, the drawer, the life-event cards, the rectification wizard).
// It is imported first so that the ordering these rules had inside globals.css —
// ahead of everything in dashboard.css — is preserved, and the Nova theme layers
// below still win.
import "./dashboard-globals.css";
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

// SHD-01 finished the job it named — "one display serif across both surfaces" —
// but only at the level of *which* serif. Two independent `next/font` instances
// of Fraunces survived: this one (500/600/700 as `--font-nova-display`) and the
// root layout's (400/500/600 + italics as `--font-display`), declaring 500 and
// 600 twice and giving a signed-in visitor 27 @font-face blocks for one
// typeface. `--font-nova-display` existed only to keep the two apart.
//
// F6 follow-up — there is now one instance, in the root layout, covering the
// union (400/500/600/700 + italics). Rendering is unchanged: every weight and
// style either surface renders today is still declared, and it is the same
// family from the same source. The `--font-nova-display` indirection is gone
// rather than aliased, because an alias pointing at the variable it used to
// shadow is the kind of thing that reads as deliberate a year later.
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-nova-prose",
});

// F6 — QueryProvider and Toaster moved down from the root layout, which was
// giving them to every marketing visitor. This is the correct level rather than
// (workspace) for the same reason the stylesheets above are: the standalone
// routes under /dashboard/* need them too.
//
// Deliberately NOT also added to /login or /admin. They read as "the signed-in
// side" and are not under app/dashboard/, which is the trap this file's CSS
// comments already record — but here the measurement says they genuinely do not
// need it: nothing either route reaches uses react-query or sonner. See
// lib/payload-boundary.test.ts, which fails if that stops being true.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className={`cd-font-host ${sourceSerif4.variable}`}>
        {children}
        <Toaster position="bottom-center" />
      </div>
    </QueryProvider>
  );
}
