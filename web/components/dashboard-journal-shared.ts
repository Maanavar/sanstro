// Shared Journal-tab constants/types extracted from the (now-deleted) Classic
// dashboard-journal-tab.tsx during the Nova-only migration
// (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3b). Life-area + context-event
// enums and their i18n-key maps, consumed by both the Classic tab and Nova.

import type { t } from "@/lib/i18n";

export const LIFE_AREAS = ["career", "relationship", "health", "family", "finance", "education", "spiritual", "general"] as const;
export type LifeArea = (typeof LIFE_AREAS)[number];

export const AREA_KEY: Record<LifeArea, Parameters<typeof t>[0]> = {
  career: "journal_area_career",
  relationship: "journal_area_relationship",
  health: "journal_area_health",
  family: "journal_area_family",
  finance: "journal_area_finance",
  education: "journal_area_education",
  spiritual: "journal_area_spiritual",
  general: "journal_area_general",
};

export const CONTEXT_EVENT_TYPES = ["job_change", "marriage", "travel", "health_event", "education", "property", "family_event", "other"] as const;
export type ContextEventType = (typeof CONTEXT_EVENT_TYPES)[number];

export const CTX_TYPE_KEY: Record<ContextEventType, Parameters<typeof t>[0]> = {
  job_change: "ctx_type_job_change",
  marriage: "ctx_type_marriage",
  travel: "ctx_type_travel",
  health_event: "ctx_type_health_event",
  education: "ctx_type_education",
  property: "ctx_type_property",
  family_event: "ctx_type_family_event",
  other: "ctx_type_other",
};
