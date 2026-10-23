import { getApiClient } from "./client";
import type { LifeMode, LifeModeStatus, LifeModeUpdateIntent, LifeModeUpdateSurface } from "../types";

// Checked against app/api/settings.py: GET and PATCH "/settings/life-mode",
// no path params; PATCH body is { mode, intent, surface }. The server defaults
// intent to SELECT and surface to null for old clients, and accepts SKIP only
// from FIRST_RUN_PICKER. The response is the bare status object, not a
// { success, data } envelope.

export function getLifeMode(): Promise<LifeModeStatus> {
  return getApiClient().get("/settings/life-mode") as Promise<LifeModeStatus>;
}

export function updateLifeMode(
  mode: LifeMode,
  intent: LifeModeUpdateIntent,
  surface: LifeModeUpdateSurface,
): Promise<LifeModeStatus> {
  return getApiClient().patch("/settings/life-mode", { mode, intent, surface }) as Promise<LifeModeStatus>;
}
