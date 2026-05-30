"use client";

import { useRef, useState } from "react";
import { apiFetchJson, toQuery } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, ShareCardData, ShareCardType } from "@/lib/types";
import { todayIso } from "@/lib/format";

// ── Colour palette per score band ────────────────────────────────────────────
const BAND_COLORS: Record<string, { bg: string; accent: string; text: string }> = {
  high:    { bg: "#0f2a1a", accent: "#4ade80", text: "#e2fcea" },
  good:    { bg: "#1a2410", accent: "#a3e635", text: "#ecfccb" },
  neutral: { bg: "#1a1a2e", accent: "#93c5fd", text: "#e0f2fe" },
  caution: { bg: "#1e1010", accent: "#fbbf24", text: "#fef9c3" },
};

const DASHA_COLORS: Record<string, string> = {
  SUN: "#f59e0b", MOON: "#93c5fd", MARS: "#f87171", MERCURY: "#34d399",
  JUPITER: "#fbbf24", VENUS: "#f0abfc", SATURN: "var(--color-faint)", RAHU: "#a78bfa", KETU: "#6b7280",
};

// ── Canvas drawing ────────────────────────────────────────────────────────────

function drawDailyVibeCard(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  lang: Lang,
  w: number,
  h: number,
) {
  const band = data.scoreBand ?? "neutral";
  const palette = BAND_COLORS[band] ?? BAND_COLORS.neutral;

  // Background
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);

  // Top accent bar
  ctx.fillStyle = palette.accent;
  ctx.fillRect(0, 0, w, 4);

  // Score circle
  const cx = 72, cy = 80, r = 42;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = palette.accent;
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(data.score ?? 0), cx, cy + 10);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("/100", cx, cy + 26);

  // Headline
  const headline = lang === "ta" ? data.headline?.ta : data.headline?.en;
  ctx.fillStyle = palette.text;
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(headline ?? "", 130, 66);

  // Sub-headline (action suggestion) — wrap at 34 chars
  const sub = lang === "ta" ? data.subHeadline?.ta : data.subHeadline?.en;
  if (sub) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "12px system-ui, sans-serif";
    const words = sub.split(" ");
    let line = "", y = 88;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > w - 140) {
        ctx.fillText(line, 130, y);
        line = word;
        y += 17;
        if (y > 115) { ctx.fillText("…", 130, y); break; }
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, 130, y);
  }

  // Best window pill
  if (data.bestWindow) {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, 16, h - 68, w - 32, 34, 8);
    ctx.fill();
    ctx.fillStyle = palette.accent;
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("✓ " + (lang === "ta" ? "சிறந்த நேரம்" : "Best window"), 26, h - 47);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(data.bestWindow, 26 + ctx.measureText("✓ " + (lang === "ta" ? "சிறந்த நேரம்" : "Best window") + "  ").width, h - 47);
  }

  drawBranding(ctx, w, h);
}

function drawDashaEraCard(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  lang: Lang,
  w: number,
  h: number,
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, w, h);

  const lordColor = DASHA_COLORS[data.mahaLord ?? ""] ?? "#e5b84d";

  // Glowing circle
  const grd = ctx.createRadialGradient(w / 2, h / 2 - 20, 10, w / 2, h / 2 - 20, 90);
  grd.addColorStop(0, lordColor + "33");
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // Top bar
  ctx.fillStyle = lordColor;
  ctx.fillRect(0, 0, w, 4);

  // Era label
  const label = lang === "ta" ? data.eraLabel?.ta : data.eraLabel?.en;
  ctx.fillStyle = lordColor;
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.textAlign = "center";
  wrapText(ctx, label ?? "", w / 2, 56, w - 40, 20);

  // Years
  if (data.eraYears) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(data.eraYears, w / 2, h - 52);
  }

  drawBranding(ctx, w, h);
}

function drawNakshatraCard(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  lang: Lang,
  w: number,
  h: number,
) {
  ctx.fillStyle = "#0e1023";
  ctx.fillRect(0, 0, w, h);

  const accent = "#a78bfa";
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 4);

  // Nakshatra name
  const name = lang === "ta" ? data.nakshatraNameTa : data.nakshatraNameEn;
  ctx.fillStyle = accent;
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name ?? "", w / 2, 62);

  // Ruling planet
  if (data.rulingPlanet) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText((lang === "ta" ? "ஆள்கின்ற கிரகம்: " : "Ruled by: ") + data.rulingPlanet, w / 2, 82);
  }

  // Trait text
  const trait = lang === "ta" ? data.nakshatraTrait?.ta : data.nakshatraTrait?.en;
  if (trait) {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = "12px system-ui, sans-serif";
    wrapText(ctx, trait, w / 2, 108, w - 48, 18);
  }

  drawBranding(ctx, w, h);
}

function drawBranding(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("vinaadi.ai", w - 16, h - 14);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

// ── Main component ────────────────────────────────────────────────────────────

interface ShareCardButtonProps {
  chartId: string;
  cardType: ShareCardType;
  lang: Lang;
  date?: string;
  label?: string;
}

export function ShareCardButton({ chartId, cardType, lang, date, label }: ShareCardButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const W = 400, H = 220;

  async function handleShare() {
    setLoading(true);
    try {
      const resp = await apiFetchJson<ApiEnvelope<ShareCardData>>(
        `/api/v1/charts/${chartId}/share-card${toQuery({ type: cardType, date: date ?? todayIso() })}`
      );
      const data = resp.data;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = W;
      canvas.height = H;

      if (cardType === "DAILY_VIBE") drawDailyVibeCard(ctx, data, lang, W, H);
      else if (cardType === "DASHA_ERA") drawDashaEraCard(ctx, data, lang, W, H);
      else drawNakshatraCard(ctx, data, lang, W, H);

      const dataUrl = canvas.toDataURL("image/png");
      setPreview(dataUrl);

      // Try native Web Share API first (mobile), fall back to download
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "vinaadi-card.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Vinaadi · My astro card" });
          return;
        }
      }
      // Fallback: download
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `vinaadi-${cardType.toLowerCase()}.png`;
      a.click();
    } catch {
      // fail silently
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
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          padding: "4px 11px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600,
          border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.65)", cursor: loading ? "wait" : "pointer",
          transition: "opacity 0.15s",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: "0.875rem" }}>↑</span>
        {loading
          ? (lang === "ta" ? "…" : "…")
          : (label ?? (lang === "ta" ? "பகிர்" : "Share"))}
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
            <img src={preview} alt="share card preview" style={{ borderRadius: "12px", maxWidth: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <a
                href={preview}
                download={`vinaadi-${cardType.toLowerCase()}.png`}
                style={{
                  padding: "8px 20px", borderRadius: "8px", background: "#e5b84d", color: "#0d1117",
                  fontWeight: 700, fontSize: "0.875rem", textDecoration: "none",
                }}
              >
                {lang === "ta" ? "பதிவிறக்கம்" : "Download PNG"}
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
                {lang === "ta" ? "மூடு" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
