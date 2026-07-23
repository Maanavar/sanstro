"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetchJson } from "@/lib/api";
import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { feedbackSchema, type FeedbackFormValues } from "@/lib/schemas";
import { ValidatedField, ValidatedTextarea } from "@/components/form/ValidatedField";
import { Button, Pill } from "@/components/ui";
import { ModalShell } from "./modal-shell";
import "./dashboard-feedback-modal.css";

export function FeedbackModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      category: "other",
      rating: null,
      message: "",
      isReview: false,
      allowContact: false,
    },
  });

  const category = watch("category");
  const rating = watch("rating");
  const isReview = watch("isReview");
  const allowContact = watch("allowContact");

  async function onSubmit(values: FeedbackFormValues) {
    try {
      await apiFetchJson("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: values.category,
          rating: values.rating,
          message: values.message.trim(),
          page_context: "dashboard",
          is_review: values.isReview || values.category === "review",
          allow_contact: values.allowContact,
        }),
      });
      track("feedback_submitted", {
        category: values.category,
        rating: values.rating,
        is_review: values.isReview || values.category === "review",
      });
      setDone(true);
      setTimeout(() => onClose(), 1800);
    } catch {
      // isSubmitting resets automatically; user can retry
    }
  }

  return (
    <ModalShell
      label={t("feedback_title", lang)}
      onClose={onClose}
      overlayClassName="fbm-overlay"
      panelClassName="fbm-panel"
    >
        <div className="fbm-header">
          <h3 className="fbm-title">{t("feedback_title", lang)}</h3>
          <button type="button" className="fbm-close" onClick={onClose} aria-label={t("feedback_cancel", lang)}>
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {done ? (
          <p className="fbm-done">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
              <path d="M5.5 12.5L10 17L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("feedback_thanks", lang)}
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="fbm-field">
              <span className="fbm-label">{t("feedback_category", lang)}</span>
              <div className="fbm-cat-row">
                {(["bug", "calculation", "suggestion", "review", "other"] as const).map((c) => (
                  <Pill
                    key={c}
                    active={category === c}
                    onClick={() => setValue("category", c)}
                  >
                    {t(
                      c === "bug" ? "feedback_bug"
                        : c === "calculation" ? "feedback_calc"
                        : c === "suggestion" ? "feedback_suggest"
                        : c === "review" ? "feedback_review"
                        : "feedback_other",
                      lang
                    )}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="fbm-field">
              <span className="fbm-label">{t("feedback_rating", lang)}</span>
              <div className="fbm-star-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="fbm-star"
                    data-lit={rating !== null && n <= rating}
                    onClick={() => setValue("rating", n === rating ? null : n)}
                    aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <ValidatedField
              id="message"
              label={t("feedback_message", lang)}
              error={errors.message?.message}
            >
              <ValidatedTextarea
                id="message"
                className="fbm-textarea"
                rows={4}
                maxLength={2000}
                placeholder={lang === "ta" ? "என்ன நடந்தது அல்லது எதை மேம்படுத்தலாம் என்று சொல்லுங்கள்…" : "Tell us what happened, or what we could improve…"}
                error={!!errors.message}
                {...register("message")}
              />
            </ValidatedField>

            <label className="fbm-checkbox-label">
              <input
                type="checkbox"
                className="fbm-checkbox-input"
                checked={isReview || category === "review"}
                disabled={category === "review"}
                onChange={(e) => setValue("isReview", e.target.checked)}
              />
              <span>{t("feedback_mark_review", lang)}</span>
            </label>

            <label className="fbm-checkbox-label">
              <input
                type="checkbox"
                className="fbm-checkbox-input"
                checked={allowContact}
                onChange={(e) => setValue("allowContact", e.target.checked)}
              />
              <span>{t("feedback_allow_contact", lang)}</span>
            </label>

            <div className="fbm-actions">
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                {t("feedback_cancel", lang)}
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? t("feedback_sending", lang) : t("feedback_send", lang)}
              </Button>
            </div>
          </form>
        )}
    </ModalShell>
  );
}
