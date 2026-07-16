"use client";

import { useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import {
  drawBranding,
  ensureFontsLoaded,
  getTamilFontStack,
  roundRect,
  shareOrDownloadPng,
  wrapText,
  withAlpha,
} from "@/lib/share-card-canvas";

export interface BiText { ta: string; en: string }

export interface WrappedSlide {
  slideId: string;
  slideType: string;
  headline: BiText;
  body: BiText;
  accentColor: string;
  stat?: string | null;
}

export interface AnnualWrappedData {
  chartId: string;
  year: number;
  slides: WrappedSlide[];
  totalDaysScored: number;
  peakScore: number;
  peakDate: string | null;
  valleyScore: number;
  valleyDate: string | null;
  dominantDashaLord: string;
  highDays: number;
  cautionDays: number;
  averageScore: number;
  topLifeArea: string | null;
}

export const PLANET_EMOJI: Record<string, string> = {
  Sun: "☀️", Moon: "🌙", Mars: "🔴", Mercury: "💚", Jupiter: "🟡",
  Venus: "⭐", Saturn: "🪐", Rahu: "🌑", Ketu: "🌑",
};

// 9:16 portrait — optimal for WhatsApp Status, Instagram Stories/Reels
const W = 1080, H = 1920;
const CARD_BG = "#141220";
const FALLBACK_ACCENT = "#e5b84d";

function formatShortDate(iso: string | null, ta: boolean): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(ta ? "ta-IN" : "en-IN", { month: "short", day: "numeric" });
}

