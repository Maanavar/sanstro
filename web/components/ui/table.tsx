/**
 * <Table> — the kit re-export of the existing, already-tokenized `NovaTable`
 * (audit §3a). Imported direct from here (never via the `./ui` barrel) for the
 * same reason as `Score`: `dashboard-ui-nova` pulls framer-motion, and a barrel
 * re-export would drag it into every lazy chunk. Use:
 *
 *   import { Table } from "@/components/ui/table";
 */

export { NovaTable as Table } from "../dashboard-ui-nova";
