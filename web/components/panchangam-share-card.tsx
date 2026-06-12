"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetchJson, toQuery } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { tNakshatra, tTithi } from "@/lib/i18n";
import { todayIso } from "@/lib/format";

// ── Card data (mirrors app/services/panchangam_card_service.get_card_data) ─────
export interface PanchangamCardData {
  date: string;
  city: string;
  weekday: string;
  deityKey: string;
  deityLabel: { ta: string; en: string };
  tamilDate: { ta: string; en: string } | null;
  tithi: { name: string; paksha: string };
  nakshatra: { name: string; pada: number };
  yoga: string;
  karana: string;
  rahukalam: { start: string; end: string };
  abhijit: { start: string; end: string };
  sunrise: string;
  sunset: string;
  moonPhaseLabel: string;
  festival: {
    key: string;
    ta: string;
    en: string;
    deity: string;
    message: { ta: string; en: string } | null;
  } | null;
  guidance: { ta: string; en: string };
  brand: { name: string; url: string; cta: { ta: string; en: string } };
}

type CardKind = "PANCHANGAM" | "FESTIVAL";
type CardSize = "STORY" | "SQUARE"; // 1080×1920 | 1080×1080

const TAMIL_FONT = "'Noto Sans Tamil', 'Latha', 'Nirmala UI', system-ui, sans-serif";

// Warm festive palette inspired by traditional Tamil astrologer cards.
const PALETTE = {
  cream: "#FBF3E0",
  creamDeep: "#F4E4C1",
  gold: "#C99A3B",
  goldBright: "#E7BE57",
  maroon: "#8C1D1D",
  maroonDeep: "#6E1414",
  green: "#1E6B3A",
  ink: "#3A2A12",
  inkSoft: "#6B5836",
};

const FESTIVAL_THEME: Record<string, { a: string; b: string; accent: string }> = {
  POURNAMI:     { a: "#F8EFD6", b: "#EBD49A", accent: "#B8860B" },
  AMAVASAI:     { a: "#1B1B2E", b: "#2A2A45", accent: "#C9A227" },
  SHIVARATHIRI: { a: "#13131F", b: "#27263F", accent: "#9AA7C7" },
  PRADOSHAM:    { a: "#F3E8DF", b: "#E3C9A6", accent: "#8C1D1D" },
  EKADASI:      { a: "#EAF3EC", b: "#C7E0CC", accent: "#1E6B3A" },
};

// ── Canvas helpers ─────────────────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 99) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineH;
      lines++;
      if (lines >= maxLines) { ctx.fillText("…", x, y); return y; }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
  return y;
}

function loadDeity(key: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `/deities/${key}.png`;
  });
}

