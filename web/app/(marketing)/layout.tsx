import type { ReactNode } from "react";

// The public site's stylesheet, loaded here rather than in the root layout so
// signed-in routes stop downloading it. The "Clarity" system (.cl-* / .clf-*)
// plus .mk-*, .site-* and .as-* is ~117 KB and no dashboard file references any
// of it — see docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F4.
//
// This is a route group, so the parentheses are stripped from the URL: the
// routes under it keep the exact paths they had at app/ root. Nothing here may
// render <html> or <body> — the root layout still owns those.
import "../marketing.css";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
