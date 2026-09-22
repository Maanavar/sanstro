import { getApiClient } from "./client";
import type { LifeMode, LifeModeStatus, LifeModeUpdateIntent } from "../types";

// Checked against app/api/settings.py: GET and PATCH "/settings/life-mode",
// no path params; PATCH body is { mode, intent }. The server defaults intent
// to SELECT for old clients. The response is the bare status object, not a
// { success, data } envelope.

export function getLifeMode(): Promise<LifeModeStatus> {
  return getApiClient().get("/settings/life-mode") as Promise<LifeModeStatus>;
}

export function updateLifeMode(
  mode: LifeMode,
  intent: LifeModeUpdateIntent = "SELECT",
): Promise<LifeModeStatus> {
  return getApiClient().patch("/settings/life-mode", { mode, intent }) as Promise<LifeModeStatus>;
}
