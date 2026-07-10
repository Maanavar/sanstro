"use client";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { getGuideDetail, getGuideSlugs, getGuideVerifyNote, type GuideKind } from "@/lib/guide-detail-content";
import { NovaAskEntryChip, NovaAttributeBand, NovaDetailBreadcrumb, NovaDetailHero, NovaKicker, novaDetailCardStyle } from "./dashboard-explore-detail-nova";

/**
 * Nova in-app viewer for the Yogam / Pariharam / Temple library entries
 * (see docs/DASHBOARD_UI_REVAMP_PLAN.md — "dashboard must never navigate to
 * the marketing site" fix). These three Explore-hub library tiles used to
 * `target="_blank"` out to the marketing site's `/yogam`, `/pariharam` and
 * `/temples` pages. The real content behind those pages already lives in a
 * single generic, bilingual data shape (`GuideDetail`, one record per kind
 * in `web/lib/guide-detail-content.ts`) — this component reads that same
 * data directly rather than the marketing page/component, which hard-wires
 * `PublicNav`/`PublicFooter`/a signup-upsell banner and cross-links to other
 * marketing pages. Mirrors the existing Nakshatram/Dosham detail-screen
 * pattern: breadcrumb + prev/next cycling through every entry of the kind,
 * hero, attribute band, body cards, Ask-entry chip — reusing the shared
 * low-level pieces from `dashboard-explore-detail-nova.tsx`.
 *
 * The marketing page's own "Related" cross-links (to other marketing pages)
 * and its `ContextualSignupCta` upsell banner are deliberately not
 * reproduced — same precedent as the Nakshatram/Dosham screens' 2026-07-06
 * marketing-link-out removal.
 */

const KIND_LABEL: Record<GuideKind, { en: string; ta: string; kickerEn: string; kickerTa: string }> = {
  dosham: { en: "Dosham", ta: "தோஷம்", kickerEn: "Dosham library", kickerTa: "தோஷ நூலகம்" },
  yogam: { en: "Yogam", ta: "யோகம்", kickerEn: "Yogam library", kickerTa: "யோக நூலகம்" },
  pariharam: { en: "Pariharam", ta: "பரிகாரம்", kickerEn: "Pariharam library", kickerTa: "பரிகார நூலகம்" },
  temple: { en: "Temples", ta: "கோயில்கள்", kickerEn: "Temple library", kickerTa: "கோயில் நூலகம்" },
};

function wrapIndex(i: number, length: number): number {
  return ((i % length) + length) % length;
}

const cardStyle = novaDetailCardStyle;

/**
 * List-first index shared by Yogam/Pariharam/Temple — all three Explore hub
 * tiles used to jump straight into ONE library entry's detail screen with no
 * way to scan the full set first except the detail screen's prev/next
 * arrows. Unlike Nakshatram/Dosham (bespoke list shapes — a plain 27-star
 * grid vs. a per-dosham status list), these three kinds share the exact
 * same underlying shape (`getGuideSlugs(kind)` + `GuideDetail.title`), so
 * one generic list component is reused across all three rather than three
 * near-identical copies.
 */
