import { getApiClient } from "./client";
import type { LifeMode, LifeModeStatus } from "../types";

// Checked against app/api/settings.py: GET and PATCH "/settings/life-mode",
// no path params; PATCH body is { mode }. The response is the bare status
// object, not a { success, data } envelope.

export function getLifeMode(): Promise<LifeModeStatus> {
  return getApiClient().get("/settings/life-mode") as Promise<LifeModeStatus>;
}

export function updateLifeMode(mode: LifeMode): Promise<LifeModeStatus> {
  return getApiClient().patch("/settings/life-mode", { mode }) as Promise<LifeModeStatus>;
}
