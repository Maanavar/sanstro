"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Cake,
  Check,
  CheckCheck,
  CircleAlert,
  Inbox,
  Orbit,
  Route,
  SlidersHorizontal,
  Sparkles,
  Sunrise,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import type { NotificationInboxItem, NotificationInboxResponse } from "@/lib/types";
import { useSession } from "@/hooks/useSession";
import type { Lang } from "@/lib/i18n";

/**
 * The full notification inbox — the destination behind the dashboard bell's
 * "Open full inbox" link.
 *
 * Design notes:
 *  - Reached from the signed-in dashboard, so it carries a context bar (back to
 *    dashboard + notification settings) rather than the marketing nav's
 *    sign-up CTA. Arriving here used to leave you on a bare page with one text
 *    link back and no route to the preferences that produce these messages.
 *  - The bell popover shows the default page of 30. "Full" has to mean more
 *    than the popover already showed, so this asks for the endpoint's maximum.
 *  - Bilingual: `useSession()` already resolves the account language, so a
 *    Tamil account no longer lands on an English-only page. Active language
 *    only — never both at once.
 */

const INBOX_LIMIT = 100;

type Filter = "all" | "unread";

type Tone = "cycle" | "day" | "neutral";

type TypeMeta = { icon: LucideIcon; tone: Tone; en: string; ta: string };

/** The six types `notification_dispatch_service.NotificationType` can emit.
 *  Anything else falls back to the humanised enum + a neutral bell, so a new
 *  backend type renders sensibly before this map catches up. */
const TYPE_META: Record<string, TypeMeta> = {
  MORNING_NALLA_NERAM: { icon: Sunrise, tone: "day", en: "Morning timing", ta: "காலை நேரம்" },
  DASHA_TRANSITION: { icon: Orbit, tone: "cycle", en: "Dasa change", ta: "தசை மாற்றம்" },
  PEYARCHI: { icon: Route, tone: "cycle", en: "Peyarchi", ta: "பெயர்ச்சி" },
  PIRANTHA_NAAL: { icon: Cake, tone: "day", en: "Pirantha Naal", ta: "பிறந்த நாள்" },
  JADHAGAM_D1_NUDGE: { icon: Sparkles, tone: "neutral", en: "Chart nudge", ta: "ஜாதக நினைவூட்டல்" },
  GENERAL: { icon: Bell, tone: "neutral", en: "Update", ta: "தகவல்" },
};

