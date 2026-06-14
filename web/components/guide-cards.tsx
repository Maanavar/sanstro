"use client";

import Link from "next/link";

export type GuideCard = {
  title: string;
  sub?: string;
  /** When omitted, the card renders as a muted "coming soon" tile. */
  href?: string;
  badge?: string;
};

export function GuideCardGrid({ cards }: { cards: GuideCard[] }) {
  return (
    <div className="cl-guide-grid">
      <style>{`
        .cl-guide-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }
        .cl-guide-card {
          display: flex; flex-direction: column; gap: 6px;
          padding: 18px; border-radius: 16px;
          background: var(--cl-surface); border: 1px solid var(--cl-border);
          text-decoration: none;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }
        a.cl-guide-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px var(--cl-shadow); }
        .cl-guide-card--muted { opacity: 0.6; }
        .cl-guide-card__title { font-size: 1rem; font-weight: 700; color: var(--cl-ink); line-height: 1.25; }
        .cl-guide-card__sub { font-size: 0.85rem; color: var(--cl-muted); line-height: 1.4; }
        .cl-guide-card__badge {
          align-self: flex-start; margin-top: 4px;
          font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--cl-muted); border: 1px solid var(--cl-border);
          border-radius: 999px; padding: 3px 9px;
        }
      `}</style>
      {cards.map((c) => {
        const inner = (
          <>
            <span className="cl-guide-card__title">{c.title}</span>
            {c.sub && <span className="cl-guide-card__sub">{c.sub}</span>}
            {c.badge && <span className="cl-guide-card__badge">{c.badge}</span>}
          </>
        );
        return c.href ? (
          <Link key={c.title} href={c.href} className="cl-guide-card">
            {inner}
          </Link>
        ) : (
          <div key={c.title} className="cl-guide-card cl-guide-card--muted">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
