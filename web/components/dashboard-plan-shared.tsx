"use client";

// Shared Plan-tab utilities/constants + PlanEventsPanel extracted from the
// (now-deleted) Classic dashboard-plan-tab.tsx during the Nova-only migration
// (docs/NOVA_ONLY_MIGRATION_PLAN.md Phase 3b). Pure maps/option arrays and
// i18n-key helpers consumed by both the Classic tab and the Nova Plan panels.

import {
  Briefcase, TrendingUp, TrendingDown, Heart, HeartCrack, Scale, Home, Plane,
  HeartPulse, Scissors, Dumbbell, FileText, GraduationCap, Coins, CreditCard,
  Flame, Baby, Rocket, XCircle, Star, MapPin, Bell, Pin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

import { Surface } from "./dashboard-ui";
import { DashboardLifeEvents } from "./dashboard-life-events";

// Map a declared goal to the event-window engine's event type so we can show
// the next supportive timing windows for that specific goal.
export const GOAL_EVENT_MAP: Record<string, "MARRIAGE" | "CAREER" | "FINANCE"> = {
  job_change: "CAREER",
  business_start: "CAREER",
  education: "CAREER",
  marriage: "MARRIAGE",
  family_harmony: "MARRIAGE",
  child_birth: "MARRIAGE",
  property: "FINANCE",
  money: "FINANCE",
};

export const GOAL_OPTIONS: Array<[string, Parameters<typeof t>[0]]> = [
  ["job_change", "goal_job_change"],
  ["business_start", "goal_business"],
  ["marriage", "goal_marriage"],
  ["education", "goal_education"],
  ["property", "goal_property"],
  ["health", "goal_health"],
  ["travel_abroad", "goal_travel"],
  ["spiritual", "goal_spiritual"],
  ["family_harmony", "goal_family"],
  ["money", "goal_money"],
  ["child_birth", "goal_child"],
  ["other", "goal_other"],
];

export function normalizeGoalType(goalType: string): string {
  return goalType === "financial" ? "money" : goalType;
}

export const WHATIF_OPTIONS: Array<{ value: string; en: string; ta: string }> = [
  { value: "job_change", en: "Job change or new role", ta: "வேலை மாற்றம் / புதிய பொறுப்பு" },
  { value: "business_start", en: "Start a new business", ta: "புதிய தொழில் தொடங்குதல்" },
  { value: "marriage", en: "Marriage", ta: "திருமணம்" },
  { value: "education", en: "Education / Exam / Study", ta: "கல்வி / தேர்வு" },
  { value: "property", en: "Buy property or land", ta: "சொத்து வாங்குதல்" },
  { value: "money", en: "Investment or financial move", ta: "முதலீடு / நிதி முடிவு" },
  { value: "travel_abroad", en: "Travel abroad or relocation", ta: "வெளிநாடு பயணம் / இடமாற்றம்" },
  { value: "health", en: "Medical procedure or surgery", ta: "மருத்துவ சிகிச்சை / அறுவை" },
  { value: "spiritual", en: "Spiritual initiation or pilgrimage", ta: "ஆன்மீக தொடக்கம் / புனித பயணம்" },
  { value: "family_harmony", en: "Resolve family matter", ta: "குடும்ப பிரச்சினை தீர்க்க" },
  { value: "child_birth", en: "Child birth or naming", ta: "குழந்தை பிறப்பு / பெயரிடல்" },
  { value: "foreign_settlement", en: "Foreign settlement / immigration", ta: "வெளிநாட்டு குடியேற்றம் / குடியுரிமை" },
  { value: "litigation", en: "Legal dispute / litigation", ta: "சட்ட வழக்கு / சர்ச்சை" },
  { value: "other", en: "General timing check", ta: "பொதுவான நேர சரிபார்ப்பு" },
];

export const ACTIVITY_OPTIONS: Array<{ value: string; en: string; ta: string }> = [
  { value: "job_change", en: "Job change or new role", ta: "வேலை மாற்றம் / புதிய பொறுப்பு" },
  { value: "business_start", en: "Start a new business", ta: "புதிய தொழில் தொடங்குதல்" },
  { value: "education", en: "Exam / Course start", ta: "தேர்வு / படிப்பு தொடக்கம்" },
  { value: "property", en: "Property purchase / registration", ta: "சொத்து வாங்கல் / பதிவு" },
  { value: "money", en: "Investment or major financial decision", ta: "முதலீடு / நிதி முடிவு" },
  { value: "travel", en: "Travel abroad or long journey", ta: "வெளிநாடு / நீண்ட பயணம்" },
  { value: "health", en: "Medical procedure or surgery", ta: "மருத்துவ சிகிச்சை / அறுவை" },
  { value: "spiritual", en: "Grihapravesh or religious event", ta: "புதுமனை புகு விழா / ஆன்மிக நிகழ்வு" },
  // "Child birth or naming ceremony" was one row covering two different
  // questions, and it prefilled the picker with SPIRITUAL for both. Naming now
  // has a page-cited table of its own (Kalaprakasika Ch. III), so answering a
  // naming question with an unsourced SPIRITUAL scan would be strictly worse
  // than it was before the chapter was extracted. Split, so each row prefills
  // the activity it actually asks about.
  { value: "child_naming", en: "Baby naming ceremony", ta: "பெயர் சூட்டு விழா" },
  { value: "child_birth", en: "Child birth", ta: "குழந்தை பிறப்பு" },
  { value: "other", en: "General auspicious day", ta: "பொதுவான நல்ல நாள்" },
];

// Map Best Dates activity values -> Muhurta picker activity IDs.
//
// `property` stays on PURCHASE deliberately. Kalaprakasika Ch. XXI does have
// land rules, but its 14-star list is scoped to *taking possession* of land,
// and the only rule it gives for *buying* is a weekday one — so pointing a
// "property purchase / registration" row at LAND_POSSESSION would promote a
// possession rule into a purchase scope. `LAND_POSSESSION` and `LAND_PURCHASE`
// are both selectable directly in the picker instead.
export const ACTIVITY_TO_MUHURTA: Record<string, string> = {
  job_change: "JOB_START",
  business_start: "JOB_START",
  education: "EXAM",
  property: "PURCHASE",
  money: "INVESTMENT",
  travel: "TRAVEL",
  health: "MEDICAL",
  spiritual: "SPIRITUAL",
  child_naming: "NAMING_CEREMONY",
  // Child birth has no sourced muhurta table — Kalaprakasika Ch. XVI (Nishekam)
  // governs conception, not delivery timing. Left on SPIRITUAL, unchanged.
  child_birth: "SPIRITUAL",
  // Kept so an in-flight selection of the old merged row still resolves.
  child: "SPIRITUAL",
  other: "",
};

export const verdictKey = (v: string) => (v === "FAVOURABLE" ? "verdict_favourable" : v === "CAUTION" ? "verdict_caution" : "verdict_neutral");
export const strengthKey = (s: string) => (s === "STRONG" ? "strength_strong" : s === "WEAK" ? "strength_weak" : "strength_moderate");

// Decision-support scenario catalogue — shared by Classic's DecisionPanel and
// Nova's Plan decisions panel.
export const SCENARIO_GROUPS: Array<{ groupEn: string; groupTa: string; options: Array<{ value: string; en: string; ta: string }> }> = [
  {
    groupEn: "Career & Work",
    groupTa: "தொழில் & வேலை",
    options: [
      { value: "career", en: "Job change / New role", ta: "வேலை மாற்றம் / புதிய பொறுப்பு" },
      { value: "career", en: "Promotion / Raise", ta: "பதவி உயர்வு / சம்பள உயர்வு" },
      { value: "career", en: "Start own business", ta: "சொந்த தொழில் தொடங்குதல்" },
      { value: "career", en: "Resign / Quit", ta: "வேலை விட்டு வெளியேறுதல்" },
    ],
  },
  {
    groupEn: "Money & Property",
    groupTa: "பணம் & சொத்து",
    options: [
      { value: "money", en: "Investment decision", ta: "முதலீட்டு முடிவு" },
      { value: "money", en: "Buy / Sell property", ta: "சொத்து வாங்குதல் / விற்பனை" },
      { value: "money", en: "Take a loan", ta: "கடன் வாங்குதல்" },
      { value: "money", en: "Start savings / SIP", ta: "சேமிப்பு / SIP தொடங்குதல்" },
    ],
  },
  {
    groupEn: "Relationships",
    groupTa: "உறவு",
    options: [
      { value: "relationship", en: "Marriage / Engagement", ta: "திருமணம் / நிச்சயதார்த்தம்" },
      { value: "relationship", en: "Start a relationship", ta: "புதிய உறவு தொடங்குதல்" },
      { value: "relationship", en: "Resolve family conflict", ta: "குடும்ப பிரச்சினை தீர்க்குதல்" },
      { value: "family", en: "Children / Family planning", ta: "குழந்தை / குடும்ப திட்டம்" },
    ],
  },
  {
    groupEn: "Health & Wellbeing",
    groupTa: "உடல்நலம்",
    options: [
      { value: "health", en: "Medical procedure / Surgery", ta: "மருத்துவ சிகிச்சை / அறுவை சிகிச்சை" },
      { value: "health", en: "Start new health routine", ta: "புதிய உடல்நல திட்டம் தொடங்குதல்" },
      { value: "health", en: "Mental health / Therapy", ta: "மன நலம் / சிகிச்சை" },
    ],
  },
  {
    groupEn: "Education & Learning",
    groupTa: "கல்வி",
    options: [
      { value: "education", en: "Higher education / Abroad study", ta: "உயர் கல்வி / வெளிநாட்டு படிப்பு" },
      { value: "education", en: "New course / Certification", ta: "புதிய படிப்பு / சான்றிதழ்" },
      { value: "education", en: "Competitive exam", ta: "போட்டித் தேர்வு" },
    ],
  },
  {
    groupEn: "Relocation & Travel",
    groupTa: "இடம் மாற்றம் & பயணம்",
    options: [
      { value: "career", en: "Relocate to new city", ta: "புதிய நகரத்திற்கு இடம் பெயர்தல்" },
      { value: "career", en: "Move abroad / Emigrate", ta: "வெளிநாடு செல்லுதல்" },
      { value: "spiritual", en: "Pilgrimage / Sacred travel", ta: "யாத்திரை / புண்ணிய பயணம்" },
    ],
  },
  {
    groupEn: "Spiritual & Personal",
    groupTa: "ஆன்மீகம் & தனிப்பட்டது",
    options: [
      { value: "spiritual", en: "Spiritual initiation / Diksha", ta: "ஆன்மீக தீக்ஷை / துவக்கம்" },
      { value: "spiritual", en: "Start meditation / Sadhana", ta: "தியானம் / சாதனா தொடங்குதல்" },
      { value: "career", en: "Major life direction change", ta: "வாழ்க்கை திசை மாற்றம்" },
    ],
  },
];

// ── Life-event log shared data (Classic DashboardLifeEventLog + Nova re-skin) ──
export interface EventCorrelation {
  mahaLord: string;
  antarLord: string;
  moonRasi: string;
  narrative: { ta: string; en: string };
}

export interface LifeEventLogItem {
  id: string;
  chartId: string;
  eventType: string;
  eventDate: string;
  description?: string | null;
  correlation?: EventCorrelation | null;
}

export const EVENT_TYPES = [
  { id: "JOB_CHANGE", en: "Job change" },
  { id: "PROMOTION", en: "Promotion" },
  { id: "DEMOTION", en: "Demotion" },
  { id: "JOB_LOSS", en: "Job loss" },
  { id: "RELATIONSHIP_START", en: "Relationship start" },
  { id: "RELATIONSHIP_END", en: "Relationship end" },
  { id: "MARRIAGE", en: "Marriage" },
  { id: "DIVORCE", en: "Divorce" },
  { id: "REMARRIAGE", en: "Remarriage" },
  { id: "RELOCATION", en: "Relocation" },
  { id: "TRAVEL_ABROAD", en: "Travel abroad" },
  { id: "HEALTH_EVENT", en: "Health event" },
  { id: "SURGERY", en: "Surgery" },
  { id: "RECOVERY", en: "Recovery" },
  { id: "EXAM_RESULT", en: "Exam result" },
  { id: "EDUCATION_START", en: "Education start" },
  { id: "EDUCATION_END", en: "Education end" },
  { id: "FINANCIAL_MILESTONE", en: "Financial milestone" },
  { id: "INVESTMENT", en: "Investment" },
  { id: "PROPERTY_PURCHASE", en: "Property purchase" },
  { id: "DEBT", en: "Debt" },
  { id: "FAMILY_LOSS", en: "Family loss" },
  { id: "BIRTH_OF_CHILD", en: "Birth of child" },
  { id: "BUSINESS_START", en: "Business start" },
  { id: "BUSINESS_END", en: "Business end" },
  { id: "SPIRITUAL_EVENT", en: "Spiritual event" },
  { id: "PILGRIMAGE", en: "Pilgrimage" },
  { id: "INITIATION", en: "Initiation" },
  { id: "LEGAL_MATTER", en: "Legal matter" },
  { id: "OTHER", en: "Other" },
];

export const EVENT_ICON: Record<string, LucideIcon> = {
  JOB_CHANGE:          Briefcase,
  PROMOTION:           TrendingUp,
  DEMOTION:            TrendingDown,
  JOB_LOSS:            TrendingDown,
  RELATIONSHIP_START:  Heart,
  RELATIONSHIP_END:    HeartCrack,
  MARRIAGE:            Heart,
  DIVORCE:             Scale,
  REMARRIAGE:          Heart,
  RELOCATION:          Home,
  TRAVEL_ABROAD:       Plane,
  HEALTH_EVENT:        HeartPulse,
  SURGERY:             Scissors,
  RECOVERY:            Dumbbell,
  EXAM_RESULT:         FileText,
  EDUCATION_START:     GraduationCap,
  EDUCATION_END:       GraduationCap,
  FINANCIAL_MILESTONE: Coins,
  INVESTMENT:          TrendingUp,
  PROPERTY_PURCHASE:   Home,
  DEBT:                CreditCard,
  FAMILY_LOSS:         Flame,
  BIRTH_OF_CHILD:      Baby,
  BUSINESS_START:      Rocket,
  BUSINESS_END:        XCircle,
  SPIRITUAL_EVENT:     Star,
  PILGRIMAGE:          MapPin,
  INITIATION:          Bell,
  LEGAL_MATTER:        Scale,
  OTHER:               Pin,
};

export function eventLabel(type: string): string {
  return EVENT_TYPES.find((e) => e.id === type)?.en ?? type;
}

export function PlanEventsPanel({ lang, chartId }: { lang: Lang; chartId: string }) {
  return (
    <Surface title={lang === "ta" ? "வாழ்க்கை நிகழ்வு ஜன்னல்கள்" : "Life Event Windows"}>
      <div className="surface__body">
        <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", color: "var(--color-faint)", lineHeight: 1.5 }}>
          {lang === "ta"
            ? "அடுத்த ஐந்து ஆண்டுகளில் தொழில், திருமணம், படிப்பு, இடமாற்றம் மற்றும் ஆரோக்கியம் தொடர்பான முக்கிய காலகட்டங்கள் — தசை மற்றும் கிரகநகர்வு ஆதரவு சேரும் இடங்களில்."
            : "Key windows for career, marriage, studies, relocation, and health over the next five years — where dasha and transit support converge."}
        </p>
        <DashboardLifeEvents lang={lang} chartId={chartId || null} />
      </div>
    </Surface>
  );
}
