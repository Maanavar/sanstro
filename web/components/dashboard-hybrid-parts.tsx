"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Minus, TrendingDown, TrendingUp, ChevronUp, ChevronDown } from "lucide-react";

import { nakshatraLord } from "@vinaadi/shared/nakshatraLord";

import { formatClockLabel, scoreColor } from "@/lib/format";
import { t, tPlanetLord, tWeekday, tNakshatra, nakshatraNumberFromName } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { tamilizeAstroEnglish } from "@/lib/tamil-astro";
import type {
  BiText,
  ChartCalculateResponseData,
  ChartExplanationPlanet,
  ChartExplanationYogaDoshamSection,
  DashaTimelineItem,
  DashaTimelineResponseData,
  LifeAreaData,
  TransitSnapshotData,
} from "@/lib/types";

import { RASI_NAMES } from "./dashboard-charts";
import { displayName as yogaDoshamDisplayName } from "./dashboard-yoga-dosham-panel";
import { HOUSE_MEANING, OWN_SIGN_RASI } from "./dashboard-chart-explanation-data";
import { ageAtDate } from "./dashboard-dasha";
import { Card, Kicker } from "./ui";

/**
 * Net-new graphical leaf components for the Family & Charts "Hybrid v2"
 * redesign (imported from the Claude Design mockup of the same name). Every
 * colour resolves through the existing CSS token set so the pieces render
 * correctly in BOTH the light and dark themes — the mockup's hard-coded
 * "dark astronomical" palette is literally this app's dark-theme tokens, so
 * mapping literal -> token loses nothing visually and keeps light theme intact.
 *
 * The only fixed hexes below are the per-planet orb gradients: those are
 * celestial-body identity colours (Mars is red, the Moon is silver) and are
 * theme-independent, exactly like DASHA_COLORS elsewhere in the app.
 */

/* ── Planet identity gradients (theme-independent, like DASHA_COLORS) ── */
// Planet-identity orb gradients live as theme-independent artwork tokens in
// dashboard-nova.css (audit A1 — keeps this file literal-free); each graha maps
// to its --orb-* gradient + --orb-*-glow shadow colour.
const ORB_GRADIENTS: Record<string, { orb: string; glow: string }> = {
  SUN:     { orb: "var(--orb-sun)",     glow: "var(--orb-sun-glow)" },
  MOON:    { orb: "var(--orb-moon)",    glow: "var(--orb-moon-glow)" },
  MARS:    { orb: "var(--orb-mars)",    glow: "var(--orb-mars-glow)" },
  MERCURY: { orb: "var(--orb-mercury)", glow: "var(--orb-mercury-glow)" },
  JUPITER: { orb: "var(--orb-jupiter)", glow: "var(--orb-jupiter-glow)" },
  VENUS:   { orb: "var(--orb-venus)",   glow: "var(--orb-venus-glow)" },
  SATURN:  { orb: "var(--orb-saturn)",  glow: "var(--orb-saturn-glow)" },
  RAHU:    { orb: "var(--orb-rahu)",    glow: "var(--orb-rahu-glow)" },
  KETU:    { orb: "var(--orb-ketu)",    glow: "var(--orb-ketu-glow)" },
};
const GRAHA_GLYPH: Record<string, string> = {
  SUN: "☉", MOON: "☾", MARS: "♂", MERCURY: "☿", JUPITER: "♃",
  VENUS: "♀", SATURN: "♄", RAHU: "☊", KETU: "☋",
};
/** Rasi number (1–12) -> ruling graha key. Whole-sign classical rulerships. */
const RASI_LORD_GRAHA = [
  "MARS", "VENUS", "MERCURY", "MOON", "SUN", "MERCURY",
  "VENUS", "MARS", "JUPITER", "SATURN", "SATURN", "JUPITER",
];

/* ── Section wrapper — heading + optional sub + right-aligned meta ────── */
export function HySection({
  id,
  scrollRef,
  title,
  sub,
  meta,
  children,
}: {
  id: string;
  scrollRef?: React.Ref<HTMLElement>;
  title: React.ReactNode;
  sub?: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} ref={scrollRef} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", scrollMarginTop: "72px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
        {/* audit B-1: every HySection-wrapped section gets a real <h2>, giving
            the Family & Charts long-scroll a proper document outline. */}
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem,2.4vw,1.75rem)", fontWeight: 600, color: "var(--color-text-strong)" }}>{title}</h2>
        {sub && <div style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{sub}</div>}
        {meta && <><span style={{ flex: 1 }} />{meta}</>}
      </div>
      {children}
    </section>
  );
}

/* ── Link-out card — for content that lives on another tab (Predictions/
      Forecast/Remedies -> Life Areas, AI/Notes -> Prasna/Journal). A compact
      preview plus an "open there" CTA — never a second copy of the other
      tab's logic. ─────────────────────────────────── */
export function HyLinkOutCard({
  icon,
  kicker,
  title,
  body,
  cta,
  onOpen,
  accent = "var(--color-accent-strong)",
}: {
  icon: string;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  onOpen?: () => void;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      style={{
        textAlign: "left", cursor: onOpen ? "pointer" : "default", fontFamily: "inherit", width: "100%",
        background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)",
        padding: "var(--space-5) var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <span style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", color: accent, fontSize: "var(--text-base)", flexShrink: 0 }}>{icon}</span>
        <Kicker color={accent}>{kicker}</Kicker>
      </div>
      <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{title}</div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>{body}</div>
      {onOpen && (
        <span style={{ marginTop: "2px", display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", fontWeight: 600, color: accent }}>{cta}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" /></span>
      )}
    </button>
  );
}

/* ── Planet "orbs" + expandable positions table (replaces the flat table) ─ */
type OrbPlanet = ChartCalculateResponseData["planets"][number];
function strengthVerdict(score: number, lang: Lang): string {
  if (score >= 70) return lang === "ta" ? "வலிமையானது" : "Strong";
  if (score >= 50) return lang === "ta" ? "நிலையானது" : "Steady";
  if (score >= 35) return lang === "ta" ? "மிதமானது" : "Moderate";
  return lang === "ta" ? "மென்மையானது" : "Gentle";
}

// Phase-0 humanization (docs/family-charts-humanization-audit.md): a plain-
// language reassurance line per strength band, so a bare "25/100" never leaves
// the reader wondering "should I worry?". Reads the engine's strengthScore — it
// invents nothing and recomputes no strength.
function strengthReassurance(score: number, lang: Lang): string {
  if (score >= 70)
    return lang === "ta"
      ? "உங்கள் ஜாதகத்தில் வலிமையான சக்திகளில் ஒன்று — இயல்பாகவே ஆதரவாக இருக்கும்."
      : "One of the stronger forces in your chart — it tends to support you naturally.";
  if (score >= 50)
    return lang === "ta"
      ? "நிலையான, சாதகமான இடத்தில் — பெரும்பாலும் நம்பகமானது."
      : "Sits in a steady, workable place — dependable more often than not.";
  if (score >= 35)
    return lang === "ta"
      ? "மிதமான தாக்கம் — சிறிது முயற்சியுடன் சிறப்பாக செயல்படும்."
      : "A moderate influence — it works best with a little conscious effort.";
  return lang === "ta"
    ? "மென்மையானது, ஆதரவு தேவை. இது கெட்டதல்ல — அதன் விஷயங்கள் கூடுதல் கவனமும் பொறுமையும் கேட்கின்றன."
    : "Gentle, and it needs support. That isn't bad — its matters simply ask for more care and patience.";
}

// Each graha's universal karaka domain — textbook significations, true for the
// planet itself (not the person), so this is the honest Level-1 "what is this
// planet about?" the humanization audit calls for. Made specific by the chart's
// own house/strength in the same card.
const GRAHA_DOMAIN: Record<string, { ta: string; en: string }> = {
  SUN: { ta: "தன்மை & உயிர்சக்தி", en: "Self & vitality" },
  MOON: { ta: "மனம் & உணர்ச்சி", en: "Mind & emotion" },
  MARS: { ta: "ஆற்றல் & உந்துதல்", en: "Energy & drive" },
  MERCURY: { ta: "அறிவு & பேச்சு", en: "Intellect & speech" },
  JUPITER: { ta: "ஞானம் & வளர்ச்சி", en: "Wisdom & growth" },
  VENUS: { ta: "அன்பு & இன்பம்", en: "Love & comfort" },
  SATURN: { ta: "ஒழுக்கம் & உழைப்பு", en: "Discipline & work" },
  RAHU: { ta: "லட்சியம் & ஆசை", en: "Ambition & desire" },
  KETU: { ta: "விடுதலை & உள்ளுணர்வு", en: "Detachment & insight" },
};

/* ── Phase-0 "At a Glance" verdict card — the meaning-first header of a tapped
      planet. Answers, at one glance and with zero astrology knowledge: what the
      planet is about (karaka domain), whether it's strong/weak and whether that
      is a worry (banded verdict + reassurance), which life areas it touches
      (its house theme), and whether it's active now (running dasha). All from
      data the engine already returns — no new fetch, nothing recomputed. */
function HyPlanetVerdict({ lang, pl, expl }: {
  lang: Lang; pl: OrbPlanet; expl: ChartExplanationPlanet | undefined;
}) {
  const score = expl?.strengthScore;
  const accent = score != null ? scoreColor(score) : "var(--color-mid)";
  const domain = GRAHA_DOMAIN[pl.graha];
  const focus = HOUSE_MEANING[pl.houseFromLagna];
  const activeNow = (expl?.facets ?? []).some((f) => f.key === "activation" && f.tone === "BOOST");
  const grad = ORB_GRADIENTS[pl.graha] ?? ORB_GRADIENTS.SATURN!;

  return (
    <Card variant="soft" style={{ borderColor: score != null && score < 35 ? "var(--color-low-border)" : "var(--color-border-strong)", borderRadius: "var(--radius-md)", padding: "var(--space-4) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <span style={{ width: "26px", height: "26px", borderRadius: "var(--radius-pill)", background: grad.orb, boxShadow: `0 0 10px ${grad.glow}`, flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{tPlanetLord(pl.graha, lang)}</span>
        {domain && <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>· {lang === "ta" ? domain.ta : domain.en}</span>}
        {activeNow && (
          <span style={{ marginLeft: "auto", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-high)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)", whiteSpace: "nowrap" }}>
            ★ {lang === "ta" ? "இப்போது இயங்குகிறது" : "Active now"}
          </span>
        )}
      </div>
      {score != null && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: accent }}>{strengthVerdict(score, lang)}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{score}/100</span>
          </div>
          <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-text)" }}>{strengthReassurance(score, lang)}</p>
        </div>
      )}
      {focus && (
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: "var(--color-mid)" }}>{lang === "ta" ? "தொடும் துறைகள்: " : "Touches: "}</span>
          {lang === "ta" ? focus.ta : focus.en}
        </div>
      )}
    </Card>
  );
}

/* ── Phase-2 life-domain lens (docs/family-charts-humanization-audit.md) —
      "How this shows up in your life": the friend's ❤️/💼/💰/🧠 framing, but
      each bucket is chosen from THIS chart (the graha's karaka ∪ the houses it
      owns/occupies) and its tone comes from the engine's real strengthScore, so
      it reads differently for, say, a debilitated planet in the 6th. No Barnum,
      nothing recomputed. ─────────────────────────────────────────────────── */
type LifeBucket = "relationships" | "career" | "money" | "mind";

const BUCKET_META: Record<LifeBucket, { icon: string; label: { ta: string; en: string }; covers: { ta: string; en: string } }> = {
  relationships: {
    icon: "❤️",
    label: { ta: "உறவுகள்", en: "Relationships" },
    covers: { ta: "உங்கள் நெருங்கிய உறவுகள், கூட்டாண்மை மற்றும் இல்வாழ்க்கை", en: "your close bonds, partnership and home life" },
  },
  career: {
    icon: "💼",
    label: { ta: "தொழில்", en: "Career" },
    covers: { ta: "உங்கள் வேலை, திசை மற்றும் பொது அந்தஸ்து", en: "your work, direction and public standing" },
  },
  money: {
    icon: "💰",
    label: { ta: "பணம்", en: "Money" },
    covers: { ta: "உங்கள் வருமானம், சேமிப்பு மற்றும் பாதுகாப்பு உணர்வு", en: "your income, savings and sense of security" },
  },
  mind: {
    icon: "🧠",
    label: { ta: "மனம் & அமைதி", en: "Mind & peace" },
    covers: { ta: "உங்கள் மன அமைதி, கவனம் மற்றும் உணர்ச்சி சமநிலை", en: "your inner calm, focus and emotional balance" },
  },
};

// Each graha's natural karaka buckets (textbook significations) — always
// relevant to that planet regardless of placement.
const GRAHA_KARAKA_BUCKETS: Record<string, LifeBucket[]> = {
  SUN: ["career", "mind"],
  MOON: ["mind", "relationships"],
  MARS: ["career", "relationships"],
  MERCURY: ["money", "career"],
  JUPITER: ["money", "mind"],
  VENUS: ["relationships", "money"],
  SATURN: ["career", "mind"],
  RAHU: ["career", "money"],
  KETU: ["mind"],
};

// Which life bucket a house (from lagna) most speaks to.
const HOUSE_BUCKET: Record<number, LifeBucket> = {
  1: "mind", 2: "money", 3: "career", 4: "mind", 5: "relationships", 6: "career",
  7: "relationships", 8: "mind", 9: "money", 10: "career", 11: "money", 12: "mind",
};

// Strength-band outcome clause — the SAME planet-wide verdict applied to each of
// its buckets, so the tone is honest to the real strengthScore.
function bucketOutcome(score: number, lang: Lang): string {
  if (score >= 70) return lang === "ta" ? "ஆதரவாகவும் நிலையாகவும் இருக்கும்." : "tend to feel supported and steady.";
  if (score >= 50) return lang === "ta" ? "பொதுவாக நம்பகமாக இருக்கும்." : "are generally dependable.";
  if (score >= 35) return lang === "ta" ? "சிறிது முயற்சியுடன் மேம்படும்." : "improve with a little conscious effort.";
  return lang === "ta" ? "கூடுதல் கவனமும் பொறுமையும் கேட்கும்." : "ask for extra care and patience.";
}

/** Buckets relevant to this planet in THIS chart: karaka ∪ occupied ∪ owned. */
function planetLifeBuckets(graha: string, occupiedHouse: number, lagnaRasi: number): LifeBucket[] {
  const order: LifeBucket[] = ["relationships", "career", "money", "mind"];
  const set = new Set<LifeBucket>(GRAHA_KARAKA_BUCKETS[graha] ?? []);
  const occ = HOUSE_BUCKET[occupiedHouse];
  if (occ) set.add(occ);
  for (const sign of OWN_SIGN_RASI[graha] ?? []) {
    const house = ((sign - lagnaRasi + 1200) % 12) + 1;
    const b = HOUSE_BUCKET[house];
    if (b) set.add(b);
  }
  return order.filter((b) => set.has(b)).slice(0, 3);
}

