"use client";

import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { NavTab } from "./sidebar-nav";

const NAV_ITEMS: { id: NavTab; icon: string; labelKey: string }[] = [
  { id: "personal",  icon: "☀",  labelKey: "tab_today" },
  { id: "explore",   icon: "◎",  labelKey: "tab_explore" },
  { id: "tools",     icon: "🔧", labelKey: "tab_tools" },
  { id: "family",    icon: "👪", labelKey: "tab_family" },
  { id: "plan",      icon: "🎯", labelKey: "tab_plan" },
  { id: "journal",   icon: "✏",  labelKey: "tab_journal" },
  { id: "settings",  icon: "⚙️", labelKey: "tab_settings" },
];

interface BottomNavProps {
  lang: Lang;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ lang, activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="bottom-nav"
      role="tablist"
      aria-label={t("nav_label", lang)}
      aria-orientation="horizontal"
    >
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={activeTab === item.id}
          aria-label={t(item.labelKey as Parameters<typeof t>[0], lang)}
          className={`bottom-nav__item${activeTab === item.id ? " bottom-nav__item--active" : ""}`}
          onClick={() => onTabChange(item.id)}
        >
          <span className="bottom-nav__icon" aria-hidden="true">{item.icon}</span>
          {t(item.labelKey as Parameters<typeof t>[0], lang)}
        </button>
      ))}
    </nav>
  );
}
