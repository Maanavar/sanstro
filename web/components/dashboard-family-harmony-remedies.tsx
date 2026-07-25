"use client";

import { useEffect, useRef, useState } from "react";

import { Sun, Orbit, RotateCcw, Baby, Gem, type LucideIcon } from "lucide-react";

import type { Lang } from "@/lib/i18n";
import {
  getFamilyHarmonyRemedies,
  type FamilyHarmonyRemedyItem,
} from "@vinaadi/shared/api/familyVault";
import { Card, Kicker } from "./ui";

/**
 * Family-harmony remedies panel — a consolidated parigaram read across every
 * chart in the vault at once (see app/calculations/family_harmony_remedies.py).
 *
 * Lazy-loaded on a button press like the Family bonds card, because the backend
 * has to load and read every member's chart. Every remedy names the members it
 * was read from (the `members` chips) — nothing here is asserted without a
 * chart behind it — and the no-guarantee + fasting-safety notes ride along in
 * the response `disclaimer`.
 */

const SIGNAL_META: Record<string, { Icon: LucideIcon; ta: string; en: string; color: string }> = {
  COMBUST_SHARED:    { Icon: Sun,      ta: "அஸ்தமனம்", en: "Combust",    color: "var(--color-accent-strong)" },
  NODE_FRICTION:     { Icon: Orbit,    ta: "ராகு-கேது", en: "Nodes",      color: "var(--color-low)" },
  RETROGRADE_LOAD:   { Icon: RotateCcw, ta: "வக்ரம்",     en: "Retrograde", color: "var(--color-mid)" },
  CHILD_WEAK_PLANET: { Icon: Baby,     ta: "குழந்தை",   en: "Child",      color: "var(--color-high)" },
};

function RemedyCard({ lang, item }: { lang: Lang; item: FamilyHarmonyRemedyItem }) {
  const meta = SIGNAL_META[item.signal] ?? { Icon: Gem, ta: "பரிகாரம்", en: "Remedy", color: "var(--color-accent)" };
  const title = lang === "ta" ? item.titleTa : item.titleEn;
  const finding = lang === "ta" ? item.findingTa : item.findingEn;
  const remedy = lang === "ta" ? item.remedyTa : item.remedyEn;
  const temple = lang === "ta" ? item.templeTa : item.templeEn;
  const daanam = lang === "ta" ? item.daanamTa : item.daanamEn;

  return (
    <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4_5) var(--space-5)", gap: "var(--space-2_5)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2_5)" }}>
        <span style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "var(--radius-sm)", background: "var(--color-accent-muted)", color: meta.color, display: "grid", placeItems: "center" }}>
          <meta.Icon size={16} strokeWidth={2} aria-hidden="true" />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-strong)" }}>{title}</div>
          <Kicker as="div" color={meta.color} style={{ letterSpacing: "0.08em", fontWeight: 600 }}>
            {lang === "ta" ? meta.ta : meta.en}
          </Kicker>
        </div>
      </div>

      {/* Read-from member chips — the grounding: which charts this came from. */}
      {item.members.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-1_5)", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>{lang === "ta" ? "ஜாதகம்:" : "read from:"}</span>
          {item.members.map((name) => (
            <span key={name} style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-pill)", padding: "var(--space-0_5) var(--space-2)" }}>
              {name}
            </span>
          ))}
        </div>
      )}

      <div style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--color-muted)" }}>{finding}</div>
      <Card variant="high" style={{ display: "block", fontSize: "var(--text-base)", lineHeight: 1.65, color: "var(--color-text)", borderRadius: "var(--radius-sm)", padding: "var(--space-2_5) var(--space-3)" }}>
        {remedy}
      </Card>

      {/* Structured meta pulled from the shared remedy catalogue. */}
      {(item.day || temple || daanam) && (
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {item.day && <MetaChip label={lang === "ta" ? "நாள்" : "Day"} value={item.day} />}
          {temple && <MetaChip label={lang === "ta" ? "கோவில்" : "Temple"} value={temple} />}
          {daanam && <MetaChip label={lang === "ta" ? "தானம்" : "Daanam"} value={daanam} />}
        </div>
      )}
    </Card>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "var(--space-1) var(--space-2)" }}>
      <b style={{ color: "var(--color-faint)", fontWeight: 600, marginRight: "5px" }}>{label}</b>
      {value}
    </span>
  );
}

