"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { VarshaphalaData } from "@/lib/types";
import { CollapsibleSection } from "./collapsible-section";
import { Button } from "./dashboard-ui";

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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function scoreColor(score: number) {
  if (score >= 65) return W.sage;
  if (score >= 40) return W.terracotta;
  return W.rust;
}

function PlanetTag({ planet }: { planet: string }) {
  const color = PLANET_COLORS[planet] ?? W.muted;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "var(--radius-pill)",
      background: `${color}22`,
      border: `1px solid ${color}55`,
      color,
      fontSize: "0.78rem",
      fontWeight: 700,
    }}>
      {planet}
    </span>
  );
}

type Props = {
  lang: Lang;
  chartId: string | null;
  data: VarshaphalaData | null;
  loading: boolean;
  onLoad: (year: number) => void;
};

export function VarshaphalaPanel({ lang, chartId, data, loading, onLoad }: Props) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  if (!chartId) return null;

  return (
    <CollapsibleSection title={t("varshaphala_title", lang)} defaultOpen={false}>
      <div style={{ marginTop: "var(--space-3)" }}>

        {/* Year picker + load button */}
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <button
              type="button"
              onClick={() => setYear(y => y - 1)}
              style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${W.borderLt}`, background: W.surface, cursor: "pointer", fontSize: "0.85rem", color: W.inkMid, fontFamily: "inherit" }}
            >
              ◀
            </button>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: W.inkMid, minWidth: "3.5rem", textAlign: "center" }}>{year}</span>
            <button
              type="button"
              onClick={() => setYear(y => y + 1)}
              style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${W.borderLt}`, background: W.surface, cursor: "pointer", fontSize: "0.85rem", color: W.inkMid, fontFamily: "inherit" }}
            >
              ▶
            </button>
          </div>
          <Button variant="ghost" onClick={() => onLoad(year)} disabled={loading}>
            {loading ? t("varshaphala_loading", lang) : t("varshaphala_load", lang)}
          </Button>
        </div>

        {data && data.year === year && (
          <>
            {/* Header metrics row */}
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
              <MetricPill label={t("varshaphala_sr_lagna", lang)} value={data.solarReturnLagnaName} />
              <MetricPill label={t("varshaphala_muntha", lang)} value={`${data.munthaRasiName} (H${data.munthaHouseFromSrLagna})`} />
              <MetricPill
                label={t("varshaphala_year_lord", lang)}
                value={data.yearLord}
                accent={PLANET_COLORS[data.yearLord]}
              />
            </div>

            {/* Solar return date */}
            <p style={{ fontSize: "0.78rem", color: W.muted, marginBottom: "var(--space-4)" }}>
              {lang === "ta" ? "சூரிய திரும்பு தேதி:" : "Solar return:"}&nbsp;
              <strong style={{ color: W.inkMid }}>{data.solarReturnDate}</strong>
            </p>

            {/* Itthasala / Isarafa */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
              <AspectList
                lang={lang}
                title={t("varshaphala_itthasala", lang)}
                pairs={data.itthasalaPairs}
                tone={W.sage}
              />
              <AspectList
                lang={lang}
                title={t("varshaphala_isarafa", lang)}
                pairs={data.isarafaPairs}
                tone={W.terracotta}
              />
            </div>

            {/* Area outlook */}
            {data.areaOutlook.length > 0 && (
              <div>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: W.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-1)" }}>
                  {t("varshaphala_area_outlook", lang)}
                </p>
                <p style={{ fontSize: "0.72rem", color: W.muted, lineHeight: 1.5, marginBottom: "var(--space-2_5)", padding: "var(--space-1_5) var(--space-2_5)", borderRadius: "8px", background: "rgba(122,111,94,0.07)", border: "1px solid rgba(122,111,94,0.15)" }}>
                  {lang === "ta"
                    ? "இந்த மதிப்பெண்கள் வர்ஷபல (ஆண்டு) கட்டத்தை மட்டும் அடிப்படையாகக் கொண்டவை. 'ஜீவிதப் பகுதிகள்' தாவலில் உள்ள மதிப்பெண்கள் உங்கள் ஜாதகம் + தசை + கிரகநகர்வு மூன்றையும் சேர்த்து கணக்கிடப்படுவதால் வேறுபடும்."
                    : "These scores are based solely on your annual solar return chart. They will differ from the Life Areas tab, which combines natal chart strength, dasha period, and transits together."}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {data.areaOutlook.map((item) => (
                    <CollapsibleSection
                      key={item.area}
                      defaultOpen={false}
                      title={
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: W.inkMid, minWidth: "8rem" }}>{item.area}</span>
                          <span style={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: scoreColor(item.score),
                            minWidth: "2.5rem",
                          }}>
                            {item.score}
                          </span>
                          {item.favourableMonths.length > 0 && (
                            <span style={{ fontSize: "0.72rem", color: W.muted }}>
                              {t("varshaphala_fav_months", lang)}: {item.favourableMonths.map(m => MONTHS[m - 1]).join(", ")}
                            </span>
                          )}
                        </div>
                      }
                    >
                      <p style={{ fontSize: "0.82rem", color: W.inkMid, marginTop: "var(--space-2)", lineHeight: 1.55, padding: "0 var(--space-2)" }}>
                        {lang === "ta" ? item.narrativeTa : item.narrativeEn}
                      </p>
                    </CollapsibleSection>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!data && !loading && (
          <p style={{ fontSize: "0.82rem", color: W.muted }}>
            {lang === "ta"
              ? `${year} ஆண்டு கட்டம் பார்க்க மேலே கிளிக் செய்யவும்.`
              : `Click above to view the ${year} annual chart.`}
          </p>
        )}
      </div>
    </CollapsibleSection>
  );
}

function MetricPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      padding: "var(--space-2) var(--space-3)",
      borderRadius: "var(--radius-card)",
      background: W.surfaceMd,
      border: `1px solid ${W.borderLt}`,
    }}>
      <p style={{ fontSize: "0.7rem", color: W.muted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: accent ?? W.inkMid }}>{value}</p>
    </div>
  );
}

function AspectList({ lang, title, pairs, tone }: {
  lang: Lang;
  title: string;
  pairs: { planet1: string; planet2: string; orb: number }[];
  tone: string;
}) {
  return (
    <div style={{
      padding: "var(--space-2_5) var(--space-3)",
      borderRadius: "var(--radius-card)",
      background: W.surface,
      border: `1px solid ${W.borderLt}`,
    }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, color: tone, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "var(--space-2)" }}>
        {title}
      </p>
      {pairs.length === 0 ? (
        <p style={{ fontSize: "0.75rem", color: W.muted }}>{t("varshaphala_no_pairs", lang)}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)" }}>
          {pairs.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <PlanetTag planet={p.planet1} />
              <span style={{ color: tone, fontWeight: 700, fontSize: "0.8rem" }}>↔</span>
              <PlanetTag planet={p.planet2} />
              <span style={{ fontSize: "0.7rem", color: W.muted }}>{p.orb != null ? p.orb.toFixed(1) : "?"}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
