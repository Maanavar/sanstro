"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { RemedyPlanItem, GemstoneAdviceItem } from "@/lib/types";
import { Button } from "./dashboard-ui";
import { CollapsibleSection } from "./collapsible-section";

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  sage: "#5C7654",
  terracotta: "#B85A2C",
  rust: "#A8482F",
} as const;

const PLANET_COLORS: Record<string, string> = {
  SUN: "#D08B4A", MOON: "#6B8DB8", MARS: "#CF6354", MERCURY: "#A99663",
  JUPITER: "#93A56D", VENUS: "#C59AC3", SATURN: "#607089", RAHU: "#9F93C4", KETU: "#9A8679",
};

function PlanetBadge({ planet }: { planet: string }) {
  const color = PLANET_COLORS[planet] ?? W.muted;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "var(--radius-pill)",
      background: `${color}22`,
      border: `1px solid ${color}55`,
      color,
      fontSize: "0.8rem",
      fontWeight: 700,
    }}>
      {planet}
    </span>
  );
}

function RemedyRow({ label, value, lang }: { label: string; value: string; lang: Lang }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: "var(--space-2_5)", marginBottom: "var(--space-1_5)", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: W.muted, minWidth: "7rem", textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: "1px" }}>{label}</span>
      <span style={{ fontSize: "0.83rem", color: W.inkMid, flex: 1 }}>{value}</span>
    </div>
  );
}

type Props = {
  lang: Lang;
  chartId: string | null;
  remedyPlan: RemedyPlanItem[] | null;
  gemstoneAdvice: GemstoneAdviceItem[] | null;
  loading: boolean;
  onLoad: () => void;
};

export function RemediesPanel({ lang, chartId, remedyPlan, gemstoneAdvice, loading, onLoad }: Props) {
  const [subTab, setSubTab] = useState<"plan" | "gemstone">("plan");

  if (!chartId) {
    return (
      <p style={{ fontSize: "0.82rem", color: W.muted, padding: "var(--space-3) 0" }}>
        {t("remedies_empty", lang)}
      </p>
    );
  }

  const hasData = remedyPlan !== null || gemstoneAdvice !== null;

  return (
    <div>
      {/* Sub-tab pills */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
        {(["plan", "gemstone"] as const).map((tab) => {
          const isActive = tab === subTab;
          const label = tab === "plan" ? t("remedies_plan_title", lang) : t("remedies_gemstone_title", lang);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              style={{
                padding: "5px 14px",
                borderRadius: "var(--radius-pill)",
                border: `1.5px solid ${isActive ? W.terracotta : W.borderLt}`,
                background: isActive ? "rgba(184,90,44,0.1)" : W.surface,
                color: isActive ? W.terracotta : W.muted,
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.82rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          );
        })}

        {!hasData && (
          <Button variant="ghost" onClick={onLoad} disabled={loading}>
            {loading
              ? t("remedies_loading", lang)
              : subTab === "gemstone"
              ? t("remedies_load_gemstone", lang)
              : t("remedies_load", lang)}
          </Button>
        )}
      </div>

      {/* Remedy Plan */}
      {subTab === "plan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {!remedyPlan && (
            <p style={{ fontSize: "0.82rem", color: W.muted }}>{t("remedies_empty", lang)}</p>
          )}
          {remedyPlan?.map((item) => (
            <CollapsibleSection
              key={item.planet}
              defaultOpen={item.priority === 1}
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: W.muted, minWidth: "5rem" }}>
                    {t("remedies_priority", lang)} {item.priority}
                  </span>
                  <PlanetBadge planet={item.planet} />
                  <span style={{ fontSize: "0.78rem", color: W.muted }}>{item.reason}</span>
                </div>
              }
            >
              <div style={{
                marginTop: "var(--space-2_5)",
                padding: "var(--space-3)",
                background: W.surfaceMd,
                borderRadius: "var(--radius-card)",
                border: `1px solid ${W.borderLt}`,
              }}>
                <RemedyRow label={t("remedies_day", lang)} value={item.day} lang={lang} />
                <RemedyRow label={t("remedies_temple", lang)} value={lang === "ta" ? item.templeTa : item.templeEn} lang={lang} />
                <RemedyRow
                  label={t("remedies_mantra", lang)}
                  value={`${item.mantraFullTa}${item.japaCount ? ` × ${item.japaCount.toLocaleString()}` : ""}`}
                  lang={lang}
                />
                <RemedyRow label={t("remedies_daanam", lang)} value={lang === "ta" ? item.daanumItemsTa : item.daanumItemsEn} lang={lang} />
                <RemedyRow label={t("remedies_fasting", lang)} value={lang === "ta" ? item.fastingRuleTa : item.fastingRuleEn} lang={lang} />
                <RemedyRow label={t("remedies_behaviour", lang)} value={lang === "ta" ? item.behaviouralTa : item.behaviouralEn} lang={lang} />
                {item.gemstoneTa && (
                  <div style={{
                    marginTop: "var(--space-2)",
                    padding: "var(--space-2) var(--space-3)",
                    borderRadius: "6px",
                    background: "rgba(92,118,84,0.1)",
                    border: `1px solid rgba(92,118,84,0.3)`,
                    fontSize: "0.78rem",
                    color: W.sage,
                  }}>
                    💎 {lang === "ta" ? item.gemstoneTa : item.gemstoneEn}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          ))}
        </div>
      )}

      {/* Gemstone Advice */}
      {subTab === "gemstone" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {!gemstoneAdvice && (
            <p style={{ fontSize: "0.82rem", color: W.muted }}>{t("remedies_empty", lang)}</p>
          )}
          {gemstoneAdvice?.map((item) => {
            const prescribed = item.isGemstonePrescribed;
            const optional = !prescribed && item.gemstoneNameEn;
            const tone = prescribed ? W.sage : optional ? W.terracotta : W.muted;
            const icon = prescribed ? "✓" : optional ? "⚠" : "✗";
            const statusLabel = prescribed
              ? t("remedies_prescribed", lang)
              : optional
              ? t("remedies_optional", lang)
              : t("remedies_not_prescribed", lang);

            return (
              <div
                key={item.planet}
                style={{
                  padding: "var(--space-2_5) var(--space-3)",
                  borderRadius: "var(--radius-card)",
                  background: W.surface,
                  border: `1px solid ${W.borderLt}`,
                  display: "flex",
                  gap: "var(--space-3)",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "0.9rem", color: tone, fontWeight: 700, minWidth: "1.2rem" }}>{icon}</span>
                <PlanetBadge planet={item.planet} />
                <div style={{ flex: 1, minWidth: "10rem" }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: tone, marginBottom: "2px" }}>
                    {item.gemstoneNameEn ? (lang === "ta" ? item.gemstoneNameTa : item.gemstoneNameEn) : statusLabel}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: W.muted }}>
                    {lang === "ta" ? item.reasonTa : item.reasonEn}
                  </p>
                  {item.cautionEn && (
                    <p style={{ fontSize: "0.72rem", color: W.terracotta, marginTop: "3px" }}>
                      ⚠ {lang === "ta" ? item.cautionTa : item.cautionEn}
                    </p>
                  )}
                  <span style={{ fontSize: "0.7rem", color: W.muted, fontStyle: "italic" }}>
                    {item.functionalNature}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
