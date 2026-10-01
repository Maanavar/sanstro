import { Bell, Cake, Orbit, Route, Sparkles, Sunrise } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Lang } from "@/lib/i18n";

/**
 * Display helpers shared by the two places a sent notification is shown: the
 * dashboard bell popover and the full `/notifications` inbox. One copy, so the
 * peek and the page cannot disagree about what a row is called or how old it is.
 */

export type NotificationTone = "cycle" | "day" | "neutral";

type TypeMeta = { icon: LucideIcon; tone: NotificationTone; en: string; ta: string };

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

export function notificationMeta(
  type: string,
  lang: Lang,
): { icon: LucideIcon; tone: NotificationTone; label: string } {
  const known = TYPE_META[type];
  if (known) return { icon: known.icon, tone: known.tone, label: lang === "ta" ? known.ta : known.en };
  return { icon: Bell, tone: "neutral", label: typeLabel(type) };
}

export const NOTIFICATION_LOCALE: Record<Lang, string> = { ta: "ta-IN", en: "en-GB" };

/** Relative age, hand-written in both languages rather than left to
 *  Intl.RelativeTimeFormat — Tamil output varies by engine and this is a
 *  glanceable label, not prose. */
export function notificationRelativeTime(iso: string, lang: Lang, now: Date): string {
  const sent = new Date(iso).getTime();
  if (Number.isNaN(sent)) return "";
  const minutes = Math.round((now.getTime() - sent) / 60_000);
  if (minutes < 1) return lang === "ta" ? "இப்போது" : "Just now";
  if (minutes < 60) return lang === "ta" ? `${minutes} நிமிடத்திற்கு முன்` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return lang === "ta" ? `${hours} மணி நேரத்திற்கு முன்` : `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return lang === "ta" ? "நேற்று" : "Yesterday";
  if (days < 7) return lang === "ta" ? `${days} நாட்களுக்கு முன்` : `${days} days ago`;
  return new Date(sent).toLocaleDateString(NOTIFICATION_LOCALE[lang], { day: "numeric", month: "short" });
}
