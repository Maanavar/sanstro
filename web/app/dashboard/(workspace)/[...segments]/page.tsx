/**
 * Path-addressed dashboard destinations — `/dashboard/tools`,
 * `/dashboard/tools/numerology`, `/dashboard/calendar`, … (see
 * `dashboardPath`/`parseDashboardPath` in lib/dashboard-tabs.ts, which own the
 * slug vocabulary). `/dashboard` itself stays on the sibling page.tsx.
 *
 * A REQUIRED catch-all (`[...segments]`), not an optional one: `[[...segments]]`
 * would collide with that sibling page.tsx and fail the build. Static children
 * of /dashboard (currently `reports/`, which sits OUTSIDE this route group) still
 * win over this route — Next matches a literal segment ahead of a catch-all — so
 * adding a real sub-route there does not need this file to change.
 *
 * Renders nothing on purpose: the workspace lives in the shared layout.tsx one
 * level up so it is not remounted when the router moves between this route and
 * `/dashboard`. The workspace reads the destination off the pathname; an
 * unrecognised path degrades to the fallback tab and is rewritten to its
 * canonical URL, rather than 404-ing, because a URL is user-editable input.
 */
export default function DashboardSegmentsPage() {
  return null;
}
