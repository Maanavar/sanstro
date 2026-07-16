/**
 * Marketing/public icon set — now a thin adapter over lucide-react so the whole
 * product renders one icon system (SHD-02; previously a hand-rolled stroke set
 * under MKT-05 / UXD-23). Call sites keep using `<MarketingIcon name="…" />`, so
 * nothing downstream changes. All icons: 24×24, `currentColor` stroke, no fill —
 * they inherit text colour and stay crisp at any size.
 */

import {
  Sun,
  CalendarCheck,
  Users,
  Grid3x3,
  Heart,
  SlidersHorizontal,
  Moon,
  Target,
  Mail,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type MarketingIconName =
  | "sun"
  | "calendar"
  | "users"
  | "grid"
  | "rings"
  | "sliders"
  | "moon"
  | "target"
  | "mail"
  | "phone";

const ICONS: Record<MarketingIconName, LucideIcon> = {
  sun: Sun,
  calendar: CalendarCheck,
  users: Users,
  grid: Grid3x3,
  rings: Heart, // marriage / compatibility (porutham)
  sliders: SlidersHorizontal,
  moon: Moon,
  target: Target,
  mail: Mail,
  phone: Smartphone,
};

export function MarketingIcon({
  name,
  size = 24,
  className,
}: {
  name: MarketingIconName;
  size?: number;
  className?: string;
}) {
  const Glyph = ICONS[name];
  return <Glyph size={size} strokeWidth={1.6} aria-hidden="true" className={className} />;
}