// Deity medallion: gradient disc + optional image overlay + glyph fallback.
function drawDeity(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, img: HTMLImageElement | null, accent: string) {
  const grd = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.2, cx, cy, r);
  grd.addColorStop(0, "#FFF6DD");
  grd.addColorStop(1, accent);
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.stroke();

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.clip();
    const s = (r - 6) * 2;
    ctx.drawImage(img, cx - (r - 6), cy - (r - 6), s, s);
    ctx.restore();
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `${r * 0.9}px ${TAMIL_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ॐ", cx, cy + r * 0.04);
    ctx.textBaseline = "alphabetic";
  }
}

function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, bgA: string, bgB: string) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, bgA);
  bg.addColorStop(1, bgB);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // double gold border
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, w - 40, h - 40);
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, w - 68, h - 68);
}

function drawBrandFooter(ctx: CanvasRenderingContext2D, w: number, h: number, data: PanchangamCardData, lang: Lang) {
  const fy = h - 96;
  ctx.fillStyle = PALETTE.maroon;
  roundRect(ctx, 54, fy, w - 108, 60, 14);
  ctx.fill();
  ctx.fillStyle = "#FFF6DD";
  ctx.textAlign = "center";
  ctx.font = `bold 30px ${TAMIL_FONT}`;
  ctx.fillText(lang === "ta" ? data.brand.cta.ta : data.brand.cta.en, w / 2, fy + 39);
  ctx.fillStyle = PALETTE.inkSoft;
  ctx.font = `bold 22px ${TAMIL_FONT}`;
  ctx.fillText(`${data.brand.name} · ${data.brand.url}`, w / 2, h - 50);
}

// ── Panchangam (daily) card ────────────────────────────────────────────────────
function drawPanchangamCard(ctx: CanvasRenderingContext2D, data: PanchangamCardData, img: HTMLImageElement | null, lang: Lang, w: number, h: number) {
  const square = h <= w * 1.1;
  drawFrame(ctx, w, h, PALETTE.cream, PALETTE.creamDeep);

  // Header ribbon
  ctx.fillStyle = PALETTE.maroon;
  roundRect(ctx, 54, 54, w - 108, 96, 16);
  ctx.fill();
  ctx.fillStyle = PALETTE.goldBright;
  ctx.textAlign = "left";
  ctx.font = `bold 46px ${TAMIL_FONT}`;
  ctx.fillText("Vinaadi AI", 84, 118);
  ctx.fillStyle = "#FFE9C2";
  ctx.textAlign = "right";
  ctx.font = `28px ${TAMIL_FONT}`;
  const dateLine = lang === "ta" && data.tamilDate ? data.tamilDate.ta : data.date;
  ctx.fillText(dateLine, w - 84, 100);
  ctx.font = `22px ${TAMIL_FONT}`;
  ctx.fillText(`${data.city} · ${data.weekday}`, w - 84, 132);

  // Deity medallion
  const dcx = w / 2;
  const dr = square ? 120 : 150;
  const dcy = square ? 230 : 320;
  drawDeity(ctx, dcx, dcy, dr, img, PALETTE.gold);
  ctx.fillStyle = PALETTE.maroon;
  ctx.textAlign = "center";
  ctx.font = `bold 40px ${TAMIL_FONT}`;
  ctx.fillText(lang === "ta" ? data.deityLabel.ta : data.deityLabel.en, dcx, dcy + dr + 52);

  // Panchangam rows
  const rows: [string, string][] = [
    [lang === "ta" ? "திதி" : "Tithi", tTithi(data.tithi.name, lang)],
    [lang === "ta" ? "நட்சத்திரம்" : "Nakshatra", `${tNakshatra(data.nakshatra.name, lang)} · ${lang === "ta" ? "பாதம்" : "Pada"} ${data.nakshatra.pada}`],
    [lang === "ta" ? "யோகம்" : "Yoga", data.yoga],
    [lang === "ta" ? "கரணம்" : "Karana", data.karana],
  ];
  let ry = dcy + dr + 96;
  const rowH = square ? 62 : 78;
  const rx = 84;
  const rw = w - 168;
  rows.forEach(([label, value], i) => {
    ctx.fillStyle = i % 2 === 0 ? "rgba(30,107,58,0.10)" : "rgba(201,154,59,0.12)";
    roundRect(ctx, rx, ry, rw, rowH - 10, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.green;
    ctx.textAlign = "left";
    ctx.font = `bold 30px ${TAMIL_FONT}`;
    ctx.fillText(label, rx + 26, ry + (rowH - 10) / 2 + 11);
    ctx.fillStyle = PALETTE.ink;
    ctx.textAlign = "right";
    ctx.font = `30px ${TAMIL_FONT}`;
    ctx.fillText(value, rx + rw - 26, ry + (rowH - 10) / 2 + 11);
    ry += rowH;
  });

  // Timings
  ry += 8;
  const tw = (rw - 24) / 2;
  const tBoxes: [string, string][] = [
    [lang === "ta" ? "ராகு காலம்" : "Rahu Kalam", `${data.rahukalam.start}–${data.rahukalam.end}`],
    [lang === "ta" ? "அபிஜித்" : "Abhijit", `${data.abhijit.start}–${data.abhijit.end}`],
  ];
  tBoxes.forEach(([label, value], i) => {
    const bx = rx + i * (tw + 24);
    ctx.fillStyle = i === 0 ? "rgba(140,29,29,0.10)" : "rgba(30,107,58,0.12)";
    roundRect(ctx, bx, ry, tw, 84, 12);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = i === 0 ? PALETTE.maroon : PALETTE.green;
    ctx.font = `bold 24px ${TAMIL_FONT}`;
    ctx.fillText(label, bx + tw / 2, ry + 34);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 32px ${TAMIL_FONT}`;
    ctx.fillText(value, bx + tw / 2, ry + 70);
  });
  ry += 108;

  // Guidance / festival highlight
  if (!square) {
    ctx.fillStyle = "rgba(201,154,59,0.16)";
    roundRect(ctx, rx, ry, rw, 130, 14);
    ctx.fill();
    ctx.fillStyle = PALETTE.maroon;
    ctx.textAlign = "left";
    ctx.font = `bold 26px ${TAMIL_FONT}`;
    const gLabel = data.festival
      ? (lang === "ta" ? `✦ ${data.festival.ta}` : `✦ ${data.festival.en}`)
      : (lang === "ta" ? "இன்றைய வழிகாட்டுதல்" : "Today's guidance");
    ctx.fillText(gLabel, rx + 24, ry + 40);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `26px ${TAMIL_FONT}`;
    const gText = data.festival?.message
      ? (lang === "ta" ? data.festival.message.ta : data.festival.message.en)
      : (lang === "ta" ? data.guidance.ta : data.guidance.en);
    wrapText(ctx, gText, rx + 24, ry + 78, rw - 48, 34, 2);
  }

  drawBrandFooter(ctx, w, h, data, lang);
}

