"use client";

import type { Lang } from "@/lib/i18n";

interface PersonalYearMeaning {
  number: number;
  themeEn?: string | null;
  themeTa?: string | null;
  actionEn?: string | null;
  actionTa?: string | null;
  watchEn?: string | null;
  watchTa?: string | null;
  monthHintEn?: string | null;
  monthHintTa?: string | null;
}

interface PersonalYearMeaningCardProps {
  meaning: PersonalYearMeaning;
  label?: string;
  showHint?: boolean;
  ta: boolean;
}

/**
 * Card displaying meaning and guidance for a personal year/month/day number.
 *
 * Shows theme, action, and watch-for when available. Can optionally show
 * the month hint (e.g. "year number 5 + calendar month 7") which explains
 * how the number is calculated.
 *
 * When content is not reviewed (meaning fields are null), the card shows
 * a placeholder without error.
 */
export function PersonalYearMeaningCard({
  meaning,
  label,
  showHint = false,
  ta,
}: PersonalYearMeaningCardProps) {
  const theme = ta ? meaning.themeTa : meaning.themeEn;
  const action = ta ? meaning.actionTa : meaning.actionEn;
  const watch = ta ? meaning.watchTa : meaning.watchEn;
  const hint = ta ? meaning.monthHintTa : meaning.monthHintEn;

  // If no content is available, render nothing (content not reviewed)
  if (!theme && !action && !watch && !hint) {
    return null;
  }

  return (
    <div className="cl-num-meaning">
      {label && <div className="cl-num-meaning__label">{label}</div>}

      {theme && (
        <div className="cl-num-meaning__section">
          <div className="cl-num-meaning__heading">
            {ta ? "கருப்பொருள்" : "Theme"}
          </div>
          <p className="cl-num-meaning__text">{theme}</p>
        </div>
      )}

      {action && (
        <div className="cl-num-meaning__section">
          <div className="cl-num-meaning__heading">
            {ta ? "செய்ய வேண்டியவை" : "Action"}
          </div>
          <p className="cl-num-meaning__text">{action}</p>
        </div>
      )}

      {watch && (
        <div className="cl-num-meaning__section">
          <div className="cl-num-meaning__heading">
            {ta ? "கவனிக்க வேண்டியவை" : "Watch for"}
          </div>
          <p className="cl-num-meaning__text">{watch}</p>
        </div>
      )}

      {showHint && hint && (
        <div className="cl-num-meaning__hint">
          {hint}
        </div>
      )}
    </div>
  );
}
