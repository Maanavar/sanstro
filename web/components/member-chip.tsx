"use client";

// ORPHANED 2026-08-08 — NOT IMPORTED ANYWHERE. Verified by sweeping every import
// specifier in web/, packages/ and mobile/; nothing mentions it at all. Do not
// fix a bug here — find the file that ships.
// See docs/EFFICIENCY_FIX_PLAN_2026-08-07.md F11. Deletion is a separate,
// per-file decision and has not been made.

import { getScoreBand } from "@/lib/format";

interface MemberChipProps {
  displayName: string;
  score: number | null;
  onClick?: () => void;
}

export function MemberChip({ displayName, score, onClick }: MemberChipProps) {
  const band = score !== null ? getScoreBand(score) : null;

  let dotClass = "member-chip__dot";
  if (!band) dotClass += " member-chip__dot--rest";
  else if (band.tone === "high") dotClass += " member-chip__dot--high";
  else if (band.tone === "low") dotClass += " member-chip__dot--low";
  else dotClass += " member-chip__dot--mid";

  const initial = displayName.trim()[0]?.toUpperCase() ?? "?";

  return (
    <button
      type="button"
      className="member-chip"
      onClick={onClick}
      aria-label={`${displayName}${score !== null ? `, score ${score}` : ""}`}
    >
      <div className="member-chip__avatar">
        {initial}
        {score !== null && <span className={dotClass} aria-hidden="true" />}
      </div>
      <span className="member-chip__name">{displayName}</span>
    </button>
  );
}
