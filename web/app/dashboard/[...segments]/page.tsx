import { Suspense } from "react";

import { DashboardWorkspace } from "@/components/dashboard-workspace";
import "../dashboard.css";
import "../dashboard-nova.css";

/**
 * Path-addressed dashboard destinations — `/dashboard/tools`,
 * `/dashboard/tools/numerology`, `/dashboard/calendar`, … (see
 * `dashboardPath`/`parseDashboardPath` in lib/dashboard-tabs.ts, which own the
 * slug vocabulary). `/dashboard` itself stays on the sibling page.tsx.
 *
 * A REQUIRED catch-all (`[...segments]`), not an optional one: `[[...segments]]`
 * would collide with that sibling page.tsx and fail the build. Static children
 * of /dashboard (currently `reports/`) still win over this route — Next matches
 * a literal segment ahead of a catch-all — so adding a real sub-route here does
 * not need this file to change.
 *
 * The workspace reads the destination off the pathname; an unrecognised path
 * degrades to the fallback tab and is rewritten to its canonical URL, rather
 * than 404-ing, because a URL is user-editable input.
 */
export default function DashboardSegmentsPage() {
  return (
    <main>
      {/* DashboardWorkspace reads the legacy `?tab=` via useSearchParams.
          Without a Suspense boundary Next bails the entire route out of static
          rendering at build time. The fallback is deliberately empty — the
          workspace already owns its own hydration/loading states, and a second
          spinner here would flash ahead of them. */}
      <Suspense fallback={null}>
        <DashboardWorkspace />
      </Suspense>
    </main>
  );
}
