"use client";

import Link from "next/link";

import { useLang } from "@/components/lang-toggle";

/**
 * The notice a visitor sees before giving birth details without an account
 * (admin spec L2). Guest results are computed in memory and never stored
 * (plan ARC-01), so the notice says exactly that and links the full one.
 *
 * New Tamil, pending native review.
 */
export function GuestPrivacyNote({ className }: { className?: string }) {
  const [lang] = useLang();
  return (
    <p
      className={className}
      style={className ? undefined : { margin: 0, fontSize: "0.78rem", lineHeight: 1.5, color: "var(--cl-muted, var(--color-muted))" }}
    >
      {lang === "ta"
        ? "இந்த விவரங்கள் இந்த முடிவுக்கு மட்டுமே பயன்படும்; நாங்கள் அவற்றைச் சேமிப்பதில்லை. "
        : "These details are used for this result only; we do not store them. "}
      <Link href="/privacy" target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
        {lang === "ta" ? "தனியுரிமை அறிவிப்பு" : "Privacy notice"}
      </Link>
    </p>
  );
}
