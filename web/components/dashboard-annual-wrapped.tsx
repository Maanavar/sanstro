"use client";

import { useState } from "react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { AnnualWrappedData, ApiEnvelope, WrappedSlide } from "@/lib/types";
import { ShareCardButton } from "./dashboard-share-card";

const W = {
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "var(--color-faint)",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
  rust: "#A8482F",
} as const;

// ── Planet accent colours ─────────────────────────────────────────────────────
const PLANET_COLORS: Record<string, string> = {
  SUN: "#D2873B",
  MOON: "#668FA3",
  MARS: "#A8482F",
  MERCURY: "#5C7654",
  JUPITER: "#B85A2C",
  VENUS: "#956A8A",
  SATURN: "#6B7280",
  RAHU: "#7E6B99",
  KETU: "#7A6F5E",
};

// ── Slide icon map ────────────────────────────────────────────────────────────
const SLIDE_ICON: Record<string, string> = {
  OVERVIEW: "OV",
  DASHA_ERA: "DE",
  PEAK: "PK",
  STATS: "ST",
  REFLECTION: "RF",
  LIFE_AREA: "LA",
  CLOSING: "CL",
};

// ── Single slide card ─────────────────────────────────────────────────────────
function SlideCard({ slide, lang, total, index }: {
  slide: WrappedSlide;
  lang: Lang;
  total: number;
  index: number;
}) {
  const headline = lang === "ta" ? slide.headline.ta : slide.headline.en;
  const body = lang === "ta" ? slide.body.ta : slide.body.en;
  const accent = slide.accentColor ?? W.terracotta;
  const icon = SLIDE_ICON[slide.slideType] ?? "WW";

  return (
    <div style={{
      position: "relative",
      padding: "28px 24px",
      borderRadius: "16px",
      background: W.card,
      border: `1px solid ${accent}33`,
      boxShadow: `0 0 40px ${accent}0d`,
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      minHeight: "180px",
    }}>
      {/* Accent top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", borderRadius: "16px 16px 0 0", background: accent }} />

      {/* Slide counter */}
      <span style={{ position: "absolute", top: "14px", right: "16px", fontSize: "0.625rem", color: W.mutedLt, fontVariantNumeric: "tabular-nums" }}>
        {index + 1}/{total}
      </span>

      {/* Icon + headline row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "1.5rem" }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: accent, lineHeight: 1.25 }}>
          {headline}
        </h3>
      </div>

      {/* Body */}
      <p style={{ margin: 0, fontSize: "0.875rem", color: W.inkMid, lineHeight: 1.6 }}>
        {body}
      </p>

      {/* Stat badge */}
      {slide.stat && (
        <div style={{ alignSelf: "flex-start", padding: "5px 14px", borderRadius: "20px", background: `${accent}22`, border: `1px solid ${accent}44`, fontSize: "0.875rem", fontWeight: 700, color: accent }}>
          {slide.stat}
        </div>
      )}
    </div>
  );
}

