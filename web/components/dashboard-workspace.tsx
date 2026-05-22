"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { apiFetchJson, readErrorMessage, toQuery } from "@/lib/api";
import { addDays, formatClockLabel, formatDateLabel, getScoreBand, todayIso } from "@/lib/format";
import { LANG_STORAGE_KEY, t, tLang } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { TN_CITIES } from "@/lib/tn-cities";
import type { CityEntry } from "@/lib/tn-cities";
import type {
  ApiEnvelope,
  BirthProfileCreateResponseData,
  ChartCalculateResponseData,
  ChartSummaryData,
  DailyGuidanceData,
  DailyGuidanceRangeData,
  DashaTimelineItem,
  DashaTimelineResponseData,
  FamilyAggregateData,
  FamilyAggregateMember,
  FamilyCalendarData,
  FamilyVaultDetailData,
  FamilyVaultListData,
  FamilyVaultListItem,
  PanchangamDailyResponseData,
  PanchangamTimingsData,
  SaniCycleData,
  TransitSnapshotData,
} from "@/lib/types";

const STORAGE_KEY = "jothidam-ai-dashboard-state";

function generateUUID(): string {
  return crypto.randomUUID();
}

type Tab = "onboarding" | "personal" | "family" | "calendar" | "settings" | "qa";

type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

// Default member weights by relationship (traditional Tamil astrology weightings)
const RELATIONSHIP_WEIGHTS: Record<Relationship, string> = {
  self:        "1.50",
  spouse:      "1.20",
  child:       "1.00",
  parent:      "0.80",
  sibling:     "0.60",
  grandparent: "0.50",
  other:       "0.50",
};

type BirthFormState = {
  ownerUserId: string;
  displayName: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
  relationshipToOwner: Relationship;
  calculateNow: boolean;
};

type VaultFormState = {
  ownerUserId: string;
  name: string;
  defaultLanguage: string;
};

type MemberFormState = {
  displayName: string;
  relationshipToOwner: Relationship;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
  memberWeight: string;
  calculateNow: boolean;
};

type EditMemberState = {
  memberId: string;
  displayName: string;
  relationshipToOwner: Relationship;
  memberWeight: string;
  birthDateLocal: string;
  birthTimeLocal: string;
  birthPlace: string;
  birthLatitude: string;
  birthLongitude: string;
  birthTimezone: string;
};

type MemberChart = {
  memberId: string;
  displayName: string;
  chart: ChartCalculateResponseData;
  summary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  dailyGuidance: DailyGuidanceData | null;
  dasha: DashaTimelineResponseData | null;
  dashaAntar: DashaTimelineItem[];
};

type PersistedState = {
  ownerUserId: string;
  selectedDate: string;
  selectedVaultId: string;
  birthProfileId: string;
  chartId: string;
  birthForm: BirthFormState;
  vaultForm: VaultFormState;
  memberForm: MemberFormState;
  activeTab: Tab;
  lang: Lang;
};

const defaultBirthForm: BirthFormState = {
  ownerUserId: "",
  displayName: "",
  birthDateLocal: "",
  birthTimeLocal: "",
  birthPlace: "",
  birthLatitude: "",
  birthLongitude: "",
  birthTimezone: "",
  relationshipToOwner: "self",
  calculateNow: true,
};

const defaultVaultForm: VaultFormState = {
  ownerUserId: "",
  name: "",
  defaultLanguage: "ta-en",
};

const defaultMemberForm: MemberFormState = {
  displayName: "",
  relationshipToOwner: "spouse",
  birthDateLocal: "",
  birthTimeLocal: "",
  birthPlace: "",
  birthLatitude: "",
  birthLongitude: "",
  birthTimezone: "",
  memberWeight: RELATIONSHIP_WEIGHTS.spouse,
  calculateNow: true,
};

// TABS labels are set dynamically via lang in the render — see tabLabels()
const TAB_IDS: { id: Tab; emoji: string }[] = [
  { id: "personal",   emoji: "◎" },
  { id: "family",     emoji: "⊕" },
  { id: "calendar",   emoji: "◈" },
  { id: "onboarding", emoji: "✦" },
  { id: "settings",   emoji: "⊙" },
  { id: "qa",         emoji: "⊛" },
];

// Tamil Nadu style 4×3 grid cell positions (raasi 1–12 = Mesham–Meenam)
// Layout: row 0=[12,1,2,3], row 1=[11,_,_,4], row 2=[10,_,_,5], row 3=[9,8,7,6]
const RASI_GRID: { rasi: number; col: number; row: number }[] = [
  { rasi: 12, col: 0, row: 0 }, { rasi: 1,  col: 1, row: 0 }, { rasi: 2,  col: 2, row: 0 }, { rasi: 3,  col: 3, row: 0 },
  { rasi: 11, col: 0, row: 1 },                                                               { rasi: 4,  col: 3, row: 1 },
  { rasi: 10, col: 0, row: 2 },                                                               { rasi: 5,  col: 3, row: 2 },
  { rasi: 9,  col: 0, row: 3 }, { rasi: 8,  col: 1, row: 3 }, { rasi: 7,  col: 2, row: 3 }, { rasi: 6,  col: 3, row: 3 },
];

// Tamil Thirukanitham raasi names
const RASI_NAMES = [
  "", "Mesham", "Rishabam", "Midhunam", "Katakam", "Simmam", "Kanni",
  "Thulam", "Viruchigam", "Dhanus", "Makaram", "Kumbam", "Meenam",
];

// Tamil Thirukanitham graha abbreviations (first letter of Tamil planet name)
// சூரியன்=சூ, சந்திரன்=ச, செவ்வாய்=செ, புதன்=பு, குரு=கு, சுக்ரன்=சு, சனி=சா, ராகு=ரா, கேது=கே, லக்னம்=ல
const GRAHA_ABBR: Record<string, string> = {
  SUN: "சூ", MOON: "ச", MARS: "செ", MERCURY: "பு", JUPITER: "கு",
  VENUS: "சு", SATURN: "சா", RAHU: "ரா", KETU: "கே",
  Sun: "சூ", Moon: "ச", Mars: "செ", Mercury: "பு", Jupiter: "கு",
  Venus: "சு", Saturn: "சா", Rahu: "ரா", Ketu: "கே", Lagna: "ல",
};

// ── Utility components ────────────────────────────────────

function Metric({
  label, value, hint, tone = "mid",
}: {
  label: string; value: string; hint?: string; tone?: "high" | "mid" | "low" | "rest";
}) {
  return (
    <div className={`metric metric--${tone}`}>
      <p className="metric__label">{label}</p>
      <p className="metric__value">{value}</p>
      {hint ? <p className="metric__hint">{hint}</p> : null}
    </div>
  );
}

function Field({ label, children, helper }: { label: string; children: ReactNode; helper?: string }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {helper ? <span className="field__helper">{helper}</span> : null}
    </label>
  );
}

function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "accent" }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}

