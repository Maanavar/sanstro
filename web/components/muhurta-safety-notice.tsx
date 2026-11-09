"use client";

import { muhurtaSafetyNotices } from "@vinaadi/shared/muhurtaSafety";
import type { Lang } from "@/lib/i18n";

/**
 * Fixed safety lines on a muhurta result (deferred-checks plan, item 4).
 *
 * The backend decides which apply (`safetyNotices` keys; today only MEDICAL)
 * and `@vinaadi/shared/muhurtaSafety` words them. Shown above the results, not
 * folded into a slot, because it is about what the timing is for, not about
 * any one day. Plain note styling: it is guidance, not an alarm.
 */
export function MuhurtaSafetyNotice({ keys, lang }: { keys: readonly string[] | null | undefined; lang: Lang }) {
  const lines = muhurtaSafetyNotices(keys, lang === "ta" ? "ta" : "en");
  if (lines.length === 0) return null;
  return (
    <div
      role="note"
      style={{
        margin: "0 0 14px", padding: "10px 12px", borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-mid-border)", background: "var(--color-surface-soft)",
      }}
    >
      {lines.map((line) => (
        <p key={line} style={{ margin: 0, fontSize: "var(--text-base)", lineHeight: 1.55, color: "var(--color-text)" }}>
          {line}
        </p>
      ))}
    </div>
  );
}
