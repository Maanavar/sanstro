"use client";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { tPlanetLord } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import type { ChartCalculateResponseData, ChartSummaryData, DailyGuidanceData, NakshatraCardData } from "@/lib/types";
import type { MemberChart } from "@/hooks/useFamilyData";

import { strengthBand } from "./dashboard-yoga-dosham-panel";
import { DashboardExploreNakshatramNova } from "./dashboard-explore-nakshatram-nova";
import { DashboardExploreDoshamNova } from "./dashboard-explore-dosham-nova";

/**
 * Nova "Explore" tab — Phase 6 of the dashboard revamp (see
 * docs/DASHBOARD_UI_REVAMP_PLAN.md §6.5 for the full gap/mapping table).
 * Classic's `DashboardExploreTab` is a plain nav hub (cards that jump to
 * other dashboard tabs). The mockup's `explore` screen is a different,
 * bigger concept — a searchable knowledge library (Natchathiram/Dosham/
 * Yogam/Pariharam/Temples/Panchangam) plus a "start from your own chart"
 * row and short-read articles. That library content already exists as
 * real, live marketing pages (`/natchathiram`, `/dosham`, `/yogam`,
 * `/pariharam`, `/temples`, plus 5 `/learn/*` articles) — this screen
 * reuses those verbatim via real links rather than duplicating an
 * encyclopedia inside the dashboard. Nothing here invents new
 * astrological interpretation; see the progress log for the one piece
 * deliberately left out (a per-rasi interpretive blurb) because no backing
 * content exists yet. The personalised Nakshatram detail page
 * (`explore-moolam`, §6.6, Phase 7) and Dosham detail page
 * (`explore-sevvai`, §6.7, Phase 8) are both sub-views of this tab —
 * same in-tab-sub-screen mechanism as cal-panch/cal-monthly and
 * family/family-member, not a new route.
 */

type Tab = "onboarding" | "personal" | "tools" | "transits" | "plan" | "life-areas" | "family" | "calendar" | "journal" | "settings" | "qa" | "explore";

function NovaKicker({ children, color = "var(--color-accent)" }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color }}>
      {children}
    </p>
  );
}

type LibraryItem = {
  key: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  titleEn: string;
  titleTa: string;
  scriptTa: string;
  descEn: string;
  descTa: string;
  nav?: Tab;
  href?: string;
};

const LIBRARY_ITEMS: LibraryItem[] = [
  {
    key: "natchathiram",
    icon: "✦",
    iconColor: "var(--color-accent-strong)",
    iconBg: "var(--color-accent-muted)",
    titleEn: "Natchathiram",
    titleTa: "நட்சத்திரம்",
    scriptTa: "நட்சத்திரம்",
    descEn: "All 27 birth stars — nature, padas, lords and what each asks of its people.",
    descTa: "அனைத்து 27 நட்சத்திரங்களும் — இயல்பு, பாதங்கள், அதிபதிகள்.",
    href: "/natchathiram",
  },
  {
    key: "dosham",
    icon: "⚠",
    iconColor: "var(--color-low)",
    iconBg: "var(--color-low-bg)",
    titleEn: "Dosham",
    titleTa: "தோஷம்",
    scriptTa: "தோஷம்",
    descEn: "Sevvai, Kala Sarpa, Naga and more — how each forms, when it cancels, without fear.",
    descTa: "செவ்வாய், கால சர்ப்பம், நாக தோஷம் — எப்படி உருவாகும், எப்போது நீங்கும்.",
    href: "/dosham",
  },
  {
    key: "yogam",
    icon: "☘",
    iconColor: "var(--color-high)",
    iconBg: "var(--color-high-bg)",
    titleEn: "Yogam",
    titleTa: "யோகம்",
    scriptTa: "யோகம்",
    descEn: "The fortunate combinations — Raja, Gaja Kesari, Dhana — and who carries them.",
    descTa: "சுப யோகங்கள் — ராஜ யோகம், கஜ கேசரி, தன யோகம் — யாருக்கு உண்டு.",
    href: "/yogam",
  },
  {
    key: "pariharam",
    icon: "🪔",
    iconColor: "var(--color-accent-strong)",
    iconBg: "var(--color-accent-muted)",
    titleEn: "Pariharam",
    titleTa: "பரிகாரம்",
    scriptTa: "பரிகாரம்",
    descEn: "Remedies by planet and dosham — what to do, where, and on which day.",
    descTa: "கிரகம் மற்றும் தோஷத்திற்கான பரிகாரங்கள் — என்ன, எங்கே, எந்த நாளில்.",
    href: "/pariharam",
  },
  {
    key: "temples",
    icon: "🛕",
    iconColor: "var(--color-accent-secondary)",
    iconBg: "var(--color-accent-secondary-muted)",
    titleEn: "Temples",
    titleTa: "கோயில்கள்",
    scriptTa: "கோயில்கள்",
    descEn: "Parihara sthalams by planet and star — Navagraha circuit, visiting guidance.",
    descTa: "கிரகம் மற்றும் நட்சத்திரத்திற்கான பரிகார ஸ்தலங்கள் — நவக்கிரக வழிபாடு.",
    href: "/temples",
  },
  {
    key: "panchangam",
    icon: "◐",
    iconColor: "var(--color-accent-secondary)",
    iconBg: "var(--color-accent-secondary-muted)",
    titleEn: "Panchangam",
    titleTa: "பஞ்சாங்கம்",
    scriptTa: "பஞ்சாங்கம்",
    descEn: "Tithi, nakshatram, yogam, karanam — the five limbs and the Tamil calendar, explained.",
    descTa: "திதி, நட்சத்திரம், யோகம், கரணம் — பஞ்ச அங்கங்களும் தமிழ் நாட்காட்டியும்.",
    nav: "calendar",
  },
];

