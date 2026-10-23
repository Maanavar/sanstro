import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetchJson } from "@/lib/api";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { NotificationInboxItem, NotificationInboxResponse } from "@/lib/types";

const POLL_MS = 5 * 60 * 1000;
/** Opening the bell refetches unless the list is fresher than this, so
 *  open/close toggling does not re-ask for what just arrived. */
const OPEN_REFRESH_FLOOR_MS = 15_000;

interface UseNotificationInboxOptions {
  lang: Lang;
  onError?: (message: string) => void;
}

/**
 * The dashboard bell's inbox.
 *
 *  - Polls every 5 minutes, and refetches when the bell opens: the poll alone
 *    could show a list up to 5 minutes old.
 *  - Mark-read is optimistic, as on /notifications: the dot clears on click
 *    and the server's list then reconciles. A failure used to be swallowed,
 *    the dot left in place with no word why; now it reports and refetches the
 *    true state.
 *  - Every request and every local edit bumps one counter, and a response is
 *    applied only if nothing newer has started since — a poll overtaken by a
 *    mark-read can never paint stale read-state back over it.
 */
export function useNotificationInbox({ lang, onError }: UseNotificationInboxOptions) {
  const [items, setItems] = useState<NotificationInboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const requestRef = useRef(0);
  const fetchedAtRef = useRef(0);

  // Read through refs so the callbacks below stay stable across renders.
  const langRef = useRef(lang);
  langRef.current = lang;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const apply = useCallback((requestId: number, response: NotificationInboxResponse) => {
    if (requestRef.current !== requestId) return false;
    setItems(response.data ?? []);
    setUnreadCount(response.unread_count);
    return true;
  }, []);

  const refresh = useCallback(() => {
    const requestId = ++requestRef.current;
    apiFetchJson<NotificationInboxResponse>("/api/v1/notifications")
      .then((response) => {
        if (apply(requestId, response)) fetchedAtRef.current = Date.now();
      })
      .catch(() => {});
  }, [apply]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const onOpen = useCallback(() => {
    if (Date.now() - fetchedAtRef.current < OPEN_REFRESH_FLOOR_MS) return;
    refresh();
  }, [refresh]);

  const send = useCallback((path: string) => {
    const requestId = ++requestRef.current;
    apiFetchJson<NotificationInboxResponse>(path, { method: "POST" })
      .then((response) => { apply(requestId, response); })
      .catch(() => {
        onErrorRef.current?.(t("notif_update_failed", langRef.current));
        refresh();
      });
  }, [apply, refresh]);

  const markAllRead = useCallback(() => {
    const stamp = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: stamp })));
    setUnreadCount(0);
    send("/api/v1/notifications/read-all");
  }, [send]);

  const markOneRead = useCallback((notificationId: string) => {
    // Decided from the rendered list, not inside the setItems updater: React
    // does not promise to run an updater synchronously.
    const wasUnread = itemsRef.current.some((n) => n.notification_id === notificationId && !n.read_at);
    if (wasUnread) {
      const stamp = new Date().toISOString();
      setItems((prev) =>
        prev.map((n) => (n.notification_id === notificationId ? { ...n, read_at: n.read_at ?? stamp } : n)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    send(`/api/v1/notifications/${notificationId}/read`);
  }, [send]);

  return { items, unreadCount, onOpen, markAllRead, markOneRead, refresh };
}
