"use client";

import type { Lang } from "@/lib/i18n";

type Tab = "onboarding" | "personal" | "tools" | "transits" | "plan" | "life-areas" | "family" | "calendar" | "journal" | "settings" | "qa" | "explore";

type ExploreCard = {
  tab: Tab;
  icon: React.ReactNode;
  titleEn: string;
  titleTa: string;
  descEn: string;
  descTa: string;
};

type ExploreGroup = {
  headingEn: string;
  headingTa: string;
  cards: ExploreCard[];
};

function CardIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 22, height: 22, flexShrink: 0, color: "var(--panel-brand)" }}
    >
      {children}
    </svg>
  );
}

const GROUPS: ExploreGroup[] = [
  {
    headingEn: "Daily Depth",
    headingTa: "நாளாந்த ஆழம்",
    cards: [
      {
        tab: "transits",
        icon: <CardIcon><ellipse cx="12" cy="12" rx="10" ry="4" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></CardIcon>,
        titleEn: "Transits & Dasha",
        titleTa: "தசை & கிரக நகர்வு",
        descEn: "Current planetary movements and your life-period timeline",
        descTa: "கிரக நகர்வும் தசாகால அட்டவணையும்",
      },
      {
        tab: "life-areas",
        icon: <CardIcon><path d="M18 20V10M12 20V4M6 20v-6" /></CardIcon>,
        titleEn: "Life Areas",
        titleTa: "வாழ்க்கை துறைகள்",
        descEn: "Career, love, health, money, family and spiritual outlook",
        descTa: "தொழில், அன்பு, உடல்நலம், பணம், குடும்பம்",
      },
      {
        tab: "plan",
        icon: <CardIcon><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></CardIcon>,
        titleEn: "Plan & Goals",
        titleTa: "திட்டமிடு & இலக்குகள்",
        descEn: "Set intentions, find auspicious timing, and track what matters",
        descTa: "நோக்கம் வகுத்து, சுப நேரம் காணுங்கள்",
      },
    ],
  },
  {
    headingEn: "Family & Journal",
    headingTa: "குடும்பம் & குறிப்பு",
    cards: [
      {
        tab: "family",
        icon: <CardIcon><circle cx="9" cy="7" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" /><path d="M17.5 13.5c2.5.5 4.5 2.5 4.5 5" /></CardIcon>,
        titleEn: "Family Vault",
        titleTa: "குடும்ப சேமிப்பு",
        descEn: "Charts and guidance for everyone in your family",
        descTa: "உங்கள் குடும்பத்தினர் அனைவரின் ஜாதகங்கள்",
      },
      {
        tab: "journal",
        icon: <CardIcon><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 7h8M8 11h6" /></CardIcon>,
        titleEn: "Journal",
        titleTa: "குறிப்பு",
        descEn: "Log life events and see how they correlate with the stars",
        descTa: "வாழ்க்கை நிகழ்வுகளை பதிவு செய்யுங்கள்",
      },
    ],
  },
  {
    headingEn: "Specialist Tools",
    headingTa: "சிறப்பு கருவிகள்",
    cards: [
      {
        tab: "tools",
        icon: <CardIcon><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" /></CardIcon>,
        titleEn: "Tools",
        titleTa: "கருவிகள்",
        descEn: "Porutham, chart generation, annual wrapped, and retrospective",
        descTa: "பொருத்தம், ஜாதக உருவாக்கம், ஆண்டு சுருக்கம்",
      },
    ],
  },
];

interface DashboardExploreTabProps {
  lang: Lang;
  onNavigate: (tab: Tab) => void;
}

export function DashboardExploreTab({ lang, onNavigate }: DashboardExploreTabProps) {
  return (
    <div style={{ padding: "var(--space-4) var(--space-3)", maxWidth: 860 }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--panel-earth)", marginBottom: "var(--space-1)", letterSpacing: "-0.01em" }}>
        {lang === "ta" ? "ஆழமான கருவிகள்" : "Explore"}
      </h2>
      <p style={{ fontSize: "0.85rem", color: "var(--panel-muted, var(--color-faint))", marginBottom: "var(--space-5)" }}>
        {lang === "ta"
          ? "உங்கள் ஜோதிட அனுபவத்தை ஆழப்படுத்த இந்த கருவிகளை பயன்படுத்துங்கள்"
          : "Dig deeper into your chart with these specialised views"}
      </p>

      {GROUPS.map((group) => (
        <section key={group.headingEn} style={{ marginBottom: "var(--space-6)" }}>
          <h3 style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--panel-muted, var(--color-faint))",
            marginBottom: "var(--space-2)",
          }}>
            {lang === "ta" ? group.headingTa : group.headingEn}
          </h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "var(--space-2)",
          }}>
            {group.cards.map((card) => (
              <button
                key={card.tab}
                type="button"
                onClick={() => onNavigate(card.tab)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  padding: "var(--space-3) var(--space-3)",
                  background: "var(--panel-cream)",
                  border: "1.5px solid var(--panel-tan-light)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 120ms, box-shadow 120ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--panel-brand)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px var(--panel-shadow)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--panel-tan-light)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                }}
              >
                {card.icon}
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--panel-earth)", marginBottom: 2 }}>
                    {lang === "ta" ? card.titleTa : card.titleEn}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--panel-muted, var(--color-faint))", lineHeight: 1.45 }}>
                    {lang === "ta" ? card.descTa : card.descEn}
                  </div>
                </div>
                <div style={{ marginTop: "auto", fontSize: "0.75rem", fontWeight: 600, color: "var(--panel-brand)" }}>
                  {lang === "ta" ? "திறக்க →" : "Open →"}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
