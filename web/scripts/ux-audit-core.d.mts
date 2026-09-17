// Types for ux-audit-core.mjs, consumed by web/e2e/dashboard-experience.spec.ts.
import type { Browser } from "@playwright/test";

export type GateResult = "PASS" | "FAIL" | "INFO";
export interface Gate {
  id: string;
  check: string;
  value: unknown;
  result: GateResult;
}
export interface AuditMetrics {
  base: string;
  email: string;
  phases: string[];
  gates: Gate[];
  [probe: string]: unknown;
}

export const ALL_PHASES: string[];
export const DEFAULT_PASSWORD: string;
export function gateKey(g: Pick<Gate, "id" | "check">): string;
export function assertE2eBackend(base: string): Promise<void>;
export function runAudit(opts: {
  browser: Browser;
  base: string;
  out: string;
  phases?: string[];
  prod?: boolean;
  email?: string;
  password?: string;
  log?: (...a: unknown[]) => void;
}): Promise<AuditMetrics>;
export function computeGates(metrics: Record<string, unknown>, opts?: { prod?: boolean }): Gate[];
export function formatGates(gates: Gate[]): string;
