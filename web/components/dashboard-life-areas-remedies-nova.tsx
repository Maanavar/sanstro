"use client";

import { useState } from "react";
import { Gem, AlertTriangle } from "lucide-react";

import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { RemedyPlanItem, GemstoneAdviceItem } from "@/lib/types";
import { dt, GEMSTONE_GROUPS, REMEDIES_CONTEXT } from "@/lib/dashboard-i18n";
import { CollapsibleSection } from "./collapsible-section";

/**
 * Nova re-skin of dashboard-remedies-panel.tsx's RemediesPanel — one of the
 * 4 sub-tab panels deferred (Classic-styled) when Life Areas Nova first
 * shipped (Phase 9, docs/DASHBOARD_UI_REVAMP_PLAN.md §6.8). The Classic
 * source's own `W` token map reads the legacy warm-parchment palette that the
 * 2026-07-06 browser-QA round reverted (not redirected) after it broke
 * selected-pill text elsewhere app-wide (see Journal's identical finding,
 * §6.11), plus several Classic-only rgba tint tokens with no Nova override.
 * So this is a fresh semantic-token rebuild, not a gap-fix — every value here
 * is a --color, --text, --space, or --radius token.
 *
 * The Classic PLANET_COLORS map also read raw per-planet colour vars that
 * aren't Nova-safe. Rather than invent a new mapping, this file reuses the
 * exact per-planet colour precedent §6.10's Transits view already established
 * (Sun/Jupiter = accent-strong, Moon/Venus = accent-secondary, Mars = low,
 * Mercury = high, Saturn = the existing one-off planet blue, Rahu/Ketu =
 * plain text) for consistency across Nova.
 *
 * `CollapsibleSection` is reused verbatim — confirmed semantic-token-safe.
 * Buttons are the kit `<Button>` / inline styles reading only semantic tokens.
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
    <span style={{ display: "inline-block", padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", background: `${color}22`, border: `1px solid ${color}55`, color, fontSize: "var(--text-base)", fontWeight: 700 }}>
      {planet}
    </span>
  );
}

function NovaRemedyRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "6px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", minWidth: "7rem", textTransform: "uppercase", letterSpacing: "0.07em", paddingTop: "1px" }}>{label}</span>
      <span style={{ fontSize: "var(--text-base)", color: "var(--color-text)", flex: 1 }}>{value}</span>
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
        padding: "var(--space-2) var(--space-5)",
        borderRadius: "var(--space-3)",
        fontWeight: 600,
        fontSize: "var(--text-base)",
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

const PRACTICE_MODE_KEY = "vinaadi-remedy-practice-mode";

function readStoredPracticeMode(): "traditional" | "secular" {
  if (typeof window === "undefined") return "traditional";
  return window.localStorage.getItem(PRACTICE_MODE_KEY) === "secular" ? "secular" : "traditional";
}

export function NovaRemediesPanel({ lang, chartId, remedyPlan, gemstoneAdvice, loading, onLoad }: Props) {
  const [subTab, setSubTab] = useState<"plan" | "gemstone">("plan");
  const [practiceMode, setPracticeMode] = useState<"traditional" | "secular">(readStoredPracticeMode);

  function choosePracticeMode(mode: "traditional" | "secular") {
    setPracticeMode(mode);
    if (typeof window !== "undefined") window.localStorage.setItem(PRACTICE_MODE_KEY, mode);
  }

  if (!chartId) {
    return <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)", paddingBlock: "var(--space-3)", fontFamily: "var(--font-body)" }}>{t("remedies_empty", lang)}</p>;
  }

  const hasData = remedyPlan !== null || gemstoneAdvice !== null;

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div style={{ padding: "var(--space-3) var(--space-3)", marginBottom: "12px", borderRadius: "var(--space-2)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.55 }}>
        <p style={{ margin: 0 }}>{dt(REMEDIES_CONTEXT.body, lang)}</p>
        <p style={{ margin: "var(--space-2) 0 0" }}>{t("remedies_safety_note", lang)}</p>
      </div>

      {remedyPlan && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "12px" }}>
          {/* New Tamil, pending native review */}
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{lang === "ta" ? "வழிகாட்டும் முறை" : "Guidance style"}</span>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", alignItems: "center" }}>
            {(["traditional", "secular"] as const).map((mode) => {
              const isActive = mode === practiceMode;
              return (
                <button key={mode} type="button" onClick={() => choosePracticeMode(mode)} style={{ padding: "var(--space-1) var(--space-3)", borderRadius: "var(--radius-pill)", border: `1.5px solid ${isActive ? "var(--color-accent-strong)" : "var(--color-border)"}`, background: isActive ? "var(--color-accent-muted)" : "transparent", color: isActive ? "var(--color-accent-strong)" : "var(--color-muted)", fontWeight: isActive ? 700 : 500, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "inherit" }}>
                  {mode === "traditional" ? t("remedies_mode_traditional", lang) : t("remedies_mode_secular", lang)}
                </button>
              );
            })}
          </div>
          {practiceMode === "secular" && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", margin: 0, lineHeight: 1.5 }}>{t("remedies_secular_note", lang)}</p>}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
        {(["plan", "gemstone"] as const).map((tab) => {
          const isActive = tab === subTab;
          const label = tab === "plan" ? t("remedies_plan_title", lang) : t("remedies_gemstone_title", lang);
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              style={{
                padding: "var(--space-1) var(--space-4)",
                borderRadius: "var(--radius-pill)",
                border: `1.5px solid ${isActive ? "var(--color-accent-strong)" : "var(--color-border)"}`,
                background: isActive ? "var(--color-accent-muted)" : "var(--color-surface)",
                color: isActive ? "var(--color-accent-strong)" : "var(--color-muted)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "var(--text-base)",
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
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {/* The traditional/secular switch used to live here, inside the plan
              sub-tab. It now sits above the sub-tabs (T18) because it governs
              the gemstone tab too — and from in here, a reader on that tab saw
              gemstones disappear with no visible control to explain why. */}
          {!remedyPlan && <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("remedies_empty", lang)}</p>}
          {remedyPlan?.map((item) => (
            <CollapsibleSection
              key={item.planet}
              defaultOpen={item.priority === 1}
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-faint)", minWidth: "5rem" }}>
                    {t("remedies_priority", lang)} {item.priority}
                  </span>
                  <NovaPlanetBadge planet={item.planet} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{item.reason}</span>
                </div>
              }
            >
              <div style={{ marginTop: "10px", padding: "var(--space-3)", background: "var(--color-surface-soft)", borderRadius: "var(--space-3)", border: "1px solid var(--color-border)" }}>
                {practiceMode === "traditional" && (
                  <>
                    <NovaRemedyRow label={t("remedies_day", lang)} value={item.day} />
                    <NovaRemedyRow label={t("remedies_temple", lang)} value={lang === "ta" ? item.templeTa : item.templeEn} />
                    <NovaRemedyRow label={t("remedies_mantra", lang)} value={`${item.mantraFullTa}${item.japaCount ? ` × ${item.japaCount.toLocaleString()}` : ""}`} />
                    <NovaRemedyRow label={t("remedies_daanam", lang)} value={lang === "ta" ? item.daanumItemsTa : item.daanumItemsEn} />
                    <NovaRemedyRow label={t("remedies_fasting", lang)} value={lang === "ta" ? item.fastingRuleTa : item.fastingRuleEn} />
                    {(item.fastingRuleTa || item.fastingRuleEn) && (
                      <p style={{ margin: "-2px 0 8px", paddingLeft: "7rem", fontSize: "var(--text-xs)", color: "var(--color-mid-text)", lineHeight: 1.45 }}>
                        <AlertTriangle size={12} strokeWidth={1.5} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "4px" }} />
                        {t("remedies_fasting_caution", lang)}
                      </p>
                    )}
                  </>
                )}
                <NovaRemedyRow label={t("remedies_behaviour", lang)} value={lang === "ta" ? item.behaviouralTa : item.behaviouralEn} />
                <NovaRemedyRow label={t("remedies_seva", lang)} value={lang === "ta" ? item.sevaTa : item.sevaEn} />
                {practiceMode === "traditional" && item.gemstoneTa && (
                  <div style={{ marginTop: "8px", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--space-2)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", fontSize: "var(--text-sm)", color: "var(--color-high)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ padding: "var(--space-3) var(--space-3)", borderRadius: "var(--space-2)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
            {lang === "ta"
              ? "கற்கள் திருகணிதம் அடிப்படையில் கணக்கிடப்படுகின்றன — ஒவ்வொரு கிரகத்தின் செயல்பாட்டு தன்மை (பயனளிப்பவர் / தீங்கு செய்பவர்), வலிமை, மற்றும் லக்னம் அடிப்படையில். ஒரு கல் பாரம்பரியமாக அணியப்படுகிறது என்றால், அந்த கிரகம் உங்கள் ஜாதகத்தில் நேர்மறையான கிரகம் மற்றும் வலிமை குறைவாக உள்ளது என்று பொருள்."
              : "Gemstone readings follow Thirukanitham — each planet's functional nature (benefic/malefic for your Lagna), its strength, and whether strengthening it helps or harms your chart. A stone is traditionally worn when the planet is a functional benefic AND needs strengthening, and traditionally avoided when the planet is either strong enough already or would harm your chart if strengthened."}
            <p style={{ margin: "var(--space-2) 0 0" }}>{dt(GEMSTONE_GROUPS.note, lang)}</p>
          </div>

          {!gemstoneAdvice && <p style={{ fontSize: "var(--text-base)", color: "var(--color-faint)" }}>{t("remedies_empty", lang)}</p>}
          {gemstoneAdvice && (
            <>
              {[
                { filter: (i: typeof gemstoneAdvice[0]) => i.isGemstonePrescribed, groupLabel: dt(GEMSTONE_GROUPS.worn, lang), tone: "var(--color-high)", bg: "var(--color-high-bg)", border: "var(--color-high-border)" },
                { filter: (i: typeof gemstoneAdvice[0]) => !i.isGemstonePrescribed && !!i.gemstoneNameEn, groupLabel: dt(GEMSTONE_GROUPS.optional, lang), tone: "var(--color-mid)", bg: "var(--color-mid-bg)", border: "var(--color-mid-border)" },
                { filter: (i: typeof gemstoneAdvice[0]) => !i.isGemstonePrescribed && !i.gemstoneNameEn, groupLabel: dt(GEMSTONE_GROUPS.avoided, lang), tone: "var(--color-faint)", bg: "transparent", border: "var(--color-border)" },
              ].map(({ filter, groupLabel, tone, bg, border }) => {
                const group = gemstoneAdvice.filter(filter);
                if (group.length === 0) return null;
                return (
                  <div key={groupLabel}>
                    <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: tone }}>{groupLabel}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {group.map((item) => {
                        const functionalHuman = item.functionalNature?.toLowerCase().includes("benefic")
                          ? (lang === "ta" ? "உங்கள் லக்னத்திற்கு சாதகமான கிரகம்" : "Beneficial planet for your Lagna")
                          : item.functionalNature?.toLowerCase().includes("malefic")
                          ? (lang === "ta" ? "உங்கள் லக்னத்திற்கு கடினமான கிரகம்" : "Challenging planet for your Lagna")
                          : item.functionalNature ?? "";
                        return (
                          <div key={item.planet} style={{ padding: "var(--space-3) var(--space-3)", borderRadius: "var(--space-3)", background: bg, border: `1px solid ${border}`, display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-3)", alignItems: "flex-start" }}>
                            <NovaPlanetBadge planet={item.planet} />
                            <div>
                              <p style={{ margin: "0 0 2px", fontSize: "var(--text-base)", fontWeight: 700, color: tone }}>
                                {item.gemstoneNameEn ? (lang === "ta" ? item.gemstoneNameTa : item.gemstoneNameEn) : (lang === "ta" ? "கல் தேவையில்லை" : "No gemstone needed")}
                              </p>
                              <p style={{ margin: "0 0 3px", fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.45 }}>
                                {lang === "ta" ? item.reasonTa : item.reasonEn}
                              </p>
                              {item.cautionEn && (
                                <p style={{ margin: "0 0 2px", fontSize: "var(--text-xs)", color: "var(--color-mid-text)", lineHeight: 1.4 }}>
                                  <AlertTriangle size={12} strokeWidth={1.5} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "4px" }} />
                                  {lang === "ta" ? item.cautionTa : item.cautionEn}
                                </p>
                              )}
                              {functionalHuman && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", fontStyle: "italic" }}>{functionalHuman}</span>}
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
