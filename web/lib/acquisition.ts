/**
 * First-touch attribution (GRW-03) and referral capture (GRW-13).
 *
 * On a visitor's first page load this records where they came from in a
 * first-party cookie, `vinaadi_ft`. When they later create an account — by
 * email or through Google, both of which reach the backend through the Next
 * proxy with this cookie attached — `app/services/acquisition_service.py`
 * copies it onto the new user row. That is what lets the admin report answer
 * "which page or channel brings people who stay".
 *
 * What is recorded, and nothing else: utm source/medium/campaign, a `?ref=`
 * referral code, the referring site's HOST (never its URL) and the landing
 * PATH (never its query). No birth data, no names, no free text.
 *
 * First touch wins: a later visit does not overwrite it — except that a
 * referral code arriving after an untagged first visit is added, because the
 * person who shared the link is the reason the visitor came back.
 */

export const FIRST_TOUCH_COOKIE = "vinaadi_ft";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export interface FirstTouch {
  /** utm_source */ s?: string;
  /** utm_medium */ m?: string;
  /** utm_campaign */ c?: string;
  /** ?ref= referral code */ r?: string;
  /** referring host */ h?: string;
  /** landing path */ p?: string;
}

function readCookie(doc: Document): FirstTouch | null {
  const hit = doc.cookie.split("; ").find((c) => c.startsWith(`${FIRST_TOUCH_COOKIE}=`));
  if (!hit) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(hit.slice(FIRST_TOUCH_COOKIE.length + 1)));
    return parsed && typeof parsed === "object" ? (parsed as FirstTouch) : null;
  } catch {
    return null;
  }
}

function writeCookie(doc: Document, loc: Location, value: FirstTouch): void {
  const secure = loc.protocol === "https:" ? "; Secure" : "";
  doc.cookie = `${FIRST_TOUCH_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

const clip = (v: string | null, n: number) => (v ? v.trim().slice(0, n) : undefined) || undefined;

/** What this page view would record as a first touch. Exported for tests. */
export function firstTouchFrom(loc: Pick<Location, "search" | "pathname" | "host">, referrer: string): FirstTouch {
  const q = new URLSearchParams(loc.search);
  let h: string | undefined;
  try {
    const ref = referrer ? new URL(referrer).host.toLowerCase() : "";
    if (ref && ref !== loc.host.toLowerCase()) h = ref.slice(0, 255);
  } catch {
    /* unparseable referrer — record none */
  }
  const touch: FirstTouch = {
    s: clip(q.get("utm_source"), 64),
    m: clip(q.get("utm_medium"), 64),
    c: clip(q.get("utm_campaign"), 128),
    r: clip(q.get("ref"), 32),
    h,
    p: loc.pathname.slice(0, 255),
  };
  return Object.fromEntries(Object.entries(touch).filter(([, v]) => v)) as FirstTouch;
}

/** Record the first touch if none is recorded yet. Safe to call on every page. */
export function captureFirstTouch(): void {
  if (typeof document === "undefined") return;
  try {
    const current = firstTouchFrom(window.location, document.referrer);
    const existing = readCookie(document);
    if (!existing) {
      writeCookie(document, window.location, current);
    } else if (!existing.r && current.r) {
      writeCookie(document, window.location, { ...existing, r: current.r });
    }
  } catch {
    /* cookies blocked — attribution is best-effort and must never break a page */
  }
}

/**
 * One channel label, most specific first — the same rule as the backend's
 * `acquisition_channel` (app/api/admin_analytics.py), so a PostHog funnel and
 * the admin report bucket people identically.
 */
export function firstTouchChannel(touch: FirstTouch | null): string {
  if (touch?.s) return touch.s.toLowerCase();
  if (touch?.r) return "referral";
  if (touch?.h) return touch.h.replace(/^www\./, "");
  return "unknown";
}

/** The recorded first touch, for attaching to analytics events. */
export function readFirstTouch(): FirstTouch | null {
  if (typeof document === "undefined") return null;
  try {
    return readCookie(document);
  } catch {
    return null;
  }
}
