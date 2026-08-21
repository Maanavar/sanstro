"use client";

import { ArrowLeft } from "lucide-react";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { getGuideDetail, getGuideSlugs, getGuideVerifyNote, type GuideKind } from "@/lib/guide-detail-content";
import { NovaAskEntryChip, NovaAttributeBand, NovaDetailBreadcrumb, NovaDetailHero, novaDetailCardStyle } from "./dashboard-explore-detail-nova";
import { Card, Kicker } from "./ui";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
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
                style={{ ...novaDetailCardStyle, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%" }}
              >
                <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-strong)" }}>
                  {text(content.title)}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>
        <button type="button" onClick={onBack} style={{ alignSelf: "flex-start", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <><ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: "var(--space-1)" }} />{lang === "ta" ? "ஆராய்வுக்குத் திரும்பு" : "Back to Explore"}</>
        </button>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

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
        titleMain={text(content.title)}
        prose={text(content.lead)}
      />

      {/* ===== Attribute band ===== */}
      {content.quickFacts && content.quickFacts.length > 0 && (
        <NovaAttributeBand facts={content.quickFacts.map((f) => ({ label: text(f.label), value: text(f.value) }))} />
      )}

      {/* ===== Two column body ===== */}
      <div className="nova-grid-detail" style={{ alignItems: "start" }}>

        {/* LEFT — sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {content.sections.map((section, i) => (
            <Card key={i}>
              <Kicker>{text(section.heading)}</Kicker>
              {section.body.map((p, j) => (
                <p key={j} style={{ margin: 0, fontFamily: "var(--font-nova-prose, var(--font-body))", fontSize: "var(--text-base)", lineHeight: 1.7, color: "var(--color-text)" }}>
                  {text(p)}
                </p>
              ))}
            </Card>
          ))}
        </div>

        {/* RIGHT rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {content.bringCards && content.bringCards.length > 0 && (
            <Card>
              <Kicker>{lang === "ta" ? "எதை கொண்டுவரலாம்" : "What it can bring"}</Kicker>
              {content.bringCards.map((cat, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-accent-strong)" }}>{text(cat.heading)}</div>
                  <ul style={{ margin: 0, paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    {cat.items.map((item, j) => (
                      <li key={j} style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>{text(item)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          )}

          {content.remedies && (
            <Card>
              <Kicker>{text(content.remedies.heading)}</Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.6 }}>{text(content.remedies.intro)}</p>
              <ol style={{ margin: 0, paddingLeft: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {content.remedies.items.map((item, i) => (
                  <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.6 }}>{text(item)}</li>
                ))}
              </ol>
            </Card>
          )}

          {content.slokam && (
            <Card style={{ borderColor: "var(--color-accent-strong)" }}>
              <Kicker>{text(content.slokam.label)}</Kicker>
              <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-text-strong)", whiteSpace: "pre-line", lineHeight: 1.6 }}>
                {text(content.slokam.text)}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", fontStyle: "italic", lineHeight: 1.5 }}>
                {text(content.slokam.meaning)}
              </p>
            </Card>
          )}

          <NovaAskEntryChip
            label={lang === "ta" ? `${text(content.title)} பற்றி கேளுங்கள்…` : `Ask about ${content.title.en}…`}
            ctaLabel={lang === "ta" ? "கேளுங்கள்" : "Ask"}
            onOpenAskVinaadi={onOpenAskVinaadi}
          />
        </div>
      </div>

      {/* ===== FAQ ===== */}
      {content.faq && content.faq.length > 0 && (
        <Card>
          <Kicker>{lang === "ta" ? "அடிக்கடி கேட்கப்படும் கேள்விகள்" : "Frequently asked questions"}</Kicker>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {content.faq.map((item, i) => (
              <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : "none", paddingTop: i > 0 ? "12px" : 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(item.q)}</p>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.6 }}>{text(item.a)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-faint)", fontStyle: "italic", lineHeight: 1.5, borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
        {text(verifyNote)}
      </p>
    </div>
  );
}