export function DashboardExploreGuideListNova({
  lang,
  kind,
  onSelect,
  onBack,
}: {
  lang: Lang;
  kind: GuideKind;
  onSelect: (slug: string) => void;
  onBack: () => void;
}) {
  const slugs = getGuideSlugs(kind);
  const text = (v: { en: string; ta: string }) => (lang === "ta" ? v.ta : v.en);
  const kindLabel = KIND_LABEL[kind];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={text(kindLabel)}
        currentLabel={lang === "ta" ? "அனைத்து பதிவுகளும்" : "All entries"}
      />
      {slugs.length > 0 ? (
        <div className="nova-grid-3">
          {slugs.map((slug) => {
            const content = getGuideDetail(kind, slug);
            if (!content) return null;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => onSelect(slug)}
                style={{ ...cardStyle, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" }}
              >
                <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--color-text-strong)" }}>
                  {content.title.en}
                </span>
                <span style={{ fontFamily: "'Noto Sans Tamil', sans-serif", fontSize: "12.5px", color: "var(--color-muted)" }}>
                  {content.title.ta}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>
          {lang === "ta" ? "தரவு இல்லை." : "No entries available."}
        </p>
      )}
    </div>
  );
}

interface DashboardExploreGuideNovaProps {
  lang: Lang;
  kind: GuideKind;
  initialSlug?: string;
  onBack: () => void;
  onOpenAskVinaadi: () => void;
}

export function DashboardExploreGuideNova({ lang, kind, initialSlug, onBack, onOpenAskVinaadi }: DashboardExploreGuideNovaProps) {
  const slugs = getGuideSlugs(kind);
  const initialIndex = initialSlug ? Math.max(0, slugs.indexOf(initialSlug)) : 0;
  const [viewedIndex, setViewedIndex] = useState(() => wrapIndex(initialIndex, Math.max(slugs.length, 1)));

  const text = (v: { en: string; ta: string }) => (lang === "ta" ? v.ta : v.en);
  const kindLabel = KIND_LABEL[kind];

  if (slugs.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
        <button type="button" onClick={onBack} style={{ alignSelf: "flex-start", fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {lang === "ta" ? "← ஆராய்வுக்குத் திரும்பு" : "← Back to Explore"}
        </button>
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>
          {lang === "ta" ? "தரவு இல்லை." : "No entries available."}
        </p>
      </div>
    );
  }

  const slug = slugs[wrapIndex(viewedIndex, slugs.length)];
  const content = getGuideDetail(kind, slug)!;
  const prevSlug = slugs[wrapIndex(viewedIndex - 1, slugs.length)];
  const nextSlug = slugs[wrapIndex(viewedIndex + 1, slugs.length)];
  const prevContent = getGuideDetail(kind, prevSlug)!;
  const nextContent = getGuideDetail(kind, nextSlug)!;
  const verifyNote = getGuideVerifyNote(content);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Breadcrumb + prev/next nav ===== */}
      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={text(kindLabel)}
        currentLabel={text(content.title)}
        onPrev={slugs.length > 1 ? { label: text(prevContent.title), onClick: () => setViewedIndex((i) => wrapIndex(i - 1, slugs.length)) } : undefined}
        onNext={slugs.length > 1 ? { label: text(nextContent.title), onClick: () => setViewedIndex((i) => wrapIndex(i + 1, slugs.length)) } : undefined}
      />

      {/* ===== Hero ===== */}
      <NovaDetailHero
        kicker={text({ en: kindLabel.kickerEn, ta: kindLabel.kickerTa })}
        titleMain={content.title.en}
        titleSecondary={content.title.ta}
        prose={text(content.lead)}
      />

      {/* ===== Attribute band ===== */}
      {content.quickFacts && content.quickFacts.length > 0 && (
        <NovaAttributeBand facts={content.quickFacts.map((f) => ({ label: text(f.label), value: text(f.value) }))} />
      )}

      {/* ===== Two column body ===== */}
      <div className="nova-grid-detail" style={{ alignItems: "start" }}>

        {/* LEFT — sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {content.sections.map((section, i) => (
            <div key={i} style={cardStyle}>
              <NovaKicker>{text(section.heading)}</NovaKicker>
              {section.body.map((p, j) => (
                <p key={j} style={{ margin: 0, fontFamily: "var(--font-prose, var(--font-body))", fontSize: "13.5px", lineHeight: 1.7, color: "var(--color-text)" }}>
                  {text(p)}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* RIGHT rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {content.bringCards && content.bringCards.length > 0 && (
            <div style={cardStyle}>
              <NovaKicker>{lang === "ta" ? "எதை கொண்டுவரலாம்" : "What it can bring"}</NovaKicker>
              {content.bringCards.map((cat, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--color-accent-strong)" }}>{text(cat.heading)}</div>
                  <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {cat.items.map((item, j) => (
                      <li key={j} style={{ fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>{text(item)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {content.remedies && (
            <div style={cardStyle}>
              <NovaKicker>{text(content.remedies.heading)}</NovaKicker>
              <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-muted)", lineHeight: 1.6 }}>{text(content.remedies.intro)}</p>
              <ol style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {content.remedies.items.map((item, i) => (
                  <li key={i} style={{ fontSize: "12.5px", color: "var(--color-text)", lineHeight: 1.6 }}>{text(item)}</li>
                ))}
              </ol>
            </div>
          )}

          {content.slokam && (
            <div style={{ ...cardStyle, borderLeft: "3px solid var(--color-accent-strong)" }}>
              <NovaKicker>{text(content.slokam.label)}</NovaKicker>
              <p style={{ margin: 0, fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-strong)", whiteSpace: "pre-line", lineHeight: 1.6 }}>
                {text(content.slokam.text)}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
                {text(content.slokam.meaning)}
              </p>
            </div>
          )}

          <NovaAskEntryChip
            label={lang === "ta" ? `${text(content.title)} பற்றி கேளுங்கள்…` : `Ask about ${content.title.en}…`}
            ctaLabel={lang === "ta" ? "கேளுங்கள் ✦" : "Ask ✦"}
            onOpenAskVinaadi={onOpenAskVinaadi}
          />
        </div>
      </div>

      {/* ===== FAQ ===== */}
      {content.faq && content.faq.length > 0 && (
        <div style={cardStyle}>
          <NovaKicker>{lang === "ta" ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}</NovaKicker>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {content.faq.map((item, i) => (
              <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : "none", paddingTop: i > 0 ? "12px" : 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(item.q)}</p>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-muted)", lineHeight: 1.6 }}>{text(item.a)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-faint)", fontStyle: "italic", lineHeight: 1.5, borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
        {text(verifyNote)}
      </p>
    </div>
  );
}
