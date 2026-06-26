"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

type Tab = "onboarding" | "personal" | "tools" | "transits" | "plan" | "life-areas" | "family" | "calendar" | "journal" | "settings" | "qa";

interface DashboardLeftRailProps {
  lang: Lang;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

// Minimal 20×20 SVG icon paths (stroke icons, 1.5px weight)
function RailIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="cd-rail-item__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function PersonalIcon() {
  return (
    <RailIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </RailIcon>
  );
}

function CalendarIcon() {
  return (
    <RailIcon>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </RailIcon>
  );
}

function FamilyIcon() {
  return (
    <RailIcon>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" />
      <path d="M17.5 13.5c2.5.5 4.5 2.5 4.5 5" />
    </RailIcon>
  );
}

function LifeAreasIcon() {
  return (
    <RailIcon>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </RailIcon>
  );
}

function PlanIcon() {
  return (
    <RailIcon>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </RailIcon>
  );
}

function TransitsIcon() {
  return (
    <RailIcon>
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </RailIcon>
  );
}

function JournalIcon() {
  return (
    <RailIcon>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </RailIcon>
  );
}

function ToolsIcon() {
  return (
    <RailIcon>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z" />
    </RailIcon>
  );
}

function SettingsIcon() {
  return (
    <RailIcon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </RailIcon>
  );
}

type RailItemDef = {
  id: Tab;
  labelEn: string;
  labelTaKey?: Parameters<typeof t>[0];
  icon: React.ReactNode;
};

const RAIL_ITEMS: RailItemDef[] = [
  { id: "personal",   labelEn: "Personal",   labelTaKey: "tab_personal",   icon: <PersonalIcon /> },
  { id: "calendar",   labelEn: "Calendar",   labelTaKey: "tab_calendar",   icon: <CalendarIcon /> },
  { id: "family",     labelEn: "Family",     labelTaKey: "tab_family",     icon: <FamilyIcon /> },
  { id: "life-areas", labelEn: "Life Areas", labelTaKey: "tab_life_areas", icon: <LifeAreasIcon /> },
  { id: "plan",       labelEn: "Plan",       labelTaKey: "tab_plan",       icon: <PlanIcon /> },
  { id: "transits",   labelEn: "Transits",   labelTaKey: "tab_transits",   icon: <TransitsIcon /> },
  { id: "journal",    labelEn: "Journal",    labelTaKey: "tab_journal",    icon: <JournalIcon /> },
  { id: "tools",      labelEn: "Tools",      labelTaKey: "tab_tools",      icon: <ToolsIcon /> },
];

const SHOW_QA_TAB = process.env.NODE_ENV !== "production";

export function DashboardLeftRail({ lang, activeTab, onTabChange }: DashboardLeftRailProps) {
  const [expanded, setExpanded] = useState(false);
  const items = RAIL_ITEMS.filter((item) => SHOW_QA_TAB || item.id !== "qa");

  return (
    <nav className="cd-left-rail" data-expanded={expanded ? "true" : "false"} aria-label="Dashboard navigation">
      <button
        type="button"
        className="cd-rail-item cd-rail-toggle"
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        title={expanded ? "Collapse" : "Expand"}
        onClick={() => setExpanded((v) => !v)}
      >
        <svg className="cd-rail-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {expanded
            ? <><line x1="18" y1="6" x2="6" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="18" y1="18" x2="6" y2="18"/></>
            : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
        </svg>
        {expanded && <span className="cd-rail-item__label cd-rail-item__label--inline">Menu</span>}
      </button>
      {items.map((item, idx) => {
        const isActive = activeTab === item.id;
        const label = lang === "ta" && item.labelTaKey ? t(item.labelTaKey, lang) : item.labelEn;

        // Divider before Tools to signal "specialist" section
        const showDivider = idx > 0 && item.id === "tools";

        return (
          <div key={item.id}>
            {showDivider && <div className="cd-rail-divider" aria-hidden="true" />}
            <button
              type="button"
              className={`cd-rail-item${isActive ? " cd-rail-item--active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onTabChange(item.id)}
              title={label}
            >
              {item.icon}
              {isActive && (
                <motion.span
                  layoutId="cd-rail-active-dot"
                  className="cd-rail-active-bg"
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  style={{ position: "absolute", inset: 0, borderRadius: "inherit", zIndex: -1 }}
                />
              )}
              <span className={`cd-rail-item__label${expanded ? " cd-rail-item__label--inline" : ""}`} aria-hidden="true">{label}</span>
            </button>
          </div>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Settings at bottom */}
      <button
        type="button"
        className={`cd-rail-item${activeTab === "settings" ? " cd-rail-item--active" : ""}`}
        aria-current={activeTab === "settings" ? "page" : undefined}
        onClick={() => onTabChange("settings")}
        title={lang === "ta" ? "அமைவுகள்" : "Settings"}
      >
        <SettingsIcon />
        <span className={`cd-rail-item__label${expanded ? " cd-rail-item__label--inline" : ""}`} aria-hidden="true">
          {lang === "ta" ? "அமைவுகள்" : "Settings"}
        </span>
      </button>
    </nav>
  );
}
