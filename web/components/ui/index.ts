/**
 * The Nova component kit (audit B-7 — "the keystone"). Primitives wired to the
 * existing token layer, so the good tokens finally show up on screen as one
 * system instead of 654 hand-written inline styles. Import the lightweight
 * primitives from here:
 *
 *   import { Segmented, Card, Button, Pill, BilingualText } from "@/components/ui";
 *
 * `Score` is deliberately NOT re-exported here — it pulls in framer-motion (via
 * NovaScoreDial), and in Next dev a barrel drags its whole graph into every
 * lazy chunk that imports the barrel (no tree-shaking in dev), which bloated
 * the on-demand tab chunks and caused a ChunkLoadError timeout. Import it
 * directly where you actually need it, so only that chunk pays for framer-motion:
 *
 *   import { Score } from "@/components/ui/score";
 *
 * Styling for Card/Segmented/Button/Pill/Score-chip lives in the COMPONENT KIT
 * section of web/app/dashboard/dashboard-nova.css.
 */

export { BilingualText, pickLang } from "./bilingual-text";
export { Card, Panel } from "./card";
export { Button, Pill } from "./button";
export { Segmented } from "./segmented";
export type { SegmentedOption } from "./segmented";
