"use client";

import { Sprout, Scale, Triangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

const MODE_ICONS: Record<UserMode, LucideIcon> = {
  BEGINNER:    Sprout,
  BALANCED:    Scale,
  TRADITIONAL: Triangle,
};

interface ModeBadgeProps {
  mode: UserMode;
  lang: Lang;
}

export function ModeBadge({ mode, lang }: ModeBadgeProps) {
  const label = mode === "BEGINNER"
    ? t("mode_beginner", lang)
    : mode === "TRADITIONAL"
      ? t("mode_traditional", lang)
      : t("mode_balanced", lang);
  const ModeIcon = MODE_ICONS[mode];

  return (
    <span className="mode-badge" title={label}>
      <ModeIcon size={14} aria-hidden="true" strokeWidth={1.5} />
      {label}
    </span>
  );
}
