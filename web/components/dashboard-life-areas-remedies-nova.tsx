"use client";

import { useState } from "react";
import { Gem } from "lucide-react";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { RemedyPlanItem, GemstoneAdviceItem } from "@/lib/types";
import { CollapsibleSection } from "./collapsible-section";

/**
 * Nova re-skin of dashboard-remedies-panel.tsx's RemediesPanel — one of the
 * 4 sub-tab panels deferred (Classic-styled) when Life Areas Nova first
 * shipped (Phase 9, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.8). Grepped every
 * var(--...) reference in the Classic file first: its own `W` token map
 * (ink/inkMid/border/borderLt/surface/surfaceMd) reads --panel-earth-dark/
 * --panel-earth/--panel-tan/--panel-tan-light/--panel-cream/--panel-hover —
 * the same 5 custom properties the 2026-07-06 browser-QA round reverted
 * (not redirected) after they broke selected-pill text elsewhere app-wide
 * (see Journal's identical finding, §6.11) — plus several Classic-only
 * --cl-* rgba tints (--cl-neutral-tint/-ring, --cl-brand-tint/-ring,
 * --cl-sage-tint/-ring) with no Nova override. So this is a fresh
 * Nova-token rebuild, not a gap-fix.
 *
 * Its PLANET_COLORS map also reads raw --planet-sun/-moon/-mars/-mercury/
 * -jupiter/-venus/-saturn-soft/-rahu/-ketu — none of those are Nova-safe
 * either (only --planet-lagna/-saturn/-nodes/-other are redirected, per
 * dashboard-nova.css). Rather than invent a new mapping, this file reuses
 * the exact per-planet color precedent §6.10's Transits view already
 * established (Sun/Jupiter → accent-strong, Moon/Venus → accent-secondary,
 * Mars → low, Mercury → high, Saturn → the existing one-off --planet-other
 * blue, Rahu/Ketu → plain text) for consistency across Nova.
 *
 * `CollapsibleSection` is reused verbatim — confirmed Nova-safe (its own
 * classes read var(--color-text)/var(--color-muted), and the one place
 * globals.css hardcoded literal Classic hex for it at `.cd-shell` scope was
 * already gap-fixed in Phase 1). The shared `Button` primitive is
 * deliberately NOT reused: its inline style reads --panel-brand/-earth/-tan/
 * -brand-border directly, none of which are Nova-redirected, so every prior
 * Nova screen has always built its own inline buttons instead — same
 * precedent followed here.
 */

const NOVA_PLANET_COLOR: Record<string, string> = {
  SUN: "var(--color-accent-strong)",
  JUPITER: "var(--color-accent-strong)",
  MOON: "var(--color-accent-secondary)",
  VENUS: "var(--color-accent-secondary)",
  MARS: "var(--color-low)",
  MERCURY: "var(--color-high)",
  SATURN: "var(--planet-other)",
  RAHU: "var(--color-text)",
  KETU: "var(--color-text)",
};

function NovaPlanetBadge({ planet }: { planet: string }) {
  const color = NOVA_PLANET_COLOR[planet] ?? "var(--color-faint)";
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "999px", background: `${color}22`, border: `1px solid ${color}55`, color, fontSize: "13px", fontWeight: 700 }}>
      {planet}
    </span>
  );
}

function NovaRemedyRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-faint)", minWidth: "7rem", textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: "1px" }}>{label}</span>
      <span style={{ fontSize: "13px", color: "var(--color-text)", flex: 1 }}>{value}</span>
    </div>
  );
}

function NovaButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 20px",
        borderRadius: "10px",
        fontWeight: 600,
        fontSize: "13px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.55 : 1,
        background: "transparent",
        color: "var(--color-accent-strong)",
        border: "1.5px solid var(--color-border-strong)",
      }}
    >
      {children}
    </button>
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