// ── Festival card ────────────────────────────────────────────────────────────
function drawFestivalCard(ctx: CanvasRenderingContext2D, data: PanchangamCardData, img: HTMLImageElement | null, lang: Lang, w: number, h: number) {
  const fest = data.festival!;
  const theme = FESTIVAL_THEME[fest.key] ?? { a: PALETTE.cream, b: PALETTE.creamDeep, accent: PALETTE.gold };
  const dark = fest.key === "AMAVASAI" || fest.key === "SHIVARATHIRI";
  drawFrame(ctx, w, h, theme.a, theme.b);

  const textMain = dark ? "#F5ECD2" : PALETTE.ink;
  const textSoft = dark ? "#C9BE9A" : PALETTE.inkSoft;

  ctx.textAlign = "center";
  ctx.fillStyle = textSoft;
  ctx.font = `28px ${TAMIL_FONT}`;
  ctx.fillText(lang === "ta" && data.tamilDate ? data.tamilDate.ta : data.date, w / 2, 120);

  // Festival name
  ctx.fillStyle = theme.accent;
  ctx.font = `bold ${h <= w * 1.1 ? 84 : 104}px ${TAMIL_FONT}`;
  ctx.fillText(lang === "ta" ? fest.ta : fest.en, w / 2, h <= w * 1.1 ? 230 : 270);

  // Deity medallion
  const dr = h <= w * 1.1 ? 150 : 190;
  const dcy = h <= w * 1.1 ? 470 : 560;
  drawDeity(ctx, w / 2, dcy, dr, img, theme.accent);
  ctx.fillStyle = textMain;
  ctx.font = `bold 40px ${TAMIL_FONT}`;
  ctx.fillText(lang === "ta" ? data.deityLabel.ta : data.deityLabel.en, w / 2, dcy + dr + 56);

  // Significance message
  if (fest.message) {
    ctx.fillStyle = textMain;
    ctx.font = `34px ${TAMIL_FONT}`;
    wrapText(ctx, lang === "ta" ? fest.message.ta : fest.message.en, w / 2, dcy + dr + 130, w - 200, 48, 5);
  }

  drawBrandFooter(ctx, w, h, data, lang);
}

// ── Public component ───────────────────────────────────────────────────────────
interface PanchangamShareCardProps {
  lang: Lang;
  date?: string;
  city?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  label?: string;
}

