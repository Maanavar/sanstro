"use client";

import { useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { ApiEnvelope, LifeEventWindow, LifeEventsResponseData, ConfidenceTier, LifeEventType } from "@/lib/types";
import { ConfidenceBadge } from "./dashboard-ui";

interface DashboardLifeEventsProps {
  lang: Lang;
  chartId: string | null;
  yearsAhead?: number;
}

const EVENT_TYPE_ICON: Record<LifeEventType, string> = {
  CAREER:         "💼",
  MARRIAGE:       "💍",
  STUDIES:        "🎓",
  RELOCATION:     "🏠",
  HEALTH_CAUTION: "🌿",
};

const CONFIDENCE_COLOR: Record<ConfidenceTier, string> = {
  HIGH:   "life-event-confidence-high",
  MEDIUM: "life-event-confidence-medium",
  LOW:    "life-event-confidence-low",
};

function formatDateRange(start: string, end: string, lang: Lang): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const locale = lang === "ta" ? "ta-IN" : "en-IN";
  return `${s.toLocaleDateString(locale, opts)} – ${e.toLocaleDateString(locale, opts)}`;
}

function LifeEventCard({ window: w, lang }: { window: LifeEventWindow; lang: Lang }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`life-event-card life-event-${w.eventType.toLowerCase()}`}>
      <div className="life-event-card-header" onClick={() => setExpanded(v => !v)}>
        <span className="life-event-icon">{EVENT_TYPE_ICON[w.eventType]}</span>
        <div className="life-event-meta">
          <p className="life-event-headline">
            {lang === "ta" ? w.headline.ta : w.headline.en}
          </p>
          <p className="life-event-date-range">
            {formatDateRange(w.startDate, w.endDate, lang)}
          </p>
        </div>
        <ConfidenceBadge
          level={w.confidence}
          reason={w.headline}
          lang={lang}
        />
        <span className="life-event-expand-toggle">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="life-event-card-body">
          <div className="life-event-support">
            <p className="life-event-support-label">
              {lang === "ta" ? "தசை ஆதரவு" : "Dasha support"}:&nbsp;
              <span>{lang === "ta" ? w.dashaSupport.ta : w.dashaSupport.en}</span>
            </p>
            <p className="life-event-support-label">
              {lang === "ta" ? "கோசார ஆதரவு" : "Transit support"}:&nbsp;
              <span>{lang === "ta" ? w.gocharSupport.ta : w.gocharSupport.en}</span>
            </p>
          </div>
          <ul className="life-event-reasons">
            {w.reasons.map((r, i) => (
              <li key={i}>{lang === "ta" ? r.ta : r.en}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DashboardLifeEvents({ lang, chartId, yearsAhead = 5 }: DashboardLifeEventsProps) {
  const [data, setData] = useState<LifeEventsResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartId) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      asOf: new Date().toISOString().split("T")[0],
      yearsAhead: String(yearsAhead),
    });

    apiFetchJson<ApiEnvelope<LifeEventsResponseData>>(`/api/v1/charts/${chartId}/life-events?${params}`)
      .then((body) => setData(body.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [chartId, yearsAhead]);

  if (!chartId) return null;

  if (loading) {
    return (
      <div className="life-events-loading">
        <span className="spinner" />
        <span>{lang === "ta" ? "வாழ்க்கை நிகழ்வுகள் கணக்கிடப்படுகின்றன..." : "Calculating life event windows..."}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="life-events-error">
        {lang === "ta" ? "வாழ்க்கை நிகழ்வுகளை ஏற்ற முடியவில்லை." : "Could not load life event windows."}
      </div>
    );
  }

  if (!data || data.windows.length === 0) {
    return (
      <div className="life-events-empty">
        {lang === "ta"
          ? "இந்த காலகட்டத்தில் குறிப்பிட்ட நிகழ்வு ஜன்னல்கள் இல்லை."
          : "No significant event windows found for this period."}
      </div>
    );
  }

  const highWindows = data.windows.filter(w => w.confidence === "HIGH");
  const otherWindows = data.windows.filter(w => w.confidence !== "HIGH");

  return (
    <div className="life-events-container">
      <div className="life-events-header">
        <h3 className="life-events-title">
          {lang === "ta" ? "வாழ்க்கை நிகழ்வு ஜன்னல்கள்" : "Life Event Windows"}
        </h3>
        <p className="life-events-subtitle">
          {lang === "ta"
            ? `அடுத்த ${data.yearsAhead} ஆண்டுகளுக்கான முன்னோட்டம்`
            : `${data.yearsAhead}-year forward view`}
        </p>
      </div>

      {highWindows.length > 0 && (
        <div className="life-events-section">
          <p className="life-events-section-label">
            {lang === "ta" ? "அதிக நம்பகத்தன்மை" : "High confidence"}
          </p>
          {highWindows.map((w, i) => (
            <LifeEventCard key={i} window={w} lang={lang} />
          ))}
        </div>
      )}

      {otherWindows.length > 0 && (
        <div className="life-events-section">
          <p className="life-events-section-label">
            {lang === "ta" ? "நடுத்தர / குறைந்த நம்பகத்தன்மை" : "Medium / Low confidence"}
          </p>
          {otherWindows.map((w, i) => (
            <LifeEventCard key={i} window={w} lang={lang} />
          ))}
        </div>
      )}

      <p className="life-events-disclaimer">
        {lang === "ta"
          ? "இந்த ஜன்னல்கள் தசை, அந்தர தசை மற்றும் கோசார ஆதரவின் அடிப்படையில் கணக்கிடப்படுகின்றன."
          : "Windows are calculated from dasha, antardasha, and transit support signals."}
      </p>
    </div>
  );
}