export function DashboardFamilyHarmonyRemedies({
  lang,
  vaultId,
  memberCount,
  openSignal = 0,
}: {
  lang: Lang;
  vaultId: string;
  memberCount: number;
  /** Bumped by the parent's "Remedies" nav button — kicks off the first load
   *  so navigating to the panel doesn't dead-end on the "Show remedies" CTA. */
  openSignal?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<FamilyHarmonyRemedyItem[]>([]);
  const [considered, setConsidered] = useState<string[]>([]);
  const [disclaimer, setDisclaimer] = useState<Record<string, string>>({});

  async function load() {
    setLoaded(true);
    setLoading(true);
    setError(false);
    try {
      const res = await getFamilyHarmonyRemedies(vaultId);
      setItems(res.data.items);
      setConsidered(res.data.membersConsidered);
      setDisclaimer(res.data.disclaimer ?? {});
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Auto-load exactly once when the nav button first points here. A ref holds
  // the latest `load` so the effect can depend only on `openSignal` (keeping
  // react-hooks/exhaustive-deps clean); a guard ref makes it fire just once.
  const loadRef = useRef(load);
  loadRef.current = load;
  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (openSignal > 0 && !autoLoadedRef.current) {
      autoLoadedRef.current = true;
      void loadRef.current();
    }
  }, [openSignal]);

  const guaranteeNote = lang === "ta" ? disclaimer.guarantee_note_ta : disclaimer.guarantee_note_en;
  const fastingNote = lang === "ta" ? disclaimer.fasting_caution_ta : disclaimer.fasting_caution_en;

  return (
    <Card style={{ padding: "var(--space-5_5) var(--space-6)", gap: "var(--space-4)" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div>
          <Kicker>{lang === "ta" ? "குடும்ப ஒற்றுமை பரிகாரங்கள்" : "Family harmony remedies"}</Kicker>
          <p style={{ margin: "5px 0 0", fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--color-muted)", maxWidth: "52ch" }}>
            {lang === "ta"
              ? "அனைவரின் ஜாதகத்தையும் ஒன்றாகப் படித்து, அஸ்தமனம் · வக்ரம் · ராகு-கேது நிலை அடிப்படையில் பொதுவான பரிகாரங்கள்."
              : "Everyone's charts read together — shared remedies drawn from combustion, retrogression and node placements across the family."}
          </p>
        </div>
        {!loaded && (
          <button type="button" onClick={() => void load()} disabled={memberCount < 1}
            style={{ flexShrink: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-4)", cursor: "pointer", fontFamily: "inherit" }}>
            {lang === "ta" ? "பரிகாரங்களைக் காட்டு" : "Show remedies"}
          </button>
        )}
      </div>

      {loading && (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>
          {lang === "ta" ? "ஜாதகங்களை ஒன்றாகப் படிக்கிறது…" : "Reading the charts together…"}
        </p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-low)" }}>
          {lang === "ta" ? "பரிகாரங்களை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Couldn't load remedies. Please try again."}
          {" "}
          <button type="button" onClick={() => void load()} style={{ fontSize: "var(--text-sm)", color: "var(--color-accent-strong)", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
            {lang === "ta" ? "மீண்டும்" : "Retry"}
          </button>
        </p>
      )}

      {loaded && !loading && !error && (
        <>
          {considered.length > 0 && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-faint)" }}>
              {lang === "ta" ? "படிக்கப்பட்டவர்: " : "Charts read: "}
              <b style={{ color: "var(--color-muted)", fontWeight: 600 }}>{considered.join(" · ")}</b>
            </div>
          )}

          {items.length === 0 ? (
            <Card variant="high" style={{ display: "block", fontSize: "var(--text-base)", lineHeight: 1.6, color: "var(--color-muted)", borderRadius: "var(--radius-sm)", padding: "var(--space-3_5) var(--space-4)" }}>
              {lang === "ta"
                ? "இந்தக் குடும்பத்தில் தனிப்பட்ட வலியுறுத்தப்பட்ட பரிகாரங்கள் எதுவும் தேவைப்படவில்லை — இது ஒரு நல்ல அறிகுறி. வழக்கமான குலதெய்வ வழிபாடு போதும்."
                : "No specific family remedies stood out from the charts — a good sign. Your usual family-deity worship is enough."}
            </Card>
          ) : (
            <div className="nova-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-3_5)" }}>
              {items.map((item, i) => (
                <RemedyCard key={`${item.signal}-${item.planet ?? ""}-${i}`} lang={lang} item={item} />
              ))}
            </div>
          )}

          {(guaranteeNote || fastingNote) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1_5)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
              {guaranteeNote && (
                <p style={{ margin: 0, fontSize: "var(--text-xs)", lineHeight: 1.55, color: "var(--color-faint)" }}>{guaranteeNote}</p>
              )}
              {fastingNote && (
                <p style={{ margin: 0, fontSize: "var(--text-xs)", lineHeight: 1.55, color: "var(--color-faint)" }}>{fastingNote}</p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