type LearnArticle = {
  key: string;
  kickerEn: string;
  kickerTa: string;
  titleEn: string;
  titleTa: string;
  href: string;
};

// Real, already-shipped /learn/* marketing articles — substituted for the
// mockup's 3 example topics (Rahu Kalam / Guru Peyarchi / Dasa timeline),
// none of which exist as articles anywhere in the codebase. Writing new
// astrology explainer prose for those specific topics would be inventing
// content, not re-skinning; these 5 are real, live pages instead.
const LEARN_ARTICLES: LearnArticle[] = [
  {
    key: "thirukanitham",
    kickerEn: "Method", kickerTa: "முறை",
    titleEn: "What is Thirukanitham?",
    titleTa: "திருக்கணிதம் என்றால் என்ன?",
    href: "/learn/what-is-thirukanitham",
  },
  {
    key: "jadhagam",
    kickerEn: "Basics", kickerTa: "அடிப்படை",
    titleEn: "How to read a Jadhagam",
    titleTa: "ஜாதகத்தை எப்படி படிப்பது",
    href: "/learn/how-to-read-a-jadhagam",
  },
  {
    key: "chandrashtama",
    kickerEn: "Transits", kickerTa: "கிரக நகர்வு",
    titleEn: "What is Chandrashtama?",
    titleTa: "சந்திராஷ்டமம் என்றால் என்ன?",
    href: "/learn/what-is-chandrashtama",
  },
  {
    key: "porutham",
    kickerEn: "Marriage", kickerTa: "திருமணம்",
    titleEn: "What is Porutham?",
    titleTa: "பொருத்தம் என்றால் என்ன?",
    href: "/learn/what-is-porutham",
  },
  {
    key: "birthtime",
    kickerEn: "Basics", kickerTa: "அடிப்படை",
    titleEn: "Why birth time matters",
    titleTa: "பிறந்த நேரம் ஏன் முக்கியம்",
    href: "/learn/why-birth-time-matters",
  },
];

const SEARCH_SUGGESTIONS = ["Guru Peyarchi 2026", "Sevvai dosham", "Rahu Kalam"];

function matchesQuery(q: string, ...fields: string[]): boolean {
  return fields.some((f) => f.toLowerCase().includes(q));
}

