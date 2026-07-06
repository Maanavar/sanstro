"use client";

import { useEffect, useState } from "react";

import {
  Briefcase, TrendingUp, TrendingDown, Heart, HeartCrack, Scale, Home, Plane,
  HeartPulse, Scissors, Dumbbell, FileText, GraduationCap, Coins, CreditCard,
  Flame, Baby, Rocket, XCircle, Star, MapPin, Bell, Pin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { formatDateLabel, todayIso } from "@/lib/format";
import { Surface } from "./dashboard-ui";

interface BiText {
  ta: string;
  en: string;
}

export interface EventCorrelation {
  mahaLord: string;
  antarLord: string;
  moonRasi: string;
  narrative: BiText;
}

export interface LifeEventLogItem {
  id: string;
  chartId: string;
  eventType: string;
  eventDate: string;
  description?: string | null;
  correlation?: EventCorrelation | null;
}

export const EVENT_TYPES = [
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

export const EVENT_ICON: Record<string, LucideIcon> = {
  JOB_CHANGE:          Briefcase,
  PROMOTION:           TrendingUp,
  DEMOTION:            TrendingDown,
  JOB_LOSS:            TrendingDown,
  RELATIONSHIP_START:  Heart,
  RELATIONSHIP_END:    HeartCrack,
  MARRIAGE:            Heart,
  DIVORCE:             Scale,
  REMARRIAGE:          Heart,
  RELOCATION:          Home,
  TRAVEL_ABROAD:       Plane,
  HEALTH_EVENT:        HeartPulse,
  SURGERY:             Scissors,
  RECOVERY:            Dumbbell,
  EXAM_RESULT:         FileText,
  EDUCATION_START:     GraduationCap,
  EDUCATION_END:       GraduationCap,
  FINANCIAL_MILESTONE: Coins,
  INVESTMENT:          TrendingUp,
  PROPERTY_PURCHASE:   Home,
  DEBT:                CreditCard,
  FAMILY_LOSS:         Flame,
  BIRTH_OF_CHILD:      Baby,
  BUSINESS_START:      Rocket,
  BUSINESS_END:        XCircle,
  SPIRITUAL_EVENT:     Star,
  PILGRIMAGE:          MapPin,
  INITIATION:          Bell,
  LEGAL_MATTER:        Scale,
  OTHER:               Pin,
};

const W = {
  ink: "var(--panel-earth-dark)",
  inkMid: "var(--panel-earth)",
  muted: "var(--color-faint)",
  mutedLt: "var(--color-faint)",
  border: "var(--panel-tan)",
  borderLt: "var(--panel-tan-light)",
  surface: "var(--panel-cream)",
  surfaceMd: "var(--panel-hover)",
  card: "var(--chart-cell-default)",
  rust: "var(--planet-saturn)",
} as const;

export function eventLabel(type: string): string {
  return EVENT_TYPES.find((e) => e.id === type)?.en ?? type;
}

interface DashboardLifeEventLogProps {
  lang: Lang;
  chartId: string | null;
  onError?: (msg: string) => void;
}

function EventCard({ item, lang }: { item: LifeEventLogItem; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const EvtIcon = EVENT_ICON[item.eventType] ?? Pin;

  return (
    <div style={{ border: `1px solid ${W.borderLt}`, borderRadius: "10px", padding: "12px 14px", marginBottom: "10px", background: W.card }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: item.correlation ? "pointer" : "default" }} onClick={() => item.correlation && setExpanded((v) => !v)}>
        <EvtIcon size={20} color={W.inkMid} strokeWidth={1.5} aria-hidden="true" />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: W.inkMid }}>{eventLabel(item.eventType)}</p>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.875rem", color: W.muted }}>{formatDateLabel(item.eventDate)}</p>
          {item.description && <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: W.muted }}>{item.description}</p>}
        </div>
        {item.correlation && <span style={{ fontSize: "0.75rem", color: W.muted }}>{expanded ? "▲" : "▼"}</span>}
      </div>

      {expanded && item.correlation && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${W.borderLt}` }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, marginBottom: "4px" }}>
            {lang === "ta" ? "கிரக சூழல்" : "Planetary context"}
          </p>
          <p style={{ fontSize: "0.875rem", color: W.muted, lineHeight: 1.5 }}>{lang === "ta" ? item.correlation.narrative.ta : item.correlation.narrative.en}</p>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", background: W.surfaceMd, borderRadius: "10px", fontSize: "11px", color: W.inkMid }}>
              {lang === "ta" ? "மகாதசை" : "Mahadasha"}: {item.correlation.mahaLord}
            </span>
            <span style={{ padding: "2px 8px", background: W.surfaceMd, borderRadius: "10px", fontSize: "11px", color: W.inkMid }}>
              {lang === "ta" ? "அந்தர்தசை" : "Antardasha"}: {item.correlation.antarLord}
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
      const msg = e instanceof Error ? e.message : lang === "ta" ? "சேமிக்க முடியவில்லை. மீண்டும் முயலுங்கள்." : "Could not save. Please try again.";
      setSaveError(msg);
      if (onError) onError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!chartId) return null;

  return (
    <Surface title={lang === "ta" ? "வாழ்க்கை நிகழ்வு பதிவு" : "Life Event Log"}>
      <div className="surface__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: W.mutedLt, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            {lang === "ta" ? "வாழ்க்கை நிகழ்வு பதிவு" : "Life Event Log"}
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
            {showForm ? (lang === "ta" ? "மூடு" : "Close") : lang === "ta" ? "+ நிகழ்வை பதிவுசெய்" : "+ Log event"}
          </button>
        </div>

        {loadError && (
          <p style={{ fontSize: "0.875rem", color: W.rust, margin: "0 0 12px" }}>
            {lang === "ta" ? "நிகழ்வுகளை ஏற்ற முடியவில்லை." : "Could not load events."} {loadError}
          </p>
        )}

        {showForm && (
          <div style={{ border: `1px solid ${W.borderLt}`, borderRadius: "10px", padding: "14px", marginBottom: "14px", background: W.surface }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
              <div style={{ flex: "1 1 180px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
                  {lang === "ta" ? "நிகழ்வு வகை" : "Event type"}
                </label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "10px", border: `1.5px solid ${W.borderLt}`, background: W.card, color: W.inkMid, fontSize: "0.875rem", fontFamily: "inherit" }}>
                  <option value="">{lang === "ta" ? "— தேர்ந்தெடு —" : "— Select —"}</option>
                  {EVENT_TYPES.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.en}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 130px" }}>
                <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
                  {lang === "ta" ? "தேதி" : "Date"}
                </label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: "10px", border: `1.5px solid ${W.borderLt}`, background: W.card, color: W.inkMid, fontSize: "0.875rem", fontFamily: "inherit" }} />
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: W.mutedLt, display: "block", marginBottom: "4px" }}>
                {lang === "ta" ? "குறிப்பு (விருப்பம்)" : "Notes (optional)"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder={lang === "ta" ? "சுருக்கமான குறிப்பு..." : "Brief note..."}
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
                {submitting ? (lang === "ta" ? "சேமிக்கிறோம்..." : "Saving...") : lang === "ta" ? "சேமி" : "Save"}
              </button>
              {saveError && <p style={{ margin: 0, fontSize: "0.75rem", color: W.rust }}>{saveError}</p>}
            </div>
          </div>
        )}

        {loading && <p style={{ fontSize: "0.875rem", color: W.muted, textAlign: "center", padding: "16px 0" }}>{lang === "ta" ? "ஏற்றுகிறோம்..." : "Loading..."}</p>}

        {!loading && items.length === 0 && !showForm && (
          <p style={{ fontSize: "0.875rem", color: W.muted, textAlign: "center", padding: "16px 0" }}>
            {lang === "ta" ? "இன்னும் நிகழ்வுகள் பதிவு இல்லை. + நிகழ்வை பதிவுசெய் என்பதை அழுத்துங்கள்." : "No events logged yet. Tap + Log event to add your first."}
          </p>
        )}

        {items.map((item) => (
          <EventCard key={item.id} item={item} lang={lang} />
        ))}
      </div>
    </Surface>
  );
}
