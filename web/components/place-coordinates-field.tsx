"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

function formatDegrees(value: string, positiveLabel: string, negativeLabel: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `${Math.abs(n).toFixed(2)}°${n < 0 ? negativeLabel : positiveLabel}`;
}

/** Drives the matched-badge / edit-coordinates toggle. `showRawFields` tells
 * the caller whether to render its own lat/lng inputs instead of the badge.
 *
 * B-006: place search moved from a static in-memory array to the bundled
 * `/places/search` endpoint (async), so "matched" can no longer be
 * re-derived on every render by looking the current place/lat/lng up in that
 * array (#3/#16/#90's original fix). Instead the caller's `PlaceCombobox`
 * `onChange` — which already knows directly whether a real record was
 * selected — calls `setMatched` at selection time. `matched` starts `true`
 * when the field already carries a saved place + coordinates (an existing
 * profile being edited), so reopening the form shows the badge rather than
 * raw fields; it starts `false` for a blank field. */
export function usePlaceCoordinatesConfirm(place: string, latitude: string, longitude: string) {
  const [editing, setEditing] = useState(false);
  const [matched, setMatched] = useState(() => Boolean(place && latitude && longitude));
  const showRawFields = !matched || editing;
  return { matched, setMatched, editing, setEditing, showRawFields };
}

const W = {
  sage: "var(--chart-d9-active)",
  sageLt: "rgba(92,118,84,0.12)",
  sageBorder: "rgba(92,118,84,0.35)",
  ink: "var(--deepdive-ink-mid, var(--panel-earth))",
  muted: "var(--color-faint)",
  terracota: "var(--deepdive-accent, var(--panel-brand))",
} as const;

type PlaceMatchedBadgeProps = {
  lang: Lang;
  place: string;
  latitude: string;
  longitude: string;
  onEditClick: () => void;
};

/** The trust affordance itself: renders instead of raw lat/lng inputs when
 * the place matches a known city — shows a human-readable degree readout and
 * an explicit "matched" state, with an escape hatch to hand-edit if needed. */
export function PlaceMatchedBadge({ lang, place, latitude, longitude, onEditClick }: PlaceMatchedBadgeProps) {
  return (
    <div style={{
      gridColumn: "1 / -1", display: "flex", alignItems: "flex-start", gap: "10px",
      padding: "10px 14px", borderRadius: "10px",
      background: W.sageLt, border: `1px solid ${W.sageBorder}`,
    }}>
      <span aria-hidden="true" style={{ fontSize: "1rem", lineHeight: 1, marginTop: "1px" }}>📍</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: W.ink }}>{place}</p>
        <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: W.muted }}>
          {formatDegrees(latitude, "N", "S")}, {formatDegrees(longitude, "E", "W")} · {t("place_matched", lang)}
        </p>
      </div>
      <button
        type="button"
        onClick={onEditClick}
        style={{
          background: "none", border: "none", padding: 0, marginTop: "1px",
          fontSize: "0.75rem", color: W.terracota, textDecoration: "underline",
          cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
        }}
      >
        {t("place_edit_coords", lang)}
      </button>
    </div>
  );
}

/** Small footer shown under the raw lat/lng inputs — explains why they're
 * visible (no match found) or offers a way back to the matched badge. */
export function PlaceCoordinatesFooter({
  lang, place, matched, onUseMatched,
}: { lang: Lang; place: string; matched: boolean; onUseMatched: () => void }) {
  if (matched) {
    return (
      <div style={{ gridColumn: "1 / -1", marginTop: "-6px" }}>
        <button
          type="button"
          onClick={onUseMatched}
          style={{
            background: "none", border: "none", padding: 0,
            fontSize: "0.75rem", color: W.terracota, textDecoration: "underline",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {t("place_use_matched", lang)}
        </button>
      </div>
    );
  }
  if (!place.trim()) return null;
  return (
    <p style={{ gridColumn: "1 / -1", margin: "-6px 0 0", fontSize: "0.75rem", color: W.muted, lineHeight: 1.4 }}>
      {t("place_unmatched_hint", lang)}
    </p>
  );
}
