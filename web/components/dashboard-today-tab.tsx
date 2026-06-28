"use client";

// Consolidated single-scroll Today view for the web dashboard.
// Delegates to DashboardPersonalTab which already implements all 7 required
// sections (score hero → life areas → cosmic alert → best window → journal
// → rasi palan → upcoming events) in a single scroll. This module exists as
// the canonical import target so the workspace can import DashboardTodayTab
// and the name reflects the screen's purpose ("Today", mirroring the mobile
// Today tab), independent of the internal personal-tab implementation name.

export { DashboardPersonalTab as DashboardTodayTab } from "./dashboard-personal-tab";
export type { } from "./dashboard-personal-tab";
