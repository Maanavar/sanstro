"use client";

import { getScoreBand } from "@/lib/format";
import type { WeekAheadDayItem } from "@/lib/types";

interface DayStripProps {
  days: WeekAheadDayItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_DAYS_TA = ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"];

export function DayStrip({ days, selectedDate, onSelectDate }: DayStripProps) {
  return (
    <div className="day-strip" role="list" aria-label="Week ahead scores">
      {days.map((day) => {
        const band = getScoreBand(day.score);
        const date = new Date(day.dateLocal);
        const dayOfWeek = date.getUTCDay();
        const isSelected = day.dateLocal === selectedDate;
        const isChandrashtama = day.isChandrashtama;

        let cellClass = "day-strip__cell";
        if (isSelected) cellClass += " day-strip__cell--active";
        else if (band.tone === "high") cellClass += " day-strip__cell--high";
        else if (band.tone === "low") cellClass += " day-strip__cell--low";
        else cellClass += " day-strip__cell--mid";

        let dotClass = "day-strip__dot";
        if (isChandrashtama) dotClass += " day-strip__dot--low";
        else if (band.tone === "high") dotClass += " day-strip__dot--high";
        else if (band.tone === "low") dotClass += " day-strip__dot--low";
        else dotClass += " day-strip__dot--mid";

        return (
          <button
            key={day.dateLocal}
            type="button"
            role="listitem"
            className={cellClass}
            onClick={() => onSelectDate(day.dateLocal)}
            aria-label={`${day.dateLocal}: score ${day.score}`}
            aria-pressed={isSelected}
          >
            <span className="day-strip__day">{SHORT_DAYS[dayOfWeek]}</span>
            <span className="day-strip__score">{day.score}</span>
            <span className={dotClass} />
            {isChandrashtama && (
              <span style={{ fontSize: "0.55rem", color: "var(--color-alert-critical)" }} aria-label="Chandrashtama">⚠</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
