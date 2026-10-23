import { redirect } from "next/navigation";
import { getServerLang } from "@/lib/server-lang";
import { localizePath } from "@/lib/ta-routes";

export default async function PanchangamTodayPage() {
  const today = new Date().toISOString().slice(0, 10);
  // A Tamil reader stays on the Tamil URL (`/ta/panchangam/today` -> `/ta/panchangam/<date>`).
  redirect(localizePath(`/panchangam/${today}`, await getServerLang()));
}
