import type { Lang } from "@/lib/i18n";

/**
 * Loading stand-in for a card body whose data has not arrived (DXA-03).
 *
 * A card that is still waiting shows its own shape, never its empty-state
 * copy: "No family members yet" or "Create a birth profile" read as facts
 * about the account, and they were shown to users who have both, for the
 * length of a round trip. The empty copy belongs to a finished lookup that
 * found nothing.
 */
export function PendingPlaceholder({ lang, tiles, lines = 2 }: { lang: Lang; tiles?: number; lines?: number }) {
  return (
    <div role="status" aria-busy="true" data-pending-placeholder="">
      <span className="cd-visually-hidden">{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</span>
      {tiles ? (
        <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))", gap: "var(--space-2_5)" }}>
          {Array.from({ length: tiles }, (_, i) => (
            <span key={i} className="skel" style={{ display: "block", height: "104px", borderRadius: "var(--radius-md)" }} />
          ))}
        </div>
      ) : (
        <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2_5)" }}>
          {Array.from({ length: lines }, (_, i) => (
            // Sized inline: skeleton.css (skel-line-*) only loads with components/skeleton.
            <span key={i} className="skel" style={{ display: "block", height: "13px", width: i === lines - 1 ? "65%" : "100%", borderRadius: "var(--radius-sm)" }} />
          ))}
        </div>
      )}
    </div>
  );
}
