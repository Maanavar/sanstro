"use client";

import dynamic from "next/dynamic";

/**
 * The root layout's two render-nothing-at-first passengers, moved off the
 * critical path (F6 of docs/EFFICIENCY_FIX_PLAN_2026-08-07.md).
 *
 * Both already render `null` on the server and on first paint — PostHogProvider
 * always returns null, and BetaSystem starts with `mounted=false` and only
 * decides what to show after reading localStorage in an effect. So neither
 * contributes markup to SSR, and loading them after hydration changes nothing a
 * visitor can see. What it changes is that their code, and everything they
 * import, leaves the first client bundle.
 *
 * What they import is the point:
 *
 *   PostHogProvider -> lib/analytics.ts -> `import posthog from "posthog-js"`,
 *     a top-level static import. posthog-js was therefore in the bundle of
 *     every page, including when NEXT_PUBLIC_POSTHOG_KEY is unset and every
 *     function in that module is a no-op.
 *
 *   BetaSystem -> lib/marketing-i18n.ts, 524 KB of source. The plan's "what is
 *     already clean — do not touch" section states that marketing-i18n is
 *     "imported only by app/ marketing routes. Zero leak into the dashboard
 *     bundle." That was not true: BetaSystem is rendered from the ROOT layout,
 *     which is an ancestor of /dashboard, and it suppresses itself on the
 *     dashboard by returning null AFTER its module has already been loaded.
 *
 * This file exists because `next/dynamic` with `ssr: false` is not allowed
 * inside a Server Component in Next 15, and app/layout.tsx is one (it awaits
 * cookies()). A one-line client boundary is the supported way through.
 */
const PostHogProvider = dynamic(
  () => import("@/components/posthog-provider").then((m) => m.PostHogProvider),
  { ssr: false },
);

const BetaSystem = dynamic(() => import("@/components/beta-system").then((m) => m.BetaSystem), {
  ssr: false,
});

export function DeferredChrome() {
  return (
    <>
      <PostHogProvider />
      <BetaSystem />
    </>
  );
}
