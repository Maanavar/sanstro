"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";

import { confirmBirthProfileLocation, updateBirthProfileLocation } from "@vinaadi/shared/api/charts";
import { timeZoneCityLabel } from "@vinaadi/shared/checkIn";
import "@/lib/api"; // initialises the shared API client the wrappers above use
import { ModalShell } from "@/components/modal-shell";
import { PlaceCombobox, type CityEntry } from "@/components/place-combobox";
import { dt, LOCATION_CHECK } from "@/lib/dashboard-i18n";
import type { Lang } from "@/lib/i18n";

/**
 * §2 of docs/HOME_CALENDAR_CHARTS_PROPOSALS_2026-09-22.md.
 *
 * Two questions in one strip, because they have the same two answers and §2.3
 * gives them one slot between them:
 *
 * - `mismatch` — the device's timezone disagrees with the one today's timings
 *   were built for. §2.1 calls this the main path: it catches an actual move
 *   on the day it matters.
 * - `backstop` — nobody has confirmed the location in 45 days (R2).
 *
 * Accepting never saves a timezone's city directly. Owner ruling 2026-09-22: a
 * zone names a representative city, not the reader's — `Asia/Kolkata` covers
 * Chennai, and sunrise moves with longitude — so the accept button opens the
 * place picker prefilled with that name and the reader confirms a real place.
 * One extra tap buys coordinates a human chose.
 */
export type LocationCheckVariant = "location-mismatch" | "location-backstop";

export function LocationCheckStrip({
  variant,
  lang,
  birthProfileId,
  /** The place today's timings were computed for; may be absent on a profile
   *  that has never had a usable location. */
  currentPlace,
  /** The device's IANA zone — only read for the mismatch wording. */
  deviceTimeZone,
  onResolved,
  onDismiss,
}: {
  variant: LocationCheckVariant;
  lang: Lang;
  birthProfileId: string;
  currentPlace: string | null;
  deviceTimeZone: string | null;
  /** The check is answered: the caller refetches and stops offering it. */
  onResolved: () => void;
  onDismiss: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const deviceCity = timeZoneCityLabel(deviceTimeZone);
  const isMismatch = variant === "location-mismatch";

  // A mismatch with no readable zone city has nothing to name, so it asks the
  // backstop's place-free question instead of printing an empty slot.
  const question = isMismatch && deviceCity
    ? dt(LOCATION_CHECK.mismatchQuestion, lang).replaceAll("%1$s", deviceCity)
    : currentPlace
      ? dt(LOCATION_CHECK.backstopQuestion, lang).replace("%1$s", currentPlace)
      : dt(LOCATION_CHECK.backstopQuestionNoPlace, lang);

  const changeLabel = isMismatch && deviceCity
    ? dt(LOCATION_CHECK.mismatchUse, lang).replace("%1$s", deviceCity)
    : dt(LOCATION_CHECK.change, lang);

  const keepLabel = isMismatch && currentPlace
    ? dt(LOCATION_CHECK.mismatchKeep, lang).replace("%1$s", currentPlace)
    : dt(LOCATION_CHECK.keep, lang);

  async function keep() {
    setBusy(true);
    setFailed(false);
    try {
      await confirmBirthProfileLocation(birthProfileId);
      onResolved();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function save(city: CityEntry) {
    setBusy(true);
    setFailed(false);
    try {
      await updateBirthProfileLocation(birthProfileId, {
        currentPlace: city.name,
        currentLatitude: Number(city.lat),
        currentLongitude: Number(city.lng),
        currentTimezone: city.timezone,
      });
      setPicking(false);
      onResolved();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Same one-line strip the life focus uses (§2.2), so a reader meets one
          check-in shape rather than two. */}
      <div className="nova-focus-nudge" role="region" aria-label={dt(LOCATION_CHECK.eyebrow, lang)}>
        <MapPin size={15} strokeWidth={1.9} aria-hidden="true" className="nova-focus-nudge__icon" />
        <span className="nova-focus-nudge__q">{question}</span>
        <span className="nova-focus-nudge__actions">
          <button
            type="button"
            className="nova-focus-nudge__btn nova-focus-nudge__btn--primary"
            disabled={busy}
            onClick={() => setPicking(true)}
            aria-haspopup="dialog"
          >
            {changeLabel}
          </button>
          <button type="button" className="nova-focus-nudge__btn" disabled={busy} onClick={() => void keep()}>
            {keepLabel}
          </button>
          <button
            type="button"
            className="nova-focus-nudge__close"
            onClick={onDismiss}
            aria-label={dt(LOCATION_CHECK.dismiss, lang)}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        </span>
      </div>
      {failed && (
        <p role="alert" style={{ fontSize: "var(--text-sm)", color: "var(--color-low)", marginTop: "var(--space-2)" }}>
          {dt(LOCATION_CHECK.saveFailed, lang)}
        </p>
      )}

      {picking && (
        <ModalShell label={dt(LOCATION_CHECK.pickerTitle, lang)} onClose={() => setPicking(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>{dt(LOCATION_CHECK.pickerTitle, lang)}</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)", margin: 0, lineHeight: 1.5 }}>
              {dt(LOCATION_CHECK.pickerHelp, lang)}
            </p>
            <PlaceCombobox
              lang={lang}
              // Prefilled with the zone's city as a *search seed*; nothing is
              // saved until the reader picks a real entry out of the list.
              value={isMismatch && deviceCity ? deviceCity : (currentPlace ?? "")}
              aria-label={dt(LOCATION_CHECK.pickerTitle, lang)}
              onChange={(city) => {
                if (city) void save(city);
              }}
            />
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={() => setPicking(false)}
              disabled={busy}
              style={{ alignSelf: "flex-start" }}
            >
              {dt(LOCATION_CHECK.cancel, lang)}
            </button>
          </div>
        </ModalShell>
      )}
    </>
  );
}
