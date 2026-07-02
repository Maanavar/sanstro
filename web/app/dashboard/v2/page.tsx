import { DashboardWorkspace } from "@/components/dashboard-workspace";
import "../dashboard.css";
import "./today-v2.css";

// Redesigned Today tab preview — compare against the classic /dashboard.
// Shares all state (localStorage, session) with the classic dashboard, so
// switching between the two URLs keeps the same profile, date, and language.
export default function DashboardV2Page() {
  return (
    <main>
      <DashboardWorkspace todayVariant="v2" />
    </main>
  );
}
