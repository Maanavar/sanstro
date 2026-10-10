"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { useNotificationInbox } from "@/hooks/useNotificationInbox";
import { useSession } from "@/hooks/useSession";
import { dashboardPath, type Tab } from "@/lib/dashboard-tabs";
import { todayIso } from "@/lib/format";
import type { BiText } from "@/lib/types";

import { DashboardFooter } from "./dashboard-footer";
import { DashboardHero } from "./dashboard-hero";
import { useLang } from "./lang-toggle";

type DashboardAuxiliaryShellProps = {
  pageTitle: BiText;
  children: ReactNode;
};

/**
 * Authenticated chrome for pages that belong to the dashboard but are not
 * workspace tabs (Inbox, Glossary, Reports). It intentionally reuses the real
 * DashboardHero and DashboardFooter so these routes cannot drift into a third
 * navigation system.
 */
export function DashboardAuxiliaryShell({ pageTitle, children }: DashboardAuxiliaryShellProps) {
  const router = useRouter();
  const session = useSession();
  const [lang, setLang] = useLang();
  const inbox = useNotificationInbox({ lang });
  const title = lang === "ta" ? pageTitle.ta : pageTitle.en;

  function navigate(tab: Tab) {
    router.push(dashboardPath(tab));
  }

  function openNotificationSettings() {
    router.push(dashboardPath("settings", { section: "notifications" }));
  }

  return (
    <div className="site cd-shell" data-lang={lang}>
      <div className="cd-print-brand" aria-hidden="true">
        <span className="cd-print-brand__name">Vinaadi AI</span>
        <span className="cd-print-brand__tag">
          {lang === "ta" ? "திருக்கணித ஜோதிடம்" : "Thirukanitham Jothidam"}
        </span>
      </div>

      <DashboardHero
        lang={lang}
        activeTab={null}
        utilityTitle={title}
        birthDisplayName=""
        status={null}
        chartSummary={null}
        selectedVault={null}
        selectedVaultId=""
        selectedDate={todayIso()}
        userEmail={session.userEmail}
        showUserMenu={session.showUserMenu}
        alertCount={0}
        alertItems={[]}
        inboxItems={inbox.items}
        inboxUnreadCount={inbox.unreadCount}
        onMarkAllRead={inbox.markAllRead}
        onMarkOneRead={inbox.markOneRead}
        onOpenNotificationSettings={openNotificationSettings}
        onInboxOpen={inbox.onOpen}
        onTabChange={navigate}
        onDateChange={() => undefined}
        onLangToggle={() => setLang(lang === "ta" ? "en" : "ta")}
        onUserMenuToggle={() => session.setShowUserMenu((open) => !open)}
        onUserMenuClose={() => session.setShowUserMenu(false)}
        onGoToSettings={() => {
          session.setShowUserMenu(false);
          router.push(dashboardPath("settings", { section: "account" }));
        }}
        onSignOut={() => {
          session.setShowUserMenu(false);
          session.signOut();
        }}
      />

      <div className="cd-app-body" data-active-tab="auxiliary">
        <div className="cd-main-content" data-active-tab="auxiliary">
          <div className="cd-main-content__body">{children}</div>
          <DashboardFooter
            lang={lang}
            onOpenNotificationSettings={openNotificationSettings}
          />
        </div>
      </div>
    </div>
  );
}
