"use client";

import { useRouter } from "next/navigation";

export function PanchangamDatePicker({ date }: { date: string }) {
  const router = useRouter();

  return (
    <input
      type="date"
      value={date}
      aria-label="Select date"
      onChange={(e) => {
        if (e.target.value) router.push(`/panchangam/${e.target.value}`);
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