function HyPlanetLifeAreas({ lang, expl }: { lang: Lang; expl: ChartExplanationPlanet | undefined }) {
  if (!expl || expl.strengthScore == null) return null;
  const lagnaRasi = ((expl.rasi - (expl.houseFromLagna - 1) - 1 + 1200) % 12) + 1;
  const buckets = planetLifeBuckets(expl.graha, expl.houseFromLagna, lagnaRasi);
  if (buckets.length === 0) return null;
  const outcome = bucketOutcome(expl.strengthScore, lang);
  const planet = tPlanetLord(expl.graha, lang);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <Kicker color="var(--color-mid)">
        {lang === "ta" ? "உங்கள் வாழ்க்கையில்" : "In your life"}
      </Kicker>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-2)" }}>
        {buckets.map((b) => {
          const meta = BUCKET_META[b];
          const covers = lang === "ta" ? meta.covers.ta : meta.covers.en;
          const line = lang === "ta"
            ? `${planet} மூலம், ${covers} ${outcome}`
            : `Through ${planet}, ${covers} ${outcome}`;
          return (
            <Card key={b} style={{ borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--text-base)" }} aria-hidden>{meta.icon}</span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>{lang === "ta" ? meta.label.ta : meta.label.en}</span>
              </div>
              <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-muted)" }}>{line}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
// B-11 density pass: the always-visible planet row shows the 6 columns that
// read at a glance — glyph · graha · rasi · degree · nakshatra · house · flags.
// Pada and Navamsa (D9) were the two narrowest/most-advanced of the old
// 10-column grid; they now live one tap down in the expanded row detail
// (rendered unconditionally there, so nothing is lost).
const PLANET_ROW_COLS = "44px 1.1fr 1fr .7fr 1.2fr .7fr 1.4fr 32px";
export function HyPlanetOrbs({ lang, planets, explanationPlanets, animate }: {
  lang: Lang; planets: OrbPlanet[]; explanationPlanets?: ChartExplanationPlanet[]; animate: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const astro = (v: string) => (lang === "en" ? tamilizeAstroEnglish(v) : v);
  const explByGraha = new Map((explanationPlanets ?? []).map((p) => [p.graha, p]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {/* Orbs */}
      <div className="hy-orbs">
        {planets.map((pl, i) => {
          const grad = ORB_GRADIENTS[pl.graha] ?? ORB_GRADIENTS.SATURN!;
          const isOpen = open === pl.graha;
          return (
            <button
              key={pl.graha}
              type="button"
              onClick={() => setOpen(isOpen ? null : pl.graha)}
              style={{
                background: isOpen ? "var(--color-accent-muted)" : "var(--color-surface)",
                border: `1px solid ${isOpen ? "var(--color-border-strong)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-3) var(--space-4)", display: "flex", flexDirection: "column",
                alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <span
                className={animate ? "hy-float" : undefined}
                style={{
                  width: "52px", height: "52px", borderRadius: "var(--radius-pill)", background: grad.orb,
                  boxShadow: `0 0 18px ${grad.glow}, var(--orb-inset)`,
                  animationDelay: `${(i * 0.4).toFixed(1)}s`,
                }}
              />
              <span style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>{tPlanetLord(pl.graha, lang)}</span>
                <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "2px" }}>{pl.rasiName}</span>
                <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "2px" }}>{pl.degreeInRasi.toFixed(1)}°</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Expandable table */}
      <Card style={{ display: "block", overflow: "hidden", padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: PLANET_ROW_COLS, columnGap: "var(--space-3)", alignItems: "center", padding: "var(--space-3) var(--space-5)", background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderBottom: "1px solid var(--color-border)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", fontWeight: 700, color: "var(--color-faint)" }}>
          <span /><span>{t("col_graha", lang)}</span><span>{t("col_rasi", lang)}</span><span>{t("col_degree", lang)}</span>
          <span>{t("col_nakshatra", lang)}</span><span>{t("col_house", lang)}</span>
          <span>{t("col_special", lang)}</span><span />
        </div>
        {planets.map((pl) => {
          const isOpen = open === pl.graha;
          const flags: { key: string; label: string; tone: "success" | "warning" }[] = [];
          // Rahu/Ketu are retrograde every day of their existence, so the badge
          // separates nothing on them and reads as generated noise. The backend
          // already applies this rule (PlanetPosition.showRetrogradeBadge).
          if (pl.isRetrograde && !PERPETUALLY_RETROGRADE.has(pl.graha)) {
            flags.push({ key: "vakra", label: t("flag_vakra", lang), tone: "warning" });
          }
          if (pl.isCombust) flags.push({ key: "astam", label: t("flag_astam", lang), tone: "warning" });
          if (pl.isCazimi) flags.push({ key: "cazimi", label: t("flag_cazimi", lang), tone: "success" });
          if (pl.isVargottama) flags.push({ key: "varga", label: t("flag_vargottamam", lang), tone: "success" });
          return (
            <div key={pl.graha} style={{ borderBottom: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : pl.graha)}
                style={{ width: "100%", textAlign: "left", fontFamily: "inherit", display: "grid", gridTemplateColumns: PLANET_ROW_COLS, columnGap: "var(--space-3)", alignItems: "center", padding: "var(--space-3) var(--space-5)", cursor: "pointer", background: isOpen ? "var(--color-accent-muted)" : "transparent", border: "none" }}
              >
                <span style={{ width: "28px", height: "28px", borderRadius: "var(--radius-sm)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", fontSize: "var(--text-sm)", color: "var(--color-accent-strong)" }}>{GRAHA_GLYPH[pl.graha] ?? ""}</span>
                <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{tPlanetLord(pl.graha, lang)}</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{pl.rasiName}</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{pl.degreeInRasi.toFixed(2)}°</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{astro(pl.nakshatraName)}</span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)", textAlign: "center" }}>{pl.houseFromLagna}</span>
                <span style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
                  {flags.map((f) => (
                    <span key={f.key} style={{ fontSize: "var(--text-xs)", fontWeight: 600, whiteSpace: "nowrap", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)", color: f.tone === "success" ? "var(--color-high)" : "var(--color-low)", border: `1px solid ${f.tone === "success" ? "var(--color-high-border)" : "var(--color-low-border)"}`, background: f.tone === "success" ? "var(--color-high-bg)" : "var(--color-low-bg)" }}>{f.label}</span>
                  ))}
                </span>
                <span className="hy-chev" style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", textAlign: "center", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
              </button>
              {isOpen && (() => {
                const expl = explByGraha.get(pl.graha);
                const facets = expl?.facets ?? [];
                const remedy = facets.find((f) => f.key === "remedy");
                return (
                  <div style={{ padding: "var(--space-1) var(--space-5) var(--space-5) var(--space-12)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                    {/* Meaning -> Why -> Mechanics (docs/family-charts-humanization-
                        audit.md). Lead: verdict (Phase 0) + life-domain lens
                        (Phase 2) + the actionable remedy. The Level-5/6 mechanics
                        (strength bar, pada, D9, facet lines) are tucked one more
                        tap down in the "Technical details" toggle (Phase 3), so
                        nothing is lost but nothing ambushes a newcomer. */}
                    <HyPlanetVerdict lang={lang} pl={pl} expl={expl} />
                    <HyPlanetLifeAreas lang={lang} expl={expl} />
                    {remedy && (
                      <Card variant="high" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
                        <span style={{ color: "var(--color-high)", fontSize: "var(--text-base)", flexShrink: 0 }}>⋔</span>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>{lang === "ta" ? remedy.value.ta : remedy.value.en}</span>
                      </Card>
                    )}
                    <HyTechnicalDetails lang={lang} pl={pl} expl={expl} />
                  </div>
                );
              })()}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
function HyFact({ label, value, tone = "NEUTRAL" }: { label: string; value: string; tone?: "NEUTRAL" | "BOOST" | "CAUTION" }) {
  const labelColor = tone === "BOOST" ? "var(--color-high)" : tone === "CAUTION" ? "var(--color-low)" : "var(--color-mid)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <Kicker color={labelColor}>{label}</Kicker>
      <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-base)", lineHeight: 1.5, color: "var(--color-text)" }}>{value}</span>
    </div>
  );
}

/* ── Phase-3 "Technical details" toggle (docs/family-charts-humanization-
      audit.md) — the Level-5/6 mechanics, collapsed by default so the meaning-
      first content leads. Nothing is removed: strength bar, pada, D9, and the
      engine's labelled facet lines all live here, one tap down. Enthusiasts
      lose nothing; newcomers aren't ambushed. */
function HyTechnicalDetails({ lang, pl, expl }: {
  lang: Lang; pl: OrbPlanet; expl: ChartExplanationPlanet | undefined;
}) {
  const [open, setOpen] = useState(false);
  const astro = (v: string) => (lang === "en" ? tamilizeAstroEnglish(v) : v);
  const facets = expl?.facets ?? [];
  const bodyFacets = facets.filter((f) => f.key !== "strength" && f.key !== "remedy");
  const score = expl?.strengthScore;

  return (
    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, fontSize: "var(--text-xs)", letterSpacing: "0.12em", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase" }}
      >
        <span style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s", fontSize: "var(--text-2xs)" }}>▸</span>
        {lang === "ta" ? "தொழில்நுட்ப விவரங்கள்" : "Technical details"}
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", marginTop: "14px" }}>
          {score != null && (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Kicker color="var(--color-mid)">{lang === "ta" ? "வலிமை" : "Strength"}</Kicker>
              <div style={{ width: "160px", height: "5px", borderRadius: "var(--radius-sm)", background: "var(--color-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, score))}%`, background: scoreColor(score), borderRadius: "var(--radius-sm)" }} />
              </div>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: scoreColor(score) }}>{score}/100 · {strengthVerdict(score, lang)}</span>
            </div>
          )}
          {/* Pada + Navamsa (D9) — surfaced unconditionally so the data is never
              lost (B-11). */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3) var(--space-7)" }}>
            <HyFact label={t("col_pada", lang)} value={String(pl.pada)} />
            <HyFact label={t("col_d9_rasi", lang)} value={RASI_NAMES[pl.d9Rasi] ?? String(pl.d9Rasi)} />
          </div>
          {bodyFacets.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3) var(--space-6)" }}>
              {bodyFacets.map((f, i) => (
                <HyFact key={`${f.key}-${i}`} label={lang === "ta" ? f.label.ta : f.label.en} value={lang === "ta" ? f.value.ta : astro(f.value.en)} tone={f.tone} />
              ))}
            </div>
          ) : expl?.explanation ? (
            <p style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-text)" }}>{lang === "ta" ? expl.explanation.ta : astro(expl.explanation.en)}</p>
          ) : (
            /* Explanation still loading — show the raw facts rather than nothing. */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3) var(--space-6)" }}>
              <HyFact label={t("col_house", lang)} value={`${pl.houseFromLagna} · ${pl.rasiName}`} />
              <HyFact label={t("col_nakshatra", lang)} value={astro(pl.nakshatraName)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Bhava (house) overview — house · sign · lord · occupants. All four are
      factual (whole-sign houses from the lagna); no invented "status"
      verdict. ────────────────────────────────────────────────────────── */
export function HyBhavaTable({ lang, chart, explanationPlanets }: {
  lang: Lang; chart: ChartCalculateResponseData; explanationPlanets?: ChartExplanationPlanet[];
}) {
  const lagnaRasi = chart.lagna.rasi; // 1–12
  const occupantsByHouse = new Map<number, string[]>();
  for (const p of chart.planets) {
    const list = occupantsByHouse.get(p.houseFromLagna) ?? [];
    list.push(tPlanetLord(p.graha, lang));
    occupantsByHouse.set(p.houseFromLagna, list);
  }
  // House "status" = the strength of that house's lord (a house is only as
  // sound as the graha that owns it). Sourced from the engine's per-planet
  // strengthScore — real, not an invented verdict. green ≥60 · amber ≥40 · red <40.
  const strengthByGraha = new Map((explanationPlanets ?? []).map((p) => [p.graha, p.strengthScore]));
  const rows = Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const signNum = ((lagnaRasi - 1 + i) % 12) + 1;
    const lordGraha = RASI_LORD_GRAHA[signNum - 1]!;
    const lordScore = strengthByGraha.get(lordGraha);
    const dot = lordScore == null ? "var(--color-border-strong)" : lordScore >= 60 ? "var(--color-high)" : lordScore >= 40 ? "var(--color-mid)" : "var(--color-low)";
    return {
      house,
      signLord: `${RASI_NAMES[signNum] ?? signNum} (${tPlanetLord(lordGraha, lang)})`,
      occupants: occupantsByHouse.get(house) ?? [],
      dot,
      lordScore,
    };
  });

  const cols = ".5fr 1.9fr 1.2fr auto";
  return (
    <Card style={{ padding: "var(--space-5) var(--space-5)", display: "flex", flexDirection: "column", gap: 0 }}>
      <Kicker color="var(--color-mid)">{lang === "ta" ? "பாவ (வீடு) மேலோட்டம்" : "Bhava (house) overview"}</Kicker>
      <div style={{ display: "grid", gridTemplateColumns: cols, columnGap: "var(--space-3)", padding: "var(--space-3) var(--space-2) var(--space-2)", marginTop: "8px", fontSize: "var(--text-xs)", letterSpacing: "0.1em", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase" }}>
        <span>{lang === "ta" ? "வீடு" : "House"}</span>
        <span>{lang === "ta" ? "ராசி (அதிபதி)" : "Sign (Lord)"}</span>
        <span>{lang === "ta" ? "கிரகங்கள்" : "Planets"}</span>
        <span style={{ textAlign: "center" }}>{lang === "ta" ? "நிலை" : "Status"}</span>
      </div>
      {rows.map((r) => (
        <div key={r.house} style={{ display: "grid", gridTemplateColumns: cols, columnGap: "var(--space-3)", alignItems: "center", padding: "var(--space-2) var(--space-2)", borderTop: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-muted)" }}>{r.house}</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text)" }}>{r.signLord}</span>
          <span style={{ fontSize: "var(--text-xs)", color: r.occupants.length ? "var(--color-accent-strong)" : "var(--color-faint)" }}>{r.occupants.length ? r.occupants.join(", ") : "—"}</span>
          <span title={r.lordScore != null ? `${r.lordScore}/100` : undefined} style={{ justifySelf: "center", width: "9px", height: "9px", borderRadius: "var(--radius-pill)", background: r.dot }} />
        </div>
      ))}
    </Card>
  );
}

/* ── Unified profile card (birth star / rasi / lagnam) — matches the mockup:
      glyph tile + name + green "Ruling Planet" line + a short blurb + small
      trait chips that wrap ~3 per row. Consistent look across all three. ── */
export function HyProfileCard({ kicker, glyph, name, rulingPlanetLabel, blurb, traits }: {
  kicker: string;
  glyph: React.ReactNode;
  name: string;
  rulingPlanetLabel?: string;
  blurb?: string;
  traits: { label: string; tone?: "good" | "warn" | "neutral" }[];
}) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <Kicker color="var(--color-mid)">{kicker}</Kicker>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <span style={{ flexShrink: 0, display: "grid", placeItems: "center" }}>{glyph}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.1 }}>{name}</div>
          {rulingPlanetLabel && <div style={{ fontSize: "var(--text-xs)", color: "var(--color-high)", marginTop: "4px" }}>{rulingPlanetLabel}</div>}
        </div>
      </div>
      {blurb && <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)" }}>{blurb}</div>}
      {traits.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "auto" }}>
          {traits.map((tr) => {
            const c = tr.tone === "warn" ? "var(--color-low)" : tr.tone === "good" ? "var(--color-high)" : "var(--color-muted)";
            const bg = tr.tone === "warn" ? "var(--color-low-bg)" : tr.tone === "good" ? "var(--color-high-bg)" : "color-mix(in srgb, var(--color-text-strong) 4%, transparent)";
            const bd = tr.tone === "warn" ? "var(--color-low-border)" : tr.tone === "good" ? "var(--color-high-border)" : "var(--color-border)";
            return <span key={tr.label} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: c, background: bg, border: `1px solid ${bd}`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)" }}>{tr.label}</span>;
          })}
        </div>
      )}
    </Card>
  );
}

