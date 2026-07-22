"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { formatDateLabel, todayIso } from "@/lib/format";
import { t, tPlanetLord } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { useStreak } from "@/hooks/useStreak";
import type {
  ApiEnvelope,
  ChartSummaryData,
  ContextData,
  JournalCorrelationData,
  JournalEntryData,
  JournalPromptItem,
  JournalPromptsData,
} from "@/lib/types";

import { Chip } from "./dashboard-ui";
import { NovaProgressBar } from "./dashboard-ui-nova";
import { novaDetailCardStyle } from "./dashboard-explore-detail-nova";
import { NovaSelect } from "./nova-select";
import {
  AREA_KEY,
  CTX_TYPE_KEY,
  LIFE_AREAS,
} from "./dashboard-journal-shared";
import type { ContextEventType, LifeArea } from "./dashboard-journal-shared";

/**
 * Nova Journal tab — Phase 11 of the dashboard revamp, the last of the 4
 * newly-discovered mockup screens (docs/DASHBOARD_UI_REVAMP_PLAN.md §6.11).
 * A full tab-level screen (own 3-way sub-nav: Write/Entries/Reflections)
 * like Life Areas/Plan's Nova tabs, not a detail drill-down — no shared
 * shell with dashboard-explore-detail-nova.tsx applies beyond its generic
 * `novaDetailCardStyle` card container.
 *
 * Unlike Phase 9/10 (which could defer 4 sub-tabs as reused-Classic-styled
 * verbatim), all three sub-tabs here needed a fresh rebuild: Classic's own
 * `dashboard-journal-tab.tsx` reads a `W` token map whose `ink`/`inkMid`/
 * `border`/`borderLt`/`surfaceMd` resolve to `--panel-earth-dark`/
 * `--panel-earth`/`--panel-tan`/`--panel-tan-light`/`--panel-hover` — the
 * exact 5 custom properties the 2026-07-06 browser QA round found unsafe to
 * redirect (reverted, not redirected, after they broke selected-pill text
 * elsewhere) — while its `surface`/`card` tokens *are* redirected to Nova's
 * dark surface for unrelated reasons. That mix would render dark-brown
 * Classic text on an already-dark Nova card background (illegible, not just
 * unstyled) rather than the internally-consistent "light Classic island"
 * look Phase 9/10's deferred panels have. So Entries/Reflections are
 * rebuilt fresh here too, extrapolating Nova's established list/card/chip
 * patterns per §3.1's policy, rather than deferred.
 *
 * Pure data/constants (`LIFE_AREAS`/`AREA_KEY`/`CONTEXT_EVENT_TYPES`/
 * `CTX_TYPE_KEY`) are additively exported from Classic's file and reused
 * verbatim; state/handlers are reimplemented against the same API calls
 * (same class of decision as `NovaLifeEventLogCard`/`NovaTransitsView`).
 */

type JournalSubTab = "write" | "entries" | "reflections";

const fieldStyle: CSSProperties = {
  borderRadius: "9px",
  border: "1.5px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text)",
  fontSize: "0.8125rem",
  padding: "9px 12px",
  fontFamily: "inherit",
};

const kickerStyle: CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-text-accent)",
  fontWeight: 700,
};

function formatEntryHeading(dateStr: string, lang: Lang): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(lang === "ta" ? "ta-IN" : "en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(d);
}

