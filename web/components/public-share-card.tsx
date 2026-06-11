"use client";

import { useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxW: number, lineH: number,
  maxLines = 3,
): number {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + lines * lineH);
      line = word;
      lines++;
      if (lines >= maxLines) {
        ctx.fillText("…", x, y + lines * lineH);
        return y + lines * lineH;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y + lines * lineH);
  return y + lines * lineH;
}

function toMinutes(timeStr: string): number {
  const t = timeStr.includes("T") ? timeStr.split("T")[1] : timeStr;
  const parts = t.split(":");
  return Number(parts[0]) * 60 + (Number(parts[1]) || 0);
}

function drawBranding(ctx: CanvasRenderingContext2D, w: number, _h: number) {
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.font      = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("vinaadi.com", w - 32, 46);
}

// ── South Indian chart grid ────────────────────────────────────────────────────

const RASI_GRID_POS: Record<number, [number, number]> = {
  1: [0,1], 2: [0,2], 3: [0,3],
  4: [1,3], 5: [2,3], 6: [3,3],
  7: [3,2], 8: [3,1], 9: [3,0],
  10:[2,0], 11:[1,0], 12:[0,0],
};

function drawMiniChart(
  ctx: CanvasRenderingContext2D,
  lagnaRasiNum: number,
  planets: Array<{ abbr: string; rasiNum: number }>,
  gx: number, gy: number, cellSize: number,
  accent: string, textCol: string,
) {
  const cells: Record<string, string[]> = {};
  const lagnaPos = RASI_GRID_POS[lagnaRasiNum];
  if (lagnaPos) {
    cells[`${lagnaPos[0]},${lagnaPos[1]}`] = ["La"];
  }
  for (const p of planets) {
    const pos = RASI_GRID_POS[p.rasiNum];
    if (!pos) continue;
    const k = `${pos[0]},${pos[1]}`;
    if (!cells[k]) cells[k] = [];
    if (cells[k][0] !== "La") cells[k].push(p.abbr);
    else cells[k].push(p.abbr);
  }

  const pad      = 4;
  const fontSize = Math.round(cellSize * 0.12);
  const lineH    = fontSize + 4;

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (row >= 1 && row <= 2 && col >= 1 && col <= 2) continue;
      const cx = gx + col * cellSize;
      const cy = gy + row * cellSize;
      const key = `${row},${col}`;
      const isLagna = lagnaPos && lagnaPos[0] === row && lagnaPos[1] === col;

      ctx.fillStyle = isLagna ? accent + "22" : "rgba(255,255,255,0.05)";
      roundRect(ctx, cx + pad, cy + pad, cellSize - pad*2, cellSize - pad*2, 8);
      ctx.fill();

      ctx.strokeStyle = isLagna ? accent + "70" : "rgba(255,255,255,0.12)";
      ctx.lineWidth   = isLagna ? 1.5 : 1;
      roundRect(ctx, cx + pad, cy + pad, cellSize - pad*2, cellSize - pad*2, 8);
      ctx.stroke();

      const contents = cells[key];
      if (!contents || contents.length === 0) continue;

      const hasLagna  = contents[0] === "La";
      const bodyItems = hasLagna ? contents.slice(1) : contents;
      const cxC = cx + cellSize / 2;

      ctx.textAlign = "center";

      if (hasLagna) {
        ctx.fillStyle = accent;
        ctx.font      = `bold ${fontSize}px system-ui, sans-serif`;
        const yLa = bodyItems.length === 0
          ? cy + cellSize / 2 + fontSize / 3
          : cy + cellSize * 0.28 + fontSize / 2;
        ctx.fillText("La", cxC, yLa);
      }

      if (bodyItems.length > 0) {
        ctx.fillStyle = hasLagna ? textCol + "dd" : textCol;
        ctx.font      = `${fontSize}px system-ui, sans-serif`;

        const yStart = hasLagna ? cy + cellSize * 0.52 : cy + cellSize * 0.36;

        if (bodyItems.length <= 2) {
          ctx.fillText(bodyItems.join(" "), cxC, yStart);
        } else if (bodyItems.length <= 4) {
          const half = Math.ceil(bodyItems.length / 2);
          ctx.fillText(bodyItems.slice(0, half).join(" "), cxC, yStart);
          ctx.fillText(bodyItems.slice(half).join(" "), cxC, yStart + lineH);
        } else {
          const t3 = Math.ceil(bodyItems.length / 3);
          ctx.fillText(bodyItems.slice(0, t3).join(" "), cxC, yStart);
          ctx.fillText(bodyItems.slice(t3, t3*2).join(" "), cxC, yStart + lineH);
          ctx.fillText(bodyItems.slice(t3*2).join(" "), cxC, yStart + lineH*2);
        }
      }
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth   = 1;
  ctx.strokeRect(
    gx + cellSize + pad, gy + cellSize + pad,
    cellSize * 2 - pad*2, cellSize * 2 - pad*2,
  );
}

