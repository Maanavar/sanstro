"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetchJson } from "@/lib/api";
import type { Lang } from "@/lib/i18n";
import { formatDateLabel, todayIso } from "@/lib/format";
import { STALE } from "@/lib/queryClient";

import { EVENT_TYPES, EVENT_ICON, eventLabel } from "./dashboard-plan-shared";
import type { LifeEventLogItem } from "./dashboard-plan-shared";
import { NovaReveal } from "./dashboard-ui-nova";
import { NovaSelect } from "./nova-select";
import { Card } from "./ui";
import { AsyncSection } from "./ui/async-section";
import { Kicker } from "./ui/kicker";

/** One key for both mount sites, so the second one is served from cache. */
function lifeEventLogKey(chartId: string) {
  return ["life-event-log", chartId] as const;
}

/**
 * Nova re-skin of `DashboardLifeEventLog` (Classic) — same API calls and
 * data shape (reuses its exported `EVENT_TYPES`/`EVENT_ICON`/`eventLabel`,
 * additively exported for this purpose), but Classic's own component reads
 * a Classic-only `W` warm-parchment token palette that the 2026-07-06
 * browser QA round found
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
    <Card compact>
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: item.correlation ? "pointer" : "default" }}
        onClick={() => item.correlation && setExpanded((v) => !v)}
      >
        {Icon && <Icon size={20} color="var(--color-accent-strong)" strokeWidth={1.5} aria-hidden="true" />}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: "var(--text-base)", color: "var(--color-text-strong)" }}>{eventLabel(item.eventType)}</p>
          <p style={{ margin: "2px 0 0", fontSize: "var(--text-base)", color: "var(--color-muted)" }}>
            {formatDateLabel(item.eventDate)}
            {item.description ? ` · ${item.description}` : ""}
            {bhukti ? ` · ${bhukti.charAt(0)}${bhukti.slice(1).toLowerCase()} ${lang === "ta" ? "புக்தி" : "bhukti"}` : ""}
          </p>
        </div>
        {item.correlation && <span style={{ fontSize: "var(--text-sm)", color: "var(--color-faint)" }}>{expanded ? "▲" : "▼"}</span>}
      </div>

      {expanded && item.correlation && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
          <Kicker as="p" color="var(--color-faint)" style={{ letterSpacing: "0.05em", margin: "0 0 4px" }}>
            {lang === "ta" ? "கிரக சூழல்" : "Planetary context"}
          </Kicker>
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", lineHeight: 1.5, margin: 0 }}>
            {lang === "ta" ? item.correlation.narrative.ta : item.correlation.narrative.en}
          </p>
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "8px", flexWrap: "wrap" }}>
            <span style={{ padding: "var(--space-1) var(--space-2)", background: "var(--color-accent-muted)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-text)" }}>
              {lang === "ta" ? "மகாதசை" : "Mahadasha"}: {item.correlation.mahaLord}
            </span>
            <span style={{ padding: "var(--space-1) var(--space-2)", background: "var(--color-accent-muted)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)", color: "var(--color-text)" }}>
              {lang === "ta" ? "அந்தர்தசை" : "Antardasha"}: {item.correlation.antarLord}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

export function NovaLifeEventLogCard({ lang, chartId }: { lang: Lang; chartId: string | null }) {
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState(todayIso());
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // F8 migrate-on-touch. The hand-rolled useState/useEffect block this replaces
  // sat outside react-query, so it refetched on every mount — and this card has
  // TWO mount sites in `dashboard-plan-tab-nova`, which is why
  // `e2e/tab-cycle-requests.spec.ts` measured it crossing the wire once per lap
  // while every other watched endpoint went once. `STALE.session` rather than
  // the `STALE.today` the six F8 panels use: those are natal-chart derivations
  // that genuinely cannot change during a session, whereas this log is authored
  // by the user and may be edited from another device.
  const { data, state, refetch } = useApiQuery<LifeEventLogItem[]>({
    key: lifeEventLogKey(chartId ?? ""),
    enabled: Boolean(chartId),
    staleTime: STALE.session,
    queryFn: async () => {
      const j = await apiFetchJson<{ success: boolean; data: LifeEventLogItem[] }>(
        `/api/v1/charts/${chartId}/life-event-log`,
      );
      return j?.data ?? [];
    },
  });
  const items = data ?? [];

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
      // Write the new row into the shared cache rather than into local state, so
      // the card's other mount site shows it too instead of holding a stale list.
      if (j?.data) {
        queryClient.setQueryData<LifeEventLogItem[]>(lifeEventLogKey(chartId), (prev) => [j.data, ...(prev ?? [])]);
      }
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
    <Card>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <Kicker>
          {lang === "ta" ? "வாழ்க்கை நிகழ்வு பதிவு" : "Life event log"}
        </Kicker>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          style={{
            fontSize: "var(--text-sm)", fontWeight: 700, color: showForm ? "var(--color-on-accent)" : "var(--color-accent-strong)",
            background: showForm ? "var(--color-accent)" : "transparent",
            border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-sm)", padding: "var(--space-2) var(--space-4)", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {showForm ? (lang === "ta" ? "மூடு" : "Close") : lang === "ta" ? "+ நிகழ்வை பதிவுசெய்" : "+ Log event"}
        </button>
      </div>

      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-muted)", lineHeight: 1.5 }}>
        {lang === "ta"
          ? "பதிவுசெய்யப்பட்ட நிகழ்வுகள் கடந்த தசை காலங்கள் எப்படி நடந்தன என்பதை சரிபார்க்க உதவும்."
          : "Logged events help Vinaadi verify how past dasa periods actually played out for you."}
      </p>

      {showForm && (
        <Card variant="accent" compact style={{ gap: "var(--space-3)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
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
              <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
                {lang === "ta" ? "தேதி" : "Date"}
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{ width: "100%", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "var(--text-base)", fontFamily: "inherit" }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-faint)", display: "block", marginBottom: "4px" }}>
              {lang === "ta" ? "குறிப்பு (விருப்பம்)" : "Notes (optional)"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder={lang === "ta" ? "சுருக்கமான குறிப்பு..." : "Brief note..."}
              style={{ width: "100%", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)", fontSize: "var(--text-base)", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={!eventType || !eventDate || submitting}
              onClick={handleSubmit}
              style={{
                padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-accent)",
                background: !eventType || !eventDate || submitting ? "var(--color-border)" : "var(--color-accent)",
                color: !eventType || !eventDate || submitting ? "var(--color-faint)" : "var(--color-on-accent)",
                fontWeight: 700, fontSize: "var(--text-base)", cursor: !eventType || !eventDate || submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}
            >
              {submitting ? (lang === "ta" ? "சேமிக்கிறோம்..." : "Saving...") : lang === "ta" ? "சேமி" : "Save"}
            </button>
            {saveError && <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-score-low)" }}>{saveError}</p>}
          </div>
        </Card>
      )}

      {/* A failed load used to fall into the empty state below, telling the user
          "No events logged yet" when the request had actually errored — the one
          reading of this card that must never be wrong, since it invites them to
          re-enter history they already recorded. */}
      <AsyncSection
        state={state}
        lang={lang}
        error={{ ta: "நிகழ்வு பதிவை ஏற்ற முடியவில்லை.", en: "Could not load your event log." }}
        onRetry={refetch}
      >
        {items.length === 0 && !showForm && (
          <p style={{ fontSize: "var(--text-base)", color: "var(--color-muted)", textAlign: "center", padding: "var(--space-4) 0", margin: 0 }}>
            {lang === "ta" ? "இன்னும் நிகழ்வுகள் பதிவு இல்லை. + நிகழ்வை பதிவுசெய் என்பதை அழுத்துங்கள்." : "No events logged yet. Tap + Log event to add your first."}
          </p>
        )}

        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-3)" }}>
            {items.map((item, i) => (
              <NovaReveal key={item.id} delay={Math.min(i * 0.05, 0.25)}>
                <NovaEventCard item={item} lang={lang} />
              </NovaReveal>
            ))}
          </div>
        )}
      </AsyncSection>
    </Card>
  );
}
