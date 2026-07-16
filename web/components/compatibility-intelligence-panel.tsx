"use client";

import { useState } from "react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import type { CompatibilityIntelligenceData } from "@/lib/types";
import { scoreColorPct } from "@/lib/format";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  familyVaultId: string;
  memberId: string;
  lang: Lang;
  /** Pins Person A to a specific chart (e.g. the Porutham tool's Person 1).
   *  When omitted, Person A defaults to the vault owner. */
  chartIdA?: string;
  personABirth?: {
    displayName: string;
    birthDateLocal: string;
    birthTimeLocal: string | null;
    birthPlace: string;
    birthLatitude: number;
    birthLongitude: number;
    birthTimezone: string;
  };
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

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px",
      background: bg, color, border: `1px solid ${color}33`,
    }}>
      {text}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CompatibilityIntelligencePanel({ familyVaultId, memberId, lang, chartIdA, personABirth }: Props) {
  const en = lang === "en";
  const [data, setData] = useState<CompatibilityIntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ familyVaultId });
      const res = personABirth
        ? await apiFetchJson<{ success: boolean; data: CompatibilityIntelligenceData }>(
            `/api/v1/relationships/${memberId}/compatibility-intelligence/direct?${params.toString()}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ personA: personABirth }),
            }
          )
        : await apiFetchJson<{ success: boolean; data: CompatibilityIntelligenceData }>(
            `/api/v1/relationships/${memberId}/compatibility-intelligence?${(() => {
              if (chartIdA) params.set("chartIdA", chartIdA);
              return params.toString();
            })()}`
          );
      setData(res.data);
    } catch (e) {
      setError(readErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }
  async function downloadPdf() {
    if (!data || downloadingPdf) return;
    setDownloadingPdf(true);
    setError("");
    try {
      const params = new URLSearchParams({ familyVaultId, lang });
      let response: Response;
      if (personABirth) {
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

  const breakdown = [
    { key: "porutham", label: en ? "Porutham (Traditional)" : "பொருத்தம் (பாரம்பரியம்)", score: d.scoreBreakdown.porutham, max: 20 },
    { key: "seventh", label: en ? "7th House Strength" : "7ஆம் இடம் வலிமை", score: d.scoreBreakdown.seventhHouse, max: 20 },
    { key: "navamsa", label: en ? "Navamsa (D9)" : "நவாம்சம் (D9)", score: d.scoreBreakdown.navamsa, max: 20 },
    { key: "dasha", label: en ? "Dasa Alignment" : "தசை இணக்கம்", score: d.scoreBreakdown.dashaHarmony, max: 15 },
    { key: "dosham", label: en ? "Dosham Analysis" : "தோஷம் பகுப்பாய்வு", score: d.scoreBreakdown.doshamAnalysis, max: 10 },
    { key: "emotional", label: en ? "Emotional Compatibility" : "உணர்வு இணக்கம்", score: d.scoreBreakdown.emotional, max: 10 },
    { key: "synastry", label: en ? "Synastry" : "சினாஸ்ட்ரி", score: d.scoreBreakdown.synastry, max: 5 },
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
              text={d.overallLabel}
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
          <Badge text={d.poruthamLabel} {...poruthamLabelBadge(d.poruthamLabel)} />
          {d.rajjuDosha && <Badge text={en ? "⚠ Rajju Dosha" : "⚠ ரஜ்ஜு தோஷம்"} color={W.rust} bg="var(--cl-rust-soft)" />}
          {d.vedhaDosha && <Badge text={en ? "⚠ Vedha Dosha" : "⚠ வேத தோஷம்"} color={W.rust} bg="var(--cl-rust-soft)" />}
          {d.nadiDosha.hasNadiDosha && <Badge text={en ? "⚠ Nadi Dosha" : "⚠ நாடி தோஷம்"} color={W.rust} bg="var(--cl-rust-soft)" />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {d.poruthamKutas.map(k => (
            <div key={k.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ minWidth: "120px", fontSize: "0.8rem", color: W.inkMid }}>{k.name}</span>
              <ScoreBar score={k.score} max={k.maxScore} label={k.label} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── 7th House ── */}
      <SectionCard title={en ? "Level 2+3 — 7th House & Venus Strength" : "நிலை 2+3 — 7ஆம் இடம் & சுக்கிர வலிமை"}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { label: d.personAName, strength: d.chartAStrength },
            { label: d.personBName, strength: d.chartBStrength },
          ].map(({ label, strength }, i) => (
            <div key={i} style={{ flex: 1, minWidth: "200px", background: W.surface, borderRadius: "10px", padding: "12px 16px" }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 700, color: W.terracotta }}>{label}</p>
              <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: W.inkMid }}>
                {en ? `7th Lord: ${strength.seventhLord}` : `7ஆம் அதிபதி: ${strength.seventhLord}`}
                {en ? ` in house ${strength.seventhLordHouse}` : ` ${strength.seventhLordHouse}ஆம் இடம்`}
              </p>
              <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: W.inkMid }}>
                {en ? `Venus in house ${strength.venusHouse}` : `சுக்கிரன் ${strength.venusHouse}ஆம் இடம்`}
                {" · "}{en ? `Strength ${strength.venusStrength}/100` : `வலிமை ${strength.venusStrength}/100`}
              </p>
              {strength.hasMaleficInSeventh && (
                <p style={{ margin: "4px 0 0", fontSize: "0.76rem", color: W.rust }}>
                  ⚠ {en ? "Malefic in 7th house" : "7ஆம் இடத்தில் பாதக கிரகம்"}
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
            text={d.navamsa.harmonyLabel}
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
                  text={sevvai.hasDosham ? (sevvai.isCancelled ? (en ? "Cancelled" : "நீக்கப்பட்டது") : `${sevvai.severity}`) : (en ? "No Dosham" : "தோஷம் இல்லை")}
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

      {/* ── Dasha Harmony ── */}
      <SectionCard title={en ? "Level 6 — Dasa Alignment (Next Period)" : "நிலை 6 — தசை இணக்கம்"}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
          <Badge text={d.dashaHarmony.harmonyLabel} {...harmonyBadge(d.dashaHarmony.harmonyLabel)} />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.78rem", color: W.muted, background: W.surface, border: `1px solid ${W.border}`, borderRadius: "999px", padding: "2px 10px" }}>
              {d.personAName}: {d.dashaHarmony.personAMahaLord} / {d.dashaHarmony.personAantarLord} {en ? "until" : "வரை"} {d.dashaHarmony.personAMahaEnd}
            </span>
            <span style={{ fontSize: "0.78rem", color: W.muted, background: W.surface, border: `1px solid ${W.border}`, borderRadius: "999px", padding: "2px 10px" }}>
              {d.personBName}: {d.dashaHarmony.personBMahaLord} / {d.dashaHarmony.personBAntarLord} {en ? "until" : "வரை"} {d.dashaHarmony.personBMahaEnd}
            </span>
          </div>
        </div>
        <ScoreBar score={d.dashaHarmony.score} max={15} label="" />
        <p style={{ margin: "10px 0 0", fontSize: "0.83rem", color: W.inkMid, lineHeight: 1.65 }}>
          {en ? d.dashaHarmony.noteEn : d.dashaHarmony.noteTa}
        </p>
      </SectionCard>

      {/* ── Emotional Compatibility ── */}
      <SectionCard title={en ? "Level 7 — Emotional Compatibility" : "நிலை 7 — உணர்வு இணக்கம்"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
          {/* Emotional wavelength (Moon) */}
          <div style={{ background: W.surface, borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: W.inkMid }}>
                {en ? "Emotional wavelength" : "உணர்வுத் தாளம்"}
              </span>
              <Badge text={d.emotional.moonMoonHarmony} {...harmonyBadge(d.emotional.moonMoonHarmony)} />
            </div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
              {en
                ? `How you each sense and process feelings (Moon). ${moonGloss(d.emotional.moonMoonHarmony, true)}`
                : `உணர்வுகளை நீங்கள் எப்படி உணர்ந்து அணுகுகிறீர்கள் (சந்திரன்). ${moonGloss(d.emotional.moonMoonHarmony, false)}`}
            </p>
          </div>
          {/* Affection & romance (Venus) */}
          <div style={{ background: W.surface, borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "5px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: W.inkMid }}>
                {en ? "Affection & romance style" : "அன்பு & காதல் பாணி"}
              </span>
              <Badge text={d.emotional.venusMarsHarmony} {...harmonyBadge(d.emotional.venusMarsHarmony)} />
            </div>
            <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
              {en
                ? `How you express love and attraction (Venus). ${venusGloss(d.emotional.venusMarsHarmony, true)}`
                : `அன்பையும் ஈர்ப்பையும் எப்படி வெளிப்படுத்துகிறீர்கள் (சுக்கிரன்). ${venusGloss(d.emotional.venusMarsHarmony, false)}`}
            </p>
          </div>
        </div>
        <ScoreBar score={d.emotional.score} max={10} label="" />
        <p style={{ margin: "10px 0 0", fontSize: "0.83rem", color: W.inkMid, lineHeight: 1.65 }}>
          {en ? d.emotional.noteEn : d.emotional.noteTa}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: W.muted, fontStyle: "italic" }}>
          {d.emotional.communicationNote}
        </p>
      </SectionCard>

      {/* ── Synastry ── */}
      <SectionCard title={en ? "Level 8 — Synastry (Chart-to-Chart)" : "நிலை 8 — சினாஸ்ட்ரி (ஜாதக ஒப்பீடு)"}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "1.6rem", fontWeight: 700, color: scoreColor(d.synastryScore / 100) }}>
            {d.synastryScore}
          </span>
          <span style={{ fontSize: "0.88rem", color: W.muted }}>/100</span>
        </div>
        <ScoreBar score={d.scoreBreakdown.synastry} max={5} label="" />
        <p style={{ margin: "8px 0 0", fontSize: "0.78rem", color: W.muted }}>
          {en
            ? "Synastry (planetary aspects between the two charts) contributes up to 5 points to the overall score."
            : "சினாஸ்ட்ரி (இரு ஜாதகங்களுக்கிடையே கிரக தொடர்புகள்) ஒட்டுமொத்த மதிப்பெண்ணில் 5 புள்ளிகள் வரை பங்களிக்கிறது."}
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
