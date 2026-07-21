import { Suspense } from "react";

import { DashboardWorkspace } from "@/components/dashboard-workspace";
import "./dashboard.css";
import "./dashboard-nova.css";

export default function DashboardPage() {
  return (
    <main>
      {/* DashboardWorkspace reads `?tab=` via useSearchParams. Without a Suspense
          boundary Next bails the entire route out of static rendering at build
          time. The fallback is deliberately empty — the workspace already owns
          its own hydration/loading states, and a second spinner here would flash
          ahead of them. */}
      <Suspense fallback={null}>
        <DashboardWorkspace />
      </Suspense>
    </main>
  );
}
