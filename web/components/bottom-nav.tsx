"use client";

import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";

import type { NavTab } from "./sidebar-nav";

const NAV_ITEMS: { id: NavTab; labelKey: string }[] = [
  { id: "personal", labelKey: "tab_today" },
  { id: "explore", labelKey: "tab_explore" },
  { id: "tools", labelKey: "tab_tools" },
  { id: "family", labelKey: "tab_family" },
  { id: "plan", labelKey: "tab_plan" },
  { id: "journal", labelKey: "tab_journal" },
  { id: "settings", labelKey: "tab_settings" },
];

function NavIcon({ tab }: { tab: NavTab }) {
  const base = { width: "14px", height: "14px", display: "block" } as const;

  if (tab === "settings") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={base}>
        <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M19.4 15a7.9 7.9 0 000-6l1.8-1.4-1.9-3.2-2.2.9a8.2 8.2 0 00-5.1-2l-.5-2.3h-3.7l-.5 2.3a8.2 8.2 0 00-5.1 2l-2.2-.9-1.9 3.2L1.9 9a7.9 7.9 0 000 6L.1 16.4l1.9 3.2 2.2-.9a8.2 8.2 0 005.1 2l.5 2.3h3.7l.5-2.3a8.2 8.2 0 005.1-2l2.2.9 1.9-3.2L19.4 15z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tab === "family") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={base}>
        <circle cx="8" cy="8.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3.5 18.5c.6-2.5 2.5-4 4.5-4h.2c2 0 3.9 1.5 4.5 4M12.2 18.5c.5-1.9 1.9-3 3.8-3h.2c1.8 0 3.2 1.1 3.8 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (tab === "plan") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={base}>
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      </svg>
    );
  }

  if (tab === "journal") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={base}>
        <path d="M5 4.5h9.5L19 9v10.5H5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14.5 4.5V9H19M8 12.5h8M8 15.5h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (tab === "explore") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={base}>
        <path d="M12 3.5l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tab === "tools") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={base}>
        <path d="M14.8 4.2a5 5 0 01-6.6 6.6l-4.7 4.7a2 2 0 102.8 2.8l4.7-4.7a5 5 0 006.6-6.6l-2.8 2.8-3.8-3.8z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={base}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 6v6l3.5 2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface BottomNavProps {
  lang: Lang;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ lang, activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" role="tablist" aria-label={t("nav_label", lang)} aria-orientation="horizontal">
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
          <span className="bottom-nav__icon" aria-hidden="true"><NavIcon tab={item.id} /></span>
          {t(item.labelKey as Parameters<typeof t>[0], lang)}
        </button>
      ))}
    </nav>
  );
}
