"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { apiFetchJson, toQuery } from "@/lib/api";
import { formatDateLabel } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type {
  ApiEnvelope,
  ContextData,
  ContextEvent,
  JournalEntryData,
  JournalPromptItem,
  JournalPromptsData,
} from "@/lib/types";
import { Chip, Surface } from "./dashboard-ui";
import { DashboardShadowPrompts } from "./dashboard-shadow-prompts";

const LIFE_AREAS = ["career", "relationship", "health", "family", "finance", "education", "spiritual", "general"] as const;
type LifeArea = (typeof LIFE_AREAS)[number];

const AREA_KEY: Record<LifeArea, Parameters<typeof t>[0]> = {
  career: "journal_area_career",
  relationship: "journal_area_relationship",
  health: "journal_area_health",
  family: "journal_area_family",
  finance: "journal_area_finance",
  education: "journal_area_education",
  spiritual: "journal_area_spiritual",
  general: "journal_area_general",
};

const CONTEXT_EVENT_TYPES = ["job_change", "marriage", "travel", "health_event", "education", "property", "family_event", "other"] as const;
type ContextEventType = (typeof CONTEXT_EVENT_TYPES)[number];

const CTX_TYPE_KEY: Record<ContextEventType, Parameters<typeof t>[0]> = {
  job_change: "ctx_type_job_change",
  marriage: "ctx_type_marriage",
  travel: "ctx_type_travel",
  health_event: "ctx_type_health_event",
  education: "ctx_type_education",
  property: "ctx_type_property",
  family_event: "ctx_type_family_event",
  other: "ctx_type_other",
};

interface DashboardJournalTabProps {
  lang: Lang;
  chartId: string;
  selectedDate: string;
  hasBirthProfile: boolean;
  journalEntries: JournalEntryData[];
  journalTotal: number;
  contextData: ContextData | null;
  onEntrySaved: () => void;
  onEntryArchived: () => void;
  onContextUpdated: (data: ContextData) => void;
  mode?: "BEGINNER" | "BALANCED" | "TRADITIONAL";
}

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "#A89D89",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  terracotta: "#B85A2C",
  rust: "#A8482F",
  sage: "#5C7654",
} as const;

const fieldStyle: CSSProperties = {
  borderRadius: "10px",
  border: `1.5px solid ${W.borderLt}`,
  background: W.card,
  color: W.inkMid,
  fontSize: "0.82rem",
  padding: "8px 10px",
  fontFamily: "inherit",
};