export function NovaRemediesPanel({ lang, chartId, remedyPlan, gemstoneAdvice, loading, onLoad }: Props) {
  const [subTab, setSubTab] = useState<"plan" | "gemstone">("plan");

  if (!chartId) {
    return <p style={{ fontSize: "13px", color: "var(--color-faint)", padding: "10px 0", fontFamily: "var(--font-body)" }}>{t("remedies_empty", lang)}</p>;
  }

  const hasData = remedyPlan !== null || gemstoneAdvice !== null;

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div style={{ padding: "10px 12px", marginBottom: "12px", borderRadius: "8px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.55 }}>
        {t("remedies_safety_note", lang)}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
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
                borderRadius: "999px",
                border: `1.5px solid ${isActive ? "var(--color-accent-strong)" : "var(--color-border)"}`,
                background: isActive ? "var(--color-accent-muted)" : "var(--color-surface)",
                color: isActive ? "var(--color-accent-strong)" : "var(--color-muted)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {label}
            </button>
          );
        })}

        {!hasData && (
          <NovaButton onClick={onLoad} disabled={loading}>
            {loading ? t("remedies_loading", lang) : subTab === "gemstone" ? t("remedies_load_gemstone", lang) : t("remedies_load", lang)}
          </NovaButton>
        )}
      </div>

      {subTab === "plan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {!remedyPlan && <p style={{ fontSize: "13px", color: "var(--color-faint)" }}>{t("remedies_empty", lang)}</p>}
          {remedyPlan?.map((item) => (
            <CollapsibleSection
              key={item.planet}
              defaultOpen={item.priority === 1}
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-faint)", minWidth: "5rem" }}>
                    {t("remedies_priority", lang)} {item.priority}
                  </span>
                  <NovaPlanetBadge planet={item.planet} />
                  <span style={{ fontSize: "12px", color: "var(--color-faint)" }}>{item.reason}</span>
                </div>
              }
            >
              <div style={{ marginTop: "10px", padding: "12px", background: "var(--color-surface-soft)", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                <NovaRemedyRow label={t("remedies_day", lang)} value={item.day} />
                <NovaRemedyRow label={t("remedies_temple", lang)} value={lang === "ta" ? item.templeTa : item.templeEn} />
                <NovaRemedyRow label={t("remedies_mantra", lang)} value={`${item.mantraFullTa}${item.japaCount ? ` × ${item.japaCount.toLocaleString()}` : ""}`} />
                <NovaRemedyRow label={t("remedies_daanam", lang)} value={lang === "ta" ? item.daanumItemsTa : item.daanumItemsEn} />
                <NovaRemedyRow label={t("remedies_fasting", lang)} value={lang === "ta" ? item.fastingRuleTa : item.fastingRuleEn} />
                {(item.fastingRuleTa || item.fastingRuleEn) && (
                  <p style={{ margin: "-2px 0 8px", paddingLeft: "7rem", fontSize: "11px", color: "var(--color-mid)", lineHeight: 1.45 }}>
                    ⚠ {t("remedies_fasting_caution", lang)}
                  </p>
                )}
                <NovaRemedyRow label={t("remedies_behaviour", lang)} value={lang === "ta" ? item.behaviouralTa : item.behaviouralEn} />
                <NovaRemedyRow label={t("remedies_seva", lang)} value={lang === "ta" ? item.sevaTa : item.sevaEn} />
                {item.gemstoneTa && (
                  <div style={{ marginTop: "8px", padding: "6px 12px", borderRadius: "6px", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", fontSize: "12px", color: "var(--color-high)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Gem size={12} strokeWidth={1.5} aria-hidden="true" />
                    {lang === "ta" ? item.gemstoneTa : item.gemstoneEn}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          ))}
        </div>
      )}

      {subTab === "gemstone" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>
            {lang === "ta"
              ? "கற்கள் திருகணிதம் அடிப்படையில் கணக்கிடப்படுகின்றன — ஒவ்வொரு கிரகத்தின் செயல்பாட்டு தன்மை (பயனளிப்பவர் / தீங்கு செய்பவர்), வலிமை, மற்றும் லக்னம் அடிப்படையில். ஒரு கல் 'பரிந்துரைக்கப்பட்டது' என்றால் அந்த கிரகம் உங்கள் ஜாதகத்தில் நேர்மறையான கிரகம் மற்றும் வலிமை குறைவாக உள்ளது."
              : "Gemstone recommendations follow Thirukanitham — each planet's functional nature (benefic/malefic for your Lagna), its strength, and whether strengthening it helps or harms your chart. 'Prescribed' means the planet is a functional benefic AND needs strengthening. 'Not prescribed' means the planet is either strong enough or would harm your chart if strengthened."}
          </div>

          {!gemstoneAdvice && <p style={{ fontSize: "13px", color: "var(--color-faint)" }}>{t("remedies_empty", lang)}</p>}
          {gemstoneAdvice && (
            <>
              {[
                { filter: (i: typeof gemstoneAdvice[0]) => i.isGemstonePrescribed, groupLabel: lang === "ta" ? "பரிந்துரைக்கப்பட்டவை" : "Prescribed — wear these", tone: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)" },
                { filter: (i: typeof gemstoneAdvice[0]) => !i.isGemstonePrescribed && !!i.gemstoneNameEn, groupLabel: lang === "ta" ? "விருப்பப்பட்டால் (கவனமாக)" : "Optional — with caution", tone: "var(--color-mid)", bg: "var(--color-mid-bg)", border: "var(--color-mid-border)" },
                { filter: (i: typeof gemstoneAdvice[0]) => !i.isGemstonePrescribed && !i.gemstoneNameEn, groupLabel: lang === "ta" ? "பரிந்துரைக்கப்படாதவை" : "Not recommended", tone: "var(--color-faint)", bg: "transparent", border: "var(--color-border)" },
              ].map(({ filter, groupLabel, tone, bg, border }) => {
                const group = gemstoneAdvice.filter(filter);
                if (group.length === 0) return null;
                return (
                  <div key={groupLabel}>
                    <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: tone }}>{groupLabel}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {group.map((item) => {
                        const functionalHuman = item.functionalNature?.toLowerCase().includes("benefic")
                          ? (lang === "ta" ? "உங்கள் லக்னத்திற்கு சாதகமான கிரகம்" : "Beneficial planet for your Lagna")
                          : item.functionalNature?.toLowerCase().includes("malefic")
                          ? (lang === "ta" ? "உங்கள் லக்னத்திற்கு கடினமான கிரகம்" : "Challenging planet for your Lagna")
                          : item.functionalNature ?? "";
                        return (
                          <div key={item.planet} style={{ padding: "10px 12px", borderRadius: "10px", background: bg, border: `1px solid ${border}`, display: "grid", gridTemplateColumns: "auto 1fr", gap: "12px", alignItems: "flex-start" }}>
                            <NovaPlanetBadge planet={item.planet} />
                            <div>
                              <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: tone }}>
                                {item.gemstoneNameEn ? (lang === "ta" ? item.gemstoneNameTa : item.gemstoneNameEn) : (lang === "ta" ? "கல் தேவையில்லை" : "No gemstone needed")}
                              </p>
                              <p style={{ margin: "0 0 3px", fontSize: "12px", color: "var(--color-text)", lineHeight: 1.45 }}>
                                {lang === "ta" ? item.reasonTa : item.reasonEn}
                              </p>
                              {item.cautionEn && (
                                <p style={{ margin: "0 0 2px", fontSize: "11px", color: "var(--color-mid)", lineHeight: 1.4 }}>
                                  ⚠ {lang === "ta" ? item.cautionTa : item.cautionEn}
                                </p>
                              )}
                              {functionalHuman && <span style={{ fontSize: "11px", color: "var(--color-faint)", fontStyle: "italic" }}>{functionalHuman}</span>}
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
