"use client";

import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type UserMode = "BEGINNER" | "BALANCED" | "TRADITIONAL";

const MODE_ICONS: Record<UserMode, string> = {
  BEGINNER:    "🌱",
  BALANCED:    "⚖️",
  TRADITIONAL: "🔱",
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

  return (
    <span className="mode-badge" title={label}>
      <span aria-hidden="true">{MODE_ICONS[mode]}</span>
      {label}
    </span>
  );
}
