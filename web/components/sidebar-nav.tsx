"use client";

import Image from "next/image";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type NavTab =
  | "personal"
  | "explore"
  | "tools"
  | "family"
  | "plan"
  | "journal"
  | "settings"
  | "qa";

const NAV_ITEMS: { id: NavTab; icon: string; labelKey: string }[] = [
  { id: "personal",  icon: "☀",  labelKey: "tab_today" },
  { id: "explore",   icon: "◎",  labelKey: "tab_explore" },
  { id: "tools",     icon: "🔧", labelKey: "tab_tools" },
  { id: "family",    icon: "👪", labelKey: "tab_family" },
  { id: "plan",      icon: "🎯", labelKey: "tab_plan" },
  { id: "journal",   icon: "✏",  labelKey: "tab_journal" },
  { id: "settings",  icon: "⚙️", labelKey: "tab_settings" },
];

interface SidebarNavProps {
  lang: Lang;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function SidebarNav({ lang, activeTab, onTabChange }: SidebarNavProps) {
  return (
    <aside className="layout-sidebar" aria-label={t("nav_label", lang)}>
      <nav className="sidebar-nav" role="navigation">
        <div className="sidebar-nav__brand">
          <Image
            src="/brand/vinaadi-wordmark-color-transparent.png"
            alt="Vinaadi"
            width={1764}
            height={619}
            style={{ width: "min(140px, 80%)", height: "auto", display: "block" }}
            priority
          />
        </div>
        <div className="sidebar-nav__items" role="tablist" aria-orientation="vertical">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeTab === item.id}
              className={`sidebar-nav__item${activeTab === item.id ? " sidebar-nav__item--active" : ""}`}
              onClick={() => onTabChange(item.id)}
            >
              <span className="sidebar-nav__icon" aria-hidden="true">{item.icon}</span>
              {t(item.labelKey as Parameters<typeof t>[0], lang)}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
}
