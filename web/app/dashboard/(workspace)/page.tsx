/**
 * `/dashboard` — the Today destination.
 *
 * Renders nothing on purpose. The workspace that draws every dashboard screen
 * lives in the sibling layout.tsx so it survives navigation between this route
 * and `/dashboard/*`; this file exists only to make the bare path a real route.
 * See the layout for why. (The dashboard CSS this file used to import comes
 * from ../layout.tsx, which loads it for every /dashboard/* route.)
 */
export default function DashboardPage() {
  return null;
}
