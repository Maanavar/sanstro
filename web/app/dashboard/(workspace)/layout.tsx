import { Suspense } from "react";
import type { ReactNode } from "react";

import { DashboardWorkspace } from "@/components/dashboard-workspace";

/**
 * The dashboard workspace is mounted HERE, in a layout, not in the two pages
 * below it — and that placement is the whole point of this file.
 *
 * `/dashboard` (page.tsx) and `/dashboard/*` ([...segments]/page.tsx) are two
 * different Next routes. While the workspace lived inside each page, every move
 * between them swapped the layout's child and React unmounted and remounted the
 * entire workspace: `useSession` went back to un-hydrated, every `use*Data`
 * hook's cache emptied, the `visitedPanesRef` keep-alive record was wiped, and
 * the screen fell back to the first-load skeleton and refetched from `/auth/me`
 * downward. So clicking Calendar, or clicking Today from anywhere else, showed
 * the destination painted from memory for a frame and then visibly collapsed to
 * an empty dashboard and reloaded it — a nav bounce on every single tab click.
 *
 * A layout is preserved across navigations between the routes it wraps, so with
 * the workspace up here the two pages below carry no UI at all and a tab change
 * is what it always looked like it was: local state plus a URL rewrite. The
 * router still runs (history, deep links, Back/Forward all keep working) but it
 * swaps one empty page for another underneath a workspace that never unmounts.
 *
 * The route group `(workspace)` keeps this scoped: it adds no URL segment, and
 * `/dashboard/reports` sits outside the group so it does not inherit the
 * workspace.
 */
export default function DashboardWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      {/* DashboardWorkspace reads the legacy `?tab=` via useSearchParams.
          Without a Suspense boundary Next bails the whole segment out of static
          rendering at build time. The fallback is deliberately empty — the
          workspace already owns its own hydration/loading states, and a second
          spinner here would flash ahead of them. */}
      <Suspense fallback={null}>
        <DashboardWorkspace />
      </Suspense>
      {/* Both pages under this group render nothing; `children` is kept so a
          future real sub-page inside the workspace has somewhere to land. */}
      {children}
    </main>
  );
}
