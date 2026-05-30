"use client";

import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { formatDateLabel, todayIso } from "@/lib/format";
import { Surface } from "./dashboard-ui";

interface BiText {
  ta: string;
  en: string;
}

interface EventCorrelation {
  mahaLord: string;
  antarLord: string;
  moonRasi: string;
  narrative: BiText;
}

interface LifeEventLogItem {
  id: string;
  chartId: string;
  eventType: string;
  eventDate: string;
  description?: string | null;
  correlation?: EventCorrelation | null;
}

const EVENT_TYPES = [
  { id: "JOB_CHANGE", en: "Job change" },
  { id: "PROMOTION", en: "Promotion" },
  { id: "DEMOTION", en: "Demotion" },
  { id: "JOB_LOSS", en: "Job loss" },
  { id: "RELATIONSHIP_START", en: "Relationship start" },
  { id: "RELATIONSHIP_END", en: "Relationship end" },
  { id: "MARRIAGE", en: "Marriage" },
  { id: "DIVORCE", en: "Divorce" },
  { id: "REMARRIAGE", en: "Remarriage" },
  { id: "RELOCATION", en: "Relocation" },
  { id: "TRAVEL_ABROAD", en: "Travel abroad" },
  { id: "HEALTH_EVENT", en: "Health event" },
  { id: "SURGERY", en: "Surgery" },
  { id: "RECOVERY", en: "Recovery" },
  { id: "EXAM_RESULT", en: "Exam result" },
  { id: "EDUCATION_START", en: "Education start" },
  { id: "EDUCATION_END", en: "Education end" },
  { id: "FINANCIAL_MILESTONE", en: "Financial milestone" },
  { id: "INVESTMENT", en: "Investment" },
  { id: "PROPERTY_PURCHASE", en: "Property purchase" },
  { id: "DEBT", en: "Debt" },
  { id: "FAMILY_LOSS", en: "Family loss" },
  { id: "BIRTH_OF_CHILD", en: "Birth of child" },
  { id: "BUSINESS_START", en: "Business start" },
  { id: "BUSINESS_END", en: "Business end" },
  { id: "SPIRITUAL_EVENT", en: "Spiritual event" },
  { id: "PILGRIMAGE", en: "Pilgrimage" },
  { id: "INITIATION", en: "Initiation" },
  { id: "LEGAL_MATTER", en: "Legal matter" },
  { id: "OTHER", en: "Other" },
];

const EVENT_ICON: Record<string, string> = {
  JOB_CHANGE: "??",
  PROMOTION: "??",
  DEMOTION: "??",
  JOB_LOSS: "??",
  RELATIONSHIP_START: "??",
  RELATIONSHIP_END: "??",
  MARRIAGE: "??",
  DIVORCE: "??",
  REMARRIAGE: "??",
  RELOCATION: "??",
  TRAVEL_ABROAD: "??",
  HEALTH_EVENT: "??",
  SURGERY: "??",
  RECOVERY: "??",
  EXAM_RESULT: "??",
  EDUCATION_START: "??",
  EDUCATION_END: "??",
  FINANCIAL_MILESTONE: "??",
  INVESTMENT: "??",
  PROPERTY_PURCHASE: "??",
  DEBT: "??",
  FAMILY_LOSS: "???",
  BIRTH_OF_CHILD: "??",
  BUSINESS_START: "??",
  BUSINESS_END: "??",
  SPIRITUAL_EVENT: "??",
  PILGRIMAGE: "??",
  INITIATION: "??",
  LEGAL_MATTER: "????",
  OTHER: "?",
};

const W = {
  ink: "#1A1612",
  inkMid: "#3D352B",
  muted: "#7A6F5E",
  mutedLt: "var(--color-faint)",
  border: "#D4C8AE",
  borderLt: "#E4DBC8",
  surface: "#FAF5EA",
  surfaceMd: "#F4EEE2",
  card: "#FFFFFF",
  rust: "#A8482F",
} as const;

function eventLabel(type: string): string {
  return EVENT_TYPES.find((e) => e.id === type)?.en ?? type;
}

interface DashboardLifeEventLogProps {
  lang: Lang;
  chartId: string | null;
  onError?: (msg: string) => void;
}