export function PanchangamShareCard({ lang, date, city = "Chennai", lat = 13.0827, lng = 80.2707, timezone = "Asia/Kolkata", label }: PanchangamShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<PanchangamCardData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<CardKind>("PANCHANGAM");
  const [size, setSize] = useState<CardSize>("STORY");
  const [preview, setPreview] = useState<string | null>(null);

  async function ensureData(): Promise<PanchangamCardData | null> {
    if (data) return data;
    const d = await apiFetchJson<PanchangamCardData>(
      `/api/v1/public/panchangam-share-card${toQuery({ date: date ?? todayIso(), city, lat, lng, timezone, lang })}`,
    );
    setData(d);
    if (d.festival) setKind("FESTIVAL");
    return d;
  }

  async function openSheet() {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      await ensureData();
    } catch {
      setError(lang === "ta" ? "தரவைப் பெற முடியவில்லை." : "Couldn't load card data.");
    } finally {
      setLoading(false);
    }
  }

  // (Re)render whenever the data / kind / size changes while the sheet is open.
  useEffect(() => {
    if (!open || !data) return;
    let cancelled = false;
    const W = 1080;
    const H = size === "STORY" ? 1920 : 1080;
    (async () => {
      const useFestival = kind === "FESTIVAL" && data.festival;
      const deityKey = useFestival ? data.festival!.deity : data.deityKey;
      const img = await loadDeity(deityKey);
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (useFestival) drawFestivalCard(ctx, data, img, lang, W, H);
      else drawPanchangamCard(ctx, data, img, lang, W, H);
      setPreview(canvas.toDataURL("image/png"));
    })();
    return () => { cancelled = true; };
  }, [open, data, kind, size, lang]);

  async function share() {
    if (!preview) return;
    try {
      const blob = await (await fetch(preview)).blob();
      const file = new File([blob], "vinaadi-panchangam.png", { type: "image/png" });
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Vinaadi AI · Panchangam" });
        return;
      }
    } catch { /* fall through to download */ }
    const a = document.createElement("a");
    a.href = preview;
    a.download = "vinaadi-panchangam.png";
    a.click();
  }

  const hasFestival = !!data?.festival;

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button
        type="button"
        onClick={() => void openSheet()}
        style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "10px 18px", borderRadius: "var(--radius-pill, 999px)", fontWeight: 700,
          border: "none", background: "#8C1D1D", color: "#FFE9C2", cursor: "pointer", fontSize: "0.9rem",
        }}
      >
        <span aria-hidden="true">↗</span>
        {label ?? (lang === "ta" ? "இன்றைய அட்டையைப் பகிர்" : "Share Today's Card")}
      </button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(26,22,18,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", maxHeight: "92vh" }}>
            {loading && <p style={{ color: "#FFE9C2" }}>{lang === "ta" ? "ஏற்றுகிறது…" : "Loading…"}</p>}
            {error && <p style={{ color: "#ffb4a8" }}>{error}</p>}

            {data && (
              <>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                  <Seg active={kind === "PANCHANGAM"} onClick={() => setKind("PANCHANGAM")}>{lang === "ta" ? "பஞ்சாங்கம்" : "Panchangam"}</Seg>
                  {hasFestival && (
                    <Seg active={kind === "FESTIVAL"} onClick={() => setKind("FESTIVAL")}>
                      {lang === "ta" ? data!.festival!.ta : data!.festival!.en}
                    </Seg>
                  )}
                  <span style={{ width: "1px", background: "rgba(255,255,255,0.2)" }} />
                  <Seg active={size === "STORY"} onClick={() => setSize("STORY")}>{lang === "ta" ? "நிலை (9:16)" : "Status 9:16"}</Seg>
                  <Seg active={size === "SQUARE"} onClick={() => setSize("SQUARE")}>{lang === "ta" ? "குழு (1:1)" : "Group 1:1"}</Seg>
                </div>

                {preview && (
                  <img src={preview} alt="card preview" style={{ borderRadius: "12px", maxWidth: "min(100%, 380px)", maxHeight: "66vh", objectFit: "contain", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }} />
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => void share()} style={{ padding: "10px 22px", borderRadius: "10px", background: "#E7BE57", color: "#3A2A12", fontWeight: 800, border: "none", cursor: "pointer" }}>
                    {lang === "ta" ? "பகிர் / பதிவிறக்கம்" : "Share / Download"}
                  </button>
                  <button type="button" onClick={() => setOpen(false)} style={{ padding: "10px 22px", borderRadius: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#FFE9C2", cursor: "pointer" }}>
                    {lang === "ta" ? "மூடு" : "Close"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
        border: "1.5px solid", borderColor: active ? "#E7BE57" : "rgba(255,255,255,0.3)",
        background: active ? "#E7BE57" : "transparent", color: active ? "#3A2A12" : "#FFE9C2",
      }}
    >
      {children}
    </button>
  );
}
