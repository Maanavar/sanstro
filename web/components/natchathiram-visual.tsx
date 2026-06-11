"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";
import { useLang } from "@/components/lang-toggle";
import { mt, NATCHATHIRAM_DETAIL, NATCHATHIRAM_VISUAL } from "@/lib/marketing-i18n";
import { NakshatraSigil, RasiGlyph } from "@/components/astro-symbols";
import type { NatchathiramEntry } from "@/lib/natchathiram-data";
import { JYOTISH_TERM_EN, NATCHATHIRAM_EN_FACTS } from "@/lib/natchathiram-data-en";
import { romanNakshathiramLabel, romanNakshathiramName, tamilizeAstroEnglish } from "@/lib/tamil-astro";

// ── Types ─────────────────────────────────────────────────────────────────

export interface DashaDetail {
  expect: string;    // What to expect during this period
  navigate: string;  // How to navigate / overcome challenges
  focus: string;     // Key focus / opportunity
}

export interface NatchathiramVisualData {
  // English content (required)
  atAGlance: { label: string; score: number }[];
  radar: { labels: string[]; values: number[] };
  coreStrengths: { symbol: string; label: string; score: number; desc: string }[];
  careerAbilities: { label: string; score: number }[];
  careerClusters: { symbol: string; title: string; desc: string }[];
  modernApps: { symbol: string; title: string; desc: string }[];
  dashaTimeline: { planet: string; period: string; ageRange?: string; theme: string; detail?: DashaDetail }[];
  spirituality: { title: string; desc: string }[];
  guidance: string;
  compatibleEn: string[];
  compatibleNote: string;
  careerNote?: string;
  // Optional Tamil overrides
  ta?: {
    atAGlanceLabels?: string[];
    radarLabels?: string[];
    coreStrengths?: { label: string; desc: string }[];
    careerAbilityLabels?: string[];
    careerClusters?: { title: string; desc: string }[];
    modernApps?: { title: string; desc: string }[];
    dashaThemes?: string[];
    dashaDetails?: DashaDetail[];   // Tamil versions of dasha details
    spirituality?: { title: string; desc: string }[];
    guidance?: string;
    compatibleNote?: string;
    careerNote?: string;
    modernLead?: string;
    familyLead?: string;
  };
}

// ── Design tokens ─────────────────────────────────────────────────────────

const T = {
  bg:          "#F4EEE2",
  bg2:         "#EDE5D4",
  surface:     "#FFFFFF",
  surface2:    "#FAF5EA",
  ink:         "#1A1612",
  ink2:        "#3D352B",
  muted:       "#7A6F5E",
  border:      "#E4DBC8",
  accent:      "#B85A2C",
  accentSoft:  "#F0D9C4",
  accentA10:   "rgba(184,90,44,0.10)",
  accentA15:   "rgba(184,90,44,0.15)",
  accentA20:   "rgba(184,90,44,0.20)",
  accentA30:   "rgba(184,90,44,0.30)",
  accentA40:   "rgba(184,90,44,0.40)",
  sage:        "#5C7654",
  sageSoft:    "#DCE4D2",
  sageA15:     "rgba(92,118,84,0.15)",
  sageA25:     "rgba(92,118,84,0.25)",
};

const DASHA_COLORS = [
  "#B85A2C", "#5C7654", "#A8482F", "#7A8F5E",
  "#C4714A", "#6B7A52", "#9E5024", "#3D352B",
];

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿",
  Jupiter: "♃", Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋",
};

// ── Visual atoms ──────────────────────────────────────────────────────────

