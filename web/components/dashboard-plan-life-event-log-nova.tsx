"use client";

import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { formatDateLabel, todayIso } from "@/lib/format";

import { EVENT_TYPES, EVENT_ICON, eventLabel } from "./dashboard-life-event-log";
import type { LifeEventLogItem } from "./dashboard-life-event-log";
import { novaDetailCardStyle } from "./dashboard-explore-detail-nova";
import { NovaSelect } from "./nova-select";

/**
 * Nova re-skin of `DashboardLifeEventLog` (Classic) — same API calls and
 * data shape (reuses its exported `EVENT_TYPES`/`EVENT_ICON`/`eventLabel`,
 * additively exported for this purpose), but Classic's own component reads
 * a Classic-only `W` token palette (`--panel-earth-dark`, `--panel-hover`,
 * `--chart-cell-default`, etc.) that the 2026-07-06 browser QA round found
 * unsafe to redirect at shared `.cd-shell` scope (conflicting roles across
 * 50+ components) — so this is rebuilt fresh with Nova tokens instead of
 * gap-fixed, same class of decision as Phase 2/3's cal-panch/cal-monthly
 * sub-widgets.
 */

function NovaEventCard({ item, lang }: { item: LifeEventLogItem; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = EVENT_ICON[item.eventType];
  const bhukti = item.correlation?.antarLord;

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "10px", padding: "12px 14px", background: "var(--color-surface)" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: item.correlation ? "pointer" : "default" }}
        onClick={() => item.correlation && setExpanded((v) => !v)}
      >
        {Icon && <Icon size={20} color="var(--color-accent-strong)" strokeWidth={1.5} aria-hidden="true" />}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-strong)" }}>{eventLabel(item.eventType)}</p>
          <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--color-muted)" }}>
            {formatDateLabel(item.eventDate)}
            {item.description ? ` · ${item.description}` : ""}
            {bhukti ? ` · ${bhukti.charAt(0)}${bhukti.slice(1).toLowerCase()} ${lang === "ta" ? "புக்தி" : "bhukti"}` : ""}
          </p>
        </div>
        {item.correlation && <span style={{ fontSize: "0.75rem", color: "var(--color-faint)" }}>{expanded ? "▲" : "▼"}</span>}
      </div>

      {expanded && item.correlation && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", margin: "0 0 4px" }}>
            {lang === "ta" ? "கிரக சூழல்" : "Planetary context"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-muted)", lineHeight: 1.5, margin: 0 }}>
            {lang === "ta" ? item.correlation.narrative.ta : item.correlation.narrative.en}
          </p>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", background: "var(--color-accent-muted)", borderRadius: "10px", fontSize: "11px", color: "var(--color-text)" }}>
              {lang === "ta" ? "மகாதசை" : "Mahadasha"}: {item.correlation.mahaLord}
            </span>
            <span style={{ padding: "2px 8px", background: "var(--color-accent-muted)", borderRadius: "10px", fontSize: "11px", color: "var(--color-text)" }}>
              {lang === "ta" ? "அந்தர்தசை" : "Antardasha"}: {item.correlation.antarLord}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function NovaLifeEventLogCard({ lang, chartId }: { lang: Lang; chartId: string | null }) {
  const [items, setItems] = useState<LifeEventLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartId) return;
    setLoading(true);
    apiFetchJson<{ success: boolean; data: LifeEventLogItem[] }>(`/api/v1/charts/${chartId}/life-event-log`)
      .then((j) => setItems(j?.data ?? []))
      .catch(() => setItems([]))
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
      if (j?.data) setItems((prev) => [j.data, ...prev]);
      setShowForm(false);
      setEventType("");
      setDescription("");
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : lang === "ta" ? "சேமிக்க முடியவில்லை." : "Could not save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!chartId) return null;

  return (
    <div style={novaDetailCardStyle}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
          {lang === "ta" ? "வாழ்க்கை நிகழ்வு பதிவு" : "Life event log"}
        </span>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{
            fontSize: "12px", fontWeight: 700, color: showForm ? "var(--color-on-accent)" : "var(--color-accent-strong)",
            background: showForm ? "var(--color-accent)" : "transparent",
            border: "1px solid var(--color-border-strong)", borderRadius: "9px", padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {showForm ? (lang === "ta" ? "மூடு" : "Close") : lang === "ta" ? "+ நிகழ்வை பதிவுசெய்" : "+ Log event"}
        </button>
      </div>

      <p style={{ margin: 0, fontSize: "12px", color: "var(--color-muted)", lineHeight: 1.5 }}>
        {lang === "ta"
          ? "பதிவுசெய்யப்பட்ட நிகழ்வுகள் கடந்த தசை காலங்கள் எப்படி நடந்தன என்பதை சரிபார்க்க உதவும்."
          : "Logged events help Vinaadi verify how past dasa periods actually played out for you."}
      </p>

      {showForm && (
        <div style={{ border: "1px solid var(--color-border)", borderRadius: "10px", padding: "14px", background: "var(--color-accent-muted)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
                {lang === "ta" ? "நிகழ்வு வகை" : "Event type"}
              </label>
              <NovaSelect
                value={eventType}
                onChange={setEventType}
                placeholder={lang === "ta" ? "— தேர்ந்தெடு —" : "— Select —"}
                ariaLabel={lang === "ta" ? "நிகழ்வு வகை" : "Event type"}
                options={EVENT_TYPES.map((e) => ({ value: e.id, label: e.en }))}
              />
            </div>
            <div style={{ flex: "1 1 130px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
                {lang === "ta" ? "தேதி" : "Date"}
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: "9px", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", fontFamily: "inherit" }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
              {lang === "ta" ? "குறிப்பு (விருப்பம்)" : "Notes (optional)"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={lang === "ta" ? "சுருக்கமான குறிப்பு..." : "Brief note..."}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "9px", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "0.875rem", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={!eventType || !eventDate || submitting}
              onClick={handleSubmit}
              style={{
                padding: "8px 20px", borderRadius: "9px", border: "1px solid var(--color-accent)",
                background: !eventType || !eventDate || submitting ? "var(--color-border)" : "var(--color-accent)",
                color: !eventType || !eventDate || submitting ? "var(--color-faint)" : "var(--color-on-accent)",
                fontWeight: 700, fontSize: "0.875rem", cursor: !eventType || !eventDate || submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}
            >
              {submitting ? (lang === "ta" ? "சேமிக்கிறோம்..." : "Saving...") : lang === "ta" ? "சேமி" : "Save"}
            </button>
            {saveError && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-score-low)" }}>{saveError}</p>}
          </div>
        </div>
      )}

      {loading && <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", textAlign: "center", padding: "16px 0", margin: 0 }}>{lang === "ta" ? "ஏற்றுகிறோம்..." : "Loading..."}</p>}

      {!loading && items.length === 0 && !showForm && (
        <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", textAlign: "center", padding: "16px 0", margin: 0 }}>
          {lang === "ta" ? "இன்னும் நிகழ்வுகள் பதிவு இல்லை. + நிகழ்வை பதிவுசெய் என்பதை அழுத்துங்கள்." : "No events logged yet. Tap + Log event to add your first."}
        </p>
      )}

      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px" }}>
          {items.map((item) => (
            <NovaEventCard key={item.id} item={item} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
