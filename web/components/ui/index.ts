/**
 * The Nova component kit (audit B-7 — "the keystone"). Five primitives wired to
 * the existing token layer, so the good tokens finally show up on screen as one
 * system instead of 654 hand-written inline styles. Import from here:
 *
 *   import { Segmented, Card, Button, Pill, Score, BilingualText } from "@/components/ui";
 *
 * Styling for Card/Segmented/Button/Pill/Score-chip lives in the COMPONENT KIT
 * section of web/app/dashboard/dashboard-nova.css.
 */

export { BilingualText, pickLang } from "./bilingual-text";
export { Card, Panel } from "./card";
export { Button, Pill } from "./button";
export { Segmented } from "./segmented";
export type { SegmentedOption } from "./segmented";
export { Score } from "./score";
