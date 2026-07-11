"use client";

import { motion, useReducedMotion } from "framer-motion";

import { getScoreBand } from "@/lib/format";
import { WarningGlyph } from "./icons";
import type { WeekAheadDayItem } from "@/lib/types";

interface DayStripProps {
  days: WeekAheadDayItem[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


export function DayStrip({ days, selectedDate, onSelectDate }: DayStripProps) {
  // A single gold bar glides between cells as the selected day changes
  // (framer shared-layout via layoutId). Disabled under reduced motion —
  // framer layout animations run on JS transforms, so the CSS reduced-motion
  // guard can't reach them; we gate here and render a static bar instead.
  const reduce = useReducedMotion();

  return (
    <div className="day-strip" aria-label="Week ahead scores">
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
            className={cellClass}
            style={{ position: "relative" }}
            onClick={() => onSelectDate(day.dateLocal)}
            aria-label={`${day.dateLocal}: score ${day.score}`}
            aria-pressed={isSelected}
          >
            {isSelected &&
              (reduce ? (
                <span className="day-strip__glide" />
              ) : (
                <motion.span
                  layoutId="day-strip-active-bar"
                  className="day-strip__glide"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              ))}
            <span className="day-strip__day">{SHORT_DAYS[dayOfWeek]}</span>
            <span className="day-strip__score">{day.score}</span>
            <span className={dotClass} />
            {isChandrashtama && (
              <span style={{ color: "var(--color-alert-critical-text, var(--color-alert-critical))", display: "inline-flex", alignItems: "center" }} aria-label="Chandrashtama">
                <WarningGlyph size={10} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