// ── Porutham card — portrait 1080×1920 ────────────────────────────────────────

export interface PoruthamShareData {
  nameA: string;
  nameB: string;
  nakshatraA?: string;
  nakshatraB?: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  topKutas: Array<{ name: string; score: number; maxScore: number }>;
  lang: Lang;
}

function drawPoruthamCard(
  ctx: CanvasRenderingContext2D,
  d: PoruthamShareData,
  w: number, h: number,
) {
  const pct    = d.percentage;
  const accent = pct >= 70 ? "#4ade80" : pct >= 40 ? "#e5b84d" : "#f87171";
  const bg     = pct >= 70 ? "#020d05" : pct >= 40 ? "#0c0800" : "#0c0202";
  const text   = pct >= 70 ? "#e2fcea" : pct >= 40 ? "#fef9c3" : "#fee2e2";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const grd1 = ctx.createRadialGradient(w / 2, 540, 10, w / 2, 540, 600);
  grd1.addColorStop(0, accent + "2a");
  grd1.addColorStop(1, "transparent");
  ctx.fillStyle = grd1;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 10);

  const matchLabel = pct >= 70
    ? (d.lang === "ta" ? "நல்ல பொருத்தம்" : "Good Match")
    : pct >= 40
    ? (d.lang === "ta" ? "சராசரி பொருத்தம்" : "Average Match")
    : (d.lang === "ta" ? "குறைந்த பொருத்தம்" : "Low Match");

  // Match badge (top left)
  ctx.font = "bold 24px system-ui, sans-serif";
  const badgeW = ctx.measureText(matchLabel).width + 40;
  ctx.fillStyle = accent + "26";
  roundRect(ctx, 52, 48, badgeW, 46, 23);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.textAlign = "left";
  ctx.fillText(matchLabel, 72, 79);

  // Arc ring (centered)
  const cx = w / 2, cy = 540, r = 210;
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth   = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  const startA = -Math.PI / 2;
  const endA   = startA + Math.PI * 2 * Math.min(pct / 100, 1);
  ctx.strokeStyle = accent;
  ctx.lineWidth   = 20;
  ctx.lineCap     = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, startA, endA);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.font      = "bold 108px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(pct)}%`, cx, cy + 42);

  ctx.fillStyle = "rgba(255,255,255,0.40)";
  ctx.font      = "28px system-ui, sans-serif";
  ctx.fillText(`${d.totalScore} / ${d.maxScore}`, cx, cy + 92);

  ctx.fillStyle = "rgba(255,255,255,0.26)";
  ctx.font      = "24px system-ui, sans-serif";
  ctx.fillText(matchLabel, cx, cy + 136);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth   = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(52, 836); ctx.lineTo(w - 52, 836);
  ctx.stroke();

  // Names section
  const px      = 72;
  const hasNaksh = !!(d.nakshatraA || d.nakshatraB);

  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.font      = "24px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(d.lang === "ta" ? "பொருத்தம்" : "Compatibility", px, 890);

  const drawName = (name: string, nakshatra: string | undefined, y: number) => {
    ctx.fillStyle = text;
    ctx.font      = "bold 50px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(name.length > 18 ? name.slice(0, 17) + "…" : name, px, y);
    if (nakshatra) {
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.font      = "26px system-ui, sans-serif";
      ctx.fillText(tamilizeAstroEnglish(nakshatra), px, y + 36);
    }
  };

  drawName(d.nameA || "—", d.nakshatraA, 948);

  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font      = "34px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("×", px, hasNaksh ? 1068 : 1040);

  drawName(d.nameB || "—", d.nakshatraB, hasNaksh ? 1112 : 1086);

  // Divider above kuta bars
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(px, 1230); ctx.lineTo(w - px, 1230);
  ctx.stroke();

  // Kuta progress bars
  const kutas   = d.topKutas.slice(0, 8);
  const barY0   = 1264;
  const barRowH = Math.floor((h - 90 - barY0) / Math.max(kutas.length, 1));
  const labelW  = 220;
  const scoreW  = 60;
  const barW    = (w - px * 2) - labelW - scoreW - 20;
  const barH    = 14;

  kutas.forEach((k, i) => {
    const by   = barY0 + i * barRowH + Math.floor(barRowH / 2);
    const kpct = k.maxScore > 0 ? Math.min(k.score / k.maxScore, 1) : 0;

    ctx.fillStyle = "rgba(255,255,255,0.50)";
    ctx.font      = "22px system-ui, sans-serif";
    ctx.textAlign = "left";
    const kname = k.name.length > 16 ? k.name.slice(0, 15) + "…" : k.name;
    ctx.fillText(kname, px, by + barH / 2 + 8);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, px + labelW, by, barW, barH, 7);
    ctx.fill();

    if (kpct > 0) {
      const barColor = kpct >= 0.7 ? "#4ade80" : kpct >= 0.4 ? accent : "#f87171";
      ctx.fillStyle  = barColor;
      roundRect(ctx, px + labelW, by, barW * kpct, barH, 7);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font      = "20px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${k.score}/${k.maxScore}`, px + labelW + barW + 14, by + barH / 2 + 7);
  });

  // Bottom CTA
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.font      = "24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    d.lang === "ta" ? "உங்கள் பொருத்தம் → vinaadi.com" : "Check yours at vinaadi.com →",
    w / 2, h - 52,
  );

  drawBranding(ctx, w, h);
}

