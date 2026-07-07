"use client";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { LEARN_ARTICLES_CONTENT } from "./dashboard-learn-content";
import { NovaAskEntryChip, NovaDetailBreadcrumb, NovaDetailHero, NovaKicker, novaDetailCardStyle } from "./dashboard-explore-detail-nova";

/**
 * Nova in-app viewer for the Explore tab's "Learn" articles — see
 * docs/DASHBOARD_UI_REVAMP_PLAN.md, "dashboard must never navigate to the
 * marketing site" fix. These 5 article teasers used to `target="_blank"`
 * out to the real `/learn/*` marketing pages. The content is short
 * (4-6 heading/body sections per article) and already collected, verbatim,
 * in `dashboard-learn-content.ts` — this renders it in-app instead.
 */

function wrapIndex(i: number, length: number): number {
  return ((i % length) + length) % length;
}

const cardStyle = novaDetailCardStyle;

interface DashboardExploreLearnNovaProps {
  lang: Lang;
  initialSlug?: string;
  onBack: () => void;
  onOpenAskVinaadi: () => void;
}

export function DashboardExploreLearnNova({ lang, initialSlug, onBack, onOpenAskVinaadi }: DashboardExploreLearnNovaProps) {
  const initialIndex = initialSlug ? Math.max(0, LEARN_ARTICLES_CONTENT.findIndex((a) => a.slug === initialSlug)) : 0;
  const [viewedIndex, setViewedIndex] = useState(() => wrapIndex(initialIndex, LEARN_ARTICLES_CONTENT.length));
  const text = (v: { en: string; ta: string }) => (lang === "ta" ? v.ta : v.en);

  const article = LEARN_ARTICLES_CONTENT[viewedIndex];
  const prevArticle = LEARN_ARTICLES_CONTENT[wrapIndex(viewedIndex - 1, LEARN_ARTICLES_CONTENT.length)];
  const nextArticle = LEARN_ARTICLES_CONTENT[wrapIndex(viewedIndex + 1, LEARN_ARTICLES_CONTENT.length)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      <NovaDetailBreadcrumb
        onBack={onBack}
        backLabel={lang === "ta" ? "ஆராய்வு" : "Explore"}
        hubLabel={lang === "ta" ? "கற்றுக்கொள்ளுங்கள்" : "Learn"}
        currentLabel={text(article.title)}
        onPrev={{ label: text(prevArticle.title), onClick: () => setViewedIndex((i) => wrapIndex(i - 1, LEARN_ARTICLES_CONTENT.length)) }}
        onNext={{ label: text(nextArticle.title), onClick: () => setViewedIndex((i) => wrapIndex(i + 1, LEARN_ARTICLES_CONTENT.length)) }}
      />

      <NovaDetailHero
        kicker={text(article.eyebrow)}
        titleMain={article.title.en}
        titleSecondary={article.title.ta}
        prose={text(article.lead)}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {article.sections.map((section, i) => (
          <div key={i} style={cardStyle}>
            <NovaKicker>{text(section.heading)}</NovaKicker>
            <p style={{ margin: 0, fontFamily: "var(--font-prose, var(--font-body))", fontSize: "13.5px", lineHeight: 1.7, color: "var(--color-text)" }}>
              {text(section.body)}
            </p>
          </div>
        ))}
      </div>

      <NovaAskEntryChip
        label={lang === "ta" ? `${text(article.title)} பற்றி கேளுங்கள்…` : `Ask about ${article.title.en}…`}
        ctaLabel={lang === "ta" ? "கேளுங்கள் ✦" : "Ask ✦"}
        onOpenAskVinaadi={onOpenAskVinaadi}
      />
    </div>
  );
}
