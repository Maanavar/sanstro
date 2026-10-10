import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardAuxiliaryShell } from "@/components/dashboard-auxiliary-shell";

// Inbox is an authenticated product surface even though its legacy URL is
// outside /dashboard. Load the same Nova shell styles as dashboard routes.
import "../../dashboard/dashboard-globals.css";
import "../../dashboard/dashboard.css";
import "../../dashboard/dashboard-nova.css";

/**
 * The inbox page itself is a client component, so it cannot export metadata.
 * This wrapper gives it a real browser-tab title (it had none — the tab read
 * as the marketing default) and keeps a private, auth-gated surface out of
 * search indexes.
 */
export const metadata: Metadata = {
  title: "Inbox",
  description: "Your Vinaadi notification history.",
  robots: { index: false, follow: false },
};

export default function NotificationsLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardAuxiliaryShell pageTitle={{ en: "Inbox", ta: "அறிவிப்புப் பெட்டி" }}>
      {children}
    </DashboardAuxiliaryShell>
  );
}