function NovaShadowPromptsCard({ lang, mode, chartId }: { lang: Lang; mode: "BEGINNER" | "BALANCED" | "TRADITIONAL"; chartId: string }) {
  const [open, setOpen] = useState(false);
  const [prompts, setPrompts] = useState<JournalPromptItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (mode === "BEGINNER" || !chartId) return null;

  async function fetchPrompts() {
    if (prompts) {
      setOpen((v) => !v);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const today = todayIso();
      const j = await apiFetchJson<ApiEnvelope<JournalPromptsData>>(
        `/api/v1/journal/prompts${toQuery({ chartId, date: today, promptType: "SHADOW" })}`,
      );
      setPrompts(j?.data?.prompts ?? []);
    } catch {
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={novaDetailCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div>
          <p style={{ ...kickerStyle, margin: 0 }}>{t("shadow_prompts_title", lang)}</p>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--color-muted)", lineHeight: 1.5 }}>{t("shadow_prompts_desc", lang)}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchPrompts()}
          style={{
            padding: "8px 18px",
            borderRadius: "9px",
            border: `1px solid ${open ? "var(--color-accent)" : "var(--color-border-strong)"}`,
            background: open ? "var(--color-accent)" : "transparent",
            color: open ? "var(--color-on-accent)" : "var(--color-accent-strong)",
            fontSize: "0.8125rem",
            cursor: "pointer",
            fontWeight: 700,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
          }}
        >
          {t("shadow_prompts_cta", lang)}
        </button>
      </div>

      {open && (
        <div>
          {loading && <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)" }}>{t("journal_prompts_loading", lang)}</p>}

          {!loading && prompts && prompts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-faint)" }}>
                {t("shadow_prompts_reflect_on", lang)}
              </p>
              {prompts.map((p, i) => (
                <div key={p.promptId} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-surface-soft)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1rem", marginTop: "1px", color: "var(--color-accent-strong)" }}>{["1.", "2.", "3."][i] ?? "•"}</span>
                  <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.55, color: "var(--color-text)" }}>{lang === "ta" ? p.text.ta : p.text.en}</p>
                </div>
              ))}
            </div>
          )}

          {!loading && prompts && prompts.length === 0 && (
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--color-muted)" }}>{t("shadow_prompts_empty", lang)}</p>
          )}
        </div>
      )}
    </div>
  );
}

type DashboardJournalTabNovaProps = {
  lang: Lang;
  chartId: string;
  selectedDate: string;
  hasBirthProfile: boolean;
  journalEntries: JournalEntryData[];
  journalTotal: number;
  contextData: ContextData | null;
  onEntrySaved: () => void;
  onEntryArchived: () => void;
  mode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
  chartSummary: ChartSummaryData | null;
  journalCorrelations: JournalCorrelationData | null;
  /** Opens Family & Charts (the chart + transit/dasa home). Renamed from the
   *  misleading `onGoToTransits` — there is no `transits` tab (IA audit
   *  2026-07-22, Phase 5). */
  onGoToChart: () => void;
  /** Opens the Settings → Life context section, the new editable home for
   *  context events (IA audit 2026-07-22, Phase 4). The diary keeps a
   *  read-only view of what context the engine is using. */
  onManageContext: () => void;
};