function FactIcon({ type }: { type: "sign" | "planet" | "deity" | "gana" | "symbol" | "dasha" }) {
  const s = { width: 28, height: 28, display: "block" } as const;
  if (type === "sign") return (
    <svg viewBox="0 0 24 24" style={s} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={T.accent} strokeWidth="1.5" />
      <path d="M8 14c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="8.5" r="1.5" fill={T.accent} />
    </svg>
  );
  if (type === "planet") return (
    <svg viewBox="0 0 24 24" style={s} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="5" stroke={T.accent} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke={T.accent} strokeWidth="1.2" transform="rotate(-20 12 12)" />
    </svg>
  );
  if (type === "deity") return (
    <svg viewBox="0 0 24 24" style={s} fill="none" aria-hidden="true">
      <path d="M12 3 L14.5 8.5 L20.5 9.3 L16.2 13.4 L17.3 19.5 L12 16.7 L6.7 19.5 L7.8 13.4 L3.5 9.3 L9.5 8.5 Z" stroke={T.accent} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
  if (type === "gana") return (
    <svg viewBox="0 0 24 24" style={s} fill="none" aria-hidden="true">
      <path d="M5 12h14M12 5v14" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4" stroke={T.accent} strokeWidth="1.3" />
    </svg>
  );
  if (type === "symbol") return (
    <svg viewBox="0 0 24 24" style={s} fill="none" aria-hidden="true">
      <path d="M12 4 C8 4 5 7 5 10 C5 13.5 8 15 12 15 C16 15 19 13.5 19 10 C19 7 16 4 12 4Z" stroke={T.accent} strokeWidth="1.4" />
      <path d="M12 15 L12 20 M9 17.5 L15 17.5" stroke={T.accent} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" style={s} fill="none" aria-hidden="true">
      <circle cx="5" cy="12" r="2" fill={T.accent} />
      <circle cx="12" cy="12" r="2" fill={T.accent} />
      <circle cx="19" cy="12" r="2" fill={T.accent} />
      <path d="M7 12h3M14 12h3" stroke={T.accent} strokeWidth="1.5" />
    </svg>
  );
}

function RadarChart({ labels, values }: { labels: string[]; values: number[] }) {
  const cx = 160, cy = 170, rMax = 108;
  const n = labels.length;
  function pt(i: number, r: number): [number, number] {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  function poly(r: number) {
    return Array.from({ length: n }, (_, i) => pt(i, r).join(",")).join(" ");
  }
  const dataPoly = values.map((v, i) => pt(i, (v / 100) * rMax).join(",")).join(" ");
  return (
    <svg viewBox="0 0 320 330" style={{ width: "100%", maxWidth: 320 }} aria-hidden="true">
      {[25, 50, 75, 100].map((pct) => (
        <polygon key={pct} points={poly((pct / 100) * rMax)}
          fill={pct === 100 ? T.accentA10 : "none"}
          stroke={pct === 100 ? T.accentA20 : T.border}
          strokeWidth={pct === 100 ? 1.2 : 0.8} />
      ))}
      {labels.map((_, i) => {
        const [x, y] = pt(i, rMax);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={T.border} strokeWidth={1} />;
      })}
      <polygon points={dataPoly} fill={T.accentA15} stroke={T.accent} strokeWidth={2.2} />
      {values.map((v, i) => {
        const [x, y] = pt(i, (v / 100) * rMax);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={5} fill={T.accent} stroke={T.surface} strokeWidth={1.5} />
            <text x={x} y={y - 11} textAnchor="middle" fill={T.accent} fontSize={9} fontWeight="700" fontFamily="Inter,sans-serif">{v}</text>
          </g>
        );
      })}
      {labels.map((label, i) => {
        const [x, y] = pt(i, rMax + 28);
        const anchor = x < cx - 10 ? "end" : x > cx + 10 ? "start" : "middle";
        return (
          <text key={i} x={x} y={y} textAnchor={anchor} dominantBaseline="middle"
            fill={T.ink2} fontSize={10.5} fontWeight="600"
            fontFamily="'Noto Sans Tamil',Inter,sans-serif">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function ScoreBar({ score, height = 8 }: { score: number; height?: number }) {
  return (
    <div style={{ height, background: T.border, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${score}%`, background: T.accent, borderRadius: 6 }} />
    </div>
  );
}

function ConstellationBg() {
  const dots = [
    [40,30],[80,20],[120,45],[160,25],[200,50],
    [60,80],[140,70],[180,90],[220,65],
    [30,130],[90,120],[150,110],[210,130],[250,100],
    [70,170],[130,160],[190,180],[240,155],
    [50,220],[110,210],[170,225],[230,200],
  ];
  const lines = [
    [0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],
    [9,10],[10,11],[11,12],[12,13],
    [1,5],[6,11],[12,18],[3,7],
    [14,15],[15,16],[16,17],[18,19],[19,20],[20,21],
  ];
  return (
    <svg viewBox="0 0 280 260" style={{ position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.18 }} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      {lines.map(([a,b],i) => (
        <line key={i} x1={dots[a][0]} y1={dots[a][1]} x2={dots[b][0]} y2={dots[b][1]} stroke={T.accent} strokeWidth={0.8} />
      ))}
      {dots.map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={i%4===0?2:1.2} fill={T.accent} />
      ))}
    </svg>
  );
}

function MeditationFigure() {
  return (
    <svg viewBox="0 0 110 130" style={{ width:100,height:120,flexShrink:0 }} aria-hidden="true">
      <circle cx="55" cy="58" r="46" fill={T.accentA10} />
      <circle cx="55" cy="58" r="36" fill={T.accentA10} />
      <circle cx="55" cy="22" r="11" fill="none" stroke={T.accent} strokeWidth="1.8" />
      <path d="M55 33 L55 65" stroke={T.accent} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M55 45 Q38 50 30 62" stroke={T.accent} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M55 45 Q72 50 80 62" stroke={T.accent} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M30 62 Q42 72 55 70 Q68 72 80 62" stroke={T.accent} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <ellipse cx="30" cy="65" rx="5" ry="3.5" fill="none" stroke={T.accent} strokeWidth="1.4" />
      <ellipse cx="80" cy="65" rx="5" ry="3.5" fill="none" stroke={T.accent} strokeWidth="1.4" />
      <path d="M55 10 L55 4" stroke={T.accentA40} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M48 12 L44 7" stroke={T.accentA40} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M62 12 L66 7" stroke={T.accentA40} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="55" cy="52" r="2.5" fill={T.accent} opacity="0.6" />
      <line x1="18" y1="80" x2="92" y2="80" stroke={T.border} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M55 80 Q46 84 42 80 Q46 76 55 80Z" fill={T.accentSoft} stroke={T.accentA30} strokeWidth="0.8" />
      <path d="M55 80 Q64 84 68 80 Q64 76 55 80Z" fill={T.accentSoft} stroke={T.accentA30} strokeWidth="0.8" />
      <path d="M55 80 Q55 86 51 88 Q50 83 55 80Z" fill={T.accentSoft} stroke={T.accentA30} strokeWidth="0.8" />
      <path d="M55 80 Q55 86 59 88 Q60 83 55 80Z" fill={T.accentSoft} stroke={T.accentA30} strokeWidth="0.8" />
    </svg>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <div style={{ width: 32, height: 3, background: T.accent, borderRadius: 2, marginBottom: "0.75rem" }} />
      <h2 className="cl-section-h2" style={{ margin: 0 }}>{children}</h2>
    </div>
  );
}

function IconCircle({
  children, size = 44, bg = T.accentSoft, border = T.accentA20, color = T.accent,
}: {
  children: React.ReactNode; size?: number; bg?: string; border?: string; color?: string;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, border: `1.5px solid ${border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1rem", color, fontWeight: 700, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

// ── Dasha detail panel ────────────────────────────────────────────────────

const DASHA_SECTION_LABELS = {
  en: { expect: "At This Age", navigate: "Be Alert", focus: "Remedy & Opportunity" },
  ta: { expect: "இந்த வயதில்", navigate: "கவனம் தேவை", focus: "நிவாரணம் & வாய்ப்பு" },
} as const;

function DashaDetailPanel({
  entry, color, lang, onClose,
}: {
  entry: { planet: string; period: string; ageRange?: string; theme: string; detail: DashaDetail };
  color: string;
  lang: "en" | "ta";
  onClose: () => void;
}) {
  const lbl = DASHA_SECTION_LABELS[lang];
  const glyph = PLANET_GLYPHS[entry.planet] ?? entry.planet.slice(0, 2);

  return (
    <div style={{
      marginTop: "1.5rem",
      background: T.surface,
      border: `1.5px solid ${color}40`,
      borderRadius: 16,
      padding: "1.75rem 2rem",
      boxShadow: `0 4px 24px ${color}15`,
      position: "relative",
      animation: "dashaPanelIn 0.22s ease",
    }}>
      <style>{`@keyframes dashaPanelIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Close */}
      <button onClick={onClose} aria-label="Close" style={{
        position: "absolute", top: "1rem", right: "1rem",
        background: "none", border: "none", cursor: "pointer",
        color: T.muted, fontSize: "1.1rem", lineHeight: 1,
        padding: "0.2rem 0.4rem",
      }}>✕</button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: `${color}15`, border: `2px solid ${color}60`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.4rem", color, flexShrink: 0,
        }}>
          {glyph}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: T.ink }}>{entry.planet} Dasha</p>
          <p style={{ margin: 0, fontSize: "0.8rem", color, fontWeight: 600 }}>
            {entry.period}{entry.ageRange ? ` · ${entry.ageRange}` : ""} &mdash; {entry.theme}
          </p>
        </div>
      </div>

      {/* Three content blocks */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1.1rem" }}>
        {([
          { icon: "🔭", label: lbl.expect,   text: entry.detail.expect   },
          { icon: "🧭", label: lbl.navigate,  text: entry.detail.navigate },
          { icon: "✦",  label: lbl.focus,     text: entry.detail.focus    },
        ] as const).map(({ icon, label, text }) => (
          <div key={label} style={{
            background: T.bg, borderRadius: 12, padding: "1.1rem 1.25rem",
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.95rem" }}>{icon}</span>
              <p style={{ margin: 0, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: T.muted }}>{label}</p>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: T.ink2, lineHeight: 1.65 }}>{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface Props {
  data: NatchathiramEntry;
  visual: NatchathiramVisualData;
}

export function NatchathiramVisualContent({ data, visual }: Props) {
  const [lang] = useLang();
  const d = NATCHATHIRAM_DETAIL;
  const v = NATCHATHIRAM_VISUAL;
  const ta = visual.ta;
  const englishName = romanNakshathiramName(data.name_en);
  const englishLabel = romanNakshathiramLabel(data.name_en);

  const enFacts = NATCHATHIRAM_EN_FACTS[data.slug];
  function termEn(taStr: string) { return tamilizeAstroEnglish(JYOTISH_TERM_EN[taStr] ?? taStr); }

  // ── Helpers to pick lang-aware content ────────────────────────────────
  function mtt(en: string, taStr?: string) { return lang === "ta" && taStr ? taStr : tamilizeAstroEnglish(en); }
  function mtv(str: { en: string; ta: string }) { return mt(str, lang); }

  // Replace {name} placeholder
  function withName(template: string) { return template.replace("{name}", lang === "ta" ? data.name_ta : englishName); }

  // ── Fact rows ─────────────────────────────────────────────────────────
  const facts: { label: string; value: string; icon: "sign"|"planet"|"deity"|"gana"|"symbol"|"dasha" }[] = [
    { label: mtv(d.fact_rasi),   value: lang === "ta" ? data.rasi_ta              : data.rasi_en,                icon: "sign"   },
    { label: mtv(d.fact_planet), value: lang === "ta" ? data.ruling_planet_ta     : termEn(data.ruling_planet_ta), icon: "planet" },
    { label: mtv(d.fact_deity),  value: lang === "ta" ? data.deity_ta             : (enFacts?.deity ?? data.deity_ta),  icon: "deity"  },
    { label: mtv(d.fact_gana),   value: lang === "ta" ? data.gana_ta              : termEn(data.gana_ta),         icon: "gana"   },
    { label: mtv(d.fact_symbol), value: lang === "ta" ? data.symbol_ta            : (enFacts?.symbol ?? data.symbol_ta), icon: "symbol" },
    { label: mtv(d.fact_dasha),  value: lang === "ta" ? data.born_dasa_ta         : termEn(data.born_dasa_ta),   icon: "dasha"  },
  ];

  // ── Visual data with Tamil fallbacks ──────────────────────────────────
  const atAGlance = visual.atAGlance.map((item, i) => ({
    ...item, label: mtt(item.label, ta?.atAGlanceLabels?.[i]),
  }));
  const radarLabels = lang === "ta" && ta?.radarLabels?.length
    ? ta.radarLabels : visual.radar.labels;
  const coreStrengths = visual.coreStrengths.map((s, i) => ({
    ...s,
    label: mtt(s.label, ta?.coreStrengths?.[i]?.label),
    desc:  mtt(s.desc,  ta?.coreStrengths?.[i]?.desc),
  }));
  const careerAbilities = visual.careerAbilities.map((item, i) => ({
    ...item, label: mtt(item.label, ta?.careerAbilityLabels?.[i]),
  }));
  const careerClusters = visual.careerClusters.map((c, i) => ({
    ...c,
    title: mtt(c.title, ta?.careerClusters?.[i]?.title),
    desc:  mtt(c.desc,  ta?.careerClusters?.[i]?.desc),
  }));
  const modernApps = visual.modernApps.map((app, i) => ({
    ...app,
    title: mtt(app.title, ta?.modernApps?.[i]?.title),
    desc:  mtt(app.desc,  ta?.modernApps?.[i]?.desc),
  }));
  const dashaTimeline = visual.dashaTimeline.map((d, i) => ({
    ...d, theme: mtt(d.theme, ta?.dashaThemes?.[i]),
  }));
  const spirituality = visual.spirituality.map((s, i) => ({
    ...s,
    title: mtt(s.title, ta?.spirituality?.[i]?.title),
    desc:  mtt(s.desc,  ta?.spirituality?.[i]?.desc),
  }));
  const guidance   = mtt(visual.guidance, ta?.guidance);
  const careerNote = mtt(visual.careerNote ?? "", ta?.careerNote);
  const compatNote = mtt(visual.compatibleNote, ta?.compatibleNote);

  const modernLead = ta?.modernLead && lang === "ta" ? ta.modernLead
    : `Where ${englishName}'s ancient qualities map to modern opportunity.`;
  const familyLead = ta?.familyLead && lang === "ta" ? ta.familyLead
    : `Deep bonds, trust, and emotional loyalty shape ${englishName}'s relationships.`;

  const spiritIcons = ["🙏", "🪔", "✨"];
  const [selectedDasha, setSelectedDasha] = useState<number | null>(null);

  // ── Relationship hub labels ───────────────────────────────────────────
  const hub = [
    [150, 28,  mtv(v.rel_partners),  T.accentSoft, T.accent],
    [270, 115, mtv(v.rel_friends),   T.sageSoft,   T.sage],
    [205, 200, mtv(v.rel_community), T.sageSoft,   T.sage],
    [95,  200, mtv(v.rel_family),    T.accentSoft, T.accent],
    [30,  115, mtv(v.rel_mentors),   T.accentSoft, T.accent],
  ] as const;

  return (
    <div className="clarity-shell">
      <PublicNav />
      <main>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="cl-pub-hero">
          <div className="cl-container">

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.75rem", flexWrap:"wrap", gap:"0.5rem" }}>
              <p className="cl-eyebrow" style={{ margin:0 }}>
                {data.number} / 27 {lang==="ta" ? "நட்சத்திரங்கள்" : "Nakshathirams"} &middot; {mtv(v.mode_label)}
              </p>
              <Link href={`/natchathiram/${data.slug}`}
                style={{ fontSize:"0.8rem", fontWeight:600, color:T.accent, border:`1.5px solid ${T.accentA30}`, padding:"0.35rem 1rem", borderRadius:"999px", background:T.accentSoft, display:"flex", alignItems:"center", gap:"0.35rem" }}>
                &#128196; {mtv(v.read_text)}
              </Link>
            </div>

            <div className="cl-pub-hero__inner">

              {/* Left — title + at-a-glance */}
              <div className="cl-pub-hero__copy">
                <h1 className="cl-pub-h1">
                  {lang === "ta" ? (
                    <>
                      {data.name_ta} நட்சத்திரம்
                      <span style={{ display:"block", fontSize:"clamp(0.9rem,1.8vw,1.15rem)", color:"var(--cl-muted)", fontFamily:"var(--cl-font-sans)", fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase", marginTop:"0.4rem" }}>
                        {englishLabel.toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <>
                      {englishLabel}
                      <span style={{ display:"block", fontSize:"clamp(0.95rem,2vw,1.25rem)", color:"var(--cl-muted)", fontFamily:"var(--cl-font-sans)", fontWeight:500, letterSpacing:"0.14em", textTransform:"uppercase", marginTop:"0.4rem" }}>
                        {englishLabel.toUpperCase()}
                      </span>
                    </>
                  )}
                </h1>
                <p className="cl-pub-lead">
                  {lang === "ta"
                    ? `${data.name_ta} நட்சத்திரத்தில் பிறந்தவர்களின் குண நலன்கள், தொழில், குடும்பம், தசை பலன்கள் மற்றும் ஆன்மீக வழிகாட்டுதல்.`
                    : `Personality traits, career strengths, family dynamics, dasha timelines, and spiritual guidance — ${englishLabel}.`}
                </p>

                {/* AT A GLANCE */}
                <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"1.5rem 1.75rem", boxShadow:`0 2px 12px ${T.accentA10}` }}>
                  <p className="cl-eyebrow" style={{ margin:"0 0 1rem" }}>{mtv(v.at_a_glance)}</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.9rem" }}>
                    {atAGlance.map((item) => (
                      <div key={item.label}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:"0.84rem", fontWeight:500, color:T.ink2 }}>{item.label}</span>
                          <span style={{ fontSize:"0.84rem", color:T.accent, fontWeight:700 }}>{item.score}%</span>
                        </div>
                        <ScoreBar score={item.score} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right — profile card */}
              <div className="cl-hero-figure">
                <div style={{ position:"relative", overflow:"hidden", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:20, padding:"2rem 1.75rem", textAlign:"center", boxShadow:`0 4px 24px ${T.accentA10}` }}>
                  <ConstellationBg />
                  <div style={{ position:"relative", zIndex:1 }}>
                    <p style={{ fontSize:"0.62rem", textTransform:"uppercase", letterSpacing:"0.14em", color:T.muted, margin:"0 0 1.5rem", fontWeight:600 }}>
                      {mtv(v.natch_profile)} &middot; {lang==="ta" ? data.rasi_ta.toUpperCase() : data.rasi_en.toUpperCase()}
                    </p>
                    <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.25rem" }}>
                      <NakshatraSigil number={data.number} name={englishName} size="lg" />
                    </div>
                    <p style={{ fontSize:"0.6rem", textTransform:"uppercase", letterSpacing:"0.12em", color:T.muted, margin:"0 0 0.2rem", fontWeight:600 }}>
                      {mtv(v.better_star)}
                    </p>
                    {lang === "ta" ? (
                      <>
                        <p style={{ fontFamily:"var(--cl-font-display)", fontSize:"1.6rem", fontWeight:600, color:T.ink, margin:"0 0 0.1rem", letterSpacing:"-0.02em" }}>{data.name_ta}</p>
                        <p style={{ fontSize:"0.85rem", color:T.muted, margin:"0 0 1.5rem" }}>{englishLabel}</p>
                      </>
                    ) : (
                      <p style={{ fontFamily:"var(--cl-font-display)", fontSize:"1.6rem", fontWeight:600, color:T.ink, margin:"0 0 1.5rem", letterSpacing:"-0.02em" }}>{englishName}</p>
                    )}
                    <div style={{ display:"inline-flex", alignItems:"center", gap:"0.75rem", background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"0.75rem 1.25rem" }}>
                      <RasiGlyph rasi={data.rasi_en} label={data.rasi_en} size="md" />
                      <div style={{ textAlign:"left" }}>
                        <p style={{ fontSize:"0.58rem", textTransform:"uppercase", letterSpacing:"0.12em", color:T.muted, margin:0, fontWeight:600 }}>{mtv(v.rasi_label)}</p>
                        <p style={{ fontWeight:700, color:T.ink, margin:"0.1rem 0 0.05rem", fontSize:"1rem" }}>
                          {lang === "ta" ? data.rasi_ta : data.rasi_en}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Facts strip ──────────────────────────────────────────────── */}
        <section className="cl-band cl-band--alt" style={{ paddingTop:40, paddingBottom:40 }}>
          <div className="cl-container">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"0.875rem" }}>
              {facts.map((f, i) => (
                <div key={f.label} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"1.1rem 1.25rem", boxShadow:`0 1px 4px ${T.accentA10}` }}>
                  <div style={{ marginBottom:"0.6rem" }}>
                    {i === 0 ? <RasiGlyph rasi={data.rasi_en} label={data.rasi_en} size="sm" /> : <FactIcon type={f.icon} />}
                  </div>
                  <p style={{ fontSize:"0.6rem", textTransform:"uppercase", letterSpacing:"0.11em", color:T.muted, margin:"0 0 0.25rem", fontWeight:600 }}>{f.label}</p>
                  <p style={{ fontWeight:700, fontSize:"0.92rem", color:T.ink, margin:0 }}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Personality Snapshot + Core Strengths ────────────────────── */}
        <section className="cl-band">
          <div className="cl-container">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))", gap:"4rem", alignItems:"start" }}>

              <div>
                <SectionHeading>{mtv(v.personality)}</SectionHeading>
                <div style={{ display:"flex", justifyContent:"center", marginTop:"0.5rem" }}>
                  <RadarChart labels={radarLabels} values={visual.radar.values} />
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.45rem", marginTop:"0.75rem", justifyContent:"center" }}>
                  {radarLabels.map((lbl, i) => (
                    <span key={lbl} style={{ fontSize:"0.72rem", padding:"0.25rem 0.7rem", background:T.accentSoft, border:`1px solid ${T.accentA20}`, borderRadius:"999px", color:T.accent, fontWeight:600 }}>
                      {lbl} <span style={{ opacity:0.7 }}>{visual.radar.values[i]}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <SectionHeading>{mtv(v.core_strengths)}</SectionHeading>
                <div style={{ display:"flex", flexDirection:"column", gap:"1.35rem" }}>
                  {coreStrengths.map((s) => (
                    <div key={s.label} style={{ display:"flex", gap:"0.875rem", alignItems:"flex-start" }}>
                      <IconCircle size={44}>{s.symbol}</IconCircle>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:"0.9rem", fontWeight:600, color:T.ink }}>{s.label}</span>
                          <span style={{ fontSize:"0.9rem", color:T.accent, fontWeight:700 }}>{s.score}%</span>
                        </div>
                        <ScoreBar score={s.score} />
                        <p style={{ fontSize:"0.76rem", color:T.muted, margin:"0.4rem 0 0", lineHeight:1.55 }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div style={{ marginTop:"3rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.85rem 1.25rem", background:T.surface, border:`1px solid ${T.accentA20}`, borderRadius:"0.75rem", fontSize:"0.82rem", color:T.ink2, boxShadow:`0 1px 4px ${T.accentA10}` }}>
                <IconCircle size={34}><span style={{ fontSize:"0.85rem" }}>&#128196;</span></IconCircle>
                <span>
                  {mtv(v.nudge_want)}{" "}
                  <Link href={`/natchathiram/${data.slug}`} style={{ color:T.accent, fontWeight:600, textDecoration:"underline", textUnderlineOffset:3 }}>
                    {withName(mtv(v.nudge_read))}
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Career & Abilities + Best Clusters ───────────────────────── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))", gap:"4rem" }}>

              <div>
                <SectionHeading>{mtv(d.sec_career)}</SectionHeading>
                <div style={{ display:"flex", flexDirection:"column", gap:"1.15rem" }}>
                  {careerAbilities.map((item) => (
                    <div key={item.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                        <span style={{ fontSize:"0.88rem", fontWeight:500, color:T.ink2 }}>{item.label}</span>
                        <span style={{ fontSize:"0.88rem", color:T.accent, fontWeight:700 }}>{item.score}%</span>
                      </div>
                      <ScoreBar score={item.score} />
                    </div>
                  ))}
                </div>
                {careerNote && (
                  <p style={{ fontSize:"0.82rem", color:T.muted, marginTop:"1.5rem", lineHeight:1.65, fontStyle:"italic", borderLeft:`2px solid ${T.accentA30}`, paddingLeft:"0.875rem" }}>
                    {careerNote}
                  </p>
                )}
              </div>

              <div>
                <SectionHeading>{mtv(v.career_clusters)}</SectionHeading>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,160px),1fr))", gap:"0.875rem" }}>
                  {careerClusters.map((c) => (
                    <div key={c.title} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"1.25rem 1rem", textAlign:"center", boxShadow:`0 1px 4px ${T.accentA10}` }}>
                      <div style={{ display:"flex", justifyContent:"center", marginBottom:"0.6rem" }}>
                        <IconCircle size={44}>{c.symbol}</IconCircle>
                      </div>
                      <p style={{ fontSize:"0.82rem", fontWeight:700, color:T.ink, margin:"0 0 0.3rem", lineHeight:1.3 }}>{c.title}</p>
                      <p style={{ fontSize:"0.72rem", color:T.muted, margin:0, lineHeight:1.4 }}>{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── In Today's World ─────────────────────────────────────────── */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <SectionHeading>{mtv(v.modern_title)}</SectionHeading>
              <p className="cl-band__lead" style={{ marginTop:"-0.5rem" }}>{modernLead}</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:"0.875rem" }}>
              {modernApps.map((app) => (
                <div key={app.title} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"1.35rem 1.25rem", boxShadow:`0 1px 4px ${T.accentA10}` }}>
                  <div style={{ marginBottom:"0.75rem" }}>
                    <IconCircle size={44} bg={T.sageSoft} border={T.sageA25} color={T.sage}>{app.symbol}</IconCircle>
                  </div>
                  <p style={{ fontSize:"0.86rem", fontWeight:700, color:T.ink, margin:"0 0 0.3rem" }}>{app.title}</p>
                  <p style={{ fontSize:"0.74rem", color:T.muted, margin:0, lineHeight:1.5 }}>{app.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Family & Compatible ───────────────────────────────────────── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))", gap:"4rem" }}>

              <div>
                <SectionHeading>{mtv(d.sec_family)}</SectionHeading>
                <p style={{ fontSize:"0.9rem", color:T.muted, margin:"-0.5rem 0 1.5rem", lineHeight:1.65 }}>{familyLead}</p>
                <div style={{ position:"relative", height:230 }}>
                  <svg viewBox="0 0 300 230" style={{ width:"100%", height:"100%" }} aria-hidden="true">
                    {hub.map(([x, y, label, bg, clr]) => (
                      <g key={label}>
                        <line x1={150} y1={115} x2={x} y2={y} stroke={T.border} strokeWidth={1.5} strokeDasharray="4,3" />
                        <circle cx={x} cy={y} r={27} fill={bg} stroke={clr} strokeWidth={1.5} opacity="0.85" />
                        <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle" fill={clr} fontSize={8.5} fontWeight="600" fontFamily="'Noto Sans Tamil',Inter,sans-serif">{label}</text>
                      </g>
                    ))}
                    <circle cx={150} cy={115} r={44} fill={T.accentSoft} stroke={T.accent} strokeWidth={2} />
                    <text x={150} y={111} textAnchor="middle" fill={T.accent} fontSize={12} fontWeight="700" fontFamily="'Noto Sans Tamil',Inter,sans-serif">{mtv(v.rel_you)}</text>
                    <text x={150} y={125} textAnchor="middle" fill={T.muted} fontSize={9} fontFamily="'Noto Sans Tamil',Inter,sans-serif">
                      ({lang === "ta" ? data.name_ta : englishName})
                    </text>
                  </svg>
                </div>
              </div>

              <div>
                <SectionHeading>{mtv(d.compat_h2)}</SectionHeading>
                <p style={{ fontSize:"0.9rem", color:T.muted, margin:"-0.5rem 0 1.5rem", lineHeight:1.65 }}>{mtv(v.compat_lead)}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.6rem", marginBottom:"1.25rem" }}>
                  {visual.compatibleEn.map((n, i) => (
                    <span key={n} style={{ padding:"0.45rem 1.1rem", borderRadius:"999px", fontSize:"0.86rem", fontWeight:600, background:i<3?T.accentSoft:T.sageSoft, border:`1.5px solid ${i<3?T.accentA30:T.sageA25}`, color:i<3?T.accent:T.sage }}>
                      {tamilizeAstroEnglish(n)}
                    </span>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"0.6rem", alignItems:"flex-start", padding:"0.875rem 1rem", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, marginBottom:"1.25rem" }}>
                  <span style={{ color:T.accent, fontSize:"1rem", flexShrink:0 }}>&#9825;</span>
                  <p style={{ fontSize:"0.78rem", color:T.muted, lineHeight:1.6, margin:0 }}>{compatNote}</p>
                </div>
                <Link href="/tools/marriage-porutham-calculator" className="cl-btn cl-btn--ghost" style={{ fontSize:"0.84rem", padding:"0.55rem 1.25rem" }}>
                  {mtv(v.check_compat)}
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* ── Dasha Timeline ────────────────────────────────────────────── */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-band__head">
              <SectionHeading>{mtv(d.sec_dasha)}</SectionHeading>
              <p className="cl-band__lead" style={{ marginTop:"-0.5rem" }}>{mtv(v.dasha_lead)}</p>
              <p style={{ fontSize:"0.74rem", color:T.muted, margin:"-0.25rem 0 1.5rem", fontStyle:"italic", lineHeight:1.5 }}>
                {lang === "ta"
                  ? "* முதல் தசை கால அளவு பிறந்த நேரத்தைப் பொறுத்து குறையலாம் — இது அனைவருக்கும் பொதுவானது."
                  : "* First dasha duration varies by birth position — most are born mid-cycle with fewer years remaining."}
              </p>
            </div>
            <div style={{ overflowX:"auto", paddingBottom:"0.5rem", paddingTop:"0.75rem" }}>
              <div style={{ display:"flex", minWidth:600 }}>
                {dashaTimeline.map((entry, i) => {
                  const col = DASHA_COLORS[i % DASHA_COLORS.length];
                  const glyph = PLANET_GLYPHS[entry.planet] ?? entry.planet.slice(0, 2);
                  const isSelected = selectedDasha === i;
                  const hasDetail = !!visual.dashaTimeline[i]?.detail;
                  return (
                    <div
                      key={entry.planet}
                      style={{ flex:1, textAlign:"center", position:"relative", padding:"0 0.25rem" }}
                    >
                      {i > 0 && <div style={{ position:"absolute", top:22, left:0, width:"calc(50% - 23px)", height:3, background:isSelected ? `${col}60` : T.border, transition:"background 0.2s" }} />}
                      {i < dashaTimeline.length-1 && <div style={{ position:"absolute", top:22, right:0, width:"calc(50% - 23px)", height:3, background:isSelected ? `${col}60` : T.border, transition:"background 0.2s" }} />}
                      <button
                        onClick={() => setSelectedDasha(isSelected ? null : i)}
                        aria-expanded={isSelected}
                        aria-label={`${entry.planet} dasha details`}
                        style={{
                          width:46, height:46, borderRadius:"50%",
                          background: isSelected ? `${col}30` : `${col}18`,
                          border: isSelected ? `2.5px solid ${col}` : `2.5px solid ${col}80`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          margin:"0 auto 0.75rem", position:"relative", zIndex:1,
                          fontSize:"1.1rem", color:col,
                          boxShadow: isSelected ? `0 0 0 4px ${col}20, 0 4px 12px ${col}30` : `0 2px 8px ${col}20`,
                          cursor: hasDetail ? "pointer" : "default",
                          transition:"all 0.18s ease",
                          transform: isSelected ? "scale(1.12)" : "scale(1)",
                        }}
                      >
                        {glyph}
                      </button>
                      <p style={{ fontSize:"0.82rem", fontWeight:700, color: isSelected ? col : T.ink, margin:"0 0 0.15rem", transition:"color 0.18s" }}>{entry.planet}</p>
                      <p style={{ fontSize:"0.7rem", color:T.accent, margin:"0 0 0.1rem", fontWeight:700 }}>{entry.period}</p>
                      {entry.ageRange && <p style={{ fontSize:"0.62rem", color:T.muted, margin:"0 0 0.2rem", fontWeight:500 }}>{entry.ageRange}</p>}
                      <p style={{ fontSize:"0.66rem", color:T.muted, margin:0, lineHeight:1.4, padding:"0 0.2rem" }}>{entry.theme}</p>
                      {hasDetail && (
                        <p style={{ fontSize:"0.6rem", color: isSelected ? col : T.muted, margin:"0.3rem 0 0", fontWeight:600, letterSpacing:"0.04em", transition:"color 0.18s" }}>
                          {isSelected ? "▲ close" : "▼ details"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            {selectedDasha !== null && (() => {
              const entry = dashaTimeline[selectedDasha];
              const rawDetail = visual.dashaTimeline[selectedDasha]?.detail;
              const taDetail = visual.ta?.dashaDetails?.[selectedDasha];
              if (!rawDetail) return null;
              const detail: DashaDetail = lang === "ta" && taDetail ? taDetail : rawDetail;
              const col = DASHA_COLORS[selectedDasha % DASHA_COLORS.length];
              return (
                <DashaDetailPanel
                  entry={{ ...entry, detail }}
                  color={col}
                  lang={lang as "en" | "ta"}
                  onClose={() => setSelectedDasha(null)}
                />
              );
            })()}
          </div>
        </section>

        {/* ── Spirituality ──────────────────────────────────────────────── */}
        <section className="cl-band cl-band--alt">
          <div className="cl-container">
            <SectionHeading>{mtv(d.sec_spiritual)}</SectionHeading>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(255px,1fr))", gap:"1.1rem" }}>
              {spirituality.map((s, i) => (
                <div key={s.title} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"1.5rem", boxShadow:`0 1px 6px ${T.accentA10}` }}>
                  <div style={{ display:"flex", gap:"0.875rem", alignItems:"flex-start" }}>
                    <IconCircle size={46}><span style={{ fontSize:"1.1rem" }}>{spiritIcons[i%spiritIcons.length]}</span></IconCircle>
                    <div>
                      <p style={{ fontWeight:700, fontSize:"0.95rem", color:T.ink, margin:"0 0 0.4rem" }}>{s.title}</p>
                      <p style={{ fontSize:"0.8rem", color:T.muted, margin:0, lineHeight:1.6 }}>{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:"3rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.85rem 1.25rem", background:T.surface, border:`1px solid ${T.accentA20}`, borderRadius:"0.75rem", fontSize:"0.82rem", color:T.ink2, boxShadow:`0 1px 4px ${T.accentA10}` }}>
                <IconCircle size={34}><span style={{ fontSize:"0.85rem" }}>&#128196;</span></IconCircle>
                <span>
                  {mtv(v.nudge_want)}{" "}
                  <Link href={`/natchathiram/${data.slug}`} style={{ color:T.accent, fontWeight:600, textDecoration:"underline", textUnderlineOffset:3 }}>
                    {withName(mtv(v.nudge_read))}
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Key Guidance ─────────────────────────────────────────────── */}
        <section className="cl-band">
          <div className="cl-container">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))", gap:"3rem", alignItems:"center", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:18, padding:"2.5rem 3rem", boxShadow:`0 2px 16px ${T.accentA10}` }}>
              <div>
                <p className="cl-eyebrow" style={{ marginBottom:"1rem" }}>{mtv(v.key_guidance)}</p>
                <blockquote style={{ margin:0, fontFamily:"var(--cl-font-display)", fontSize:"clamp(1rem,2.5vw,1.35rem)", lineHeight:1.7, color:T.ink, borderLeft:`3px solid ${T.accent}`, paddingLeft:"1.5rem", fontStyle:"italic" }}>
                  &ldquo;{guidance}&rdquo;
                </blockquote>
              </div>
              <MeditationFigure />
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="cl-band cl-band--alt" style={{ textAlign:"center" }}>
          <div className="cl-container">
            <p className="cl-eyebrow">{mtv(v.cta_eyebrow)}</p>
            <h2 className="cl-section-h2" style={{ margin:"0.5rem 0 0" }}>{mtv(v.cta_title)}</h2>
            <p className="cl-section-body" style={{ maxWidth:"52ch", margin:"1rem auto 2rem" }}>
              {mtv(d.cta_body)}
            </p>
            <div style={{ display:"flex", gap:"0.875rem", justifyContent:"center", flexWrap:"wrap", marginBottom:"2.5rem" }}>
              <Link href="/tools/jadhagam-generator" className="cl-btn cl-btn--solid">{mtv(d.cta_btn_primary)}</Link>
              <Link href="/natchathiram" className="cl-btn cl-btn--ghost">{mtv(d.cta_btn_ghost)}</Link>
            </div>
            <div style={{ paddingTop:"1.75rem", borderTop:`1px solid ${T.border}` }}>
              <p style={{ fontSize:"0.84rem", color:T.muted, margin:"0 0 0.5rem" }}>{mtv(v.want_full)}</p>
              <Link href={`/natchathiram/${data.slug}`} style={{ fontSize:"0.9rem", color:T.accent, fontWeight:600, textDecoration:"underline", textUnderlineOffset:3 }}>
                {withName(mtv(v.read_detailed))}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Related links ─────────────────────────────────────────────── */}
        <section className="cl-band">
          <div className="cl-container">
            <div className="cl-pub-related">
              <p className="cl-pub-related__title">{mtv(d.related_h2)}</p>
              <div className="cl-pub-related-links">
                <Link href="/learn/what-is-thirukanitham" className="cl-pub-related-link">{mtv(d.rel_thirukanitham)}</Link>
                <Link href="/learn/what-is-porutham" className="cl-pub-related-link">{mtv(d.rel_porutham)}</Link>
                <Link href="/learn/what-is-chandrashtama" className="cl-pub-related-link">{mtv(d.rel_chandrashtama)}</Link>
                <Link href="/natchathiram" className="cl-pub-related-link">{mtv(d.rel_all)}</Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
