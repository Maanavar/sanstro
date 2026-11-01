"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useHeroIdentity } from "@/hooks/useHeroIdentity";
import { useNotificationInbox } from "@/hooks/useNotificationInbox";
import { useSession } from "@/hooks/useSession";
import { dashboardPath, type Tab } from "@/lib/dashboard-tabs";
import { todayIso } from "@/lib/format";
import type { BiText } from "@/lib/types";
import { handOffDashboardDay } from "@/lib/workspace-handoff";

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
 * navigation system — and fills the hero's identity sub-bar the way the
 * workspace does, so the bar does not empty out when the reader steps here.
 */
export function DashboardAuxiliaryShell({ pageTitle, children }: DashboardAuxiliaryShellProps) {
  const router = useRouter();
  const session = useSession();
  const [lang, setLang] = useLang();
  const inbox = useNotificationInbox({ lang });
  const title = lang === "ta" ? pageTitle.ta : pageTitle.en;
  // Nothing on these pages is day-scoped, so the line shows today's sunrise
  // and the picker hands its choice to Today rather than pretending to
  // change this page.
  const [selectedDate] = useState(todayIso);
  const identity = useHeroIdentity({ userId: session.sessionUserId, date: selectedDate });

  function navigate(tab: Tab) {
    router.push(dashboardPath(tab));
  }

  function openDay(date: string) {
    // Typing a year into the native field fires `change` per digit ("0002",
    // "0020", "0202"); leaving on the first of those would strand the reader
    // on a nonsense day. Wait for a four-digit year.
    if (!date || date.slice(0, 4) < "1900") return;
    handOffDashboardDay(date);
    navigate("personal");
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
        birthDisplayName={identity.displayName}
        status={null}
        chartSummary={identity.chartSummary}
        birthTimeConfidenceMinutes={identity.birthTimeConfidenceMinutes}
        birthTimeLocal={identity.birthTimeLocal}
        selectedVault={identity.selectedVault}
        selectedVaultId={identity.selectedVault?.familyVaultId ?? ""}
        selectedDate={selectedDate}
        panchangamSunrise={identity.panchangamSunrise}
        panchangamPlace={identity.panchangamPlace}
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
        onDateChange={openDay}
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
