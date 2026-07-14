"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { Lang } from "@/lib/i18n";
import { EASE_NOVA } from "@/lib/motion";
import { getLearnArticle } from "./dashboard-learn-content";
import { ModalShell } from "./modal-shell";

/**
 * Classic's single-article read-in-place modal — used by the Chandrashtama
 * banner's "Learn →" link (`dashboard-personal-tab.tsx`), which used to
 * `target="_blank"` out to the marketing site's `/learn/what-is-chandrashtama`
 * page. Classic doesn't have Nova's Explore-tab sub-screen mechanism, so
 * this renders as a small overlay instead — same content, sourced from the
 * shared `dashboard-learn-content.ts` data (not re-authored), no
 * PublicNav/Footer/signup-upsell.
 */
export function DashboardLearnArticleModal({ slug, lang, onClose }: { slug: string; lang: Lang; onClose: () => void }) {
  const article = getLearnArticle(slug);
  const text = (v: { en: string; ta: string }) => (lang === "ta" ? v.ta : v.en);
  const reduce = useReducedMotion();

  return (
    <ModalShell
      label={article ? text(article.title) : (lang === "ta" ? "கட்டுரை" : "Article")}
      onClose={onClose}
      overlayStyle={{ zIndex: 400, backdropFilter: "none", padding: "24px" }}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.28, ease: EASE_NOVA }}
        style={{
        width: "min(600px, 100%)", maxHeight: "80vh", overflowY: "auto",
        background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "16px",
        padding: "26px 28px", display: "flex", flexDirection: "column", gap: "16px",
        color: "var(--color-text)", fontFamily: "var(--font-body)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div>
            {article && (
              <p style={{ margin: "0 0 4px", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-accent)" }}>
                {text(article.eyebrow)}
              </p>
            )}
            <p style={{ margin: 0, fontFamily: "var(--font-display, inherit)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-text-strong)" }}>
              {article ? text(article.title) : (lang === "ta" ? "கட்டுரை" : "Article")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === "ta" ? "மூடு" : "Close"}
            style={{ border: "none", background: "none", color: "var(--color-muted)", fontSize: "1.1rem", cursor: "pointer", flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {article ? (
          <>
            <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.6, color: "var(--color-text)" }}>{text(article.lead)}</p>
            {article.sections.map((section, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--color-text-strong)" }}>{text(section.heading)}</p>
                <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.65, color: "var(--color-text)" }}>{text(section.body)}</p>
              </div>
            ))}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-faint)" }}>
            {lang === "ta" ? "கட்டுரை கிடைக்கவில்லை." : "Article not available."}
          </p>
        )}
      </motion.div>
    </ModalShell>
  );
}
