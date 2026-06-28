"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { apiFetchJson, readErrorMessage } from "@/lib/api";
import type { NotificationInboxItem, NotificationInboxResponse } from "@/lib/types";
import { useSession } from "@/hooks/useSession";

function typeLabel(type: string) {
  return type.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function NotificationsPage() {
  const { hydrated } = useSession();
  const [items, setItems] = useState<NotificationInboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function loadInbox() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetchJson<NotificationInboxResponse>("/api/v1/notifications");
        if (cancelled) return;
        setItems(response.data ?? []);
        setUnreadCount(response.unread_count ?? 0);
      } catch (loadError) {
        if (cancelled) return;
        setError(readErrorMessage(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInbox();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    setError(null);
    try {
      const response = await apiFetchJson<NotificationInboxResponse>("/api/v1/notifications/read-all", { method: "POST" });
      setItems(response.data ?? []);
      setUnreadCount(response.unread_count ?? 0);
    } catch (markError) {
      setError(readErrorMessage(markError));
    } finally {
      setMarkingAllRead(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--cl-bg)", padding: "32px 20px 72px" }}>
      <div style={{ width: "min(980px, 100%)", margin: "0 auto", display: "grid", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--cl-muted)", textDecoration: "none", fontWeight: 600 }}>
              <ArrowLeft size={16} strokeWidth={1.8} />
              Back to dashboard
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "44px", height: "44px", borderRadius: "999px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#FFF4E6", color: "#8A4B1F" }}>
                <Bell size={20} strokeWidth={1.8} />
              </span>
              <div>
                <p style={{ margin: "0 0 4px", color: "var(--cl-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Notifications</p>
                <h1 style={{ margin: 0, color: "var(--cl-ink)", fontSize: "2rem" }}>Inbox</h1>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            disabled={markingAllRead || unreadCount === 0}
            style={{ minHeight: "44px", padding: "0 16px", borderRadius: "999px", border: "1px solid var(--cl-border)", background: unreadCount > 0 ? "var(--cl-surface)" : "var(--cl-bg-2)", color: "var(--cl-ink)", fontWeight: 700, cursor: unreadCount > 0 ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <CheckCheck size={16} strokeWidth={1.8} />
            {markingAllRead ? "Updating..." : unreadCount > 0 ? `Mark all read (${unreadCount})` : "All caught up"}
          </button>
        </div>

        <div style={{ background: "var(--cl-surface)", border: "1px solid var(--cl-border)", borderRadius: "18px", padding: "24px", display: "grid", gap: "16px" }}>
          <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.65 }}>
            This inbox mirrors the same backend notification history used on mobile, so desktop users can catch up on Chandrashtama alerts, timing reminders, and daily nudges in one place.
          </p>

          {error && (
            <div style={{ padding: "14px 16px", borderRadius: "12px", background: "#FFF5F5", border: "1px solid #E9B4B4", color: "#8B2C2C" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: "12px 0", color: "var(--cl-muted)" }}>Loading notifications...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--cl-muted)" }}>
              No notifications yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {items.map((item) => (
                <article key={item.notification_id} style={{ borderRadius: "14px", border: "1px solid var(--cl-border)", background: item.read_at ? "var(--cl-bg)" : "#FFF9F1", padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "4px 10px", borderRadius: "999px", background: item.read_at ? "var(--cl-bg-2)" : "#F4E2CC", color: "#7A4B1F", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {typeLabel(item.type)}
                      </span>
                      {!item.read_at && <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: "#C45B2D", display: "inline-block" }} />}
                    </div>
                    <time style={{ color: "var(--cl-muted)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{new Date(item.send_at).toLocaleString()}</time>
                  </div>
                  <h2 style={{ margin: "0 0 6px", color: "var(--cl-ink)", fontSize: "1.05rem" }}>{item.title}</h2>
                  <p style={{ margin: 0, color: "var(--cl-muted)", lineHeight: 1.65 }}>{item.body}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}