"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchJson, toQuery } from "@/lib/api";
import { LANG_STORAGE_KEY } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { scoreColor } from "@/lib/format";
import type { ApiEnvelope, BirthProfileSnapshot } from "@/lib/types";
import { PLANET_EMOJI, WrappedShareCard } from "@/components/wrapped-share-card";
import type { AnnualWrappedData } from "@/components/wrapped-share-card";

type ProfileResponse = { data: BirthProfileSnapshot };

export default function WrappedPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ta");
  const [wrapped, setWrapped] = useState<AnnualWrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const ta = lang === "ta";
  const currentYear = new Date().getFullYear();
  const wrappedYear = currentYear - 1;

  useEffect(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "ta" || stored === "en") setLang(stored as Lang);

    void (async () => {
      try {
        const profile = await apiFetchJson<ProfileResponse>("/api/v1/birth-profiles/me/latest");
        const chartId = profile.data.chartId;
        if (!chartId) throw new Error("No chart found. Please complete your birth profile.");

        const res = await apiFetchJson<ApiEnvelope<AnnualWrappedData>>(
          `/api/v1/charts/${chartId}/annual-wrapped${toQuery({ year: wrappedYear })}`
        );
        setWrapped(res.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load";
        if (msg.includes("401") || msg.includes("Unauthorized") || msg.includes("not authenticated")) {
          router.replace("/login");
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, wrappedYear]);

  const slide = wrapped?.slides[slideIndex];
  const totalSlides = wrapped?.slides.length ?? 0;

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(ta ? "ta-IN" : "en-IN", { month: "short", day: "numeric" });
  }

  return (
    <div className="cd-shell" style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text)", padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-muted)", padding: "6px 12px", fontSize: "0.8rem", cursor: "pointer" }}
          >
            ← {ta ? "திரும்பு" : "Back"}
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
              {ta ? `${wrappedYear} ஆண்டு சுருக்கம்` : `${wrappedYear} Year in Review`}
            </h1>
            <p style={{ margin: "1px 0 0", fontSize: "0.75rem", color: "var(--color-muted)" }}>
              {ta ? "ஆண்டு ராப்ட்" : "Annual Wrapped"}
            </p>
          </div>
          {wrapped && <WrappedShareCard wrapped={wrapped} lang={lang} year={wrappedYear} />}
        </div>

        {loading && (
          <div style={{ height: "300px", borderRadius: "16px", background: "var(--nova-hero-gradient, var(--color-surface-3))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)", fontSize: "0.85rem" }}>
            {ta ? "ஏற்றுகிறது…" : "Loading your year…"}
          </div>
        )}

        {error && (
          <div style={{ padding: "20px", borderRadius: "14px", background: "var(--color-surface)", border: "1px solid var(--color-border)", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>📅</p>
            <p style={{ margin: "0 0 6px", fontWeight: 700, color: "var(--color-text-strong)" }}>
              {ta ? "ஆண்டு சுருக்கம் இல்லை" : "Annual Wrapped not available"}
            </p>
            <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.82rem" }}>
              {ta
                ? `${wrappedYear} ஆண்டுக்கான தரவு இன்னும் கிடைக்கவில்லை. இந்த ஆண்டு முடிவில் மீண்டும் பாருங்கள்.`
                : `Data for ${wrappedYear} isn't available yet. Check back at year-end.`}
            </p>
          </div>
        )}

        {wrapped && !error && (
          <>
            {/* Slide viewer */}
            {slide && totalSlides > 0 && (
              <div
                style={{
                  minHeight: "320px",
                  borderRadius: "20px",
                  padding: "32px 28px",
                  // Story-slide card is a deliberately theme-invariant vivid motif (like
                  // Spotify Wrapped) — fixed dark plum fallback + white text stay legible
                  // regardless of Nova Light/Dark, unlike the rest of this page's chrome.
                  background: slide.accentColor || "#2c2338",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Slide number */}
                <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {slideIndex + 1} / {totalSlides}
                </p>

                {/* Content */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "12px", paddingBlock: "20px" }}>
                  {slide.stat && (
                    <p style={{ margin: 0, fontSize: "3rem", fontWeight: 900, lineHeight: 1, opacity: 0.9 }}>
                      {slide.stat}
                    </p>
                  )}
                  <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, lineHeight: 1.2 }}>
                    {ta ? slide.headline.ta : slide.headline.en}
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.88rem", opacity: 0.8, lineHeight: 1.65 }}>
                    {ta ? slide.body.ta : slide.body.en}
                  </p>
                </div>

                {/* Navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                    disabled={slideIndex === 0}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 16px", fontSize: "0.85rem", cursor: slideIndex === 0 ? "default" : "pointer", opacity: slideIndex === 0 ? 0.35 : 1 }}
                  >
                    ← {ta ? "முந்தையது" : "Prev"}
                  </button>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {wrapped.slides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSlideIndex(i)}
                        style={{ width: i === slideIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === slideIndex ? "#fff" : "rgba(255,255,255,0.35)", border: "none", cursor: "pointer", padding: 0, transition: "width 0.2s" }}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSlideIndex((i) => Math.min(totalSlides - 1, i + 1))}
                    disabled={slideIndex === totalSlides - 1}
                    style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", color: "#fff", padding: "8px 16px", fontSize: "0.85rem", cursor: slideIndex === totalSlides - 1 ? "default" : "pointer", opacity: slideIndex === totalSlides - 1 ? 0.35 : 1 }}
                  >
                    {ta ? "அடுத்தது" : "Next"} →
                  </button>
                </div>
              </div>
            )}

            {/* Stats toggle */}
            <button
              type="button"
              onClick={() => setShowStats((v) => !v)}
              style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", textAlign: "left" }}
            >
              {showStats
                ? (ta ? "▲ புள்ளிவிவரங்களை மறை" : "▲ Hide stats")
                : (ta ? "▼ ஆண்டு புள்ளிவிவரங்களை காண்க" : "▼ View full-year stats")}
            </button>

            {showStats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))", gap: "12px" }}>
                {[
                  { label: ta ? "சராசரி மதிப்பெண்" : "Average score",   value: wrapped.averageScore.toFixed(0), accent: scoreColor(wrapped.averageScore) },
                  { label: ta ? "உயர் நாட்கள்"    : "High days",        value: wrapped.highDays.toString(), accent: "var(--color-score-high, #5C7654)" },
                  { label: ta ? "எச்சரிக்கை நாட்கள்" : "Caution days", value: wrapped.cautionDays.toString(), accent: "var(--color-score-low, #A8482F)" },
                  { label: ta ? "உச்ச மதிப்பெண்"  : "Peak score",       value: `${wrapped.peakScore} (${formatDate(wrapped.peakDate)})`, accent: "var(--color-score-high, #5C7654)" },
                  { label: ta ? "கணிக்கப்பட்ட நாட்கள்" : "Days scored",  value: wrapped.totalDaysScored.toString(), accent: "var(--color-muted)" },
                  { label: ta ? "முதன்மை தசை"    : "Dominant dasha",   value: `${PLANET_EMOJI[wrapped.dominantDashaLord] ?? "⭐"} ${wrapped.dominantDashaLord}`, accent: "var(--color-accent-strong)" },
                  ...(wrapped.topLifeArea ? [{ label: ta ? "முதன்மை வாழ்க்கை பகுதி" : "Top life area", value: wrapped.topLifeArea, accent: "var(--color-muted)" }] : []),
                ].map((item) => (
                  <div key={item.label} style={{ padding: "14px", borderRadius: "12px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "0.7rem", color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {item.label}
                    </p>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "1.15rem", color: item.accent }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
