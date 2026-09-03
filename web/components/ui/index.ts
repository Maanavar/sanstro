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
 *
 * `Table`/`ProgressBar` (like `Score`) are also kept OUT of this barrel — they
 * re-export from dashboard-ui-nova, which pulls framer-motion. Import them
 * direct: `import { Table } from "@/components/ui/table";`.
 */

export { BilingualText, pickLang } from "./bilingual-text";
export { Card, Panel } from "./card";
export { Button, Pill } from "./button";
export { Segmented } from "./segmented";
export type { SegmentedOption } from "./segmented";
export { Kicker, SectionHeader } from "./kicker";
export { Field, Input, Select, Textarea } from "./field";
export { Chip, StatusChip } from "./chip";
export { Toggle } from "./toggle";
export { EmptyState, ErrorState, GatedState, LoadingState, UnavailableState } from "./state";