// ── Panchangam card — portrait 1080×1920 ─────────────────────────────────────

export interface PanchangamShareData {
  dateLabel: string;
  cityName: string;
  tithi: string;
  nakshatra: string;
  vara: string;
  yoga?: string;
  karana?: string;
  sunrise?: string;
  sunset?: string;
  rahuKalamStart: string;
  rahuKalamEnd: string;
  nallaNeram: string;
  lang: Lang;
}

function drawPanchangamCard(
  ctx: CanvasRenderingContext2D,
  d: PanchangamShareData,
  w: number, h: number,
) {
  const accent = "#6366f1";
  const text   = "#e0e7ff";

  ctx.fillStyle = "#050616";
  ctx.fillRect(0, 0, w, h);

  const grd = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, 700);
  grd.addColorStop(0, "#6366f11c");
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 10);

  // Header
  ctx.fillStyle = text;
  ctx.font      = "bold 80px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(d.dateLabel, w / 2, 148);

  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.font      = "30px system-ui, sans-serif";
  ctx.fillText(d.cityName, w / 2, 200);

  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(52, 228); ctx.lineTo(w - 52, 228);
  ctx.stroke();

  // Row 1: Tithi | Nakshatra | Vara — height adapts to presence of row 2
  const hasExtra = !!(d.yoga || d.karana);
  const row1Y    = 248;
  const row1H    = hasExtra ? 740 : 1240;
  const col3W    = w / 3;

  const row1Items = [
    { label: d.lang === "ta" ? "திதி"         : "Tithi",   value: d.tithi },
    { label: d.lang === "ta" ? "நட்சத்திரம்" : "Birth Star", value: tamilizeAstroEnglish(d.nakshatra) },
    { label: d.lang === "ta" ? "வாரம்"        : "Weekday", value: d.vara },
  ];

  row1Items.forEach((item, i) => {
    const cx2     = col3W * i + col3W / 2;
    const centerY = row1Y + row1H / 2;

    ctx.fillStyle = "rgba(255,255,255,0.05)";
    roundRect(ctx, col3W * i + 22, row1Y, col3W - 44, row1H, 14);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.font      = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.label.toUpperCase(), cx2, centerY - 38);

    ctx.fillStyle = text;
    ctx.font      = "bold 44px system-ui, sans-serif";
    const val = item.value.length > 13 ? item.value.slice(0, 12) + "…" : item.value;
    ctx.fillText(val, cx2, centerY + 30);

    if (i < 2) {
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(col3W * (i + 1), row1Y + 16);
      ctx.lineTo(col3W * (i + 1), row1Y + row1H - 16);
      ctx.stroke();
    }
  });

  // Row 2: Yoga | Karana (optional)
  let divY = row1Y + row1H + 16;
  if (hasExtra) {
    const row2Items: Array<{ label: string; value: string }> = [];
    if (d.yoga)   row2Items.push({ label: d.lang === "ta" ? "யோகம்"  : "Yoga",   value: tamilizeAstroEnglish(d.yoga) });
    if (d.karana) row2Items.push({ label: d.lang === "ta" ? "கரணம்" : "Karana", value: d.karana });

    const col2W = w / 2;
    const row2H = 460;
    const row2Y = divY;

    row2Items.forEach((item, i) => {
      const cx2     = col2W * i + col2W / 2;
      const centerY = row2Y + row2H / 2;

      ctx.fillStyle = "rgba(255,255,255,0.04)";
      roundRect(ctx, col2W * i + 22, row2Y, col2W - 44, row2H, 12);
      ctx.fill();

      ctx.fillStyle = accent + "cc";
      ctx.font      = "bold 22px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(item.label.toUpperCase(), cx2, centerY - 28);

      ctx.fillStyle = text;
      ctx.font      = "bold 40px system-ui, sans-serif";
      const val = item.value.length > 15 ? item.value.slice(0, 14) + "…" : item.value;
      ctx.fillText(val, cx2, centerY + 24);
    });

    divY = row2Y + row2H + 16;
  }

  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(52, divY); ctx.lineTo(w - 52, divY);
  ctx.stroke();

  // Time info
  const timeY = divY + 32;

  ctx.fillStyle = "#f87171";
  ctx.font      = "bold 28px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("⚠", 56, timeY + 40);
  ctx.font      = "28px system-ui, sans-serif";
  ctx.fillText(
    (d.lang === "ta" ? "ராகு காலம்: " : "Rahu Kalam: ") + d.rahuKalamStart + " – " + d.rahuKalamEnd,
    100, timeY + 40,
  );

  ctx.fillStyle = "#4ade80";
  ctx.font      = "bold 28px system-ui, sans-serif";
  ctx.fillText("✓", 56, timeY + 96);
  ctx.font      = "28px system-ui, sans-serif";
  ctx.fillText(
    (d.lang === "ta" ? "நல்ல நேரம்: " : "Nalla Neram: ") + d.nallaNeram,
    100, timeY + 96,
  );

  // Day timeline (if sunrise/sunset provided)
  if (d.sunrise && d.sunset) {
    const tlX  = 56;
    const tlY  = timeY + 130;
    const tlW  = w - 112;
    const tlH  = 20;

    const sunriseMin = toMinutes(d.sunrise);
    const sunsetMin  = toMinutes(d.sunset);
    const dayDur     = Math.max(sunsetMin - sunriseMin, 1);

    ctx.fillStyle = "rgba(255,255,255,0.07)";
    roundRect(ctx, tlX, tlY, tlW, tlH, tlH / 2);
    ctx.fill();

    const rahuS  = toMinutes(d.rahuKalamStart);
    const rahuE  = toMinutes(d.rahuKalamEnd);
    const rahuX  = tlX + Math.max((rahuS - sunriseMin) / dayDur, 0) * tlW;
    const rahuW  = Math.max((rahuE - rahuS) / dayDur * tlW, 4);
    ctx.fillStyle = "#f87171aa";
    roundRect(ctx, rahuX, tlY, rahuW, tlH, 4);
    ctx.fill();

    const nParts = d.nallaNeram.split("–").map(s => s.trim());
    if (nParts.length === 2) {
      const nallaS = toMinutes(nParts[0]);
      const nallaE = toMinutes(nParts[1]);
      const nallaX = tlX + Math.max((nallaS - sunriseMin) / dayDur, 0) * tlW;
      const nallaW = Math.max((nallaE - nallaS) / dayDur * tlW, 4);
      ctx.fillStyle = "#4ade80aa";
      roundRect(ctx, nallaX, tlY, nallaW, tlH, 4);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.font      = "18px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("☀ " + d.sunrise.slice(0, 5), tlX, tlY + tlH + 28);
    ctx.textAlign = "right";
    ctx.fillText(d.sunset.slice(0, 5) + " ☀", tlX + tlW, tlY + tlH + 28);
    ctx.textAlign = "left";
  }

  // Bottom CTA
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.font      = "24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    d.lang === "ta" ? "இன்றைய பஞ்சாங்கம் → vinaadi.com" : "Full panchangam at vinaadi.com →",
    w / 2, h - 52,
  );

  drawBranding(ctx, w, h);
}