/* ── One horizontal period band (dasha / bhukti / antaram all use this) —
      chapters left to right with the running one marked ACTIVE. ─────────── */
function dashaTotalDays(period: { startDate: string; endDate: string }): number {
  const start = new Date(`${period.startDate}T00:00:00`).getTime();
  const end = new Date(`${period.endDate}T00:00:00`).getTime();
  return Math.round((end - start) / 86400000);
}
function dashaDaysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00`).getTime();
  const to = new Date(`${toIso}T00:00:00`).getTime();
  return Math.round((to - from) / 86400000);
}

/* In-bar segment labels — each level reads best in its own natural unit:
   whole years for mahadashas, year+month for bhuktis, plain days for the
   fast-moving antarams (a month/year label would collapse several of those
   into the same text). */
function dashaYearsLabel(period: { startDate: string; endDate: string }, lang: Lang): string {
  const years = Math.max(1, Math.round(dashaTotalDays(period) / 365.25));
  return lang === "ta" ? `${years} ஆண்டு` : `${years}yr`;
}
function dashaYearMonthLabel(period: { startDate: string; endDate: string }, lang: Lang): string {
  const totalDays = dashaTotalDays(period);
  if (totalDays < 45) return lang === "ta" ? `${totalDays} நாள்` : `${totalDays}d`;
  const totalMonths = Math.round(totalDays / 30.44);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return lang === "ta" ? `${months} மாதம்` : `${months}mo`;
  if (months === 0) return lang === "ta" ? `${years} ஆண்டு` : `${years}yr`;
  return lang === "ta" ? `${years}ஆ ${months}மா` : `${years}y ${months}mo`;
}
function dashaDaysLabel(period: { startDate: string; endDate: string }, lang: Lang): string {
  return lang === "ta" ? `${dashaTotalDays(period)} நாள்` : `${dashaTotalDays(period)}d`;
}
/* Header-row span captions — spelled out in full, one size up from the
   segment labels above (the mahadasha row states the whole cycle's span in
   years; the antaram row states its bhukti's span in days). */
function dashaSpanYears(period: { startDate: string; endDate: string }, lang: Lang): string {
  const years = Math.round(dashaTotalDays(period) / 365.25);
  return lang === "ta" ? `${years} ஆண்டுகள்` : `${years} years`;
}
function dashaSpanDays(period: { startDate: string; endDate: string }, lang: Lang): string {
  return lang === "ta" ? `${dashaTotalDays(period)} நாட்கள்` : `${dashaTotalDays(period)} days`;
}

/* ── Segment fills — three states, each legible on its own. `past` is a
      dimmed version of the same purple as `future` (NOT a near-transparent
      wash): an already-lived chapter still has to be readable, it's just not
      where the eye should land. ──────────────────────────────────────────── */
const DASHA_SEG_BG = {
  active: "linear-gradient(160deg, var(--color-accent-strong) 0%, var(--color-accent) 100%)",
  past: "color-mix(in srgb, var(--color-accent-secondary-muted) 45%, transparent)",
  future: "var(--color-accent-secondary-muted)",
} as const;

/* ── Legend swatch — explains the bar grammar (dimmed/filled/ahead) once, at
      the foot of the card, instead of repeating a key on every row. ─────── */
function HyDashaLegendSwatch({ tone, label }: { tone: keyof typeof DASHA_SEG_BG; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1_5)", fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
      <span style={{ width: "14px", height: "10px", borderRadius: "3px", background: DASHA_SEG_BG[tone], border: "1px solid var(--color-border)", flexShrink: 0 }} />
      {label}
    </span>
  );
}

/* ── Level header — which chapter a row is nested inside, how many
      sub-periods, how long the whole thing spans, with the calendar range
      right-aligned. `depth` draws the ↳ nesting glyph. ──────────────────── */
function HyDashaLevelHeader({ label, meta, rangeLabel, depth = 0 }: { label: string; meta: string; rangeLabel: string; depth?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
        {depth > 0 && <span aria-hidden="true" style={{ color: "var(--color-border-strong)", marginRight: "var(--space-1_5)" }}>↳</span>}
        <b style={{ fontWeight: 700, color: "var(--color-text-strong)" }}>{label}</b>{" "}
        <span style={{ color: "var(--color-faint)" }}>· {meta}</span>
      </span>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", whiteSpace: "nowrap" }}>{rangeLabel}</span>
    </div>
  );
}

/* ── Proportional bar row — the Gantt-style read the old equal-width card
      band couldn't give: a 20-year mahadasha visibly wider than a 6-year
      one, an already-lived chapter dimmed, the running one lit gold with an
      inner sliver showing how far through it today sits. ─────────────────── */
function HyDashaBarRow({
  items,
  lang,
  today,
  isActiveItem,
  durationLabel,
  height = 56,
  todayLabel,
  axis,
}: {
  items: DashaTimelineItem[];
  lang: Lang;
  today: string;
  isActiveItem: (item: DashaTimelineItem) => boolean;
  durationLabel: (item: DashaTimelineItem) => string;
  height?: number;
  /** When set, draws the "you are here" marker line with this caption above
   *  the row. Only the outermost row captions it; the nested rows get the
   *  bare line so the eye can follow one vertical thread down the card. */
  todayLabel?: string;
  /** Rendered directly under the bar and INSIDE its scroll container, so an
   *  axis stays pinned to the segments it labels when the row scrolls. */
  axis?: React.ReactNode;
}) {
  if (items.length === 0) return null;
  const rangeStart = new Date(`${items[0].startDate}T00:00:00`).getTime();
  const rangeEnd = new Date(`${items[items.length - 1].endDate}T00:00:00`).getTime();
  const totalMs = Math.max(rangeEnd - rangeStart, 1);
  const pct = (iso: string) => Math.max(0, Math.min(100, ((new Date(`${iso}T00:00:00`).getTime() - rangeStart) / totalMs) * 100));

  const todayMs = new Date(`${today}T00:00:00`).getTime();
  const todayInRange = todayMs >= rangeStart && todayMs <= rangeEnd;
  const todayPct = todayInRange ? ((todayMs - rangeStart) / totalMs) * 100 : null;
  // A caption near either edge would run off the bar — pin it inside.
  const captionAnchor = todayPct === null ? "none" : todayPct < 12 ? "start" : todayPct > 88 ? "end" : "center";

  return (
    // The bar holds 9 segments; below ~680px the narrowest ones can no longer
    // fit their own name, so scroll rather than crush them into blank boxes.
    <div style={{ overflowX: "auto", overflowY: "hidden" }}>
      <div style={{ position: "relative", minWidth: "680px", paddingTop: todayLabel ? "18px" : 0 }}>
        {todayPct !== null && todayLabel && (
          <span
            style={{
              position: "absolute",
              top: 0,
              left: `${todayPct}%`,
              transform: captionAnchor === "center" ? "translateX(-50%)" : captionAnchor === "end" ? "translateX(-100%)" : "none",
              fontSize: "var(--text-2xs)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-accent-strong)",
              whiteSpace: "nowrap",
            }}
          >
            {todayLabel}
          </span>
        )}
        <div style={{ position: "relative", height: `${height}px` }}>
          {items.map((item) => {
            const active = isActiveItem(item);
            const past = !active && item.endDate <= today;
            const left = pct(item.startDate);
            const width = Math.max(pct(item.endDate) - left, 0.5);
            const tone = active ? "active" : past ? "past" : "future";
            const fg = active ? "var(--color-on-accent)" : past ? "var(--color-faint)" : "var(--color-text)";
            // The name always renders (a nameless box is the one thing a
            // timeline must never show); only the duration line, which is
            // supplementary, drops out when the segment is genuinely too thin.
            const showDuration = width >= 4.5;

            let innerPct: number | null = null;
            if (active) {
              const segStart = new Date(`${item.startDate}T00:00:00`).getTime();
              const segEnd = new Date(`${item.endDate}T00:00:00`).getTime();
              const segTotal = Math.max(segEnd - segStart, 1);
              const segElapsed = Math.min(Math.max(todayMs - segStart, 0), segTotal);
              innerPct = (segElapsed / segTotal) * 100;
            }

            return (
              <div
                key={`${item.level}-${item.lord}-${item.startDate}`}
                title={`${tPlanetLord(item.lord, lang)} · ${item.startDate} – ${item.endDate}`}
                style={{
                  position: "absolute",
                  // Inset by 2px a side so adjacent periods read as separate
                  // cards (the approved mockup's grammar) instead of one
                  // continuous ribbon split by hairlines.
                  left: `calc(${left}% + 2px)`,
                  width: `calc(${width}% - 4px)`,
                  top: 0,
                  bottom: 0,
                  background: DASHA_SEG_BG[tone],
                  borderRadius: "var(--radius-sm)",
                  border: active ? "1px solid var(--color-accent-strong)" : "1px solid transparent",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  overflow: "hidden",
                  padding: "0 3px",
                }}
              >
                <span style={{ fontSize: "var(--text-xs)", fontWeight: active ? 700 : 600, color: fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                  {tPlanetLord(item.lord, lang)}
                </span>
                {showDuration && (
                  <span style={{ fontSize: "var(--text-2xs)", color: fg, opacity: active ? 0.85 : 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                    {durationLabel(item)}
                  </span>
                )}
                {innerPct !== null && (
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "4px", background: "color-mix(in srgb, var(--color-on-accent) 30%, transparent)" }}>
                    <div style={{ width: `${innerPct}%`, height: "100%", background: "var(--color-on-accent)" }} />
                  </div>
                )}
              </div>
            );
          })}
          {todayPct !== null && (
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: `${todayPct}%`,
                top: "-4px",
                bottom: "-4px",
                width: "2px",
                marginLeft: "-1px",
                background: "var(--color-accent-strong)",
                borderRadius: "1px",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
        {axis}
      </div>
    </div>
  );
}

/* ── Axis ticks — year + age at each mahadasha boundary. Only the outermost
      row carries this: bhukti/antaram rows are already scoped by their own
      header ("Bhukti within Moon dasa"), so a second axis would repeat the
      same handful of years without adding information. ────────────────── */
function HyDashaAxisTicks({ items, lang, birthDateLocal }: { items: DashaTimelineItem[]; lang: Lang; birthDateLocal?: string | null }) {
  if (items.length === 0) return null;
  const rangeStart = new Date(`${items[0].startDate}T00:00:00`).getTime();
  const rangeEnd = new Date(`${items[items.length - 1].endDate}T00:00:00`).getTime();
  const totalMs = Math.max(rangeEnd - rangeStart, 1);
  const marks = [...items.map((m) => m.startDate), items[items.length - 1].endDate];
  let lastLeft = -100;
  return (
    <div style={{ position: "relative", height: "30px" }}>
      {marks.map((iso, i) => {
        const left = Math.max(0, Math.min(100, ((new Date(`${iso}T00:00:00`).getTime() - rangeStart) / totalMs) * 100));
        if (left - lastLeft < 6) return null;
        lastLeft = left;
        const isLast = i === marks.length - 1;
        const age = ageAtDate(birthDateLocal ?? undefined, iso);
        return (
          <div
            key={`${iso}-${i}`}
            style={{
              position: "absolute",
              left: `${left}%`,
              transform: isLast ? "translateX(-100%)" : left === 0 ? "none" : "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: isLast ? "flex-end" : left === 0 ? "flex-start" : "center",
              gap: "1px",
            }}
          >
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-faint)" }}>{iso.slice(0, 4)}</span>
            {age !== null && (
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-faint)", opacity: 0.65 }}>
                {lang === "ta" ? `வயது ${age}` : `age ${age}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Countdown readout — exact days left in the running antaram, the
      finest-grained "where am I right now" number the timeline can give. ── */
