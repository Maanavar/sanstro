"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import { rasiDisplayName } from "@/lib/chart-utils";
import { t, tNakshatra, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { CompatibilityIntelligenceData } from "@/lib/types";
import { scoreColorPct } from "@/lib/format";
import { madhyamaLabel, madhyamaGloss, hasMadhyama } from "@/lib/kuta-grade";
import { verdictPhraseOrKey } from "@/lib/verdict-lexicon";
import { crossChartBadge, crossChartLine, crossChartRowVisible, crossChartTone } from "@/lib/cross-chart-copy";
import {
  DASA_SANDHI_HEADING,
  DASA_SANDHI_INTRO,
  DASA_SANDHI_NOTE,
  dasaSandhiBandLine,
  dasaSandhiHorizon,
  dasaSandhiPairLine,
  dasaSandhiWindowLine,
} from "@/lib/dasa-sandhi-copy";
import {
  EIGHTH_HOUSE_INTRO,
  EIGHTH_HOUSE_JOINT_NOTE,
  eighthHouseAlsoCounted,
  eighthHouseD9Note,
  eighthHouseGroupLabel,
  eighthHouseJointLines,
  eighthHouseLine,
  eighthHouseNotApplied,
  eighthHouseTitle,
} from "@/lib/eighth-house-copy";
import {
  JOINT_PROGENY_HEADING,
  JOINT_PROGENY_INTRO,
  PROGENY_GROUPS,
  progenyAlsoCounted,
  progenyBearing,
  progenyD7Note,
  progenyGroup,
  progenyGroupLabel,
  progenyJointLine,
  progenyLine,
  progenyNinthNotApplied,
  progenyTimingEmpty,
  progenyTimingHeading,
  progenyTimingIntro,
  progenyWindowLine,
} from "@/lib/joint-progeny-copy";
import type { KutaGrade } from "@vinaadi/shared";
import { ZodiacBadge } from "./zodiac-badge";
import { NakshatraBadge } from "./nakshatra-badge";
import { GlossaryTerm } from "./glossary-term";
import { EkaNakshatraNoteCard, NadiSecondaryNote, ShashtashtakaNoteCard } from "./shashtashtaka-note";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CompatibilityIntelligenceBirth {
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string | null;
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: string;
}

/** Two ways in, and the panel picks by what it was given:
 *
 *  1. **Vault member** - `familyVaultId` + `memberId` (Person A defaults to the
 *     vault owner, or `chartIdA`, or a hand-entered `personABirth`).
 *  2. **Two hand-entered people** - `personABirth` + `personBBirth`, no vault
 *     involved. A signed-in user typing two birth records into the Porutham
 *     tool used to get only the shallow ten-porutham result, because the deep
 *     report was reachable solely through a saved member. Depth now follows
 *     who is asking, not where the data happens to be stored.
 */
interface Props {
  familyVaultId?: string;
  memberId?: string;
  lang: Lang;
  /** Pins Person A to a specific chart (e.g. the Porutham tool's Person 1).
   *  When omitted, Person A defaults to the vault owner. */
  chartIdA?: string;
  personABirth?: CompatibilityIntelligenceBirth;
  /** Person B typed in by hand. Requires `personABirth`; ignored when a
   *  `memberId` is supplied, since a saved member's own chart is the better
   *  source for the same person. */
  personBBirth?: CompatibilityIntelligenceBirth;
}

// ── Palette ──────────────────────────────────────────────────────────────────

const W = {
  inkMid: "var(--synastry-ink, var(--panel-earth))",
  muted: "var(--color-faint)",
  border: "var(--synastry-border, var(--panel-tan))",
  borderLt: "var(--synastry-border-light, var(--panel-tan-light))",
  surface: "var(--panel-cream)",
  card: "var(--chart-cell-default)",
  terracotta: "var(--synastry-accent, var(--panel-brand))",
  sage: "var(--chart-d9-active)",
  rust: "var(--planet-saturn)",
  gold: "var(--synastry-accent, var(--color-gold-mid))",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const scoreColor = scoreColorPct;

function overallColor(label: string): string {
  if (label === "EXCELLENT") return W.sage;
  if (label === "GOOD") return W.gold;
  if (label === "AVERAGE") return W.terracotta;
  return W.rust;
}

function harmonyBadge(label: string): { bg: string; color: string } {
  if (label === "STRONG" || label === "SUPPORTIVE" || label === "EXCELLENT") return { bg: "var(--cl-sage-10)", color: W.sage };
  if (label === "GOOD" || label === "MIXED") return { bg: "var(--cl-brand-fill)", color: W.terracotta };
  return { bg: "var(--cl-rust-soft)", color: W.rust };
}

// Porutham verdict badge tones keyed on the label itself — the engine forces
// CAUTION on a Rajju/Vedha veto even at 9/10, so colouring this badge by
// percentage could render a green "CAUTION" (2026-07 porutham audit).
function poruthamLabelBadge(label: string): { bg: string; color: string } {
  if (label === "EXCELLENT") return { bg: "var(--cl-sage-10)", color: W.sage };
  if (label === "GOOD") return { bg: "var(--cl-brand-fill)", color: W.gold };
  if (label === "AVERAGE") return { bg: "var(--cl-brand-fill)", color: W.terracotta };
  return { bg: "var(--cl-rust-soft)", color: W.rust };
}

// One verdict per row. The band REPLACES the bare PASS/FAIL rather than sitting
// beside it — two ratings on one row read as the system contradicting itself,
// and the band is the same judgement at finer resolution, not a second opinion.
//
// Only MADHYAMA is named. Since 2026-08-31 every porutham carries a grade, so
// naming UTTAMA/ADHAMA too would turn all ten rows into Sanskrit and would make
// the ends look graded when they are simply the two-valued projection of the
// same ladder. Madhyama is named because there is no plain word for it.
function kutaVerdict(k: { label: string; grade?: KutaGrade }, en: boolean): string {
  if (k.grade === "MADHYAMA") return madhyamaLabel(en);
  return k.label;
}

// Plain-language meaning of the Level-7 harmony labels, so a reader with no
// astrology background understands what "TENSE" or "STRONG" actually implies.
// Moon = how the two people sense/process feelings; Venus = how they express
// affection and attraction.
function moonGloss(label: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    EXCELLENT: ["You read each other's moods easily and feel understood.", "ஒருவரை ஒருவர் எளிதில் உணர்ந்து புரிந்துகொள்வீர்கள்."],
    GOOD: ["Comfortable emotional understanding between you.", "வசதியான உணர்வுப் புரிதல் உள்ளது."],
    MIXED: ["Your emotional styles differ a little — some tuning-in helps.", "உணர்வுப் பாணிகள் சற்று வேறுபடுகின்றன — கொஞ்சம் ஒத்திசைவு உதவும்."],
    TENSE: ["You process feelings quite differently — this needs patient, open talk.", "உணர்வுகளை மிகவும் வேறுவிதமாக அணுகுகிறீர்கள் — பொறுமையான, திறந்த உரையாடல் தேவை."],
  };
  const pair = map[label] ?? map.MIXED!;
  return en ? pair[0] : pair[1];
}
function venusGloss(label: string, en: boolean): string {
  const map: Record<string, [string, string]> = {
    STRONG: ["Warm, easy attraction and shared tastes in affection.", "வெதுவெதுப்பான, எளிதான ஈர்ப்பும் பொதுவான ரசனையும் உள்ளன."],
    GOOD: ["Affection and romance flow well between you.", "பாசமும் காதலும் நன்றாக வெளிப்படுகின்றன."],
    MIXED: ["Different love-languages to bridge with small effort.", "வெவ்வேறு அன்பு மொழிகளை சிறு முயற்சியால் இணைக்கலாம்."],
    TENSE: ["Your romance styles differ — showing love takes conscious effort.", "காதல் பாணிகள் வேறுபடுகின்றன — அன்பைக் காட்ட உணர்வுபூர்வ முயற்சி தேவை."],
  };
  const pair = map[label] ?? map.MIXED!;
  return en ? pair[0] : pair[1];
}

/** Count from sign `from` to sign `to`, the way a jothidar counts (own sign = 1). */
function signCount(from: number, to: number): number {
  return ((to - from + 12) % 12) + 1;
}

/** Venus's sign from its house and the lagna (house 1 = lagna sign). The wire
 *  carries Venus's house, not its sign, and that is enough. */
function venusSign(lagnaRasi: number, venusHouse: number): number {
  return ((lagnaRasi - 1 + venusHouse - 1) % 12) + 1;
}

/** Level 8 band words; same rungs as the server's synastry label (65 / 45). */
function synastryBand(score: number, en: boolean): string {
  if (score >= 65) return en ? "Mostly easy angles" : "பெரும்பாலும் இணக்கமான கோணங்கள்";
  if (score >= 45) return en ? "A mix of easy and tense angles" : "இணக்கமும் இறுக்கமும் கலந்த கோணங்கள்";
  return en ? "More tense angles than easy ones" : "இணக்கத்தை விட இறுக்கமான கோணங்கள் அதிகம்";
}

function ScoreBar({ score, max, label }: { score: number; max: number; label: string }) {
  const pct = max > 0 ? score / max : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ flex: 1, height: "7px", background: W.borderLt, borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.round(pct * 100)}%`, background: scoreColor(pct), borderRadius: "4px", transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: scoreColor(pct), minWidth: "52px", textAlign: "right" }}>
        {score}/{max}
      </span>
      <span style={{ fontSize: "0.72rem", color: W.muted, minWidth: "60px" }}>{label}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: W.card, border: `1px solid ${W.borderLt}`,
      borderRadius: "14px", padding: "18px 20px",
    }}>
      <p style={{ margin: "0 0 14px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: W.muted }}>
        {title}
      </p>
      {children}
    </div>
  );
}

/** `warn` draws a real icon instead of the "⚠ " text prefix the dosha badges
 *  used to carry. Three reasons the glyph had to go, in order of how much they
 *  cost a reader:
 *
 *    1. "⚠" is Extended_Pictographic. Some platforms resolve it to the
 *       monochrome text presentation and some to the colour emoji, so the same
 *       badge is a small brown triangle on one machine and a saturated
 *       yellow-and-black sign on the next — and in the colour presentation it
 *       ignores `color` entirely, which is the one thing a dosha badge uses to
 *       say "this is the adverse one".
 *    2. It sat inside the translated string, so the mark was duplicated across
 *       six literals and could drift out of one of them silently.
 *    3. Screen readers announce it. "warning sign Rajju Dosha" is noise on a
 *       badge whose colour and wording already carry the warning; the icon is
 *       aria-hidden and the sentence is just "Rajju Dosha".
 */
function Badge({ text, color, bg, warn = false }: { text: string; color: string; bg: string; warn?: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px",
      background: bg, color, border: `1px solid ${color}33`,
    }}>
      {warn && <AlertTriangle aria-hidden="true" focusable="false" size={12} strokeWidth={2.5} style={{ flex: "none" }} />}
      {text}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CompatibilityIntelligencePanel({ familyVaultId, memberId, lang, chartIdA, personABirth, personBBirth }: Props) {
  const en = lang === "en";
  const [data, setData] = useState<CompatibilityIntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Which of the three request shapes this mount is for. `pair` needs no vault
  // at all - both charts are computed transiently from what the user typed.
  const mode: "pair" | "memberDirect" | "member" | null =
    memberId && familyVaultId
      ? personABirth
        ? "memberDirect"
        : "member"
      : personABirth && personBBirth
        ? "pair"
        : null;

  async function load() {
    if (!mode) {
      setError(en ? "Not enough birth details to build this report." : "இந்த அறிக்கைக்குத் தேவையான பிறப்புத் தகவல் இல்லை.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      type Res = { success: boolean; data: CompatibilityIntelligenceData };
      let res: Res;
      if (mode === "pair") {
        res = await apiFetchJson<Res>("/api/v1/relationships/compatibility-intelligence/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personA: personABirth, personB: personBBirth }),
        });
      } else {
        const params = new URLSearchParams({ familyVaultId: familyVaultId as string });
        if (mode === "memberDirect") {
          res = await apiFetchJson<Res>(
            `/api/v1/relationships/${memberId}/compatibility-intelligence/direct?${params.toString()}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ personA: personABirth }),
            }
          );
        } else {
          if (chartIdA) params.set("chartIdA", chartIdA);
          res = await apiFetchJson<Res>(
            `/api/v1/relationships/${memberId}/compatibility-intelligence?${params.toString()}`
          );
        }
      }
      setData(res.data);
    } catch (e) {
      setError(readErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  async function downloadPdf() {
    if (!data || downloadingPdf || !mode) return;
    setDownloadingPdf(true);
    setError("");
    try {
      let response: Response;
      if (mode === "pair") {
        response = await fetch(
          `/api/backend/api/v1/relationships/compatibility-intelligence/direct/pdf?lang=${lang}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
            body: JSON.stringify({ personA: personABirth, personB: personBBirth }),
          }
        );
      } else {
        const params = new URLSearchParams({ familyVaultId: familyVaultId as string, lang });
        if (mode === "memberDirect") {
          response = await fetch(
            `/api/backend/api/v1/relationships/${memberId}/compatibility-intelligence/direct/pdf?${params.toString()}`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json", "X-Vinaadi-CSRF": "1" },
              body: JSON.stringify({ personA: personABirth }),
            }
          );
        } else {
          if (chartIdA) params.set("chartIdA", chartIdA);
          response = await fetch(
            `/api/backend/api/v1/relationships/${memberId}/compatibility-intelligence/pdf?${params.toString()}`,
            {
              method: "GET",
              credentials: "include",
              headers: { "X-Vinaadi-CSRF": "1" },
            }
          );
        }
      }

      if (!response.ok) throw new Error(`${response.status}: PDF export failed`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compatibility_intelligence_${data.personAName}_${data.personBName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(readErrorMessage(e));
    } finally {
      setDownloadingPdf(false);
    }
  }

  function toggle(key: string) {
    setExpanded(p => ({ ...p, [key]: !p[key] }));
  }

  if (!data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ background: W.surface, border: `1px solid ${W.borderLt}`, borderRadius: "14px", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: W.inkMid, fontSize: "0.95rem" }}>
            {en ? "Compatibility Intelligence Report" : "இணக்க நுண்ணறிவு அறிக்கை"}
          </p>
          <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: W.muted, lineHeight: 1.65 }}>
            {en
              ? "Full 8-level analysis: Porutham · 7th House · Navamsa (D9) · Dasa Timing · Sevvai Dosham · Emotional Compatibility · Synastry · Overall Score (0–100)"
              : "8 அடுக்கு பகுப்பாய்வு: பொருத்தம் · 7ஆம் இடம் · நவாம்சம் · தசை நேரம் · செவ்வாய் தோஷம் · உணர்வு இணக்கம் · சினாஸ்ட்ரி · ஒட்டுமொத்த மதிப்பெண்"}
          </p>
          {error && (
            <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: W.rust, background: "var(--ring-error)", border: "1px solid var(--cl-rust-25)", borderRadius: "8px", padding: "10px 14px" }}>
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            style={{
              padding: "9px 24px", background: loading ? W.border : W.inkMid,
              color: W.card, border: "none", borderRadius: "999px",
              fontFamily: "inherit", fontSize: "0.88rem", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? (en ? "Analysing…" : "பகுப்பாய்வு…")
              : (en ? "Generate Full Report" : "முழு அறிக்கை உருவாக்கு")}
          </button>
        </div>
      </div>
    );
  }

  const d = data;
  const overallPct = d.overallScore / 100;
  const poruthamPct = d.poruthamScore / Math.max(1, d.poruthamMax);

  // Maxima ruled 2026-08-28 and MUST track
  // `compatibility_intelligence.CompatibilityScoreBreakdown`. They are hand-typed
  // here — nothing checks them against the backend — so a weight change that
  // updates only one side renders every bar against the wrong denominator while
  // the numbers themselves stay correct, which is the hardest kind of wrong to
  // notice. Synastry now weighs 0 in the composite and is dropped from this list
  // rather than shown as a permanent 0/0; it keeps its own panel elsewhere.
  const breakdown = [
    { key: "porutham", label: en ? "Porutham (Traditional)" : "பொருத்தம் (பாரம்பரியம்)", score: d.scoreBreakdown.porutham, max: 35 },
    { key: "seventh", label: en ? "7th House Strength" : "7ஆம் இடம் வலிமை", score: d.scoreBreakdown.seventhHouse, max: 20 },
    { key: "navamsa", label: en ? "Navamsa (D9)" : "நவாம்சம் (D9)", score: d.scoreBreakdown.navamsa, max: 15 },
    { key: "dasha", label: en ? "Dasa Alignment" : "தசை இணக்கம்", score: d.scoreBreakdown.dashaHarmony, max: 15 },
    { key: "dosham", label: en ? "Dosham Analysis" : "தோஷம் பகுப்பாய்வு", score: d.scoreBreakdown.doshamAnalysis, max: 10 },
    { key: "emotional", label: en ? "Emotional Compatibility" : "உணர்வு இணக்கம்", score: d.scoreBreakdown.emotional, max: 5 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Overall score card ── */}
      <SectionCard title={en ? "Compatibility Intelligence Score" : "இணக்க நுண்ணறிவு மதிப்பெண்"}>
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ minWidth: "130px" }}>
            <p style={{ margin: 0, fontSize: "3.5rem", fontWeight: 700, lineHeight: 1, color: overallColor(d.overallLabel) }}>
              {d.overallScore}
              <span style={{ fontSize: "1.1rem", fontWeight: 400, color: W.muted }}>/100</span>
            </p>
            <Badge
              text={verdictPhraseOrKey("porutham", d.overallLabel, en ? "en" : "ta")}
              color={overallColor(d.overallLabel)}
              bg={`${overallColor(d.overallLabel)}18`}
            />
          </div>
          <div style={{ flex: 1, minWidth: "240px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "0.87rem", color: W.inkMid, lineHeight: 1.7 }}>
              {en ? d.summary.en : d.summary.ta}
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", color: W.muted, background: W.surface, border: `1px solid ${W.border}`, borderRadius: "999px", padding: "3px 12px" }}>
                {d.personAName}
              </span>
              <span style={{ fontSize: "0.78rem", color: W.muted, background: W.surface, border: `1px solid ${W.border}`, borderRadius: "999px", padding: "3px 12px" }}>
                {d.personBName}
              </span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Birth details (Rasi/Nakshatra/Lagnam) — the plain-language
          identity facts a non-astrologer needs before the score tables
          (2026-07 UX gap: this report jumped straight into score
          breakdowns without ever stating either person's Rasi/Nakshatra). ── */}
      <SectionCard title={en ? "Birth Details" : "பிறப்பு விவரங்கள்"}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {([[d.personAName, d.personAIdentity], [d.personBName, d.personBIdentity]] as const).map(([name, identity], i) => (
            <div key={i} style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: W.inkMid }}>{name}</p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                  <ZodiacBadge rasi={identity.rasi} size={32} />
                  <span style={{ fontSize: "0.8rem", color: W.inkMid }}>
                    {rasiDisplayName(identity.rasi, lang)}{" "}
                    <GlossaryTerm term="rasi" lang={lang}>{en ? "Rasi" : "ராசி"}</GlossaryTerm>
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                  <NakshatraBadge nakshatra={identity.nakshatra} size={32} />
                  <span style={{ fontSize: "0.8rem", color: W.inkMid }}>
                    {tNakshatra(identity.nakshatraName, lang)} {en ? "Pada" : "பாதம்"} {identity.pada}{" "}
                    <GlossaryTerm term="nakshatra" lang={lang}>{en ? "Nakshatra" : "நட்சத்திரம்"}</GlossaryTerm>
                  </span>
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: W.muted }}>
                {rasiDisplayName(identity.lagnaRasi, lang)} {en ? "Lagnam" : "லக்னம்"}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Score breakdown ── */}
      <SectionCard title={en ? "Score Breakdown" : "மதிப்பெண் விவரம்"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {breakdown.map(b => (
            <div key={b.key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ minWidth: "180px", fontSize: "0.82rem", color: W.inkMid, fontWeight: 500 }}>{b.label}</span>
              <ScoreBar score={b.score} max={b.max} label="" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Strengths & Risks ── */}
      {(d.strengthsEn.length > 0 || d.risksEn.length > 0) && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {d.strengthsEn.length > 0 && (
            <div style={{ flex: 1, minWidth: "240px", background: "var(--synastry-good-bg, var(--cl-sage-06))", border: `1px solid var(--synastry-good-border, var(--cl-sage-25))`, borderRadius: "12px", padding: "14px 18px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: W.sage }}>
                {en ? "Strengths" : "சாதகங்கள்"}
              </p>
              <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "5px" }}>
                {(en ? d.strengthsEn : d.strengthsTa).map((s, i) => (
                  <li key={i} style={{ fontSize: "0.83rem", color: W.inkMid, lineHeight: 1.5 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {d.risksEn.length > 0 && (
            <div style={{ flex: 1, minWidth: "240px", background: "var(--cl-rust-06)", border: "1px solid var(--cl-rust-25)", borderRadius: "12px", padding: "14px 18px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: W.rust }}>
                {en ? "Areas to Watch" : "கவனிக்க வேண்டியவை"}
              </p>
              <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "5px" }}>
                {(en ? d.risksEn : d.risksTa).map((r, i) => (
                  <li key={i} style={{ fontSize: "0.83rem", color: W.inkMid, lineHeight: 1.5 }}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Porutham (traditional) ── */}
      <SectionCard title={en ? "Level 1 — Traditional Porutham" : "நிலை 1 — பாரம்பரிய பொருத்தம்"}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "2rem", fontWeight: 700, color: scoreColor(poruthamPct) }}>{d.poruthamScore}</span>
            <span style={{ fontSize: "0.9rem", color: W.muted }}>/{d.poruthamMax}</span>
          </div>
          <Badge
            text={verdictPhraseOrKey("porutham", d.poruthamLabel, en ? "en" : "ta")}
            {...poruthamLabelBadge(d.poruthamLabel)}
          />
          {d.rajjuDosha && <Badge warn text={en ? "Rajju Dosha" : "ரஜ்ஜு தோஷம்"} color={W.rust} bg="var(--cl-rust-soft)" />}
          {d.vedhaDosha && <Badge warn text={en ? "Vedha Dosha" : "வேதை தோஷம்"} color={W.rust} bg="var(--cl-rust-soft)" />}
        </div>
        {/* F-POR-03: same-star note, qualifying the Rajju result above it. */}
        <EkaNakshatraNoteCard note={d.ekaNakshatra} lang={en ? "en" : "ta"} />
        {/* F-POR-02: a disclosure beside the verdict, never a badge in it —
            a badge in that row would read as a fourth veto. */}
        <ShashtashtakaNoteCard note={d.shashtashtaka} lang={en ? "en" : "ta"} />
        {/* Nadi: a secondary note below the Tamil findings, never a badge
            beside Rajju/Vedhai (2026-11-11). */}
        <NadiSecondaryNote nadi={d.nadiDosha} lang={en ? "en" : "ta"} />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {d.poruthamKutas.map(k => (
            <div key={k.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ minWidth: "120px", fontSize: "0.8rem", color: W.inkMid }}>{en ? k.name : k.nameTa}</span>
              <ScoreBar score={k.score} max={k.maxScore} label={kutaVerdict(k, en)} />
            </div>
          ))}
        </div>
        {hasMadhyama(d.poruthamKutas) && (
          <p style={{ margin: "8px 0 0", fontSize: "0.76rem", color: W.muted }}>
            {madhyamaGloss(en)}
          </p>
        )}
      </SectionCard>

      {/* ── 7th House ── */}
      <SectionCard title={en ? "Level 2+3 — 7th House, Venus & Guru" : "நிலை 2+3 — 7ஆம் இடம், சுக்கிரன் & குரு"}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { label: d.personAName, strength: d.chartAStrength },
            { label: d.personBName, strength: d.chartBStrength },
          ].map(({ label, strength }, i) => (
            <div key={i} style={{ flex: 1, minWidth: "200px", background: W.surface, borderRadius: "10px", padding: "12px 16px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 700, color: W.terracotta }}>{label}</p>
              <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: W.inkMid }}>
                {en ? `7th Lord: ${tPlanetLord(strength.seventhLord, "en")}` : `7ஆம் அதிபதி: ${tPlanetLord(strength.seventhLord, "ta")}`}
                {en ? ` in house ${strength.seventhLordHouse}` : ` ${strength.seventhLordHouse}ஆம் இடம்`}
              </p>
              <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: W.inkMid }}>
                {en ? `Venus in house ${strength.venusHouse}` : `சுக்கிரன் ${strength.venusHouse}ஆம் இடம்`}
                {" · "}{en ? `Strength ${strength.venusStrength}/100` : `வலிமை ${strength.venusStrength}/100`}
              </p>
              {/* FAA-16: Guru is scored too (by the chart's stated gender), so it is shown. */}
              <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: W.inkMid }}>
                {en ? `${tPlanetLord("JUPITER", "en")} in house ${strength.jupiterHouse}` : `${tPlanetLord("JUPITER", "ta")} ${strength.jupiterHouse}ஆம் இடம்`}
                {" · "}{en ? `Strength ${strength.jupiterStrength}/100` : `வலிமை ${strength.jupiterStrength}/100`}
              </p>
              {/* Same swap as Badge's `warn`, inline. `flex-start` + the 1px
                  nudge optically centres a 12px triangle against a 0.76rem
                  line; `align-items: center` would sit it low, because the
                  glyph's visual mass is below its box centre. */}
              {strength.hasMaleficInSeventh && (
                <p style={{ margin: "4px 0 0", fontSize: "0.76rem", color: W.rust, display: "flex", alignItems: "flex-start", gap: "5px" }}>
                  <AlertTriangle aria-hidden="true" focusable="false" size={12} strokeWidth={2.5} style={{ flex: "none", marginTop: "1px" }} />
                  {en ? "Malefic in 7th house" : "7ஆம் இடத்தில் பாதக கிரகம்"}
                </p>
              )}
              <div style={{ marginTop: "8px" }}>
                <ScoreBar score={strength.score} max={10} label="" />
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "0.77rem", color: W.muted, lineHeight: 1.55 }}>
                {en ? strength.noteEn : strength.noteTa}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Navamsa ── */}
      <SectionCard title={en ? "Level 4 — Navamsa (D9)" : "நிலை 4 — நவாம்சம் (D9)"}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
          <Badge
            text={verdictPhraseOrKey("harmony", d.navamsa.harmonyLabel, en ? "en" : "ta")}
            {...harmonyBadge(d.navamsa.harmonyLabel)}
          />
          <span style={{ fontSize: "0.8rem", color: W.muted }}>
            {en ? `${d.personAName} Venus D9: Rasi ${d.navamsa.personAVenusD9}` : `${d.personAName} சுக்கிரன் D9: ராசி ${d.navamsa.personAVenusD9}`}
            {" · "}
            {en ? `${d.personBName} Venus D9: Rasi ${d.navamsa.personBVenusD9}` : `${d.personBName} சுக்கிரன் D9: ராசி ${d.navamsa.personBVenusD9}`}
          </span>
        </div>
        <ScoreBar score={d.navamsa.score} max={20} label="" />
        <p style={{ margin: "10px 0 0", fontSize: "0.83rem", color: W.inkMid, lineHeight: 1.65 }}>
          {en ? d.navamsa.noteEn : d.navamsa.noteTa}
        </p>
      </SectionCard>

      {/* ── Sevvai Dosham ── */}
      <SectionCard title={en ? "Level 5 — Sevvai (Kuja) Dosham" : "நிலை 5 — செவ்வாய் (குஜ) தோஷம்"}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { label: d.personAName, sevvai: d.sevvaiA },
            { label: d.personBName, sevvai: d.sevvaiB },
          ].map(({ label, sevvai }, i) => (
            <div key={i} style={{ flex: 1, minWidth: "200px", background: sevvai.hasDosham && !sevvai.isCancelled ? "var(--cl-rust-faint)" : W.surface, borderRadius: "10px", padding: "12px 16px", border: `1px solid ${sevvai.hasDosham && !sevvai.isCancelled ? "var(--cl-rust-ring)" : W.borderLt}` }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.78rem", fontWeight: 700, color: W.terracotta }}>{label}</p>
              <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                <Badge
                  text={sevvai.hasDosham ? (sevvai.isCancelled ? (en ? "Cancelled" : "நீக்கப்பட்டது") : verdictPhraseOrKey("doshamSeverity", sevvai.severity, en ? "en" : "ta")) : (en ? "No Dosham" : "தோஷம் இல்லை")}
                  color={sevvai.hasDosham && !sevvai.isCancelled ? W.rust : W.sage}
                  bg={sevvai.hasDosham && !sevvai.isCancelled ? "var(--cl-rust-soft)" : "var(--cl-sage-10)"}
                />
                <span style={{ fontSize: "0.76rem", color: W.muted }}>
                  {en ? `Mars: House ${sevvai.marsHouse}` : `செவ்வாய்: ${sevvai.marsHouse}ஆம் இடம்`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
                {en ? sevvai.noteEn : sevvai.noteTa}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── FAA-30: the 8th house. Not a level: no points. ── */}
      {d.eighthHouse && (
        <SectionCard title={en ? "The 8th house" : "8ஆம் இடம்"}>
          <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
            {EIGHTH_HOUSE_INTRO[lang]}
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { name: d.personAName, r: d.eighthHouse.personA },
              { name: d.personBName, r: d.eighthHouse.personB },
            ].map(({ name, r }, idx) => (
              <div key={idx} style={{ flex: 1, minWidth: "240px", background: W.surface, borderRadius: "10px", padding: "12px 16px", border: `1px solid ${W.borderLt}` }}>
                <p style={{ margin: "0 0 2px", fontSize: "0.78rem", fontWeight: 700, color: W.terracotta }}>{name}</p>
                <p style={{ margin: "0 0 8px", fontSize: "0.76rem", fontWeight: 600, color: W.inkMid }}>{eighthHouseTitle(r, lang)}</p>
                {r.role === "NOT_APPLIED" ? (
                  <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>{eighthHouseNotApplied(lang)}</p>
                ) : (
                  <>
                    {(["LAGNA", "MOON", "D9_LAGNA"] as const).map((ref) => {
                      const rows = r.factors.filter((f) => f.reference === ref);
                      if (!rows.length) return null;
                      return (
                        <div key={ref} style={{ marginBottom: "8px" }}>
                          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: W.inkMid, marginBottom: "4px" }}>{eighthHouseGroupLabel(ref, lang)}</div>
                          <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            {rows.map((f, i) => (
                              <li key={i} style={{ fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.55 }}>
                                {eighthHouseLine(f, lang)}
                                {f.alsoCountedIn.length > 0 && (
                                  <span style={{ display: "block", fontSize: "0.72rem", color: W.muted }}>{eighthHouseAlsoCounted(f, lang)}</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    {eighthHouseD9Note(r, lang) && (
                      <p style={{ margin: 0, fontSize: "0.72rem", color: W.muted }}>{eighthHouseD9Note(r, lang)}</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          {eighthHouseJointLines(d.eighthHouse, lang).length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {eighthHouseJointLines(d.eighthHouse, lang).map((line, i) => (
                  <li key={i} style={{ fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.55 }}>{line}</li>
                ))}
              </ul>
              <p style={{ margin: "6px 0 0", fontSize: "0.72rem", color: W.muted, lineHeight: 1.55 }}>{EIGHTH_HOUSE_JOINT_NOTE[lang]}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── FAA-32: children, both charts. Not a level: no points. ── */}
      {d.jointProgeny && (
        <SectionCard title={JOINT_PROGENY_HEADING[lang]}>
          <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
            {JOINT_PROGENY_INTRO[lang]}
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { name: d.personAName, r: d.jointProgeny.personA },
              { name: d.personBName, r: d.jointProgeny.personB },
            ].map(({ name, r }, idx) => (
              <div key={idx} style={{ flex: 1, minWidth: "240px", background: W.surface, borderRadius: "10px", padding: "12px 16px", border: `1px solid ${W.borderLt}` }}>
                <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 700, color: W.terracotta }}>{name}</p>
                {PROGENY_GROUPS.map((group) => {
                  const rows = r.factors.filter((f) => progenyGroup(f) === group);
                  if (!rows.length) return null;
                  return (
                    <div key={group} style={{ marginBottom: "8px" }}>
                      <div style={{ fontSize: "0.74rem", fontWeight: 700, color: W.inkMid, marginBottom: "4px" }}>{progenyGroupLabel(group, r, lang)}</div>
                      <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {rows.map((f, i) => (
                          <li key={i} style={{ fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.55 }}>
                            {progenyLine(f, lang)}
                            {progenyBearing(f, lang) && (
                              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: f.bearing === "SUPPORTIVE" ? W.sage : W.muted }}>
                                {" "}· {progenyBearing(f, lang)}
                              </span>
                            )}
                            {f.alsoCountedIn.length > 0 && (
                              <span style={{ display: "block", fontSize: "0.72rem", color: W.muted }}>{progenyAlsoCounted(f, lang)}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                {[progenyNinthNotApplied(r, lang), progenyD7Note(r, lang)].filter(Boolean).map((note, i) => (
                  <p key={i} style={{ margin: "4px 0 0", fontSize: "0.72rem", color: W.muted }}>{note}</p>
                ))}
              </div>
            ))}
          </div>
          <ul style={{ margin: "10px 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {d.jointProgeny.joint.map((j) => (
              <li key={j.key} style={{ fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.55 }}>{progenyJointLine(j.key, j.pattern, lang)}</li>
            ))}
          </ul>
          <p style={{ margin: "12px 0 4px", fontSize: "0.76rem", fontWeight: 700, color: W.inkMid }}>{progenyTimingHeading(lang)}</p>
          <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: W.muted, lineHeight: 1.55 }}>{progenyTimingIntro(d.jointProgeny, lang)}</p>
          {progenyTimingEmpty(d.jointProgeny, lang) ? (
            <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted }}>{progenyTimingEmpty(d.jointProgeny, lang)}</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {d.jointProgeny.windows.map((w, i) => (
                <li key={i} style={{ fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.55 }}>
                  {progenyWindowLine(w, d.personAName, d.personBName, lang)}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}

      {/* ── FAA-31: dasa sandhi. Not a level: dates only, no points. ── */}
      {d.dasaSandhi && (
        <SectionCard title={DASA_SANDHI_HEADING[lang]}>
          <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
            {DASA_SANDHI_INTRO[lang]}
          </p>
          <p style={{ margin: "0 0 4px", fontSize: "0.82rem", color: W.inkMid, lineHeight: 1.55, fontWeight: 600 }}>
            {dasaSandhiBandLine(d.dasaSandhi, lang)}
          </p>
          <p style={{ margin: "0 0 10px", fontSize: "0.72rem", color: W.muted }}>
            {dasaSandhiHorizon(d.dasaSandhi, lang)}
          </p>
          {d.dasaSandhi.pairs.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {d.dasaSandhi.pairs.map((p, i) => (
                <li key={i} style={{ fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.55 }}>
                  {dasaSandhiPairLine(p, d.personAName, d.personBName, lang)}
                  <span style={{ display: "block", fontSize: "0.72rem", color: W.muted }}>
                    {dasaSandhiWindowLine(p, lang)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: W.muted, lineHeight: 1.55 }}>
            {DASA_SANDHI_NOTE[lang]}
          </p>
        </SectionCard>
      )}

      {/* ── Dasha Harmony ── */}
      <SectionCard title={en ? "Level 6 — Dasa Alignment (current period)" : "நிலை 6 — தசை இணக்கம் (நடப்புக் காலம்)"}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
          <Badge
            text={verdictPhraseOrKey("harmony", d.dashaHarmony.harmonyLabel, en ? "en" : "ta")}
            {...harmonyBadge(d.dashaHarmony.harmonyLabel)}
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.78rem", color: W.muted, background: W.surface, border: `1px solid ${W.border}`, borderRadius: "999px", padding: "2px 10px" }}>
              {d.personAName}: {tPlanetLord(d.dashaHarmony.personAMahaLord, en ? "en" : "ta")} / {tPlanetLord(d.dashaHarmony.personAantarLord, en ? "en" : "ta")} {en ? "until" : "வரை"} {d.dashaHarmony.personAMahaEnd}
            </span>
            <span style={{ fontSize: "0.78rem", color: W.muted, background: W.surface, border: `1px solid ${W.border}`, borderRadius: "999px", padding: "2px 10px" }}>
              {d.personBName}: {tPlanetLord(d.dashaHarmony.personBMahaLord, en ? "en" : "ta")} / {tPlanetLord(d.dashaHarmony.personBAntarLord, en ? "en" : "ta")} {en ? "until" : "வரை"} {d.dashaHarmony.personBMahaEnd}
            </span>
          </div>
        </div>
        <ScoreBar score={d.dashaHarmony.score} max={15} label="" />
        <p style={{ margin: "10px 0 0", fontSize: "0.83rem", color: W.inkMid, lineHeight: 1.65 }}>
          {en ? d.dashaHarmony.noteEn : d.dashaHarmony.noteTa}
        </p>
        {/* F-CI-04: this is the only layer that is not a property of the two
            charts — it reads the dashas running today, so the composite moves
            as they advance. Said plainly rather than left for a reader to
            discover by running the same report twice. */}
        <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: W.muted, fontStyle: "italic" }}>
          {en
            ? "This level reflects the periods running today, not a fixed property of the two charts — it will change as the dashas advance. The other levels do not move."
            : "இந்த நிலை இன்று நடக்கும் தசைகளைக் குறிக்கிறது; இது ஜாதகங்களின் நிலையான பண்பு அல்ல — தசை மாறும்போது இதுவும் மாறும். மற்ற நிலைகள் மாறாது."}
        </p>
      </SectionCard>

      {/* ── Emotional Compatibility ── */}
      <SectionCard title={en ? "Level 7 — Emotional Compatibility" : "நிலை 7 — உணர்வு இணக்கம்"}>
        <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: W.inkMid, lineHeight: 1.6 }}>
          {en
            ? "Two simple comparisons. The Moon sign (rasi) shows how each of you feels and reacts; the sign Venus is in shows how each of you shows love. We count how far apart your two signs are."
            : "இரண்டு எளிய ஒப்பீடுகள். ராசி (சந்திரன் உள்ள ராசி) ஒவ்வொருவரும் எப்படி உணர்கிறார், எப்படி எதிர்வினை செய்கிறார் என்பதைக் காட்டும்; சுக்கிரன் உள்ள ராசி அன்பை எப்படி வெளிப்படுத்துகிறார் என்பதைக் காட்டும். இருவரின் ராசிகளும் எத்தனை இடம் இடைவெளியில் உள்ளன என்று எண்ணுகிறோம்."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
          {/* Emotional wavelength (Moon) */}
          <div style={{ background: W.surface, borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: W.inkMid }}>
                {en ? "Emotional wavelength" : "உணர்வுத் தாளம்"}
              </span>
              <Badge
                text={verdictPhraseOrKey("harmony", d.emotional.moonMoonHarmony, en ? "en" : "ta")}
                {...harmonyBadge(d.emotional.moonMoonHarmony)}
              />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.55 }}>
              {en
                ? `${d.personAName}: ${rasiDisplayName(d.personAIdentity.rasi, lang)} · ${d.personBName}: ${rasiDisplayName(d.personBIdentity.rasi, lang)} — counted from ${d.personAName}'s sign, ${d.personBName}'s is number ${signCount(d.personAIdentity.rasi, d.personBIdentity.rasi)}.`
                : `${d.personAName}: ${rasiDisplayName(d.personAIdentity.rasi, lang)} · ${d.personBName}: ${rasiDisplayName(d.personBIdentity.rasi, lang)} — ${d.personAName} ராசியிலிருந்து எண்ணினால் ${d.personBName} ராசி ${signCount(d.personAIdentity.rasi, d.personBIdentity.rasi)}ஆம் இடம்.`}
            </p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
              {moonGloss(d.emotional.moonMoonHarmony, en)}
            </p>
          </div>
          {/* Affection & romance (Venus) */}
          <div style={{ background: W.surface, borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: W.inkMid }}>
                {en ? "Affection & romance style" : "அன்பு & காதல் பாணி"}
              </span>
              <Badge
                text={verdictPhraseOrKey("harmony", d.emotional.venusMarsHarmony, en ? "en" : "ta")}
                {...harmonyBadge(d.emotional.venusMarsHarmony)}
              />
            </div>
            {(() => {
              const va = venusSign(d.personAIdentity.lagnaRasi, d.chartAStrength.venusHouse);
              const vb = venusSign(d.personBIdentity.lagnaRasi, d.chartBStrength.venusHouse);
              return (
                <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: W.inkMid, lineHeight: 1.55 }}>
                  {en
                    ? `${tPlanetLord("VENUS", "en")} — ${d.personAName}: ${rasiDisplayName(va, lang)} · ${d.personBName}: ${rasiDisplayName(vb, lang)} — counted from ${d.personAName}'s, ${d.personBName}'s is number ${signCount(va, vb)}.`
                    : `${tPlanetLord("VENUS", "ta")} — ${d.personAName}: ${rasiDisplayName(va, lang)} · ${d.personBName}: ${rasiDisplayName(vb, lang)} — ${d.personAName} சுக்கிர ராசியிலிருந்து எண்ணினால் ${d.personBName} சுக்கிர ராசி ${signCount(va, vb)}ஆம் இடம்.`}
                </p>
              );
            })()}
            <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
              {venusGloss(d.emotional.venusMarsHarmony, en)}
            </p>
          </div>
        </div>
        {/* The bar shows what this level adds to the overall score (out of 5),
            the same scale as the score breakdown at the top. It used to show the
            native 0-10 score, so a "7/10" here added only 4 points up there. */}
        <ScoreBar score={d.scoreBreakdown.emotional} max={5} label="" />
        <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: W.muted }}>
          {en
            ? `Adds ${d.scoreBreakdown.emotional} of 5 points to the overall score of 100.`
            : `ஒட்டுமொத்த 100 மதிப்பெண்ணில் 5-க்கு ${d.scoreBreakdown.emotional} சேர்க்கிறது.`}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: W.muted, fontStyle: "italic" }}>
          {en ? d.emotional.communicationNote : (d.emotional.communicationNoteTa || d.emotional.communicationNote)}
        </p>
      </SectionCard>

      {/* ── FAA-33: cross-chart observations. Not a level: no points. ── */}
      {d.crossChart && d.crossChart.length > 0 && (
        <SectionCard title={en ? "Chart-to-chart observations" : "ஜாதக ஒப்பீட்டுக் குறிப்புகள்"}>
          <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
            {en
              ? "Where each chart's key points fall in the other chart. These are observations for your astrologer to read with the full charts; they do not change the score."
              : "ஒவ்வொரு ஜாதகத்தின் முக்கிய நிலைகள் மற்ற ஜாதகத்தில் எங்கு வருகின்றன என்பதைக் காட்டுகிறது. இவை முழு ஜாதகத்துடன் ஜோதிடர் பார்க்க வேண்டிய குறிப்புகள்; மதிப்பெண்ணை மாற்றாது."}
          </p>
          {(["A_TO_B", "B_TO_A"] as const).map((dir) => {
            const src = dir === "A_TO_B" ? d.personAName : d.personBName;
            const dst = dir === "A_TO_B" ? d.personBName : d.personAName;
            const rows = (d.crossChart ?? []).filter((o) => o.direction === dir && crossChartRowVisible(o));
            return (
              <div key={dir} style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: W.inkMid, marginBottom: "6px" }}>
                  {src} → {dst}
                </div>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {rows.map((o, i) => (
                    <li key={i} style={{ fontSize: "0.8rem", color: W.inkMid, lineHeight: 1.55 }}>
                      {crossChartLine(o, src, dst, lang)}{" "}
                      <span style={{ fontSize: "0.72rem", color: crossChartTone(o) === "favourable" ? W.sage : W.muted, fontWeight: 600 }}>
                        · {crossChartBadge(o, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </SectionCard>
      )}

      {/* ── Synastry ── */}
      <SectionCard title={en ? "Level 8 — Planet Angles (Synastry)" : "நிலை 8 — கிரகக் கோண ஒப்பீடு (சினாஸ்ட்ரி)"}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
          <span style={{ fontSize: "1.6rem", fontWeight: 700, color: scoreColor(d.synastryScore / 100) }}>
            {d.synastryScore}
          </span>
          <span style={{ fontSize: "0.88rem", color: W.muted }}>/100</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: W.inkMid }}>{synastryBand(d.synastryScore, en)}</span>
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", color: W.inkMid, lineHeight: 1.6 }}>
          {en
            ? "This compares the exact angles between six pairs of planets across your two charts: Venus with Venus, each person's Venus with the other's Mars, Moon with Moon, and each person's Sun with the other's Moon. It starts at 50. Easy angles raise it; tense angles lower it."
            : "இது இரு ஜாதகங்களிலும் உள்ள ஆறு கிரக ஜோடிகளுக்கு இடையிலான துல்லியமான கோணங்களை ஒப்பிடுகிறது: சுக்கிரன்–சுக்கிரன், ஒருவரின் சுக்கிரன்–மற்றவரின் செவ்வாய், சந்திரன்–சந்திரன், ஒருவரின் சூரியன்–மற்றவரின் சந்திரன். 50-இல் தொடங்கும்; இணக்கமான கோணங்கள் கூட்டும், இறுக்கமான கோணங்கள் குறைக்கும்."}
        </p>
        {/* The 0-5 contribution bar is gone with the weight: as of 2026-08-28
            Synastry carries no points in the composite, so a bar would read as
            a score of zero rather than as a layer that is shown for context.
            The copy below states that outright — a panel that kept saying "up
            to 5 points" beside a weight of 0 is the exact defect where an
            explanation contradicts its own numbers. */}
        <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: W.muted }}>
          {en
            ? "This is not one of the Tamil ten poruthams, so it adds nothing to the overall score. It is shown only as extra context."
            : "இது தமிழ் பத்துப் பொருத்தங்களில் ஒன்றல்ல; அதனால் ஒட்டுமொத்த மதிப்பெண்ணில் சேர்க்கப்படவில்லை. கூடுதல் தகவலுக்காக மட்டுமே காட்டப்படுகிறது."}
        </p>
      </SectionCard>

      {/* ── Refresh ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => void downloadPdf()}
          disabled={downloadingPdf}
          style={{
            fontSize: "0.8rem", color: downloadingPdf ? W.muted : W.inkMid, background: W.surface,
            border: `1px solid ${W.border}`, borderRadius: "999px", padding: "6px 16px",
            cursor: downloadingPdf ? "wait" : "pointer", fontFamily: "inherit", fontWeight: 600,
          }}
        >
          {downloadingPdf
            ? (en ? "Downloading PDF…" : "PDF பதிவிறக்குகிறது…")
            : (en ? "Download Full Report PDF" : "முழு அறிக்கை PDF பதிவிறக்கம்")}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          style={{
            fontSize: "0.8rem", color: W.muted, background: "none",
            border: `1px solid ${W.border}`, borderRadius: "999px", padding: "6px 16px",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {loading ? "…" : (en ? "Refresh" : "புதுப்பி")}
        </button>
      </div>

    </div>
  );
}
