/**
 * <ProgressBar> — the kit re-export of the existing, already-tokenized
 * `NovaProgressBar` (audit §3a). Imported direct from here (never via the
 * `./ui` barrel) for the same reason as `Score`/`Table`: `dashboard-ui-nova`
 * pulls framer-motion. Use:
 *
 *   import { ProgressBar } from "@/components/ui/progress-bar";
 */

export { NovaProgressBar as ProgressBar } from "../dashboard-ui-nova";