// ── Shared share/download logic ───────────────────────────────────────────────

async function shareOrDownload(
  canvas: HTMLCanvasElement,
  filename: string,
  shareTitle: string,
) {
  const dataUrl = canvas.toDataURL("image/png");
  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: shareTitle });
      return dataUrl;
    }
  }
  const a = document.createElement("a");
  a.href     = dataUrl;
  a.download = filename;
  a.click();
  return dataUrl;
}

// ── Jadhagam card — portrait 1080×1920 ───────────────────────────────────────

export interface JadhagamShareData {
  name: string;
  lagnaRasi: string;
  lagnaRasiNum: number;
  janmaNakshatra: string;
  janmaRasi: string;
  planets: Array<{ abbr: string; rasi: string; rasiNum: number }>;
  yoga?: string;
  mahadasha?: string;
  lang: Lang;
}

function drawJadhagamCard(
  ctx: CanvasRenderingContext2D,
  d: JadhagamShareData,
  w: number, h: number,
) {
  const accent = "#E89A0A";
  const text   = "#FFF1D6";
  const bg     = "#0d0800";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const grd = ctx.createRadialGradient(w / 2, 460, 10, w / 2, 460, 500);
  grd.addColorStop(0, accent + "1c");
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 10);

  // Chart label
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font      = "22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    d.lang === "ta" ? "ஜன்ம கட்டம்" : "Birth Chart",
    w / 2, 76,
  );

  // Mini chart — cellSize=210, 4×4=840px — centered horizontally
  const cellSize = 210;
  const chartW   = cellSize * 4;
  const gx       = Math.floor((w - chartW) / 2);
  const gy       = 96;

  drawMiniChart(ctx, d.lagnaRasiNum, d.planets, gx, gy, cellSize, accent, text);

  // Divider below chart
  const chartBottom = gy + cellSize * 4;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(52, chartBottom + 24); ctx.lineTo(w - 52, chartBottom + 24);
  ctx.stroke();

  // Name and subtitle (centered)
  const nameStr = d.name || (d.lang === "ta" ? "ஜாதக சுருக்கம்" : "Chart Snapshot");
  ctx.fillStyle = text;
  ctx.font      = "bold 60px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(nameStr.length > 20 ? nameStr.slice(0, 19) + "…" : nameStr, w / 2, chartBottom + 90);

  ctx.fillStyle = "rgba(255,255,255,0.34)";
  ctx.font      = "26px system-ui, sans-serif";
  ctx.fillText(d.lang === "ta" ? "ஜாதக சுருக்கம்" : "Jadhagam Snapshot", w / 2, chartBottom + 142);

  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(52, chartBottom + 170); ctx.lineTo(w - 52, chartBottom + 170);
  ctx.stroke();

  // Info rows (left-aligned)
  const infos: Array<{ label: string; value: string }> = [
    { label: d.lang === "ta" ? "லக்னம்"        : "Lagna",      value: d.lagnaRasi },
    { label: d.lang === "ta" ? "நட்சத்திரம்"  : "Birth Star", value: tamilizeAstroEnglish(d.janmaNakshatra) },
    { label: d.lang === "ta" ? "பிறப்பு ராசி"  : "Birth Sign", value: d.janmaRasi },
  ];
  if (d.yoga)      infos.push({ label: d.lang === "ta" ? "யோகம்"   : "Yoga",      value: tamilizeAstroEnglish(d.yoga) });
  if (d.mahadasha) infos.push({ label: d.lang === "ta" ? "மகாதசை" : "Mahadasha", value: d.mahadasha });

  const itemY0  = chartBottom + 210;
  const itemGap = Math.max(110, Math.floor((h - 90 - itemY0) / Math.max(infos.length, 1)));

  infos.forEach((item, i) => {
    const iy  = itemY0 + i * itemGap;
    const val = item.value.length > 22 ? item.value.slice(0, 21) + "…" : item.value;
    ctx.fillStyle = accent;
    ctx.font      = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(item.label.toUpperCase(), 52, iy);
    ctx.fillStyle = text;
    ctx.font      = "bold 44px system-ui, sans-serif";
    ctx.fillText(val, 52, iy + 52);
  });

  // Bottom CTA
  ctx.fillStyle = "rgba(255,255,255,0.20)";
  ctx.font      = "24px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    d.lang === "ta" ? "ஜாதகம் → vinaadi.com" : "Full chart at vinaadi.com →",
    w / 2, h - 52,
  );

  drawBranding(ctx, w, h);
}