function drawWrappedCard(
  ctx: CanvasRenderingContext2D,
  wrapped: AnnualWrappedData,
  lang: Lang,
  year: number,
  font: string,
) {
  const ta = lang === "ta";
  // Slide accent colors come from the backend as literal hex — canvas-safe.
  const accent = wrapped.slides[0]?.accentColor || FALLBACK_ACCENT;

  ctx.fillStyle = CARD_BG;
  ctx.fillRect(0, 0, W, H);

  const grd = ctx.createRadialGradient(W / 2, 640, 20, W / 2, 640, 720);
  grd.addColorStop(0, withAlpha(accent, "2e"));
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 10);

  drawBranding(ctx, W);

  // Year + title
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 150px ${font}`;
  ctx.fillText(String(year), W / 2, 300);

  ctx.fillStyle = accent;
  ctx.font = `bold 46px ${font}`;
  ctx.fillText(ta ? "ஆண்டு சுருக்கம்" : "Year in Review", W / 2, 390);

  // Average-score ring
  const cx = W / 2, cy = 660, r = 190;
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  const score = wrapped.averageScore;
  const startA = -Math.PI / 2;
  const endA = startA + Math.PI * 2 * Math.min(score / 100, 1);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, startA, endA);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font = `bold 96px ${font}`;
  ctx.fillText(score.toFixed(0), cx, cy + 36);
  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.font = `34px ${font}`;
  ctx.fillText("/100", cx, cy + 92);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `30px ${font}`;
  ctx.fillText(ta ? "சராசரி மதிப்பெண்" : "Average score", cx, cy + r + 74);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, 986);
  ctx.lineTo(W - 64, 986);
  ctx.stroke();

  // 2×3 stat pill grid
  const stats: Array<{ label: string; value: string }> = [
    { label: ta ? "உயர் நாட்கள்" : "High days", value: String(wrapped.highDays) },
    { label: ta ? "எச்சரிக்கை நாட்கள்" : "Caution days", value: String(wrapped.cautionDays) },
    { label: ta ? "உச்ச மதிப்பெண்" : "Peak score", value: `${wrapped.peakScore} · ${formatShortDate(wrapped.peakDate, ta)}` },
    { label: ta ? "குறைந்த மதிப்பெண்" : "Lowest score", value: `${wrapped.valleyScore} · ${formatShortDate(wrapped.valleyDate, ta)}` },
    { label: ta ? "கணிக்கப்பட்ட நாட்கள்" : "Days scored", value: String(wrapped.totalDaysScored) },
    { label: ta ? "முதன்மை தசை" : "Dominant dasha", value: `${PLANET_EMOJI[wrapped.dominantDashaLord] ?? "⭐"} ${wrapped.dominantDashaLord}` },
  ];

  const margin = 64, gap = 16;
  const pillW = (W - margin * 2 - gap) / 2;
  const pillH = 160;
  stats.forEach((stat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (pillW + gap);
    const y = 1036 + row * (pillH + gap);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x, y, pillW, pillH, 18);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 52px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(stat.value, x + pillW / 2, y + 76);

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = `27px ${font}`;
    ctx.fillText(stat.label, x + pillW / 2, y + 126);
  });

  // Top life area
  if (wrapped.topLifeArea) {
    ctx.fillStyle = "rgba(255,255,255,0.60)";
    ctx.font = `32px ${font}`;
    ctx.textAlign = "center";
    wrapText(
      ctx,
      `${ta ? "முதன்மை வாழ்க்கை பகுதி" : "Top life area"}: ${wrapped.topLifeArea}`,
      W / 2, 1660, W - 128, 44, 2,
    );
  }

  // Bottom CTA
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = `24px ${font}`;
  ctx.textAlign = "center";
  ctx.fillText(
    ta ? "vinaadi.com இல் உங்கள் ஆண்டு →" : "See your year at vinaadi.com →",
    W / 2, H - 52,
  );
}

export function WrappedShareCard({ wrapped, lang, year, label }: { wrapped: AnnualWrappedData; lang: Lang; year: number; label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ta = lang === "ta";

  async function handleShare() {
    setLoading(true);
    setError(null);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = W;
      canvas.height = H;

      const font = getTamilFontStack();
      await ensureFontsLoaded([
        `bold 150px ${font}`,
        `bold 96px ${font}`,
        `bold 52px ${font}`,
        `bold 46px ${font}`,
        `34px ${font}`,
        `30px ${font}`,
        `27px ${font}`,
        `24px ${font}`,
      ]);

      drawWrappedCard(ctx, wrapped, lang, year, font);

      const { dataUrl } = await shareOrDownloadPng(
        canvas,
        `vinaadi-wrapped-${year}.png`,
        "Vinaadi · Year Wrapped",
      );
      setPreview(dataUrl);
    } catch (err) {
      // User dismissing the native share sheet is not an error.
      if (err instanceof Error && err.name === "AbortError") return;
      setError(ta ? "பகிர்வு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்." : "Share card generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function dismiss() { setPreview(null); }

  return (
    <>
      {/* Hidden canvas — used only for rendering */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={loading}
        style={{ background: "var(--color-saffron, #c07a2c)", color: "#fff", border: "none", borderRadius: "8px", padding: "6px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: loading ? "wait" : "pointer", flexShrink: 0, opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "…" : label ?? (ta ? "பகிர்" : "Share")}
      </button>

      {/* Preview modal */}
      {preview && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: "24px",
          }}
          onClick={dismiss}
        >
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- runtime-generated data URL; next/image cannot optimize it */}
            <img
              src={preview}
              alt={ta ? "பகிர்வு அட்டை முன்னோட்டம்" : "share card preview"}
              style={{
                borderRadius: "12px",
                maxWidth: "min(100%, 420px)",
                maxHeight: "75vh",
                objectFit: "contain",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href={preview}
                download={`vinaadi-wrapped-${year}.png`}
                style={{
                  padding: "8px 20px", borderRadius: "8px", background: "var(--chart-amber)", color: "#0d1117",
                  fontWeight: 700, fontSize: "0.875rem", textDecoration: "none",
                }}
              >
                {ta ? "பதிவிறக்கம்" : "Download PNG"}
              </a>
              <button
                type="button"
                onClick={dismiss}
                style={{
                  padding: "8px 20px", borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)", background: "transparent",
                  color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", cursor: "pointer",
                }}
              >
                {ta ? "மூடு" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
      {error && (
        <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "var(--color-score-low, #A8482F)" }}>{error}</p>
      )}
    </>
  );
}