function EventCard({ item, lang }: { item: LifeEventLogItem; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ border: `1px solid ${W.borderLt}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "10px", background: W.card }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: item.correlation ? "pointer" : "default" }} onClick={() => item.correlation && setExpanded((v) => !v)}>
        <span style={{ fontSize: "1.25rem" }}>{EVENT_ICON[item.eventType] ?? "?"}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: W.inkMid }}>{eventLabel(item.eventType)}</p>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.875rem", color: W.muted }}>{formatDateLabel(item.eventDate)}</p>
          {item.description && <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: W.muted }}>{item.description}</p>}
        </div>
        {item.correlation && <span style={{ fontSize: "0.75rem", color: W.muted }}>{expanded ? "?" : "?"}</span>}
      </div>

      {expanded && item.correlation && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${W.borderLt}` }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, marginBottom: "4px" }}>
            {lang === "ta" ? "???? ?????" : "Planetary context"}
          </p>
          <p style={{ fontSize: "0.875rem", color: W.muted, lineHeight: 1.5 }}>{lang === "ta" ? item.correlation.narrative.ta : item.correlation.narrative.en}</p>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", background: W.surfaceMd, borderRadius: "10px", fontSize: "11px", color: W.inkMid }}>
              {lang === "ta" ? "??????" : "Mahadasha"}: {item.correlation.mahaLord}
            </span>
            <span style={{ padding: "2px 8px", background: W.surfaceMd, borderRadius: "10px", fontSize: "11px", color: W.inkMid }}>
              {lang === "ta" ? "?????????" : "Antardasha"}: {item.correlation.antarLord}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardLifeEventLog({ lang, chartId, onError }: DashboardLifeEventLogProps) {
  const [items, setItems] = useState<LifeEventLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!chartId) return;
    setLoading(true);
    setLoadError(null);
    apiFetchJson<{ success: boolean; data: LifeEventLogItem[] }>(`/api/v1/charts/${chartId}/life-event-log`)
      .then((j) => {
        setItems(j?.data ?? []);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "Failed to load events";
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, [chartId]);

  async function handleSubmit() {
    if (!chartId || !eventType || !eventDate) return;
    setSubmitting(true);
    setSaveError(null);
    try {
      const j = await apiFetchJson<{ success: boolean; data: LifeEventLogItem }>(`/api/v1/charts/${chartId}/life-event-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, eventDate, description: description || null }),
      });
      if (j?.data) {
        setItems((prev) => [j.data, ...prev]);
      }
      setShowForm(false);
      setEventType("");
      setDescription("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : lang === "ta" ? "??????? ???????????. ???????? ????????." : "Could not save. Please try again.";
      setSaveError(msg);
      if (onError) onError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!chartId) return null;

  return (
    <Surface title={lang === "ta" ? "???????? ??????????" : "Life Event Log"}>
      <div className="surface__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            {lang === "ta" ? "???????? ??????????" : "Life Event Log"}
          </p>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            style={{
              padding: "5px 14px",
              borderRadius: "10px",
              border: `1px solid ${showForm ? W.ink : W.border}`,
              background: showForm ? W.ink : "transparent",
              color: showForm ? W.surfaceMd : W.inkMid,
              fontSize: "0.875rem",
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            {showForm ? (lang === "ta" ? "????" : "Close") : lang === "ta" ? "+ ??????? ????" : "+ Log event"}
          </button>
        </div>

        {loadError && (
          <p style={{ fontSize: "0.875rem", color: W.rust, margin: "0 0 12px" }}>
            {lang === "ta" ? "?????????? ???? ???????????." : "Could not load events."} {loadError}
          </p>
        )}

        {showForm && (
          <div style={{ border: `1px solid ${W.borderLt}`, borderRadius: "10px", padding: "14px", marginBottom: "14px", background: W.surface }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
              <div style={{ flex: "1 1 180px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
                  {lang === "ta" ? "??????? ???" : "Event type"}
                </label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "10px", border: `1.5px solid ${W.borderLt}`, background: W.card, color: W.inkMid, fontSize: "0.875rem", fontFamily: "inherit" }}>
                  <option value="">{lang === "ta" ? "� ?????? �" : "� Select �"}</option>
                  {EVENT_TYPES.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.en}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
                  {lang === "ta" ? "??????? ????" : "Date"}
                </label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "10px", border: `1.5px solid ${W.borderLt}`, background: W.card, color: W.inkMid, fontSize: "0.875rem", fontFamily: "inherit" }} />
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
                {lang === "ta" ? "???????? (????????????)" : "Notes (optional)"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={lang === "ta" ? "?????????? ????????�" : "Brief note..."}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "10px", border: `1.5px solid ${W.borderLt}`, background: W.card, color: W.inkMid, fontSize: "0.875rem", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={!eventType || !eventDate || submitting}
                onClick={handleSubmit}
                style={{
                  padding: "8px 20px",
                  borderRadius: "10px",
                  border: `1px solid ${W.ink}`,
                  background: !eventType || !eventDate || submitting ? W.borderLt : W.ink,
                  color: !eventType || !eventDate || submitting ? W.mutedLt : W.surfaceMd,
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: !eventType || !eventDate || submitting ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {submitting ? (lang === "ta" ? "???????????�" : "Saving...") : lang === "ta" ? "????" : "Save"}
              </button>
              {saveError && <p style={{ margin: 0, fontSize: "0.75rem", color: W.rust }}>{saveError}</p>}
            </div>
          </div>
        )}

        {loading && <p style={{ fontSize: "0.875rem", color: W.muted, textAlign: "center", padding: "16px 0" }}>{lang === "ta" ? "??????????�" : "Loading..."}</p>}

        {!loading && items.length === 0 && !showForm && (
          <p style={{ fontSize: "0.875rem", color: W.muted, textAlign: "center", padding: "16px 0" }}>
            {lang === "ta" ? "??????? ??????? ?????????????. + ??????? ???? ??????????." : "No events logged yet. Tap + Log event to add your first."}
          </p>
        )}

        {items.map((item) => (
          <EventCard key={item.id} item={item} lang={lang} />
        ))}
      </div>
    </Surface>
  );
}