function HyDashaCountdown({ lang, period, today }: { lang: Lang; period: { startDate: string; endDate: string }; today: string }) {
  const totalDays = Math.max(dashaTotalDays(period), 1);
  const elapsedDays = Math.min(Math.max(dashaDaysBetween(period.startDate, today), 0), totalDays);
  const daysLeft = totalDays - elapsedDays;
  const pct = (elapsedDays / totalDays) * 100;
  const endLabel = new Date(`${period.endDate}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-1_5)", minWidth: "148px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-1_5)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 600, color: "var(--color-accent-strong)", lineHeight: 1 }}>{daysLeft}</span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>{lang === "ta" ? "நாட்கள் மீதம்" : "days left"}</span>
      </div>
      <div style={{ width: "100%", height: "5px", borderRadius: "3px", background: "color-mix(in srgb, var(--color-text-strong) 12%, transparent)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: "var(--color-accent)" }} />
      </div>
      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", whiteSpace: "nowrap" }}>
        {lang === "ta" ? `${elapsedDays} / ${totalDays} நாட்கள்` : `${elapsedDays} of ${totalDays} days`} · {lang === "ta" ? "முடிவு" : "ends"} {endLabel}
      </span>
    </div>
  );
}

/* ── Dasha timeline — the three nested Vimshottari levels as proportional
      Gantt bars: every mahadasha of the life sized by its own duration, the
      bhuktis inside the running one, and the antarams inside the running
      bhukti. Data is the same DashaTimelineItem[] the Dasa·Bhukti detail
      already uses — no extra fetch. ──────────────────────────────────────── */
export function HyBhuktiTimeline({
  lang,
  dasha,
  dashaMaha,
  dashaAntar,
  today,
  birthDateLocal,
  dashaSupportText,
  onOpenForecast,
}: {
  lang: Lang;
  dasha: DashaTimelineResponseData | null;
  dashaMaha?: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  today: string;
  birthDateLocal?: string | null;
  dashaSupportText?: BiText | null;
  onOpenForecast?: () => void;
}) {
  if (!dasha) return null;
  const maha = dasha.current.mahadasha;
  const activeBhukti = dasha.current.antardasha;
  const activeAntaram = dasha.current.pratyantardasha;

  // The engine builds TWO full Vimshottari cycles (18 mahadashas, ~240 years)
  // so long-range period lookups resolve — but a life only ever runs one. Show
  // the first cycle: 9 mahadashas, the 120 years from birth the almanac prints.
  const VIMSHOTTARI_CYCLE_MAHADASHAS = 9;
  const mahas = (dashaMaha?.timeline ?? []).filter((x) => x.level === "maha").slice(0, VIMSHOTTARI_CYCLE_MAHADASHAS);
  const bhuktis = dashaAntar.length > 0 ? dashaAntar : dasha.timeline.filter((x) => x.level === "antar");
  const antarams = dasha.timeline.filter((x) => x.level === "pratyantar");

  const fmt = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { month: "short", year: "numeric" });
  };
  // Antarams run days-to-months, so month/year would collapse several of them
  // into the same label — these need day precision.
  const fmtDay = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "2-digit" });
  };
  const isActive = (b: DashaTimelineItem) => b.startDate <= today && today < b.endDate;
  const mahaWord = lang === "ta" ? "மகாதசை" : "Mahadasha";
  const bhuktiWord = t("bhukti_word", lang);
  const periodsWord = lang === "ta" ? "காலகட்டங்கள்" : "chapters";
  const subPeriodsWord = lang === "ta" ? "துணைக் காலங்கள்" : "sub-periods";
  const todayMarkerLabel = `${lang === "ta" ? "இன்று" : "Today"} · ${new Date(`${today}T00:00:00`).toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <Card style={{ padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* Right now — the running stack at every depth, stated first, with the
          most specific level (the antaram) picked out in gold and its exact
          days-remaining count alongside. The bands below are the detail
          behind it (mahadashas -> bhuktis -> antarams, each nested in the last). */}
      {/* `flexDirection: "row"` is load-bearing: `.ui-card` sets
          `flex-direction: column`, so without it the children stack and the
          text block's `flex-basis` resolves against the HEIGHT — which
          ballooned this hero to ~330px of dead space. */}
      <Card variant="accent" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4) var(--space-6)", borderRadius: "var(--radius-lg)", padding: "var(--space-4) var(--space-5)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)", flex: "1 1 320px", minWidth: 0 }}>
          <Kicker>{lang === "ta" ? "இப்போது" : "Right now"}</Kicker>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--color-text-strong)", lineHeight: 1.25 }}>
            {tPlanetLord(maha.lord, lang)} {mahaWord} · {tPlanetLord(activeBhukti.lord, lang)} {bhuktiWord} ·{" "}
            <span style={{ color: "var(--color-accent-strong)" }}>{tPlanetLord(activeAntaram.lord, lang)} {t("antaram_word", lang)}</span>
          </p>
          {dashaSupportText && (dashaSupportText.en || dashaSupportText.ta) && (
            <p style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.5 }}>
              {lang === "ta" ? dashaSupportText.ta : dashaSupportText.en}
            </p>
          )}
        </div>
        <HyDashaCountdown lang={lang} period={activeAntaram} today={today} />
      </Card>

      {mahas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <HyDashaLevelHeader
            label={mahaWord}
            meta={`${mahas.length} ${periodsWord} · ${dashaSpanYears({ startDate: mahas[0].startDate, endDate: mahas[mahas.length - 1].endDate }, lang)}`}
            rangeLabel={`${fmt(mahas[0].startDate)} – ${fmt(mahas[mahas.length - 1].endDate)}`}
          />
          <HyDashaBarRow
            items={mahas}
            lang={lang}
            today={today}
            isActiveItem={(m) => isActive(m) || (!mahas.some(isActive) && m.lord === maha.lord)}
            durationLabel={(item) => dashaYearsLabel(item, lang)}
            todayLabel={todayMarkerLabel}
            axis={<HyDashaAxisTicks items={mahas} lang={lang} birthDateLocal={birthDateLocal} />}
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingLeft: "var(--space-4)" }}>
        <HyDashaLevelHeader
          depth={1}
          label={lang === "ta" ? `${tPlanetLord(maha.lord, lang)} ${mahaWord}க்குள் ${bhuktiWord}` : `${bhuktiWord} within ${tPlanetLord(maha.lord, lang)} ${mahaWord}`}
          meta={`${bhuktis.length} ${subPeriodsWord} · ${dashaSpanYears(maha, lang)}`}
          rangeLabel={`${fmt(maha.startDate)} – ${fmt(maha.endDate)}`}
        />
        <HyDashaBarRow
          items={bhuktis}
          lang={lang}
          today={today}
          isActiveItem={(b) => isActive(b) || (dashaAntar.length === 0 && b.lord === activeBhukti.lord)}
          durationLabel={(item) => dashaYearMonthLabel(item, lang)}
        />
      </div>

      {antarams.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingLeft: "var(--space-7)" }}>
          <HyDashaLevelHeader
            depth={2}
            label={lang === "ta" ? `${tPlanetLord(activeBhukti.lord, lang)} ${bhuktiWord}க்குள் ${t("antaram_word", lang)}` : `${t("antaram_word", lang)} within ${tPlanetLord(activeBhukti.lord, lang)} ${bhuktiWord}`}
            meta={`${antarams.length} ${subPeriodsWord} · ${dashaSpanDays(activeBhukti, lang)}`}
            rangeLabel={`${fmtDay(activeBhukti.startDate)} – ${fmtDay(activeBhukti.endDate)}`}
          />
          <HyDashaBarRow
            items={antarams}
            lang={lang}
            today={today}
            isActiveItem={(a) => isActive(a) || (!antarams.some(isActive) && a.lord === activeAntaram.lord)}
            durationLabel={(item) => dashaDaysLabel(item, lang)}
            height={48}
          />
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
          <HyDashaLegendSwatch tone="active" label={lang === "ta" ? "இப்போது இருக்கும் இடம்" : "where you are now"} />
          <HyDashaLegendSwatch tone="past" label={lang === "ta" ? "கடந்தது" : "already lived"} />
          <HyDashaLegendSwatch tone="future" label={lang === "ta" ? "இன்னும் வரவில்லை" : "still ahead"} />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
            {lang === "ta" ? "அகலம் = கால அளவு" : "bar width = duration"}
          </span>
        </div>
        {onOpenForecast && (
          <button
            type="button"
            onClick={onOpenForecast}
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            {lang === "ta" ? "வரும் ஆண்டு முன்னறிவிப்பு" : "See the year-ahead forecast"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
      </div>
    </Card>
  );
}

/* ── Lucky number & colour (Tamil thirukanitham) ─────────────────────────
   The classical *daily* almanac basis — NOT a birth constant. A printed
   panchangam keys the day's அதிர்ஷ்ட எண் / நிறம் to the **vaara adhipathi**
   (the weekday's ruling graha), and takes a secondary favourable number from
   the day's **natchathira adhipathi** (the lord of the nakshatra the Moon is
   transiting today). Both change every day. Each graha carries its classical
   number (Suriyan 1 … Chevvai 9) and colour. Swatch hexes are planet-identity
   colours (theme-independent, like the orb gradients above). ──────────── */
const PLANET_LUCKY_NUMBER: Record<string, number> = {
  SUN: 1, MOON: 2, JUPITER: 3, RAHU: 4, MERCURY: 5, VENUS: 6, KETU: 7, SATURN: 8, MARS: 9,
};
const PLANET_LUCKY_COLOUR: Record<string, { en: string; ta: string; swatch: string }> = {
  SUN: { en: "Orange · Copper", ta: "ஆரஞ்சு · செம்பு", swatch: "var(--swatch-sun)" },
  MOON: { en: "White · Cream", ta: "வெள்ளை · கிரீம்", swatch: "var(--swatch-moon)" },
  MARS: { en: "Red · Coral", ta: "சிவப்பு · பவளம்", swatch: "var(--swatch-mars)" },
  MERCURY: { en: "Green", ta: "பச்சை", swatch: "var(--swatch-mercury)" },
  JUPITER: { en: "Yellow · Gold", ta: "மஞ்சள் · தங்கம்", swatch: "var(--swatch-jupiter)" },
  VENUS: { en: "White · Rose", ta: "வெள்ளை · ரோஜா", swatch: "var(--swatch-venus)" },
  SATURN: { en: "Blue · Black", ta: "நீலம் · கருப்பு", swatch: "var(--swatch-saturn)" },
  RAHU: { en: "Smoke Grey", ta: "புகை சாம்பல்", swatch: "var(--swatch-rahu)" },
  KETU: { en: "Grey · Brown", ta: "சாம்பல் · பழுப்பு", swatch: "var(--swatch-ketu)" },
};

/* The panchangam serves Jupiter's weekday lord as "GURU"; other surfaces use
   Sanskrit/Tamil spellings. The lucky tables + tPlanetLord all key off the
   canonical graha code, so fold every alias to it once, here. */
const GRAHA_ALIASES: Record<string, string> = {
  GURU: "JUPITER", BRIHASPATI: "JUPITER",
  CHANDRA: "MOON", SOMA: "MOON",
  SURYA: "SUN", SURYAN: "SUN", RAVI: "SUN",
  BUDHA: "MERCURY", BUDHAN: "MERCURY",
  SHUKRA: "VENUS", SUKRA: "VENUS", SUKRAN: "VENUS",
  SHANI: "SATURN", SANI: "SATURN",
  MANGAL: "MARS", KUJA: "MARS", CHEVVAI: "MARS", ANGARAKA: "MARS",
};
function normalizeGraha(graha: string | null | undefined): string | null {
  if (!graha) return null;
  const up = graha.trim().toUpperCase();
  return GRAHA_ALIASES[up] ?? up;
}

/** The classical lucky number + colour a single graha carries (accepts a
    canonical or aliased code). Used for both the weekday lord and the
    day-nakshatra lord. */
export function luckyForGraha(graha: string | null | undefined):
  { number: number; colour: { en: string; ta: string; swatch: string }; graha: string } | null {
  const g = normalizeGraha(graha);
  if (!g) return null;
  const number = PLANET_LUCKY_NUMBER[g];
  const colour = PLANET_LUCKY_COLOUR[g];
  if (number == null || !colour) return null;
  return { number, colour, graha: g };
}

/* ── "Today for X" quick facts ────────────────────────────────────────────
   Two clearly-separated tiers, so the reader never confuses a *personal* number
   with a *shared* one (the "two competing lucky numbers" report, 2026-07-22):

     • PERSONAL (prominent) — the member's lucky number + colour from their own
       **janma-nakshatra lord** (a birth constant, so it genuinely differs per
       member; fixes "every member shows the same Today card").
     • TODAY / SHARED (one muted line) — the weekday-lord number and the day's
       Moon-nakshatra number. These are almanac facts of the *day*, identical for
       everyone, and are now labelled as such rather than sitting beside the
       personal number with equal weight.

   Rahu Kalam / Yamagandam live in the hero's rhythm card, not here.
   Authored lucky tables — flagged for astrologer review (as elsewhere). */
export function HyTodayFacts({ lang, memberName, memberNakshatraName, weekdayLord, weekdayKey, dayNakshatraName, goodWindow, goodWindowLabel }: {
  lang: Lang;
  /** The member being read — labels the personal lucky number. */
  memberName?: string;
  /** The member's *janma* (birth) nakshatra key, e.g. "SWATHI". Its lord gives a
   *  per-member lucky number/colour (a birth constant, unlike the day almanac). */
  memberNakshatraName?: string | null;
  /** Weekday lord graha code from the day's panchangam (`vara.lord`, e.g. "GURU"). */
  weekdayLord?: string | null;
  /** Weekday key for the caption (`vara.weekday`, e.g. "THURSDAY"). */
  weekdayKey?: string | null;
  /** Uppercase key of the nakshatra the Moon transits today (`nakshatra.name`, e.g. "SWATHI"). */
  dayNakshatraName?: string | null;
  goodWindow?: { start: string; end: string } | null;
  goodWindowLabel?: string;
}) {
  // Personal: the member's own birth-star lord -> differs per member.
  const janmaNum = nakshatraNumberFromName(memberNakshatraName);
  const personal = janmaNum != null ? luckyForGraha(nakshatraLord(janmaNum)) : null;

  // Shared-day almanac: weekday lord + today's Moon-nakshatra lord.
  const dayLucky = luckyForGraha(weekdayLord);
  const dayNakNum = nakshatraNumberFromName(dayNakshatraName);
  const dayStarLord = dayNakNum != null ? luckyForGraha(nakshatraLord(dayNakNum)) : null;

  // Headline is the personal number when the member has a resolvable birth star;
  // otherwise fall back to the day's weekday number so the card is never
  // numberless. `headlineIsPersonal` drives the caption + the shared-line dedupe.
  const headline = personal ?? dayLucky;
  const headlineIsPersonal = personal != null;
  if (!headline && !goodWindow && !dayStarLord) return null;

  const ownerLabel = memberName
    ? (lang === "ta" ? `${memberName} · அதிர்ஷ்ட எண்` : `${memberName}'s lucky number`)
    : (lang === "ta" ? "உங்கள் அதிர்ஷ்ட எண்" : "Your lucky number");
  const ownerColourLabel = memberName
    ? (lang === "ta" ? `${memberName} · அதிர்ஷ்ட நிறம்` : `${memberName}'s lucky colour`)
    : (lang === "ta" ? "உங்கள் அதிர்ஷ்ட நிறம்" : "Your lucky colour");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {headline && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
          <Card style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3)" }}>
            <span style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-accent-strong)", flexShrink: 0, fontFamily: "var(--font-display)" }}>{headline.number}</span>
            <div style={{ minWidth: 0 }}>
              <Kicker as="div" color="var(--color-faint)" style={{ letterSpacing: "0.1em" }}>{headlineIsPersonal ? ownerLabel : (lang === "ta" ? "இன்றைய அதிர்ஷ்ட எண்" : "Lucky number today")}</Kicker>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)", marginTop: "2px" }}>{headline.number} · {tPlanetLord(headline.graha, lang)}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "1px" }}>
                {headlineIsPersonal
                  ? (lang === "ta" ? `பிறப்பு நட்சத்திரம் · ${tNakshatra(memberNakshatraName ?? "", lang)}` : `birth star · ${tNakshatra(memberNakshatraName ?? "", lang)}`)
                  : (weekdayKey ? tWeekday(weekdayKey, lang) : "")}
              </div>
            </div>
          </Card>
          <Card style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3)" }}>
            <span style={{ width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: headline.colour.swatch, border: "1px solid var(--color-border-strong)", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <Kicker as="div" color="var(--color-faint)" style={{ letterSpacing: "0.1em" }}>{headlineIsPersonal ? ownerColourLabel : (lang === "ta" ? "இன்றைய அதிர்ஷ்ட நிறம்" : "Lucky colour today")}</Kicker>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)", marginTop: "2px" }}>{lang === "ta" ? headline.colour.ta : headline.colour.en}</div>
            </div>
          </Card>
        </div>
      )}
      {/* Shared-day almanac — one muted line, explicitly "same for everyone", so
          it reads as context for the day rather than a second personal number. */}
      {(dayLucky || dayStarLord) && (
        <Card variant="dashed" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", borderRadius: "var(--radius-md)", padding: "var(--space-2) var(--space-3)" }}>
          <span style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "var(--radius-sm)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", fontSize: "var(--text-xs)", color: "var(--color-accent-strong)" }}>⋆</span>
          <span style={{ flex: 1, fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.5 }}>
            <b style={{ color: "var(--color-faint)", fontWeight: 700, textTransform: "uppercase", fontSize: "var(--text-xs)", letterSpacing: "0.1em", marginRight: "6px" }}>{lang === "ta" ? "இன்று · அனைவருக்கும்" : "Today · shared"}</b>
            {dayLucky && weekdayKey && (
              <>{tWeekday(weekdayKey, lang)} {lang === "ta" ? `எண் ${dayLucky.number}` : `no. ${dayLucky.number}`}</>
            )}
            {dayLucky && dayStarLord && dayNakshatraName && " · "}
            {dayStarLord && dayNakshatraName && (
              <>{lang === "ta" ? "நட்சத்திரம் " : "star "}<b style={{ color: "var(--color-text)" }}>{tNakshatra(dayNakshatraName, lang)}</b> {lang === "ta" ? `எண் ${dayStarLord.number}` : `no. ${dayStarLord.number}`}</>
            )}
          </span>
        </Card>
      )}
      {goodWindow && (
        <Card variant="high" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "var(--space-3)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
          <span style={{ color: "var(--color-high)", fontSize: "var(--text-sm)" }}>✳</span>
          <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
            {goodWindowLabel ?? (lang === "ta" ? "சிறந்த நேரம் " : "Best window ")}
            <b style={{ color: "var(--color-text-strong)" }}>{formatClockLabel(goodWindow.start)} – {formatClockLabel(goodWindow.end)}</b>
          </span>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Section 7 (Yogas · strengths · remedies) + Section 8 (year-ahead forecast)
   — imported from the Claude Design "Hybrid v2" mockup. Every card below is
   driven by the SAME per-member chart bundle already loaded for this view
   (`reading.explanation`, `reading.transit`) plus one life-areas fetch — no
   engine work is duplicated, only rendered graphically.

   Three pieces below carry authored domain content (planet->trait significations,
   the weekday-tagged remedy fallbacks, and the Moon-gochara transit tone). Each
   is deterministic from real chart data, documented inline, and flagged for
   astrologer review — the same treatment as the daily lucky number/colour
   derivation above.
   ════════════════════════════════════════════════════════════════════════ */

const tl = (lang: Lang, v: BiText): string => (lang === "ta" ? v.ta : v.en);

/* ── 7a · Yoga & dosham quick-status list ─────────────────────────────────
   A compact roll-up of the same yogas + doshams the full panel (§9) renders,
   with one status chip each so a reader sees at a glance what is Active,
   Partial, Mitigated or Inactive. "View all ->" jumps to the full panel. */
type YdTone = "good" | "caution" | "mid" | "muted";
type YdItem = { name: string; status: BiText; tone: YdTone };

const YD_TONE_COLOR: Record<YdTone, { fg: string; bg: string; bd: string }> = {
  good:    { fg: "var(--color-high)", bg: "var(--color-high-bg)", bd: "var(--color-high-border)" },
  caution: { fg: "var(--color-low)",  bg: "var(--color-low-bg)",  bd: "var(--color-low-border)" },
  mid:     { fg: "var(--color-mid)",  bg: "var(--color-mid-bg)",  bd: "var(--color-mid-border)" },
  muted:   { fg: "var(--color-faint)", bg: "transparent",         bd: "var(--color-border)" },
};

function buildYogaDoshaItems(section: ChartExplanationYogaDoshamSection, lang: Lang): YdItem[] {
  const active = (en: string, ta: string, tone: YdTone) => ({ status: { en, ta }, tone });
  const yogaItems: YdItem[] = section.yogas.map((y) => {
    const { status, tone }: { status: BiText; tone: YdTone } = !y.isPresent
      ? active("Inactive", "இல்லை", "muted")
      : y.isCurrentlyActive
      ? active("Active", "செயலில்", "good")
      : y.strength === "PARTIAL"
      ? active("Partial", "பகுதி", "mid")
      : active("Present", "உள்ளது", "good");
    return { name: yogaDoshamDisplayName(y.name, lang), status, tone };
  });
  const doshamItems: YdItem[] = section.doshams.map((d) => {
    const { status, tone }: { status: BiText; tone: YdTone } = !d.isPresent
      ? active("Inactive", "இல்லை", "muted")
      : d.isCancelled
      ? active("Mitigated", "நிவர்த்தி", "good")
      : d.strength === "PARTIAL"
      ? active("Partial", "பகுதி", "mid")
      : active("Active", "செயலில்", "caution");
    return { name: yogaDoshamDisplayName(d.name, lang), status, tone };
  });
  // Present/relevant first (doshams needing attention, then live yogas), a few
  // "Inactive" for context — capped so the card stays a glance, not a table.
  const present = [...doshamItems, ...yogaItems].filter((i) => i.tone !== "muted");
  const inactive = [...doshamItems, ...yogaItems].filter((i) => i.tone === "muted");
  return [...present, ...inactive].slice(0, 6);
}

export function HyYogaDoshaCard({ lang, yogaDosham, onViewAll }: {
  lang: Lang; yogaDosham: ChartExplanationYogaDoshamSection; onViewAll?: () => void;
}) {
  const items = buildYogaDoshaItems(yogaDosham, lang);
  return (
    <Card style={{ padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <Kicker color="var(--color-mid)">{lang === "ta" ? "யோகம் & தோஷம்" : "Yoga & doshas"}</Kicker>
      <div style={{ marginTop: "8px" }}>
        {items.map((it, i) => {
          const c = YD_TONE_COLOR[it.tone];
          return (
            <div key={`${it.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) 0", borderBottom: i < items.length - 1 ? "1px solid var(--color-border)" : "none" }}>
              <span style={{ flex: 1, fontSize: "var(--text-sm)", color: it.tone === "muted" ? "var(--color-faint)" : "var(--color-text)" }}>{it.name}</span>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)", color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, whiteSpace: "nowrap" }}>{tl(lang, it.status)}</span>
            </div>
          );
        })}
      </div>
      {onViewAll && (
        <button type="button" onClick={onViewAll} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", marginTop: "10px", alignSelf: "flex-start", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          {lang === "ta" ? "எல்லா யோகம் & தோஷமும்" : "View all yogas & doshas"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </Card>
  );
}

/* ── 7b · Strengths & watch-outs ──────────────────────────────────────────
   The engine's per-planet positional `strengthScore` (0-100), read through the
   classical significations of each graha. A strong graha lends its bright
   signification; a weak one surfaces its shadow, scored as its shortfall
   (100 − strength) so the bar shows how much attention it asks for. Authored
   trait table — flagged for astrologer review. */
const GRAHA_TRAITS: Record<string, { strength: BiText; shadow: BiText }> = {
  SUN:     { strength: { en: "Leadership & vitality",     ta: "தலைமை & சுறுசுறுப்பு" }, shadow: { en: "Pride / ego",              ta: "அகங்காரம்" } },
  MOON:    { strength: { en: "Emotional warmth & care",   ta: "பாசம் & மனநிறைவு" },   shadow: { en: "Mood swings",             ta: "மனநிலை மாற்றம்" } },
  MARS:    { strength: { en: "Bold initiative & courage", ta: "துணிச்சல் & முன்முயற்சி" }, shadow: { en: "Impatience / temper",   ta: "பொறுமையின்மை" } },
  MERCURY: { strength: { en: "Research ability & wit",    ta: "ஆய்வுத்திறன் & நுண்ணறிவு" }, shadow: { en: "Overthinking / restless", ta: "அதிக சிந்தனை" } },
  JUPITER: { strength: { en: "Philosophical depth",       ta: "ஞானம் & ஆழம்" },       shadow: { en: "Overpromising / excess", ta: "மிகை உறுதிமொழி" } },
  VENUS:   { strength: { en: "Harmony, charm & artistry", ta: "இணக்கம் & கலைத்திறன்" }, shadow: { en: "Comfort-seeking",        ta: "சொகுசு நாட்டம்" } },
  SATURN:  { strength: { en: "Discipline & endurance",    ta: "ஒழுக்கம் & விடாமுயற்சி" }, shadow: { en: "Delay & worry",         ta: "தாமதம் & கவலை" } },
  RAHU:    { strength: { en: "Networks & worldly gains",  ta: "தொடர்புகள் & ஆதாயம்" }, shadow: { en: "Excessive wandering",    ta: "அலைபாய்தல்" } },
  KETU:    { strength: { en: "Intuition & detachment",    ta: "உள்ளுணர்வு & விரக்தி" }, shadow: { en: "Withdrawal / doubt",     ta: "தனிமை & குழப்பம்" } },
};
const STRENGTH_CUTOFF = 55; // ≥ lends a strength; below surfaces a watch-out.

// `score` is the value the bar renders. For a strength it is the graha's raw
// strengthScore (higher = brighter); for a watch-out it is the *shortfall*
// (100 − strength: higher = more attention). The colour is decided per-row by
// `mode`, so a strength bar is never painted a flat green regardless of value.
type TraitRow = { label: BiText; score: number };
export function deriveStrengthsWatchouts(planets: Pick<ChartExplanationPlanet, "graha" | "strengthScore">[]):
  { strengths: TraitRow[]; watchOuts: TraitRow[] } {
  const withTrait = planets.filter((p) => GRAHA_TRAITS[p.graha]);
  const byStrengthDesc = [...withTrait].sort((a, b) => b.strengthScore - a.strengthScore);
  // A strength must actually clear the cutoff — we never label a weak graha a
  // "strength". If nothing clears it (a heavily afflicted chart) fall back to
  // the two least-weak grahas so the panel is never empty, and let the bar
  // colour tell the real story (they'll read amber/red, not green).
  let strong = byStrengthDesc.filter((p) => p.strengthScore >= STRENGTH_CUTOFF).slice(0, 4);
  if (strong.length === 0) strong = byStrengthDesc.slice(0, 2);
  const strengths = strong.map((p) => ({ label: GRAHA_TRAITS[p.graha]!.strength, score: Math.round(p.strengthScore) }));
  const watchOuts = [...withTrait]
    .filter((p) => p.strengthScore < STRENGTH_CUTOFF)
    .sort((a, b) => a.strengthScore - b.strengthScore)
    .slice(0, 3)
    .map((p) => ({ label: GRAHA_TRAITS[p.graha]!.shadow, score: Math.max(0, Math.min(100, Math.round(100 - p.strengthScore))) }));
  return { strengths, watchOuts };
}

/* Placement & dignity signals — a second, factual layer beneath the trait bars
   so the card carries real classical criteria (not just the strength score) and
   fills its space. Every chip is read straight off the engine's per-planet
   fields: dignity (exalted / moolatrikona / own-sign / debilitated), vargottama
   (D1=D9), cazimi (heart of the Sun), combustion and retrogression, plus the
   count of planets in Kendra/Trikona vs. Dusthana. No authored interpretation —
   these are chart facts, so they need no astrologer sign-off. */
/** Rahu and Ketu are always retrograde — the flag carries no signal for them. */
const PERPETUALLY_RETROGRADE = new Set(["RAHU", "KETU"]);

const DIGNITY_WORD: Record<string, BiText> = {
  EXALTED: { en: "exalted", ta: "உச்சம்" },
  MOOLATRIKONA: { en: "moolatrikona", ta: "மூலத்திரிகோணம்" },
  OWN_SIGN: { en: "own sign", ta: "சொந்த ராசி" },
  DEBILITATED: { en: "debilitated", ta: "நீசம்" },
};
export type PlacementChip = { label: string; tone: "good" | "warn" };
export function derivePlacementSignals(
  planets: ChartExplanationPlanet[],
  lang: Lang,
): { boosts: PlacementChip[]; cautions: PlacementChip[]; kendraTrikona: number; dusthana: number } {
  const boosts: PlacementChip[] = [];
  const cautions: PlacementChip[] = [];
  let kendraTrikona = 0;
  let dusthana = 0;
  const push = (arr: PlacementChip[], graha: string, reason: string, tone: "good" | "warn") =>
    arr.push({ label: `${tPlanetLord(graha, lang)} · ${reason}`, tone });
  for (const p of planets) {
    if (p.houseGroup === "KENDRA" || p.houseGroup === "TRIKONA") kendraTrikona += 1;
    if (p.houseGroup === "DUSTHANA") dusthana += 1;
    const dig = DIGNITY_WORD[p.dignity];
    if (dig && (p.dignity === "EXALTED" || p.dignity === "MOOLATRIKONA" || p.dignity === "OWN_SIGN")) {
      push(boosts, p.graha, tl(lang, dig), "good");
    }
    if (p.isVargottama) push(boosts, p.graha, t("flag_vargottamam", lang), "good");
    if (p.isCazimi) push(boosts, p.graha, t("flag_cazimi", lang), "good");
    if (p.dignity === "DEBILITATED") push(cautions, p.graha, tl(lang, DIGNITY_WORD.DEBILITATED!), "warn");
    if (p.isCombust) push(cautions, p.graha, t("flag_astam", lang), "warn");
    if (p.isRetrograde && !PERPETUALLY_RETROGRADE.has(p.graha)) {
      push(cautions, p.graha, t("flag_vakra", lang), "warn");
    }
    // Graha yuddham was scored (-15 to the loser) long before it was ever shown.
    if (p.isPlanetaryWar && p.warOutcome === "LOST") {
      push(cautions, p.graha, lang === "ta" ? "கிரக யுத்தம்" : "Graha yuddham", "warn");
    }
  }
  return { boosts: boosts.slice(0, 6), cautions: cautions.slice(0, 6), kendraTrikona, dusthana };
}

function TraitBars({ rows, mode, lang }: { rows: TraitRow[]; mode: "strength" | "watch"; lang: Lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {rows.map((r, i) => {
        // Strength: colour by the score's own band (scoreColor) so a borderline
        // graha isn't dressed up as green. Watch-out: red — every row here is a
        // genuine shortfall below the cutoff.
        const color = mode === "watch" ? "var(--color-low)" : scoreColor(r.score);
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 90px 26px", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tl(lang, r.label)}</span>
            <span style={{ height: "6px", borderRadius: "var(--radius-sm)", background: "var(--color-border)" }}>
              <span style={{ display: "block", width: `${Math.max(4, Math.min(100, r.score))}%`, height: "100%", borderRadius: "var(--radius-sm)", background: color }} />
            </span>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color, textAlign: "right" }}>{r.score}</span>
          </div>
        );
      })}
    </div>
  );
}

function PlacementChips({ chips }: { chips: PlacementChip[] }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
      {chips.map((c, i) => {
        const fg = c.tone === "good" ? "var(--color-high)" : "var(--color-low)";
        const bg = c.tone === "good" ? "var(--color-high-bg)" : "var(--color-low-bg)";
        const bd = c.tone === "good" ? "var(--color-high-border)" : "var(--color-low-border)";
        return (
          <span key={`${c.label}-${i}`} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: fg, background: bg, border: `1px solid ${bd}`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)", whiteSpace: "nowrap" }}>{c.label}</span>
        );
      })}
    </div>
  );
}

export function HyStrengthsWatchoutsCard({ lang, planets }: {
  lang: Lang; planets: ChartExplanationPlanet[];
}) {
  const { strengths, watchOuts } = deriveStrengthsWatchouts(planets);
  const { boosts, cautions, kendraTrikona, dusthana } = derivePlacementSignals(planets, lang);
  if (strengths.length === 0 && watchOuts.length === 0 && boosts.length === 0 && cautions.length === 0) return null;
  return (
    <Card style={{ padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <Kicker color="var(--color-mid)">{lang === "ta" ? "பலம் & கவனிக்க வேண்டியவை" : "Strengths & watch-outs"}</Kicker>

      {/* Structural summary — kendra/trikona (angular & trinal, strong) vs.
          dusthana (6·8·12, testing) occupancy, straight off houseGroup. */}
      <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Card variant="high" style={{ display: "block", flex: "1 1 120px", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3)" }}>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--color-high)", lineHeight: 1 }}>{kendraTrikona}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "3px" }}>{lang === "ta" ? "கேந்திர/திரிகோணத்தில் கிரகங்கள்" : "planets in Kendra / Trikona"}</div>
        </Card>
        <Card variant={dusthana > 0 ? "low" : "default"} style={{ display: "block", flex: "1 1 120px", background: dusthana > 0 ? undefined : "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-3)" }}>
          <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, fontFamily: "var(--font-display)", color: dusthana > 0 ? "var(--color-low)" : "var(--color-faint)", lineHeight: 1 }}>{dusthana}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "3px" }}>{lang === "ta" ? "துஸ்தானத்தில் (6·8·12) கிரகங்கள்" : "planets in Dusthana (6·8·12)"}</div>
        </Card>
      </div>

      {strengths.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Kicker color="var(--color-high)">{lang === "ta" ? "பலங்கள்" : "Strengths"}</Kicker>
          <TraitBars rows={strengths} mode="strength" lang={lang} />
        </div>
      )}
      {watchOuts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Kicker color="var(--color-low)">{lang === "ta" ? "கவனிக்க வேண்டியவை" : "Watch-outs"}</Kicker>
          <TraitBars rows={watchOuts} mode="watch" lang={lang} />
        </div>
      )}

      {/* Dignity & special-placement facts — exaltation/own-sign, vargottama,
          cazimi (boosts) vs. debilitation, combustion, retrogression (cautions). */}
      {(boosts.length > 0 || cautions.length > 0) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3_5)" }}>
          <Kicker color="var(--color-mid)">{lang === "ta" ? "நிலை & தனிச்சிறப்பு" : "Dignity & placement"}</Kicker>
          {boosts.length > 0 && <PlacementChips chips={boosts} />}
          {cautions.length > 0 && <PlacementChips chips={cautions} />}
        </div>
      )}
    </Card>
  );
}

/* ── 7c · Remedies this week ──────────────────────────────────────────────
   Anchored on the weakest grahas (they most need support), each remedy is
   tagged with the weekday that graha rules — the day its worship/daanam is
   traditionally done. The engine's own per-planet remedy facet is preferred
   when present; a canonical per-graha fallback keeps the card populated.
   Authored fallbacks + weekday mapping — flagged for astrologer review. */
const GRAHA_WEEKDAY: Record<string, string> = {
  SUN: "SUNDAY", MOON: "MONDAY", MARS: "TUESDAY", MERCURY: "WEDNESDAY",
  JUPITER: "THURSDAY", VENUS: "FRIDAY", SATURN: "SATURDAY",
  RAHU: "SATURDAY", KETU: "TUESDAY", // Rahu/Ketu co-signify Saturday/Tuesday.
};
const GRAHA_REMEDY: Record<string, BiText> = {
  SUN:     { en: "Offer water to the rising Sun; honour your father", ta: "சூரிய நமஸ்காரம்; தந்தையை மதித்தல்" },
  MOON:    { en: "Moon worship · white items · milk daanam",          ta: "சந்திர வழிபாடு · வெண்பொருள் · பால் தானம்" },
  MARS:    { en: "Red-lentil daanam; Hanuman worship (Tue)",          ta: "மைசூர் பருப்பு தானம்; அனுமன் வழிபாடு (செவ்)" },
  MERCURY: { en: "Green-gram daanam (Mercury)",                       ta: "பச்சைப் பயறு தானம் (புதன்)" },
  JUPITER: { en: "Serve teachers; turmeric & yellow-gram offering",   ta: "குரு சேவை; மஞ்சள் · கடலைப்பருப்பு" },
  VENUS:   { en: "White-flower archanai; support the arts",           ta: "வெண்மலர் அர்ச்சனை; கலைகளை ஆதரித்தல்" },
  SATURN:  { en: "Shani lamp + serving elders",                       ta: "சனி தீபம் + பெரியோரை சேவித்தல்" },
  RAHU:    { en: "Feed stray dogs; black-gram daanam",                ta: "நாய்களுக்கு உணவு; உளுந்து தானம்" },
  KETU:    { en: "Feed birds; quiet charity to the needy",            ta: "பறவைகளுக்கு உணவு; அமைதியான தானம்" },
};
const GRAHA_GLYPH_R: Record<string, string> = GRAHA_GLYPH;

type RemedyRow = { graha: string; text: BiText; weekdayKey: string | null };
export function deriveWeeklyRemedies(planets: ChartExplanationPlanet[]): RemedyRow[] {
  // Anchor on the weakest grahas (they most need support) and use the canonical
  // per-*natal*-graha remedy. We deliberately DON'T read the engine's `remedy`
  // facet here: that facet is a *transit-contact* remedy keyed to whichever slow
  // transiting planet (Mars/Jupiter/Saturn/Rahu/Ketu) is touching this natal
  // planet right now — so when one transiting planet contacts several natal
  // planets at once, every row rendered the identical transit remedy text while
  // still showing each natal planet's own weekday tag (the "same text, three
  // different days" bug, 2026-07-22). Keyed per natal graha, each row is
  // distinct and its text agrees with its weekday tag.
  const rows = [...planets]
    .filter((p) => GRAHA_REMEDY[p.graha])
    .sort((a, b) => a.strengthScore - b.strengthScore)
    .slice(0, 3)
    .map((p) => ({ graha: p.graha, text: GRAHA_REMEDY[p.graha]!, weekdayKey: GRAHA_WEEKDAY[p.graha] ?? null }));
  return rows;
}

export function HyRemediesCard({ lang, planets, onViewAll }: {
  lang: Lang; planets: ChartExplanationPlanet[]; onViewAll?: () => void;
}) {
  const rows = deriveWeeklyRemedies(planets);
  return (
    <Card style={{ padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <Kicker color="var(--color-accent-strong)">{lang === "ta" ? "இந்த வார பரிகாரம்" : "Remedies this week"}</Kicker>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {rows.map((r) => (
          <div key={r.graha} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", fontSize: "var(--text-base)", color: "var(--color-accent-strong)" }}>{GRAHA_GLYPH_R[r.graha] ?? "⋔"}</span>
            <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.45 }}>{tl(lang, r.text)}</span>
            {r.weekdayKey && (
              <span style={{ flexShrink: 0, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)", whiteSpace: "nowrap" }}>
                {tWeekday(r.weekdayKey, lang)}
              </span>
            )}
          </div>
        ))}
        {/* A daily household practice — a shared Tamil custom, not chart-derived. */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", fontSize: "var(--text-base)", color: "var(--color-accent-strong)" }}>✧</span>
          <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--color-text)", lineHeight: 1.45 }}>{lang === "ta" ? "வீட்டில் குல தெய்வத்திற்கு கற்பூரம்" : "Kula deivam camphor at home"}</span>
          <span style={{ flexShrink: 0, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)", whiteSpace: "nowrap" }}>{lang === "ta" ? "தினமும்" : "Daily"}</span>
        </div>
      </div>
      {onViewAll && (
        <button type="button" onClick={onViewAll} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", marginTop: "2px", alignSelf: "flex-start", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          {lang === "ta" ? "எல்லா பரிகாரமும்" : "View all remedies"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </Card>
  );
}

/* ── 8a · Life-area forecast table ────────────────────────────────────────
   Current state -> +6mo -> +12mo. Every column is a REAL engine score: the
   backend re-runs the same prediction at each future date (actual transits +
   the dasha/antardasha in force then) and returns score6mo / score12mo. No
   cosmetic slope — the columns can and do disagree with each other and move
   with the guidance. Flagged for astrologer review. */
// Verdict bands MUST nest inside the canonical four-band colour palette
// (scoreBandColor: ≥70 dark green · 65–69 light green · 50–64 gold · <50 red),
// so a word never straddles a colour boundary — "Good" was 58+, which spanned
// the 65 green/gold cutoff and drew orange at 58–64, green at 65+ (the same word,
// two colours, one column). Each band below sits wholly within one colour band;
// keep it that way if you retune. See web/lib/format.ts:88.
const VERDICT_SCALE: { min: number; label: BiText }[] = [
  { min: 80, label: { en: "Excellent",  ta: "மிகச்சிறந்தது" } }, // dark green
  { min: 70, label: { en: "Very good",  ta: "மிக நல்லது" } },   // dark green
  { min: 65, label: { en: "Good",       ta: "நல்லது" } },        // light green
  { min: 58, label: { en: "Favourable", ta: "சாதகம்" } },        // gold
  { min: 50, label: { en: "Stable",     ta: "நிலையானது" } },     // gold
  { min: 40, label: { en: "Average",    ta: "சராசரி" } },        // red
  { min: 0,  label: { en: "Needs care", ta: "கவனம் தேவை" } },    // red
];
function verdictFor(score: number): BiText {
  return (VERDICT_SCALE.find((v) => score >= v.min) ?? VERDICT_SCALE[VERDICT_SCALE.length - 1]!).label;
}
const TREND_ICON: Record<string, typeof TrendingUp> = { UP: TrendingUp, DOWN: TrendingDown, STABLE: Minus };
function TrendGlyph({ trend, color }: { trend: string; color: string }) {
  const Icon = TREND_ICON[trend];
  if (!Icon) return null;
  return (
    <span title={trend} style={{ display: "inline-flex", color }}>
      <Icon size={12} strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}

/* Which areas lead the default (collapsed) view, by life stage. "Best and apt"
   for the person's age: the areas that carry the most weight at that stage go
   first, the rest fold behind "show more". Goal-focus areas always lead,
   regardless of stage. Mirrors the engine's own phase-relevance intent. */
const AREA_PRIORITY_BY_STAGE: { maxAge: number; order: string[] }[] = [
  { maxAge: 17,       order: ["EDUCATION", "HEALTH", "FAMILY_HARMONY", "SPIRITUAL", "RELATIONSHIPS", "FOREIGN", "CAREER"] },
  { maxAge: 35,       order: ["CAREER", "MONEY", "HEALTH", "RELATIONSHIPS", "EDUCATION", "FAMILY_HARMONY", "PROPERTY"] },
  { maxAge: 55,       order: ["CAREER", "MONEY", "HEALTH", "RELATIONSHIPS", "FAMILY_HARMONY", "CHILDREN", "PROPERTY"] },
  { maxAge: Infinity, order: ["HEALTH", "SPIRITUAL", "FAMILY_HARMONY", "MONEY", "RELATIONSHIPS", "PROPERTY", "FOREIGN"] },
];
function areaPriorityOrder(age: number | null | undefined): string[] {
  if (age == null) return AREA_PRIORITY_BY_STAGE[1]!.order;
  return (AREA_PRIORITY_BY_STAGE.find((s) => age <= s.maxAge) ?? AREA_PRIORITY_BY_STAGE[3]!).order;
}
const FORECAST_DEFAULT_COUNT = 7;
// Compact/preview cap for the Family & Charts page — the full row set + deep
// per-area analysis lives in Life Areas.
const FORECAST_PREVIEW_COUNT = 5;

function ForecastCell({ score, lang }: { score: number; lang: Lang }) {
  const color = scoreColor(score);
  return <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color }}>{tl(lang, verdictFor(score))}</span>;
}

export function HyLifeAreaForecast({ lang, areas, age, onOpenLifeAreas, compact = false }: {
  lang: Lang; areas: LifeAreaData[] | null; age: number | null | undefined; onOpenLifeAreas?: () => void;
  /** Preview mode (used on the Family & Charts page): caps the row set and
   *  removes the in-place expand, so the *full* horizon is only ever rendered
   *  in its canonical home (Life Areas -> Predictions) which links out via
   *  `onOpenLifeAreas`. Keeps a single home for the full artifact (IA audit
   *  2026-07-22, Phase 1/2). */
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cols = "1.1fr 0.9fr 0.9fr 0.9fr 1.6fr";

  // Life-stage relevance comes straight from the engine (`ageRelevant`), not a
  // client-side re-derivation — so the row set can't disagree with the guidance
  // the engine wrote (e.g. showing a "Stable" verdict next to a "not applicable
  // at this stage" note). Absent flag (older cached payload) ⇒ treat as shown.
  const relevant = (areas ?? []).filter((a) => a.ageRelevant !== false);
  // Rank by aptness for this life stage: goal-focus first, then the stage's
  // priority order, then any remaining relevant areas in their engine order.
  const priority = areaPriorityOrder(age);
  const rankOf = (a: LifeAreaData) => {
    if (a.isGoalFocus) return -1;
    const i = priority.indexOf(a.area);
    return i === -1 ? 100 : i;
  };
  const ordered = relevant
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rankOf(x.a) - rankOf(y.a) || x.i - y.i)
    .map((x) => x.a);

  // Preview mode never expands in place — it caps hard and defers the rest to
  // the canonical full home via `onOpenLifeAreas`.
  const previewCount = compact ? FORECAST_PREVIEW_COUNT : FORECAST_DEFAULT_COUNT;
  const shown = !compact && expanded ? ordered : ordered.slice(0, previewCount);
  const hiddenCount = ordered.length - shown.length;
  // Real forward scores; fall back to the current score (flat, honest) only if
  // an older response predates the projected fields.
  const scoreAt = (a: LifeAreaData, horizon: "s6" | "s12") =>
    (horizon === "s6" ? a.score6mo : a.score12mo) ?? a.score;

  return (
    <Card style={{ display: "block", overflow: "hidden", padding: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, columnGap: "var(--space-3)", padding: "var(--space-3) var(--space-5)", background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderBottom: "1px solid var(--color-border)", fontSize: "var(--text-xs)", letterSpacing: "0.1em", fontWeight: 700, color: "var(--color-faint)", textTransform: "uppercase" }}>
        <span>{lang === "ta" ? "வாழ்க்கைத் துறை" : "Life area"}</span>
        <span>{lang === "ta" ? "தற்போது" : "Current"}</span>
        <span>{lang === "ta" ? "6 மாதம்" : "Next 6 mo"}</span>
        <span>{lang === "ta" ? "12 மாதம்" : "Next 12 mo"}</span>
        <span>{lang === "ta" ? "வழிகாட்டுதல்" : "Guidance"}</span>
      </div>
      {shown.length === 0 ? (
        <div style={{ padding: "var(--space-5) var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
          {areas == null ? (lang === "ta" ? "ஏற்றுகிறது…" : "Loading forecast…") : (lang === "ta" ? "இந்த வயதுக்கு துறை முன்னறிவிப்பு இல்லை." : "No area forecast for this age yet.")}
        </div>
      ) : (
        shown.map((a) => (
          <div key={a.area} style={{ display: "grid", gridTemplateColumns: cols, columnGap: "var(--space-3)", alignItems: "center", padding: "var(--space-3) var(--space-5)", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-strong)" }}>
              {tl(lang, a.label)}
              <TrendGlyph trend={a.trend} color={scoreColor(a.score)} />
            </span>
            <ForecastCell score={a.score} lang={lang} />
            <ForecastCell score={scoreAt(a, "s6")} lang={lang} />
            <ForecastCell score={scoreAt(a, "s12")} lang={lang} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", lineHeight: 1.45 }}>{tl(lang, a.next30DayOutlook)}</span>
          </div>
        ))
      )}
      {/* Two distinct intents, deliberately not conflated:
          — primary, inline: show the remaining rows in place (keeps context);
          — secondary: leave for the deep per-area analysis on the Life Areas tab. */}
      {((!compact && (hiddenCount > 0 || expanded)) || onOpenLifeAreas) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-3) var(--space-5)" }}>
          {!compact && (hiddenCount > 0 || expanded) ? (
            <button type="button" onClick={() => setExpanded((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              {expanded
                ? (<>{lang === "ta" ? "குறைவாகக் காட்டு" : "Show fewer"}<ChevronUp size={14} strokeWidth={2} aria-hidden="true" /></>)
                : (<>{lang === "ta" ? `மேலும் ${hiddenCount} துறை` : `Show ${hiddenCount} more area${hiddenCount === 1 ? "" : "s"}`}<ChevronDown size={14} strokeWidth={2} aria-hidden="true" /></>)}
            </button>
          ) : compact && hiddenCount > 0 ? (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {lang === "ta" ? `+${hiddenCount} மேலும் துறை` : `+${hiddenCount} more area${hiddenCount === 1 ? "" : "s"}`}
            </span>
          ) : <span />}
          {onOpenLifeAreas && (
            <button type="button" onClick={onOpenLifeAreas} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-muted)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, whiteSpace: "nowrap" }}>
              {lang === "ta" ? "முழு பகுப்பாய்வு" : "Open full analysis"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

/* ── 8b · Transit overview ────────────────────────────────────────────────
   The slow movers (+ Sun) from the member's live transit snapshot, each read
   through classical Moon-gochara: the upachaya houses (3·6·10·11 from the
   Moon) run favourable, the 8th/12th ask for care, the rest hold steady. A
   retrograde or combust transit is nudged toward caution. Flagged for
   astrologer review. */
const TRANSIT_ORDER = ["JUPITER", "SATURN", "RAHU", "KETU", "SUN"];
const UPACHAYA_FROM_MOON = new Set([3, 6, 10, 11]);
const DUSTHANA_FROM_MOON = new Set([8, 12]);
const HOUSE_THEME: Record<number, BiText> = {
  1: { en: "self & vitality", ta: "தன்மை & உடல்நலம்" },
  2: { en: "wealth & speech", ta: "செல்வம் & பேச்சு" },
  3: { en: "effort & siblings", ta: "முயற்சி & உடன்பிறப்பு" },
  4: { en: "home & comfort", ta: "வீடு & மனநிறைவு" },
  5: { en: "creativity & children", ta: "படைப்பு & குழந்தை" },
  6: { en: "work & rivals", ta: "உழைப்பு & போட்டி" },
  7: { en: "partnership", ta: "கூட்டாண்மை" },
  8: { en: "change & depth", ta: "மாற்றம் & ஆழம்" },
  9: { en: "fortune & dharma", ta: "அதிர்ஷ்டம் & தர்மம்" },
  10: { en: "career & status", ta: "தொழில் & அந்தஸ்து" },
  11: { en: "gains & networks", ta: "ஆதாயம் & தொடர்புகள்" },
  12: { en: "rest & release", ta: "ஓய்வு & விடுதலை" },
};
type GocharaTone = "SUPPORT" | "CAUTION" | "STEADY";
function gocharaTone(houseFromMoon: number, flagged: boolean): GocharaTone {
  if (DUSTHANA_FROM_MOON.has(houseFromMoon)) return "CAUTION";
  if (UPACHAYA_FROM_MOON.has(houseFromMoon)) return flagged ? "STEADY" : "SUPPORT";
  return flagged ? "CAUTION" : "STEADY";
}
const GOCHARA_BADGE: Record<GocharaTone, { label: BiText; fg: string; bg: string; bd: string }> = {
  SUPPORT: { label: { en: "Favourable", ta: "சாதகம்" }, fg: "var(--color-high)", bg: "var(--color-high-bg)", bd: "var(--color-high-border)" },
  CAUTION: { label: { en: "Caution",    ta: "கவனம்" },  fg: "var(--color-low)",  bg: "var(--color-low-bg)",  bd: "var(--color-low-border)" },
  STEADY:  { label: { en: "Steady",     ta: "நிலையானது" }, fg: "var(--color-muted)", bg: "transparent",      bd: "var(--color-border)" },
};

export function HyTransitOverview({ lang, transit, memberName, onOpenTransits }: {
  lang: Lang; transit: TransitSnapshotData | null; memberName?: string; onOpenTransits?: () => void;
}) {
  const byGraha = new Map((transit?.transits ?? []).map((t2) => [t2.graha.toUpperCase(), t2]));
  const rows = TRANSIT_ORDER.map((g) => byGraha.get(g)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  // The transit RASI positions (Rahu in Kumbam …) are sky facts — identical for
  // everyone. What is PERSONAL is the house each transit falls in *from this
  // member's natal Moon* (`houseFromMoon`) and the resulting tone. The user read
  // the shared sky headline as "same for everyone" (2026-07-22); this explainer
  // names whose Moon the houses below are reckoned from so the personalisation is
  // explicit. `janmaRasi` on the snapshot is that member's birth Moon sign.
  const moonRasi = transit?.janmaRasi;
  const who = memberName ?? (lang === "ta" ? "இவரின்" : "this member's");
  return (
    <Card style={{ padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <Kicker color="var(--color-accent-strong)">{lang === "ta" ? "கோச்சர மேலோட்டம்" : "Transit overview"}</Kicker>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{lang === "ta" ? "முக்கிய கிரக நகர்வுகள்" : "major planetary transits"}</span>
      </div>
      {rows.length > 0 && moonRasi && (
        <p style={{ margin: 0, fontSize: "var(--text-xs)", lineHeight: 1.5, color: "var(--color-faint)" }}>
          {lang === "ta"
            ? `கிரகங்கள் அமர்ந்துள்ள ராசிகள் அனைவருக்கும் பொதுவானவை. கீழே காணும் வீடும் அதன் தாக்கமும் ${who} சந்திரன் (${moonRasi}) இருந்து கணக்கிடப்படுகிறது — எனவே ஒவ்வொருவருக்கும் வேறுபடும்.`
            : `The signs the planets sit in are shared by everyone. The house and effect shown below are read from ${memberName ? `${memberName}'s` : "this member's"} Moon in ${moonRasi} — so they differ from member to member.`}
        </p>
      )}
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{lang === "ta" ? "நகர்வு தரவு இல்லை." : "No transit data available."}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {rows.map((tr) => {
            const flagged = tr.isRetrograde || tr.isCombust;
            const tone = gocharaTone(tr.houseFromMoon, flagged);
            const badge = GOCHARA_BADGE[tone];
            const theme = HOUSE_THEME[tr.houseFromMoon];
            return (
              <div key={tr.graha} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", display: "grid", placeItems: "center", fontSize: "var(--text-base)", color: "var(--color-accent-strong)" }}>{GRAHA_GLYPH_R[tr.graha.toUpperCase()] ?? "◦"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>
                    {tPlanetLord(tr.graha.toUpperCase(), lang)} {lang === "ta" ? "" : "in "}{tr.currentRasi}
                    {tr.isRetrograde && <span style={{ marginLeft: "6px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-low)" }}>℞</span>}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
                    {lang === "ta" ? `வீடு ${tr.houseFromMoon}` : `house ${tr.houseFromMoon}`}{theme ? ` · ${tl(lang, theme)}` : ""}
                  </div>
                </div>
                <span style={{ flexShrink: 0, fontSize: "var(--text-xs)", fontWeight: 700, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)", color: badge.fg, background: badge.bg, border: `1px solid ${badge.bd}`, whiteSpace: "nowrap" }}>{tl(lang, badge.label)}</span>
              </div>
            );
          })}
        </div>
      )}
      {onOpenTransits && (
        <button type="button" onClick={onOpenTransits} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", marginTop: "2px", alignSelf: "flex-start", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          {lang === "ta" ? "எல்லா நகர்வுகளும்" : "View all transits"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </Card>
  );
}

/* ── 8c · Detailed forecast — REAL calendar buckets, graded by the dasha
      lord ruling each window ──────────────────────────────────────────────
   Imported from the Claude Design "Hybrid v2" mockup, but the Monthly /
   Quarterly / Yearly toggle now shows genuine calendar periods — the next 6
   months, 4 quarters, or 5 years — NOT raw Vimshottari sub-periods (those run
   irregular lengths: an antaram is days–weeks, a bhukti months–years, a
   mahadasha 6–20 years, so labelling them "monthly/quarterly/yearly" was a
   mismatch — the original bug the user flagged 2026-07-22).

   Each calendar bucket is graded by the dasha lord that RULES the most of that
   window, resolved at the finest Vimshottari level the bundle carries for that
   date (pratyantar -> antar -> maha via `finestLordAt`). That lord's REAL
   per-chart `strengthScore` sets the status (a window run by a strong graha
   reads favourable, a weak one asks for care — the same basis `HyBhavaTable`
   grades houses on); the one-line reading + remedy come from the authored
   `GRAHA_TRAITS` / `GRAHA_REMEDY` tables above. No extra fetch — the same dasha
   bundle this view already loads. Authored significations — flagged for
   astrologer review before the Hybrid tab is promoted to default, exactly like
   the neighbouring §7/§8 cards. */
type ForecastGrain = "month" | "quarter" | "year";
type DashaLevel = "pratyantar" | "antar" | "maha";

/** Banded status tokens (known to exist app-wide); label text is the finer
    `verdictFor` scale. Neutral when the chart's strengths aren't loaded yet. */
function forecastBand(score: number | undefined): { fg: string; bg: string; bd: string } {
  if (score == null) return { fg: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-text-strong) 5%, transparent)", bd: "var(--color-border)" };
  // Green/gold/red split on the same 65 / 50 cutoffs as the palette and the
  // verdict bands above, so this pill's colour always matches its `verdictFor`
  // word (and the table's ForecastCell) for a given score.
  if (score >= 65) return { fg: "var(--color-high)", bg: "var(--color-high-bg)", bd: "var(--color-high-border)" };
  if (score >= 50) return { fg: "var(--color-mid)", bg: "var(--color-mid-bg)", bd: "var(--color-mid-border)" };
  return { fg: "var(--color-low)", bg: "var(--color-low-bg)", bd: "var(--color-low-border)" };
}

function ordinalEn(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** The bhavas a dasha lord owns *in this chart* (from the lagna), named with
    their theme — the piece that makes a period's reading specific to the person
    instead of a generic planet trait. Empty for Rahu/Ketu (no sign rulership). */
function housesClause(houses: number[], lang: Lang): string {
  if (houses.length === 0) return "";
  const themes = houses
    .map((h) => tl(lang, HOUSE_THEME[h] ?? { en: "", ta: "" }))
    .filter(Boolean)
    .slice(0, 2);
  const themeStr = themes.length ? ` (${themes.join(lang === "ta" ? ", " : " · ")})` : "";
  if (lang === "ta") return `உங்கள் ${houses.join(", ")}-ஆம் வீடுகளை ஆளும்${themeStr}`;
  return `rules your ${houses.map(ordinalEn).join(" & ")}${themeStr}`;
}

function forecastReadingLine(lord: string, score: number | undefined, word: string, lang: Lang, entering: boolean, houses: number[]): string {
  const traits = GRAHA_TRAITS[lord];
  const lordName = tPlanetLord(lord, lang);
  const lead = entering
    ? (lang === "ta" ? `${lordName} ${word} தொடங்குகிறது — ` : `${lordName} ${word} begins — `)
    : `${lordName} ${word} — `;
  // Bhava clause first: naming the houses this lord owns in the native's own
  // chart is what differentiates the reading per person (house rulership shifts
  // with the lagna), rather than a lord->trait template that reads the same for
  // everyone who happens to run the same dasha.
  const hc = housesClause(houses, lang);
  const bhava = hc ? `${hc}; ` : "";
  if (!traits || score == null) {
    return lang === "ta" ? `${lead}${bhava}இந்தக் காலம் நிலையாக நகர்கிறது.` : `${lead}${bhava}a steady stretch overall.`;
  }
  if (score >= STRENGTH_CUTOFF) {
    // Age-neutral framing: the same window can belong to a student, a working
    // adult, or an elder in the family — "a supportive stretch to build on"
    // reads right at any stage, unlike "new initiatives".
    return lang === "ta"
      ? `${lead}${bhava}${traits.strength.ta} முன்னிலைக்கு வரும் — சாதகமான, முன்னேற்றத்திற்கு ஏற்ற காலம்.`
      : `${lead}${bhava}${traits.strength.en.toLowerCase()} comes to the fore — a supportive stretch to build on.`;
  }
  return lang === "ta"
    ? `${lead}${bhava}${traits.shadow.ta} தலைதூக்கலாம் — முடிவுகளை பொறுமையாக, தொடங்கியதை முடித்து நகருங்கள்.`
    : `${lead}${bhava}${traits.shadow.en.toLowerCase()} can surface — move steadily and finish what's already open.`;
}

/** How many calendar buckets each grain shows, and the finest Vimshottari
    level word to name a window ruled at that level. */
const GRAIN_COUNT: Record<ForecastGrain, number> = { month: 6, quarter: 4, year: 5 };

/** One graded calendar window: label ("Aug 2026" / "Q3 2026" / "2027"), the
    dasha lord ruling most of it, and that lord's per-chart strength. */
type ForecastBucket = {
  label: string;
  lord: string | null;
  level: DashaLevel | null;
  score: number | undefined;
  entering: boolean;
};

export function HyDetailedForecast({ lang, dasha, dashaAntar, dashaMaha, planets, lagnaRasi, today, onViewAll }: {
  lang: Lang;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
  dashaMaha?: DashaTimelineResponseData | null;
  planets?: Pick<ChartExplanationPlanet, "graha" | "strengthScore">[];
  /** Lagna rasi (1–12) — used to resolve which houses each dasha lord owns in
   *  THIS chart, so each period's reading names real bhavas rather than a
   *  chart-agnostic planet trait. */
  lagnaRasi?: number | null;
  today: string;
  onViewAll?: () => void;
}) {
  const [grain, setGrain] = useState<ForecastGrain>("month");
  const locale = lang === "ta" ? "ta-IN" : "en-IN";

  // lord -> houses it owns in this chart (whole-sign, from the lagna). Rahu/Ketu
  // are absent from RASI_LORD_GRAHA (nodes rule no sign) -> they get no bhava
  // clause, which is correct.
  const lordHouses = useMemo(() => {
    const map = new Map<string, number[]>();
    if (lagnaRasi == null) return map;
    for (let sign = 1; sign <= 12; sign++) {
      const lord = RASI_LORD_GRAHA[sign - 1]!;
      const house = ((sign - lagnaRasi + 12) % 12) + 1;
      const list = map.get(lord) ?? [];
      list.push(house);
      map.set(lord, list);
    }
    for (const list of map.values()) list.sort((a, b) => a - b);
    return map;
  }, [lagnaRasi]);

  const buckets = useMemo<ForecastBucket[]>(() => {
    if (!dasha) return [];
    // Vimshottari levels, finest -> coarsest. pratyantars tile only the current
    // bhukti, antars only the current mahadasha, mahas the whole life — so a
    // future date resolves at whatever fine level still has data for it.
    const pratyantars = dasha.timeline.filter((x) => x.level === "pratyantar");
    const antars = dashaAntar.length > 0 ? dashaAntar : dasha.timeline.filter((x) => x.level === "antar");
    const mahas = (dashaMaha?.timeline ?? []).filter((x) => x.level === "maha");
    const strengthByGraha = new Map((planets ?? []).map((p) => [p.graha, p.strengthScore]));
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const contains = (list: { lord: string; startDate: string; endDate: string }[], d: string) =>
      list.find((p) => p.startDate <= d && d < p.endDate)?.lord ?? null;

    // Finest-resolution lord ruling a given day: try the current bhukti's
    // pratyantars, then the current mahadasha's bhuktis, then the mahadashas.
    const finestLordAt = (d: string): { lord: string; level: DashaLevel } | null => {
      const p = contains(pratyantars, d);
      if (p) return { lord: p, level: "pratyantar" };
      const a = contains(antars, d);
      if (a) return { lord: a, level: "antar" };
      const m = contains(mahas, d);
      if (m) return { lord: m, level: "maha" };
      return null;
    };

    // The dasha lord ruling the MOST days of a window (start inclusive, end
    // exclusive), sampled per calendar day — exact to the day, cheap (≤ ~366
    // iterations per bucket).
    const rulerOf = (start: Date, end: Date): { lord: string; level: DashaLevel } | null => {
      const days = new Map<string, { days: number; level: DashaLevel }>();
      for (const cur = new Date(start); cur < end; cur.setDate(cur.getDate() + 1)) {
        const hit = finestLordAt(iso(cur));
        if (!hit) continue;
        const rec = days.get(hit.lord);
        if (rec) { rec.days += 1; rec.level = hit.level; }
        else days.set(hit.lord, { days: 1, level: hit.level });
      }
      let best: { lord: string; level: DashaLevel; days: number } | null = null;
      for (const [lord, v] of days) if (!best || v.days > best.days) best = { lord, level: v.level, days: v.days };
      return best ? { lord: best.lord, level: best.level } : null;
    };

    const now = new Date(`${today}T00:00:00`);
    const y0 = now.getFullYear();
    const m0 = now.getMonth();
    const count = GRAIN_COUNT[grain];
    const out: ForecastBucket[] = [];
    let prevLord: string | null = null;
    for (let i = 0; i < count; i++) {
      let start: Date;
      let end: Date;
      let label: string;
      if (grain === "month") {
        start = new Date(y0, m0 + i, 1);
        end = new Date(y0, m0 + i + 1, 1);
        label = start.toLocaleDateString(locale, { month: "short", year: "numeric" });
      } else if (grain === "quarter") {
        const q = Math.floor(m0 / 3) + i;
        start = new Date(y0, q * 3, 1);
        end = new Date(y0, q * 3 + 3, 1);
        label = `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
      } else {
        start = new Date(y0 + i, 0, 1);
        end = new Date(y0 + i + 1, 0, 1);
        label = String(y0 + i);
      }
      const ruler = rulerOf(start, end);
      const lord = ruler?.lord ?? null;
      out.push({
        label,
        lord,
        level: ruler?.level ?? null,
        score: lord != null ? strengthByGraha.get(lord) : undefined,
        // "begins" only when a NEW lord takes over this window (not the first row).
        entering: i > 0 && lord != null && lord !== prevLord,
      });
      prevLord = lord;
    }
    return out;
  }, [dasha, dashaAntar, dashaMaha, grain, today, locale, planets]);

  if (!dasha) return null;

  const wordForLevel = (level: DashaLevel | null): string =>
    level === "antar" ? t("bhukti_word", lang)
      : level === "maha" ? (lang === "ta" ? "மகாதசை" : "Mahadasha")
        : t("antaram_word", lang);

  const tabs: { key: ForecastGrain; label: string }[] = [
    { key: "month", label: lang === "ta" ? "மாதம்" : "Monthly" },
    { key: "quarter", label: lang === "ta" ? "காலாண்டு" : "Quarterly" },
    { key: "year", label: lang === "ta" ? "ஆண்டு" : "Yearly" },
  ];

  return (
    <Card style={{ padding: "var(--space-5) var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Kicker color="var(--color-mid)">{lang === "ta" ? "விரிவான முன்னறிவிப்பு" : "Detailed forecast"}</Kicker>
        <span style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {tabs.map((tb) => {
            const on = tb.key === grain;
            return (
              <button
                key={tb.key}
                type="button"
                onClick={() => setGrain(tb.key)}
                style={{
                  fontSize: "var(--text-xs)", fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                  color: on ? "var(--color-on-accent)" : "var(--color-muted)",
                  background: on ? "var(--color-accent)" : "transparent",
                  border: `1px solid ${on ? "var(--color-accent)" : "var(--color-border-strong)"}`,
                  borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-3)",
                }}
              >
                {tb.label}
              </button>
            );
          })}
        </div>
      </div>

      {buckets.length === 0 ? (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
          {lang === "ta" ? "வரவிருக்கும் காலப் பகுதிகள் இல்லை." : "No upcoming periods."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {buckets.map((b, i) => {
            const band = forecastBand(b.score);
            const status = b.score == null ? { en: "Steady", ta: "நிலையானது" } : verdictFor(b.score);
            const remedy = b.lord ? GRAHA_REMEDY[b.lord] : undefined;
            const reading = b.lord
              ? forecastReadingLine(b.lord, b.score, wordForLevel(b.level), lang, b.entering, lordHouses.get(b.lord) ?? [])
              : (lang === "ta" ? "இந்தக் காலம் நிலையாக நகர்கிறது." : "A steady stretch overall.");
            return (
              <Card key={`${grain}-${b.label}-${i}`} style={{ display: "flex", flexDirection: "row", gap: "var(--space-4)", background: "color-mix(in srgb, var(--color-text-strong) 3%, transparent)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
                <div style={{ flexShrink: 0, width: "64px", textAlign: "center", paddingTop: "var(--space-0_5)" }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-strong)" }}>{b.label}</div>
                  <div style={{ display: "inline-block", marginTop: "5px", fontSize: "var(--text-xs)", fontWeight: 700, color: band.fg, background: band.bg, border: `1px solid ${band.bd}`, borderRadius: "var(--radius-pill)", padding: "var(--space-1) var(--space-2)" }}>{tl(lang, status)}</div>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-text)" }}>
                    {reading}
                  </div>
                  {remedy && (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)", marginTop: "5px" }}>
                      {lang === "ta" ? "பரிகாரம்: " : "Remedy: "}<span style={{ color: "var(--color-high)" }}>{tl(lang, remedy)}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {onViewAll && (
        <button type="button" onClick={onViewAll} style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", alignSelf: "flex-start", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-accent-strong)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          {lang === "ta" ? "முழு முன்னறிவிப்பு" : "View full forecast"}<ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </Card>
  );
}

/* ── 8d · Daily affirmation ───────────────────────────────────────────────
   Imported from the mockup. A general, inspirational daily line — NOT a chart
   prediction. The set is authored bilingual, the tone (uplift / steady / rest)
   is nudged by the day's real guidance band, and one is picked deterministically
   from the date + subject so it's stable per day and varies per member. Purely
   decorative/inspirational, so it invents no astrology. */
type AffirmationTone = "up" | "steady" | "rest";
const DAILY_AFFIRMATIONS: { tone: AffirmationTone; en: string; ta: string }[] = [
  { tone: "up", en: "I trust the divine timing; the universe supports my journey.", ta: "தெய்வீக நேரத்தை நம்புகிறேன்; பிரபஞ்சம் என் பயணத்திற்குத் துணை." },
  { tone: "up", en: "Today I move with courage and an open heart.", ta: "இன்று தைரியத்துடனும் திறந்த மனதுடனும் நகர்கிறேன்." },
  { tone: "up", en: "What is meant for me will find its way to me.", ta: "எனக்கானது என்னைத் தேடி வந்தே தீரும்." },
  { tone: "steady", en: "I do my work with care and leave the fruit to time.", ta: "என் பணியைக் கவனத்துடன் செய்கிறேன்; பலனைக் காலத்திடம் விடுகிறேன்." },
  { tone: "steady", en: "Peace begins with a single, steady breath.", ta: "அமைதி ஒரு நிலையான மூச்சில் தொடங்குகிறது." },
  { tone: "steady", en: "I am grounded, patient, and clear in my choices.", ta: "நான் நிலைத்தவன்; பொறுமையானவன்; என் தேர்வுகளில் தெளிவானவன்." },
  { tone: "rest", en: "This quieter day is a gift — to rest and gather strength.", ta: "இந்த அமைதியான நாள் ஓய்வெடுத்துப் பலம் சேர்க்கும் வரம்." },
  { tone: "rest", en: "I release what I cannot control and hold what I can.", ta: "என் கட்டுப்பாட்டில் இல்லாததை விடுகிறேன்; உள்ளதைப் பேணுகிறேன்." },
  { tone: "rest", en: "Kindness to myself today is strength, not weakness.", ta: "இன்று என் மீது காட்டும் கருணை பலம், பலவீனம் அல்ல." },
];
export function HyDailyAffirmation({ lang, selectedDate, dayScore, seed }: {
  lang: Lang; selectedDate: string; dayScore?: number | null; seed?: string;
}) {
  const preferredTone: AffirmationTone = dayScore == null ? "steady" : dayScore >= 60 ? "up" : dayScore < 45 ? "rest" : "steady";
  const pool = DAILY_AFFIRMATIONS.filter((a) => a.tone === preferredTone);
  const list = pool.length > 0 ? pool : DAILY_AFFIRMATIONS;
  const key = `${selectedDate}·${seed ?? ""}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const pick = list[hash % list.length]!;
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg, color-mix(in srgb, var(--color-accent-secondary) 14%, transparent), transparent), var(--color-surface)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-xl)", padding: "var(--space-6) var(--space-6)", textAlign: "center" }}>
      <div className="hy-glow" style={{ position: "absolute", bottom: "-40px", left: "50%", transform: "translateX(-50%)", width: "200px", height: "120px", borderRadius: "var(--radius-pill)", background: "radial-gradient(ellipse, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <Kicker color="var(--color-accent-secondary)">{lang === "ta" ? "இன்றைய உறுதிமொழி" : "Daily affirmation"}</Kicker>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontStyle: "italic", fontWeight: 500, lineHeight: 1.45, color: "var(--color-text-strong)", marginTop: "12px" }}>
          &ldquo;{lang === "ta" ? pick.ta : pick.en}&rdquo;
        </div>
        <div className="hy-glow" style={{ fontSize: "var(--text-lg)", color: "var(--color-accent-strong)", marginTop: "14px" }}>✻</div>
      </div>
    </div>
  );
}

/* ── A small helper re-exported for callers that need the score palette. ── */
export { scoreColor };
