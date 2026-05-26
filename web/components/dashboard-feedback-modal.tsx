"use client";




import { useState } from "react";



import { t } from "@/lib/i18n";

import type { Lang } from "@/lib/i18n";

export function FeedbackModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {

  const [category, setCategory] = useState<"bug" | "calculation" | "suggestion" | "other">("other");

  const [rating, setRating] = useState<number | null>(null);

  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);

  const [done, setDone] = useState(false);



  async function handleSend() {

    if (!message.trim()) return;

    setSending(true);

    try {

      await fetch("/api/v1/feedback", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ category, rating, message: message.trim(), page_context: "dashboard" }),

      });

      setDone(true);

      setTimeout(() => onClose(), 1800);

    } catch {

      setSending(false);

    }

  }



  return (

    <div style={{

      position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)",

      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",

    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="card" style={{ width: "min(480px, 100%)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          <h3 style={{ margin: 0 }}>{t("feedback_title", lang)}</h3>

          <button type="button" className="button button--ghost" onClick={onClose}>✕</button>

        </div>



        {done ? (

          <p style={{ textAlign: "center", color: "#4ade80", padding: "24px 0" }}>

            ✓ {t("feedback_thanks", lang)}

          </p>

        ) : (

          <>

            {/* Category */}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{t("feedback_category", lang)}</label>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>

                {(["bug", "calculation", "suggestion", "other"] as const).map((c) => (

                  <button key={c} type="button"

                    className={`button button--ghost${category === c ? " button--active" : ""}`}

                    style={{ fontSize: "0.78rem", padding: "4px 12px", opacity: category === c ? 1 : 0.5 }}

                    onClick={() => setCategory(c)}>

                    {t(c === "bug" ? "feedback_bug" : c === "calculation" ? "feedback_calc" : c === "suggestion" ? "feedback_suggest" : "feedback_other", lang)}

                  </button>

                ))}

              </div>

            </div>



            {/* Rating */}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{t("feedback_rating", lang)}</label>

              <div style={{ display: "flex", gap: "6px" }}>

                {[1, 2, 3, 4, 5].map((n) => (

                  <button key={n} type="button"

                    style={{

                      fontSize: "1.3rem", background: "none", border: "none", cursor: "pointer",

                      opacity: rating !== null ? (n <= rating ? 1 : 0.3) : 0.35,

                      filter: rating !== null && n <= rating ? "none" : "grayscale(1)",

                    }}

                    onClick={() => setRating(n === rating ? null : n)}>

                    ✓

                  </button>

                ))}

              </div>

            </div>



            {/* Message */}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{t("feedback_message", lang)}</label>

              <textarea className="input" rows={4}

                style={{ resize: "vertical", fontFamily: "inherit" }}

                value={message} onChange={(e) => setMessage(e.target.value)}

                maxLength={2000} placeholder="…" />

            </div>



            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>

              <button type="button" className="button button--ghost" onClick={onClose} disabled={sending}>

                {t("feedback_cancel", lang)}

              </button>

              <button type="button" className="button button--primary" onClick={() => void handleSend()}

                disabled={sending || !message.trim()}>

                {sending ? t("feedback_sending", lang) : t("feedback_send", lang)}

              </button>

            </div>

          </>

        )}

      </div>

    </div>

  );

}



