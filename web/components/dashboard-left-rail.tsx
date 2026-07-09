"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

type Tab = "onboarding" | "personal" | "tools" | "transits" | "plan" | "life-areas" | "family" | "calendar" | "journal" | "settings" | "qa" | "explore";

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

function TodayIcon() {
  return (
    <RailIcon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </RailIcon>
  );
}

function PanchangamIcon() {
  return (
    <RailIcon>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </RailIcon>
  );
}

function ExploreIcon() {
  return (
    <RailIcon>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </RailIcon>
  );
}

function FamilyIcon() {
  return (
    <RailIcon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </RailIcon>
  );
}

function PlanIcon() {
  return (
    <RailIcon>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </RailIcon>
  );
}

function ToolsIcon() {
  return (
    <RailIcon>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
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
  { id: "personal", labelEn: "Today",      labelTaKey: "tab_personal",   icon: <TodayIcon /> },
  { id: "calendar", labelEn: "Panchangam", labelTaKey: "tab_calendar",   icon: <PanchangamIcon /> },
  { id: "family",   labelEn: "Family & Charts", labelTaKey: "tab_family", icon: <FamilyIcon /> },
  { id: "plan",     labelEn: "Plan",       labelTaKey: "tab_plan",       icon: <PlanIcon /> },
  { id: "tools",    labelEn: "Tools",      labelTaKey: "tab_tools",      icon: <ToolsIcon /> },
  { id: "explore",  labelEn: "Explore",                                   icon: <ExploreIcon /> },
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
        const EXPLORE_DEPTH_TABS: Tab[] = ["transits", "life-areas", "journal", "explore"];
        const isActive =
          item.id === "explore"
            ? EXPLORE_DEPTH_TABS.includes(activeTab)
            : activeTab === item.id;
        const label = lang === "ta" && item.labelTaKey ? t(item.labelTaKey, lang) : item.labelEn;

        const showDivider = false;

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

      {/* Buy Reports link */}
      <Link
        href="/dashboard/reports"
        className="cd-rail-item"
        title={lang === "ta" ? "அறிக்கைகளை வாங்கு" : "Buy Reports"}
        style={{ textDecoration: "none" }}
      >
        <RailIcon>
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </RailIcon>
        <span className={`cd-rail-item__label${expanded ? " cd-rail-item__label--inline" : ""}`} aria-hidden="true">
          {lang === "ta" ? "அறிக்கைகள்" : "Reports"}
        </span>
      </Link>

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
