import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminConsole } from "@/components/admin-console";
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
  const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
  let isAdmin = false;
  try {
    const res = await fetch(`${backendUrl}/api/v1/admin/stats`, {
      headers: { Cookie: `vinaadi_token=${token}` },
      cache: "no-store",
    });
    isAdmin = res.ok;
  } catch {
    // Backend unreachable — deny access
  }

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminConsole />;
}