function typeLabel(type: string) {
  return type.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function metaFor(type: string, lang: Lang): { icon: LucideIcon; tone: Tone; label: string } {
  const known = TYPE_META[type];
  if (known) return { icon: known.icon, tone: known.tone, label: lang === "ta" ? known.ta : known.en };
  return { icon: Bell, tone: "neutral", label: typeLabel(type) };
}

const COPY = {
  back: { en: "Back to dashboard", ta: "டாஷ்போர்டுக்குத் திரும்பு" },
  settings: { en: "Notification settings", ta: "அறிவிப்பு அமைப்புகள்" },
  title: { en: "Inbox", ta: "அறிவிப்பு பெட்டி" },
  lead: {
    en: "Everything Vinaadi has sent you — morning timing, dasa changes, peyarchi and birthday reminders — kept in one place.",
    ta: "விநாடி உங்களுக்கு அனுப்பிய அனைத்தும் — காலை நேரம், தசை மாற்றம், பெயர்ச்சி, பிறந்த நாள் நினைவூட்டல்கள் — ஒரே இடத்தில்.",
  },
  filterGroup: { en: "Filter notifications", ta: "அறிவிப்புகளை வடிகட்டு" },
  all: { en: "All", ta: "அனைத்தும்" },
  unread: { en: "Unread", ta: "படிக்காதவை" },
  markAll: { en: "Mark all read", ta: "அனைத்தும் படித்தது" },
  marking: { en: "Updating…", ta: "புதுப்பிக்கிறது…" },
  caughtUp: { en: "All caught up", ta: "அனைத்தும் படித்தாகிவிட்டது" },
  markOne: { en: "Mark read", ta: "படித்தது" },
  markOneLabel: { en: "Mark read", ta: "படித்தது" },
  isNew: { en: "New", ta: "புதியது" },
  loading: { en: "Loading your notifications…", ta: "அறிவிப்புகள் ஏற்றப்படுகின்றன…" },
  retry: { en: "Try again", ta: "மீண்டும் முயற்சி" },
  emptyAllH: { en: "Nothing here yet", ta: "இதுவரை எதுவும் இல்லை" },
  emptyAllP: {
    en: "Timing reminders, dasa changes and daily nudges will appear here once they are sent. Choose what you want to hear about in notification settings.",
    ta: "நேர நினைவூட்டல்கள், தசை மாற்றங்கள், தினசரி குறிப்புகள் அனுப்பப்பட்டதும் இங்கே தோன்றும். எவற்றை பெற வேண்டும் என்பதை அறிவிப்பு அமைப்புகளில் தேர்ந்தெடுங்கள்.",
  },
  emptyUnreadH: { en: "Nothing unread", ta: "படிக்காதவை எதுவும் இல்லை" },
  emptyUnreadP: {
    en: "You have read everything Vinaadi sent.",
    ta: "விநாடி அனுப்பிய அனைத்தையும் நீங்கள் படித்துவிட்டீர்கள்.",
  },
  showAll: { en: "Show all notifications", ta: "அனைத்து அறிவிப்புகளையும் காட்டு" },
  groupToday: { en: "Today", ta: "இன்று" },
  groupYesterday: { en: "Yesterday", ta: "நேற்று" },
  groupWeek: { en: "Earlier this week", ta: "இந்த வாரம்" },
  groupEarlier: { en: "Earlier", ta: "முந்தையவை" },
  justNow: { en: "Just now", ta: "இப்போது" },
  announceAllRead: { en: "All notifications marked read.", ta: "அனைத்து அறிவிப்புகளும் படித்ததாக குறிக்கப்பட்டன." },
} as const;

function say(key: keyof typeof COPY, lang: Lang) {
  return COPY[key][lang];
}

const LOCALE: Record<Lang, string> = { ta: "ta-IN", en: "en-GB" };

/** Day-bucket key for the group headings. Compares calendar days in the
 *  viewer's own zone — "yesterday" must mean yesterday locally, not 24h ago. */
type Bucket = "groupToday" | "groupYesterday" | "groupWeek" | "groupEarlier";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function bucketOf(iso: string, now: Date): Bucket {
  const sent = new Date(iso);
  if (Number.isNaN(sent.getTime())) return "groupEarlier";
  const days = Math.round((startOfDay(now) - startOfDay(sent)) / 86_400_000);
  if (days <= 0) return "groupToday";
  if (days === 1) return "groupYesterday";
  if (days < 7) return "groupWeek";
  return "groupEarlier";
}

/** Relative age, hand-written in both languages rather than left to
 *  Intl.RelativeTimeFormat — Tamil output varies by engine and this is a
 *  glanceable label, not prose. */
function relativeTime(iso: string, lang: Lang, now: Date): string {
  const sent = new Date(iso).getTime();
  if (Number.isNaN(sent)) return "";
  const minutes = Math.round((now.getTime() - sent) / 60_000);
  if (minutes < 1) return say("justNow", lang);
  if (minutes < 60) return lang === "ta" ? `${minutes} நிமிடத்திற்கு முன்` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return lang === "ta" ? `${hours} மணி நேரத்திற்கு முன்` : `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return say("groupYesterday", lang);
  if (days < 7) return lang === "ta" ? `${days} நாட்களுக்கு முன்` : `${days} days ago`;
  return new Date(sent).toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const { hydrated, lang } = useSession();
  const [items, setItems] = useState<NotificationInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [announcement, setAnnouncement] = useState("");

  // Bumped on every load so a response from an abandoned request can never
  // overwrite a newer one.
  const requestRef = useRef(0);

  const loadInbox = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetchJson<NotificationInboxResponse>(
        `/api/v1/notifications?limit=${INBOX_LIMIT}`,
      );
      if (requestRef.current !== requestId) return;
      setItems(response.data ?? []);
    } catch (loadError) {
      if (requestRef.current !== requestId) return;
      setError(readErrorMessage(loadError));
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void loadInbox();
  }, [hydrated, loadInbox]);

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    setError(null);
    const stamp = new Date().toISOString();
    // Optimistic: the row states settle immediately, then the server response
    // (which returns the whole list) reconciles them.
    setItems((prev) => prev.map((item) => (item.read_at ? item : { ...item, read_at: stamp })));
    try {
      const response = await apiFetchJson<NotificationInboxResponse>(
        "/api/v1/notifications/read-all",
        { method: "POST" },
      );
      setItems(response.data ?? []);
      setAnnouncement(say("announceAllRead", lang));
    } catch (markError) {
      setError(readErrorMessage(markError));
      void loadInbox();
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleMarkRead(notificationId: string) {
    setMarkingReadId(notificationId);
    setError(null);
    const stamp = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.notification_id === notificationId ? { ...item, read_at: item.read_at ?? stamp } : item,
      ),
    );
    try {
      const response = await apiFetchJson<NotificationInboxResponse>(
        `/api/v1/notifications/${notificationId}/read`,
        { method: "POST" },
      );
      setItems(response.data ?? []);
    } catch (markError) {
      setError(readErrorMessage(markError));
      void loadInbox();
    } finally {
      setMarkingReadId(null);
    }
  }

  const unreadCount = useMemo(() => items.filter((item) => !item.read_at).length, [items]);
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((item) => !item.read_at) : items),
    [items, filter],
  );

  // One `now` per render pass, so every row in a pass is measured against the
  // same instant (rows a millisecond apart must not disagree about "today").
  const groups = useMemo(() => {
    const now = new Date();
    const order: Bucket[] = ["groupToday", "groupYesterday", "groupWeek", "groupEarlier"];
    const byBucket = new Map<Bucket, NotificationInboxItem[]>();
    for (const item of visible) {
      const bucket = bucketOf(item.send_at, now);
      const bucketItems = byBucket.get(bucket);
      if (bucketItems) bucketItems.push(item);
      else byBucket.set(bucket, [item]);
    }
    return order
      .filter((bucket) => byBucket.has(bucket))
      .map((bucket) => ({ bucket, now, items: byBucket.get(bucket) as NotificationInboxItem[] }));
  }, [visible]);

  const showEmpty = !loading && visible.length === 0;

  return (
    <div className="clarity-shell cl-inbox-shell">
      <div className="cl-inbox-bar">
        <div className="cl-inbox-bar__inner">
          <Link href="/dashboard" className="cl-inbox-navlink">
            <ArrowLeft size={16} strokeWidth={1.9} aria-hidden="true" />
            {say("back", lang)}
          </Link>
          <Link href="/dashboard/settings" className="cl-inbox-navlink cl-inbox-navlink--muted">
            <SlidersHorizontal size={16} strokeWidth={1.9} aria-hidden="true" />
            {say("settings", lang)}
          </Link>
        </div>
      </div>

      <main className="cl-inbox-main">
        <header className="cl-inbox-head">
          <h1 className="cl-inbox-head__h1">{say("title", lang)}</h1>
          <p className="cl-inbox-head__lead">{say("lead", lang)}</p>
        </header>

        <div className="cl-inbox-tools">
          <div className="cl-seg" role="group" aria-label={say("filterGroup", lang)}>
            <button
              type="button"
              className="cl-seg__btn"
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              {say("all", lang)}
              <span className="cl-seg__count">{items.length}</span>
            </button>
            <button
              type="button"
              className="cl-seg__btn"
              aria-pressed={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              {say("unread", lang)}
              <span className="cl-seg__count">{unreadCount}</span>
            </button>
          </div>

          {unreadCount > 0 ? (
            <button
              type="button"
              className="cl-inbox-btn"
              onClick={() => void handleMarkAllRead()}
              disabled={markingAllRead}
            >
              <CheckCheck size={16} strokeWidth={1.9} aria-hidden="true" />
              {markingAllRead ? say("marking", lang) : `${say("markAll", lang)} (${unreadCount})`}
            </button>
          ) : (
            !loading &&
            items.length > 0 && (
              <span className="cl-inbox-clear">
                <Check size={16} strokeWidth={2.1} aria-hidden="true" />
                {say("caughtUp", lang)}
              </span>
            )
          )}
        </div>

        {error && (
          <div className="cl-inbox-error" role="alert">
            <CircleAlert size={18} strokeWidth={1.9} aria-hidden="true" />
            <span>{error}</span>
            <button type="button" className="cl-inbox-error__retry" onClick={() => void loadInbox()}>
              {say("retry", lang)}
            </button>
          </div>
        )}

        <div className="cl-inbox-panel" aria-busy={loading}>
          {loading ? (
            <>
              <p className="cl-visually-hidden" role="status">
                {say("loading", lang)}
              </p>
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="cl-inbox-skel" aria-hidden="true">
                  <div className="cl-inbox-skel__disc" />
                  <div className="cl-inbox-skel__lines">
                    <div className="cl-inbox-skel__bar" style={{ width: "28%" }} />
                    <div className="cl-inbox-skel__bar" style={{ width: "62%" }} />
                    <div className="cl-inbox-skel__bar" style={{ width: "88%" }} />
                  </div>
                </div>
              ))}
            </>
          ) : showEmpty ? (
            <div className="cl-inbox-empty">
              <span className="cl-inbox-empty__disc" aria-hidden="true">
                <Inbox size={24} strokeWidth={1.7} />
              </span>
              <h2 className="cl-inbox-empty__h">
                {filter === "unread" ? say("emptyUnreadH", lang) : say("emptyAllH", lang)}
              </h2>
              <p className="cl-inbox-empty__p">
                {filter === "unread" ? say("emptyUnreadP", lang) : say("emptyAllP", lang)}
              </p>
              {filter === "unread" ? (
                <button type="button" className="cl-inbox-btn" onClick={() => setFilter("all")}>
                  {say("showAll", lang)}
                </button>
              ) : (
                <Link href="/dashboard/settings" className="cl-inbox-btn">
                  <SlidersHorizontal size={16} strokeWidth={1.9} aria-hidden="true" />
                  {say("settings", lang)}
                </Link>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.bucket} aria-label={say(group.bucket, lang)}>
                <h2 className="cl-inbox-group">
                  {say(group.bucket, lang)} · {group.items.length}
                </h2>
                <ul className="cl-inbox-list">
                  {group.items.map((item) => {
                    const meta = metaFor(item.type, lang);
                    const Glyph = meta.icon;
                    const unread = !item.read_at;
                    return (
                      <li
                        key={item.notification_id}
                        className={`cl-inbox-row${unread ? " cl-inbox-row--unread" : ""}`}
                      >
                        <span className="cl-inbox-glyph" data-tone={meta.tone} aria-hidden="true">
                          <Glyph size={19} strokeWidth={1.8} />
                        </span>

                        <div>
                          <p className="cl-inbox-meta">
                            <span className="cl-inbox-kind">{meta.label}</span>
                            <span className="cl-inbox-sep" aria-hidden="true">
                              ·
                            </span>
                            <time
                              className="cl-inbox-time"
                              dateTime={item.send_at}
                              title={new Date(item.send_at).toLocaleString(LOCALE[lang])}
                            >
                              {relativeTime(item.send_at, lang, group.now)}
                            </time>
                            {unread && <span className="cl-inbox-new">{say("isNew", lang)}</span>}
                          </p>
                          <h3 className="cl-inbox-title">{item.title}</h3>
                          <p className="cl-inbox-text">{item.body}</p>
                        </div>

                        {unread && (
                          <button
                            type="button"
                            className="cl-inbox-mark"
                            onClick={() => void handleMarkRead(item.notification_id)}
                            disabled={markingReadId === item.notification_id}
                            // Every row carries this control, so the visible
                            // label alone ("Mark read") is ambiguous in a
                            // screen-reader's control list.
                            aria-label={`${say("markOneLabel", lang)}: ${item.title}`}
                          >
                            <Check size={15} strokeWidth={2.1} aria-hidden="true" />
                            {markingReadId === item.notification_id
                              ? say("marking", lang)
                              : say("markOne", lang)}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <p className="cl-visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>
      </main>
    </div>
  );
}
