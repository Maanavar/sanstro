import { redirect } from "next/navigation";

export default function PanchangamTodayPage() {
  const today = new Date().toISOString().slice(0, 10);
  redirect(`/panchangam/${today}`);
}
