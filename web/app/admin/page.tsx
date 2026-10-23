import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminConsole } from "@/components/admin-console";
import { backendUrl } from "@/lib/backend-url";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin Console - Vinaadi",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vinaadi_token")?.value;

  if (!token) {
    redirect("/login");
  }

  // Verify admin role by calling a protected admin endpoint on the backend.
  // The backend's get_admin_user dependency returns 403 for non-admin sessions.
  let isAdmin = false;
  try {
    const res = await fetch(`${backendUrl()}/api/v1/admin/stats`, {
      headers: { Cookie: `vinaadi_token=${token}` },
      cache: "no-store",
    });
    isAdmin = res.ok;
  } catch (error) {
    // Backend unreachable, or BACKEND_URL misconfigured — deny access either
    // way, but say which: an operator staring at an admin console that
    // redirects to "/" cannot tell those two apart from the outside.
    console.error("[admin] admin check failed", error);
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminConsole />;
}