export function DashboardJournalTabNova({
  lang,
  chartId,
  selectedDate,
  hasBirthProfile,
  journalEntries,
  journalTotal,
  contextData,
  onEntrySaved,
  onEntryArchived,
  mode = "BALANCED",
  chartSummary,
  journalCorrelations,
  onGoToChart,
  onManageContext,
}: DashboardJournalTabNovaProps) {
  const { days: streakDays } = useStreak();

  const [journalSubTab, setJournalSubTab] = useState<JournalSubTab>("write");

  const [entryDate, setEntryDate] = useState(selectedDate);
  const [lifeArea, setLifeArea] = useState<LifeArea>("general");
  const [noteText, setNoteText] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [prompts, setPrompts] = useState<JournalPromptItem[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);

  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState(selectedDate);
  const [editLifeArea, setEditLifeArea] = useState<LifeArea>("general");
  const [editNoteText, setEditNoteText] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  useEffect(() => {
    setEntryDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!chartId) return;
    setPromptsLoading(true);
    apiFetchJson<ApiEnvelope<JournalPromptsData>>(`/api/v1/journal/prompts${toQuery({ chartId, date: selectedDate, lifeArea })}`)
      .then((r) => setPrompts(r.data.prompts))
      .catch(() => setPrompts([]))
      .finally(() => setPromptsLoading(false));
  }, [chartId, selectedDate, lifeArea]);

  async function handleSave() {
    if (!noteText.trim() || noteText.trim().length < 3) return;
    setSaveBusy(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await apiFetchJson("/api/v1/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, entryDate, lifeArea, noteText: noteText.trim() }),
      });
      setNoteText("");
      setSaveSuccess(true);
      onEntrySaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError(t("journal_save_error", lang));
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleArchive(journalId: string) {
    setArchivingId(journalId);
    setArchiveSuccess(false);
    try {
      await apiFetchJson(`/api/v1/journal/${journalId}`, { method: "DELETE" });
      setArchiveSuccess(true);
      onEntryArchived();
      setTimeout(() => setArchiveSuccess(false), 2500);
    } catch {
      // ignore
    } finally {
      setArchivingId(null);
    }
  }

  function startEdit(entry: JournalEntryData) {
    setEditId(entry.journalId);
    setEditDate(entry.entryDate);
    setEditLifeArea((LIFE_AREAS.includes(entry.lifeArea as LifeArea) ? entry.lifeArea : "general") as LifeArea);
    setEditNoteText(entry.noteText);
  }

  function cancelEdit() {
    setEditId(null);
    setEditNoteText("");
  }

  async function handleSaveEdit() {
    if (!editId || editNoteText.trim().length < 3) return;
    setEditBusy(true);
    try {
      await apiFetchJson(`/api/v1/journal/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryDate: editDate, lifeArea: editLifeArea, noteText: editNoteText.trim() }),
      });
      cancelEdit();
      onEntrySaved();
    } catch {
      // ignore
    } finally {
      setEditBusy(false);
    }
  }

  async function exportJournal() {
    if (!chartId) return;
    setExportBusy(true);
    try {
      const response = await fetch(`/api/backend/api/v1/journal/export?chartId=${chartId}`, { credentials: "include" });
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `journal-${chartId}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportBusy(false);
    }
  }

  if (!hasBirthProfile) {
    return (
      <div style={{ ...novaDetailCardStyle, border: "1px dashed var(--color-border-strong)" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)" }}>
          {lang === "ta" ? "முதலில் ஒரு பிறந்த நாள் சுயவிவரம் உருவாக்கவும்." : "Create a birth profile first."}
        </p>
      </div>
    );
  }

  const SUB_TABS: { key: JournalSubTab; label: string }[] = [
    { key: "write", label: lang === "ta" ? "எழுது" : "Write" },
    { key: "entries", label: lang === "ta" ? "குறிப்புகள்" : "Entries" },
    { key: "reflections", label: lang === "ta" ? "சிந்தனைகள்" : "Reflections" },
  ];

  const hasWrittenToday = journalEntries.some((e) => e.entryDate === todayIso());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontFamily: "var(--font-body)", color: "var(--color-text)" }}>

      {/* ===== Header ===== */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, ...kickerStyle }}>{t("tab_journal", lang)}</p>
          <h1 style={{ margin: "6px 0 8px", fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 600, lineHeight: 1.15, color: "var(--color-text-strong)" }}>
            {lang === "ta" ? "தினசரி குறிப்புகள் மற்றும் " : "Daily notes and "}
            <em style={{ fontStyle: "italic", color: "var(--color-accent-strong)" }}>{lang === "ta" ? "சிந்தனைகள்." : "reflections."}</em>
          </h1>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted)", lineHeight: 1.55, maxWidth: "520px" }}>{t("journal_tab_desc", lang)}</p>
          {/* Duty-of-care safeguard — vulnerable users lean on reflection during
              hard chapters ("cheaper than therapy") (#98). */}
          <p style={{ margin: "8px 0 0", fontSize: "11.5px", color: "var(--color-faint)", lineHeight: 1.5, maxWidth: "520px", display: "flex", gap: "6px" }}>
            <span aria-hidden="true">🕊</span>
            <span>{t("safeguard_reflection", lang)}</span>
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
          <div style={{ display: "flex", gap: "4px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "11px", padding: "4px" }}>
            {SUB_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setJournalSubTab(key)}
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: journalSubTab === key ? 700 : 600, color: journalSubTab === key ? "var(--color-on-accent)" : "var(--color-muted)", background: journalSubTab === key ? "var(--color-accent)" : "transparent", border: "none", borderRadius: "8px", padding: "8px 15px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {label}
                {key === "entries" && (
                  <span style={{ fontSize: "10.5px", opacity: 0.75 }}>{journalTotal}</span>
                )}
              </button>
            ))}
          </div>
          {streakDays > 1 && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "11.5px", fontWeight: 700, color: "var(--color-accent-strong)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "999px", padding: "5px 12px", whiteSpace: "nowrap" }}>
              ✦ {lang === "ta" ? `${streakDays} நாள் தொடர்ச்சி` : `${streakDays}-day check-in streak`}
              {!hasWrittenToday && (lang === "ta" ? " — இன்று முதல் குறிப்பை எழுதுங்கள்" : " — write your first note today")}
            </span>
          )}
        </div>
      </div>

      {/* ===== Sub-tab: Write ===== */}
      {journalSubTab === "write" && (
        <div className="nova-grid-detail">
          {/* New entry */}
          <div style={novaDetailCardStyle}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <span style={kickerStyle}>
                {lang === "ta" ? "புதிய குறிப்பு" : "New entry"} · {formatEntryHeading(entryDate, lang)}
              </span>
              {chartSummary && (
                <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                  {tPlanetLord(chartSummary.currentMahadasha, lang)} {t("dasha_word", lang)} · {tPlanetLord(chartSummary.currentAntardasha, lang)} {t("bhukti_word", lang)}
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--color-faint)", fontWeight: 700 }}>{t("journal_date", lang)}</span>
                <input style={fieldStyle} type="date" value={entryDate} max={todayIso()} onChange={(e) => setEntryDate(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", color: "var(--color-faint)", fontWeight: 700 }}>{t("journal_life_area", lang)}</span>
                <NovaSelect
                  value={lifeArea}
                  onChange={(v) => setLifeArea(v as LifeArea)}
                  ariaLabel={t("journal_life_area", lang)}
                  options={LIFE_AREAS.map((area) => ({ value: area, label: t(AREA_KEY[area], lang) }))}
                />
              </div>
            </div>

            {promptsLoading && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-faint)" }}>{t("journal_prompts_loading", lang)}</p>}
            {!promptsLoading && prompts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <span style={{ fontSize: "11px", color: "var(--color-faint)", fontWeight: 700 }}>
                  {lang === "ta" ? "தொடங்க ஒரு தூண்டுதல் வேண்டுமா?" : "Need a starting point?"}
                </span>
                {prompts.map((p) => (
                  <button
                    key={p.promptId}
                    type="button"
                    onClick={() => setNoteText((prev) => (prev ? `${prev}\n${p.text[lang]}` : p.text[lang]))}
                    style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "var(--color-text)", background: "var(--color-accent-muted)", border: "1px solid var(--color-border-strong)", borderRadius: "9px", padding: "10px 13px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  >
                    <span style={{ flex: 1 }}>{p.text[lang]}</span>
                    <span style={{ flex: "none", fontSize: "11px", color: "var(--color-accent-strong)", fontWeight: 700 }}>{lang === "ta" ? "பயன்படுத்து →" : "Use →"}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <textarea
                style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.55, minHeight: "120px" }}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder={t("journal_note_placeholder", lang)}
              />
              <span style={{ fontSize: "0.625rem", color: "var(--color-faint)", textAlign: "right" }}>{noteText.length}/2000</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={saveBusy || noteText.trim().length < 3}
                onClick={() => void handleSave()}
                style={{
                  padding: "10px 22px",
                  borderRadius: "9px",
                  border: "1px solid var(--color-accent)",
                  cursor: saveBusy || noteText.trim().length < 3 ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  background: saveBusy || noteText.trim().length < 3 ? "var(--color-border)" : "var(--color-accent)",
                  color: saveBusy || noteText.trim().length < 3 ? "var(--color-faint)" : "var(--color-on-accent)",
                  fontFamily: "inherit",
                }}
              >
                {saveBusy ? t("btn_saving_journal", lang) : t("btn_save_journal", lang)}
              </button>
              <span style={{ fontSize: "12px", color: "var(--color-faint)" }}>
                {lang === "ta" ? "குறிப்புகள் உங்களுக்கு மட்டுமே — குடும்பத்துடன் பகிரப்படாது." : "Entries are private to you — never shared with family."}
              </span>
              {saveSuccess && <span style={{ fontSize: "0.75rem", color: "var(--color-high)" }}>{t("journal_saved", lang)}</span>}
              {saveError && <span style={{ fontSize: "0.75rem", color: "var(--color-low)" }}>{saveError}</span>}
            </div>
          </div>

          {/* Right rail */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {journalCorrelations && (
              <div style={novaDetailCardStyle}>
                <span style={kickerStyle}>{t("journal_patterns_label", lang)}</span>
                {!journalCorrelations.hasSufficientData ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--color-text)" }}>
                      <span>{journalCorrelations.entryCount} / {journalCorrelations.minimumEntriesRequired} {t("journal_entries_progress", lang)}</span>
                    </div>
                    <NovaProgressBar value={journalCorrelations.entryCount} max={journalCorrelations.minimumEntriesRequired} tone="accent" />
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.55 }}>
                      {lang === "ta" ? "திறந்தவுடன், உங்கள் நல்ல மற்றும் கடினமான நாட்கள் " : "Once unlocked, Vinaadi shows how your good and hard days line up with "}
                      <button type="button" onClick={onGoToChart} style={{ background: "none", border: "none", padding: 0, color: "var(--color-accent-secondary)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                        {lang === "ta" ? "உங்கள் ஜாதகத்தின் கிரகநகர்வு & தசை காலங்களுடன்" : "your chart's transits and dasa periods"}
                      </button>
                      {lang === "ta" ? " எப்படி பொருந்துகின்றன என்பதைக் காட்டும் — உங்கள் சொந்த வாழ்க்கையிலிருந்து சான்று." : " — evidence from your own life."}
                    </p>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {journalCorrelations.correlations.map((corr, i) => (
                      <div key={i} style={{ padding: "10px 12px", borderRadius: "9px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
                        <p style={{ margin: "0 0 3px", fontSize: "12.5px", color: "var(--color-text)", lineHeight: 1.45 }}>{lang === "ta" ? corr.descriptionTa : corr.descriptionEn}</p>
                        <p style={{ margin: 0, fontSize: "10px", color: "var(--color-faint)" }}>
                          {t("journal_mood_avg", lang)}: {corr.avgMood.toFixed(1)} | {corr.sampleCount} {t("journal_sample_count", lang)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Read-only "active life context" — the editable home is now
                Settings → Life context (IA audit 2026-07-22, Phase 4). The
                diary still shows what context the engine is using, without
                being the place you edit it. */}
            <div style={novaDetailCardStyle}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <span style={kickerStyle}>{t("context_section_label", lang)}</span>
                <button
                  type="button"
                  onClick={onManageContext}
                  style={{ background: "none", border: "none", padding: 0, fontSize: "12px", color: "var(--color-accent-strong)", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {lang === "ta" ? "அமைப்புகளில் நிர்வகி →" : "Manage in Settings →"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>
                {lang === "ta"
                  ? "விநாடி இந்த நிகழ்வுகளை உங்கள் தினசரி வழிகாட்டலுக்குப் பயன்படுத்துகிறது. திருத்த அமைப்புகள் → வாழ்க்கை சூழல்."
                  : "Vinaadi factors these into your daily guidance. Edit them in Settings → Life context."}
              </p>

              {(contextData?.activeEvents ?? []).length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  {(contextData?.activeEvents ?? []).map((ev, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "6px 11px", borderRadius: "999px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
                      <Chip tone="accent">{CTX_TYPE_KEY[ev.type as ContextEventType] ? t(CTX_TYPE_KEY[ev.type as ContextEventType], lang) : ev.type}</Chip>
                      <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>{formatDateLabel(ev.date)}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "11.5px", color: "var(--color-faint)" }}>{t("context_no_events", lang)}</p>
              )}
            </div>

            <div style={{ ...novaDetailCardStyle, background: "linear-gradient(135deg, var(--color-accent-secondary-muted), var(--color-surface) 60%)", border: "1px solid var(--color-accent-secondary)" }}>
              <span style={{ ...kickerStyle, color: "var(--color-accent-secondary)" }}>{lang === "ta" ? "ஏன் இங்கே பதிவு செய்ய வேண்டும்?" : "Why journal here?"}</span>
              <p style={{ margin: 0, fontSize: "12.5px", lineHeight: 1.6, color: "var(--color-text)" }}>
                {lang === "ta"
                  ? "ஜோதிடம் முன்னறிவிப்பைத் தருகிறது; உங்கள் நாட்குறிப்பு உண்மையில் நடந்த வானிலையைப் பதிவு செய்கிறது. இரண்டும் சேர்ந்து எதை நம்பலாம் என்பதைக் காட்டும்."
                  : "Astrology gives the forecast; your journal records the weather that actually arrived. Together they tell you what to trust."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== Sub-tab: Entries ===== */}
      {journalSubTab === "entries" && (
        <div style={novaDetailCardStyle}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <span style={kickerStyle}>
              {t("journal_list_label", lang)}{journalTotal > 0 ? ` | ${journalTotal} ${t("journal_total_count", lang)}` : ""}
            </span>
            <button
              type="button"
              onClick={() => void exportJournal()}
              disabled={exportBusy || !chartId}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "9px", border: "1px solid var(--color-border-strong)", background: "transparent", color: "var(--color-text)", fontSize: "12px", fontWeight: 600, cursor: exportBusy ? "not-allowed" : "pointer", opacity: exportBusy ? 0.6 : 1, fontFamily: "inherit" }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {exportBusy ? (lang === "ta" ? "ஏற்றுகிறது..." : "Exporting...") : (lang === "ta" ? "ஜர்னல் ஏற்றுமதி" : "Export journal")}
            </button>
          </div>

          {archiveSuccess && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-high)" }}>{t("journal_archived", lang)}</p>}

          {journalEntries.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)" }}>{t("journal_no_entries", lang)}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {journalEntries.map((entry) => (
                <div key={entry.journalId} style={{ padding: "13px 15px", borderRadius: "10px", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>{formatDateLabel(entry.entryDate)}</span>
                    <Chip tone="neutral">{t(AREA_KEY[entry.lifeArea as LifeArea] ?? "journal_area_general", lang)}</Chip>
                    {entry.tags.length > 0 && entry.tags.map((tag) => <Chip key={tag} tone="accent">{tag}</Chip>)}
                    <span style={{ marginLeft: "auto", fontSize: "0.625rem", color: "var(--color-faint)" }}>{t("journal_anchor_dasha", lang)}: {entry.anchor.activeDasha}</span>
                  </div>

                  <p style={{ margin: "0 0 10px", fontSize: "0.875rem", color: "var(--color-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.noteText}</p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid var(--color-border-strong)", background: "transparent", color: "var(--color-text)", fontSize: "0.625rem", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {lang === "ta" ? "திருத்து" : "Edit"}
                    </button>
                    <button
                      type="button"
                      disabled={archivingId === entry.journalId}
                      onClick={() => void handleArchive(entry.journalId)}
                      style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid var(--color-low-border)", background: "transparent", color: "var(--color-low)", fontSize: "0.625rem", cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {archivingId === entry.journalId ? "..." : t("btn_archive_entry", lang)}
                    </button>
                  </div>

                  {editId === entry.journalId && (
                    <div style={{ marginTop: "10px", padding: "12px", borderRadius: "9px", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                      <div style={{ display: "flex", gap: "9px", marginBottom: "8px", flexWrap: "wrap" }}>
                        <input type="date" value={editDate} max={todayIso()} onChange={(e) => setEditDate(e.target.value)} style={{ ...fieldStyle, minWidth: "140px" }} />
                        <NovaSelect
                          value={editLifeArea}
                          onChange={(v) => setEditLifeArea(v as LifeArea)}
                          ariaLabel={t("journal_life_area", lang)}
                          containerStyle={{ minWidth: "160px" }}
                          options={LIFE_AREAS.map((area) => ({ value: area, label: t(AREA_KEY[area], lang) }))}
                        />
                      </div>
                      <textarea value={editNoteText} onChange={(e) => setEditNoteText(e.target.value)} rows={4} style={{ ...fieldStyle, width: "100%", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit()}
                          disabled={editBusy || editNoteText.trim().length < 3}
                          style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid var(--color-accent)", background: "var(--color-accent)", color: "var(--color-on-accent)", fontSize: "0.75rem", fontWeight: 700, cursor: editBusy ? "not-allowed" : "pointer", opacity: editBusy ? 0.7 : 1, fontFamily: "inherit" }}
                        >
                          {editBusy ? (lang === "ta" ? "சேமிக்கிறது..." : "Saving...") : (lang === "ta" ? "சேமி" : "Save")}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid var(--color-border-strong)", background: "transparent", color: "var(--color-muted)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          {lang === "ta" ? "ரத்து" : "Cancel"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Sub-tab: Reflections ===== */}
      {journalSubTab === "reflections" &&
        (mode === "BEGINNER" ? (
          <div style={{ ...novaDetailCardStyle, alignItems: "center", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-strong)" }}>
              {lang === "ta" ? "ஆழமான சிந்தனைகள்" : "Deep Reflections"}
            </p>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-muted)", lineHeight: 1.55 }}>
              {lang === "ta"
                ? "இந்த பகுதி Balanced அல்லது Traditional பயன்பாட்டில் கிடைக்கும். Settings → Preferences-ல் மாற்றவும்."
                : "Available in Balanced or Traditional mode. Change in Settings -> Preferences."}
            </p>
          </div>
        ) : (
          <NovaShadowPromptsCard lang={lang} mode={mode} chartId={chartId} />
        ))}
    </div>
  );
}