// ── Jadhagam share button ─────────────────────────────────────────────────────

export function JadhagamShareButton({ data }: { data: JadhagamShareData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const lang = data.lang;
  // 9:16 portrait — WhatsApp Status, Instagram Stories/Reels, YouTube Shorts
  const W = 1080, H = 1920;

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoading(true);
    setError(null);
    try {
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawJadhagamCard(ctx, data, W, H);
      const title = lang === "ta"
        ? `${data.name || "ஜாதகம்"} · ${data.lagnaRasi} லக்னம் · ${data.janmaNakshatra} — vinaadi.com`
        : `${data.name || "My Chart"} — ${data.lagnaRasi} Lagna, ${tamilizeAstroEnglish(data.janmaNakshatra)} birth star — vinaadi.com`;
      const url = await shareOrDownload(canvas, "vinaadi-jadhagam.png", title);
      setPreview(url);
    } catch {
      setError(lang === "ta" ? "பகிர்வு தோல்வியடைந்தது." : "Share failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "8px 18px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 600,
          border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
          color: "var(--cl-ink)", cursor: loading ? "wait" : "pointer",
          transition: "opacity 0.15s", opacity: loading ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: "1rem" }}>↑</span>
        {loading
          ? (lang === "ta" ? "உருவாக்குகிறது…" : "Generating…")
          : (lang === "ta" ? "ஜாதகம் பகிர்" : "Share chart snapshot")}
      </button>
      {error && <p style={{ color: "var(--cl-warn, #f87171)", fontSize: "0.78rem", marginTop: "6px" }}>{error}</p>}
      {preview && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.84)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}
          onClick={() => setPreview(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={preview}
              alt="jadhagam share card"
              style={{ borderRadius: "12px", maxWidth: "min(100%, 420px)", maxHeight: "75vh", objectFit: "contain", boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <a href={preview} download="vinaadi-jadhagam.png" style={{ padding: "8px 20px", borderRadius: "8px", background: "#E89A0A", color: "#0d0800", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}>
                {lang === "ta" ? "பதிவிறக்கம்" : "Download PNG"}
              </a>
              <button type="button" onClick={() => setPreview(null)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", cursor: "pointer" }}>
                {lang === "ta" ? "மூடு" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Porutham share button ─────────────────────────────────────────────────────

export function PoruthamShareButton({ data }: { data: PoruthamShareData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const lang = data.lang;
  // 9:16 portrait — WhatsApp Status, Instagram Stories/Reels, YouTube Shorts
  const W = 1080, H = 1920;

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoading(true);
    setError(null);
    try {
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawPoruthamCard(ctx, data, W, H);
      const title = lang === "ta"
        ? "எங்கள் பொருத்தம் முடிவு — vinaadi.com"
        : `Our porutham score is ${Math.round(data.percentage)}% — check yours at vinaadi.com`;
      const url = await shareOrDownload(canvas, "vinaadi-porutham.png", title);
      setPreview(url);
    } catch {
      setError(lang === "ta" ? "பகிர்வு தோல்வியடைந்தது." : "Share failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "8px 18px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 600,
          border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
          color: "var(--cl-ink)", cursor: loading ? "wait" : "pointer",
          transition: "opacity 0.15s", opacity: loading ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: "1rem" }}>↑</span>
        {loading
          ? (lang === "ta" ? "உருவாக்குகிறது…" : "Generating…")
          : (lang === "ta" ? "முடிவை பகிர்" : "Share result")}
      </button>
      {error && <p style={{ color: "var(--cl-warn, #f87171)", fontSize: "0.78rem", marginTop: "6px" }}>{error}</p>}
      {preview && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.84)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}
          onClick={() => setPreview(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={preview}
              alt="porutham share card"
              style={{ borderRadius: "12px", maxWidth: "min(100%, 420px)", maxHeight: "75vh", objectFit: "contain", boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <a href={preview} download="vinaadi-porutham.png" style={{ padding: "8px 20px", borderRadius: "8px", background: "#e5b84d", color: "#0d1117", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}>
                {lang === "ta" ? "பதிவிறக்கம்" : "Download PNG"}
              </a>
              <button type="button" onClick={() => setPreview(null)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", cursor: "pointer" }}>
                {lang === "ta" ? "மூடு" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Panchangam share button ───────────────────────────────────────────────────

export function PanchangamShareButton({ data }: { data: PanchangamShareData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const lang = data.lang;
  // 9:16 portrait — WhatsApp Status, Instagram Stories/Reels, YouTube Shorts
  const W = 1080, H = 1920;

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoading(true);
    setError(null);
    try {
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawPanchangamCard(ctx, data, W, H);
      const title = lang === "ta"
        ? `${data.dateLabel} பஞ்சாங்கம் — vinaadi.com`
        : `Today's panchangam for ${data.cityName} — vinaadi.com`;
      const url = await shareOrDownload(canvas, "vinaadi-panchangam.png", title);
      setPreview(url);
    } catch {
      setError(lang === "ta" ? "பகிர்வு தோல்வியடைந்தது." : "Share failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "8px 18px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 600,
          border: "1.5px solid var(--cl-border)", background: "var(--cl-surface)",
          color: "var(--cl-ink)", cursor: loading ? "wait" : "pointer",
          transition: "opacity 0.15s", opacity: loading ? 0.6 : 1,
        }}
      >
        <span style={{ fontSize: "1rem" }}>↑</span>
        {loading
          ? (lang === "ta" ? "உருவாக்குகிறது…" : "Generating…")
          : (lang === "ta" ? "பஞ்சாங்கம் பகிர்" : "Share panchangam")}
      </button>
      {error && <p style={{ color: "var(--cl-warn, #f87171)", fontSize: "0.78rem", marginTop: "6px" }}>{error}</p>}
      {preview && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.84)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "24px" }}
          onClick={() => setPreview(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={preview}
              alt="panchangam share card"
              style={{ borderRadius: "12px", maxWidth: "min(100%, 420px)", maxHeight: "75vh", objectFit: "contain", boxShadow: "0 8px 32px rgba(0,0,0,0.7)" }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <a href={preview} download="vinaadi-panchangam.png" style={{ padding: "8px 20px", borderRadius: "8px", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: "0.875rem", textDecoration: "none" }}>
                {lang === "ta" ? "பதிவிறக்கம்" : "Download PNG"}
              </a>
              <button type="button" onClick={() => setPreview(null)} style={{ padding: "8px 20px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", cursor: "pointer" }}>
                {lang === "ta" ? "மூடு" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
