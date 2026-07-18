"use client";

import { useEffect, useRef, useState } from "react";

import type { Lang } from "@/lib/i18n";
import {
  getFamilyHarmonyRemedies,
  type FamilyHarmonyRemedyItem,
} from "@vinaadi/shared/api/familyVault";

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

const SIGNAL_META: Record<string, { icon: string; ta: string; en: string; color: string }> = {
  COMBUST_SHARED:    { icon: "☀", ta: "அஸ்தமனம்", en: "Combust",    color: "var(--color-accent-strong)" },
  NODE_FRICTION:     { icon: "☍", ta: "ராகு-கேது", en: "Nodes",      color: "var(--color-low)" },
  RETROGRADE_LOAD:   { icon: "↺", ta: "வக்ரம்",     en: "Retrograde", color: "var(--color-mid)" },
  CHILD_WEAK_PLANET: { icon: "✦", ta: "குழந்தை",   en: "Child",      color: "var(--color-high)" },
};

function NovaKicker({ children, color = "var(--color-accent)" }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color }}>
      {children}
    </p>
  );
}

function RemedyCard({ lang, item }: { lang: Lang; item: FamilyHarmonyRemedyItem }) {
  const meta = SIGNAL_META[item.signal] ?? { icon: "◈", ta: "பரிகாரம்", en: "Remedy", color: "var(--color-accent)" };
  const title = lang === "ta" ? item.titleTa : item.titleEn;
  const finding = lang === "ta" ? item.findingTa : item.findingEn;
  const remedy = lang === "ta" ? item.remedyTa : item.remedyEn;
  const temple = lang === "ta" ? item.templeTa : item.templeEn;
  const daanam = lang === "ta" ? item.daanamTa : item.daanamEn;

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "11px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "8px", background: "var(--color-accent-muted)", color: meta.color, display: "grid", placeItems: "center", fontSize: "15px" }}>
          {meta.icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-strong)" }}>{title}</div>
          <div style={{ fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600, color: meta.color }}>
            {lang === "ta" ? meta.ta : meta.en}
          </div>
        </div>
      </div>

      {/* Read-from member chips — the grounding: which charts this came from. */}
      {item.members.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "10.5px", color: "var(--color-faint)" }}>{lang === "ta" ? "ஜாதகம்:" : "read from:"}</span>
          {item.members.map((name) => (
            <span key={name} style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "2px 9px" }}>
              {name}
            </span>
          ))}
        </div>
      )}

      <div style={{ fontSize: "12.5px", lineHeight: 1.6, color: "var(--color-muted)" }}>{finding}</div>
      <div style={{ fontSize: "13px", lineHeight: 1.65, color: "var(--color-text)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "10px", padding: "11px 13px" }}>
        {remedy}
      </div>

      {/* Structured meta pulled from the shared remedy catalogue. */}
      {(item.day || temple || daanam) && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {item.day && <MetaChip label={lang === "ta" ? "நாள்" : "Day"} value={item.day} />}
          {temple && <MetaChip label={lang === "ta" ? "கோவில்" : "Temple"} value={temple} />}
          {daanam && <MetaChip label={lang === "ta" ? "தானம்" : "Daanam"} value={daanam} />}
        </div>
      )}
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ fontSize: "11px", color: "var(--color-muted)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "4px 9px" }}>
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
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <NovaKicker>{lang === "ta" ? "குடும்ப ஒற்றுமை பரிகாரங்கள்" : "Family harmony remedies"}</NovaKicker>
          <p style={{ margin: "5px 0 0", fontSize: "12.5px", lineHeight: 1.55, color: "var(--color-muted)", maxWidth: "52ch" }}>
            {lang === "ta"
              ? "அனைவரின் ஜாதகத்தையும் ஒன்றாகப் படித்து, அஸ்தமனம் · வக்ரம் · ராகு-கேது நிலை அடிப்படையில் பொதுவான பரிகாரங்கள்."
              : "Everyone's charts read together — shared remedies drawn from combustion, retrogression and node placements across the family."}
          </p>
        </div>
        {!loaded && (
          <button type="button" onClick={() => void load()} disabled={memberCount < 1}
            style={{ flexShrink: 0, fontSize: "12.5px", fontWeight: 700, color: "var(--color-on-accent)", background: "var(--color-accent)", border: "none", borderRadius: "9px", padding: "9px 16px", cursor: "pointer", fontFamily: "inherit" }}>
            {lang === "ta" ? "பரிகாரங்களைக் காட்டு" : "Show remedies"}
          </button>
        )}
      </div>

      {loading && (
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-faint)" }}>
          {lang === "ta" ? "ஜாதகங்களை ஒன்றாகப் படிக்கிறது…" : "Reading the charts together…"}
        </p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-low)" }}>
          {lang === "ta" ? "பரிகாரங்களை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்." : "Couldn't load remedies. Please try again."}
          {" "}
          <button type="button" onClick={() => void load()} style={{ fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
            {lang === "ta" ? "மீண்டும்" : "Retry"}
          </button>
        </p>
      )}

      {loaded && !loading && !error && (
        <>
          {considered.length > 0 && (
            <div style={{ fontSize: "11.5px", color: "var(--color-faint)" }}>
              {lang === "ta" ? "படிக்கப்பட்டவர்: " : "Charts read: "}
              <b style={{ color: "var(--color-muted)", fontWeight: 600 }}>{considered.join(" · ")}</b>
            </div>
          )}

          {items.length === 0 ? (
            <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--color-muted)", background: "var(--color-high-bg)", border: "1px solid var(--color-high-border)", borderRadius: "10px", padding: "14px 16px" }}>
              {lang === "ta"
                ? "இந்தக் குடும்பத்தில் தனிப்பட்ட வலியுறுத்தப்பட்ட பரிகாரங்கள் எதுவும் தேவைப்படவில்லை — இது ஒரு நல்ல அறிகுறி. வழக்கமான குலதெய்வ வழிபாடு போதும்."
                : "No specific family remedies stood out from the charts — a good sign. Your usual family-deity worship is enough."}
            </div>
          ) : (
            <div className="nova-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
              {items.map((item, i) => (
                <RemedyCard key={`${item.signal}-${item.planet ?? ""}-${i}`} lang={lang} item={item} />
              ))}
            </div>
          )}

          {(guaranteeNote || fastingNote) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
              {guaranteeNote && (
                <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.55, color: "var(--color-faint)" }}>{guaranteeNote}</p>
              )}
              {fastingNote && (
                <p style={{ margin: 0, fontSize: "11px", lineHeight: 1.55, color: "var(--color-faint)" }}>{fastingNote}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
