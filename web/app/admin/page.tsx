import type { Metadata } from "next";

import { AdminConsole } from "@/components/admin-console";
import "./admin.css";

export const metadata: Metadata = {
  title: "Admin Console - Vinaadi",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminConsole />;
}