function Button({
  children, onClick, type = "button", variant = "secondary", disabled, title,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost"; disabled?: boolean; title?: string;
}) {
  return (
    <button className={`button button--${variant}`} type={type} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

function Surface({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface">
      <div className="surface__title">{title}</div>
      {children}
    </div>
  );
}

function PlaceCombobox({ value, onChange }: { value: string; onChange: (city: CityEntry | null, rawText: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const filtered = query.length < 1 ? TN_CITIES : TN_CITIES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  function select(city: CityEntry) { setQuery(city.name); setOpen(false); onChange(city, city.name); }
  function handleInput(text: string) {
    setQuery(text); setOpen(true);
    const exact = TN_CITIES.find((c) => c.name.toLowerCase() === text.toLowerCase());
    onChange(exact ?? null, text);
  }
  return (
    <div style={{ position: "relative" }}>
      <input className="input" value={query} placeholder="Type a city…" autoComplete="off"
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => handleInput(e.target.value)} />
      {open && filtered.length > 0 && (
        <ul style={{
          position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0,
          background: "var(--surface, #1c1c1e)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "8px", marginTop: "4px", maxHeight: "220px", overflowY: "auto",
          padding: "4px 0", listStyle: "none",
        }}>
          {filtered.slice(0, 40).map((city) => (
            <li key={city.name} onMouseDown={() => select(city)}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-primary, #fff)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
              {city.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tamil Nadu style Rasi chart (4×3 south-Indian grid) ──

function RasiChart({ chart, label }: { chart: ChartCalculateResponseData; label?: string }) {
  // Build rasi→occupants map
  const rasiMap: Record<number, string[]> = {};
  for (let i = 1; i <= 12; i++) rasiMap[i] = [];

  // Place lagna first
  rasiMap[chart.lagna.rasi].push("ல");
  for (const p of chart.planets) {
    rasiMap[p.rasi].push(GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2));
  }

  const cellSize = 72;
  const gap = 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      {label ? <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>{label}</p> : null}
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`, gap: `${gap}px`,
        border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", overflow: "hidden",
      }}>
        {RASI_GRID.map(({ rasi, col, row }) => {
          const isLagna = rasi === chart.lagna.rasi;
          const occupants = rasiMap[rasi] ?? [];
          return (
            <div key={rasi} style={{
              gridColumn: col + 1, gridRow: row + 1,
              background: isLagna
                ? "rgba(229,184,77,0.12)"
                : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "4px", display: "flex", flexDirection: "column",
              justifyContent: "space-between", position: "relative", minWidth: 0,
            }}>
              <span style={{
                fontSize: "0.6rem", color: "rgba(255,255,255,0.35)",
                lineHeight: 1, display: "block",
              }}>
                {RASI_NAMES[rasi]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "flex-end" }}>
                {occupants.map((g) => (
                  <span key={g} style={{
                    fontSize: "0.68rem", fontWeight: 600, lineHeight: 1,
                    color: g === "ல" ? "#e5b84d" : g === "சா" ? "#f87171" : g === "ரா" || g === "கே" ? "#a78bfa" : "#93c5fd",
                    background: "rgba(0,0,0,0.3)", borderRadius: "3px", padding: "1px 3px",
                  }}>{g}</span>
                ))}
              </div>
            </div>
          );
        })}
        {/* Centre 2×2 — vault name or person name */}
        <div style={{
          gridColumn: "2 / 4", gridRow: "2 / 4",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: "0.7rem", color: "rgba(255,255,255,0.3)",
            textAlign: "center", padding: "4px", lineHeight: 1.3,
          }}>
            {chart.birthProfile.displayName}<br />
            <span style={{ fontSize: "0.6rem" }}>{RASI_NAMES[chart.lagna.rasi]} La</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Navamsa (D9) chart ────────────────────────────────────

function NavamsaChart({ chart, label }: { chart: ChartCalculateResponseData; label?: string }) {
  // D9 lagna rasi: apply same navamsa formula to lagna longitude
  // Navamsam lagnam: each raasi has 9 navamsam padas (3°20' each)
  // Modality start: Agni/Vayu (fire/air) → Mesham(0), Prithvi (earth) → Makaram(9), Jala (water) → Katakam(3)
  const lagnaAbs = chart.lagna.absoluteLongitude;
  const lagnaRasiIdx = Math.floor(lagnaAbs / 30); // 0-based
  const degInRasi = lagnaAbs % 30;
  const pada = Math.floor(degInRasi / (30 / 9)); // 0-based padam within raasi (0–8)
  const modalityStart = [0, 9, 6, 3, 0, 9, 6, 3, 0, 9, 6, 3]; // index = raasi 0-based
  const d9LagnaRasi = ((modalityStart[lagnaRasiIdx] + pada) % 12) + 1;

  const rasiMap: Record<number, string[]> = {};
  for (let i = 1; i <= 12; i++) rasiMap[i] = [];
  rasiMap[d9LagnaRasi].push("ல");
  for (const p of chart.planets) {
    rasiMap[p.d9Rasi].push(GRAHA_ABBR[p.graha] ?? p.graha.slice(0, 2));
  }

  const cellSize = 72;
  const gap = 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      {label ? <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>{label}</p> : null}
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`, gap: `${gap}px`,
        border: "1px solid rgba(167,139,250,0.25)", borderRadius: "6px", overflow: "hidden",
      }}>
        {RASI_GRID.map(({ rasi, col, row }) => {
          const isD9Lagna = rasi === d9LagnaRasi;
          const occupants = rasiMap[rasi] ?? [];
          return (
            <div key={rasi} style={{
              gridColumn: col + 1, gridRow: row + 1,
              background: isD9Lagna ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "4px", display: "flex", flexDirection: "column",
              justifyContent: "space-between", position: "relative", minWidth: 0,
            }}>
              <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", lineHeight: 1, display: "block" }}>
                {RASI_NAMES[rasi]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px", alignItems: "flex-end" }}>
                {occupants.map((g) => (
                  <span key={g} style={{
                    fontSize: "0.68rem", fontWeight: 600, lineHeight: 1,
                    color: g === "ல" ? "#a78bfa" : g === "சா" ? "#f87171" : g === "ரா" || g === "கே" ? "#a78bfa" : "#93c5fd",
                    background: "rgba(0,0,0,0.3)", borderRadius: "3px", padding: "1px 3px",
                  }}>{g}</span>
                ))}
              </div>
            </div>
          );
        })}
        <div style={{
          gridColumn: "2 / 4", gridRow: "2 / 4",
          background: "rgba(167,139,250,0.04)",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "4px", lineHeight: 1.3 }}>
            {chart.birthProfile.displayName}<br />
            <span style={{ fontSize: "0.6rem" }}>Navamsam · {RASI_NAMES[d9LagnaRasi]} La</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Dasha timeline component ──────────────────────────────

const DASHA_COLORS: Record<string, string> = {
  SUN: "#f59e0b", MOON: "#93c5fd", MARS: "#f87171", MERCURY: "#34d399",
  JUPITER: "#fbbf24", VENUS: "#f0abfc", SATURN: "#94a3b8", RAHU: "#a78bfa", KETU: "#6b7280",
};

function dashaStatus(startDate: string, endDate: string, today: string): "past" | "active" | "upcoming" {
  if (endDate < today) return "past";
  if (startDate <= today && endDate >= today) return "active";
  return "upcoming";
}

function dashaScore(lord: string, dashaSupport: number): number {
  // Rough lord-based baseline score (0-100); active period overrides with real dashaSupport
  const BASE: Record<string, number> = {
    JUPITER: 78, VENUS: 72, MERCURY: 65, MOON: 62, SUN: 58,
    MARS: 52, SATURN: 48, RAHU: 44, KETU: 42,
  };
  return BASE[lord] ?? 55;
}

function DashaTimeline({
  dasha,
  dashaAntar,
  today,
  dashaSupport,
  lang,
}: {
  dasha: DashaTimelineResponseData;
  dashaAntar: DashaTimelineItem[];
  today: string;
  dashaSupport: number;
  lang: Lang;
}) {
  const currentMahaDasa = dasha.current.mahadasha.lord;
  const currentBhukti = dasha.current.antardasha.lord;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      {dasha.timeline.map((period) => {
        const status = dashaStatus(String(period.startDate), String(period.endDate), today);
        const isCurrentDasa = period.lord === currentMahaDasa && status === "active";
        const color = DASHA_COLORS[period.lord] ?? "#94a3b8";
        const score = isCurrentDasa ? dashaSupport : dashaScore(period.lord, dashaSupport);
        const isPast = status === "past";

        return (
          <div key={`${period.lord}-${period.startDate}`} style={{
            borderRadius: "10px",
            border: isCurrentDasa
              ? `2px solid ${color}99`
              : isPast
                ? "1px solid rgba(255,255,255,0.05)"
                : "1px solid rgba(255,255,255,0.07)",
            background: isCurrentDasa
              ? `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`
              : isPast
                ? "rgba(255,255,255,0.01)"
                : "rgba(255,255,255,0.02)",
            overflow: "hidden",
          }}>
            {/* Running Dasa glow bar */}
            {isCurrentDasa && (
              <div style={{ height: "3px", background: `linear-gradient(90deg, ${color}, ${color}44)`, borderRadius: "10px 10px 0 0" }} />
            )}

            {/* Maha Dasa row */}
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: isCurrentDasa ? "10px 14px 8px" : "7px 12px",
            }}>
              <div style={{
                width: isCurrentDasa ? "12px" : "8px",
                height: isCurrentDasa ? "12px" : "8px",
                borderRadius: "50%", background: color, flexShrink: 0,
                boxShadow: isCurrentDasa ? `0 0 8px ${color}` : "none",
              }} />
              <span style={{
                fontSize: isCurrentDasa ? "0.92rem" : "0.82rem",
                fontWeight: isCurrentDasa ? 800 : isPast ? 400 : 500,
                color: isCurrentDasa ? color : isPast ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.65)",
                minWidth: "90px",
              }}>
                {period.lord} {t("dasha_word", lang)}
              </span>
              <span style={{ fontSize: "0.72rem", color: isPast ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)", flex: 1 }}>
                {String(period.startDate)} → {String(period.endDate)}
              </span>
              <span style={{
                fontSize: "0.68rem", fontWeight: 700, padding: "2px 10px", borderRadius: "999px",
                background: isCurrentDasa ? color + "33" : isPast ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.04)",
                color: isCurrentDasa ? color : isPast ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)",
                border: `1px solid ${isCurrentDasa ? color + "77" : "rgba(255,255,255,0.07)"}`,
              }}>
                {isCurrentDasa ? t("status_active", lang) : isPast ? t("status_past", lang) : t("status_upcoming", lang)}
              </span>
              <span style={{
                fontSize: "0.75rem", fontWeight: 700, minWidth: "52px", textAlign: "right",
                color: isCurrentDasa
                  ? (score >= 65 ? "#4ade80" : score >= 45 ? "#fbbf24" : "#f87171")
                  : isPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)",
              }}>
                {isCurrentDasa || !isPast ? `${score}/100` : "—"}
              </span>
            </div>

            {/* Bhukti rows — only under current running Dasa */}
            {isCurrentDasa && dashaAntar.length > 0 && (
              <div style={{
                margin: "0 10px 10px 34px",
                borderLeft: `2px solid ${color}44`,
                paddingLeft: "12px",
                display: "flex", flexDirection: "column", gap: "2px",
              }}>
                {dashaAntar.map((bhukti) => {
                  const bhuktiStatus = dashaStatus(String(bhukti.startDate), String(bhukti.endDate), today);
                  const isCurrentBhukti = bhukti.lord === currentBhukti && bhuktiStatus === "active";
                  const bhuktiColor = DASHA_COLORS[bhukti.lord] ?? "#94a3b8";
                  const bhuktiScore = isCurrentBhukti ? Math.round(dashaSupport * 0.9) : dashaScore(bhukti.lord, dashaSupport);
                  const bhuktiPast = bhuktiStatus === "past";
                  return (
                    <div key={`bhukti-${bhukti.lord}-${bhukti.startDate}`}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: isCurrentBhukti ? "6px 10px" : "4px 8px",
                        borderRadius: "7px",
                        background: isCurrentBhukti ? `${bhuktiColor}22` : "transparent",
                        border: isCurrentBhukti
                          ? `1px solid ${bhuktiColor}66`
                          : bhuktiPast
                            ? "1px solid rgba(255,255,255,0.04)"
                            : "1px solid rgba(255,255,255,0.05)",
                      }}>
                        <div style={{
                          width: isCurrentBhukti ? "8px" : "5px",
                          height: isCurrentBhukti ? "8px" : "5px",
                          borderRadius: "50%", background: bhuktiColor, flexShrink: 0,
                          boxShadow: isCurrentBhukti ? `0 0 6px ${bhuktiColor}` : "none",
                        }} />
                        <span style={{
                          fontSize: isCurrentBhukti ? "0.82rem" : "0.75rem",
                          fontWeight: isCurrentBhukti ? 700 : bhuktiPast ? 300 : 400,
                          color: isCurrentBhukti ? bhuktiColor : bhuktiPast ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)",
                          minWidth: "80px",
                        }}>
                          {bhukti.lord} {t("bhukti_word", lang)}
                        </span>
                        <span style={{ fontSize: "0.67rem", color: bhuktiPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)", flex: 1 }}>
                          {String(bhukti.startDate)} → {String(bhukti.endDate)}
                        </span>
                        <span style={{
                          fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: "999px",
                          background: isCurrentBhukti ? `${bhuktiColor}33` : bhuktiPast ? "rgba(255,255,255,0.04)" : "transparent",
                          color: isCurrentBhukti ? bhuktiColor : bhuktiPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)",
                          border: `1px solid ${isCurrentBhukti ? bhuktiColor + "66" : "rgba(255,255,255,0.06)"}`,
                        }}>
                          {isCurrentBhukti ? t("status_active", lang) : bhuktiPast ? t("status_past", lang) : t("status_upcoming", lang)}
                        </span>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 700, minWidth: "44px", textAlign: "right",
                          color: isCurrentBhukti
                            ? (bhuktiScore >= 65 ? "#4ade80" : bhuktiScore >= 45 ? "#fbbf24" : "#f87171")
                            : bhuktiPast ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.3)",
                        }}>
                          {isCurrentBhukti || !bhuktiPast ? `${bhuktiScore}/100` : "—"}
                        </span>
                      </div>

                      {/* Antaram — only under current running Bhukti */}
                      {isCurrentBhukti && (
                        <div style={{ marginLeft: "20px", marginTop: "2px", borderLeft: `2px solid ${bhuktiColor}33`, paddingLeft: "10px" }}>
                          {[dasha.current.pratyantardasha].map((antaram) => {
                            const antaramColor = DASHA_COLORS[antaram.lord] ?? "#94a3b8";
                            return (
                              <div key={`antaram-${antaram.lord}`} style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "4px 8px", borderRadius: "5px",
                                background: `${antaramColor}18`,
                                border: `1px solid ${antaramColor}55`,
                              }}>
                                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: antaramColor, flexShrink: 0, boxShadow: `0 0 4px ${antaramColor}` }} />
                                <span style={{ fontSize: "0.73rem", fontWeight: 700, color: antaramColor, minWidth: "72px" }}>
                                  {antaram.lord} {t("antaram_word", lang)}
                                </span>
                                <span style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.25)", flex: 1 }}>
                                  {String(antaram.startDate)} → {String(antaram.endDate)}
                                </span>
                                <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: "999px", background: `${antaramColor}33`, color: antaramColor, border: `1px solid ${antaramColor}66` }}>
                                  {t("status_active", lang)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Member card in Family tab ─────────────────────────────

function MemberCard({
  member, memberChart, onDelete, onEdit, deletingId, today, lang,
}: {
  member: FamilyAggregateMember;
  memberChart: MemberChart | undefined;
  onDelete: (memberId: string, name: string) => void;
  onEdit: (member: FamilyAggregateMember) => void;
  deletingId: string;
  today: string;
  lang: Lang;
}) {
  const isChandrashtama = memberChart?.transit?.isChandrashtama ?? false;
  const band = getScoreBand(member.individualScore);

  return (
    <div style={{
      border: `1px solid ${isChandrashtama ? "rgba(248,113,113,0.45)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: "12px",
      background: isChandrashtama
        ? "rgba(239,68,68,0.06)"
        : "rgba(255,255,255,0.025)",
      padding: "16px",
      display: "flex", flexDirection: "column", gap: "12px",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>{member.displayName}</p>
            {isChandrashtama && (
              <span style={{
                fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                background: "rgba(239,68,68,0.2)", color: "#f87171",
                border: "1px solid rgba(248,113,113,0.4)", animation: "pulse 2s infinite",
              }}>
                ⚠ {t("label_chandrashtamam", lang)}
              </span>
            )}
          </div>
          <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
            {member.individualScore}/100 · weight {member.memberWeight.toFixed(2)}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button type="button" className="button button--ghost"
            style={{ fontSize: "0.72rem", padding: "3px 10px" }}
            onClick={() => onEdit(member)} title="Edit member">
            Edit
          </button>
          <button type="button" className="button button--ghost"
            style={{ fontSize: "0.72rem", padding: "3px 10px", opacity: 0.6, color: "#f87171" }}
            disabled={deletingId === member.familyMemberId}
            onClick={() => onDelete(member.familyMemberId, member.displayName)} title="Remove member">
            {deletingId === member.familyMemberId ? "…" : "Remove"}
          </button>
        </div>
      </div>

      {/* Score + cycle tags */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        <span className={`chip chip--${band.tone === "high" ? "success" : band.tone === "low" ? "warning" : "neutral"}`}>
          {member.individualScore}/100 {band.label}
        </span>
        {member.activeCycleTags.map((tag) => (
          <Chip key={tag} tone={tag.includes("SANI") ? "warning" : "neutral"}>{tag}</Chip>
        ))}
      </div>

      {/* D1 + D9 charts */}
      {memberChart?.chart ? (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <RasiChart chart={memberChart.chart} label={t("label_d1", lang)} />
          <NavamsaChart chart={memberChart.chart} label={t("label_d9", lang)} />
        </div>
      ) : (
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", margin: 0 }}>
          {t("chart_loading", lang)}
        </p>
      )}

      {/* Identity line */}
      {memberChart?.summary ? (
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", margin: 0 }}>
          {memberChart.summary.lagnaRasi} {t("label_lagnam", lang)} · {memberChart.summary.moonRasi} {t("identity_janma", lang)} · {memberChart.summary.janmaNakshatra}
        </p>
      ) : null}

      {/* Dasha / Bhukti verification strip */}
      {memberChart?.dasha ? (() => {
        const d = memberChart.dasha;
        const dashaColor = DASHA_COLORS[d.current.mahadasha.lord] ?? "#94a3b8";
        const bhuktiColor = DASHA_COLORS[d.current.antardasha.lord] ?? "#94a3b8";
        const antaramColor = DASHA_COLORS[d.current.pratyantardasha.lord] ?? "#94a3b8";
        return (
          <div style={{
            borderRadius: "8px", border: `1px solid ${dashaColor}55`,
            background: `${dashaColor}0d`, padding: "10px 12px",
            display: "flex", flexDirection: "column", gap: "6px",
          }}>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.05em" }}>
              {t("dasha_bhukti_antaram", lang)}
            </p>
            {/* Maha Dasa */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: dashaColor, flexShrink: 0 }} />
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: dashaColor, minWidth: "90px" }}>
                {d.current.mahadasha.lord} {t("dasha_word", lang)}
              </span>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
                {d.current.mahadasha.startDate} → {d.current.mahadasha.endDate}
              </span>
            </div>
            {/* Bhukti */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "16px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: bhuktiColor, flexShrink: 0 }} />
              <span style={{ fontSize: "0.77rem", fontWeight: 600, color: bhuktiColor, minWidth: "82px" }}>
                {d.current.antardasha.lord} {t("bhukti_word", lang)}
              </span>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>
                {d.current.antardasha.startDate} → {d.current.antardasha.endDate}
              </span>
            </div>
            {/* Antaram */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "32px" }}>
              <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: antaramColor, flexShrink: 0 }} />
              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: antaramColor, minWidth: "74px" }}>
                {d.current.pratyantardasha.lord} {t("antaram_word", lang)}
              </span>
              <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>
                {d.current.pratyantardasha.startDate} → {d.current.pratyantardasha.endDate}
              </span>
            </div>
            {/* All Bhukti periods for current Dasa — compact inline */}
            {memberChart.dashaAntar.length > 0 && (
              <div style={{ marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                  {d.current.mahadasha.lord} {t("dasha_word", lang)} — {t("dasha_all_bhukti", lang)}
                </p>
                {memberChart.dashaAntar.map((bh) => {
                  const bst = dashaStatus(String(bh.startDate), String(bh.endDate), today);
                  const isRunning = bh.lord === d.current.antardasha.lord && bst === "active";
                  const bc = DASHA_COLORS[bh.lord] ?? "#94a3b8";
                  return (
                    <div key={`mb-${bh.lord}-${bh.startDate}`} style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: isRunning ? "3px 6px" : "1px 4px",
                      borderRadius: "4px",
                      background: isRunning ? `${bc}1a` : "transparent",
                      border: isRunning ? `1px solid ${bc}44` : "1px solid transparent",
                      opacity: bst === "past" ? 0.4 : 1,
                    }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: bc, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.7rem", fontWeight: isRunning ? 700 : 400, color: isRunning ? bc : "rgba(255,255,255,0.5)", minWidth: "70px" }}>
                        {bh.lord} {t("bhukti_word", lang)}
                      </span>
                      <span style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.25)", flex: 1 }}>
                        {String(bh.startDate)} → {String(bh.endDate)}
                      </span>
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 600, padding: "1px 5px", borderRadius: "999px",
                        background: isRunning ? `${bc}33` : bst === "past" ? "rgba(255,255,255,0.04)" : "transparent",
                        color: isRunning ? bc : bst === "past" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)",
                        border: `1px solid ${isRunning ? bc + "55" : "rgba(255,255,255,0.06)"}`,
                      }}>
                        {isRunning ? t("status_active", lang) : bst === "past" ? t("status_past", lang) : t("status_upcoming", lang)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })() : null}

      {/* Today's windows */}
      {memberChart?.dailyGuidance ? (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {memberChart.dailyGuidance.bestWindows.slice(0, 2).map((w) => (
            <Chip key={w.start} tone="success">{t("best_time", lang)} {w.start}–{w.end}</Chip>
          ))}
          {memberChart.dailyGuidance.cautionWindows.slice(0, 1).map((w) => (
            <Chip key={w.start} tone="warning">{t("caution_time", lang)} {w.start}–{w.end}</Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ── Feedback modal ───────────────────────────────────────

function FeedbackModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const [category, setCategory] = useState<"bug" | "calculation" | "suggestion" | "other">("other");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, rating, message: message.trim(), page_context: "dashboard" }),
      });
      setDone(true);
      setTimeout(() => onClose(), 1800);
    } catch {
      setSending(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ width: "min(480px, 100%)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{t("feedback_title", lang)}</h3>
          <button type="button" className="button button--ghost" onClick={onClose}>✕</button>
        </div>

        {done ? (
          <p style={{ textAlign: "center", color: "#4ade80", padding: "24px 0" }}>
            ✓ {t("feedback_thanks", lang)}
          </p>
        ) : (
          <>
            {/* Category */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{t("feedback_category", lang)}</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["bug", "calculation", "suggestion", "other"] as const).map((c) => (
                  <button key={c} type="button"
                    className={`button button--ghost${category === c ? " button--active" : ""}`}
                    style={{ fontSize: "0.78rem", padding: "4px 12px", opacity: category === c ? 1 : 0.5 }}
                    onClick={() => setCategory(c)}>
                    {t(c === "bug" ? "feedback_bug" : c === "calculation" ? "feedback_calc" : c === "suggestion" ? "feedback_suggest" : "feedback_other", lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{t("feedback_rating", lang)}</label>
              <div style={{ display: "flex", gap: "6px" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button"
                    style={{
                      fontSize: "1.3rem", background: "none", border: "none", cursor: "pointer",
                      opacity: rating !== null ? (n <= rating ? 1 : 0.3) : 0.35,
                      filter: rating !== null && n <= rating ? "none" : "grayscale(1)",
                    }}
                    onClick={() => setRating(n === rating ? null : n)}>
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>{t("feedback_message", lang)}</label>
              <textarea className="input" rows={4}
                style={{ resize: "vertical", fontFamily: "inherit" }}
                value={message} onChange={(e) => setMessage(e.target.value)}
                maxLength={2000} placeholder="…" />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="button button--ghost" onClick={onClose} disabled={sending}>
                {t("feedback_cancel", lang)}
              </button>
              <button type="button" className="button button--primary" onClick={() => void handleSend()}
                disabled={sending || !message.trim()}>
                {sending ? t("feedback_sending", lang) : t("feedback_send", lang)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── QA Dashboard tab component ───────────────────────────

import type { QAModuleResult, QARegressionReport, QAValidationResponse } from "@/lib/types";

function QATab({ lang }: { lang: Lang }) {
  const [result, setResult] = useState<QAValidationResponse | null>(null);
  const [regressions, setRegressions] = useState<QARegressionReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function runTests() {
    setRunning(true);
    setError(null);
    try {
      const res = await apiFetchJson<QAValidationResponse>("/api/v1/qa/validate");
      setResult(res);
      const reg = await apiFetchJson<QARegressionReport>("/api/v1/qa/regressions");
      setRegressions(reg);
    } catch (e) {
      setError(readErrorMessage(e));
    } finally {
      setRunning(false);
    }
  }

  async function clearRegressions() {
    try {
      await apiFetchJson("/api/v1/qa/regressions", { method: "DELETE" });
      setRegressions({ total_stored: 0, failures: [] });
    } catch (e) {
      setError(readErrorMessage(e));
    }
  }

  const allPass = result && result.total_failed === 0;

  return (
    <div className="tab-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p className="section-kicker">{t("qa_kicker", lang)}</p>
          <h2 className="section-title">{t("qa_title", lang)}</h2>
          <p className="section-description">{t("qa_desc", lang)}</p>
        </div>
        <Button onClick={() => void runTests()} variant="primary" disabled={running}>
          {running ? t("qa_running", lang) : t("qa_run", lang)}
        </Button>
      </div>

      {error && <p style={{ color: "#f87171", fontSize: "0.82rem" }}>{error}</p>}

      {/* Summary strip */}
      {result && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "140px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "#4ade80" }}>{result.total_passed}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>{t("qa_passed", lang)}</p>
          </div>
          <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "140px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: result.total_failed > 0 ? "#f87171" : "#4ade80" }}>{result.total_failed}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>{t("qa_failed", lang)}</p>
          </div>
          <div className="card" style={{ padding: "16px 24px", flex: 1, minWidth: "140px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{result.total_passed + result.total_failed}</p>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>{t("qa_total", lang)}</p>
          </div>
          {allPass && (
            <div className="card" style={{ padding: "16px 24px", flex: 2, minWidth: "200px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)" }}>
              <span style={{ fontSize: "1.4rem" }}>✓</span>
              <p style={{ margin: 0, fontWeight: 700, color: "#4ade80" }}>{t("qa_all_pass", lang)}</p>
            </div>
          )}
          {!allPass && result.total_failed > 0 && (
            <div className="card" style={{ padding: "16px 24px", flex: 2, minWidth: "200px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(248,113,113,0.35)" }}>
              <span style={{ fontSize: "1.4rem" }}>⚠</span>
              <p style={{ margin: 0, fontWeight: 700, color: "#f87171" }}>{t("qa_has_failures", lang)}</p>
            </div>
          )}
        </div>
      )}

      {!result && !running && (
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>{t("qa_never_run", lang)}</p>
        </div>
      )}

      {/* Module breakdown */}
      {result && result.modules.map((mod) => (
        <div key={mod.module} className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Module header — clickable to expand/collapse */}
          <button
            type="button"
            onClick={() => setExpanded(expanded === mod.module ? null : mod.module)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px", background: "none", border: "none",
              borderBottom: expanded === mod.module ? "1px solid rgba(255,255,255,0.06)" : "none",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
              background: mod.failed === 0 ? "rgba(74,222,128,0.15)" : "rgba(239,68,68,0.15)",
              color: mod.failed === 0 ? "#4ade80" : "#f87171",
              border: `1px solid ${mod.failed === 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
            }}>
              {mod.failed === 0 ? "PASS" : "FAIL"}
            </span>
            <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "rgba(255,255,255,0.85)", fontFamily: "monospace" }}>{mod.module}</span>
            <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
              {mod.passed}/{mod.passed + mod.failed} · {expanded === mod.module ? "▲" : "▼"}
            </span>
          </button>

          {/* Case rows */}
          {expanded === mod.module && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {[t("qa_test_id", lang), t("qa_description", lang), t("qa_expected", lang), t("qa_actual", lang), t("qa_status", lang)].map((h) => (
                      <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontWeight: 600, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mod.cases.map((c) => (
                    <tr key={c.test_id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: c.passed ? "transparent" : "rgba(239,68,68,0.05)" }}>
                      <td style={{ padding: "6px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>{c.test_id}</td>
                      <td style={{ padding: "6px 12px", color: "rgba(255,255,255,0.75)", maxWidth: "320px" }}>{c.description}</td>
                      <td style={{ padding: "6px 12px", fontFamily: "monospace", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{String(c.expected)}</td>
                      <td style={{ padding: "6px 12px", fontFamily: "monospace", color: c.passed ? "rgba(255,255,255,0.5)" : "#f87171", whiteSpace: "nowrap" }}>{String(c.actual)}</td>
                      <td style={{ padding: "6px 12px", whiteSpace: "nowrap" }}>
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700, padding: "2px 6px", borderRadius: "999px",
                          background: c.passed ? "rgba(74,222,128,0.12)" : "rgba(239,68,68,0.15)",
                          color: c.passed ? "#4ade80" : "#f87171",
                        }}>
                          {c.passed ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Regression store */}
      {regressions && (
        <Surface title={t("qa_regressions", lang)}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
            <Button onClick={() => void clearRegressions()} variant="ghost" disabled={regressions.total_stored === 0}>
              {t("qa_clear_all", lang)}
            </Button>
          </div>
          {regressions.total_stored === 0 ? (
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>{t("qa_no_regressions", lang)}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {regressions.failures.map((f) => (
                <div key={f.test_id} style={{ borderRadius: "8px", border: "1px solid rgba(248,113,113,0.25)", background: "rgba(239,68,68,0.06)", padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#f87171", fontWeight: 700 }}>{f.test_id}</span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{f.module}</span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>×{f.occurrences}</span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.65)" }}>{f.description}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
                    expected: <code style={{ color: "#f87171" }}>{String(f.expected)}</code>
                    {" · "}actual: <code style={{ color: "#f87171" }}>{String(f.actual)}</code>
                  </p>
                </div>
              ))}
            </div>
          )}
        </Surface>
      )}
    </div>
  );
}

// ── Calendar tab component ────────────────────────────────

type CalendarView = "panchangam" | "personal" | "family";

function HoraRow({ hora, lang }: { hora: { index: number; lord: string; start: string; end: string }; lang: Lang }) {
  const color = DASHA_COLORS[hora.lord.toUpperCase()] ?? "#94a3b8";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      padding: "4px 8px", borderRadius: "6px",
      background: `${color}12`, border: `1px solid ${color}33`,
    }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: "0.72rem", fontWeight: 600, color, minWidth: "68px" }}>{hora.lord} {t("hora_word", lang)}</span>
      <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.4)" }}>{formatClockLabel(hora.start)}–{formatClockLabel(hora.end)}</span>
    </div>
  );
}

function CalendarTab({
  selectedDate, panchangam, panchangamTimings,
  dailyGuidance, dailyGuidanceRange, familyCalendar, familyAggregate,
  chartSummary, transit, sani, hasBirthProfile, hasVault, lang,
}: {
  selectedDate: string;
  panchangam: PanchangamDailyResponseData | null;
  panchangamTimings: PanchangamTimingsData | null;
  dailyGuidance: DailyGuidanceData | null;
  dailyGuidanceRange: DailyGuidanceRangeData | null;
  familyCalendar: FamilyCalendarData | null;
  familyAggregate: FamilyAggregateData | null;
  chartSummary: ChartSummaryData | null;
  transit: TransitSnapshotData | null;
  sani: SaniCycleData | null;
  hasBirthProfile: boolean;
  hasVault: boolean;
  lang: Lang;
}) {
  const [view, setView] = useState<CalendarView>("panchangam");

  const tithiPaksha = panchangam
    ? `${panchangam.tithi.paksha === "SHUKLA" ? t("paksha_shukla", lang) : t("paksha_krishna", lang)} ${panchangam.tithi.number}`
    : null;

  return (
    <div className="tab-section">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <p className="section-kicker">{t("calendar_kicker", lang)}</p>
          <h2 className="section-title">{formatDateLabel(selectedDate)} — {t("calendar_title", lang)}</h2>
          <p className="section-description">
            {panchangam ? `${panchangam.vara.weekday} · ${t("label_tithi2", lang)} ${tithiPaksha} · ${panchangam.nakshatra.name} ${t("label_nakshatra2", lang)}` : t("label_tithi2", lang)}
          </p>
        </div>
        {/* View toggle */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "4px" }}>
          {([
            ["panchangam", t("cal_panchangam", lang)],
            ["personal",   t("cal_personal", lang)],
            ["family",     t("cal_family", lang)],
          ] as [CalendarView, string][]).map(([v, label]) => (
            <button key={v} type="button" onClick={() => setView(v)}
              style={{
                padding: "6px 14px", borderRadius: "7px", border: "none", cursor: "pointer",
                fontSize: "0.8rem", fontWeight: view === v ? 700 : 400,
                background: view === v ? "rgba(255,255,255,0.12)" : "transparent",
                color: view === v ? "#fff" : "rgba(255,255,255,0.5)",
                transition: "all 0.15s",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANCHANGAM VIEW ── */}
      {view === "panchangam" && (
        <div className="two-col two-col--wide">
          {/* Left: Five limbs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Surface title={t("surface_panja", lang)}>
              {panchangam ? (
                <div className="stack">
                  {/* Vara */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "1.4rem" }}>☀</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_vaaram", lang)}</p>
                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{panchangam.vara.weekday}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{panchangam.vara.lord} {t("lord_word", lang)}</p>
                    </div>
                  </div>
                  {/* Tithi */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "1.4rem" }}>🌙</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_tithi2", lang)}</p>
                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{panchangam.tithi.name}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{tithiPaksha} · {formatClockLabel(panchangam.tithi.endsAt)} {t("until_word", lang)}</p>
                    </div>
                  </div>
                  {/* Nakshatra */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "1.4rem" }}>⭐</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_nakshatra2", lang)}</p>
                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{panchangam.nakshatra.name}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{t("label_padam", lang)} {panchangam.nakshatra.pada} · {formatClockLabel(panchangam.nakshatra.endsAt)} {t("until_word", lang)}</p>
                    </div>
                  </div>
                  {/* Yoga */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "1.4rem" }}>✦</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_yogam", lang)}</p>
                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{panchangam.yoga.name}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{t("label_yogam", lang)} {panchangam.yoga.number}</p>
                    </div>
                  </div>
                  {/* Karana */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: "1.4rem" }}>◑</span>
                    <div>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>{t("label_karanam", lang)}</p>
                      <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{panchangam.karana.name}</p>
                    </div>
                  </div>
                  {/* Sunrise / Sunset */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                      <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{t("label_sunrise", lang)}</p>
                      <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#fbbf24" }}>{formatClockLabel(panchangam.sunrise)}</p>
                    </div>
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
                      <p style={{ margin: 0, fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>{t("label_sunset", lang)}</p>
                      <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#a78bfa" }}>{formatClockLabel(panchangam.sunset)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="empty-state">{t("panja_empty", lang)}</p>
              )}
            </Surface>
          </div>

          {/* Right: Kalam + Abhijit + Hora */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Inauspicious periods */}
            <Surface title={t("surface_kala", lang)}>
              {panchangam ? (
                <div className="stack">
                  <div style={{
                    padding: "12px 16px", borderRadius: "8px",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(248,113,113,0.3)",
                  }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#f87171", fontWeight: 700, letterSpacing: "0.05em" }}>{t("label_rahu_kalam", lang)}</p>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f87171" }}>
                        {formatClockLabel(panchangam.kalam.rahuKalam.start)} – {formatClockLabel(panchangam.kalam.rahuKalam.end)}
                      </span>
                      <Chip tone="warning">{t("label_rahu_avoid", lang)}</Chip>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{t("slot_word", lang)} {panchangam.kalam.rahuKalam.slot}/8</p>
                  </div>
                  <div style={{
                    padding: "12px 16px", borderRadius: "8px",
                    background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)",
                  }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#fbbf24", fontWeight: 700, letterSpacing: "0.05em" }}>{t("label_yamagandam", lang)}</p>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fbbf24" }}>
                      {formatClockLabel(panchangam.kalam.yamagandam.start)} – {formatClockLabel(panchangam.kalam.yamagandam.end)}
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{t("slot_word", lang)} {panchangam.kalam.yamagandam.slot}/8</p>
                  </div>
                  <div style={{
                    padding: "12px 16px", borderRadius: "8px",
                    background: "rgba(148,163,184,0.07)", border: "1px solid rgba(148,163,184,0.2)",
                  }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.05em" }}>{t("label_kuligai", lang)}</p>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#94a3b8" }}>
                      {formatClockLabel(panchangam.kalam.kuligai.start)} – {formatClockLabel(panchangam.kalam.kuligai.end)}
                    </span>
                    <p style={{ margin: "4px 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>{t("slot_word", lang)} {panchangam.kalam.kuligai.slot}/8</p>
                  </div>
                  {/* Abhijit */}
                  <div style={{
                    padding: "12px 16px", borderRadius: "8px",
                    background: panchangam.abhijit.isRestrictedByWeekday
                      ? "rgba(148,163,184,0.04)"
                      : "rgba(74,222,128,0.07)",
                    border: panchangam.abhijit.isRestrictedByWeekday
                      ? "1px solid rgba(148,163,184,0.15)"
                      : "1px solid rgba(74,222,128,0.25)",
                  }}>
                    <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: panchangam.abhijit.isRestrictedByWeekday ? "#94a3b8" : "#4ade80", fontWeight: 700, letterSpacing: "0.05em" }}>
                      {t("label_abhijit", lang)} {panchangam.abhijit.isRestrictedByWeekday ? t("label_restricted", lang) : "✓"}
                    </p>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: panchangam.abhijit.isRestrictedByWeekday ? "#94a3b8" : "#4ade80" }}>
                      {formatClockLabel(panchangam.abhijit.start)} – {formatClockLabel(panchangam.abhijit.end)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="empty-state">{t("kala_empty", lang)}</p>
              )}
            </Surface>

            {/* Hora table */}
            {panchangam && panchangam.hora.length > 0 && (
              <Surface title={t("surface_hora", lang)}>
                <div className="stack" style={{ maxHeight: "320px", overflowY: "auto" }}>
                  {panchangam.hora.map((h) => <HoraRow key={h.index} hora={h} lang={lang} />)}
                </div>
              </Surface>
            )}
          </div>
        </div>
      )}

      {/* ── PERSONAL FORTUNE VIEW ── */}
      {view === "personal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!hasBirthProfile ? (
            <div style={{ textAlign: "center", padding: "48px" }}>
              <p className="empty-state">{t("cal_no_profile", lang)}</p>
            </div>
          ) : (
            <>
              {/* Today's score card */}
              {dailyGuidance && (
                <div style={{
                  padding: "20px 24px", borderRadius: "12px",
                  background: `linear-gradient(135deg, ${getScoreBand(dailyGuidance.score).tone === "high" ? "rgba(74,222,128,0.12)" : getScoreBand(dailyGuidance.score).tone === "low" ? "rgba(248,113,113,0.12)" : "rgba(251,191,36,0.10)"} 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${getScoreBand(dailyGuidance.score).tone === "high" ? "rgba(74,222,128,0.3)" : getScoreBand(dailyGuidance.score).tone === "low" ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.25)"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>
                        {chartSummary?.displayName ?? t("personal_kicker", lang)} — {formatDateLabel(selectedDate)}
                      </p>
                      <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>
                        {dailyGuidance.score}<span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>/100</span>
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.65)" }}>{dailyGuidance.label}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "160px" }}>
                      {dailyGuidance.bestWindows.slice(0, 2).map((w) => (
                        <Chip key={w.start} tone="success">✓ {t("best_time", lang)} {w.start}–{w.end}</Chip>
                      ))}
                      {dailyGuidance.cautionWindows.slice(0, 1).map((w) => (
                        <Chip key={w.start} tone="warning">⚠ {t("caution_time", lang)} {w.start}–{w.end}</Chip>
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{tLang(dailyGuidance.text, lang)}</p>
                  {transit?.isChandrashtama && (
                    <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "6px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(248,113,113,0.4)" }}>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#f87171", fontWeight: 600 }}>
                        {t("chandrashtama_warning", lang)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Score breakdown */}
              {dailyGuidance && (
                <Surface title={t("cal_score_label", lang)}>
                  <div className="surface__metrics">
                    <Metric label={t("label_moon_transit", lang)} value={`${dailyGuidance.scoreBreakdown.moonTransit}`} tone="mid" />
                    <Metric label={t("label_dasha_support", lang)} value={`${dailyGuidance.scoreBreakdown.dashaSupport}`} tone="mid" />
                    <Metric label={t("label_panchangam", lang)} value={`${dailyGuidance.scoreBreakdown.panchangam}`} tone="mid" />
                    <Metric label={t("label_gochar_pos", lang)} value={`${dailyGuidance.scoreBreakdown.gocharSupport}`} tone="mid" />
                  </div>
                  {tLang(dailyGuidance.actionSuggestion, lang) && (
                    <div className="surface__textBlock">
                      <p className="surface__subhead">{t("cal_action", lang)}</p>
                      <p className="surface__text">{tLang(dailyGuidance.actionSuggestion, lang)}</p>
                    </div>
                  )}
                  {tLang(dailyGuidance.cautionSuggestion, lang) && (
                    <div className="surface__textBlock">
                      <p className="surface__subhead">{t("cal_caution_sugg", lang)}</p>
                      <p className="surface__text">{tLang(dailyGuidance.cautionSuggestion, lang)}</p>
                    </div>
                  )}
                </Surface>
              )}

              {/* 3-day range */}
              {dailyGuidanceRange && (
                <Surface title={t("cal_3days", lang)}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                    {dailyGuidanceRange.items.map((item) => {
                      const band = getScoreBand(item.score);
                      return (
                        <div key={item.dateLocal} style={{
                          padding: "14px", borderRadius: "10px",
                          background: band.tone === "high" ? "rgba(74,222,128,0.08)" : band.tone === "low" ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${band.tone === "high" ? "rgba(74,222,128,0.25)" : band.tone === "low" ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.1)"}`,
                        }}>
                          <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>{formatDateLabel(item.dateLocal)}</p>
                          <p style={{ margin: "0 0 2px", fontSize: "1.4rem", fontWeight: 800 }}>{item.score}<span style={{ fontSize: "0.8rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/100</span></p>
                          <p style={{ margin: 0, fontSize: "0.72rem", color: band.tone === "high" ? "#4ade80" : band.tone === "low" ? "#f87171" : "#fbbf24" }}>{item.label}</p>
                          {item.bestWindows[0] && (
                            <p style={{ margin: "6px 0 0", fontSize: "0.67rem", color: "rgba(255,255,255,0.35)" }}>
                              {t("best_time", lang)} {item.bestWindows[0].start}–{item.bestWindows[0].end}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Surface>
              )}

              {/* Sani cycle */}
              {sani?.moonBasedCycle.isActive && (
                <Surface title={t("cal_sani", lang)}>
                  <div className="surface__metrics">
                    <Metric label={t("cal_sani_pos", lang)} value={sani.moonBasedCycle.type ?? "—"} hint={sani.moonBasedCycle.supportiveLabel ?? ""} tone="low" />
                    <Metric label={t("cal_sani_rasi", lang)} value={sani.saturnRasi} hint={`Moon ${sani.positionFromMoon}th house`} tone="low" />
                  </div>
                  <p className="surface__text" style={{ marginTop: "8px" }}>{sani.confirmationSentence}</p>
                </Surface>
              )}
            </>
          )}
        </div>
      )}

      {/* ── FAMILY FORTUNE VIEW ── */}
      {view === "family" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {!hasVault ? (
            <div style={{ textAlign: "center", padding: "48px" }}>
              <p className="empty-state">{t("cal_no_vault", lang)}</p>
            </div>
          ) : !familyAggregate ? (
            <p className="empty-state">{t("cal_loading", lang)}</p>
          ) : (
            <>
              {/* Family score card */}
              <div style={{
                padding: "20px 24px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${getScoreBand(familyAggregate.familyScore).tone === "high" ? "rgba(74,222,128,0.12)" : getScoreBand(familyAggregate.familyScore).tone === "low" ? "rgba(248,113,113,0.12)" : "rgba(251,191,36,0.10)"} 0%, rgba(255,255,255,0.02) 100%)`,
                border: `1px solid ${getScoreBand(familyAggregate.familyScore).tone === "high" ? "rgba(74,222,128,0.3)" : getScoreBand(familyAggregate.familyScore).tone === "low" ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.25)"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.05em" }}>
                      {t("cal_fam_title", lang)} — {formatDateLabel(selectedDate)}
                    </p>
                    <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, lineHeight: 1 }}>
                      {familyAggregate.familyScore}<span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.5)" }}>/100</span>
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.65)" }}>{familyAggregate.familyLabel}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {familyAggregate.bestFamilyWindows.slice(0, 2).map((w) => (
                      <Chip key={`${w.type}-${w.start}`} tone="success">✓ {w.type} {w.start}–{w.end}</Chip>
                    ))}
                    {familyAggregate.avoidForFamilyDecisions.slice(0, 1).map((w) => (
                      <Chip key={`${w.type}-${w.start}`} tone="warning">⚠ {t("cal_avoid_fam", lang)} {w.start}–{w.end}</Chip>
                    ))}
                    {familyAggregate.aggregateBreakdown.chandrashtamaCount > 0 && (
                      <Chip tone="warning">⚠ {familyAggregate.aggregateBreakdown.chandrashtamaCount} {t("member_chandrashtamam", lang)}</Chip>
                    )}
                  </div>
                </div>
                <p style={{ margin: "12px 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{tLang(familyAggregate.summary, lang)}</p>
              </div>

              {/* Aggregate breakdown */}
              <Surface title={t("cal_breakdown", lang)}>
                <div className="surface__metrics">
                  <Metric label={t("cal_mean_score", lang)} value={`${familyAggregate.aggregateBreakdown.meanScore.toFixed(0)}`} tone="mid" />
                  <Metric label={t("support_need", lang)} value={`${familyAggregate.aggregateBreakdown.supportNeedIndex}`} hint="0–100" tone="low" />
                  <Metric label={t("decision_ready", lang)} value={`${familyAggregate.aggregateBreakdown.decisionReadinessIndex}`} hint="0–100" tone="high" />
                  <Metric label={t("members_label_pl", lang)} value={`${familyAggregate.members.length}`} hint={`${familyAggregate.aggregateBreakdown.lowScoreCount}`} tone="rest" />
                </div>
              </Surface>

              {/* Member scores */}
              <Surface title={t("cal_member_scores", lang)}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {familyAggregate.members.map((m) => {
                    const band = getScoreBand(m.individualScore);
                    const barColor = band.tone === "high" ? "#4ade80" : band.tone === "low" ? "#f87171" : "#fbbf24";
                    return (
                      <div key={m.familyMemberId} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.8rem", minWidth: "100px", color: "rgba(255,255,255,0.7)" }}>{m.displayName}</span>
                        <div style={{ flex: 1, height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}>
                          <div style={{ width: `${m.individualScore}%`, height: "100%", borderRadius: "999px", background: barColor }} />
                        </div>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: barColor, minWidth: "44px", textAlign: "right" }}>{m.individualScore}/100</span>
                      </div>
                    );
                  })}
                </div>
              </Surface>

              {/* 7-day family calendar */}
              {familyCalendar && (
                <Surface title={t("cal_7days", lang)}>
                  <div className="calendar-grid">
                    {familyCalendar.items.map((item) => {
                      const band = getScoreBand(item.familyScore);
                      return (
                        <div key={item.dateLocal} className={`calendar-day calendar-day--${band.tone}`}>
                          <p className="calendar-day__date">{formatDateLabel(item.dateLocal)}</p>
                          <p className="calendar-day__score">{item.familyScore}</p>
                          <p className="calendar-day__label">{item.familyLabel}</p>
                          <p className="calendar-day__text">{tLang(item.summary, lang)}</p>
                          {item.bestFamilyWindows[0] && (
                            <p style={{ margin: "4px 0 0", fontSize: "0.62rem", color: "rgba(74,222,128,0.8)" }}>
                              ✓ {t("cal_best_fam", lang)} {item.bestFamilyWindows[0].start}–{item.bestFamilyWindows[0].end}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Surface>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatScoreLabel(score: number) {
  const band = getScoreBand(score);
  return `${score}/100 — ${band.label}`;
}

// ── Main component ────────────────────────────────────────

export function DashboardWorkspace() {
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState("Ready. Create a profile or family vault to begin.");
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [ownerUserId, setOwnerUserId] = useState(() => generateUUID());
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const todayDate = useRef(todayIso()); // fixed — never changes from header score
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [birthProfileId, setBirthProfileId] = useState("");
  const [chartId, setChartId] = useState("");
  const [birthForm, setBirthForm] = useState<BirthFormState>(defaultBirthForm);
  const [vaultForm, setVaultForm] = useState<VaultFormState>(defaultVaultForm);
  const [memberForm, setMemberForm] = useState<MemberFormState>(defaultMemberForm);
  const [vaults, setVaults] = useState<FamilyVaultListItem[]>([]);
  const [chart, setChart] = useState<ChartCalculateResponseData | null>(null);
  const [chartSummary, setChartSummary] = useState<ChartSummaryData | null>(null);
  const [todayGuidance, setTodayGuidance] = useState<DailyGuidanceData | null>(null); // fixed to today
  const [todayTransit, setTodayTransit] = useState<TransitSnapshotData | null>(null); // fixed to today
  const [dailyGuidance, setDailyGuidance] = useState<DailyGuidanceData | null>(null); // date-sensitive
  const [dailyGuidanceRange, setDailyGuidanceRange] = useState<DailyGuidanceRangeData | null>(null);
  const [dasha, setDasha] = useState<DashaTimelineResponseData | null>(null);
  const [dashaAntar, setDashaAntar] = useState<DashaTimelineItem[]>([]);
  const [transit, setTransit] = useState<TransitSnapshotData | null>(null);
  const [sani, setSani] = useState<SaniCycleData | null>(null);
  const [panchangam, setPanchangam] = useState<PanchangamDailyResponseData | null>(null);
  const [panchangamTimings, setPanchangamTimings] = useState<PanchangamTimingsData | null>(null);
  const [familyDetail, setFamilyDetail] = useState<FamilyVaultDetailData | null>(null);
  const [familyAggregate, setFamilyAggregate] = useState<FamilyAggregateData | null>(null);
  const [familyCalendar, setFamilyCalendar] = useState<FamilyCalendarData | null>(null);
  const [memberCharts, setMemberCharts] = useState<MemberChart[]>([]);
  const [editMember, setEditMember] = useState<EditMemberState | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  // Personal tab — null = master user; memberId = viewing that family member's data
  const [personalViewId, setPersonalViewId] = useState<string | null>(null);
  const [busy, setBusy] = useState({
    vaults: false, personal: false, family: false,
    createProfile: false, createVault: false, addMember: false,
    deletingMemberId: "", deletingVaultId: "", editingMember: false,
    editingProfile: false, memberCharts: false,
  });
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [lang, setLang] = useState<Lang>("ta");
  const [showFeedback, setShowFeedback] = useState(false);

  // ── Persistence ─────────────────────────────────────────

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PersistedState>;
        if (typeof parsed.ownerUserId === "string") setOwnerUserId(parsed.ownerUserId);
        // selectedDate always resets to today — never restore a stale past date
        if (typeof parsed.selectedVaultId === "string") setSelectedVaultId(parsed.selectedVaultId);
        if (typeof parsed.birthProfileId === "string") setBirthProfileId(parsed.birthProfileId);
        if (typeof parsed.chartId === "string") setChartId(parsed.chartId);
        if (parsed.birthForm) setBirthForm((c) => ({ ...c, ...parsed.birthForm }));
        if (parsed.vaultForm) setVaultForm((c) => ({ ...c, ...parsed.vaultForm }));
        if (parsed.memberForm) setMemberForm((c) => ({ ...c, ...parsed.memberForm }));
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.lang === "ta" || parsed.lang === "en") setLang(parsed.lang);
        setStatus("Session restored.");
      }
    } catch { setStatus("Started fresh."); }
    finally { setHydrated(true); }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ownerUserId, selectedDate, selectedVaultId, birthProfileId, chartId,
      birthForm, vaultForm, memberForm, activeTab, lang,
    } as PersistedState));
  }, [activeTab, birthForm, birthProfileId, chartId, hydrated, lang, memberForm, ownerUserId, selectedDate, selectedVaultId, vaultForm]);

  useEffect(() => {
    if (!hydrated) return;
    if (vaultForm.ownerUserId !== ownerUserId) setVaultForm((c) => ({ ...c, ownerUserId }));
    if (birthForm.ownerUserId !== ownerUserId) setBirthForm((c) => ({ ...c, ownerUserId }));
  }, [birthForm.ownerUserId, hydrated, ownerUserId, vaultForm.ownerUserId]);

  // ── Toast ────────────────────────────────────────────────

  function showToast(message: string, tone: "success" | "error" = "success") {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Data loaders ─────────────────────────────────────────

  async function loadVaults(nextOwnerUserId = ownerUserId) {
    setBusy((c) => ({ ...c, vaults: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<FamilyVaultListData>>(
        `/api/v1/family-vaults${toQuery({ ownerUserId: nextOwnerUserId, limit: 20, offset: 0 })}`
      );
      setVaults(response.data.items);
      const next = response.data.items.find((i) => i.familyVaultId === selectedVaultId) ?? response.data.items[0];
      if (next && next.familyVaultId !== selectedVaultId) setSelectedVaultId(next.familyVaultId);
      if (!next) { setSelectedVaultId(""); setFamilyDetail(null); setFamilyAggregate(null); setFamilyCalendar(null); }
    } catch (error) { setStatus(readErrorMessage(error)); }
    finally { setBusy((c) => ({ ...c, vaults: false })); }
  }

  async function refreshPersonalBundle(nextBirthProfileId = birthProfileId, nextDate = selectedDate) {
    if (!nextBirthProfileId) return;
    setBusy((c) => ({ ...c, personal: true }));
    try {
      setChartSummary(null); setDailyGuidanceRange(null); setPanchangamTimings(null); setDashaAntar([]);
      const chartResponse = await apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
        method: "POST",
        body: JSON.stringify({ birthProfileId: nextBirthProfileId, calculationVersion: "thirukanitham-2026-v1" }),
      });
      setChart(chartResponse.data);
      setChartId(chartResponse.data.chartId);

      const chartPath = `/api/v1/charts/${chartResponse.data.chartId}`;
      const isToday = nextDate === todayDate.current;

      const [summaryRes, daily, dailyRange, dashaRes, dashaAntarRes, transitRes, saniRes, panchangamRes, timingsRes] = await Promise.all([
        apiFetchJson<ApiEnvelope<ChartSummaryData>>(`${chartPath}/summary${toQuery({ language: "ta-en" })}`),
        apiFetchJson<ApiEnvelope<DailyGuidanceData>>(`${chartPath}/daily-guidance${toQuery({ date: nextDate, language: "ta-en" })}`),
        apiFetchJson<ApiEnvelope<DailyGuidanceRangeData>>(
          `/api/v1/daily-guidance/range${toQuery({ profileId: nextBirthProfileId, from: nextDate, to: addDays(nextDate, 2), language: "ta-en" })}`
        ),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "pratyantar" })}`),
        apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`${chartPath}/dasha${toQuery({ asOf: nextDate, level: "antar" })}`),
        apiFetchJson<ApiEnvelope<TransitSnapshotData>>(`${chartPath}/gochar/current${toQuery({ date: nextDate })}`),
        apiFetchJson<ApiEnvelope<SaniCycleData>>(`${chartPath}/sani-cycle${toQuery({ date: nextDate })}`),
        apiFetchJson<ApiEnvelope<PanchangamDailyResponseData>>(
          `/api/v1/panchangam/daily${toQuery({ date: nextDate, lat: birthForm.birthLatitude, lng: birthForm.birthLongitude, timezone: birthForm.birthTimezone })}`
        ),
        apiFetchJson<ApiEnvelope<PanchangamTimingsData>>(
          `/api/v1/panchangam/timings${toQuery({ date: nextDate, lat: birthForm.birthLatitude, lng: birthForm.birthLongitude, timezone: birthForm.birthTimezone })}`
        ),
      ]);

      setChartSummary(summaryRes.data);
      setDailyGuidance(daily.data);
      setDailyGuidanceRange(dailyRange.data);
      setDasha(dashaRes.data);
      setDashaAntar(dashaAntarRes.data.timeline);
      setTransit(transitRes.data);
      setSani(saniRes.data);
      setPanchangam(panchangamRes.data);
      setPanchangamTimings(timingsRes.data);

      // Keep today's data fixed for the header — only update when the date is actually today
      if (isToday || !todayGuidance) setTodayGuidance(daily.data);
      if (isToday || !todayTransit) setTodayTransit(transitRes.data);

      setStatus("Personal data refreshed.");
    } catch (error) { setStatus(readErrorMessage(error)); }
    finally { setBusy((c) => ({ ...c, personal: false })); }
  }

  async function refreshFamilyBundle(nextVaultId = selectedVaultId, nextDate = selectedDate) {
    if (!nextVaultId) return;
    setBusy((c) => ({ ...c, family: true }));
    try {
      const [detailRes, aggregateRes, calendarRes] = await Promise.all([
        apiFetchJson<ApiEnvelope<FamilyVaultDetailData>>(`/api/v1/family-vaults/${nextVaultId}`),
        apiFetchJson<ApiEnvelope<FamilyAggregateData>>(`/api/v1/family-vaults/${nextVaultId}/daily-aggregate${toQuery({ date: nextDate })}`),
        apiFetchJson<ApiEnvelope<FamilyCalendarData>>(`/api/v1/family-vaults/${nextVaultId}/calendar${toQuery({ from: nextDate, to: addDays(nextDate, 6) })}`),
      ]);
      setFamilyDetail(detailRes.data);
      setFamilyAggregate(aggregateRes.data);
      setFamilyCalendar(calendarRes.data);

      // Load charts for every family member in parallel
      void loadMemberCharts(aggregateRes.data.members, nextDate);
      setStatus("Family data refreshed.");
    } catch (error) { setStatus(readErrorMessage(error)); }
    finally { setBusy((c) => ({ ...c, family: false })); }
  }

  async function loadMemberCharts(members: FamilyAggregateMember[], nextDate: string) {
    if (members.length === 0) return;
    setBusy((c) => ({ ...c, memberCharts: true }));
    const results: MemberChart[] = [];
    await Promise.allSettled(members.map(async (m) => {
      try {
        const chartRes = await apiFetchJson<ApiEnvelope<ChartCalculateResponseData>>("/api/v1/charts/calculate", {
          method: "POST",
          body: JSON.stringify({ birthProfileId: m.birthProfileId, calculationVersion: "thirukanitham-2026-v1" }),
        });
        const cid = chartRes.data.chartId;
        const [summaryRes, dailyRes, transitRes, saniRes, dashaRes, dashaAntarRes] = await Promise.all([
          apiFetchJson<ApiEnvelope<ChartSummaryData>>(`/api/v1/charts/${cid}/summary${toQuery({ language: "ta-en" })}`),
          apiFetchJson<ApiEnvelope<DailyGuidanceData>>(`/api/v1/charts/${cid}/daily-guidance${toQuery({ date: nextDate, language: "ta-en" })}`),
          apiFetchJson<ApiEnvelope<TransitSnapshotData>>(`/api/v1/charts/${cid}/gochar/current${toQuery({ date: nextDate })}`),
          apiFetchJson<ApiEnvelope<SaniCycleData>>(`/api/v1/charts/${cid}/sani-cycle${toQuery({ date: nextDate })}`),
          apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`/api/v1/charts/${cid}/dasha${toQuery({ asOf: nextDate, level: "pratyantar" })}`),
          apiFetchJson<ApiEnvelope<DashaTimelineResponseData>>(`/api/v1/charts/${cid}/dasha${toQuery({ asOf: nextDate, level: "antar" })}`),
        ]);
        results.push({
          memberId: m.familyMemberId,
          displayName: m.displayName,
          chart: chartRes.data,
          summary: summaryRes.data,
          transit: transitRes.data,
          sani: saniRes.data,
          dailyGuidance: dailyRes.data,
          dasha: dashaRes.data,
          dashaAntar: dashaAntarRes.data.timeline,
        });
      } catch {
        // member chart failed — skip silently
      }
    }));
    setMemberCharts(results);
    setBusy((c) => ({ ...c, memberCharts: false }));
  }

  useEffect(() => { if (hydrated && ownerUserId) void loadVaults(ownerUserId); }, [hydrated, ownerUserId]);
  useEffect(() => { if (hydrated && birthProfileId) void refreshPersonalBundle(birthProfileId, selectedDate); }, [birthProfileId, hydrated, selectedDate]);
  useEffect(() => { if (hydrated && selectedVaultId) void refreshFamilyBundle(selectedVaultId, selectedDate); }, [hydrated, selectedDate, selectedVaultId]);

  // ── Form handlers ────────────────────────────────────────

  function validateBirthForm(form: BirthFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.displayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.birthDateLocal = t("err_date_required", lang);
    if (!form.birthPlace.trim()) errors.birthPlace = t("err_place_required", lang);
    if (!form.birthTimezone.trim()) errors.birthTimezone = t("err_tz_required", lang);
    if (!form.birthLatitude || !parseNumber(form.birthLatitude)) errors.birthLatitude = t("err_lat_required", lang);
    if (!form.birthLongitude || !parseNumber(form.birthLongitude)) errors.birthLongitude = t("err_lng_required", lang);
    return errors;
  }

  function validateMemberForm(form: MemberFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.memberDisplayName = t("err_name_required", lang);
    if (!form.birthDateLocal) errors.memberBirthDate = t("err_date_required", lang);
    if (!form.birthPlace.trim()) errors.memberBirthPlace = t("err_place_required", lang);
    if (!form.birthTimezone.trim()) errors.memberTimezone = t("err_tz_required", lang);
    return errors;
  }

  async function handleCreateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateBirthForm(birthForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusy((c) => ({ ...c, createProfile: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<BirthProfileCreateResponseData>>("/api/v1/birth-profiles", {
        method: "POST",
        body: JSON.stringify({
          ownerUserId: birthForm.ownerUserId || undefined,
          relationshipToOwner: birthForm.relationshipToOwner,
          displayName: birthForm.displayName,
          birthDateLocal: birthForm.birthDateLocal,
          birthTimeLocal: birthForm.birthTimeLocal || undefined,
          birthPlace: birthForm.birthPlace,
          birthLatitude: parseNumber(birthForm.birthLatitude),
          birthLongitude: parseNumber(birthForm.birthLongitude),
          birthTimezone: birthForm.birthTimezone,
          calculateNow: birthForm.calculateNow,
        }),
      });
      setBirthProfileId(response.data.birthProfileId);
      if (response.data.chartId) setChartId(response.data.chartId);
      showToast(`${birthForm.displayName} — ${t("toast_profile_created", lang)}`);
      setStatus(`Profile created — ${response.data.birthProfileId.slice(0, 8)}`);
      setActiveTab("personal");
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, createProfile: false })); }
  }

  async function handleCreateVault(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy((c) => ({ ...c, createVault: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<{ familyVaultId: string; ownerUserId: string; name: string; defaultLanguage: string; memberCount: number }>>(
        "/api/v1/family-vaults",
        { method: "POST", body: JSON.stringify({ ownerUserId: vaultForm.ownerUserId || undefined, name: vaultForm.name, defaultLanguage: vaultForm.defaultLanguage }) }
      );
      setOwnerUserId(response.data.ownerUserId);
      setSelectedVaultId(response.data.familyVaultId);
      showToast(`Vault "${response.data.name}" created.`);
      setStatus(`Vault "${response.data.name}" created.`);
      await loadVaults(response.data.ownerUserId);
      setActiveTab("family");
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, createVault: false })); }
  }

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVaultId) { showToast(t("toast_vault_required", lang), "error"); return; }
    const errors = validateMemberForm(memberForm);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setBusy((c) => ({ ...c, addMember: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<{ familyMemberId: string; displayName: string }>>(
        `/api/v1/family-vaults/${selectedVaultId}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            ownerUserId,
            familyVaultId: selectedVaultId,
            relationshipToOwner: memberForm.relationshipToOwner,
            displayName: memberForm.displayName,
            birthDateLocal: memberForm.birthDateLocal,
            birthTimeLocal: memberForm.birthTimeLocal,
            birthPlace: memberForm.birthPlace,
            birthLatitude: parseNumber(memberForm.birthLatitude),
            birthLongitude: parseNumber(memberForm.birthLongitude),
            birthTimezone: memberForm.birthTimezone,
            calculateNow: memberForm.calculateNow,
            memberWeight: parseNumber(memberForm.memberWeight, 1),
          }),
        }
      );
      showToast(`${response.data.displayName} added to vault.`);
      setStatus(`${response.data.displayName} added to vault.`);
      setMemberForm(defaultMemberForm);
      await loadVaults(ownerUserId);
      await refreshFamilyBundle(selectedVaultId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, addMember: false })); }
  }

  async function handleSaveEdit() {
    if (!editMember) return;
    setBusy((c) => ({ ...c, editingMember: true }));
    try {
      await apiFetchJson<unknown>(
        `/api/v1/family-vaults/${selectedVaultId}/members/${editMember.memberId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            displayName: editMember.displayName,
            relationshipToOwner: editMember.relationshipToOwner,
            memberWeight: parseNumber(editMember.memberWeight, 1),
            birthDateLocal: editMember.birthDateLocal || undefined,
            birthTimeLocal: editMember.birthTimeLocal || undefined,
            birthPlace: editMember.birthPlace || undefined,
            birthLatitude: editMember.birthLatitude ? parseNumber(editMember.birthLatitude) : undefined,
            birthLongitude: editMember.birthLongitude ? parseNumber(editMember.birthLongitude) : undefined,
            birthTimezone: editMember.birthTimezone || undefined,
            recalculate: true,
          }),
        }
      );
      showToast(`${editMember.displayName} updated.`);
      setStatus(`${editMember.displayName} updated.`);
      setEditMember(null);
      await refreshFamilyBundle(selectedVaultId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, editingMember: false })); }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy((c) => ({ ...c, editingProfile: true }));
    try {
      const response = await apiFetchJson<ApiEnvelope<BirthProfileCreateResponseData>>("/api/v1/birth-profiles", {
        method: "POST",
        body: JSON.stringify({
          ownerUserId: birthForm.ownerUserId || undefined,
          relationshipToOwner: birthForm.relationshipToOwner,
          displayName: birthForm.displayName,
          birthDateLocal: birthForm.birthDateLocal,
          birthTimeLocal: birthForm.birthTimeLocal,
          birthPlace: birthForm.birthPlace,
          birthLatitude: parseNumber(birthForm.birthLatitude),
          birthLongitude: parseNumber(birthForm.birthLongitude),
          birthTimezone: birthForm.birthTimezone,
          calculateNow: true,
        }),
      });
      setBirthProfileId(response.data.birthProfileId);
      if (response.data.chartId) setChartId(response.data.chartId);
      setShowEditProfile(false);
      showToast(`${birthForm.displayName} profile updated.`);
      await refreshPersonalBundle(response.data.birthProfileId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error");
    } finally { setBusy((c) => ({ ...c, editingProfile: false })); }
  }

  async function handleDeleteMember(memberId: string, displayName: string) {
    if (!confirm(`Remove "${displayName}" from the vault?`)) return;
    setBusy((c) => ({ ...c, deletingMemberId: memberId }));
    try {
      await apiFetchJson<unknown>(`/api/v1/family-vaults/${selectedVaultId}/members/${memberId}`, { method: "DELETE" });
      showToast(`${displayName} removed.`);
      setStatus(`${displayName} removed.`);
      await loadVaults(ownerUserId);
      await refreshFamilyBundle(selectedVaultId, selectedDate);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, deletingMemberId: "" })); }
  }

  async function handleDeleteVault(vaultId: string, vaultName: string) {
    if (!confirm(`Delete vault "${vaultName}" and all its members? This cannot be undone.`)) return;
    setBusy((c) => ({ ...c, deletingVaultId: vaultId }));
    try {
      await apiFetchJson<unknown>(`/api/v1/family-vaults/${vaultId}`, { method: "DELETE" });
      showToast(`Vault "${vaultName}" deleted.`);
      setStatus(`Vault "${vaultName}" deleted.`);
      if (selectedVaultId === vaultId) { setSelectedVaultId(""); setFamilyDetail(null); setFamilyAggregate(null); setFamilyCalendar(null); }
      await loadVaults(ownerUserId);
    } catch (error) {
      const msg = readErrorMessage(error);
      showToast(msg, "error"); setStatus(msg);
    } finally { setBusy((c) => ({ ...c, deletingVaultId: "" })); }
  }

  // ── Derived state ─────────────────────────────────────────

  const selectedVault = vaults.find((v) => v.familyVaultId === selectedVaultId) ?? null;
  // Setup wizard: detect which step the user is on
  const setupStep: 1 | 2 | 3 = !birthProfileId ? 1 : !selectedVaultId ? 2 : 3;
  const setupComplete = !!birthProfileId && !!selectedVaultId;
  // Personal tab — resolved data source (master or a family member)
  const personalMemberChart = personalViewId ? memberCharts.find((mc) => mc.memberId === personalViewId) ?? null : null;
  const personalChart = personalMemberChart ? personalMemberChart.chart : chart;
  const personalChartSummary = personalMemberChart ? personalMemberChart.summary : chartSummary;
  const personalDailyGuidance = personalMemberChart ? personalMemberChart.dailyGuidance : dailyGuidance;
  const personalDasha = personalMemberChart ? personalMemberChart.dasha : dasha;
  const personalDashaAntar = personalMemberChart ? personalMemberChart.dashaAntar : dashaAntar;
  const personalTransit = personalMemberChart ? personalMemberChart.transit : transit;
  const personalSani = personalMemberChart ? personalMemberChart.sani : sani;
  const personalScoreBand = personalDailyGuidance ? getScoreBand(personalDailyGuidance.score) : null;
  // Header score always uses today's data, not the date picker
  const headerScoreBand = todayGuidance ? getScoreBand(todayGuidance.score) : null;
  const currentScoreBand = dailyGuidance ? getScoreBand(dailyGuidance.score) : null;
  const familyCalendarRange = familyCalendar
    ? `${formatDateLabel(familyCalendar.fromDate)} → ${formatDateLabel(familyCalendar.toDate)}`
    : "7-day view";
  const isTodayChandrashtama = todayTransit?.isChandrashtama ?? false;

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="site">

      {/* ── Site hero ───────────────────────────────────────── */}
      <div className="site__hero">
        <div className="site__hero-inner">
          <div className="site__identity">
            <div className="site__avatar">✦</div>
            <div>
              <h1 className="site__name">{birthForm.displayName || "Jothidam.AI"}</h1>
              <p className="site__subtitle">
                {chartSummary
                  ? `${chartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${chartSummary.moonRasi} ${t("label_janma_rasi", lang)} · ${chartSummary.janmaNakshatra} ${t("label_nakshatra", lang)}`
                  : "Tamil Jothidam — Thirukanitham"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {birthProfileId ? (
              <span
                className="chip chip--accent"
                title="Today's score — fixed to the current calendar date regardless of the date picker"
              >
                {todayGuidance ? `${t("personal_today", lang)} ${todayGuidance.score}/100` : t("chart_ready", lang)}
              </span>
            ) : null}
            {/* Chandrashtama alert — only shown when active today */}
            {isTodayChandrashtama && (
              <span style={{
                fontSize: "0.78rem", fontWeight: 700, padding: "4px 12px", borderRadius: "999px",
                background: "rgba(239,68,68,0.2)", color: "#f87171",
                border: "1px solid rgba(248,113,113,0.5)",
              }}>
                ⚠ {t("chandrashtamam_active", lang)}
              </span>
            )}
            {selectedVault ? <span className="chip chip--neutral">{selectedVault.name}</span> : null}
            {/* Language toggle */}
            <button
              type="button"
              onClick={() => setLang((l) => l === "ta" ? "en" : "ta")}
              style={{
                padding: "4px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)",
                fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em",
              }}
              title={lang === "ta" ? "Switch to English" : "தமிழுக்கு மாறு"}
            >
              {lang === "ta" ? "EN" : "த"}
            </button>
            <span className="site__status-pill" title={status}>
              <span className="site__status-dot" />
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Metric strip — today's data, never changes with date picker ── */}
      <div style={{ width: "min(1200px, calc(100% - 32px))", margin: "0 auto", paddingTop: "16px" }}>
        <div className="metric-strip">
          <Metric label={t("metric_today", lang)} value={formatDateLabel(todayDate.current)} hint={new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", { weekday: "long" })} tone="high" />
          <Metric
            label={t("metric_nakshatra", lang)}
            value={chartSummary ? chartSummary.janmaNakshatra : "—"}
            hint={chartSummary ? `${t("metric_pada", lang)} ${chartSummary.janmaPada} · ${chartSummary.moonRasi} ${t("metric_janma_rasi", lang)}` : t("hint_no_profile", lang)}
            tone="mid"
          />
          <Metric
            label={t("metric_dasha", lang)}
            value={dasha ? `${dasha.current.mahadasha.lord} ${t("dasha_word", lang)}` : todayGuidance ? `${todayGuidance.score}/100` : "—"}
            hint={dasha ? `${dasha.current.antardasha.lord} ${t("bhukti_word", lang)}` : headerScoreBand?.label ?? ""}
            tone={headerScoreBand?.tone === "high" ? "high" : headerScoreBand?.tone === "low" ? "low" : "mid"}
          />
          <Metric
            label={t("metric_family_score", lang)}
            value={familyAggregate ? `${familyAggregate.familyScore}/100` : selectedVault ? selectedVault.name : "—"}
            hint={familyAggregate ? familyAggregate.familyLabel : selectedVaultId ? `${selectedVault?.memberCount ?? 0} ${t("metric_members", lang)}` : t("metric_vault_select", lang)}
            tone={familyAggregate ? (getScoreBand(familyAggregate.familyScore).tone === "high" ? "high" : getScoreBand(familyAggregate.familyScore).tone === "low" ? "low" : "mid") : "rest"}
          />
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="site__nav-wrap" style={{ marginTop: "16px" }}>
        <nav className="site__nav">
          {TAB_IDS.map((tab) => {
            const tabLabel = tab.id === "personal" ? t("tab_personal", lang)
              : tab.id === "family" ? t("tab_family", lang)
              : tab.id === "calendar" ? t("tab_calendar", lang)
              : tab.id === "onboarding" ? t("tab_setup", lang)
              : tab.id === "qa" ? t("tab_qa", lang)
              : t("tab_settings", lang);
            return (
              <button key={tab.id}
                className={`site__tab${activeTab === tab.id ? " site__tab--active" : ""}`}
                type="button" onClick={() => setActiveTab(tab.id)}>
                <span>{tab.emoji}</span>{tabLabel}
              </button>
            );
          })}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <input className="input input--compact" type="date" value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.82rem" }} />
          </div>
        </nav>
      </div>

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
          zIndex: 100, padding: "12px 24px", borderRadius: "10px", fontSize: "0.9rem",
          fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          background: toast.tone === "success" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
          border: `1px solid ${toast.tone === "success" ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)"}`,
          color: toast.tone === "success" ? "#4ade80" : "#f87171", pointerEvents: "none",
        }}>
          {toast.tone === "success" ? "✓ " : "✕ "}{toast.message}
        </div>
      )}

      {/* ── Edit member modal ────────────────────────────────── */}
      {editMember && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          overflowY: "auto",
        }} onClick={(e) => { if (e.target === e.currentTarget) setEditMember(null); }}>
          <div className="card" style={{ width: "min(560px, 100%)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0 }}>{t("modal_edit_member_title", lang)}</h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  {t("modal_edit_member_sub", lang)}
                </p>
              </div>
              <button type="button" className="button button--ghost" onClick={() => setEditMember(null)}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <Field label={t("field_display_name", lang)}>
                <input className="input" value={editMember.displayName}
                  onChange={(e) => setEditMember((c) => c ? { ...c, displayName: e.target.value } : c)} />
              </Field>
              <Field label={t("field_relationship", lang)}>
                <select className="select" value={editMember.relationshipToOwner}
                  onChange={(e) => {
                    const rel = e.target.value as Relationship;
                    setEditMember((c) => c ? { ...c, relationshipToOwner: rel, memberWeight: RELATIONSHIP_WEIGHTS[rel] } : c);
                  }}>
                  <option value="self">{t("rel_self", lang)}</option>
                  <option value="spouse">{t("rel_spouse", lang)}</option>
                  <option value="child">{t("rel_child", lang)}</option>
                  <option value="parent">{t("rel_parent", lang)}</option>
                  <option value="sibling">{t("rel_sibling", lang)}</option>
                  <option value="grandparent">{t("rel_grandparent", lang)}</option>
                  <option value="other">{t("rel_other", lang)}</option>
                </select>
              </Field>
              <Field label={t("field_birth_date", lang)}>
                <input className="input" type="date" value={editMember.birthDateLocal}
                  onChange={(e) => setEditMember((c) => c ? { ...c, birthDateLocal: e.target.value } : c)} />
              </Field>
              <Field label={t("field_birth_time", lang)}>
                <input className="input" type="time" step="1" value={editMember.birthTimeLocal}
                  onChange={(e) => setEditMember((c) => c ? { ...c, birthTimeLocal: e.target.value } : c)} />
              </Field>
              <Field label={t("field_birth_place", lang)}>
                <PlaceCombobox value={editMember.birthPlace}
                  onChange={(city, raw) => setEditMember((c) => c ? {
                    ...c, birthPlace: raw,
                    ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
                  } : c)} />
              </Field>
              <Field label={t("field_timezone", lang)}>
                <input className="input" value={editMember.birthTimezone}
                  onChange={(e) => setEditMember((c) => c ? { ...c, birthTimezone: e.target.value } : c)} />
              </Field>
              <Field label={t("field_latitude", lang)}>
                <input className="input" inputMode="decimal" value={editMember.birthLatitude}
                  onChange={(e) => setEditMember((c) => c ? { ...c, birthLatitude: e.target.value } : c)} />
              </Field>
              <Field label={t("field_longitude", lang)}>
                <input className="input" inputMode="decimal" value={editMember.birthLongitude}
                  onChange={(e) => setEditMember((c) => c ? { ...c, birthLongitude: e.target.value } : c)} />
              </Field>
              <Field label={t("field_weight", lang)} helper={t("field_weight_hint", lang)}>
                <input className="input" inputMode="decimal" value={editMember.memberWeight}
                  onChange={(e) => setEditMember((c) => c ? { ...c, memberWeight: e.target.value } : c)} />
              </Field>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Button onClick={() => setEditMember(null)} variant="ghost">{t("btn_cancel", lang)}</Button>
              <Button onClick={() => void handleSaveEdit()} variant="primary" disabled={busy.editingMember}>
                {busy.editingMember ? t("btn_saving", lang) : t("btn_save_recalc", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit personal profile modal ─────────────────────── */}
      {showEditProfile && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto",
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowEditProfile(false); }}>
          <div className="card" style={{ width: "min(560px, 100%)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0 }}>{t("modal_edit_profile_title", lang)}</h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
                  {t("modal_edit_profile_sub", lang)}
                </p>
              </div>
              <button type="button" className="button button--ghost" onClick={() => setShowEditProfile(false)}>✕</button>
            </div>
            <form id="form-edit-profile" onSubmit={handleSaveProfile}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <Field label={t("field_display_name", lang)}>
                  <input className="input" value={birthForm.displayName}
                    onChange={(e) => setBirthForm((c) => ({ ...c, displayName: e.target.value }))} />
                </Field>
                <Field label={t("field_relationship", lang)}>
                  <select className="select" value={birthForm.relationshipToOwner}
                    onChange={(e) => setBirthForm((c) => ({ ...c, relationshipToOwner: e.target.value as Relationship }))}>
                    <option value="self">{t("rel_self", lang)}</option>
                    <option value="spouse">{t("rel_spouse", lang)}</option>
                    <option value="child">{t("rel_child", lang)}</option>
                    <option value="parent">{t("rel_parent", lang)}</option>
                    <option value="sibling">{t("rel_sibling", lang)}</option>
                    <option value="grandparent">{t("rel_grandparent", lang)}</option>
                    <option value="other">{t("rel_other", lang)}</option>
                  </select>
                </Field>
                <Field label={t("field_birth_date", lang)}>
                  <input className="input" type="date" value={birthForm.birthDateLocal}
                    onChange={(e) => setBirthForm((c) => ({ ...c, birthDateLocal: e.target.value }))} />
                </Field>
                <Field label={t("field_birth_time", lang)}>
                  <input className="input" type="time" step="1" value={birthForm.birthTimeLocal}
                    onChange={(e) => setBirthForm((c) => ({ ...c, birthTimeLocal: e.target.value }))} />
                </Field>
                <Field label={t("field_birth_place", lang)}>
                  <PlaceCombobox value={birthForm.birthPlace}
                    onChange={(city, raw) => setBirthForm((c) => ({
                      ...c, birthPlace: raw,
                      ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}),
                    }))} />
                </Field>
                <Field label={t("field_timezone", lang)}>
                  <input className="input" value={birthForm.birthTimezone}
                    onChange={(e) => setBirthForm((c) => ({ ...c, birthTimezone: e.target.value }))} />
                </Field>
                <Field label={t("field_latitude", lang)}>
                  <input className="input" inputMode="decimal" value={birthForm.birthLatitude}
                    onChange={(e) => setBirthForm((c) => ({ ...c, birthLatitude: e.target.value }))} />
                </Field>
                <Field label={t("field_longitude", lang)}>
                  <input className="input" inputMode="decimal" value={birthForm.birthLongitude}
                    onChange={(e) => setBirthForm((c) => ({ ...c, birthLongitude: e.target.value }))} />
                </Field>
              </div>
            </form>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Button onClick={() => setShowEditProfile(false)} variant="ghost">{t("btn_cancel", lang)}</Button>
              <Button onClick={() => (document.getElementById("form-edit-profile") as HTMLFormElement)?.requestSubmit()} variant="primary" disabled={busy.editingProfile}>
                {busy.editingProfile ? t("btn_saving", lang) : t("btn_save_recalc", lang)}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab content ─────────────────────────────────────── */}
      <div className="site__body">

        {/* SETUP */}
        {activeTab === "onboarding" && (
          <div className="tab-section">
            {/* Step progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "0", marginBottom: "8px" }}>
              {([
                { n: 1, label: t("setup_step1_label", lang), done: !!birthProfileId },
                { n: 2, label: t("setup_step2_label", lang), done: !!selectedVaultId },
                { n: 3, label: t("setup_step3_label", lang), done: setupComplete && (selectedVault?.memberCount ?? 0) > 0 },
              ] as { n: number; label: string; done: boolean }[]).map((s, i) => {
                const isActive = setupStep === s.n;
                const isPast = s.done;
                return (
                  <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", fontWeight: 700,
                        background: isPast ? "rgba(74,222,128,0.2)" : isActive ? "rgba(229,184,77,0.25)" : "rgba(255,255,255,0.07)",
                        border: `2px solid ${isPast ? "#4ade80" : isActive ? "#e5b84d" : "rgba(255,255,255,0.15)"}`,
                        color: isPast ? "#4ade80" : isActive ? "#e5b84d" : "rgba(255,255,255,0.35)",
                      }}>
                        {isPast ? "✓" : s.n}
                      </div>
                      <span style={{ fontSize: "0.68rem", color: isActive ? "#e5b84d" : isPast ? "#4ade80" : "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>
                        {s.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div style={{ flex: 1, height: "2px", margin: "0 8px", marginBottom: "20px", background: s.done ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)" }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1 — Birth profile */}
            <div className="card" style={{
              padding: "24px",
              opacity: setupStep === 1 ? 1 : 0.65,
              border: setupStep === 1 ? "1px solid rgba(229,184,77,0.35)" : birthProfileId ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <p className="section-kicker" style={{ color: birthProfileId ? "#4ade80" : "#e5b84d" }}>
                    {birthProfileId ? t("setup_step_done", lang) : "1"}
                  </p>
                  <h3 style={{ margin: 0 }}>{t("setup_step1_title", lang)}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                    {t("setup_step1_sub", lang)}
                  </p>
                </div>
                {birthProfileId ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button onClick={() => setShowEditProfile(true)} variant="secondary">{t("setup_step1_edit", lang)}</Button>
                    <Button onClick={() => setActiveTab("personal")} variant="primary">{t("setup_step1_goto_personal", lang)}</Button>
                  </div>
                ) : (
                  <Button variant="primary" disabled={busy.createProfile}
                    onClick={() => (document.getElementById("form-profile") as HTMLFormElement)?.requestSubmit()}>
                    {busy.createProfile ? t("setup_step1_creating", lang) : t("setup_step1_create", lang)}
                  </Button>
                )}
              </div>
              {birthProfileId && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", marginBottom: "16px" }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#4ade80" }}>
                    ✓ {birthForm.displayName || "Profile"} — {birthForm.birthDateLocal} · {birthForm.birthPlace}
                  </p>
                </div>
              )}
              <form id="form-profile" onSubmit={handleCreateProfile}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Field label={t("field_name", lang)}>
                    <input className={`input${formErrors.displayName ? " input--error" : ""}`} value={birthForm.displayName}
                      onChange={(e) => { setBirthForm((c) => ({ ...c, displayName: e.target.value })); setFormErrors((c) => ({ ...c, displayName: "" })); }} />
                    {formErrors.displayName && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.displayName}</span>}
                  </Field>
                  <Field label={t("field_relationship", lang)}>
                    <select className="select" value={birthForm.relationshipToOwner}
                      onChange={(e) => setBirthForm((c) => ({ ...c, relationshipToOwner: e.target.value as Relationship }))}>
                      <option value="self">{t("rel_self", lang)}</option>
                      <option value="spouse">{t("rel_spouse", lang)}</option>
                      <option value="child">{t("rel_child", lang)}</option>
                      <option value="parent">{t("rel_parent", lang)}</option>
                      <option value="sibling">{t("rel_sibling", lang)}</option>
                      <option value="grandparent">{t("rel_grandparent", lang)}</option>
                      <option value="other">{t("rel_other", lang)}</option>
                    </select>
                  </Field>
                  <Field label={t("field_birth_date", lang)}>
                    <input className={`input${formErrors.birthDateLocal ? " input--error" : ""}`} type="date" value={birthForm.birthDateLocal}
                      onChange={(e) => { setBirthForm((c) => ({ ...c, birthDateLocal: e.target.value })); setFormErrors((c) => ({ ...c, birthDateLocal: "" })); }} />
                    {formErrors.birthDateLocal && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthDateLocal}</span>}
                  </Field>
                  <Field label={t("field_birth_time", lang)} helper={t("field_time_optional", lang)}>
                    <input className="input" type="time" step="1" value={birthForm.birthTimeLocal}
                      onChange={(e) => setBirthForm((c) => ({ ...c, birthTimeLocal: e.target.value }))} />
                  </Field>
                  <Field label={t("field_birth_place", lang)} helper={t("field_place_helper", lang)}>
                    <PlaceCombobox value={birthForm.birthPlace}
                      onChange={(city, raw) => {
                        setBirthForm((c) => ({ ...c, birthPlace: raw, ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}) }));
                        setFormErrors((c) => ({ ...c, birthPlace: "", birthTimezone: "" }));
                      }} />
                    {formErrors.birthPlace && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthPlace}</span>}
                  </Field>
                  <Field label={t("field_timezone", lang)} helper={t("field_tz_helper", lang)}>
                    <input className={`input${formErrors.birthTimezone ? " input--error" : ""}`} value={birthForm.birthTimezone}
                      onChange={(e) => { setBirthForm((c) => ({ ...c, birthTimezone: e.target.value })); setFormErrors((c) => ({ ...c, birthTimezone: "" })); }} />
                    {formErrors.birthTimezone && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthTimezone}</span>}
                  </Field>
                  <Field label={t("field_latitude", lang)}>
                    <input className={`input${formErrors.birthLatitude ? " input--error" : ""}`} inputMode="decimal" value={birthForm.birthLatitude}
                      onChange={(e) => { setBirthForm((c) => ({ ...c, birthLatitude: e.target.value })); setFormErrors((c) => ({ ...c, birthLatitude: "" })); }} />
                    {formErrors.birthLatitude && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthLatitude}</span>}
                  </Field>
                  <Field label={t("field_longitude", lang)}>
                    <input className={`input${formErrors.birthLongitude ? " input--error" : ""}`} inputMode="decimal" value={birthForm.birthLongitude}
                      onChange={(e) => { setBirthForm((c) => ({ ...c, birthLongitude: e.target.value })); setFormErrors((c) => ({ ...c, birthLongitude: "" })); }} />
                    {formErrors.birthLongitude && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.birthLongitude}</span>}
                  </Field>
                </div>
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <label className="toggle">
                    <input type="checkbox" checked={birthForm.calculateNow}
                      onChange={(e) => setBirthForm((c) => ({ ...c, calculateNow: e.target.checked }))} />
                    <span>{t("setup_calc_now", lang)}</span>
                  </label>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{t("setup_required", lang)}</span>
                </div>
              </form>
            </div>

            {/* Step 2 — Family vault */}
            <div className="card" style={{
              padding: "24px",
              opacity: setupStep < 2 ? 0.4 : 1,
              border: setupStep === 2 ? "1px solid rgba(229,184,77,0.35)" : selectedVaultId ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.08)",
              pointerEvents: setupStep < 2 ? "none" : undefined,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <p className="section-kicker" style={{ color: selectedVaultId ? "#4ade80" : "#e5b84d" }}>
                    {selectedVaultId ? t("setup_vault_step_active", lang) : "2"}
                  </p>
                  <h3 style={{ margin: 0 }}>{t("setup_step2_title", lang)}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                    {t("setup_step2_sub", lang)}
                  </p>
                </div>
                <Button variant="primary" disabled={busy.createVault || setupStep < 2}
                  onClick={() => (document.getElementById("form-vault") as HTMLFormElement)?.requestSubmit()}>
                  {busy.createVault ? t("setup_step2_creating", lang) : selectedVaultId ? t("setup_step2_more", lang) : t("setup_step2_create", lang)}
                </Button>
              </div>
              {vaults.length > 0 && (
                <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {vaults.map((v) => (
                    <div key={v.familyVaultId} style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px",
                      background: v.familyVaultId === selectedVaultId ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${v.familyVaultId === selectedVaultId ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer",
                    }} onClick={() => { setSelectedVaultId(v.familyVaultId); setOwnerUserId(v.ownerUserId); }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: v.familyVaultId === selectedVaultId ? 700 : 400, flex: 1 }}>{v.name}</span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{v.memberCount} {t("members_label_pl", lang)}</span>
                      {v.familyVaultId === selectedVaultId && <span style={{ color: "#4ade80", fontSize: "0.75rem" }}>{t("setup_step2_selected", lang)}</span>}
                    </div>
                  ))}
                </div>
              )}
              <form id="form-vault" onSubmit={handleCreateVault}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Field label={t("field_vault_name", lang)}>
                    <input className="input" value={vaultForm.name} placeholder="எ.கா. Murugan Family"
                      onChange={(e) => setVaultForm((c) => ({ ...c, name: e.target.value }))} />
                  </Field>
                  <Field label={t("field_language", lang)}>
                    <select className="select" value={vaultForm.defaultLanguage}
                      onChange={(e) => setVaultForm((c) => ({ ...c, defaultLanguage: e.target.value }))}>
                      <option value="ta-en">{t("lang_ta_en", lang)}</option>
                      <option value="ta">{t("lang_ta", lang)}</option>
                      <option value="en">{t("lang_en", lang)}</option>
                    </select>
                  </Field>
                </div>
              </form>
            </div>

            {/* Step 3 — Add member */}
            <div className="card" style={{
              padding: "24px",
              opacity: setupStep < 3 ? 0.4 : 1,
              border: setupStep === 3 ? "1px solid rgba(229,184,77,0.35)" : "1px solid rgba(255,255,255,0.08)",
              pointerEvents: setupStep < 3 ? "none" : undefined,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <p className="section-kicker" style={{ color: setupStep >= 3 ? "#e5b84d" : "rgba(255,255,255,0.3)" }}>3</p>
                  <h3 style={{ margin: 0 }}>{t("setup_step3_title", lang)}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
                    {selectedVault ? `${selectedVault.name} — ${selectedVault.memberCount} ${t("members_label_pl", lang)}` : t("setup_step3_sub_vault", lang)}
                  </p>
                </div>
                <Button variant="primary" disabled={busy.addMember || !selectedVaultId}
                  onClick={() => (document.getElementById("form-member") as HTMLFormElement)?.requestSubmit()}>
                  {busy.addMember ? t("setup_step3_adding", lang) : t("setup_step3_add", lang)}
                </Button>
              </div>
              <form id="form-member" onSubmit={handleAddMember}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Field label={t("field_name", lang)}>
                    <input className={`input${formErrors.memberDisplayName ? " input--error" : ""}`} value={memberForm.displayName}
                      onChange={(e) => { setMemberForm((c) => ({ ...c, displayName: e.target.value })); setFormErrors((c) => ({ ...c, memberDisplayName: "" })); }} />
                    {formErrors.memberDisplayName && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.memberDisplayName}</span>}
                  </Field>
                  <Field label={t("field_relationship", lang)}>
                    <select className="select" value={memberForm.relationshipToOwner}
                      onChange={(e) => {
                        const rel = e.target.value as Relationship;
                        setMemberForm((c) => ({ ...c, relationshipToOwner: rel, memberWeight: RELATIONSHIP_WEIGHTS[rel] }));
                      }}>
                      <option value="self">{t("rel_self", lang)}</option>
                      <option value="spouse">{t("rel_spouse", lang)}</option>
                      <option value="child">{t("rel_child", lang)}</option>
                      <option value="parent">{t("rel_parent", lang)}</option>
                      <option value="sibling">{t("rel_sibling", lang)}</option>
                      <option value="grandparent">{t("rel_grandparent", lang)}</option>
                      <option value="other">{t("rel_other", lang)}</option>
                    </select>
                  </Field>
                  <Field label={t("field_birth_date", lang)}>
                    <input className={`input${formErrors.memberBirthDate ? " input--error" : ""}`} type="date" value={memberForm.birthDateLocal}
                      onChange={(e) => { setMemberForm((c) => ({ ...c, birthDateLocal: e.target.value })); setFormErrors((c) => ({ ...c, memberBirthDate: "" })); }} />
                    {formErrors.memberBirthDate && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.memberBirthDate}</span>}
                  </Field>
                  <Field label={t("field_birth_time", lang)} helper={t("field_time_optional", lang)}>
                    <input className="input" type="time" step="1" value={memberForm.birthTimeLocal}
                      onChange={(e) => setMemberForm((c) => ({ ...c, birthTimeLocal: e.target.value }))} />
                  </Field>
                  <Field label={t("field_birth_place", lang)}>
                    <PlaceCombobox value={memberForm.birthPlace}
                      onChange={(city, raw) => {
                        setMemberForm((c) => ({ ...c, birthPlace: raw, ...(city ? { birthLatitude: city.lat, birthLongitude: city.lng, birthTimezone: city.timezone } : {}) }));
                        setFormErrors((c) => ({ ...c, memberBirthPlace: "", memberTimezone: "" }));
                      }} />
                    {formErrors.memberBirthPlace && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.memberBirthPlace}</span>}
                  </Field>
                  <Field label={t("field_timezone", lang)}>
                    <input className={`input${formErrors.memberTimezone ? " input--error" : ""}`} value={memberForm.birthTimezone}
                      onChange={(e) => { setMemberForm((c) => ({ ...c, birthTimezone: e.target.value })); setFormErrors((c) => ({ ...c, memberTimezone: "" })); }} />
                    {formErrors.memberTimezone && <span style={{ fontSize: "0.7rem", color: "#f87171" }}>{formErrors.memberTimezone}</span>}
                  </Field>
                  <Field label={t("field_latitude", lang)}>
                    <input className="input" inputMode="decimal" value={memberForm.birthLatitude}
                      onChange={(e) => setMemberForm((c) => ({ ...c, birthLatitude: e.target.value }))} />
                  </Field>
                  <Field label={t("field_longitude", lang)}>
                    <input className="input" inputMode="decimal" value={memberForm.birthLongitude}
                      onChange={(e) => setMemberForm((c) => ({ ...c, birthLongitude: e.target.value }))} />
                  </Field>
                  <Field label={t("field_weight", lang)} helper={t("field_weight_helper", lang)}>
                    <input className="input" inputMode="decimal" value={memberForm.memberWeight}
                      onChange={(e) => setMemberForm((c) => ({ ...c, memberWeight: e.target.value }))} />
                  </Field>
                </div>
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <label className="toggle">
                    <input type="checkbox" checked={memberForm.calculateNow}
                      onChange={(e) => setMemberForm((c) => ({ ...c, calculateNow: e.target.checked }))} />
                    <span>{t("setup_calc_now", lang)}</span>
                  </label>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)" }}>{t("setup_required", lang)}</span>
                </div>
              </form>
            </div>

            {/* Done state */}
            {setupComplete && (selectedVault?.memberCount ?? 0) > 0 && (
              <div style={{ padding: "16px 20px", borderRadius: "10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#4ade80" }}>{t("setup_done_title", lang)}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)" }}>
                    {birthForm.displayName} ஜாதகம் · {selectedVault?.name} vault · {selectedVault?.memberCount} member{(selectedVault?.memberCount ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button onClick={() => setActiveTab("personal")} variant="primary">{t("setup_done_goto", lang)}</Button>
              </div>
            )}

            {/* Disclaimer banner */}
            <div style={{
              borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.025)", padding: "14px 18px",
              display: "flex", flexDirection: "column", gap: "6px",
            }}>
              <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                {t("disclaimer_astro", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                {t("disclaimer_no_doom", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                {t("disclaimer_data", lang)}
              </p>
            </div>
          </div>
        )}

        {/* PERSONAL */}
        {activeTab === "personal" && (
          <div className="tab-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <p className="section-kicker">{t("personal_kicker", lang)}</p>
                <h2 className="section-title">
                  {personalMemberChart ? personalMemberChart.displayName : birthForm.displayName || t("personal_title_default", lang)}
                </h2>
                <p className="section-description">
                  {selectedDate === todayDate.current ? t("personal_today", lang) : formatDateLabel(selectedDate)} — {t("personal_desc", lang)}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {/* Member selector */}
                {memberCharts.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={() => setPersonalViewId(null)}
                      style={{
                        padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: personalViewId === null ? 700 : 400,
                        background: personalViewId === null ? "rgba(229,184,77,0.25)" : "rgba(255,255,255,0.07)",
                        color: personalViewId === null ? "#e5b84d" : "rgba(255,255,255,0.55)",
                        outline: personalViewId === null ? "1px solid rgba(229,184,77,0.5)" : "1px solid transparent",
                      }}>
                      ◎ {birthForm.displayName || t("personal_you", lang)}
                    </button>
                    {memberCharts.map((mc) => (
                      <button key={mc.memberId} type="button" onClick={() => setPersonalViewId(mc.memberId)}
                        style={{
                          padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: personalViewId === mc.memberId ? 700 : 400,
                          background: personalViewId === mc.memberId ? "rgba(147,197,253,0.2)" : "rgba(255,255,255,0.06)",
                          color: personalViewId === mc.memberId ? "#93c5fd" : "rgba(255,255,255,0.5)",
                          outline: personalViewId === mc.memberId ? "1px solid rgba(147,197,253,0.4)" : "1px solid transparent",
                        }}>
                        {mc.displayName}
                      </button>
                    ))}
                  </div>
                )}
                {!personalViewId && birthProfileId && (
                  <Button onClick={() => setShowEditProfile(true)} variant="secondary">{t("btn_edit", lang)}</Button>
                )}
                {!personalViewId && (
                  <Button onClick={() => void refreshPersonalBundle()} variant="ghost" disabled={!birthProfileId || busy.personal}>
                    {busy.personal ? t("btn_refreshing", lang) : t("btn_refresh", lang)}
                  </Button>
                )}
              </div>
            </div>

            {/* Chandrashtama banner — based on selected date transit */}
            {personalTransit?.isChandrashtama && (
              <div style={{
                padding: "12px 20px", borderRadius: "10px", marginBottom: "4px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(248,113,113,0.35)",
                color: "#fca5a5", fontSize: "0.88rem", fontWeight: 500,
              }}>
                {t("chandrashtama_warning", lang)}
              </div>
            )}

            {/* Row 1: Chart context (left) | Daily guidance + Gochar stacked (right) */}
            <div className="two-col">
              <Surface title={t("surface_chart_context", lang)}>
                {personalChart ? (
                  <div className="surface__body">
                    <div className="surface__headline">
                      <span>{personalChartSummary?.displayName ?? personalChart.birthProfile.displayName}</span>
                      <Chip tone="accent">{personalChartSummary ? `${personalChartSummary.currentMahadasha} ${t("dasha_word", lang)}` : personalChart.calculationVersion}</Chip>
                    </div>
                    <p className="surface__text">
                      {personalChartSummary
                        ? `${personalChartSummary.lagnaRasi} ${t("label_lagnam", lang)} · ${personalChartSummary.moonRasi} ${t("label_janma_rasi", lang)} · ${personalChartSummary.janmaNakshatra} ${t("label_nakshatra", lang)} ${t("label_padam", lang)} ${personalChartSummary.janmaPada}`
                        : t("chart_loading", lang)}
                    </p>
                    <div className="surface__metrics">
                      <Metric label={t("label_birth_date", lang)} value={personalChart.birthProfile.birthDateLocal} hint={personalChart.birthProfile.birthPlace ?? personalChart.birthProfile.birthProfileId.slice(0, 8)} />
                      <Metric label={t("label_lagnam", lang)} value={personalChart.lagna.rasiName ?? `Raasi ${personalChart.lagna.rasi}`} hint={`${personalChart.lagna.degreeInRasi.toFixed(2)}° · ${personalChart.lagna.nakshatraName} ${t("label_padam", lang)} ${personalChart.lagna.pada}`} tone="high" />
                    </div>
                    <div style={{ marginTop: "16px", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                      <RasiChart chart={personalChart} label={t("label_d1", lang)} />
                      <NavamsaChart chart={personalChart} label={t("label_d9", lang)} />
                    </div>
                  </div>
                ) : (
                  <p className="empty-state">{t("chart_no_profile", lang)}</p>
                )}
              </Surface>

              {/* Right column: Daily guidance + Gochar & Panchangam stacked */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Surface title={t("surface_guidance", lang)}>
                  {personalDailyGuidance ? (
                    <div className="surface__body">
                      <div className="surface__headline">
                        <span>{formatScoreLabel(personalDailyGuidance.score)}</span>
                        <Chip tone={personalScoreBand?.tone === "high" ? "success" : personalScoreBand?.tone === "low" ? "warning" : "neutral"}>
                          {personalDailyGuidance.label}
                        </Chip>
                      </div>
                      <p className="surface__text">{tLang(personalDailyGuidance.text, lang)}</p>
                      <div className="surface__metrics">
                        <Metric label={t("label_best_time", lang)} value={personalDailyGuidance.bestWindows[0]?.start ?? "—"} hint={personalDailyGuidance.bestWindows[0]?.end ?? "—"} tone="high" />
                        <Metric label={t("label_caution_time", lang)} value={personalDailyGuidance.cautionWindows[0]?.start ?? "—"} hint={personalDailyGuidance.cautionWindows[0]?.end ?? "—"} tone="low" />
                        <Metric label={t("label_moon_transit", lang)} value={`${personalDailyGuidance.scoreBreakdown.moonTransit}`} hint={`${t("dasha_word", lang)} ${personalDailyGuidance.scoreBreakdown.dashaSupport}`} />
                      </div>
                      {tLang(personalDailyGuidance.actionSuggestion, lang) && (
                        <p style={{ marginTop: "8px", fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                          {tLang(personalDailyGuidance.actionSuggestion, lang)}
                        </p>
                      )}
                      {!personalViewId && dailyGuidanceRange && (
                        <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                          <p className="surface__subhead" style={{ marginBottom: "6px" }}>{t("label_next_3_days", lang)}</p>
                          <div className="chip-row">
                            {dailyGuidanceRange.items.map((item) => {
                              const band = getScoreBand(item.score);
                              return (
                                <Chip key={item.dateLocal} tone={band.tone === "high" ? "success" : band.tone === "low" ? "warning" : "neutral"}>
                                  {formatDateLabel(item.dateLocal)} {item.score}/100
                                </Chip>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="empty-state">{t("guidance_empty", lang)}</p>
                  )}
                </Surface>

                <Surface title={t("surface_gochar", lang)}>
                  {personalTransit && personalSani && panchangam ? (
                    <div className="stack">
                      <div className="surface__metrics">
                        <Metric label={t("label_chandrashtamam", lang)} value={personalTransit.isChandrashtama ? t("label_active", lang) : t("label_none", lang)}
                          hint={personalSani.confirmationSentence} tone={personalTransit.isChandrashtama ? "low" : "rest"} />
                        {personalSani.moonBasedCycle.isActive && (
                          <Metric label={t("label_sani_cycle", lang)} value={personalSani.moonBasedCycle.type ?? "—"} hint={personalSani.moonBasedCycle.supportiveLabel ?? ""} tone="low" />
                        )}
                      </div>
                      <div className="surface__textBlock">
                        <p className="surface__subhead">{t("label_gochar_pos", lang)}</p>
                        <p className="surface__text">{t("label_janma_rasi_short", lang)} {personalTransit.janmaRasi} · {t("label_lagnam", lang)} {personalTransit.lagnaRasi}</p>
                        <div className="chip-row">
                          {personalTransit.transits.slice(0, 5).map((item) => (
                            <Chip key={item.graha}>{item.graha} · {item.currentRasi}</Chip>
                          ))}
                        </div>
                      </div>
                      <div className="surface__textBlock">
                        <p className="surface__subhead">{t("label_panchangam", lang)}</p>
                        <p className="surface__text">{panchangam.vara.weekday} · {t("label_tithi", lang)} {panchangam.tithi.number} {panchangam.tithi.name} · {panchangam.nakshatra.name}</p>
                        <div className="chip-row">
                          <Chip tone="accent">{t("label_rahu_kalam", lang)} {formatClockLabel(panchangam.kalam.rahuKalam.start)}–{formatClockLabel(panchangam.kalam.rahuKalam.end)}</Chip>
                          <Chip tone="warning">{t("label_yamagandam", lang)} {formatClockLabel(panchangam.kalam.yamagandam.start)}–{formatClockLabel(panchangam.kalam.yamagandam.end)}</Chip>
                          <Chip>{t("label_kuligai", lang)} {formatClockLabel(panchangam.kalam.kuligai.start)}–{formatClockLabel(panchangam.kalam.kuligai.end)}</Chip>
                          {panchangamTimings && !panchangam.abhijit.isRestrictedByWeekday && (
                            <Chip tone="success">{t("label_abhijit", lang)} {formatClockLabel(panchangam.abhijit.start)}–{formatClockLabel(panchangam.abhijit.end)}</Chip>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="empty-state">{t("gochar_empty", lang)}</p>
                  )}
                </Surface>
              </div>
            </div>

            {/* Row 2: Full-width Graha table with extra columns */}
            <Surface title={t("surface_planets", lang)}>
              {personalChart ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t("col_graha", lang)}</th><th>{t("col_rasi", lang)}</th><th>{t("col_degree", lang)}</th><th>{t("col_nakshatra", lang)}</th>
                        <th>{t("col_pada", lang)}</th><th>{t("col_house", lang)}</th><th>{t("col_d9_rasi", lang)}</th><th>{t("col_special", lang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personalChart.planets.map((planet) => (
                        <tr key={planet.graha}>
                          <td style={{ fontWeight: 600 }}>
                            <span style={{ color: DASHA_COLORS[planet.graha] ?? "#93c5fd", marginRight: "4px" }}>
                              {GRAHA_ABBR[planet.graha] ?? planet.graha.slice(0, 2)}
                            </span>
                            {planet.graha}
                          </td>
                          <td>{planet.rasiName}</td>
                          <td>{planet.degreeInRasi.toFixed(2)}°</td>
                          <td>{planet.nakshatraName}</td>
                          <td style={{ textAlign: "center" }}>{planet.pada}</td>
                          <td style={{ textAlign: "center" }}>{planet.houseFromLagna}</td>
                          <td>{RASI_NAMES[planet.d9Rasi] ?? planet.d9Rasi}</td>
                          <td className="table__flags">
                            {planet.isRetrograde ? <Chip tone="warning">{t("flag_vakra", lang)}</Chip> : null}
                            {planet.isCombust ? <Chip tone="warning">{t("flag_astam", lang)}</Chip> : null}
                            {planet.isVargottama ? <Chip tone="success">{t("flag_vargottamam", lang)}</Chip> : null}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: "1px solid rgba(255,255,255,0.12)", opacity: 0.75 }}>
                        <td style={{ fontWeight: 600 }}><span style={{ color: "#e5b84d", marginRight: "4px" }}>ல</span> {t("label_lagnam", lang)}</td>
                        <td>{personalChart.lagna.rasiName}</td>
                        <td>{personalChart.lagna.degreeInRasi.toFixed(2)}°</td>
                        <td>{personalChart.lagna.nakshatraName}</td>
                        <td style={{ textAlign: "center" }}>{personalChart.lagna.pada}</td>
                        <td style={{ textAlign: "center" }}>1</td>
                        <td>—</td><td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">{t("planets_empty", lang)}</p>
              )}
            </Surface>

            {/* Row 3: Dasha — compact current strip + full timeline */}
            {personalDasha ? (
              <Surface title={t("surface_dasha", lang)}>
                <div className="surface__body">
                  {(() => {
                    const d = personalDasha;
                    const dashaColor = DASHA_COLORS[d.current.mahadasha.lord] ?? "#94a3b8";
                    const bhuktiColor = DASHA_COLORS[d.current.antardasha.lord] ?? "#94a3b8";
                    const antaramColor = DASHA_COLORS[d.current.pratyantardasha.lord] ?? "#94a3b8";
                    return (
                      <div style={{
                        borderRadius: "10px", border: `1px solid ${dashaColor}55`,
                        background: `${dashaColor}0d`, padding: "12px 16px",
                        display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px",
                      }}>
                        <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.05em" }}>
                          {t("dasha_current_strip", lang)}
                        </p>
                        {/* Maha Dasa */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: dashaColor, flexShrink: 0, boxShadow: `0 0 6px ${dashaColor}` }} />
                          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: dashaColor, minWidth: "100px" }}>{d.current.mahadasha.lord} {t("dasha_word", lang)}</span>
                          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{d.current.mahadasha.startDate} → {d.current.mahadasha.endDate}</span>
                          <Metric label="" value={`${d.openingDasha.balanceYearsAtBirth.toFixed(1)}y`} hint={t("balance_at_birth", lang)} tone="rest" />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "20px" }}>
                          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: bhuktiColor, flexShrink: 0, boxShadow: `0 0 4px ${bhuktiColor}` }} />
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: bhuktiColor, minWidth: "92px" }}>{d.current.antardasha.lord} {t("bhukti_word", lang)}</span>
                          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>{d.current.antardasha.startDate} → {d.current.antardasha.endDate}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "40px" }}>
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: antaramColor, flexShrink: 0, boxShadow: `0 0 3px ${antaramColor}` }} />
                          <span style={{ fontSize: "0.76rem", fontWeight: 600, color: antaramColor, minWidth: "84px" }}>{d.current.pratyantardasha.lord} {t("antaram_word", lang)}</span>
                          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.3)" }}>{d.current.pratyantardasha.startDate} → {d.current.pratyantardasha.endDate}</span>
                        </div>
                        {personalDashaAntar.length > 0 && (
                          <div style={{ marginTop: "6px", paddingTop: "8px", borderTop: `1px solid ${dashaColor}33`, display: "flex", flexDirection: "column", gap: "2px" }}>
                            <p style={{ margin: "0 0 4px", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                              {d.current.mahadasha.lord} {t("dasha_word", lang)} — {t("dasha_all_bhukti", lang)}
                            </p>
                            {personalDashaAntar.map((bh) => {
                              const bst = dashaStatus(String(bh.startDate), String(bh.endDate), selectedDate);
                              const isRunning = bh.lord === d.current.antardasha.lord && bst === "active";
                              const bc = DASHA_COLORS[bh.lord] ?? "#94a3b8";
                              return (
                                <div key={`pb-${bh.lord}-${bh.startDate}`} style={{
                                  display: "flex", alignItems: "center", gap: "6px",
                                  padding: isRunning ? "3px 6px" : "1px 4px",
                                  borderRadius: "4px",
                                  background: isRunning ? `${bc}1a` : "transparent",
                                  border: isRunning ? `1px solid ${bc}44` : "1px solid transparent",
                                  opacity: bst === "past" ? 0.4 : 1,
                                }}>
                                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: bc, flexShrink: 0 }} />
                                  <span style={{ fontSize: "0.7rem", fontWeight: isRunning ? 700 : 400, color: isRunning ? bc : "rgba(255,255,255,0.5)", minWidth: "70px" }}>
                                    {bh.lord} {t("bhukti_word", lang)}
                                  </span>
                                  <span style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.25)", flex: 1 }}>
                                    {String(bh.startDate)} → {String(bh.endDate)}
                                  </span>
                                  <span style={{
                                    fontSize: "0.6rem", fontWeight: 600, padding: "1px 5px", borderRadius: "999px",
                                    background: isRunning ? `${bc}33` : bst === "past" ? "rgba(255,255,255,0.04)" : "transparent",
                                    color: isRunning ? bc : bst === "past" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.3)",
                                    border: `1px solid ${isRunning ? bc + "55" : "rgba(255,255,255,0.06)"}`,
                                  }}>
                                    {isRunning ? t("status_active", lang) : bst === "past" ? t("status_past", lang) : t("status_upcoming", lang)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Full Maha Dasa timeline below */}
                  <p style={{ margin: "0 0 8px", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.05em" }}>
                    {t("dasha_timeline_label", lang)}
                  </p>
                  <DashaTimeline
                    dasha={personalDasha}
                    dashaAntar={personalDashaAntar}
                    today={selectedDate}
                    dashaSupport={personalDailyGuidance?.scoreBreakdown.dashaSupport ?? 50}
                    lang={lang}
                  />
                </div>
              </Surface>
            ) : null}
          </div>
        )}

        {/* FAMILY */}
        {activeTab === "family" && (
          <div className="tab-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <p className="section-kicker">{t("family_kicker", lang)}</p>
                <h2 className="section-title">{t("family_title", lang)}</h2>
                <p className="section-description">{t("family_desc", lang)}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Button onClick={() => void refreshFamilyBundle()} variant="ghost" disabled={!selectedVaultId || busy.family}>
                  {busy.family ? t("btn_refreshing", lang) : t("btn_refresh_family", lang)}
                </Button>
                <Button onClick={() => setActiveTab("onboarding")} variant="secondary">
                  {t("btn_add_member", lang)}
                </Button>
              </div>
            </div>

            <div className="two-col two-col--wide" style={{ gridTemplateColumns: "0.65fr 1.35fr" }}>
              {/* Vault list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Surface title={t("surface_vaults", lang)}>
                  <div className="stack">
                    {busy.vaults ? <p className="empty-state">{t("vaults_loading", lang)}</p> : null}
                    {vaults.length === 0 && !busy.vaults ? <p className="empty-state">{t("vaults_empty", lang)}</p> : null}
                    {vaults.map((item) => (
                      <div key={item.familyVaultId}
                        className={`vault-row${item.familyVaultId === selectedVaultId ? " vault-row--active" : ""}`}
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button type="button"
                          style={{ flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                          onClick={() => {
                            setSelectedVaultId(item.familyVaultId);
                            setOwnerUserId(item.ownerUserId);
                            setVaultForm((c) => ({ ...c, ownerUserId: item.ownerUserId }));
                            setBirthForm((c) => ({ ...c, ownerUserId: item.ownerUserId }));
                          }}>
                          <span className="vault-row__name">{item.name}</span>
                          <span className="vault-row__meta">
                            {item.memberCount} {item.memberCount === 1 ? t("members_label", lang) : t("members_label_pl", lang)} · {item.latestAggregateDate ?? t("no_aggregate", lang)}
                          </span>
                        </button>
                        <button type="button" className="button button--ghost"
                          disabled={busy.deletingVaultId === item.familyVaultId}
                          onClick={() => void handleDeleteVault(item.familyVaultId, item.name)}
                          style={{ fontSize: "0.72rem", padding: "2px 8px", opacity: 0.55, color: "#f87171" }}
                          title="Delete vault">
                          {busy.deletingVaultId === item.familyVaultId ? "…" : t("btn_delete", lang)}
                        </button>
                      </div>
                    ))}
                  </div>
                </Surface>

                {/* Family score summary */}
                {familyAggregate && familyDetail ? (
                  <Surface title={t("surface_family_score", lang)}>
                    <div className="stack">
                      <div className="surface__metrics">
                        <Metric label={t("family_score_label", lang)} value={formatScoreLabel(familyAggregate.familyScore)}
                          hint={familyAggregate.familyLabel}
                          tone={getScoreBand(familyAggregate.familyScore).tone === "high" ? "high" : getScoreBand(familyAggregate.familyScore).tone === "low" ? "low" : "mid"} />
                        <Metric label={t("support_need", lang)} value={`${familyAggregate.aggregateBreakdown.supportNeedIndex}`} hint="0–100" tone="low" />
                        <Metric label={t("decision_ready", lang)} value={`${familyAggregate.aggregateBreakdown.decisionReadinessIndex}`} hint="0–100" tone="high" />
                      </div>
                      <div className="surface__textBlock">
                        <p className="surface__subhead">{familyDetail.name}</p>
                        <p className="surface__text">{tLang(familyAggregate.summary, lang)}</p>
                        <div className="chip-row">
                          <Chip tone="accent">{familyAggregate.familyLabel}</Chip>
                          {familyAggregate.aggregateBreakdown.chandrashtamaCount > 0 && (
                            <Chip tone="warning">⚠ {familyAggregate.aggregateBreakdown.chandrashtamaCount} {t("member_chandrashtamam", lang)}</Chip>
                          )}
                        </div>
                      </div>
                      <div className="surface__textBlock">
                        <p className="surface__subhead">{t("best_windows", lang)}</p>
                        <div className="chip-row">
                          {familyAggregate.bestFamilyWindows.map((w) => (
                            <Chip key={`${w.type}-${w.start}`} tone="success">{w.type} {w.start}–{w.end}</Chip>
                          ))}
                          {familyAggregate.avoidForFamilyDecisions.map((w) => (
                            <Chip key={`${w.type}-${w.start}`} tone="warning">{w.type} {w.start}–{w.end}</Chip>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Surface>
                ) : null}
              </div>

              {/* Member cards with rasi charts */}
              <div>
                {!selectedVaultId ? (
                  <p className="empty-state">{t("select_vault", lang)}</p>
                ) : busy.family ? (
                  <p className="empty-state">{t("members_loading", lang)}</p>
                ) : familyAggregate && familyAggregate.members.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p className="surface__subhead" style={{ margin: 0 }}>
                        {familyAggregate.members.length} {familyAggregate.members.length === 1 ? t("members_label", lang) : t("members_label_pl", lang)}
                        {busy.memberCharts ? t("charts_loading", lang) : ""}
                      </p>
                    </div>
                    {familyAggregate.members.map((member) => (
                      <MemberCard
                        key={member.familyMemberId}
                        member={member}
                        memberChart={memberCharts.find((mc) => mc.memberId === member.familyMemberId)}
                        onDelete={handleDeleteMember}
                        onEdit={(m) => {
                          const mc = memberCharts.find((x) => x.memberId === m.familyMemberId);
                          const bp = mc?.chart.birthProfile;
                          setEditMember({
                            memberId: m.familyMemberId,
                            displayName: m.displayName,
                            relationshipToOwner: (bp?.relationshipToOwner as Relationship) ?? "other",
                            memberWeight: m.memberWeight.toFixed(2),
                            birthDateLocal: bp?.birthDateLocal ?? "",
                            birthTimeLocal: bp?.birthTimeLocal ?? "",
                            birthPlace: bp?.birthPlace ?? "",
                            birthLatitude: bp?.birthLatitude?.toString() ?? "",
                            birthLongitude: bp?.birthLongitude?.toString() ?? "",
                            birthTimezone: bp?.birthTimezone ?? "",
                          });
                        }}
                        deletingId={busy.deletingMemberId}
                        today={selectedDate}
                        lang={lang}
                      />
                    ))}
                  </div>
                ) : familyAggregate ? (
                  <div style={{ textAlign: "center", padding: "48px 24px" }}>
                    <p className="empty-state">{t("no_members_yet", lang)}</p>
                    <Button onClick={() => setActiveTab("onboarding")} variant="primary">{t("btn_add_first_member", lang)}</Button>
                  </div>
                ) : (
                  <p className="empty-state">{t("select_vault", lang)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {activeTab === "calendar" && (
          <CalendarTab
            selectedDate={selectedDate}
            panchangam={panchangam}
            panchangamTimings={panchangamTimings}
            dailyGuidance={dailyGuidance}
            dailyGuidanceRange={dailyGuidanceRange}
            familyCalendar={familyCalendar}
            familyAggregate={familyAggregate}
            chartSummary={chartSummary}
            transit={transit}
            sani={sani}
            hasBirthProfile={!!birthProfileId}
            hasVault={!!selectedVaultId}
            lang={lang}
          />
        )}

        {/* SETTINGS */}
        {/* QA DASHBOARD */}
        {activeTab === "qa" && (
          <QATab lang={lang} />
        )}

        {activeTab === "settings" && (
          <div className="tab-section">
            <div>
              <p className="section-kicker">{t("settings_kicker", lang)}</p>
              <h2 className="section-title">{t("settings_title", lang)}</h2>
              <p className="section-description">{t("settings_desc", lang)}</p>
            </div>

            <div className="card" style={{ padding: "24px" }}>
              <div className="settings-grid">
                <Field label={t("settings_owner", lang)} helper={t("settings_owner_hint", lang)}>
                  <input className="input" value={ownerUserId}
                    onChange={(e) => { setOwnerUserId(e.target.value); setBirthForm((c) => ({ ...c, ownerUserId: e.target.value })); setVaultForm((c) => ({ ...c, ownerUserId: e.target.value })); }} />
                </Field>
                <Field label={t("settings_date", lang)}>
                  <input className="input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </Field>
                <Field label={t("settings_vault", lang)} helper={t("settings_vault_hint", lang)}>
                  <input className="input" value={selectedVaultId} readOnly />
                </Field>
                <Field label={t("settings_profile", lang)}>
                  <input className="input" value={birthProfileId} readOnly />
                </Field>
                <Field label={t("settings_chart", lang)}>
                  <input className="input" value={chartId} readOnly />
                </Field>
              </div>

              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="surface__subhead" style={{ marginBottom: "10px" }}>{t("settings_quick", lang)}</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Button onClick={() => void refreshPersonalBundle()} variant="ghost" disabled={!birthProfileId || busy.personal}>
                    {busy.personal ? t("btn_refreshing", lang) : t("btn_refresh_personal", lang)}
                  </Button>
                  <Button onClick={() => void refreshFamilyBundle()} variant="ghost" disabled={!selectedVaultId || busy.family}>
                    {busy.family ? t("btn_refreshing", lang) : t("btn_refresh_family", lang)}
                  </Button>
                </div>
              </div>
            </div>

            {/* Privacy & disclaimer footer */}
            <div style={{
              borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)", padding: "14px 18px",
              display: "flex", flexDirection: "column", gap: "6px",
            }}>
              <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                {t("disclaimer_astro", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                {t("disclaimer_no_doom", lang)}
              </p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                {t("disclaimer_data", lang)}
              </p>
              <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", textDecoration: "underline", cursor: "pointer" }}>
                  {t("privacy_link", lang)}
                </span>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", textDecoration: "underline", cursor: "pointer" }}>
                  {t("terms_link", lang)}
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Floating feedback button ─────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowFeedback(true)}
        title={t("feedback_btn", lang)}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 150,
          width: "48px", height: "48px", borderRadius: "50%",
          background: "rgba(139,92,246,0.85)", border: "1px solid rgba(139,92,246,0.6)",
          boxShadow: "0 4px 20px rgba(139,92,246,0.4)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.2rem", color: "#fff", transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        ✉
      </button>

      {/* ── Feedback modal ──────────────────────────────────── */}
      {showFeedback && <FeedbackModal lang={lang} onClose={() => setShowFeedback(false)} />}

    </div>
  );
}