export function DashboardJournalTab({
  lang,
  chartId,
  selectedDate,
  hasBirthProfile,
  journalEntries,
  journalTotal,
  contextData,
  onEntrySaved,
  onEntryArchived,
  onContextUpdated,
  mode = "BALANCED",
}: DashboardJournalTabProps) {
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

  const [ctxEventType, setCtxEventType] = useState<ContextEventType>("job_change");
  const [ctxEventDate, setCtxEventDate] = useState(selectedDate);
  const [ctxEventNote, setCtxEventNote] = useState("");
  const [ctxBusy, setCtxBusy] = useState(false);
  const [ctxSuccess, setCtxSuccess] = useState(false);

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

  async function handleAddContextEvent() {
    if (!chartId) return;
    setCtxBusy(true);
    setCtxSuccess(false);
    try {
      const existingEvents: ContextEvent[] = contextData?.activeEvents ?? [];
      const newEvent: ContextEvent = {
        type: ctxEventType,
        date: ctxEventDate,
        note: ctxEventNote.trim() || null,
      };
      const merged = [...existingEvents, newEvent];
      const r = await apiFetchJson<{ success: boolean; data: ContextData }>("/api/v1/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, activeEvents: merged }),
      });
      onContextUpdated(r.data);
      setCtxEventNote("");
      setCtxSuccess(true);
      setTimeout(() => setCtxSuccess(false), 3000);
    } catch {
      // ignore
    } finally {
      setCtxBusy(false);
    }
  }

  async function handleRemoveContextEvent(index: number) {
    if (!chartId) return;
    const updated = (contextData?.activeEvents ?? []).filter((_, i) => i !== index);
    try {
      const r = await apiFetchJson<{ success: boolean; data: ContextData }>("/api/v1/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId, activeEvents: updated }),
      });
      onContextUpdated(r.data);
    } catch {
      // ignore
    }
  }

  type JournalSubTab = "write" | "entries" | "reflections";
  const [journalSubTab, setJournalSubTab] = useState<JournalSubTab>("write");
  const JOURNAL_SUB_TABS: { key: JournalSubTab; label: string }[] = [
    { key: "write", label: lang === "ta" ? "எழுது" : "Write" },
    { key: "entries", label: lang === "ta" ? "குறிப்புகள்" : "Entries" },
    { key: "reflections", label: lang === "ta" ? "சிந்தனைகள்" : "Reflections" },
  ];

  if (!hasBirthProfile) {
    return (
      <div style={{ padding: "16px", borderRadius: "14px", border: `1px dashed ${W.border}`, background: W.surface, color: W.muted, fontSize: "0.84rem" }}>
        {lang === "ta" ? "முதலில் ஒரு பிறந்த நாள் சுயவிவரம் உருவாக்கவும்." : "Create a birth profile first."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", color: W.inkMid, fontFamily: "'Noto Sans Tamil','Inter',system-ui,sans-serif" }}>
      <div
        style={{
          borderRadius: "20px",
          border: `1px solid ${W.borderLt}`,
          background: `linear-gradient(135deg, ${W.surface} 0%, ${W.card} 70%)`,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div>
          <p style={{ margin: "0 0 6px", fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: W.terracotta }}>
            {lang === "ta" ? "ஜர்னல்" : "Journal"}
          </p>
          <h2 style={{ margin: "0 0 6px", fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(1.7rem, 3.1vw, 2.35rem)", letterSpacing: "-0.02em", color: W.ink }}>
            {lang === "ta" ? "Daily notes and reflections" : "Daily notes and reflections"}
          </h2>
          <p style={{ margin: 0, fontSize: "0.84rem", color: W.muted, lineHeight: 1.55, maxWidth: "62ch" }}>{t("journal_tab_desc", lang)}</p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.7rem", color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            {lang === "ta" ? "entries" : "entries"}
          </span>
          <span style={{ padding: "2px 10px", borderRadius: "999px", background: W.surfaceMd, border: `1px solid ${W.border}`, fontSize: "0.74rem", fontWeight: 700, color: W.inkMid }}>
            {journalTotal}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {JOURNAL_SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setJournalSubTab(key)}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "0.74rem",
              fontWeight: 600,
              cursor: "pointer",
              border: `1.5px solid ${journalSubTab === key ? W.ink : W.border}`,
              background: journalSubTab === key ? W.ink : "transparent",
              color: journalSubTab === key ? W.surfaceMd : W.muted,
              fontFamily: "inherit",
              transition: "all 0.12s ease",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {journalSubTab === "write" && (
        <Surface title={t("context_section_label", lang)}>
          <div className="surface__body">
            <p style={{ margin: "0 0 14px", fontSize: "0.75rem", color: W.muted, lineHeight: 1.5 }}>{t("context_section_desc", lang)}</p>

            {(contextData?.activeEvents ?? []).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                {(contextData?.activeEvents ?? []).map((ev, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "8px", background: "#EEF6EA", border: "1px solid rgba(92,118,84,0.2)", flexWrap: "wrap" }}>
                    <Chip tone="accent">{CTX_TYPE_KEY[ev.type as ContextEventType] ? t(CTX_TYPE_KEY[ev.type as ContextEventType], lang) : ev.type}</Chip>
                    <span style={{ fontSize: "0.75rem", color: W.muted }}>{formatDateLabel(ev.date)}</span>
                    {ev.note && <span style={{ fontSize: "0.72rem", color: W.muted, fontStyle: "italic", flex: 1 }}>{ev.note}</span>}
                    <button
                      type="button"
                      onClick={() => void handleRemoveContextEvent(i)}
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        border: "1px solid rgba(168,72,47,0.25)",
                        background: "transparent",
                        color: W.rust,
                        fontSize: "0.68rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {t("btn_remove_event", lang)}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: W.mutedLt }}>{t("context_event_type", lang)}</span>
                <select style={{ ...fieldStyle, minWidth: "160px" }} value={ctxEventType} onChange={(e) => setCtxEventType(e.target.value as ContextEventType)}>
                  {CONTEXT_EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(CTX_TYPE_KEY[type], lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: W.mutedLt }}>{t("context_event_date", lang)}</span>
                <input style={{ ...fieldStyle, minWidth: "140px" }} type="date" value={ctxEventDate} onChange={(e) => setCtxEventDate(e.target.value)} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "140px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: W.mutedLt }}>{t("context_event_note", lang)}</span>
                <input
                  style={fieldStyle}
                  type="text"
                  value={ctxEventNote}
                  onChange={(e) => setCtxEventNote(e.target.value)}
                  maxLength={200}
                  placeholder={lang === "ta" ? "விரும்பினால் குறிப்பு…" : "Optional note..."}
                />
              </div>

              <button
                type="button"
                disabled={ctxBusy}
                onClick={() => void handleAddContextEvent()}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  border: `1px solid ${W.ink}`,
                  cursor: ctxBusy ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  background: ctxBusy ? W.borderLt : W.ink,
                  color: ctxBusy ? W.mutedLt : W.surfaceMd,
                  fontFamily: "inherit",
                }}
              >
                {ctxBusy ? t("btn_adding_event", lang) : t("btn_add_event", lang)}
              </button>
            </div>

            {ctxSuccess && <p style={{ margin: "10px 0 0", fontSize: "0.75rem", color: W.sage }}>{t("context_event_saved", lang)}</p>}
            {(contextData?.activeEvents ?? []).length === 0 && !ctxSuccess && (
              <p style={{ margin: "10px 0 0", fontSize: "0.72rem", color: W.muted }}>{t("context_no_events", lang)}</p>
            )}
          </div>
        </Surface>
      )}

      {journalSubTab === "write" && (
        <Surface title={t("journal_write_label", lang)}>
          <div className="surface__body">
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: W.mutedLt }}>{t("journal_date", lang)}</span>
                <input style={{ ...fieldStyle, minWidth: "140px" }} type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: W.mutedLt }}>{t("journal_life_area", lang)}</span>
                <select style={{ ...fieldStyle, minWidth: "160px" }} value={lifeArea} onChange={(e) => setLifeArea(e.target.value as LifeArea)}>
                  {LIFE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {t(AREA_KEY[area], lang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {prompts.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "0.68rem", fontWeight: 700, color: W.mutedLt, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {t("journal_prompts_label", lang)}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {prompts.map((p) => (
                    <button
                      key={p.promptId}
                      type="button"
                      onClick={() => setNoteText((prev) => (prev ? `${prev}\n${p.text[lang]}` : p.text[lang]))}
                      style={{
                        padding: "7px 10px",
                        borderRadius: "8px",
                        border: "1px solid rgba(184,90,44,0.2)",
                        background: "#F9F3E8",
                        color: W.inkMid,
                        fontSize: "0.75rem",
                        textAlign: "left",
                        cursor: "pointer",
                        lineHeight: 1.45,
                        fontFamily: "inherit",
                      }}
                    >
                      {p.text[lang]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {promptsLoading && <p style={{ margin: "0 0 12px", fontSize: "0.72rem", color: W.muted }}>{t("journal_prompts_loading", lang)}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: W.mutedLt }}>{t("journal_note", lang)}</span>
              <textarea
                style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.55, fontSize: "0.85rem", minHeight: "120px" }}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder={t("journal_note_placeholder", lang)}
              />
              <span style={{ fontSize: "0.65rem", color: W.muted, textAlign: "right" }}>{noteText.length}/2000</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={saveBusy || noteText.trim().length < 3}
                onClick={() => void handleSave()}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  border: `1px solid ${W.ink}`,
                  cursor: saveBusy || noteText.trim().length < 3 ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  background: saveBusy || noteText.trim().length < 3 ? W.borderLt : W.ink,
                  color: saveBusy || noteText.trim().length < 3 ? W.mutedLt : W.surfaceMd,
                  fontFamily: "inherit",
                }}
              >
                {saveBusy ? t("btn_saving_journal", lang) : t("btn_save_journal", lang)}
              </button>

              {saveSuccess && <span style={{ fontSize: "0.75rem", color: W.sage }}>{t("journal_saved", lang)}</span>}
              {saveError && <span style={{ fontSize: "0.75rem", color: W.rust }}>{saveError}</span>}
            </div>
          </div>
        </Surface>
      )}

      {journalSubTab === "entries" && (
        <Surface title={`${t("journal_list_label", lang)}${journalTotal > 0 ? ` | ${journalTotal} ${t("journal_total_count", lang)}` : ""}`}>
          <div className="surface__body">
            {archiveSuccess && <p style={{ margin: "0 0 10px", fontSize: "0.75rem", color: W.sage }}>{t("journal_archived", lang)}</p>}

            {journalEntries.length === 0 ? (
              <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted }}>{t("journal_no_entries", lang)}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {journalEntries.map((entry) => (
                  <div key={entry.journalId} style={{ padding: "12px 14px", borderRadius: "10px", background: W.card, border: `1px solid ${W.borderLt}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: W.inkMid }}>{formatDateLabel(entry.entryDate)}</span>
                      <Chip tone="neutral">{t(AREA_KEY[entry.lifeArea as LifeArea] ?? "journal_area_general", lang)}</Chip>
                      {entry.tags.length > 0 && entry.tags.map((tag) => <Chip key={tag} tone="accent">{tag}</Chip>)}
                      <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: W.muted }}>{t("journal_anchor_dasha", lang)}: {entry.anchor.activeDasha}</span>
                    </div>

                    <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: W.inkMid, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{entry.noteText}</p>

                    <button
                      type="button"
                      disabled={archivingId === entry.journalId}
                      onClick={() => void handleArchive(entry.journalId)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "6px",
                        border: "1px solid rgba(168,72,47,0.25)",
                        background: "transparent",
                        color: W.rust,
                        fontSize: "0.68rem",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {archivingId === entry.journalId ? "..." : t("btn_archive_entry", lang)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Surface>
      )}

      {journalSubTab === "reflections" &&
        (mode === "BEGINNER" ? (
          <div style={{ padding: "24px", textAlign: "center", borderRadius: "12px", border: `1px dashed ${W.border}`, background: W.surface }}>
            <p style={{ margin: "0 0 8px", fontSize: "0.85rem", fontWeight: 700, color: W.inkMid }}>
              {lang === "ta" ? "ஆழமான சிந்தனைகள்" : "Deep Reflections"}
            </p>
            <p style={{ margin: 0, fontSize: "0.78rem", color: W.muted, lineHeight: 1.55 }}>
              {lang === "ta"
                ? "இந்த பகுதி Balanced அல்லது Traditional பயன்பாட்டில் கிடைக்கும். Settings → Preferences-ல் மாற்றவும்."
                : "Available in Balanced or Traditional mode. Change in Settings -> Preferences."}
            </p>
          </div>
        ) : (
          <DashboardShadowPrompts lang={lang} mode={mode} chartId={chartId} />
        ))}
    </div>
  );
}
