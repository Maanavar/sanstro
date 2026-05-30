"use client";

import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface ToolCardProps {
  icon: string;
  nameKey: Parameters<typeof t>[0];
  descKey: Parameters<typeof t>[0];
  lang: Lang;
  disabled?: boolean;
  note?: string;
  onClick: () => void;
}

export function ToolCard({ icon, nameKey, descKey, lang, disabled, note, onClick }: ToolCardProps) {
  return (
    <div className="tool-card">
      <span className="tool-card__icon" aria-hidden="true">{icon}</span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <p className="tool-card__name">{t(nameKey, lang)}</p>
        <p className="tool-card__desc">{t(descKey, lang)}</p>
        {note && <span className="tool-card__note">{note}</span>}
      </div>
      <button
        type="button"
        className="tool-card__cta"
        onClick={onClick}
        disabled={disabled}
        aria-label={t(nameKey, lang)}
      >
        {t("tool_open", lang)}
      </button>
    </div>
  );
}