// ── Summary stats row ─────────────────────────────────────────────────────────
function StatsSummary({ data, lang }: { data: AnnualWrappedData; lang: Lang }) {
  const lordColor = PLANET_COLORS[data.dominantDashaLord] ?? W.terracotta;
  const stats = [
    { label: lang === "ta" ? "சராசரி மதிப்பெண்" : "Avg Score", value: `${data.averageScore}/100` },
    { label: lang === "ta" ? "உயர் நாட்கள்" : "High Days", value: String(data.highDays) },
    { label: lang === "ta" ? "நாட்கள் கண்காணிப்பு" : "Days Tracked", value: String(data.totalDaysScored) },
    { label: lang === "ta" ? "தலைமை தசை" : "Dominant Dasha", value: data.dominantDashaLord, color: lordColor },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
      {stats.map((s) => (
        <div key={s.label} style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background: W.card,
          border: `1px solid ${W.borderLt}`,
        }}>
          <p style={{ margin: "0 0 3px", fontSize: "0.625rem", color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: s.color ?? W.terracotta }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface DashboardAnnualWrappedProps {
  chartId: string | null;
  lang: Lang;
}

export function DashboardAnnualWrapped({ chartId, lang }: DashboardAnnualWrappedProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1].filter((y) => y >= 2024);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnnualWrappedData | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const title = lang === "ta" ? "ஆண்டு சுருக்கம்" : "Annual Wrapped";
  const subtitle = lang === "ta"
    ? "கிரக நடனத்தில் உங்கள் ஆண்டு பயணம்"
    : "Your year in planetary terms";

  async function load() {
    if (!chartId) return;
    setLoading(true);
    setError(null);
    setSlideIndex(0);
    try {
      const resp = await apiFetchJson<ApiEnvelope<AnnualWrappedData>>(
        `/api/v1/charts/${chartId}/annual-wrapped?year=${selectedYear}`
      );
      setData(resp.data);
      setOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg.includes("404")) {
        setError(lang === "ta"
          ? `${selectedYear} ஆண்டுக்கு தரவு இல்லை. மேலும் நாட்கள் பயன்படுத்திய பின் முயலவும்.`
          : `No score data for ${selectedYear} yet. Keep using Vinaadi and try again.`);
      } else {
        setError(lang === "ta" ? "ஏதோ தவறாக உள்ளது." : "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setData(null);
    setSlideIndex(0);
  }

  if (!chartId) return null;

  return (
    <>
      {/* Entry card */}
      <div style={{
        padding: "18px 20px",
        borderRadius: "14px",
        background: W.surface,
        border: `1px solid ${W.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
      }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: "0.875rem", fontWeight: 700, color: W.terracotta }}>
            {title}
          </p>
          <p style={{ margin: 0, fontSize: "0.75rem", color: W.muted }}>{subtitle}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Year selector */}
          <div style={{ display: "flex", gap: "4px" }}>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y)}
                style={{
                  padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600,
                  border: `1px solid ${W.border}`,
                  background: selectedYear === y ? "#F8E4D2" : W.card,
                  color: selectedYear === y ? W.terracotta : W.muted,
                  cursor: "pointer",
                }}
              >
                {y}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            style={{
              padding: "6px 16px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700,
              background: "#F8E4D2", border: `1px solid ${W.terracotta}66`,
              color: W.terracotta, cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "..." : (lang === "ta" ? "திற" : "Open")}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: W.rust, padding: "0 4px" }}>
          {error}
        </p>
      )}

      {/* Full-screen overlay */}
      {open && data && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(26,22,18,0.72)",
          display: "flex", flexDirection: "column", zIndex: 9998,
          overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{
            position: "sticky", top: 0, zIndex: 1,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 24px",
            background: "rgba(250,245,234,0.96)",
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${W.border}`,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: W.terracotta }}>
                {data.year} - {title}
              </p>
              <p style={{ margin: 0, fontSize: "0.625rem", color: W.mutedLt }}>
                {data.totalDaysScored} {lang === "ta" ? "நாட்கள்" : "days"} - {data.slides.length} {lang === "ta" ? "சுளைகள்" : "slides"}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              style={{
                background: W.card, border: `1px solid ${W.border}`,
                color: W.muted, borderRadius: "8px",
                padding: "6px 14px", fontSize: "0.75rem", cursor: "pointer",
              }}
            >
              {lang === "ta" ? "மூடு" : "Close"}
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "24px", maxWidth: "600px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Summary stats */}
            <StatsSummary data={data} lang={lang} />

            {/* Slide navigation */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {data.slides.map((s, i) => (
                <button
                  key={s.slideId}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  style={{
                    width: "28px", height: "6px", borderRadius: "3px", border: "none",
                    cursor: "pointer",
                    background: i === slideIndex ? (s.accentColor ?? W.terracotta) : W.border,
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>

            {/* Active slide */}
            {data.slides[slideIndex] && (
              <SlideCard
                slide={data.slides[slideIndex]}
                lang={lang}
                total={data.slides.length}
                index={slideIndex}
              />
            )}

            {/* Prev / Next navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                disabled={slideIndex === 0}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px", fontSize: "0.875rem", fontWeight: 600,
                  background: W.card, border: `1px solid ${W.border}`,
                  color: slideIndex === 0 ? W.mutedLt : W.inkMid,
                  cursor: slideIndex === 0 ? "default" : "pointer",
                }}
              >
                {"<-"} {lang === "ta" ? "முந்தைய" : "Previous"}
              </button>
              <button
                type="button"
                onClick={() => setSlideIndex((i) => Math.min(data.slides.length - 1, i + 1))}
                disabled={slideIndex === data.slides.length - 1}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px", fontSize: "0.875rem", fontWeight: 600,
                  background: W.card, border: `1px solid ${W.border}`,
                  color: slideIndex === data.slides.length - 1 ? W.mutedLt : W.inkMid,
                  cursor: slideIndex === data.slides.length - 1 ? "default" : "pointer",
                }}
              >
                {lang === "ta" ? "அடுத்தது" : "Next"} {"->"}
              </button>
            </div>

            {/* Share DASHA_ERA card from within the wrapped view */}
            <div style={{ paddingTop: "4px", display: "flex", justifyContent: "center" }}>
              <ShareCardButton chartId={chartId} cardType="DASHA_ERA" lang={lang} label={lang === "ta" ? "தசை அட்டை பகிர்" : "Share Dasha Card"} />
            </div>

          </div>
        </div>
      )}
    </>
  );
}