interface DashboardExploreTabNovaProps {
  lang: Lang;
  personalChartSummary: ChartSummaryData | null;
  personalChart: ChartCalculateResponseData | null;
  personalDailyGuidance: DailyGuidanceData | null;
  nakshatraCard: NakshatraCardData | null;
  memberCharts: MemberChart[];
  onNavigate: (tab: Tab) => void;
  onOpenAskVinaadi: () => void;
}

export function DashboardExploreTabNova({
  lang,
  personalChartSummary,
  personalChart,
  personalDailyGuidance,
  nakshatraCard,
  memberCharts,
  onNavigate,
  onOpenAskVinaadi,
}: DashboardExploreTabNovaProps) {
  const [query, setQuery] = useState("");
  const [nakshatramOpen, setNakshatramOpen] = useState(false);
  const [doshamOpen, setDoshamOpen] = useState(false);
  const astroText = (value: string) => (lang === "en" ? tamilizeAstroEnglish(value) : value);

  const doshams = personalChart?.doshams ?? [];
  const activeDosham = doshams.find((d) => d.isPresent && !d.isCancelled) ?? null;
  const hasChartStarters = !!(personalChartSummary?.janmaNakshatra && nakshatraCard) || !!activeDosham;

  const q = query.trim().toLowerCase();
  const filteredLibrary = q ? LIBRARY_ITEMS.filter((i) => matchesQuery(q, i.titleEn, i.descEn, i.titleTa, i.descTa)) : LIBRARY_ITEMS;
  const filteredLearn = q ? LEARN_ARTICLES.filter((a) => matchesQuery(q, a.titleEn, a.kickerEn, a.titleTa)) : LEARN_ARTICLES;
  const noMatches = q.length > 0 && filteredLibrary.length === 0 && filteredLearn.length === 0;

  if (nakshatramOpen && nakshatraCard) {
    return (
      <DashboardExploreNakshatramNova
        lang={lang}
        initialNumber={nakshatraCard.number}
        ownNumber={nakshatraCard.number}
        ownPada={personalChartSummary?.janmaPada ?? null}
        personalDailyGuidance={personalDailyGuidance}
        memberCharts={memberCharts}
        onBack={() => setNakshatramOpen(false)}
        onOpenAskVinaadi={onOpenAskVinaadi}
      />
    );
  }

  if (doshamOpen && doshams.length > 0) {
    return (
      <DashboardExploreDoshamNova
        lang={lang}
        doshams={doshams}
        initialIndex={activeDosham ? doshams.indexOf(activeDosham) : 0}
        memberCharts={memberCharts}
        onBack={() => setDoshamOpen(false)}
        onOpenAskVinaadi={onOpenAskVinaadi}
        onNavigateToday={() => onNavigate("personal")}
      />
    );
  }

  const cardStyle: React.CSSProperties = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "22px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Page header + search ===== */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <NovaKicker>
            {lang === "ta" ? <>ஆராயுங்கள் · <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>அறிவுக் களஞ்சியம்</span></> : "Explore"}
          </NovaKicker>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.7rem,3vw,2.2rem)", fontWeight: 600, marginTop: "6px", color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "உங்கள் பலனுக்குப் பின்னால் உள்ள காரணம்" : "The why behind your readings"}
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--color-muted)", marginTop: "3px" }}>
            {lang === "ta"
              ? "நட்சத்திரங்கள், தோஷங்கள், யோகங்கள், பரிகாரங்கள், கோயில்கள் — எளிய தமிழில், உங்கள் ஜாதகத்துடன் இணைக்கப்பட்டவை."
              : "Stars, doshams, yogams, remedies and temples — written plainly, linked to your own chart."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "220px", display: "flex", alignItems: "center", gap: "11px", background: "rgba(243, 236, 221, 0.05)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "12px 18px" }}>
            <span style={{ color: "var(--color-accent)", fontSize: "14px" }}>{"⌕"}</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === "ta" ? "நட்சத்திரம், தோஷம், கோயில் அல்லது கேள்வியைத் தேடுங்கள்…" : "Search a star, dosham, temple or question…"}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: "13.5px", color: "var(--color-text)", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                style={{ fontSize: "12px", color: "var(--color-text)", background: "rgba(243, 236, 221, 0.05)", border: "1px solid var(--color-border)", borderRadius: "999px", padding: "8px 14px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Start from your chart ===== */}
      {hasChartStarters && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <NovaKicker>{lang === "ta" ? "உங்கள் ஜாதகத்திலிருந்து தொடங்குங்கள்" : "Start from your chart"}</NovaKicker>
            <span style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>{lang === "ta" ? "உங்களுக்கே பொருந்தும் பதிவுகள்" : "the entries that apply to you"}</span>
          </div>
          <div className="nova-grid-2">
            {personalChartSummary?.janmaNakshatra && nakshatraCard && (
              <button
                type="button"
                onClick={() => setNakshatramOpen(true)}
                style={{ ...cardStyle, background: "linear-gradient(120deg, var(--color-accent-muted), transparent)", border: "1px solid var(--color-border-strong)", textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent-strong)", fontWeight: 700 }}>
                    {lang === "ta" ? "உங்கள் ஜென்ம நட்சத்திரம்" : "Your birth star"}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", borderRadius: "5px", padding: "2px 8px" }}>
                    {lang === "ta" ? "நீங்கள்" : "YOU"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 600, color: "var(--color-accent-strong)" }}>
                    {lang === "ta" ? nakshatraCard.nameTa : astroText(nakshatraCard.nameEn)}
                  </span>
                  {lang !== "ta" && (
                    <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: "13px", color: "var(--color-muted)" }}>{nakshatraCard.nameTa}</span>
                  )}
                  <span style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>
                    {lang === "ta" ? "பாதம்" : "pada"} {personalChartSummary.janmaPada}
                  </span>
                </div>
                <p style={{ fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-muted)", margin: 0 }}>
                  {lang === "ta" ? nakshatraCard.profile.ta : astroText(nakshatraCard.profile.en)}
                  {nakshatraCard.rulingPlanet ? ` (${tPlanetLord(nakshatraCard.rulingPlanet, lang)} ${lang === "ta" ? "ஆளும்" : "ruled"})` : ""}
                </p>
                <span style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, marginTop: "auto" }}>
                  {lang === "ta" ? "முழு நட்சத்திரப் பக்கத்தைக் காண் →" : "Read your full star profile →"}
                </span>
              </button>
            )}
            {activeDosham && (
              <button
                type="button"
                onClick={() => setDoshamOpen(true)}
                style={{ ...cardStyle, border: "1px solid var(--color-low-border)", textAlign: "left", cursor: "pointer", fontFamily: "inherit", width: "100%" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "10.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-low)", fontWeight: 700 }}>
                    {lang === "ta" ? "உங்கள் ஜாதகத்தில் இயங்குவது" : "Active in your chart"}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-low)", background: "var(--color-low-bg)", border: "1px solid var(--color-low-border)", borderRadius: "5px", padding: "2px 8px" }}>
                    {strengthBand(activeDosham.strength, true, lang)}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 600 }}>
                  {activeDosham.label}
                </div>
                <p style={{ fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-muted)", margin: 0 }}>
                  {lang === "ta" ? activeDosham.descriptionTa : astroText(activeDosham.descriptionEn)}
                </p>
                <span style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, marginTop: "auto" }}>
                  {lang === "ta" ? "முழு சுயவிவரப் பக்கத்தைக் காண் →" : "Read the full profile →"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== The library ===== */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <NovaKicker>{lang === "ta" ? "நூலகம்" : "The library"}</NovaKicker>
          <span style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>{lang === "ta" ? "எளிய தமிழில் ஒவ்வொரு பதிவும்" : "every entry in plain Tamil-first language"}</span>
        </div>
        {filteredLibrary.length > 0 ? (
          <div className="nova-grid-3">
            {filteredLibrary.map((item) => {
              const inner = (
                <>
                  <span style={{ flex: "none", width: "40px", height: "40px", borderRadius: "50%", background: item.iconBg, border: `1px solid ${item.iconColor}`, display: "grid", placeItems: "center", fontSize: "17px", color: item.iconColor }}>
                    {item.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--color-text-strong)" }}>{item.titleEn}</span>
                      <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: "12px", color: "var(--color-muted)" }}>{item.scriptTa}</span>
                    </div>
                    <div style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--color-muted)" }}>
                      {lang === "ta" ? item.descTa : item.descEn}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--color-accent-strong)", fontWeight: 600, marginTop: "4px" }}>
                      {item.nav ? (lang === "ta" ? "நாட்காட்டியில் காண்க →" : "Open in Calendar →") : (lang === "ta" ? "உலாவுக →" : "Browse →")}
                    </div>
                  </div>
                </>
              );
              const tileStyle: React.CSSProperties = {
                textDecoration: "none", color: "var(--color-text)", background: "var(--color-surface)",
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "18px 20px",
                display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              };
              return item.nav ? (
                <button key={item.key} type="button" onClick={() => onNavigate(item.nav!)} style={tileStyle}>{inner}</button>
              ) : (
                <a key={item.key} href={item.href} target="_blank" rel="noopener" style={tileStyle}>{inner}</a>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "12.5px", color: "var(--color-faint)" }}>
            {lang === "ta" ? `“${query}” க்கு பொருந்தும் நூலக பதிவு இல்லை.` : `No library entries match “${query}”.`}
          </p>
        )}
      </div>

      {/* ===== Learn ===== */}
      {filteredLearn.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <NovaKicker>{lang === "ta" ? "கற்றுக்கொள்ளுங்கள்" : "Learn"}</NovaKicker>
          <div className="nova-grid-3">
            {filteredLearn.map((a) => (
              <a
                key={a.key}
                href={a.href}
                target="_blank"
                rel="noopener"
                style={{ textDecoration: "none", color: "var(--color-text)", background: "rgba(243, 236, 221, 0.03)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <span style={{ fontSize: "10.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-accent-secondary)", fontWeight: 700 }}>
                  {lang === "ta" ? a.kickerTa : a.kickerEn}
                </span>
                <span style={{ fontFamily: "var(--font-prose, var(--font-body))", fontSize: "15px", fontWeight: 600, lineHeight: 1.4 }}>
                  {lang === "ta" ? a.titleTa : a.titleEn}
                </span>
                <span style={{ fontSize: "11.5px", color: "var(--color-accent-strong)", fontWeight: 600, marginTop: "auto" }}>
                  {lang === "ta" ? "படிக்க →" : "Read →"}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {noMatches && (
        <p style={{ fontSize: "12.5px", color: "var(--color-faint)" }}>
          {lang === "ta" ? `“${query}” க்கு எதுவும் கிடைக்கவில்லை — கீழே Ask Vinaadi-யிடம் கேளுங்கள்.` : `Nothing matched “${query}” — ask Vinaadi below instead.`}
        </p>
      )}

      {/* ===== Ask strip ===== */}
      <button
        type="button"
        onClick={onOpenAskVinaadi}
        style={{
          display: "flex", alignItems: "center", gap: "14px", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
          background: "rgba(243, 236, 221, 0.03)", border: "1px solid var(--color-accent-secondary)", borderRadius: "var(--radius-md)", padding: "16px 22px",
        }}
      >
        <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-accent-secondary-muted)", border: "1px solid var(--color-accent-secondary)", display: "grid", placeItems: "center", fontSize: "15px", color: "var(--color-accent-secondary)", flexShrink: 0 }}>
          {"✦"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-accent-secondary)" }}>
            {lang === "ta" ? "நீங்கள் தேடுவது கிடைக்கவில்லையா?" : "Can't find what you're looking for?"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "1px" }}>
            {lang === "ta" ? "Ask Vinaadi — நூலகத்திலிருந்தும் உங்கள் ஜாதகத்திலிருந்தும் பதிலளிக்கும்." : "Ask Vinaadi — answers cite the library and read from your chart."}
          </div>
        </div>
        <span style={{ background: "var(--color-accent-secondary)", color: "var(--color-on-accent)", borderRadius: "999px", padding: "8px 18px", fontSize: "12.5px", fontWeight: 700, flexShrink: 0 }}>
          {lang === "ta" ? "கேளுங்கள் ✦" : "Ask ✦"}
        </span>
      </button>
    </div>
  );
}
