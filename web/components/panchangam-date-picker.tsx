"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/components/lang-context";
import { localizePath } from "@/lib/ta-routes";

export function PanchangamDatePicker({ date }: { date: string }) {
  const router = useRouter();
  const [lang] = useLang();

  return (
    <input
      type="date"
      value={date}
      aria-label={lang === "ta" ? "தேதியைத் தேர்ந்தெடுக்கவும்" : "Select date"}
      onChange={(e) => {
        if (e.target.value) router.push(localizePath(`/panchangam/${e.target.value}`, lang));
      }}
      style={{
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "0.82rem",
        fontWeight: 600,
        border: "1.5px solid var(--cl-border)",
        background: "var(--cl-surface)",
        color: "var(--cl-ink)",
        fontFamily: "inherit",
      }}
    />
  );
}
