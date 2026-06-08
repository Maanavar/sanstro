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
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {/* Methodology note */}
          <div style={{ padding: "var(--space-2_5) var(--space-3)", borderRadius: "var(--radius-sm)", background: "#EEF1F8", border: "1px solid rgba(122,111,94,0.18)", fontSize: "0.78rem", color: W.muted, lineHeight: 1.5 }}>
            {lang === "ta"
              ? "கற்கள் திருகணிதம் அடிப்படையில் கணக்கிடப்படுகின்றன — ஒவ்வொரு கிரகத்தின் செயல்பாட்டு தன்மை (பயனளிப்பவர் / தீங்கு செய்பவர்), வலிமை, மற்றும் லக்னம் அடிப்படையில். ஒரு கல் 'பரிந்துரைக்கப்பட்டது' என்றால் அந்த கிரகம் உங்கள் ஜாதகத்தில் நேர்மறையான கிரகம் மற்றும் வலிமை குறைவாக உள்ளது."
              : "Gemstone recommendations follow Thirukanitham — each planet's functional nature (benefic/malefic for your Lagna), its strength, and whether strengthening it helps or harms your chart. 'Prescribed' means the planet is a functional benefic AND needs strengthening. 'Not prescribed' means the planet is either strong enough or would harm your chart if strengthened."}
          </div>

          {!gemstoneAdvice && (
            <p style={{ fontSize: "0.82rem", color: W.muted }}>{t("remedies_empty", lang)}</p>
          )}
          {gemstoneAdvice && (
            <>
              {/* Prescribed first, then optional, then not-prescribed */}
              {[
                { filter: (i: typeof gemstoneAdvice[0]) => i.isGemstonePrescribed, groupLabel: lang === "ta" ? "பரிந்துரைக்கப்பட்டவை" : "Prescribed — wear these", tone: W.sage, bg: "rgba(92,118,84,0.07)", border: "rgba(92,118,84,0.28)" },
                { filter: (i: typeof gemstoneAdvice[0]) => !i.isGemstonePrescribed && !!i.gemstoneNameEn, groupLabel: lang === "ta" ? "விருப்பப்பட்டால் (கவனமாக)" : "Optional — with caution", tone: W.terracotta, bg: "rgba(184,90,44,0.06)", border: "rgba(184,90,44,0.25)" },
                { filter: (i: typeof gemstoneAdvice[0]) => !i.isGemstonePrescribed && !i.gemstoneNameEn, groupLabel: lang === "ta" ? "பரிந்துரைக்கப்படாதவை" : "Not recommended", tone: W.muted, bg: "transparent", border: W.borderLt },
              ].map(({ filter, groupLabel, tone, bg, border }) => {
                const group = gemstoneAdvice.filter(filter);
                if (group.length === 0) return null;
                return (
                  <div key={groupLabel}>
                    <p style={{ margin: "0 0 var(--space-1_5)", fontSize: "0.69rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: tone }}>{groupLabel}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {group.map((item) => {
                        const functionalHuman = item.functionalNature?.toLowerCase().includes("benefic")
                          ? (lang === "ta" ? "உங்கள் லக்னத்திற்கு சாதகமான கிரகம்" : "Beneficial planet for your Lagna")
                          : item.functionalNature?.toLowerCase().includes("malefic")
                          ? (lang === "ta" ? "உங்கள் லக்னத்திற்கு கடினமான கிரகம்" : "Challenging planet for your Lagna")
                          : item.functionalNature ?? "";
                        return (
                          <div
                            key={item.planet}
                            style={{
                              padding: "var(--space-2_5) var(--space-3)",
                              borderRadius: "var(--radius-card)",
                              background: bg,
                              border: `1px solid ${border}`,
                              display: "grid",
                              gridTemplateColumns: "auto 1fr",
                              gap: "var(--space-3)",
                              alignItems: "flex-start",
                            }}
                          >
                            <PlanetBadge planet={item.planet} />
                            <div>
                              <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.85rem", fontWeight: 700, color: tone }}>
                                {item.gemstoneNameEn
                                  ? (lang === "ta" ? item.gemstoneNameTa : item.gemstoneNameEn)
                                  : (lang === "ta" ? "கல் தேவையில்லை" : "No gemstone needed")}
                              </p>
                              <p style={{ margin: "0 0 var(--space-0_75)", fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.45 }}>
                                {lang === "ta" ? item.reasonTa : item.reasonEn}
                              </p>
                              {item.cautionEn && (
                                <p style={{ margin: "0 0 var(--space-0_5)", fontSize: "0.72rem", color: W.terracotta, lineHeight: 1.4 }}>
                                  ⚠ {lang === "ta" ? item.cautionTa : item.cautionEn}
                                </p>
                              )}
                              {functionalHuman && (
                                <span style={{ fontSize: "0.69rem", color: W.muted, fontStyle: "italic" }}>
                                  {functionalHuman}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
