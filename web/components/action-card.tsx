"use client";

import { formatClockLabel } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface ActionCardProps {
  variant: "positive" | "avoid";
  timeStart: string;
  timeEnd: string;
  note?: string;
  lang: Lang;
}

export function ActionCard({ variant, timeStart, timeEnd, note, lang }: ActionCardProps) {
  const label = variant === "positive"
    ? t("action_best_window", lang)
    : t("action_avoid_window", lang);

  return (
    <div className={`action-card action-card--${variant}`}>
      <span className="action-card__label">{label}</span>
      <span className="action-card__time">
        {formatClockLabel(timeStart)} – {formatClockLabel(timeEnd)}
      </span>
      {note && <span className="action-card__note">{note}</span>}
    </div>
  );
}
