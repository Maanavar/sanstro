"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiFetchJson } from "@/lib/api";
import { STALE } from "@/lib/queryClient";
import { tLang, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import type { DailyGuidanceData, NakshatraCardData } from "@/lib/types";
import type { MemberChart } from "@/hooks/useFamilyData";

import { moonRasiFromNakshatra, rasiName } from "./dashboard-calendar-tab";
import { NovaAskEntryChip, NovaAttributeBand, NovaDetailBreadcrumb, NovaDetailHero, NovaKicker, novaDetailCardStyle } from "./dashboard-explore-detail-nova";

/**
 * Nova personalised Nakshatram profile screen — Phase 7 of the dashboard
 * revamp, mapped from the mockup's `explore-moolam` screen (Moolam was just
 * that mockup's example star; this component is fully generic — it fetches
 * whichever nakshatra number is being viewed and reflects each user's own
 * chart, never a hardcoded star). See docs/DASHBOARD_UI_REVAMP_PLAN.md §6.6
 * for the full gap/mapping table. A sub-view of the Explore tab (same
 * "in-tab sub-screen, no new route" mechanism as cal-panch/cal-monthly and
 * family/family-member). The outer skeleton (breadcrumb+nav, hero shell,
 * attribute band, two-column layout, Ask entry chip) is shared with
 * `dashboard-explore-dosham-nova.tsx` via `dashboard-explore-detail-nova.tsx`
 * (see §6.7) — the higher-level content cards below stay bespoke per screen,
 * since their data shapes genuinely diverge.
 *
 * Post-Phase-8 browser QA (2026-07-06) found the breadcrumb's hub crumb and
 * the Pariharam card's link both opened the marketing site in a new tab —
 * surprising for a breadcrumb, and this card's link was its only real
 * content (no structured per-planet remedy data exists in-app to show
 * instead, per §6.6). Per user decision, both were removed: the breadcrumb
 * hub crumb is now plain text (shared fix in dashboard-explore-detail-nova.tsx),
 * and the Pariharam card is omitted here entirely rather than left as a
 * dead-end sentence with no link.
 */

function useNakshatraCardByNumber(number: number) {
  return useQuery({
    queryKey: ["explore-nakshatra-card", number],
    queryFn: async ({ signal }) => {
      const response = await apiFetchJson<{ success: boolean; data: NakshatraCardData }>(
        `/api/v1/content/nakshatra/${number}`,
        { signal },
      );
      return response.data;
    },
    enabled: number >= 1 && number <= 27,
    staleTime: STALE.static,
  });
}

function wrapNakshatraNumber(n: number): number {
  return ((n - 1 + 27) % 27) + 1;
}

const cardStyle = novaDetailCardStyle;

interface DashboardExploreNakshatramNovaProps {
  lang: Lang;
  initialNumber: number;
  ownNumber: number | null;
  ownPada: number | null;
  personalDailyGuidance: DailyGuidanceData | null;
  memberCharts: MemberChart[];
  onBack: () => void;
  onOpenAskVinaadi: () => void;
}

export function DashboardExploreNakshatramNova({
  lang,
  initialNumber,
  ownNumber,
  ownPada,
  personalDailyGuidance,
  memberCharts,
  onBack,
  onOpenAskVinaadi,
}: DashboardExploreNakshatramNovaProps) {
  const [viewedNumber, setViewedNumber] = useState(initialNumber);
  const { data: card, isLoading } = useNakshatraCardByNumber(viewedNumber);
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);

  const isOwnStar = ownNumber !== null && viewedNumber === ownNumber;
  const prevCard = useNakshatraCardByNumber(wrapNakshatraNumber(viewedNumber - 1));
  const nextCard = useNakshatraCardByNumber(wrapNakshatraNumber(viewedNumber + 1));

  if (isLoading || !card) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
        <button type="button" onClick={onBack} style={{ alignSelf: "flex-start", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {lang === "ta" ? "← ஆராய்வுக்குத் திரும்பு" : "← Back to Explore"}
        </button>
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</p>
      </div>
    );
  }

  const rasiNum = moonRasiFromNakshatra(card.nameEn, 1);
  const rasiLabel = rasiNum ? rasiName(rasiNum, lang) : "";

  const membersOnStar = memberCharts.filter((mc) => mc.nakshatraCard?.number === viewedNumber);
  const upcomingDashaNotes = memberCharts
    .filter((mc) => !membersOnStar.includes(mc))
    .flatMap((mc) => {
      const dasha = mc.dasha;
      if (!dasha) return [];
      const hit = dasha.timeline
        .filter((p) => p.level === "maha" && p.lord === card.rulingPlanet && p.startDate > dasha.current.mahadasha.endDate)
        .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))[0];
      if (!hit) return [];
      return [{ displayName: mc.displayName, year: String(hit.startDate).slice(0, 4) }];
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Breadcrumb + star nav ===== */}
      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={lang === "ta" ? "நட்சத்திரம்" : "Natchathiram"}
        currentLabel={lang === "ta" ? card.nameTa : astroText(card.nameEn)}
        onPrev={{
          label: prevCard.data ? (lang === "ta" ? prevCard.data.nameTa : astroText(prevCard.data.nameEn)) : "…",
          onClick: () => setViewedNumber((n) => wrapNakshatraNumber(n - 1)),
        }}
        onNext={{
          label: nextCard.data ? (lang === "ta" ? nextCard.data.nameTa : astroText(nextCard.data.nameEn)) : "…",
          onClick: () => setViewedNumber((n) => wrapNakshatraNumber(n + 1)),
        }}
      />

      {/* ===== Hero ===== */}
      <NovaDetailHero
        kicker={lang === "ta" ? `நட்சத்திரம் ${card.number} / 27` : `Nakshatram ${card.number} of 27`}
        badge={isOwnStar && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", borderRadius: "999px", padding: "5px 12px" }}>
            {"✦"} {lang === "ta" ? `உங்கள் ஜென்ம நட்சத்திரம் · பாதம் ${ownPada ?? ""}` : `Your birth star · pada ${ownPada ?? ""}`}
          </span>
        )}
        titleMain={astroText(card.nameEn)}
        titleSecondary={card.nameTa}
        prose={lang === "ta" ? card.profile.ta : astroText(card.profile.en)}
        rightSlot={
          <div style={{ flex: "none", width: "150px", borderLeft: "1px solid var(--color-border)", paddingLeft: "22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "84px", height: "84px", borderRadius: "50%", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", fontSize: "32px", color: "var(--color-accent-strong)" }}>
              {"☙"}
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--color-faint)", textAlign: "center", lineHeight: 1.5 }}>
              {lang === "ta" ? "சின்னம்" : "Symbol"}<br />
              <b style={{ color: "var(--color-text-strong)" }}>{lang === "ta" ? card.symbolTa : astroText(card.symbolEn)}</b>
            </div>
          </div>
        }
      />

      {/* ===== Attribute band ===== */}
      <NovaAttributeBand
        facts={[
          { label: lang === "ta" ? "அதிபதி" : "Lord", value: tPlanetLord(card.rulingPlanet, lang) },
          { label: lang === "ta" ? "ராசி" : "Rasi", value: rasiLabel },
          { label: lang === "ta" ? "தேவதை" : "Deity", value: lang === "ta" ? card.deityTa : astroText(card.deityEn) },
          { label: lang === "ta" ? "கணம்" : "Ganam", value: lang === "ta" ? card.ganam.ta : card.ganam.en },
          { label: lang === "ta" ? "யோனி" : "Yoni", value: lang === "ta" ? card.yoni.ta : card.yoni.en },
        ]}
      />

      {/* ===== Two column body ===== */}
      <div className="nova-grid-detail" style={{ alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={cardStyle}>
            <NovaKicker>{lang === "ta" ? `${card.nameTa} இன் இயல்பு` : `The nature of ${astroText(card.nameEn)}`}</NovaKicker>
            <p style={{ margin: 0, fontFamily: "var(--font-prose, var(--font-body))", fontSize: "13.5px", lineHeight: 1.7, color: "var(--color-text)" }}>
              {lang === "ta" ? card.profile.ta : astroText(card.profile.en)}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {card.strengths.map((s) => (
                <span key={s.en} style={{ fontSize: "12px", color: "var(--color-text)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border, var(--color-high))", borderRadius: "999px", padding: "6px 13px" }}>
                  {lang === "ta" ? s.ta : astroText(s.en)}
                </span>
              ))}
              {card.cautions.map((c) => (
                <span key={c.en} style={{ fontSize: "12px", color: "var(--color-text)", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border, var(--color-low))", borderRadius: "999px", padding: "6px 13px" }}>
                  {"⚠ "}{lang === "ta" ? c.ta : astroText(c.en)}
                </span>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <NovaKicker>{lang === "ta" ? "நான்கு பாதங்கள்" : "The four padas"}</NovaKicker>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--color-accent-strong)", fontSize: "10.5px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  <th style={{ padding: "0 12px 6px 0", borderBottom: "1px solid var(--color-border)" }}>{lang === "ta" ? "பாதம்" : "Pada"}</th>
                  <th style={{ padding: "0 12px 6px 0", borderBottom: "1px solid var(--color-border)" }}>{lang === "ta" ? "நவாம்சம்" : "Navamsa"}</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((pada) => {
                  const navRasi = moonRasiFromNakshatra(card.nameEn, pada);
                  const isYou = isOwnStar && ownPada === pada;
                  return (
                    <tr key={pada} style={isYou ? { background: "var(--color-accent-muted)" } : undefined}>
                      <td style={{ padding: "8px 12px 8px 0", borderBottom: "1px solid var(--color-border)", fontWeight: isYou ? 700 : 500 }}>
                        {pada}
                        {isYou && (
                          <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", borderRadius: "4px", padding: "1px 6px" }}>
                            {lang === "ta" ? "நீங்கள்" : "YOU"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "8px 12px 8px 0", borderBottom: "1px solid var(--color-border)" }}>{navRasi ? rasiName(navRasi, lang) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {isOwnStar && (
            <div style={{ ...cardStyle, background: "linear-gradient(120deg, var(--color-accent-muted), transparent)", border: "1px solid var(--color-border-strong)" }}>
              <NovaKicker color="var(--color-accent-strong)">{lang === "ta" ? "உங்கள் ஜாதகத்தில்" : "In your chart"}</NovaKicker>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: "var(--color-text)" }}>
                {lang === "ta"
                  ? `நீங்கள் ${card.nameTa} பாதம் ${ownPada ?? ""}.`
                  : `You are ${astroText(card.nameEn)} pada ${ownPada ?? ""}.`}
              </p>
              {personalDailyGuidance?.nakshatraPerspective && (
                <div style={{ fontSize: "11.5px", color: "var(--color-muted)", background: "var(--color-surface-soft)", borderRadius: "8px", padding: "8px 11px" }}>
                  {lang === "ta" ? "இன்றைய பார்வை: " : "Today's lens: "}
                  <b style={{ color: "var(--color-accent-strong)" }}>{astroText(tLang(personalDailyGuidance.nakshatraPerspective, lang))}</b>
                  {typeof personalDailyGuidance.score === "number" && (
                    lang === "ta" ? ` — உங்கள் ${personalDailyGuidance.score} மதிப்பெண் வாசிப்புக்கு பொருந்துகிறது.` : ` — matches your ${personalDailyGuidance.score} score reading.`
                  )}
                </div>
              )}
            </div>
          )}

          <div style={cardStyle}>
            <NovaKicker color="var(--color-accent-secondary)">{lang === "ta" ? "உங்கள் குடும்பத்தில்" : "In your family"}</NovaKicker>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "12.5px" }}>
              <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-accent)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "10.5px", fontWeight: 700, flexShrink: 0 }}>
                {lang === "ta" ? "நீ" : "Y"}
              </span>
              <span>
                {lang === "ta" ? "நீங்கள்" : "You"}
                {isOwnStar && <b style={{ color: "var(--color-accent-strong)" }}> — {card.nameTa ? (lang === "ta" ? card.nameTa : astroText(card.nameEn)) : ""} {ownPada ?? ""}</b>}
              </span>
            </div>
            {membersOnStar.map((mc) => (
              <div key={mc.memberId} style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "12.5px" }}>
                <span style={{ width: "26px", height: "26px", borderRadius: "50%", background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", display: "grid", placeItems: "center", fontSize: "10.5px", fontWeight: 700, flexShrink: 0 }}>
                  {mc.displayName.charAt(0).toUpperCase()}
                </span>
                <span>{mc.displayName}</span>
              </div>
            ))}
            {membersOnStar.length === 0 && (
              <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5 }}>
                {lang === "ta" ? `வீட்டில் யாரும் ${card.nameTa} நட்சத்திரத்தை பகிரவில்லை.` : `No one else at home shares ${astroText(card.nameEn)}.`}
              </p>
            )}
            {upcomingDashaNotes.map((note) => (
              <p key={note.displayName} style={{ margin: 0, fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5 }}>
                {lang === "ta"
                  ? `${note.displayName}-ன் ${tPlanetLord(card.rulingPlanet, lang)} தசை ${note.year} இல் தொடங்குகிறது.`
                  : `${note.displayName}'s ${tPlanetLord(card.rulingPlanet, lang)} dasa begins ${note.year}.`}
              </p>
            ))}
          </div>

          <NovaAskEntryChip
            label={lang === "ta" ? `${card.nameTa} பற்றி கேளுங்கள்…` : `Ask about ${astroText(card.nameEn)}…`}
            ctaLabel={lang === "ta" ? "கேளுங்கள் ✦" : "Ask ✦"}
            onOpenAskVinaadi={onOpenAskVinaadi}
          />
        </div>
      </div>
    </div>
  );
}
