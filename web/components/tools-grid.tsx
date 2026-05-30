"use client";

import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ToolCard } from "./tool-card";

interface ToolsGridProps {
  lang: Lang;
  birthProfileId: string;
  onOpenPorutham: () => void;
  onOpenChartGenerate: () => void;
  onOpenRectification: () => void;
  onOpenWrapped: () => void;
  onOpenRetrospective: () => void;
}

export function ToolsGrid({
  lang,
  birthProfileId,
  onOpenPorutham,
  onOpenChartGenerate,
  onOpenRectification,
  onOpenWrapped,
  onOpenRetrospective,
}: ToolsGridProps) {
  const needsProfile = !birthProfileId;
  const needsProfileNote = needsProfile ? t("tools_needs_profile", lang) : undefined;

  return (
    <div style={{ padding: "24px 0" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
        {t("tools_heading", lang)}
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "0.875rem", color: "var(--color-muted)" }}>
        {t("tools_subtitle", lang)}
      </p>
      <div className="tool-grid">
        <ToolCard
          icon="🔗"
          nameKey="tool_porutham_name"
          descKey="tool_porutham_desc"
          lang={lang}
          onClick={onOpenPorutham}
        />
        <ToolCard
          icon="📐"
          nameKey="tool_chart_gen_name"
          descKey="tool_chart_gen_desc"
          lang={lang}
          onClick={onOpenChartGenerate}
        />
        <ToolCard
          icon="🕰"
          nameKey="tool_rectify_name"
          descKey="tool_rectify_desc"
          lang={lang}
          disabled={needsProfile}
          note={needsProfileNote}
          onClick={onOpenRectification}
        />
        <ToolCard
          icon="🎁"
          nameKey="tool_wrapped_name"
          descKey="tool_wrapped_desc"
          lang={lang}
          disabled={needsProfile}
          note={needsProfileNote}
          onClick={onOpenWrapped}
        />
        <ToolCard
          icon="🔍"
          nameKey="tool_retro_name"
          descKey="tool_retro_desc"
          lang={lang}
          disabled={needsProfile}
          note={needsProfileNote}
          onClick={onOpenRetrospective}
        />
      </div>
    </div>
  );
}
